#!/usr/bin/env node
/**
 * Voie manuelle PUB-11-01 — répétition à blanc (« dry-run ») du dépôt de Ligne Posée par Wrangler.
 *
 * Ce script NE DÉPLOIE JAMAIS : il impose `--dry-run`, ne lit aucun jeton et n'ouvre aucune session. Il vérifie
 * le runtime figé, l'artefact et la configuration, affiche l'empreinte du dossier à déposer, lance la version
 * ÉPINGLÉE de Wrangler en simulation, puis imprime la commande réelle que Simon pourrait lancer lui-même après
 * son accord sur l'artefact précis (jamais exécutée ici).
 *
 * Usage, depuis la racine d'une COPIE FIGÉE du commit (git archive) où l'artefact vient d'être assemblé :
 *   node scripts/assemble-site.mjs boutique-setup --environment production
 *   node scripts/wrangler-ligne-posee.mjs
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Version exacte de Wrangler (publiée le 20 octobre 2026) ; node >= 22 exigé par le paquet. */
export const VERSION_WRANGLER = "4.151.3";
/** Intégrité npm de cette version, relevée au moment de l'épinglage (npm view wrangler@4.151.3 dist.integrity). */
export const INTEGRITE_WRANGLER = "sha512-mzPQLmkAhZUV7CdiAhE+hiIAJlS9xPL6vZe1B8oQFuWxFu7nmQnvHAVjcAcabwSGkXFXH9uspzXwHOFrfbQmqQ==";
const WORKER = "ligne-posee";
const CONFIG = "sites/boutique-setup/wrangler.jsonc";
const DIST = "sites/boutique-setup/dist";

const echec = (message) => {
  console.error(`ERREUR : ${message}`);
  process.exit(1);
};

const racine = process.cwd();
const attendu = fs.readFileSync(path.join(racine, ".node-version"), "utf8").trim();
if (process.versions.node !== attendu) echec(`Node ${process.versions.node} lu, ${attendu} exigé par .node-version.`);

for (const chemin of [CONFIG, DIST, path.join(DIST, "404.html"), path.join(DIST, "_headers")]) {
  if (!fs.existsSync(path.join(racine, chemin))) echec(`« ${chemin} » absent : assembler d'abord boutique-setup en production.`);
}

// Configuration : exactement le Worker visé, les deux réglages d'assets, rien d'autre qui change le périmètre.
const config = JSON.parse(fs.readFileSync(path.join(racine, CONFIG), "utf8").replace(/^\s*\/\/.*$/gm, ""));
const interdits = ["main", "routes", "route", "vars", "kv_namespaces", "d1_databases", "r2_buckets", "services", "triggers", "build", "site"];
const presents = interdits.filter((cle) => cle in config);
if (config.name !== WORKER) echec(`name = « ${config.name} », attendu « ${WORKER} ».`);
if (presents.length) echec(`clé(s) interdite(s) dans la configuration : ${presents.join(", ")}.`);
if (config.assets?.directory !== "./dist") echec("assets.directory doit être « ./dist » (relatif au fichier de configuration).");
if (config.assets?.not_found_handling !== "404-page") echec("assets.not_found_handling doit valoir « 404-page ».");
if (config.assets?.html_handling !== "auto-trailing-slash") echec("assets.html_handling doit valoir « auto-trailing-slash ».");
if (config.preview_urls !== false || config.workers_dev !== true) echec("workers_dev doit être true et preview_urls false (relevé du Dashboard).");

// Empreinte agrégée, méthode du dépôt : SHA-256 de « <sha256>  ./<chemin>\n » triés par chemin.
const lister = (dossier, base = "") =>
  fs.readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? lister(path.join(dossier, e.name), `${base}${e.name}/`) : [`${base}${e.name}`]));
const sha = (octets) => crypto.createHash("sha256").update(octets).digest("hex");
const fichiers = lister(path.join(racine, DIST)).map((p) => `./${p}`).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
const inventaire = fichiers.map((f) => `${sha(fs.readFileSync(path.join(racine, DIST, f)))}  ${f}\n`).join("");
const octets = fichiers.reduce((somme, f) => somme + fs.statSync(path.join(racine, DIST, f)).size, 0);
console.log(`Artefact : ${fichiers.length} fichiers, ${octets} octets, SHA-256 agrégé ${sha(Buffer.from(inventaire))}`);
console.log(`404.html : SHA-256 ${sha(fs.readFileSync(path.join(racine, DIST, "404.html")))}`);
console.log(`Wrangler : ${VERSION_WRANGLER} (intégrité npm ${INTEGRITE_WRANGLER})`);

const commandeDeploiement = `npm exec --yes --package=wrangler@${VERSION_WRANGLER} -- wrangler deploy --config ${CONFIG}`;
const lancement = spawnSync(
  "npm",
  ["exec", "--yes", `--package=wrangler@${VERSION_WRANGLER}`, "--", "wrangler", "deploy", "--dry-run", "--config", CONFIG],
  { cwd: racine, stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, WRANGLER_SEND_METRICS: "false", CLOUDFLARE_API_TOKEN: "", CLOUDFLARE_ACCOUNT_ID: "" } }
);
if (lancement.status !== 0) echec(`la répétition à blanc a échoué (code ${lancement.status}).`);
console.log("\nRépétition à blanc terminée : AUCUN dépôt effectué, aucune authentification utilisée.");
console.log("Commande réelle, à ne lancer qu'après l'accord de Simon sur cet artefact précis (non exécutée ici) :");
console.log(`  ${commandeDeploiement}`);

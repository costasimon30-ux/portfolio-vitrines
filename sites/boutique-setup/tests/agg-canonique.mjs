// Empreinte agrégée CANONIQUE : même convention que le projet (SHA-256 de « <sha256>  ./<chemin>\n » triés), mais les fichiers
// TEXTE sont normalisés CRLF -> LF avant hachage. Un dossier assemblé depuis un checkout CRLF (core.autocrlf=true) et un dossier
// assemblé depuis `git archive` (LF) donnent alors la même empreinte canonique. Les fichiers binaires (webp, woff2) ne sont pas touchés.
// Usage : node sites/boutique-setup/tests/agg-canonique.mjs <dossier-dist> [--liste]
// Référence : docs de revue ; outil de vérification seulement (jamais publié : tests/ n'est pas dans publication.json).
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
const racine = path.resolve(process.argv[2] ?? ".");
const TEXTE = new Set([".html", ".css", ".js", ".mjs", ".json", ".svg", ".md", ".txt", ""]);
const lister = (d, b = "") => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? lister(path.join(d, e.name), `${b}${e.name}/`) : [`${b}${e.name}`]));
const sha = (o) => crypto.createHash("sha256").update(o).digest("hex");
const fichiers = lister(racine).map((p) => `./${p}`).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
let octets = 0;
const inventaire = fichiers.map((f) => {
  let b = fs.readFileSync(path.join(racine, f));
  if (TEXTE.has(path.extname(f).toLowerCase())) b = Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
  octets += b.length;
  return `${sha(b)}  ${f}\n`;
}).join("");
console.log(`${fichiers.length} fichiers, ${octets} octets (texte normalisé LF)`);
console.log(sha(Buffer.from(inventaire)));
if (process.argv[3] === "--liste") process.stdout.write(inventaire);

#!/usr/bin/env node
/**
 * Vérifications de l'assembleur de publication — portfolio-vitrines
 *
 * Couvre docs/ARCHITECTURE.md § 5.6 (points 1 à 3 et 6) et les corrections
 * PUB-01 à PUB-10 de docs/CODE-REVIEW-coiffeur-mixte.md.
 *
 *   node scripts/verif-assemblage.mjs
 *
 * Isolation (PUB-01, PUB-02) : tout se passe dans UN répertoire temporaire
 * unique créé par mkdtemp, dont cette suite est seule propriétaire. Le dépôt
 * de travail n'est jamais modifié : ni son manifeste, ni ses sites, ni sa
 * sortie. Aucun nom de fichier temporaire global fixe. Le nettoyage, sur
 * sortie normale comme sur SIGINT/SIGTERM, ne vise que ce répertoire.
 *
 * Propagation des échecs (PUB-03) : chaque préparation, chaque assemblage et
 * chaque assertion est contrôlé ; la moindre erreur rend le code de sortie non
 * nul. Des auto-tests par injection d'échec vérifient que la suite elle-même
 * échoue quand elle le doit.
 *
 * Prérequis (PUB-10) : Node seul. Ni Bash, ni Python, ni shasum, ni utilitaire
 * externe. La version en cours est comparée à .node-version au démarrage.
 */

import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSEMBLEUR = "scripts/assemble-site.mjs";

/* ------------------------------------------------------------------ *
 * Runner minimal : compte, propage, n'avale rien
 * ------------------------------------------------------------------ */

let reussis = 0;
const echecs = [];
const groupes = [];

function groupe(titre) {
  groupes.push(titre);
  console.log(`\n########## ${titre} ##########`);
}

async function test(libelle, fn) {
  try {
    const detail = await fn();
    reussis += 1;
    console.log(`[OK] ${libelle}${detail ? ` — ${detail}` : ""}`);
  } catch (e) {
    echecs.push(libelle);
    console.log(`[FAIL] ${libelle} — ${e && e.message ? e.message : e}`);
  }
}

function affirmer(condition, message) {
  if (!condition) throw new Error(message);
}

/* ------------------------------------------------------------------ *
 * Bac isolé
 * ------------------------------------------------------------------ */

let bac = null;

async function creerBac() {
  const chemin = await fs.mkdtemp(path.join(os.tmpdir(), "verif-publication-"));
  const infos = await fs.stat(chemin);
  if (!infos.isDirectory()) throw new Error(`Bac non créé : ${chemin}`);
  return chemin;
}

async function detruireBac() {
  if (!bac) return;
  const aDetruire = bac;
  bac = null;
  // Garde-fou : ne jamais effacer autre chose qu'un bac de cette suite.
  const nom = path.basename(aDetruire);
  if (!nom.startsWith("verif-publication-") || !aDetruire.startsWith(os.tmpdir())) {
    console.error(`Nettoyage refusé, chemin inattendu : ${aDetruire}`);
    return;
  }
  await fs.rm(aDetruire, { recursive: true, force: true }).catch(() => {});
}

function armerNettoyage() {
  const surSignal = (signal) => {
    detruireBac().finally(() => {
      process.exitCode = 1;
      process.kill(process.pid, signal);
    });
  };
  process.once("exit", () => {
    if (bac) {
      // `exit` est synchrone : on ne peut qu'informer.
      console.error(`Bac non nettoyé (sortie brutale) : ${bac}`);
    }
  });
  for (const s of ["SIGINT", "SIGTERM"]) {
    process.once(s, () => {
      process.removeAllListeners(s);
      surSignal(s);
    });
  }
}

/** Copie du dépôt réduite au nécessaire : l'assembleur y voit sa propre racine. */
async function preparerCopie(nom = "depot") {
  const cible = path.join(bac, nom);
  await fs.mkdir(path.join(cible, "scripts"), { recursive: true });
  // Auto-test (PUB-03) : un assembleur de substitution peut être injecté pour
  // vérifier que la suite échoue réellement quand les assemblages échouent.
  const injecte = process.env.VERIF_ASSEMBLEUR_INJECTE;
  await fs.copyFile(injecte && injecte !== "" ? injecte : path.join(RACINE, ASSEMBLEUR), path.join(cible, ASSEMBLEUR));
  // Une injection peut vouloir déléguer au vrai assembleur pour les premiers
  // appels : il doit alors vivre DANS la copie, sinon il résoudrait la racine
  // du dépôt réel.
  if (injecte && injecte !== "") {
    await fs.copyFile(path.join(RACINE, ASSEMBLEUR), path.join(cible, "scripts/assemble-site.reel.mjs"));
  }
  await fs.copyFile(path.join(RACINE, ".node-version"), path.join(cible, ".node-version"));
  await fs.cp(path.join(RACINE, "shared"), path.join(cible, "shared"), { recursive: true });
  await fs.cp(path.join(RACINE, "sites", "coiffeur-mixte"), path.join(cible, "sites", "coiffeur-mixte"), {
    recursive: true,
  });
  await fs.rm(path.join(cible, "sites", "coiffeur-mixte", "dist"), { recursive: true, force: true });
  // Contrôle de préparation : sans lui, un test pourrait « réussir » à vide.
  for (const attendu of [ASSEMBLEUR, "sites/coiffeur-mixte/publication.json", "shared/design-system/tokens.css"]) {
    await fs.access(path.join(cible, attendu));
  }
  return cible;
}

/** Site fixture minimal, entièrement jetable. */
async function fixtureSite(depot, slug, { kind = "demo", index, extra = {}, manifeste = {} } = {}) {
  const dossier = path.join(depot, "sites", slug);
  await fs.mkdir(dossier, { recursive: true });
  const page = index ?? `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>t</title></head><body><a href="/">accueil</a></body></html>\n`;
  await fs.writeFile(path.join(dossier, "index.html"), page);
  await fs.writeFile(
    path.join(dossier, "404.html"),
    `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>404</title></head><body><a href="/">accueil</a></body></html>\n`
  );
  for (const [nom, contenu] of Object.entries(extra)) {
    const p = path.join(dossier, nom);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, contenu);
  }
  const m = {
    kind,
    pages: ["index.html", "404.html"],
    publicFiles: [],
    sharedFiles: [],
    ...manifeste,
  };
  await fs.writeFile(path.join(dossier, "publication.json"), JSON.stringify(m, null, 2) + "\n");
  return dossier;
}

/** Lance l'assembleur dans une copie ; renvoie code, stdout, stderr. */
async function assembler(depot, slug, args = [], env = {}) {
  try {
    const { stdout, stderr } = await execFileP(process.execPath, [ASSEMBLEUR, slug, ...args], {
      cwd: depot,
      env: { ...process.env, ...env },
    });
    return { code: 0, stdout, stderr };
  } catch (e) {
    return { code: e.code ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? String(e) };
  }
}

/**
 * PUB-03 — Assemblage dont on vérifie la PRODUCTION : la sortie est supprimée
 * avant l'appel, puis son existence et son contenu sont exigés après. Un
 * assembleur qui retournerait 0 sans rien produire ne peut plus être validé
 * par la relecture d'un artefact antérieur.
 */
async function assemblerNeuf(depot, slug, args = ["--environment", "production"], env = {}) {
  const sortie = path.join(depot, "sites", slug, "dist");
  await fs.rm(sortie, { recursive: true, force: true });
  affirmer(!(await existe(sortie)), `sortie non supprimée avant l'assemblage : ${sortie}`);
  const r = await assembler(depot, slug, args, env);
  affirmer(r.code === 0, `assemblage en échec (code ${r.code}) : ${(r.stderr || "").slice(0, 200)}`);
  affirmer(await existe(sortie), "l'assembleur a retourné 0 sans produire de sortie");
  const produits = await fs.readdir(sortie);
  affirmer(produits.length > 0, "sortie créée mais vide");
  return r;
}

/** Assemblage attendu en échec, avec un motif d'erreur précis. */
async function refus(depot, slug, motif, args = ["--environment", "production"]) {
  const r = await assembler(depot, slug, args);
  affirmer(r.code !== 0, `code 0 alors qu'un refus était attendu — sortie : ${r.stdout.trim().slice(0, 160)}`);
  const texte = r.stderr + r.stdout;
  affirmer(
    motif.test(texte),
    `refusé mais pour un autre motif : ${texte.trim().split("\n")[0].slice(0, 200)}`
  );
  return r;
}

async function empreinteDossier(racine) {
  const h = createHash("sha256");
  const fichiers = [];
  const parcourir = async (prefixe) => {
    for (const e of (await fs.readdir(path.join(racine, prefixe), { withFileTypes: true })).sort((a, b) =>
      a.name < b.name ? -1 : 1
    )) {
      const rel = prefixe ? path.join(prefixe, e.name) : e.name;
      if (e.isDirectory()) await parcourir(rel);
      else fichiers.push(rel);
    }
  };
  await parcourir("");
  for (const f of fichiers.sort()) {
    h.update(f.split(path.sep).join("/"));
    h.update(await fs.readFile(path.join(racine, f)));
  }
  return h.digest("hex");
}

async function empreinteFichier(chemin) {
  return createHash("sha256").update(await fs.readFile(chemin)).digest("hex");
}

async function existe(chemin) {
  try {
    await fs.access(chemin);
    return true;
  } catch {
    return false;
  }
}

/* ================================================================== *
 * Suite
 * ================================================================== */

async function principal() {
  const modeAuto = process.argv.includes("--self-test-enfant");
  let argsEnfant = ["--self-test-enfant"];

  /* ---- PUB-10 : prérequis et runtime, AVANT toute écriture ---- */
  const pin = (await fs.readFile(path.join(RACINE, ".node-version"), "utf8")).trim();
  const courant = process.versions.node;
  const alternatifAutorise = process.argv.includes("--runtime-alternatif");
  const conforme = courant === pin;
  console.log(`Runtime         : Node ${courant}`);
  console.log(`.node-version   : ${pin}`);
  if (!conforme) {
    if (!alternatifAutorise) {
      console.error(
        `\nPRÉREQUIS NON SATISFAIT : la suite doit être rejouée sur la version figée (${pin}), ` +
          `or elle s'exécute sous ${courant}.\n` +
          `Activer la version figée (nvm use ${pin} / fnm use ${pin}) puis relancer, ` +
          `ou passer --runtime-alternatif pour un contrôle croisé explicitement non probant.`
      );
      process.exitCode = 1;
      return;
    }
    argsEnfant = ["--self-test-enfant", "--runtime-alternatif"];
    console.log(
      `Conformité      : NON — exécution de contrôle croisé sous ${courant}, ` +
        `elle ne vaut pas rejeu sur la version figée ${pin}.`
    );
  } else {
    console.log(`Conformité      : OUI — rejeu sur la version figée.`);
  }

  bac = await creerBac();
  armerNettoyage();
  console.log(`Bac isolé       : ${bac}`);

  // Empreinte du dépôt de travail AVANT : il ne doit pas bouger d'un octet.
  const manifesteReel = path.join(RACINE, "sites", "coiffeur-mixte", "publication.json");
  const empreinteManifesteAvant = await empreinteFichier(manifesteReel);
  const sitesAvant = (await fs.readdir(path.join(RACINE, "sites"))).sort().join(",");

  // Noms globaux fixes qu'une suite mal isolée écrirait dans le répertoire
  // temporaire partagé : on relève leur présence AVANT (PUB-02).
  const NOMS_TEMPORAIRES_SURVEILLES = [
    "manifeste.bak", "prod.log", "prev.log", "defaut.log", "branche.log",
    "main.log", "bad.log", "slug.log", "miss.log", "esc.log", "col.log",
  ];
  const tempsGlobauxAvant = [];
  for (const nom of NOMS_TEMPORAIRES_SURVEILLES) {
    tempsGlobauxAvant.push([nom, await existe(path.join(os.tmpdir(), nom))]);
  }

  /* ---------------- 1. Modes, politiques, environnement ---------------- */
  groupe("1. Modes, politiques et environnement");
  const depot = await preparerCopie();

  await test("assemblage production : réussite, production effective et non-indexation", async () => {
    const r = await assemblerNeuf(depot, "coiffeur-mixte");
    const html = await fs.readFile(path.join(depot, "sites/coiffeur-mixte/dist/index.html"), "utf8");
    affirmer(/<meta name="robots" content="noindex, follow">/.test(html), "balise robots absente");
    const headers = await fs.readFile(path.join(depot, "sites/coiffeur-mixte/dist/_headers"), "utf8");
    affirmer(/^\/\*\n {2}X-Robots-Tag: noindex, follow$/m.test(headers), "règle globale absente");
    return r.stdout.match(/Fichiers\s+: (\d+)/)[0];
  });

  await test("assemblage preview : non-indexation également", async () => {
    await assemblerNeuf(depot, "coiffeur-mixte", ["--environment", "preview"]);
    const html = await fs.readFile(path.join(depot, "sites/coiffeur-mixte/dist/index.html"), "utf8");
    affirmer(/content="noindex, follow"/.test(html), "balise robots absente");
  });

  await test("chaque page porte exactement une balise robots effective", async () => {
    const m = JSON.parse(await fs.readFile(path.join(depot, "sites/coiffeur-mixte/publication.json"), "utf8"));
    for (const page of m.pages) {
      const html = await fs.readFile(path.join(depot, "sites/coiffeur-mixte/dist", page), "utf8");
      const n = (html.match(/<meta\s+name="robots"/g) || []).length;
      affirmer(n === 1, `${page} : ${n} balise(s)`);
    }
    return `${m.pages.length} pages contrôlées`;
  });

  await test("environnement absent → preview", async () => {
    const r = await assembler(depot, "coiffeur-mixte", [], { PUBLICATION_ENV: "", CF_PAGES: "", CF_PAGES_BRANCH: "" });
    affirmer(r.code === 0, `code ${r.code}`);
    affirmer(/Mode effectif\s+: preview/.test(r.stdout), r.stdout.trim());
  });

  await test("branche ≠ main sous Pages → preview forcé", async () => {
    const r = await assembler(depot, "coiffeur-mixte", [], {
      PUBLICATION_ENV: "production", CF_PAGES: "1", CF_PAGES_BRANCH: "une-branche",
    });
    affirmer(r.code === 0, `code ${r.code}`);
    affirmer(/ramené depuis « production »/.test(r.stdout), r.stdout.trim());
  });

  await test("branche main → production conservée", async () => {
    const r = await assembler(depot, "coiffeur-mixte", [], {
      PUBLICATION_ENV: "production", CF_PAGES: "1", CF_PAGES_BRANCH: "main",
    });
    affirmer(r.code === 0, `code ${r.code}`);
    affirmer(/Mode effectif\s+: production/.test(r.stdout), r.stdout.trim());
  });

  await test("environnement inconnu → échec explicite", async () => {
    const r = await assembler(depot, "coiffeur-mixte", [], { PUBLICATION_ENV: "staging" });
    affirmer(r.code !== 0, "code 0");
    affirmer(/Environnement invalide/.test(r.stderr), r.stderr.slice(0, 160));
  });

  /* ---------------- 1b. Politique portfolio ---------------- */
  groupe("1b. Politique portfolio (fixtures jetables)");
  await fixtureSite(depot, "fixture-portfolio", { kind: "portfolio" });

  await test("portfolio/production : page indexable, 404 exclue, pas de règle globale", async () => {
    const r = await assembler(depot, "fixture-portfolio", ["--environment", "production"]);
    affirmer(r.code === 0, r.stderr.slice(0, 200));
    const d = path.join(depot, "sites/fixture-portfolio/dist");
    affirmer(/content="index, follow"/.test(await fs.readFile(path.join(d, "index.html"), "utf8")), "index non indexable");
    affirmer(/content="noindex, follow"/.test(await fs.readFile(path.join(d, "404.html"), "utf8")), "404 indexable");
    const headers = await fs.readFile(path.join(d, "_headers"), "utf8");
    affirmer(!/^\/\*$/m.test(headers), "règle globale noindex présente à tort");
    affirmer(/pages\.dev\/\*/.test(headers), "règle d'hôte versionnée absente");
    affirmer(/^\/404\.html$/m.test(headers), "exception 404 absente");
  });

  await test("portfolio/preview : non indexable", async () => {
    const r = await assembler(depot, "fixture-portfolio", ["--environment", "preview"]);
    affirmer(r.code === 0, r.stderr.slice(0, 200));
    const html = await fs.readFile(path.join(depot, "sites/fixture-portfolio/dist/index.html"), "utf8");
    affirmer(/content="noindex, follow"/.test(html), "indexable en preview");
  });

  /* ---------------- 2. Déterminisme et isolation ---------------- */
  groupe("2. Déterminisme, entrées invalides, isolation");

  await test("déterminisme : deux assemblages produisent le même artefact", async () => {
    await assemblerNeuf(depot, "coiffeur-mixte");
    const h1 = await empreinteDossier(path.join(depot, "sites/coiffeur-mixte/dist"));
    await assemblerNeuf(depot, "coiffeur-mixte");
    const h2 = await empreinteDossier(path.join(depot, "sites/coiffeur-mixte/dist"));
    affirmer(h1 === h2, `${h1} ≠ ${h2}`);
    return `sha256 ${h1.slice(0, 16)}…`;
  });

  await test("un autre site et sa sortie ne sont jamais nettoyés", async () => {
    const autre = await fixtureSite(depot, "fixture-voisine");
    await fs.mkdir(path.join(autre, "dist"), { recursive: true });
    await fs.writeFile(path.join(autre, "dist", "sentinelle.txt"), "intacte");
    await fs.writeFile(path.join(autre, "sentinelle-source.txt"), "intacte");
    const sentinelleSite = path.join(depot, "sites/coiffeur-mixte", "sentinelle-source.txt");
    await fs.writeFile(sentinelleSite, "intacte");
    await assemblerNeuf(depot, "coiffeur-mixte");
    affirmer(await existe(path.join(autre, "dist", "sentinelle.txt")), "dist voisin nettoyé");
    affirmer(await existe(path.join(autre, "sentinelle-source.txt")), "source voisine supprimée");
    affirmer(await existe(sentinelleSite), "source du site nettoyée");
    await fs.rm(sentinelleSite);
  });

  for (const [slug, motif] of [
    ["slug-inexistant", /introuvable|Site inconnu/i],
    ["../etc", /Slug invalide/],
    ["Coiffeur_Mixte", /Slug invalide/],
    ["", /Slug manquant/],
  ]) {
    await test(`slug refusé : « ${slug} »`, async () => {
      const args = slug === "" ? ["--environment", "production"] : [slug, "--environment", "production"];
      const r = await (slug === ""
        ? execFileP(process.execPath, [ASSEMBLEUR, ...args], { cwd: depot }).then(
            () => ({ code: 0, stdout: "", stderr: "" }),
            (e) => ({ code: e.code ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" })
          )
        : assembler(depot, slug, ["--environment", "production"]));
      affirmer(r.code !== 0, "code 0");
      affirmer(motif.test(r.stderr + r.stdout), (r.stderr + r.stdout).slice(0, 160));
    });
  }

  await test("entrée manquante du manifeste → échec explicite", async () => {
    const d = await preparerCopie("depot-entree-manquante");
    const mp = path.join(d, "sites/coiffeur-mixte/publication.json");
    const m = JSON.parse(await fs.readFile(mp, "utf8"));
    m.publicFiles.push("css/inexistant.css");
    await fs.writeFile(mp, JSON.stringify(m, null, 2));
    await refus(d, "coiffeur-mixte", /introuvable/);
  });

  /* ---------------- PUB-04 ---------------- */
  groupe("PUB-04. Liens symboliques et confinement réel");

  const casSymboliques = [
    ["racine shared/ symbolique", async (d) => {
      const dehors = path.join(bac, "hors-depot-shared");
      await fs.mkdir(path.join(dehors, "design-system"), { recursive: true });
      await fs.writeFile(path.join(dehors, "secret.txt"), "donnee-factice");
      await fs.copyFile(path.join(d, "shared/design-system/fonts.css"), path.join(dehors, "design-system/fonts.css"));
      await fs.copyFile(path.join(d, "shared/design-system/tokens.css"), path.join(dehors, "design-system/tokens.css"));
      await fs.rm(path.join(d, "shared"), { recursive: true, force: true });
      await fs.symlink(dehors, path.join(d, "shared"));
      const mp = path.join(d, "sites/coiffeur-mixte/publication.json");
      const m = JSON.parse(await fs.readFile(mp, "utf8"));
      m.sharedFiles = ["secret.txt"];
      await fs.writeFile(mp, JSON.stringify(m, null, 2));
    }],
    ["manifeste symbolique", async (d) => {
      const ailleurs = path.join(bac, "manifeste-hors-depot.json");
      await fs.copyFile(path.join(d, "sites/coiffeur-mixte/publication.json"), ailleurs);
      await fs.rm(path.join(d, "sites/coiffeur-mixte/publication.json"));
      await fs.symlink(ailleurs, path.join(d, "sites/coiffeur-mixte/publication.json"));
    }],
    ["répertoire intermédiaire symbolique", async (d) => {
      const vrai = path.join(d, "sites/coiffeur-mixte/css");
      const deplace = path.join(bac, `css-deplace-${Math.random().toString(36).slice(2)}`);
      await fs.cp(vrai, deplace, { recursive: true });
      await fs.rm(vrai, { recursive: true, force: true });
      await fs.symlink(deplace, vrai);
    }],
    ["fichier terminal symbolique", async (d) => {
      const cible = path.join(bac, `favicon-${Math.random().toString(36).slice(2)}.svg`);
      await fs.copyFile(path.join(d, "sites/coiffeur-mixte/assets/favicon.svg"), cible);
      await fs.rm(path.join(d, "sites/coiffeur-mixte/assets/favicon.svg"));
      await fs.symlink(cible, path.join(d, "sites/coiffeur-mixte/assets/favicon.svg"));
    }],
    ["chemin de sortie symbolique", async (d) => {
      const ailleurs = path.join(bac, `dist-detourne-${Math.random().toString(36).slice(2)}`);
      await fs.mkdir(ailleurs, { recursive: true });
      await fs.writeFile(path.join(ailleurs, "sentinelle.txt"), "intacte");
      await fs.symlink(ailleurs, path.join(d, "sites/coiffeur-mixte/dist"));
    }],
    ["racine sites/ symbolique", async (d) => {
      const ailleurs = path.join(bac, `sites-deplaces-${Math.random().toString(36).slice(2)}`);
      await fs.cp(path.join(d, "sites"), ailleurs, { recursive: true });
      await fs.rm(path.join(d, "sites"), { recursive: true, force: true });
      await fs.symlink(ailleurs, path.join(d, "sites"));
    }],
  ];

  for (const [nom, preparer] of casSymboliques) {
    await test(`refus : ${nom}`, async () => {
      const d = await preparerCopie(`depot-sym-${nom.replace(/[^a-z]+/gi, "-").toLowerCase()}`);
      await preparer(d);
      await refus(d, "coiffeur-mixte", /lien symbolique refusé|sort de/i);
      const fuite = path.join(d, "sites/coiffeur-mixte/dist/shared/secret.txt");
      affirmer(!(await existe(fuite)), "donnée extérieure publiée malgré le refus");
    });
  }

  await test("sortie symbolique : la cible détournée est préservée", async () => {
    const d = await preparerCopie("depot-sortie-sym-preservee");
    const ailleurs = path.join(bac, "cible-dist-preservee");
    await fs.mkdir(ailleurs, { recursive: true });
    await fs.writeFile(path.join(ailleurs, "sentinelle.txt"), "intacte");
    await fs.symlink(ailleurs, path.join(d, "sites/coiffeur-mixte/dist"));
    await refus(d, "coiffeur-mixte", /lien symbolique/i);
    affirmer(await existe(path.join(ailleurs, "sentinelle.txt")), "cible du lien détruite");
  });

  /* ---------------- PUB-05 ---------------- */
  groupe("PUB-05. Exclusions imposées par le manifeste");

  // Chaque cas prépare UNIQUEMENT ce dont il a besoin. Aucune écriture
  // inconditionnelle : sur un volume insensible à la casse, écrire
  // « PUBLICATION.JSON » écrasait le manifeste et faisait échouer la
  // préparation avant même d'atteindre l'assembleur (PUB-05).
  const casExclusions = [
    ["manifeste déclaré public", "publication.json", /manifeste, configuration ou outillage exclu/, null],
    ["manifeste en majuscules", "PUBLICATION.JSON", /manifeste, configuration ou outillage exclu/, null],
    ["fichier caché déclaré public", ".env", /caché exclu/, "FACTICE=1\n"],
    ["page HTML hors de « pages »", "extra.html", /doivent être déclarées dans « pages »/, "<!doctype html><title>x</title>\n"],
    ["sourcemap déclarée publique", "css/style.css.map", /extension exclue/, "{}\n"],
    ["template déclaré public", "gabarit.njk", /extension exclue/, "x\n"],
    ["archive déclarée publique", "archive.zip", /extension exclue/, "PK\n"],
    ["ancienne sortie déclarée publique", "dist/old.txt", /contenu interne au dépôt/, null],
    ["ancienne sortie en majuscules", "DIST/old.txt", /contenu interne au dépôt/, null],
    ["segment docs/ interne", "docs/review.md", /contenu interne au dépôt/, "interne\n"],
    ["segment « Claude outputs/ » interne", "Claude outputs/internal.txt", /contenu interne au dépôt/, "interne\n"],
  ];

  /**
   * Crée un fichier de fixture en création EXCLUSIVE. Si le chemin existe déjà
   * — cas d'un alias de casse sur volume insensible — on ne l'écrase pas et on
   * le signale, au lieu de détruire silencieusement la cible.
   */
  async function creerFixtureExclusive(chemin, contenu) {
    await fs.mkdir(path.dirname(chemin), { recursive: true });
    try {
      await fs.writeFile(chemin, contenu, { flag: "wx" });
      return "créé";
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      return "déjà présent (alias de casse), non réécrit";
    }
  }

  for (const [nom, entree, motif, contenu] of casExclusions) {
    await test(`refus : ${nom}`, async () => {
      const d = await preparerCopie(`depot-excl-${nom.replace(/[^a-z]+/gi, "-").toLowerCase()}`);
      const site = path.join(d, "sites/coiffeur-mixte");
      const mp = path.join(site, "publication.json");

      // Sortie préexistante et sentinelles : elles doivent survivre au refus.
      await fs.mkdir(path.join(site, "dist"), { recursive: true });
      await fs.writeFile(path.join(site, "dist/old.txt"), "ancien\n");
      await fs.writeFile(path.join(site, "dist/sentinelle.txt"), "intacte");

      let etatFixture = "non requise (le refus est lexical, avant tout accès disque)";
      if (contenu !== null) etatFixture = await creerFixtureExclusive(path.join(site, entree), contenu);

      // Le manifeste est écrit APRÈS la fixture, et sa validité est contrôlée :
      // une préparation abîmée ne peut pas passer pour un refus de l'assembleur.
      const m = JSON.parse(await fs.readFile(mp, "utf8"));
      m.publicFiles = [...m.publicFiles, entree];
      await fs.writeFile(mp, JSON.stringify(m, null, 2) + "\n");

      const relu = JSON.parse(await fs.readFile(mp, "utf8"));
      affirmer(Array.isArray(relu.publicFiles), "préparation invalide : publicFiles n'est pas une liste");
      affirmer(relu.publicFiles.includes(entree), `préparation invalide : « ${entree} » absent du manifeste`);
      affirmer(relu.kind === "demo", "préparation invalide : kind perdu");
      const empreinteManifeste = await empreinteFichier(mp);

      await refus(d, "coiffeur-mixte", motif);

      affirmer(
        (await empreinteFichier(mp)) === empreinteManifeste,
        "le manifeste a été modifié par l'assemblage"
      );
      affirmer(await existe(path.join(site, "dist/old.txt")), "ancienne sortie détruite malgré le refus");
      affirmer(await existe(path.join(site, "dist/sentinelle.txt")), "sentinelle de l'ancienne sortie détruite");
      return `fixture : ${etatFixture}`;
    });
  }

  await test("préparation : un alias de casse n'écrase jamais le manifeste", async () => {
    // Régression permanente du défaut PUB-05 relevé dans daf8281. Sur un volume
    // insensible à la casse, « PUBLICATION.JSON » EST le manifeste ; sur un
    // volume sensible, un lien physique reproduit exactement la propriété
    // signalée par la revue (même inode : écrire l'un modifie l'autre). Le
    // contrôle vaut donc dans les deux environnements.
    const d = await preparerCopie("depot-excl-alias-casse");
    const site = path.join(d, "sites/coiffeur-mixte");
    const mp = path.join(site, "publication.json");
    const alias = path.join(site, "PUBLICATION.JSON");

    let nature;
    if (await existe(alias)) {
      nature = "alias natif (volume insensible à la casse)";
    } else {
      await fs.link(mp, alias);
      nature = "lien physique équivalent (volume sensible à la casse)";
    }
    const avant = await empreinteFichier(mp);

    const etat = await creerFixtureExclusive(alias, "{}\n");
    affirmer(/déjà présent/.test(etat), `la préparation a écrit sur l'alias : ${etat}`);
    affirmer((await empreinteFichier(mp)) === avant, "le manifeste a été écrasé par la préparation");

    const m = JSON.parse(await fs.readFile(mp, "utf8"));
    affirmer(Array.isArray(m.publicFiles), "manifeste corrompu après préparation");
    m.publicFiles = [...m.publicFiles, "PUBLICATION.JSON"];
    await fs.writeFile(mp, JSON.stringify(m, null, 2) + "\n");
    const empreinteAvantBuild = await empreinteFichier(mp);

    await refus(d, "coiffeur-mixte", /manifeste, configuration ou outillage exclu/);
    affirmer((await empreinteFichier(mp)) === empreinteAvantBuild, "manifeste modifié par l'assemblage");
    return nature;
  });

  await test("champ de manifeste inconnu → refus", async () => {
    const d = await preparerCopie("depot-champ-inconnu");
    const mp = path.join(d, "sites/coiffeur-mixte/publication.json");
    const m = JSON.parse(await fs.readFile(mp, "utf8"));
    m.inattendu = true;
    await fs.writeFile(mp, JSON.stringify(m, null, 2));
    await refus(d, "coiffeur-mixte", /champ inconnu/);
  });

  /* ---------------- PUB-06 ---------------- */
  groupe("PUB-06. Collisions refusées avant nettoyage");

  const casCollisions = [
    ["nom réservé traité comme répertoire", ["robots.txt/child.txt"], /fichier réservé, il ne peut pas être un répertoire/],
    ["nom réservé exact", ["robots.txt"], /réservé à l'assembleur/],
    ["variante de casse d'un nom réservé", ["ROBOTS.TXT"], /Collision de casse|réservé/i],
    ["dossier shared/ réservé", ["shared/intrus.css"], /réservé aux dépendances communes/],
    // Contre-exemples de la contre-vérification 8c63d4c : normalisation de casse.
    ["_HEADERS traité comme répertoire", ["_HEADERS/child.txt"], /fichier réservé, il ne peut pas être un répertoire/],
    ["SITEMAP.XML en majuscules", ["SITEMAP.XML"], /réservé à l'assembleur/],
    ["Shared/ avec majuscule", ["Shared/intrus.css"], /réservé aux dépendances communes/],
  ];

  for (const [nom, ajouts, motif] of casCollisions) {
    await test(`refus : ${nom}`, async () => {
      const d = await preparerCopie(`depot-col-${nom.replace(/[^a-z]+/gi, "-").toLowerCase()}`);
      const site = path.join(d, "sites/coiffeur-mixte");
      for (const a of ajouts) {
        const p = path.join(site, a);
        await fs.mkdir(path.dirname(p), { recursive: true });
        await fs.writeFile(p, "contenu\n");
      }
      // Sortie préexistante avec sentinelle : elle doit survivre au refus.
      await fs.mkdir(path.join(site, "dist"), { recursive: true });
      await fs.writeFile(path.join(site, "dist/sentinelle.txt"), "intacte");
      const mp = path.join(site, "publication.json");
      const m = JSON.parse(await fs.readFile(mp, "utf8"));
      m.publicFiles = [...m.publicFiles, ...ajouts];
      await fs.writeFile(mp, JSON.stringify(m, null, 2));
      await refus(d, "coiffeur-mixte", motif);
      affirmer(await existe(path.join(site, "dist/sentinelle.txt")), "ancienne sortie détruite malgré le refus");
    });
  }

  await test("refus : conflit fichier/répertoire entre deux destinations", async () => {
    const d = await preparerCopie("depot-col-fichier-repertoire");
    const site = path.join(d, "sites/coiffeur-mixte");
    await fs.writeFile(path.join(site, "css/style.css.extra"), "x\n");
    await fs.mkdir(path.join(site, "conflit"), { recursive: true });
    await fs.writeFile(path.join(site, "conflit/a.txt"), "a\n");
    await fs.writeFile(path.join(site, "conflit"), "").catch(() => {});
    const mp = path.join(site, "publication.json");
    const m = JSON.parse(await fs.readFile(mp, "utf8"));
    // « css » est déjà un répertoire de destination via css/style.css
    m.publicFiles = [...m.publicFiles, "css"];
    await fs.writeFile(mp, JSON.stringify(m, null, 2));
    await refus(d, "coiffeur-mixte", /n'est pas un fichier régulier|Collision fichier\/répertoire/);
  });

  /* ---------------- PUB-07 ---------------- */
  groupe("PUB-07. Contrôle des références");

  const corpsPage = (corps) =>
    `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>t</title></head><body>${corps}</body></html>\n`;

  const casReferences = [
    ["src sans guillemets vers une ressource absente", corpsPage(`<img src=absent.webp alt="">`), /absente de l'artefact/],
    ["srcset à apostrophes vers une ressource absente", corpsPage(`<img srcset='absent.webp 1x' alt="">`), /absente de l'artefact/],
    ["chemin absolu remontant hors de la sortie", corpsPage(`<img src="/assets/../../publication.json" alt="">`), /sort de l'artefact/],
    ["répertoire pris pour une ressource", corpsPage(`<img src="assets/" alt="">`), /répertoire, une ressource fichier est attendue/],
    ["image chargée depuis un tiers", corpsPage(`<img src="https://example.invalid/absent.webp" alt="">`), /chargée depuis un tiers/],
    ["feuille de style distante", corpsPage(`<link rel="stylesheet" href="https://example.invalid/a.css">`), /chargée depuis un tiers/],
    ["url() de style en ligne vers une ressource absente", corpsPage(`<div style="background:url(absent.png)"></div>`), /absente de l'artefact/],
    ["balise base non prise en charge", corpsPage(`<p>x</p>`).replace("</head>", `<base href="/x/"></head>`), /balise <base>/],
    ["guillemet non fermé", corpsPage(`<img src="absent.webp alt="">`), /mal formée|non terminée|absente de l'artefact/],
    // Contre-exemples de la contre-vérification 8c63d4c.
    ["script local absent", corpsPage(`<script src="absent.js"></script>`), /absente de l'artefact/],
    ["script distant", corpsPage(`<script src="https://example.invalid/a.js"></script>`), /chargée depuis un tiers/],
    ["url() dans un bloc style", corpsPage(`<p>x</p>`).replace("</head>", `<style>body{background:url(absent.png)}</style></head>`), /absente de l'artefact/],
    ["racine « / » comme ressource automatique", corpsPage(`<img src="/" alt="">`), /racine n'est pas une ressource fichier/],
    ["attribut src dupliqué", corpsPage(`<img src="absent-a.webp" src="present.webp" alt="">`), /attribut « src » dupliqué/],
  ];

  for (const [nom, page, motif] of casReferences) {
    await test(`refus : ${nom}`, async () => {
      const d = await preparerCopie(`depot-ref-${nom.replace(/[^a-z]+/gi, "-").toLowerCase().slice(0, 40)}`);
      await fixtureSite(d, "fixture-refs", {
        index: page,
        extra: { "assets/garde.txt": "x\n", "present.webp": "binaire\n" },
        manifeste: { publicFiles: ["assets/garde.txt", "present.webp"] },
      });
      await refus(d, "fixture-refs", motif);
    });
  }

  await test("refus : @import CSS vers une feuille absente", async () => {
    const d = await preparerCopie("depot-ref-import");
    await fixtureSite(d, "fixture-import", {
      index: corpsPage(`<link rel="stylesheet" href="a.css">`),
      extra: { "a.css": `@import "absente.css";\nbody{color:#000}\n` },
      manifeste: { publicFiles: ["a.css"] },
    });
    await refus(d, "fixture-import", /absente de l'artefact/);
  });

  await test("refus : ressource déclarée retirée du manifeste réel (js/main.js)", async () => {
    const d = await preparerCopie("depot-ref-main-js");
    const mp = path.join(d, "sites/coiffeur-mixte/publication.json");
    const m = JSON.parse(await fs.readFile(mp, "utf8"));
    m.publicFiles = m.publicFiles.filter((f) => f !== "js/main.js");
    await fs.writeFile(mp, JSON.stringify(m, null, 2));
    const r = await refus(d, "coiffeur-mixte", /absente de l'artefact/);
    affirmer(/main\.js/.test(r.stderr + r.stdout), "la référence cassée n'est pas nommée");
    return "script référencé mais non publié";
  });

  await test("accepté : apostrophe française dans un attribut valide", async () => {
    const d = await preparerCopie("depot-ref-apostrophe");
    await fixtureSite(d, "fixture-apostrophe", {
      index: corpsPage(`<img src="present.webp" alt="L'atelier d'un artisan"><a href="/">accueil</a>`),
      extra: { "present.webp": "binaire\n" },
      manifeste: { publicFiles: ["present.webp"] },
    });
    const r = await assembler(d, "fixture-apostrophe", ["--environment", "production"]);
    affirmer(r.code === 0, `refusé à tort : ${(r.stderr || "").slice(0, 200)}`);
  });

  await test("accepté : lien de navigation vers la racine", async () => {
    const d = await preparerCopie("depot-ref-racine-nav");
    await fixtureSite(d, "fixture-racine", { index: corpsPage(`<a href="/">accueil</a>`) });
    const r = await assembler(d, "fixture-racine", ["--environment", "production"]);
    affirmer(r.code === 0, `refusé à tort : ${(r.stderr || "").slice(0, 200)}`);
  });

  await test("accepté : lien de navigation distant (crédits)", async () => {
    const d = await preparerCopie("depot-ref-credits");
    await fixtureSite(d, "fixture-credits", {
      index: corpsPage(`<a href="https://www.shopify.com/stock-photos/photos/x">crédit</a><a href="/">accueil</a>`),
    });
    const r = await assembler(d, "fixture-credits", ["--environment", "production"]);
    affirmer(r.code === 0, `refusé à tort : ${r.stderr.slice(0, 200)}`);
  });

  /* ---------------- PUB-08 ---------------- */
  groupe("PUB-08. Balises robots effectives");

  await test("refus : directive spécifique à un robot contredisant la politique", async () => {
    const d = await preparerCopie("depot-robots-googlebot");
    await fixtureSite(d, "fixture-googlebot", {
      kind: "portfolio",
      index: `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name=googlebot content=noindex><title>t</title></head><body><a href="/">a</a></body></html>\n`,
    });
    await refus(d, "fixture-googlebot", /spécifique à « googlebot »/);
  });

  await test("balise robots en commentaire : une seule balise effective produite", async () => {
    const d = await preparerCopie("depot-robots-commentaire");
    await fixtureSite(d, "fixture-commentaire", {
      index: `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><!-- <meta name="robots" content="index, follow"> --><title>t</title></head><body><a href="/">a</a></body></html>\n`,
    });
    const r = await assembler(d, "fixture-commentaire", ["--environment", "production"]);
    affirmer(r.code === 0, `code ${r.code} : ${r.stderr.slice(0, 200)}`);
    const html = await fs.readFile(path.join(d, "sites/fixture-commentaire/dist/index.html"), "utf8");
    const horsCommentaire = html.replace(/<!--[\s\S]*?-->/g, "");
    const n = (horsCommentaire.match(/<meta\s+name="robots"/g) || []).length;
    affirmer(n === 1, `${n} balise(s) effective(s)`);
    affirmer(/<!--[\s\S]*index, follow[\s\S]*-->/.test(html), "le commentaire d'origine a été altéré");
  });

  await test("refus : deux balises robots effectives", async () => {
    const d = await preparerCopie("depot-robots-double");
    await fixtureSite(d, "fixture-double", {
      index: `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="robots" content="index"><meta name="robots" content="noindex"><title>t</title></head><body><a href="/">a</a></body></html>\n`,
    });
    await refus(d, "fixture-double", /balises meta robots effectives/);
  });

  for (const [nom, page, motif] of [
    ["nom de robot encodé en entités",
     `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="goog&#108;ebot" content="noindex"><title>t</title></head><body><a href="/">a</a></body></html>\n`,
     /spécifique à « googlebot »/],
    ["directive encodée en entités",
     `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name=googlebot content="no&#105;ndex"><title>t</title></head><body><a href="/">a</a></body></html>\n`,
     /spécifique à « googlebot »/],
    ["attribut name dupliqué",
     `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name=googlebot name=description content=noindex><title>t</title></head><body><a href="/">a</a></body></html>\n`,
     /attribut « name » dupliqué/],
  ]) {
    await test(`refus : ${nom}`, async () => {
      const d = await preparerCopie(`depot-robots-${nom.replace(/[^a-z]+/gi, "-").toLowerCase()}`);
      await fixtureSite(d, "fixture-entites", { kind: "portfolio", index: page });
      await refus(d, "fixture-entites", motif);
    });
  }

  await test("balise robots dans un <template> : inerte, une vraie balise est ajoutée au head", async () => {
    const d = await preparerCopie("depot-robots-template");
    await fixtureSite(d, "fixture-template", {
      kind: "portfolio",
      index: `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><template><meta name=robots content=index></template><title>t</title></head><body><a href="/">a</a></body></html>\n`,
    });
    const r = await assembler(d, "fixture-template", ["--environment", "production"]);
    affirmer(r.code === 0, `code ${r.code} : ${(r.stderr || "").slice(0, 200)}`);
    const html = await fs.readFile(path.join(d, "sites/fixture-template/dist/index.html"), "utf8");
    const horsTemplate = html.replace(/<template[\s\S]*?<\/template>/gi, "");
    const n = (horsTemplate.match(/<meta\s+name="robots"/g) || []).length;
    affirmer(n === 1, `${n} balise(s) effective(s) hors template`);
    affirmer(/<template>\s*<meta name=robots content=index>/.test(html), "le contenu du template a été réécrit");
    return "template inerte préservé";
  });

  // Les trois variantes du rapport daf8281 : la transformation déplace le
  // template, dont la balise doit rester inerte. Plus deux contrôles positifs
  // sans changement de longueur.
  const TEMPLATE = `<template><meta name=robots content=index></template>`;
  const casTemplates = [
    ["template dans le body, insertion dans le head (décalage vers l'arrière)",
     `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>t</title></head><body>${TEMPLATE}<a href="/">a</a></body></html>\n`],
    ["remplacement qui raccourcit la balise, template après elle",
     `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="robots" content="noindex, nofollow, nosnippet, noarchive">${TEMPLATE}<title>t</title></head><body><a href="/">a</a></body></html>\n`],
    ["remplacement qui allonge la balise, template après elle",
     `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name=robots><template><meta name=robots></template><title>t</title></head><body><a href="/">a</a></body></html>\n`],
    ["contrôle positif : template seul dans le head",
     `<!doctype html><html lang="fr"><head><meta charset="UTF-8">${TEMPLATE}<title>t</title></head><body><a href="/">a</a></body></html>\n`],
    ["contrôle positif : balise déjà identique, sans changement de longueur",
     `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="robots" content="index, follow">${TEMPLATE}<title>t</title></head><body><a href="/">a</a></body></html>\n`],
  ];

  for (const [nom, page] of casTemplates) {
    await test(`template inerte — ${nom}`, async () => {
      const d = await preparerCopie(`depot-tpl-${nom.replace(/[^a-z]+/gi, "-").toLowerCase().slice(0, 40)}`);
      await fixtureSite(d, "fixture-tpl", { kind: "portfolio", index: page });
      const r = await assembler(d, "fixture-tpl", ["--environment", "production"]);
      affirmer(r.code === 0, `refusé à tort (code ${r.code}) : ${(r.stderr || "").split("\n")[0].slice(0, 200)}`);

      const html = await fs.readFile(path.join(d, "sites/fixture-tpl/dist/index.html"), "utf8");
      const templates = html.match(/<template>[\s\S]*?<\/template>/gi) || [];
      affirmer(templates.length === 1, `${templates.length} template(s) dans la sortie`);

      const horsTemplate = html.replace(/<template>[\s\S]*?<\/template>/gi, "");
      const actives = horsTemplate.match(/<meta\s+name="robots"[^>]*>/gi) || [];
      affirmer(actives.length === 1, `${actives.length} balise(s) robots active(s) hors template`);
      affirmer(/content="index, follow"/.test(actives[0]), `politique inattendue : ${actives[0]}`);

      // La balise active doit être dans le <head>, et le template intact.
      const tete = html.slice(html.search(/<head\b/i), html.search(/<\/head\s*>/i));
      affirmer(tete.includes(actives[0]), "la balise active n'est pas dans le <head>");
      const attendu = page.match(/<template>[\s\S]*?<\/template>/i)[0];
      affirmer(templates[0] === attendu, `contenu du template modifié : ${templates[0]}`);
      return "1 balise active, template préservé";
    });
  }

  await test("refus : balise robots hors du <head>", async () => {
    const d = await preparerCopie("depot-robots-hors-head");
    await fixtureSite(d, "fixture-hors-head", {
      index: `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>t</title></head><body><meta name="robots" content="index"><a href="/">a</a></body></html>\n`,
    });
    await refus(d, "fixture-hors-head", /hors du <head>/);
  });

  /* ---------------- PUB-09 ---------------- */
  groupe("PUB-09. Notices et licences textuelles");

  await test("licence .txt : type MIME et exception d'indexation générés", async () => {
    const d = await preparerCopie("depot-licence-txt");
    await fixtureSite(d, "fixture-licence", {
      kind: "portfolio",
      extra: { "LICENSE.txt": "Licence factice\n", "assets/NOTICE.md": "Notice factice\n" },
      manifeste: { publicFiles: ["LICENSE.txt", "assets/NOTICE.md"] },
    });
    const r = await assembler(d, "fixture-licence", ["--environment", "production"]);
    affirmer(r.code === 0, r.stderr.slice(0, 200));
    const headers = await fs.readFile(path.join(d, "sites/fixture-licence/dist/_headers"), "utf8");
    for (const cible of ["/LICENSE.txt", "/assets/NOTICE.md"]) {
      const bloc = new RegExp(
        `^${cible.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\n {2}Content-Type: text/plain; charset=utf-8\\n {2}X-Robots-Tag: noindex, follow$`,
        "m"
      );
      affirmer(bloc.test(headers), `bloc absent ou incomplet pour ${cible} :\n${headers}`);
    }
    return "LICENSE.txt et NOTICE.md traités";
  });

  await test("démo : chaque notice a son bloc exact avec le type MIME", async () => {
    await assemblerNeuf(depot, "coiffeur-mixte");
    const headers = await fs.readFile(path.join(depot, "sites/coiffeur-mixte/dist/_headers"), "utf8");
    for (const cible of ["/assets/photos/NOTICE.md", "/shared/design-system/fonts/NOTICE.md"]) {
      const bloc = new RegExp(`^${cible.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n {2}Content-Type: text/plain; charset=utf-8$`, "m");
      affirmer(bloc.test(headers), `bloc absent pour ${cible}`);
    }
  });

  /* ---------------- 3. Inventaire et empreintes ---------------- */
  groupe("3. Inventaire, empreintes et fichiers générés");

  await test("inventaire conforme au manifeste, sans source interne", async () => {
    await assemblerNeuf(depot, "coiffeur-mixte");
    const site = path.join(depot, "sites/coiffeur-mixte");
    const m = JSON.parse(await fs.readFile(path.join(site, "publication.json"), "utf8"));
    const attendu = new Set([...m.pages, ...m.publicFiles, ...m.sharedFiles.map((s) => `shared/${s}`), "robots.txt", "_headers"]);
    const dist = path.join(site, "dist");
    const reel = new Set();
    const parcourir = async (p) => {
      for (const e of await fs.readdir(path.join(dist, p), { withFileTypes: true })) {
        const rel = p ? `${p}/${e.name}` : e.name;
        if (e.isDirectory()) await parcourir(rel);
        else reel.add(rel);
      }
    };
    await parcourir("");
    const manquants = [...attendu].filter((x) => !reel.has(x));
    const enTrop = [...reel].filter((x) => !attendu.has(x));
    affirmer(!manquants.length && !enTrop.length, `manquants=${manquants} enTrop=${enTrop}`);
    const interdits = [...reel].filter((x) => x.startsWith(".") || x.endsWith("publication.json") || x.startsWith("dist/"));
    affirmer(!interdits.length, `sources internes publiées : ${interdits}`);
    return `${reel.size} fichiers`;
  });

  await test("médias, polices et notices copiés octet pour octet", async () => {
    const site = path.join(depot, "sites/coiffeur-mixte");
    const m = JSON.parse(await fs.readFile(path.join(site, "publication.json"), "utf8"));
    let n = 0;
    for (const rel of m.publicFiles) {
      affirmer(
        (await empreinteFichier(path.join(site, rel))) === (await empreinteFichier(path.join(site, "dist", rel))),
        `divergent : ${rel}`
      );
      n += 1;
    }
    for (const rel of m.sharedFiles) {
      affirmer(
        (await empreinteFichier(path.join(depot, "shared", rel))) ===
          (await empreinteFichier(path.join(site, "dist/shared", rel))),
        `divergent : shared/${rel}`
      );
      n += 1;
    }
    return `${n} fichiers vérifiés`;
  });

  await test("robots.txt exact, sans Disallow, et 404.html présent", async () => {
    const dist = path.join(depot, "sites/coiffeur-mixte/dist");
    const robots = await fs.readFile(path.join(dist, "robots.txt"), "utf8");
    affirmer(robots === "User-agent: *\nAllow: /\n", `contenu inattendu : ${JSON.stringify(robots)}`);
    affirmer(!/Disallow/.test(robots), "Disallow présent");
    affirmer(await existe(path.join(dist, "404.html")), "404.html absent");
  });

  /* ---------------- PUB-03 : auto-tests de la suite ---------------- */
  groupe("PUB-03. Auto-tests : la suite doit échouer quand elle le doit");

  if (!modeAuto) {
    await test("injection d'un assembleur toujours en échec → suite en échec", async () => {
      const d = await preparerCopie("depot-auto-echec");
      await fs.writeFile(path.join(d, ASSEMBLEUR), "process.exit(1);\n");
      const r = await execFileP(process.execPath, [path.join(RACINE, "scripts/verif-assemblage.mjs"), ...argsEnfant], {
        cwd: RACINE,
        env: { ...process.env, VERIF_ASSEMBLEUR_INJECTE: path.join(d, ASSEMBLEUR) },
      }).then(
        () => ({ code: 0 }),
        (e) => ({ code: e.code ?? 1 })
      );
      affirmer(r.code !== 0, "la suite a rendu 0 malgré un assembleur en échec");
      return `code enfant ${r.code}`;
    });

    await test("injection d'un assembleur muet (code 0, aucune sortie) → suite en échec", async () => {
      const d = await preparerCopie("depot-auto-muet");
      await fs.writeFile(path.join(d, ASSEMBLEUR), "process.exit(0);\n");
      const r = await execFileP(process.execPath, [path.join(RACINE, "scripts/verif-assemblage.mjs"), ...argsEnfant], {
        cwd: RACINE,
        env: { ...process.env, VERIF_ASSEMBLEUR_INJECTE: path.join(d, ASSEMBLEUR) },
      }).then(
        () => ({ code: 0 }),
        (e) => ({ code: e.code ?? 1 })
      );
      affirmer(r.code !== 0, "la suite a rendu 0 malgré un assembleur muet");
      return `code enfant ${r.code}`;
    });

    await test("injection « succès muet APRÈS un premier succès » → suite en échec", async () => {
      // Contre-exemple central de PUB-03 : l'assembleur travaille normalement
      // au début, puis retourne 0 sans rien produire. Une suite qui relirait
      // l'artefact précédent conclurait à tort au succès.
      const dossier = path.join(bac, "injection-muet-apres-succes");
      await fs.mkdir(dossier, { recursive: true });
      const compteur = path.join(dossier, "compteur.txt");
      const script = path.join(dossier, "assemble-site.mjs");
      await fs.writeFile(
        script,
        [
          'import fs from "node:fs";',
          'const compteur = process.env.VERIF_COMPTEUR;',
          'const seuil = Number(process.env.VERIF_MUET_APRES || "3");',
          'let n = 0;',
          'try { n = Number(fs.readFileSync(compteur, "utf8")) || 0; } catch {}',
          'n += 1;',
          'fs.writeFileSync(compteur, String(n));',
          '// Au-delà du seuil : code 0, aucune sortie, aucune écriture.',
          'if (n > seuil) process.exit(0);',
          'await import("./assemble-site.reel.mjs");',
          "",
        ].join("\n")
      );
      const r = await execFileP(process.execPath, [path.join(RACINE, "scripts/verif-assemblage.mjs"), ...argsEnfant], {
        cwd: RACINE,
        env: { ...process.env, VERIF_ASSEMBLEUR_INJECTE: script, VERIF_COMPTEUR: compteur, VERIF_MUET_APRES: "3" },
      }).then(
        () => ({ code: 0 }),
        (e) => ({ code: e.code ?? 1 })
      );
      const appels = Number((await fs.readFile(compteur, "utf8")).trim());
      affirmer(appels > 3, `seulement ${appels} appels : le seuil n'a pas été franchi`);
      affirmer(r.code !== 0, `la suite a rendu 0 malgré ${appels - 3} succès muets après succès`);
      return `${appels} appels, ${appels - 3} muets, code enfant ${r.code}`;
    });

    await test("deux exécutions concurrentes n'interfèrent pas", async () => {
      const [a, b] = await Promise.all([
        execFileP(process.execPath, [path.join(RACINE, "scripts/verif-assemblage.mjs"), ...argsEnfant], {
          cwd: RACINE, env: { ...process.env, VERIF_ASSEMBLEUR_INJECTE: "" },
        }).then(() => 0, (e) => e.code ?? 1),
        execFileP(process.execPath, [path.join(RACINE, "scripts/verif-assemblage.mjs"), ...argsEnfant], {
          cwd: RACINE, env: { ...process.env, VERIF_ASSEMBLEUR_INJECTE: "" },
        }).then(() => 0, (e) => e.code ?? 1),
      ]);
      affirmer(a === 0 && b === 0, `codes ${a} et ${b}`);
    });

    await test("interruption : le dépôt de travail reste intact", async () => {
      const { spawn } = await import("node:child_process");
      const enfant = spawn(process.execPath, [path.join(RACINE, "scripts/verif-assemblage.mjs"), ...argsEnfant], {
        cwd: RACINE, stdio: "ignore",
      });
      await new Promise((r) => setTimeout(r, 900));
      enfant.kill("SIGTERM");
      await new Promise((r) => enfant.on("exit", r));
      affirmer(
        (await empreinteFichier(manifesteReel)) === empreinteManifesteAvant,
        "le manifeste du dépôt a changé après interruption"
      );
    });
  }

  /* ---------------- Isolation vis-à-vis du dépôt réel ---------------- */
  groupe("PUB-01/02. Le dépôt de travail n'a pas été touché");

  await test("manifeste réel inchangé", async () => {
    affirmer((await empreinteFichier(manifesteReel)) === empreinteManifesteAvant, "empreinte différente");
    return empreinteManifesteAvant.slice(0, 16) + "…";
  });

  await test("aucun site ajouté ou supprimé dans le dépôt", async () => {
    const apres = (await fs.readdir(path.join(RACINE, "sites"))).sort().join(",");
    affirmer(apres === sitesAvant, `${sitesAvant} → ${apres}`);
    return apres;
  });

  await test("aucun fichier temporaire à nom global fixe créé par la suite", async () => {
    // On compare l'avant et l'après : un résidu d'un autre outil ne doit pas
    // faire échouer ce contrôle, mais la suite ne doit en créer aucun.
    const apparus = [];
    for (const [nom, presentAvant] of tempsGlobauxAvant) {
      if (!presentAvant && (await existe(path.join(os.tmpdir(), nom)))) apparus.push(nom);
    }
    affirmer(apparus.length === 0, `créés dans ${os.tmpdir()} : ${apparus.join(", ")}`);
    return `${tempsGlobauxAvant.length} noms surveillés`;
  });
}

/* ------------------------------------------------------------------ */

principal()
  .catch((e) => {
    echecs.push("erreur inattendue de la suite");
    console.error("\nErreur inattendue :", e);
  })
  .finally(async () => {
    await detruireBac();
    console.log(`\nRéussis : ${reussis}   Échecs : ${echecs.length}`);
    for (const f of echecs) console.log(` - ${f}`);
    if (echecs.length > 0) process.exitCode = 1;
  });

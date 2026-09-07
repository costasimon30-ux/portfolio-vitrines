#!/usr/bin/env node
/**
 * Assembleur de publication — portfolio-vitrines
 *
 * Implémente docs/ARCHITECTURE.md, section 5 (« Publication indépendante —
 * contrat du 7 septembre 2026 »).
 *
 * Produit un artefact autonome dans sites/<slug>/dist/ : les pages du site à
 * la racine de la sortie, ses ressources déclarées, une copie de ses
 * dépendances communes sous shared/, plus robots.txt et _headers.
 *
 * Bibliothèque standard Node uniquement : aucune installation npm, aucun
 * téléchargement, aucun framework, aucun moteur de templates. Le script ne
 * touche ni aux images, ni aux polices, ni aux notices : elles sont copiées
 * octet pour octet.
 *
 *   node scripts/assemble-site.mjs <slug> --environment production
 *   node scripts/assemble-site.mjs <slug> --environment preview
 *   node scripts/assemble-site.mjs <slug>
 *
 * Sans option, le mode est lu dans PUBLICATION_ENV (production | preview) ;
 * en son absence, preview. Sous Cloudflare Pages, si CF_PAGES_BRANCH est
 * absent ou différent de main, le mode est ramené à preview.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Noms réservés à l'assembleur dans la sortie : le manifeste ne peut pas les produire. */
const NOMS_RESERVES = new Set(["robots.txt", "_headers", "sitemap.xml"]);
const DOSSIER_RESERVE = "shared";

/** Notices textuelles servies telles quelles, à typer et désindexer explicitement. */
const EXTENSION_NOTICE = ".md";

class ErreurAssemblage extends Error {}

/* ------------------------------------------------------------------ *
 * Arguments et environnement
 * ------------------------------------------------------------------ */

function lireArguments(argv) {
  const args = argv.slice(2);
  let slug = null;
  let environnement = null;

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--environment") {
      environnement = args[i + 1] ?? null;
      i += 1;
    } else if (a.startsWith("--environment=")) {
      environnement = a.slice("--environment=".length);
    } else if (a.startsWith("--")) {
      throw new ErreurAssemblage(`Option inconnue : ${a}`);
    } else if (slug === null) {
      slug = a;
    } else {
      throw new ErreurAssemblage(`Argument inattendu : ${a}`);
    }
  }

  if (!slug) {
    throw new ErreurAssemblage(
      "Slug manquant. Usage : node scripts/assemble-site.mjs <slug> [--environment production|preview]"
    );
  }
  return { slug, environnementDemande: environnement };
}

/**
 * Mode effectif. Une valeur inconnue échoue, qu'elle vienne de l'option ou de
 * la variable. Sous Pages, une branche autre que main ramène à preview : un
 * build de branche ne peut pas rendre le portfolio indexable par accident.
 */
function resoudreEnvironnement(environnementDemande, env) {
  const valides = new Set(["production", "preview"]);
  let source;
  let demande;

  if (environnementDemande !== null) {
    demande = environnementDemande;
    source = "--environment";
  } else if (env.PUBLICATION_ENV !== undefined && env.PUBLICATION_ENV !== "") {
    demande = env.PUBLICATION_ENV;
    source = "PUBLICATION_ENV";
  } else {
    return { effectif: "preview", demande: "preview", source: "défaut", ramene: false };
  }

  if (!valides.has(demande)) {
    throw new ErreurAssemblage(
      `Environnement invalide (${source}) : « ${demande} ». Valeurs acceptées : production, preview.`
    );
  }

  // Contexte Cloudflare Pages : CF_PAGES marque le build de la plateforme.
  const sousPages = env.CF_PAGES === "1" || env.CF_PAGES_BRANCH !== undefined;
  if (demande === "production" && sousPages && env.CF_PAGES_BRANCH !== "main") {
    return { effectif: "preview", demande, source, ramene: true };
  }
  return { effectif: demande, demande, source, ramene: false };
}

/* ------------------------------------------------------------------ *
 * Validation des chemins
 * ------------------------------------------------------------------ */

function validerSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ErreurAssemblage(
      `Slug invalide : « ${slug} ». Attendu : kebab-case (minuscules, chiffres, tirets).`
    );
  }
  return slug;
}

/** Entrée de manifeste : relative, sans chemin absolu, sans remontée, sans backslash. */
function validerEntreeRelative(valeur, champ) {
  if (typeof valeur !== "string" || valeur.length === 0) {
    throw new ErreurAssemblage(`${champ} : chemin vide ou non textuel.`);
  }
  if (valeur.includes("\\")) {
    throw new ErreurAssemblage(`${champ} : « ${valeur} » — antislash interdit, utiliser « / ».`);
  }
  if (path.posix.isAbsolute(valeur) || /^[A-Za-z]:/.test(valeur)) {
    throw new ErreurAssemblage(`${champ} : « ${valeur} » — chemin absolu interdit.`);
  }
  const segments = valeur.split("/");
  if (segments.some((s) => s === ".." || s === "." || s === "")) {
    throw new ErreurAssemblage(
      `${champ} : « ${valeur} » — segment vide, « . » ou « .. » interdit.`
    );
  }
  return valeur;
}

/** Refuse qu'un segment traversé soit un lien symbolique, jusqu'à la base incluse. */
async function refuserLiensSymboliques(base, relatif, champ) {
  const segments = relatif.split("/");
  let courant = base;
  for (const segment of segments) {
    courant = path.join(courant, segment);
    let infos;
    try {
      infos = await fs.lstat(courant);
    } catch {
      throw new ErreurAssemblage(`${champ} : introuvable — ${path.relative(RACINE, courant)}`);
    }
    if (infos.isSymbolicLink()) {
      throw new ErreurAssemblage(
        `${champ} : lien symbolique refusé — ${path.relative(RACINE, courant)}`
      );
    }
  }
  return courant;
}

/** Confirme qu'un chemin résolu reste sous une racine attendue. */
function exigerSous(racine, cible, champ) {
  const relatif = path.relative(racine, cible);
  if (relatif === "" || relatif.startsWith("..") || path.isAbsolute(relatif)) {
    throw new ErreurAssemblage(`${champ} : « ${cible} » sort de ${racine}.`);
  }
  return cible;
}

/* ------------------------------------------------------------------ *
 * Manifeste
 * ------------------------------------------------------------------ */

function exigerTableauDeChaines(valeur, champ) {
  if (!Array.isArray(valeur)) {
    throw new ErreurAssemblage(`Manifeste : « ${champ} » doit être une liste.`);
  }
  const vus = new Set();
  for (const v of valeur) {
    validerEntreeRelative(v, `Manifeste.${champ}`);
    if (vus.has(v)) {
      throw new ErreurAssemblage(`Manifeste : « ${champ} » contient un doublon — ${v}`);
    }
    vus.add(v);
  }
  return valeur;
}

async function lireManifeste(dossierSite, slug) {
  const chemin = path.join(dossierSite, "publication.json");
  let brut;
  try {
    brut = await fs.readFile(chemin, "utf8");
  } catch {
    throw new ErreurAssemblage(
      `Manifeste introuvable : ${path.relative(RACINE, chemin)}`
    );
  }
  let manifeste;
  try {
    manifeste = JSON.parse(brut);
  } catch (e) {
    throw new ErreurAssemblage(`Manifeste illisible (JSON) : ${e.message}`);
  }

  if (manifeste === null || typeof manifeste !== "object" || Array.isArray(manifeste)) {
    throw new ErreurAssemblage("Manifeste : objet JSON attendu.");
  }
  if (manifeste.kind !== "demo" && manifeste.kind !== "portfolio") {
    throw new ErreurAssemblage(
      `Manifeste : « kind » doit valoir "demo" ou "portfolio" (lu : ${JSON.stringify(manifeste.kind)}).`
    );
  }

  const pages = exigerTableauDeChaines(manifeste.pages, "pages");
  const publicFiles = exigerTableauDeChaines(manifeste.publicFiles, "publicFiles");
  const sharedFiles = exigerTableauDeChaines(manifeste.sharedFiles, "sharedFiles");

  for (const p of pages) {
    if (!p.endsWith(".html")) {
      throw new ErreurAssemblage(`Manifeste : « pages » n'accepte que des .html — ${p}`);
    }
    if (p.includes("/")) {
      throw new ErreurAssemblage(
        `Manifeste : « pages » se limite aux pages à la racine du site — ${p}`
      );
    }
  }
  for (const obligatoire of ["index.html", "404.html"]) {
    if (!pages.includes(obligatoire)) {
      throw new ErreurAssemblage(`Manifeste : « pages » doit contenir ${obligatoire}.`);
    }
  }

  return { chemin, slug, kind: manifeste.kind, pages, publicFiles, sharedFiles };
}

/* ------------------------------------------------------------------ *
 * Politique d'indexation
 * ------------------------------------------------------------------ */

function politiqueIndexation(kind, environnementEffectif) {
  const indexable = kind === "portfolio" && environnementEffectif === "production";
  return {
    indexable,
    metaPages: indexable ? "index, follow" : "noindex, follow",
    meta404: "noindex, follow",
    reglenoindexGlobale: !indexable,
  };
}

/* ------------------------------------------------------------------ *
 * Transformation des HTML
 * ------------------------------------------------------------------ */

const LIENS_PARTAGES = [
  ["../../shared/design-system/fonts.css", "shared/design-system/fonts.css"],
  ["../../shared/design-system/tokens.css", "shared/design-system/tokens.css"],
];

/**
 * Remplace la valeur des deux liens CSS partagés. Seuls ces chemins précis sont
 * réécrits : on ne touche pas globalement aux « ../ » du document.
 */
function reecrireLiensPartages(html) {
  let sortie = html;
  let total = 0;
  for (const [avant, apres] of LIENS_PARTAGES) {
    for (const guillemet of ['"', "'"]) {
      const cible = `${guillemet}${avant}${guillemet}`;
      const remplacement = `${guillemet}${apres}${guillemet}`;
      let index = sortie.indexOf(cible);
      while (index !== -1) {
        sortie = sortie.slice(0, index) + remplacement + sortie.slice(index + cible.length);
        total += 1;
        index = sortie.indexOf(cible, index + remplacement.length);
      }
    }
  }
  return { html: sortie, remplacements: total };
}

/**
 * Pose une balise robots unique dans le <head>, ou remplace la balise standard
 * existante. Une structure ambiguë est refusée pour correction dans les sources.
 */
function appliquerBaliseRobots(html, contenu, etiquette) {
  const balises = [...html.matchAll(/<meta\b[^>]*>/gi)].filter((m) =>
    /name\s*=\s*["']?robots["']?/i.test(m[0])
  );
  const specifiques = [...html.matchAll(/<meta\b[^>]*>/gi)].filter((m) =>
    /name\s*=\s*["'](googlebot|bingbot|slurp|duckduckbot)["']/i.test(m[0])
  );

  if (balises.length > 1) {
    throw new ErreurAssemblage(
      `${etiquette} : ${balises.length} balises meta robots présentes. Structure ambiguë, à corriger dans les sources.`
    );
  }
  if (specifiques.length > 0) {
    throw new ErreurAssemblage(
      `${etiquette} : consigne d'indexation spécifique à un robot (${specifiques[0][0]}). Structure ambiguë, à corriger dans les sources.`
    );
  }

  const nouvelle = `<meta name="robots" content="${contenu}">`;
  if (balises.length === 1) {
    return html.replace(balises[0][0], nouvelle);
  }

  const fermetureHead = html.search(/<\/head\s*>/i);
  if (fermetureHead === -1) {
    throw new ErreurAssemblage(`${etiquette} : aucune balise </head>, impossible d'insérer robots.`);
  }
  return html.slice(0, fermetureHead) + nouvelle + "\n" + html.slice(fermetureHead);
}

/* ------------------------------------------------------------------ *
 * Contrôle final des références locales
 * ------------------------------------------------------------------ */

/** Extrait les références locales d'un document : href, src, srcset et url() CSS. */
function referencesLocales(contenu, estHtml) {
  const refs = [];
  const ajouter = (v) => {
    if (!v) return;
    const valeur = v.trim();
    if (valeur === "" || valeur.startsWith("#")) return;
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(valeur)) return; // http:, mailto:, tel:, data:, //
    refs.push(valeur);
  };

  if (estHtml) {
    for (const m of contenu.matchAll(/\b(?:href|src)\s*=\s*"([^"]*)"/gi)) ajouter(m[1]);
    for (const m of contenu.matchAll(/\b(?:href|src)\s*=\s*'([^']*)'/gi)) ajouter(m[1]);
    for (const m of contenu.matchAll(/\bsrcset\s*=\s*"([^"]*)"/gi)) {
      for (const entree of m[1].split(",")) ajouter(entree.trim().split(/\s+/)[0]);
    }
  }
  for (const m of contenu.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"]*))\s*\)/gi)) {
    ajouter(m[1] ?? m[2] ?? m[3]);
  }
  return refs;
}

async function controlerReferences(sortie) {
  const problemes = [];
  const fichiers = await listerFichiers(sortie);

  for (const relatif of fichiers) {
    const estHtml = relatif.endsWith(".html");
    const estCss = relatif.endsWith(".css");
    if (!estHtml && !estCss) continue;

    const absolu = path.join(sortie, relatif);
    const contenu = await fs.readFile(absolu, "utf8");
    const dossier = path.posix.dirname(relatif.split(path.sep).join("/"));

    for (const ref of referencesLocales(contenu, estHtml)) {
      const sansAncre = ref.split("#")[0].split("?")[0];
      if (sansAncre === "") continue;

      const cibleRelative = sansAncre.startsWith("/")
        ? sansAncre.slice(1)
        : path.posix.normalize(path.posix.join(dossier === "." ? "" : dossier, sansAncre));

      if (cibleRelative.startsWith("..")) {
        problemes.push(`${relatif} → ${ref} : sort de l'artefact`);
        continue;
      }
      const cible = path.join(sortie, cibleRelative);
      try {
        await fs.access(cible);
      } catch {
        problemes.push(`${relatif} → ${ref} : ressource absente de l'artefact`);
      }
    }
  }
  return problemes;
}

/* ------------------------------------------------------------------ *
 * Système de fichiers
 * ------------------------------------------------------------------ */

async function listerFichiers(racine, prefixe = "") {
  const entrees = await fs.readdir(path.join(racine, prefixe), { withFileTypes: true });
  const fichiers = [];
  for (const e of entrees.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const relatif = prefixe ? path.join(prefixe, e.name) : e.name;
    if (e.isDirectory()) fichiers.push(...(await listerFichiers(racine, relatif)));
    else fichiers.push(relatif);
  }
  return fichiers;
}

/**
 * Nettoyage borné : uniquement la sortie calculée, après contrôle qu'aucun
 * segment traversé n'est un lien symbolique. Jamais le dossier source, jamais
 * sites/, jamais la racine.
 */
async function nettoyerSortie(sortie, dossierSite) {
  const attendue = path.join(dossierSite, "dist");
  if (path.resolve(sortie) !== path.resolve(attendue)) {
    throw new ErreurAssemblage(`Sortie inattendue, nettoyage refusé : ${sortie}`);
  }
  exigerSous(path.join(RACINE, "sites"), sortie, "Sortie");
  if (path.resolve(sortie) === path.resolve(dossierSite)) {
    throw new ErreurAssemblage("La sortie ne peut pas être le dossier source.");
  }

  let courant = RACINE;
  for (const segment of path.relative(RACINE, sortie).split(path.sep)) {
    courant = path.join(courant, segment);
    let infos;
    try {
      infos = await fs.lstat(courant);
    } catch {
      return; // le chemin n'existe pas encore : rien à nettoyer
    }
    if (infos.isSymbolicLink()) {
      throw new ErreurAssemblage(
        `Lien symbolique sur le chemin de sortie, nettoyage refusé : ${path.relative(RACINE, courant)}`
      );
    }
  }

  const infos = await fs.lstat(sortie).catch(() => null);
  if (infos && !infos.isDirectory()) {
    throw new ErreurAssemblage(`La sortie existe et n'est pas un dossier : ${sortie}`);
  }
  await fs.rm(sortie, { recursive: true, force: true });
}

async function copierFichier(source, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

/* ------------------------------------------------------------------ *
 * Fichiers générés
 * ------------------------------------------------------------------ */

function construireRobotsTxt() {
  // Explorable pour que la consigne noindex des pages soit lisible par les robots.
  return "User-agent: *\nAllow: /\n";
}

function construireHeaders(politique, notices) {
  const blocs = [];

  if (politique.reglenoindexGlobale) {
    blocs.push("/*\n  X-Robots-Tag: noindex, follow");
  } else {
    // Portfolio indexable : pas de règle globale à contredire ensuite.
    // Les URL techniques versionnées et alias de branche restent hors index.
    blocs.push("https://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex, follow");
    blocs.push("/404.html\n  X-Robots-Tag: noindex, follow");
  }

  for (const notice of notices) {
    const lignes = [`/${notice}`, "  Content-Type: text/plain; charset=utf-8"];
    if (!politique.reglenoindexGlobale) {
      lignes.push("  X-Robots-Tag: noindex, follow");
    }
    blocs.push(lignes.join("\n"));
  }

  return blocs.join("\n\n") + "\n";
}

/* ------------------------------------------------------------------ *
 * Assemblage
 * ------------------------------------------------------------------ */

async function assembler(slug, environnementDemande, env) {
  validerSlug(slug);

  const dossierSites = path.join(RACINE, "sites");
  const dossierSite = path.join(dossierSites, slug);
  exigerSous(dossierSites, dossierSite, "Dossier du site");

  const infosSite = await fs.lstat(dossierSite).catch(() => null);
  if (!infosSite) {
    throw new ErreurAssemblage(`Site inconnu : sites/${slug} n'existe pas.`);
  }
  if (infosSite.isSymbolicLink() || !infosSite.isDirectory()) {
    throw new ErreurAssemblage(`sites/${slug} doit être un dossier réel, sans lien symbolique.`);
  }

  const mode = resoudreEnvironnement(environnementDemande, env);
  const manifeste = await lireManifeste(dossierSite, slug);
  const politique = politiqueIndexation(manifeste.kind, mode.effectif);

  const sortie = path.join(dossierSite, "dist");
  const dossierPartage = path.join(RACINE, "shared");

  // --- 1. Valider TOUTES les entrées et destinations avant toute suppression ---
  const planifies = new Map(); // destination relative -> { source, type }

  const reserver = (destination, source, type) => {
    const premier = destination.split("/")[0];
    if (NOMS_RESERVES.has(destination)) {
      throw new ErreurAssemblage(
        `Collision : « ${destination} » est réservé à l'assembleur (${type}).`
      );
    }
    if (premier === DOSSIER_RESERVE && type !== "sharedFiles") {
      throw new ErreurAssemblage(
        `Collision : « ${destination} » — le dossier « ${DOSSIER_RESERVE}/ » est réservé aux dépendances communes.`
      );
    }
    if (planifies.has(destination)) {
      throw new ErreurAssemblage(
        `Destination dupliquée : « ${destination} » (${planifies.get(destination).type} et ${type}).`
      );
    }
    planifies.set(destination, { source, type });
  };

  for (const [champ, liste, base] of [
    ["pages", manifeste.pages, dossierSite],
    ["publicFiles", manifeste.publicFiles, dossierSite],
  ]) {
    for (const relatif of liste) {
      // La destination est validée d'abord : un nom réservé ou une collision se
      // refuse sur le manifeste lui-même, indépendamment de l'existence du fichier.
      validerEntreeRelative(relatif, `Manifeste.${champ}`);
      reserver(relatif, path.join(base, relatif), champ);
      const source = await refuserLiensSymboliques(base, relatif, `Manifeste.${champ}`);
      exigerSous(base, source, `Manifeste.${champ}`);
      const infos = await fs.lstat(source);
      if (!infos.isFile()) {
        throw new ErreurAssemblage(`Manifeste.${champ} : « ${relatif} » n'est pas un fichier.`);
      }
    }
  }

  for (const relatif of manifeste.sharedFiles) {
    validerEntreeRelative(relatif, "Manifeste.sharedFiles");
    reserver(`${DOSSIER_RESERVE}/${relatif}`, path.join(dossierPartage, relatif), "sharedFiles");
    const source = await refuserLiensSymboliques(dossierPartage, relatif, "Manifeste.sharedFiles");
    exigerSous(dossierPartage, source, "Manifeste.sharedFiles");
    const infos = await fs.lstat(source);
    if (!infos.isFile()) {
      throw new ErreurAssemblage(`Manifeste.sharedFiles : « ${relatif} » n'est pas un fichier.`);
    }
  }

  // --- 2. Nettoyer uniquement la sortie calculée ---
  await nettoyerSortie(sortie, dossierSite);
  await fs.mkdir(sortie, { recursive: true });

  // --- 3. Copier ---
  let remplacementsTotal = 0;
  for (const [destination, { source, type }] of [...planifies].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const cible = path.join(sortie, destination);
    exigerSous(sortie, cible, "Destination");

    if (type === "pages") {
      // --- 4. Transformations bornées, dans les seuls HTML copiés ---
      const brut = await fs.readFile(source, "utf8");
      const { html, remplacements } = reecrireLiensPartages(brut);
      remplacementsTotal += remplacements;
      // --- 5. Indexation ---
      const contenuRobots = destination === "404.html" ? politique.meta404 : politique.metaPages;
      const final = appliquerBaliseRobots(html, contenuRobots, destination);
      await fs.mkdir(path.dirname(cible), { recursive: true });
      await fs.writeFile(cible, final, "utf8");
    } else {
      await copierFichier(source, cible);
    }
  }

  // --- 5 (suite). robots.txt et _headers ---
  const notices = [...planifies.keys()]
    .filter((d) => d.endsWith(EXTENSION_NOTICE))
    .sort();
  await fs.writeFile(path.join(sortie, "robots.txt"), construireRobotsTxt(), "utf8");
  await fs.writeFile(path.join(sortie, "_headers"), construireHeaders(politique, notices), "utf8");

  // --- 6. Contrôles finaux ---
  const problemes = await controlerReferences(sortie);
  if (problemes.length > 0) {
    throw new ErreurAssemblage(
      `Références locales invalides dans l'artefact :\n  - ${problemes.join("\n  - ")}`
    );
  }

  const fichiers = await listerFichiers(sortie);
  let poids = 0;
  for (const f of fichiers) poids += (await fs.stat(path.join(sortie, f))).size;

  return {
    slug,
    kind: manifeste.kind,
    mode,
    politique,
    sortie,
    fichiers,
    poids,
    remplacements: remplacementsTotal,
    notices,
  };
}

/* ------------------------------------------------------------------ *
 * Entrée
 * ------------------------------------------------------------------ */

async function principal() {
  const { slug, environnementDemande } = lireArguments(process.argv);
  const r = await assembler(slug, environnementDemande, process.env);

  const ko = (r.poids / 1024).toFixed(1);
  console.log(`Site            : ${r.slug} (${r.kind})`);
  console.log(
    `Mode effectif   : ${r.mode.effectif}` +
      (r.mode.ramene ? ` (ramené depuis « ${r.mode.demande} » : branche ≠ main)` : "") +
      ` — source : ${r.mode.source}`
  );
  console.log(`Indexation      : ${r.politique.metaPages} (404 : ${r.politique.meta404})`);
  console.log(`Sortie          : ${path.relative(RACINE, r.sortie)}`);
  console.log(`Fichiers        : ${r.fichiers.length}`);
  console.log(`Poids total     : ${ko} Kio`);
  console.log(`Liens réécrits  : ${r.remplacements}`);
}

principal().catch((e) => {
  if (e instanceof ErreurAssemblage) {
    console.error(`Échec de l'assemblage : ${e.message}`);
  } else {
    console.error("Échec de l'assemblage (erreur inattendue) :", e);
  }
  process.exitCode = 1;
});

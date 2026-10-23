#!/usr/bin/env node
/**
 * Assembleur de publication — portfolio-vitrines
 *
 * Implémente docs/ARCHITECTURE.md, section 5 (« Publication indépendante —
 * contrat du 7 septembre 2026 »), corrigé après la revue ciblée du
 * 7 septembre 2026 (docs/CODE-REVIEW-coiffeur-mixte.md, PUB-04 à PUB-09).
 *
 * Produit un artefact autonome dans sites/<slug>/dist/ : les pages du site à
 * la racine de la sortie, ses ressources déclarées, une copie de ses
 * dépendances communes sous shared/, plus robots.txt et _headers.
 *
 * Bibliothèque standard Node uniquement : aucune installation npm, aucun
 * téléchargement, aucun framework, aucun moteur de templates. Photos, polices
 * et notices sont copiées octet pour octet.
 *
 *   node scripts/assemble-site.mjs <slug> --environment production
 *   node scripts/assemble-site.mjs <slug> --environment preview
 *   node scripts/assemble-site.mjs <slug>
 *
 * Sans option, le mode est lu dans PUBLICATION_ENV (production | preview) ;
 * en son absence, preview. Sous Cloudflare Pages, si CF_PAGES_BRANCH est
 * absent ou différent de main, le mode est ramené à preview.
 *
 * Principe de refus explicite : toute syntaxe hors du périmètre pris en
 * charge fait échouer l'assemblage plutôt que d'être ignorée silencieusement.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Noms de fichiers produits par l'assembleur : le manifeste ne peut pas les viser. */
const FICHIERS_GENERES = ["robots.txt", "_headers"];
/** Autres noms réservés à la racine de la sortie, même s'ils ne sont pas générés ici. */
const NOMS_RESERVES = new Set([...FICHIERS_GENERES, "sitemap.xml"]);
const DOSSIER_RESERVE = "shared";

/**
 * PUB-09 — Convention documentée des notices et licences publiques.
 * Un fichier texte est traité comme notice si son nom de base, sans extension,
 * est l'un de ceux-ci, et son extension l'une des extensions textuelles
 * admises. La fonction ne se déduit donc plus du seul suffixe « .md ».
 */
const BASES_NOTICE = new Set(["notice", "license", "licence", "copying", "credits"]);
const EXTENSIONS_NOTICE = new Set([".md", ".txt", ""]);

/**
 * PUB-11 — Règles Content-Type explicites dans `_headers`, OPT-IN par site.
 *
 * Incident du 18 octobre 2026 : sur deux dépôts manuels (portfolio, Ligne
 * Posée), le tableau de bord Cloudflare a enregistré les fichiers nouveaux ou
 * modifiés avec `Content-Type: application/octet-stream` — les navigateurs
 * téléchargeaient les pages au lieu de les afficher, alors que les octets
 * étaient exacts. Workers Static Assets permet à `_headers` de remplacer les
 * en-têtes par défaut ; ce mécanisme porte déjà le type des notices.
 *
 * Contraintes de la documentation Cloudflare (Workers — en-têtes des assets) :
 *   - plusieurs règles qui matchent un même chemin se CUMULENT, et un en-tête
 *     répété voit ses valeurs jointes par une virgule : chaque chemin servi doit
 *     donc correspondre à UNE SEULE règle Content-Type. Aucune règle
 *     « Content-Type » sur `/*` : elle écraserait ou doublerait le type des CSS,
 *     images et scripts ;
 *   - un seul « * » par motif ; 100 règles au plus ; 2 000 caractères par ligne.
 *
 * Activation : champ `contentTypeRules: true` du manifeste du site. Sans lui,
 * le `_headers` est identique octet pour octet à celui d'avant PUB-11.
 */
const TYPES_MIME = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
});
const TYPE_TEXTE = "text/plain; charset=utf-8";
const LIMITE_REGLES_HEADERS = 100;
const LIMITE_LIGNE_HEADERS = 2000;

/** PUB-05 — Exclusions imposées par le contrat, quelles que soient les listes. */
const EXTENSIONS_INTERDITES = new Set([
  ".map", ".zip", ".tar", ".gz", ".tgz", ".7z", ".rar", ".bz2",
  ".njk", ".liquid", ".hbs", ".handlebars", ".ejs", ".pug", ".mustache",
]);
const NOMS_INTERDITS = new Set(["publication.json", ".node-version", "package.json", "package-lock.json"]);
/** Segments internes au dépôt, jamais publiables (comparés en minuscules). */
const SEGMENTS_INTERNES = new Set(["dist", "docs", "claude outputs", "node_modules", ".git", "scripts"]);

/** PUB-07 — Attributs qui déclenchent un chargement automatique par le navigateur. */
const ATTRIBUTS_AUTOMATIQUES = {
  link: ["href"],
  script: ["src"],
  img: ["src", "srcset"],
  source: ["src", "srcset"],
  video: ["src", "poster"],
  audio: ["src"],
  track: ["src"],
  iframe: ["src"],
  embed: ["src"],
  object: ["data"],
  input: ["src"],
};
/** Attributs de navigation : une cible distante y est légitime (liens de crédits). */
const ATTRIBUTS_NAVIGATION = { a: ["href"], area: ["href"], form: ["action"] };

class ErreurAssemblage extends Error {}

/* ================================================================== *
 * Arguments et environnement
 * ================================================================== */

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
  const sousPages = env.CF_PAGES === "1" || env.CF_PAGES_BRANCH !== undefined;
  if (demande === "production" && sousPages && env.CF_PAGES_BRANCH !== "main") {
    return { effectif: "preview", demande, source, ramene: true };
  }
  return { effectif: demande, demande, source, ramene: false };
}

/* ================================================================== *
 * Chemins : confinement réel et refus des liens symboliques (PUB-04)
 * ================================================================== */

function validerSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ErreurAssemblage(
      `Slug invalide : « ${slug} ». Attendu : kebab-case (minuscules, chiffres, tirets).`
    );
  }
  return slug;
}

function validerEntreeRelative(valeur, champ) {
  if (typeof valeur !== "string" || valeur.length === 0) {
    throw new ErreurAssemblage(`${champ} : chemin vide ou non textuel.`);
  }
  if (valeur.includes("\\")) {
    throw new ErreurAssemblage(`${champ} : « ${valeur} » — antislash interdit, utiliser « / ».`);
  }
  if (valeur.includes("\0")) {
    throw new ErreurAssemblage(`${champ} : « ${valeur} » — octet nul interdit.`);
  }
  if (path.posix.isAbsolute(valeur) || /^[A-Za-z]:/.test(valeur)) {
    throw new ErreurAssemblage(`${champ} : « ${valeur} » — chemin absolu interdit.`);
  }
  const segments = valeur.split("/");
  if (segments.some((s) => s === ".." || s === "." || s === "")) {
    throw new ErreurAssemblage(`${champ} : « ${valeur} » — segment vide, « . » ou « .. » interdit.`);
  }
  return valeur;
}

/**
 * PUB-04 — Contrôle CHAQUE segment depuis la racine du dépôt, racines d'entrée
 * comprises. La version précédente commençait au premier enfant de la base :
 * une racine `shared/` symbolique passait donc inaperçue. Le confinement est
 * ensuite reconfirmé sur le chemin réel, un contrôle lexical ne voyant pas la
 * cible d'un lien.
 */
async function chaineSansLienSymbolique(cheminAbsolu, champ, { doitExister = true } = {}) {
  const relatif = path.relative(RACINE, cheminAbsolu);
  if (relatif === "" || relatif.startsWith("..") || path.isAbsolute(relatif)) {
    throw new ErreurAssemblage(`${champ} : « ${cheminAbsolu} » sort de la racine du dépôt.`);
  }
  let courant = RACINE;
  for (const segment of relatif.split(path.sep)) {
    courant = path.join(courant, segment);
    let infos;
    try {
      infos = await fs.lstat(courant);
    } catch {
      if (doitExister) {
        throw new ErreurAssemblage(`${champ} : introuvable — ${path.relative(RACINE, courant)}`);
      }
      return null; // chemin pas encore créé : rien de symbolique à traverser
    }
    if (infos.isSymbolicLink()) {
      throw new ErreurAssemblage(
        `${champ} : lien symbolique refusé — ${path.relative(RACINE, courant)}`
      );
    }
  }
  return courant;
}

/** Confinement du chemin RÉEL (après résolution) sous une base attendue. */
async function exigerConfinementReel(base, cible, champ) {
  const [baseReelle, cibleReelle] = await Promise.all([fs.realpath(base), fs.realpath(cible)]);
  const relatif = path.relative(baseReelle, cibleReelle);
  if (relatif === "" || relatif.startsWith("..") || path.isAbsolute(relatif)) {
    throw new ErreurAssemblage(`${champ} : « ${path.relative(RACINE, cible)} » sort de ${path.relative(RACINE, base) || "."}.`);
  }
  return cibleReelle;
}

/* ================================================================== *
 * Manifeste : lecture, typage, exclusions (PUB-05)
 * ================================================================== */

function estNotice(relatif) {
  const base = path.posix.basename(relatif);
  const ext = path.posix.extname(base).toLowerCase();
  const racine = (ext ? base.slice(0, -ext.length) : base).toLowerCase();
  return EXTENSIONS_NOTICE.has(ext) && BASES_NOTICE.has(racine);
}

/**
 * PUB-05 — Exclusions du contrat, appliquées avant tout nettoyage.
 * La comparaison est faite sur une forme NORMALISÉE en minuscules : sur un
 * volume insensible à la casse, `PUBLICATION.JSON` et `DIST/` désignent les
 * mêmes fichiers que leurs variantes minuscules et doivent être refusés de la
 * même façon.
 */
function refuserExclusions(relatif, champ) {
  const segments = relatif.split("/");
  const segmentsBas = segments.map((s) => s.toLowerCase());

  if (segments.some((s) => s.startsWith("."))) {
    throw new ErreurAssemblage(`${champ} : « ${relatif} » — chemin ou fichier caché exclu par le contrat.`);
  }
  const interne = segmentsBas.find((s) => SEGMENTS_INTERNES.has(s));
  if (interne !== undefined) {
    throw new ErreurAssemblage(
      `${champ} : « ${relatif} » — le segment « ${interne} » désigne un contenu interne au dépôt ` +
        `(sortie générée, documentation ou outillage), exclu de toute publication.`
    );
  }
  const base = path.posix.basename(relatif).toLowerCase();
  if (NOMS_INTERDITS.has(base)) {
    throw new ErreurAssemblage(`${champ} : « ${relatif} » — manifeste, configuration ou outillage exclu.`);
  }
  const ext = path.posix.extname(base).toLowerCase();
  if (EXTENSIONS_INTERDITES.has(ext)) {
    throw new ErreurAssemblage(
      `${champ} : « ${relatif} » — extension exclue par le contrat (archive, sourcemap ou template).`
    );
  }
  if ((ext === ".html" || ext === ".htm") && champ !== "Manifeste.pages") {
    throw new ErreurAssemblage(
      `${champ} : « ${relatif} » — les pages HTML doivent être déclarées dans « pages », ` +
        `qui seul applique la réécriture des liens et la balise robots.`
    );
  }
  return relatif;
}

function exigerTableauDeChaines(valeur, champ) {
  if (!Array.isArray(valeur)) {
    throw new ErreurAssemblage(`Manifeste : « ${champ} » doit être une liste.`);
  }
  const vus = new Set();
  for (const v of valeur) {
    validerEntreeRelative(v, `Manifeste.${champ}`);
    if (vus.has(v)) throw new ErreurAssemblage(`Manifeste : « ${champ} » contient un doublon — ${v}`);
    vus.add(v);
  }
  return valeur;
}

async function lireManifeste(dossierSite, slug) {
  const chemin = path.join(dossierSite, "publication.json");
  // PUB-04 — le manifeste lui-même est contrôlé avant lecture.
  await chaineSansLienSymbolique(chemin, "Manifeste");
  const infos = await fs.lstat(chemin);
  if (!infos.isFile()) throw new ErreurAssemblage(`Manifeste : ${path.relative(RACINE, chemin)} n'est pas un fichier.`);

  let manifeste;
  try {
    manifeste = JSON.parse(await fs.readFile(chemin, "utf8"));
  } catch (e) {
    throw new ErreurAssemblage(`Manifeste illisible (JSON) : ${e.message}`);
  }
  if (manifeste === null || typeof manifeste !== "object" || Array.isArray(manifeste)) {
    throw new ErreurAssemblage("Manifeste : objet JSON attendu.");
  }
  const champsConnus = new Set(["kind", "pages", "publicFiles", "sharedFiles", "contentTypeRules"]);
  for (const cle of Object.keys(manifeste)) {
    if (!champsConnus.has(cle)) {
      throw new ErreurAssemblage(`Manifeste : champ inconnu « ${cle} ». Champs admis : ${[...champsConnus].join(", ")}.`);
    }
  }
  if (manifeste.kind !== "demo" && manifeste.kind !== "portfolio") {
    throw new ErreurAssemblage(
      `Manifeste : « kind » doit valoir "demo" ou "portfolio" (lu : ${JSON.stringify(manifeste.kind)}).`
    );
  }

  if (manifeste.contentTypeRules !== undefined && typeof manifeste.contentTypeRules !== "boolean") {
    throw new ErreurAssemblage(
      `Manifeste : « contentTypeRules » doit être un booléen (lu : ${JSON.stringify(manifeste.contentTypeRules)}).`
    );
  }

  const pages = exigerTableauDeChaines(manifeste.pages, "pages");
  const publicFiles = exigerTableauDeChaines(manifeste.publicFiles, "publicFiles");
  const sharedFiles = exigerTableauDeChaines(manifeste.sharedFiles, "sharedFiles");

  for (const p of pages) {
    if (!p.endsWith(".html")) throw new ErreurAssemblage(`Manifeste : « pages » n'accepte que des .html — ${p}`);
    if (p.includes("/")) {
      throw new ErreurAssemblage(`Manifeste : « pages » se limite aux pages à la racine du site — ${p}`);
    }
  }
  for (const obligatoire of ["index.html", "404.html"]) {
    if (!pages.includes(obligatoire)) {
      throw new ErreurAssemblage(`Manifeste : « pages » doit contenir ${obligatoire}.`);
    }
  }
  return { chemin, slug, kind: manifeste.kind, pages, publicFiles, sharedFiles, contentTypeRules: manifeste.contentTypeRules === true };
}

/* ================================================================== *
 * Politique d'indexation
 * ================================================================== */

function politiqueIndexation(kind, environnementEffectif) {
  const indexable = kind === "portfolio" && environnementEffectif === "production";
  return {
    indexable,
    metaPages: indexable ? "index, follow" : "noindex, follow",
    meta404: "noindex, follow",
    reglenoindexGlobale: !indexable,
  };
}

/* ================================================================== *
 * Analyse HTML minimale (PUB-07, PUB-08)
 * ================================================================== */

/** Références de caractères HTML (PUB-08) : décodées avant toute décision. */
const ENTITES_NOMMEES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'",
};
function decoderEntites(valeur) {
  return String(valeur).replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (tout, corps) => {
    const bas = corps.toLowerCase();
    if (bas.startsWith("#x")) {
      const n = parseInt(bas.slice(2), 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : tout;
    }
    if (bas.startsWith("#")) {
      const n = parseInt(bas.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : tout;
    }
    return Object.prototype.hasOwnProperty.call(ENTITES_NOMMEES, bas) ? ENTITES_NOMMEES[bas] : tout;
  });
}

const CORPS_BALISE = `(?:[^>"']|"[^"]*"|'[^']*')*`;

/**
 * Prépare l'analyse d'un document, en préservant les offsets :
 *  - les commentaires sont masqués en entier ;
 *  - seul le CONTENU des <script> et <style> est masqué, leurs balises restent
 *    analysables — sinon leurs attributs, dont `src`, échappent au contrôle
 *    (PUB-07) ;
 *  - le CSS des blocs <style> est extrait pour être analysé séparément ;
 *  - le contenu des <template> est repéré comme inerte : il n'est pas actif
 *    tant qu'il n'est pas instancié, et ne peut donc pas porter la balise
 *    robots effective (PUB-08).
 */
function analyserDocument(html) {
  let masque = html.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));

  const cssEnLigne = [];
  const masquerContenu = (nom, collecter) => {
    const re = new RegExp(`(<\\s*${nom}\\b${CORPS_BALISE}>)([\\s\\S]*?)(<\\s*/\\s*${nom}\\s*>)`, "gi");
    masque = masque.replace(re, (tout, ouvrante, contenu, fermante, index) => {
      if (collecter) cssEnLigne.push(html.slice(index + ouvrante.length, index + ouvrante.length + contenu.length));
      return ouvrante + contenu.replace(/[^\n]/g, " ") + fermante;
    });
  };
  masquerContenu("script", false);
  masquerContenu("style", true);

  const zonesInertes = [];
  const reTemplate = new RegExp(`<\\s*template\\b${CORPS_BALISE}>`, "gi");
  let t;
  while ((t = reTemplate.exec(masque)) !== null) {
    const debutContenu = reTemplate.lastIndex;
    const relatif = masque.slice(debutContenu).search(/<\s*\/\s*template\s*>/i);
    zonesInertes.push([debutContenu, relatif === -1 ? masque.length : debutContenu + relatif]);
  }

  return { masque, cssEnLigne, zonesInertes };
}

function estInerte(index, zonesInertes) {
  return zonesInertes.some(([a, b]) => index >= a && index < b);
}

/**
 * Analyse les attributs d'une balise en suivant le délimiteur réel de chaque
 * valeur. Formes admises : "v", 'v', v sans espace. Un attribut dupliqué est
 * refusé plutôt que résolu silencieusement en faveur du dernier (PUB-07/08).
 */
function analyserAttributs(texteBalise, etiquette) {
  const attributs = new Map();
  const ouverture = texteBalise.match(/^<\s*[a-zA-Z][\w:-]*/);
  let i = ouverture ? ouverture[0].length : 1;
  const fin = texteBalise.length - 1; // position du « > » final

  while (i < fin) {
    const c = texteBalise[i];
    if (/\s/.test(c) || c === "/") {
      i += 1;
      continue;
    }
    const nomBrut = /^[^\s=/>]+/.exec(texteBalise.slice(i, fin));
    if (!nomBrut) {
      i += 1;
      continue;
    }
    const nom = decoderEntites(nomBrut[0]).toLowerCase();
    i += nomBrut[0].length;
    while (i < fin && /\s/.test(texteBalise[i])) i += 1;

    let valeur = "";
    if (texteBalise[i] === "=") {
      i += 1;
      while (i < fin && /\s/.test(texteBalise[i])) i += 1;
      const delimiteur = texteBalise[i];
      if (delimiteur === '"' || delimiteur === "'") {
        const ferme = texteBalise.indexOf(delimiteur, i + 1);
        if (ferme === -1 || ferme > fin) {
          throw new ErreurAssemblage(
            `${etiquette} : valeur d'attribut non terminée dans « ${texteBalise.slice(0, 80)} ».`
          );
        }
        valeur = texteBalise.slice(i + 1, ferme);
        i = ferme + 1;
      } else {
        const brute = /^[^\s>]*/.exec(texteBalise.slice(i, fin));
        valeur = brute ? brute[0] : "";
        i += valeur.length;
      }
    }
    if (attributs.has(nom)) {
      throw new ErreurAssemblage(
        `${etiquette} : attribut « ${nom} » dupliqué — structure ambiguë, à corriger dans les sources.`
      );
    }
    attributs.set(nom, decoderEntites(valeur));
  }
  return attributs;
}

/**
 * Balises du document. Toute ouverture `<nom` qui ne produit pas une balise
 * analysable fait échouer l'assemblage : une syntaxe non prise en charge doit
 * être refusée explicitement, jamais ignorée (PUB-07).
 */
function balises(htmlMasque, etiquette) {
  const re = new RegExp(`<\\s*([a-zA-Z][\\w:-]*)(${CORPS_BALISE})>`, "g");
  const trouvees = [];
  const debuts = new Set();
  let m;
  while ((m = re.exec(htmlMasque)) !== null) {
    trouvees.push({ nom: m[1].toLowerCase(), texte: m[0], index: m.index, fin: re.lastIndex });
    debuts.add(m.index);
  }
  for (const o of htmlMasque.matchAll(/<\s*[a-zA-Z]/g)) {
    if (!debuts.has(o.index)) {
      const extrait = htmlMasque.slice(o.index, o.index + 80).replace(/\s+/g, " ");
      throw new ErreurAssemblage(
        `${etiquette} : balise mal formée ou syntaxe non prise en charge (guillemet non fermé ?) — « ${extrait} »`
      );
    }
  }
  return trouvees;
}

function bornesHead(htmlMasque) {
  const debut = htmlMasque.search(/<\s*head\b[^>]*>/i);
  const fin = htmlMasque.search(/<\s*\/\s*head\s*>/i);
  return { debut, fin };
}

/* ================================================================== *
 * Transformation des pages
 * ================================================================== */

const LIENS_PARTAGES = [
  ["../../shared/design-system/fonts.css", "shared/design-system/fonts.css"],
  ["../../shared/design-system/tokens.css", "shared/design-system/tokens.css"],
];

function reecrireLiensPartages(html) {
  let sortie = html;
  let total = 0;
  for (const [avant, apres] of LIENS_PARTAGES) {
    for (const guillemet of ['"', "'"]) {
      const cible = `${guillemet}${avant}${guillemet}`;
      const remplacement = `${guillemet}${apres}${guillemet}`;
      let i = sortie.indexOf(cible);
      while (i !== -1) {
        sortie = sortie.slice(0, i) + remplacement + sortie.slice(i + cible.length);
        total += 1;
        i = sortie.indexOf(cible, i + remplacement.length);
      }
    }
  }
  return { html: sortie, remplacements: total };
}

/**
 * PUB-08 — Pose une balise robots unique et EFFECTIVE dans le <head>.
 * Les commentaires, scripts et styles sont ignorés ; les directives spécifiques
 * à un robot font échouer explicitement ; le résultat est revérifié après
 * transformation.
 */
function appliquerBaliseRobots(html, contenu, etiquette) {
  const doc = analyserDocument(html);
  const { debut, fin } = bornesHead(doc.masque);
  if (debut === -1 || fin === -1 || fin < debut) {
    throw new ErreurAssemblage(`${etiquette} : <head> absent ou mal formé, structure non prise en charge.`);
  }
  if (/<\s*base\b/i.test(doc.masque)) {
    throw new ErreurAssemblage(
      `${etiquette} : balise <base> présente — elle change la résolution des URL, cas non pris en charge.`
    );
  }

  // Les métas d'un <template> sont inertes : elles ne comptent pas et ne
  // doivent pas être réécrites (PUB-08).
  //
  // L'extraction prend le document ANALYSÉ en paramètre, masque et zones
  // inertes compris. Une version antérieure fermait sur les zones du document
  // d'origine : après une transformation qui change la longueur du HTML, les
  // indices venaient du nouveau masque et les intervalles d'inertie de
  // l'ancien, et une balise de template était comptée comme active.
  const metasActives = (docAnalyse, source) =>
    balises(docAnalyse.masque, etiquette)
      .filter((b) => b.nom === "meta" && !estInerte(b.index, docAnalyse.zonesInertes))
      .map((b) => ({ b, attrs: analyserAttributs(source.slice(b.index, b.fin), etiquette) }));

  const actives = metasActives(doc, html);
  const robots = actives.filter(({ attrs }) => (attrs.get("name") || "").toLowerCase() === "robots");
  const specifiques = actives.filter(({ attrs }) =>
    ["googlebot", "googlebot-news", "bingbot", "slurp", "duckduckbot"].includes((attrs.get("name") || "").toLowerCase())
  );

  for (const { attrs } of specifiques) {
    const directive = attrs.get("content") || "";
    if (/\bnoindex\b|\bnone\b|\bindex\b/i.test(directive)) {
      throw new ErreurAssemblage(
        `${etiquette} : directive d'indexation spécifique à « ${attrs.get("name")} » (${directive.trim()}). ` +
          `Elle contredirait la politique calculée — à corriger dans les sources.`
      );
    }
  }
  if (robots.length > 1) {
    throw new ErreurAssemblage(
      `${etiquette} : ${robots.length} balises meta robots effectives. Structure ambiguë, à corriger dans les sources.`
    );
  }
  if (robots.length === 1 && (robots[0].b.index < debut || robots[0].b.index > fin)) {
    throw new ErreurAssemblage(`${etiquette} : la balise robots existante est hors du <head>.`);
  }

  const nouvelle = `<meta name="robots" content="${contenu}">`;
  const resultat =
    robots.length === 1
      ? html.slice(0, robots[0].b.index) + nouvelle + html.slice(robots[0].b.fin)
      : html.slice(0, fin) + nouvelle + "\n" + html.slice(fin);

  // Contrôle d'effectivité indépendant, sur le document reconstruit.
  const docFinal = analyserDocument(resultat);
  const bornes = bornesHead(docFinal.masque);
  const effectives = metasActives(docFinal, resultat).filter(
    ({ attrs }) => (attrs.get("name") || "").toLowerCase() === "robots"
  );
  if (effectives.length !== 1) {
    throw new ErreurAssemblage(
      `${etiquette} : ${effectives.length} balise(s) robots effective(s) après transformation, 1 attendue.`
    );
  }
  const seule = effectives[0];
  if (seule.b.index < bornes.debut || seule.b.index > bornes.fin) {
    throw new ErreurAssemblage(`${etiquette} : balise robots produite hors du <head>.`);
  }
  if ((seule.attrs.get("content") || "") !== contenu) {
    throw new ErreurAssemblage(`${etiquette} : balise robots effective inattendue — ${seule.attrs.get("content")}`);
  }
  return resultat;
}

/* ================================================================== *
 * Contrôle des références de l'artefact (PUB-07)
 * ================================================================== */

function normaliserCible(ref) {
  const sansFragment = ref.split("#")[0].split("?")[0];
  if (sansFragment === "") return null;
  let decode;
  try {
    decode = decodeURIComponent(sansFragment);
  } catch {
    throw new ErreurAssemblage(`Référence à l'encodage URL invalide : « ${ref} »`);
  }
  return decode;
}

function estDistante(ref) {
  return /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/.test(ref);
}

/* Une data-URI n'est pas une référence : son contenu est déjà dans le fichier.
   Aucune requête réseau, aucun tiers, aucun fichier à retrouver dans la sortie.
   Le contrôle de références ne la concerne donc ni comme ressource distante —
   ce qu'un test de schéma lui ferait conclure à tort — ni comme chemin local.
   Elle est utilisée par le portfolio pour le grain du fond bois
   (docs/DIRECTION.md, « Texture du bois », commit 02b0665), qui exige un motif
   inline plutôt qu'un fichier séparé à charger. */
function estInline(ref) {
  return /^data:/i.test(ref);
}

/** Références d'un HTML, séparées en chargements automatiques et navigation. */
function referencesHtml(html, etiquette) {
  const doc = analyserDocument(html);
  const auto = [];
  const nav = [];

  for (const b of balises(doc.masque, etiquette)) {
    const attrs = analyserAttributs(html.slice(b.index, b.fin), etiquette);
    for (const nom of ATTRIBUTS_AUTOMATIQUES[b.nom] || []) {
      const v = attrs.get(nom);
      if (v === undefined || v.trim() === "") continue;
      if (nom === "srcset") {
        for (const entree of v.split(",")) {
          const url = entree.trim().split(/\s+/)[0];
          if (url) auto.push({ ref: url, origine: `<${b.nom} srcset>` });
        }
      } else {
        auto.push({ ref: v.trim(), origine: `<${b.nom} ${nom}>` });
      }
    }
    for (const nom of ATTRIBUTS_NAVIGATION[b.nom] || []) {
      const v = attrs.get(nom);
      if (v !== undefined && v.trim() !== "") nav.push({ ref: v.trim(), origine: `<${b.nom} ${nom}>` });
    }
    const style = attrs.get("style");
    if (style) for (const r of referencesCss(style)) auto.push({ ref: r, origine: `<${b.nom} style>` });
  }
  // Le CSS des blocs <style> est analysé comme n'importe quelle feuille (PUB-07).
  for (const bloc of doc.cssEnLigne) {
    for (const r of referencesCss(bloc)) auto.push({ ref: r, origine: "<style> … </style>" });
  }
  return { auto, nav };
}

/** url(...) et @import, avec ou sans url(). */
function referencesCss(css) {
  const refs = [];
  for (const m of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]*))\s*\)/gi)) {
    const v = (m[1] ?? m[2] ?? m[3] ?? "").trim();
    if (v) refs.push(v);
  }
  for (const m of css.matchAll(/@import\s+(?:url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]*))\s*\)|"([^"]*)"|'([^']*)')/gi)) {
    const v = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? "").trim();
    if (v) refs.push(v);
  }
  return refs;
}

async function controlerReferences(sortie, fichiers) {
  const problemes = [];

  const verifier = async (relatifSource, ref, origine, automatique) => {
    if (estInline(ref)) return; // contenu embarqué : rien à charger, rien à résoudre
    if (estDistante(ref)) {
      if (automatique) {
        problemes.push(
          `${relatifSource} ${origine} → ${ref} : ressource chargée depuis un tiers, interdite dans l'artefact`
        );
      }
      return; // lien de navigation distant : légitime (crédits)
    }
    const cible = normaliserCible(ref);
    if (cible === null) return;

    const dossier = path.posix.dirname(relatifSource.split(path.sep).join("/"));
    const brut = cible.startsWith("/")
      ? cible.slice(1)
      : path.posix.join(dossier === "." ? "" : dossier, cible);
    const normalise = path.posix.normalize(brut);

    // Confinement AVANT tout accès disque : un fichier source hors sortie ne
    // peut jamais satisfaire le contrôle.
    if (normalise.startsWith("..") || path.posix.isAbsolute(normalise)) {
      problemes.push(`${relatifSource} ${origine} → ${ref} : sort de l'artefact`);
      return;
    }
    if (normalise === "." || normalise === "") {
      if (automatique) {
        problemes.push(`${relatifSource} ${origine} → ${ref} : la racine n'est pas une ressource fichier`);
      }
      return; // lien de navigation vers la racine : légitime
    }

    const absolu = path.join(sortie, normalise);
    let infos;
    try {
      infos = await fs.lstat(absolu);
    } catch {
      problemes.push(`${relatifSource} ${origine} → ${ref} : ressource absente de l'artefact`);
      return;
    }
    if (infos.isDirectory()) {
      // Un lien de navigation vers un répertoire est admis s'il contient index.html.
      if (!automatique) {
        try {
          await fs.access(path.join(absolu, "index.html"));
          return;
        } catch {
          /* traité comme absent ci-dessous */
        }
      }
      problemes.push(`${relatifSource} ${origine} → ${ref} : répertoire, une ressource fichier est attendue`);
      return;
    }
    if (!infos.isFile()) {
      problemes.push(`${relatifSource} ${origine} → ${ref} : n'est pas un fichier régulier`);
    }
  };

  for (const relatif of fichiers) {
    const estHtml = /\.html?$/i.test(relatif);
    const estCss = /\.css$/i.test(relatif);
    if (!estHtml && !estCss) continue;

    const contenu = await fs.readFile(path.join(sortie, relatif), "utf8");
    if (estHtml) {
      const { auto, nav } = referencesHtml(contenu, relatif);
      for (const r of auto) await verifier(relatif, r.ref, r.origine, true);
      for (const r of nav) await verifier(relatif, r.ref, r.origine, false);
    } else {
      for (const ref of referencesCss(contenu)) await verifier(relatif, ref, "url()/@import", true);
    }
  }
  return problemes;
}

/* ================================================================== *
 * Système de fichiers
 * ================================================================== */

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

async function nettoyerSortie(sortie, dossierSite) {
  const attendue = path.join(dossierSite, "dist");
  if (path.resolve(sortie) !== path.resolve(attendue)) {
    throw new ErreurAssemblage(`Sortie inattendue, nettoyage refusé : ${sortie}`);
  }
  if (path.resolve(sortie) === path.resolve(dossierSite)) {
    throw new ErreurAssemblage("La sortie ne peut pas être le dossier source.");
  }
  // PUB-04 — aucun segment traversé, racines comprises, ne doit être un lien.
  await chaineSansLienSymbolique(sortie, "Sortie", { doitExister: false });

  const infos = await fs.lstat(sortie).catch(() => null);
  if (infos && !infos.isDirectory()) {
    throw new ErreurAssemblage(`La sortie existe et n'est pas un dossier : ${sortie}`);
  }
  await fs.rm(sortie, { recursive: true, force: true });
}

/* ================================================================== *
 * Fichiers générés
 * ================================================================== */

function construireRobotsTxt() {
  return "User-agent: *\nAllow: /\n";
}

/* `_headers` ne porte que des règles qui peuvent réellement matcher une requête
   sur un Worker. Deux règles héritées du gabarit Cloudflare Pages ont été
   retirées le 19 septembre 2026 sur arbitrage de l'Architecte
   (docs/PUBLICATION-portfolio.md, réserve n° 5) :

   - `https://:version.:project.pages.dev/*` visait les URL versionnées de
     Pages. Un Worker n'est jamais servi sur `pages.dev` : la règle ne matchait
     jamais. La transposer au format Workers (`…workers.dev/*`) serait pire —
     un placeholder d'hôte matche tout sauf le point, donc la règle couvrirait
     aussi l'hôte de production du Worker et rendrait la page d'accueil du
     portfolio non indexable, à l'encontre de son contrat.
   - `/404.html` visait la page d'erreur. Workers Static Assets évalue
     `_headers` sur le chemin de la requête entrante, puis réécrit en interne
     vers `404.html` : le chemin d'une vraie 404 est arbitraire, la règle ne
     matchait donc jamais non plus. La non-indexation de ces réponses repose
     sur le statut 404 lui-même et sur la balise `<meta name="robots">` de la
     page, toutes deux déjà en place.

   La non-indexation des Preview URLs du Worker relève d'un réglage du tableau
   de bord, pas de ce fichier. */
/* PUB-11 — Un « * » du motif vaut « tout caractère, « / » compris ». */
function motifCorrespond(motif, chemin) {
  const expression = motif.split("*").map((m) => m.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${expression}$`).test(chemin);
}

/**
 * PUB-11 — Règles Content-Type d'un site qui les demande. Renvoie une liste de
 * { motif, type }. Les chemins servis sont dérivés du plan d'assemblage :
 *   - pages : « / » pour index.html, « /nom » pour nom.html (html_handling
 *     auto-trailing-slash, réglage attendu des Workers du dépôt) et un motif
 *     « /*.html » qui couvre aussi les accès en « .html » ;
 *   - fichiers publics : une règle EXACTE par fichier (PUB-11-01 : aucun motif
 *     de dossier, qui typerait aussi une 404 sous ce dossier) ;
 *   - robots.txt ; les notices gardent leur propre règle (construireHeaders).
 * Une extension inconnue, un caractère de motif dans un chemin, ou un chemin
 * servi qui ne correspondrait pas à EXACTEMENT une règle de type lèvent une
 * erreur : jamais de type deviné, jamais de valeurs cumulées. PUB-11-01 : la
 * même exigence vaut pour des URL ABSENTES sondées (« /inexistant.html » à la
 * racine et sous chaque dossier) : une seule règle, de type HTML.
 */
function construireReglesContentType(planifies, notices) {
  const regles = new Map(); // motif -> type
  const urlsAttendues = []; // { url, type } à contrôler
  const ajouter = (motif, type) => {
    if (regles.has(motif) && regles.get(motif) !== type) {
      throw new ErreurAssemblage(`Règles Content-Type : deux types pour « ${motif} ».`);
    }
    regles.set(motif, type);
  };
  const typeDe = (destination) => {
    const ext = path.posix.extname(destination).toLowerCase();
    const type = TYPES_MIME[ext];
    if (!type) {
      throw new ErreurAssemblage(
        `Règles Content-Type : aucun type MIME sûr pour « ${destination} » (extension « ${ext || "aucune"} »). ` +
          `Extensions admises : ${Object.keys(TYPES_MIME).join(", ")}.`
      );
    }
    return type;
  };
  for (const destination of planifies.keys()) {
    if (/[*:#\s]/.test(destination)) {
      throw new ErreurAssemblage(`Règles Content-Type : caractère interdit dans le chemin « ${destination} ».`);
    }
  }

  const entrees = [...planifies].filter(([, v]) => v.type !== "généré");
  for (const [destination, { type }] of entrees.filter(([, v]) => v.type === "pages").sort(([a], [b]) => (a < b ? -1 : 1))) {
    const route = destination === "index.html" ? "/" : `/${destination.slice(0, -".html".length)}`;
    ajouter(route, TYPES_MIME[".html"]);
    urlsAttendues.push({ url: route, type: TYPES_MIME[".html"] }, { url: `/${destination}`, type: TYPES_MIME[".html"] });
  }
  ajouter("/*.html", TYPES_MIME[".html"]);

  const fichiers = entrees.filter(([d, v]) => v.type !== "pages" && !estNotice(d)).map(([d]) => d).sort();
  for (const destination of fichiers) {
    const type = typeDe(destination);
    urlsAttendues.push({ url: `/${destination}`, type });
    // PUB-11-01 — une règle EXACTE par fichier : aucun motif « /dossier/* » ni
    // « /dossier/*.ext », qui typeraient aussi une URL absente (dont le corps
    // servi est 404.html) comme CSS, JavaScript ou image.
    ajouter(`/${destination}`, type);
  }
  for (const notice of notices) {
    urlsAttendues.push({ url: `/${notice}`, type: TYPE_TEXTE });
  }
  ajouter("/robots.txt", TYPE_TEXTE);
  urlsAttendues.push({ url: "/robots.txt", type: TYPE_TEXTE });

  // Contrôle final : chaque chemin servi correspond à UNE règle Content-Type
  // (notices comprises), et à celle du bon type.
  const toutes = [...[...regles].map(([motif, type]) => ({ motif, type })), ...notices.map((n) => ({ motif: `/${n}`, type: TYPE_TEXTE }))];
  for (const { url, type } of urlsAttendues) {
    const trouvees = toutes.filter((r) => motifCorrespond(r.motif, url));
    if (trouvees.length !== 1 || trouvees[0].type !== type) {
      throw new ErreurAssemblage(
        `Règles Content-Type : « ${url} » correspond à ${trouvees.length} règle(s) ` +
          `[${trouvees.map((r) => `${r.motif} → ${r.type}`).join(" ; ")}], attendu une seule règle « ${type} ».`
      );
    }
  }
  // PUB-11-01 — URL ABSENTES. Workers Static Assets sert 404.html pour une URL
  // sans fichier, mais évalue `_headers` sur le chemin demandé : pour des
  // chemins d'inventaire absent, une URL « .html » inconnue (quel que soit le
  // dossier) doit recevoir UNE règle de type HTML, celui du corps servi ; une URL
  // « .css », « .js », image, police, JSON ou texte inconnue ne doit recevoir
  // AUCUNE règle ; une URL sans extension aucune règle (limite documentée :
  // `/*` est interdit) ou une règle HTML.
  const dossiers = new Set([""]);
  for (const destination of planifies.keys()) {
    const segments = destination.split("/");
    for (let i = 1; i < segments.length; i++) dossiers.add(`/${segments.slice(0, i).join("/")}`);
  }
  const extensionsSondees = [".html", ...Object.keys(TYPES_MIME), ".txt", ".md", ""];
  for (const dossier of dossiers) {
    for (const extension of extensionsSondees) {
      for (const url of [`${dossier}/inexistant${extension}`, `${dossier}/inexistant/imbrique${extension}`]) {
        if (planifies.has(url.slice(1))) continue;
        const trouvees = toutes.filter((r) => motifCorrespond(r.motif, url));
        const exigeHtml = extension === ".html";
        const incorrect = exigeHtml
          ? trouvees.length !== 1 || trouvees[0].type !== TYPES_MIME[".html"]
          : trouvees.length > 0 && (extension !== "" || trouvees[0].type !== TYPES_MIME[".html"] || trouvees.length > 1);
        if (incorrect) {
          throw new ErreurAssemblage(
            `Règles Content-Type : l'URL absente « ${url} » correspond à ${trouvees.length} règle(s) ` +
              `[${trouvees.map((r) => `${r.motif} → ${r.type}`).join(" ; ")}] ; une vraie 404 doit recevoir une seule règle HTML` +
              `${exigeHtml ? "" : extension === "" ? " ou aucune" : " : aucune règle n'est admise pour cette extension (le corps servi est du HTML)"}.`
          );
        }
      }
    }
  }
  return [...regles].map(([motif, type]) => ({ motif, type })).sort((a, b) => {
    const rang = (r) => (r.motif === "/" ? 0 : r.type === TYPES_MIME[".html"] ? 1 : 2);
    return rang(a) - rang(b) || (a.motif < b.motif ? -1 : a.motif > b.motif ? 1 : 0);
  });
}

function construireHeaders(politique, notices, reglesContentType = []) {
  const blocs = [];
  if (politique.reglenoindexGlobale) {
    blocs.push("/*\n  X-Robots-Tag: noindex, follow");
  }
  for (const notice of notices) {
    const lignes = [`/${notice}`, "  Content-Type: text/plain; charset=utf-8"];
    if (!politique.reglenoindexGlobale) lignes.push("  X-Robots-Tag: noindex, follow");
    blocs.push(lignes.join("\n"));
  }
  for (const { motif, type } of reglesContentType) {
    blocs.push(`${motif}\n  Content-Type: ${type}`);
  }
  if (blocs.length > LIMITE_REGLES_HEADERS) {
    throw new ErreurAssemblage(
      `_headers : ${blocs.length} règles, au-delà de la limite Cloudflare de ${LIMITE_REGLES_HEADERS}. ` +
        `Regrouper des fichiers dans des dossiers homogènes plutôt que d'ajouter des règles.`
    );
  }
  for (const ligne of blocs.join("\n").split("\n")) {
    if (ligne.length > LIMITE_LIGNE_HEADERS) {
      throw new ErreurAssemblage(`_headers : une ligne dépasse ${LIMITE_LIGNE_HEADERS} caractères.`);
    }
  }
  return blocs.length ? blocs.join("\n\n") + "\n" : "";
}

/* ================================================================== *
 * Assemblage
 * ================================================================== */

async function assembler(slug, environnementDemande, env) {
  validerSlug(slug);

  const dossierSites = path.join(RACINE, "sites");
  const dossierSite = path.join(dossierSites, slug);
  const dossierPartage = path.join(RACINE, "shared");

  // PUB-04 — les RACINES elles-mêmes sont contrôlées avant tout le reste.
  await chaineSansLienSymbolique(dossierSites, "Racine sites/");
  await chaineSansLienSymbolique(dossierSite, `Dossier sites/${slug}`);
  if (!(await fs.lstat(dossierSite)).isDirectory()) {
    throw new ErreurAssemblage(`sites/${slug} doit être un dossier.`);
  }

  const mode = resoudreEnvironnement(environnementDemande, env);
  const manifeste = await lireManifeste(dossierSite, slug);
  const politique = politiqueIndexation(manifeste.kind, mode.effectif);

  if (manifeste.sharedFiles.length > 0) {
    await chaineSansLienSymbolique(dossierPartage, "Racine shared/");
  }

  const sortie = path.join(dossierSite, "dist");

  /* --- 1. Plan complet des destinations, fichiers générés compris (PUB-06) --- */
  const planifies = new Map();
  const parCasse = new Map();

  // PUB-06 — une seule normalisation sert aux noms réservés, aux doublons et
  // aux conflits fichier/répertoire : sur un volume insensible à la casse,
  // « SITEMAP.XML », « _HEADERS/… » et « Shared/… » désignent les réservés.
  const normaliser = (d) => d.toLowerCase();
  const reserver = (destination, source, type) => {
    const segments = destination.split("/");
    const segmentsBas = normaliser(destination).split("/");
    if (NOMS_RESERVES.has(segmentsBas[0]) && segments.length > 1) {
      throw new ErreurAssemblage(
        `Collision : « ${destination} » — « ${segments[0]} » est un fichier réservé, il ne peut pas être un répertoire (${type}).`
      );
    }
    if (NOMS_RESERVES.has(normaliser(destination)) && type !== "généré") {
      throw new ErreurAssemblage(`Collision : « ${destination} » est réservé à l'assembleur (${type}).`);
    }
    if (segmentsBas[0] === DOSSIER_RESERVE && type !== "sharedFiles") {
      throw new ErreurAssemblage(
        `Collision : « ${destination} » — le dossier « ${DOSSIER_RESERVE}/ » est réservé aux dépendances communes.`
      );
    }
    if (planifies.has(destination)) {
      throw new ErreurAssemblage(
        `Destination dupliquée : « ${destination} » (${planifies.get(destination).type} et ${type}).`
      );
    }
    // Volumes insensibles à la casse : deux destinations qui ne diffèrent que
    // par la casse écraseraient l'une l'autre selon le système de fichiers.
    const cle = normaliser(destination);
    if (parCasse.has(cle)) {
      throw new ErreurAssemblage(
        `Collision de casse : « ${destination} » et « ${parCasse.get(cle)} » — ` +
          `ambigu sur un volume insensible à la casse.`
      );
    }
    parCasse.set(cle, destination);
    planifies.set(destination, { source, type });
  };

  for (const [champ, liste, base] of [
    ["pages", manifeste.pages, dossierSite],
    ["publicFiles", manifeste.publicFiles, dossierSite],
  ]) {
    for (const relatif of liste) {
      validerEntreeRelative(relatif, `Manifeste.${champ}`);
      refuserExclusions(relatif, `Manifeste.${champ}`);
      reserver(relatif, path.join(base, relatif), champ);
      const source = await chaineSansLienSymbolique(path.join(base, relatif), `Manifeste.${champ}`);
      await exigerConfinementReel(base, source, `Manifeste.${champ}`);
      if (!(await fs.lstat(source)).isFile()) {
        throw new ErreurAssemblage(`Manifeste.${champ} : « ${relatif} » n'est pas un fichier régulier.`);
      }
    }
  }
  for (const relatif of manifeste.sharedFiles) {
    validerEntreeRelative(relatif, "Manifeste.sharedFiles");
    refuserExclusions(relatif, "Manifeste.sharedFiles");
    reserver(`${DOSSIER_RESERVE}/${relatif}`, path.join(dossierPartage, relatif), "sharedFiles");
    const source = await chaineSansLienSymbolique(path.join(dossierPartage, relatif), "Manifeste.sharedFiles");
    await exigerConfinementReel(dossierPartage, source, "Manifeste.sharedFiles");
    if (!(await fs.lstat(source)).isFile()) {
      throw new ErreurAssemblage(`Manifeste.sharedFiles : « ${relatif} » n'est pas un fichier régulier.`);
    }
  }
  // Les fichiers générés entrent dans le même plan : leurs collisions sont
  // détectées AVANT le nettoyage, et non au moment de l'écriture.
  for (const genere of FICHIERS_GENERES) reserver(genere, null, "généré");

  // Conflit fichier/répertoire entre destinations planifiées, sur la même
  // représentation normalisée que les doublons et les noms réservés.
  for (const destination of planifies.keys()) {
    const prefixe = normaliser(destination) + "/";
    for (const autre of planifies.keys()) {
      if (autre !== destination && normaliser(autre).startsWith(prefixe)) {
        throw new ErreurAssemblage(
          `Collision fichier/répertoire : « ${destination} » est aussi un préfixe de « ${autre} ».`
        );
      }
    }
  }

  // PUB-05 — aucune source réelle ne doit appartenir à la sortie qui va être
  // nettoyée : sinon le nettoyage détruirait sa propre entrée.
  for (const [destination, { source }] of planifies) {
    if (!source) continue;
    const dedans = path.relative(sortie, source);
    if (dedans !== "" && !dedans.startsWith("..") && !path.isAbsolute(dedans)) {
      throw new ErreurAssemblage(
        `Manifeste : « ${destination} » a pour source ${path.relative(RACINE, source)}, situé dans la sortie ` +
          `${path.relative(RACINE, sortie)} qui va être nettoyée.`
      );
    }
  }

  /* --- 2. Nettoyage borné --- */
  await nettoyerSortie(sortie, dossierSite);
  await fs.mkdir(sortie, { recursive: true });

  /* --- 3 à 5. Copies, transformations, indexation --- */
  let remplacementsTotal = 0;
  for (const [destination, { source, type }] of [...planifies].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (type === "généré") continue;
    const cible = path.join(sortie, destination);
    await fs.mkdir(path.dirname(cible), { recursive: true });

    if (type === "pages") {
      const brut = await fs.readFile(source, "utf8");
      const { html, remplacements } = reecrireLiensPartages(brut);
      remplacementsTotal += remplacements;
      const contenuRobots = destination === "404.html" ? politique.meta404 : politique.metaPages;
      await fs.writeFile(cible, appliquerBaliseRobots(html, contenuRobots, destination), "utf8");
    } else {
      await fs.copyFile(source, cible);
    }
  }

  const notices = [...planifies.keys()].filter((d) => planifies.get(d).type !== "généré" && estNotice(d)).sort();
  await fs.writeFile(path.join(sortie, "robots.txt"), construireRobotsTxt(), "utf8");
  const reglesContentType = manifeste.contentTypeRules ? construireReglesContentType(planifies, notices) : [];
  await fs.writeFile(path.join(sortie, "_headers"), construireHeaders(politique, notices, reglesContentType), "utf8");

  /* --- 6. Contrôles finaux --- */
  const fichiers = await listerFichiers(sortie);
  const obtenus = new Set(fichiers.map((f) => f.split(path.sep).join("/")));
  const attendus = new Set(planifies.keys());
  const manquants = [...attendus].filter((d) => !obtenus.has(d));
  const enTrop = [...obtenus].filter((d) => !attendus.has(d));
  if (manquants.length || enTrop.length) {
    throw new ErreurAssemblage(
      `Inventaire non conforme au plan.` +
        (manquants.length ? ` Manquants : ${manquants.join(", ")}.` : "") +
        (enTrop.length ? ` En trop : ${enTrop.join(", ")}.` : "")
    );
  }

  const problemes = await controlerReferences(sortie, fichiers);
  if (problemes.length > 0) {
    throw new ErreurAssemblage(`Références invalides dans l'artefact :\n  - ${problemes.join("\n  - ")}`);
  }

  let poids = 0;
  for (const f of fichiers) poids += (await fs.stat(path.join(sortie, f))).size;

  return {
    slug, kind: manifeste.kind, mode, politique, sortie, fichiers, poids, remplacements: remplacementsTotal, notices,
    reglesContentType: manifeste.contentTypeRules ? reglesContentType.length : null,
  };
}

/* ================================================================== *
 * Entrée
 * ================================================================== */

async function principal() {
  const { slug, environnementDemande } = lireArguments(process.argv);
  const r = await assembler(slug, environnementDemande, process.env);

  console.log(`Runtime         : Node ${process.versions.node}`);
  console.log(`Site            : ${r.slug} (${r.kind})`);
  console.log(
    `Mode effectif   : ${r.mode.effectif}` +
      (r.mode.ramene ? ` (ramené depuis « ${r.mode.demande} » : branche ≠ main)` : "") +
      ` — source : ${r.mode.source}`
  );
  console.log(`Indexation      : ${r.politique.metaPages} (404 : ${r.politique.meta404})`);
  console.log(`Sortie          : ${path.relative(RACINE, r.sortie)}`);
  console.log(`Fichiers        : ${r.fichiers.length}`);
  console.log(`Poids total     : ${(r.poids / 1024).toFixed(1)} Kio`);
  console.log(`Liens réécrits  : ${r.remplacements}`);
  console.log(`Notices typées  : ${r.notices.length ? r.notices.join(", ") : "aucune"}`);
  console.log(`Règles MIME     : ${r.reglesContentType === null ? "non activées (contentTypeRules absent)" : `${r.reglesContentType} règle(s) Content-Type`}`);
}

principal().catch((e) => {
  if (e instanceof ErreurAssemblage) console.error(`Échec de l'assemblage : ${e.message}`);
  else console.error("Échec de l'assemblage (erreur inattendue) :", e);
  process.exitCode = 1;
});

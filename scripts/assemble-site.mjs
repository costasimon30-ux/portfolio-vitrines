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

/** PUB-05 — Exclusions imposées par le contrat, quelles que soient les listes. */
const EXTENSIONS_INTERDITES = new Set([
  ".map", ".zip", ".tar", ".gz", ".tgz", ".7z", ".rar", ".bz2",
  ".njk", ".liquid", ".hbs", ".handlebars", ".ejs", ".pug", ".mustache",
]);
const NOMS_INTERDITS = new Set(["publication.json", ".node-version", "package.json", "package-lock.json"]);

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

/** PUB-05 — Exclusions du contrat, appliquées avant tout nettoyage. */
function refuserExclusions(relatif, champ) {
  const segments = relatif.split("/");
  if (segments.some((s) => s.startsWith("."))) {
    throw new ErreurAssemblage(`${champ} : « ${relatif} » — chemin ou fichier caché exclu par le contrat.`);
  }
  if (segments[0] === "dist") {
    throw new ErreurAssemblage(`${champ} : « ${relatif} » — une sortie générée ne peut pas être une entrée.`);
  }
  const base = path.posix.basename(relatif);
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
  const champsConnus = new Set(["kind", "pages", "publicFiles", "sharedFiles"]);
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
  return { chemin, slug, kind: manifeste.kind, pages, publicFiles, sharedFiles };
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

/** Masque commentaires, <script> et <style> par des espaces, en gardant les offsets. */
function masquerZonesNonBalises(html) {
  let out = html;
  const remplacer = (re) =>
    (out = out.replace(re, (m) => m.replace(/[^\n]/g, " ")));
  remplacer(/<!--[\s\S]*?-->/g);
  remplacer(/<script\b[\s\S]*?<\/script\s*>/gi);
  remplacer(/<style\b[\s\S]*?<\/style\s*>/gi);
  return out;
}

/** Analyse les attributs d'une balise. Formes admises : "v", 'v', v sans espace. */
function analyserAttributs(texteBalise, etiquette) {
  const attributs = new Map();
  const corps = texteBalise.replace(/^<\s*[a-zA-Z][\w:-]*/, "").replace(/\/?>$/, "");
  const re = /([a-zA-Z_:][\w:.-]*)(\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  let reste = corps;
  while ((m = re.exec(corps)) !== null) {
    attributs.set(m[1].toLowerCase(), m[3] ?? m[4] ?? m[5] ?? "");
    reste = reste.replace(m[0], "");
  }
  // Refus explicite d'une valeur d'attribut à guillemet non fermé, que ce
  // découpage ne saurait pas interpréter (PUB-07 : pas d'ignorance silencieuse).
  const guillemetsDoubles = (corps.match(/"/g) || []).length;
  const guillemetsSimples = (corps.match(/'/g) || []).length;
  if (guillemetsDoubles % 2 !== 0 || guillemetsSimples % 2 !== 0) {
    throw new ErreurAssemblage(
      `${etiquette} : guillemet non fermé dans une balise, syntaxe non prise en charge — ${texteBalise.slice(0, 80)}`
    );
  }
  return attributs;
}

/**
 * Balises du document. Toute ouverture `<nom` qui ne produit pas une balise
 * analysable fait échouer l'assemblage : une syntaxe non prise en charge doit
 * être refusée explicitement, jamais ignorée (PUB-07).
 */
function balises(htmlMasque, etiquette) {
  const re = /<\s*([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
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
  const masque = masquerZonesNonBalises(html);
  const { debut, fin } = bornesHead(masque);
  if (debut === -1 || fin === -1 || fin < debut) {
    throw new ErreurAssemblage(`${etiquette} : <head> absent ou mal formé, structure non prise en charge.`);
  }
  if (/<\s*base\b/i.test(masque)) {
    throw new ErreurAssemblage(
      `${etiquette} : balise <base> présente — elle change la résolution des URL, cas non pris en charge.`
    );
  }

  const robots = [];
  const specifiques = [];
  for (const b of balises(masque, etiquette)) {
    if (b.nom !== "meta") continue;
    const attrs = analyserAttributs(html.slice(b.index, b.fin), etiquette);
    const nom = (attrs.get("name") || "").toLowerCase();
    if (nom === "robots") robots.push(b);
    else if (["googlebot", "bingbot", "slurp", "duckduckbot", "googlebot-news"].includes(nom)) {
      specifiques.push({ b, nom, contenu: attrs.get("content") || "" });
    }
  }

  for (const s of specifiques) {
    if (/\bnoindex\b|\bnone\b|\bindex\b/i.test(s.contenu)) {
      throw new ErreurAssemblage(
        `${etiquette} : directive d'indexation spécifique à « ${s.nom} » (${s.contenu.trim()}). ` +
          `Elle contredirait la politique calculée — à corriger dans les sources.`
      );
    }
  }
  if (robots.length > 1) {
    throw new ErreurAssemblage(
      `${etiquette} : ${robots.length} balises meta robots effectives. Structure ambiguë, à corriger dans les sources.`
    );
  }
  if (robots.length === 1 && (robots[0].index < debut || robots[0].index > fin)) {
    throw new ErreurAssemblage(`${etiquette} : la balise robots existante est hors du <head>.`);
  }

  const nouvelle = `<meta name="robots" content="${contenu}">`;
  let resultat;
  if (robots.length === 1) {
    const b = robots[0];
    resultat = html.slice(0, b.index) + nouvelle + html.slice(b.fin);
  } else {
    resultat = html.slice(0, fin) + nouvelle + "\n" + html.slice(fin);
  }

  // Contrôle d'effectivité après transformation.
  const masqueFinal = masquerZonesNonBalises(resultat);
  const bornes = bornesHead(masqueFinal);
  let effectives = 0;
  for (const b of balises(masqueFinal, etiquette)) {
    if (b.nom !== "meta") continue;
    const attrs = analyserAttributs(resultat.slice(b.index, b.fin), etiquette);
    if ((attrs.get("name") || "").toLowerCase() !== "robots") continue;
    if (b.index < bornes.debut || b.index > bornes.fin) {
      throw new ErreurAssemblage(`${etiquette} : balise robots produite hors du <head>.`);
    }
    if ((attrs.get("content") || "") !== contenu) {
      throw new ErreurAssemblage(`${etiquette} : balise robots effective inattendue — ${attrs.get("content")}`);
    }
    effectives += 1;
  }
  if (effectives !== 1) {
    throw new ErreurAssemblage(
      `${etiquette} : ${effectives} balise(s) robots effective(s) après transformation, 1 attendue.`
    );
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

/** Références d'un HTML, séparées en chargements automatiques et navigation. */
function referencesHtml(html, etiquette) {
  const masque = masquerZonesNonBalises(html);
  const auto = [];
  const nav = [];

  for (const b of balises(masque, etiquette)) {
    const attrs = analyserAttributs(html.slice(b.index, b.fin), etiquette);
    const listeAuto = ATTRIBUTS_AUTOMATIQUES[b.nom] || [];
    for (const nom of listeAuto) {
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
    const listeNav = ATTRIBUTS_NAVIGATION[b.nom] || [];
    for (const nom of listeNav) {
      const v = attrs.get(nom);
      if (v !== undefined && v.trim() !== "") nav.push({ ref: v.trim(), origine: `<${b.nom} ${nom}>` });
    }
    const style = attrs.get("style");
    if (style) for (const r of referencesCss(style)) auto.push({ ref: r, origine: `<${b.nom} style>` });
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
    if (normalise === "." || normalise === "") return; // racine du site

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

function construireHeaders(politique, notices) {
  const blocs = [];
  if (politique.reglenoindexGlobale) {
    blocs.push("/*\n  X-Robots-Tag: noindex, follow");
  } else {
    blocs.push("https://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex, follow");
    blocs.push("/404.html\n  X-Robots-Tag: noindex, follow");
  }
  for (const notice of notices) {
    const lignes = [`/${notice}`, "  Content-Type: text/plain; charset=utf-8"];
    if (!politique.reglenoindexGlobale) lignes.push("  X-Robots-Tag: noindex, follow");
    blocs.push(lignes.join("\n"));
  }
  return blocs.join("\n\n") + "\n";
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

  const reserver = (destination, source, type) => {
    const segments = destination.split("/");
    if (NOMS_RESERVES.has(segments[0]) && segments.length > 1) {
      throw new ErreurAssemblage(
        `Collision : « ${destination} » — « ${segments[0]} » est un fichier réservé, il ne peut pas être un répertoire (${type}).`
      );
    }
    if (NOMS_RESERVES.has(destination) && type !== "généré") {
      throw new ErreurAssemblage(`Collision : « ${destination} » est réservé à l'assembleur (${type}).`);
    }
    if (segments[0] === DOSSIER_RESERVE && type !== "sharedFiles") {
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
    const cle = destination.toLowerCase();
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

  // Conflit fichier/répertoire entre destinations planifiées.
  for (const destination of planifies.keys()) {
    const prefixe = destination + "/";
    for (const autre of planifies.keys()) {
      if (autre !== destination && autre.startsWith(prefixe)) {
        throw new ErreurAssemblage(
          `Collision fichier/répertoire : « ${destination} » est aussi un préfixe de « ${autre} ».`
        );
      }
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
  await fs.writeFile(path.join(sortie, "_headers"), construireHeaders(politique, notices), "utf8");

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

  return { slug, kind: manifeste.kind, mode, politique, sortie, fichiers, poids, remplacements: remplacementsTotal, notices };
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
}

principal().catch((e) => {
  if (e instanceof ErreurAssemblage) console.error(`Échec de l'assemblage : ${e.message}`);
  else console.error("Échec de l'assemblage (erreur inattendue) :", e);
  process.exitCode = 1;
});

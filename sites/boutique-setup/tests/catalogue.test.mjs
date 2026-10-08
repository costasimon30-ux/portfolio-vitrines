/*
  Ligne Posée — contrôles Node natifs de la logique pure et des données.
  Lancer : node --test sites/boutique-setup/tests/catalogue.test.mjs  (Node ≥ 22, aucune dépendance)

  L'inventaire de référence est relu depuis docs/DIRECTION.md (tableau du
  lot 1), pas depuis le générateur des données : les deux sources sont
  indépendantes, donc une dérive de data/catalogue.json fait échouer le test.
  Ce dossier n'est ni listé dans publication.json ni publié.
*/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "../js/catalogue-core.js";
import { chargerCatalogue } from "../js/dom.js";

const racineSite = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brut = JSON.parse(fs.readFileSync(path.join(racineSite, "data/catalogue.json"), "utf8"));
const direction = path.resolve(racineSite, "../../docs/DIRECTION.md");

function chargerValide() {
  const r = core.validerCatalogue(structuredClone(brut));
  assert.equal(r.ok, true, JSON.stringify(r.erreurs));
  return r.catalogue;
}
const cat = chargerValide();

/* ---------- Oracle : tableau de DIRECTION.md ---------- */

function lireInventaireDirection() {
  const lignes = fs.readFileSync(direction, "utf8").split("\n");
  const inv = [];
  for (const l of lignes) {
    const m = /^\| `((?:sup|tap|lum|ran)-0[1-5])` \| (.+?) \| (\d+) € \| (.+?) \| (.+?) \|$/.exec(l);
    if (m) inv.push({ id: m[1], nom: m[2], base: Number(m[3]), univers: m[4].split(", ").map((x) => x.trim()), description: m[5] });
  }
  return inv;
}
const inventaire = fs.existsSync(direction) ? lireInventaireDirection() : [];

const SUPPLEMENTS = {
  sup: [["Noir mat", 0], ["Graphite", 0], ["Blanc satiné", 0], ["Aspect aluminium brossé", 10]],
  tap: [["Petit format, graphite", 0], ["Petit format, sable", 0], ["Grand format, graphite", 15], ["Grand format, sable", 15]],
  lum: [["Noir mat, lumière chaude 2700 K", 0], ["Noir mat, lumière neutre 4000 K", 0], ["Graphite, lumière chaude 2700 K", 0], ["Graphite, lumière neutre 4000 K", 0]],
  ran: [["Compact, noir mat", 0], ["Compact, graphite", 0], ["Grand, noir mat", 12], ["Grand, graphite", 12]],
};
const TAILLES = {
  "tap-01": ["45 × 30 cm", "60 × 35 cm"], "tap-02": ["70 × 35 cm", "80 × 40 cm"],
  "tap-03": ["90 × 40 cm", "100 × 50 cm"], "tap-04": ["70 × 35 cm", "90 × 40 cm"],
  "tap-05": ["70 × 35 cm", "90 × 40 cm"],
};
const NOMS_UNIVERS = { Ergonomie: "ergonomie", Essentiels: "essentiels", Signature: "signature", Industriel: "industriel" };

/* ---------- Données ---------- */

test("compteurs : 4 familles, 20 modèles, 80 SKU, 5 modèles et 20 SKU par famille, 4 SKU par modèle", () => {
  assert.equal(cat.familles.length, 4);
  assert.equal(cat.modeles.length, 20);
  assert.equal(cat.references.length, 80);
  assert.equal(new Set(cat.modeles.map((m) => m.id)).size, 20);
  assert.equal(new Set(cat.references.map((r) => r.sku)).size, 80);
  for (const f of cat.familles) {
    assert.equal(cat.modeles.filter((m) => m.famille === f.id).length, 5, f.id);
    assert.equal(cat.references.filter((r) => r.modele.startsWith(f.id)).length, 20, f.id);
  }
  for (const m of cat.modeles) {
    assert.deepEqual(m.references.map((r) => r.variante), ["01", "02", "03", "04"], m.id);
  }
});

test("l'inventaire de DIRECTION.md est lisible (20 lignes)", { skip: inventaire.length === 0 && "docs/DIRECTION.md absent" }, () => {
  assert.equal(inventaire.length, 20);
});

test("noms, descriptions, univers, famille et prix de base = tableau de DIRECTION.md", { skip: inventaire.length === 0 && "docs/DIRECTION.md absent" }, () => {
  for (const ligne of inventaire) {
    const m = cat.parId.get(ligne.id);
    assert.ok(m, ligne.id);
    assert.equal(m.nom, ligne.nom, ligne.id);
    assert.equal(m.description, ligne.description, ligne.id);
    assert.deepEqual([...m.univers].sort(), ligne.univers.map((n) => NOMS_UNIVERS[n]).sort(), ligne.id);
    assert.equal(m.famille, ligne.id.slice(0, 3));
    assert.equal(m.prixBaseCents, ligne.base * 100, `${ligne.id} prix de base`);
    assert.equal(m.references[0].prixCents, ligne.base * 100, `${ligne.id} variante 01`);
    assert.equal(m.prixMinCents, ligne.base * 100, `${ligne.id} « à partir de »`);
  }
});

test("chaque SKU : motif LP-TYPE-MODÈLE-VARIANTE, libellé et prix = base + supplément", { skip: inventaire.length === 0 && "docs/DIRECTION.md absent" }, () => {
  for (const ligne of inventaire) {
    const f = ligne.id.slice(0, 3);
    SUPPLEMENTS[f].forEach(([libelle, supplement], i) => {
      const variante = String(i + 1).padStart(2, "0");
      const sku = `LP-${f.toUpperCase()}-${ligne.id.slice(4)}-${variante}`;
      const r = cat.parSku.get(sku);
      assert.ok(r, sku);
      assert.equal(r.modele, ligne.id);
      assert.equal(r.libelle, libelle, sku);
      assert.equal(r.prixCents, (ligne.base + supplement) * 100, sku);
      assert.equal(r.detail, f === "tap" ? TAILLES[ligne.id][i < 2 ? 0 : 1] : undefined, sku);
    });
  }
});

test("exemples de contrôle du brief : LP-SUP-03-04 = 169 €, LP-TAP-03-03 = 84 €, LP-RAN-05-03 = 111 €", () => {
  assert.equal(cat.parSku.get("LP-SUP-03-04").prixCents, 16900);
  assert.equal(cat.parSku.get("LP-TAP-03-03").prixCents, 8400);
  assert.equal(cat.parSku.get("LP-RAN-05-03").prixCents, 11100);
  assert.equal(core.formaterPrix(16900), "169 €");
  assert.equal(core.formaterPrix(8400), "84 €");
  assert.equal(core.formaterPrix(11100), "111 €");
});

test("tous les prix sont des centimes entiers", () => {
  for (const r of brut.references) assert.ok(Number.isSafeInteger(r.prixCents) && r.prixCents >= 0, r.sku);
});

/* ---------- Validation bloquante ---------- */

function mutation(fn) {
  const copie = structuredClone(brut);
  fn(copie);
  return core.validerCatalogue(copie);
}

test("un catalogue invalide est refusé (jamais de catalogue partiel)", () => {
  const cas = {
    "19 modèles": (d) => { d.modeles.pop(); },
    "79 références": (d) => { d.references.pop(); },
    "SKU en double": (d) => { d.references[1].sku = d.references[0].sku; },
    "SKU incohérent": (d) => { d.references[5].sku = "LP-SUP-01-09"; },
    "prix fractionnaire": (d) => { d.references[0].prixCents = 69.5; },
    "prix négatif": (d) => { d.references[0].prixCents = -1; },
    "prix chaîne": (d) => { d.references[0].prixCents = "6900"; },
    "modèle sans univers": (d) => { d.modeles[0].univers = []; },
    "univers inconnu": (d) => { d.modeles[0].univers = ["luxe"]; },
    "famille inconnue": (d) => { d.modeles[0].famille = "zzz"; },
    "référence orpheline": (d) => { d.references[0].modele = "sup-99"; },
    "variante manquante": (d) => { d.references.splice(3, 1); d.references.push({ ...d.references[0], sku: "LP-SUP-01-05", variante: "05" }); },
    "libellé vide": (d) => { d.references[0].libelle = "  "; },
    "schéma inattendu": (d) => { d.schema = 2; },
    "marque absente": (d) => { delete d.marque; },
    "modeles pas une liste": (d) => { d.modeles = {}; },
  };
  for (const [nom, fn] of Object.entries(cas)) {
    const r = mutation(fn);
    assert.equal(r.ok, false, nom);
    assert.ok(r.erreurs.length > 0, nom);
  }
  assert.equal(core.validerCatalogue(null).ok, false);
  assert.equal(core.validerCatalogue("x").ok, false);
  assert.equal(core.validerCatalogue([]).ok, false);
});

/* ---------- Formatage et texte ---------- */

test("formaterPrix", () => {
  assert.equal(core.formaterPrix(0), "0 €");
  assert.equal(core.formaterPrix(3500), "35 €");
  assert.equal(core.formaterPrix(8450), "84,50 €");
  assert.equal(core.formaterPrix(8405), "84,05 €");
  assert.equal(core.formaterPrix(123456700), "1 234 567 €");
  for (const mauvais of [-1, 1.5, NaN, "100", null, undefined, Infinity]) {
    assert.throws(() => core.formaterPrix(mauvais), RangeError, String(mauvais));
  }
});

test("normaliser : casse, accents, apostrophes et espaces", () => {
  assert.equal(core.normaliser("  Rehausseur   D’ÉCRAN  "), "rehausseur d'ecran");
  assert.equal(core.normaliser("Éclairage"), "eclairage");
  assert.equal(core.normaliser(" Tapis\tde\nbureau "), "tapis de bureau");
  assert.equal(core.normaliser(null), "");
});

/* ---------- Recherche et filtres : comparaison à un oracle indépendant ---------- */

const sansAccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/’/g, "'");
function oracle(etat) {
  const mots = sansAccent(etat.q).split(/\s+/).filter(Boolean);
  const famNom = Object.fromEntries(brut.familles.map((f) => [f.id, f.nom]));
  const res = brut.modeles.filter((m) => {
    const prixMin = Math.min(...brut.references.filter((r) => r.modele === m.id).map((r) => r.prixCents));
    const foin = sansAccent([m.nom, m.description, famNom[m.famille]].join(" "));
    return (etat.famille === null || m.famille === etat.famille)
      && (etat.univers.length === 0 || etat.univers.some((u) => m.univers.includes(u)))
      && (etat.prix === null || prixMin <= etat.prix * 100)
      && mots.every((w) => foin.includes(w));
  });
  return res.map((m) => m.id);
}
const etat = (surcharge = {}) => ({ ...core.etatParDefaut(), ...surcharge });
const ids = (liste) => liste.map((m) => m.id);
const ensemble = (liste) => ids(liste).sort();

test("sans filtre : 20 modèles dans l'ordre éditorial (famille puis numéro)", () => {
  const r = core.filtrerModeles(cat, etat());
  assert.equal(r.length, 20);
  assert.deepEqual(ids(r), [
    "sup-01", "sup-02", "sup-03", "sup-04", "sup-05", "tap-01", "tap-02", "tap-03", "tap-04", "tap-05",
    "lum-01", "lum-02", "lum-03", "lum-04", "lum-05", "ran-01", "ran-02", "ran-03", "ran-04", "ran-05",
  ]);
});

test("recherche insensible à la casse, aux accents et aux espaces", () => {
  const attendu = ["sup-01"];
  for (const q of ["rehausseur", "REHAUSSEUR", "  rehausseur   d'ecran  ", "Rehausseur d’écran", "REHAUSSEUR   D'ÉCRAN"]) {
    assert.deepEqual(ids(core.filtrerModeles(cat, etat({ q: core.normaliser(q) === "" ? "" : q }))), attendu, q);
  }
  assert.deepEqual(ensemble(core.filtrerModeles(cat, etat({ q: "eclairage" }))), ensemble(core.filtrerModeles(cat, etat({ q: "ÉCLAIRAGE" }))));
  assert.equal(core.filtrerModeles(cat, etat({ q: "   " })).length, 20);
  assert.equal(core.filtrerModeles(cat, etat({ q: "zzzzz" })).length, 0);
});

test("la recherche couvre nom, description courte et famille", () => {
  assert.ok(ids(core.filtrerModeles(cat, etat({ q: "feutre" }))).includes("tap-04")); // nom
  assert.ok(ids(core.filtrerModeles(cat, etat({ q: "tiroirs" }))).includes("ran-05")); // description
  assert.equal(core.filtrerModeles(cat, etat({ q: "rangement" })).length, 6); // famille (5) + « Sous-main avec rangement »
  assert.equal(core.filtrerModeles(cat, etat({ q: "supports" })).length, 5);
});

test("filtres combinés (ET) et univers multiples (OU) = oracle sur 1 000+ combinaisons", () => {
  const familles = [null, "sup", "tap", "lum", "ran"];
  const univers = [[], ["ergonomie"], ["signature", "industriel"], ["essentiels", "ergonomie", "signature"], ["ergonomie", "essentiels", "signature", "industriel"]];
  const prix = [null, 50, 100, 150];
  const recherches = ["", "ecran", "  LAMPE ", "bureau", "d’ecran", "tapis feutre", "xyz", "lumineuse", "   ", "sous-main"];
  let n = 0;
  for (const famille of familles) for (const u of univers) for (const p of prix) for (const q of recherches) {
    const e = etat({ famille, univers: u, prix: p, q });
    const lu = core.filtrerModeles(cat, e);
    assert.deepEqual(ensemble(lu), oracle(e).sort(), JSON.stringify(e));
    assert.equal(new Set(ids(lu)).size, lu.length, "aucun doublon");
    n += 1;
  }
  assert.ok(n >= 1000, String(n));
});

test("un modèle présent dans deux univers cochés n'apparaît qu'une fois", () => {
  const r = core.filtrerModeles(cat, etat({ univers: ["ergonomie", "signature"] }));
  assert.equal(new Set(ids(r)).size, r.length);
  assert.ok(ids(r).includes("sup-03")); // Ergonomie + Signature + Industriel
  assert.equal(ids(r).filter((i) => i === "sup-03").length, 1);
});

test("plafond de prix : « à partir de » inclus", () => {
  assert.deepEqual(ensemble(core.filtrerModeles(cat, etat({ prix: 50 }))), oracle(etat({ prix: 50 })).sort());
  assert.ok(core.filtrerModeles(cat, etat({ prix: 50 })).every((m) => m.prixMinCents <= 5000));
  assert.ok(ids(core.filtrerModeles(cat, etat({ prix: 50 }))).includes("sup-04")); // 45 €
  assert.ok(!ids(core.filtrerModeles(cat, etat({ prix: 50 }))).includes("sup-02")); // 59 €
  assert.equal(core.filtrerModeles(cat, etat({ prix: 150 })).length, 19); // seul sup-03 (159 €) dépasse
});

test("tris : prix croissant/décroissant, nom, ex aequo départagés par l'identifiant", () => {
  const asc = core.filtrerModeles(cat, etat({ tri: "prix-asc" }));
  const desc = core.filtrerModeles(cat, etat({ tri: "prix-desc" }));
  const nom = core.filtrerModeles(cat, etat({ tri: "nom" }));
  for (let i = 1; i < asc.length; i += 1) {
    const [a, b] = [asc[i - 1], asc[i]];
    assert.ok(a.prixMinCents < b.prixMinCents || (a.prixMinCents === b.prixMinCents && a.id < b.id), `${a.id} / ${b.id}`);
    const [c, d] = [desc[i - 1], desc[i]];
    assert.ok(c.prixMinCents > d.prixMinCents || (c.prixMinCents === d.prixMinCents && c.id < d.id), `${c.id} / ${d.id}`);
    const [e, f] = [nom[i - 1], nom[i]];
    const [ne, nf] = [sansAccent(e.nom), sansAccent(f.nom)];
    assert.ok(ne < nf || (ne === nf && e.id < f.id), `${e.nom} / ${f.nom}`);
  }
  assert.equal(asc[0].id, "ran-03"); // 35 €
  assert.equal(desc[0].id, "sup-03"); // 159 €
  assert.equal(ids(asc.filter((m) => m.prixMinCents === 6900)).join(), "lum-04,sup-01,tap-03");
  assert.deepEqual(ensemble(asc), ensemble(desc));
  assert.equal(ids(core.filtrerModeles(cat, etat({ tri: "prix-asc", famille: "tap" }))).join(), "tap-01,tap-02,tap-04,tap-03,tap-05");
});

/* ---------- URL ---------- */

test("lireEtatCatalogue / ecrireEtatCatalogue : aller-retour et canonisation", () => {
  const { etat: e, ignores } = core.lireEtatCatalogue("?tri=prix-desc&univers=signature&univers=ergonomie&prix=100&famille=lum&q=%20%20lampe%20%20", cat);
  assert.deepEqual(ignores, []);
  assert.deepEqual(e, { q: "lampe", famille: "lum", univers: ["ergonomie", "signature"], prix: 100, tri: "prix-desc" });
  assert.equal(core.ecrireEtatCatalogue(e), "?q=lampe&famille=lum&univers=ergonomie&univers=signature&prix=100&tri=prix-desc");
  assert.deepEqual(core.lireEtatCatalogue(core.ecrireEtatCatalogue(e), cat).etat, e);
  assert.equal(core.ecrireEtatCatalogue(core.etatParDefaut()), "");
  const accent = etat({ q: "écran d’angle & co" });
  assert.deepEqual(core.lireEtatCatalogue(core.ecrireEtatCatalogue(accent), cat).etat, accent);
});

test("paramètres invalides ou inconnus : écartés et signalés, jamais devinés", () => {
  const lire = (s) => core.lireEtatCatalogue(s, cat);
  assert.deepEqual(lire("?famille=xxx"), { etat: etat(), ignores: ["famille"] });
  assert.deepEqual(lire("?famille=sup&famille=tap").ignores, ["famille"]);
  assert.equal(lire("?famille=sup&famille=tap").etat.famille, null);
  assert.deepEqual(lire("?univers=luxe&univers=signature"), { etat: etat({ univers: ["signature"] }), ignores: ["univers"] });
  assert.deepEqual(lire("?prix=75").ignores, ["prix"]);
  assert.deepEqual(lire("?prix=050").ignores, ["prix"]);
  assert.deepEqual(lire("?prix=-1").ignores, ["prix"]);
  assert.deepEqual(lire("?tri=hasard").ignores, ["tri"]);
  assert.deepEqual(lire("?q=" + "a".repeat(81)).ignores, ["q"]);
  assert.deepEqual(lire("?foo=bar"), { etat: etat(), ignores: ["paramètres inconnus"] });
  assert.deepEqual(lire("?famille=&prix=&tri=&univers=&q=").ignores, []);
  assert.deepEqual(lire("?__proto__=1&constructor=2").ignores, ["paramètres inconnus"]);
  assert.deepEqual(lire("?famille=%E0%A4%A").ignores, ["famille"]);
  assert.doesNotThrow(() => lire("?%"));
  assert.doesNotThrow(() => lire(""));
});

test("resoudreFiche : accès direct, valeurs par défaut et erreurs explicites", () => {
  const r = (s) => core.resoudreFiche(s, cat);
  let x = r("?modele=sup-03&variante=04");
  assert.equal(x.statut, "ok");
  assert.equal(x.reference.sku, "LP-SUP-03-04");
  assert.equal(r("?modele=tap-03").reference.sku, "LP-TAP-03-01");
  assert.equal(r("?sku=LP-RAN-05-03").reference.prixCents, 11100);
  assert.equal(r("?sku=LP-RAN-05-03&modele=ran-05&variante=03").statut, "ok");
  assert.equal(r("").statut, "aucun");
  assert.equal(r("?modele=zzz-01").statut, "modele-inconnu");
  assert.equal(r("?modele=SUP-03").statut, "modele-inconnu");
  assert.equal(r("?modele=sup-06").statut, "modele-inconnu");
  assert.equal(r("?variante=02").statut, "modele-manquant");
  x = r("?modele=sup-03&variante=05");
  assert.equal(x.statut, "variante-inconnue");
  assert.equal(x.modele.id, "sup-03");
  assert.equal(x.reference, null, "aucune variante substituée");
  assert.equal(r("?modele=sup-03&variante=1").statut, "variante-inconnue");
  assert.equal(r("?modele=sup-03&variante=").statut, "variante-inconnue");
  assert.equal(r("?sku=LP-SUP-03-09").statut, "sku-inconnu");
  assert.equal(r("?sku=lp-sup-03-04").statut, "sku-inconnu");
  assert.equal(r("?sku=LP-SUP-03-04&modele=sup-01").statut, "incoherent");
  assert.equal(r("?sku=LP-SUP-03-04&variante=01").statut, "incoherent");
  assert.equal(r("?modele=sup-01&modele=sup-02").statut, "invalide");
  assert.equal(r("?modele=sup-01&utm_source=x").statut, "ok");
  assert.deepEqual(r("?modele=sup-01&utm_source=x").ignores, ["paramètres inconnus"]);
  assert.equal(core.ecrireFiche(cat.parSku.get("LP-SUP-03-04")), "?modele=sup-03&variante=04");
  assert.equal(core.lienFiche("sup-03"), "produit.html?modele=sup-03");
});

/* ---------- HTML statique ↔ données (une seule vérité, contrôlée) ---------- */

const lirePage = (f) => fs.readFileSync(path.join(racineSite, f), "utf8");
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

test("catalogue.html : la liste de repli reprend exactement les 20 noms, famille par famille, dans l'ordre", () => {
  const html = lirePage("catalogue.html");
  const repli = html.slice(html.indexOf('id="repli"'), html.indexOf("</section>", html.indexOf('id="repli"')));
  const blocs = [...repli.matchAll(/<h3>(.+?)<\/h3>\s*<ul>([\s\S]*?)<\/ul>/g)];
  assert.deepEqual(blocs.map((b) => decode(b[1])), cat.familles.map((f) => f.nom));
  blocs.forEach((b, i) => {
    const noms = [...b[2].matchAll(/<li>(.+?)<\/li>/g)].map((m) => decode(m[1]));
    assert.deepEqual(noms, cat.modeles.filter((m) => m.famille === cat.familles[i].id).map((m) => m.nom));
  });
  assert.equal([...repli.matchAll(/<li>/g)].length, 20);
  assert.ok(!/€/.test(repli), "aucun prix dans le repli");
});

test("index.html : quatre familles liées au catalogue, comptes issus des données", () => {
  const html = lirePage("index.html");
  for (const f of cat.familles) {
    const n = cat.modeles.filter((m) => m.famille === f.id).length;
    assert.ok(html.includes(`href="catalogue.html?famille=${f.id}"`), f.id);
    assert.ok(html.includes(`<strong>${f.nom}</strong><span>${n} modèles · ${n * 4} références</span>`), f.id);
    assert.ok(core.lireEtatCatalogue(`?famille=${f.id}`, cat).ignores.length === 0);
  }
  assert.ok(html.includes("Quatre familles, 20 modèles"));
  assert.ok(html.includes("80 références"));
  assert.ok(!html.includes("404.html"), "le lien de démonstration vers la 404 est retiré");
});

test("publication.json : pages et fichiers publics présents, sans fichier de test ni de shared/", () => {
  const m = JSON.parse(lirePage("publication.json"));
  assert.equal(m.kind, "demo");
  assert.deepEqual(m.sharedFiles, []);
  for (const f of [...m.pages, ...m.publicFiles]) assert.ok(fs.existsSync(path.join(racineSite, f)), f);
  assert.ok(m.pages.includes("index.html") && m.pages.includes("404.html"));
  assert.ok(!m.publicFiles.some((f) => f.startsWith("tests/")));
  assert.deepEqual(new Set(m.publicFiles).size, m.publicFiles.length);
});

test("aucune page n'utilise innerHTML, eval, stockage navigateur ni URL externe dans les scripts", () => {
  for (const f of ["js/catalogue-core.js", "js/dom.js", "js/page-catalogue.js", "js/page-produit.js"]) {
    const src = lirePage(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|localStorage|sessionStorage|document\.cookie/.test(src), f);
    assert.ok(!/https?:\/\//.test(src), f);
  }
});


/* ---------- BQ-01 : le contrat de prix est vérifié par le validateur ---------- */

const rejete = (r, motif) => {
  assert.equal(r.ok, false);
  assert.ok(r.erreurs.length > 0);
  if (motif) assert.ok(r.erreurs.some((e) => motif.test(e)), r.erreurs.join(" | "));
};

test("BQ-01 : LP-SUP-03-04 à 1 centime est refusé (aucun catalogue valide, aucun index)", () => {
  const r = mutation((d) => { d.references.find((x) => x.sku === "LP-SUP-03-04").prixCents = 1; });
  rejete(r, /LP-SUP-03-04 : prix 1 centimes au lieu de 16900/);
  assert.equal(r.catalogue, undefined);
});

test("BQ-01 : chacun des 80 prix décalé d'un centime, en plus ou en moins, est refusé", () => {
  let n = 0;
  for (const ref of brut.references) {
    for (const delta of [1, -1]) {
      const r = mutation((d) => { d.references.find((x) => x.sku === ref.sku).prixCents += delta; });
      rejete(r, new RegExp(`${ref.sku} : prix`));
      n += 1;
    }
  }
  assert.equal(n, 160);
});

test("BQ-01 : prix de base décalé, manquant ou mal typé, et variante 01 ≠ base ou ≠ minimum, sont refusés", () => {
  for (const m of brut.modeles) {
    rejete(mutation((d) => { d.modeles.find((x) => x.id === m.id).prixBaseCents += 1; }), new RegExp(`${m.id}`));
    rejete(mutation((d) => { delete d.modeles.find((x) => x.id === m.id).prixBaseCents; }), /prix de base invalide/);
    rejete(mutation((d) => { d.modeles.find((x) => x.id === m.id).prixBaseCents = "6900"; }), /prix de base invalide/);
    rejete(mutation((d) => { d.modeles.find((x) => x.id === m.id).prixBaseCents = 0; }), /prix de base invalide/);
  }
  // Une variante moins chère que la 01 : refusée (prix hors règle) ; tous les prix de la famille décalés ensemble : refusés aussi.
  rejete(mutation((d) => { d.references.find((x) => x.sku === "LP-TAP-03-04").prixCents = 100; }), /LP-TAP-03-04/);
  rejete(mutation((d) => { for (const x of d.references.filter((y) => y.modele === "lum-01")) x.prixCents -= 100; }), /lum-01/);
});

test("BQ-01 : le catalogue livré reste accepté ; « à partir de » = prix de base = variante 01 = minimum", () => {
  for (const m of cat.modeles) {
    assert.equal(m.prixMinCents, m.prixBaseCents, m.id);
    assert.equal(m.references[0].prixCents, m.prixBaseCents, m.id);
    assert.ok(m.references.every((r) => r.prixCents >= m.prixBaseCents), m.id);
  }
  assert.deepEqual(
    ["LP-SUP-03-04", "LP-TAP-03-03", "LP-RAN-05-03"].map((k) => cat.parSku.get(k).prixCents),
    [16900, 8400, 11100]
  );
  assert.deepEqual(core.SUPPLEMENTS_CENTS.sup, [0, 0, 0, 1000]);
});

/* ---------- BQ-03 : JSON mal typé = échec contrôlé, jamais d'exception ---------- */

const MAUVAIS = ['{"toString":null}', '{"toString":null,"valueOf":null}', "[]", "[1]", "null", "true", "42", "1.5", '""', '{"a":1}', '"x"'];

/** Applique `fn` à chaque champ (récursivement) d'une copie du catalogue et rend le texte JSON résultant. */
function* chemins(valeur, chemin = []) {
  if (valeur !== null && typeof valeur === "object") {
    for (const k of Object.keys(valeur)) {
      yield [...chemin, k];
      yield* chemins(valeur[k], [...chemin, k]);
    }
  }
}

test("BQ-03 : l'id du premier modèle remplacé par {\"toString\":null} → échec contrôlé, pas d'exception", () => {
  const texte = JSON.stringify(brut).replace('"id":"sup-01"', '"id":{"toString":null}');
  const donnees = JSON.parse(texte);
  assert.equal(typeof donnees.modeles[0].id, "object");
  let r;
  assert.doesNotThrow(() => { r = core.validerCatalogue(donnees); });
  rejete(r, /identifiant/);
  assert.equal(r.catalogue, undefined);
});

test("BQ-03 : tout champ du catalogue remplacé par une valeur de mauvais type → jamais d'exception, jamais ok", () => {
  let n = 0;
  for (const chemin of chemins(brut)) {
    for (const mauvais of MAUVAIS) {
      const copie = structuredClone(brut);
      let cible = copie;
      for (const k of chemin.slice(0, -1)) cible = cible[k];
      cible[chemin.at(-1)] = JSON.parse(mauvais);
      let r;
      assert.doesNotThrow(() => { r = core.validerCatalogue(copie); }, `${chemin.join(".")} = ${mauvais}`);
      // Une chaîne peut être une valeur légitime (nom, marque…) ; tout autre type, sur un champ lu, doit être refusé.
      const lu = !["devise", "avis"].includes(chemin[0]);
      if (lu && typeof JSON.parse(mauvais) !== "string") assert.equal(r.ok, false, `${chemin.join(".")} = ${mauvais}`);
      n += 1;
    }
  }
  assert.ok(n > 3000, String(n));
});

test("BQ-03 : champs ajoutés ou supprimés, racines absurdes → échec contrôlé", () => {
  for (const racine of [undefined, null, 0, "x", true, [], [[]], () => 1, Symbol("s"), 10n]) {
    let r;
    assert.doesNotThrow(() => { r = core.validerCatalogue(racine); });
    assert.equal(r.ok, false);
  }
  const piege = { get id() { throw new Error("getter piégé"); } };
  const copie = structuredClone(brut);
  copie.modeles[0] = piege;
  let r;
  assert.doesNotThrow(() => { r = core.validerCatalogue(copie); });
  assert.equal(r.ok, false);
});

test("BQ-03 : chargerCatalogue transforme aussi une exception du validateur en échec", async () => {
  const fetchOrigine = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => JSON.parse('{"modeles":[{"id":{"toString":null}}]}') });
    const sansFiltre = await chargerCatalogue(core.validerCatalogue);
    assert.equal(sansFiltre.ok, false);
    const leve = await chargerCatalogue(() => { throw new TypeError("validateur défaillant"); });
    assert.equal(leve.ok, false);
    assert.ok(leve.erreurs.length > 0);
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => structuredClone(brut) });
    assert.equal((await chargerCatalogue(core.validerCatalogue)).ok, true);
    globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
    assert.equal((await chargerCatalogue(core.validerCatalogue)).ok, false);
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("json"); } });
    assert.equal((await chargerCatalogue(core.validerCatalogue)).ok, false);
  } finally {
    globalThis.fetch = fetchOrigine;
  }
});

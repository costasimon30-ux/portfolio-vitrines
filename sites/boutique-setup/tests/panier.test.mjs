/*
  Ligne Posée — contrôles Node natifs de la logique du panier et de la commande simulée (lot 2).
  Lancer : node --test sites/boutique-setup/tests/panier.test.mjs  (Node ≥ 22, aucune dépendance)

  Le stockage est simulé par un faux magasin capable de refuser, de perdre ou de corrompre une
  écriture. Les montants attendus sont recalculés ici à partir de data/catalogue.json, jamais
  repris du code testé. Ce dossier n'est ni listé dans publication.json ni publié.
*/

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validerCatalogue } from "../js/catalogue-core.js";
import * as p from "../js/panier-core.js";

const racineSite = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brut = JSON.parse(fs.readFileSync(path.join(racineSite, "data/catalogue.json"), "utf8"));
const lire = (f) => fs.readFileSync(path.join(racineSite, f), "utf8");
const resultat = validerCatalogue(structuredClone(brut));
assert.equal(resultat.ok, true);
const cat = resultat.catalogue;
const prixOracle = new Map(brut.references.map((r) => [r.sku, r.prixCents]));

/** Faux sessionStorage. Les options simulent les pannes : tout est lisible dans `donnees`. */
function faux(options = {}) {
  const donnees = new Map(Object.entries(options.initial ?? {}));
  let ecritures = 0;
  return {
    donnees,
    getItem(cle) {
      if (options.lectureRefusee) throw new Error("SecurityError");
      return donnees.has(cle) ? donnees.get(cle) : null;
    },
    setItem(cle, valeur) {
      ecritures += 1;
      if (options.ecritureRefusee?.(cle, ecritures)) throw new Error("QuotaExceededError");
      if (options.ecritureSilencieuse?.(cle, ecritures)) return;
      donnees.set(cle, String(valeur));
    },
    removeItem(cle) {
      if (options.suppressionRefusee?.(cle)) throw new Error("SecurityError");
      if (options.suppressionSilencieuse?.(cle)) return;
      donnees.delete(cle);
    },
  };
}
const AUTRE = "autre-site.preferences";
const avecAutre = (extra = {}) => faux({ ...extra, initial: { [AUTRE]: "ne pas toucher", ...(extra.initial ?? {}) } });
const SKU_A = "LP-SUP-03-04"; // 169,00 €
const SKU_B = "LP-LUM-01-02";
const SKU_C = "LP-TAP-01-01";

/* ---------- Montants, quantités, livraison ---------- */

test("formaterMontant : centimes entiers → euros avec deux décimales", () => {
  assert.equal(p.formaterMontant(0), "0,00\u00a0€");
  assert.equal(p.formaterMontant(5), "0,05\u00a0€");
  assert.equal(p.formaterMontant(490), "4,90\u00a0€");
  assert.equal(p.formaterMontant(990), "9,90\u00a0€");
  assert.equal(p.formaterMontant(500), "5,00\u00a0€");
  assert.equal(p.formaterMontant(16900), "169,00\u00a0€");
  assert.equal(p.formaterMontant(123456789), "1\u202f234\u202f567,89\u00a0€");
  for (const mauvais of [-1, 1.5, NaN, Infinity, "490", null, undefined, {}, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => p.formaterMontant(mauvais), RangeError);
  }
  assert.throws(() => p.formaterMontant({ toString: null }), RangeError);
});

test("lireQuantite : 1 et 99 admises ; 0, 100, fractions, texte et valeurs absurdes refusés", () => {
  for (const bonne of [1, 99, 50, "1", "99", " 7 ", "007", "07"]) assert.ok(p.lireQuantite(bonne) !== null, String(bonne));
  assert.equal(p.lireQuantite("007"), 7);
  for (const mauvaise of [0, 100, -1, 1.5, "1.5", "1,5", "0", "100", "abc", "", " ", "1e1", "+5", "-1", "0x10", NaN, Infinity, true, false, null, undefined, [], [1], {}, { toString: null }, 2 ** 53]) {
    assert.equal(p.lireQuantite(mauvaise), null, String(typeof mauvaise === "object" ? JSON.stringify(mauvaise) : mauvaise));
  }
});

test("livraison fictive : Standard 4,90 € / Express 9,90 €, écart de 5,00 €, sans seuil ni remise", () => {
  assert.deepEqual(p.LIVRAISONS.map((l) => [l.id, l.libelle, l.cents]), [["standard", "Standard", 490], ["express", "Express", 990]]);
  assert.equal(p.LIVRAISON_DEFAUT, "standard");
  for (const total of [1, 6900, 16900, 99999999]) {
    const s = p.calculerCommande(total, "standard");
    const e = p.calculerCommande(total, "express");
    assert.equal(s.totalCents, total + 490);
    assert.equal(e.totalCents, total + 990);
    assert.equal(e.totalCents - s.totalCents, 500);
    assert.equal(s.produitsCents, total);
  }
  for (const mauvais of ["", "Standard", "gratuit", null, undefined, 1, {}, { toString: null }]) {
    assert.equal(p.calculerCommande(6900, mauvais).ok, false);
  }
  assert.equal(p.calculerCommande(null, "standard").ok, false);
  assert.equal(p.calculerCommande(-5, "standard").ok, false);
  assert.equal(p.calculerCommande(1.5, "standard").ok, false);
});

/* ---------- Ajout ---------- */

test("ajout : le SKU exact, quantité 1 ; deux modèles différents → deux lignes", () => {
  const m = avecAutre();
  const a = p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_A });
  assert.equal(a.ok, true);
  assert.equal(a.quantite, 1);
  const b = p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_B });
  assert.equal(b.ok, true);
  const etat = p.lirePanier(m);
  assert.deepEqual(etat.lignes, [{ sku: SKU_A, quantity: 1 }, { sku: SKU_B, quantity: 1 }]);
  assert.equal(m.donnees.get(AUTRE), "ne pas toucher");
  assert.deepEqual([...m.donnees.keys()].sort(), [AUTRE, p.CLE_PANIER].sort());
});

test("ajout répété du même SKU : une seule ligne, quantité incrémentée, plafond 99", () => {
  const m = faux();
  for (let i = 1; i <= 99; i++) {
    const r = p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_A });
    assert.equal(r.ok, true, `ajout ${i}`);
    assert.equal(r.quantite, i);
  }
  assert.deepEqual(p.lirePanier(m).lignes, [{ sku: SKU_A, quantity: 99 }]);
  const refus = p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_A });
  assert.equal(refus.ok, false);
  assert.equal(refus.code, "plafond");
  assert.match(refus.message, /99/);
  assert.deepEqual(p.lirePanier(m).lignes, [{ sku: SKU_A, quantity: 99 }], "inchangé après refus");
});

test("ajout : chacun des 80 SKU du catalogue est ajoutable ; SKU inconnu ou mal formé refusé sans écriture", () => {
  assert.equal(brut.references.length, 80);
  for (const r of brut.references) {
    const m = faux();
    assert.equal(p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: r.sku }).ok, true, r.sku);
  }
  for (const mauvais of ["LP-SUP-09-09", "LP-XXX-01-01", "lp-sup-03-04", "", " LP-SUP-03-04", "LP-SUP-03-04 ", null, undefined, 42, {}, { toString: null }, ["LP-SUP-03-04"]]) {
    const m = faux();
    const r = p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: mauvais });
    assert.equal(r.ok, false);
    assert.equal(r.code, "sku-inconnu");
    assert.equal(m.donnees.size, 0, "aucune écriture");
  }
});

test("ajout : catalogue absent ou incomplet → refus, jamais d'écriture", () => {
  for (const mauvais of [null, undefined, {}, { parSku: [] }, { parSku: new Map() }]) {
    const m = faux();
    assert.equal(p.ajouterAuPanier({ magasin: m, catalogue: mauvais, sku: SKU_A }).ok, false);
    assert.equal(m.donnees.size, 0);
  }
});

/* ---------- Quantité, retrait, vidage ---------- */

test("quantité : 1 et 99 admises ; 0, 100, fraction, texte, SKU absent refusés sans modifier le panier", () => {
  const m = faux();
  p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_A });
  assert.equal(p.definirQuantite({ magasin: m, sku: SKU_A, valeur: 99 }).ok, true);
  assert.equal(p.definirQuantite({ magasin: m, sku: SKU_A, valeur: "1" }).ok, true);
  assert.equal(p.definirQuantite({ magasin: m, sku: SKU_A, valeur: "12" }).quantite, 12);
  for (const mauvaise of [0, "0", 100, "100", 1.5, "1.5", "abc", "", -3, null, undefined, NaN]) {
    const r = p.definirQuantite({ magasin: m, sku: SKU_A, valeur: mauvaise });
    assert.equal(r.ok, false, String(mauvaise));
    assert.equal(r.code, "quantite-invalide");
    assert.match(r.message, /1 à 99/);
    assert.deepEqual(p.lirePanier(m).lignes, [{ sku: SKU_A, quantity: 12 }]);
  }
  const absent = p.definirQuantite({ magasin: m, sku: SKU_B, valeur: 3 });
  assert.equal(absent.ok, false);
  assert.equal(absent.code, "ligne-absente");
});

test("retrait et panier vide : seule la clé du panier est touchée", () => {
  const m = avecAutre();
  p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_A });
  p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_B });
  assert.deepEqual(p.retirerDuPanier({ magasin: m, sku: SKU_A }).lignes, [{ sku: SKU_B, quantity: 1 }]);
  assert.equal(p.retirerDuPanier({ magasin: m, sku: SKU_A }).code, "ligne-absente");
  p.retirerDuPanier({ magasin: m, sku: SKU_B });
  assert.equal(p.lirePanier(m).statut, "vide");
  assert.equal(m.donnees.has(p.CLE_PANIER), false, "clé supprimée quand le panier est vide");
  p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_C });
  assert.equal(p.viderLePanier(m).ok, true);
  assert.equal(p.lirePanier(m).statut, "vide");
  assert.equal(m.donnees.get(AUTRE), "ne pas toucher");
  assert.deepEqual([...m.donnees.keys()], [AUTRE]);
});

/* ---------- Lecture du stockage ---------- */

test("analyserPanier : états corrompus ou invalides, jamais d'exception ni de correction silencieuse", () => {
  assert.equal(p.analyserPanier(null).statut, "vide");
  for (const corrompu of ["", "pas du json", "null", "[]", "42", '"x"', "{}", '{"v":2,"lignes":[]}', '{"v":1}', '{"v":1,"lignes":{}}', '{"v":"1","lignes":[]}', '{"v":1,"lignes":"x"}']) {
    assert.equal(p.analyserPanier(corrompu).statut, "corrompu", corrompu);
  }
  const trop = JSON.stringify({ v: 1, lignes: Array.from({ length: p.LIGNES_MAX + 1 }, (_, i) => ({ sku: `LP-SUP-01-0${(i % 4) + 1}`, quantity: 1 })) });
  assert.equal(p.analyserPanier(trop).statut, "corrompu");
  const ok = p.analyserPanier(JSON.stringify({ v: 1, lignes: [{ sku: SKU_A, quantity: 2 }] }));
  assert.deepEqual([ok.statut, ok.lignes, ok.rejets], ["ok", [{ sku: SKU_A, quantity: 2 }], []]);

  const cas = [
    [{ sku: SKU_A, quantity: 0 }, /quantité invalide/],
    [{ sku: SKU_A, quantity: 100 }, /quantité invalide/],
    [{ sku: SKU_A, quantity: 1.5 }, /quantité invalide/],
    [{ sku: SKU_A, quantity: "2" }, /quantité invalide/],
    [{ sku: SKU_A, quantity: null }, /quantité invalide/],
    [{ sku: SKU_A, quantity: { toString: null } }, /quantité invalide/],
    [{ sku: SKU_A }, /quantité invalide|champs/],
    [{ sku: SKU_A, quantity: 1, prixCents: 1 }, /champs inattendus/],
    [{ sku: "n'importe quoi", quantity: 1 }, /référence mal formée/],
    [{ sku: { toString: null }, quantity: 1 }, /référence mal formée/],
    [{ quantity: 1 }, /référence mal formée/],
    [42, /illisible/],
    [null, /illisible/],
    [[SKU_A, 1], /illisible/],
  ];
  for (const [ligne, motif] of cas) {
    const r = p.analyserPanier(JSON.stringify({ v: 1, lignes: [ligne] }));
    assert.equal(r.statut, "ok");
    assert.equal(r.lignes.length, 0, JSON.stringify(ligne));
    assert.equal(r.rejets.length, 1, JSON.stringify(ligne));
    assert.match(r.rejets[0].raison, motif, JSON.stringify(ligne));
  }
  const doublon = p.analyserPanier(JSON.stringify({ v: 1, lignes: [{ sku: SKU_A, quantity: 1 }, { sku: SKU_A, quantity: 2 }] }));
  assert.deepEqual(doublon.lignes, [{ sku: SKU_A, quantity: 1 }]);
  assert.match(doublon.rejets[0].raison, /double/);
});

test("analyserPanier : mutations aléatoires du JSON, aucune exception", () => {
  const base = JSON.stringify({ v: 1, lignes: [{ sku: SKU_A, quantity: 2 }, { sku: SKU_B, quantity: 99 }] });
  let graine = 12345;
  const alea = (n) => ((graine = (graine * 1103515245 + 12345) & 0x7fffffff) % n);
  const alphabet = '{}[]":,0123456789abcxyz-\\ nulltruefalse';
  for (let i = 0; i < 4000; i++) {
    let s = base;
    for (let k = 0, n = 1 + alea(4); k < n; k++) {
      const pos = alea(s.length);
      const mode = alea(3);
      const c = alphabet[alea(alphabet.length)];
      s = mode === 0 ? s.slice(0, pos) + c + s.slice(pos + 1) : mode === 1 ? s.slice(0, pos) + c + s.slice(pos) : s.slice(0, pos) + s.slice(pos + 1);
    }
    const r = p.analyserPanier(s);
    assert.ok(["vide", "corrompu", "ok"].includes(r.statut));
    for (const l of r.lignes) {
      assert.match(l.sku, /^LP-[A-Z]{3}-\d{2}-\d{2}$/);
      assert.ok(p.lireQuantite(l.quantity) !== null && typeof l.quantity === "number");
    }
  }
});

test("stockage absent ou refusé : états explicites, aucune exception", () => {
  assert.equal(p.obtenirMagasin(null), null);
  assert.equal(p.obtenirMagasin({}), null);
  assert.equal(p.obtenirMagasin({ sessionStorage: null }), null);
  assert.equal(p.obtenirMagasin({ get sessionStorage() { throw new Error("SecurityError"); } }), null);
  const ok = faux();
  assert.equal(p.obtenirMagasin({ sessionStorage: ok }), ok);

  for (const magasin of [null, faux({ lectureRefusee: true })]) {
    assert.equal(p.lirePanier(magasin).statut, "stockage-indisponible");
    assert.equal(p.ajouterAuPanier({ magasin, catalogue: cat, sku: SKU_A }).code, "stockage-indisponible");
    assert.equal(p.definirQuantite({ magasin, sku: SKU_A, valeur: 2 }).code, "stockage-indisponible");
    assert.equal(p.terminerSimulation({ magasin, catalogue: cat, livraisonId: "standard" }).code, "stockage-indisponible");
    assert.equal(p.lireConfirmation(magasin).statut, "stockage-indisponible");
  }
  assert.equal(p.viderLePanier(null).code, "stockage-indisponible");
});

test("écriture refusée, perdue en silence ou en quota : jamais présumée réussie, panier inchangé", () => {
  const refuse = faux({ ecritureRefusee: () => true });
  assert.equal(p.ajouterAuPanier({ magasin: refuse, catalogue: cat, sku: SKU_A }).code, "ecriture-echouee");
  assert.equal(refuse.donnees.size, 0);
  const silencieuse = faux({ ecritureSilencieuse: () => true });
  assert.equal(p.ajouterAuPanier({ magasin: silencieuse, catalogue: cat, sku: SKU_A }).code, "ecriture-echouee");

  const m = faux();
  p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_A });
  const apres = faux({ initial: Object.fromEntries(m.donnees), ecritureRefusee: () => true });
  for (const r of [
    p.ajouterAuPanier({ magasin: apres, catalogue: cat, sku: SKU_B }),
    p.definirQuantite({ magasin: apres, sku: SKU_A, valeur: 5 }),
  ]) {
    assert.equal(r.code, "ecriture-echouee");
    assert.match(r.message, /réessayer/);
  }
  assert.deepEqual(p.lirePanier(apres).lignes, [{ sku: SKU_A, quantity: 1 }]);
  const sansSuppression = faux({ initial: Object.fromEntries(m.donnees), suppressionRefusee: () => true });
  assert.equal(p.retirerDuPanier({ magasin: sansSuppression, sku: SKU_A }).code, "ecriture-echouee");
  assert.equal(p.viderLePanier(sansSuppression).code, "ecriture-echouee");
});

test("panier corrompu ou à lignes invalides : aucune modification tant qu'il n'est pas réparé explicitement", () => {
  const corrompu = faux({ initial: { [p.CLE_PANIER]: "{pas du json" } });
  for (const r of [
    p.ajouterAuPanier({ magasin: corrompu, catalogue: cat, sku: SKU_A }),
    p.definirQuantite({ magasin: corrompu, sku: SKU_A, valeur: 2 }),
    p.retirerDuPanier({ magasin: corrompu, sku: SKU_A }),
    p.terminerSimulation({ magasin: corrompu, catalogue: cat, livraisonId: "standard" }),
  ]) assert.equal(r.code, "panier-corrompu");
  assert.equal(corrompu.donnees.get(p.CLE_PANIER), "{pas du json", "intact");
  assert.equal(p.ecarterLignesInvalides({ magasin: corrompu, catalogue: cat }).code, "panier-corrompu");
  assert.equal(p.viderLePanier(corrompu).ok, true, "la réparation d'un panier illisible est le vidage explicite");
  assert.equal(p.lirePanier(corrompu).statut, "vide");

  const abime = JSON.stringify({ v: 1, lignes: [{ sku: SKU_A, quantity: 2 }, { sku: SKU_B, quantity: 500 }, { sku: "LP-SUP-09-09", quantity: 1 }] });
  const m = avecAutre({ initial: { [p.CLE_PANIER]: abime } });
  assert.equal(p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_C }).code, "panier-a-reparer");
  assert.equal(p.terminerSimulation({ magasin: m, catalogue: cat, livraisonId: "standard" }).code, "panier-a-reparer");
  assert.equal(m.donnees.get(p.CLE_PANIER), abime, "rien n'a changé");
  const rep = p.ecarterLignesInvalides({ magasin: m, catalogue: cat });
  assert.equal(rep.ok, true);
  assert.equal(rep.ecartees, 2);
  assert.deepEqual(p.lirePanier(m).lignes, [{ sku: SKU_A, quantity: 2 }], "la ligne valide est conservée à l'identique, rien n'est substitué");
  assert.equal(m.donnees.get(AUTRE), "ne pas toucher");
});

/* ---------- Vérification contre le catalogue ---------- */

test("verifierPanier : prix et libellés relus du catalogue ; total = Σ prix × quantité en centimes", () => {
  const lignes = [{ sku: SKU_A, quantity: 2 }, { sku: SKU_B, quantity: 99 }, { sku: SKU_C, quantity: 1 }];
  const v = p.verifierPanier({ lignes, rejets: [] }, cat);
  assert.equal(v.fiable, true);
  assert.equal(v.problemes.length, 0);
  let attendu = 0;
  for (const l of lignes) {
    const ligne = v.lignes.find((x) => x.sku === l.sku);
    const ref = brut.references.find((r) => r.sku === l.sku);
    const modele = brut.modeles.find((m) => m.id === ref.modele);
    assert.equal(ligne.prixCents, prixOracle.get(l.sku));
    assert.equal(ligne.sousTotalCents, prixOracle.get(l.sku) * l.quantity);
    assert.equal(ligne.modeleNom, modele.nom);
    assert.ok(ligne.finition.startsWith(ref.libelle));
    attendu += prixOracle.get(l.sku) * l.quantity;
  }
  assert.equal(v.totalProduitsCents, attendu);
  assert.equal(attendu, 16900 * 2 + prixOracle.get(SKU_B) * 99 + prixOracle.get(SKU_C));
  assert.equal(v.lignes.map((l) => l.sku).join(), `${SKU_A},${SKU_B},${SKU_C}`, "ordre du panier conservé");
});

test("verifierPanier : référence disparue, rejet du stockage ou panier vide → aucun total présenté comme fiable", () => {
  const v = p.verifierPanier({ lignes: [{ sku: SKU_A, quantity: 1 }, { sku: "LP-SUP-09-09", quantity: 1 }], rejets: [] }, cat);
  assert.equal(v.fiable, false);
  assert.equal(v.totalProduitsCents, null);
  assert.deepEqual(v.problemes.map((x) => [x.sku, x.source]), [["LP-SUP-09-09", "catalogue"]]);
  assert.equal(v.lignes.length, 1);
  const r = p.verifierPanier({ lignes: [{ sku: SKU_A, quantity: 1 }], rejets: [{ sku: SKU_B, raison: "quantité invalide" }] }, cat);
  assert.equal(r.fiable, false);
  assert.equal(r.totalProduitsCents, null);
  assert.equal(p.verifierPanier({ lignes: [], rejets: [] }, cat).fiable, false);
  assert.equal(p.verifierPanier({ lignes: [{ sku: SKU_A, quantity: 1 }], rejets: [] }, null).fiable, false);
});

/* ---------- Finalisation ---------- */

function panierPret(extra) {
  const m = avecAutre(extra);
  p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_A });
  p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_A });
  p.ajouterAuPanier({ magasin: m, catalogue: cat, sku: SKU_B });
  return m;
}

test("parcours complet : une seule simulation, capture figée et cohérente, panier vidé", () => {
  const m = panierPret();
  const r = p.terminerSimulation({ magasin: m, catalogue: cat, livraisonId: "express" });
  assert.equal(r.ok, true);
  const c = r.capture;
  const produits = 2 * prixOracle.get(SKU_A) + prixOracle.get(SKU_B);
  assert.equal(c.produitsCents, produits);
  assert.equal(c.livraison.cents, 990);
  assert.equal(c.totalCents, produits + 990);
  assert.deepEqual(c.lignes.map((l) => [l.sku, l.quantite]), [[SKU_A, 2], [SKU_B, 1]]);
  assert.equal(p.lirePanier(m).statut, "vide");
  const lue = p.lireConfirmation(m);
  assert.equal(lue.statut, "ok");
  assert.deepEqual(lue.capture, c);
  assert.deepEqual([...m.donnees.keys()].sort(), [AUTRE, p.CLE_CONFIRMATION].sort(), "aucune autre clé créée");
  assert.equal(m.donnees.get(AUTRE), "ne pas toucher");
});

test("double activation, rechargement ou retour sur la commande : aucune seconde réussite ni second montant", () => {
  const m = panierPret();
  const premiere = p.terminerSimulation({ magasin: m, catalogue: cat, livraisonId: "standard" });
  const figee = m.donnees.get(p.CLE_CONFIRMATION);
  assert.equal(premiere.ok, true);
  for (let i = 0; i < 3; i++) {
    const encore = p.terminerSimulation({ magasin: m, catalogue: cat, livraisonId: "express" });
    assert.equal(encore.ok, false);
    assert.equal(encore.code, "panier-vide");
  }
  assert.equal(m.donnees.get(p.CLE_CONFIRMATION), figee, "la capture reste celle de la première validation (Standard)");
  assert.equal(p.lireConfirmation(m).capture.livraison.id, "standard");
});

test("la capture ne dépend pas de ce qui est affiché : revérifiée contre le catalogue au moment de terminer", () => {
  const m = panierPret();
  const autre = structuredClone(brut);
  autre.references.find((r) => r.sku === SKU_B).prixCents += 100; // prix incohérent : le catalogue devient invalide
  assert.equal(validerCatalogue(autre).ok, false);
  assert.equal(p.terminerSimulation({ magasin: m, catalogue: null, livraisonId: "standard" }).code, "catalogue-invalide");
  assert.equal(m.donnees.has(p.CLE_CONFIRMATION), false);
  assert.equal(p.lirePanier(m).lignes.length, 2, "panier intact");
});

test("panier vide, livraison inconnue, SKU disparu : refus explicites, aucune capture", () => {
  const vide = faux();
  assert.equal(p.terminerSimulation({ magasin: vide, catalogue: cat, livraisonId: "standard" }).code, "panier-vide");
  const m = panierPret();
  for (const mauvais of [undefined, "", "gratuit", "EXPRESS", null, {}]) {
    assert.equal(p.terminerSimulation({ magasin: m, catalogue: cat, livraisonId: mauvais }).code, "livraison-invalide");
  }
  assert.equal(m.donnees.has(p.CLE_CONFIRMATION), false);
  const disparu = faux({ initial: { [p.CLE_PANIER]: JSON.stringify({ v: 1, lignes: [{ sku: "LP-SUP-09-09", quantity: 1 }] }) } });
  assert.equal(p.terminerSimulation({ magasin: disparu, catalogue: cat, livraisonId: "standard" }).code, "panier-a-reparer");
  assert.equal(disparu.donnees.has(p.CLE_CONFIRMATION), false);
});

test("erreur d'écriture en finalisation : aucun succès, panier intact, nouvelle tentative sans doublon", () => {
  const scenarios = {
    "écriture de la capture refusée": { ecritureRefusee: (cle) => cle === p.CLE_CONFIRMATION },
    "écriture de la capture perdue en silence": { ecritureSilencieuse: (cle) => cle === p.CLE_CONFIRMATION },
    "suppression du panier refusée": { suppressionRefusee: (cle) => cle === p.CLE_PANIER },
    "suppression du panier sans effet": { suppressionSilencieuse: (cle) => cle === p.CLE_PANIER },
  };
  for (const [nom, panne] of Object.entries(scenarios)) {
    const m = panierPret();
    const avant = m.donnees.get(p.CLE_PANIER);
    let active = true;
    const defaillant = {
      donnees: m.donnees,
      getItem: (c) => m.getItem(c),
      setItem: (c, v) => (active && panne.ecritureRefusee?.(c) ? (() => { throw new Error("Quota"); })() : active && panne.ecritureSilencieuse?.(c) ? undefined : m.setItem(c, v)),
      removeItem: (c) => (active && panne.suppressionRefusee?.(c) ? (() => { throw new Error("Refus"); })() : active && panne.suppressionSilencieuse?.(c) ? undefined : m.removeItem(c)),
    };
    const echec = p.terminerSimulation({ magasin: defaillant, catalogue: cat, livraisonId: "standard" });
    assert.equal(echec.ok, false, nom);
    assert.equal(echec.code, "ecriture-echouee", nom);
    assert.equal(echec.capture, undefined, nom);
    assert.equal(m.donnees.get(p.CLE_PANIER), avant, `${nom} : panier intact`);
    assert.equal(m.donnees.has(p.CLE_CONFIRMATION), false, `${nom} : aucune capture résiduelle`);
    active = false; // la panne disparaît : on retente
    const ok = p.terminerSimulation({ magasin: defaillant, catalogue: cat, livraisonId: "standard" });
    assert.equal(ok.ok, true, `${nom} : nouvelle tentative`);
    assert.equal(p.lirePanier(m).statut, "vide");
    assert.equal(p.lireConfirmation(m).statut, "ok");
    assert.deepEqual([...m.donnees.keys()].sort(), [AUTRE, p.CLE_CONFIRMATION].sort(), nom);
  }
});

/* ---------- Capture de confirmation ---------- */

test("analyserCapture : arrivée directe, capture illisible ou incohérente → jamais de succès", () => {
  assert.equal(p.analyserCapture(null).statut, "absente");
  assert.equal(p.lireConfirmation(faux()).statut, "absente");
  const m = panierPret();
  p.terminerSimulation({ magasin: m, catalogue: cat, livraisonId: "standard" });
  const bonne = JSON.parse(m.donnees.get(p.CLE_CONFIRMATION));
  assert.equal(p.analyserCapture(JSON.stringify(bonne)).statut, "ok");
  const trafics = [
    (c) => { c.totalCents += 1; },
    (c) => { c.produitsCents -= 1; },
    (c) => { c.lignes[0].sousTotalCents += 1; },
    (c) => { c.lignes[0].prixCents += 1; },
    (c) => { c.lignes[0].quantite = 0; },
    (c) => { c.lignes[0].quantite = 100; },
    (c) => { c.lignes[0].quantite = 1.5; },
    (c) => { c.lignes[0].sku = "n'importe quoi"; },
    (c) => { c.lignes[1].sku = c.lignes[0].sku; },
    (c) => { c.lignes[0].modele = ""; },
    (c) => { c.lignes = []; },
    (c) => { c.livraison.cents = 0; },
    (c) => { c.livraison.id = "gratuit"; },
    (c) => { c.livraison.libelle = "Express"; },
    (c) => { c.livraison = null; },
    (c) => { c.v = 2; },
  ];
  for (const [i, trafic] of trafics.entries()) {
    const c = structuredClone(bonne);
    trafic(c);
    assert.equal(p.analyserCapture(JSON.stringify(c)).statut, "illisible", `trafic ${i}`);
  }
  for (const texte of ["", "x", "null", "[]", "{}", "{\"v\":1}"]) assert.equal(p.analyserCapture(texte).statut, "illisible", texte);
});

test("analyserCapture : mutations aléatoires, aucune exception", () => {
  const m = panierPret();
  p.terminerSimulation({ magasin: m, catalogue: cat, livraisonId: "express" });
  const base = m.donnees.get(p.CLE_CONFIRMATION);
  let graine = 777;
  const alea = (n) => ((graine = (graine * 1103515245 + 12345) & 0x7fffffff) % n);
  for (let i = 0; i < 4000; i++) {
    const pos = alea(base.length);
    const s = base.slice(0, pos) + "0123456789{}[]\":,x"[alea(18)] + base.slice(pos + 1);
    const r = p.analyserCapture(s);
    assert.ok(["absente", "illisible", "ok"].includes(r.statut));
  }
});

/* ---------- Garde-fous de source ---------- */

test("sources du lot 2 : pas de réseau métier, cookie, innerHTML, eval, autre stockage ni URL externe", () => {
  const fichiers = ["js/panier-core.js", "js/panier-ui.js", "js/attente-page.js", "js/page-panier.js", "js/page-commande.js", "js/page-confirmation.js", "js/page-produit.js", "js/panier-ui.js"];
  for (const f of fichiers) {
    const src = lire(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|localStorage|document\.cookie|indexedDB|XMLHttpRequest|sendBeacon|WebSocket/.test(src), f);
    assert.ok(!/https?:\/\//.test(src), f);
    if (f !== "js/page-produit.js") assert.ok(!/\bfetch\(/.test(src), `${f} : aucune requête (le catalogue passe par chargerCatalogue)`);
  }
  const clefs = lire("js/panier-core.js").match(/lignePosee\.[\w.]+/g) ?? [];
  assert.deepEqual([...new Set(clefs)].sort(), [p.CLE_CONFIRMATION, p.CLE_PANIER].sort());
});

test("pages du parcours : aucun champ personnel ni de paiement, aucune ressource externe", () => {
  for (const f of ["panier.html", "commande.html", "confirmation.html"]) {
    const html = lire(f);
    assert.ok(!/type="(email|tel|password|number)"|autocomplete|name="(nom|prenom|adresse|email|telephone|carte)/i.test(html), `${f} : pas de champ personnel dans le HTML statique`);
    assert.ok(!/(src|href)="https?:/.test(html), f);
    assert.ok(!/<img\b|<picture|<video|<audio|url\(/i.test(html), `${f} : aucune image`);
  }
  for (const f of ["js/page-panier.js", "js/page-commande.js", "js/page-confirmation.js", "js/page-produit.js", "js/panier-ui.js"]) {
    const src = lire(f);
    assert.ok(!/type:\s*"(email|tel|password|text)"|autocomplete|"nom"|"prenom"|"adresse"|"telephone"|"carte"/i.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), `${f} : aucun champ personnel`);
  }
});


/* ---------- Attente de la page : js/attente-page.js dans un faux document, horloge simulée ---------- */

async function lancerAttentePage({ demarrerAvant = false } = {}) {
  const { default: vm } = await import("node:vm");
  const attrs = new Set();
  const classes = new Set();
  const minuteurs = [];
  const ecouteurs = { doc: {}, win: {} };
  const racine = {
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) },
    setAttribute: (a) => attrs.add(a),
    hasAttribute: (a) => attrs.has(a),
  };
  const document = { documentElement: racine, addEventListener: (t, f) => { (ecouteurs.doc[t] ??= []).push(f); } };
  const window = { addEventListener: (t, f) => { (ecouteurs.win[t] ??= []).push(f); } };
  vm.runInNewContext(lire("js/attente-page.js"), { document, window, setTimeout: (f, ms) => minuteurs.push({ f, ms }) });
  if (demarrerAvant) racine.setAttribute("data-page-module");
  return {
    etat: () => ({ attente: classes.has("page-attente"), repli: attrs.has("data-page-repli") }),
    avancer: (ms) => minuteurs.filter((m) => m.ms <= ms).sort((a, b) => a.ms - b.ms).forEach((m) => m.f()),
    ecouteurs,
  };
}

test("attente de page : classe posée avant rendu ; module absent à 2 s ou en échec → repli définitif, liens libérés", async () => {
  const a = await lancerAttentePage();
  assert.deepEqual(a.etat(), { attente: true, repli: false });
  a.avancer(2000);
  assert.deepEqual(a.etat(), { attente: false, repli: true });
  for (const [cible, type, ev] of [["doc", "error", { target: { tagName: "SCRIPT" } }], ["win", "error", {}], ["win", "load", {}]]) {
    const b = await lancerAttentePage();
    for (const f of b.ecouteurs[cible][type]) f(ev);
    assert.deepEqual(b.etat(), { attente: false, repli: true }, `${cible}:${type}`);
  }
  const c = await lancerAttentePage();
  for (const f of c.ecouteurs.doc.error) f({ target: { tagName: "IMG" } });
  assert.equal(c.etat().repli, false, "l'erreur d'une image n'est pas un échec du module");
});

test("attente de page : module démarré → pas de repli à 2 s (catalogue lent admis), sécurité à 8 s sans repli", async () => {
  const a = await lancerAttentePage({ demarrerAvant: true });
  a.avancer(2000);
  assert.deepEqual(a.etat(), { attente: true, repli: false });
  for (const f of a.ecouteurs.win.load) f({});
  for (const f of a.ecouteurs.doc.error) f({ target: { tagName: "SCRIPT" } });
  assert.equal(a.etat().repli, false);
  a.avancer(8000);
  assert.deepEqual(a.etat(), { attente: false, repli: false });
});

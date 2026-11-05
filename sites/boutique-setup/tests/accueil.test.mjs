/*
  Visuel d'ouverture de l'accueil renouvelé à chaque chargement (docs/DIRECTION.md, décision du 5 novembre 2026).
  Cohérence de la liste avec le catalogue et js/visuels.js, puis comportement réel de js/visuel-accueil.js dans un
  faux document (tirage, mémoire de l'onglet, stockage indisponible). Ne remplace pas la recette navigateur.
*/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { cheminsVisuel, texteAlternatif } from "../js/visuels.js";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lire = (f) => fs.readFileSync(path.join(racine, f), "utf8");
const source = lire("js/visuel-accueil.js");
const catalogue = JSON.parse(lire("data/catalogue.json"));
const LISTE = [...source.matchAll(/\["([a-z]{3}-\d{2})", "([^"]+)", "([^"]+)"\]/g)].map((m) => ({ id: m[1], nom: m[2], desc: m[3] }));
// Objets rognés par le cadre 4:3 du héros (planche de contrôle du 5 novembre 2026) : exclus du tirage.
const ROGNES = ["sup-03", "sup-04", "sup-05", "lum-01", "lum-03", "ran-04"];

test("liste : 14 produits existants, noms du catalogue, descriptions de js/visuels.js, fichiers présents", () => {
  assert.equal(LISTE.length, 14);
  assert.equal(new Set(LISTE.map((v) => v.id)).size, 14);
  for (const v of LISTE) {
    const modele = catalogue.modeles.find((m) => m.id === v.id);
    assert.ok(modele, v.id);
    assert.equal(v.nom, modele.nom, `${v.id} : nom du catalogue`);
    assert.equal(`${v.nom}, illustration générée : ${v.desc}.`, texteAlternatif(modele), `${v.id} : alt identique aux cartes et fiches`);
    for (const f of cheminsVisuel(v.id)) assert.ok(fs.existsSync(path.join(racine, f)), f);
    assert.ok(!ROGNES.includes(v.id), `${v.id} : objet rogné dans le cadre 4:3`);
  }
  assert.deepEqual([...new Set(LISTE.map((v) => v.id.slice(0, 3)))], ["sup", "tap", "lum", "ran"], "les quatre familles");
});

test("accueil : vrai <img> de repli sup-01 dans le HTML, script synchrone juste après dans le cadre, publié", () => {
  const html = lire("index.html");
  const cadre = html.match(/<div class="hero__cadre">([\s\S]*?)<\/div>/)[1];
  assert.ok(!/<noscript/.test(cadre), "repli visible même si le script est bloqué");
  assert.match(cadre, /<img src="assets\/produits\/sup-01-640\.webp"[^>]*alt="Rehausseur d’écran, illustration générée : [^"]+">\s*<script src="js\/visuel-accueil\.js"><\/script>\s*$/);
  assert.ok(JSON.parse(lire("publication.json")).publicFiles.includes("js/visuel-accueil.js"));
  for (const f of ["catalogue.html", "produit.html", "panier.html", "commande.html", "confirmation.html", "404.html"]) assert.ok(!lire(f).includes("visuel-accueil"), `${f} inchangé`);
});

const REPLI = { src: "assets/produits/sup-01-640.webp", alt: "Rehausseur d’écran, illustration générée : plateau rectangulaire allongé posé sur deux pieds bas, avec un espace libre dessous." };
function charger({ stockage = new Map(), stockageCasse = false, hasard = Math.random } = {}) {
  // Faux <img> de repli du HTML, juste avant le script : le script le modifie sur place.
  const attrs = {};
  const img = { tagName: "IMG", src: REPLI.src, srcset: "repli", alt: REPLI.alt, attrs, setAttribute: (a, v) => { attrs[a] = String(v); } };
  const script = { previousElementSibling: img };
  const sessionStorage = {
    getItem: (k) => { if (stockageCasse) throw new Error("SecurityError"); return stockage.has(k) ? stockage.get(k) : null; },
    setItem: (k, v) => { if (stockageCasse) throw new Error("SecurityError"); stockage.set(k, v); },
  };
  const math = Object.create(Math);
  math.random = hasard;
  vm.runInNewContext(source, { document: { currentScript: script }, window: { sessionStorage }, Math: math });
  return img;
}

test("image de repli modifiée sur place : src, srcset et alt du même produit", () => {
  for (let i = 0; i < LISTE.length; i++) {
    const img = charger({ hasard: () => (i + 0.5) / LISTE.length });
    const v = LISTE.find((x) => x.id === img.attrs["data-visuel"]);
    assert.ok(v);
    assert.equal(img.src, `assets/produits/${v.id}-640.webp`);
    assert.equal(img.srcset, `assets/produits/${v.id}-320.webp 320w, assets/produits/${v.id}-640.webp 640w, assets/produits/${v.id}-960.webp 960w`);
    assert.equal(img.alt, `${v.nom}, illustration générée : ${v.desc}.`);
  }
});

test("rechargements successifs dans un onglet : jamais deux fois de suite le même visuel ; tous atteignables", () => {
  const stockage = new Map();
  let precedent = null;
  const vus = new Set();
  for (let i = 0; i < 400; i++) {
    const id = charger({ stockage }).attrs["data-visuel"];
    assert.notEqual(id, precedent, `chargement ${i}`);
    precedent = id;
    vus.add(id);
  }
  assert.equal(vus.size, LISTE.length);
  // Même le dernier tirage possible (hasard proche de 1) évite le visuel précédent.
  stockage.set("ligne-posee-visuel-accueil", "ran-05");
  assert.notEqual(charger({ stockage, hasard: () => 0.9999 }).attrs["data-visuel"], "ran-05");
});

test("stockage indisponible : tirage sans mémoire ; erreur → l'image de repli sup-01 reste intacte", () => {
  const img = charger({ stockageCasse: true, hasard: () => 0.5 });
  assert.ok(LISTE.some((v) => v.id === img.attrs["data-visuel"]));
  const repli = charger({ hasard: () => { throw new Error("hasard indisponible"); } });
  assert.deepEqual([repli.src, repli.srcset, repli.alt, repli.attrs["data-visuel"]], [REPLI.src, "repli", REPLI.alt, undefined]);
});

/*
  Ligne Posée — contrôles Node natifs des visuels produits (20 modèles, illustrations générées).
  Lancer : node --test sites/boutique-setup/tests/visuels.test.mjs  (Node ≥ 22, aucune dépendance)
  Vérifie sur disque : une image par modèle, trois largeurs carrées, manifeste de publication, textes
  alternatifs sans promesse de finition, mentions. Ce dossier n'est ni listé dans publication.json ni publié.
*/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aUnVisuel, cheminsVisuel, texteAlternatif, MENTION_CARTE, MENTION_FICHE } from "../js/visuels.js";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogue = JSON.parse(fs.readFileSync(path.join(racine, "data/catalogue.json"), "utf8"));
const manifeste = JSON.parse(fs.readFileSync(path.join(racine, "publication.json"), "utf8"));
const lire = (f) => fs.readFileSync(path.join(racine, f), "utf8");

/** Dimensions d'un WebP avec perte (« VP8 »), sans dépendance. */
function dimensionsWebp(fichier) {
  const b = fs.readFileSync(path.join(racine, fichier));
  assert.equal(b.toString("ascii", 0, 4), "RIFF", fichier);
  assert.equal(b.toString("ascii", 8, 12), "WEBP", fichier);
  assert.equal(b.toString("ascii", 12, 16), "VP8 ", `${fichier} : WebP avec perte attendu`);
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
}

test("20 modèles, 20 visuels : chaque modèle a ses trois largeurs, carrées, listées au manifeste", () => {
  assert.equal(catalogue.modeles.length, 20);
  for (const m of catalogue.modeles) {
    assert.ok(aUnVisuel(m.id), m.id);
    const chemins = cheminsVisuel(m.id);
    assert.deepEqual(chemins, [320, 640, 960].map((l) => `assets/produits/${m.id}-${l}.webp`));
    for (const [i, c] of chemins.entries()) {
      assert.ok(fs.existsSync(path.join(racine, c)), c);
      assert.deepEqual(dimensionsWebp(c), { w: [320, 640, 960][i], h: [320, 640, 960][i] }, c);
      assert.ok(manifeste.publicFiles.includes(c), `${c} absent de publication.json`);
      assert.ok(fs.statSync(path.join(racine, c)).size < 150 * 1024, `${c} trop lourd`);
    }
  }
});

test("aucun fichier d'image orphelin ou manquant ; le manifeste ne liste que des ressources existantes", () => {
  const attendus = new Set(catalogue.modeles.flatMap((m) => cheminsVisuel(m.id)).map((c) => path.basename(c)));
  const presents = fs.readdirSync(path.join(racine, "assets/produits"));
  assert.equal(attendus.size, 60);
  assert.deepEqual([...presents].sort(), [...attendus].sort());
  const images = manifeste.publicFiles.filter((f) => f.startsWith("assets/produits/"));
  assert.equal(images.length, 60);
  assert.equal(new Set(manifeste.publicFiles).size, manifeste.publicFiles.length, "pas de doublon");
  for (const f of manifeste.publicFiles) assert.ok(fs.existsSync(path.join(racine, f)), f);
  assert.ok(manifeste.publicFiles.includes("js/visuels.js"));
  assert.ok(!manifeste.publicFiles.some((f) => /NOTICE|\.png$/i.test(f)), "notice locale et PNG maîtres non publiés");
});

test("les 20 images sont distinctes entre elles (aucun visuel dupliqué d'un modèle à l'autre)", () => {
  const vus = new Map();
  for (const m of catalogue.modeles) {
    const contenu = fs.readFileSync(path.join(racine, `assets/produits/${m.id}-960.webp`)).toString("base64");
    assert.ok(!vus.has(contenu), `${m.id} identique à ${vus.get(contenu)}`);
    vus.set(contenu, m.id);
  }
});

test("textes alternatifs : nom du modèle, « illustration générée », aucune couleur ni finition de variante", () => {
  const interdits = new Set();
  for (const r of catalogue.references) for (const mot of r.libelle.toLowerCase().split(/[^a-zàâçéèêëîïôûùüÿœ0-9]+/)) if (mot.length > 2) interdits.add(mot);
  for (const mot of ["noir", "noire", "graphite", "blanc", "blanche", "sable", "aluminium", "chaude", "neutre", "mat", "satiné", "brossé", "gris", "clair", "couleur", "teinte"]) interdits.add(mot);
  interdits.delete("compact"); interdits.delete("grand"); interdits.delete("petit"); interdits.delete("format"); // tailles d'objets, pas de finition
  for (const m of catalogue.modeles) {
    const alt = texteAlternatif(m);
    assert.ok(alt.startsWith(`${m.nom}, illustration générée : `), alt);
    assert.ok(alt.length > 40 && alt.length < 160, alt);
    const mots = alt.toLowerCase().replace(m.nom.toLowerCase(), "").split(/[^a-zàâçéèêëîïôûùüÿœ0-9]+/);
    const trouves = mots.filter((x) => x.length > 2 && interdits.has(x) && !["compact", "grand", "petit", "format"].includes(x));
    assert.deepEqual(trouves, [], `${m.id} : ${alt}`);
  }
});

test("mentions : visuel d'illustration généré + variante non représentée, cartes et fiche", () => {
  assert.match(MENTION_CARTE, /illustration généré/);
  assert.match(MENTION_CARTE, /non représentées/);
  assert.match(MENTION_FICHE, /illustration généré/);
  assert.match(MENTION_FICHE, /variante sélectionnée.*n’est pas représentée/);
});

test("aucun texte résiduel ne prétend « pas encore d'images » ; l'accueil n'a qu'une image (sup-01) et ses deux sections", () => {
  for (const f of ["index.html", "catalogue.html", "produit.html", "404.html", "js/page-produit.js", "js/page-catalogue.js", "css/style.css"]) {
    assert.ok(!/Visuel à venir|Aucune photographie validée|Pas encore de photographies|« à venir »/.test(lire(f)), f);
  }
  const accueil = lire("index.html");
  assert.ok(!/<picture/i.test(accueil));
  const images = accueil.match(/<img\b[^>]*>/g) ?? [];
  assert.equal(images.length, 1, "une seule image sur l'accueil : le visuel d'ouverture");
  assert.match(images[0], /srcset="assets\/produits\/sup-01-320\.webp 320w, assets\/produits\/sup-01-640\.webp 640w, assets\/produits\/sup-01-960\.webp 960w"/);
  assert.match(images[0], /width="960"[^>]*height="640"/, "ratio 3:2 réservé avant chargement");
  assert.match(images[0], /alt="Rehausseur d’écran, illustration générée : [^"]+"/);
  assert.ok(!/noir|graphite|blanc|aluminium|mat\b/i.exec(images[0].match(/alt="([^"]*)"/)[1]), "alt sans finition");
  assert.equal((accueil.match(/<section\b/g) ?? []).length, 2, "l'accueil garde ses deux sections");
});

test("accueil « Le bureau prend forme » : ordre de lecture, textes validés, un seul bouton vers le catalogue", () => {
  const accueil = lire("index.html");
  const ordre = ["<h1", "hero__accroche", "<figure", "hero__legende", "Voir les 20 modèles", 'id="familles-titre"', 'id="demo-titre"'].map((m) => accueil.indexOf(m));
  assert.ok(ordre.every((n) => n > 0), "tous les repères sont présents");
  assert.deepEqual([...ordre].sort((a, b) => a - b), ordre, "H1 → accroche → image et légende → CTA → familles → démonstration");
  assert.match(accueil, /<h1[^>]*>Ligne Posée<\/h1>/);
  assert.match(accueil, /Des objets sobres pour un bureau bien pensé\./);
  assert.match(accueil, /Illustration générée — modèle fictif, finitions non représentées\./);
  assert.equal((accueil.match(/Voir les 20 modèles/g) ?? []).length, 1, "pas de doublon du CTA");
  assert.match(accueil, /<a class="bouton bouton--hero" href="catalogue\.html">Voir les 20 modèles<\/a>/);
  assert.ok(!/Boutique fictive · démonstration/.test(accueil), "pas de second libellé de fiction avant le H1");
  assert.equal((accueil.match(/href="catalogue\.html\?famille=(sup|tap|lum|ran)"/g) ?? []).length, 4, "quatre familles liées");
});

test("en-tête commun : marque = lien d'accueil, trois liens permanents et mention de fiction sur les 7 pages", () => {
  const attendu = { "index.html": "index.html", "catalogue.html": "catalogue.html", "panier.html": "panier.html" };
  for (const f of ["index.html", "catalogue.html", "produit.html", "panier.html", "commande.html", "confirmation.html", "404.html"]) {
    const html = lire(f);
    assert.ok(html.includes("<strong>Boutique fictive — aucun achat possible.</strong>"), `${f} : mention permanente`);
    assert.match(html, /<a class="marque" href="(index\.html|\/)"/, `${f} : marque = accueil`);
    const nav = html.match(/<nav class="nav-principale"[\s\S]*?<\/nav>/)?.[0] ?? "";
    const liens = [...nav.matchAll(/<a href="([^"]*)"([^>]*)>([^<]*)<\/a>/g)];
    assert.deepEqual(liens.map((l) => l[3]), ["Accueil", "Catalogue", "Panier"], `${f} : trois liens permanents`);
    const courants = liens.filter((l) => /aria-current="page"/.test(l[2])).map((l) => l[1]);
    assert.deepEqual(courants, attendu[f] ? [attendu[f]] : [], `${f} : page courante`);
  }
});

test("sources des visuels : texte inséré par le DOM, aucune ressource externe, aucun stockage", () => {
  const src = lire("js/visuels.js").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|localStorage|sessionStorage|document\.cookie|fetch\(|XMLHttpRequest/.test(src));
  assert.ok(!/https?:\/\//.test(src));
});

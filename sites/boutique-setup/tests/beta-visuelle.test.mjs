/*
  Garde-fous de la bêta visuelle de Ligne Posée (docs/DIRECTION.md, « Direction artistique — bêta visuelle Ligne Posée »
  et docs/ARCHITECTURE.md § 7). Tests statiques : ils ne remplacent ni la recette navigateur ni les revues indépendantes.
*/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lire = (f) => fs.readFileSync(path.join(racine, f), "utf8");
const PAGES = ["index.html", "catalogue.html", "produit.html", "panier.html", "commande.html", "confirmation.html", "404.html"];
const css = lire("css/style.css");
const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, "");

test("jetons de la direction artistique : palette, focus bleu, panneau encre", () => {
  for (const jeton of ["--c-fond: #fbfbfa", "--c-surface: #ffffff", "--c-aplat: #f1f0ec", "--c-encre: #1b1f24", "--c-texte-doux: #4a525c", "--c-filet: #c9ced4", "--c-bord: #6b737c", "--c-focus: #0b5cad", "--c-sombre: #1b1f24"]) {
    assert.ok(css.includes(jeton), jeton);
  }
  assert.match(css, /:focus-visible\s*\{\s*outline: 3px solid var\(--c-focus\);\s*outline-offset: 3px;/);
  assert.match(css, /\.pause :focus-visible \{ outline-color: var\(--c-focus-sombre\); \}/, "focus lisible sur le panneau encre");
});

test("garde-fous d'architecture : pas de 100vh, pas de sticky, pas de scroll-jacking, aucune ressource externe", () => {
  assert.ok(!/100d?vh|100svh|100lvh/.test(sansCommentaires), "aucune hauteur de viewport");
  assert.ok(!/position:\s*sticky/.test(sansCommentaires), "aucun position: sticky");
  assert.ok(!/scroll-snap|scroll-behavior:\s*smooth|backdrop-filter|filter:\s*blur|@import|url\(\s*["']?https?:/.test(sansCommentaires));
  assert.ok(!/<video|<iframe|<canvas|autoplay/i.test(PAGES.map(lire).join("\n")), "aucune vidéo ni média incorporé");
  for (const f of PAGES) assert.ok(!/(src|href)="https?:\/\//.test(lire(f)), `${f} : aucune ressource externe`);
});

test("mouvement : apparition ≤ 12 px et ≤ 250 ms, repli sous mouvement réduit, aucun état caché sans le script", () => {
  assert.match(css, /html\.js-apparition \[data-apparition\]:not\(\.apparition--vue\) \{ opacity: 0; transform: translateY\(12px\); \}/);
  assert.match(css, /transition: opacity \.25s ease-out, transform \.25s ease-out;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*html\.js-apparition \[data-apparition\]:not\(\.apparition--vue\) \{ opacity: 1; transform: none; \}/);
  // La classe d'attente n'est jamais écrite en dur : seul js/apparition.js la pose, après contrôle du mouvement réduit.
  for (const f of PAGES) assert.ok(!/js-apparition/.test(lire(f)), f);
  const js = lire("js/apparition.js");
  for (const garde of ["IntersectionObserver", "prefers-reduced-motion: reduce", "setTimeout", "js-apparition"]) assert.ok(js.includes(garde), garde);
  assert.ok(!/addEventListener\(\s*["']scroll|scrollTo|preventDefault|wheel/.test(js.replace(/\/\*[\s\S]*?\*\//g, "")), "le défilement n'est ni capturé ni détourné");
});

test("un seul panneau encre par page ; mention de fiction avant l'en-tête ; navigation permanente", () => {
  for (const f of PAGES) {
    const html = lire(f);
    assert.ok((html.match(/class="pause"/g) ?? []).length <= 1, `${f} : au plus un panneau encre`);
    assert.ok(html.indexOf('class="avis-demo"') < html.indexOf('class="site-header"'), `${f} : la fiction passe avant l'en-tête`);
  }
  assert.equal((lire("index.html").match(/class="pause"/g) ?? []).length, 1);
});

test("accueil : image d'ouverture 4:3 sans coupe de l'objet, sizes cohérents, une seule image au chargement", () => {
  assert.match(css, /\.hero__cadre \{ aspect-ratio: 4 \/ 3;/);
  const html = lire("index.html");
  assert.equal((html.match(/<img\b/g) ?? []).length, 1);
  assert.match(html, /fetchpriority="high"/);
  assert.match(html, /sizes="\(min-width: 90em\) 594px,/);
  assert.match(html, /data-apparition/);
});

test("catalogue : la liste de repli n'est pas visible avant le rendu (CLS), et reste lisible si le module échoue", () => {
  const html = lire("catalogue.html");
  assert.match(html, /<script src="js\/attente-page\.js"><\/script>/, "script classique dans le head");
  assert.match(html, /class="container bas-de-page"/);
  assert.match(css, /html\.page-attente \.bas-de-page/);
  const js = lire("js/page-catalogue.js");
  assert.ok(js.includes('setAttribute("data-page-module"') && js.includes('classList.remove("page-attente")') && js.includes("data-page-repli"));
  assert.ok(/finally\s*\{[^}]*racine\.classList\.remove\("page-attente"\)/.test(js), "libération y compris en cas d'échec : le repli textuel reste lisible");
});

test("commande : deux colonnes dès 1024 px sans changer l'ordre de lecture (récapitulatif puis choix)", () => {
  const js = lire("js/page-commande.js");
  assert.ok(js.indexOf("commande__recap") < js.indexOf("commande__choix"));
  assert.match(css, /#commande-zone \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 26rem\);/);
});

/*
  Menu plein écran de l'en-tête commun (docs/DIRECTION.md, décision du 4 novembre 2026 et « Évolution ciblée — menu
  plein écran de Ligne Posée »). Tests statiques du balisage et du CSS, puis comportement réel de js/menu.js dans
  un faux document. Ils ne remplacent pas la recette navigateur (transitions, rendu, clavier réel).
*/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lire = (f) => fs.readFileSync(path.join(racine, f), "utf8");
const PAGES = ["index.html", "catalogue.html", "produit.html", "panier.html", "commande.html", "confirmation.html", "404.html"];
const css = lire("css/style.css");

test("sept pages : script du menu dans l'en-tête, bouton contrôlant le volet, trois liens dans le volet", () => {
  for (const f of PAGES) {
    const html = lire(f);
    const prefixe = f === "404.html" ? "/" : "";
    const tete = html.slice(0, html.indexOf("</head>"));
    assert.ok(tete.includes(`<script src="${prefixe}js/menu.js"></script>`), `${f} : script classique dans l'en-tête`);
    assert.match(html, /<button class="menu-bouton" id="menu-bouton" type="button" aria-expanded="false" aria-controls="volet-nav" aria-label="Ouvrir le menu">/, `${f} : bouton fermé`);
    assert.match(html, /<span class="menu-bouton__libelle">Menu<\/span><span class="menu-bouton__icone" aria-hidden="true"><\/span>/, `${f} : libellé visible et icône décorative`);
    const nav = html.match(/<nav class="nav-principale" id="volet-nav" aria-label="Navigation principale">[\s\S]*?<\/nav>/)?.[0] ?? "";
    assert.deepEqual([...nav.matchAll(/>([^<]+)<\/a>/g)].map((m) => m[1]), ["Accueil", "Catalogue", "Panier"], f);
    assert.ok(html.indexOf('class="marque"') < html.indexOf('id="menu-bouton"') && html.indexOf('id="menu-bouton"') < html.indexOf('id="volet-nav"'), `${f} : marque, bouton puis volet`);
  }
  const quatre = lire("404.html").match(/<nav class="nav-principale"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...quatre.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), ["/", "/catalogue.html", "/panier.html"], "404 imbriquée : chemins absolus");
});

test("manifeste : js/menu.js publié", () => {
  assert.ok(JSON.parse(lire("publication.json")).publicFiles.includes("js/menu.js"));
});

test("CSS : sans menu-js rien ne change ; volet fermé masqué ; axes, durées et mouvement réduit de la direction", () => {
  assert.match(css, /\.menu-bouton \{ display: none; \}/, "bouton absent sans script");
  for (const regle of [/\.menu-js \.nav-principale \{[^}]*position: fixed;[^}]*visibility: hidden;/, /\.menu-ouvert \.nav-principale \{ visibility: visible;/]) assert.match(css, regle);
  assert.match(css, /\.menu-js \.nav-principale ul \{[^}]*transform: translateY\(-100%\);[^}]*transition: transform \.3s [^;]* \.1s;/, "sous 1024 px : depuis le haut ; fermeture 300 ms après 100 ms");
  assert.match(css, /\.menu-ouvert \.nav-principale ul \{ transform: none; transition: transform \.42s /, "ouverture 420 ms");
  assert.match(css, /@media \(min-width: 64em\) \{[^@]*\.menu-js \.nav-principale ul \{[^}]*background: var\(--c-sombre\);[^}]*transform: translateX\(100%\);/, "dès 1024 px : encre, depuis la droite");
  assert.match(css, /\.menu-js \.nav-principale a \{[^}]*opacity: 0;[^}]*transform: translateY\(12px\);/, "liens : 12 px au plus");
  assert.match(css, /transition: opacity \.22s ease-out \.12s/);
  assert.match(css, /li:nth-child\(2\) a \{ transition-delay: \.165s/);
  assert.match(css, /li:nth-child\(3\) a \{ transition-delay: \.21s/);
  assert.match(css, /font-size: clamp\(1\.75rem, 1rem \+ 7\.5vw, 2\.75rem\)/);
  assert.match(css, /font-size: clamp\(4\.5rem, 6vw, 6rem\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\* \{ transition: none !important;/, "mouvement réduit : aucune transition");
  assert.match(css, /\.menu-js \.menu-bouton \{[^}]*min-width: 3rem;[^}]*min-height: 3rem;/, "cible de 48 px");
});

/* ---------- Comportement de js/menu.js dans un faux document ---------- */

function element(tag, props = {}) {
  const attrs = new Map();
  const ecouteurs = {};
  const el = {
    tagName: tag.toUpperCase(), inert: false, textContent: props.texte ?? "", classes: new Set(props.classes ?? []), enfants: [],
    getAttribute: (a) => (attrs.has(a) ? attrs.get(a) : null),
    setAttribute: (a, v) => attrs.set(a, String(v)),
    addEventListener: (t, f) => { (ecouteurs[t] ??= []).push(f); },
    declencher: (t, e = {}) => (ecouteurs[t] ?? []).forEach((f) => f(e)),
    focus: () => { doc.activeElement = el; },
    getBoundingClientRect: () => ({ bottom: props.bas ?? 0 }),
    querySelector: (s) => props.qs?.[s] ?? null,
    querySelectorAll: (s) => props.qsa?.[s] ?? [],
    id: props.id ?? "", parent: null,
    closest: (s) => { for (let n = el; n; n = n.parent) if (s === "#" + n.id) return n; return null; },
  };
  el.classList = { contains: (c) => el.classes.has(c), add: (c) => el.classes.add(c), remove: (...c) => c.forEach((x) => el.classes.delete(x)) };
  return el;
}
let doc;
function monter({ sansBouton = false, analyse = "terminee" } = {}) {
  const liens = ["Accueil", "Catalogue", "Panier"].map((t) => element("a", { texte: t }));
  const libelle = element("span", { texte: "Menu" });
  const bouton = element("button", { id: "menu-bouton", qs: { ".menu-bouton__libelle": libelle } });
  libelle.parent = bouton;
  const volet = element("nav", { qsa: { "a[href]": liens } });
  const marque = element("a", { texte: "Ligne Posée" });
  const entete = element("header", { bas: 111, qs: { ".marque": marque } });
  const avis = element("div", { classes: ["avis-demo"] });
  const lien = element("a", { texte: "Aller au contenu" });
  const main = element("main");
  const pied = element("footer");
  const script = element("script");
  const styles = new Map();
  const racine = element("html");
  racine.clientWidth = 1425;
  racine.style = { setProperty: (k, v) => styles.set(k, v), removeProperty: (k) => styles.delete(k) };
  const ecouteursDoc = {};
  doc = {
    documentElement: racine, readyState: "loading", activeElement: null,
    body: { children: [lien, avis, entete, main, pied, script] },
    querySelector: (s) => (s === ".site-header" ? entete : null),
    getElementById: (id) => ({ "menu-bouton": sansBouton ? null : bouton, "volet-nav": volet })[id] ?? null,
    addEventListener: (t, f) => { (ecouteursDoc[t] ??= []).push(f); },
    removeEventListener: (t, f) => { ecouteursDoc[t] = (ecouteursDoc[t] ?? []).filter((g) => g !== f); },
  };
  const ecouteursWin = {};
  const erreurs = [];
  const window = { innerWidth: 1440, addEventListener: (t, f) => { (ecouteursWin[t] ??= []).push(f); }, console: { error: (...a) => erreurs.push(a.join(" ")) } };
  vm.runInNewContext(lire("js/menu.js"), { document: doc, window, console: window.console });
  const classeAvantInit = racine.classList.contains("menu-js");
  // DOMContentLoaded n'est jamais déclenché ici : il attend les modules de la page, qui peuvent rester en attente.
  const finAnalyse = () => { doc.readyState = "interactive"; for (const f of ecouteursDoc.readystatechange ?? []) f(); };
  if (analyse === "terminee") finAnalyse();
  const cliquer = (cible = bouton) => { for (const f of ecouteursDoc.click ?? []) f({ target: cible }); };
  const touche = (key, shiftKey = false) => { let bloque = false; for (const f of ecouteursDoc.keydown ?? []) f({ key, shiftKey, preventDefault: () => { bloque = true; } }); return bloque; };
  return { racine, bouton, volet, liens, marque, libelle, main, pied, lien, avis, entete, styles, touche, cliquer, finAnalyse, erreurs, classeAvantInit, win: ecouteursWin };
}

test("menu.js : classe posée avant le rendu ; état fermé initial : volet inerte, bouton « Ouvrir le menu »", () => {
  const m = monter();
  assert.ok(m.classeAvantInit, "menu-js posée dès l'exécution dans l'en-tête");
  assert.equal(m.bouton.getAttribute("aria-expanded"), "false");
  assert.equal(m.bouton.getAttribute("aria-label"), "Ouvrir le menu");
  assert.equal(m.volet.inert, true, "aucun lien atteignable volet fermé");
  assert.equal(m.main.inert, false);
});

test("menu.js : ouverture → état exposé, focus sur Accueil, page inerte (sauf avis de fiction), volet placé sous l'en-tête", () => {
  const m = monter();
  m.cliquer();
  assert.ok(m.racine.classList.contains("menu-ouvert"));
  assert.equal(m.bouton.getAttribute("aria-expanded"), "true");
  assert.equal(m.bouton.getAttribute("aria-label"), "Fermer le menu");
  assert.equal(m.libelle.textContent, "Fermer");
  assert.equal(m.volet.inert, false);
  assert.equal(doc.activeElement, m.liens[0]);
  assert.deepEqual([m.main.inert, m.pied.inert, m.lien.inert, m.avis.inert, m.entete.inert], [true, true, true, false, false]);
  assert.equal(m.styles.get("--volet-haut"), "111px");
  assert.equal(m.styles.get("--barre"), "15px", "largeur de la barre compensée : pas de saut latéral");
});

test("menu.js : Tab et Maj+Tab bouclent sur marque, bouton et liens ; Échap ferme et rend le focus au bouton", () => {
  const m = monter();
  m.cliquer();
  m.liens[2].focus();
  assert.equal(m.touche("Tab"), true); assert.equal(doc.activeElement, m.marque, "après Panier : la marque");
  m.marque.focus();
  assert.equal(m.touche("Tab", true), true); assert.equal(doc.activeElement, m.liens[2], "avant la marque : Panier");
  m.liens[0].focus();
  assert.equal(m.touche("Tab"), false, "à l'intérieur de la boucle, Tab reste natif");
  assert.equal(m.touche("Escape"), true);
  assert.equal(m.racine.classList.contains("menu-ouvert"), false);
  assert.equal(doc.activeElement, m.bouton);
  assert.equal(m.volet.inert, true);
  assert.equal(m.main.inert, false);
  assert.equal(m.styles.has("--barre"), false);
  assert.equal(m.touche("Escape"), false, "fermé : Échap n'est plus intercepté");
});

test("menu.js : le bouton « Fermer » ferme et rend le focus ; bascules successives cohérentes ; retour d'historique fermé", () => {
  const m = monter();
  for (let i = 0; i < 7; i++) m.cliquer();
  assert.equal(m.bouton.getAttribute("aria-expanded"), "true", "7 bascules : ouvert");
  m.cliquer();
  assert.equal(m.bouton.getAttribute("aria-expanded"), "false");
  assert.equal(doc.activeElement, m.bouton);
  m.cliquer();
  for (const f of m.win.pageshow) f({ persisted: true });
  assert.equal(m.racine.classList.contains("menu-ouvert"), false, "page restaurée : volet fermé");
});

test("régression CR (2705fb5) : pageshow du premier chargement, après un module lent, ne ferme pas le volet", () => {
  // Volet ouvert pendant que le module de la page attend ; à la fin du chargement, pageshow est émis avec
  // persisted: false. Le volet doit rester ouvert et le focus rester dans le volet (pas sur le corps).
  const m = monter({ analyse: "en-cours" });
  m.cliquer();
  m.finAnalyse();
  for (const f of m.win.pageshow) f({ persisted: false });
  assert.equal(m.racine.classList.contains("menu-ouvert"), true, "premier pageshow : volet toujours ouvert");
  assert.equal(m.bouton.getAttribute("aria-expanded"), "true");
  assert.equal(m.volet.inert, false);
  assert.equal(doc.activeElement, m.liens[0], "focus conservé sur Accueil");
  // Une vraie restauration depuis le cache de navigation referme toujours.
  for (const f of m.win.pageshow) f({ persisted: true });
  assert.equal(m.racine.classList.contains("menu-ouvert"), false);
  assert.equal(m.volet.inert, true);
});

test("menu.js : en-tête incomplet → classe retirée, les trois liens restent dans l'en-tête", () => {
  const m = monter({ sansBouton: true });
  assert.equal(m.racine.classList.contains("menu-js"), false);
  assert.ok(m.erreurs.some((e) => /menu indisponible/.test(e)));
});

test("menu.js : ni innerHTML, ni stockage, ni URL externe, ni capture du défilement", () => {
  const src = lire("js/menu.js").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|localStorage|sessionStorage|document\.cookie|https?:\/\//.test(src));
  assert.ok(!/addEventListener\(\s*["'](scroll|wheel|touchmove)/.test(src));
  // Le premier lien est hors champ au début du mouvement : sans preventScroll, le conteneur défilerait et le volet sauterait.
  assert.ok(src.includes("liens[0].focus({ preventScroll: true })"));
});

test("régression CR (35a0501) : module de page en attente → le bouton répond avant DOMContentLoaded", () => {
  // Analyse du document en cours, aucun DOMContentLoaded (un module de fiche reste en attente) : le bouton affiché
  // doit déjà ouvrir et fermer le volet ; un clic sur son libellé compte comme un clic sur le bouton.
  const m = monter({ analyse: "en-cours" });
  assert.ok(m.racine.classList.contains("menu-js"));
  m.cliquer(m.libelle);
  assert.equal(m.bouton.getAttribute("aria-expanded"), "true", "ouvert sans attendre la fin des modules");
  assert.equal(doc.activeElement, m.liens[0]);
  assert.equal(m.touche("Escape"), true);
  assert.equal(m.bouton.getAttribute("aria-expanded"), "false");
  assert.equal(doc.activeElement, m.bouton);
  m.cliquer();
  m.finAnalyse();
  assert.equal(m.bouton.getAttribute("aria-expanded"), "true", "la fin de l'analyse ne referme pas le volet");
  assert.equal(m.main.inert, true, "état réappliqué à la page analysée");
  assert.equal(m.racine.classList.contains("menu-js"), true);
  const src = lire("js/menu.js").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!/DOMContentLoaded/.test(src), "aucune dépendance à DOMContentLoaded");
  assert.match(src, /document\.addEventListener\("click"/, "clic délégué, posé dès l'en-tête");
});

test("menu.js : en-tête incomplet au premier clic pendant l'analyse → repli immédiat sur les liens de l'en-tête", () => {
  const m = monter({ sansBouton: true, analyse: "en-cours" });
  assert.equal(m.racine.classList.contains("menu-js"), true);
  m.cliquer(m.bouton);
  assert.equal(m.racine.classList.contains("menu-js"), false);
  assert.ok(m.erreurs.some((e) => /menu indisponible/.test(e)));
});

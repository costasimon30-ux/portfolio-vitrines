/*
  La Tablée des Forges — apparition réversible par seuil de défilement.

  Direction : docs/DIRECTION.md, Site 2, sous-section « Fond noyer à lames et
  apparition réversible » (5 octobre 2026). Comportement repris de
  sites/portfolio/js/mouvement-sections.js (§ 10 du portfolio), adapté aux
  trois pages de la brasserie ; ce fichier est propre à ce site.

  Principe. `scrollY` sert uniquement à CONSTATER le franchissement d'un
  seuil de position ; il ne pilote jamais l'opacité pixel par pixel. Chaque
  groupe est UN SEUL élément portant la classe `.defilement` (et
  `data-defilement`) dans le HTML ; ce script ajoute ou retire sa classe
  `defilement--armee` (état caché). css/style.css associe une transition
  différente à chaque sens (entrée 420 ms ease-out, sortie 300 ms ease-in) :
  si le sens change en cours d'animation, la transition repart de l'état
  courant, sans saut.

  Seuils (H = hauteur du viewport, T = haut du premier contenu réel du groupe,
  c'est-à-dire son titre `h2` ou, à défaut, le groupe lui-même) :
    - "standard" : entrée quand T <= 0,85 H ; sortie en remontée quand T >= 0,92 H.
    - "dernier" (dernier groupe utile avant le pied de page) : entrée aussi
      à moins de 0,45 H de la fin ; sortie seulement si T >= 0,92 H ET plus
      de 0,55 H avant la fin.
    - "pied" : entrée quand T <= 0,90 H ou à moins de 0,30 H de la fin ;
      sortie seulement si T >= 0,97 H ET plus de 0,40 H avant la fin.
  Au dernier pixel de la page, les groupes "dernier" et "pied" sont donc
  toujours nets, même sur une page trop courte pour franchir un seuil.

  Replis. L'état final est l'état par défaut en CSS : sans JavaScript, sans
  `matchMedia`/`requestAnimationFrame`, avec `prefers-reduced-motion: reduce`
  (la requête CSS couvre aussi un changement en cours de visite) ou sur une
  page qui ne défile pas, ce script n'arme aucun groupe.

  Accès prioritaires. Une ancre, un retour d'historique, un focus clavier
  dans un groupe, un grand saut de défilement (plus d'un viewport d'un coup),
  une restauration de position ou un redimensionnement placent le groupe
  concerné à l'état final SANS transition. Un groupe qui contient l'élément
  focalisé n'est jamais masqué.
*/
(function () {
  "use strict";

  if (
    typeof window.matchMedia !== "function" ||
    typeof window.requestAnimationFrame !== "function" ||
    typeof Element === "undefined" ||
    typeof Element.prototype.getBoundingClientRect !== "function"
  ) {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var CLASSE_ARMEE = "defilement--armee";

  var GROUPES = Array.prototype.slice.call(document.querySelectorAll(".defilement")).map(function (conteneur) {
    return {
      conteneur: conteneur,
      repere: conteneur.querySelector("h2") || conteneur,
      type: conteneur.getAttribute("data-defilement") || "standard",
      armee: false,
      verrouille: false
    };
  });
  if (!GROUPES.length) return;

  function hauteurViewport() { return window.innerHeight; }
  function scrollYMax() {
    return Math.max(0, document.documentElement.scrollHeight - hauteurViewport());
  }
  function ratioDe(g) { return g.repere.getBoundingClientRect().top / hauteurViewport(); }

  function entreeDue(g, ratio, distanceBas, h) {
    if (g.type === "pied") return ratio <= 0.90 || distanceBas < 0.30 * h;
    if (g.type === "dernier") return ratio <= 0.85 || distanceBas < 0.45 * h;
    return ratio <= 0.85;
  }
  function sortieDue(g, ratio, distanceBas, h) {
    if (g.type === "pied") return ratio >= 0.97 && distanceBas > 0.40 * h;
    if (g.type === "dernier") return ratio >= 0.92 && distanceBas > 0.55 * h;
    return ratio >= 0.92;
  }

  // Bascule sans transition : `transition: none` annule aussi une transition
  // déjà en cours (l'élément saute à sa valeur d'arrivée), puis changement de
  // classe éventuel et restauration au bout de deux frames (le temps qu'un
  // rendu à l'état posé soit commis, pour éviter une transition parasite).
  function appliquerSansTransition(conteneur, fn) {
    conteneur.style.transition = "none";
    void conteneur.offsetWidth;
    fn();
    void conteneur.offsetWidth;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { conteneur.style.transition = ""; });
    });
  }

  // Un groupe déjà « révélé » mais encore en train de s'estomper (focus, grand
  // saut) est amené tout de suite à son état final, sans attendre la fin de
  // la transition.
  function finir(g) {
    if (g.armee) return;
    if (window.getComputedStyle(g.conteneur).opacity === "1") return;
    appliquerSansTransition(g.conteneur, function () {});
  }

  function reveler(g, instantane) {
    if (!g.armee) return;
    g.armee = false;
    if (instantane) {
      appliquerSansTransition(g.conteneur, function () { g.conteneur.classList.remove(CLASSE_ARMEE); });
    } else {
      g.conteneur.classList.remove(CLASSE_ARMEE);
    }
  }
  function masquer(g, instantane) {
    if (g.armee) return;
    g.armee = true;
    if (instantane) {
      appliquerSansTransition(g.conteneur, function () { g.conteneur.classList.add(CLASSE_ARMEE); });
    } else {
      g.conteneur.classList.add(CLASSE_ARMEE);
    }
  }

  var direction = null; // "bas" | "haut" | null (aucun défilement encore observé)
  var dernierScrollY = window.scrollY;

  // État initial / resynchronisation : aucun mouvement lié à la mise en
  // page elle-même. Un groupe déjà dans la zone de lecture (ou au-dessus)
  // est net ; un groupe nettement en dessous est armé sans transition.
  function synchroniser() {
    var h = hauteurViewport();
    var sMax = scrollYMax();
    var pasDeDefilement = sMax <= 0;
    var distanceBas = sMax - window.scrollY;
    GROUPES.forEach(function (g) {
      if (g.verrouille) return;
      var ratio = ratioDe(g);
      if (pasDeDefilement || entreeDue(g, ratio, distanceBas, h)) reveler(g, true);
      else if (ratio >= 1 && sortieDue(g, ratio, distanceBas, h)) masquer(g, true); // seulement hors viewport
    });
  }

  // État initial : on arme aussi la zone d'hystérésis (entre le seuil
  // d'entrée et celui de sortie), jamais encore vue de l'utilisateur.
  (function etatInitial() {
    var h = hauteurViewport();
    var sMax = scrollYMax();
    if (sMax <= 0) return;
    var distanceBas = sMax - window.scrollY;
    GROUPES.forEach(function (g) {
      if (!entreeDue(g, ratioDe(g), distanceBas, h)) masquer(g, true);
    });
  })();

  function estDansLeViewport(el, h) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < h;
  }

  function verifier(sautImportant) {
    var h = hauteurViewport();
    var distanceBas = scrollYMax() - window.scrollY;
    GROUPES.forEach(function (g) {
      if (g.verrouille) return;
      if (sautImportant && estDansLeViewport(g.conteneur, h) && ratioDe(g) < 1) {
        // Grand saut de défilement (touche Fin/Origine, ascenseur, geste
        // rapide) : le groupe dont le titre est dans la fenêtre est net tout
        // de suite, quel que soit le sens, même si son entrée a déjà démarré.
        if (g.armee) reveler(g, true); else finir(g);
        return;
      }
      if (g.armee) {
        // Entrée par la position seule : un groupe armé qui a franchi son
        // seuil (y compris après une restauration de défilement ou un saut)
        // ne reste jamais invisible. Animée seulement en descente.
        if (entreeDue(g, ratioDe(g), distanceBas, h)) reveler(g, direction !== "bas");
      } else if (direction === "haut" && sortieDue(g, ratioDe(g), distanceBas, h)) {
        masquer(g, false);
      }
    });
  }

  // Fenêtre glissante des positions récentes : un défilement lissé par le
  // navigateur (touche Fin, par exemple) arrive en petits pas ; on le traite
  // comme un saut dès que le déplacement cumulé sur ~300 ms dépasse un viewport.
  var recent = [];
  var FENETRE_MS = 300;
  function maintenant() {
    return (window.performance && typeof window.performance.now === "function") ? window.performance.now() : Date.now();
  }

  var tickDefilement = false;
  function surDefilement() {
    if (tickDefilement) return;
    tickDefilement = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY;
      var h = hauteurViewport();
      var t = maintenant();
      var delta = Math.abs(y - dernierScrollY);
      if (y > dernierScrollY) direction = "bas";
      else if (y < dernierScrollY) direction = "haut";
      dernierScrollY = y;
      recent.push({ t: t, y: y });
      while (recent.length > 1 && t - recent[0].t > FENETRE_MS) recent.shift();
      var deplacement = Math.abs(y - recent[0].y);
      verifier(delta > h || deplacement > h);
      tickDefilement = false;
    });
  }

  var tickSynchro = false;
  function surChangementDeMiseEnPage() {
    if (tickSynchro) return;
    tickSynchro = true;
    window.requestAnimationFrame(function () {
      dernierScrollY = window.scrollY;
      synchroniser();
      tickSynchro = false;
    });
  }

  // Ancre, lien d'évitement, retour d'historique : seul le groupe qui
  // contient la cible est révélé (la cible `main` ne révèle rien d'autre).
  function revelerPourCible(cible) {
    if (!cible) return;
    GROUPES.forEach(function (g) {
      if (g.conteneur === cible || g.conteneur.contains(cible)) reveler(g, true);
    });
  }
  function cibleDuHash() {
    var id = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : "";
    return id ? document.getElementById(id) : null;
  }
  window.addEventListener("hashchange", function () { revelerPourCible(cibleDuHash()); });
  revelerPourCible(cibleDuHash());

  // Focus clavier : le groupe qui contient l'élément focalisé est net et le
  // reste tant que le focus y demeure.
  document.addEventListener("focusin", function (e) {
    GROUPES.forEach(function (g) {
      var dedans = g.conteneur.contains(e.target);
      g.verrouille = dedans;
      if (dedans) { if (g.armee) reveler(g, true); else finir(g); }
    });
  });
  document.addEventListener("focusout", function (e) {
    if (e.relatedTarget) return; // un focusin suivra
    window.setTimeout(function () {
      GROUPES.forEach(function (g) { g.verrouille = g.conteneur.contains(document.activeElement); });
    }, 0);
  });

  window.addEventListener("scroll", surDefilement, { passive: true });
  window.addEventListener("resize", surChangementDeMiseEnPage);
  // Restauration de position (rechargement, retour d'historique, cache
  // avant/arrière) et fin de chargement des polices : resynchronisation sans
  // animation.
  window.addEventListener("load", surChangementDeMiseEnPage);
  window.addEventListener("pageshow", surChangementDeMiseEnPage);
  if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === "function") {
    document.fonts.ready.then(surChangementDeMiseEnPage);
  }
})();

/*
  Mouvement ciblé de la carte Créa'Tif — sites/portfolio/, docs/DIRECTION.md
  § 10 « Mouvement ciblé », proposition UI/UX validée par Simon le
  24 septembre 2026.

  Exception limitée à cette seule carte, décrite dans le balisage par la
  classe `carte-projet--mouvement`. Aucun autre élément de la page n'est
  concerné.

  Principe de repli : l'état par défaut de la carte, en CSS, est déjà son
  état final — entièrement visible, immobile. Ce script n'ajoute JAMAIS
  d'état intermédiaire (opacité réduite, décalage horizontal) tant que
  toutes les conditions ci-dessous ne sont pas réunies :
    - IntersectionObserver et matchMedia disponibles,
    - `prefers-reduced-motion: reduce` non demandé,
    - largeur CSS effective >= 768px (recalculée au déclenchement : un
      redimensionnement ou un zoom qui repasse sous ce seuil avant l'entrée
      dans le viewport annule l'attente et force l'état final).
  Sans JavaScript, sous 768px, avec un mouvement réduit ou si l'observation
  d'entrée est indisponible, la carte reste donc dans l'état statique défini
  par défaut dans css/style.css — ce fichier n'a alors aucun effet.

  Un seul déclenchement, jamais rejoué : l'observateur se déconnecte dès la
  première révélation. Si la carte est déjà visible au premier contrôle
  (chargement avec une page longue, arrivée directe sur une ancre) ou si le
  focus clavier atteint « Voir la démo » avant le déclenchement normal, l'état
  final est posé sans transition — jamais de carte atténuée sous le focus, et
  jamais de mouvement perçu à l'arrivée quand le contenu est déjà là.
*/
(function () {
  "use strict";

  if (typeof window.matchMedia !== "function" || !("IntersectionObserver" in window)) {
    return; // repli : IntersectionObserver indisponible, état final déjà en place par défaut
  }

  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduit.matches) return; // repli : mouvement réduit demandé

  var largeurMin = window.matchMedia("(min-width: 768px)");
  if (!largeurMin.matches) return; // repli : sous 768px dès le chargement

  var carte = document.querySelector(".carte-projet--mouvement");
  if (!carte) return;

  // Arrivée directe sur une ancre qui amène la carte (ou sa section) dans le
  // viewport : le défilement natif déclenché par le fragment d'URL — lissé
  // par `scroll-behavior: smooth` (§ 02) — fait passer l'intersection de 0 à
  // plus de 20 % progressivement, exactement comme un défilement de
  // l'utilisateur. Sans ce repli, le premier passage de l'observateur (à
  // ratio 0, avant que le défilement natif ne commence) consommerait déjà
  // « premierPassage », et la traversée du seuil pendant le défilement lissé
  // serait alors traitée comme une entrée normale, animée — ce que le § 10
  // exclut pour une arrivée par ancre. On ne pose alors jamais les classes
  // d'attente : la carte reste dans son état final par défaut, sans qu'aucune
  // transition ne soit possible.
  if (window.location.hash) {
    var cibleAncre = document.getElementById(window.location.hash.slice(1));
    if (cibleAncre && (cibleAncre === carte || cibleAncre.contains(carte))) {
      return;
    }
  }

  var lien = carte.querySelector(".carte-projet__lien a");

  var CLASSE_ARMEE = "carte-projet--mouvement-armee";
  var CLASSE_REVELE = "carte-projet--mouvement-revele";

  var revele = false;
  var observer = null;
  var premierPassage = true;

  // Applique fn() en désactivant provisoirement les transitions de la carte,
  // pour un changement d'état strictement immédiat (aucune image peinte de
  // l'état intermédiaire), puis restaure les transitions normales (utiles à
  // la bascule de thème) dès la frame suivante.
  function sansTransition(fn) {
    carte.style.transitionDuration = "0s";
    void carte.offsetWidth; // force la prise en compte avant le changement de classe
    fn();
    window.requestAnimationFrame(function () {
      carte.style.transitionDuration = "";
    });
  }

  function detacherEcouteurs() {
    if (lien) lien.removeEventListener("focus", surFocus);
    if (largeurMin.removeEventListener) largeurMin.removeEventListener("change", surChangementLargeur);
    else if (largeurMin.removeListener) largeurMin.removeListener(surChangementLargeur);
  }

  function reveler(instantane) {
    if (revele) return;
    revele = true;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    detacherEcouteurs();
    if (instantane) {
      sansTransition(function () {
        carte.classList.remove(CLASSE_ARMEE);
        carte.classList.add(CLASSE_REVELE);
      });
    } else {
      carte.classList.remove(CLASSE_ARMEE);
      carte.classList.add(CLASSE_REVELE);
    }
  }

  function surFocus() {
    // Le focus n'attend jamais la révélation normale : état final immédiat,
    // sans perte de focus ni de position de lecture.
    reveler(true);
  }

  function surChangementLargeur() {
    if (!largeurMin.matches) reveler(true); // repli : largeur CSS repassée sous 768px
  }

  if (lien) lien.addEventListener("focus", surFocus);

  if (largeurMin.addEventListener) largeurMin.addEventListener("change", surChangementLargeur);
  else if (largeurMin.addListener) largeurMin.addListener(surChangementLargeur);

  sansTransition(function () {
    carte.classList.add(CLASSE_ARMEE);
  });

  observer = new IntersectionObserver(function (entrees) {
    var entree = entrees[0];
    if (!entree) return;
    if (entree.isIntersecting) {
      // Premier passage déjà intersectant : carte visible dès le premier
      // contrôle (page longue, arrivée par ancre) — état final immédiat.
      reveler(premierPassage);
    }
    premierPassage = false;
  }, { threshold: 0.2 });

  observer.observe(carte);
})();

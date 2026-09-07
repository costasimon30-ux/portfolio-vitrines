(function () {
  "use strict";

  // Le repli du menu mobile est assuré nativement par <details>/<summary>
  // (voir index.html, coiffure.html, barbier.html, salon.html) : replié par
  // défaut dès le premier rendu CSS, ouvrable/fermable au clic ou au clavier
  // (Entrée, Espace) sans JavaScript. Ce script n'apporte que des
  // améliorations non bloquantes ; s'il échoue, se charge en retard ou est
  // bloqué, le menu reste utilisable et sa présentation ne change pas
  // (cf. docs/QA-coiffeur-mixte.md, CR2-04).
  var disclosure = document.querySelector(".nav-disclosure");
  var nav = document.getElementById("primary-nav");

  if (!disclosure || !nav) return;

  function closeNav() {
    disclosure.removeAttribute("open");
  }

  // Referme le menu dès qu'un lien de la navigation est activé
  // (y compris une ancre sur la page courante, ex: salon.html#contact,
  // qui ne recharge pas forcément le document).
  nav.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (link) {
      closeNav();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && disclosure.hasAttribute("open")) {
      closeNav();
      var summary = disclosure.querySelector(".menu-toggle");
      if (summary) summary.focus();
    }
  });

  // Réinitialise l'état ouvert/fermé si on repasse en largeur desktop : le
  // menu y est de toute façon toujours visible en CSS, quel que soit [open].
  var desktopQuery = window.matchMedia("(min-width: 900px)");
  function handleViewportChange(query) {
    if (query.matches) {
      closeNav();
    }
  }
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", handleViewportChange);
  } else if (desktopQuery.addListener) {
    // Fallback anciens navigateurs
    desktopQuery.addListener(handleViewportChange);
  }
})();

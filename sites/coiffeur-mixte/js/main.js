(function () {
  "use strict";

  // Pose la classe "js" le plus tôt possible : le CSS n'active le menu
  // repliable que si elle est présente, garantissant une navigation
  // utilisable même si ce script échoue ou est bloqué.
  document.documentElement.classList.add("js");

  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("primary-nav");

  if (!toggle || !nav) return;

  function closeNav() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Ouvrir le menu");
  }

  function openNav() {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Fermer le menu");
  }

  toggle.addEventListener("click", function () {
    var isOpen = nav.classList.contains("is-open");
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

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
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      closeNav();
      toggle.focus();
    }
  });

  // Referme le menu mobile si on repasse en largeur desktop
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

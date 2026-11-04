/*
  Ligne Posée — menu plein écran de l'en-tête commun (docs/DIRECTION.md, décision du 4 novembre 2026 et
  « Évolution ciblée — menu plein écran de Ligne Posée »).

  Script classique chargé dans l'en-tête des sept pages. Il pose tout de suite la classe menu-js : le CSS
  remplace alors les trois liens visibles par le bouton « Menu » et un volet fermé, avant le premier rendu,
  sans saut de mise en page. Sans JavaScript, ou si ce fichier n'arrive pas, la classe n'existe pas et les
  trois liens restent affichés dans l'en-tête. Si l'initialisation échoue, la classe est retirée : même repli.

  Le mouvement est entièrement en CSS (transitions réversibles depuis l'état courant) ; ce script ne fait que
  basculer l'état. Ouvert : bouton aria-expanded="true", libellé « Fermer », focus sur le premier lien, page
  figée sans changer de largeur, contenu derrière inerte, Tab et Maj+Tab bouclent sur marque, bouton et liens,
  Échap ferme et rend le focus au bouton. Fermé : volet inerte et masqué, aucun lien atteignable.
*/
(function () {
  "use strict";
  var racine = document.documentElement;
  racine.classList.add("menu-js");

  var initialiser = function () {
    var entete = document.querySelector(".site-header");
    var bouton = document.getElementById("menu-bouton");
    var volet = document.getElementById("volet-nav");
    var marque = entete && entete.querySelector(".marque");
    if (!entete || !bouton || !volet || !marque) throw new Error("en-tête incomplet");
    var libelle = bouton.querySelector(".menu-bouton__libelle");
    var liens = Array.prototype.slice.call(volet.querySelectorAll("a[href]"));
    var ouvert = false;

    // Tout ce qui est derrière le volet devient inerte ; la bande de fiction reste lisible (aucun contrôle).
    var arriere = function () {
      return Array.prototype.filter.call(document.body.children, function (el) {
        return el !== entete && el.tagName !== "SCRIPT" && !el.classList.contains("avis-demo");
      });
    };
    // Le volet commence sous l'en-tête tel qu'il est affiché, même si la bande passe sur deux lignes.
    var placer = function () {
      var bas = Math.max(0, Math.round(entete.getBoundingClientRect().bottom));
      racine.style.setProperty("--volet-haut", bas + "px");
    };
    var etat = function (valeur) {
      ouvert = valeur;
      bouton.setAttribute("aria-expanded", valeur ? "true" : "false");
      bouton.setAttribute("aria-label", valeur ? "Fermer le menu" : "Ouvrir le menu");
      if (libelle) libelle.textContent = valeur ? "Fermer" : "Menu";
      volet.inert = !valeur;
      arriere().forEach(function (el) { el.inert = valeur; });
    };

    var ouvrir = function () {
      placer();
      // Page figée sans déplacement latéral : la largeur de la barre de défilement est compensée.
      var barre = window.innerWidth - racine.clientWidth;
      racine.style.setProperty("--barre", Math.max(0, barre) + "px");
      racine.classList.add("menu-ouvert");
      etat(true);
      // preventScroll : le lien est encore hors champ au début du mouvement ; sans cette option, le navigateur
      // ferait défiler le conteneur du volet pour le montrer et la surface sauterait d'un coup en place.
      if (liens[0]) liens[0].focus({ preventScroll: true });
    };
    var fermer = function (rendreFocus) {
      racine.classList.remove("menu-ouvert");
      racine.style.removeProperty("--barre");
      etat(false);
      if (rendreFocus) bouton.focus();
    };

    bouton.addEventListener("click", function () {
      if (ouvert) fermer(true);
      else ouvrir();
    });
    document.addEventListener("keydown", function (ev) {
      if (!ouvert) return;
      if (ev.key === "Escape" || ev.key === "Esc") {
        ev.preventDefault();
        fermer(true);
        return;
      }
      if (ev.key !== "Tab") return;
      var boucle = [marque, bouton].concat(liens);
      var i = boucle.indexOf(document.activeElement);
      if (ev.shiftKey && i <= 0) {
        ev.preventDefault();
        boucle[boucle.length - 1].focus();
      } else if (!ev.shiftKey && (i === -1 || i === boucle.length - 1)) {
        ev.preventDefault();
        boucle[0].focus();
      }
    });
    window.addEventListener("resize", function () {
      if (ouvert) placer();
    });
    // Retour par l'historique (cache de page) : le document réapparaît toujours volet fermé.
    window.addEventListener("pageshow", function () {
      if (ouvert) fermer(false);
    });
    etat(false);
  };

  var demarrer = function () {
    try {
      initialiser();
    } catch (e) {
      racine.classList.remove("menu-js", "menu-ouvert");
      if (window.console) console.error("Ligne Posée : menu indisponible, liens affichés dans l'en-tête —", e);
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
  else demarrer();
})();

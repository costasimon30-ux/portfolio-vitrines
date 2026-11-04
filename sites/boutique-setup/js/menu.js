/*
  Ligne Posée — menu plein écran de l'en-tête commun (docs/DIRECTION.md, décision du 4 novembre 2026 et
  « Évolution ciblée — menu plein écran de Ligne Posée »).

  Script classique chargé dans l'en-tête des sept pages. Il pose tout de suite la classe menu-js : le CSS
  remplace alors les trois liens visibles par le bouton « Menu » et un volet fermé, avant le premier rendu,
  sans saut de mise en page. Sans JavaScript, ou si ce fichier n'arrive pas, la classe n'existe pas et les
  trois liens restent affichés dans l'en-tête. Si l'en-tête est incomplet, la classe est retirée : même repli.

  Le bouton doit répondre dès qu'il est affiché, même si un module de la page (fiche, catalogue, panier,
  commande) reste en attente : DOMContentLoaded attend l'exécution des modules et ne convient donc pas. Les
  écouteurs sont délégués sur document, posés ici dans l'en-tête, et retrouvent l'en-tête au moment de chaque
  action. La vérification de l'en-tête a lieu à la fin de l'analyse du document (readyState « interactive »),
  qui précède l'exécution des modules et scripts différés.

  Le mouvement est entièrement en CSS (transitions réversibles depuis l'état courant) ; ce script ne fait que
  basculer l'état. Ouvert : bouton aria-expanded="true", libellé « Fermer », focus sur le premier lien, page
  figée sans changer de largeur, contenu derrière inerte, Tab et Maj+Tab bouclent sur marque, bouton et liens,
  Échap ferme et rend le focus au bouton. Fermé : volet inerte et masqué, aucun lien atteignable.
*/
(function () {
  "use strict";
  var racine = document.documentElement;
  racine.classList.add("menu-js");
  var ouvert = false;
  var abandonne = false;

  // L'en-tête au moment de l'action ; null s'il est incomplet (ou pas encore analysé).
  var pieces = function () {
    var entete = document.querySelector(".site-header");
    var bouton = document.getElementById("menu-bouton");
    var volet = document.getElementById("volet-nav");
    var marque = entete && entete.querySelector(".marque");
    if (!entete || !bouton || !volet || !marque) return null;
    return {
      entete: entete,
      bouton: bouton,
      volet: volet,
      marque: marque,
      libelle: bouton.querySelector(".menu-bouton__libelle"),
      liens: Array.prototype.slice.call(volet.querySelectorAll("a[href]")),
    };
  };
  var abandonner = function (e) {
    abandonne = true;
    ouvert = false;
    racine.classList.remove("menu-js", "menu-ouvert");
    if (window.console) console.error("Ligne Posée : menu indisponible, liens affichés dans l'en-tête —", e);
  };

  // Tout ce qui est derrière le volet devient inerte ; la bande de fiction reste lisible (aucun contrôle).
  var arriere = function (p) {
    return Array.prototype.filter.call(document.body ? document.body.children : [], function (el) {
      return el !== p.entete && el.tagName !== "SCRIPT" && !el.classList.contains("avis-demo");
    });
  };
  // Le volet commence sous l'en-tête tel qu'il est affiché, même si la bande passe sur deux lignes.
  var placer = function (p) {
    var bas = Math.max(0, Math.round(p.entete.getBoundingClientRect().bottom));
    racine.style.setProperty("--volet-haut", bas + "px");
  };
  var etat = function (p, valeur) {
    ouvert = valeur;
    p.bouton.setAttribute("aria-expanded", valeur ? "true" : "false");
    p.bouton.setAttribute("aria-label", valeur ? "Fermer le menu" : "Ouvrir le menu");
    if (p.libelle) p.libelle.textContent = valeur ? "Fermer" : "Menu";
    p.volet.inert = !valeur;
    arriere(p).forEach(function (el) { el.inert = valeur; });
  };
  var ouvrir = function (p) {
    placer(p);
    // Page figée sans déplacement latéral : la largeur de la barre de défilement est compensée.
    var barre = window.innerWidth - racine.clientWidth;
    racine.style.setProperty("--barre", Math.max(0, barre) + "px");
    racine.classList.add("menu-ouvert");
    etat(p, true);
    // preventScroll : le lien est encore hors champ au début du mouvement ; sans cette option, le navigateur
    // ferait défiler le conteneur du volet pour le montrer et la surface sauterait d'un coup en place.
    if (p.liens[0]) p.liens[0].focus({ preventScroll: true });
  };
  var fermer = function (p, rendreFocus) {
    racine.classList.remove("menu-ouvert");
    racine.style.removeProperty("--barre");
    etat(p, false);
    if (rendreFocus) p.bouton.focus();
  };

  document.addEventListener("click", function (ev) {
    if (abandonne) return;
    var cible = ev.target && ev.target.closest ? ev.target.closest("#menu-bouton") : null;
    if (!cible) return;
    var p = pieces();
    if (!p) return abandonner(new Error("en-tête incomplet"));
    if (ouvert) fermer(p, true);
    else ouvrir(p);
  });
  document.addEventListener("keydown", function (ev) {
    if (!ouvert || abandonne) return;
    var p = pieces();
    if (!p) return;
    if (ev.key === "Escape" || ev.key === "Esc") {
      ev.preventDefault();
      fermer(p, true);
      return;
    }
    if (ev.key !== "Tab") return;
    var boucle = [p.marque, p.bouton].concat(p.liens);
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
    var p = ouvert && pieces();
    if (p) placer(p);
  });
  // Retour par l'historique (cache de page) : le document réapparaît toujours volet fermé. pageshow est aussi
  // émis au premier chargement, à la fin des modules : le volet ouvert entre-temps doit alors rester ouvert, avec
  // son focus. Seule une page restaurée (persisted) est refermée.
  window.addEventListener("pageshow", function (ev) {
    if (!ev || !ev.persisted) return;
    var p = ouvert && pieces();
    if (p) fermer(p, false);
  });

  // Fin de l'analyse du document (avant les modules) : en-tête complet, sinon repli ; état initial exposé.
  // Si le volet a été ouvert pendant l'analyse, l'état est réappliqué aux éléments analysés depuis.
  var verifier = function () {
    if (abandonne) return;
    var p = pieces();
    if (!p) return abandonner(new Error("en-tête incomplet"));
    etat(p, ouvert);
  };
  if (document.readyState === "loading") {
    document.addEventListener("readystatechange", function attendre() {
      if (document.readyState === "loading") return;
      document.removeEventListener("readystatechange", attendre);
      verifier();
    });
  } else {
    verifier();
  }
})();

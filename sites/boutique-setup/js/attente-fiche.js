/*
  Fiche produit : attente du catalogue et repli, avant le premier rendu.
  Script classique (non module) chargé dans l'en-tête. Il pose la classe d'attente qui rend
  invisibles (sans quitter la mise en page) les liens de retour et le pied de page, pour qu'ils
  ne soient jamais vus se déplacer quand la fiche ou son message d'erreur s'affiche.

  Deux délais distincts :
    - DÉMARRAGE du module js/page-produit.js : s'il n'a pas démarré au bout de 2 s (requête
      pendante, bloquée, en erreur, module vide ou dépendance introuvable), la page bascule
      dans son repli « Fiche indisponible » et les liens et le pied deviennent utilisables. Un
      échec franc (événement « error » d'un script, erreur non interceptée, fin du chargement
      sans module) déclenche le même repli sans attendre les 2 s. Le repli est définitif pour
      cette page : si le module arrive plus tard, il constate data-fiche-repli et ne fait rien
      (aucune fiche ne surgit, rien ne bouge) ; un rechargement volontaire retente l'accès.
    - CHARGEMENT du catalogue JSON, une fois le module démarré (marqueur data-fiche-module) : il
      n'est pas limité à 2 s ; la classe est retirée par le module quand la fiche ou son erreur
      est affichée. Un délai de sécurité de 8 s la retire en dernier recours.

  Aucune animation, aucune média query de mouvement. Sans JavaScript, ou si ce fichier est lui-même
  bloqué, la classe n'existe pas : tout reste visible.
*/
(function () {
  var DELAI_DEMARRAGE_MS = 2000;
  var DELAI_SECURITE_MS = 8000;
  var racine = document.documentElement;
  var demarre = function () {
    return racine.hasAttribute("data-fiche-module");
  };
  var liberer = function () {
    racine.classList.remove("fiche-attente");
  };
  var replier = function () {
    if (demarre() || racine.hasAttribute("data-fiche-repli")) return;
    racine.setAttribute("data-fiche-repli", "");
    var afficher = function () {
      var indispo = document.getElementById("fiche-repli-indispo");
      var neutre = document.getElementById("fiche-repli");
      if (indispo) indispo.hidden = false;
      if (neutre) neutre.hidden = true;
      liberer();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", afficher);
    else afficher();
  };

  racine.classList.add("fiche-attente");
  document.addEventListener(
    "error",
    function (ev) {
      if (ev.target && ev.target.tagName === "SCRIPT") replier();
    },
    true
  );
  window.addEventListener("error", function () {
    if (demarre()) liberer();
    else replier();
  });
  window.addEventListener("load", replier);
  setTimeout(replier, DELAI_DEMARRAGE_MS);
  setTimeout(liberer, DELAI_SECURITE_MS);
})();

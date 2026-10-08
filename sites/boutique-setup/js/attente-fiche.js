/*
  Fiche produit : attente du catalogue, avant le premier rendu.
  Script classique (non module) chargé dans l'en-tête : il pose la classe d'attente qui rend
  invisibles (sans quitter la mise en page) les liens de retour et le pied de page, pour qu'ils
  ne soient jamais vus se déplacer quand la fiche ou son message d'erreur s'affiche.

  Ce mécanisme ne dépend ni d'une animation CSS ni de la préférence de mouvement. La classe est
  retirée par js/page-produit.js dès que la fiche ou son erreur est affichée, et ici sans attendre
  si ce module échoue, est bloqué ou n'a pas démarré :
    - événement « error » d'un script (réseau, filtre, CSP, dépendance introuvable) ;
    - erreur JavaScript non interceptée ;
    - fin du chargement de la page sans que le module ait démarré (marqueur data-fiche-module) ;
    - délai de sécurité de 8 s en dernier recours.
  Sans JavaScript, ou si ce fichier est lui-même bloqué, la classe n'existe pas : tout reste visible.
*/
(function () {
  var racine = document.documentElement;
  var liberer = function () {
    racine.classList.remove("fiche-attente");
  };
  racine.classList.add("fiche-attente");
  document.addEventListener(
    "error",
    function (ev) {
      if (ev.target && ev.target.tagName === "SCRIPT") liberer();
    },
    true
  );
  window.addEventListener("error", liberer);
  window.addEventListener("load", function () {
    if (!racine.hasAttribute("data-fiche-module")) liberer();
  });
  setTimeout(liberer, 8000);
})();

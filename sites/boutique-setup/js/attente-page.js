/*
  Panier et commande : stabilité de la mise en page pendant le chargement du catalogue (lot 2).
  Script classique chargé dans l'en-tête de panier.html et commande.html. Il pose, avant le premier
  rendu, la classe qui rend invisibles (sans quitter la mise en page) les liens de retour et le pied
  de page : ils ne sont ainsi jamais vus se déplacer quand le contenu s'affiche. Le module de la page
  retire la classe dès que son contenu est rendu.

  Si le module n'a pas démarré (marqueur data-page-module) au bout de 2 s, échoue ou est bloqué, la
  classe est retirée sans attendre et le repli statique de la page reste affiché, définitivement :
  un module qui arriverait plus tard constate data-page-repli et ne remplace rien (la page ne bouge
  pas ; un rechargement retente). Un délai de sécurité de 8 s retire la classe en dernier recours
  (catalogue très lent). Sans JavaScript, ou si ce fichier est bloqué, rien n'est caché.
*/
(function () {
  var racine = document.documentElement;
  var demarre = function () {
    return racine.hasAttribute("data-page-module");
  };
  var liberer = function () {
    racine.classList.remove("page-attente");
  };
  // Module démarré mais catalogue encore absent à 8 s : état DÉFINITIF « trop lent » (message stable avec relance
  // volontaire, liens de retour et pied de page libérés). Le module ne remplace plus rien si le JSON arrive plus tard.
  var ralentir = function () {
    if (racine.hasAttribute("data-page-pret") || racine.hasAttribute("data-page-repli") || racine.hasAttribute("data-page-lent")) return;
    racine.setAttribute("data-page-lent", "");
    var region = document.getElementById("page-lent");
    var modele = document.getElementById("page-lent-modele");
    // Région status déjà présente (vide) : l'insertion du texte est annoncée une seule fois par les technologies d'assistance.
    if (region && modele && modele.content) region.appendChild(modele.content.cloneNode(true));
    var chargements = document.querySelectorAll ? document.querySelectorAll(".chargement") : [];
    for (var i = 0; i < chargements.length; i++) chargements[i].hidden = true;
    liberer();
  };
  var replier = function () {
    if (demarre() || racine.hasAttribute("data-page-repli")) return;
    racine.setAttribute("data-page-repli", "");
    liberer();
  };

  racine.classList.add("page-attente");
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
  setTimeout(replier, 2000);
  setTimeout(ralentir, 8000);
})();

/*
  Ligne Posée — visuel d'ouverture de l'accueil renouvelé à chaque chargement (docs/DIRECTION.md, décision de
  Simon du 5 novembre 2026).

  Le HTML contient un vrai <img> de repli (sup-01) : il reste affiché sans JavaScript, si ce script est bloqué ou
  s'il échoue. Ce script classique et synchrone, placé juste après lui dans le cadre du héros, remplace sur ce même
  élément src, srcset et alt par ceux d'un produit tiré au hasard (sizes, dimensions et priorité inchangés). Le
  navigateur peut avoir déjà demandé sup-01 avant l'exécution : une requête initiale de plus est acceptée au
  profit de la robustesse du repli.

  Le visuel précédent de l'onglet (sessionStorage) est exclu du tirage ; si le stockage est indisponible, le
  tirage se fait parmi tous les visuels. En cas d'erreur, l'image de repli reste en place.

  Seuls les produits dont l'objet reste entier dans le cadre 4:3 (recadrage cover, 50 % 58 %) sont proposés.
  Noms et descriptions : mêmes textes que data/catalogue.json et js/visuels.js (vérifié par tests/accueil.test.mjs).
*/
(function () {
  "use strict";
  var VISUELS = [
    ["sup-01", "Rehausseur d’écran", "plateau rectangulaire allongé posé sur deux pieds bas, avec un espace libre dessous"],
    ["sup-02", "Support d’ordinateur portable", "plateau incliné à fente centrale, sur une base plate"],
    ["tap-01", "Tapis compact", "tapis rectangulaire aux coins arrondis"],
    ["tap-02", "Tapis classique", "tapis rectangulaire à bordure cousue"],
    ["tap-03", "Tapis grand format", "tapis très allongé aux coins arrondis"],
    ["tap-04", "Tapis en feutre", "tapis rectangulaire en feutre"],
    ["tap-05", "Sous-main avec rangement", "sous-main avec un canal de rangement le long du bord arrière"],
    ["lum-02", "Barre lumineuse d’écran", "barre horizontale fixée par une pince, sans écran"],
    ["lum-04", "Éclairage d’ambiance", "luminaire cylindrique bas et large, à face supérieure lumineuse"],
    ["lum-05", "Lampe nomade", "lampe à abat-jour en dôme, sur un pied court et une base ronde"],
    ["ran-01", "Organiseur de bureau", "bac plat à trois compartiments"],
    ["ran-02", "Boîte range-câbles", "boîte rectangulaire à couvercle, avec des passages de câbles sur les côtés"],
    ["ran-03", "Vide-poche", "plateau creux aux bords arrondis"],
    ["ran-05", "Module à tiroir", "bloc à deux tiroirs, dont un entrouvert"],
  ];
  var CLE = "ligne-posee-visuel-accueil";
  var script = document.currentScript;
  var img = script && script.previousElementSibling;
  if (!img || img.tagName !== "IMG") return;

  var lireStockage = function () {
    try { return window.sessionStorage.getItem(CLE); } catch (e) { return null; }
  };
  var ecrireStockage = function (id) {
    try { window.sessionStorage.setItem(CLE, id); } catch (e) { /* stockage indisponible : tirage sans mémoire */ }
  };
  var choisir = function () {
    var precedent = lireStockage();
    var candidats = VISUELS.filter(function (v) { return v[0] !== precedent; });
    return candidats[Math.floor(Math.random() * candidats.length)];
  };
  try {
    var v = choisir();
    var dossier = "assets/produits/" + v[0];
    // srcset avant src : le navigateur choisit la largeur dans le nouveau jeu, sans repasser par l'ancien.
    img.srcset = dossier + "-320.webp 320w, " + dossier + "-640.webp 640w, " + dossier + "-960.webp 960w";
    img.src = dossier + "-640.webp";
    img.alt = v[1] + ", illustration générée : " + v[2] + ".";
    img.setAttribute("data-visuel", v[0]);
    ecrireStockage(v[0]);
  } catch (e) {
    /* l'image de repli sup-01 du HTML reste affichée */
  }
})();

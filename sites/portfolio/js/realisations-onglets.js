/*
  Onglets « Réalisations » — sites/portfolio/, docs/DIRECTION.md, décision
  « Deux démos dans Réalisations » (6 octobre 2026) et § 11.

  Deux onglets nommés, « Créa’Tif » et « La Tablée des Forges », au-dessus
  d'UNE carte affichée. Motif WAI-ARIA APG des onglets, activation MANUELLE :
    - Tab atteint l'onglet sélectionné (les autres ont tabindex="-1"), puis
      poursuit dans le panneau actif ;
    - flèches gauche/droite déplacent le focus (retour circulaire), Début/Fin
      visent le premier/dernier onglet, sans sélectionner ;
    - Entrée ou Espace (ou un clic) sélectionnent l'onglet focalisé.
  Le panneau inactif est seulement `visibility: hidden` (voir css/style.css,
  § 08) : hors parcours Tab et hors arbre d'accessibilité, mais toujours dans
  la mise en page, donc la zone ne change pas de hauteur et rien ne saute.

  Ce script ne touche ni à `.defilement` ni à js/mouvement-sections.js :
  sélectionner une démo ne rejoue pas l'apparition de la section.

  Repli. La rangée d'onglets est masquée (`hidden`) dans le balisage ; ce
  script la révèle en dernier, une fois tout en place. Sans JavaScript, ou si
  quoi que ce soit échoue, les deux cartes complètes restent visibles dans
  l'ordre du document, avec leurs liens réels : aucun faux onglet inerte.
*/
(function () {
  "use strict";

  var liste = document.querySelector('.projets > [role="tablist"]');
  if (!liste) return;
  var racine = liste.parentNode;
  var onglets = Array.prototype.slice.call(liste.querySelectorAll('[role="tab"]'));
  var panneaux = onglets.map(function (o) {
    return document.getElementById(o.getAttribute("aria-controls"));
  });
  if (onglets.length < 2 || panneaux.some(function (p) { return !p; })) return;

  function selectionner(index) {
    onglets.forEach(function (o, i) {
      var actif = i === index;
      o.setAttribute("aria-selected", actif ? "true" : "false");
      o.setAttribute("tabindex", actif ? "0" : "-1");
      if (actif) panneaux[i].removeAttribute("data-inactif");
      else panneaux[i].setAttribute("data-inactif", "");
    });
  }

  function indexCourant() {
    for (var i = 0; i < onglets.length; i++) {
      if (onglets[i].getAttribute("aria-selected") === "true") return i;
    }
    return 0;
  }

  function annuler() {
    racine.classList.remove("projets--onglets");
    panneaux.forEach(function (p) {
      p.removeAttribute("role");
      p.removeAttribute("aria-labelledby");
      p.removeAttribute("data-inactif");
    });
    liste.hidden = true;
  }

  try {
    panneaux.forEach(function (p, i) {
      p.setAttribute("role", "tabpanel");
      p.setAttribute("aria-labelledby", onglets[i].id);
    });
    racine.classList.add("projets--onglets");
    selectionner(0); // Créa’Tif est actif à l'arrivée

    onglets.forEach(function (o, i) {
      o.addEventListener("click", function () { selectionner(i); });
    });

    liste.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var courant = onglets.indexOf(document.activeElement);
      if (courant < 0) return;
      var cible = -1;
      if (e.key === "ArrowRight") cible = (courant + 1) % onglets.length;
      else if (e.key === "ArrowLeft") cible = (courant - 1 + onglets.length) % onglets.length;
      else if (e.key === "Home") cible = 0;
      else if (e.key === "End") cible = onglets.length - 1;
      if (cible < 0) return;
      e.preventDefault(); // Début/Fin ne doivent pas faire défiler la page
      onglets[cible].focus();
    });

    liste.hidden = false; // en dernier : la rangée n'apparaît que si tout est prêt
  } catch (err) {
    annuler();
  }
})();

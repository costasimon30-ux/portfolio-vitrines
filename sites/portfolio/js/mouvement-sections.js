/*
  Apparition réversible par seuil de défilement — sites/portfolio/,
  docs/DIRECTION.md § 10 « Apparition réversible par seuil de défilement »,
  orientation corrigée du 27 septembre 2026 (décision produit du même jour).
  Remplace intégralement l'ancien § 10 « Rythme de défilement global
  discret » et son mécanisme à déclenchement unique (classes `.mouvement*`,
  un IntersectionObserver par groupe, jamais rejoué) : ce fichier portait ce
  mécanisme sous le même nom, il est réécrit en entier ici.

  Hero et « À propos » restent pleinement visibles en permanence : ce
  script ne les touche jamais, à aucun moment.

  Quatre groupes entiers, sans cascade interne : Réalisations (titre au
  lien « Voir la démo »), Ce que je fais (titre au paragraphe technique),
  Contact (titre, texte, CTA, adresse) et le pied de page (nom, mentions
  légales, retour en haut). Chacun correspond à UN SEUL élément conteneur
  dans le balisage (le `.container` de la section, ou `.site-footer__inner`)
  portant la classe `.defilement` ; voir css/style.css § 14 pour les valeurs
  d'opacité, de translation et de durée, et pour le mécanisme par lequel un
  simple changement de classe produit deux durées/easings différents selon
  le sens (entrée/sortie).

  Principe : `scrollY` sert uniquement à CONSTATER le franchissement d'un
  seuil de position, jamais à calculer une opacité par pixel défilé. Chaque
  vérification compare la position du repère de CONTENU RÉEL du groupe (son
  titre, ou le nom en pied de page) à la hauteur du viewport, selon les
  seuils du § 10 ci-dessous (fonctions entreeDue/sortieDue). La classe
  `--armee` (état caché) est ajoutée ou retirée selon le sens du
  défilement ; css/style.css associe une transition différente à chaque
  sens, ce qui suffit à obtenir un mouvement réversible qui reprend sans
  saut depuis son état courant si le sens change en cours d'animation —
  aucune temporisation ni calcul de progression n'est nécessaire ici.

  Repli, dans tous les cas suivants : `.defilement` sans `--armee` EST déjà
  l'état final en CSS (opacity: 1, transform: none), à toutes les largeurs.
  Ce script n'ajoute donc jamais `--armee` si l'une des conditions
  suivantes est vraie :
    - `matchMedia`, `requestAnimationFrame` ou `getBoundingClientRect`
      indisponibles (mesure du défilement impossible) ;
    - `prefers-reduced-motion: reduce` demandé dès le chargement (la
      requête média réactive en CSS couvre aussi un changement en cours de
      visite, y compris si ce script avait déjà armé un groupe) ;
    - le document ne défile pas (hauteur de page <= hauteur du viewport).
  Sans JavaScript, le même état par défaut s'applique sans qu'aucune de ces
  conditions n'ait à être vérifiée.

  Accès prioritaire : une arrivée par ancre (lien externe, saisie d'URL,
  lien d'évitement, navigation interne via clic/clavier/historique — toutes
  couvertes par `hashchange`, voir l'ancienne version de ce fichier pour le
  détail déjà établi de cette couverture) ou un focus clavier atteignant un
  élément d'un groupe placent ce groupe immédiatement à l'état final, sans
  transition, et le maintiennent net tant que le focus y reste. Un saut de
  défilement important (plus d'une hauteur de viewport d'un coup — clavier
  Origine/Fin, molette rapide, ascenseur) applique de la même façon l'état
  final sans transition au groupe nouvellement visible, plutôt qu'une
  entrée animée qui partirait d'un état jamais vu par l'utilisateur.
*/
(function () {
  "use strict";

  if (
    typeof window.matchMedia !== "function" ||
    typeof window.requestAnimationFrame !== "function" ||
    typeof Element === "undefined" ||
    typeof Element.prototype.getBoundingClientRect !== "function"
  ) {
    return; // repli : mesure du défilement indisponible, état final déjà en place par défaut
  }

  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduit.matches) return; // repli : mouvement réduit demandé dès le chargement (la requête média en CSS couvre aussi un changement en cours de visite)

  var CLASSE_ARMEE = "defilement--armee";

  function hauteurViewport() { return window.innerHeight; }
  function scrollYMax() {
    return Math.max(0, document.documentElement.scrollHeight - hauteurViewport());
  }

  // --- Les quatre groupes : élément conteneur (porte `.defilement`, reçoit
  // la classe `--armee`) et élément de contenu réel servant de repère de
  // position (titre, ou nom en pied de page). `type` sélectionne les seuils
  // du § 10 : "standard" (Réalisations, Ce que je fais), "contact" ou
  // "pied", chacun avec ses conditions propres (entreeDue/sortieDue
  // ci-dessous). ---
  function construireGroupe(conteneurSelecteur, titreSelecteur, type) {
    var conteneur = document.querySelector(conteneurSelecteur);
    var titre = document.querySelector(titreSelecteur);
    if (!conteneur || !titre) return null;
    return { conteneur: conteneur, titre: titre, type: type || "standard", armee: false, verrouille: false };
  }

  var GROUPES = [
    construireGroupe("#realisations > .container", "#realisations-title", "standard"),
    construireGroupe("#prestations > .container", "#prestations-title", "standard"),
    construireGroupe(".contact > .container", "#contact-title", "contact"),
    construireGroupe(".site-footer__inner", ".site-footer__nom", "pied")
  ].filter(Boolean);

  if (!GROUPES.length) return;

  // --- Seuils du § 10. `ratio` = position du haut du repère de contenu
  // divisée par la hauteur du viewport ; `distanceBas` = distance restante,
  // en pixels, avant le bas absolu du défilement (scrollYmax). ---
  function entreeDue(g, ratio, distanceBas, h) {
    if (g.type === "pied") return ratio <= 0.90 || distanceBas < 0.30 * h;
    if (g.type === "contact") return ratio <= 0.85 || distanceBas < 0.45 * h;
    return ratio <= 0.85;
  }
  function sortieDue(g, ratio, distanceBas, h) {
    if (g.type === "pied") return ratio >= 0.97 && distanceBas > 0.40 * h;
    if (g.type === "contact") return ratio >= 0.92 && distanceBas > 0.55 * h;
    return ratio >= 0.92;
  }

  // --- Bascule d'état sans transition : durée et délai à zéro, prise en
  // compte forcée, changement de classe, puis restauration en deux frames
  // successives (le temps qu'un premier rendu à l'état posé soit
  // effectivement commis) — même technique que l'ancienne version de ce
  // fichier, pour la même raison : une restauration trop précoce peut
  // laisser démarrer une transition parasite (constaté empiriquement sur
  // les arrivées par ancre lors du correctif QA-MVT-01). ---
  function appliquerSansTransition(conteneur, fn) {
    conteneur.style.transitionDuration = "0s";
    conteneur.style.transitionDelay = "0s";
    void conteneur.offsetWidth;
    fn();
    void conteneur.offsetWidth;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        conteneur.style.transitionDuration = "";
        conteneur.style.transitionDelay = "";
      });
    });
  }

  function reveler(g, instantane) {
    if (!g.armee) return;
    g.armee = false;
    if (instantane) {
      appliquerSansTransition(g.conteneur, function () {
        g.conteneur.classList.remove(CLASSE_ARMEE);
      });
    } else {
      g.conteneur.classList.remove(CLASSE_ARMEE);
    }
  }
  function masquer(g) {
    if (g.armee) return;
    g.armee = true;
    // Toujours animée (300ms/250ms déclarés en CSS) : la sortie n'est
    // jamais instantanée, seule l'entrée peut l'être (accès prioritaire,
    // saut important, état initial).
    g.conteneur.classList.add(CLASSE_ARMEE);
  }

  // --- État initial : un groupe déjà dans la zone de lecture (ou une page
  // qui ne défile pas) reste visible sans fade ; les autres sont armés
  // instantanément, avant tout défilement — donc sans transition visible. ---
  function etatInitial() {
    var h = hauteurViewport();
    var sMax = scrollYMax();
    var pasDeDefilement = sMax <= 0;
    var distanceBas = sMax - window.scrollY;
    GROUPES.forEach(function (g) {
      var ratio = g.titre.getBoundingClientRect().top / h;
      var dejaVisible = pasDeDefilement || entreeDue(g, ratio, distanceBas, h);
      if (!dejaVisible) {
        appliquerSansTransition(g.conteneur, function () {
          g.conteneur.classList.add(CLASSE_ARMEE);
        });
        g.armee = true;
      }
    });
  }

  function estDansLeViewport(el, h) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < h;
  }

  var dernierScrollY = window.scrollY;
  var direction = null; // "bas" | "haut" | null (aucun défilement encore observé)

  function verifier(sautImportant) {
    var h = hauteurViewport();
    var sMax = scrollYMax();
    var distanceBas = sMax - window.scrollY;

    GROUPES.forEach(function (g) {
      if (g.verrouille) return; // focus à l'intérieur : jamais masqué, voir plus bas

      if (g.armee && sautImportant && estDansLeViewport(g.conteneur, h)) {
        // Saut de défilement important ayant rendu le groupe visible d'un
        // coup (clavier Origine/Fin, molette rapide, ascenseur) : état
        // final immédiat, quel que soit le sens — voir note de tête.
        reveler(g, true);
        return;
      }

      var ratio = g.titre.getBoundingClientRect().top / h;
      if (g.armee) {
        if (direction === "bas" && entreeDue(g, ratio, distanceBas, h)) reveler(g, false);
      } else {
        if (direction === "haut" && sortieDue(g, ratio, distanceBas, h)) masquer(g);
      }
    });
  }

  function resynchroniser() {
    // Redimensionnement ou zoom : aucune animation liée au changement de
    // fenêtre lui-même (ce n'est pas un défilement), seulement une mise à
    // jour immédiate si les seuils, recalculés avec la nouvelle hauteur,
    // changent l'état attendu.
    var h = hauteurViewport();
    var sMax = scrollYMax();
    var pasDeDefilement = sMax <= 0;
    var distanceBas = sMax - window.scrollY;
    GROUPES.forEach(function (g) {
      if (g.verrouille) return;
      var ratio = g.titre.getBoundingClientRect().top / h;
      var doitEtreVisible = pasDeDefilement || entreeDue(g, ratio, distanceBas, h);
      if (doitEtreVisible && g.armee) reveler(g, true);
      else if (!doitEtreVisible && !g.armee) masquer(g);
    });
  }

  var tickDefilement = false;
  function surDefilement() {
    if (tickDefilement) return;
    tickDefilement = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY;
      var h = hauteurViewport();
      var delta = Math.abs(y - dernierScrollY);
      if (y > dernierScrollY) direction = "bas";
      else if (y < dernierScrollY) direction = "haut";
      dernierScrollY = y;
      verifier(delta > h);
      tickDefilement = false;
    });
  }

  var tickRedim = false;
  function surRedimensionnement() {
    if (tickRedim) return;
    tickRedim = true;
    window.requestAnimationFrame(function () {
      resynchroniser();
      tickRedim = false;
    });
  }

  // --- Accès prioritaire : ancre, lien d'évitement, focus clavier, retour/
  // avant d'historique. Un groupe visé (cible égale, contenant ou contenu
  // par son conteneur) est révélé immédiatement, sans attendre le cycle
  // normal de défilement — même principe que l'ancienne version de ce
  // fichier pour la détection de la cible. ---
  function groupePourCible(cible) {
    if (!cible) return null;
    for (var i = 0; i < GROUPES.length; i++) {
      var c = GROUPES[i].conteneur;
      if (cible === c || c.contains(cible) || cible.contains(c)) return GROUPES[i];
    }
    return null;
  }
  function revelerPourCible(cible) {
    var g = groupePourCible(cible);
    if (g && g.armee) reveler(g, true);
  }

  var hashInitiale = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
  window.addEventListener("hashchange", function () {
    var cible = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
    revelerPourCible(cible);
  });

  // --- Focus clavier : un groupe contenant l'élément focalisé reste net
  // tant que le focus y demeure (verrouillage), quel que soit le seuil de
  // défilement ; il reprend le cycle normal dès que le focus en sort — le
  // prochain évènement de défilement suffit, aucune ré-évaluation immédiate
  // n'est nécessaire puisqu'un groupe encore dans la zone de lecture ne
  // remplirait de toute façon pas une condition de sortie. ---
  document.addEventListener("focusin", function (e) {
    GROUPES.forEach(function (g) {
      var dedans = g.conteneur.contains(e.target);
      g.verrouille = dedans;
      if (dedans && g.armee) reveler(g, true);
    });
  });
  document.addEventListener("focusout", function (e) {
    if (e.relatedTarget) return; // un focusin suivra et mettra à jour verrouille correctement
    window.setTimeout(function () {
      GROUPES.forEach(function (g) { g.verrouille = g.conteneur.contains(document.activeElement); });
    }, 0);
  });

  etatInitial();
  if (hashInitiale) revelerPourCible(hashInitiale);

  window.addEventListener("scroll", surDefilement, { passive: true });
  window.addEventListener("resize", surRedimensionnement);
})();

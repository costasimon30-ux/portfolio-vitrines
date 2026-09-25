/*
  Mouvement de défilement global — sites/portfolio/, docs/DIRECTION.md
  § 10 « Rythme de défilement global discret », direction validée par
  Simon le 24 septembre 2026 (commit documentaire 39b4cc4). Remplace
  l'ancienne exception limitée à la seule carte Créa'Tif (auparavant
  js/mouvement-realisations.js, renommé ici).

  Quatre groupes, chacun un seul déclenchement, jamais rejoué :
    - À propos : le titre et le bloc de texte, ensemble, 10px depuis la
      gauche, 0,96 → 1, 300ms.
    - Réalisations : la carte Créa'Tif entière, un seul bloc, 8px depuis la
      gauche, 0,94 → 1, 280ms.
    - Ce que je fais : les cartes de prestations, par rangée de deux (grille
      à deux colonnes à partir de 768px), 8px depuis le bas, 0,96 → 1,
      280ms, décalage maximal de 60ms entre les deux cartes d'une même
      rangée — jamais de cascade sur le reste de la grille.
    - Contact : le titre, le texte et l'action, ensemble, 8px depuis le bas,
      0,96 → 1, 280ms ; le CTA et l'e-mail restent utilisables sans délai,
      seule leur apparence est concernée.
  Hero, pied de page, bascule de thème, et titres/introductions de
  Réalisations et Ce que je fais restent statiques : ce script ne les
  touche jamais.

  Principe de repli : l'état par défaut de chaque élément, en CSS, est déjà
  son état final — entièrement visible, immobile. Ce script n'ajoute JAMAIS
  d'état intermédiaire tant que toutes les conditions ci-dessous ne sont pas
  réunies :
    - IntersectionObserver et matchMedia disponibles,
    - `prefers-reduced-motion: reduce` non demandé,
    - largeur CSS effective >= 768px (recalculée au déclenchement : un
      redimensionnement ou un zoom qui repasse sous ce seuil avant l'entrée
      dans le viewport annule l'attente et force l'état final pour tous les
      groupes encore en attente).
  Sans JavaScript, sous 768px, avec un mouvement réduit ou si l'observation
  d'entrée est indisponible, chaque groupe reste donc dans l'état statique
  défini par défaut dans css/style.css.

  Arrivée directe par ancre (lien externe, saisie d'URL, lien d'évitement) :
  si la cible du fragment d'URL est ou contient un membre d'un groupe, ce
  groupe n'est jamais armé — il reste dans son état final par défaut, sans
  qu'aucune transition ne soit possible. `#main`, la cible du lien
  d'évitement, contient tous les groupes : son activation en cours de
  session (le focus atteint `#main` sans recharger la page) révèle donc
  tout immédiatement, au même titre qu'un chargement direct sur cette ancre.

  Focus clavier : si le focus atteint un élément d'un groupe (ou un de ses
  descendants) avant le déclenchement normal, ce groupe seul passe
  immédiatement à son état final, focus conservé — jamais de groupe
  atténué sous le focus.

  Navigation par ancre interne en cours de session (clic sur un lien
  `href="#..."`, activation clavier de ce même lien, changement de
  fragment, retour/avant) : traitée comme une arrivée par ancre à part
  entière, via l'évènement `hashchange` — état final immédiat pour le
  groupe ciblé (cible égale, contenue par, ou contenant un de ses
  éléments), sans attendre l'observateur d'intersection, même si un
  défilement réel de l'utilisateur a déjà eu lieu par ailleurs.

  Détection « défilement réel de l'utilisateur » (et non simple
  déclenchement de l'observateur) : un groupe déjà visible sans qu'aucun
  défilement volontaire (molette, tactile, touches de défilement au
  clavier) n'ait encore eu lieu doit rester instantané, même si ce n'est
  pas littéralement le tout premier signalement de l'observateur — un
  redimensionnement de la mise en page après chargement (ex. permutation
  de police) ou un défilement natif du navigateur vers une ancre d'arrivée
  peuvent retarder ce premier signalement au-delà du tout premier appel,
  sans que l'utilisateur ait lui-même défilé. Un simple compteur « premier
  passage » par groupe confondrait alors ce cas avec un franchissement
  réel pendant le défilement et déclencherait, à tort, une transition
  animée. Un indicateur global, mis à vrai uniquement par une interaction
  de défilement authentique (molette, geste tactile, touches de
  défilement au clavier — jamais par un défilement programmatique comme
  l'ancrage natif ou `scrollIntoView`), évite cette confusion : tant qu'il
  reste faux, toute révélation est instantanée ; dès qu'il passe à vrai,
  les révélations suivantes sont animées.
*/
(function () {
  "use strict";

  if (typeof window.matchMedia !== "function" || !("IntersectionObserver" in window)) {
    return; // repli : IntersectionObserver indisponible, état final déjà en place par défaut
  }

  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduit.matches) return; // repli : mouvement réduit demandé

  var largeurMin = window.matchMedia("(min-width: 768px)");
  if (!largeurMin.matches) return; // repli : sous 768px dès le chargement

  var CLASSE_ARMEE = "mouvement--armee";
  var CLASSE_REVELE = "mouvement--revele";

  var hashCible = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;

  // Vrai si la cible d'ancre et l'élément d'un groupe se recouvrent, dans
  // un sens OU dans l'autre : la cible peut être (ou contenir) l'élément du
  // groupe — cas déjà couvert —, mais aussi être un DESCENDANT de cet
  // élément (ex. une ancre pointant vers un sous-élément à l'intérieur du
  // bloc Contact) : ce second sens manquait — relevé par la revue de code
  // du 25 septembre 2026, corrigé ici.
  function cibleContientOuEst(cible, el) {
    return !!cible && (cible === el || cible.contains(el) || el.contains(cible));
  }

  // Vrai uniquement après un défilement volontairement déclenché par
  // l'utilisateur (molette, geste tactile, touches de défilement au
  // clavier) — jamais par un défilement programmatique (ancrage natif au
  // chargement, `scrollIntoView`, etc.). Voir la note en tête de fichier.
  var interactionDefilement = false;
  function marquerInteraction() { interactionDefilement = true; }
  window.addEventListener("wheel", marquerInteraction, { passive: true, once: true });
  window.addEventListener("touchstart", marquerInteraction, { passive: true, once: true });
  var TOUCHES_DEFILEMENT = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"];
  window.addEventListener("keydown", function (e) {
    if (TOUCHES_DEFILEMENT.indexOf(e.key) !== -1) marquerInteraction();
  });

  var tousLesGroupes = [];

  function creerGroupe(elements) {
    elements = elements.filter(Boolean);
    if (!elements.length) return null;

    if (elements.some(function (el) { return cibleContientOuEst(hashCible, el); })) {
      return null; // arrivée directe par ancre : jamais armé
    }

    var groupe = { revele: false, observer: null, elements: elements };

    function surFocus() { reveler(true); }
    function detacherFocus() {
      elements.forEach(function (el) { el.removeEventListener("focusin", surFocus); });
    }
    elements.forEach(function (el) { el.addEventListener("focusin", surFocus); });

    // Armement : durée et délai à zéro pour que cette toute première
    // application de la classe atténuée ne déclenche elle-même aucune
    // transition. Cette mise à zéro n'est PAS restaurée ici : elle ne
    // l'est que par `reveler` lui-même, seul moment où la vraie durée
    // redevient utile. Une restauration programmée séparément ici, en
    // parallèle de celle de `reveler`, provoquait — constaté
    // empiriquement sur les arrivées directes par ancre, où le
    // défilement natif vers la cible retarde le franchissement du seuil
    // de visibilité — une course entre deux minuteurs différés qui
    // pouvait démarrer une transition parasite au moment même où elle
    // était censée être neutralisée.
    elements.forEach(function (el) {
      el.style.transitionDuration = "0s";
      el.style.transitionDelay = "0s";
    });
    elements.forEach(function (el) { void el.offsetWidth; }); // force la prise en compte
    elements.forEach(function (el) { el.classList.add(CLASSE_ARMEE); });

    function reveler(instantane) {
      if (groupe.revele) return;
      groupe.revele = true;
      if (groupe.observer) { groupe.observer.disconnect(); groupe.observer = null; }
      detacherFocus();
      if (instantane) {
        // Durée et délai à zéro (déjà le cas depuis l'armement, refixés
        // ici par sûreté) : bascule d'état strictement immédiate, puis
        // restauration de la vraie transition en deux frames successives
        // (le temps qu'un premier rendu à l'état final soit effectivement
        // commis) — nécessaire pour que la bascule de thème continue
        // ensuite de s'animer normalement sur ces éléments.
        elements.forEach(function (el) {
          el.style.transitionDuration = "0s";
          el.style.transitionDelay = "0s";
        });
        elements.forEach(function (el) { void el.offsetWidth; });
        elements.forEach(function (el) {
          el.classList.remove(CLASSE_ARMEE);
          el.classList.add(CLASSE_REVELE);
        });
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            elements.forEach(function (el) {
              el.style.transitionDuration = "";
              el.style.transitionDelay = "";
            });
          });
        });
      } else {
        // Révélation animée : on redonne d'abord la vraie durée CSS et on
        // force sa prise en compte avant de changer l'état, pour que la
        // transition parte bien de l'état atténué avec la durée déclarée.
        elements.forEach(function (el) {
          el.style.transitionDuration = "";
          el.style.transitionDelay = "";
        });
        elements.forEach(function (el) { void el.offsetWidth; });
        elements.forEach(function (el) {
          el.classList.remove(CLASSE_ARMEE);
          el.classList.add(CLASSE_REVELE);
        });
      }
    }
    groupe.reveler = reveler;

    groupe.observer = new IntersectionObserver(function (entrees) {
      var visible = entrees.some(function (e) { return e.isIntersecting; });
      // Instantané tant qu'aucun défilement volontaire de l'utilisateur n'a
      // encore eu lieu (voir la note en tête de fichier) ; animé ensuite,
      // à chaque franchissement authentique pendant que l'utilisateur
      // défile.
      if (visible) reveler(!interactionDefilement);
    }, { threshold: 0.2 });
    elements.forEach(function (el) { groupe.observer.observe(el); });

    tousLesGroupes.push(groupe);
    return groupe;
  }

  // --- À propos : titre + texte, un seul groupe, sans décalage ---
  creerGroupe([
    document.getElementById("a-propos-title"),
    document.querySelector(".a-propos__texte")
  ]);

  // --- Réalisations : la carte Créa'Tif, un seul membre ---
  creerGroupe([document.querySelector(".carte-projet.mouvement--gauche-8")]);

  // --- Contact : titre + texte + action, un seul groupe (le conteneur
  // .container porte lui-même les trois, aucun décalage entre eux) ---
  creerGroupe([document.querySelector(".contact > .container")]);

  // --- Ce que je fais : cartes de prestations, par rangée de deux ---
  // Couplé à la grille à deux colonnes posée par `.grille-prestations`
  // (css/style.css § 09) à partir de 768px, seule largeur où ce script
  // agit — à ajuster ensemble si le nombre de colonnes change.
  (function () {
    var COLONNES = 2;
    var cartes = Array.prototype.slice.call(document.querySelectorAll(".grille-prestations .prestation"));
    for (var i = 0; i < cartes.length; i += COLONNES) {
      creerGroupe(cartes.slice(i, i + COLONNES));
    }
  })();

  // --- Repli largeur : franchissement sous 768px force l'état final pour
  // tous les groupes encore en attente ---
  function surChangementLargeur() {
    if (!largeurMin.matches) {
      tousLesGroupes.forEach(function (g) { if (g && !g.revele) g.reveler(true); });
    }
  }
  if (largeurMin.addEventListener) largeurMin.addEventListener("change", surChangementLargeur);
  else if (largeurMin.addListener) largeurMin.addListener(surChangementLargeur);

  // --- Lien d'évitement : le focus atteignant #main (sa cible, sans
  // rechargement) révèle tout immédiatement, comme une arrivée par ancre ---
  var principal = document.getElementById("main");
  if (principal) {
    principal.addEventListener("focus", function () {
      tousLesGroupes.forEach(function (g) { if (g && !g.revele) g.reveler(true); });
    });
  }

  // --- Navigation par ancre interne en cours de session (clic, activation
  // clavier, changement de fragment, retour/avant) : doit produire le même
  // résultat qu'un chargement direct sur cette ancre — état final immédiat
  // pour le groupe ciblé, SANS attendre l'IntersectionObserver. Avant ce
  // correctif, un groupe pas encore révélé mais déjà armé restait soumis
  // au seul indicateur de défilement réel : si l'utilisateur avait défilé
  // ne serait-ce qu'un peu AVANT d'activer un lien d'ancre interne (ex. le
  // CTA du hero vers #contact), le défilement natif vers la cible faisait
  // franchir le seuil de visibilité avec cet indicateur déjà à vrai, donc
  // une révélation ANIMÉE au lieu de l'état final immédiat requis par le
  // § 10 — défaut relevé indépendamment par la revue de code et la QA du
  // 25 septembre 2026 sur ce CTA précis. `hashchange` couvre uniformément
  // le clic, l'activation clavier (Entrée) et la navigation retour/avant
  // qui change le fragment ; se déclenche avant que le défilement natif
  // (animé par `scroll-behavior: smooth`) n'ait eu le temps d'amener la
  // cible dans le viewport, donc avant tout signalement de l'observateur.
  function revelerPourCible(cible) {
    if (!cible) return;
    tousLesGroupes.forEach(function (g) {
      if (!g || g.revele) return;
      if (g.elements.some(function (el) { return cibleContientOuEst(cible, el); })) {
        g.reveler(true);
      }
    });
  }
  window.addEventListener("hashchange", function () {
    var cible = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
    revelerPourCible(cible);
  });
})();

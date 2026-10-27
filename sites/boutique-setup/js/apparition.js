/*
  Ligne Posée — apparition discrète des blocs non essentiels (docs/DIRECTION.md, mouvement ; docs/ARCHITECTURE.md § 7).
  Script classique différé, de la page d'accueil seulement. Il n'observe que les éléments marqués
  [data-apparition] : au premier passage dans le viewport, un bloc passe de « légèrement décalé et
  transparent » (≤ 12 px, ≤ 250 ms, voir css/style.css) à son état final, une seule fois. Rien n'est capturé :
  le défilement reste natif, aucune action n'attend cet effet.

  Garde-fous :
    - sans JavaScript, ou si ce fichier échoue, aucune classe d'attente n'existe : tout est visible ;
    - avec prefers-reduced-motion: reduce, ou sans IntersectionObserver, le script ne fait rien ;
    - un bloc déjà dans le viewport (ou au-dessus) au démarrage est révélé immédiatement, sans transition ;
    - un délai de sécurité de 3 s révèle tout ce qui resterait en attente.
*/
(function () {
  "use strict";
  if (typeof window.IntersectionObserver !== "function") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var blocs = Array.prototype.slice.call(document.querySelectorAll("[data-apparition]"));
  if (!blocs.length) return;

  var racine = document.documentElement;
  var voir = function (el) {
    el.classList.add("apparition--vue");
  };
  var h = window.innerHeight || 0;
  var attente = blocs.filter(function (el) {
    return el.getBoundingClientRect().top > h * 0.9;
  });
  blocs.forEach(function (el) {
    if (attente.indexOf(el) === -1) voir(el);
  });
  if (!attente.length) return;

  racine.classList.add("js-apparition");
  var observateur = new window.IntersectionObserver(
    function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        voir(e.target);
        observateur.unobserve(e.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );
  attente.forEach(function (el) {
    observateur.observe(el);
  });
  window.setTimeout(function () {
    attente.forEach(voir);
  }, 3000);
})();

/*
  Ligne Posée — éléments d'interface partagés par panier.html, commande.html et confirmation.html
  (lot 2). Tout contenu est inséré comme du texte (dom.js) : jamais d'innerHTML. Les montants
  affichés viennent des centimes déjà calculés par panier-core.js.
*/
import { el } from "./dom.js";
import { formaterMontant } from "./panier-core.js";

/**
 * Mécanisme d'attente de js/attente-page.js. `repliAffiche()` : le repli statique a déjà été affiché
 * (module démarré trop tard) : la page ne doit rien remplacer. `demarrer()` marque le démarrage du
 * module ; `libererAttente()` rend les liens de retour et le pied de page une fois le contenu rendu.
 */
export function repliAffiche() {
  return document.documentElement.hasAttribute("data-page-repli");
}
export function demarrer() {
  document.documentElement.setAttribute("data-page-module", "");
}
export function libererAttente() {
  document.documentElement.classList.remove("page-attente");
}

/** Annonce non intrusive dans la zone role="status" de la page (aria-live="polite"). */
export function annoncer(texte) {
  const zone = document.getElementById("statut");
  if (!zone) return;
  zone.textContent = "";
  requestAnimationFrame(() => {
    zone.textContent = texte;
  });
}

/** Bloc d'état explicatif. `alerte` : problème à signaler (rôle alert), sinon simple note. */
export function etat(titre, paragraphes, extras = [], { alerte = false } = {}) {
  return el(
    "div",
    { class: alerte ? "etat etat--alerte" : "etat", role: alerte ? "alert" : "note" },
    titre ? el("p", {}, el("strong", {}, titre)) : null,
    paragraphes.map((p) => el("p", {}, p)),
    extras
  );
}

export function lienCatalogue(texte = "Voir le catalogue") {
  return el("p", {}, el("a", { class: "bouton bouton--secondaire", href: "catalogue.html" }, texte));
}

export function nomLigne(ligne) {
  return `${ligne.modeleNom ?? ligne.modele} — ${ligne.finition}`;
}

/**
 * Lecture seule d'une ligne : produit, finition, SKU, « quantité × prix unitaire » et sous-total.
 * Accepte une ligne vérifiée (modeleNom/quantite) ou une ligne de capture (modele/quantite).
 */
export function ligneRecap(ligne) {
  return el(
    "li",
    { class: "recap__ligne" },
    el(
      "div",
      { class: "recap__nom" },
      el("strong", {}, ligne.modeleNom ?? ligne.modele),
      " — ",
      ligne.finition,
      el("span", { class: "recap__sku" }, "Référence ", el("code", {}, ligne.sku))
    ),
    el("p", { class: "recap__calcul" }, `${ligne.quantite} × ${formaterMontant(ligne.prixCents)}`),
    el("p", { class: "recap__montant" }, el("span", { class: "sr-seulement" }, "Sous-total : "), formaterMontant(ligne.sousTotalCents))
  );
}

/** Totaux : « Produits », « Livraison fictive », « Total de la simulation ». */
export function totaux({ produitsCents, livraison, totalCents }, { id = null, live = false } = {}) {
  return el(
    "dl",
    { class: "totaux", id, "aria-live": live ? "polite" : null, "aria-atomic": live ? "true" : null },
    el("div", {}, el("dt", {}, "Produits"), el("dd", {}, formaterMontant(produitsCents))),
    el("div", {}, el("dt", {}, `Livraison fictive (${livraison.libelle})`), el("dd", {}, formaterMontant(livraison.cents))),
    el("div", { class: "totaux__total" }, el("dt", {}, "Total de la simulation"), el("dd", {}, formaterMontant(totalCents)))
  );
}

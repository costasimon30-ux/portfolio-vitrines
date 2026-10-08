/*
  Ligne Posée — contrôleur de confirmation.html (lot 2).
  Affiche la capture figée de la simulation terminée dans cet onglet, et seulement elle : sans
  capture valide (arrivée directe, stockage absent, capture illisible ou incohérente), aucun succès
  n'est présenté. La page ne fait que lire : la recharger ne déclenche aucune seconde opération.
  Elle n'a pas besoin du catalogue : la capture contient les noms, finitions et montants figés.
*/
import { el, vider } from "./dom.js";
import * as P from "./panier-core.js";
import { etat, lienCatalogue, ligneRecap, totaux } from "./panier-ui.js";

const $ = (id) => document.getElementById(id);

function rendre() {
  const zone = $("confirmation-zone");
  vider(zone);
  $("confirmation-repli").hidden = true;
  const lecture = P.lireConfirmation(P.obtenirMagasin(window));

  if (lecture.statut !== "ok") {
    $("confirmation-chapeau").hidden = true;
    const detail =
      lecture.statut === "illisible"
        ? "Le récapitulatif conservé dans cet onglet est illisible ou incohérent : il n’est pas affiché et ne vaut pas confirmation."
        : lecture.statut === "stockage-indisponible"
          ? "Le stockage de cet onglet est indisponible : aucune simulation ne peut y être retrouvée."
          : "Une simulation se termine depuis la page de commande, une fois le panier validé.";
    zone.append(etat("Aucune simulation terminée dans cet onglet.", [detail, "Aucune commande n’a été envoyée et aucun paiement n’a été effectué."], [lienCatalogue("Retour au catalogue")]));
    return;
  }

  const c = lecture.capture;
  $("confirmation-chapeau").hidden = false;
  zone.append(
    el(
      "div",
      { class: "etat etat--succes", role: "status" },
      el("p", {}, el("strong", {}, "Simulation terminée."), " Aucune commande n’a été envoyée et aucun paiement n’a été effectué.")
    ),
    el("h2", { class: "titre-liste" }, "Récapitulatif de la simulation"),
    el("ul", { class: "recap" }, c.lignes.map((l) => ligneRecap(l))),
    totaux({ produitsCents: c.produitsCents, livraison: c.livraison, totalCents: c.totalCents }),
    el("p", { class: "aide" }, "Ce récapitulatif est figé à la validation et reste le même tant que cet onglet est ouvert. Il n’a ni numéro de commande, ni facture, ni statut d’expédition."),
    el("p", {}, el("a", { class: "bouton", href: "catalogue.html" }, "Retour au catalogue"))
  );
}

rendre();
window.addEventListener("pageshow", (ev) => {
  if (ev.persisted) rendre();
});

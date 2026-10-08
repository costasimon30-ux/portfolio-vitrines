/*
  Ligne Posée — contrôleur de commande.html (lot 2) : récapitulatif unique, sans formulaire
  d'identité. Produits et finitions relus du catalogue validé, choix d'une livraison fictive
  (Standard 4,90 € par défaut / Express 9,90 €), puis « Terminer la simulation ». Chaque calcul
  repart du panier stocké et revérifié ; aucune commande n'est envoyée.
*/
import { validerCatalogue } from "./catalogue-core.js";
import { el, vider, chargerCatalogue } from "./dom.js";
import * as P from "./panier-core.js";
import { annoncer, demarrer, libererAttente, repliAffiche, etat, lienCatalogue, ligneRecap, totaux } from "./panier-ui.js";

const $ = (id) => document.getElementById(id);
const magasin = P.obtenirMagasin(window);
const m = P.formaterMontant;

let catalogue = null;
let livraisonId = P.LIVRAISON_DEFAUT; // Standard à chaque nouveau passage
let enCours = false; // « Terminer la simulation » : une seule activation à la fois

function lienPanier(texte = "Retour au panier") {
  return el("a", { class: "bouton bouton--secondaire", href: "panier.html" }, texte);
}

/** Panier stocké revérifié contre le catalogue : seule source des montants affichés. */
function etatCommande() {
  const lecture = P.lirePanier(magasin);
  if (lecture.statut !== "ok" && lecture.statut !== "vide") return { statut: lecture.statut };
  if (lecture.lignes.length === 0 && lecture.rejets.length === 0) return { statut: "vide" };
  if (!catalogue) return { statut: "catalogue-indisponible" };
  const verification = P.verifierPanier(lecture, catalogue);
  return verification.fiable ? { statut: "ok", verification } : { statut: "a-reparer", verification };
}

function messageEtat(e) {
  switch (e.statut) {
    case "stockage-indisponible":
      return etat("Commande simulée indisponible dans ce navigateur.", ["Le stockage de cet onglet est absent ou refusé : le panier ne peut pas être conservé, donc aucune simulation n’est possible. Le catalogue reste consultable."], [lienCatalogue()]);
    case "corrompu":
      return etat("Le panier enregistré est illisible.", ["Aucun récapitulatif ni total n’est affiché. Ouvrez le panier pour repartir d’un panier vide."], [el("p", {}, lienPanier("Ouvrir le panier"))], { alerte: true });
    case "vide":
      return etat("Votre panier est vide : il n’y a rien à récapituler.", ["Aucune simulation ne peut être terminée sans article. Si vous venez de terminer une simulation, elle n’est pas rejouée ici."], [lienCatalogue()]);
    case "catalogue-indisponible":
      return etat("Récapitulatif indisponible : le catalogue n’a pas pu être vérifié.", ["Les noms, finitions et prix sont relus du catalogue ; sans lui, aucun total n’est affiché et la simulation ne peut pas être terminée. Rien n’a été modifié. Rechargez la page pour réessayer."], [el("p", {}, lienPanier())], { alerte: true });
    default:
      return etat("Certaines lignes du panier ne peuvent pas être vérifiées.", ["Aucun total n’est affiché et la simulation ne peut pas être terminée. Ouvrez le panier pour écarter les lignes invalides."], [el("p", {}, lienPanier("Ouvrir le panier"))], { alerte: true });
  }
}

function rendre(avis = null) {
  const zone = $("commande-zone");
  vider(zone);
  $("commande-repli").hidden = true;
  if (avis) zone.append(avis);
  const e = etatCommande();
  if (e.statut !== "ok") {
    zone.append(messageEtat(e));
    return;
  }
  const { verification } = e;
  const commande = P.calculerCommande(verification.totalProduitsCents, livraisonId);

  const radios = P.LIVRAISONS.map((l) => {
    const id = `livraison-${l.id}`;
    const radio = el("input", { type: "radio", id, name: "livraison", value: l.id, checked: l.id === livraisonId });
    return el("label", { class: "variante", for: id }, radio, el("span", { class: "variante__nom" }, l.libelle), el("span", { class: "variante__prix" }, m(l.cents)));
  });
  const choix = el(
    "fieldset",
    { class: "livraison" },
    el("legend", {}, "Livraison fictive"),
    radios,
    el("p", { class: "aide" }, "Montants de démonstration, sans offre de transport ni promesse de délai.")
  );
  choix.addEventListener("change", (ev) => {
    const cible = ev.target;
    if (!(cible instanceof HTMLInputElement) || cible.name !== "livraison" || !P.livraisonParId(cible.value)) return;
    livraisonId = cible.value;
    // Les montants sont recalculés depuis le panier stocké revérifié, pas depuis un texte affiché.
    const courant = etatCommande();
    if (courant.statut !== "ok") return rendre();
    const c = P.calculerCommande(courant.verification.totalProduitsCents, livraisonId);
    const nouveau = totaux(c, { id: "totaux", live: true });
    $("totaux").replaceWith(nouveau);
    annoncer(`Livraison ${c.livraison.libelle} : ${m(c.livraison.cents)}. Total de la simulation : ${m(c.totalCents)}.`);
  });

  const terminer = el("button", { type: "button", class: "bouton", id: "terminer", "aria-describedby": "terminer-note" }, "Terminer la simulation");
  terminer.addEventListener("click", () => finaliser(terminer));

  zone.append(
    el("h2", { class: "titre-liste" }, "Votre panier"),
    el("ul", { class: "recap" }, verification.lignes.map(ligneRecap)),
    el("p", {}, el("a", { class: "lien-action", href: "panier.html" }, "Modifier le panier")),
    choix,
    totaux(commande, { id: "totaux", live: true }),
    el(
      "div",
      { class: "validation" },
      terminer,
      el("p", { class: "aide", id: "terminer-note" }, "Aucune commande ne sera envoyée et aucun paiement ne sera effectué.")
    ),
    el("div", { id: "erreur-terminer" })
  );
}

function finaliser(bouton) {
  if (enCours) return;
  enCours = true;
  bouton.disabled = true;
  bouton.setAttribute("aria-busy", "true");
  const choisi = document.querySelector('input[name="livraison"]:checked');
  const r = P.terminerSimulation({ magasin, catalogue, livraisonId: choisi ? choisi.value : livraisonId });
  if (r.ok) {
    annoncer("Simulation terminée. Ouverture de la confirmation.");
    location.assign("confirmation.html"); // enCours reste vrai : aucune seconde validation depuis cette page
    return;
  }
  enCours = false;
  annoncer(r.message);
  if (r.code === "ecriture-echouee" || r.code === "livraison-invalide") {
    // Le panier est intact : on réaffiche l'erreur à côté du bouton, réactivé pour une nouvelle tentative.
    bouton.disabled = false;
    bouton.removeAttribute("aria-busy");
    const zone = $("erreur-terminer");
    vider(zone);
    zone.append(etat("La simulation n’a pas été terminée.", [r.message, "Aucune confirmation n’a été produite et le panier est inchangé."], [], { alerte: true }));
    return;
  }
  rendre(etat("La simulation n’a pas été terminée.", [r.message], [], { alerte: true }));
}

async function amorcer() {
  if (repliAffiche()) return; // module arrivé après le repli statique : on ne remplace rien
  demarrer();
  $("commande-repli").hidden = true;
  $("commande-zone").append(el("p", {}, "Chargement du récapitulatif…"));
  try {
    const resultat = await chargerCatalogue(validerCatalogue);
    if (resultat.ok) catalogue = resultat.catalogue;
    else console.error("Ligne Posée : catalogue indisponible ou invalide —", resultat.erreurs.join(" | "));
  } catch (e) {
    console.error("Ligne Posée : échec d'initialisation de la commande —", e);
  }
  try {
    rendre();
  } finally {
    libererAttente();
  }
  // Retour par l'historique : tout est reconstruit depuis le stockage (un panier déjà validé est vide).
  window.addEventListener("pageshow", (ev) => {
    if (ev.persisted) {
      enCours = false;
      livraisonId = P.LIVRAISON_DEFAUT;
      rendre();
    }
  });
}

amorcer();

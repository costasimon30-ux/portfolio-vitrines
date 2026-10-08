/*
  Ligne Posée — contrôleur de panier.html (lot 2).
  Le panier ne conserve que des paires { sku, quantity } dans sessionStorage (cet onglet) ;
  noms, finitions et prix sont relus du catalogue validé à chaque affichage. Tant qu'une ligne
  est invalide ou que le catalogue est indisponible, aucun total n'est présenté et la page
  de commande n'est pas proposée. Aucune donnée personnelle, aucun paiement, aucun réseau métier.
*/
import { validerCatalogue } from "./catalogue-core.js";
import { el, vider, chargerCatalogue } from "./dom.js";
import * as P from "./panier-core.js";
import { annoncer, demarrer, libererAttente, repliAffiche, etat, lienCatalogue, nomLigne } from "./panier-ui.js";

const $ = (id) => document.getElementById(id);
const magasin = P.obtenirMagasin(window);
const m = P.formaterMontant;

let catalogue = null; // null : indisponible ou invalide
let erreurLigne = null; // { sku, message } : saisie de quantité refusée, affichée sous le champ
let confirmerVidage = false;
let focus = null; // où replacer le focus après le rendu : "zone" | "vidage" | "qte:<sku>" | "retirer:<sku>"

/**
 * Cible de focus programmatique après une action qui supprime l'élément actif (Retirer, Vider,
 * Écarter) : un nœud qui SURVIT au rendu et porte l'anneau de focus global (:focus-visible),
 * jamais le conteneur #panier-zone. Panier non vide : le titre « Contenu du panier » ; panier
 * vide ou état explicatif : le bloc d'état lui-même.
 */
function cibleFocus(noeud) {
  noeud.id = "panier-focus";
  noeud.setAttribute("tabindex", "-1");
  return noeud;
}

function placerFocus() {
  const cible = focus;
  focus = null;
  if (!cible) return;
  const noeud =
    cible === "zone" ? $("panier-focus") ?? $("panier-zone")
    : cible === "vidage" ? $("confirmer-vidage")
    : cible.startsWith("qte:") ? document.getElementById(`qte-${cible.slice(4)}`)
    : null;
  if (noeud) noeud.focus();
}

function bouton(texte, action, { secondaire = true, id = null, label = null } = {}) {
  const b = el("button", { type: "button", class: secondaire ? "bouton bouton--secondaire" : "bouton", id, "aria-label": label }, texte);
  b.addEventListener("click", action);
  return b;
}

/* ---------- Actions ---------- */

function apresEchec(resultat) {
  annoncer(resultat.message);
  rendre(etat("Action non effectuée", [resultat.message], [], { alerte: true }));
}

function changerQuantite(ligne, saisie) {
  const r = P.definirQuantite({ magasin, sku: ligne.sku, valeur: saisie });
  if (r.ok) {
    erreurLigne = null;
    focus = `qte:${ligne.sku}`;
    const nouvelle = r.lignes.map((l) => ({ ...l }));
    rendre();
    const verif = P.verifierPanier({ lignes: nouvelle, rejets: [] }, catalogue);
    annoncer(`Quantité mise à jour : ${nomLigne(ligne)}, ${r.quantite}.` + (verif.fiable ? ` Total des produits : ${m(verif.totalProduitsCents)}.` : ""));
    return;
  }
  if (r.code === "quantite-invalide") {
    const texte = String(saisie).trim().slice(0, 20) || "(vide)";
    erreurLigne = { sku: ligne.sku, message: `« ${texte} » est refusé : saisissez un nombre entier de ${P.QUANTITE_MIN} à ${P.QUANTITE_MAX}. La quantité enregistrée est conservée.` };
    focus = `qte:${ligne.sku}`;
    rendre();
    annoncer(erreurLigne.message);
    return;
  }
  apresEchec(r);
}

function retirer(ligne) {
  const r = P.retirerDuPanier({ magasin, sku: ligne.sku });
  if (!r.ok) return apresEchec(r);
  erreurLigne = null;
  focus = "zone";
  rendre();
  annoncer(`Retiré du panier : ${nomLigne(ligne)}.`);
}

function vider_() {
  const r = P.viderLePanier(magasin);
  confirmerVidage = false;
  erreurLigne = null;
  if (!r.ok) return apresEchec(r);
  focus = "zone";
  rendre();
  annoncer("Panier vidé.");
}

function ecarter() {
  const r = P.ecarterLignesInvalides({ magasin, catalogue });
  if (!r.ok) return apresEchec(r);
  focus = "zone";
  rendre();
  annoncer(`${r.ecartees} ligne(s) invalide(s) écartée(s). Le panier a été revérifié.`);
}

/* ---------- Rendu ---------- */

function ligneModifiable(ligne) {
  const id = `qte-${ligne.sku}`;
  const err = erreurLigne && erreurLigne.sku === ligne.sku ? erreurLigne.message : null;
  const champ = el("input", {
    type: "number", id, min: P.QUANTITE_MIN, max: P.QUANTITE_MAX, step: 1, inputmode: "numeric", value: ligne.quantite,
    "aria-invalid": err ? "true" : null, "aria-describedby": err ? `${id}-err` : null,
  });
  champ.addEventListener("change", () => changerQuantite(ligne, champ.value));
  return el(
    "li",
    { class: "ligne-panier" },
    el(
      "div",
      { class: "ligne-panier__id" },
      el("p", { class: "ligne-panier__nom" }, el("strong", {}, ligne.modeleNom), " — ", ligne.finition),
      el("p", { class: "ligne-panier__ref" }, ligne.familleNom, " · ", el("code", {}, ligne.sku))
    ),
    el("p", { class: "ligne-panier__prix" }, el("span", { class: "etiq" }, "Prix unitaire"), m(ligne.prixCents)),
    el(
      "div",
      { class: "ligne-panier__qte" },
      el("label", { for: id }, "Quantité", el("span", { class: "sr-seulement" }, ` de ${nomLigne(ligne)}`)),
      champ,
      err ? el("p", { class: "erreur-champ", id: `${id}-err` }, err) : null
    ),
    el("p", { class: "ligne-panier__sous-total" }, el("span", { class: "etiq" }, "Sous-total"), m(ligne.sousTotalCents)),
    bouton("Retirer", () => retirer(ligne), { label: `Retirer du panier : ${nomLigne(ligne)}` })
  );
}

function rendre(avis = null) {
  const zone = $("panier-zone");
  vider(zone);
  $("panier-repli").hidden = true;
  if (avis) zone.append(avis);

  const lecture = P.lirePanier(magasin);

  if (lecture.statut === "stockage-indisponible") {
    zone.append(
      cibleFocus(etat("Panier indisponible dans ce navigateur.", [
        "Le stockage de cet onglet est absent ou refusé : un panier ne peut pas y être conservé, donc rien ne peut être ajouté ni validé.",
        "Le catalogue reste consultable.",
      ], [lienCatalogue()]))
    );
    return placerFocus();
  }
  if (lecture.statut === "corrompu") {
    zone.append(
      cibleFocus(etat("Le panier enregistré dans cet onglet est illisible.", [
        "Il n’a pas été utilisé ni modifié, et aucun total n’est affiché. Vous pouvez repartir d’un panier vide : seul le panier de Ligne Posée est effacé, aucune autre donnée du navigateur.",
      ], [el("p", {}, bouton("Repartir d’un panier vide", vider_, { secondaire: false }))], { alerte: true }))
    );
    return placerFocus();
  }
  if (lecture.statut === "vide") {
    zone.append(
      cibleFocus(etat("Votre panier est vide.", ["Ajoutez une variante depuis la fiche d’un modèle : elle apparaîtra ici avec sa référence et son prix de démonstration."], [lienCatalogue()]))
    );
    return placerFocus();
  }
  if (!catalogue) {
    zone.append(
      cibleFocus(etat("Panier indisponible : le catalogue n’a pas pu être vérifié.", [
        "Les noms, finitions et prix sont relus du catalogue : sans lui, aucune ligne ni aucun total ne peut être affiché. Rien n’a été modifié.",
        "Rechargez la page pour réessayer, ou videz le panier de cet onglet.",
      ], [], { alerte: true })),
      blocVidage(lecture.lignes.length + lecture.rejets.length)
    );
    return placerFocus();
  }

  const verification = P.verifierPanier(lecture, catalogue);
  if (verification.problemes.length > 0) {
    const probleme = etat(
        "Certaines lignes du panier ne peuvent pas être vérifiées.",
        ["Elles ne sont pas comptées et aucun total n’est affiché. Rien n’a été remplacé ni corrigé en silence."],
        [
          el("ul", { class: "liste-problemes" }, verification.problemes.map((p) => el("li", {}, el("code", {}, p.sku ?? "ligne illisible"), ` — ${p.raison}`))),
          el("p", {}, bouton("Écarter les lignes invalides", ecarter, { secondaire: false })),
        ],
        { alerte: true }
      );
    zone.append(verification.lignes.length > 0 ? probleme : cibleFocus(probleme));
  }

  if (verification.lignes.length > 0) {
    zone.append(cibleFocus(el("h2", { class: "titre-liste" }, "Contenu du panier")), el("ul", { class: "lignes-panier" }, verification.lignes.map(ligneModifiable)));
  }

  if (verification.fiable) {
    zone.append(
      el(
        "dl",
        { class: "totaux", "aria-live": "polite", "aria-atomic": "true" },
        el("div", { class: "totaux__total" }, el("dt", {}, "Total des produits"), el("dd", {}, m(verification.totalProduitsCents)))
      ),
      el("p", { class: "aide" }, "La livraison fictive (Standard 4,90 € ou Express 9,90 €) se choisit à l’étape suivante. Aucune commande n’est envoyée."),
      el(
        "div",
        { class: "actions" },
        el("a", { class: "bouton", href: "commande.html" }, "Passer au récapitulatif de la commande"),
        el("a", { class: "bouton bouton--secondaire", href: "catalogue.html" }, "Continuer dans le catalogue")
      )
    );
  }
  if (verification.lignes.length > 0 || verification.problemes.length > 0) zone.append(blocVidage(lecture.lignes.length + lecture.rejets.length));
  placerFocus();
}

function blocVidage(n) {
  if (!confirmerVidage) return el("p", { class: "vidage" }, bouton("Vider le panier", () => { confirmerVidage = true; focus = "vidage"; rendre(); }));
  return el(
    "div",
    { class: "etat vidage", role: "group", "aria-label": "Confirmer le vidage du panier" },
    el("p", {}, el("strong", {}, "Vider le panier ?"), ` Les ${n} ligne(s) de ce panier seront retirées de cet onglet. Aucune autre donnée du navigateur n’est touchée.`),
    el("div", { class: "actions" }, bouton("Oui, vider le panier", vider_, { secondaire: false, id: "confirmer-vidage" }), bouton("Annuler", () => { confirmerVidage = false; focus = "zone"; rendre(); }))
  );
}

async function amorcer() {
  if (repliAffiche()) return; // module arrivé après le repli statique : on ne remplace rien
  demarrer();
  $("panier-repli").hidden = true;
  $("panier-zone").append(el("p", {}, "Chargement du panier…"));
  try {
    const resultat = await chargerCatalogue(validerCatalogue);
    if (resultat.ok) catalogue = resultat.catalogue;
    else console.error("Ligne Posée : catalogue indisponible ou invalide —", resultat.erreurs.join(" | "));
  } catch (e) {
    console.error("Ligne Posée : échec d'initialisation du panier —", e);
  }
  try {
    rendre();
  } finally {
    libererAttente();
  }
  // Retour par l'historique (cache de page) : l'affichage est reconstruit depuis le stockage.
  window.addEventListener("pageshow", (ev) => {
    if (ev.persisted) {
      confirmerVidage = false;
      erreurLigne = null;
      rendre();
    }
  });
}

amorcer();

/*
  Ligne Posée — logique pure du panier et de la commande simulée (lot 2).
  Aucune dépendance au DOM ni au réseau : ce module est importé tel quel par les
  contrôleurs de pages et par les tests Node. Le stockage (sessionStorage) est
  toujours passé en paramètre ; rien n'est lu dans une variable globale.

  Règles (docs/DIRECTION.md, « Lot 2 ») :
  - le catalogue validé fait seul autorité pour les références, libellés et prix ;
  - le panier ne conserve que des paires { sku, quantity } (schéma versionné) ;
    noms, finitions et prix sont relus du catalogue à chaque calcul ;
  - tous les montants sont des centimes entiers, formatés en euros à l'affichage seulement ;
  - une écriture n'est jamais présumée réussie : elle est relue et comparée ;
  - rien n'est présenté comme fiable (total, confirmation) si une vérification échoue ;
  - seules deux clés de stockage existent, toutes deux propres à Ligne Posée.
*/

import { libelleVariante } from "./catalogue-core.js";

export const SCHEMA_PANIER = 1;
export const CLE_PANIER = "lignePosee.v1.panier";
export const CLE_CONFIRMATION = "lignePosee.v1.confirmation";
export const QUANTITE_MIN = 1;
export const QUANTITE_MAX = 99;
export const LIGNES_MAX = 80;

/** Montants de démonstration, en centimes : ni offre de transport, ni seuil, ni remise. */
export const LIVRAISONS = Object.freeze([
  Object.freeze({ id: "standard", libelle: "Standard", cents: 490 }),
  Object.freeze({ id: "express", libelle: "Express", cents: 990 }),
]);
export const LIVRAISON_DEFAUT = "standard";

const FORMAT_SKU = /^LP-[A-Z]{3}-\d{2}-\d{2}$/;

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

const estObjet = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const estTexte = (v) => typeof v === "string" && v.length > 0;
const estCentimes = (v) => Number.isSafeInteger(v) && v >= 0;
const estSku = (v) => typeof v === "string" && FORMAT_SKU.test(v);

/** Affiche une valeur inconnue sans jamais appeler son toString. */
function aff(v) {
  if (typeof v === "string") return JSON.stringify(v.slice(0, 40));
  if (typeof v === "number" || typeof v === "boolean" || v === null || v === undefined) return String(v);
  return Array.isArray(v) ? "[liste]" : "[objet]";
}

/**
 * 16990 → « 169,90 € » ; 16900 → « 169,00 € ». Toujours deux décimales. Mêmes séparateurs que
 * formaterPrix (lot 1) : espace fine insécable entre milliers, espace insécable avant « € ».
 */
export function formaterMontant(cents) {
  if (!estCentimes(cents)) throw new RangeError(`Montant invalide : ${aff(cents)}`);
  const euros = Math.trunc(cents / 100);
  const reste = cents % 100;
  return `${String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f")},${String(reste).padStart(2, "0")}\u00a0€`;
}

/**
 * Quantité saisie ou stockée → entier de 1 à 99, ou null. Accepte un entier (nombre) ou une
 * chaîne de 1 à 3 chiffres ; refuse 0, 100, fractions, signes, notation scientifique, texte.
 */
export function lireQuantite(valeur) {
  let n = null;
  if (typeof valeur === "number") n = Number.isInteger(valeur) ? valeur : null;
  else if (typeof valeur === "string" && /^\s*\d{1,3}\s*$/.test(valeur)) n = Number(valeur.trim());
  return n !== null && n >= QUANTITE_MIN && n <= QUANTITE_MAX ? n : null;
}

export function livraisonParId(id) {
  return typeof id === "string" ? LIVRAISONS.find((l) => l.id === id) ?? null : null;
}

/* ------------------------------------------------------------------ */
/* Stockage                                                            */
/* ------------------------------------------------------------------ */

/** sessionStorage de la fenêtre donnée, ou null s'il est absent ou refusé (l'accès peut lever). */
export function obtenirMagasin(fenetre) {
  try {
    const magasin = fenetre ? fenetre.sessionStorage : null;
    return magasin && typeof magasin.getItem === "function" ? magasin : null;
  } catch {
    return null;
  }
}

function lireBrut(magasin, cle) {
  if (!magasin) return { ok: false };
  try {
    return { ok: true, texte: magasin.getItem(cle) };
  } catch {
    return { ok: false };
  }
}

/** Écrit puis relit : un stockage qui accepte l'appel sans rien conserver est un échec. */
function ecrireVerifie(magasin, cle, texte) {
  try {
    magasin.setItem(cle, texte);
    return magasin.getItem(cle) === texte;
  } catch {
    return false;
  }
}

function effacerVerifie(magasin, cle) {
  try {
    magasin.removeItem(cle);
    return magasin.getItem(cle) === null;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Panier                                                              */
/* ------------------------------------------------------------------ */

/**
 * Texte stocké → { statut, lignes, rejets }.
 *  - « vide »    : aucune donnée ;
 *  - « corrompu » : JSON illisible, schéma ou structure inattendus (rien n'est exploité) ;
 *  - « ok »      : lignes valides (SKU bien formé, entier 1–99, sans doublon) ; les autres
 *                  lignes sont listées dans `rejets` avec leur raison, jamais corrigées en silence.
 */
export function analyserPanier(texte) {
  if (texte === null || texte === undefined) return { statut: "vide", lignes: [], rejets: [] };
  let donnees;
  try {
    donnees = JSON.parse(texte);
  } catch {
    return { statut: "corrompu", lignes: [], rejets: [], raison: "contenu illisible" };
  }
  if (!estObjet(donnees) || donnees.v !== SCHEMA_PANIER || !Array.isArray(donnees.lignes)) {
    return { statut: "corrompu", lignes: [], rejets: [], raison: "structure inattendue" };
  }
  if (donnees.lignes.length > LIGNES_MAX) {
    return { statut: "corrompu", lignes: [], rejets: [], raison: "trop de lignes" };
  }
  const lignes = [];
  const rejets = [];
  const vus = new Set();
  for (const brut of donnees.lignes) {
    if (!estObjet(brut)) {
      rejets.push({ sku: null, raison: "ligne illisible" });
      continue;
    }
    const sku = brut.sku;
    const cles = Object.keys(brut);
    if (!estSku(sku)) {
      rejets.push({ sku: null, raison: "référence mal formée" });
    } else if (cles.length !== 2 || !cles.includes("quantity")) {
      rejets.push({ sku, raison: "champs inattendus" });
    } else if (lireQuantite(brut.quantity) === null || typeof brut.quantity !== "number") {
      rejets.push({ sku, raison: `quantité invalide (${aff(brut.quantity)}), attendue : entier de ${QUANTITE_MIN} à ${QUANTITE_MAX}` });
    } else if (vus.has(sku)) {
      rejets.push({ sku, raison: "référence en double" });
    } else {
      vus.add(sku);
      lignes.push({ sku, quantity: brut.quantity });
    }
  }
  return { statut: "ok", lignes, rejets };
}

export function serialiserPanier(lignes) {
  return JSON.stringify({ v: SCHEMA_PANIER, lignes: lignes.map((l) => ({ sku: l.sku, quantity: l.quantity })) });
}

/** Lit le panier du magasin. Statuts : stockage-indisponible, vide, corrompu, ok. */
export function lirePanier(magasin) {
  const brut = lireBrut(magasin, CLE_PANIER);
  if (!brut.ok) return { statut: "stockage-indisponible", lignes: [], rejets: [] };
  return analyserPanier(brut.texte);
}

/** Enregistre le panier (une clé supprimée si vide) et relit pour vérifier. */
export function enregistrerPanier(magasin, lignes) {
  if (!magasin) return false;
  return lignes.length === 0 ? effacerVerifie(magasin, CLE_PANIER) : ecrireVerifie(magasin, CLE_PANIER, serialiserPanier(lignes));
}

const MESSAGES = Object.freeze({
  "stockage-indisponible": "Le stockage de cet onglet est indisponible ou refusé : le panier ne peut pas être conservé.",
  "panier-corrompu": "Le panier enregistré dans cet onglet est illisible : rien n’a été modifié.",
  "panier-a-reparer": "Le panier enregistré contient des lignes invalides : rien n’a été modifié tant qu’elles ne sont pas écartées.",
  "sku-inconnu": "Cette référence n’existe pas dans le catalogue : rien n’a été ajouté.",
  "plafond": `La quantité maximale (${QUANTITE_MAX}) est déjà atteinte pour cette référence : rien n’a été ajouté.`,
  "quantite-invalide": `Quantité refusée : saisissez un nombre entier de ${QUANTITE_MIN} à ${QUANTITE_MAX}.`,
  "ligne-absente": "Cette ligne n’est plus dans le panier.",
  "ecriture-echouee": "L’enregistrement dans cet onglet a échoué : rien n’a été modifié. Vous pouvez réessayer.",
  "panier-vide": "Le panier est vide : il n’y a rien à valider.",
  "catalogue-invalide": "Le catalogue n’a pas pu être vérifié : aucun calcul n’est possible.",
  "livraison-invalide": "Le mode de livraison fictive n’est pas reconnu : rien n’a été validé.",
});

const echec = (code, extra = {}) => ({ ok: false, code, message: MESSAGES[code], ...extra });

/** Charge l'état du panier à modifier ; refuse tout état qui ne soit pas sain. */
function chargerPourModification(magasin) {
  const etat = lirePanier(magasin);
  if (etat.statut === "stockage-indisponible") return echec("stockage-indisponible");
  if (etat.statut === "corrompu") return echec("panier-corrompu");
  if (etat.rejets.length > 0) return echec("panier-a-reparer");
  return { ok: true, lignes: etat.lignes };
}

/** Ajoute exactement ce SKU, quantité 1 ; un SKU déjà présent incrémente sa ligne (plafond 99). */
export function ajouterAuPanier({ magasin, catalogue, sku }) {
  if (!catalogue || !(catalogue.parSku instanceof Map) || !estSku(sku) || !catalogue.parSku.has(sku)) {
    const base = chargerPourModification(magasin);
    if (!base.ok) return base;
    return echec("sku-inconnu");
  }
  const base = chargerPourModification(magasin);
  if (!base.ok) return base;
  const lignes = base.lignes.map((l) => ({ ...l }));
  const existante = lignes.find((l) => l.sku === sku);
  if (existante) {
    if (existante.quantity >= QUANTITE_MAX) return echec("plafond");
    existante.quantity += 1;
  } else {
    if (lignes.length >= LIGNES_MAX) return echec("panier-corrompu");
    lignes.push({ sku, quantity: 1 });
  }
  if (!enregistrerPanier(magasin, lignes)) return echec("ecriture-echouee");
  return { ok: true, quantite: (existante ?? lignes[lignes.length - 1]).quantity, lignes };
}

/** Fixe la quantité d'une ligne existante. */
export function definirQuantite({ magasin, sku, valeur }) {
  const base = chargerPourModification(magasin);
  if (!base.ok) return base;
  const quantite = lireQuantite(valeur);
  if (quantite === null) return echec("quantite-invalide", { saisie: valeur });
  const lignes = base.lignes.map((l) => ({ ...l }));
  const ligne = lignes.find((l) => l.sku === sku);
  if (!ligne) return echec("ligne-absente");
  ligne.quantity = quantite;
  if (!enregistrerPanier(magasin, lignes)) return echec("ecriture-echouee");
  return { ok: true, quantite, lignes };
}

export function retirerDuPanier({ magasin, sku }) {
  const base = chargerPourModification(magasin);
  if (!base.ok) return base;
  if (!base.lignes.some((l) => l.sku === sku)) return echec("ligne-absente");
  const lignes = base.lignes.filter((l) => l.sku !== sku);
  if (!enregistrerPanier(magasin, lignes)) return echec("ecriture-echouee");
  return { ok: true, lignes };
}

/** Vide uniquement la clé du panier de Ligne Posée : aucune autre donnée n'est touchée. */
export function viderLePanier(magasin) {
  if (!magasin) return echec("stockage-indisponible");
  return effacerVerifie(magasin, CLE_PANIER) ? { ok: true, lignes: [] } : echec("ecriture-echouee");
}

/**
 * Réparation explicite, après avis visible : ne conserve que les lignes valides ET présentes
 * au catalogue. Un panier illisible (statut « corrompu ») se répare par `viderLePanier`.
 */
export function ecarterLignesInvalides({ magasin, catalogue }) {
  const etat = lirePanier(magasin);
  if (etat.statut === "stockage-indisponible") return echec("stockage-indisponible");
  if (etat.statut === "corrompu") return echec("panier-corrompu");
  const gardees = etat.lignes.filter((l) => catalogue && catalogue.parSku instanceof Map && catalogue.parSku.has(l.sku));
  if (!enregistrerPanier(magasin, gardees)) return echec("ecriture-echouee");
  return { ok: true, lignes: gardees, ecartees: etat.lignes.length - gardees.length + etat.rejets.length };
}

/* ------------------------------------------------------------------ */
/* Vérification contre le catalogue et calculs                         */
/* ------------------------------------------------------------------ */

/**
 * Lignes stockées + catalogue validé → lignes affichables avec prix recalculés.
 * `problemes` regroupe les rejets du stockage et les références absentes du catalogue ;
 * `fiable` n'est vrai que s'il n'y en a aucun, que le panier n'est pas vide et que la somme
 * reste un entier sûr. Aucun total n'est exposé comme fiable autrement.
 */
export function verifierPanier({ lignes, rejets = [] }, catalogue) {
  const problemes = rejets.map((r) => ({ sku: r.sku, raison: r.raison, source: "stockage" }));
  const verifiees = [];
  let total = 0;
  for (const { sku, quantity } of lignes) {
    const reference = catalogue && catalogue.parSku instanceof Map ? catalogue.parSku.get(sku) : undefined;
    const modele = reference ? catalogue.parId.get(reference.modele) : undefined;
    if (!reference || !modele || !estCentimes(reference.prixCents)) {
      problemes.push({ sku, raison: "référence absente du catalogue", source: "catalogue" });
      continue;
    }
    const sousTotalCents = reference.prixCents * quantity;
    total += sousTotalCents;
    verifiees.push({
      sku,
      quantite: quantity,
      modeleId: modele.id,
      modeleNom: modele.nom,
      familleNom: modele.familleNom,
      finition: libelleVariante(reference),
      prixCents: reference.prixCents,
      sousTotalCents,
    });
  }
  const fiable = problemes.length === 0 && verifiees.length > 0 && Number.isSafeInteger(total);
  return { lignes: verifiees, problemes, totalProduitsCents: fiable ? total : null, fiable };
}

/** Total de la simulation = produits + livraison fictive, en centimes entiers. */
export function calculerCommande(totalProduitsCents, livraisonId) {
  const livraison = livraisonParId(livraisonId);
  if (!livraison) return echec("livraison-invalide");
  if (!estCentimes(totalProduitsCents)) return echec("panier-vide");
  const totalCents = totalProduitsCents + livraison.cents;
  if (!Number.isSafeInteger(totalCents)) return echec("panier-vide");
  return { ok: true, produitsCents: totalProduitsCents, livraison, livraisonCents: livraison.cents, totalCents };
}

/* ------------------------------------------------------------------ */
/* Capture de confirmation                                             */
/* ------------------------------------------------------------------ */

function construireCapture(verification, commande) {
  return {
    v: SCHEMA_PANIER,
    lignes: verification.lignes.map((l) => ({
      sku: l.sku,
      modele: l.modeleNom,
      finition: l.finition,
      prixCents: l.prixCents,
      quantite: l.quantite,
      sousTotalCents: l.sousTotalCents,
    })),
    livraison: { id: commande.livraison.id, libelle: commande.livraison.libelle, cents: commande.livraison.cents },
    produitsCents: commande.produitsCents,
    totalCents: commande.totalCents,
  };
}

/**
 * Texte stocké → { statut: "absente" | "illisible" | "ok", capture }. Une capture n'est « ok »
 * que si sa structure et son arithmétique sont cohérentes : sinon aucun succès n'est présenté.
 */
export function analyserCapture(texte) {
  if (texte === null || texte === undefined) return { statut: "absente" };
  let c;
  try {
    c = JSON.parse(texte);
  } catch {
    return { statut: "illisible" };
  }
  const illisible = { statut: "illisible" };
  if (!estObjet(c) || c.v !== SCHEMA_PANIER || !Array.isArray(c.lignes)) return illisible;
  if (c.lignes.length < 1 || c.lignes.length > LIGNES_MAX) return illisible;
  let somme = 0;
  const vus = new Set();
  for (const l of c.lignes) {
    if (!estObjet(l) || !estSku(l.sku) || vus.has(l.sku)) return illisible;
    vus.add(l.sku);
    if (!estTexte(l.modele) || !estTexte(l.finition) || !estCentimes(l.prixCents)) return illisible;
    if (typeof l.quantite !== "number" || lireQuantite(l.quantite) === null) return illisible;
    if (l.sousTotalCents !== l.prixCents * l.quantite) return illisible;
    somme += l.sousTotalCents;
  }
  const modele = estObjet(c.livraison) ? livraisonParId(c.livraison.id) : null;
  if (!modele || c.livraison.libelle !== modele.libelle || c.livraison.cents !== modele.cents) return illisible;
  if (!Number.isSafeInteger(somme) || c.produitsCents !== somme || c.totalCents !== somme + modele.cents) return illisible;
  return { statut: "ok", capture: c };
}

export function lireConfirmation(magasin) {
  const brut = lireBrut(magasin, CLE_CONFIRMATION);
  if (!brut.ok) return { statut: "stockage-indisponible" };
  return analyserCapture(brut.texte);
}

/* ------------------------------------------------------------------ */
/* Finalisation                                                        */
/* ------------------------------------------------------------------ */

/**
 * « Terminer la simulation ». Relit le panier du stockage et le revérifie contre le catalogue
 * (rien n'est repris d'un affichage), fige la capture, puis vide le panier. Les deux écritures
 * sont relues ; si l'une échoue, la capture est retirée et AUCUN succès n'est renvoyé : le panier
 * reste intact et l'action peut être retentée sans rien dupliquer. Un second appel après un
 * succès trouve un panier vide et est refusé.
 */
export function terminerSimulation({ magasin, catalogue, livraisonId }) {
  if (!catalogue || !(catalogue.parSku instanceof Map) || !(catalogue.parId instanceof Map)) return echec("catalogue-invalide");
  const etat = lirePanier(magasin);
  if (etat.statut === "stockage-indisponible") return echec("stockage-indisponible");
  if (etat.statut === "corrompu") return echec("panier-corrompu");
  if (etat.statut === "vide" || (etat.lignes.length === 0 && etat.rejets.length === 0)) return echec("panier-vide");
  const verification = verifierPanier(etat, catalogue);
  if (!verification.fiable) return echec("panier-a-reparer", { problemes: verification.problemes });
  const commande = calculerCommande(verification.totalProduitsCents, livraisonId);
  if (!commande.ok) return commande;
  const capture = construireCapture(verification, commande);
  const texte = JSON.stringify(capture);
  if (!ecrireVerifie(magasin, CLE_CONFIRMATION, texte)) {
    effacerVerifie(magasin, CLE_CONFIRMATION);
    return echec("ecriture-echouee");
  }
  if (!effacerVerifie(magasin, CLE_PANIER)) {
    effacerVerifie(magasin, CLE_CONFIRMATION);
    return echec("ecriture-echouee");
  }
  return { ok: true, capture };
}

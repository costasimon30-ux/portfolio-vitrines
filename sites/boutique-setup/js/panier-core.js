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
  - UNE seule clé de stockage est écrite (lignePosee.v2.etat) : elle contient le panier ET la dernière
    confirmation, de sorte que « figer la capture + vider le panier » est une unique écriture
    atomique (setItem est tout-ou-rien). Un échec laisse l'état précédent intact, panier comme
    confirmation antérieure ; il n'existe aucun état intermédiaire où une nouvelle confirmation
    serait lisible alors que la finalisation a été annoncée en échec (L2-01) ;
  - les deux clés du lot 2 initial (v1.panier, v1.confirmation) ne sont plus écrites. Tant que la
    clé v2 n'existe pas, elles sont lues telles quelles (repli) puis migrées à la première
    écriture réussie ; dès que la clé v2 existe, elles sont ignorées et nettoyées au mieux.
*/

import { libelleVariante } from "./catalogue-core.js";

export const SCHEMA_PANIER = 1; // charge utile d'un panier v1 et schéma de la capture de confirmation
export const SCHEMA_ETAT = 2; // enveloppe transactionnelle { v, lignes, confirmation }
export const CLE_ETAT = "lignePosee.v2.etat";
export const CLE_PANIER_V1 = "lignePosee.v1.panier"; // ancien, lecture et nettoyage seulement
export const CLE_CONFIRMATION_V1 = "lignePosee.v1.confirmation"; // ancien, lecture et nettoyage seulement
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

/* ------------------------------------------------------------------ */
/* Panier                                                              */
/* ------------------------------------------------------------------ */

/** Lignes brutes (déjà décodées) → { lignes, rejets } ; jamais de correction silencieuse. */
function trierLignes(brutes) {
  const lignes = [];
  const rejets = [];
  const vus = new Set();
  for (const brut of brutes) {
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
  return { lignes, rejets };
}

/**
 * Texte d'un ANCIEN panier (clé v1) → { statut, lignes, rejets }.
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
  return { statut: "ok", ...trierLignes(donnees.lignes) };
}

export function serialiserPanier(lignes) {
  return JSON.stringify({ v: SCHEMA_PANIER, lignes: lignes.map((l) => ({ sku: l.sku, quantity: l.quantity })) });
}

/** Texte de l'état v2 : une seule chaîne, une seule écriture. `confirmation` : valeur JSON ou null. */
function serialiserEtat(lignes, confirmation) {
  return JSON.stringify({
    v: SCHEMA_ETAT,
    lignes: lignes.map((l) => ({ sku: l.sku, quantity: l.quantity })),
    confirmation: confirmation === undefined ? null : confirmation,
  });
}

/**
 * Charge l'état complet (panier + confirmation brute) depuis la clé v2, ou, à défaut, depuis les
 * deux anciennes clés v1 (repli de lecture). Statuts :
 *  - « stockage-indisponible » ;
 *  - « corrompu » : état illisible ; `confirmation` reste exploitable quand l'enveloppe a pu être lue ;
 *  - « ok » : `lignes`, `rejets`, `confirmation` (valeur décodée ou null), `texteV2` (texte exact lu
 *    pour la clé v2, null s'il n'existe pas : sert à restaurer), `source` (« v2 », « v1 » ou « neuf »).
 */
function chargerEtat(magasin) {
  const brut = lireBrut(magasin, CLE_ETAT);
  if (!brut.ok) return { statut: "stockage-indisponible", lignes: [], rejets: [], confirmation: null };
  if (brut.texte !== null && brut.texte !== undefined) {
    const corrompu = (raison, confirmation = null) => ({ statut: "corrompu", raison, lignes: [], rejets: [], confirmation, texteV2: brut.texte, source: "v2" });
    let d;
    try {
      d = JSON.parse(brut.texte);
    } catch {
      return corrompu("contenu illisible");
    }
    if (!estObjet(d) || d.v !== SCHEMA_ETAT) return corrompu("structure inattendue");
    const confirmation = d.confirmation === undefined ? null : d.confirmation;
    if (!Array.isArray(d.lignes) || Object.keys(d).some((k) => k !== "v" && k !== "lignes" && k !== "confirmation")) return corrompu("structure inattendue", confirmation);
    if (d.lignes.length > LIGNES_MAX) return corrompu("trop de lignes", confirmation);
    return { statut: "ok", ...trierLignes(d.lignes), confirmation, texteV2: brut.texte, source: "v2" };
  }
  // Repli : état de la première livraison du lot 2 (deux clés), tant que la clé v2 n'existe pas.
  const ancienPanier = lireBrut(magasin, CLE_PANIER_V1);
  const ancienneConf = lireBrut(magasin, CLE_CONFIRMATION_V1);
  if (!ancienPanier.ok || !ancienneConf.ok) return { statut: "stockage-indisponible", lignes: [], rejets: [], confirmation: null };
  let confirmation = null;
  if (ancienneConf.texte !== null && ancienneConf.texte !== undefined) {
    try {
      confirmation = JSON.parse(ancienneConf.texte);
    } catch {
      confirmation = ancienneConf.texte; // conservée telle quelle : sera jugée illisible, jamais effacée en silence
    }
  }
  const panier = analyserPanier(ancienPanier.texte);
  const source = (ancienPanier.texte ?? null) === null && (ancienneConf.texte ?? null) === null ? "neuf" : "v1";
  if (panier.statut === "corrompu") return { statut: "corrompu", raison: panier.raison, lignes: [], rejets: [], confirmation, texteV2: null, source };
  return { statut: "ok", lignes: panier.lignes, rejets: panier.rejets, confirmation, texteV2: null, source };
}

/** Lit le panier. Statuts : stockage-indisponible, vide, corrompu, ok. */
export function lirePanier(magasin) {
  const e = chargerEtat(magasin);
  if (e.statut !== "ok") return { statut: e.statut, lignes: [], rejets: [], ...(e.raison ? { raison: e.raison } : {}) };
  return { statut: e.lignes.length === 0 && e.rejets.length === 0 ? "vide" : "ok", lignes: e.lignes, rejets: e.rejets };
}

/**
 * Écriture transactionnelle : UN setItem sur la clé v2, relu et comparé. Réussite = la clé contient
 * exactement le texte voulu. Échec (refus, quota, écriture perdue, relecture impossible) = l'état
 * précédent est conservé ; si le stockage a bougé malgré l'échec, il est restauré. Le panier et la
 * confirmation ne peuvent donc jamais être « à moitié » mis à jour.
 */
function ecrireEtat(magasin, base, lignes, confirmation) {
  if (!magasin) return false;
  const texte = serialiserEtat(lignes, confirmation);
  const precedent = base.texteV2 ?? null;
  try {
    magasin.setItem(CLE_ETAT, texte);
  } catch {
    /* quota ou refus : la relecture ci-dessous décide */
  }
  let relu;
  try {
    relu = magasin.getItem(CLE_ETAT);
  } catch {
    relu = undefined;
  }
  if (relu === texte) {
    if (base.source === "v1") {
      for (const cle of [CLE_PANIER_V1, CLE_CONFIRMATION_V1]) {
        try {
          magasin.removeItem(cle); // au mieux : la clé v2 fait désormais foi, les anciennes sont ignorées
        } catch {
          /* ignoré */
        }
      }
    }
    return true;
  }
  if (relu !== precedent) {
    try {
      if (precedent === null) magasin.removeItem(CLE_ETAT);
      else magasin.setItem(CLE_ETAT, precedent);
    } catch {
      /* restauration impossible : rien de plus à tenter */
    }
  }
  return false;
}

/** Enregistre le panier en conservant la confirmation courante, dans la même écriture. */
function enregistrerPanier(magasin, base, lignes) {
  return ecrireEtat(magasin, base, lignes, base.confirmation);
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
  "capture-invalide": "Les montants de la commande n’ont pas pu être vérifiés : rien n’a été validé et le panier est inchangé.",
});

const echec = (code, extra = {}) => ({ ok: false, code, message: MESSAGES[code], ...extra });

/** Charge l'état à modifier ; refuse tout état qui ne soit pas sain. */
function chargerPourModification(magasin) {
  const base = chargerEtat(magasin);
  if (base.statut === "stockage-indisponible") return echec("stockage-indisponible");
  if (base.statut === "corrompu") return echec("panier-corrompu");
  if (base.rejets.length > 0) return echec("panier-a-reparer");
  return { ok: true, base, lignes: base.lignes };
}

/** Ajoute exactement ce SKU, quantité 1 ; un SKU déjà présent incrémente sa ligne (plafond 99). */
export function ajouterAuPanier({ magasin, catalogue, sku }) {
  const charge = chargerPourModification(magasin);
  if (!charge.ok) return charge;
  if (!catalogue || !(catalogue.parSku instanceof Map) || !estSku(sku) || !catalogue.parSku.has(sku)) {
    return echec("sku-inconnu");
  }
  const lignes = charge.lignes.map((l) => ({ ...l }));
  const existante = lignes.find((l) => l.sku === sku);
  if (existante) {
    if (existante.quantity >= QUANTITE_MAX) return echec("plafond");
    existante.quantity += 1;
  } else {
    if (lignes.length >= LIGNES_MAX) return echec("panier-corrompu");
    lignes.push({ sku, quantity: 1 });
  }
  if (!enregistrerPanier(magasin, charge.base, lignes)) return echec("ecriture-echouee");
  return { ok: true, quantite: (existante ?? lignes[lignes.length - 1]).quantity, lignes };
}

/** Fixe la quantité d'une ligne existante. */
export function definirQuantite({ magasin, sku, valeur }) {
  const charge = chargerPourModification(magasin);
  if (!charge.ok) return charge;
  const quantite = lireQuantite(valeur);
  if (quantite === null) return echec("quantite-invalide", { saisie: valeur });
  const lignes = charge.lignes.map((l) => ({ ...l }));
  const ligne = lignes.find((l) => l.sku === sku);
  if (!ligne) return echec("ligne-absente");
  ligne.quantity = quantite;
  if (!enregistrerPanier(magasin, charge.base, lignes)) return echec("ecriture-echouee");
  return { ok: true, quantite, lignes };
}

export function retirerDuPanier({ magasin, sku }) {
  const charge = chargerPourModification(magasin);
  if (!charge.ok) return charge;
  if (!charge.lignes.some((l) => l.sku === sku)) return echec("ligne-absente");
  const lignes = charge.lignes.filter((l) => l.sku !== sku);
  if (!enregistrerPanier(magasin, charge.base, lignes)) return echec("ecriture-echouee");
  return { ok: true, lignes };
}

/**
 * Vide le panier de Ligne Posée (réparation explicite d'un état illisible comprise). Aucune autre
 * clé n'est touchée ; la confirmation antérieure, si elle est lisible dans l'enveloppe, est conservée.
 */
export function viderLePanier(magasin) {
  if (!magasin) return echec("stockage-indisponible");
  const base = chargerEtat(magasin);
  if (base.statut === "stockage-indisponible") return echec("stockage-indisponible");
  return enregistrerPanier(magasin, base, []) ? { ok: true, lignes: [] } : echec("ecriture-echouee");
}

/**
 * Réparation explicite, après avis visible : ne conserve que les lignes valides ET présentes
 * au catalogue. Un panier illisible (statut « corrompu ») se répare par `viderLePanier`.
 */
export function ecarterLignesInvalides({ magasin, catalogue }) {
  const base = chargerEtat(magasin);
  if (base.statut === "stockage-indisponible") return echec("stockage-indisponible");
  if (base.statut === "corrompu") return echec("panier-corrompu");
  const gardees = base.lignes.filter((l) => catalogue && catalogue.parSku instanceof Map && catalogue.parSku.has(l.sku));
  if (!enregistrerPanier(magasin, base, gardees)) return echec("ecriture-echouee");
  return { ok: true, lignes: gardees, ecartees: base.lignes.length - gardees.length + base.rejets.length };
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
    if (!estCentimes(sousTotalCents) || !estCentimes(total + sousTotalCents)) {
      problemes.push({ sku, raison: "montant hors limites", source: "catalogue" });
      continue;
    }
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
 * Capture décodée → { statut: "ok" | "illisible", capture }. Une capture n'est « ok » que si sa
 * structure ET son arithmétique sont cohérentes, avec des entiers SÛRS à chaque étape (produit
 * ligne, cumul, total) : aucun montant hors limites n'atteint jamais le formatage (L2-02).
 */
function validerCapture(c) {
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
    const produit = l.prixCents * l.quantite;
    if (!estCentimes(produit) || !estCentimes(l.sousTotalCents) || l.sousTotalCents !== produit) return illisible;
    const suivant = somme + l.sousTotalCents;
    if (!estCentimes(suivant)) return illisible;
    somme = suivant;
  }
  const modele = estObjet(c.livraison) ? livraisonParId(c.livraison.id) : null;
  if (!modele || c.livraison.libelle !== modele.libelle || c.livraison.cents !== modele.cents) return illisible;
  const total = somme + modele.cents;
  if (!estCentimes(total) || !estCentimes(c.produitsCents) || !estCentimes(c.totalCents)) return illisible;
  if (c.produitsCents !== somme || c.totalCents !== total) return illisible;
  return { statut: "ok", capture: c };
}

/** Texte d'une capture (ancien format ou test) → { statut: "absente" | "illisible" | "ok", capture }. */
export function analyserCapture(texte) {
  if (texte === null || texte === undefined) return { statut: "absente" };
  let c;
  try {
    c = JSON.parse(texte);
  } catch {
    return { statut: "illisible" };
  }
  return validerCapture(c);
}

/** Dernière confirmation de l'onglet : lue dans l'état v2 (ou, à défaut, dans l'ancienne clé v1). */
export function lireConfirmation(magasin) {
  const e = chargerEtat(magasin);
  if (e.statut === "stockage-indisponible") return { statut: "stockage-indisponible" };
  if (e.confirmation === null || e.confirmation === undefined) return e.statut === "corrompu" ? { statut: "illisible" } : { statut: "absente" };
  return validerCapture(e.confirmation);
}

/* ------------------------------------------------------------------ */
/* Finalisation                                                        */
/* ------------------------------------------------------------------ */

/**
 * « Terminer la simulation ». Relit le panier du stockage et le revérifie contre le catalogue
 * (rien n'est repris d'un affichage), fige la capture, puis publie « capture + panier vide » en UNE
 * écriture relue (voir ecrireEtat). Si elle échoue, le stockage garde exactement son état précédent
 * — panier intact, confirmation antérieure intacte — et AUCUN succès n'est renvoyé : la nouvelle
 * tentative ne peut rien dupliquer. Un second appel après un succès trouve un panier vide et est
 * refusé.
 */
export function terminerSimulation({ magasin, catalogue, livraisonId }) {
  if (!catalogue || !(catalogue.parSku instanceof Map) || !(catalogue.parId instanceof Map)) return echec("catalogue-invalide");
  const base = chargerEtat(magasin);
  if (base.statut === "stockage-indisponible") return echec("stockage-indisponible");
  if (base.statut === "corrompu") return echec("panier-corrompu");
  if (base.lignes.length === 0 && base.rejets.length === 0) return echec("panier-vide");
  const verification = verifierPanier(base, catalogue);
  if (!verification.fiable) return echec("panier-a-reparer", { problemes: verification.problemes });
  const commande = calculerCommande(verification.totalProduitsCents, livraisonId);
  if (!commande.ok) return commande;
  const capture = construireCapture(verification, commande);
  if (validerCapture(capture).statut !== "ok") return echec("capture-invalide");
  if (!ecrireEtat(magasin, base, [], capture)) return echec("ecriture-echouee");
  return { ok: true, capture };
}

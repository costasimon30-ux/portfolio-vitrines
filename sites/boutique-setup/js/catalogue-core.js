/*
  Ligne Posée — logique pure du catalogue (lot 1).
  Aucune dépendance au DOM ni au réseau : ce module est importé tel quel par
  les contrôleurs de pages et par les tests Node (tests/). Les données viennent
  d'un seul fichier, data/catalogue.json ; rien n'est recalculé à partir d'un
  texte affiché. Tous les montants sont des centimes entiers ; le formatage en
  euros n'intervient qu'à l'affichage.
*/

export const SCHEMA = 1;

/** Compteurs que le catalogue doit respecter pour être considéré valide. */
export const ATTENDU = Object.freeze({
  familles: 4,
  univers: 4,
  modelesParFamille: 5,
  variantesParModele: 4,
  modeles: 20,
  references: 80,
  referencesParFamille: 20,
});

/**
 * Règle de prix du lot 1 (docs/DIRECTION.md) : prix d'une référence = prix de
 * base du modèle + supplément de sa famille pour la variante, en centimes.
 * Le supplément est une règle métier du code ; le prix de base est une donnée
 * du modèle. La variante 01 (supplément nul) fixe donc le prix « à partir de ».
 */
export const SUPPLEMENTS_CENTS = Object.freeze({
  sup: Object.freeze([0, 0, 0, 1000]),
  tap: Object.freeze([0, 0, 1500, 1500]),
  lum: Object.freeze([0, 0, 0, 0]),
  ran: Object.freeze([0, 0, 1200, 1200]),
});

export const PLAFONDS_PRIX = Object.freeze([50, 100, 150]);
export const TRIS = Object.freeze(["editorial", "prix-asc", "prix-desc", "nom"]);
export const TRI_DEFAUT = "editorial";
export const LONGUEUR_MAX_RECHERCHE = 80;

/* ------------------------------------------------------------------ */
/* Affichage                                                           */
/* ------------------------------------------------------------------ */

/** 6900 → « 69 € », 8450 → « 84,50 € » (espace insécable avant « € »). */
export function formaterPrix(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError(`Montant invalide : ${aff(cents)}`);
  }
  const euros = Math.trunc(cents / 100);
  const reste = cents % 100;
  let texte = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (reste !== 0) texte += "," + String(reste).padStart(2, "0");
  return texte + " €";
}

/** Libellé d'une variante tel qu'affiché : libellé, puis dimensions éventuelles. */
export function libelleVariante(reference) {
  return reference.detail ? `${reference.libelle} (${reference.detail})` : reference.libelle;
}

export function libelleCompte(n, total) {
  return `${n} modèle${n > 1 ? "s" : ""} sur ${total}`;
}

/* ------------------------------------------------------------------ */
/* Texte                                                               */
/* ------------------------------------------------------------------ */

/** Minuscules, sans accents, apostrophes unifiées, espaces réduits et rognés. */
export function normaliser(texte) {
  return String(texte ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[‘’ʼ]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function reduireEspaces(texte) {
  return String(texte ?? "").replace(/\s+/g, " ").trim();
}

/* ------------------------------------------------------------------ */
/* Validation du catalogue (contrôle bloquant avant tout rendu)        */
/* ------------------------------------------------------------------ */

const estObjet = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const estTexte = (v) => typeof v === "string" && v.trim() !== "";
/** Vrai seulement pour une chaîne conforme : aucune conversion implicite d'un objet. */
const conforme = (v, motif) => typeof v === "string" && motif.test(v);
/** Rend une valeur inconnue affichable sans jamais la convertir (pas de toString appelé). */
function aff(v) {
  if (typeof v === "string") return JSON.stringify(v.length > 40 ? `${v.slice(0, 40)}…` : v);
  if (typeof v === "number" || typeof v === "boolean" || v === null || v === undefined) return String(v);
  return Array.isArray(v) ? "[liste]" : "{objet}";
}

/**
 * Valide les données brutes et construit les index. Ne lève jamais : renvoie
 * { ok: false, erreurs } au moindre écart, et l'appelant n'affiche alors aucun
 * catalogue (ni partiel, ni présenté comme complet). Les types sont contrôlés
 * avant toute comparaison ou conversion ; en dernier recours, une exception
 * inattendue est elle-même transformée en échec.
 */
export function validerCatalogue(donnees) {
  try {
    return validerInterne(donnees);
  } catch {
    return { ok: false, erreurs: ["Catalogue illisible : structure inattendue."] };
  }
}

function validerInterne(donnees) {
  const erreurs = [];
  const err = (message) => {
    if (erreurs.length < 25) erreurs.push(message);
  };

  if (!estObjet(donnees)) return { ok: false, erreurs: ["Le catalogue n'est pas un objet."] };
  if (donnees.schema !== SCHEMA) err(`Schéma inattendu : ${aff(donnees.schema)}.`);
  if (!estTexte(donnees.marque)) err("Marque absente.");
  for (const cle of ["familles", "univers", "modeles", "references"]) {
    if (!Array.isArray(donnees[cle])) err(`« ${cle} » doit être une liste.`);
  }
  if (erreurs.length) return { ok: false, erreurs };

  const familleIds = new Set();
  donnees.familles.forEach((f, i) => {
    if (!estObjet(f) || !conforme(f.id, /^[a-z]{3}$/) || f.code !== f.id.toUpperCase() || !estTexte(f.nom)) {
      return err(`Famille n° ${i + 1} invalide.`);
    }
    if (!Object.hasOwn(SUPPLEMENTS_CENTS, f.id)) err(`Famille ${f.id} : aucune règle de prix.`);
    if (familleIds.has(f.id)) err(`Famille en double : ${f.id}.`);
    familleIds.add(f.id);
  });
  if (donnees.familles.length !== ATTENDU.familles) err(`${donnees.familles.length} familles au lieu de ${ATTENDU.familles}.`);

  const universIds = new Set();
  donnees.univers.forEach((u, i) => {
    if (!estObjet(u) || !conforme(u.id, /^[a-z]+$/) || !estTexte(u.nom)) return err(`Univers n° ${i + 1} invalide.`);
    if (universIds.has(u.id)) err(`Univers en double : ${u.id}.`);
    universIds.add(u.id);
  });
  if (donnees.univers.length !== ATTENDU.univers) err(`${donnees.univers.length} univers au lieu de ${ATTENDU.univers}.`);

  const modeleIds = new Set();
  const prixBase = new Map();
  const parFamille = new Map();
  donnees.modeles.forEach((m, i) => {
    const o = `Modèle n° ${i + 1}`;
    if (!estObjet(m)) return err(`${o} invalide.`);
    const forme = typeof m.id === "string" ? /^([a-z]{3})-(0[1-5])$/.exec(m.id) : null;
    if (!forme) return err(`${o} : identifiant ${aff(m.id)} invalide.`);
    if (modeleIds.has(m.id)) err(`Modèle en double : ${m.id}.`);
    modeleIds.add(m.id);
    if (m.famille !== forme[1] || !familleIds.has(m.famille)) err(`${m.id} : famille incohérente.`);
    if (!Number.isSafeInteger(m.prixBaseCents) || m.prixBaseCents <= 0) err(`${m.id} : prix de base invalide.`);
    else prixBase.set(m.id, m.prixBaseCents);
    if (!estTexte(m.nom)) err(`${m.id} : nom absent.`);
    if (!estTexte(m.description)) err(`${m.id} : description absente.`);
    if (!Array.isArray(m.univers) || m.univers.length === 0) {
      err(`${m.id} : aucun univers.`);
    } else {
      if (new Set(m.univers).size !== m.univers.length) err(`${m.id} : univers répétés.`);
      for (const u of m.univers) if (typeof u !== "string" || !universIds.has(u)) err(`${m.id} : univers inconnu ${aff(u)}.`);
    }
    parFamille.set(m.famille, (parFamille.get(m.famille) ?? 0) + 1);
  });
  if (donnees.modeles.length !== ATTENDU.modeles) err(`${donnees.modeles.length} modèles au lieu de ${ATTENDU.modeles}.`);
  for (const f of familleIds) {
    if ((parFamille.get(f) ?? 0) !== ATTENDU.modelesParFamille) err(`Famille ${f} : ${parFamille.get(f) ?? 0} modèles au lieu de ${ATTENDU.modelesParFamille}.`);
  }

  const codes = new Map(donnees.familles.filter(estObjet).map((f) => [f.id, f.code]));
  const skus = new Set();
  const paires = new Set();
  const parModele = new Map();
  const refsParFamille = new Map();
  const prixVariante01 = new Map();
  donnees.references.forEach((r, i) => {
    const o = `Référence n° ${i + 1}`;
    if (!estObjet(r)) return err(`${o} invalide.`);
    if (typeof r.modele !== "string" || !modeleIds.has(r.modele)) return err(`${o} : modèle inconnu ${aff(r.modele)}.`);
    if (!conforme(r.variante, /^0[1-4]$/)) return err(`${o} : variante ${aff(r.variante)} invalide.`);
    const attendu = `LP-${codes.get(r.modele.slice(0, 3))}-${r.modele.slice(4)}-${r.variante}`;
    if (r.sku !== attendu) return err(`${o} : SKU ${aff(r.sku)} au lieu de ${attendu}.`);
    if (skus.has(r.sku)) err(`SKU en double : ${r.sku}.`);
    skus.add(r.sku);
    const paire = `${r.modele}/${r.variante}`;
    if (paires.has(paire)) err(`Variante en double : ${paire}.`);
    paires.add(paire);
    if (!estTexte(r.libelle)) err(`${r.sku} : libellé absent.`);
    if (!Number.isSafeInteger(r.prixCents) || r.prixCents < 0) {
      err(`${r.sku} : prix invalide.`);
    } else if (prixBase.has(r.modele)) {
      // Contrat de prix : base du modèle + supplément de la famille pour cette variante.
      const attenduCents = prixBase.get(r.modele) + SUPPLEMENTS_CENTS[r.modele.slice(0, 3)][Number(r.variante) - 1];
      if (r.prixCents !== attenduCents) err(`${r.sku} : prix ${r.prixCents} centimes au lieu de ${attenduCents}.`);
    }
    if (r.detail !== undefined && !estTexte(r.detail)) err(`${r.sku} : détail invalide.`);
    parModele.set(r.modele, (parModele.get(r.modele) ?? 0) + 1);
    if (r.variante === "01") prixVariante01.set(r.modele, r.prixCents);
    const f = r.modele.slice(0, 3);
    refsParFamille.set(f, (refsParFamille.get(f) ?? 0) + 1);
  });
  if (donnees.references.length !== ATTENDU.references) err(`${donnees.references.length} références au lieu de ${ATTENDU.references}.`);
  for (const id of modeleIds) {
    if ((parModele.get(id) ?? 0) !== ATTENDU.variantesParModele) err(`${id} : ${parModele.get(id) ?? 0} variantes au lieu de ${ATTENDU.variantesParModele}.`);
  }
  // La variante 01 fixe le prix « à partir de » : elle vaut le prix de base et aucune variante ne descend en dessous.
  for (const id of modeleIds) {
    const prix = donnees.references.filter((r) => estObjet(r) && r.modele === id).map((r) => r.prixCents);
    if (prixBase.has(id) && (prixVariante01.get(id) !== prixBase.get(id) || prix.some((p) => !(p >= prixBase.get(id))))) {
      err(`${id} : la variante 01 doit valoir le prix de base et être le minimum.`);
    }
  }
  for (const f of familleIds) {
    if ((refsParFamille.get(f) ?? 0) !== ATTENDU.referencesParFamille) err(`Famille ${f} : ${refsParFamille.get(f) ?? 0} références au lieu de ${ATTENDU.referencesParFamille}.`);
  }
  if (erreurs.length) return { ok: false, erreurs };

  /* Index dérivés (les données d'origine ne sont pas modifiées). */
  const familles = donnees.familles.map((f, ordre) => ({ ...f, ordre }));
  const univers = donnees.univers.map((u) => ({ ...u }));
  const parFamilleId = new Map(familles.map((f) => [f.id, f]));
  const parUniversId = new Map(univers.map((u) => [u.id, u]));
  const references = donnees.references.map((r) => ({ ...r }));
  const parSku = new Map(references.map((r) => [r.sku, r]));
  const modeles = donnees.modeles.map((m) => {
    const refs = references.filter((r) => r.modele === m.id).sort((a, b) => (a.variante < b.variante ? -1 : 1));
    const famille = parFamilleId.get(m.famille);
    return {
      ...m,
      univers: [...m.univers],
      familleNom: famille.nom,
      ordreFamille: famille.ordre,
      references: refs,
      prixMinCents: Math.min(...refs.map((r) => r.prixCents)),
      recherche: normaliser(`${m.nom} ${m.description} ${famille.nom}`),
    };
  });
  const parId = new Map(modeles.map((m) => [m.id, m]));
  return {
    ok: true,
    catalogue: {
      marque: donnees.marque,
      familles,
      univers,
      modeles,
      references,
      parId,
      parSku,
      parFamilleId,
      parUniversId,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Recherche, filtres, tris                                            */
/* ------------------------------------------------------------------ */

export function etatParDefaut() {
  return { q: "", famille: null, univers: [], prix: null, tri: TRI_DEFAUT };
}

export function etatEstParDefaut(etat) {
  return etat.q === "" && etat.famille === null && etat.univers.length === 0 && etat.prix === null && etat.tri === TRI_DEFAUT;
}

function comparer(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Tri stable et déterministe ; l'identifiant du modèle départage tout ex aequo. */
export function trierModeles(modeles, tri) {
  const copie = [...modeles];
  const parId = (a, b) => comparer(a.id, b.id);
  switch (tri) {
    case "prix-asc":
      return copie.sort((a, b) => a.prixMinCents - b.prixMinCents || parId(a, b));
    case "prix-desc":
      return copie.sort((a, b) => b.prixMinCents - a.prixMinCents || parId(a, b));
    case "nom":
      return copie.sort((a, b) => comparer(normaliser(a.nom), normaliser(b.nom)) || parId(a, b));
    default:
      return copie.sort((a, b) => a.ordreFamille - b.ordreFamille || parId(a, b));
  }
}

/**
 * Recherche et filtres se combinent en ET. Univers : OU entre les univers
 * cochés. Recherche : tous les mots saisis doivent apparaître dans le nom, la
 * description courte ou la famille (casse, accents et espaces ignorés).
 * Prix : le « à partir de » du modèle ne dépasse pas le plafond (inclus).
 */
export function filtrerModeles(catalogue, etat) {
  const termes = normaliser(etat.q).split(" ").filter(Boolean);
  const retenus = catalogue.modeles.filter((m) => {
    if (etat.famille !== null && m.famille !== etat.famille) return false;
    if (etat.univers.length > 0 && !m.univers.some((u) => etat.univers.includes(u))) return false;
    if (etat.prix !== null && m.prixMinCents > etat.prix * 100) return false;
    return termes.every((t) => m.recherche.includes(t));
  });
  return trierModeles(retenus, etat.tri);
}

/* ------------------------------------------------------------------ */
/* État du catalogue ↔ URL                                             */
/* ------------------------------------------------------------------ */

const PARAMS_CATALOGUE = new Set(["q", "famille", "univers", "prix", "tri"]);

/**
 * Lit ?q=&famille=&univers=&prix=&tri= sans jamais échouer. Toute valeur
 * inconnue est écartée et signalée dans `ignores` (l'état renvoyé est alors
 * l'état réellement appliqué, jamais une valeur devinée).
 */
export function lireEtatCatalogue(search, catalogue) {
  const etat = etatParDefaut();
  const ignores = [];
  let params;
  try {
    params = new URLSearchParams(search);
  } catch {
    return { etat, ignores: ["lien"] };
  }
  const noter = (nom) => {
    if (!ignores.includes(nom)) ignores.push(nom);
  };
  const seul = (nom) => {
    const valeurs = params.getAll(nom);
    if (valeurs.length > 1) {
      noter(nom);
      return null;
    }
    return valeurs.length === 1 ? valeurs[0] : null;
  };

  const q = seul("q");
  if (q !== null) {
    const propre = reduireEspaces(q);
    if (propre.length > LONGUEUR_MAX_RECHERCHE) noter("q");
    else etat.q = propre;
  }
  const famille = seul("famille");
  if (famille !== null && famille !== "") {
    if (catalogue.parFamilleId.has(famille)) etat.famille = famille;
    else noter("famille");
  }
  const choisis = new Set();
  for (const u of params.getAll("univers")) {
    if (u === "") continue;
    if (catalogue.parUniversId.has(u)) choisis.add(u);
    else noter("univers");
  }
  etat.univers = catalogue.univers.map((u) => u.id).filter((id) => choisis.has(id));
  const prix = seul("prix");
  if (prix !== null && prix !== "") {
    if (PLAFONDS_PRIX.map(String).includes(prix)) etat.prix = Number(prix);
    else noter("prix");
  }
  const tri = seul("tri");
  if (tri !== null && tri !== "") {
    if (TRIS.includes(tri)) etat.tri = tri;
    else noter("tri");
  }
  for (const cle of new Set(params.keys())) {
    if (!PARAMS_CATALOGUE.has(cle)) {
      noter("paramètres inconnus");
      break;
    }
  }
  return { etat, ignores };
}

/** Requête canonique d'un état : omet les valeurs par défaut. */
export function ecrireEtatCatalogue(etat) {
  const p = new URLSearchParams();
  if (etat.q !== "") p.append("q", etat.q);
  if (etat.famille !== null) p.append("famille", etat.famille);
  for (const u of etat.univers) p.append("univers", u);
  if (etat.prix !== null) p.append("prix", String(etat.prix));
  if (etat.tri !== TRI_DEFAUT) p.append("tri", etat.tri);
  const texte = p.toString();
  return texte ? `?${texte}` : "";
}

/* ------------------------------------------------------------------ */
/* Fiche produit ↔ URL                                                 */
/* ------------------------------------------------------------------ */

const PARAMS_FICHE = new Set(["modele", "variante", "sku"]);

/**
 * Résout ?modele=&variante= (ou ?sku=). Statuts :
 *  ok · aucun · invalide · modele-inconnu · variante-inconnue · sku-inconnu ·
 *  incoherent · modele-manquant.
 * Une variante absente vaut la variante 01 (celle du prix « à partir de ») ;
 * une variante présente mais inexistante n'est JAMAIS remplacée en silence.
 */
export function resoudreFiche(search, catalogue) {
  const sortie = { statut: "aucun", modele: null, reference: null, ignores: [] };
  let params;
  try {
    params = new URLSearchParams(search);
  } catch {
    return { ...sortie, statut: "invalide" };
  }
  for (const cle of new Set(params.keys())) {
    if (!PARAMS_FICHE.has(cle)) {
      sortie.ignores.push("paramètres inconnus");
      break;
    }
  }
  const lire = (nom) => params.getAll(nom);
  const [modeles, variantes, skus] = [lire("modele"), lire("variante"), lire("sku")];
  if (modeles.length > 1 || variantes.length > 1 || skus.length > 1) return { ...sortie, statut: "invalide" };
  const [modeleId, variante, sku] = [modeles[0] ?? null, variantes[0] ?? null, skus[0] ?? null];

  if (sku !== null) {
    const reference = catalogue.parSku.get(sku);
    if (!reference) return { ...sortie, statut: "sku-inconnu" };
    const modele = catalogue.parId.get(reference.modele);
    if ((modeleId !== null && modeleId !== reference.modele) || (variante !== null && variante !== reference.variante)) {
      return { ...sortie, statut: "incoherent", modele };
    }
    return { ...sortie, statut: "ok", modele, reference };
  }
  if (modeleId === null) {
    return { ...sortie, statut: variante === null ? "aucun" : "modele-manquant" };
  }
  const modele = catalogue.parId.get(modeleId);
  if (!modele) return { ...sortie, statut: "modele-inconnu" };
  const voulue = variante ?? "01";
  const reference = modele.references.find((r) => r.variante === voulue);
  if (!reference) return { ...sortie, statut: "variante-inconnue", modele };
  return { ...sortie, statut: "ok", modele, reference };
}

export function ecrireFiche(reference) {
  const p = new URLSearchParams();
  p.append("modele", reference.modele);
  p.append("variante", reference.variante);
  return `?${p.toString()}`;
}

/** Adresse relative d'une fiche (depuis une page de la racine). */
export function lienFiche(modeleId, variante = null) {
  const p = new URLSearchParams({ modele: modeleId });
  if (variante !== null) p.append("variante", variante);
  return `produit.html?${p.toString()}`;
}

/*
  Ligne Posée — contrôleur de catalogue.html (lot 1).
  Améliore la liste statique : recherche, filtres, tris et cartes, à partir de
  data/catalogue.json. L'état (recherche, famille, univers, prix, tri) vit dans
  l'URL, donc lien direct, rechargement et retour navigateur le restaurent.
  Sans JavaScript, ou si les données sont absentes ou invalides, la liste
  statique des 20 noms reste affichée avec une explication.
*/
import {
  validerCatalogue, filtrerModeles, lireEtatCatalogue, ecrireEtatCatalogue, etatParDefaut,
  formaterPrix, libelleCompte, lienFiche, reduireEspaces, PLAFONDS_PRIX, TRI_DEFAUT,
} from "./catalogue-core.js";
import { el, vider, chargerCatalogue } from "./dom.js";

const $ = (id) => document.getElementById(id);

const NOMS_PARAMETRES = {
  q: "la recherche", famille: "la famille", univers: "les univers", prix: "le prix",
  tri: "le tri", "paramètres inconnus": "des paramètres inconnus", lien: "le lien",
};

const TRIS_LIBELLES = [
  ["editorial", "Ordre de la boutique"],
  ["prix-asc", "Prix croissant"],
  ["prix-desc", "Prix décroissant"],
  ["nom", "Nom (A–Z)"],
];

function afficherIndisponible() {
  const avis = $("indisponible");
  avis.hidden = false;
  $("filtres").hidden = true;
  $("resultats").hidden = true;
  $("repli").hidden = false;
}

function remplirOptions(catalogue) {
  const famille = $("f-famille");
  for (const f of catalogue.familles) famille.append(el("option", { value: f.id }, f.nom));
  const prix = $("f-prix");
  for (const p of PLAFONDS_PRIX) prix.append(el("option", { value: p }, `Jusqu’à ${formaterPrix(p * 100)}`));
  const tri = $("f-tri");
  for (const [valeur, libelle] of TRIS_LIBELLES) tri.append(el("option", { value: valeur }, libelle));
  const cases = $("f-univers");
  for (const u of catalogue.univers) {
    cases.append(
      el("label", { class: "case" }, el("input", { type: "checkbox", name: "univers", value: u.id }), el("span", {}, u.nom))
    );
  }
}

function lireFormulaire() {
  const e = etatParDefaut();
  e.q = reduireEspaces($("f-q").value);
  e.famille = $("f-famille").value || null;
  e.univers = [...document.querySelectorAll('#f-univers input[type="checkbox"]')].filter((c) => c.checked).map((c) => c.value);
  e.prix = $("f-prix").value ? Number($("f-prix").value) : null;
  e.tri = $("f-tri").value || TRI_DEFAUT;
  return e;
}

function ecrireFormulaire(e) {
  $("f-q").value = e.q;
  $("f-famille").value = e.famille ?? "";
  $("f-prix").value = e.prix === null ? "" : String(e.prix);
  $("f-tri").value = e.tri;
  for (const c of document.querySelectorAll('#f-univers input[type="checkbox"]')) c.checked = e.univers.includes(c.value);
}

function carte(modele) {
  return el(
    "li",
    {},
    el(
      "article",
      { class: "carte" },
      el("p", { class: "carte__famille" }, modele.familleNom),
      el("h3", { class: "carte__titre" }, el("a", { href: lienFiche(modele.id) }, modele.nom)),
      el("p", { class: "carte__desc" }, modele.description),
      el("ul", { class: "etiquettes", "aria-label": "Univers" }, modele.univers.map((u) => el("li", {}, u.nom))),
      el("p", { class: "carte__prix" }, el("span", {}, "À partir de"), " ", el("strong", {}, formaterPrix(modele.prixMinCents)))
    )
  );
}

function demarrer(catalogue) {
  remplirOptions(catalogue);
  const total = catalogue.modeles.length;
  // Les modèles passent au rendu avec les noms d'univers résolus (jamais d'identifiant brut affiché).
  const modelesAffichables = (liste) => liste.map((m) => ({ ...m, univers: m.univers.map((id) => catalogue.parUniversId.get(id)) }));

  const rendre = (etat) => {
    const trouves = filtrerModeles(catalogue, etat);
    const compte = $("compte");
    const texte = libelleCompte(trouves.length, total) + (trouves.length === 0 ? " : aucun résultat" : "");
    if (compte.textContent !== texte) compte.textContent = texte;
    const liste = $("cartes");
    vider(liste);
    for (const m of modelesAffichables(trouves)) liste.append(carte(m));
    $("vide").hidden = trouves.length !== 0;
    liste.hidden = trouves.length === 0;
  };

  const avertir = (ignores) => {
    const zone = $("avis-lien");
    if (ignores.length === 0) {
      zone.hidden = true;
      return;
    }
    const noms = ignores.map((n) => NOMS_PARAMETRES[n] ?? "un paramètre").join(", ");
    zone.querySelector("p").textContent =
      `Le lien contenait des valeurs non reconnues (${noms}) : elles ont été ignorées. Les résultats correspondent aux filtres affichés ci-dessus.`;
    zone.hidden = false;
  };

  /*
    Historique : une entrée par action de filtrage, et UNE seule entrée par session de
    saisie (la première frappe ouvre l'entrée, les suivantes la mettent à jour). Ainsi
    « famille → recherche → Retour » revient à l'état « famille », jamais à l'état d'avant.
  */
  let saisieOuverte = false;
  const adresse = (etat) => location.pathname + ecrireEtatCatalogue(etat) + location.hash;
  /** Renvoie true si une nouvelle entrée d'historique a réellement été créée. */
  const memoriser = (etat, mode) => {
    try {
      const cible = adresse(etat);
      if (cible === location.pathname + location.search + location.hash) return false;
      if (mode === "push") {
        history.pushState(null, "", cible);
        return true;
      }
      history.replaceState(null, "", cible);
    } catch {
      /* Historique indisponible : la page reste utilisable, sans lien partageable. */
    }
    return false;
  };

  /* État initial, lu dans l'URL. */
  const initial = lireEtatCatalogue(location.search, catalogue);
  ecrireFormulaire(initial.etat);
  rendre(initial.etat);
  avertir(initial.ignores);
  if (initial.ignores.length > 0) memoriser(initial.etat, "replace");

  $("indisponible").hidden = true;
  $("repli").hidden = true;
  $("filtres").hidden = false;
  $("resultats").hidden = false;

  const appliquer = (mode) => {
    const etat = lireFormulaire();
    rendre(etat);
    avertir([]);
    return memoriser(etat, mode);
  };
  const saisir = () => {
    // La session de saisie ne s'ouvre que si une entrée a réellement été créée (une frappe sans effet n'en ouvre pas).
    if (saisieOuverte) appliquer("replace");
    else saisieOuverte = appliquer("push");
  };

  const form = $("filtres");
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    saisieOuverte = false;
    appliquer("replace");
  });
  $("f-q").addEventListener("input", saisir);
  // « change » sur le champ de recherche = saisie validée (Entrée ou sortie du champ) : la suivante ouvrira une nouvelle entrée.
  $("f-q").addEventListener("change", () => {
    saisieOuverte = false;
  });
  const discret = () => {
    saisieOuverte = false;
    appliquer("push");
  };
  for (const id of ["f-famille", "f-prix", "f-tri"]) $(id).addEventListener("change", discret);
  $("f-univers").addEventListener("change", discret);

  const effacer = (depuisVide) => {
    saisieOuverte = false;
    const tri = $("f-tri").value || TRI_DEFAUT;
    const etat = { ...etatParDefaut(), tri };
    ecrireFormulaire(etat);
    rendre(etat);
    avertir([]);
    memoriser(etat, "push");
    // Le bouton de l'état vide disparaît : le focus passe au champ de recherche.
    if (depuisVide) $("f-q").focus();
  };
  $("f-effacer").addEventListener("click", () => effacer(false));
  $("vide-effacer").addEventListener("click", () => effacer(true));

  window.addEventListener("popstate", () => {
    saisieOuverte = false;
    const lu = lireEtatCatalogue(location.search, catalogue);
    ecrireFormulaire(lu.etat);
    rendre(lu.etat);
    avertir(lu.ignores);
  });
}

async function amorcer() {
  try {
    const resultat = await chargerCatalogue(validerCatalogue);
    if (!resultat.ok) {
      console.error("Ligne Posée : catalogue indisponible ou invalide —", resultat.erreurs.join(" | "));
      afficherIndisponible();
      return;
    }
    demarrer(resultat.catalogue);
  } catch (e) {
    console.error("Ligne Posée : échec d'initialisation du catalogue —", e);
    afficherIndisponible();
  }
}

amorcer();

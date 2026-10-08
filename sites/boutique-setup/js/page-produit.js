/*
  Ligne Posée — contrôleur de produit.html (lot 1).
  Affiche la fiche d'un modèle (?modele=sup-03&variante=04, ou ?sku=…) à partir
  de data/catalogue.json. Libellé, SKU et prix de la variante active viennent
  tous de la même référence du catalogue, donc ne peuvent pas diverger. Aucun
  achat, panier ni livraison dans ce lot. Un modèle, une variante ou une
  référence inconnus donnent un état explicatif : rien n'est substitué en
  silence.
*/
import {
  validerCatalogue, resoudreFiche, ecrireFiche, formaterPrix, libelleVariante, lienFiche,
} from "./catalogue-core.js";
import { el, vider, chargerCatalogue } from "./dom.js";

const $ = (id) => document.getElementById(id);
const MARQUE = "Ligne Posée";

function titrer(texte) {
  document.title = `${texte} — ${MARQUE} (démonstration)`;
  $("fiche-titre").textContent = texte;
}

function etatMessage(titre, paragraphes, extras = []) {
  titrer(titre);
  $("fiche-eyebrow").textContent = "Fiche produit";
  const zone = $("fiche");
  vider(zone);
  zone.append(
    el("div", { class: "etat" }, paragraphes.map((p) => el("p", {}, p))),
    ...extras
  );
}

/** Choix d'un modèle quand aucun n'est sélectionné : toutes les familles, tous les noms. */
function listeModeles(catalogue) {
  return el(
    "div",
    { class: "liste-modeles" },
    catalogue.familles.map((f) =>
      el(
        "section",
        { "aria-labelledby": `famille-${f.id}` },
        el("h2", { id: `famille-${f.id}` }, f.nom),
        el(
          "ul",
          {},
          catalogue.modeles
            .filter((m) => m.famille === f.id)
            .map((m) => el("li", {}, el("a", { href: lienFiche(m.id) }, m.nom)))
        )
      )
    )
  );
}

function listeVariantes(modele) {
  return el(
    "ul",
    { class: "liens-variantes", "aria-label": `Variantes de ${modele.nom}` },
    modele.references.map((r) =>
      el(
        "li",
        {},
        el("a", { href: lienFiche(modele.id, r.variante) }, `${libelleVariante(r)} — ${r.sku} — ${formaterPrix(r.prixCents)}`)
      )
    )
  );
}

function rendreFiche(catalogue, res) {
  const { modele } = res;
  const famille = catalogue.parFamilleId.get(modele.famille);
  titrer(modele.nom);
  $("fiche-eyebrow").textContent = famille.nom;

  const zone = $("fiche");
  vider(zone);

  const resume = el("dl", { class: "resume", id: "resume", "aria-live": "polite", "aria-atomic": "true" });
  const majResume = (ref) => {
    vider(resume);
    resume.append(
      el("div", {}, el("dt", {}, "Variante"), el("dd", {}, libelleVariante(ref))),
      el("div", {}, el("dt", {}, "Référence (SKU)"), el("dd", {}, el("code", {}, ref.sku))),
      el("div", {}, el("dt", {}, "Prix de démonstration"), el("dd", { class: "prix" }, formaterPrix(ref.prixCents)))
    );
  };

  const radios = modele.references.map((r) => {
    const id = `variante-${r.variante}`;
    return el(
      "label",
      { class: "variante", for: id },
      el("input", { type: "radio", id, name: "variante", value: r.variante, checked: r.variante === res.reference.variante }),
      el("span", { class: "variante__nom" }, libelleVariante(r)),
      el("span", { class: "variante__prix" }, formaterPrix(r.prixCents))
    );
  });

  const formulaire = el(
    "form",
    { class: "variantes", action: "produit.html", method: "get", novalidate: true },
    el("input", { type: "hidden", name: "modele", value: modele.id }),
    el("fieldset", {}, el("legend", {}, "Choisir une variante"), radios)
  );
  formulaire.addEventListener("submit", (ev) => ev.preventDefault());
  formulaire.addEventListener("change", (ev) => {
    const cible = ev.target;
    if (!(cible instanceof HTMLInputElement) || cible.name !== "variante") return;
    const ref = modele.references.find((r) => r.variante === cible.value);
    if (!ref) return; // valeur hors catalogue : on ne change rien
    majResume(ref);
    memoriser(ref);
  });
  majResume(res.reference);

  zone.append(
    el("p", { class: "chapeau" }, modele.description),
    el("ul", { class: "etiquettes", "aria-label": "Univers" }, modele.univers.map((id) => el("li", {}, catalogue.parUniversId.get(id).nom))),
    el(
      "div",
      { class: "fiche__grille" },
      el("p", { class: "visuel" }, el("span", {}, "Visuel à venir"), " Aucune photographie validée pour ce modèle."),
      el(
        "div",
        { class: "fiche__choix" },
        formulaire,
        el("section", { class: "selection", "aria-labelledby": "selection-titre" }, el("h2", { id: "selection-titre" }, "Variante sélectionnée"), resume),
        el(
          "div",
          { class: "etat", role: "note" },
          el("p", {}, el("strong", {}, "Ajout au panier indisponible."), " Prix, références et modèles sont fictifs ; le panier et la commande ne sont pas encore actifs dans cette démonstration.")
        )
      )
    )
  );
}

function memoriser(reference) {
  try {
    const cible = location.pathname + ecrireFiche(reference) + location.hash;
    if (cible !== location.pathname + location.search + location.hash) history.replaceState(null, "", cible);
  } catch {
    /* Historique indisponible : la sélection reste valable dans la page. */
  }
}

function afficher(catalogue) {
  const res = resoudreFiche(location.search, catalogue);
  $("fiche-repli").hidden = true;
  switch (res.statut) {
    case "ok":
      rendreFiche(catalogue, res);
      memoriser(res.reference);
      return;
    case "aucun":
      etatMessage("Aucun modèle sélectionné", ["Choisissez un modèle ci-dessous, ou dans le catalogue, pour afficher sa fiche."], [listeModeles(catalogue)]);
      return;
    case "modele-inconnu":
      etatMessage("Modèle introuvable", [
        "Ce modèle n’existe pas dans le catalogue de démonstration.",
        "Aucune autre fiche n’a été affichée à sa place.",
      ]);
      return;
    case "variante-inconnue":
      etatMessage(
        res.modele.nom,
        ["La variante demandée n’existe pas pour ce modèle.", "Aucune variante n’a été choisie à sa place : sélectionnez-en une ci-dessous."],
        [listeVariantes(res.modele)]
      );
      return;
    case "sku-inconnu":
      etatMessage("Référence introuvable", [
        "Cette référence n’existe pas dans le catalogue de démonstration.",
        "Aucune autre référence n’a été affichée à sa place.",
      ]);
      return;
    case "incoherent":
      etatMessage(
        "Lien incohérent",
        ["La référence et le modèle ou la variante indiqués ne correspondent pas entre eux. Rien n’a été affiché à leur place."],
        [el("p", {}, el("a", { href: lienFiche(res.modele.id) }, `Voir la fiche : ${res.modele.nom}`))]
      );
      return;
    case "modele-manquant":
      etatMessage("Modèle non indiqué", ["Le lien précise une variante mais pas de modèle, donc aucune fiche ne peut être affichée."]);
      return;
    default:
      etatMessage("Lien invalide", ["Le lien contient des paramètres répétés ou mal formés : aucune fiche ne peut être affichée."]);
  }
}

/*
  Chargement : tant que le catalogue n'est pas arrivé, le pied de page et les liens de retour
  sont rendus invisibles (sans quitter la mise en page), puis révélés une fois la fiche ou son
  message d'erreur affiché. Ils ne sont donc jamais visibles à deux positions successives :
  aucun saut perceptible, quelle que soit la hauteur de l'état final (fiche complète ou erreur
  courte), et aucune hauteur réservée qui laisserait un vide. Un délai de sécurité les révèle
  même si le chargement n'aboutit jamais (voir js/attente-fiche.js).
*/
function attendre() {
  // La classe est posée avant le premier rendu par js/attente-fiche.js, qui la retire aussi si ce module échoue.
  document.documentElement.setAttribute("data-fiche-module", "");
  return () => document.documentElement.classList.remove("fiche-attente");
}

async function amorcer() {
  const liberer = attendre();
  try {
    const resultat = await chargerCatalogue(validerCatalogue);
    if (!resultat.ok) {
      console.error("Ligne Posée : catalogue indisponible ou invalide —", resultat.erreurs.join(" | "));
      $("fiche-repli-indispo").hidden = false;
      return;
    }
    afficher(resultat.catalogue);
    window.addEventListener("popstate", () => afficher(resultat.catalogue));
  } catch (e) {
    console.error("Ligne Posée : échec d'initialisation de la fiche —", e);
    $("fiche-repli-indispo").hidden = false;
  } finally {
    liberer();
  }
}

amorcer();

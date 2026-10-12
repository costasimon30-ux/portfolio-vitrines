/*
  Ligne Posée — visuels produits (illustrations générées par IA, produits fictifs).
  Une seule image par MODÈLE : elle ne représente aucune variante en particulier. La finition, le
  format ou la température de lumière sélectionnés ne sont donc jamais « montrés » : la mention
  placée sous chaque visuel le dit, et les textes alternatifs décrivent la forme de l'objet sans
  jamais nommer de couleur ni de finition.
  Correspondance modèle → fichier : assets/produits/<id du modèle>-<largeur>.webp (3 largeurs
  carrées, 320, 640 et 960 px). Le catalogue de données n'est pas modifié. Tailles réservées avant
  chargement (attributs width/height + ratio 1/1 en CSS) ; si l'image ne charge pas, un repli
  lisible de même taille la remplace.
*/
import { el } from "./dom.js";

const LARGEURS = Object.freeze([320, 640, 960]);
const LARGEUR_PAR_DEFAUT = 640;
const DOSSIER = "assets/produits/";

export const MENTION_FICHE = "Visuel d’illustration généré ; la variante sélectionnée (finition, format) n’est pas représentée.";
export const MENTION_CARTE = "Visuel d’illustration généré ; variantes non représentées.";

/* Ce que l'image montre, par modèle : forme et éléments visibles seulement (ni couleur, ni finition, ni usage non visible). */
const DESCRIPTIONS = Object.freeze({
  "sup-01": "plateau rectangulaire allongé posé sur deux pieds bas, avec un espace libre dessous",
  "sup-02": "plateau incliné à fente centrale, sur une base plate",
  "sup-03": "bras articulé fixé au bureau par une pince, avec une platine de fixation d’écran",
  "sup-04": "plateau incliné pour tablette, sur une base plate",
  "sup-05": "tige verticale surmontée d’un arceau incurvé, sur une base ronde",
  "tap-01": "tapis rectangulaire aux coins arrondis",
  "tap-02": "tapis rectangulaire à bordure cousue",
  "tap-03": "tapis très allongé aux coins arrondis",
  "tap-04": "tapis rectangulaire en feutre",
  "tap-05": "sous-main avec un canal de rangement le long du bord arrière",
  "lum-01": "lampe à base ronde, bras incliné et abat-jour",
  "lum-02": "barre horizontale fixée par une pince, sans écran",
  "lum-03": "lampe à deux segments articulés, base ronde et abat-jour orientable",
  "lum-04": "luminaire cylindrique bas et large, à face supérieure lumineuse",
  "lum-05": "lampe à abat-jour en dôme, sur un pied court et une base ronde",
  "ran-01": "bac plat à trois compartiments",
  "ran-02": "boîte rectangulaire à couvercle, avec des passages de câbles sur les côtés",
  "ran-03": "plateau creux aux bords arrondis",
  "ran-04": "rangement vertical à trois fentes",
  "ran-05": "bloc à deux tiroirs, dont un entrouvert",
});

/** Tailles d'affichage (px CSS) selon la mise en page de css/style.css : cartes en 1/2/3 colonnes, fiche en 1/2 colonnes. */
const SIZES = Object.freeze({
  carte: "(min-width: 68em) 297px, (min-width: 48em) calc((100vw - 96px) / 3 - 34px), (min-width: 36em) calc((100vw - 48px) / 2 - 34px), calc(100vw - 66px)",
  fiche: "(min-width: 68em) 500px, (min-width: 48em) calc((100vw - 88px) / 2), min(calc(100vw - 32px), 512px)",
});

/** Vrai si le modèle a un visuel dans assets/produits/. */
export function aUnVisuel(modeleId) {
  return typeof modeleId === "string" && Object.hasOwn(DESCRIPTIONS, modeleId);
}

/** Chemins des trois largeurs d'un modèle (utilisé aussi par les tests de correspondance). */
export function cheminsVisuel(modeleId) {
  return aUnVisuel(modeleId) ? LARGEURS.map((l) => `${DOSSIER}${modeleId}-${l}.webp`) : [];
}

export function texteAlternatif(modele) {
  return aUnVisuel(modele.id) ? `${modele.nom}, illustration générée : ${DESCRIPTIONS[modele.id]}.` : "";
}

function remplacerParRepli(cadre, figure) {
  while (cadre.firstChild) cadre.removeChild(cadre.firstChild);
  cadre.classList.add("visuel-cadre--vide");
  cadre.append(el("span", {}, "Visuel indisponible"));
  const legende = figure.querySelector(".visuel-mention");
  if (legende) {
    // La mention ne décrit plus rien (aucune image affichée) : elle est masquée SANS libérer sa place,
    // pour qu'une image qui échoue après le rendu ne décale rien.
    legende.classList.add("visuel-mention--masquee");
    legende.setAttribute("aria-hidden", "true");
  }
}

/**
 * Figure « visuel du modèle ». contexte : "carte" | "fiche". `rang` : position dans la liste
 * (les premières cartes se chargent tout de suite, les suivantes à l'approche de l'écran).
 */
export function visuelModele(modele, { contexte = "carte", rang = 0 } = {}) {
  const fiche = contexte === "fiche";
  const cadre = el("div", { class: "visuel-cadre" });
  const figure = el(
    "figure",
    { class: `visuel-produit visuel-produit--${fiche ? "fiche" : "carte"}` },
    cadre,
    el("figcaption", { class: "visuel-mention" }, fiche ? MENTION_FICHE : MENTION_CARTE)
  );
  if (!aUnVisuel(modele.id)) {
    remplacerParRepli(cadre, figure);
    return figure;
  }
  const image = el("img", {
    src: `${DOSSIER}${modele.id}-${LARGEUR_PAR_DEFAUT}.webp`,
    srcset: LARGEURS.map((l) => `${DOSSIER}${modele.id}-${l}.webp ${l}w`).join(", "),
    sizes: fiche ? SIZES.fiche : SIZES.carte,
    width: LARGEUR_PAR_DEFAUT,
    height: LARGEUR_PAR_DEFAUT,
    alt: texteAlternatif(modele),
    decoding: "async",
    loading: fiche || rang < 6 ? "eager" : "lazy",
    fetchpriority: fiche ? "high" : null,
  });
  image.addEventListener("error", () => remplacerParRepli(cadre, figure));
  cadre.append(image);
  return figure;
}

# Photographies d'illustration — Créa'Tif / portfolio-vitrines

Ce dossier contient les sept photographies retenues par le brief
`docs/DIRECTION.md` > « Évolution photographique ciblée — brief validé le
7 septembre 2026 », ainsi que leurs dérivés redimensionnés.

**Statut du site.** Créa'Tif est un **concept de salon fictif** réalisé pour un
portfolio. Aucune de ces photographies ne représente l'équipe, les clients, les
réalisations ou le lieu d'un salon réel. Elles sont utilisées **à titre
d'illustration uniquement**, et chaque page l'indique en texte visible.

**Licence des médias ≠ licence du code.** Les photographies restent sous leur
licence propre, distincte de celle du code de ce dépôt. Elles ne sont ni des
créations originales de Créa'Tif, ni des fichiers libres de toute restriction.

---

## Inventaire

| Réf. | Titre source | Auteur | Fiche source | Licence | Définition native | Consultée le |
| --- | --- | --- | --- | --- | --- | --- |
| P01 | Stylist Cutting Long Hair | Shopify Partners | https://www.shopify.com/stock-photos/photos/stylist-cutting-long-hair | Burst — Some Rights Reserved | 5413 × 3609 | 7 septembre 2026 |
| P02 | Blowdrying Hair On Round Brush | Shopify Partners | https://www.shopify.com/stock-photos/photos/blowdrying-hair-on-round-brush | Burst — Some Rights Reserved | 5363 × 3575 | 7 septembre 2026 |
| P03 | Barber Adds Final Touches To A Haircut | Matthew Henry | https://www.shopify.com/stock-photos/photos/barber-adds-final-touches-to-a-haircut | Burst — Some Rights Reserved | 5760 × 3840 | 7 septembre 2026 |
| P04 | Hair Salon Sinks On Red Brick | Shopify Partners | https://www.shopify.com/stock-photos/photos/hair-salon-sinks-on-red-brick | Burst — Some Rights Reserved | 5390 × 3591 | 7 septembre 2026 |
| P05 | Close Up Hands Trimming Hair | Shopify Partners | https://www.shopify.com/stock-photos/photos/close-up-hands-trimming-hair | Burst — Some Rights Reserved | 5760 × 3840 | 7 septembre 2026 |
| P06 | Clippers Trim A Mans Beard | Matthew Henry | https://www.shopify.com/stock-photos/photos/clippers-trim-a-mans-beard | Burst — Some Rights Reserved | 5760 × 3840 | 7 septembre 2026 |
| P07 | Dark textured hair styled in twists with brown ends | Corinne Sawers | https://unsplash.com/photos/dark-textured-hair-styled-in-twists-with-brown-ends-QngsebgpK84 | Unsplash — licence gratuite | 4928 × 3264 | 7 septembre 2026 |

L'auteur repris ci-dessus est l'attribution effectivement affichée par la
plateforme sur la fiche de la photo, relue une par une au téléchargement. Les
fichiers ont été récupérés depuis la fiche officielle de chaque photo (route de
téléchargement du site pour P07, fichier pleine définition du CDN de la
plateforme pour P01–P06) — jamais depuis les aperçus cités dans le brief.

**Les sept sources sont nativement en 3:2** (P07 à 1,510, écart non
perceptible). Conséquence utile : partout où le cadre est lui aussi en 3:2, la
photographie est affichée **entière**, sans aucune coupe. Les repères focaux
n'agissent donc que là où le cadre s'écarte du 3:2 : le hero Coiffure (3:4 et
4:5), le bandeau Le salon en 16:9 sur desktop, et le fond du hero d'accueil sur
desktop.

## Conditions de réutilisation

### P01 à P06 — Burst, « Some Rights Reserved »

- Textes de référence : [licence](https://www.shopify.com/stock-photos/licenses/shopify-some-rights-reserved),
  [conditions générales, section 4](https://www.shopify.com/stock-photos/legal/terms).
- Usage gratuit, commercial ou non ; copie, adaptation et distribution permises.
- Attribution facultative mais encouragée : elle est fournie ici, en texte, dans
  le pied de page de chaque page utilisant la photo, avec lien vers la fiche.
- **Ce n'est pas du CC0.** Interdits : revendre la photographie telle quelle,
  constituer un service concurrent de banque d'images, s'en attribuer la
  création.
- La licence ne couvre **ni les droits de marque, ni la vie privée, ni les
  droits de la personnalité**. Pas d'usage dénigrant des modèles, pas
  d'approbation prétendue du photographe.

### P07 — Unsplash, licence gratuite

- Textes de référence : [licence](https://unsplash.com/license),
  [conditions, section 5](https://unsplash.com/terms).
- Usage gratuit, commercial ou non ; modification et distribution permises ;
  crédit non obligatoire mais fourni ici.
- Interdits : revendre la photographie sans modification significative,
  recréer une banque d'images concurrente.
- Marques, personnes reconnaissables et œuvres représentées ne sont **pas**
  automatiquement couvertes par cette licence.

### Limite commune

Une licence de droit d'auteur vérifiée **ne vaut pas** autorisation individuelle
de modèle ou de lieu. Aucun document de cession propre à ces scènes n'a été
obtenu. Toute reconnaissance possible d'une personne, d'une marque ou d'un lieu
doit être traitée avant publication et non présumée impossible parce qu'un
visage est partiellement hors champ.

---

## Emplacements, cadrages et repères focaux

Les fichiers livrés ne sont **jamais recadrés de façon destructive** : ils
conservent le cadrage d'origine, seule leur définition est réduite. Le cadrage
est réalisé côté CSS (`aspect-ratio` sur le cadre + `object-fit: cover` +
`object-position`), ce qui le rend réversible et lisible dans
`css/style.css`. Les repères focaux ci-dessous sont ceux prescrits par le brief
(x depuis la gauche, y depuis le haut).

| Réf. | Page et emplacement | Ratio | Repère focal |
| --- | --- | --- | --- |
| P01 | Accueil — fond du bandeau hero (≥ 900 px) | plein bandeau, `min-height` 560 px | 70 % / 35 % |
| P01 | Accueil — image de contenu du hero (< 900 px) | 3:2 | 65 % / 40 % |
| P02 | Accueil — carte d'univers Coiffure | 3:2 | 60 % / 50 % |
| P02 | Coiffure — hero | 3:4 (≥ 900 px) · 3:2 (600–899 px) · 4:5 (< 600 px) | 60 % / 50 % |
| P03 | Accueil — carte d'univers Barbier | 3:2 | 50 % / 50 % |
| P03 | Barbier — hero | 3:2 à toutes les largeurs | 50 % / 50 % |
| P04 | Le salon — bandeau d'ambiance légendé | 16:9 (≥ 900 px) · 3:2 (< 900 px) | 50 % / 65 % |
| P05 | Accueil — bloc « Le geste juste » | 3:2 | 55 % / 50 % |
| P06 | Barbier — bloc « Le détail fait l'équilibre » | 3:2 | 60 % / 45 % |
| P07 | Coiffure — bloc « La couleur se pense aussi à la lumière » | 3:2 | 50 % / 55 % |

P02 et P03 sont les seules photographies réutilisées : une carte d'orientation
sur l'accueil, puis le hero de la page correspondante. Aucune photographie n'est
répétée deux fois sur une même page.

## Traitement appliqué

- **Aucune retouche colorimétrique** : pas de sépia, de noir et blanc, de grain
  vintage, de fausse patine ni d'étalonnage Cuivre sur la peau. Les cheveux ne
  sont ni lissés ni recolorés.
- Seules opérations effectuées sur les fichiers : **redimensionnement** vers
  plusieurs largeurs et **conversion en WebP** (qualité 78), pour éviter les
  images inutilement lourdes.
- Les fichiers haute définition proviennent des fiches officielles ; les
  aperçus distants cités dans `docs/DIRECTION.md` ne sont pas utilisés comme
  fichiers de production.

## Dérivés produits

Chaque photographie est livrée en WebP aux largeurs suivantes, servies par
`srcset` / `sizes` :

- P01 : 480, 800, 1200, 1600, 2000 px (également utilisée en fond de bandeau).
- P04 : 480, 800, 1200, 1600 px (bandeau pleine largeur du conteneur).
- P02, P03, P05, P06, P07 : 480, 800, 1200 px.

Commande de référence utilisée pour régénérer un dérivé à partir de l'original
(`<source>.jpg` étant le fichier haute définition téléchargé depuis la fiche) :

```sh
# Redimensionnement seul, sans recadrage ni retouche de couleur.
magick "<source>.jpg" -resize "<largeur>x>" -quality 78 "<ref>-<slug>-<largeur>.webp"
```

## Contrôle des fichiers effectué le 7 septembre 2026

Chaque fichier haute définition a été ouvert et examiné (marques, vêtements,
reflets, personnes reconnaissables), conformément à `docs/DIRECTION.md`
section 5.

- **P01, P02, P05** — aucun visage identifiable (mains, outils et cheveux au
  premier plan ; les silhouettes d'arrière-plan sont floues). Aucune marque
  lisible. RAS.
- **P03** — vue de dos, aucun trait du visage visible. Aucune marque lisible.
  RAS.
- **P04** — aucune personne. Aucune enseigne ni marque lisible. RAS.
- **P07** — vue de dos, aucun visage. Aucune marque. RAS.
- **P06 — réserve maintenue et signalée.** Le brief l'avait anticipé : profil
  partiel (joue, oreille, barbe), coiffure en locs, boucle d'oreille et chemise
  à motif rendent l'anonymat du modèle non présumable, même sans visage de
  face. La licence Burst ne couvre pas les droits de la personnalité. L'usage
  reste strictement illustratif, non dénigrant, sans prétendre représenter un
  client, une réalisation ou une approbation. **Aucune substitution n'a été
  faite** — le remplacement d'une photo validée relève de Simon. À réexaminer
  si le site quitte le cadre du portfolio de démonstration.
- La cape à motif colorés de P06 reste dans le cadre : la retirer couperait la
  main et l'outil, ce que le brief interdit explicitement de sacrifier.

## Avant toute nouvelle publication

Conformément à `docs/DIRECTION.md` (section 5), au contrôle du fichier haute
définition **et** des recadrages effectivement affichés, examiner marques,
vêtements, reflets et personnes reconnaissables. En cas de doute non résolu :
obtenir l'autorisation pertinente ou soumettre un remplacement à Simon **avant**
publication de l'image concernée. La validation artistique ne lève pas cette
limite.

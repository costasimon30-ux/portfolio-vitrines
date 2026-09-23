# Polices auto-hébergées — portfolio

Ce site déclare ses propres polices dans `css/fonts.css` plutôt que d'utiliser
`shared/design-system/fonts.css`. Ce dernier sert Cormorant Garamond et DM Sans,
c'est-à-dire l'identité typographique de Créa'Tif, que le portfolio ne doit pas
reprendre (critère d'acceptation n° 9 de la spécification produit). L'importer
aurait aussi fait télécharger des fichiers jamais utilisés ici.

Deux familles depuis la direction « Clarté et structure » (`docs/DIRECTION.md`,
proposition `856f6f1`, validée par Simon au commit `87d2c5c`) : Inter pour les
titres, le texte et les commandes, IBM Plex Mono pour les seuls libellés courts.
Le contraste entre une sans-serif neutre et une monospace porte la hiérarchie.
Elles remplacent Nunito, retirée du dépôt en même temps, qui servait l'ambiance
boisée abandonnée.

Le texte complet de la licence accompagne chaque famille, comme l'exige l'OFL
pour toute redistribution : `inter/LICENSE.txt` et `ibm-plex-mono/LICENSE.txt`.

## Inter

- **Source :** projet de l'auteur, <https://rsms.me/inter/> et
  <https://github.com/rsms/inter>. Fichiers WOFF2 récupérés le 23 septembre 2026
  depuis le dépôt du projet Fontsource, qui republie à l'identique les fichiers
  publiés par Google Fonts :
  `https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/inter/files/inter-latin-<graisse>-normal.woff2`
- **Auteurs :** The Inter Project Authors (Rasmus Andersson et contributeurs).
- **Licence :** SIL Open Font License, Version 1.1 (OFL-1.1), texte complet dans
  `inter/LICENSE.txt`.
- **Variantes conservées :** 400 (corps), 600 (H3, boutons, bascule), 800 (nom et
  H2). Sous-ensemble latin. Aucune autre graisse n'est chargée : la famille
  complète ne l'est jamais.

## IBM Plex Mono

- **Source :** <https://github.com/IBM/plex>. Fichier WOFF2 récupéré le
  23 septembre 2026 depuis Fontsource :
  `https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2`
- **Auteurs :** IBM Corp., nom de police réservé « Plex ».
- **Licence :** SIL Open Font License, Version 1.1 (OFL-1.1), texte complet dans
  `ibm-plex-mono/LICENSE.txt`.
- **Variante conservée :** 400 uniquement, sous-ensemble latin. Réservée aux
  libellés courts en capitales (sur-titre du hero, mention « Démonstration ») —
  jamais aux paragraphes ni aux boutons.

## Vérifications faites sur les fichiers, et non supposées

- **Graisses réelles :** `usWeightClass` vaut bien 400, 600 et 800 pour Inter, et
  l'épaisseur du fût du « I » croît en conséquence (190, 267 puis 353 unités pour
  2048 unités par cadratin). IBM Plex Mono est en 400 (fût 432 pour 1000).
- **Couverture française :** aucun caractère manquant parmi les accentués et
  signes typographiques employés par la page (à â ç é è ê ë î ï ô ö ù û ü œ,
  leurs capitales, ’ — « » … €). 230 glyphes par fichier Inter, 229 pour Plex.
- **Licence vérifiée dans la table `name`** de chaque fichier (identifiant 14),
  et non seulement sur la page du projet.

| Fichier | Octets | SHA-256 (16 premiers caractères) |
| --- | --- | --- |
| `inter/inter-400.woff2` | 23 664 | `8909904ab6c872eb` |
| `inter/inter-600.woff2` | 24 452 | `f9a06e79cd3a2a20` |
| `inter/inter-800.woff2` | 24 400 | `a7d0a50f15d389ca` |
| `ibm-plex-mono/ibm-plex-mono-400.woff2` | 14 708 | `08949f728dc52d52` |

## Note générale

- Format WOFF2 uniquement, avec replis système déclarés dans `--font-sans` et
  `--font-mono` (`css/style.css`) si une police ne charge pas.
- `font-display: swap` sur chaque `@font-face` : le texte reste lisible pendant
  le chargement, il n'est jamais masqué.
- Aucune modification n'a été apportée aux fichiers ; seuls le renommage et le
  sous-ensemble déjà fournis par Fontsource ont été conservés.
- Ces familles ne sont pas étendues aux démos : elles restent propres au
  portfolio.
- Avant d'ajouter une graisse ou une famille, vérifier sa licence et la
  documenter ici, conformément à `docs/ARCHITECTURE.md` § 2.

# Polices auto-hébergées — portfolio

Ce site déclare ses propres polices dans `css/fonts.css` plutôt que d'utiliser
`shared/design-system/fonts.css`. Ce dernier sert Cormorant Garamond et DM Sans,
c'est-à-dire l'identité typographique de Créa'Tif, que le portfolio ne doit pas
reprendre (critère d'acceptation n° 9 de la spécification produit). L'importer
aurait aussi fait télécharger quatre fichiers jamais utilisés ici.

## Manrope

- **Source :** Google Fonts (https://fonts.google.com/specimen/Manrope).
  Fichiers WOFF2 récupérés le 16 septembre 2026 depuis le dépôt du projet
  Fontsource, qui republie à l'identique les fichiers Google Fonts :
  `https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/manrope/files/manrope-latin-<graisse>-normal.woff2`
- **Auteur :** The Manrope Project Authors (github.com/sharanda/manrope).
- **Licence :** SIL Open Font License, Version 1.1 (OFL-1.1).
  Texte complet : https://scripts.sil.org/OFL
- **Variantes conservées :** graisses 400, 600 et 800 (normal), sous-ensemble
  latin — il couvre les caractères accentués du français (à, â, ç, é, è, ê, ë,
  î, ï, ô, ö, ù, û, ü, œ…).
- **Fichiers et empreintes SHA-256 :**

| Fichier | Octets | SHA-256 (16 premiers caractères) |
| --- | --- | --- |
| `manrope/manrope-400.woff2` | 14 108 | `849290ef12a2eeb9` |
| `manrope/manrope-600.woff2` | 14 172 | `f7ac6258da20ab75` |
| `manrope/manrope-800.woff2` | 13 648 | `74c161dbcbce7c35` |

- Ces trois graisses correspondent aux usages réels décrits par la direction
  artistique : 400 pour le texte courant, 600 pour les boutons, sous-titres et
  étiquettes, 800 pour les titres de niveau 1 et 2. Une seule famille est
  utilisée : la hiérarchie se joue sur le poids, pas sur un second caractère.

## Note générale

- Format WOFF2 uniquement, avec repli système déclaré dans `--font-base`
  (`css/style.css`) si la police ne charge pas.
- `font-display: swap` sur chaque `@font-face`.
- Aucune modification n'a été apportée aux fichiers ; seuls le renommage et le
  sous-ensemble déjà fournis par Fontsource ont été conservés.
- Avant d'ajouter une graisse ou une famille, vérifier sa licence et la
  documenter ici, conformément à `docs/ARCHITECTURE.md`.

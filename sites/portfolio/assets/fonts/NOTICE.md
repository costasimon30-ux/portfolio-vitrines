# Polices auto-hébergées — portfolio

Ce site déclare ses propres polices dans `css/fonts.css` plutôt que d'utiliser
`shared/design-system/fonts.css`. Ce dernier sert Cormorant Garamond et DM Sans,
c'est-à-dire l'identité typographique de Créa'Tif, que le portfolio ne doit pas
reprendre (critère d'acceptation n° 9 de la spécification produit). L'importer
aurait aussi fait télécharger quatre fichiers jamais utilisés ici.

## Nunito

Nunito remplace Manrope depuis la refonte « boisée et cocooning » de la
direction artistique (`docs/DIRECTION.md`, commit `c9266ab`) : le parti pris
demande une sans-serif arrondie et chaleureuse, là où Manrope était une
géométrique sobre au service de l'ancien registre « atelier technique ».
Les fichiers Manrope ont été retirés du dépôt en même temps : ils n'étaient
plus référencés nulle part.

- **Source :** Google Fonts (https://fonts.google.com/specimen/Nunito).
  Fichiers WOFF2 récupérés le 19 septembre 2026 depuis le dépôt du projet
  Fontsource, qui republie à l'identique les fichiers Google Fonts :
  `https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/nunito/files/nunito-latin-<graisse>-normal.woff2`
- **Auteurs :** The Nunito Project Authors (github.com/googlefonts/nunito) —
  dessin original de Vernon Adams, poursuivi par Cyreal et Jacques Le Bailly.
- **Licence :** SIL Open Font License, Version 1.1 (OFL-1.1).
  Texte complet : https://scripts.sil.org/OFL
  Vérifiée dans la table `name` de chaque fichier (identifiant 14) : elle y
  pointe bien vers `https://scripts.sil.org/OFL`.
- **Variantes conservées :** graisses 400, 700 et 800 (normal), sous-ensemble
  latin. Couverture vérifiée fichier par fichier sur les caractères accentués
  et typographiques réellement employés par la page (à â ç é è ê ë î ï ô ö ù û
  ü œ, leurs capitales, ’ — « » …) : aucun caractère manquant, 230 glyphes par
  fichier.
- **Graisses vérifiées** et non supposées : `usWeightClass` vaut bien 400, 700
  et 800, et l'épaisseur du fût du « I » croît en conséquence (82, 128 puis 155
  unités pour 1000 unités par cadratin). Le nom interne de famille porté par
  les fichiers Fontsource (« Nunito ExtraLight ») est un artefact de leur
  procédé d'instanciation et n'a aucun effet : `css/fonts.css` déclare
  lui-même la famille sous le nom `Nunito`.
- **Fichiers et empreintes SHA-256 :**

| Fichier | Octets | SHA-256 (16 premiers caractères) |
| --- | --- | --- |
| `nunito/nunito-400.woff2` | 16 316 | `a5906e15ceb68f73` |
| `nunito/nunito-700.woff2` | 16 228 | `fa89300b9bbb3bd0` |
| `nunito/nunito-800.woff2` | 16 520 | `2363d3ed037283eb` |

- Ces trois graisses correspondent aux usages réels décrits par la direction
  artistique : 400 pour le texte courant, 700 pour les boutons, sous-titres et
  étiquettes, 800 pour les titres de niveau 1 et 2. Une seule famille est
  utilisée : la hiérarchie se joue sur le poids, pas sur un second caractère.

## Note générale

- Format WOFF2 uniquement, avec repli système déclaré dans `--font-base`
  (`css/style.css`) si la police ne charge pas.
- `font-display: swap` sur chaque `@font-face`.
- Aucune modification n'a été apportée aux fichiers ; seuls le renommage et le
  sous-ensemble déjà fournis par Fontsource ont été conservés.
- Avant d'ajouter une graisse ou une famille, vérifier sa licence et la
  documenter ici, conformément à `docs/ARCHITECTURE.md` § 2.

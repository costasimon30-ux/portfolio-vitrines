# Polices auto-hébergées — Créa'Tif / portfolio-vitrines

## Cormorant Garamond

- **Source :** Google Fonts (https://fonts.google.com/specimen/Cormorant+Garamond), fichiers WOFF2 récupérés via le paquet npm `@fontsource/cormorant-garamond@5.3.0` (miroir exact des fichiers Google Fonts, republié par le projet Fontsource).
- **Auteur :** The Cormorant Project Authors (github.com/CatharsisFonts/Cormorant).
- **Licence :** SIL Open Font License, Version 1.1 (OFL-1.1). Texte complet : https://scripts.sil.org/OFL
- **Variantes conservées :** graisse 600 (normal), sous-ensemble latin (`U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`), qui couvre les caractères accentués du français (à, â, ç, é, è, ê, ë, î, ï, ô, ö, ù, û, ü, œ…).
- **Fichier :** `cormorant-garamond/cormorant-garamond-600.woff2`.
- Seule la graisse 600 est fournie : c'est la seule utilisée par `sites/coiffeur-mixte/css/style.css` et `shared/design-system/tokens.css` (titres `h1`/`h2`/`h3`, logo, footer, numéros d'étapes).

## DM Sans

- **Source :** Google Fonts (https://fonts.google.com/specimen/DM+Sans), fichiers WOFF2 récupérés via le paquet npm `@fontsource/dm-sans@5.3.0` (miroir exact des fichiers Google Fonts, republié par le projet Fontsource).
- **Auteur :** The DM Sans Project Authors (github.com/googlefonts/dm-fonts).
- **Licence :** SIL Open Font License, Version 1.1 (OFL-1.1). Texte complet : https://scripts.sil.org/OFL
- **Variantes conservées :** graisses 400, 600 et 700 (normal), même sous-ensemble latin que ci-dessus.
- **Fichiers :** `dm-sans/dm-sans-400.woff2`, `dm-sans/dm-sans-600.woff2`, `dm-sans/dm-sans-700.woff2`.
- Ces trois graisses correspondent aux usages réels du corps de texte, des liens de navigation et des boutons/labels en gras.

## Note générale

- Format : WOFF2 uniquement (pas de repli WOFF/TTF), avec repli système déclaré dans `--font-heading` / `--font-body` (`shared/design-system/tokens.css`) si une police ne charge pas.
- `font-display: swap` est utilisé sur chaque `@font-face` (voir `shared/design-system/fonts.css`).
- Aucune modification n'a été apportée aux fichiers de police ; seuls le renommage et le sous-ensemble déjà fournis par Fontsource ont été conservés.
- Avant d'ajouter une nouvelle graisse ou une nouvelle police au design system, vérifier sa licence et documenter la source ici, conformément à `docs/ARCHITECTURE.md`.

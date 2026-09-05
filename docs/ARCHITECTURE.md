# Architecture front-end du portfolio

Ce document fixe les décisions structurelles communes à `portfolio-vitrines`. Il complète `CLAUDE.md` et `docs/WORKFLOW.md` ; il ne remplace pas les décisions produit ou de direction artistique propres à un site dans `docs/DIRECTION.md`.

## Principes directeurs

- Le portfolio reste en **HTML, CSS et JavaScript statiques**. Aucun framework JavaScript ne doit être livré au navigateur.
- Chaque site dans `sites/<nom-du-site>/` reste déployable indépendamment.
- `shared/` ne contient que des éléments réellement communs et stables. Un composant propre à une marque ou à sa navigation ne devient pas « partagé » par défaut.
- La mutualisation se fait à la compilation, jamais par injection HTML au chargement de la page.
- Les dépendances sont de développement uniquement lorsqu'elles évitent une duplication durable ou des scripts maison fragiles.

## 1. Shell commun : header, footer et `<head>`

### Décision

Adopter un **générateur de site statique léger à l'échelle du dépôt**, recommandé : **Eleventy (11ty)**. Il sert uniquement à produire les fichiers HTML finaux ; il ne change ni la stack servie aux visiteurs, ni l'autonomie de déploiement de chaque site.

Cette décision est **différée jusqu'à l'existence d'un deuxième site vitrine**. `coiffeur-mixte` conserve donc, temporairement et de manière assumée, son shell dupliqué : un seul site ne justifie pas encore l'ajout d'un outillage de build. La création du deuxième site sera le point de validation concret des éléments réellement mutualisables et déclenchera la migration vers des partials compilées.

### Pourquoi un build step, et non une autre solution

| Option | Décision | Motif |
| --- | --- | --- |
| Partials compilés par Eleventy | Retenue | Layouts, includes, données par page et sortie HTML statique, sans JavaScript de runtime. |
| Includes côté serveur (SSI, PHP, etc.) | Écartée | Dépend du serveur choisi et ne garantit pas le fonctionnement sur GitHub Pages ou un hébergement statique. |
| `fetch()`/injection du header et footer en JavaScript | Écartée | Rend le shell dépendant du JavaScript, ajoute un flash de contenu et détériore le repli, le SEO et l'accessibilité. |
| Copier-coller documenté | Écartée | Ne traite pas la cause et reporte la dette à chaque nouvelle page. |
| Générateur maison | Écartée | Le besoin est déjà couvert par un outil maintenu ; un script interne deviendrait une dépendance à entretenir. |

Eleventy est ici un outil de compilation, pas un framework applicatif. Les visiteurs reçoivent des fichiers HTML/CSS/JS ordinaires. Aucun routeur, hydratation ni dépendance JavaScript supplémentaire n'est requis.

### Frontière entre un site et `shared/`

Le **shell est local à chaque site** : les liens, la marque, le CTA, les mentions de démo et le contenu du footer changent normalement d'un client à l'autre. Il ne faut donc pas créer immédiatement un `shared/header.html` mondial.

`shared/design-system/` reste responsable des primitives neutres et éprouvées : tokens, styles de base, boutons, conteneurs, utilitaires d'accessibilité et typographie. Une partial partagée entre sites ne doit être introduite que lorsqu'au moins deux sites emploient réellement la même structure et que ses variations sont simples, explicites et documentées.

### Structure cible

La source d'un site peut évoluer vers la structure suivante :

```text
portfolio-vitrines/
├── package.json                         # dépendances et scripts de build, à la racine
├── eleventy.config.mjs                  # configuration commune de compilation
├── shared/
│   └── design-system/
│       ├── tokens.css
│       ├── base.css                     # si les styles de base sortent de tokens.css
│       ├── fonts.css
│       └── fonts/
├── sites/
│   └── coiffeur-mixte/
│       ├── src/
│       │   ├── _data/
│       │   │   └── site.json            # marque, navigation, métadonnées et footer
│       │   ├── _includes/
│       │   │   ├── layouts/base.njk     # structure document, head, header, main, footer
│       │   │   └── partials/
│       │   │       ├── header.njk
│       │   │       ├── footer.njk
│       │   │       └── head.njk
│       │   ├── index.njk
│       │   ├── coiffure.njk
│       │   ├── barbier.njk
│       │   └── salon.njk
│       ├── assets/
│       ├── css/
│       ├── js/
│       └── dist/                        # sortie générée, jamais éditée à la main
```

Les chemins exacts de sortie et le script de déploiement seront choisis avec le premier hébergeur. Le principe reste invariant : `dist/` est généré et chaque site peut être construit et publié séparément.

### Données minimales par site

Le header et le footer ne doivent pas être paramétrés par plusieurs copies HTML. Les données stables d'un site vivent dans un unique fichier local, par exemple :

- nom de marque et lien de retour à l'accueil ;
- éléments de navigation ;
- libellé et destination du CTA ;
- titre de page et méta-description ;
- contenu de footer et mention de démonstration ;
- état de navigation actif, dérivé du chemin courant plutôt qu'écrit à la main.

Les pages conservent leur contenu éditorial et leurs structures spécifiques. Le but est de mutualiser le chrome du site, non de forcer les pages Coiffure, Barbier ou Salon dans un gabarit identique.

### Règles d'implémentation futures

- Une page source ne contient pas de copie de header, footer ni de déclaration de polices à dupliquer.
- Le layout rend un unique `<main id="main" tabindex="-1">` et conserve les structures sémantiques existantes.
- Une partial de navigation génère `aria-current="page"` à partir de la page courante.
- Les fichiers CSS et JavaScript restent séparés par site tant qu'ils portent une identité ou une interaction propre à ce site.
- Toute interaction commune ne rejoint `shared/` qu'après preuve de réutilisation sur deux sites, avec un repli sans JavaScript documenté.

## 2. Polices web

### Décision

Le CDN Google Fonts est acceptable pour une **démo strictement locale ou éphémère**. En revanche, les polices doivent être **auto-hébergées avant la première publication publique du portfolio**, et non seulement avant une commande client.

Ce seuil est volontairement tôt : un portfolio public est lui-même une vitrine professionnelle. L'auto-hébergement supprime une dépendance tierce à l'affichage, limite les requêtes vers un tiers, stabilise le rendu et donne une règle unique à tous les futurs sites. La décision reste simple à appliquer tant que les polices et les variantes sont peu nombreuses.

Avant de stocker une police, vérifier sa licence, son origine et les variantes réellement nécessaires. Ces informations doivent être conservées à côté de la police ou dans un court fichier de notice.

### Emplacement et format

Les polices font partie du design system ; elles ne doivent ni être copiées dans chaque site, ni être mélangées aux images générales dans `shared/assets/`.

```text
shared/design-system/
├── fonts.css
└── fonts/
    ├── cormorant-garamond/
    │   ├── cormorant-garamond-600.woff2
    │   └── cormorant-garamond-700.woff2
    ├── dm-sans/
    │   ├── dm-sans-400.woff2
    │   ├── dm-sans-500.woff2
    │   └── dm-sans-700.woff2
    └── NOTICE.md
```

`fonts.css` déclare les `@font-face` et est chargé avant `tokens.css`, qui ne fait que référencer les familles via les variables `--font-heading` et `--font-body`.

Règles de performance :

- utiliser WOFF2 et les sous-ensembles couvrant réellement le français et les caractères typographiques employés ;
- ne conserver que les poids présents dans les styles ; aligner les poids CSS demandés avec les fichiers fournis ;
- définir `font-display: swap` ;
- ne précharger que les fontes réellement critiques au-dessus de la ligne de flottaison, pas toutes les variantes ;
- conserver des fallbacks système cohérents afin que le site reste lisible si une police locale ne charge pas.

Une police propre à un seul client peut rester dans `sites/<nom-du-site>/assets/fonts/`. Elle rejoint `shared/design-system/fonts/` uniquement si elle est une décision volontairement commune au portfolio.

## 3. Trajectoire de migration

### Étape 1 — au lancement du deuxième site vitrine

La création du deuxième site est le déclencheur de cette étape. Avant d'introduire l'outillage, comparer les deux shells pour confirmer ce qui est réellement commun et ce qui doit rester propre à chaque marque.

1. Introduire Eleventy comme dépendance de développement, à la racine du dépôt, une fois le besoin validé sur les deux sites.
2. Créer des partials locales `head`, `header` et `footer` pour chaque site ; ne pas créer de header mondial par anticipation.
3. Convertir les pages de `coiffeur-mixte` en sources de templates et extraire ses métadonnées et sa navigation dans `src/_data/site.json`.
4. Construire le deuxième site avec le même mécanisme, tout en conservant son shell et ses données propres.
5. Vérifier que le HTML généré conserve exactement les comportements accessibles : skip link, menu sans JavaScript, `aria-current`, titre, méta-description et favicon.
6. Conserver les CSS, JavaScript et assets comme ressources statiques ; cette étape ne justifie aucune réécriture des sites.

### Étape 2 — avant publication publique

1. Télécharger et auto-héberger les fontes après validation de licence.
2. Remplacer les liens Google Fonts par `shared/design-system/fonts.css` dans le layout commun.
3. Mesurer le poids réel et le rendu avec les polices de repli puis locales.
4. Définir la construction et le déploiement indépendant de `dist/` pour l'hébergeur retenu.

### Étape 3 — standardisation après validation sur deux sites

1. Réutiliser les tokens, styles de base, polices et primitives d'accessibilité de `shared/design-system/`.
2. Créer un shell local au nouveau site ; ne pas imposer celui de Créa'Tif.
3. Évaluer après deux sites si une partial cross-site apporte réellement plus de cohérence qu'elle n'ajoute de paramètres. Sans ce constat, garder les partials de shell locales.

## 4. Critères d'acceptation de cette architecture

- Modifier un lien de navigation ou une mention de footer d'un site ne demande qu'une modification de source.
- Le site généré reste utilisable avec JavaScript désactivé, notamment sa navigation mobile.
- Une page reste lisible et indexable comme HTML statique sans requête de rendu côté client.
- Chaque site peut être construit et publié sans embarquer les sources ou données d'un autre site.
- Aucun fichier généré n'est modifié manuellement.
- Avant publication publique, le rendu ne dépend plus de Google Fonts ou d'un autre CDN de polices tiers.

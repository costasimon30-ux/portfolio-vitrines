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

Cette décision est **différée jusqu'à l'existence d'un deuxième site vitrine**. `coiffeur-mixte` conserve donc, temporairement et de manière assumée, son shell dupliqué : un seul site ne justifie pas encore l'ajout d'un outillage de compilation de templates. La création du deuxième site sera le point de validation concret des éléments réellement mutualisables et déclenchera la migration vers des partials compilées. Le simple assemblage de publication reste distinct (section 5).

### Pourquoi un build step, et non une autre solution

| Option | Décision | Motif |
| --- | --- | --- |
| Partials compilés par Eleventy | Retenue | Layouts, includes, données par page et sortie HTML statique, sans JavaScript de runtime. |
| Includes côté serveur (SSI, PHP, etc.) | Écartée | Dépend du serveur choisi et ne garantit pas le fonctionnement sur GitHub Pages ou un hébergement statique. |
| `fetch()`/injection du header et footer en JavaScript | Écartée | Rend le shell dépendant du JavaScript, ajoute un flash de contenu et détériore le repli, le SEO et l'accessibilité. |
| Copier-coller documenté | Écartée | Ne traite pas la cause et reporte la dette à chaque nouvelle page. |
| Générateur de templates maison | Écartée | Le besoin est déjà couvert par un outil maintenu ; un script interne deviendrait une dépendance à entretenir. |

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

La sortie retenue est `sites/<site>/dist/`, définie en section 5. Le schéma `src/` ci-dessus concerne la future migration Eleventy ; les sources HTML actuelles restent en place jusque-là. L'assemblage de publication décrit en section 5 ne génère aucun template et n'avance pas cette migration.

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

Les polices communes ont une source unique dans le design system ; elles ne doivent ni être dupliquées dans les sources de chaque site, ni être mélangées aux images générales dans `shared/assets/`. Leur copie dans chaque sortie publiée est en revanche nécessaire à l'autonomie d'hébergement (section 5).

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

Cette étape est indépendante de l'étape 1 : elle peut être réalisée avec un seul site. Les fontes de Créa'Tif sont déjà locales à la date du 7 septembre 2026 ; conserver les fichiers et graisses effectivement employés.

1. Pour tout site suivant, auto-héberger les fontes après validation de licence et remplacer les liens CDN dans les pages, puis dans le layout commun lorsque celui-ci existe.
2. Vérifier le rendu avec les fontes locales et de repli sur la sortie assemblée.
3. Préparer l'assemblage indépendant et les directives d'indexation selon la section 5, sans déploiement implicite.

### Étape 3 — standardisation après validation sur deux sites

1. Réutiliser les tokens, styles de base, polices et primitives d'accessibilité de `shared/design-system/`.
2. Créer un shell local au nouveau site ; ne pas imposer celui de Créa'Tif.
3. Évaluer après deux sites si une partial cross-site apporte réellement plus de cohérence qu'elle n'ajoute de paramètres. Sans ce constat, garder les partials de shell locales.

## 4. Critères d'acceptation de cette architecture

- Après la migration Eleventy, modifier un lien de navigation ou une mention de footer d'un site ne demande qu'une modification de source ; la duplication actuelle reste acceptée jusque-là.
- Le site généré reste utilisable avec JavaScript désactivé, notamment sa navigation mobile.
- Une page reste lisible et explorable comme HTML statique sans requête de rendu côté client ; son indexation dépend du site et de l'environnement (section 5).
- Chaque site peut être construit et publié sans embarquer les sources ou données d'un autre site.
- Aucun fichier généré n'est modifié manuellement.
- Avant publication publique, le rendu ne dépend plus de Google Fonts ou d'un autre CDN de polices tiers.

## 5. Publication indépendante — contrat du 7 septembre 2026

Ce contrat applique le cadrage de `docs/DIRECTION.md` au commit `174ebdb`. Il est destiné à l'implémentation par Claude sur instruction ultérieure. Les commandes et fichiers décrits ci-dessous sont proposés, pas exécutés ou créés par cette note. Aucune incompatibilité avec le cadrage produit n'est identifiée.

### 5.1 Sources, sorties et URL

Conserver un dépôt et publier un artefact distinct par site. Réserver **`sites/portfolio/`** au futur portfolio professionnel, sans créer ce dossier ni son contenu maintenant. Créa'Tif reste dans `sites/coiffeur-mixte/` et n'est jamais copié comme accueil du portfolio ou comme `index.html` à la racine du dépôt.

| Élément | Sources | Sortie publiable | Projet Pages proposé, sous réserve de disponibilité |
| --- | --- | --- | --- |
| Démo Créa'Tif | `sites/coiffeur-mixte/` | `sites/coiffeur-mixte/dist/` | `portfolio-vitrines-coiffeur-mixte` |
| Future démo | `sites/<slug>/` | `sites/<slug>/dist/` | `portfolio-vitrines-<slug>` |
| Futur portfolio, emplacement réservé | `sites/portfolio/` | `sites/portfolio/dist/` | `portfolio-vitrines` |

Chaque sortie contient ses pages à sa propre racine et une copie de ses dépendances communes. `dist/` est déjà couvert par `.gitignore` ; il reste non versionné. Ni le dépôt entier, ni `sites/`, ni le dossier source d'un site ne doivent être sélectionnés comme sortie publiée.

Après accord de Simon, première URL : `https://<projet>.pages.dev/`. Cible éventuelle : domaine principal pour le portfolio, `https://<slug>.<domaine>/` pour chaque démo. Ces notations ne réservent aucun nom. Le rattachement ultérieur d'un domaine préserve les chemins ; il demandera la configuration du domaine et des URL alternatives, sans déplacer les sources. [Cloudflare — domaines personnalisés](https://developers.cloudflare.com/pages/configuration/custom-domains/).

Les fichiers restent `index.html`, `coiffure.html`, `barbier.html`, `salon.html`. Pages redirige normalement les URL `.html` vers les URL sans extension : attendre `/`, `/coiffure`, `/barbier`, `/salon` sur l'hébergement, tout en conservant les liens relatifs actuels pour le service HTTP local. QA devra vérifier les redirections et l'ancre Contact. Ne pas introduire de routeur ou de réécriture générale vers l'accueil. [Cloudflare — résolution des pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).

### 5.2 Assembleur minimal et manifeste local

**Emplacement proposé : `scripts/assemble-site.mjs`**, à la racine du dépôt. Script Node utilisant uniquement la bibliothèque standard, sans installation npm, téléchargement de ressource, framework ou moteur de templates. Choisir et figer une version Node LTS prise en charge localement et par Pages dans `.node-version` lors de l'implémentation. Le besoin est une sélection de fichiers, une copie et des transformations bornées de publication ; aucun traitement des images ni recomposition du header/footer.

Interface unique, depuis la racine du dépôt :

```text
node scripts/assemble-site.mjs <slug> --environment production
node scripts/assemble-site.mjs <slug> --environment preview
node scripts/assemble-site.mjs <slug>
```

L'option explicite sert aux essais locaux. Sans option, lire `PUBLICATION_ENV`, limité à `production` ou `preview` ; en son absence, utiliser `preview`. Une valeur inconnue doit faire échouer la commande. Sous Pages, si `CF_PAGES_BRANCH` est absent ou différent de `main`, forcer `preview` même si la variable demande `production`. Ainsi, un futur build de branche ne rend pas accidentellement le portfolio indexable. La production d'une démo reste non indexable dans tous les cas.

**Configuration : `sites/<slug>/publication.json`**, exclue de la sortie. Petit manifeste de données, avec quatre champs :

- `kind` : `demo` ou `portfolio` ; `coiffeur-mixte` vaut `demo`. Le type ne se déduit jamais du nom du dossier ou de la branche.
- `pages` : liste explicite des fichiers HTML à la racine du site ; actuellement les quatre pages plus `404.html`, à créer par Claude avant le premier artefact publiable. `index.html` et `404.html` sont obligatoires.
- `publicFiles` : liste de fichiers exacts, relatifs au site, à copier avec leurs chemins conservés. Pour Créa'Tif : `css/style.css`, `js/main.js`, `assets/favicon.svg`, les 24 WebP actuels et `assets/photos/NOTICE.md`. La liste initiale peut être établie à partir des fichiers existants, puis versionnée et mise à jour explicitement.
- `sharedFiles` : liste de fichiers exacts, relatifs à `shared/`. Pour Créa'Tif : `design-system/fonts.css`, `design-system/tokens.css`, les quatre WOFF2 effectivement référencés et `design-system/fonts/NOTICE.md`, ainsi que tout fichier de licence nécessaire associé. Aucun autre site ni bibliothèque complète n'est inclus automatiquement.

Le choix de listes explicites rend l'artefact prévisible et évite les copies récursives du dépôt. Ajouter une photo optimisée ou une nouvelle dépendance implique d'ajouter son chemin au manifeste. Les répertoires `shared/` et les noms `robots.txt`, `_headers`, `sitemap.xml` dans la sortie sont réservés à l'assembleur ; refuser les collisions et les destinations dupliquées. Aucun chemin absolu, remontée `..` ou lien symbolique n'est accepté dans les entrées. Un slug doit correspondre à un enfant direct existant de `sites/`, en kebab-case.

Fichiers exclus par construction : `docs/` et ses captures, `Claude outputs/`, `.git`, fichiers cachés, configuration/outillage, manifestes, sources d'autres sites, templates futurs, archives, sourcemaps et anciennes sorties. Les notices de licence listées sont des ressources publiques utiles : ne pas appliquer une exclusion aveugle à tous les `.md`.

### 5.3 Copie, chemins et nettoyage

L'assembleur suit ces opérations dans cet ordre :

1. Résoudre la racine du dépôt depuis l'emplacement du script, puis valider le slug, le manifeste, l'environnement, toutes les entrées et les destinations avant toute suppression. Une entrée absente ou hors périmètre produit un code de sortie non nul.
2. Nettoyer uniquement **`sites/<slug>/dist/`**, après contrôle qu'il s'agit exactement de la sortie calculée et qu'aucun segment traversé n'est un lien symbolique. Ne jamais nettoyer `sites/<slug>/`, `sites/`, un autre `dist/` ou la racine du dépôt. Aucun paramètre de sortie arbitraire n'est accepté.
3. Copier `pages` et `publicFiles` à l'identique dans cette sortie. Copier chaque `sharedFiles` sous `dist/shared/`, en conservant ses sous-dossiers. Ces copies dans les artefacts ne créent pas de nouvelles sources à maintenir.
4. Dans les seuls HTML copiés, remplacer la valeur des liens CSS `../../shared/design-system/fonts.css` et `../../shared/design-system/tokens.css` par `shared/design-system/fonts.css` et `shared/design-system/tokens.css`. Les huit références présentes dans les quatre pages actuelles sont le cas initial vérifié ; ne pas coder huit comme total universel, puisque la page 404 peut en ajouter. Tout autre chemin sortant de l'artefact doit faire échouer le contrôle final, et conduire à une adaptation explicite du manifeste ou du contrat.
5. Appliquer les directives d'indexation de la section 5.5 aux HTML copiés et écrire `robots.txt` et `_headers` dans la sortie. Ce sont les seuls ajouts automatiques de contenu de publication ; aucune génération de section éditoriale.
6. Contrôler les ressources locales et annoncer le site, le mode effectif, la sortie, le nombre de fichiers et le poids total. Échouer avec un code non nul si un contrôle échoue ; une sortie incomplète ne doit jamais être publiée. À mêmes sources et environnement, produire les mêmes fichiers, sans horodatage variable embarqué.

Les liens entre pages, les `srcset`, les URL de photos dans le CSS et les liens de crédits restent inchangés. En particulier, `css/style.css` reste à la même profondeur par rapport à `assets/`. `fonts.css` conserve ses URL `fonts/...woff2`, résolues sous `dist/shared/design-system/fonts/`. Les photos, polices et notices sont copiées octet pour octet. On ne réécrit pas globalement les chaînes `../` dans tous les fichiers.

La version minimale ne traite que des pages HTML à la racine, comme le site actuel. L'arrivée de pages imbriquées nécessite un calcul des URL relatif à chaque document, à intégrer dans Eleventy au moment prévu, pas une extension implicite du remplacement de chaînes.

**Page 404 :** Claude devra écrire une page HTML locale simple, sans nouvelle section de navigation, avec un lien vers `/` et des chemins de ressources partant de `/` si elle réutilise les styles. Ces chemins sont relatifs à l'origine, valables sur chaque hôte indépendant, et nécessaires lorsque la 404 répond à une URL imbriquée. La page porte `noindex, follow` dans tous les environnements. Sa présence à la racine de la sortie empêche Pages d'appliquer son comportement SPA par défaut ; un chemin inconnu doit répondre en HTTP 404. [Cloudflare — page 404 et comportement SPA](https://developers.cloudflare.com/pages/configuration/serving-pages/).

### 5.4 Réglages Cloudflare proposés et déclencheurs

À appliquer uniquement après les accords de Simon sur le compte, la connexion et la publication. **La connexion Git peut elle-même déclencher une première publication** : ne pas la réaliser pour simplement tester cette note.

| Réglage du projet Créa'Tif | Valeur proposée |
| --- | --- |
| Dépôt / branche de production | `portfolio-vitrines` / `main` |
| Framework preset | Aucun |
| Répertoire racine du build | Racine du dépôt ; champ laissé vide |
| Commande de build | `node scripts/assemble-site.mjs coiffeur-mixte` |
| Répertoire de sortie | `sites/coiffeur-mixte/dist` |
| Variable en environnement Production | `PUBLICATION_ENV=production` |
| Variable en environnement Preview | `PUBLICATION_ENV=preview` |
| Runtime | Version Node figée à l'implémentation, identique au local |
| Functions, Worker, dépendances payantes | Aucun |

La racine du dépôt garantit la disponibilité des sources et de `shared/` dans le contexte du build. L'isolation se fait par le répertoire de sortie. Aucune hypothèse d'accès hors d'une racine configurée sur `sites/coiffeur-mixte` n'est nécessaire. Pages distingue commande, racine et sortie du build. [Cloudflare — configuration des builds](https://developers.cloudflare.com/pages/configuration/build-configuration/).

**Build watch paths de Créa'Tif**, en remplacement de l'inclusion par défaut `*` :

```text
Include:
  sites/coiffeur-mixte/*
  shared/design-system/*
  scripts/assemble-site.mjs
  .node-version
Exclude:
  sites/coiffeur-mixte/dist/*
  docs/*
  Claude outputs/*
```

Le joker final `*` couvre les sous-dossiers dans les règles Pages. Ne pas exclure globalement `*.md` : une modification de `assets/photos/NOTICE.md` ou d'une notice de police doit reconstruire la publication qui la distribue. Le titre `docs:` d'un commit ne décide pas du build ; ses chemins modifiés le décident. Un changement limité à `docs/`, `CLAUDE.md` ou `README.md` est ignoré par cette sélection. Un changement du design system reconstruit les sites qui le consomment ; un changement du code Créa'Tif ne reconstruit pas les autres sites. Adapter les chemins partagés aux dépendances réellement déclarées à mesure que le portfolio grandit.

Ces filtres concernent les pushes ordinaires. Pages documente des exceptions (push vide, 3 000 fichiers ou plus, 20 commits ou plus) ; ils ne constituent donc pas une interdiction absolue de build. Les relances manuelles restent distinctes. [Cloudflare — filtres et exceptions](https://developers.cloudflare.com/pages/configuration/build-watch-paths/).

Proposition pour le premier raccordement autorisé : publications de production déclenchées manuellement jusqu'à validation par Simon du mode automatique sur `main`, prévisualisations automatiques de branches désactivées initialement. S'il autorise ensuite leur activation, conserver les variables séparées et les filtres ci-dessus. Décrire les réglages effectifs et le commit publié lors de cette étape ; ne pas présumer leur activation aujourd'hui.

Ajouter un site consiste à créer `sites/<slug>/`, son manifeste et son brief, puis, après accord, un projet Pages visant `sites/<slug>/dist/` et la même commande avec ce slug. Chaque projet surveille uniquement son site, ses dépendances communes et l'outillage utilisé. Aucun changement d'URL ou déplacement des sites existants. Le futur portfolio utilise cette même convention avec `kind=portfolio`. La limite actuelle de cinq projets reliés au dépôt, portfolio compris, reste un arbitrage à traiter avant le sixième ; aucune multiplication de dépôts n'est prescrite ici. [Cloudflare — monorepos](https://developers.cloudflare.com/pages/configuration/monorepos/).

### 5.5 Indexation par site, environnement et ressource

L'assembleur calcule une politique à partir de `kind` et du mode effectif ; il ne copie jamais un `_headers` global commun aux sites. Dans chaque HTML de sortie, ajouter une seule balise `<meta name="robots" content="…">` dans le `<head>`, ou remplacer la balise standard existante. Refuser une structure ambiguë (plusieurs balises ou consignes contradictoires spécifiques à un robot) pour correction explicite des sources. Cette substitution limitée ne transforme pas l'assembleur en moteur HTML.

| Site / mode effectif | Balise robots des pages ordinaires | En-tête HTTP proposé |
| --- | --- | --- |
| Démo / production | `noindex, follow` | `X-Robots-Tag: noindex, follow` pour `/*` |
| Démo / preview ou local par défaut | `noindex, follow` | Même règle globale |
| Portfolio / preview ou local par défaut | `noindex, follow` | Même règle globale |
| Portfolio / production, après validation | `index, follow` | Aucune règle globale `noindex` ; exceptions 404 et notices uniquement |

Pour tous les sites, `robots.txt` à la racine de la sortie contient `User-agent: *` puis `Allow: /`, sur deux lignes. Pas de `Disallow: /` ni de directive `noindex` dans ce fichier. Google doit pouvoir explorer les pages pour lire leur interdiction d'indexation ; `noindex` ne protège pas l'accès et n'efface pas instantanément un résultat existant. [Google — noindex et exploration](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

Le script écrit les en-têtes dans **`dist/_headers`**, fichier interprété par Cloudflare pour les ressources statiques. Pour une démo ou une preview, le bloc global proposé est :

```text
/*
  X-Robots-Tag: noindex, follow
```

**Notice de crédits :** conserver le lien et les octets de `assets/photos/NOTICE.md`. Elle reste publiquement consultable mais non indexable, même servie séparément. Ajouter un bloc à son chemin exact avec `Content-Type: text/plain; charset=utf-8` ; hors règle globale, y ajouter aussi `X-Robots-Tag: noindex, follow`. Appliquer la même convention aux notices/licences textuelles explicitement incluses, notamment `/shared/design-system/fonts/NOTICE.md`. Il n'y a pas de conversion Markdown vers HTML, de renommage du lien ou de réécriture des crédits. Une balise meta dans les quatre pages ne s'appliquerait pas à ces ressources non HTML. [Cloudflare — fichier _headers](https://developers.cloudflare.com/pages/configuration/headers/), [Google — en-tête pour les ressources non HTML](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

Pour le portfolio en production, les pages ordinaires doivent effectivement rester indexables : ne pas tenter d'annuler une règle globale `noindex` par une seconde règle `index`. Générer un fichier sans cette règle globale, avec seulement les exceptions nécessaires. Les balises et en-têtes ne doivent pas se contredire.

Cloudflare ajoute déjà `X-Robots-Tag: noindex` à ses déploiements de prévisualisation ; garder néanmoins la politique explicite de l'artefact, et vérifier l'en-tête effectivement servi. Le domaine de production `https://<projet>.pages.dev/` n'est pas une preview simplement parce qu'il appartient à la plateforme. [Cloudflare — prévisualisations](https://developers.cloudflare.com/pages/configuration/preview-deployments/).

Pour le futur portfolio indexable, prévoir également dans `_headers` une règle d'hôte `https://:version.:project.pages.dev/*` avec `X-Robots-Tag: noindex, follow` : elle couvre les URL techniques versionnées et alias de branche sans bloquer `https://<projet>.pages.dev/`. QA vérifiera ce cas même lorsqu'une URL versionnée dessert un artefact de production. [Cloudflare — règles d'hôtes](https://developers.cloudflare.com/pages/configuration/headers/).

**Sitemaps et URL alternatives :** aucun sitemap pour les démos `noindex`, ni pour les previews. Aucun domaine fictif ni canonique inventée dans l'artefact actuel. Le sitemap et les canoniques du futur portfolio seront préparés quand son contenu et son origine de production seront validés ; ne pas mettre les URL de démos non indexables dans ce sitemap. Au raccordement d'un domaine personnalisé, choisir une origine publique de référence, rediriger les URL de plateforme correspondantes vers elle en conservant chemin et paramètres, puis actualiser les canoniques et sitemap du portfolio. Les previews conservent leur non-indexation. Ces réglages futurs n'exigent pas de réorganiser les sources.

### 5.6 Vérifications et frontière de recette

**À réaliser par Claude pendant l'implémentation, localement :**

1. Assembler Créa'Tif en `production` puis en `preview`. Vérifier sa non-indexation dans les deux sorties. Vérifier la branche de politique `portfolio/production` par un petit jeu de données temporaire de test, sans créer le futur portfolio ; vérifier également le repli preview en environnement absent ou branche non-main.
2. Assembler deux fois le même site avec le même mode et comparer les fichiers produits. Vérifier que seules les sorties générées changent et qu'un autre site ou dossier source n'est jamais nettoyé. Tester un slug invalide et une entrée manquante : échec explicite.
3. Comparer l'inventaire publié au manifeste et aux fichiers générés attendus. Aucune capture, configuration, autre site ou source interne. Vérifier les empreintes des médias, fontes et notices copiés ; la réserve documentaire existante est conservée.
4. Servir uniquement `sites/coiffeur-mixte/dist/` comme racine HTTP locale, par exemple avec `ruby -run -e httpd sites/coiffeur-mixte/dist -p 8765` depuis la racine du dépôt. Ne pas servir le dépôt pour ce contrôle : cela masquerait des dépendances sortantes.
5. Vérifier les quatre accès directs, navigation, ancre Contact, favicon, notice, CSS, quatre fontes et les 24 variantes photo (`src`, `srcset`, URL CSS). Aucune dépendance locale hors artefact ; aucune erreur JavaScript ou ressource manquante. Vérifier le rendu ciblé à 375 et 1440 px, et une fois sans JavaScript. Pas de nouvelle revue artistique générale.
6. Lire les metas, `robots.txt` et `_headers` générés, et vérifier la présence de `404.html`. Un simple serveur local ne reproduit ni `_headers`, ni les redirections Pages : ce contrôle ne prouve pas le comportement HTTP du futur hébergement.

Les essais d'assemblage déjà rapportés par Claude étayent la faisabilité ; ils ne constituent pas une exécution de ce nouveau contrat. Cette note est documentaire et ne déclare aucun de ces tests nouvellement passé.

**À réserver à QA sur l'URL hébergée, après publication autorisée :** relever l'URL et le hash déployé ; vérifier HTTPS, redirections `.html`, accès directs et ancre, chargement effectif des CSS/polices/photos, notice lisible avec type MIME et `X-Robots-Tag`, robots et metas réellement servis. Contrôler production, URL versionnée et preview si elle existe, ainsi que la différence d'indexation du futur portfolio. Confirmer un vrai statut 404 sur `/inexistant` et `/dossier/inexistant`, avec lien de retour fonctionnel ; vérifier que `/docs/`, ses captures et un chemin d'un autre site ne servent aucun contenu interne. Compléter par un contrôle mobile/desktop ciblé et des requêtes après rechargement pour détecter les erreurs de cache ou chemins. L'absence de données dans l'artefact n'efface pas leur présence dans le dépôt GitHub public.

### 5.7 Raccordement à Eleventy et décisions restant à Simon

L'assemblage répond au besoin de publication du premier site. Au deuxième site vitrine, la validation de mutualisation puis la trajectoire Eleventy de la section 3 restent déclenchées comme convenu. Eleventy prendra en charge les layouts et la production HTML ; ses copies de ressources et sa configuration de sortie pourront absorber les copies et transformations actuelles. Maintenir **le contrat de sortie `sites/<slug>/dist/`**, les URL, la séparation des sites et les règles d'indexation.

Supprimer `scripts/assemble-site.mjs` seulement lorsque ses responsabilités sont couvertes et vérifiées ; un petit utilitaire de préparation des en-têtes peut subsister si nécessaire. Ne pas conserver deux chaînes concurrentes pour produire le même HTML. À cette migration, mettre à jour la commande et les chemins surveillés (configuration Eleventy, `package.json`, lockfile et éventuels utilitaires), sans changer les projets Pages ni publier les sources des autres sites.

La création de `scripts/` est une extension d'outillage explicitement prévue par la présente mission ; sa future implémentation relève de Claude, avec le manifeste local et l'éventuelle configuration runtime à la racine. Aucune autre modification de la répartition des agents n'est décidée.

Aucun arbitrage structurel bloquant ne reste pour préparer l'assemblage. Restent à Simon : l'autorisation de compte/connexion, la première mise en ligne et le mode des publications suivantes, puis l'achat et le raccordement éventuels d'un domaine. Un arbitrage de capacité sera nécessaire avant le sixième projet Pages connecté. Le maintien de P06 est acté ; sa réserve documentaire reste ouverte, sans nouvelle recherche ou modification de média demandée par cette architecture.

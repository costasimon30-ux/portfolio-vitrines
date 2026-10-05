# Architecture front-end du portfolio

Ce document fixe les décisions structurelles communes à `portfolio-vitrines`. Il complète `CLAUDE.md` et `docs/WORKFLOW.md` ; il ne remplace pas les décisions produit ou de direction artistique propres à un site dans `docs/DIRECTION.md`.

## Principes directeurs

- Le portfolio reste en **HTML, CSS et JavaScript statiques**. Aucun framework JavaScript ne doit être livré au navigateur.
- Chaque site dans `sites/<nom-du-site>/` reste déployable indépendamment.
- `shared/` ne contient que des éléments réellement communs et stables. Un composant propre à une marque ou à sa navigation ne devient pas « partagé » par défaut.
- La mutualisation se fait à la compilation, jamais par injection HTML au chargement de la page.
- Les dépendances sont de développement uniquement lorsqu'elles évitent une duplication durable ou des scripts maison fragiles.

## 1. Shells de site : header, footer et `<head>`

### Décision au lancement de La Tablée des Forges (5 octobre 2026)

**Reporter Eleventy pour cette V1.** L'existence d'un deuxième site vitrine déclenche l'examen promis, pas automatiquement une migration. Les pages livrées restent du HTML/CSS/JS statique ; l'assembleur existant reste le seul outil de préparation des artefacts. Aucune dépendance npm, configuration Eleventy ou génération de templates n'est demandée à Claude pour la brasserie.

| Site observé / prévu | Shell et répétition | Ce qui peut être mutualisé maintenant |
| --- | --- | --- |
| Créa'Tif (`coiffeur-mixte`) | Header, navigation, footer et liens de styles répétés dans quatre pages ordinaires ; 404 distincte. | À l'intérieur de ce site seulement, lors d'une future extraction de partials. Sa marque, sa navigation, ses crédits et son CSS ne sont pas un shell commun au dépôt. |
| Portfolio (`portfolio`) | Une page principale et une 404 ; rail, thème clair/sombre, fontes et styles propres. | Aucun shell inter-sites. Le mécanisme de thème et les polices Inter/IBM Plex Mono restent locaux. |
| La Tablée des Forges (`la-tablee-des-forges`, à créer) | Trois pages de brasserie prévues ; header/footer cohérents entre elles, identité bois sombre/métal distincte. | Une convention locale de navigation et de mention fictive ; pas de reprise automatique du HTML/CSS de Créa'Tif ni du portfolio. |

Les invariants réutilisables sont **des contrats**, pas un composant global : document HTML sémantique, lien d'évitement, navigation au clavier, ressources autonomes dans `dist/`, politique `noindex, follow` pour les démos. La duplication bornée de trois petits shells locaux est acceptée pour construire cette V1. Claude garde header, footer et `<head>` concordants sur ses trois pages et vérifie les liens/états actifs ; il ne crée ni include côté serveur, ni injection JavaScript, ni moteur de templates maison. Le CSS, le JS et les données éditoriales restent propres au site. La carte est du contenu statique lisible sans JavaScript, pas une base de données ou un module partagé.

`shared/design-system/` contient aujourd'hui les fontes et tokens utilisés par Créa'Tif, **pas** un design system neutre déjà validé par le portfolio. Une similarité de bouton, de conteneur ou de typographie ne suffit pas à déplacer du code vers `shared/` : il faut deux usages réels et compatibles, un bénéfice de maintenance mesurable et une vérification des artefacts des deux consommateurs. La brasserie peut avoir des polices et styles locaux, avec licences et variantes nécessaires seulement. Tout changement de `shared/`, d'un contrat de publication ou d'un autre site doit être remonté au Chef de projet ou à l'Architecte avant implémentation.

Eleventy reste l'option privilégiée **si** une duplication de shell devient une charge observée (section 3). Il produirait du HTML statique, avec partials **locales à chaque site** et aucune dépendance côté navigateur ; un `shared/header` mondial n'est pas présumé. SSI/PHP imposeraient un serveur, et `fetch()` pour le shell rendrait la navigation dépendante de JavaScript : ces voies restent écartées.

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

### Étape 1 — deuxième vitrine : examen clos, HTML statique conservé

La comparaison de la section 1 ne révèle pas de shell inter-sites à partager. Pour La Tablée des Forges, Claude crée `sites/la-tablee-des-forges/` avec trois pages HTML plates à sa racine (accueil, carte, lieu/infos), une `404.html`, ses ressources locales et son `publication.json` de type `demo`. Les noms exacts des deux pages secondaires sont fixés une fois par Claude et repris sans divergence dans la navigation et le manifeste. Le shell cohérent est maintenu localement sur ces trois pages ; les états actifs, titres et descriptions sont propres à chaque page. Pas de `src/` de templates ni de conversion des sites publiés. Les polices, médias et notices restent dans le site sauf réutilisation inter-sites réellement validée. L'assemblage reste `node scripts/assemble-site.mjs la-tablee-des-forges --environment preview` pour les essais, puis `--environment production` pour préparer un candidat ; ce build local ne publie rien.

**Déclencheur de réexamen :** après livraison de cette V1, à la première demande de maintenance qui oblige à appliquer **le même changement de header, footer ou `<head>` à au moins trois pages d'un même site**, Claude relève les fichiers concernés, le nombre d'éditions identiques et le risque de divergence, puis remonte une proposition de partials locales au Chef de projet et à l'Architecte *avant* de changer l'outillage. Une nouvelle vitrine multipage présentant ce même coût déclenche aussi l'examen. Ce n'est pas une autorisation automatique de migrer : si les différences par page dominent, conserver le HTML. Si le coût est établi, évaluer Eleventy comme dépendance de développement, sans template global de marque ; préciser à ce moment-là l'ordre compilation → assemblage, les entrées autorisées et la sortie par site avant tout code. Aucun routeur, rendu client ou backend ne suit de cette décision.

### Étape 2 — ressources et publication indépendantes

Pour chaque nouveau site, auto-héberger les seules variantes de polices employées après vérification de licence ; garder un repli système et `font-display: swap`. Déclarer précisément les pages, CSS, JS éventuel, images, fontes et notices dans `publication.json`. L'assembleur génère uniquement `sites/<slug>/dist/` et applique les directives du § 5.5 : `noindex, follow` pour une démo, exploration permise. Servir localement **cette sortie seule** et contrôler pages, ressources et 404. Le choix d'un hôte et chaque dépôt manuel restent soumis à un accord distinct de Simon sur la révision et l'artefact ; ajouter une vitrine au dépôt ne modifie aucune URL publiée.

### Étape 3 — mutualisation seulement sur preuve

Une extraction vers `shared/` suppose deux usages effectifs, une API de variation courte et stable, la compatibilité visuelle des deux marques et des tests des deux sorties. Par défaut, les tokens, composants, comportements et données de la brasserie restent locaux ; ceux de Créa'Tif et du portfolio ne sont pas réorganisés pour elle. Une éventuelle adoption ultérieure d'Eleventy doit préserver les URL et le contrat du § 5, comparer les artefacts avant/après pour **Créa'Tif et le portfolio**, et conserver une seule chaîne de génération HTML par site. Elle fait l'objet d'une décision et d'un lot séparés, jamais d'une migration implicite pendant la création de La Tablée.

## 4. Critères d'acceptation de cette architecture

- Pour La Tablée des Forges V1, le shell de ses trois pages reste cohérent malgré la duplication locale ; une modification transversale répond au déclencheur de réexamen du § 3.
- Le site généré reste utilisable avec JavaScript désactivé, notamment sa navigation mobile.
- Une page reste lisible et explorable comme HTML statique sans requête de rendu côté client ; son indexation dépend du site et de l'environnement (section 5).
- Chaque site peut être construit et publié sans embarquer les sources ou données d'un autre site.
- Aucun fichier généré n'est modifié manuellement.
- Avant publication publique, le rendu ne dépend plus de Google Fonts ou d'un autre CDN de polices tiers.

## 5. Publication indépendante — contrat actualisé le 8 septembre 2026

Ce contrat conserve les garanties de sortie du cadrage `174ebdb` et applique l'arbitrage de `docs/DIRECTION.md` au commit **`0154069`** : Créa'Tif est publié sur **Workers Static Assets par dépôt manuel de l'artefact local**, sans connexion Git. Pages + Git reste une proposition historique, non activée (§ 5.4). Le changement d'hébergement ne justifie ni migration, ni refonte de l'assembleur déjà audité.

L'état publié ci-dessous est celui rapporté par Claude et consigné dans DIRECTION, pas une nouvelle observation HTTP de l'Architecte. L'assemblage est livré et contre-vérifié ; les procédures de publication et de retour arrière sont documentées ici, sans être exécutées. **Toute publication suivante, retour arrière compris, exige l'accord explicite de Simon pour la version ciblée.** Un commit, un push ou une correction QA ne vaut jamais cet accord.

### 5.1 Sources, sorties et URL

Conserver un dépôt et publier un artefact distinct par site. **Créa'Tif et le portfolio sont déjà deux sites distincts** : ne pas traiter le portfolio comme un emplacement futur ni copier la démo comme accueil. La Tablée des Forges sera une troisième source autonome ; sa création n'altère ni les fichiers ni les URL des deux sites publiés.

| Élément | Sources | Sortie publiable | Situation |
| --- | --- | --- | --- |
| Démo Créa'Tif | `sites/coiffeur-mixte/` | `sites/coiffeur-mixte/dist/` | Worker `portfolio-vitrines-coiffeur-mixte`, dépôt manuel |
| Portfolio professionnel | `sites/portfolio/` | `sites/portfolio/dist/` | Worker `portfolio-simon-costa`, dépôt manuel ; journal de version dans `docs/PUBLICATION-portfolio.md` |
| Démo La Tablée des Forges, à créer | `sites/la-tablee-des-forges/` | `sites/la-tablee-des-forges/dist/` | Hébergement et URL à arbitrer ; aucun dépôt autorisé par la création des sources |

Chaque sortie contient ses pages à sa propre racine et seulement ses dépendances déclarées. `dist/` est ignoré par Git et jamais édité manuellement. Ni le dépôt entier, ni `sites/`, ni le dossier source d'un site ne sont une sortie publiable. Les URL effectives des deux sites en ligne sont [Créa'Tif](https://portfolio-vitrines-coiffeur-mixte.costa-simon30.workers.dev/) et [portfolio](https://portfolio-simon-costa.costa-simon30.workers.dev/). Leur publication est manuelle sur Workers Static Assets, sans connexion Git ; aucune mise en ligne de la brasserie ne découle de cette note. Un éventuel domaine personnalisé reste une décision distincte de Simon.

L'assembleur du § 5.2 n'accepte que des pages HTML plates à la racine de chaque site. Pour Créa'Tif, conserver `index.html`, `coiffure.html`, `barbier.html` et `salon.html` et leurs URL publiées. Pour La Tablée, choisir trois noms de fichiers plats cohérents avec ses liens relatifs ; aucune page imbriquée, aucun routeur ou repli SPA. La `404.html` obligatoire conserve des liens et ressources qui fonctionnent aussi lorsqu'une URL inconnue est imbriquée. QA vérifie les réponses et redirections réelles sur l'hôte seulement après un dépôt autorisé ; ne pas supposer qu'un serveur local reproduit Workers. [Workers — résolution HTML](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/).

### 5.2 Assembleur minimal et manifeste local

**Assembleur livré : `scripts/assemble-site.mjs`**, à la racine du dépôt. Script Node utilisant uniquement la bibliothèque standard, sans installation npm, téléchargement de ressource, framework ou moteur de templates. `.node-version` fixe **22.23.2**, version employée pour la contre-vérification et le build publié déclaré. Node sert uniquement à l'assemblage local, pas à l'exécution des pages hébergées. Le besoin reste une sélection de fichiers, une copie et des transformations bornées de publication ; aucun traitement des images ni recomposition du header/footer.

Interface unique, depuis la racine du dépôt :

```text
node scripts/assemble-site.mjs <slug> --environment production
node scripts/assemble-site.mjs <slug> --environment preview
node scripts/assemble-site.mjs <slug>
```

L'option explicite sert aux essais **et à la préparation locale de la publication manuelle**. Sans option, l'assembleur lit `PUBLICATION_ENV`, limité à `production` ou `preview` ; en son absence ou si la variable est vide, il utilise `preview`. Une valeur inconnue sélectionnée doit faire échouer la commande. Ces valeurs sont des entrées locales de l'assembleur, pas des variables à installer dans le Worker : les directives sont déjà écrites dans l'artefact déposé.

Le garde-fou Pages livré est conservé : si `CF_PAGES=1` ou `CF_PAGES_BRANCH` est défini, une demande `production` est ramenée à `preview` lorsque `CF_PAGES_BRANCH` est absent ou différent de `main`. Ce contexte Pages n'est pas actif dans le flux manuel Workers ; ne pas fabriquer ces variables ni les assimiler à Workers Builds. Vérifier le mode effectif annoncé. La production d'une démo reste non indexable dans tous les cas ; le mode local `preview` ne crée aucune URL distante.

**Configuration : `sites/<slug>/publication.json`**, exclue de la sortie. Petit manifeste de données, avec quatre champs :

- `kind` : `demo` ou `portfolio` ; `coiffeur-mixte` vaut `demo`. Le type ne se déduit jamais du nom du dossier ou de la branche.
- `pages` : liste explicite des fichiers HTML à la racine du site ; actuellement les quatre pages plus `404.html`, déjà livrée. `index.html` et `404.html` sont obligatoires.
- `publicFiles` : liste de fichiers exacts, relatifs au site, à copier avec leurs chemins conservés. Pour Créa'Tif : `css/style.css`, `js/main.js`, `assets/favicon.svg`, les 24 WebP actuels et `assets/photos/NOTICE.md`. Cette liste est déjà versionnée dans le manifeste ; toute évolution reste explicite.
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

La version minimale ne traite que des pages HTML à la racine. Des pages imbriquées exigeraient une décision distincte sur les chemins et une vérification du contrat de sortie, pas une extension implicite du remplacement de chaînes ni une migration automatique.

**Page 404 :** conserver la page locale livrée, son lien vers `/` et ses éventuelles ressources relatives à l'origine, pour fonctionner également sur une URL inconnue imbriquée. La page porte `noindex, follow` dans tous les environnements. Le contrat exige une vraie réponse HTTP 404 avec cette page. Ne pas déduire sa prise en charge de la seule présence du fichier : Workers documente le mode `not_found_handling = "404-page"`, distinct des conventions Pages. Claude rapporte une 404 personnalisée ; QA doit confirmer le comportement effectif, sans modifier la configuration dans cette intervention. Aucun mode SPA à activer. [Workers — routage des assets et 404](https://developers.cloudflare.com/workers/static-assets/).

### 5.4 Hébergement effectif, publication manuelle et retour arrière

#### État déclaré au 8 septembre 2026

| Élément | Valeur consignée dans DIRECTION (`0154069`) |
| --- | --- |
| Produit / cible | Workers Static Assets / Worker `portfolio-vitrines-coiffeur-mixte` |
| URL | `https://portfolio-vitrines-coiffeur-mixte.costa-simon30.workers.dev/` |
| Origine de l'artefact | Assemblage local de la révision déclarée `619d931`, code validé `ad0aa8a` |
| Commande / runtime déclarés | `node scripts/assemble-site.mjs coiffeur-mixte --environment production` / Node 22.23.2 |
| Dossier remis | `sites/coiffeur-mixte/dist/`, 42 fichiers |
| Empreinte shell déclarée par Claude | `c6ddb471aa4a6337754b8dd886866c1b2446587cedec2b3582ae2943a573be9d` |
| Mise en ligne | Dépôt manuel de l'artefact ; accord explicite par version pour toute suite |
| Git / build hébergé / previews par branche | Aucun raccordement ni mécanisme actif déclaré |
| Version et déploiement Cloudflare | Identifiants non fournis ; à joindre si disponibles |

Ne pas confondre la révision source déclarée, l'empreinte du dossier et l'identifiant Cloudflare. Le HEAD du dépôt peut avancer sans que le site change. Le compte rendu de publication n'est pas une preuve que chaque fichier servi correspond au commit déclaré ; la traçabilité et la recette hébergée complètent cette déclaration.

Workers sert ici des fichiers statiques, sans backend applicatif demandé. Aucun champ de build Pages, variable distante Node, preset ou filtre Git n'est à configurer. Les quotas Pages (cinq projets par dépôt, builds mensuels, etc.) **ne s'appliquent pas à ce mode de dépôt manuel Workers** ; cette note ne les convertit pas en quotas Workers et ne promet pas de gratuité permanente. Le choix actuel n'impose pas Workers aux futurs sites. [Workers — Static Assets](https://developers.cloudflare.com/workers/static-assets/).

#### Préparer puis déposer une version — procédure, non exécutée ici

1. **Identifier le candidat**, sans supposer que `main` doit être publié : relever le hash complet avec `git rev-parse HEAD` et vérifier `git status --short`. En présence de modifications locales, ne pas les effacer ni les attribuer au commit ; préparer une copie propre de la révision choisie dans un dossier dédié. Les scripts, `.node-version`, le manifeste, les sources et `shared/` doivent provenir de cette même révision.
2. **Vérifier et assembler localement**, depuis la racine de cette copie, avec la version de `.node-version` :

   ```text
   node --version
   node scripts/verif-assemblage.mjs
   node scripts/assemble-site.mjs coiffeur-mixte --environment production
   ```

   Exiger un code 0 à chaque étape, contrôler le mode effectif, puis appliquer les contrôles locaux du § 5.6. La suite isolée ne remplace pas le contrôle du dossier effectivement remis. Pour la référence actuelle, l'inventaire attendu est de 42 fichiers ; toute évolution ultérieure doit être expliquée par son manifeste. Ne pas exécuter deux assemblages concurrents vers le même `dist/`.
3. **Figer le candidat contrôlé** : conserver une copie exacte de l'artefact et de son inventaire d'empreintes hors du dépôt et hors du `dist/` nettoyable, dans un emplacement de sauvegarde connu de Simon. Ne pas modifier l'artefact pour y ajouter une fiche de version ou un nouveau fichier public. Distinguer cette sauvegarde d'un dossier temporaire susceptible de disparaître. Conserver au minimum l'artefact en ligne et le précédent connu, tant qu'ils peuvent servir de retour arrière.
4. **Obtenir l'accord explicite de Simon**, en présentant le hash source complet, l'empreinte de l'artefact, la cible Workers, les changements, les contrôles et les réserves connues. L'accord porte sur cet artefact précis. Toute reconstruction produisant d'autres octets ou toute correction après accord impose une nouvelle validation avant publication.
5. **Après cet accord seulement**, utiliser le flux manuel du Worker existant dans le tableau de bord, sans créer de projet ni connecter Git. Remettre uniquement le contenu de l'artefact contrôlé : `index.html`, `_headers` et `robots.txt` doivent se retrouver à la racine publiée, avec `assets/`, `css/`, `js/` et `shared/` à leurs places. Ni le dossier parent du site, ni le dépôt, ni la sauvegarde/fiche de version ne sont à déposer. Vérifier l'inventaire présenté avant l'action finale de publication. Si l'interface exige un autre mécanisme ou des réglages non prévus, arrêter et demander l'arbitrage, sans basculer vers Git, Wrangler ou Pages de sa propre initiative.
6. **Consigner le résultat** : date et fuseau, opérateur, URL, hash source, empreinte et méthode, version Node, commande, résultats locaux, identifiants de version et de déploiement Cloudflare s'ils sont accessibles, version précédente et accord de Simon. Conserver ce relevé non secret dans le handoff de publication, puis ses éléments utiles dans le suivi DIRECTION par l'agent compétent. Les accès, adresses de connexion, secrets et codes de secours restent dans la fiche privée hors dépôt.
7. **Passer la version hébergée à QA** (§ 5.6). Des contrôles de fumée réussis par l'implémenteur ne constituent pas le verdict QA. Une anomalie n'autorise pas une correction distante ou une republication automatique.

Pour rendre les empreintes reproductibles, conserver l'inventaire complet des chemins relatifs triés et des SHA-256 de chaque fichier, ainsi que la commande et le format exacts de calcul de tout agrégat. L'empreinte shell déclarée ci-dessus n'est **pas directement comparable** à l'agrégat du Reviewer `61baa3bee04b5a01a478f29523b052453ed26c0ebec90a64dd1da0e9f72838c4` (dictionnaire JSON trié des chemins vers leurs SHA-256). Ne pas requalifier l'une en l'autre ni inventer une méthode absente du handoff ; en cas de doute, comparer les empreintes individuelles. Les identifiants Cloudflare manquants restent une limite de traçabilité explicite, pas une raison de republier pour les recréer.

#### Retour à une version connue — uniquement sur nouvel accord

1. Identifier précisément le problème, la version active et la cible de retour à partir du handoff et des preuves QA. Choisir une version réellement connue, pas simplement « le commit précédent ». L'état de référence actuel est validé localement ; sa recette hébergée reste distincte.
2. Présenter à Simon la version cible, ses réserves et la méthode de retour ; attendre son accord explicite. Un rollback est lui aussi une mise en production.
3. Si la version cible est identifiée et encore proposée par Cloudflare, utiliser après accord **le Worker existant → Deployments → version cible → Rollback**. Cette opération crée un nouveau déploiement actif de la version choisie ; relever son identifiant. Sa disponibilité dépend de l'historique et des contraintes Workers, pas des mécanismes Pages. Ne pas modifier les routes, domaines ou ressources associées pour contourner un refus. [Workers — procédure et limites du rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).
4. Si cette voie est indisponible, utiliser la sauvegarde intacte de l'artefact connu, vérifier ses empreintes, puis la déposer manuellement sur le même Worker selon la procédure ci-dessus. À défaut de sauvegarde, extraire le **commit complet connu** dans une copie de travail séparée, avec ses scripts, manifeste, ressources et version Node ; réassembler et comparer aux empreintes conservées avant de demander l'accord de dépôt. Une comparaison impossible ou différente doit être signalée : ce n'est plus un retour à l'identique démontré. Ne pas reconstruire un ancien HTML avec le `shared/` courant.
5. Consigner le lien entre ancien déploiement, cible restaurée et nouveau déploiement ; vérifier les ressources, indexation, redirections, 404 et l'anomalie motivant le retour sur l'URL réelle. Ne pas réécrire l'historique Git, faire de `reset --hard`, supprimer le Worker ou reconstruire le portfolio pour un retour de publication.

Le nettoyage de l'assembleur reste limité au `dist/` ciblé et ses validations préalables sont conservées. **PUB-A1 (préservation atomique de l'ancienne sortie pendant le build) reste facultatif et différé** : ne pas présenter `dist/` comme une sauvegarde garantie après interruption ou erreur d'écriture. Le dépôt distant manuel et la sauvegarde hors sortie séparent préparation locale et version en ligne, sans modifier l'assembleur.

#### Proposition historique Pages + Git — alternative non activée

La proposition du 7 septembre prévoyait un projet Pages par site, branche `main`, racine de build à la racine du dépôt, aucun preset, commande `node scripts/assemble-site.mjs <slug>`, sortie `sites/<slug>/dist`, Node fixé par `.node-version` et `PUBLICATION_ENV` séparé entre Production et Preview. Ces réglages sont archivés ici comme **alternative**, pas comme consigne applicable au Worker actuel. [Pages — configuration de build](https://developers.cloudflare.com/pages/configuration/build-configuration/).

Les anciens filtres Pages incluaient `sites/coiffeur-mixte/*`, `shared/design-system/*`, `scripts/assemble-site.mjs`, `.node-version` et excluaient `sites/coiffeur-mixte/dist/*`, `docs/*`, `Claude outputs/*`. Ils ne sont pas installés. La limite de cinq projets Pages reliés au même dépôt, portfolio compris, concernait cette proposition ; elle n'est pas un seuil de croissance du Worker manuel actuel. Avant toute adoption future, revalider limites, filtres et contrôle humain de production. [Pages — filtres](https://developers.cloudflare.com/pages/configuration/build-watch-paths/), [Pages — monorepos](https://developers.cloudflare.com/pages/configuration/monorepos/).

Aujourd'hui, **aucun push ne déclenche de publication**, documentaire ou non. Les changements dans un site, ses dépendances `shared/`, son manifeste ou l'assembleur déterminent les candidats à tester/reconstruire localement, pas une autorisation de les mettre en ligne. Une notice Markdown publiée est une dépendance, contrairement à un rapport `docs/` ; ne pas les confondre. Une modification de la suite de tests peut nécessiter un rejeu sans changement d'artefact.

Ajouter un site garde les conventions `sites/<slug>/`, manifeste local, brief et sortie isolée. Le portfolio existant utilise `kind=portfolio` ; La Tablée utilisera `kind=demo`. Simon arbitre le produit d'hébergement de chaque nouvelle publication et autorise chaque version ; ni création automatique d'un Worker, ni obligation de Pages, ni changement d'URL des sites existants. Si une automatisation est réexaminée au deuxième site, séparer tests/builds et déploiement avec validation humaine. Connecter Workers à Git serait une autre décision technique : cela ne créerait pas un projet Pages et ne rendrait pas ses réglages applicables.

### 5.5 Indexation par site, environnement et ressource

L'assembleur calcule une politique à partir de `kind` et du mode effectif ; il ne copie jamais un `_headers` global commun aux sites. Dans chaque HTML de sortie, ajouter une seule balise `<meta name="robots" content="…">` dans le `<head>`, ou remplacer la balise standard existante. Refuser une structure ambiguë (plusieurs balises ou consignes contradictoires spécifiques à un robot) pour correction explicite des sources. Cette substitution limitée ne transforme pas l'assembleur en moteur HTML.

| Site / mode effectif | Balise robots des pages ordinaires | Contrat d'en-tête HTTP |
| --- | --- | --- |
| Démo / production | `noindex, follow` | `X-Robots-Tag: noindex, follow` pour `/*` |
| Démo / preview ou local par défaut | `noindex, follow` | Même règle globale |
| Portfolio / preview ou local par défaut | `noindex, follow` | Même règle globale |
| Portfolio / production, après validation | `index, follow` | Aucune règle globale `noindex` ; exceptions 404 et notices uniquement |

Pour tous les sites, `robots.txt` à la racine de la sortie contient `User-agent: *` puis `Allow: /`, sur deux lignes. Pas de `Disallow: /` ni de directive `noindex` dans ce fichier. Google doit pouvoir explorer les pages pour lire leur interdiction d'indexation ; `noindex` ne protège pas l'accès et n'efface pas instantanément un résultat existant. [Google — noindex et exploration](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

Le script écrit les en-têtes dans **`dist/_headers`**, conservé à la racine lors du dépôt manuel. Workers Static Assets prend en charge ce fichier pour les réponses d'assets ; il ne le sert pas comme ressource publique. Ces règles ne couvriraient pas automatiquement les réponses produites par un code Worker applicatif, non demandé ici. Leur présence locale ne remplace pas la vérification des réponses hébergées. [Workers — en-têtes des assets](https://developers.cloudflare.com/workers/static-assets/headers/).

Pour une démo ou un artefact local `preview`, le bloc global conservé est :

```text
/*
  X-Robots-Tag: noindex, follow
```

**Notice de crédits :** conserver le lien et les octets de `assets/photos/NOTICE.md`. Elle reste publiquement consultable mais non indexable, même servie séparément. Conserver le bloc à son chemin exact avec `Content-Type: text/plain; charset=utf-8` ; hors règle globale, y ajouter aussi `X-Robots-Tag: noindex, follow`. Appliquer la même convention aux notices/licences textuelles explicitement incluses, notamment `/shared/design-system/fonts/NOTICE.md`. Il n'y a pas de conversion Markdown vers HTML, de renommage du lien ou de réécriture des crédits. Une balise meta dans les quatre pages ne s'appliquerait pas à ces ressources non HTML. [Workers — fichier _headers](https://developers.cloudflare.com/workers/static-assets/headers/), [Google — en-tête pour les ressources non HTML](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

Pour le portfolio en production, les pages ordinaires doivent effectivement rester indexables : ne pas tenter d'annuler une règle globale `noindex` par une seconde règle `index`. Générer un fichier sans cette règle globale, avec seulement les exceptions nécessaires. Les balises et en-têtes ne doivent pas se contredire.

**Prévisualisations :** aucune preview par branche active n'est déclarée pour Créa'Tif. L'adresse actuelle `workers.dev` est son URL publique de production, pas une preview du seul fait de son suffixe. Le `noindex, follow` global de la démo s'applique indépendamment du nom d'hôte ; toute URL technique effectivement disponible doit être identifiée et contrôlée par QA, sans en activer une pour les tests. Une preview inexistante est « non applicable », jamais « validée ».

**Arbitrage du 18 septembre 2026 (réserve 2 de `docs/PUBLICATION-portfolio.md`, dépôt n° 1) : la règle héritée du gabarit Pages n'est pas adaptée au format Workers, elle est retirée du `_headers` généré, sans remplacement.** Le format documenté pour cibler un hôte `workers.dev` depuis `_headers` est un hôte absolu à placeholders, par exemple `https://:version.:subdomain.workers.dev/*` [Workers — empêcher l'indexation des URL `workers.dev`](https://developers.cloudflare.com/workers/static-assets/headers/#prevent-your-workersdev-urls-showing-in-search-results). Un placeholder de host matche tout caractère sauf le point : une telle règle couvrirait aussi bien une éventuelle URL de version que l'hôte de production du Worker lui-même, puisque celui-ci a la même forme `<nom-du-worker>.<sous-domaine-du-compte>.workers.dev`. L'écrire pour le portfolio rendrait donc sa page d'accueil non indexable en production, à l'encontre du contrat de la ligne « Portfolio / production, après validation » ci-dessus ; pour une démo, elle serait redondante avec le `noindex, follow` global déjà appliqué à tout l'hôte, versions comprises. La règle héritée de Pages est donc retirée par l'assembleur pour tous les sites, sans être convertie au format Workers.

La non-indexation des URL de préversion du Worker (*Preview URLs*, format `<préfixe-de-version-ou-alias>-<nom-du-worker>.<sous-domaine>.workers.dev`, activées par défaut dès que `workers.dev` l'est [Workers — Preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/)) repose donc ailleurs, selon le site. Pour une démo, le `noindex, follow` global déjà en place couvre toute URL par laquelle elle est atteinte, préversions comprises. Pour le portfolio en production — seul site dont les pages ordinaires doivent rester indexables, donc seul cas où une préversion indexée serait réellement gênante —, aucune règle `_headers` ne peut viser sa seule préversion sans reproduire le défaut ci-dessus : les Preview URLs sont un mécanisme d'hôte, pas une correspondance de chemin. **Décision : désactiver le réglage « Preview URLs » du Worker qui sert le portfolio (tableau de bord Cloudflare, Settings → Domains & Routes) avant toute publication indexable du portfolio.** Ce réglage est externe au dépôt et n'est pas exécuté par la présente mission ; consigner sa vérification dans le prochain journal de publication du portfolio. Les démos n'ont pas besoin de cette désactivation, leur `noindex` global suffisant déjà à couvrir leurs éventuelles préversions.

**Sitemaps et URL alternatives :** aucun sitemap pour les démos `noindex`, ni pour les previews. Aucun domaine fictif ni canonique inventée dans l'artefact actuel. Le sitemap et les canoniques du portfolio seront préparés lorsque son contenu et son origine de production définitive seront validés ; ne pas mettre les URL de démos non indexables dans ce sitemap. Au raccordement d'un domaine personnalisé, choisir une origine publique de référence, rediriger les URL de plateforme correspondantes vers elle en conservant chemin et paramètres, puis actualiser les canoniques et sitemap du portfolio. Les previews conservent leur non-indexation. Ces réglages futurs n'exigent pas de réorganiser les sources.

**Arbitrage du 18 septembre 2026 (réserve 3 de `docs/PUBLICATION-portfolio.md`, dépôt n° 1) : l'absence de `X-Robots-Tag` sur la réponse 404 réelle est acceptée en l'état, sans correction de l'assembleur.** Une règle `_headers` s'applique selon le chemin de la requête entrante, pas selon le statut de la réponse ni selon l'asset effectivement servi. Workers Static Assets réécrit en interne une requête sans correspondance vers `404.html` après évaluation de `_headers` [Workers — page 404 personnalisée](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/#custom-404-pages) : une règle écrite sur `/404.html` ne matche donc jamais la requête à l'origine d'une 404 réelle, dont le chemin est par nature arbitraire et non prévisible. Seule une règle globale `/*` couvrirait toute 404 sans distinction de chemin — déjà le cas pour une démo, mais impossible pour le portfolio en production sans reproduire le défaut de la réserve 2 : elle rendrait aussi ses pages ordinaires non indexables. Il n'existe donc pas de règle `_headers` qui protège spécifiquement une 404 sans contredire par ailleurs l'indexabilité exigée des pages ordinaires du portfolio ; ce n'est pas une lacune de l'assembleur à corriger, mais une limite du mécanisme de correspondance par chemin lui-même, qui ne distingue pas les réponses par code de statut.

Cette absence reste sans effet pratique. Google n'indexe pas le contenu d'une URL répondant en `4xx`, et retire de son index une URL déjà indexée qui se met à répondre en `4xx` [Google — effet des codes HTTP sur l'indexation](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes) : le vrai statut 404 déjà exigé par le contrat (§ 5.3) porte donc lui-même la non-indexation, indépendamment de tout en-tête. La balise `<meta name="robots" content="noindex, follow">` de la page 404, déjà écrite par l'assembleur et vérifiée servie dans le dépôt n° 1, est une garantie supplémentaire, pas la seule ligne de défense. **Décision : ne pas chercher à faire couvrir la réponse 404 par `_headers` ; si une règle `/404.html` s'y trouve, la retirer plutôt que de la garder comme un signal de protection qu'elle n'assure pas.** Aucun changement d'assembleur n'est demandé sur ce point.

### 5.6 Vérifications et frontière de recette

**Référence locale déjà auditée :** le rapport `docs/CODE-REVIEW-coiffeur-mixte.md`, commit `9d6bac7`, clôt PUB-05 et PUB-08 sur `ad0aa8a` ; les autres constats restent clos et PUB-A1 différé. Le Reviewer rapporte 89 contrôles réussis sous Node 22.23.2 sur volume macOS insensible à la casse, 42 fichiers identiques entre les sorties comparées et 35 ressources copiées octet pour octet. Conserver ces garanties (confinement, exclusions/collisions, chemins, indexation et propagation des échecs), sans en faire une certification de tout HTML/CSS ni une recette Workers. Aucun de ces essais n'est rejoué par cette mise à jour documentaire.

**Contrôles locaux à conserver pour préparer un prochain candidat :**

1. Assembler Créa'Tif en `production` puis en `preview` dans le cadre des vérifications ; vérifier sa non-indexation dans les deux sorties. La suite `node scripts/verif-assemblage.mjs` couvre les politiques portfolio sur des fixtures isolées, le repli local et le garde-fou de branche Pages, sans créer de preview hébergée. Pour le candidat à déposer, terminer par l'assemblage explicite `--environment production` et relever son résultat effectif (§ 5.4).
2. Assembler deux fois le même site avec le même mode et comparer les fichiers produits. Vérifier que seules les sorties générées changent et qu'un autre site ou dossier source n'est jamais nettoyé. Tester un slug invalide et une entrée manquante : échec explicite.
3. Comparer l'inventaire publié au manifeste et aux fichiers générés attendus. Aucune capture, configuration, autre site ou source interne. Vérifier les empreintes des médias, fontes et notices copiés ; la réserve documentaire existante est conservée.
4. Servir uniquement `sites/coiffeur-mixte/dist/` comme racine HTTP locale, par exemple avec `ruby -run -e httpd sites/coiffeur-mixte/dist -p 8765` depuis la racine du dépôt. Ne pas servir le dépôt pour ce contrôle : cela masquerait des dépendances sortantes.
5. Vérifier les quatre accès directs, navigation, ancre Contact, favicon, notice, CSS, quatre fontes et les 24 variantes photo (`src`, `srcset`, URL CSS). Aucune dépendance locale hors artefact ; aucune erreur JavaScript ou ressource manquante. Vérifier le rendu ciblé à 375 et 1440 px, et une fois sans JavaScript. Pas de nouvelle revue artistique générale.
6. Lire les metas, `robots.txt` et `_headers` générés, et vérifier la présence de `404.html`. Un simple serveur local ne reproduit ni l'interprétation de `_headers`, ni le routage/redirections/404 de Workers Static Assets : ce contrôle ne prouve pas le comportement HTTP hébergé.

La validation locale acquise n'est pas rouverte par le changement de documentation. Les prochains rejeux vérifieront les candidats concernés, sans relancer une revue générale de l'assembleur ou PUB-A1 pour ce seul besoin.

**Recette QA hébergée autorisée par `0154069`, sans attendre cette note :** relever date, URL, révision source annoncée et identifiants Cloudflare accessibles ; signaler toute liaison non démontrée entre source et publication. Vérifier HTTPS, redirections `.html` et variantes avec/sans slash, accès directs/rechargements et ancre Contact sans boucle ; un 307 n'est pas en soi un défaut. Contrôler CSS/polices/photos et MIME, notices avec `X-Robots-Tag`, robots et metas réellement servis. Confirmer une vraie 404 simple et imbriquée avec retour fonctionnel, et l'absence de contenu interne sur `/docs/`, `/publication.json`, les configurations et un chemin d'un autre site.

QA contrôle les quatre pages à 320/375/768/1440 px, menu, clavier/focus/lien d'évitement, zoom 200 %, contact et crédits, photos et débordements, cache froid et erreurs réseau/console ; distinguer mesures de laboratoire et données réelles indisponibles. Les URL versionnées ou previews ne sont testées que si elles existent et sont accessibles sans changement de réglage. QA consigne ses preuves et limites dans son rapport, sans correction ni republication. La mise en avant auprès de prospects reste soumise à cette recette ; les contrôles de fumée déclarés par Claude ne la remplacent pas. L'absence de données dans l'artefact ne rend pas privé le dépôt GitHub public. P06 et la sélection artistique ne sont pas rouverts.

### 5.7 Deuxième vitrine, réexamen d'Eleventy et non-régression

**Décision : pas d'Eleventy ni de refonte de l'assembleur pour La Tablée V1.** Le déclencheur « deuxième site » a été honoré par la comparaison du § 1 : la duplication substantielle du shell n'est avérée qu'à l'intérieur de Créa'Tif ; le portfolio ne partage pas son shell, et celui de la brasserie reste à concevoir. Un outil de templates ajouterait aujourd'hui une dépendance et une chaîne de build à raccorder au manifeste pour trois pages courtes, tout en exposant deux artefacts déjà publiés à une conversion sans bénéfice démontré. L'assembleur actuel sait copier les pages HTML plates et les ressources explicites d'une nouvelle démo sans changement de code. Il ne faut donc ni convertir Créa'Tif ou le portfolio, ni étendre son remplacement ciblé de chemins pour créer artificiellement une réutilisation.

**Contrat de Claude pour la nouvelle démo :** utiliser un slug enfant direct `la-tablee-des-forges` ; garder trois HTML plats et `404.html`, CSS/JS éventuel et médias dans ce site ; créer un manifeste `kind: demo` listant exactement `pages` et `publicFiles`. `sharedFiles` peut être vide ; aucun fichier de `shared/design-system/` n'est repris par défaut. Si une ressource réellement commune est proposée, documenter les deux consommateurs, les chemins en source **et en sortie**, les effets sur les sites publiés et faire arbitrer avant modification. Les polices et notices locales sont listées explicitement. Garder les chemins de ressources résolvables depuis l'artefact assemblé, sans dépendance à `../../shared/` non prise en charge. Ne pas stocker de données privées, d'offres réelles ou de configuration de réservation ; le menu fictif reste du contenu statique local.

**Critères vérifiables avant tout candidat de publication :** la suite `node scripts/verif-assemblage.mjs` passe ; `node scripts/assemble-site.mjs la-tablee-des-forges --environment production` produit uniquement `sites/la-tablee-des-forges/dist/` ; son inventaire correspond à son manifeste plus `robots.txt` et `_headers`, sans `docs/`, autres sites, fichiers sources ou dépendances hors sortie. Comparer deux assemblages identiques pour leur déterminisme. Servir `dist/` seul : vérifier trois accès directs, liens/CTA/retour, menu sans JavaScript, 404 présente, polices/images/notices sans 404 réseau, titres et descriptions distincts, lien d'évitement, clavier/focus, lisibilité à 320 et 375 px, absence de débordement, et tailles/poids des médias justifiés. Contrôler dans les HTML et `_headers` le `noindex, follow` de la démo et dans `robots.txt` l'exploration autorisée ; les notices doivent rester créditées et non indexables. QA vérifiera sur une URL hébergée **seulement après accord de Simon et publication par le rôle compétent** les réponses HTTP, 404 réelle, en-têtes, ressources, clavier et petits écrans. La présence d'une sortie locale ne vaut pas recette hébergée.

**Non-régression des deux sites en ligne :** avant l'ajout, relever le commit de base et produire l'inventaire SHA-256 de chaque sortie de `coiffeur-mixte` et `portfolio` depuis ce même état source. Après ajout de la nouvelle démo, réassembler isolément ces deux sites depuis la nouvelle révision et comparer chaque inventaire à cette base, dans les mêmes conditions ; les fichiers `publication.json`, sources et URL de ces sites ne changent pas. Si une différence inattendue apparaît, la traiter avant tout candidat de dépôt. Les empreintes de dossiers faites par des méthodes différentes ne sont pas directement comparables (§ 5.4). Aucun push ne republie un Worker. La Tablée n'a pas d'URL ou d'hébergement choisi par cette architecture ; tout dépôt, même initial, exige l'accord explicite de Simon sur une révision et un artefact précis.

Si le déclencheur du § 3 survient, instruire un lot distinct : démontrer les éditions dupliquées, comparer HTML conservé et partials locales, fixer les entrées/sorties et l'ordre de compilation, puis exiger des sorties inchangées ou des écarts expliqués pour les deux sites publiés. Eleventy n'est alors adopté qu'après validation de ce contrat. Ne pas conserver deux chaînes concurrentes de génération HTML ni faire dépendre la décision d'une connexion Git ou d'un réglage Cloudflare. Le maintien de P06 et sa réserve documentaire sont inchangés.

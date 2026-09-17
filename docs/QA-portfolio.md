# QA / Audit — portfolio

## Verdict — 17 septembre 2026

**Avis favorable, avec réserves mineures, sur le périmètre effectivement testé : la sortie assemblée servie en local.** Aucun défaut bloquant ou majeur constaté sur le fonctionnel, le responsive, l'accessibilité au clavier, la structure SEO et le poids des ressources. Trois anomalies mineures sont ouvertes (PORT-01, PORT-02, PORT-03), aucune ne remet en cause l'usage de la page dans son état actuel.

**Ce verdict ne porte sur aucun hébergement réel : le site n'est pas déployé à ce jour, conformément à `docs/DIRECTION.md`, et la mise en ligne reste de toute façon bloquée tant que Simon n'a pas fourni les mentions légales.** Les contrôles propres à un hébergement réel (redirections HTTP → HTTPS, vrais en-têtes serveur, vraie page 404 servie par l'hébergeur, fichier `_headers` réellement interprété, en-têtes `X-Robots-Tag`) sont **hors périmètre pour cette passe** — non silencieusement ignorés, voir la section dédiée plus bas. Cet audit ne rejuge ni l'esthétique, ni le contenu (déjà validés dans `docs/UX-REVIEW-portfolio.md`), ni la réserve P06, ni l'absence de mentions légales, ni l'absence d'hébergement/domaine — points déjà actés dans `docs/DIRECTION.md` et non rouverts ici.

## Identification du commit audité

- **Dépôt :** [costasimon30-ux/portfolio-vitrines](https://github.com/costasimon30-ux/portfolio-vitrines) (public).
- **Commit audité :** `10e112b7fc826fae698ff114210ca1918846d3e8` — *« site(portfolio): grille des prestations à deux colonnes à tous les paliers »*.
- **Site :** `sites/portfolio/` (`kind: "portfolio"`, confirmé dans `sites/portfolio/publication.json`).
- **Aucune URL hébergée à ce jour.** Vérifié en lisant `docs/DIRECTION.md` (section « Page portfolio ») : aucun accord d'hébergement ou de domaine n'est acté pour ce site.
- Lectures obligatoires effectuées avant l'audit, depuis les URL `raw` de `main` : `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/AGENTS.md`, `docs/BRIEFS-AGENTS.md` § 4, `docs/DIRECTION.md` § « Page portfolio », `docs/QA-coiffeur-mixte.md` (méthode de référence).

## Méthode et périmètre de la sortie testée

Dépôt cloné et checkout du commit précis :

```text
git clone https://github.com/costasimon30-ux/portfolio-vitrines.git
git checkout 10e112b7fc826fae698ff114210ca1918846d3e8
```

Assemblage exécuté depuis la racine du dépôt, sous **Node 22.22.2** :

```text
$ node scripts/assemble-site.mjs portfolio --environment production
Runtime         : Node 22.22.2
Site            : portfolio (portfolio)
Mode effectif   : production — source : --environment
Indexation      : index, follow (404 : noindex, follow)
Sortie          : sites/portfolio/dist
Fichiers        : 11
Poids total     : 65.8 Kio
Liens réécrits  : 0
Notices typées  : assets/fonts/NOTICE.md
```

**Écart de version constaté et documenté :** le dépôt fixe `.node-version` à `22.23.2` ; le runtime disponible dans cette session est `22.22.2`. La suite de contrôle interne du dépôt, `scripts/verif-assemblage.mjs`, refuse de s'exécuter sur cet écart de version et l'indique elle-même explicitement :

```text
$ node scripts/verif-assemblage.mjs portfolio
PRÉREQUIS NON SATISFAIT : la suite doit être rejouée sur la version figée (22.23.2),
or elle s'exécute sous 22.22.2.
Réussis : 0   Échecs : 0
```

Aucun gestionnaire de version Node (`nvm`/`fnm`) n'était disponible dans cet environnement pour corriger l'écart. Un contrôle croisé a été relancé avec le drapeau `--runtime-alternatif` prévu par l'outil pour ce cas — **résultat que l'outil lui-même qualifie de non probant**, reporté ici pour mémoire, pas comme preuve de conformité :

```text
$ node scripts/verif-assemblage.mjs portfolio --runtime-alternatif
Réussis : 89   Échecs : 0
```

89 contrôles portant sur le mécanisme de l'assembleur (confinement des chemins, exclusions de manifeste, liens symboliques, balises robots, intégrité du dépôt de travail) passent sous ce runtime alternatif, sans en faire une validation formelle au sens du dépôt.

Serveur statique local lancé directement sur `sites/portfolio/dist/` (`python3 -m http.server`), sans aucune configuration d'hébergeur (pas de règles `_headers`, pas de redirections, pas de vraie page 404 interprétée par le serveur — voir section « Ce qui n'a pas été vérifié »). Navigateur : **Chromium 1194 (bundle Playwright 1.63.0)**, piloté en mode headed, un contexte isolé par scénario. Dates des mesures : **17 septembre 2026, 19:30–19:40 Europe/Paris (17:30–17:40 UTC)**, passage unique.

## Contrôles fonctionnels

### Chargement, console et réseau

Page chargée à 1440 × 900, `waitUntil: networkidle` : **statut 200**, `<title>` « Simon COSTA — Développeur front-end indépendant », `lang="fr"`, **0 message console, 0 requête en échec ou en 4xx/5xx**. Le site ne charge aucun script JavaScript (aucun `<script>` dans `index.html` ni `404.html`) : l'intégralité de l'interaction (ancre de contact, `mailto:`, lien externe) repose sur du HTML/CSS pur, ce qui exclut par construction toute erreur JS en exécution normale.

### Liens et cible du CTA

- Lien du bloc Réalisations vers Créa'Tif : `href="https://portfolio-vitrines-coiffeur-mixte.costa-simon30.workers.dev/"`, texte « Voir la démo », lu directement dans le DOM rendu. **La joignabilité réelle de cette URL externe n'a pas pu être vérifiée depuis cet environnement** (accès réseau sortant bloqué par la politique de sandbox de cette session — `curl` renvoie `connect_rejected`) ; voir « Ce qui n'a pas été vérifié ».
- CTA principal du hero : `href="#contact"`, ancre interne fonctionnelle (vérifié par clic réel, voir plus bas).
- Contact : `href="mailto:costa.simon30@outlook.com"`, adresse identique au texte affiché à côté du bouton.
- Aucun lien mort, aucun `href="#"` orphelin, aucun doublon d'identifiant HTML (`id`) constaté sur `index.html` (11 `id` uniques).

### Page 404

`404.html` distincte, avec son propre `<title>` (« Page introuvable — Simon COSTA »), `<h1>Page introuvable</h1>`, `meta name="robots" content="noindex, follow"`, lien de retour fonctionnel vers `/`. Testée par navigation directe sur la sortie locale : rendu correct, focus clavier opérant (skip-link → `main`).

**Limite explicite :** ceci vérifie le contenu du fichier `404.html`, pas le comportement réel d'un hébergeur face à une URL inconnue (routage vers ce fichier, code HTTP 404 effectivement renvoyé). Un serveur statique basique ne route pas automatiquement vers `404.html` sans configuration ; ce point relève des contrôles d'hébergement hors périmètre.

## Contrôles responsive

Mesures prises par lecture directe du DOM rendu (`getComputedStyle`) et captures d'écran, à chaque largeur, sur la sortie assemblée locale.

| Largeur | Colonnes grille « Ce que je fais » | Disposition hero | Débordement horizontal |
| --- | --- | --- | --- |
| 320 px | 1 | empilée | aucun |
| 375 px | 1 | empilée | aucun |
| 700 px | 1 | empilée | aucun |
| 767 px | 1 | empilée | aucun |
| 768 px | 2 | empilée | aucun |
| 1023 px | 2 | empilée | aucun |
| 1024 px | 2 | deux colonnes (`501.594px 410.406px`) | aucun |
| 1440 px | 2 | deux colonnes (`598.391px 489.609px`) | aucun |

`document.documentElement.scrollWidth === window.innerWidth` vérifié à chaque largeur testée (320, 375, 700, 768, 1440 px) : **aucun débordement horizontal constaté**. Cibles tactiles du CTA à 375 px : boutons mesurés à **48 px de hauteur** (min-height, pas hauteur fixe — confirmé en doublant `font-size` du document, voir plus bas), au-dessus du seuil de 44 px recommandé.

Captures plein écran prises et examinées visuellement à 320, 700, 768 et 1440 px : mise en page cohérente, aucun chevauchement de texte, carte Créa'Tif et grille de prestations bien formées à chaque palier, boîte « Espace réservé » du pied de page visible avec sa bordure en tirets à toutes les largeurs.

### Zoom 200 % (approximation) et texte agrandi

Comme documenté dans `docs/QA-coiffeur-mixte.md`, l'outil de cette session ne permet pas un vrai réglage de zoom navigateur : deux approximations distinctes ont été utilisées, chacune identifiée comme telle.

1. **Fenêtre réduite de moitié avec `deviceScaleFactor: 2`** (720 × 450, contre une largeur de référence de 1440 px) : aucun débordement horizontal (`scrollWidth === innerWidth === 720`), boîte « Espace réservé » toujours visible.
2. **Texte agrandi à 200 % par `font-size` du document** (méthode alternative, également une approximation, pas un vrai zoom navigateur) : à 1440 px, aucun débordement horizontal après doublement de la taille de police, et les boutons `.btn` passent de 48 px à **65,59 px de hauteur** — confirmation directe que la hauteur est bien `min-height` et non une hauteur fixe, conforme à la direction artistique.

Aucun de ces deux protocoles n'équivaut à un vrai zoom Chrome à 200 % tel que documenté dans `docs/QA-coiffeur-mixte.md` (réglage réel de l'application, pas une émulation) ; ils sont rapportés comme approximations, pas comme équivalents.

## Contrôles d'accessibilité

### Structure de titres

Hiérarchie relevée par lecture du DOM :

```text
H1 Simon COSTA
  H2 À propos
  H2 Réalisations
    H3 Créa'Tif — concept de salon de coiffure mixte
  H2 Ce que je fais
    H3 Site vitrine
    H3 Refonte de pages
    H3 Application web
    H3 Mise en ligne
  H2 Discutons de votre projet
```

**Un seul H1, un H2 par bloc de contenu (À propos, Réalisations, Ce que je fais, Contact — ce dernier titré « Discutons de votre projet »), un H3 par sous-entrée, aucun niveau sauté.** Conforme au critère de hiérarchie de `docs/DIRECTION.md`. Sur `404.html`, un seul H1 (« Page introuvable »), pas de H2 — normal pour une page d'erreur d'une seule section.

### Lien d'évitement et focus clavier (interaction réelle, pas simulée)

Testé par `page.keyboard.press('Tab')` puis `page.keyboard.press('Enter')` (vraies touches envoyées au navigateur, pas une manipulation du DOM) :

- Premier `Tab` : focus sur le lien « Aller au contenu principal » (`class="skip-link"`).
- `Enter` sur ce lien : **`document.activeElement === document.getElementById('main')`** vérifié programmatiquement — le focus réel se déplace bien sur `<main id="main" tabindex="-1">`, pas seulement l'ancre d'URL.

Séquence de tabulation complète relevée sur la page (8 appuis `Tab` successifs) : skip-link → CTA hero (`#contact`) → « Voir la démo » → « M'écrire par e-mail » (`mailto:`) → « Retour en haut de page » (`#main`) → `BODY` (fin de page, cycle) → retour au skip-link. **5 éléments interactifs au total, tous dotés d'un contour de focus visible** (`outline-width: 3px`, `outline-style: solid`) mesuré à chaque arrêt — le focus n'est jamais supprimé, y compris sur le lien du pied de page, conformément à la direction artistique.

### Contrastes (recalcul indépendant)

Les couleurs déclarées dans `sites/portfolio/css/style.css` ont été extraites du DOM rendu (`getComputedStyle` sur les variables CSS, valeurs réellement appliquées, pas seulement lues dans le fichier source) puis les ratios de contraste WCAG recalculés indépendamment (luminance relative sRGB) :

| Paire | Ratio recalculé | Ratio annoncé dans le CSS |
| --- | --- | --- |
| encre `#14181C` / papier `#F6F7F9` | 16,64:1 | 16,64:1 |
| encre / papier alterné `#EEF0F3` | 15,63:1 | 15,63:1 |
| atténué `#52606B` / papier | 6,04:1 | 6,04:1 |
| atténué / papier alterné | 5,67:1 | 5,67:1 |
| accent `#2451E0` / papier | 5,89:1 | 5,89:1 |
| accent / papier alterné | 5,53:1 | 5,53:1 |
| accent foncé `#1B3BA8` / papier | 8,76:1 | 8,76:1 |
| blanc / accent | 6,31:1 | 6,31:1 |
| blanc / accent foncé | 9,38:1 | 9,39:1 (arrondi différent, valeur identique) |

**Les neuf ratios recalculés correspondent exactement à ceux annoncés dans les commentaires du CSS**, tous au-dessus du seuil AA (4,5:1 texte courant, 3:1 grand texte/UI) avec marge. Méthode : formule de luminance relative du WCAG 2.x, script Python indépendant, sans dépendance au fichier CSS commenté.

### Usage de la couleur d'accent

Recherche exhaustive des usages de `--color-accent` dans `style.css` : `.skip-link` (fond, élément caché hors focus), `a` (couleur de texte des liens), `.btn--primary` (fond du CTA). **Aucun usage en aplat de fond de bloc large** — conforme à la règle de la direction artistique réservant l'accent au CTA, aux liens et au focus (à l'exception documentée du motif décoratif SVG, tracé en `#2451E0` à faible opacité, hors CSS).

### Mouvement réduit

Contexte navigateur avec `reducedMotion: 'reduce'` : `getComputedStyle(document.documentElement).scrollBehavior` renvoie **`auto`** (au lieu de `smooth` par défaut) — la règle `@media (prefers-reduced-motion: reduce)` du CSS est bien appliquée et vérifiée à l'exécution, pas seulement lue dans le fichier source.

### Images et alternatives textuelles

**Aucune balise `<img>` sur la page** (vérifié par sélection DOM) : la page n'utilise que des motifs `<svg>` décoratifs, portés par des conteneurs `aria-hidden="true"` (`.hero__motif`, `.carte-projet__visuel`) — masqués aux technologies d'assistance, sans information portée par l'image. Ce point recoupe directement le critère d'acceptation n° 4 de `docs/DIRECTION.md` : **aucune image issue de `sites/coiffeur-mixte/assets/photos/` ne peut apparaître sur la page, puisqu'aucune balise `<img>` n'existe du tout.**

### Ce qui n'a pas été testé en accessibilité

Aucune annonce vocale par lecteur d'écran (VoiceOver, NVDA) n'a été vérifiée : seul l'arbre DOM et le focus programmatique ont été inspectés, pas le rendu vocal réel. Aucune certification WCAG/RGAA formelle n'est délivrée par cet audit.

## Contrôles SEO

- `index.html` : `<title>` unique et descriptif, `<meta name="description">` renseignée, `<html lang="fr">`, un favicon SVG propre au portfolio (`assets/favicon.svg`, distinct de celui des démos — confirmé par lecture du fichier : palette encre/accent du portfolio, aucun élément visuel de Créa'Tif).
- `<meta name="robots" content="index, follow">` sur `index.html`, `noindex, follow` sur `404.html` — cohérent avec `docs/DIRECTION.md` (« Portfolio professionnel final : indexable après validation et publication »), dans le mode `--environment production` explicitement demandé pour cet audit.
- `robots.txt` généré : `User-agent: *` / `Allow: /`, sans `Disallow` ni directive de non-indexation globale — cohérent avec un portfolio destiné à l'indexation, à la différence des démos.
- Pas de `sitemap.xml` (404 constaté) — cohérent avec la consigne de `docs/DIRECTION.md` de ne générer aucun sitemap avec un domaine encore inconnu.
- **Aucune balise Open Graph (`og:*`) ni lien `<link rel="canonical">` constaté sur `index.html`.** Ce n'est pas un manquement à un critère d'acceptation de `docs/DIRECTION.md` (qui n'en exige pas), mais c'est une lacune vérifiable pour le partage sur réseaux sociaux et la déduplication d'URL avant une mise en avant publique — reportée en anomalie mineure (PORT-03) plutôt que passée sous silence.

## Contrôles de performance (mesures locales, un seul passage)

**Conditions exactes :** cache navigateur désactivé via le protocole Chrome DevTools (`Network.setCacheDisabled`), contexte de navigation neuf, CPU et réseau **non bridés** (pas de simulation 3G/4G ni de limitation CPU), un seul passage par mesure, servi par un serveur statique Python local sans compression ni cache HTTP (voir limites ci-dessous). **Ce n'est ni un score Lighthouse, ni une mesure de terrain (Core Web Vitals réels), ni un INP.**

| Ressource | Poids transféré (octets, local, sans compression) |
| --- | --- |
| `index.html` | 8 034 (taille de la réponse de navigation) |
| `css/fonts.css` | 1 386 |
| `css/style.css` | 12 836 |
| `assets/fonts/manrope/manrope-600.woff2` | 14 472 |
| `assets/fonts/manrope/manrope-800.woff2` | 13 948 |
| `assets/fonts/manrope/manrope-400.woff2` | 14 408 |
| **Total mesuré (chargement complet, cache froid)** | **65 084 octets (~63,6 Kio)** |

Poids annoncé par l'assembleur : **65,8 Kio pour 11 fichiers** — cohérent avec la mesure réseau indépendante (la différence tient à ce que l'assembleur compte aussi `404.html`, `_headers`, `robots.txt` et la notice de polices, non chargés lors d'une visite de la page d'accueil).

**Site sans JavaScript du tout** (aucun `<script>` dans `index.html` ni `404.html`) : `domContentLoadedEventEnd` à 18,3 ms et `loadEventEnd` à 26,6 ms sur cette machine, cache froid, réseau local — des valeurs qui n'ont de sens que comme indicateur de légèreté relative (5 ressources, aucune image, aucun script), pas comme prédiction de temps de chargement réel sur un réseau mobile ou un hébergement distant.

Le fichier `css/style.css` (12 836 octets) n'est pas minifié : il conserve les commentaires de documentation de la direction artistique. Sur un total de ~65 Kio sans aucune image, l'impact reste marginal, et une compression Brotli/gzip côté hébergeur (non testée ici, hors périmètre local) réduirait sensiblement ce poids sur un texte aussi répétitif. Non traité comme anomalie : c'est un choix de lisibilité du code documenté, pas un défaut de performance mesurable à ce poids total.

## Anomalies ouvertes

### PORT-01 — Mineur — Incohérence interne à `docs/DIRECTION.md` sur le palier d'entrée en 2 colonnes de la grille « Ce que je fais »

**Reproduction :** dans `docs/DIRECTION.md` § « Page portfolio » → « Direction artistique » → « Comportement responsive », le texte indique *« 641–1023px : […] grille « Ce que je fais » en 2 colonnes […] »*. Plus haut, dans la même sous-section, § « Composition et rythme des blocs », le même document indique *« Pour les quatre prestations actuelles : deux colonnes fixes à partir de 768px (soit 2×2, aucune ligne incomplète) »*. Ces deux passages du même document se contredisent sur la largeur exacte d'entrée en 2 colonnes (641 px contre 768 px).

**Constat sur le code :** l'implémentation suit la seconde formulation (768 px), confirmé par mesure directe sur la sortie assemblée : à **767 px**, `getComputedStyle` renvoie une seule colonne (`719px`) ; à **768 px**, deux colonnes (`348px 348px`). Le commit audité lui-même (`10e112b`) documente ce choix : son message et son commentaire CSS citent explicitement « deux colonnes à partir de 768px » et une revue UX (`docs/UX-REVIEW-portfolio.md` § 2.1) comme motif.

**Impact :** aucun défaut visuel constaté (aucun débordement, aucune ligne incomplète, quatre prestations bien réparties 2×2 à partir de 768 px) — l'implémentation est cohérente avec au moins l'une des deux formulations et avec la revue UX citée. Le problème est documentaire, pas fonctionnel : deux lectures possibles du même document produiraient deux attentes différentes pour la plage 641–767 px.

**Recommandation :** ce n'est pas à QA de trancher lequel des deux paliers est le bon — remonter au Chef de projet pour faire corriger l'un des deux passages de `docs/DIRECTION.md` afin qu'ils s'accordent.

**État : ouvert ; non bloquant, à clarifier côté direction produit avant qu'une prochaine implémentation ne s'appuie sur la formulation contredite.**

### PORT-02 — Mineur — Convention de chemins différente entre `index.html` (relatifs) et `404.html` (absolus)

**Reproduction :** lecture comparée du code source des deux fichiers de la sortie assemblée. `index.html` référence ses ressources en chemins relatifs (`assets/favicon.svg`, `css/fonts.css`, `css/style.css`). `404.html` référence les mêmes ressources en chemins absolus à la racine (`/assets/favicon.svg`, `/css/fonts.css`, `/css/style.css`).

**Impact :** aucun dysfonctionnement constaté tant que le site est servi à la racine de son domaine (cas prévu par `docs/DIRECTION.md`, aucun sous-chemin envisagé à ce jour) — vérifié : les deux pages chargent correctement leurs ressources sur le serveur local. C'est une incohérence de convention entre les deux fichiers de sortie, pas un lien cassé observé.

**Recommandation :** harmoniser les deux fichiers sur une même convention (l'un ou l'autre), en particulier si un jour le site devait être servi depuis un sous-chemin plutôt qu'une racine de domaine.

**État : ouvert ; non bloquant dans la configuration de déploiement actuellement prévue.**

### PORT-03 — Mineur — Absence de balises Open Graph et de lien canonique

**Reproduction :** inspection du `<head>` de `index.html` assemblé : aucune balise `<meta property="og:*">`, aucun `<link rel="canonical">`.

**Impact :** un partage du lien du portfolio sur un réseau social ou une messagerie n'affichera pas d'aperçu enrichi (titre, description, image) au-delà de ce que le réseau déduit lui-même de la page. Sans domaine ni URL définitive à ce jour, l'absence de canonique n'a pas d'effet immédiat, mais deviendra pertinente dès la mise en ligne.

**Recommandation :** ajouter `og:title`, `og:description`, `og:type`, `og:url` (une fois l'URL connue) et un `<link rel="canonical">` avant la mise en avant publique. Ce n'est pas un critère d'acceptation actuel de `docs/DIRECTION.md` — remonter au Chef de projet pour décision plutôt que le traiter comme un défaut acté.

**État : ouvert ; non bloquant, amélioration recommandée avant publication.**

## Ce qui n'a pas été vérifié, ou seulement partiellement

Cette section est obligatoire au standard de preuve du dépôt (`docs/BRIEFS-AGENTS.md` § 4) et liste les limites réelles de ce protocole, pas une liste vide de convention.

- **Aucun hébergement réel, donc aucun contrôle HTTP réel** : pas de vraies redirections, pas de vrai code 404 renvoyé par un serveur de production, pas de vrais en-têtes (`X-Robots-Tag`, `Cache-Control`, compression Brotli/gzip), pas de vérification que `_headers` est effectivement interprété par un hébergeur (ce fichier existe dans la sortie assemblée mais n'a aucun effet sur un simple serveur statique Python — vérifié : il est servi comme un fichier texte ordinaire, `Content-Type: application/octet-stream`, plutôt qu'interprété comme des règles). **Ce n'est pas ignoré silencieusement : c'est explicitement hors périmètre de cette passe**, le site n'étant pas hébergé à ce jour.
- **Joignabilité réelle du lien externe vers la démo Créa'Tif non vérifiée** : le réseau sortant de cet environnement de test refuse la connexion vers `portfolio-vitrines-coiffeur-mixte.costa-simon30.workers.dev` (politique de sandbox, `connect_rejected`). Le lien est syntaxiquement correct et correspond à l'URL documentée dans l'historique de `docs/DIRECTION.md`, mais son état HTTP actuel (200, redirection, panne) n'a pas pu être observé depuis cette session.
- **Aucun lecteur d'écran réel testé** (VoiceOver, NVDA, JAWS) : seuls l'arbre DOM, les attributs ARIA et le focus programmatique (`document.activeElement`) ont été vérifiés. Le rendu vocal effectif n'est pas certifié.
- **Un seul navigateur testé** : Chromium (bundle Playwright), en mode headed, sur l'environnement Linux de cette session. Safari/iOS, Firefox et les appareils physiques n'ont pas été testés.
- **Zoom navigateur réel non disponible dans cet environnement** : les deux approximations utilisées (fenêtre réduite à `deviceScaleFactor` doublé ; `font-size` du document doublée) sont explicitement documentées comme des approximations, pas comme un vrai réglage de zoom à 200 % tel que pratiqué dans `docs/QA-coiffeur-mixte.md`.
- **Mesures de performance non comparables à un outil de terrain** : cache froid navigateur uniquement (pas de cache CDN à purger puisqu'aucun CDN), CPU/réseau non bridés, un seul passage, servies par un serveur statique local sans compression — pas un score Lighthouse, pas une mesure INP, pas une série statistique.
- **`scripts/verif-assemblage.mjs` non rejoué dans les conditions attendues par le dépôt** (Node 22.23.2 figé) faute de gestionnaire de version disponible dans cet environnement ; seul le contrôle croisé `--runtime-alternatif`, explicitement qualifié de non probant par l'outil lui-même, a pu être obtenu (89/89, sous Node 22.22.2).
- **Aucune certification WCAG/RGAA formelle**, aucun audit exhaustif de tous les contrastes possibles (seuls les neuf couples de couleurs déclarés dans les jetons CSS ont été recalculés), aucune revue de sécurité de compte ou d'hébergement (aucun n'existe à ce jour).
- **Contenu et direction artistique non rejugés** : conformément au périmètre de cet audit, l'esthétique et les choix de contenu déjà validés dans `docs/UX-REVIEW-portfolio.md` ne sont pas réexaminés ici. Les vérifications ci-dessus portent sur la conformité technique mesurable (contrastes recalculés, hiérarchie de titres, absence d'images interdites, etc.), pas sur un nouveau jugement esthétique.

## Récapitulatif de clôture

| Point | État |
| --- | --- |
| Fonctionnel (liens, CTA, console, page 404) | **Vérifié sur la sortie locale — aucun défaut bloquant** |
| Responsive (320 à 1440 px, paliers 768/1024) | **Vérifié — aucun débordement, paliers hero/prestations mesurés** |
| Accessibilité clavier (skip-link, focus, tabulation) | **Vérifié par interaction réelle — conforme** |
| Contrastes (9 couples de couleurs) | **Recalculés indépendamment — conformes aux valeurs annoncées** |
| SEO de base (titre, description, robots, sitemap) | **Vérifié — conforme au mode production demandé** |
| Performance locale (poids, chargement, cache froid) | **Mesurée avec conditions explicites — site très léger (~65 Kio, 0 script)** |
| Contrôles d'hébergement réel | **Hors périmètre — non hébergé à ce jour, voir ci-dessus** |
| PORT-01 (incohérence documentaire du palier 641/768 px) | **Ouvert, non bloquant** |
| PORT-02 (chemins relatifs vs absolus 404.html) | **Ouvert, non bloquant** |
| PORT-03 (absence Open Graph / canonical) | **Ouvert, non bloquant, recommandé avant publication** |
| P06, mentions légales, absence d'hébergement/domaine | **Hérités, non rouverts** (déjà actés dans `docs/DIRECTION.md`) |

**Aucun code, configuration ou contenu n'a été modifié par cet audit.** Preuves de travail (scripts Playwright, captures d'écran, JSON de résultats) conservées hors dépôt, non versionnées, sous `/tmp/audit/tools/` de cette session — susceptibles de disparaître ; les constats déterminants sont consignés dans ce rapport.

---

Agent: claude-qa

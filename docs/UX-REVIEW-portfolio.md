# Revue UX — page portfolio (première implémentation)

**Date :** 17 septembre 2026 — **Agent :** claude-ui-ux.

**Commit audité :** `ac485e98405b7a7db9cd21409173200979744757` sur `main`. Livraison : « première implémentation de la page portfolio ».

**Référence :** [DIRECTION.md — Page portfolio — Direction artistique](DIRECTION.md), commit `516b143`, la sous-section que j'ai moi-même posée en amont.

**Méthode de lecture :** page servie en local par Simon depuis la sortie assemblée en production (`node scripts/assemble-site.mjs portfolio --environment production`, puis `python3 -m http.server 8000` depuis `sites/portfolio/dist`), ouverte dans le navigateur intégré (Chromium). Examinée aux largeurs 375×812 (mobile), 768×1024 (tablette) et 1280×900 (desktop, au-delà du palier ≥1024px), avec un test de non-troncature en zoom ×2 (limite précisée en section 6), un parcours clavier complet à la tabulation, une lecture des couleurs et polices réellement calculées par le navigateur, et une inspection des requêtes réseau. Simon m'a signalé que le serveur de fichiers statique ne reproduit ni `_headers`, ni un vrai statut 404, ni les redirections d'hébergement : je n'ai rien jugé sur ces points, qui relèvent d'une recette hébergée et non de cette revue.

## Verdict ciblé

**La page tient la direction artistique presque à la lettre : palette, typographie, hiérarchie de titres, focus, rythme et mesure de lecture sont conformes, vérifiés avec des valeurs mesurées et non des intentions. Deux défauts visuels reproductibles restent à corriger avant mise en avant — un dans le code (grille Réalisations), un dans ma propre direction (grille « Ce que je fais ») — plus un oubli isolé de mesure de lecture dans le pied de page. Aucun des trois ne remet en cause l'identité posée, et aucun ne nécessite un arbitrage de Simon.**

## 1. Corrections de code — pour l'implémenteur

### 1.1 Grille Réalisations : une carte seule dans une grille à deux colonnes

`sites/portfolio/css/style.css`, règle `.grille-projets { grid-template-columns: repeat(2, 1fr); }` à partir de 768px. Avec une seule entrée (Créa'Tif) dans `sites/portfolio/index.html`, la carte occupe la première colonne et la seconde reste vide sur toute la hauteur de la carte.

Constaté par capture d'écran à 768×1024 et à 1280×900 : le bloc Réalisations affiche un vide net à droite de la carte, du même ordre de grandeur que la carte elle-même. Ma direction demandait une structure « prête à accueillir une deuxième entrée sans refonte visuelle », pas un vide visible tant qu'il n'y a qu'une entrée — je n'avais volontairement pas imposé de nombre de colonnes fixe pour ce bloc précisément pour laisser cette marge de manœuvre. Une grille du type `repeat(auto-fill, minmax(280px, 1fr))`, ou une largeur maximale sur `.carte-projet` tant qu'il n'y a qu'un seul enfant, satisferait tout autant la contrainte de croissance sans refonte. Correction de code : elle ne change rien à la palette, à la typographie ni à la structure du contenu, et ne nécessite pas de revoir ma direction.

### 1.2 `.reserve` (mentions légales réservées) ne respecte pas la mesure de lecture

Mesuré dans le DOM rendu à 1280px de viewport : la boîte `.reserve` du pied de page fait 954px de large, sans `max-width`. Tous les autres blocs de texte courant en respectent une : `.prose`, `.section__intro`, `.hero__accroche` et `.socle` mesurent exactement 608px (`max-width: var(--mesure)`, soit 38rem), conformément à la règle de confort de lecture de ma direction. `.reserve` a simplement été oublié dans cette règle. Correction d'une ligne (`max-width: var(--mesure)` sur `.reserve`), sans conséquence sur le contenu du placeholder lui-même.

## 2. Défauts de ma propre direction — à corriger par moi, pas par l'implémenteur

### 2.1 Grille « Ce que je fais » : quatre prestations dans une grille à trois colonnes

Ma direction demandait explicitement « 768px (2 colonnes) puis 1024px (3 colonnes) » pour ce bloc, sans tenir compte du nombre réel d'entrées. Le Chef de projet a fixé quatre prestations. Quatre éléments dans trois colonnes laissent la quatrième carte seule sur une deuxième ligne, avec deux colonnes vides à sa droite — constaté par capture à 1280×900. L'implémenteur a suivi ma consigne à la lettre ; le résultat en trahit l'intention (un rythme de grille propre, sans orphelin). C'est un défaut de ma sous-section de `DIRECTION.md`, à corriger dans une prochaine mise à jour de la direction artistique (par exemple deux colonnes fixes quel que soit le nombre d'éléments, ou une grille `auto-fit`/`minmax` qui s'adapte au compte réel), pas quelque chose que l'implémenteur devait deviner à ma place.

### 2.2 Incohérence interne sur l'usage de l'accent

Ma sous-section « Palette » dit que l'accent bleu « n'apparaît que sur le CTA, les liens et les états de focus — jamais en fond de bloc large ». Ma sous-section « Traitement du hero », dans le même document, demande explicitement un motif décoratif « tracé dans `--color-accent` à faible opacité ». L'implémentation reprend ce motif (grille de points et trait) en `--color-accent` dans le hero et dans la carte Réalisations, ce qui est exactement ce que ma section Hero demandait — mais contredit littéralement ma règle de palette. Ce n'est pas un défaut d'implémentation : les deux usages du motif sont fidèles à mes propres instructions. C'est ma direction qui se contredit ; je le signale pour que la prochaine révision de `DIRECTION.md` clarifie la règle de palette (par exemple : « … jamais en fond de bloc large, à l'exception du motif géométrique du hero et de son réemploi »).

## 3. Ce qui tient la direction — avec preuves

- **Palette :** couleurs calculées du DOM identiques aux jetons posés — fond `#F6F7F9`, texte `#14181C`, bloc alterné `#EEF0F3`, CTA `#2451E0` sur blanc. Aucune couleur étrangère aux sept jetons posés observée sur la page.
- **Typographie :** Manrope auto-hébergée, trois graisses (400, 600, 800) toutes chargées avec succès (`document.fonts` → `loaded` pour les trois), aucune requête réseau externe (requêtes observées : uniquement vers `localhost:8000`, zéro appel à un CDN ou à Google Fonts). Conforme à la contrainte d'auto-hébergement.
- **Hiérarchie de titres :** un seul `h1` (« Simon COSTA »), un `h2` par bloc (À propos, Réalisations, Ce que je fais, Discutons de votre projet), des `h3` pour les sous-entrées (Créa'Tif, les quatre prestations). Aucun niveau sauté, vérifié par lecture directe du DOM.
- **Hero :** purement typographique avec motif géométrique en complément, jamais à la place du texte, exactement comme prescrit tant qu'aucune photo n'est fournie. Mobile : motif après le texte (vérifié à 375×812). Desktop (≥1024px) : deux colonnes, texte à gauche ; vérifié à 1280×900.
- **Boutons et CTA :** un seul style `.btn--primary` (fond accent, texte blanc) utilisé identiquement en haut de page (hero, ancre vers #contact) et en bas (« M'écrire par e-mail », mailto réel) ; aucun autre bouton ne rivalise visuellement. Le lien « Voir la démo » utilise le style de second plan (`.lien-discret`, soulignement, couleur encre) et ne concurrence pas le CTA.
- **Focus clavier :** parcours complet à la tabulation sur les cinq éléments interactifs de la page (lien d'évitement, CTA hero, « Voir la démo », CTA contact, « Retour en haut de page ») : chacun affiche un contour net de 3px en accent foncé, jamais supprimé. Confirmé par capture à chaque étape et lecture de `document.activeElement`.
- **Mesure de lecture :** 608px (38rem) mesurés exactement sur `.prose`, `.section__intro`, `.hero__accroche` et `.socle` — seule `.reserve` y échappe (voir 1.2).
- **Espace réservé (mentions légales) :** reste visiblement un espace réservé (encart à bordure pointillée, texte en gras « Espace réservé — »), conforme à l'exigence de ne jamais présenter un placeholder comme un contenu réel.
- **Page 404 :** cohérente avec l'identité (mêmes jetons, même style de bouton), pas de rupture visuelle.
- **Réduction de mouvement :** la règle `prefers-reduced-motion` est reprise ; le motif du hero est de toute façon statique.

## 4. Ce qui respecte la lettre de la direction sans que ce soit un défaut

Le CTA du haut de page (« Discutons de votre projet », ancre vers #contact) et celui du bas (« M'écrire par e-mail », mailto) utilisent des libellés différents pour la même action de fond. Le style visuel est strictement identique (même classe `.btn--primary`), donc le critère « un seul style de bouton primaire, répété en haut et en bas » est respecté à la lettre. Je ne le compte pas comme un défaut : le libellé du bas nomme l'action réelle plutôt que de répéter une formule d'accroche, ce qui me semble une bonne exécution — mais c'est une lecture, pas une mesure, donc je la place à part plutôt que dans les sections 1 ou 3.

## 5. Arbitrages à soumettre à Simon

**Aucun.** Je n'ai trouvé, dans ce que j'ai pu observer, aucun point qui nécessite une décision de Simon : les défauts identifiés se corrigent soit dans le code (section 1), soit dans ma propre sous-section de direction (section 2), sans rouvrir une décision de contenu ou de produit déjà actée.

## 6. Ce que je n'ai pas vérifié, ou seulement partiellement

- **Zoom 200 % réel :** je n'ai pas de commande de zoom navigateur dans mes outils. J'ai approximé avec un zoom CSS (`document.documentElement.style.zoom = 2`), qui grossit l'affichage sans réduire la largeur CSS effective utilisée par les media queries : ce n'est qu'un test de non-troncature du texte à l'agrandissement (concluant : aucun chevauchement ni troncature observé dans le hero), pas une vérification complète du reflow qu'un vrai zoom navigateur déclencherait. Les largeurs 375/768/1280 testées séparément couvrent une bonne partie de ce qu'un vrai zoom 200 % produirait en largeur effective, sans que ce soit une équivalence garantie.
- **États de survol (souris) :** le survol synthétique de mon outil de navigation n'a pas produit de changement visuellement net dans mes captures. Je n'ai donc confirmé les couleurs de survol (`:hover` → accent foncé) que par lecture du code source (`css/style.css`), pas par observation directe du rendu. Le mécanisme est cohérent avec le focus, que j'ai lui observé et confirmé.
- **Lecteurs d'écran :** pas de test avec un lecteur d'écran réel (VoiceOver, NVDA…) ; je me suis appuyé sur la structure du DOM (titres, `aria-hidden` sur les SVG décoratifs, lien d'évitement fonctionnel).
- **Autres navigateurs :** tout a été observé dans un seul moteur (Chromium, navigateur intégré). Pas de vérification Safari/Firefox.
- **Daltonisme :** pas de simulation de déficience de vision des couleurs ; je me suis appuyé sur les ratios de contraste calculés (posés dans ma direction, vérifiés par recalcul), qui restent valables indépendamment de la perception des teintes.
- **Serveur, en-têtes, vrai 404, redirections :** explicitement hors périmètre sur indication de Simon — `python3 -m http.server` ne reproduit pas `_headers` ni le comportement d'un hébergeur réel.
- **Contenu du placeholder (mentions légales) :** je n'ai pas jugé le texte du placeholder lui-même, seulement sa présentation visuelle (voir 1.2).

Agent: claude-ui-ux

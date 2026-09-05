# Code review — coiffeur-mixte

## Verdict

**Non validé en l'état.** Aucun P0 n'a été identifié dans ce site statique, mais plusieurs P1 empêchent de respecter le périmètre défini dans `docs/DIRECTION.md` et rendent le parcours mobile ou les contacts trompeurs.

Périmètre revu : `sites/coiffeur-mixte/` et `shared/design-system/tokens.css`.

## Constats

### P1 — Les coordonnées fictives déclenchent pourtant de vraies actions

**Fichier :** `sites/coiffeur-mixte/salon.html:96-106`.

**Impact :** le téléphone fictif est un lien `tel:` et l'e-mail fictif est un lien `mailto:` ; les deux CTA les réutilisent. Un visiteur peut donc ouvrir son application d'appel ou de messagerie vers des coordonnées qui ne représentent personne. C'est explicitement interdit par la source de vérité : `docs/DIRECTION.md:91` et `docs/DIRECTION.md:142` imposent que des coordonnées inconnues restent non cliquables.

**Recommandation :** afficher les informations de démonstration comme du texte non interactif. Ne créer des liens `tel:` et `mailto:` qu'après validation de coordonnées réelles.

### P1 — Sous 900 px, la navigation principale dépend entièrement de JavaScript

**Fichiers :** `sites/coiffeur-mixte/css/style.css:87-104`, `sites/coiffeur-mixte/js/main.js:4-28`, et les boutons de menu dans les quatre pages HTML, par exemple `index.html:20-24`.

**Impact :** sur mobile, `.site-nav` est en `display: none`; seul `main.js` peut l'afficher. Si le JavaScript ne charge pas, est bloqué, échoue ou est désactivé, la navigation principale disparaît totalement alors que le bouton reste inopérant. C'est une rupture d'accès au contenu, pas une simple dégradation visuelle.

**Recommandation :** faire fonctionner la navigation sans JavaScript par défaut, puis masquer/activer le comportement repliable seulement après ajout d'une classe `js` au document. Prévoir aussi un `noscript` utile si le menu compact est conservé.

### P1 — Les faux visuels sont exposés comme des photographies descriptives

**Fichiers :**

- `sites/coiffeur-mixte/css/style.css:134-142` — un unique dégradé générique est rendu pour tous les médias.
- `sites/coiffeur-mixte/index.html:49, 88, 94, 105, 122-137, 152-154`.
- `sites/coiffeur-mixte/coiffure.html:49, 55, 98-100`.
- `sites/coiffeur-mixte/barbier.html:49, 55, 98-100`.
- `sites/coiffeur-mixte/salon.html:45, 74, 102`.

**Impact :** ces éléments ont `role="img"` et des `aria-label` annonçant au lecteur d'écran des salons, équipes, réalisations, consultations ou rasages qui n'existent pas dans l'interface : il ne s'agit que du même dégradé CSS. Cela fournit une information factuellement fausse aux technologies d'assistance. Le code invente aussi des portraits d'équipe et des galeries de réalisations, alors que la direction demande de les masquer tant qu'aucun visuel réel n'est disponible (`docs/DIRECTION.md:89-93`).

**Recommandation :** traiter les compositions CSS purement décoratives comme telles (`aria-hidden="true"`, sans `role="img"` ni libellé). Ne décrire une image que si son contenu existe réellement. Retirer les portraits et galeries fictifs, puis implémenter les compositions distinctes prévues dans `docs/DIRECTION.md:78-91`.

### P1 — Le site ne correspond plus à la direction actuelle pour les univers Coiffure et Barbier

**Fichiers :** `sites/coiffeur-mixte/coiffure.html:38-111`, `sites/coiffeur-mixte/barbier.html:38-111`, `sites/coiffeur-mixte/css/style.css:170-210`.

**Impact :** les deux pages réutilisent presque exactement le même gabarit : hero, bloc éditorial, grille de quatre cartes, galerie de trois faux médias et CTA. Le brief courant demande au contraire des rythmes réellement différents : axes de conseil puis module éditorial pour Coiffure, liste éditoriale, étapes et encadré d'entretien pour Barbier (`docs/DIRECTION.md:95-135`). Les titres et textes de hero définis dans ce brief ne sont pas non plus intégrés. Le site ne peut pas être accepté contre sa source de vérité.

**Recommandation :** créer des structures HTML spécifiques à chaque univers, plutôt que d'habiller le même gabarit avec du texte différent. Utiliser les sections et contenus validés dans `DIRECTION.md`; garder seulement les primitives réellement communes (header, footer, boutons, conteneur).

### P2 — Le menu reste ouvert lors d'une navigation interne sur la page Salon

**Fichiers :** `sites/coiffeur-mixte/salon.html:30`, `sites/coiffeur-mixte/js/main.js:21-28`.

**Impact :** sur `salon.html`, le CTA du menu pointe vers `salon.html#contact`. Sur mobile, cette navigation ne recharge pas forcément le document ; aucun écouteur ne ferme alors `#primary-nav`. Le panneau de navigation reste ouvert au-dessus du contenu ciblé et force l'utilisateur à le refermer manuellement.

**Recommandation :** écouter les clics sur les liens de navigation et appeler `closeNav()` après une activation. Tester explicitement les liens d'ancre sur la page courante au clavier et au tactile.

### P2 — Le lien d'évitement ne déplace pas de manière fiable le focus clavier

**Fichiers :** les quatre pages, par exemple `sites/coiffeur-mixte/index.html:16, 36`; styles dans `shared/design-system/tokens.css:102-115`.

**Impact :** le lien « Aller au contenu principal » vise `<main id="main">`, qui n'est pas focusable. Selon le navigateur et la technologie d'assistance, la page peut défiler sans que le focus ne quitte le lien d'évitement. Cela amoindrit le bénéfice du mécanisme pour les utilisateurs clavier.

**Recommandation :** ajouter `tabindex="-1"` à chaque `<main id="main">` et vérifier au clavier que l'activation place bien le focus sur le contenu principal.

### P2 — Header et footer sont copiés dans chaque page

**Fichiers :** `index.html:17-34,169-185`, `coiffure.html:17-34,115-131`, `barbier.html:17-34,115-131`, `salon.html:17-34,113-129`.

**Impact :** la navigation, le bouton de menu, les libellés ARIA, les liens de footer et la note de démonstration existent en quatre copies. Toute évolution impose des modifications synchronisées et favorise les divergences (notamment `aria-current`, liens et contenu du footer).

**Recommandation :** introduire un mécanisme de génération statique ou de fragments HTML pour le shell commun. À défaut, documenter un test automatisé qui compare les éléments communs sur les quatre pages.

### P2 — Code mort : la grille utilitaire n'est utilisée nulle part

**Fichier :** `sites/coiffeur-mixte/css/style.css:6-17`.

**Impact :** `.grid` ajoute du CSS et des breakpoints sans qu'aucun fichier HTML ne l'emploie. Cela donne l'impression d'une infrastructure de grille disponible alors que les composants définissent chacun leur propre grille ; la maintenance devient plus ambiguë.

**Recommandation :** supprimer cette règle si elle n'est pas retenue, ou refactorer les layouts pour l'utiliser réellement avec une convention documentée.

### P2 — Dépendance non maîtrisée à Google Fonts sur chaque page

**Fichiers :** `index.html:9-11`, `coiffure.html:9-11`, `barbier.html:9-11`, `salon.html:9-11`.

**Impact :** l'affichage et une partie de la vie privée dépendent d'un tiers, sans solution locale de repli autre que les polices système. Quatre documents répètent la même configuration, ce qui rend un futur changement de fournisseur ou de politique de confidentialité plus coûteux.

**Recommandation :** auto-héberger les polices lorsque le site quitte le statut de démo, ou documenter explicitement cette dépendance et son impact. Centraliser au minimum l'en-tête via le mécanisme de templates recommandé.

## Contrôles effectués

- Lecture de `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/AGENTS.md` et `docs/DIRECTION.md`.
- Inspection des quatre pages, de `main.js`, de `style.css` et du design system partagé.
- Vérification des liens internes et des ressources locales déclarées.
- Vérification de l'absence d'usage de la classe `.grid`.

## Ordre de correction

1. Désactiver les actions `tel:` / `mailto:` fictives.
2. Rétablir une navigation mobile utilisable sans JavaScript et fermer le menu lors d'une navigation interne.
3. Corriger la sémantique des médias fictifs et supprimer le faux contenu non autorisé.
4. Mettre les pages Coiffure et Barbier en conformité avec `docs/DIRECTION.md`.
5. Réduire la duplication HTML et supprimer le CSS mort.

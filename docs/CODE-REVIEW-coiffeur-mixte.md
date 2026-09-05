# Code review — coiffeur-mixte (passe 2)

## Verdict

**À corriger avant validation finale.** Aucun P0 ou P1 actif n’a été identifié sur la révision `e2187ce`. Quatre P2 restent ouverts, tous liés à l’accessibilité ou à la robustesse du rendu mobile.

Périmètre : `sites/coiffeur-mixte/` et `shared/design-system/tokens.css`, après intégration des corrections de Claude. Les décisions documentées dans `docs/ARCHITECTURE.md` — duplication temporaire du shell pour ce premier site et auto-hébergement des polices avant publication — ne sont pas requalifiées comme anomalies dans cette passe.

## Constats

### P2 — Le lien d’évitement ne déplace pas le focus sur la page Salon

**Fichier :** `sites/coiffeur-mixte/salon.html:36`.

**Impact :** le lien « Aller au contenu principal » cible `#main`, mais l’élément cible ne possède pas `tabindex="-1"`, contrairement aux trois autres pages. L’URL et le défilement changent, mais le focus clavier peut rester sur le lien d’évitement selon le navigateur ou la technologie d’assistance. Le bénéfice du raccourci est donc incohérent entre les pages.

**Recommandation :** ajouter `tabindex="-1"` à `<main id="main">` dans `salon.html`, puis vérifier l’activation du lien d’évitement au clavier sur les quatre pages.

### P2 — Les trois étapes Barbier ne sont pas annoncées comme une séquence ordonnée

**Fichier :** `sites/coiffeur-mixte/barbier.html:84-100`.

**Impact :** les étapes sont construites avec des `div` et leurs chiffres sont masqués avec `aria-hidden="true"`. Un lecteur d’écran entend trois blocs indépendants (« Échanger », « Dessiner », « Entretenir »), sans information qu’il s’agit d’un parcours en trois étapes ni dans quel ordre il doit être lu. Cette perte de structure n’affecte pas le rendu visuel, mais elle réduit le sens porté par le contenu.

**Recommandation :** utiliser `<ol class="steps">` et des `<li class="step">`. Les numéros décoratifs peuvent alors rester masqués, car la liste expose déjà la position et le total. Adapter les sélecteurs CSS si nécessaire.

### P2 — Un titre de section de premier niveau est placé en `h3`

**Fichier :** `sites/coiffeur-mixte/barbier.html:105-112`.

**Impact :** « Entre deux visites » est le titre d’une section sœur de « Nos prestations » et « Le détail fait l’équilibre », tous deux en `h2`, mais il est balisé `h3`. La hiérarchie de titres devient incohérente pour la navigation par titres des lecteurs d’écran et pour les outils d’extraction de structure.

**Recommandation :** remplacer `<h3 id="visites-title">` par `<h2 id="visites-title">` et mettre à jour le sélecteur `.callout h3` en un sélecteur de composant qui ne dépend pas du niveau de titre, par exemple `.callout :is(h2, h3)` ou `.callout__title`.

### P2 — La classe qui active le menu repliable est ajoutée trop tard pour garantir l’absence de flash mobile

**Fichiers :** `sites/coiffeur-mixte/js/main.js:4-7`, scripts chargés en fin de document, par exemple `sites/coiffeur-mixte/index.html:152`; `sites/coiffeur-mixte/css/style.css:74-95`.

**Impact :** sans la classe `js`, la navigation mobile est volontairement développée ; une fois `main.js` exécuté, elle passe à `display: none`. Comme le script est placé après tout le contenu, un premier rendu peut afficher brièvement la navigation développée puis la retirer, ce qui produit un décalage de mise en page perceptible sur connexion ou appareil lent. Le commentaire « le plus tôt possible » ne correspond pas au point réel de chargement.

**Recommandation :** ajouter la classe dans un micro-script synchrone dans le `<head>`, avant les feuilles de style qui consomment `html.js`, et conserver `main.js` en bas de page pour les interactions. Si une politique CSP est ajoutée, autoriser ce script par nonce ou déplacer ce mécanisme dans une feuille de style ou une stratégie compatible CSP.

## Corrections confirmées depuis la première revue

- Les coordonnées de démonstration ne déclenchent plus d’appels ni d’e-mails.
- La navigation reste utilisable sans JavaScript ; le menu est refermé après activation d’un de ses liens.
- Les compositions CSS sont désormais décoratives pour les technologies d’assistance et les faux contenus (équipe, galerie) ont été retirés.
- Les pages Coiffure et Barbier ont maintenant des structures éditoriales distinctes conformément à `docs/DIRECTION.md`.
- Le code CSS mort relevé précédemment a été retiré.

## Contrôles effectués

- Lecture de `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/AGENTS.md`, `docs/DIRECTION.md` et `docs/ARCHITECTURE.md`.
- Inspection du diff de correction `e2187ce`, des quatre documents HTML, de `style.css`, de `main.js` et des tokens partagés.
- Vérification des liens internes, des ressources locales déclarées et de `git diff --check`.

## Ordre de correction

1. Rendre le lien d’évitement fiable sur Salon.
2. Restituer la structure ordonnée et la hiérarchie de titres de la page Barbier.
3. Éviter le décalage de navigation mobile au chargement.

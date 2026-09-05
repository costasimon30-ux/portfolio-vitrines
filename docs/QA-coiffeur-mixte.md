# QA / Audit — coiffeur-mixte

**Date :** 5 septembre 2026
**Révision auditée :** `3774de9` (`main`)
**Périmètre :** `sites/coiffeur-mixte/` et les styles partagés effectivement chargés.
**Référentiel :** `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/AGENTS.md` et `docs/DIRECTION.md`.

## Verdict

**Non validé pour la mise en avant définitive du portfolio.** Le socle est léger, les pages sont bien structurées, les liens et assets locaux sont résolus, et le correctif responsive livré après la revue UX supprime le débordement Contact constaté à 768 px. En revanche, quatre écarts majeurs restent incompatibles avec le brief : des coordonnées fictives déclenchent de vraies actions, la navigation mobile disparaît sans JavaScript, des contenus fictifs sont présentés comme réels aux technologies d’assistance, et les pages Coiffure/Barbier ne suivent pas la direction éditoriale validée.

## Méthode et limites

- Inspection des quatre documents HTML, de `css/style.css`, de `js/main.js` et de `shared/design-system/tokens.css`.
- Vérification des liens et ressources locales déclarés : aucun fichier référencé ne manque.
- Vérification du rendu actuel de `salon.html` à 768 px : pas de débordement horizontal après le passage des pistes de grille en `minmax(0, 1fr)`.
- Vérification des breakpoints déclarés : 600, 700, 768, 900 et 1024 px ; aucun élément métier ne dépend d’une hauteur de viewport fixe.
- Vérification statique des structures, libellés, focus, contraste, SEO et poids des ressources.

Les contrôles de déploiement (en-têtes HTTP, compression, cache, HTTPS, `robots.txt` et sitemap à la racine du futur hébergement) restent à faire lorsque l’URL finale sera connue.

## Anomalies

### QA-01 — Les coordonnées fictives ouvrent réellement le téléphone et l’e-mail

- **Priorité : majeur**
- **Emplacement :** `sites/coiffeur-mixte/salon.html:96-106`.
- **Étapes de reproduction :**
  1. Ouvrir la page « Le salon » puis le bloc « Informations pratiques & contact ».
  2. Activer le numéro, l’adresse e-mail, « Nous écrire » ou « Nous appeler ».
  3. Le navigateur ouvre une application de téléphone ou de messagerie malgré la mention « exemple ».
- **Impact utilisateur :** le site de démonstration simule un moyen de contact qui ne correspond à personne. Cela contredit explicitement le brief, crée une impasse et peut faire croire à un contact abouti.
- **Recommandation :** tant que les coordonnées ne sont pas réelles, les afficher comme du texte non interactif et remplacer les CTA par un contenu de portfolio non actionnable. N’ajouter `tel:` et `mailto:` qu’après validation des coordonnées réelles.

### QA-02 — La navigation mobile devient inaccessible si JavaScript ne s’exécute pas

- **Priorité : majeur**
- **Emplacement :** `sites/coiffeur-mixte/css/style.css:87-104`, `sites/coiffeur-mixte/js/main.js:4-50`.
- **Étapes de reproduction :**
  1. Ouvrir n’importe quelle page à une largeur inférieure à 900 px.
  2. Désactiver JavaScript, bloquer `main.js` ou simuler son échec de chargement.
  3. La navigation principale est en `display: none`; le bouton menu reste présent mais ne peut rien ouvrir.
- **Impact utilisateur :** perte complète d’accès aux autres pages sur mobile en cas de défaillance JavaScript. Ce n’est pas une dégradation progressive acceptable pour la navigation principale.
- **Recommandation :** rendre la navigation visible et utilisable par défaut, puis appliquer le comportement repliable uniquement après l’initialisation JavaScript (par exemple une classe `js` sur `html`). Prévoir un repli `noscript` si nécessaire.

### QA-03 — Les placeholders annoncent des personnes, réalisations et scènes inexistantes

- **Priorité : majeur**
- **Emplacement :** `index.html:49, 88, 94, 105, 122-154`, `coiffure.html:49, 55, 98-100`, `barbier.html:49, 55, 98-100`, `salon.html:45, 74, 102`, et `css/style.css:134-142`.
- **Étapes de reproduction :**
  1. Parcourir les pages avec un lecteur d’écran, ou inspecter les éléments `.media-placeholder`.
  2. Chaque même dégradé CSS est exposé avec `role="img"` et un `aria-label` décrivant un salon, une équipe, un portrait ou une réalisation.
  3. L’accueil affiche également une équipe et une galerie fictives, malgré l’absence de visuels ou de personnes réelles.
- **Impact utilisateur :** les technologies d’assistance reçoivent une information factuellement fausse. Le rendu donne aussi l’impression d’un portfolio inachevé et ne respecte pas la consigne de masquer portraits et galeries sans ressources authentiques.
- **Recommandation :** rendre les compositions CSS purement décoratives avec `aria-hidden="true"`, sans rôle image ni texte alternatif. Retirer les portraits et galeries fictifs. Implémenter, à leur place, les compositions éditoriales distinctes prévues dans `docs/DIRECTION.md`, sans prétendre représenter des personnes ou prestations réelles.

### QA-04 — Les pages Coiffure et Barbier ne sont pas conformes au cahier des charges actuel

- **Priorité : majeur**
- **Emplacement :** `sites/coiffeur-mixte/coiffure.html:38-111`, `sites/coiffeur-mixte/barbier.html:38-111`.
- **Étapes de reproduction :**
  1. Comparer les pages aux sections « Coiffure — expression, matière et conseil » et « Barbier — lignes, confort et entretien » de `docs/DIRECTION.md`.
  2. Constater le même gabarit sur les deux pages : hero, bloc éditorial, grille de quatre cartes, galerie, CTA.
  3. Constater que les textes de hero, les axes de conseil Coiffure, la liste éditoriale et les étapes Barbier validés dans le brief ne sont pas présents.
- **Impact utilisateur :** les deux univers manquent de singularité et le livrable ne correspond pas à la source de vérité produit/éditoriale du portfolio.
- **Recommandation :** conserver les primitives communes (en-tête, footer, boutons, conteneur), mais créer les rythmes et contenus spécifiés : axes de conseil, module couleur et grille de prestations pour Coiffure ; liste éditoriale, trois étapes et encadré entretien pour Barbier.

### QA-05 — Le menu mobile reste ouvert après le CTA ancré de la page Salon

- **Priorité : mineur**
- **Emplacement :** `sites/coiffeur-mixte/salon.html:30`, `sites/coiffeur-mixte/js/main.js:21-35`.
- **Étapes de reproduction :**
  1. À moins de 900 px, ouvrir le menu sur `salon.html`.
  2. Activer « Nous contacter ».
  3. Le lien vise `salon.html#contact`; il peut déplacer la page vers l’ancre sans rechargement et sans appeler `closeNav()`.
- **Impact utilisateur :** le panneau peut rester superposé au bloc Contact et forcer une action supplémentaire pour être fermé.
- **Recommandation :** fermer la navigation lorsqu’un lien du menu est activé, en particulier les ancres de la page courante. Vérifier ce comportement au clic, avec Entrée et avec la touche Espace lorsque pertinent.

### QA-06 — Le lien d’évitement ne déplace pas fiablement le focus dans le contenu

- **Priorité : mineur**
- **Emplacement :** les quatre liens `.skip-link`, par exemple `index.html:16`, et `main#main`, par exemple `index.html:36`.
- **Étapes de reproduction :**
  1. Utiliser Tab au chargement : le lien « Aller au contenu principal » est bien visible.
  2. L’activer puis poursuivre avec Tab.
  3. `main` n’est pas focusable : le défilement vers l’ancre peut avoir lieu sans que le focus quitte le lien d’évitement.
- **Impact utilisateur :** le mécanisme aide visuellement, mais ne garantit pas un parcours clavier cohérent ni le bénéfice attendu avec toutes les technologies d’assistance.
- **Recommandation :** ajouter `tabindex="-1"` aux éléments `main#main`, puis vérifier dans les navigateurs cibles que l’activation place le focus dans le contenu principal.

### QA-07 — L’indexabilité ne peut pas être finalisée avant configuration de déploiement

- **Priorité : mineur**
- **Emplacement :** configuration de déploiement absente du site autonome.
- **Étapes de reproduction :**
  1. Examiner les quatre documents : les titres, descriptions, `lang="fr"` et favicon sont présents et uniques.
  2. Constater l’absence de canonique, de `robots.txt`, de sitemap et d’URL publique connue.
  3. Les coordonnées étant fictives, aucune donnée structurée locale ne peut être publiée honnêtement.
- **Impact utilisateur :** pas de problème pour une démonstration locale ; lors d’un déploiement indépendant, les moteurs ne disposent pas des signaux de contrôle d’indexation et de canonicalisation.
- **Recommandation :** lors du choix de l’URL publique, ajouter un canonique par page, `robots.txt` et sitemap au bon niveau de déploiement. Ne pas générer de schéma `HairSalon`/`LocalBusiness` avant d’avoir des coordonnées réelles et autorisées.

### QA-08 — Les polices restent une dépendance tierce

- **Priorité : mineur**
- **Emplacement :** les quatre `<head>`, par exemple `index.html:9-11`.
- **Étapes de reproduction :**
  1. Charger une page avec l’inspection réseau.
  2. Le document effectue des requêtes vers Google Fonts et `fonts.gstatic.com`.
- **Impact utilisateur :** légère dépendance de performance et de confidentialité à un tiers ; le site reste lisible grâce aux fallbacks système.
- **Recommandation :** acceptable pour la démo actuelle. Avant une production commerciale, auto-héberger les fichiers de police, les subseter aux glyphes requis et définir une stratégie de cache.

### QA-09 — Une grille CSS non utilisée est embarquée

- **Priorité : mineur**
- **Emplacement :** `sites/coiffeur-mixte/css/style.css:6-17`.
- **Étapes de reproduction :**
  1. Rechercher la classe `.grid` dans les documents HTML du site.
  2. Constater qu’aucun élément ne l’emploie.
  3. Constater que ses trois définitions de breakpoints sont néanmoins chargées sur les quatre pages.
- **Impact utilisateur :** impact réseau négligeable aujourd’hui, mais le CSS mort rend les layouts plus ambigus et alourdit les futurs changements.
- **Recommandation :** supprimer cette règle si elle n’est pas retenue, ou l’utiliser effectivement comme primitive documentée de grille.

## Contrôles conformes

### Fonctionnel et navigation

- Les pages Accueil, Coiffure, Barbier et Le salon sont présentes.
- Tous les liens internes et assets locaux déclarés sont résolus.
- Aucun lien `#` factice, formulaire, compte, calendrier, réservation, paiement, bandeau cookies ou script analytics n’est présent.
- Le menu est construit avec un vrai bouton, porte `aria-expanded`/`aria-controls`, peut être fermé avec Échap et son libellé est mis à jour par JavaScript.

### Responsive

- À 768 px, le rendu actuel de la page Salon ne présente plus de défilement horizontal ; la régression relevée dans `docs/UX-REVIEW-coiffeur-mixte.md` est corrigée dans la révision auditée.
- Les layouts reposent sur des grilles fluides et se replient aux seuils 600, 700, 768, 900 et 1024 px.
- Les conteneurs sont plafonnés à 1200 px : le comportement est adapté aux grands écrans.

### Accessibilité

- Une seule balise `h1` est présente par page ; `header`, `nav`, `main` et `footer` sont employés.
- Les liens actifs emploient `aria-current="page"`.
- Les focus visibles sont définis, les boutons atteignent 48 × 48 px et `prefers-reduced-motion` est respecté.
- Après les corrections de la révision `102f871`, les usages de texte courant sur fond Sable utilisent Encre ; les combinaisons textuelles restantes atteignent le niveau AA minimal.

### SEO et performance

- Chaque page possède un titre, une méta-description et un favicon distinctement déclarés.
- Le sous-site pèse environ 52 Ko hors polices distantes ; il ne charge pas de photo lourde, bibliothèque JavaScript ni animation continue.
- Les préconnexions Google Fonts et les polices de repli sont correctement déclarées.

## Contre-vérification ciblée — 5 septembre 2026

**Révision contrôlée :** `e2187ce` (`main`). Cette passe vérifie uniquement les anomalies signalées dans le présent rapport, avec une attention particulière au mobile, au clavier et aux coordonnées fictives ; elle ne constitue pas un nouvel audit complet.

**Verdict de contre-vérification : non validé.** Les quatre corrections de fond sont en grande partie intégrées, mais la navigation de secours sans JavaScript reste inutilisable à 375 px. Cet écart majeur bloque encore la mise en avant définitive. Le lien d’évitement de la page Salon reste aussi incomplet.

| Anomalie initiale | État | Constat de contre-vérification |
| --- | --- | --- |
| QA-01 — Coordonnées fictives | Corrigé | Aucun lien `tel:` ou `mailto:` n’est présent. Téléphone et e-mail sont du texte, accompagnés de mentions explicites « exemple non actionnable » et d’un avertissement portfolio. |
| QA-03 — Médias fictifs | Corrigé | Les fausses photos, portraits et galerie ont disparu. Les quatre compositions CSS sont distinctes et marquées `aria-hidden="true"`, sans rôle image ni description de scène. |
| QA-04 — Direction Coiffure / Barbier | Corrigé | Les deux pages reprennent désormais les axes et rythmes éditoriaux demandés dans `docs/DIRECTION.md`. |
| QA-05 — Fermeture du menu sur ancre | Corrigé | Le gestionnaire de navigation appelle maintenant `closeNav()` lors de l’activation de tout lien, y compris `salon.html#contact`. |
| QA-06 — Lien d’évitement | Partiellement corrigé | `tabindex="-1"` est présent sur les `main` d’Accueil, Coiffure et Barbier, mais absent de `salon.html`. |
| QA-09 — CSS mort | Corrigé | Les règles `.grid`, `.team-grid` et `.gallery` signalées ne sont plus embarquées. |

### QA-02 — Le repli mobile sans JavaScript reste visuellement inutilisable

- **Priorité : majeur**
- **Emplacement :** `sites/coiffeur-mixte/css/style.css:14-19, 74-82`.
- **Étapes de reproduction :**
  1. Ouvrir `index.html` à 375 px de large avec JavaScript désactivé ou `main.js` bloqué.
  2. Constater que l’en-tête reste un conteneur flex sur une ligne alors que seule la liste de navigation passe en colonne.
  3. Le menu déborde horizontalement et n’est pas visible ni normalement atteignable dans le viewport mobile ; le hero et ses CTA débordent également.
- **Impact utilisateur :** si JavaScript échoue, la navigation principale ne fournit pas un parcours mobile exploitable. Le correctif de dégradation progressive est donc seulement partiel, malgré l’intention documentée dans le CSS.
- **Recommandation :** sous 900 px, organiser réellement l’en-tête sans JavaScript sur deux lignes (par exemple `flex-wrap: wrap` avec la navigation en `flex-basis: 100%`, ou une colonne), puis conserver le positionnement absolu uniquement sous `html.js`. Recontrôler à 320, 375 et 768 px sans JavaScript, puis à 375 px avec le menu JavaScript au clavier.

### QA-06 — La cible du lien d’évitement de la page Salon n’est pas focusable

- **Priorité : mineur**
- **Emplacement :** `sites/coiffeur-mixte/salon.html:36`.
- **Étapes de reproduction :**
  1. Ouvrir la page « Le salon » et utiliser Tab dès le chargement.
  2. Activer « Aller au contenu principal ».
  3. Le `main#main` ne porte pas `tabindex="-1"`, contrairement aux trois autres pages ; le focus n’est donc pas déplacé de manière fiable dans le contenu.
- **Impact utilisateur :** le parcours clavier reste incohérent sur une page du site.
- **Recommandation :** ajouter `tabindex="-1"` à `main#main` dans `salon.html`, puis vérifier le focus avec Tab et Entrée.

## Checklist avant mise en avant définitive

### Bloque la validation

- [x] Rendre les coordonnées fictives totalement non interactives.
- [ ] Assurer une navigation mobile disponible sans JavaScript, sans débordement à 320, 375 et 768 px.
- [x] Retirer les portraits, réalisations et descriptions d’images fictifs ; les remplacer par les compositions prévues par la direction, accessibles comme décoratives.
- [x] Mettre Coiffure et Barbier en conformité avec les structures et contenus validés dans `docs/DIRECTION.md`.

### À terminer avant publication web, sans bloquer une maquette interne

- [x] Fermer le menu après l’activation d’un lien, dont l’ancre Contact sur la page Salon.
- [ ] Rendre la cible du lien d’évitement focusable sur la page Salon.
- [ ] Configurer canonical, sitemap, `robots.txt`, cache et HTTPS quand le domaine de déploiement sera connu.
- [ ] Choisir entre maintien temporaire de Google Fonts et auto-hébergement avant une production commerciale.

### Acceptable pour un projet de portfolio

- [x] Site statique sans compte, réservation, formulaire de collecte ou bandeau cookies.
- [x] Coordonnées présentées comme fictives, à condition qu’elles cessent d’être actionnables.
- [x] Placeholders décoratifs temporaires, à condition qu’ils ne simulent ni personnes, ni réalisations, ni scènes réelles aux visiteurs ou aux technologies d’assistance.
- [x] Absence de données structurées locales tant qu’aucune information métier réelle n’est disponible.

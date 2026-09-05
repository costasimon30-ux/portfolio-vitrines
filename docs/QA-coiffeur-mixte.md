# QA / Audit — coiffeur-mixte

## Verdict actuel — 5 septembre 2026

**Corrections fonctionnelles validées en local ; validation finale encore réservée sur le chargement du menu.** Aucun défaut bloquant ou majeur n’est actif dans le périmètre contre-vérifié. Les 36 cas de navigation mobile passent, le lien d’évitement place réellement le focus sur les quatre pages, la structure Barbier est corrigée et les polices sont chargées localement. **Une anomalie mineure de la seconde Code Review reste ouverte : le menu développé apparaît avant de se replier lorsque `main.js` tarde à charger.** Le script bloque également l’apparition du contenu principal pendant cette attente.

**Commit contrôlé :** `5827a149ba926359971c9ac99c8b512415ba57dc` (`5827a14`, livraison de Claude sur `main`). `git pull --ff-only` effectué avant cette passe : dépôt à jour.

**Périmètre :** contre-vérification ciblée des anomalies de QA et de la seconde Code Review ; quatre pages de `sites/coiffeur-mixte/`, styles partagés et polices effectivement chargés. Ce verdict remplace les verdicts des passes précédentes, sans prétendre renouveler l’audit complet de toutes les catégories.

**Référentiel :** `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/AGENTS.md`, `docs/DIRECTION.md`, `docs/ARCHITECTURE.md` et `docs/CODE-REVIEW-coiffeur-mixte.md` (passe 2, publiée dans `dcdadb9`).

## État de chaque anomalie

Les priorités des anomalies corrigées rappellent leur gravité initiale. Les identifiants CR2 ci-dessous correspondent, dans l’ordre, aux quatre constats P2 de la seconde Code Review.

| Identifiant | Priorité | État actuel | Preuve / portée de la vérification |
| --- | --- | --- | --- |
| QA-01 — Coordonnées fictives actionnables | Majeur | Corrigé, correction conservée | Aucun lien `tel:` ou `mailto:` dans les quatre pages. Les coordonnées du Salon sont du texte, explicitement fictif et non actionnable. Le CTA conduit au bloc Contact. |
| QA-02 — Navigation mobile sans JavaScript | Majeur | Corrigé | Quatre pages × 320/375/768 px × JS actif/désactivé/`main.js` bloqué : navigation utilisable, liens dans le viewport et aucun débordement horizontal après chargement. |
| QA-03 — Médias et portraits fictifs | Majeur | Corrigé, correction conservée | Contrôle statique : compositions `.deco` décoratives avec `aria-hidden="true"`, absence des anciennes grilles de portraits et galeries. |
| QA-04 — Structures Coiffure / Barbier | Majeur | Corrigé, correction conservée | Contenus et ordre des sections comparés à la direction ; structure et titres Barbier vérifiés dans le DOM et l’arbre d’accessibilité Chromium. |
| QA-05 — Menu restant ouvert sur l’ancre Contact | Mineur | Corrigé | Activation par Entrée et au clic, y compris depuis Salon vers sa propre ancre : destination correcte et `aria-expanded="false"`. |
| QA-06 — Focus du lien d’évitement | Mineur | Corrigé | Dans les 36 cas, Tab → Entrée place `document.activeElement` sur `main#main` ; Tab suivant atteint un lien dans le contenu. |
| QA-07 — Indexabilité et configuration finale | Mineur | En attente du déploiement | URL, choix d’indexation et configuration de l’hébergeur non disponibles. Aucun résultat de production ne peut être déduit du serveur local. |
| QA-08 — Dépendance Google Fonts | Mineur | Corrigé localement ; livraison des assets à confirmer sur l’hébergeur | Les quatre WOFF2 locaux répondent 200 et sont chargés sur chaque page ; aucune requête tierce observée. Seuil obligatoire : **avant la première publication publique**, selon ARCHITECTURE. |
| QA-09 — Grille CSS inutilisée | Mineur | Corrigé, correction conservée | Contrôle statique : anciennes règles `.grid`, `.team-grid` et `.gallery` absentes. |
| CR2-01 — Focus Salon | Mineur (P2) | Corrigé | Même vérification que QA-06 ; `salon.html:35` possède désormais `tabindex="-1"`. |
| CR2-02 — Étapes Barbier non ordonnées | Mineur (P2) | Corrigé dans le DOM et Chromium | `barbier.html:83-99` : `ol.steps` et trois `li`, dans l’ordre Échanger → Dessiner → Entretenir ; l’arbre d’accessibilité expose une liste et trois éléments. |
| CR2-03 — « Entre deux visites » en h3 | Mineur (P2) | Corrigé | `barbier.html:107` : `h2`, également exposé au niveau 2 dans l’arbre d’accessibilité. |
| CR2-04 — Flash du menu au chargement | Mineur (P2) | Partiellement corrigé, toujours ouvert | Script déplacé après l’en-tête, mais un retard réseau de 1,5 s reproduit le menu développé puis replié aux trois largeurs. Détails ci-dessous. |

## Vérifications réalisées

### Méthode

Tests indépendants avec Playwright et **Google Chrome 152.0.7977.77, moteur Chromium**, en mode headless, sur un serveur HTTP local temporaire servant la racine du dépôt. Contextes neufs, viewport explicitement fixé en pixels CSS, hauteur de 900 px et cache HTTP désactivé par le serveur de test.

Trois scénarios distincts ont été exécutés : JavaScript actif, désactivation JavaScript au niveau du contexte navigateur, puis JavaScript actif avec interception et rejet de la seule requête `**/js/main.js` (`blockedbyclient`). Ce dernier cas teste réellement une défaillance de ressource, pas seulement la suppression manuelle de la classe `js`.

Les mesures portent sur le DOM rendu, les limites des liens, le focus réel, les événements clavier, les destinations activées et le réseau. Des captures ont complété l’examen, notamment avant/après le chargement retardé. Aucun fichier du site n’a été corrigé.

### Navigation à 320 / 375 / 768 px

Chaque cellule couvre Accueil, Coiffure, Barbier et Salon.

| Largeur CSS | JS actif | JS désactivé | main.js bloqué |
| --- | --- | --- | --- |
| 320 px | 4/4 conformes après chargement | 4/4 conformes | 4/4 conformes |
| 375 px | 4/4 conformes après chargement | 4/4 conformes | 4/4 conformes |
| 768 px | 4/4 conformes après chargement | 4/4 conformes | 4/4 conformes |

- Dans les 36 cas : `document.documentElement.scrollWidth === innerWidth`. Avec JS, l’absence de débordement est aussi vérifiée menu ouvert.
- Avec JS : menu fermé au repos, bouton atteignable par Tab, ouverture par Entrée et Espace, fermeture par Échap avec retour du focus au bouton.
- Sans JS ou avec script bloqué : navigation développée visible, bouton inutilisable masqué ; les cinq liens restent atteignables au clavier et dans la largeur du viewport.
- Les cinq destinations de navigation ont été activées au clic dans chaque cas, soit 180 activations ; le CTA Contact a aussi été activé au clavier. Les quatre pages et `salon.html#contact` sont atteintes correctement.
- Aucune exception JavaScript ni erreur réseau inattendue sur ces parcours. Les rejets volontaires de `main.js` sont des erreurs simulées attendues.
- Ce tableau valide l’état utilisable après chargement ou après échec du script ; il ne clôt pas le défaut transitoire CR2-04.

### Clavier et Barbier

Sur chacune des quatre pages, aux trois largeurs et dans les trois modes, le premier Tab atteint le lien d’évitement visible, Entrée donne le focus à `main#main`, et le Tab suivant continue dans le contenu. Le focus de Salon n’est donc plus une simple correction constatée dans le HTML : son comportement est vérifié.

Barbier expose un unique H1, les sections en H2 et les prestations/étapes en H3. « Entre deux visites » est une section de niveau 2, sœur de « Nos prestations » et « Le détail fait l’équilibre ». Les trois étapes figurent dans une liste ordonnée HTML et trois éléments de liste dans l’arbre d’accessibilité Chromium. Les chiffres décoratifs restent masqués. L’annonce vocale exacte sous VoiceOver/Safari ou NVDA n’a pas été testée.

### Polices locales et réseau

Sur chacune des quatre pages, `fonts.css` est chargé avant `tokens.css`. Les quatre fichiers WOFF2 locaux — Cormorant Garamond 600 et DM Sans 400/600/700 — répondent HTTP 200, et leurs entrées dans `document.fonts` sont à l’état `loaded`. Les polices effectivement utilisées sur les titres et sur-titres ont également été inspectées via Chromium : ce sont des polices web chargées, pas simplement des noms de familles déclarés en CSS.

Le poids cumulé des quatre fontes sur disque est de **66 088 octets (environ 64,5 Kio)**. Les déclarations utilisent `font-display: swap`. La notice locale consigne origine, variantes et licence déclarée ; cette passe ne constitue pas un audit juridique des licences.

Aucune requête vers Google Fonts, `fonts.gstatic.com` ou un autre domaine tiers n’a été observée. En bloquant volontairement les WOFF2 sur l’accueil à 320 px, le texte reste visible avec les polices système et la page ne déborde pas.

**Règle alignée sur ARCHITECTURE : l’auto-hébergement est requis avant toute première publication publique du portfolio.** Le CDN n’est toléré que pour une démo strictement locale ou éphémère ; l’ancienne formulation « avant production commerciale » est retirée. L’implémentation locale satisfait désormais ce seuil, sous réserve d’embarquer effectivement `shared/design-system/` dans le déploiement.

## Anomalie restant à corriger

### CR2-04 — Le menu développé apparaît pendant l’attente de main.js

- **Priorité : mineur (P2 de la seconde Code Review).**
- **État : partiellement corrigé, toujours reproductible.**
- **Emplacements :** les quatre HTML, `script src="js/main.js"` à la ligne 33 ; `js/main.js:7` ; `css/style.css:74-107`.
- **Étapes de reproduction :**
  1. Servir le dépôt en HTTP et ouvrir `sites/coiffeur-mixte/index.html` dans un contexte neuf, JS actif, à 320, 375 ou 768 px.
  2. Retarder uniquement la réponse de `js/main.js` de 1 500 ms, en laissant HTML, CSS et polices charger normalement.
  3. Pendant l’attente, constater la navigation développée, le bouton masqué et l’absence de `main` dans le DOM.
  4. Libérer la réponse : la classe `js` apparaît, la navigation se replie, le bouton apparaît et le contenu principal est enfin analysé et affiché.
- **Résultat mesuré :** aux trois largeurs, l’en-tête passe de **297,375 px à 81 px**. Un premier affichage est enregistré dès 60–80 ms, avant la libération du script ; les captures avant/après confirment le changement visible. Il ne s’agit donc pas d’une simple possibilité déduite du code.
- **Impact utilisateur :** sur connexion lente ou cache froid, l’interface change d’état devant l’utilisateur et l’affichage de l’offre attend une ressource servant essentiellement au menu. La navigation reste utilisable en repli ; il n’y a plus de perte permanente d’accès ni de débordement dans les scénarios testés.
- **Recommandation :** revoir l’état initial et la stratégie de chargement pour conserver une navigation opérationnelle dès le premier rendu, sans transition développé → replié perceptible ni blocage de l’analyse du contenu principal. Évaluer un contrôle HTML natif utilisable avant l’enrichissement JavaScript, ou une initialisation critique autonome. Ne pas masquer la navigation par une classe précoce qui laisserait un bouton inactif si `main.js` est bloqué.
- **Retest attendu :** mêmes trois largeurs avec cache froid, réponse de script retardée puis rejetée ; contrôler premier rendu, apparition du contenu, Tab/Entrée/Échap et navigation de secours. Le cas retardé a été exécuté sur Accueil ; les quatre documents partagent le même placement de script.

## Contrôles restant hors de cette passe

### Dépendants du déploiement ou de sa configuration

- **QA-07 — URL et indexation :** définir puis vérifier les URL canoniques, le choix d’indexer ou non la démo, `robots.txt` et le sitemap au niveau réellement publié. L’absence de configuration finale ne prouve pas à elle seule une impossibilité d’indexation.
- **Distribution des ressources partagées :** les chemins `../../shared/design-system/` fonctionnent dans l’arborescence locale servie. Confirmer que le déploiement indépendant du site embarque CSS et fontes au bon emplacement ; publier uniquement le dossier du site sans adaptation ne suffit pas.
- **Hébergement :** HTTPS, redirections, réponses 404, compression, cache, types MIME et éventuelle CSP restent à vérifier sur l’hébergeur retenu. Les réponses 200 du serveur temporaire ne valident pas ces réglages de production.
- **Performance publique :** pas de score Lighthouse publié ni de mesure terrain des Core Web Vitals dans cette passe. Le retard contrôlé de 1,5 s est un scénario de diagnostic, pas une mesure de latence réelle.
- **Cookies sur la version publiée :** aucune écriture de cookie ou de stockage dans le code inspecté et aucun cookie document ni appel tiers observé localement. Vérifier les éventuels ajouts de l’hébergeur sur l’URL finale avant de conclure pour la version publique.

### Non exécutés, mais possibles avant déploiement

Safari/iOS, Firefox, appareils physiques et lecture vocale VoiceOver/NVDA n’ont pas été testés ici. Les contrastes complets, les vues desktop/très grand écran et la revue visuelle générale n’ont pas été recommencés. Ces limites sont distinctes des contrôles qui attendent réellement un hébergement ; elles ne sont pas présentées comme des validations acquises.

## Checklist de livraison actualisée

### Avant la mise en avant définitive

- [x] Navigation à 320/375/768 px utilisable avec JS actif, désactivé et script bloqué.
- [x] Liens de navigation et CTA Contact activables au clavier et au clic.
- [x] Lien d’évitement fonctionnel sur les quatre pages.
- [x] Séquence et titres Barbier corrigés.
- [x] Coordonnées fictives sans action téléphone/e-mail.
- [ ] Clore CR2-04 : stabilité du menu et disponibilité du contenu pendant le chargement du script. Seule réserve mineure active de cette contre-vérification.

### Avant la première publication publique

- [x] Auto-héberger les polices conformément à ARCHITECTURE ; contrôle local réalisé.
- [ ] Confirmer sur la cible que CSS et WOFF2 partagés sont bien distribués, sans retour à un CDN de polices.
- [ ] Finaliser QA-07 et vérifier la configuration HTTP, HTTPS, cache et indexation sur la cible.
- [ ] Vérifier les éventuels cookies ou services ajoutés lors du déploiement.

### Acceptable pour la démonstration de portfolio

- [x] Démonstration locale présentable avec la réserve mineure de chargement explicitée ; aucun parcours principal n’est bloqué après chargement.
- [x] Compositions CSS provisoires décoratives, sans fausse attribution photographique.
- [x] Coordonnées clairement fictives et non actionnables ; aucune réservation ou collecte simulée.
- [x] Absence de données structurées de salon réel tant que les informations sont fictives.
- [x] Aucun bandeau cookies artificiel dans le site statique actuellement testé.
- [x] Shell dupliqué temporairement pour ce premier site, Eleventy différé au deuxième selon ARCHITECTURE.

## Traçabilité

Audit initial : `ef194f7` sur `3774de9`. Première contre-vérification : `840c396` sur `e2187ce`. Le détail historique des anomalies corrigées reste consultable dans ces versions Git du rapport. La présente passe sur `5827a14` actualise leurs états et remplace les anciennes conclusions, notamment le blocage de navigation sans JavaScript et le seuil tardif d’auto-hébergement.

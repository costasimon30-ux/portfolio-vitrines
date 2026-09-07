# QA / Audit — coiffeur-mixte

## Verdict actuel — 7 septembre 2026

**CR2-04 clôturé sur `9f60163` : réserve locale de chargement levée.** Sur les quatre pages à 320/375/768 px, le menu reste stable et le contenu est effectivement visible avant la libération de `main.js`, retardé de 1 500 ms. Le menu natif fonctionne aussi avec le script bloqué ou JavaScript désactivé. Les contrôles clavier, d’accessibilité du déclencheur, de navigation desktop et du lien d’évitement passent. Aucune anomalie locale ouverte dans ce périmètre ciblé ; la publication publique reste soumise aux contrôles de déploiement listés plus bas.

**Commit contrôlé :** `9f601636ce459d3cc78ab3951a27222abb1975d0` (`9f60163`, livraison de Claude sur `main`). `git pull --ff-only` effectué le 7 septembre avant cette passe : dépôt à jour.

**Périmètre du 7 septembre :** CR2-04 et non-régression directe du menu `details/summary`, du clavier, de la navigation desktop et du lien d’évitement sur les quatre pages. Les autres constats corrigés restent issus de la passe du 5 septembre sur `5827a14` ; ils ne sont pas présentés comme un nouvel audit complet. Le présent verdict remplace la réserve de chargement de cette passe.

**Référentiel :** `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/AGENTS.md`, `docs/DIRECTION.md`, `docs/ARCHITECTURE.md` et `docs/CODE-REVIEW-coiffeur-mixte.md` (passe 2, publiée dans `dcdadb9`).

## État de chaque anomalie

Les priorités rappellent la gravité initiale. Les identifiants CR2 correspondent, dans l’ordre, aux quatre constats P2 de la seconde Code Review. QA-02, QA-05, QA-06, CR2-01 et CR2-04 sont contre-vérifiés le 7 septembre ; les autres résultats locaux sont conservés depuis le 5 septembre.

| Identifiant | Priorité | État actuel | Preuve / portée de la vérification |
| --- | --- | --- | --- |
| QA-01 — Coordonnées fictives actionnables | Majeur | Corrigé, correction conservée | Aucun lien `tel:` ou `mailto:` dans les quatre pages. Les coordonnées du Salon sont du texte, explicitement fictif et non actionnable. Le CTA conduit au bloc Contact. |
| QA-02 — Navigation mobile sans JavaScript | Majeur | Corrigé, nouveau mécanisme vérifié | Quatre pages × trois largeurs × quatre scénarios : menu natif replié au repos, utilisable avant le script, après son rejet et sans JavaScript ; aucun débordement horizontal. |
| QA-03 — Médias et portraits fictifs | Majeur | Corrigé, correction conservée | Contrôle statique : compositions `.deco` décoratives avec `aria-hidden="true"`, absence des anciennes grilles de portraits et galeries. |
| QA-04 — Structures Coiffure / Barbier | Majeur | Corrigé, correction conservée | Contenus et ordre des sections comparés à la direction ; structure et titres Barbier vérifiés dans le DOM et l’arbre d’accessibilité Chromium. |
| QA-05 — Menu restant ouvert sur l’ancre Contact | Mineur | Corrigé avec JS ; repli manuel sans JS | Après chargement du script, l’activation de Contact ferme `details`, y compris sur Salon. Sans script, l’ancre fonctionne mais le menu reste ouvert sur la page courante ; fermeture native avec Entrée/Espace sur « Menu ». |
| QA-06 — Focus du lien d’évitement | Mineur | Corrigé, non-régression vérifiée | Tab → Entrée place réellement le focus sur `main#main` sur les quatre pages, en mobile et desktop ; Tab suivant continue dans le contenu en mobile. |
| QA-07 — Indexabilité et configuration finale | Mineur | En attente du déploiement | URL, choix d’indexation et configuration de l’hébergeur non disponibles. Aucun résultat de production ne peut être déduit du serveur local. |
| QA-08 — Dépendance Google Fonts | Mineur | Corrigé localement ; livraison des assets à confirmer sur l’hébergeur | Les quatre WOFF2 locaux répondent 200 et sont chargés sur chaque page ; aucune requête tierce observée. Seuil obligatoire : **avant la première publication publique**, selon ARCHITECTURE. |
| QA-09 — Grille CSS inutilisée | Mineur | Corrigé, correction conservée | Contrôle statique : anciennes règles `.grid`, `.team-grid` et `.gallery` absentes. |
| CR2-01 — Focus Salon | Mineur (P2) | Corrigé | Même vérification que QA-06 ; `salon.html:37` possède `tabindex="-1"`. |
| CR2-02 — Étapes Barbier non ordonnées | Mineur (P2) | Corrigé dans le DOM et Chromium | `barbier.html:85-101` : `ol.steps` et trois `li`, dans l’ordre Échanger → Dessiner → Entretenir ; l’arbre d’accessibilité expose une liste et trois éléments. |
| CR2-03 — « Entre deux visites » en h3 | Mineur (P2) | Corrigé | `barbier.html:109` : `h2`, également exposé au niveau 2 dans l’arbre d’accessibilité. |
| CR2-04 — Flash du menu au chargement | Mineur (P2) | **Clôturé le 7 septembre** | 24 observations avant réponse du script : contenu visible avant `DOMContentLoaded`, en-tête stable à 81 px et état du menu conservé après libération ou rejet. Voir le protocole et les résultats ci-dessous. |

## Contre-vérification de CR2-04 — 7 septembre

### Méthode et preuve avant libération du script

Tests indépendants avec Playwright et **Google Chrome 152.0.7977.77 (Chromium)**, en mode headless, sur un serveur HTTP local temporaire servant la racine du dépôt. Contextes neufs, cache HTTP désactivé par le serveur, largeur en pixels CSS et hauteur de 900 px.

Pour les scénarios retardés, seule la requête `**/js/main.js` est interceptée et retenue par un temporisateur de 1 500 ms, puis libérée ou rejetée. Le délai mesuré est de 1 500 à 1 502 ms. HTML, CSS et polices restent disponibles. Un scénario séparé rejette immédiatement le script ; un autre désactive JavaScript au niveau du navigateur.

**L’observation pendant l’attente n’attend pas DOMContentLoaded.** La navigation initiale attend seulement l’engagement de la réponse HTML (`waitUntil: "commit"`). Pendant que la requête du script est toujours retenue, le test relève le rectangle et la visibilité du H1, vérifie qu’il n’est pas occulté, mesure l’en-tête, inspecte l’arbre d’accessibilité, prend une capture du viewport et actionne le menu au clavier.

Sur les **24 cas retardés** (12 libérations + 12 rejets après attente) :

- Le contenu est observé **53 à 205 ms après l’interception**, avec `domContentLoadedEventStart === 0` dans tous les cas et la réponse du script toujours retenue.
- Les captures sont terminées **87 à 271 ms après l’interception**, donc bien avant les 1 500 ms ; elles montrent le titre et le contenu du hero, pas seulement un élément présent dans le DOM.
- Le suivi par trames de rendu relève un en-tête de **81 px pendant toute l’observation**, avant et après la réponse, y compris pendant l’ouverture volontaire du menu.
- Le menu est initialement fermé. Entrée/Espace l’actionnent avant l’exécution du script ; laissé ouvert pendant sa libération ou son rejet, il reste ouvert. La position verticale du H1 ne change pas.
- Le contenu principal existe dès la première trame échantillonnée. Les observations et captures avant réponse, et non cette seule présence DOM, fondent la clôture du défaut d’affichage.

### Matrice mobile

Chaque cellule couvre Accueil, Coiffure, Barbier et Salon. Total : **48 cas**, tous conformes aux comportements décrits ici.

| Largeur CSS | main.js retardé de 1 500 ms puis chargé | main.js bloqué immédiatement | JavaScript désactivé | main.js retardé de 1 500 ms puis bloqué |
| --- | --- | --- | --- | --- |
| 320 px | 4/4 | 4/4 | 4/4 | 4/4 |
| 375 px | 4/4 | 4/4 | 4/4 | 4/4 |
| 768 px | 4/4 | 4/4 | 4/4 | 4/4 |

Dans les quatre scénarios, le contenu est visible, le menu reste replié au repos et ses cinq liens rentrent dans le viewport à l’ouverture. `scrollWidth === innerWidth` menu fermé et ouvert. Aucune exception JavaScript ni échec réseau inattendu dans ces parcours ; les rejets du script sont volontaires.

### Clavier, état accessible et relation à la navigation

Sur les 48 cas mobiles :

- Tab atteint le lien d’évitement, le logo puis `summary`, avec un focus visible sur le déclencheur.
- Entrée ouvre le menu ; Espace le ferme puis le rouvre. Tab passe du déclencheur au premier lien, puis parcourt Accueil, Coiffure, Barbier, Le salon et Nous contacter dans cet ordre.
- L’arbre d’accessibilité expose `summary` comme un contrôle natif `DisclosureTriangle`, nommé **« Menu »**, avec `expanded: false` fermé et `expanded: true` ouvert. L’absence d’un attribut HTML `aria-expanded` n’entraîne donc pas ici une absence d’état accessible.
- À l’ouverture, la relation `controls` pointe effectivement vers le nœud `primary-nav`, exposé comme repère **« Navigation principale »**. La navigation est un frère de `details` dans le DOM ; sa relation avec le contrôle n’a pas été supposée à partir de la seule proximité visuelle.
- Fermée, la navigation principale est absente de l’arbre d’accessibilité. Ouverte, elle et ses liens sont accessibles ; le prochain Tab atteint directement le premier lien.

**Différence de comportement à conserver explicitement :** Échap et la fermeture automatique après un lien sont des améliorations de `main.js`. Après son chargement, Échap ferme le menu et rend le focus à « Menu » ; Contact ferme aussi le menu sur Salon. Pendant l’attente, après rejet ou sans JavaScript, Échap ne ferme pas le menu et l’ancre Contact de la page Salon le laisse ouvert. Il reste refermable nativement avec Entrée/Espace sur « Menu », accessible par Maj+Tab depuis les liens. Ce repli fonctionnel est acceptable pour la démo et ne reproduit pas CR2-04.

Ces constats valident les informations exposées à Chromium. Ils ne constituent pas une vérification de leur annonce vocale exacte par VoiceOver/Safari ou NVDA.

### Contrôles brefs desktop et lien d’évitement

**24 cas desktop :** quatre pages × 1024/1440 px × JS actif/script bloqué/JS désactivé. Navigation visible, liens dans le viewport, déclencheur mobile masqué et absent de l’arbre d’accessibilité une fois la navigation achevée. Tab atteint directement les liens après le logo ; un changement de page vers Coiffure est activé par Entrée, y compris un rechargement depuis Coiffure. Le repère « Navigation principale » reste exposé.

Sur les quatre pages, en mobile comme en desktop, Tab → Entrée sur le lien d’évitement place `document.activeElement` sur `main#main`. Le Tab suivant continue dans le contenu en mobile. Pas de régression du correctif QA-06 / CR2-01.

### Décision de clôture

**CR2-04 est clôturé.** Le correctif repose sur `details/summary` et le sélecteur CSS de l’état `[open]`, indépendants du chargement de `main.js` ; le script est désormais `defer` (`*.html:35`). Les essais avant sa libération prouvent que ce changement supprime le flash développé → replié et l’attente du contenu constatés sur `5827a14`.

Aucune correction supplémentaire n’est demandée au titre de CR2-04. La fermeture manuelle de secours et les limites de couverture des navigateurs restent documentées ci-dessus.

## Résultats antérieurs conservés — passe du 5 septembre

Les constats sur les coordonnées fictives, les compositions décoratives, les séquences et titres Barbier, le CSS inutilisé et l’auto-hébergement des polices proviennent de la contre-vérification de `5827a14`, publiée dans `474b3e8`. Leur détail demeure dans cette version Git du rapport. La présente passe ne renouvelle pas ces audits.

Les polices locales avaient répondu HTTP 200 sur les quatre pages : Cormorant Garamond 600 et DM Sans 400/600/700, quatre WOFF2 totalisant 66 088 octets, avec `font-display: swap`, sans requête tierce et avec un repli système lisible. Aucun changement de `shared/design-system/` n’est présent entre les deux livraisons.

**Seuil inchangé, conforme à ARCHITECTURE : auto-hébergement obligatoire avant la première publication publique du portfolio**, pas seulement avant une production commerciale. Sa distribution sur la cible reste à confirmer.

## Contrôles restant hors de cette passe

### Dépendants du déploiement ou de sa configuration

- **QA-07 — URL et indexation :** définir puis vérifier les URL canoniques, le choix d’indexer ou non la démo, `robots.txt` et le sitemap au niveau réellement publié. L’absence de configuration finale ne prouve pas à elle seule une impossibilité d’indexation.
- **Distribution des ressources partagées :** les chemins `../../shared/design-system/` fonctionnent dans l’arborescence locale servie. Confirmer que le déploiement indépendant du site embarque CSS et fontes au bon emplacement ; publier uniquement le dossier du site sans adaptation ne suffit pas.
- **Hébergement :** HTTPS, redirections, réponses 404, compression, cache, types MIME et éventuelle CSP restent à vérifier sur l’hébergeur retenu. Les réponses 200 du serveur temporaire ne valident pas ces réglages de production.
- **Performance publique :** pas de score Lighthouse publié ni de mesure terrain des Core Web Vitals dans cette passe. Le retard contrôlé de 1,5 s est un scénario de diagnostic, pas une mesure de latence réelle.
- **Cookies sur la version publiée :** aucune écriture de cookie ou de stockage dans le code inspecté et aucun cookie document ni appel tiers observé localement. Vérifier les éventuels ajouts de l’hébergeur sur l’URL finale avant de conclure pour la version publique.

### Non exécutés, mais possibles avant déploiement

Safari/iOS, Firefox, appareils physiques et lecture vocale VoiceOver/NVDA n’ont pas été testés ici. Les contrastes complets, les très grands écrans et la revue visuelle générale n’ont pas été recommencés ; le contrôle desktop du 7 septembre se limite à la navigation et au lien d’évitement à 1024/1440 px. Ces limites sont distinctes des contrôles qui attendent réellement un hébergement ; elles ne sont pas présentées comme des validations acquises.

## Checklist de livraison actualisée

### Avant la mise en avant définitive

- [x] Navigation à 320/375/768 px utilisable avec JS actif, désactivé et script bloqué.
- [x] Liens de navigation et CTA Contact activables au clavier et au clic.
- [x] Lien d’évitement fonctionnel sur les quatre pages.
- [x] Séquence et titres Barbier corrigés.
- [x] Coordonnées fictives sans action téléphone/e-mail.
- [x] Clore CR2-04 : menu stable et contenu effectivement visible avant libération ou rejet du script, sur les quatre pages à 320/375/768 px.
- [x] Contrôler l’état accessible de « Menu », sa relation à la navigation et le repli natif sans JavaScript.
- [x] Vérifier brièvement la navigation desktop et le lien d’évitement.

### Avant la première publication publique

- [x] Auto-héberger les polices conformément à ARCHITECTURE ; contrôle local réalisé.
- [ ] Confirmer sur la cible que CSS et WOFF2 partagés sont bien distribués, sans retour à un CDN de polices.
- [ ] Finaliser QA-07 et vérifier la configuration HTTP, HTTPS, cache et indexation sur la cible.
- [ ] Vérifier les éventuels cookies ou services ajoutés lors du déploiement.

### Acceptable pour la démonstration de portfolio

- [x] Réserve locale de chargement levée ; contenu et menu disponibles pendant l’attente du script.
- [x] Sans JavaScript, fermeture manuelle du menu avec Entrée/Espace ; absence d’Échap et de fermeture automatique sur une ancre de la page courante acceptée comme dégradation de confort.
- [x] Compositions CSS provisoires décoratives, sans fausse attribution photographique.
- [x] Coordonnées clairement fictives et non actionnables ; aucune réservation ou collecte simulée.
- [x] Absence de données structurées de salon réel tant que les informations sont fictives.
- [x] Aucun bandeau cookies artificiel dans le site statique actuellement testé.
- [x] Shell dupliqué temporairement pour ce premier site, Eleventy différé au deuxième selon ARCHITECTURE.

## Traçabilité

Audit initial : `ef194f7` sur `3774de9`. Première contre-vérification : `840c396` sur `e2187ce`. Le détail historique des anomalies corrigées reste consultable dans ces versions Git du rapport. Contre-vérification du 5 septembre : `474b3e8` sur `5827a14`, CR2-04 encore ouvert. Passe ciblée du 7 septembre : `9f60163` testé, CR2-04 clôturé avec observation du contenu avant la réponse du script. Les validations locales ne remplacent pas les contrôles de déploiement.

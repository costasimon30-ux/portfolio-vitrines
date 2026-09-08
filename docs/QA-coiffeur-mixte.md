# QA / Audit — coiffeur-mixte

## Verdict actuel — recette hébergée du 8 septembre 2026

**Avis QA favorable avec réserves mineures pour la démonstration de portfolio à l’URL HTTPS ci-dessous. Aucun défaut bloquant ou majeur identifié dans le périmètre exécuté.** Trois anomalies restent ouvertes : HTTP non redirigé vers HTTPS (HQA-01), titres occultés à l’arrivée sur certaines ancres (HQA-02), requête automatique de favicon en 404 à l’ouverture des crédits (HQA-03). Elles ne rendent pas les parcours principaux inutilisables ; leur acceptation pour la mise en avant relève de Simon.

Les contrôles autrefois en attente de l’hébergement sont désormais réalisés : accès et rechargements, redirections, vraies 404, distribution des ressources, polices locales, notices, directives de non-indexation et absence de traceurs observée. **QA-07 et QA-08 sont clôturés sur la cible observée. CR2-04 reste clôturé**, sans prétendre avoir rejoué aujourd’hui les retards artificiels du 7 septembre.

**URL auditée :** [Créa’Tif — Worker public](https://portfolio-vitrines-coiffeur-mixte.costa-simon30.workers.dev/). Recette indépendante le **8 septembre 2026**, observations HTTP et navigateur entre **17 h 51 et 18 h 09 UTC** (19 h 51–20 h 09, Europe/Paris). Ce verdict est un instantané, pas une surveillance permanente ni une autorisation de correction ou de republication.

### Version annoncée et version effectivement vérifiable

| Élément | Constat |
| --- | --- |
| Source annoncée par le handoff | `619d931cf972e6c5df816587a705ddb932690c51` |
| Code validé par le Reviewer | `ad0aa8ad21a5f373caddb71b329eef2d9f5e0b43` |
| Référentiel produit | `docs/DIRECTION.md`, arbitrage Workers de `0154069` |
| Référentiel architecture | Mise à jour Workers manuels de `e2a3d37`, intégrée pendant cette recette |
| Synchronisation | `git pull --ff-only` au début et avant rédaction ; `main` à `e2a3d37` avant ce rapport. Aucun changement des sources publiables entre `619d931` et ce HEAD. |
| Mode de publication déclaré | Workers Static Assets, dépôt manuel de l’artefact, sans Git connecté ni build distant |
| Preuve indépendante sur les octets | **41/41 fichiers publics**, corps HTTP décompressés, SHA-256 identiques aux fichiers correspondants de l’artefact de référence validé sur `ad0aa8a` |
| Version / déploiement Cloudflare | Identifiants non fournis et non exposés dans les réponses consultées ; **non vérifiés** |
| Previews distantes | Aucune déclarée active : **non applicable**, et non « validée » |

L’artefact de référence conservé par la Code Review contient 42 fichiers : cinq HTML, 35 ressources, `robots.txt` et `_headers`. Son inventaire a été relu et son agrégat recalculé : SHA-256 du JSON compact du dictionnaire **chemins relatifs triés → SHA-256 des octets**, soit :

```text
61baa3bee04b5a01a478f29523b052453ed26c0ebec90a64dd1da0e9f72838c4
```

Les 41 fichiers servis sont tous identiques individuellement à cette référence. `_headers` est une configuration non publique : son URL retourne 404, mais ses effets sont vérifiés dans les réponses. L’empreinte shell annoncée par Claude (`c6ddb471aa4a6337754b8dd886866c1b2446587cedec2b3582ae2943a573be9d`) utilise une autre méthode ; elle n’est pas assimilée à cet agrégat.

**Portée de la preuve :** équivalence des contenus publics avec l’artefact validé, pas identification unique d’un commit ou du déploiement actif dans le compte Cloudflare. Plusieurs commits peuvent produire les mêmes octets ; le HEAD documentaire n’est pas présenté comme publié. Aucun nouvel assemblage ni rejeu de la suite de publication n’a été effectué.

## Méthode et couverture

Conventions `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/AGENTS.md`, DIRECTION, ARCHITECTURE et rapports QA / Code Review / UX existants lus. Les validations d’assemblage, de direction artistique et la réserve P06 ne sont pas rouvertes. **PUB-A1 reste facultatif et différé.**

Requêtes GET indépendantes avec suivi explicite des redirections, validation TLS active, inspection des en-têtes et comparaison des corps. Parcours avec **Google Chrome 152.0.7977.77**, piloté par Playwright en mode headless sur macOS, contextes isolés. Viewports en pixels CSS ; contrôle du DOM, du focus réel, de l’arbre d’accessibilité Chromium, des dimensions, décodage des images et captures examinées. Préférence de mouvement réduit dans les essais navigateur.

### Quatre pages sur quatre formats

Chaque cellule couvre accès direct, rechargement, rendu, images, fontes, absence de débordement horizontal, menu/navigation, clavier et lien d’évitement, arrivée au Contact et consultation de la notice depuis le footer.

| Page | 320 × 568 | 375 × 667 | 768 × 1024 | 1440 × 900 |
| --- | --- | --- | --- | --- |
| Accueil | Conforme* | Conforme* | Conforme* | Conforme* |
| Coiffure | Conforme* | Conforme* | Conforme* | Conforme* |
| Barbier | Conforme* | Conforme* | Conforme* | Conforme* |
| Le salon | Conforme* | Conforme* | Conforme* | Conforme* |

**16/16 parcours passent leurs contrôles fonctionnels.** *« Conforme » ne signifie pas absence de toute réserve : le positionnement des titres après une ancre fait l’objet de HQA-02 ; le favicon de la notice fait l’objet de HQA-03.*

Après défilement de toute la page, toutes les images visibles sont décodées (`naturalWidth > 0`), les quatre fontes sont chargées, `scrollWidth === innerWidth` et aucun élément visible de `main` ou du footer ne dépasse horizontalement. Les captures et les mesures ne constituent pas une nouvelle appréciation artistique.

### Clavier, menu et évitement

- Sur les 16 parcours : premier Tab sur « Aller au contenu principal », Entrée place **réellement** `document.activeElement` sur `main#main`, puis Tab continue dans le contenu.
- À 320/375/768 px : menu initialement replié, focus visible sur « Menu », Entrée ouvre, Espace ferme et rouvre, Tab atteint les liens. Avec JS, Échap ferme et rend le focus au déclencheur ; Contact referme le menu.
- À 1440 px : navigation affichée, déclencheur mobile masqué, liens accessibles dans l’ordre au clavier.
- Relevé complémentaire à 375 px sur les quatre pages : Tab parcourt **Accueil → Coiffure → Barbier → Le salon → Nous contacter**, contours de focus visibles ; Entrée sur ce dernier lien atteint `/salon#contact`.
- L’arbre d’accessibilité expose le contrôle natif `DisclosureTriangle`, nommé « Menu », état `expanded: false/true`. Ouvert, sa relation `controls` référence effectivement `primary-nav`, repère « Navigation principale ». Fermé, ce repère est absent de l’arbre accessible. L’absence d’un attribut HTML `aria-expanded` n’est pas traitée comme un défaut lorsque l’état natif est bien exposé.
- **Sans JavaScript : quatre pages à 375 × 667**, accès, rechargement, contenu, menu natif, clavier, lien d’évitement, Contact et notice passent. Fermeture manuelle sans JS toujours acceptée ; pas de promesse d’Échap ou de fermeture automatique.
- Aucun scénario de `main.js` retardé/bloqué n’est rejoué sur l’hébergement : sa validation antérieure reste bornée à la passe locale documentée plus bas.

### Zoom natif 200 %

Le réglage **200 % de Chrome** est appliqué dans un profil temporaire isolé, pas simulé par une transformation CSS ou un zoom tactile. Fenêtre de 1440 px : largeur intérieure de **1440 → 720 px CSS**, `devicePixelRatio: 1 → 2`, hauteur intérieure à 200 % de 456 px, `visualViewport.scale: 1`.

Sur les quatre pages : contenu redistribué, `scrollWidth = 720`, aucun débordement mesuré dans le contenu/footer ; menu, focus du lien d’évitement, Échap et accès Contact fonctionnent. Captures viewport natives contrôlées ; les captures « full page » rognées par l’outil à ce zoom ne sont pas retenues comme preuve visuelle. La réserve d’ancres reste distincte de la redistribution correcte à 200 %. Pas de certification du zoom sur Safari/iOS ou Firefox.

## Résultats HTTP, ressources et indexation

### HTTPS, routes et redirections

Connexion HTTPS acceptée sans ignorer les erreurs de certificat : **TLS 1.3**, certificat Google Trust Services WE1, SAN couvrant `*.costa-simon30.workers.dev`, valide du 8 septembre au 7 décembre 2026. HTTP/2 observé avec curl et HTTP/3 dans Chrome. L’accès HTTPS fonctionne ; l’entrée en HTTP reste un défaut séparé (HQA-01).

Tous les chemins ci-dessous sont relatifs à l’origine auditée.

| Requête | Résultat observé |
| --- | --- |
| `/`, `/coiffure`, `/barbier`, `/salon` | 200 ; accès direct et rechargement fonctionnels |
| `/index.html`, `/index` | 307 vers `/`, puis 200 |
| `/coiffure.html`, `/barbier.html`, `/salon.html` | 307 vers la route sans extension, puis 200 |
| `/coiffure/`, `/barbier/`, `/salon/` | 307 vers la route sans slash final, puis 200 |
| `/index/` | 307 vers `/index`, puis 307 vers `/`, puis 200 ; pas de boucle |
| `/salon.html?qa=hosted#contact` et `/salon/?qa=hosted#contact` dans Chrome | Arrivée `/salon?qa=hosted#contact`, paramètres et fragment conservés, y compris après rechargement |
| `/index.html#univers` | Arrivée `/#univers`, fragment conservé |
| `/index.html/`, `/coiffure.html/` | 404 ; variantes mal formées, non émises par les liens du site |
| `/404.html` | 307 vers `/404`, puis 200 pour l’accès direct au document d’erreur ; ne préjuge pas des vraies URL inconnues |

**Le statut 307 n’est pas une anomalie ici.** Les liens relatifs actuels fonctionnent après normalisation ; aucune boucle ni dégradation HTTPS → HTTP n’a été observée dans ces chaînes.

### Vraies 404 et absence ciblée de contenu interne

`/inexistant-qa-20260908`, `/dossier/inexistant-qa-20260908` et `/dossier/profond/inexistant.html` retournent **HTTP 404**, sans repli 200 vers l’accueil. Le corps correspond à la 404 personnalisée (SHA-256 `f79a363d3468fda9553d2519461bb8f7b627bb1a4d0a2b8771f55743fec2dad6`). CSS, fontes utilisées et favicon SVG restent accessibles depuis la route imbriquée.

Tests navigateur à 375 × 667 sur les deux premiers chemins : message lisible, premier lien atteint avec Tab, Entrée sur le retour mène à `/` et affiche le H1 d’accueil. Aucune ressource requise en échec.

**17 chemins internes ciblés : tous 404 avec la page d’erreur, sans restitution du fichier recherché.**

```text
/docs/
/docs/QA-coiffeur-mixte.md
/docs/DIRECTION.md
/docs/captures/coiffeur-mixte/1d59fef/accueil-375x667-page.png
/publication.json
/sites/coiffeur-mixte/publication.json
/CLAUDE.md
/README.md
/.git/config
/.env
/.node-version
/scripts/assemble-site.mjs
/wrangler.jsonc
/wrangler.toml
/sites/restaurant-le-jardin/index.html
/package.json
/_headers
```

Cette liste est une vérification bornée, pas un inventaire exhaustif des secrets ou un audit de sécurité du compte. Le chemin d’un autre site est un test de non-exposition, pas l’affirmation que ce site existe dans le dépôt. Le dépôt Git public n’est pas rendu privé par ces réponses.

### Ressources et types MIME

**41 fichiers publics sur 41 : statut final 200 et octets identiques à la référence.**

| Famille | Nombre | MIME réellement servi |
| --- | --- | --- |
| Pages, 404 comprise | 5 | `text/html` |
| CSS du site, tokens et fontes | 3 | `text/css` |
| Script principal | 1 | `application/javascript` |
| Images photographiques | 24 | `image/webp` |
| Fontes locales | 4 | `font/woff2` |
| Favicon déclaré | 1 | `image/svg+xml` |
| Notices photo et polices | 2 | `text/plain; charset=utf-8` |
| `robots.txt` | 1 | `text/plain` |

Les quatre WOFF2 (Cormorant Garamond 600 ; DM Sans 400/600/700) sont chargés depuis la même origine sur les quatre pages. Aucun retour à Google Fonts ni CDN tiers. **Seuil d’architecture : auto-hébergement avant publication publique**, désormais confirmé sur l’URL publique et pas seulement localement.

Les notices `/assets/photos/NOTICE.md` et `/shared/design-system/fonts/NOTICE.md` restent lisibles et inchangées. Le lien « Crédits et licences photographiques » fonctionne depuis les quatre footers, le retour navigateur aussi. Les **sept URL sources distinctes** des crédits (six Shopify/Burst, une Unsplash) répondent 200 lors du contrôle de disponibilité. Aucun réexamen des droits ou de P06 n’est déduit de ce statut HTTP.

### Non-indexation réellement servie

- Les cinq HTML possèdent une unique meta `robots` avec **`noindex, follow`**.
- Les 41 réponses finales de fichiers publics, y compris images, fontes et notices, ainsi que les 404 ciblées, portent **`X-Robots-Tag: noindex, follow`**. Le 307 observé de `/coiffure.html` le porte également.
- `/robots.txt` répond 200 avec exactement `User-agent: *` puis `Allow: /`. Pas de blocage global empêchant la lecture des consignes de non-indexation.
- `/sitemap.xml` répond 404 : conforme au contrat de démo non indexable. Ni sitemap de démo ni canonique fictive à réclamer.
- Titres des quatre pages distincts, descriptions présentes, `lang="fr"`, un H1 par page.
- La directive est bien distribuée ; son application future par chaque moteur ou une désindexation effective ne sont pas vérifiées. **Noindex ne rend pas le site privé** et ne modifie pas la réserve P06.

## Contact, stockage, console et performance

### Contact et consentement

Les CTA atteignent le bloc Contact de la page Salon. Coordonnées clairement fictives, aucun lien `tel:` ou `mailto:`, aucun formulaire ni réservation/collecte simulée. L’absence d’un formulaire est conforme au périmètre, pas un formulaire « testé en envoi ».

Sur les parcours hébergés : aucun cookie dans le contexte navigateur ni `document.cookie`, aucun `Set-Cookie` sur les réponses contrôlées, stockage local et de session vides. Aucun appel tiers automatique observé ; les liens sortants des crédits ne sont pas des traceurs intégrés. **Aucun besoin technique de bandeau de consentement identifié dans cette version observée.** Ce constat n’est pas un audit juridique général ni une garantie sur de futurs services ajoutés.

### Erreurs console et réseau

Aucune exception JavaScript, requête échouée ou réponse 4xx/5xx sur les ressources déclarées nécessaires aux quatre pages. Les 404 provoquées volontairement sont attendues et ne sont pas comptées comme pannes.

Une erreur console 404 a été reproduite et attribuée via le journal réseau Chrome à **`/favicon.ico`**, demandé automatiquement lors de l’ouverture de la notice texte. Le favicon SVG déclaré par les pages fonctionne. Voir HQA-03 : ne pas annoncer une console absolument sans erreur.

### Chargement à cache navigateur froid

Contexte neuf pour chaque page/format et cache navigateur désactivé via le protocole Chrome. Mesures avant les interactions et avant le défilement de chargement complet ; attente de chargement et de fontes, puis échantillonnage après 800 ms supplémentaires. Navigation/Resource Timing et observateurs de peinture, LCP et déplacements sans interaction récente.

**Laboratoire non bridé** : pas de simulation de mobile lent, pas de ralentissement CPU/réseau. Le cache du CDN n’a pas été purgé (`CF-Cache-Status: HIT` observé), DNS/connexion système potentiellement chauds. « Cache froid » désigne ici le navigateur, pas toute la chaîne réseau.

| Page | 375 px : TTFB / FCP / LCP (ms) | 375 px : CLS / transfert initial | 1440 px : LCP / CLS / transfert initial |
| --- | --- | --- | --- |
| Accueil | 47 / 284 / 300 | 0,031 / 90 690 o | 268 ms / 0,010 / 178 044 o |
| Coiffure | 54 / 284 / 284 | 0,028 / 90 407 o | 256 ms / 0,004 / 159 900 o |
| Barbier | 54 / 320 / 320 | 0,056 / 92 242 o | 280 ms / < 0,001 / 133 352 o |
| Salon | 40 / 228 / 228 | 0,035 / 111 363 o | 276 ms / < 0,001 / 205 437 o |

Sur les 16 échantillons : LCP **228–1 008 ms**, le maximum étant Accueil à 320 px ; CLS observé **0–0,056**. Les transferts additionnent `transferSize` de la navigation et des ressources déjà chargées, avec l’estimation d’en-têtes du navigateur ; ils ne représentent pas toutes les images différées de la page.

Compression Brotli/gzip observée sur les ressources textuelles ; politique `Cache-Control: public, max-age=0, must-revalidate`, compatible avec les noms de fichiers non versionnés. Aucun défaut de chargement bloquant ni poids initial excessif mis en évidence par ces essais. Ce n’est **ni un score Lighthouse, ni un percentile terrain des Core Web Vitals, ni une mesure d’INP**. Un seul passage par combinaison, pas de médiane ni de validation 4G lente.

## Anomalies ouvertes de cette recette

### HQA-01 — Mineur — L’entrée HTTP n’est pas forcée vers HTTPS

**Reproduction :** effectuer un GET explicite sur `http://portfolio-vitrines-coiffeur-mixte.costa-simon30.workers.dev/` avec curl, sans mécanisme d’auto-upgrade du navigateur. Réponse **200**, sans `Location`. Pour `http://…/salon.html?qa=hosted`, réponse **307** avec `Location: /salon?qa=hosted`, suivie d’un **200 toujours en HTTP**. Confirmé indépendamment par fetch et curl ; le certificat HTTPS reste valide.

**Impact :** une personne arrivant par une URL HTTP peut lire la démo sur une connexion non chiffrée, donc susceptible d’altération en transit. Gravité mineure dans le périmètre actuel : site de démonstration statique sans authentification, formulaire ni transmission de coordonnées. Cela ne serait pas une tolérance adaptée à une future collecte de données.

**Recommandation :** faire appliquer une redirection HTTP → HTTPS sur cette cible, en conservant chemin et paramètres, puis vérifier son interaction avec la normalisation HTML et les ancres. L’absence d’HSTS est également observée, sans ouvrir un défaut distinct. Aucun réglage modifié par QA.

**État : ouvert ; réserve non bloquante pour un partage de la démo par son URL HTTPS, à traiter avant tout élargissement sensible du périmètre.**

### HQA-02 — Mineur — Titres masqués par l’en-tête après navigation par ancre

**Reproduction à 375 × 667 :**

1. Sur Accueil, activer « Découvrir le salon » (`#univers`) ; sur Coiffure ou Barbier, « Voir les prestations » (`#prestations`).
2. Ou ouvrir `/salon.html?qa=hosted#contact`.
3. Sur Salon, activer le lien « Accueil » du contenu, qui mène à `/#approche-title`.

**Preuve :** en-tête fixe visuellement en haut, bord inférieur à **81 px**. Après arrivée, les titres des sections Univers / Prestations / Contact commencent vers **63,5–64,3 px** : leur haut est recouvert d’environ 17 px. Pour `#approche-title`, le H2 est entre **−0,5 et 31,7 px**, donc entièrement derrière l’en-tête. L’identifiant cible existe et l’URL/section correcte est atteinte ; ce n’est pas une ancre cassée.

**Impact :** repère de lecture partiellement ou totalement perdu à l’arrivée, particulièrement gênant en mobile. Le contenu reste accessible par défilement ; cela ne remet pas en cause le transfert de focus fonctionnel du lien d’évitement.

**Recommandation :** tenir compte de l’en-tête sticky dans le défilement vers les cibles, par exemple avec `scroll-margin-top` sur les cibles concernées ou `scroll-padding-top` adapté. Contre-vérifier liens internes et accès directs, aux quatre largeurs et à 200 %. Aucune correction appliquée.

**État : ouvert ; non bloquant pour cette démo, amélioration de navigation recommandée.**

### HQA-03 — Mineur — Favicon implicite absent sur la notice texte

**Reproduction :** dans un contexte Chrome neuf, ouvrir une page puis « Crédits et licences photographiques ». Examiner le journal console/réseau : requête automatique `GET /favicon.ico`, réponse **404**, alors que la notice répond 200. Le diagnostic complémentaire associe explicitement l’erreur console à cette URL.

**Impact :** bruit dans la console et éventuelle icône d’onglet générique pour la notice ; aucun impact sur sa lecture, les crédits, le retour ou le favicon SVG des pages.

**Recommandation :** accepter explicitement cette requête de confort pour le portfolio, ou prévoir un favicon racine valide dans une livraison ultérieure. Ne pas convertir la notice ni modifier ses octets uniquement pour ce motif.

**État : ouvert ; facultatif, non bloquant.**

## État des constats antérieurs

| Identifiant | État actuel / portée |
| --- | --- |
| QA-01 — Coordonnées fictives | Correction confirmée sur l’hébergement ; aucun appel/e-mail actionnable |
| QA-02 — Navigation sans JS | Correction confirmée à 375 px sur les quatre pages ; matrice locale élargie conservée |
| QA-03 — Médias et portraits fictifs | Ancien état « compositions seules » remplacé par la passe photographique validée dans DIRECTION/UX ; pas de réouverture artistique ou P06 |
| QA-04 — Structures Coiffure / Barbier | Correction antérieure conservée ; pas de nouvelle revue éditoriale |
| QA-05 — Fermeture du menu sur Contact | Confirmée avec JS dans la matrice hébergée ; fermeture manuelle de secours sans JS acceptée |
| QA-06 / CR2-01 — Focus du lien d’évitement | Confirmé sur les quatre pages et les quatre largeurs, ainsi qu’à 200 % |
| QA-07 — Indexation finale | **Clôturé sur la cible** : politique de démo réellement servie ; ne garantit pas l’état des moteurs |
| QA-08 — Polices tierces | **Clôturé sur la cible** : quatre WOFF2 locaux chargés, obligation avant publication publique satisfaite |
| QA-09 — Ancienne grille CSS inutilisée | Correction antérieure conservée ; aucune nouvelle analyse de couverture CSS |
| CR2-02 / CR2-03 — Séquence et titre Barbier | Clôtures antérieures conservées, non réauditées aujourd’hui |
| CR2-04 — Flash/attente du menu et du contenu | **Reste clôturé** : preuve locale du 7 septembre conservée ; non-régression hébergée normale et sans JS réalisée |
| PUB-01 à PUB-10 | Statuts de la dernière Code Review conservés ; aucune revue d’assemblage rejouée |
| PUB-A1 | Facultatif et différé, inchangé |
| P06 | Arbitrage et réserve documentaire de DIRECTION inchangés ; non traités par cette recette |

**Historique conservé dans Git :** audit initial `ef194f7` sur `3774de9`, contre-vérification `840c396` sur `e2187ce`, passe du 5 septembre `474b3e8` sur `5827a14`, puis rapport local du 7 septembre `6b88919` sur `9f601636ce459d3cc78ab3951a27222abb1975d0`.

La clôture locale CR2-04 reposait sur **48 cas mobiles** (quatre pages × trois largeurs × quatre scénarios : délai de 1 500 ms puis libération/rejet, blocage immédiat, JS désactivé), et 24 cas desktop. Pour les 24 cas retardés, observation du contenu **53–205 ms après interception**, captures **87–271 ms**, `domContentLoadedEventStart === 0` et script encore retenu ; en-tête stable à 81 px, état du menu conservé. Cette preuve avant réponse du script reste disponible dans le rapport historique, sans être présentée comme une nouvelle mesure sur Workers.

## Limites et checklist de mise en avant

### Contrôles effectivement acquis

- [x] Correspondance des 41 fichiers publics avec l’artefact validé ; distinction explicite entre révision annoncée et identifiant Cloudflare non vérifié.
- [x] HTTPS valide, pages directes/rechargées, redirections sans boucle, paramètres et fragments conservés.
- [x] Vraies 404 simples et imbriquées, retour clavier vers l’accueil.
- [x] Ressources, images, fontes locales, notices et types MIME vérifiés.
- [x] Non-indexation réelle des pages et ressources ; robots conforme ; absence de sitemap de démo.
- [x] Absence de contenu interne sur les 17 chemins ciblés.
- [x] Quatre pages à 320/375/768/1440 px ; clavier, menu, évitement et zoom natif 200 %.
- [x] Contact fictif sans collecte ; crédits consultables ; absence observée de cookies/stockage/appels tiers automatiques.
- [x] Console/réseau examinés et performance mesurée à cache navigateur froid, avec limites explicites.

### Limites restantes, pas des validations implicites

- [ ] Joindre les identifiants de version/déploiement Cloudflare si accessibles. Le compte, la sauvegarde d’artefact, les droits d’accès, le mode Git déclaré et la procédure de rollback n’ont pas été inspectés ou exercés par QA ; aucune raison de republier uniquement pour créer cette preuve.
- [ ] Vérifications complémentaires Safari/iOS, Firefox, appareils physiques et annonce vocale VoiceOver/NVDA non exécutées. L’arbre Chromium ne prouve pas le rendu vocal des lecteurs d’écran.
- [ ] Pas de nouvelle certification WCAG/RGAA, ni audit exhaustif des contrastes/lecteurs d’écran ; pas de très grand écran au-delà de 1440 px dans cette recette ciblée.
- [ ] Pas de mesure terrain, d’INP, de série statistique, de cache CDN purgé ou de scénario réseau mobile lent ; disponibilité future et indexation effective non garanties.
- [ ] Réévaluer les garanties si un domaine personnalisé, des previews réelles, de nouveaux traceurs, un formulaire ou une autre version sont publiés. **Previews inexistantes : non applicables aujourd’hui.**

### Décision de livraison pour le portfolio

**Aucun blocage QA établi dans le périmètre exécuté.** L’avis est favorable à la mise en avant de cette démo HTTPS sous réserve d’acceptation des trois anomalies mineures et des limites ci-dessus par Simon. Ce n’est pas un feu vert pour un véritable service de salon collectant des données.

Acceptables pour ce portfolio : coordonnées fictives non actionnables, pas de formulaire, démo non indexable mais publique, fermeture manuelle du menu sans JS, notice texte, absence de previews/Git connecté, favicon implicite manquant. L’amélioration des ancres et la redirection HTTP → HTTPS restent recommandées, sans transformer cette recette en commande de correction.

**Aucun code, archive, dossier `sources/`, artefact publié ou réglage Cloudflare modifié. Aucun déploiement.** Toute livraison suivante, correction ou retour arrière exige un nouvel accord explicite de Simon ; ce commit documentaire et son push n’en constituent pas un.

### Conservation des preuves

Preuves de travail non versionnées sous `/private/tmp/creatif-hosted-qa.fKlg7Z/` : `http-results.json` (chaînes, en-têtes, inventaire SHA-256), `browser-results.json` (16 parcours, 4 sans JS, 404, timing), `zoom-results.json`, `final-checks-results.json` (arbre accessible, clavier, ancres, stockage), `console-results.json`, `links-zoom-results.json`, scripts de reproduction et captures. Référence d’artefact consultée en lecture seule sous `/private/tmp/review-publication-ad0aa8a.AXFfGZ/artifact-ad0aa8a/sites/coiffeur-mixte/dist/`.

Ces dossiers temporaires pourront disparaître ; les scénarios, résultats, mesures, dates et empreintes déterminants sont consignés dans ce rapport versionné. Les captures de zoom natives, notamment le menu focalisé de Barbier (`zoom-last-false.png`), complètent les dimensions et actions testées ; les captures rognées ou incomplètes de l’outil ne fondent aucun constat de défaut du site.

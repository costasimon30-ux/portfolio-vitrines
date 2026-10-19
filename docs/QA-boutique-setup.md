# QA — Ligne Posée / boutique-setup

## Bilan QA et GET publics ciblés — 19 octobre 2026

**Verdict borné : pages et ressources échantillonnées accessibles avec des types cohérents ; l'accueil public correspond à l'ancien accueil de `a03b365`. LP-QA-02 reste ouvert, son URL de notice répond encore 404 ; LP-QA-01 reste ouvert, non retesté.** Aucune nouvelle recette navigateur ni validation du candidat MIME n'est prononcée.

### Version, méthode et traçabilité

- URL : `https://ligne-posee.costa-simon30.workers.dev`. GET indépendants le **19 octobre, 05 h 52–05 h 54 Europe/Paris** (UTC+02) ; première série horodatée `2026-10-19T03:52:44.9586380+00:00`, complément terminé à `03:53:22.9519337+00:00`.
- PowerShell / `System.Net.Http.HttpClient`, GET HTTPS avec validation TLS normale. Corps conservés en mémoire ; SHA-256 calculé par `SHA256.HashData` sur les octets reçus avant décodage UTF-8. Première série avec suivi des redirections, complément sans suivi. Aucun fichier de preuve créé, aucun assemblage ni suite de tests exécuté.
- Le premier essai a échoué en DNS dans le bac à sable ; l'outil web était inaccessible. **Accès réseau hors bac à sable autorisé, limite levée et réponses obtenues** : l'échec initial n'est pas le verdict final et ne démontre aucune panne du site.
- Simon rapporte une restauration vers **cca19c6e** après l'incident du 18 octobre et le retrait de versions dont b7291ef2. Aucun identifiant de Dashboard n'a été inspecté par QA. L'accueil reçu fait **4 171 octets**, SHA-256 `9a2d643f57fed31b4d925d4ee835a227286fdb093ce40d2f97a523702574eb52`, identique aux octets HTML de `a03b365` lus depuis Git ; le nouvel accueil « Le bureau prend forme » de `7e4032b` est absent. Cela concorde avec le relevé de restauration, sans identifier la version Cloudflare ni l'artefact complet.
- `/` et `/?qa-bilan=20261019` servent le même hash. Le complément demande `Cache-Control: no-cache`, mais reçoit `CF-Cache-Status: HIT` : aucun cache CDN froid revendiqué.
- Le candidat `f66274fa0c9915846722824421284716358a8e1a`, contenant le nouvel accueil et les règles MIME, est rapporté non déployé : **84 fichiers, 1 122 438 octets**, agrégat `9895d746ffba78768d4eb281868e9938772bcc930e8e5a666d9381ce90a0bff5`. Cet agrégat n'a pas été recalculé par QA et n'est pas attribué à la publication actuelle.

### Chemins réellement demandés et résultats

Toutes les réponses contrôlées de cette série portent `X-Robots-Tag: noindex, follow`. Les pages HTML finales et les 404 portent aussi la meta `noindex, follow`.

| Chemin GET | Résultat observé |
| --- | --- |
| `/`, `/?qa-bilan=20261019`, `/catalogue`, `/panier`, `/commande`, `/confirmation` | 200 ; `text/html` |
| `/produit.html?modele=sup-03` | 307 vers `/produit?modele=sup-03`, puis 200 `text/html` ; paramètre conservé. Redirection sans suivi : corps vide, aucun Content-Type |
| `/css/style.css` | 200 ; `text/css` |
| `/js/page-produit.js` | 200 ; `text/javascript` |
| `/data/catalogue.json` | 200 ; `application/json` |
| `/robots.txt` | 200 ; `text/plain` ; corps `User-agent: *` puis `Allow: /` |
| `/inexistant-qa-bilan/niveau` | **404 réelle** ; `text/html` ; titre « Page introuvable — Ligne Posée (démonstration) » |
| `/NOTICE-VISUELS.md`, `/publication.json`, `/_headers` | 404 ; même corps HTML que la 404 imbriquée |

Empreintes complémentaires des corps reçus :

| Ressource | Octets | SHA-256 |
| --- | ---: | --- |
| `/catalogue` | 6 506 | `55042230f5586c792e9128bb056198a487951dc6bc4da5b6d328da926815a277` |
| Fiche après redirection | 3 288 | `a64e2cf4b481bd994317e0615336b49cf4407724354128411fe90b86352d6638` |
| `/css/style.css` | 18 417 | `4f5a6a2d5bb26a6f20e153d18fe9ec8c65929b47d27ace2efddfb2890a3c3bae` |
| `/js/page-produit.js` | 10 639 | `0ece8bdce58a252fe28b361d07fade2041cd3c0c6a6eaedc357bc7fd0cd0cece` |
| `/data/catalogue.json` | 13 754 | `036969a50f0acd7e668036aaf01f7f276f97bf6eb837c4a6108f1cba0a081d8a` |
| 404 imbriquée / notice absente | 1 846 | `85213a71d35fdef3eca7851defe488971e28e8450e32cdce7223a3742032b8e8` |

### Clôtures conservées, réserves et suite nécessaire

- **Acquis historiques :** lots BQ-01 à BQ-04 et L2-01 à L2-03 clos dans leurs périmètres ; recette nominale hébergée du 12 octobre sur `a03b365` favorable avec réserves, 20 modèles/80 variantes et parcours panier/livraison/confirmation vérifiés. Le zoom natif avait été testé sur une fenêtre desktop (1680 vers 840 px CSS), pas sur quatre appareils. Aucun de ces parcours n'est déclaré rejoué aujourd'hui.
- **LP-QA-01, majeur : ouvert, non retesté.** La preuve historique du JSON retardé de 10 s et des déplacements de 537 à 937 px reste applicable à son périmètre ; pas de nouvelle injection de panne. La tolérance pour la démo provisoire ne clôt pas ce point.
- **LP-QA-02, mineur : ouvert.** Le GET indépendant du 19 octobre confirme que `/NOTICE-VISUELS.md` répond 404. L'absence de notice publique reste au suivi ; pas de nouvel inventaire exhaustif ni inspection des liens de l'interface pour cette passe.
- **Avant un verdict final :** correction ou arbitrage explicite de LP-QA-01, et notice publique adaptée pour LP-QA-02, selon les décisions de DIRECTION. Ne pas rouvrir les lots techniques clos pour ces seuls constats hérités.
- Le Reviewer a établi **PUB-11-01, P2**, sur les URL absentes du candidat MIME (`CODE-REVIEW-portfolio.md`, bilan du 19 octobre, et `CODE-REVIEW-boutique-setup.md`). Cette preuve locale est attribuée au Reviewer, non à QA. Après correction et dépôt autorisé d'un artefact identifié : contrôler notamment `/css/inexistant.html`, `/js/inexistant.html`, `/assets/produits/inexistant.html`, `/css/inexistant.css`, ainsi que les vrais replis simples/imbriqués, les types des ressources et les octets servis. Ces chemins supplémentaires n'ont pas été demandés par QA aujourd'hui.
- Puis recette navigateur bornée au nouvel accueil/en-tête s'il est publié : quatre formats, zoom natif, image et replis, navigation/focus, accès catalogue et un parcours jusqu'à confirmation, console. Le GET de l'ancien accueil ne valide pas le nouveau rendu.

### Ce qui n'a pas été vérifié

Aucune interaction navigateur, console, responsive, zoom, image décodée ou mesure de performance nouvelle ; aucun rejeu des 80 variantes ni des pannes de stockage/réseau. Pas de comparaison complète des 83 fichiers publics ni d'identification Cloudflare. Les réponses correctes échantillonnées ne certifient pas le déploiement du correctif MIME. Aucun code, réglage ou déploiement effectué ; seuls les rapports QA sont modifiés dans le créneau documentaire.

---

## Verdict sur la version publiée — 12 octobre 2026

**Recette nominale favorable avec réserves pour la démo provisoire publiée. Aucun défaut bloquant du parcours nominal reproduit.** Le catalogue, les 80 références sélectionnables, le panier, les deux livraisons fictives et la confirmation unique passent dans les scénarios ci-dessous. Deux constats restent ouverts : **LP-QA-01, majeur, déjà connu** (fiche avec JSON retardé de 10 s) et **LP-QA-02, mineur** (notice détaillée des visuels non publiée). Ce résultat ne valide pas la direction artistique encore provisoire et ne constitue aucune autorisation de republication ou de mise en avant finale.

### Cible, date et correspondance effectivement vérifiée

- URL : https://ligne-posee.costa-simon30.workers.dev/ ; contrôles du **12 octobre 2026, environ 19 h 32–19 h 45, Europe/Paris**.
- Source auditée : **a03b365d34d61f8a56febea05af8d26f0f756a7e**, extraite dans une copie indépendante. Aucune différence sous `sites/boutique-setup/` entre cette copie et le SHA ; le main documentaire **fa9c06fc59c9ffe0fe50100bda5bd2761360ff94** ne diffère de cette source que dans `docs/DIRECTION.md`.
- Lectures : conventions actuelles, brief QA § 4, décisions des lots 1/2 et visuels/publication de Ligne Posée dans DIRECTION, contrats utiles des §§ 5–6 d'ARCHITECTURE. Les anciennes propositions architecturales sont subordonnées aux décisions produit plus récentes. Aucun rapport de l'Implémentation n'a servi de preuve de passage.
- Assemblage indépendant : `node scripts/assemble-site.mjs boutique-setup --environment production`, **Node 22.23.2**. Résultat : **84 fichiers, 1 120 258 octets**, empreinte agrégée **a16eb092e62207a6d1ffc51c317c28e8eaed7dd4f819dfbdc796a5da8c7ff631**, méthode annoncée `find . -type f | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256`. Un premier assemblage sous Node 24.21.0 avait donné la même empreinte ; le résultat retenu est celui réassemblé sous la version prescrite.
- Comparaison complète avec le dossier local destiné au dépôt : **84 chemins identiques, mêmes octets, aucun fichier supplémentaire**.
- Vérification HTTP indépendante de chaque chemin : les **83 fichiers publics récupérables**, après redirection normale des HTML, sont **identiques octet pour octet** à l'assemblage. `_headers`, 84e fichier, répond 404 comme prévu pour une configuration non consultable ; son contenu n'est pas récupérable depuis l'URL, mais les en-têtes observés portent bien `X-Robots-Tag: noindex, follow`.
- Version Cloudflare **cca19c6e : déclarée**, non relue dans le Dashboard par QA. L'identité des contenus publics est prouvée par leurs SHA-256 ; cela ne prouve pas indépendamment cet identifiant de gestion ni une absence absolue de tout chemin public non inventorié.

## Méthode et preuves

Chrome/Chromium **154**, contextes séparés, viewport CSS mesuré, clics, taps émulés, touches Tab/Entrée/flèches et lecture de `document.activeElement`. Les scénarios nominaux sont exécutés sur **l'URL HTTPS publique**, pas sur un serveur local. L'assemblage et la comparaison de paquet sont locaux. Les pannes sont injectées dans des contextes de navigateur QA isolés : interception des requêtes, fixtures de sessionStorage et refus contrôlé de lecture/écriture ; elles ne modifient ni le serveur ni les fichiers du site.

Preuves locales non versionnées : `/private/tmp/ligne-posee-qa-qYc3XN/`, dont `http-results.json`, `browser-results.jsonl`, scripts de mesure indépendants, 35 captures de la matrice et `contact-20-modeles.png`. Les résultats utiles sont transcrits ci-dessous pour rester lisibles lorsque les fichiers temporaires auront disparu. Seul ce rapport est ajouté au dépôt.

## Fonctionnel — testé et passé

### Catalogue, recherche, URL et fiches

- Inventaire indépendant : **20 modèles, 80 SKU uniques, 5 modèles et 20 SKU par famille** SUP/TAP/LUM/RAN ; quatre variantes par modèle. Les 80 prix ont été comparés aux bases et suppléments fixés dans le lot 1, sans écart.
- Catalogue public : **20 cartes, 20 images et 20 liens de fiche**, sans duplication. Recherche `  ECRAN   ` : **3 modèles** ; rechargement conserve les résultats. Supports : 5 modèles ; Supports + univers Signature OU Industriel : 3 ; ajout du plafond 50 € : **2**. Recherche sans résultat, effacement et restauration des 20 modèles passent.
- Les quatre tris ont été actionnés et leurs listes relevées : ordre éditorial, prix croissant/décroissant, nom. Les égalités de prix restent ordonnées par ID. Retour navigateur restaure l'étape de filtrage précédente. Paramètres de famille/univers/tri inconnus : avis visible, valeurs ignorées et résultats correspondant aux contrôles affichés.
- **20 fiches directes et 80 sélections réelles de radio** : SKU et prix affichés conformes à la référence choisie ; image du bon modèle chargée sur chacune. Exemples : LP-SUP-03-04 = 169 €, LP-TAP-03-03 = 84 €, LP-RAN-05-03 = 111 €.
- Rechargement de Graphite conserve LP-SUP-03-02 / 159 € ; départ vers le catalogue puis Retour conserve LP-SUP-03-04 / 169 €. Modèle inconnu, SKU inconnu et variante 99 donnent une explication sans ajout possible ni référence substituée silencieusement.

### Panier, livraison, simulation

Parcours rejoué à **320, 375, 768 et 1440 px** :

1. Ajouter LP-SUP-03-04 deux fois puis LP-TAP-03-03 : **deux lignes**, quantités 2 et 1, total produits **422,00 €**.
2. Quantités **1 et 99 admises** ; **0, 100, 1.5 et champ vide refusés avec message**, quantité enregistrée conservée. Rechargement conserve le panier. Le contrôle number empêche la saisie libre de texte ; ce test ne prétend pas avoir saisi une chaîne alphabetique dans un champ qui la refuse.
3. Standard : **4,90 €**, total **426,90 €** ; Express : **9,90 €**, total **431,90 €**, différence **5,00 €**. Modifier ensuite le panier et revenir au récapitulatif recalcule les produits et remet Standard par défaut : 3 × 169 € + 4,90 € = **511,90 €**.
4. Double activation de « Terminer la simulation » : une seule capture, panier vidé, mêmes SKU/finition/prix dans le récapitulatif. Recharger conserve la capture ; Retour sur commande présente le panier vide sans nouvelle validation possible. Arrivée directe en session neuve : « Aucune simulation terminée dans cet onglet ».
5. Retrait d'une ligne, panier vide, vidage annulé puis confirmé, réparation d'un panier illisible et retrait des lignes invalides passent. Une clé QA indépendante `qa-sentinel` est conservée : les actions n'ont pas effacé les autres données du contexte.

Mention de démonstration présente sur les sept pages ; récapitulatif et confirmation disent qu'aucune commande n'est envoyée et aucun paiement effectué. Aucun champ de nom/adresse/e-mail/téléphone/paiement, aucune requête non-GET pendant les parcours, aucun cookie observé ; une seule clé propre au site, `lignePosee.v2.etat`, dans les sessions nominales. Cela porte sur les comportements observés, pas sur les journaux de l'hébergeur.

## Résilience — résultats observés

| Scénario injecté | Résultat |
| --- | --- |
| JavaScript réellement désactivé | Sept pages × quatre largeurs : navigation et footer disponibles, 0 px de débordement ; catalogue statique des 20 noms, actions commerciales indisponibles, aucune réussite affichée. |
| Modules de page bloqués, JS global actif | Catalogue de repli et pages commerciales explicatives ; fiche indisponible, retours/footer disponibles. Fiche valide et invalide également rejouées avec mouvement réduit à 375 px. |
| Catalogue JSON en erreur réseau, mal typé (`modeles:null` puis `null`) | Liste de repli et explication ; sans catalogue fiable, pas de fiche/ajout ni de total/validation. Également testé avec un panier non vide. |
| sessionStorage refusé | Catalogue consultable ; ajout désactivé ; panier/commande indisponibles avec explication, pas de confirmation. |
| JSON de stockage illisible, quantité 100, SKU disparu/inconnu | Avis explicite, pas de total fiable ni de bouton de validation ; réparation/repartir d'un panier vide fonctionne sans toucher la clé témoin. |
| setItem refusé lors de la finalisation | Reste sur commande, erreur visible, panier inchangé, aucun succès. Retirer la panne et retenter produit une seule confirmation. |
| Images bloquées | « Visuel indisponible » sur catalogue et fiche, texte/actions restent utilisables. |
| Image retardée de 3 s | À 320 et 1440 px, cadre avant/après inchangé : respectivement 288×288 et 500×500 px, même position ; CLS global environ 0,0043 / 0,0027. |
| JSON retardé de 10 s | **En défaut : LP-QA-01**, mouvement connu reproduit aux quatre largeurs, avec mouvement normal et réduit. |

Le retard du module de fiche de 20 s n'a pas été rejoué dans cette recette ; les scénarios historiques BQ-04 clos ne sont pas déclarés revérifiés par substitution. Les erreurs console/réseau attendues dues aux pannes injectées ne sont pas classées comme erreurs spontanées de l'URL.

## Responsive et accessibilité

- **35 observations nominales** : sept pages à **320×568, 375×667, 768×1024, 1440×900**, plus **1920×1080**. Page panier/récapitulatif avec deux lignes en fixture ; fiche valide longue ; confirmation sans capture dans la matrice et avec capture dans les parcours. **0 px de débordement horizontal** dans les 35 cas ; pas de champ essentiel sans étiquette ni erreur console/réseau nominale.
- **Lien d'évitement** : premier Tab sur les sept pages aux cinq formats, Entrée transfère le focus réel à `main#contenu`. Contrôle complémentaire au premier plan : anneau bleu **3 px**, lien visible Y=8–57,6 px, focus réel au main après Entrée.
- **Parcours complet au clavier aux quatre largeurs** : Tab jusqu'au groupe de variantes, flèches 04→03→04, ajout par Entrée, quantité, lien panier/récapitulatif, livraison par flèche et fin de simulation par Entrée. Aucun piège reproduit.
- Retours d'ajout, quantité et livraison présents dans les zones d'annonce : notamment « Quantité mise à jour … 2 … 338,00 € » et « Livraison Express … 347,90 € ». Rôles status/aria-live et labels/radios/fieldset visibles contrôlés. L'écoute effective dans un lecteur d'écran n'a pas été testée.
- **Toucher émulé** : variantes → ajout → panier → livraison Express → confirmation à 320/375 px, total 178,90 € pour un SKU à 169 €. Ce ne sont pas des essais sur téléphone physique.
- Cibles essentielles échantillonnées : labels de variantes et bouton d'ajout **44 px de haut**, cases d'univers et bouton d'effacement également mesurés ; liens longs et cartes restent lisibles.
- Contrastes calculés sur couleurs réellement rendues des textes, aides, légendes et boutons de catalogue/fiche : **7,65:1 à 16,56:1** ; avis de fiction 15,11:1. Aucun défaut de contraste textuel dans cet échantillon. Cela n'est pas une certification WCAG/RGAA exhaustive.

### Zoom navigateur natif 200 % — effectivement testé

Chrome au premier plan, menu natif : **100 % → 200 % affiché par Chrome**, DPR **2 → 4**, fenêtre inchangée ; viewport CSS **1680 → 840 px** (hauteur observée environ 388 px avec les barres du navigateur). Ce test n'utilise pas un viewport émulé pour prétendre au zoom.

Accueil, catalogue, fiche, panier, récapitulatif, confirmation et vraie 404 imbriquée : **0 px de débordement**. Clics au premier plan : ajout du SKU à 169 €, quantité 2, récapitulatif Standard puis Express, fin de simulation **347,90 €**, retour depuis la 404 vers le catalogue. Contenus et actions restent atteignables. Zoom ensuite remis à 100 %, DPR 2 et largeur 1680 confirmés. Les quatre formats physiques distincts au zoom 200 % ne sont pas couverts par cette seule fenêtre desktop.

## Visuels et performance

- Contact-sheet des 20 modèles inspectée : les catégories d'objets correspondent aux modèles ; les 20 liens de fiche affichent le fichier attendu. Les images ne sont pas présentées comme une preuve des quatre variantes ; légendes « illustration générée / variantes non représentées » et alt décrivant l'objet vérifiés.
- Défilement du catalogue au clavier/molette navigateur : les **20 images** finissent chargées, dont les 14 dernières en lazy ; images carrées, tailles réservées. La mention d'illustration reste lisible à 320 px. Limite de la notice détaillée : LP-QA-02.
- Échantillon à **375×667, DPR 1**, contextes neufs/cache navigateur vide, HTTPS réel, **sans bridage CPU/réseau**, une lecture par page, observation environ 1,8 s après le chargement. D'autres contrôles QA tournaient sur le Mac : ce ne sont pas des mesures terrain ni un score Lighthouse.
  - Catalogue : **LCP 212 ms, CLS 0**, 13 entrées Resource Timing, somme transferSize **51 467 octets**, hors document HTML ; seules les six premières images chargées dans cette observation.
  - Fiche sup-03 : **LCP 284 ms, CLS 0,00454**, 11 entrées, **45 148 octets**, hors HTML ; favicon demandé deux fois dans ce passage.
- Ces résultats passent les cibles locales instrumentées, sans garantir le résultat sous réseau mobile lent. Polices système dans cette version : aucune police distante observée. Aucun runtime, image ou catalogue tiers nécessaire au parcours.

## Hébergement et SEO — HTTP réellement vérifié

- HTTPS accessible avec validation TLS standard des clients ; sept pages directes récupérées, MIME HTML. `.html` et slash final → **307** vers chemin sans extension, puis **200**, sans boucle ; paramètres de fiche conservés. Les ancres de contenu et liens de retour fonctionnent dans le navigateur.
- Vraies 404 sur `/inexistant-qa` et `/inexistant-qa/niveau` : **HTTP 404**, page personnalisée. Retour vers catalogue réellement cliqué depuis le chemin imbriqué.
- `robots.txt` : **200**, `User-agent: * / Allow: /`. Métas de toutes les pages de la matrice : **noindex, follow**. Tous les fichiers de la comparaison HTTP, ainsi que les erreurs/redirections contrôlées, servent **X-Robots-Tag: noindex, follow**.
- MIME observés cohérents : text/html, text/css, text/javascript, application/json, image/webp, image/svg+xml, text/plain.
- Cibles internes répondant toutes 404 : `/publication.json`, `/_headers`, `/docs/`, `/docs/DIRECTION.md`, `/sources/`, `/tests/catalogue.test.mjs`, `/CLAUDE.md`, `/.git/config`, `/sites/coiffeur-mixte/index.html`. Ce contrôle ciblé ne vaut pas inventaire exhaustif de tous les chemins possibles.
- Titres et descriptions propres aux pages, français déclaré, H1 et structure de titres des écrans contrôlés ; aucun besoin de balises d'offres marchandes ajouté à cette boutique fictive. L'absence de fichier public de notice est consignée ci-dessous.

## Anomalies ouvertes et recommandations

### LP-QA-01 — majeur — fiche : saut de contenu après un JSON très lent (déjà connu)

**Statut : reproduit, suivi antérieur maintenu ; aucune régression nouvelle alléguée.** Réserve mentionnée dans DIRECTION à la clôture du lot 1 puis aux publications provisoires.

**Reproduction :** contexte neuf, ouvrir `/produit?modele=sup-03`, module autorisé, retarder uniquement `data/catalogue.json` de **10 000 ms**. Relever le footer à 8,5 s puis après rendu de la fiche ; recommencer avec mouvement réduit.

| Viewport | Footer avant → après, Y viewport sans scroll | Déplacement | CLS normal/réduit |
| --- | --- | ---: | ---: |
| 320×568 | 742 → 1679 px | +937 px | 0,00348 |
| 375×667 | 652 → 1582 px | +930 px | 0,00454 |
| 768×1024 | 533 → 1070 px | +537 px | 0,00441 |
| 1440×900 | 517 → 1054 px | +537 px | 0,00267 |

**Impact :** à 375/768/1440 px, le pied déjà dans la zone de lecture change fortement de position ; à 320 px, il est devenu accessible par défilement avant de se déplacer. Le faible CLS ne prouve pas la stabilité des éléments déjà révélés. Pas de fausse commande ou perte de panier constatée.

**Recommandation :** définir un état d'attente/d'échec stable pour les données très lentes, puis éviter le remplacement tardif automatique d'un état déjà lisible ; conserver les sorties de navigation et offrir une relance volontaire. Le choix interne revient à l'Implémentation. Ce point reste non bloquant pour le maintien de la publication provisoire déjà autorisée et suivie dans DIRECTION ; il exige correction ou réserve explicitement acceptée pour un verdict final sans réserve.

### LP-QA-02 — mineur — notice détaillée des visuels absente de l'artefact public

**Reproduction :** comparer le manifeste et les 84 chemins assemblés ; aucune notice des visuels n'y figure. `/NOTICE-VISUELS.md` retourne **404** ; aucun lien de notice sur catalogue/fiche. La notice existe dans les sources, mais est omise de la sortie.

**Impact :** l'utilisateur voit bien que les illustrations sont générées et que les variantes ne sont pas représentées, mais ne peut consulter la provenance et les limites détaillées demandées au lot visuels. Aucun défaut des 20 images ni revendication d'affiliation constaté.

**Recommandation :** prévoir une notice publique courte, débarrassée des informations de suivi interne, déclarée dans le manifeste et liée depuis l'interface ; garder le document interne hors du paquet si nécessaire. **Non bloquant pour le parcours nominal de portfolio**, à traiter au prochain lot de publication autorisé.

## Limites et réserves explicitement non bloquantes

- Pas de Safari/Firefox, appareil tactile physique, lecteur d'écran réel, audit WCAG/RGAA exhaustif, mesure terrain ou réseau/CPU mobile bridé.
- Les variantes et tous les prix ont été contrôlés, mais pas les 80 SKU chacun dans un parcours complet jusqu'à confirmation ; celui-ci couvre deux références puis un parcours clavier/touch supplémentaire.
- Pas de permutation exhaustive de tous les filtres, ni de fuzzing exhaustif des URL/stockages ; cas nominal, erreurs identifiées et principales limites couverts.
- Module bloqué testé ; module pendant 20 s historique non rejoué. JSON à 10 s et images à 3 s réellement retardés ; aucune extrapolation à toute combinaison de pannes.
- La version Dashboard Cloudflare reste déclarative ; la correspondance des 83 contenus publics récupérables est, elle, démontrée.
- Identité graphique neutre et validation esthétique finale toujours différées ; ce rapport ne rouvre aucun arbitrage des autres sites et ne les a pas audités.
- Aucune correction, configuration Cloudflare ou publication effectuée pendant cette recette.

**Conclusion actuelle : démo publiée fonctionnelle et utilisable dans le périmètre testé, avec deux réserves tracées ; validation finale de mise en avant au portfolio toujours distincte.**

# Code review — portfolio

## Livraison examinée

Commit : 004218b9fcfcc49ec6fdee056d116c29b01af11d (main). Périmètre : mouvement du portfolio dans sites/portfolio, suppression de l’ancien script et référencement dans publication.json. Revue indépendante du diff GitHub et du code à cette révision ; aucun code corrigé ni déploiement.

## Corrections indispensables

### P1 — La navigation par ancre interne anime encore le groupe de destination

- Fichier/lignes : sites/portfolio/js/mouvement-sections.js:85, 95–112, 186–194.
- Fait démontré : le hash n’est consulté qu’à l’initialisation. Sur la page chargée sans fragment, après un défilement à scrollY=78 puis un clic sur le lien principal « Discutons de votre projet » (#contact), le groupe contact reste armé durant le défilement natif. Quand il entre dans le viewport (rect.top=639 pour une hauteur de 778 px), il passe à mouvement--revele avec une opacité calculée de 0,963884, donc en cours d’animation. Contrôle : un chargement direct avec #contact laisse ce groupe non armé et à opacité 1.
- Conséquence : le parcours par CTA principal ne respecte pas docs/DIRECTION.md §10, qui exige l’état final immédiat après accès par ancre ; mouvement et visibilité de la cible deviennent dépendants du chemin de navigation.
- Correction attendue : traiter aussi les changements de fragment et les clics d’ancres internes avant le défilement ; mettre immédiatement le groupe cible à son état final, y compris si la cible est un descendant du groupe, sans attendre l’IntersectionObserver. Vérifier les liens au clavier et la navigation retour/avant.

## Améliorations recommandées

### P2 — Le retard des cartes retarde aussi les couleurs de thème

- Fichier/lignes : sites/portfolio/css/style.css:760–774.
- Fait démontré : mouvement--retard-1 applique transition-delay: 60ms sans liste de propriétés ; dans Chrome, les deuxième et quatrième cartes de prestations héritent donc de 0,06s aussi pour background-color, border-color et color. Les première et troisième cartes restent à 0s. La durée de couleur de 0,14s donne une fenêtre théorique de 0,20s pour les cartes retardées ; le décalage est visible lors d’une bascule de thème.
- Conséquence : les cartes d’une même rangée ne changent pas de thème ensemble et dépassent la fenêtre couleur de 120–160 ms indiquée dans docs/DIRECTION.md §10.
- Correction attendue : réserver le retard à opacity/transform du mouvement d’entrée ; maintenir un délai nul pour les propriétés de thème.

## Contrôles et limites

Le diff ciblé et les conventions de main ont été lus. Assemblage de contrôle effectué sur une copie temporaire du commit : scripts/assemble-site.mjs portfolio --environment production s’achève avec code 0 et 18 fichiers ; dist/index.html référence le nouveau script, déclaré dans publication.json, et le fichier copié a le même SHA-256 que la source. Aucun ancien script n’est présent dans dist/js. Ce contrôle a utilisé Node 24.19.0, pas la version figée 22.23.2 : il ne démontre pas la compatibilité sous cette dernière. Reproduction navigateur sous Chrome en viewport de bureau ; pas de validation exhaustive mobile, zoom, lecteur d’écran ou hébergement.

Verdict : livraison non validée en l’état à cause du P1, qui contrevient à un critère explicite du périmètre. Le P2 n’est pas bloquant isolément. Aucun autre défaut n’est affirmé sur la base des contrôles réalisés.

---

## Revue ciblée du commit 4f9f192fcde5b68cd87de3b687537518cfc582d7 — 5 octobre 2026

Périmètre : remplacement du mouvement par seuil réversible, uniquement sites/portfolio/css/style.css, sites/portfolio/index.html et sites/portfolio/js/mouvement-sections.js. Le constat ci-dessous porte sur ce commit, pas sur le rapport historique ci-dessus. Référence : décision produit et § 10 de docs/DIRECTION.md à cette révision.

### Défaut démontré — P2 : le resize masque un groupe avec une animation de sortie

- Fichier/lignes : sites/portfolio/js/mouvement-sections.js:210–225 (resynchroniser appelle masquer), 148–155 ; sites/portfolio/css/style.css:782–786 (opacity 0 et transition de sortie 300 ms).
- Reproduction : servir la copie isolée du commit comme racine du site ; dans Chrome à 1680 × 778, descendre à scrollY=778 : Réalisations est révélé, son titre est à environ 273 px du haut. Ne plus défiler et réduire seulement la hauteur du viewport à 300 px. La classe defilement--armee est ajoutée ; l’opacité calculée a été observée à 0,953892 pendant la sortie puis à 0. Le titre est encore au bord du viewport (environ 274 px avant translation, 297 px après) ; aucun nouveau scroll n’a déclenché cette sortie.
- Impact : un changement de hauteur/zoom peut faire disparaître progressivement un groupe que l’utilisateur vient d’atteindre, indépendamment d’un franchissement par défilement. Cela contredit le principe de déclenchement par scrollY du § 10 et le commentaire même de resynchroniser, qui promet un état immédiat sans animation sur resize. Le groupe n’est pas supprimé du DOM et redevient accessible en défilant : gravité P2, non bloquante isolément.
- Correction attendue : lors de la resynchronisation, appliquer aussi l’armement sans transition, ou conserver provisoirement visible un groupe déjà atteint et attendre un véritable franchissement en remontant ; préserver le verrouillage du focus.

### Vérifications et limites de cette passe

- Diff GitHub et fichiers au commit exact vérifiés : trois fichiers modifiés dans sites/portfolio/, aucun changement à shared/, au manifeste ou à Créa’Tif. Les quatre groupes attendus sont bien portés par les conteneurs ; Hero et À propos restent sans classe de mouvement. Syntaxe du script validée par node --check. Assemblage de la copie temporaire en production : code 0, 18 fichiers ; Node 24.21.0, pas la version figée 22.23.2.
- Chrome local, 375 × 667 : les groupes hors champ sont initialement armés ; clic réel sur le CTA #contact, groupe contact immédiatement sans classe armée et à opacité 1, avant la fin du défilement natif ; en fin de navigation, footer également visible. Par Tab, « Voir la démo » passe à l’état final au focus ; le lien e-mail aussi. En remontant depuis le bas, les groupes sont réarmés ; un second passage les révèle. Ces observations ne prouvent pas tous les seuils ou navigateurs.
- Repli sans JS et mouvement réduit : la règle CSS de base est opaque et la media query reduce impose opacity 1, transform none, transition none ; inspection statique seulement, sans désactivation réelle du script ni bascule de préférence système pendant cette passe. Pas de validation exhaustive à 320/768/1440 px, zoom natif 200 %, restauration d’historique ou hébergement. Aucun défaut significatif supplémentaire n’est affirmé sans reproduction.

Verdict de code review pour 4f9f192 : un P2 confirmé, aucune anomalie bloquante démontrée dans le périmètre testé. Correction recommandée avant de déclarer l’effet pleinement conforme au § 10 ; validation visuelle finale et scénarios non testés restent à QA/Simon. Aucun code corrigé, aucun déploiement.


---

## Bilan et revue ciblée MIME — 19 octobre 2026 — source f66274f

**Verdict borné : un P2 démontré dans les règles MIME des URL inconnues ; correctif non entièrement validé pour les véritables 404. Aucun P0/P1 nouveau démontré.** Source exacte examinée : f66274fa0c9915846722824421284716358a8e1a, contre son parent. Ce rapport principal couvre aussi l'outillage utilisé par Ligne Posée ; son bilan propre figure dans CODE-REVIEW-boutique-setup.md. Aucune correction du code, aucun déploiement ni réglage Cloudflare effectué par le Reviewer.

### État livré, historique et publication

Git contient le portfolio à trois onglets, dont Ligne Posée, et l'activation contentTypeRules dans son manifeste. Les constats historiques d'ancre et de délai des couleurs ne sont pas rouverts : QA les a clos sur a51f11a. Le P2 de sortie animée au redimensionnement documenté sur 4f9f192 reste au suivi : aucune clôture indépendante retrouvée et script mouvement-sections.js inchangé entre cette source et f66274f. Ce comportement n'a pas été rejoué en navigateur pendant ce bilan ; il n'est pas présenté comme une nouvelle reproduction. Réserves de zoom natif, CLS initial, Preview URLs, HTTP sans redirection et MIME WOFF2 : conserver les décisions existantes, sans nouvelle condition générale de clôture. Références : présent rapport historique ; QA-portfolio.md, recette du 5 octobre et contre-vérification du 25 septembre.

Le relevé du 18 octobre transmis par Simon rapporte une restauration du portfolio vers la version Cloudflare 4ef728e4 et le retrait des versions efe27a81/b7291ef2/7b4663b4 concernant l'incident des deux sites. Il ne prouve pas l'état actuel. Le Chef de projet a ensuite transmis un contrôle HTTP de QA : le HTML du portfolio contient TROIS onglets et correspond à 506211f/f66274f ; l'accueil Ligne Posée correspond à a03b365. Ces contrôles sont attribués à QA, non exécutés par le Reviewer. Ni version Cloudflare actuelle ni identité complète de l'artefact servi ne sont identifiées par ces seuls éléments. Le HTML commun ne démontre pas que les règles MIME de f66274f sont déployées. Aucune reproduction HTTP du candidat MIME n'est prouvée. Les journaux DIRECTION doivent conserver ces distinctions et dater les restaurations comme un relevé historique.

### P2 — PUB-11-01 : des motifs MIME se recouvrent sur les URL de 404

**Localisation à f66274f :** scripts/assemble-site.mjs:917 ajoute /*.html ; lignes 926–938 ajoutent des motifs de dossier tels que /css/* et /js/* ; lignes 948–955 ne vérifient l'unicité que sur urlsAttendues, dérivées du plan des fichiers déclarés. Les tests ajoutés dans scripts/verif-assemblage.mjs:994–1166 contrôlent les URL déclarées, pas cette matrice d'URL absentes.

**Reproduction indépendante :** extraire les objets Git de f66274f dans une copie temporaire hors dépôt, assembler portfolio et boutique-setup en production, lire les blocs Content-Type des fichiers dist/_headers. Pour un motif exact, comparer la chaîne à l'URL ; pour un motif contenant *, comparer le préfixe et le suffixe, sans appeler motifCorrespond du générateur. Les chemins contenant « inexistant » sont absents des deux inventaires ; /404 et /404.html servent de contrôles positifs. Résultats observés :

| URL demandée | Portfolio | Ligne Posée |
| --- | --- | --- |
| /css/inexistant.html | Deux règles : HTML et CSS | Deux règles : HTML et CSS |
| /js/inexistant.html | Deux règles : HTML et JavaScript | Deux règles : HTML et JavaScript |
| /assets/produits/inexistant.html | Une règle HTML | Deux règles : HTML et WebP |
| /css/inexistant.css | Une règle CSS | Une règle CSS |
| /inexistant | Aucune règle Content-Type | Aucune règle Content-Type |
| /inexistant/imbrique | Aucune règle Content-Type | Aucune règle Content-Type |
| /404 et /404.html | Une règle HTML chacune | Une règle HTML chacune |

**Impact et portée de preuve :** l'ambiguïté du fichier généré est démontrée. Selon la documentation Cloudflare, les règles suivent la requête entrante, plusieurs correspondances se cumulent et les valeurs d'un même en-tête sont jointes par une virgule. En mode 404-page, un chemin absent sert le contenu du 404.html le plus proche. Les motifs ci-dessus peuvent donc typer ce contenu HTML comme CSS/JavaScript/WebP, ou avec plusieurs types. L'effet final HTTP et navigateur n'a pas été reproduit sur un déploiement de f66274f : ce n'est pas une panne actuellement observée sur les sites publics. Sources officielles consultées le 19 octobre : [en-têtes Workers](https://developers.cloudflare.com/workers/static-assets/headers/), [404 personnalisées](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/#custom-404-pages).

**Correction attendue :** éliminer les recouvrements pour les URL absentes, notamment les motifs englobants de ressources, puis vérifier ces URL avec une vraie réponse 404. Préserver le typage des ressources existantes et l'isolation des sites sans activation. Ne pas ajouter un Content-Type HTML global sur /* : il se cumulerait avec les types des ressources.

**Limite distincte — 404 sans règle :** les règles /404 et /*.html ne couvrent pas /inexistant ou /inexistant/imbrique. Le correctif n'y impose aucun type ; il dépend encore des métadonnées du fichier 404 téléversé. Cela ne prouve pas que ces réponses téléchargent actuellement la page : le MIME effectif de ce candidat n'a pas été contrôlé sur hébergement. Sécuriser le type de l'asset 404 lors du dépôt et vérifier le repli réel ; ne pas présenter le seul accès direct /404 comme une preuve suffisante.

### Assemblages indépendants, non-régression et conditions exactes

Windows, Node v24.19.0 ; .node-version fixe 22.23.2. Tous les builds ont été exécutés dans des copies temporaires hors du dépôt. Les comparaisons retenues utilisent git -c core.autocrlf=false archive pour extraire les octets sources sans conversion des fins de ligne. Un premier export avec le réglage local core.autocrlf=true avait produit des poids différents ; il n'est pas utilisé pour identifier les candidats. Parent et correctif ont été assemblés chacun en production et preview, soit 16 assemblages réussis pour les quatre sites. Les SHA-256 individuels ont été comparés pour chaque mode ; seules les deux sorties _headers des sites activés changent.

| Site, source f66274f | Production : fichiers / octets | Diff avec le parent, production ET preview |
| --- | --- | --- |
| Portfolio | 21 / 308673 | _headers uniquement |
| Ligne Posée | 84 / 1122438 | _headers uniquement |
| Créa'Tif | 42 / 1274859 | Aucun octet différent |
| La Tablée des Forges | 31 / 880174 | Aucun octet différent |

Empreintes de production indépendamment retrouvées, méthode : SHA-256 de chaque fichier, liste triée par chemin avec lignes « empreinte  ./chemin » terminées par LF, puis SHA-256 de cette liste. Portfolio : 4e254e681495302a9638691c5cbe388cfb995fdbf8dd2b098bad0566fe7227c5 ; Ligne Posée : 9895d746ffba78768d4eb281868e9938772bcc930e8e5a666d9381ce90a0bff5. Elles correspondent aux candidats rapportés, sans preuve de leur publication. Le preview du portfolio diffère normalement du mode production par sa politique d'indexation : 21 fichiers, 308583 octets, empreinte 86dfc2d248f376fc72991fbe7852caf0e85c59beb7e30549cff12d83ffb78bcb. Ligne Posée est identique dans les deux modes.

### Suite fournie : 89/97, et limites

La suite non modifiée a été lancée dans une copie temporaire issue de git archive avec le réglage local core.autocrlf=true, sous Node 24.19.0 avec --runtime-alternatif. Résultat : 89 réussites, 8 échecs, code 1. Les sept nouveaux contrôles MIME passent. Sept échecs concernent les fixtures de liens symboliques ; une sonde indépendante de création de lien dans le temporaire renvoie EPERM dans ce sandbox Windows. Le huitième est l'auto-test concurrent, dont les deux enfants rendent 1. **Sa cause n'a pas été isolée : elle n'est pas attribuée aux liens symboliques.** Les injections d'assembleur en échec, muet et muet après succès sont déclarées réussies par la suite, mais le seul code non nul d'un enfant déjà en défaut ne suffit pas à établir indépendamment toute leur efficacité.

Ce passage n'est ni un 97/97 ni un rejeu de référence sur Node 22.23.2. Les échecs ne démontrent pas à eux seuls une régression des protections historiquement closes. Rejouer la suite sur le runtime figé dans un environnement permettant ses fixtures, puis isoler toute anomalie qui persiste. Aucun test fonctionnel navigateur, aucune campagne multi-navigateurs, aucun contrôle HTTP ou Dashboard par le Reviewer pendant cette passe. Les temporaires ne sont pas des preuves durablement versionnées ; les scénarios et résultats utiles sont consignés ici.

### Actions nécessaires par priorité

1. Avant clôture de PUB-11 : corriger le P2 de recouvrement MIME, sécuriser et contre-vérifier le véritable repli 404 ; rejouer les contrôles sous le runtime figé. Aucun déploiement implicite.
2. Réconcilier les journaux avec le relevé de restauration du 18 octobre et les observations HTTP ultérieures de QA, sans déduire une version Cloudflare ni un paquet complet depuis le seul HTML.
3. Garder le P2 historique de redimensionnement et les réserves acceptées au suivi. Aucune nouvelle revue générale des sites déjà clos n'est demandée par ce bilan.

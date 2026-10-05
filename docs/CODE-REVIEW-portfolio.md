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


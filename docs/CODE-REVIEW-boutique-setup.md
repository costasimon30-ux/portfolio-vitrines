# Code review — Ligne Posée, lot 1

Source examinée : commit 2f98eea1dec3d0f67f90d23e830c89c92894661b, uniquement sites/boutique-setup/. Revue indépendante du code et de la sortie assemblée ; aucun correctif ni déploiement.

## Verdict et preuves de référence

Le catalogue livré est cohérent avec le brief : 4 familles, 5 modèles et 20 SKU par famille, donc 20 modèles et 80 SKU uniques. Les trois prix témoins du brief valent 169 €, 84 € et 111 €. Un accès direct à la fiche sup-03/04 affiche le bon libellé, SKU et prix ; passer à la variante 01 synchronise ces trois valeurs et l’URL. La recherche, les filtres et le tri ne présentent pas de défaut confirmé dans les cas vérifiés. Les 23 tests fournis passent sous Node 22.23.2, mais ne couvrent pas les contre-exemples ci-dessous. L’assemblage preview puis production, dans une copie temporaire à la révision ciblée et sous Node 22.23.2, réussit : 16 fichiers dans chaque sortie, aucune dépendance réseau métier ou fichier de test publié. Ces succès ne valident pas les garde-fous sur des données futures ou corrompues.

## Défauts reproduits

### BQ-01 — P1 — Un prix métier invalide passe le contrôle bloquant

Fichier : sites/boutique-setup/js/catalogue-core.js, lignes 146–160 et 181–191.

Scénario : dans une copie en mémoire du JSON livré, remplacer uniquement le prix de LP-SUP-03-04 (16900 centimes attendus) par 1 centime, puis appeler validerCatalogue. Résultat observé sous Node 22.23.2 : ok=true, aucune erreur, prixMinCents du modèle sup-03 = 1. Le site afficherait donc « À partir de 0,01 € » et la fiche ce SKU à 0,01 €, malgré le contrat de prix base + supplément et le principe selon lequel la variante 01 fixe le prix de départ. Le jeu livré lui-même est correct ; le défaut concerne le contrôle censé refuser un catalogue invalide.

Impact : une erreur éditoriale dans la donnée locale devient un faux prix accepté et, au lot 2, pourrait contaminer panier et récapitulatif. Correction attendue : vérifier pour chaque variante le prix prescrit par le modèle et le supplément de famille, ainsi que l’invariant variante 01 = minimum, avant de construire les index ; couvrir au moins une mutation de prix par test négatif.

### BQ-02 — P2 — La recherche écrase une étape de l’historique des filtres

Fichier : sites/boutique-setup/js/page-catalogue.js, lignes 116–124 et 148–154.

Scénario reproduit dans le dist servi seul : ouvrir catalogue.html (20 modèles), choisir la famille Supports (URL ?famille=sup, 5 modèles), saisir « bras » (URL ?q=bras&famille=sup, 1 modèle), puis utiliser Retour du navigateur. Résultat observé : retour à l’URL sans filtre et à 20 modèles, au lieu de l’étape Supports à 5 modèles. Le gestionnaire de recherche utilise replaceState et remplace ainsi l’entrée créée par pushState lors du filtre.

Impact : le retour navigateur ne restaure pas l’état précédent pourtant créé par l’interface ; le parcours des filtres devient imprévisible. Correction attendue : conserver une entrée d’historique pour l’état validé avant la recherche, tout en évitant une entrée par frappe, puis tester filtre → recherche → Retour → Avancer dans un navigateur.

### BQ-03 — P2 — Un JSON mal formé peut faire lever la validation au lieu d’activer le repli explicatif

Fichiers : sites/boutique-setup/js/catalogue-core.js, lignes 79–84 et 118–123 ; js/dom.js, ligne 40 ; js/page-produit.js, lignes 193–201.

Scénario reproduit sous Node 22.23.2 : remplacer dans une copie en mémoire l’identifiant du premier modèle par un objet JSON {"toString":null}, puis appeler validerCatalogue. Résultat observé : TypeError « Cannot convert object to primitive value », et non {ok:false, erreurs}. L’expression régulière convertit l’objet avant qu’une vérification de type ne l’écarte. Le chargeur appelle ce validateur sans interception et la fiche attend son résultat avant son bloc try.

Impact : pour ce fichier mal formé, l’erreur d’initialisation n’active pas le message « catalogue indisponible » prévu ; sur la fiche, la zone de chargement risque de rester réservée. La sortie actuelle n’est pas affectée, et ce scénario exige une corruption du JSON. Correction attendue : contrôler les types avant toute conversion implicite et garantir que chargerCatalogue transforme également une exception de validation en résultat d’échec ; tester un objet d’identifiant mal typé.

### BQ-04 — P2 — Une URL de fiche invalide provoque un grand saut de mise en page

Fichiers : sites/boutique-setup/css/style.css, lignes 324–326 et 375–376 ; js/page-produit.js, lignes 193–211.

Scénario reproduit sur l’artefact local à 1680 × 833 px, avec le seul JSON retardé de trois secondes par le serveur de test : ouvrir produit.html?modele=inconnu. Avant la réponse, fiche-zone mesure 608 px et le haut du footer est à 1039,8 px. Après affichage de « Modèle introuvable », fiche-zone mesure 85,2 px et le footer est à 517,0 px : remontée mesurée de 522,8 px. La règle de hauteur minimale de chargement disparaît également pour les autres états d’erreur courts.

Impact : fort déplacement visuel lors du chargement lent d’un lien de fiche erroné ; une interaction ou une position de lecture peut être déplacée. Correction attendue : réserver une hauteur adaptée aux états courts ou conserver la place jusqu’à une transition de mise en page maîtrisée, puis mesurer sur URL valide et invalide avec données retardées.

## Limites, risques non retenus et passage au lot 2

Aucun défaut actuel d’unicité, de correspondance catalogue → fiche, de prix des 80 SKU livrés ou de ressource sortante n’a été démontré. Le repli statique du catalogue contient les 20 noms et les quatre familles, mais la navigation avec JavaScript désactivé et un audit clavier multi-navigateurs n’ont pas été rejoués ici. Les réponses HTTP d’un futur hébergement ne sont pas évaluées ; aucun déploiement n’a été effectué. Ces limites ne sont pas des défauts présumés.

Avant de fonder le panier du lot 2 sur ce catalogue, corriger BQ-01 et BQ-03 : ce sont les deux failles du contrat de validation réutilisé en aval. BQ-02 et BQ-04 sont des écarts du lot 1 à corriger, mais ne justifient pas une refonte ni ne conditionnent techniquement le démarrage du lot 2.


## Contre-vérification ciblée du correctif 711f130 (8 octobre 2026)

Périmètre : BQ-01 à BQ-04 uniquement, source GitHub 711f130eed523fb0a35e5f5e4a7f2826383e3c76. Rejeu indépendant dans une copie temporaire, sous Node 22.23.2 ; aucun fichier du site modifié, aucun déploiement. Les 31 tests fournis passent (31/31), mais le verdict ci-dessous repose aussi sur les mutations et parcours séparés. Assemblage preview : 16 fichiers. Comparaison JSON avec 2f98eea : les 80 objets `references`, donc leurs SKU et prix, sont strictement inchangés.

| Point | Statut | Preuve et décision |
| --- | --- | --- |
| BQ-01 | Résolu | `catalogue-core.js:159-160,195-215`. Avec la seule valeur de LP-SUP-03-04 à 1 centime, `validerCatalogue` renvoie `ok:false` (16900 attendus). Même refus en ajoutant ou retranchant 1 centime à LP-TAP-01-01 ; le JSON livré reste valide. Les 80 références et les prix témoins 169/84/111 € sont inchangés. |
| BQ-02 | Résolu dans le scénario demandé | `page-catalogue.js:116-179,193-198`. Dans le dist servi : 20 modèles sans filtre → Supports, 5 → recherche « bras », 1 → Retour à Supports, 5, champ vide et URL `?famille=sup` → Avancer à « bras », 1, URL `?q=bras&famille=sup`. Résultat identique avec remplissage direct et frappe caractère par caractère ; un seul Retour suffit, donc pas d’entrée par caractère dans ce parcours. |
| BQ-03 | Résolu | `catalogue-core.js:107-115,154-155` et `dom.js:40-45`. Premier identifiant de modèle remplacé par `{"toString":null}` : échec contrôlé sans exception. Avec ce JSON servi au navigateur, le catalogue affiche « Catalogue indisponible » et la fiche « Fiche indisponible » ; aucune carte/fiche avec prix exploitable. |
| BQ-04 | Partiellement résolu ; clôture du lot 1 en attente | `produit.html:12,56` ; `style.css:326-334,387-388` ; `page-produit.js:198-218`. Voir mesure et réserve ci-dessous. |

BQ-04, mesure indépendante : seul `data/catalogue.json` a été retardé de 3 s. À 320/375/1440 px (hauteur 833), le CLS instrumenté sur fiche valide `sup-03` est respectivement 0,00389 / 0,00470 / 0,00396 ; sur fiche invalide `modele=inconnu`, aucune entrée de décalage n’a été enregistrée (0 observé). Haut du footer invalide avant→après : 786,36→760,77 px / 651,77→651,77 px / 516,98→516,98 px. L’erreur « Modèle introuvable » est lisible, sans espace final disproportionné. Sur la fiche valide, le footer change encore de position géométrique (environ +818/+767/+543 px), mais reste invisible pendant l’attente et ne devient visible qu’à sa position finale. Ces chiffres concernent Chrome local, pas l’hébergement.

**Réserve BQ-04 — P2, indisponibilité des liens en mode mouvement réduit si le module est bloqué.** Scénario : navigateur avec JavaScript activé et `prefers-reduced-motion: reduce`, mais requête `js/page-produit.js` bloquée (CSP, filtre ou erreur réseau). La classe `fiche-attente` est inscrite dans le HTML ; `@media (scripting: enabled)` cache `.fiche-suite` et `.site-footer`. Le seul filet CSS est l’animation différée de 8 s, annulée par la règle `animation: none !important` en mode mouvement réduit ; le minuteur JS ne démarre pas. Conséquence : liens de retour et pied de page demeurent invisibles et non accessibles, en contradiction avec le critère de repli. Le blocage du module a été reproduit en navigateur sans mouvement réduit : ils sont cachés au départ puis visibles à 8 s. La combinaison avec mouvement réduit est déduite de la cascade CSS, non rejouée dans un navigateur émulant cette préférence. Correction attendue : rendre le repli indépendant d’une animation que la préférence utilisateur annule, puis rejouer script bloqué avec et sans mouvement réduit. Éviter également de laisser les liens indisponibles 8 s quand le module échoue.

**Verdict.** BQ-01 et BQ-03, prérequis techniques du panier, sont clos : le lot 2 peut être engagé selon `docs/DIRECTION.md`. BQ-02 est clos dans son scénario. BQ-04 reste à traiter avant clôture du lot 1 et toute publication ; aucune revue esthétique, du panier ou des autres sites n’a été menée. Les chiffres CLS sont des mesures locales instrumentées, non des mesures HTTP sur un futur hébergement.

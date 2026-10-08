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

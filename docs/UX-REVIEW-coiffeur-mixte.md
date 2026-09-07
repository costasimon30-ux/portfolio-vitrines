# Revue UX — Créa’Tif

**Date :** 7 septembre 2026

**Commit observé :** `9f601636ce459d3cc78ab3951a27222abb1975d0` sur `main`, après `git pull`.

**Livraison contrôlée :** `9f60163`.

**Référence :** dernière réserve P2 de la revue `ac3b054` — hauteur du hero Coiffure sur tablette.

## Verdict explicite

**Validation finale du rendu accordée pour un portfolio conceptuel sans photos.**

La dernière réserve UX est **levée** : le hero Coiffure adopte le cadrage horizontal 3:2 demandé sur tablette, sans dégrader le petit mobile ni la composition desktop. Les deux autres retouches avaient déjà été validées dans la revue précédente.

**Aucune nouvelle correction artistique ni recherche photographique n’est demandée.** Le projet peut être présenté comme un concept de salon fictif avec ses compositions graphiques actuelles. Cette validation porte sur le rendu UI/UX ; elle ne remplace pas la QA fonctionnelle ni l’arbitrage final de Simon.

## Périmètre et méthode

Contre-vérification limitée au hero de la page Coiffure et à sa transition vers « Partir de vous ». Inspection du site réellement affiché en navigateur local à **375, 768 et 1440 px**, avec les polices locales chargées. Hauteur de fenêtre : 900 px sur mobile/tablette et 960 px sur desktop.

Les dimensions ci-dessous sont celles du **visuel décoratif**, pas de la section hero entière. Elles ont été mesurées dans le rendu, en complément de l’inspection visuelle. Un contrôle du ratio aux bornes 599/600 et 899/900 px complète les trois formats demandés.

## Résultats du hero Coiffure

| Largeur de fenêtre | Visuel mesuré | Ratio rendu | Verdict |
| --- | --- | --- | --- |
| 375 px | 312 × 390 px | 4:5 | Petit mobile préservé ; mêmes dimensions que lors de la revue précédente |
| 768 px | 705 × 470 px | 3:2 | Retouche validée ; cadrage horizontal et proportion attendue obtenus |
| 1440 px | Environ 490 × 653 px | 3:4 | Desktop préservé ; mêmes dimensions et composition latérale équilibrée |

- **À 375 px :** le texte précède le visuel, les deux CTA restent lisibles et la composition verticale conserve son équilibre.
- **À 768 px :** la hauteur du visuel passe d’environ 881 à **470 px**, soit **411 px de moins** (environ 47 %). Les bandes Pêche / Sable restent identifiables dans le cadrage horizontal. Le visuel ne monopolise plus presque un écran entier après les CTA ; l’enchaînement vers « Partir de vous » est nettement allégé.
- **À 1440 px :** le texte et le visuel restent côte à côte. La hiérarchie, les espacements et les CTA du hero sont préservés.

**Bornes confirmées dans le rendu :** ratio 4:5 à 599 px, 3:2 à 600 et 899 px, puis retour au ratio desktop 3:4 à 900 px. Le cadrage horizontal est donc bien appliqué dans la plage demandée.

Aucun défilement horizontal constaté sur Coiffure aux trois largeurs principales. Les polices locales Cormorant Garamond et DM Sans sont chargées (`loaded`) ; aucun titre tronqué, chevauchement ou libellé de CTA coupé n’est observé dans le hero.

## Clôture des réserves

| Réserve | Statut | Référence de validation |
| --- | --- | --- |
| P1 — Distinction des cartes d’univers sur l’accueil | Clôturée ; validation antérieure conservée, non réauditée ici | Revue `ac3b054` |
| P1 — Répétition des motifs | Clôturée ; validation antérieure conservée, non réauditée ici | Revue `ac3b054` |
| P2 — Hauteur du hero Coiffure sous 900 px | Clôturée par cette contre-vérification | Livraison `9f60163` |

**Bilan : les trois réserves de finition sont clôturées. Rendu final validé pour le portfolio conceptuel sans photographies ; aucune suite corrective UI/UX demandée dans ce périmètre.**

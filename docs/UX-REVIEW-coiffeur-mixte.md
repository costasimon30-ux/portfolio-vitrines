# Revue UX — Créa’Tif

**Révision observée :** `main` au 5 septembre 2026 — dernière évolution visuelle du site : `e2187ce`

**Périmètre :** rendu réel des quatre pages à 375, 768 et 1440 px. Revue UI/UX et direction artistique uniquement ; elle ne remplace pas l’audit QA.

## Décision

**Les photographies ne sont pas nécessaires pour valider ce projet de portfolio front-end.** Les compositions CSS sont maintenant suffisamment intentionnelles, honnêtes et différenciées pour assumer un salon fictif : elles ne cherchent plus à se faire passer pour des réalisations, des portraits ou un lieu réel.

La direction graphique provisoire est donc **validable**. En revanche, je ne considère pas encore le rendu comme une finition portfolio définitive : deux corrections de composition sont nécessaires pour supprimer la sensation de motif répété. Elles ne demandent pas de photo ; elles demandent une meilleure attribution des visuels existants.

Pour un futur site commercial de salon, les photos redeviendraient indispensables afin de prouver le savoir-faire et le lieu. Ce n’est pas une condition pour ce concept de portfolio.

## Rendu réellement vérifié

| Viewport | Accueil | Coiffure | Barbier | Le salon |
| --- | --- | --- | --- | --- |
| 375 px | Conforme, menu compact et composition lisible | Conforme, mais hero trop dominant | Conforme | Conforme |
| 768 px | Conforme, aucun débordement | Conforme, mais hero très haut | Conforme | Conforme, débordement précédent supprimé |
| 1440 px | Conforme, hero équilibré | Conforme | Conforme | Conforme |

À ces trois largeurs, les quatre pages ne présentent aucun défilement horizontal. Les compositions restent nettes et les contenus conservent une hiérarchie claire.

## Ce qui est désormais réussi

- Les motifs ne simulent plus des photos : l’interface annonce clairement un projet de direction artistique, sans fausse équipe, galerie ou carte réelle.
- **Coiffure** possède une personnalité douce et fluide : Pêche, Sable et lignes obliques portent bien l’idée de mouvement et de nuance. Son parcours « Partir de vous » donne un rythme empathique et plus conversationnel.
- **Barbier** est clairement distingué sans tomber dans le rétro : le fond Encre, l’arc Ivoire, les lignes Sauge et le point Cuivre créent une précision contemporaine. La liste éditoriale, les trois étapes et l’encadré « Entre deux visites » le séparent réellement de Coiffure.
- **Le salon** est le plus sobre et architectural ; la composition fenêtre / miroir convient à la page d’informations pratiques.
- L’identité transversale tient très bien : Ivoire, Encre, Cuivre, Cormorant Garamond et DM Sans conservent une même qualité calme et premium.
- Le contact fictif est maintenant présenté sans action trompeuse. Visuellement, le bloc reste crédible et explicite.

## Points à corriger avant de qualifier le rendu de final

### P1 — Les deux cartes d’univers de l’accueil sont visuellement identiques

Dans le point d’entrée « Deux univers », les cartes Coiffure et Barbier reprennent toutes deux la composition de l’accueil. À 375 px, elles sont indiscernables avant lecture de leur titre : le visiteur ne perçoit pas immédiatement les deux sensibilités que les pages internes réussissent ensuite à installer.

**Recommandation :** attribuer aux cartes un recadrage ou un détail de leur univers propre : rubans Pêche / Sable pour Coiffure, fond Encre / arc Ivoire pour Barbier. Elles doivent rester compactes et ne pas réutiliser les heroes complets.

### P1 — Réemploi excessif de certaines compositions

L’accueil répète la même composition cinq fois (hero, deux cartes, deux blocs éditoriaux) et la page Le salon trois fois (hero, éditorial, informations pratiques). À force, les compositions perdent leur rôle de ponctuation et redeviennent des remplissages. Ce défaut est particulièrement perceptible sur mobile, où les grandes surfaces graphiques allongent inutilement le parcours.

**Recommandation :** conserver une composition forte dans le hero et, au plus, une reprise secondaire justifiée. Supprimer les reprises restantes ou les remplacer par de l’espace, une séparation typographique ou un détail très recadré. La page Contact n’a pas besoin d’un troisième grand motif pour être comprise.

### P2 — Le hero Coiffure est trop haut sous 900 px

La composition Coiffure est rendue au ratio 3:4 : 312 × 416 px à 375 px, puis 705 × 940 px à 768 px. Elle occupe ainsi presque un écran complet de tablette après le texte, alors que son motif de rubans n’a pas besoin de cette surface pour être compris. Elle alourdit le parcours et déséquilibre visuellement Coiffure face aux trois autres pages.

**Recommandation :** rapprocher le hero du ratio 4:5 prévu par la direction, ou le recadrer en format horizontal sous 900 px. Réserver le format plus vertical au module éditorial si celui-ci est conservé.

## Verdict par univers

| Élément | Décision |
| --- | --- |
| Direction commune Créa’Tif | Validée |
| Compositions provisoires sans photos | Validées pour un portfolio conceptuel |
| Distinction Coiffure / Barbier dans les pages dédiées | Validée |
| Distinction Coiffure / Barbier dès l’accueil | À corriger |
| Répétition des motifs | À corriger |
| Ajout de vraies photos avant présentation portfolio | Non requis |

## Priorités pour Claude

1. Différencier les deux cartes d’univers de l’accueil avec des détails de composition propres à Coiffure et Barbier.
2. Réduire le nombre de grandes occurrences de chaque motif, surtout sur Accueil et Le salon.
3. Rééquilibrer le ratio du hero Coiffure sous 900 px.
4. Une fois ces trois retouches faites, la direction graphique provisoire peut être présentée dans le portfolio sans attendre de photographie.

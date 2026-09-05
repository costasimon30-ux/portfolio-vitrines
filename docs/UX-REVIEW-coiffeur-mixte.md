# Revue UX — Créa’Tif

**Date :** 5 septembre 2026

**Commit observé :** `474b3e851e5a9628859914b46942e5d618c10bf8` sur `main`, après `git pull`.

**Implémentation contrôlée :** `5827a14` — retouches ciblées et polices auto-hébergées.

**Référence :** les trois demandes de la revue UX du commit `5f1dcdb`.

## Verdict explicite

**Validation finale du rendu portfolio : pas encore accordée.** Deux retouches sont validées ; une réserve P2 subsiste sur la hauteur du hero Coiffure à 768 px.

**Le parti pris de compositions graphiques sans photos est validé pour un portfolio conceptuel. Aucune photographie n’est requise pour lever cette réserve.** La distinction des univers et le rythme des motifs sont désormais suffisamment aboutis. Il reste un ajustement de proportion sur tablette, pas une refonte artistique.

## Périmètre et méthode

Contrôle du site réellement affiché en navigateur local, avec inspection visuelle des quatre pages complètes à **375, 768 et 1440 px**, après chargement des polices locales. Hauteur de fenêtre : 900 px sur mobile/tablette et 960 px sur desktop. Les dimensions des compositions ont été mesurées dans le rendu.

Cette contre-revue porte uniquement sur les trois retouches demandées et l’absence de régression visuelle liée aux polices. Elle ne renouvelle pas l’audit fonctionnel, clavier, contrastes ou SEO.

| Retouche | 375 px | 768 px | 1440 px | Statut |
| --- | --- | --- | --- | --- |
| Distinction des cartes d’univers sur l’accueil | Cartes empilées nettement distinctes | Deux cartes distinctes côte à côte | Deux cartes distinctes côte à côte | P1 clôturée |
| Réduction des répétitions des motifs | Parcours allégé | Alternance graphique/texte plus claire | Rythme éditorial préservé | P1 clôturée |
| Hauteur du hero Coiffure sous 900 px | Réduction acceptable | Composition encore trop haute | Équilibre desktop préservé ; hors breakpoint concerné | P2 partiellement corrigée |

Aucun défilement horizontal constaté sur les quatre pages aux trois largeurs testées.

## 1. Cartes d’univers de l’accueil — validé

La carte **Coiffure** utilise désormais les bandes obliques Pêche / Sable ; la carte **Barbier**, le fond Encre, l’arc Ivoire et le point Cuivre. Les deux sensibilités se reconnaissent avant la lecture des titres, y compris lorsque les cartes se succèdent à 375 px.

Ces compositions annoncent correctement les pages dédiées tout en conservant une identité Créa’Tif commune. Titres, descriptions et liens restent lisibles. **Aucune retouche supplémentaire demandée sur ces cartes.**

## 2. Répétition des motifs — validé

- **Accueil :** le motif d’accueil apparaît deux fois, dans le hero et dans « Le geste juste », au lieu de cinq reprises identiques. Les deux cartes ajoutent chacune leur propre univers. « Notre approche » est maintenant une respiration typographique, sans grand visuel répété.
- **Le salon :** deux compositions subsistent, hero et bloc éditorial, contre trois précédemment. Les informations pratiques n’ajoutent plus une troisième grande surface décorative.
- **Coiffure et Barbier :** chacun conserve deux occurrences de son motif, hero et reprise secondaire.

Le rendu respecte désormais le principe demandé : une composition forte et au plus une reprise secondaire du même motif par page. Sur mobile comme sur desktop, les visuels ponctuent le contenu au lieu d’occuper systématiquement chaque bloc. **Aucune réduction supplémentaire demandée.**

## 3. Hero Coiffure sous 900 px — réserve P2 maintenue à 768 px

Le passage du ratio 3:4 au ratio 4:5 est effectif. Il suit bien l’une des options de ma précédente recommandation ; l’observation montre toutefois que cette option était insuffisante sur tablette.

| Largeur de fenêtre | Ancienne composition | Composition actuelle | Appréciation |
| --- | --- | --- | --- |
| 375 px | 312 × 416 px | 312 × 390 px | Acceptable ; lecture et CTA restent clairs |
| 768 px | 705 × 940 px | 705 × 881 px | Encore trop dominante après le texte et les CTA |
| 1440 px | Hors retouche demandée | Environ 490 × 653 px | Composition latérale équilibrée ; à conserver |

À 768 px, la réduction ne représente qu’environ **59 px, soit 6,25 %**. Le visuel décoratif seul occupe encore presque toute la hauteur de la fenêtre de test (881 px sur 900), alors qu’il vient après le texte. Il retarde toujours l’arrivée au contenu « Partir de vous ». Ce n’est pas un défaut bloquant la navigation, mais la réserve de finition de la précédente revue n’est pas levée.

**Seule retouche restante recommandée :** donner au hero Coiffure un cadrage horizontal **3:2 entre 600 et 899 px**, soit environ **705 × 470 px à 768 px** dans le rendu testé. Conserver le 4:5 sur petit mobile et la composition desktop actuelle. Les bandes abstraites permettent ce recadrage sans perdre d’information.

Il s’agit de préciser l’option horizontale déjà proposée, sans modifier palette, motifs, typographies, contenu ou structure des pages.

## Polices locales — rendu validé dans le périmètre testé

Les fichiers locaux Cormorant Garamond 600 et DM Sans 400, 600 et 700 ont été servis avec succès (réponses HTTP 200 sous `shared/design-system/fonts/`). L’état de chargement du navigateur est `loaded` ; les familles calculées des titres et du texte correspondent à Cormorant Garamond et DM Sans.

Après chargement, l’inspection des quatre pages aux trois largeurs ne révèle ni titre tronqué, ni chevauchement de texte, ni libellé de CTA coupé. Les accents et l’apostrophe de Créa’Tif s’affichent correctement. **Aucune régression visuelle attribuable au passage aux polices locales n’a été observée.**

## Suite à donner à Claude

1. Ajuster uniquement le cadrage du hero Coiffure dans la plage tablette indiquée.
2. Recontrôler cette page à 375, 768 et 1440 px, polices locales chargées : petit mobile préservé, composition proche de 470 px de haut à 768 px, desktop inchangé.
3. Faire constater la levée de cette dernière réserve avant validation finale du rendu.

**Bilan : deux demandes clôturées, une demande partiellement corrigée. Photos non requises ; aucune nouvelle direction artistique à lancer.**

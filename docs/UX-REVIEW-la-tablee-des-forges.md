# Revue UI/UX ciblée — passe photographique de La Tablée des Forges

**Source auditée :** `58f4fb7a2c4a8b893cc3e5b7214752bc74a1f157`. Site statique servi localement depuis `sites/la-tablee-des-forges/` ; aucune URL publique utilisée. Contrôles visuels à **320×568, 375×667, 768×1024 et 1440×900** sur Accueil, La carte et Le lieu & infos. Mesures de boîtes d’images dans le navigateur ; aucun compte rendu d’implémentation utilisé. La demande postérieure de fond boisé et de mouvement (`ab4ae28`) est hors de cet audit et son absence n’est pas un défaut.

## Verdict

**Conforme avec réserves et arbitrages, sans validation finale.** Le métier et l’ambiance du soir sont perceptibles ; les quatre photos retenues occupent leurs rôles, sans texte posé dessus. P01 est identifiable dès le premier écran à 320 et 375 px. La limite chiffrée de hauteur P01 entre toutefois en conflit avec le ratio mobile prescrit ; Simon doit trancher ce compromis avant une clôture. P02 et le couple P03/P04 bis appellent également son jugement esthétique. Les droits tiers restent à vérifier séparément avant publication.

## Constats mesurés et observables

| Page / viewport | Preuve sur le rendu | Impact / verdict |
| --- | --- | --- |
| Accueil, 320×568 | P01 commence à y≈387 px ; ≈181 px de photo sont visibles au premier écran, burger reconnaissable. Boîte d’image 286×214 px ; aucun débordement horizontal (`scrollWidth=320`). Nom, « brasserie-bar du soir » et offre burgers/bières précèdent l’image. | Critère des 120 px et compréhension immédiate atteints ; cadre 4:3 légèrement au-dessus du plafond 210 px. |
| Accueil, 375×667 | P01 entière de y≈320 à 575 px, 341×255 px. Burger, frites et verre discernables ; légende/crédit juste dessous. | Premier écran réussi, mais +45 px sur le plafond 210 px. |
| Accueil, 768×1024 / 1440×900 | P01 574×382 px puis 652×434 px, cadrage horizontal 3:2 ; burger, frites et verre préservés. À 1440, texte et CTA restent sur panneau sombre séparé de la photo. | Composition et lecture cohérentes. |
| La carte, 320×568 / 375×667 | P02 286×214 / 341×255 px ; haut du burger visible en bas du premier écran après la mention des prix fictifs. À 375, la photo continue naturellement sous le pli. | La fiction est annoncée avant la photo et les prix ; pas de confusion avec un burger nommé. |
| La carte, 768×1024 / 1440×900 | P02 446×334 / 461×345 px ; burger entier, pain et garniture lisibles sur fond noir. Légende précise qu’il ne représente aucun burger de la carte. | Bon rôle éditorial, mais contraste marqué avec le cadre P01 plus feutré : arbitrage esthétique pour Simon, pas défaut bloquant. |
| Le lieu, 320×568 / 375×667 | P04 bis 286×214 / 341×255 px ; profondeur, avant-plan de tables et au moins deux suspensions visibles. Légende indique un restaurant réel sans lien avec la fiction. | Ambiance de salle perceptible malgré des tables volontairement floues. |
| Le lieu, 768×1024 / 1440×900 | P04 bis 574×382 / 616×410 px, horizontal 3:2 ; suspensions, comptoir, tables et profondeur conservés. P03 est secondaire, à 1440 partiellement visible plus bas avec tabourets et comptoir ; ses boîtes mesurées : 574×430 à 768 et 554×415 à 1440. | Hiérarchie P04/P03 juste. La salle P04 lit aussi comme un bar ; Simon doit confirmer que ce compromis convient à la brasserie-bar. |

Sur les écrans examinés, les crédits P01–P04 bis sont en texte visible sous les photos, sur fond opaque, non au survol. La mention de fiction est visible sur les pages concernées. Aucun texte informatif ni CTA n’est superposé aux photos. Les trois pages n’ont pas présenté de débordement horizontal aux quatre largeurs contrôlées.

## Corrections indispensables avant clôture

- **P01 mobile — arbitrage nécessaire sur deux prescriptions incompatibles.** À 375 px, une image 4:3 pleine largeur (341 px utiles) mesure mécaniquement ≈255 px de haut ; elle ne peut aussi respecter 210 px. Le rendu dépasse donc le plafond écrit de 45 px, mais satisfait le premier écran et préserve les trois sujets. Choisir explicitement entre (a) conserver le 4:3 pleine largeur et assouplir le plafond, (b) réduire la largeur du cadre à ≈280 px pour conserver le 4:3, ou (c) garder la largeur et recadrer à ≈210 px de haut, au risque de perdre les frites ou le verre. Je recommande (a) au vu du rendu, sous validation de Simon. À 320 px, l’écart n’est que d’environ 4 px.

## Préférences facultatives

- **P02, La carte, 768/1440 :** burger très frontal, saturé et isolé sur noir ; il apporte une gourmandise immédiate mais rompt un peu avec le reportage feutré de P01/P04. Aucun changement requis si Simon souhaite cette rupture « carte ».
- **P04 bis, Le lieu, 375/768/1440 :** l’avant-plan de tables est doux et le comptoir central domine. L’image raconte davantage un bar nocturne qu’une salle de restauration détaillée. C’est compatible avec le positionnement brasserie-bar ; conserver si cette nuance plaît à Simon.

## Arbitrages et points non vérifiés

- **Simon :** valider le compromis P01 mobile ci-dessus, puis accepter ou refuser P02 et l’association de deux lieux réels distincts P03/P04 bis. La légende explicite cette distinction ; elle ne transforme pas les images en photos du restaurant fictif.
- **Droits tiers, hors validation UI/UX :** le marquage clair/flou du verre P01 n’est pas identifiable avec certitude aux tailles rendues ; cela ne prouve pas l’absence de marque. Les personnes, décors, éventuelles œuvres et droits de lieu sur P03/P04 bis n’ont pas été établis par cette revue. Vérification des fichiers et recadrages définitifs nécessaire avant publication.
- **Hors périmètre testé :** zoom natif 200 %, navigation/focus, liens et crédits activés, sans JavaScript, performance et assemblage de publication. Leur validation revient à QA ; ils ne sont pas présumés conformes ici. La lecture détaillée du cadre P03 à 320 px n’a pas été capturée ; seule sa présence et sa boîte ont été constatées.

**Conclusion :** passe photo convaincante pour une démonstration conceptuelle, sous réserve du choix P01 et de l’arbitrage esthétique et juridique de Simon. Aucun accord de déploiement.


**Complément de méthode — sortie assemblée isolée.** Après les captures ci-dessus, le commit source 58f4fb7 a été extrait dans un répertoire temporaire puis assemblé localement en mode production avec Node 24.21.0 : 30 fichiers produits. Le HTML d’accueil et sa feuille CSS sont identiques octet pour octet entre source et sortie (SHA-256 comparés). L’accueil assemblé a été ouvert à 375×667 : P01 mesure encore 341×255 px, commence à y=320 px, ne déborde pas et montre le même rendu. Cette vérification confirme le constat P01 sur l’artefact ; elle ne constitue pas l’audit QA de tous les chemins, du zoom natif ou de la publication.


## Contre-vérification visuelle — fond noyer et apparition (5 octobre 2026)

**Source ciblée :** `2d325b560a9be87f72d1912b95a543649eddc71a`, comparée au complément artistique et au contrat de clôture `d0f427a`. J’ai ouvert les 15 PNG indépendants produits par QA depuis une sortie locale isolée, avec leur inventaire `inventaire.json` dans `/private/tmp/tablee-vis-2d325b5-2beV80/` : 12 planches haut / apparition / bas (trois pages × 320×568, 375×667, 768×1024, 1440×900) et trois planches avant / entrée / sortie / seconde entrée à 375×667. J’ai aussi assemblé séparément ce SHA en production (31 fichiers). **Je n’ai pas navigué moi-même dans ce rendu** : les captures et les positions `scrollY` constituent la preuve de cette revue, non un test interactif rejoué.

**Verdict visuel borné : conforme avec limites de preuve ; aucune correction indispensable démontrée par ces images.** Le fond donne une tonalité noyer contemporaine sans couvrir les photographies ni porter les textes. Les groupes montrés sont nets à l’arrêt, disparaissent sous le viewport et reviennent lisibles ; la validation esthétique finale appartient à Simon. Ce verdict ne clôt pas les critères QA.

| Page et format | Preuve observable | Impact / classement |
| --- | --- | --- |
| Accueil, 320/375/768/1440 | Les quatre planches `accueil-*-parcours.png` montrent le hero, P01, les légendes et les CTA sur aplats opaques. À 1440, les lames sont visibles sur les côtés du hero et entre les panneaux ; à 320/375, elles n’occupent que de courts interstices. Les états bas montrent « Le lieu » et le footer lisibles. | Ambiance plus boisée, sans régression visuelle de la lecture ou de la photo dans ces cadres. |
| La carte, 320/375/768/1440 | Les planches `carte-*-parcours.png` gardent la mention des prix fictifs et P02 sur panneau Nuit ; les cartes de menus, prix et CTA sont opaques au milieu et au bas. Les lames restent derrière les marges et espaces entre blocs. | Pas de texte ou de prix posé sur le motif ; la carte demeure visuellement exploitable dans les états capturés. |
| Le lieu, 320/375/768/1440 | Les planches `lieu-*-parcours.png` montrent P04 bis et P03 sans assombrissement perceptible imputable au motif ; crédits, horaires fictifs, localisation, CTA et footer restent lisibles sur aplats. | La photo garde la priorité visuelle ; aucun conflit visible avec le fond. |
| Cycle à 375×667 sur les trois pages | `accueil-375x667-cycle.png`, `carte-375x667-cycle.png`, `lieu-375x667-cycle.png` : avant, le groupe représentatif est à opacité 0 et translation +16 px, avec `T≈653–654 px` ; à l’entrée, `T≈371 px`, opacité 1/translation nulle ; après remontée, `T≈703 px`, opacité 0 ; à la seconde entrée, opacité 1. Pour H=667 px, ces positions passent bien de part et d’autre des seuils 0,85H≈567 et 0,92H≈614. | Cycle réversible cohérent sur les **trois groupes représentés**, sans contenu partiellement transparent dans les états arrêtés. La bande d’hystérésis est volontaire. |

**Préférence facultative à soumettre à Simon :** sur les captures 1440, le rythme des lames est franchement visible dans les grandes marges ; sur 320/375, les interstices très courts évoquent parfois une suite de rectangles plutôt qu’un panneau continu. Je le trouve acceptable comme décor périphérique et ne demande pas de retouche préventive. Simon peut préférer un contraste légèrement moindre après avoir vu les planches ; ce serait un choix esthétique, non un défaut reproduit.

**Non vérifié par cette revue :** fluidité et durée réelles des transitions, absence de clignotement entre images fixes, cycle de chaque groupe à chacune des quatre largeurs, Tab/focus et accès directs, retour d’historique, JavaScript désactivé, réduction des mouvements, zoom navigateur natif 200 %, contraste chiffré, CLS, console et absence de débordement mesuré. Les planches montrent le bas des pages mais ne prouvent pas seules l’utilisabilité au clavier ni tous les replis. Ces contrôles relèvent de QA. La présente section ne modifie ni les réserves photographiques antérieures ni l’interdiction de déployer sans décision de Simon.

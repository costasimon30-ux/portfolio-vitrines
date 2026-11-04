# Ligne Posée — bilan documentaire UI/UX

## Bilan documentaire — 19 octobre 2026

**Ce document n'est pas une nouvelle recette visuelle.** Lecture du dépôt synchronisé à `4ebc4d61f1dc289034bfb5c23c0325da481f137d`, des décisions artistiques et de `QA-boutique-setup.md`. Aucun navigateur, tableau de bord Cloudflare ou parcours interactif inspecté par UI/UX pour ce bilan.

**Direction et rendu validés.** Simon a validé le 17 octobre l'accueil « Le bureau prend forme » : produit `sup-01`, H1 « Ligne Posée », accroche « Des objets sobres pour un bureau bien pensé. », CTA « Voir les 20 modèles », navigation « Accueil / Catalogue / Panier » et fiction visible. La validation du rendu porte sur les captures de `7e4032bc7ed4fb0588a8259a4d1430c2c4fb10a1` à 320×568, 375×667, 768×1024 et 1440×900. Elle clôt l'arbitrage visuel du lot ; elle ne constitue pas une recette indépendante ni une validation de toute la boutique. Références : `DIRECTION.md`, « Validation produit — accueil et en-tête » et « Validation du rendu intégré ». Les formulations « proposition à arbitrer » du brief antérieur ne rouvrent pas ces choix.

**Git et publication.** Le nouvel accueil reste dans Git ; depuis `7e4032b`, seul le manifeste de publication a changé sous `sites/boutique-setup/` dans la comparaison avec le dépôt lu. Simon rapporte la restauration de `cca19c6e` (source `a03b365`) et le retrait de `b7291ef2`/`7b4663b4` après l'incident Content-Type. Ces événements rapportés ne constituent pas une inspection actuelle de Cloudflare.

Le Chef de projet transmet les GET propres à QA du **19 octobre, entre 05 h 52 et 05 h 54 (Europe/Paris)** sur https://ligne-posee.costa-simon30.workers.dev/ : accueil de **4 171 octets**, SHA-256 `9a2d643f57fed31b4d925d4ee835a227286fdb093ce40d2f97a523702574eb52`, correspondant à `a03b365`, **sans le nouvel accueil**. Mesures attribuées à QA, non rejouées par UI/UX. Elles concordent avec le contenu attendu de la version restaurée, sans prouver son identifiant Cloudflare ni son rendu interactif. L'ancienne présentation avec les 20 visuels reste provisoire ; la validation du nouvel accueil ne lui est pas transférée. Le paquet corrigé `f66274f` est rapporté comme non déployé, sans recalcul d'empreinte ici.

**Réserves ouvertes.**

- **LP-QA-01, majeur :** saut de contenu sur fiche avec JSON retardé de 10 secondes, documenté par QA. À corriger ou accepter explicitement avant un verdict final sans réserve.
- **LP-QA-02, mineur :** notice détaillée des visuels absente de l'artefact public. À traiter avant la mise en avant définitive, selon l'arbitrage prépublication du 17 octobre.
- Le zoom natif 200 % a été testé par QA sur l'ancienne version dans une fenêtre desktop (1680 → 840 px CSS), pas sur le nouvel accueil ni aux quatre formats physiques. Cette preuve ne valide pas le nouveau rendu.
- La compression des filtres reste une amélioration distincte à évaluer, sans refonte de la fiche produit.

**Actions nécessaires, par priorité.**

1. Consigner l'historique corrigé et la réponse publique observée ; distinguer nouvel accueil validé dans Git et ancien accueil servi.
2. Coordonner la version de la démo et sa vignette dans le portfolio : QA observe trois onglets sur ce dernier, dont la capture du nouvel accueil, alors que la démo sert encore l'ancien. Cet écart est établi documentairement ; son impact visuel n'a pas été mesuré ici.
3. Si le nouvel accueil est remis en ligne après accord sur l'artefact précis, confirmer image, composition, navigation, accès catalogue et retours du parcours sur l'URL réelle. La direction et les textes déjà validés ne demandent pas un nouvel arbitrage.
4. Traiter les deux réserves QA pour atteindre le statut définitif ; aucune refonte générale n'est demandée.

Aucun défaut visuel nouveau n'est établi par ce bilan. Aucune publication ou modification de code n'en découle.

Agent: claude-ui-ux

---

## Revue visuelle indépendante de la bêta — 27 octobre 2026 — source bb2dec53

**Avis borné : aucun défaut visuel P0 à P3 reproductible dans les états examinés ; la bêta est cohérente avec la direction artistique `eb203b2` sur ces contrôles locaux.** Source exacte `bb2dec53ffc2256bf480e28ff8bc870b92880de1`, parent `eb203b2e0318e11222e7623a74486f8357e9664a`. Page servie depuis `sites/boutique-setup/` en HTTP local et inspectée dans Chrome ; aucun comportement du Worker public n'est inféré de ce rendu. Le rapport de l'Implémentation et ses captures n'ont pas servi de preuve de passage.

### Cadrage de `sup-01` : image présente dans le candidat examiné

L'accueil (`index.html`, figure `.hero__figure`) a été ouvert à **320×568, 375×667, 768×1024 et 1440×900**. Les quatre captures navigateur obtenues ici montrent le plateau et **les deux pieds** du rehausseur dans le cadre ; la légende reste sous l'image, sur une surface unie. À chaque taille, l'élément `<img>` est `complete`, avec `naturalWidth > 0`, et le document ne déborde pas horizontalement. Mesures du cadre : **281×210,75 px** à 320 ; **328×246 px** à 375 ; **705×528,75 px** à 768 ; **593,9×445,4 px** à 1440. Le navigateur a demandé les fichiers locaux `sup-01-320.webp`, `sup-01-640.webp` et `sup-01-960.webp` selon la taille ; le serveur a répondu 200 à ces requêtes. À 1440, `object-fit: cover` et `object-position: 50% 58%` sont calculés, sans coupe de l'objet utile dans la capture. Le premier tableau contient nom, accroche, produit entier, légende et CTA au premier écran à 768 et 1440 px ; à 320/375 px, l'ordre nom → accroche → image/légende → CTA est conservé.

Les captures antérieures décrites comme un « cadre gris vide » ne sont pas fournies avec leur instant de capture ni leur état réseau ; **elles ne prouvent donc pas un défaut persistant du code**. Le cadre possède bien un fond d'attente (`.hero__cadre`, CSS), et la photo elle-même a un fond gris. Le rendu local achevé prouve que l'image est présente pour ce SHA dans les conditions testées ; il ne prouve ni la cause exacte des anciennes captures ni le comportement sous image bloquée ou fortement retardée. **Sévérité : aucun défaut de cadrage confirmé.**

### Sept pages, quatre formats et états utiles

Les sept pages ont été ouvertes à **320×568, 375×667, 768×1024 et 1440×900** : accueil, catalogue, fiche `sup-01`, panier, commande simulée, confirmation et 404. Sur chaque ouverture, `documentElement.scrollWidth = clientWidth` : **0 px de débordement horizontal**. La bande « Boutique fictive — aucun achat possible. » est visible en tête des sept pages ; la navigation Accueil / Catalogue / Panier reste exposée même à 320 px. Titres, paragraphes et retours sont lisibles, sans contrôle rogné dans les captures de premier écran. Le catalogue affiche 20 cartes, en une colonne à 320/375 px, deux à 768 px et quatre à 1440 px ; les carrés produit, la mention de visuel généré, le nom et le prix de démonstration restent distincts. Sur la fiche, quatre variantes et la mention « variante non représentée » restent présentes.

États examinés au-delà des ouvertures : panier et commande **vides** à 320/375/768/1440 px ; ajout réel de `LP-SUP-01-01`, puis panier et commande **remplis** à 320 et 1440 px ; fin de simulation à 375 px. Dans la commande remplie, le récapitulatif précède les choix dans l'ordre du document et forme deux colonnes à 1440 px ; à 320 px, les choix et montants restent lisibles en pile, sans débordement. La confirmation remplie annonce immédiatement « Simulation terminée » suivi de l'absence de commande et de paiement ; la confirmation sans capture présente un état explicite. La 404 montre sa fiction, son explication et ses deux sorties sur les quatre largeurs. Ces observations de rendu ne valident pas la logique du panier, les 80 prix, la réponse HTTP d'une vraie 404 ou les réserves QA.

Le premier Tab sur l'accueil fait apparaître « Aller au contenu » : contour calculé **bleu plein 3 px**, décalage **3 px**, lien entier dans le viewport. Les couleurs calculées à 375 px incluent fond `#FBFBFA`, encre `#1B1F24`, texte secondaire `#4A525C`, bouton foncé à texte clair ; la légende de l'image reste à **14 px**. Le panneau foncé de fin d'accueil suit les quatre familles et conserve son texte sur surface unie. Les visuels gardent leurs couleurs naturelles. Ces sondes ne remplacent pas un audit de contraste exhaustif ni l'écoute d'un lecteur d'écran.

### Limites et suite

La commande de zoom de l'outil navigateur (`Ctrl++` puis `Ctrl+=`) n'a pas modifié `innerWidth`, `devicePixelRatio` ou `visualViewport.scale` ; **le zoom natif 200 % n'a pas été obtenu**. Une sonde distincte à **160 px CSS** sur les sept pages donne 0 px de débordement et des titres dans leur conteneur, mais ne valide pas le zoom natif. Images bloquées ou retardées, JavaScript désactivé, mouvement réduit, autres navigateurs, tactile, états de très longs libellés et réponse hébergée ne sont pas vérifiés dans cette passe visuelle. Les réserves LP-QA-01/02 et PUB-11-01 restent au suivi de leurs revues propres ; aucun statut technique n'est changé par cet avis.

**Décision UI/UX proposée :** le candidat peut être montré à Simon pour arbitrage de l'échelle, de la densité et du rythme sur les sept pages. Aucun écart visuel actionnable n'est établi ici. Refaire le zoom natif 200 % et, si le « cadre gris vide » réapparaît, relever une capture horodatée avec état de chargement et URL de l'image avant d'attribuer une cause au code. Cette revue n'autorise aucune publication.

## Revue UI/UX indépendante — menu plein écran Ligne Posée — 4 novembre 2026

**Candidat :** `35a05019fc3a6fa9fb28a7ccfa46e1d3b7aa3015` sur `origin/main`, comparé à la direction artistique `eb203b2` et à sa décision « Évolution ciblée — menu plein écran » du 4 novembre. **Périmètre :** le menu commun des sept pages ; aucune revue de la boutique complète, aucun code modifié, aucune publication.

### Preuves et portée

J'ai lu la source exacte du candidat (`css/style.css`, `js/menu.js`, les sept HTML et leurs copies `dist/`) dans une copie locale isolée, puis inspecté les pixels des captures livrées dans le dossier temporaire `scratchpad/captures` et des séquences `scratchpad/sequence`. La matrice contient **42 captures ouvertes** : accueil, catalogue, produit, panier, commande, confirmation et 404, chacune à 320, 375, 768 et 1440 px ainsi que dans deux séries intitulées `zoom200-320` et `zoom200-1440`. Les captures sont des pièces fournies par Claude : mon jugement visuel est indépendant, mais leur production et leurs paramètres de navigateur ne le sont pas. Je n'ai pas rejoué ici les clics, le clavier ou le zoom natif dans un navigateur indépendant. Le fichier `resultats.json` n'est pas tenu pour preuve de passage.

| Point examiné | Constat observable et recoupement source | Sévérité |
| --- | --- | --- |
| Sens, surface et rythme | La séquence `1440-03/08/15/23-ouverture` montre le volet encre entrant de droite avec une bande de page à gauche, puis les liens blancs lisibles ; `375-04/10/23-ouverture` montre l'aplat clair descendant du haut. Le CSS déclare 420 ms à l'ouverture, 300 ms au retrait après 100 ms d'effacement des liens, et un décalage de 45 ms entre liens. Les images étiquetées ~424–438 ms montrent l'état posé. Identité, contraste et hiérarchie conformes à la direction. | Aucun écart confirmé |
| Sept pages et quatre largeurs | Les 28 captures ouvertes à 320/375/768/1440 montrent les trois destinations et « Fermer », sans coupe visible. À 320, les sept pages ont la même grille claire, des filets fins et l'élément courant souligné quand il s'agit d'Accueil, Catalogue ou Panier. À 768, le volet reste clair ; à 1440 il est sombre. Les sept HTML chargent `menu.js` et portent le même bouton et la même navigation. | Aucun écart confirmé |
| Zoom annoncé 200 % | `zoom200-1440-index-ouvert.png` montre le volet clair attendu lorsque la largeur CSS passe sous 1024 px, avec les trois liens lisibles. `zoom200-320-index-ouvert.png` montre « Fermer » et seulement « Accueil » dans le premier écran de 320×568 px ; Catalogue et Panier sont sous la ligne de flottaison. Le CSS prévoit `overflow-y: auto` dans la liste. La direction accepte ce défilement à fort zoom, mais aucun indice visuel ne signale les liens restants. | **P3 — découvrabilité**, non bloquant |
| Clavier et repli | `375-clavier-focus.png` et `1440-clavier-focus.png` montrent un contour de focus net sur le premier lien, bleu également sur le fond sombre. `sansjs-320-index.png`, `sansjs-1440-index.png` et `sansjs-zoom200-320-index.png` montrent les trois liens exposés sans bouton de menu. Le script prévoit `aria-expanded`, `inert`, boucle Tab/Maj+Tab, Échap, retour du focus et recalcul au redimensionnement ; le CSS retire les transitions avec `prefers-reduced-motion`. Ces comportements sont cohérents en source, mais les captures fixes ne prouvent pas à elles seules la boucle clavier, la réversibilité aux doubles clics ni le mouvement réduit. | Aucun défaut de code démontré ; **preuve comportementale incomplète** |

### Écart à suivre et décision

**P3 — accès peu perceptible aux autres liens au zoom extrême.** Dans la capture `zoom200-320-index-ouvert.png`, la bande de fiction et l'en-tête occupent environ 385 px sur 568 px ; seul le premier lien est visible sous eux. Le défilement interne prévu par le CSS rend la situation potentiellement utilisable, mais sa présence et l'accès effectif à Catalogue/Panier n'ont pas été observés indépendamment. À traiter si un essai réel à 200 % confirme une difficulté de découverte ; ce n'est pas un défaut bloquant établi par ces images.

**Avis UI/UX : favorable avec réserve de preuve comportementale.** Aucun écart visuel majeur ou moyen n'apparaît sur les sept pages dans les captures du candidat. Pour lever la réserve, rejouer dans un navigateur indépendant à 200 % natif le défilement jusqu'aux trois liens, puis Tab/Maj+Tab, Échap, clics rapides et préférence de mouvement réduit. Les images et la source ne permettent pas d'affirmer que ces interactions ont été vérifiées dans cette passe. Cet avis ne vaut pas autorisation de publication.

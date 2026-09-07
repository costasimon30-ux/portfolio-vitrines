# Direction du projet

Ce fichier centralise les décisions de direction (produit, contenu, périmètre) prises avec Codex (ChatGPT), pour que Claude implémente à partir de la même base.

## Portfolio global

Le portfolio professionnel présentera plusieurs projets ; **Créa’Tif est une démo parmi d'autres, pas la page d'accueil du portfolio**. Le positionnement commercial, le contenu, l'arborescence et la direction artistique du portfolio feront l'objet d'un cadrage distinct. Aucun écran de portfolio n'est à construire dans la présente étape.

### Cadrage de publication — décisions produit du 7 septembre 2026

**Statut : organisation retenue pour préparer l'architecture, non implémentée et non déployée.** L'étude de Claude est une base de travail ; ses essais locaux ne valent ni configuration d'hébergement livrée, ni recette de l'environnement public. Les décisions ci-dessous ne donnent aucune autorisation de création de compte, de connexion GitHub à un hébergeur, d'achat de domaine ou de mise en ligne.

#### Séparation du portfolio et des démos

- **Même dépôt `portfolio-vitrines`** pour les sources du futur portfolio et celles des démos. Le portfolio aura son propre dossier de site et sa propre publication ; l'Architecte en précisera l'emplacement sans créer le site maintenant. Ne pas transformer la racine publiée de Créa’Tif en catalogue de projets.
- **Une démo = une publication autonome**, accessible directement, sans devoir publier les autres démos ou le portfolio. Le futur portfolio les présentera et y donnera accès par des liens ; aucune page de projet n'est rédigée à ce stade.
- **Schéma d'URL retenu : sous-domaines distincts**, plutôt que démos placées sous des chemins du site principal. Après autorisation de publier, commencer avec une URL de plateforme par projet ; à terme, domaine principal pour le portfolio et sous-domaines dédiés aux démos. Aucun nom de domaine ou de projet d'hébergement n'est réservé ou réputé disponible. L'ajout d'un domaine personnalisé devra préserver les chemins des pages ; la gestion des URL alternatives sera précisée avant ce raccordement.

#### Hébergement de référence et croissance

- **Cloudflare Pages, un projet par site**, est retenu comme cible de préparation, sous réserve de l'accord de Simon pour utiliser/créer le compte et connecter ce dépôt. Ce choix convient au besoin actuel ; il n'est pas présenté comme la seule solution possible ni comme un engagement de gratuité permanente.
- Ajouter une vitrine signifie ajouter son dossier source, sa section de brief, sa sortie publiable isolée et, après accord de Simon, son projet d'hébergement. Aucun changement des URL ou publication des sources des sites existants ne doit être nécessaire pour ajouter le deuxième site.
- **Limite à anticiper : cinq projets Pages reliés à un même dépôt**, selon la documentation consultée le 7 septembre 2026. Le futur portfolio compte pour un projet : cela laisse quatre démos dans cette configuration par défaut. Avant un sixième projet connecté, demander un nouvel arbitrage ; une hausse peut être sollicitée mais n'est pas garantie. [Cloudflare — monorepos](https://developers.cloudflare.com/pages/configuration/monorepos/).
- Le plan Free documente notamment **500 builds par mois et un build simultané** ; les requêtes de ressources statiques sont annoncées gratuites et illimitées, ce qui ne supprime pas les autres limites. Rester sur du statique, sans Functions, service payant ou activation de facturation pour cette étape. [Limites Pages](https://developers.cloudflare.com/pages/platform/limits/), [requêtes statiques](https://developers.cloudflare.com/pages/functions/pricing/).

#### Sortie publiée et périmètre d'assemblage

Chaque sortie doit contenir seulement les pages et ressources nécessaires au site ciblé, y compris les polices locales et les notices de licence utiles. **Ne jamais publier le dépôt entier** : exclure les rapports et captures de `docs/`, les sorties locales de Claude, `.git`, les sources des autres sites et les fichiers internes de travail. Cette isolation d'hébergement ne rend pas privé le dépôt GitHub déjà public.

L'Architecte doit formaliser un assemblage minimal, reproductible et testable localement : emplacement du script, commande, répertoire de sortie, sélection des fichiers et résolution des dépendances à `shared/`. Les huit liens actuels vers `../../shared/design-system/` ne doivent pas produire de ressources manquantes à la racine du site publié. Les choix de chemins et de transformation appartiennent à l'Architecte, puis leur implémentation à Claude ; ne pas imposer un nombre de lignes de script.

Ce besoin d'assemblage n'autorise ni framework, ni générateur de templates maison, ni migration immédiate vers Eleventy. La trajectoire déjà documentée pour le deuxième site reste distincte ; l'Architecte précisera son raccordement futur sans présumer que tout l'assemblage sera automatiquement supprimé.

Les futures mises à jour doivent distinguer un changement du site, de ses dépendances partagées ou de son assemblage d'un simple changement documentaire. L'Architecte précisera les chemins déclencheurs et les contrôles de déploiement ; un commit `docs:` ne doit pas, à lui seul, republier toutes les démos. Les réglages ne seront activés qu'après accord de Simon. [Cloudflare — chemins de déclenchement](https://developers.cloudflare.com/pages/configuration/build-watch-paths/).

#### Indexation et statut de démonstration

- **Démos de commerces fictifs : non destinées à l'indexation.** Prévoir `noindex, follow` sur toutes leurs pages HTML, dont les quatre pages de Créa’Tif. Les mentions de démonstration et les coordonnées fictives non actionnables restent en place ; ne pas ajouter de données structurées les présentant comme un établissement réel.
- **`robots.txt` des démos : exploration autorisée**, sans `Disallow: /` et sans directive `noindex` dans ce fichier. Les robots doivent pouvoir lire la consigne `noindex` des pages. Celle-ci n'est ni un contrôle d'accès ni une garantie de confidentialité ou de suppression immédiate des résultats. [Google — règles robots et interaction avec robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
- **Portfolio professionnel final : indexable après validation et publication**, sans hériter du `noindex` des démos. Ses éventuelles fiches de projets pourront être indexables tout en pointant vers des démos non indexables. Aucun sitemap public ne doit être généré aujourd'hui avec des domaines inventés.
- Distinguer les URL de production et de prévisualisation : les prévisualisations du portfolio ne doivent pas être indexables. L'Architecte précisera l'application des règles par site et environnement, ainsi que le traitement de la notice de crédits accessible séparément. Les directives d'indexation restent à implémenter : elles ne sont pas réputées présentes ou validées dans le site actuel.

#### Ordre de réalisation et autorisations

1. **Architecte Front-end :** compléter uniquement `docs/ARCHITECTURE.md` à partir de ce cadrage, avec un contrat d'assemblage, les réglages proposés, les critères de vérification et les éventuels points incompatibles. Aucun code ou réglage externe à cette étape.
2. **Claude, sur instruction d'implémentation après ce cadrage technique :** préparer l'assemblage et les directives d'indexation, vérifier la sortie servie localement, sans changer le rendu approuvé ni les médias. Les chemins de ressources, liens, crédits et polices doivent rester fonctionnels ; ne pas rouvrir une revue générale des fonctionnalités pour ce seul besoin.
3. **Simon :** autoriser séparément l'utilisation/création du compte Cloudflare, l'accès au dépôt, puis la première mise en ligne et le mode des futures publications. L'URL de plateforme permet de différer l'achat d'un domaine ; aucun achat n'est engagé. **Connecter Git peut déclencher une publication : attendre cet accord avant toute connexion**, y compris pour une prévisualisation. [Cloudflare — intégration Git](https://developers.cloudflare.com/pages/get-started/git-integration/).
4. **QA, après publication autorisée et avant mise en avant auprès de prospects :** recette ciblée sur l'URL réelle et la révision déployée : HTTPS, accès direct aux quatre pages, liens/ancre de contact et notice, CSS/polices/photos sans erreur, absence des fichiers internes et autres sites, règles d'indexation réellement servies, affichage mobile/desktop et chargement des ressources. Distinguer les observations de cette recette des validations antérieures et des points non testés.

Le maintien de P06 est acté : aucune nouvelle recherche ou modification de cette image n'est demandée. La réserve reste documentée ; elle n'est ni levée par ce cadrage, ni transformée en autorisation de mise en ligne. L'accord de publication sera distinct et portera sur la version retenue avec sa réserve connue.

## Sites

### coiffeur-mixte

#### Statut et objectif

Premier projet du portfolio : une vitrine statique de démonstration, pensée pour montrer une intégration front-end premium, responsive et accessible. Il ne s'agit pas d'un site commercial prêt à recevoir de vrais rendez-vous.

##### Suivi produit — passe photographique, 7 septembre 2026

**Passe photographique implémentée ; revue UI/UX effectuée avec avis favorable ; rendu esthétique validé par Simon le 7 septembre 2026. Le renommage du lien de crédits est livré dans `4c80571`. Simon décide de conserver P06 en l'état ; la réserve de droits tiers reste documentée, sans recherche ou correction supplémentaire demandée.**

- **Livraison Claude :** `1d59fef160c785a1c3b785dd8d795b5ae384b40f`, intégration de P01–P07 sur les quatre pages selon le brief finalisé dans `9456bb7`.
- **Revue UI/UX :** [rapport de la passe photographique](UX-REVIEW-coiffeur-mixte.md) et 26 captures livrés dans `d7aefda013edeb9f62be65e767941872469bfadd`, sur le rendu de `1d59fef`. Aucune correction visuelle indispensable constatée dans le périmètre testé ; sélection et destinations respectées, présence photographique au premier écran d'accueil conforme aux quatre viewports du brief, hero Coiffure conforme aux bornes 599/600/899/900 px.
- **Statut de validation :** après la revue, Simon a confirmé son accord sur le rendu et l'identité du salon : « Oui j'aime l'ambiance du site », qu'il décrit comme cosy, posée et relaxante. Cette validation esthétique finale porte sur le rendu photographique de `1d59fef` présenté dans les captures ; elle ne vaut ni autorisation de diffusion, ni validation technique générale, ni levée de la réserve P06. Le site n'est pas déployé à cette livraison.

Ce suivi actualise l'état du projet sans modifier le brief artistique. Les mentions « prêt à implémenter » et « 0 intégrée à cette date » de la sous-section artistique décrivent son état lors de la validation du brief ; elles ne sont pas une demande de recommencer l'intégration. Le compromis brique/atelier de P04 a déjà été accepté : il n'est pas rouvert.

**Portée des preuves :** les conclusions ci-dessus sont celles de la revue UI/UX du rendu chargé, pas une nouvelle recette menée par le Chef de projet. Les contrôles fonctionnels déjà clôturés restent dans leur périmètre et ne sont pas rouverts. Cette revue n'a pas retesté le menu, le clavier, le zoom ou les textes agrandis, les lecteurs d'écran, les autres navigateurs/appareils, les contacts et liens externes, les performances/CLS/réseau lent, le SEO ni les licences et autorisations individuelles. Aucun de ces points n'est déclaré nouvellement validé par ce suivi.

##### Décisions actées et réserve restante

1. **Validation esthétique finale — acquise le 7 septembre 2026.** L'ambiance et l'identité de salon répondent à l'attente de Simon. Aucune nouvelle passe esthétique n'est demandée ; conserver le rendu approuvé. Cette décision ne rouvre pas les contrôles fonctionnels clôturés.
2. **Libellé du lien de crédits — livré et clos.** Sur délégation de Simon, le Chef de projet a retenu « Crédits et licences photographiques ». Le commit Claude `4c80571` remplace uniquement le texte du lien dans les quatre pieds de page ; sa destination `assets/photos/NOTICE.md` et les autres crédits restent inchangés. La lecture du diff confirme ce périmètre. Les contrôles de présence, de destination et d'absence de débordement à 320/375/768/1440 px sont ceux rapportés par Claude, pas une nouvelle recette du Chef de projet. Aucune nouvelle revue générale n'est demandée pour cette retouche.
3. **P06 — maintien décidé par Simon le 7 septembre 2026.** Après présentation de la réserve et de la recherche documentaire, Simon décide : « on garde l'image, on la retirera si besoin plus tard ». Conserver la photographie, son emplacement et son cadrage actuels ; ne lancer ni nouvelle recherche, ni contact, ni recadrage, remplacement ou retrait. La décision de maintien est actée : elle n'est plus un arbitrage en attente. **La réserve documentaire reste ouverte : aucune autorisation individuelle propre à P06 n'a été trouvée dans les sources publiques consultées ; cela ne prouve pas son inexistence.** Le maintien ne vaut pas preuve de droits ni levée de cette réserve. P06 est déjà présente dans le dépôt déclaré public ; cette situation a été portée à la connaissance de Simon.

Le sujet P06 est mis en attente sans action supplémentaire pour Claude ou les autres agents. Un éventuel retrait ultérieur fera l'objet d'une nouvelle décision de Simon ; aucune suppression de média ou réécriture de l'historique Git n'est autorisée à ce stade. Aucun déploiement n'est demandé par cette décision.

##### Captures de référence du rendu validé

- Accueil : [premier écran desktop, 1440 × 900](captures/coiffeur-mixte/1d59fef/accueil-1440x900-premier-ecran.png) et [premier écran mobile, 320 × 568](captures/coiffeur-mixte/1d59fef/accueil-320x568-premier-ecran.png).
- Univers et ambiance : [Coiffure, page complète à 768 × 1024](captures/coiffeur-mixte/1d59fef/coiffure-768x1024-page.png), [Barbier, page complète à 1440 × 900, dont P06](captures/coiffeur-mixte/1d59fef/barbier-1440x900-page.png) et [Le salon, page complète à 1440 × 900](captures/coiffeur-mixte/1d59fef/salon-1440x900-page.png).

Ces dimensions désignent les viewports de départ ; les pages complètes sont des captures déroulées. Les mesures de premier écran et les limites de capture sont documentées séparément dans le rapport UX.

#### Marque et positionnement

- **Marque unique :** Créa’Tif.
- **Positionnement :** salon de coiffure mixte premium, chaleureux et contemporain.
- **Concept créatif :** « Le geste juste » — valoriser l'expertise, l'écoute, la matière des cheveux et la lumière du salon.
- Éviter les codes de barbershop rétro, les couleurs saturées et toute référence à l'ancienne identité « Imagina’Tif ».

#### Périmètre fonctionnel

Le site est un projet **front-end statique**. Il n'inclut pas :

- création de compte, connexion ou mot de passe oublié ;
- réservation, calendrier, créneaux, paiement ou confirmation ;
- formulaire qui collecte ou envoie des données sans solution réellement connectée ;
- faux bandeau cookies, analytics ou traceurs non essentiels ;
- liens sociaux fictifs.

Le CTA principal est **« Nous contacter »**. Il ne doit pas faire croire à une réservation en ligne tant qu'une vraie solution de réservation externe ou un backend n'existe pas.

#### Pages à construire

1. **Accueil**
   - Hero avec promesse, texte court et CTA `Nous contacter` / `Découvrir le salon`.
   - Repères de prestations : coupe, couleur, soin, barbe.
   - Deux cartes d'univers : Coiffure et Barbier.
   - Bloc signature, présentation de l'équipe, galerie limitée et CTA final.
2. **Coiffure**
   - Hero, approche personnalisée, prestations (Coupe & brushing, Couleur, Soins, Coiffure événementielle), bloc éditorial, galerie et CTA.
3. **Barbier**
   - Hero, approche, prestations (Coupe & contours, Taille de barbe, Rasage, Soin visage), bloc éditorial, galerie et CTA.
4. **Le salon / Contact**
   - Valeurs, lieu, équipe, informations pratiques et moyens de contact.
   - Adresse, horaires, téléphone, e-mail, moyens de paiement et carte ne sont affichés que lorsqu'ils sont réels ; utiliser des placeholders clairement identifiés dans la démo.

#### Direction artistique

- Ambiance éditoriale, tactile, calme et précise ; beaucoup d'air, peu d'effets.
- Palette : Encre `#1F292A`, Ivoire `#FBF8F2`, Cuivre `#A84F3A`, Sauge `#61766D`, Sable `#E6DDD0`, Pêche poudré `#D4A68C`.
- Titres : **Cormorant Garamond** ; interface et texte : **DM Sans**.
- Grille : 12 colonnes desktop, 8 tablette, 4 mobile ; contenu standard limité à 1200 px.
- Espacements basés sur 8 px : `8, 16, 24, 32, 48, 64, 96, 128`.
- Boutons : 48 px de haut, rayon 8 px ; Cuivre pour l'action principale, Encre bordé pour l'action secondaire.
- Photographies contemporaines et cohérentes : gestes professionnels, lumière douce, salon accueillant, diversité des profils ; aucune imagerie rétro caricaturale.

##### Évolution photographique ciblée — brief validé le 7 septembre 2026

**Statut : sélection validée par Simon ; brief prêt à implémenter par Claude.** Base consultée après `git pull` : `d89fc9564452391d1928bc97ad4f915b4906dfe4` (`main`), commit de la proposition initiale. Après avoir validé l'orientation, Simon a confirmé ensemble **P01–P07, leurs destinations, le maintien de P04 avec son compromis et le nouvel ordre du hero d'accueil mobile**, le 7 septembre 2026. État du lot : **7 photos retenues, 0 intégrée à cette date**. Les aperçus montrent les sources, pas le futur site : **la validation de la sélection ne vaut pas validation du rendu**, qui reste à examiner après intégration.

Simon ne valide pas l'identité dominée par les compositions abstraites : le métier n'est pas assez immédiatement perceptible. Le nouvel objectif est de montrer **des mains au travail, des cheveux et un environnement de salon**, dès le premier écran. La précédente validation du portfolio conceptuel sans photos ne vaut donc pas validation artistique par Simon de cette nouvelle étape. Les corrections fonctionnelles et les contrôles déjà clôturés ne sont pas rouverts.

**Évolution retenue : « Le geste juste », rendu concret.** Conserver la marque Créa’Tif, la palette, les polices locales, les composants, les textes et le parcours de contact. Remplacer les grands visuels abstraits par une petite série photographique, sans créer une galerie, une équipe fictive ni une nouvelle identité. Coiffure montre la matière et le mouvement ; Barbier montre les lignes et la finition ; l'accueil relie ces deux univers ; Le salon montre l'atmosphère, explicitement à titre d'illustration.

Ce brief validé constitue l'instruction d'intégration pour Claude. Il remplace les seules consignes de médias et de cadrage incompatibles du complément historique ci-dessous, notamment le recours provisoire aux compositions. L'ordre mobile d'accueil précisé ici remplace également « texte et CTA, puis photo » de la proposition initiale. Le reste du périmètre et les corrections fonctionnelles déjà validées sont inchangés.

###### 1. Sélection photographique retenue

Les aperçus distants ci-dessous ont été examinés visuellement. Chaque lien « Source » ouvre la fiche de la photo, et non une recherche générique. **B** = licence Burst Some Rights Reserved ; **U** = licence Unsplash gratuite ; conditions et limites détaillées en section 5. Les crédits reprennent l'attribution effectivement affichée par la plateforme.

| Photo retenue et aperçu | Source, pertinence et réserve | Statut / licence |
| --- | --- | --- |
| **P01 — Coupe en cours** ![P01 : mains, peigne et ciseaux coupant une longue mèche dans un salon.](https://burst.shopifycdn.com/photos/stylist-cutting-long-hair.jpg?exif=0&format=pjpg&iptc=0&width=925) | [Source — Stylist Cutting Long Hair](https://www.shopify.com/stock-photos/photos/stylist-cutting-long-hair), **Shopify Partners / Burst**. Geste lisible dans la partie droite, premier plan flou à gauche : fond du hero d'accueil avec panneau de texte à gauche sur desktop. Préserver mains, mèche et ciseaux ; ne pas transformer le visage flou de premier plan en sujet principal. | **Retenue par Simon**, hero accueil · **B** |
| **P02 — Brushing et matière** ![P02 : brosse ronde et sèche-cheveux travaillant une mèche brune.](https://burst.shopifycdn.com/photos/blowdrying-hair-on-round-brush.jpg?exif=0&format=pjpg&iptc=0&width=925) | [Source — Blowdrying Hair On Round Brush](https://www.shopify.com/stock-photos/photos/blowdrying-hair-on-round-brush), **Shopify Partners / Burst**. Lumière douce, mouvement de la mèche, outillage contemporain. Plus concret qu'un simple portrait de cheveux ; le cadrage vertical doit conserver la brosse et l'embout du sèche-cheveux. | **Retenue par Simon**, hero Coiffure et carte d'univers · **B** |
| **P03 — Finition d'une coupe courte** ![P03 : finition aux ciseaux et au peigne à l'arrière d'une coupe courte.](https://burst.shopifycdn.com/photos/barber-adds-final-touches-to-a-haircut.jpg?exif=0&format=pjpg&iptc=0&width=925) | [Source — Barber Adds Final Touches To A Haircut](https://www.shopify.com/stock-photos/photos/barber-adds-final-touches-to-a-haircut), **Matthew Henry / Burst**. Nuque, ligne de coupe et mains gantées ; ambiance plus dense que Coiffure, sans décor vintage. Garder les outils à gauche et la tête à droite ; ne pas suraccentuer les noirs. | **Retenue par Simon**, hero Barbier et carte d'univers · **B** |
| **P04 — Espace de soin** ![P04 : deux bacs de lavage blancs, une plante et un mur de briques dans un salon.](https://burst.shopifycdn.com/photos/hair-salon-sinks-on-red-brick.jpg?exif=0&format=pjpg&iptc=0&width=925) | [Source — Hair Salon Sinks On Red Brick](https://www.shopify.com/stock-photos/photos/hair-salon-sinks-on-red-brick), **Shopify Partners / Burst**. Les bacs identifient immédiatement un salon ; plante et lumière apportent de la chaleur. **Compromis accepté par Simon :** la brique donne un caractère atelier, moins épuré que l'idéal bois clair/Ivoire. Limiter cette ambiance au seul bandeau Le salon ; aucun motif brique repris dans l'interface ni usage comme image dominante de la marque. | **Retenue par Simon avec compromis accepté**, Le salon · **B** |
| **P05 — Précision de la main** ![P05 : gros plan de mains, d'un peigne et de ciseaux travaillant les cheveux.](https://burst.shopifycdn.com/photos/close-up-hands-trimming-hair.jpg?exif=0&format=pjpg&iptc=0&width=925) | [Source — Close Up Hands Trimming Hair](https://www.shopify.com/stock-photos/photos/close-up-hands-trimming-hair), **Shopify Partners / Burst**. Plan plus serré que P01, utile au bloc « Le geste juste ». Le peigne orangé reste un accent réel de l'image, pas une nouvelle couleur d'interface. | **Retenue par Simon**, bloc signature accueil · **B** |
| **P06 — Entretien de barbe** ![P06 : geste de finition de barbe à la tondeuse, vu de trois-quarts arrière.](https://burst.shopifycdn.com/photos/clippers-trim-a-mans-beard.jpg?exif=0&format=pjpg&iptc=0&width=925) | [Source — Clippers Trim A Mans Beard](https://www.shopify.com/stock-photos/photos/clippers-trim-a-mans-beard), **Matthew Henry / Burst**. Complète la coupe courte par un vrai geste de barbe. Cadrer barbe, main et outil ; limiter la cape colorée en bas si le geste reste entier. Le profil partiel, la coiffure et les bijoux interdisent de présumer l'anonymat du modèle. | **Retenue par Simon**, module éditorial Barbier · **B** |
| **P07 — Texture et nuances** ![P07 : cheveux foncés coiffés en torsades, avec des pointes brunes, vus de dos.](https://images.unsplash.com/photo-1761819921345-a5c1cedd19c5?auto=format&fit=crop&fm=jpg&q=80&w=1200) | [Source — Dark textured hair styled in twists with brown ends](https://unsplash.com/photos/dark-textured-hair-styled-in-twists-with-brown-ends-QngsebgpK84), **Corinne Sawers / Unsplash**. Introduit une texture différente et des variations de ton sans portrait frontal. Illustre la matière et la lumière, **pas une coloration attestée ni une réalisation de Créa’Tif**. | **Retenue par Simon**, module matière/nuance Coiffure · **U** |

**Alternatives examinées, non proposées pour intégration :**

- [Intérieur clair, miroirs arrondis — Brooke Cagle / Unsplash+](https://unsplash.com/photos/a-hair-salon-with-chairs-and-a-mirror-ZY45fhFPYqM) : ambiance bois, blanc et lumière plus proche de la cible premium. Toutefois, la source est verticale et payante ; elle convient mal au bandeau panoramique. Les restrictions Unsplash+ sur les bibliothèques partagées et les templates distribués ne permettent pas de traiter ce fichier comme un asset libre à déposer dans ce repo public. Aucun achat ni téléchargement sous licence effectué ; ne pas utiliser l'aperçu filigrané dans le site. Voir [licence Unsplash+](https://unsplash.com/plus/license) et [conditions, restrictions d'usage](https://unsplash.com/plus/terms).
- [Close Up Of Barber Giving A Fade — Matthew Henry / Burst](https://www.shopify.com/stock-photos/photos/close-up-of-barber-giving-a-fade) : geste pertinent, mais cape à monogrammes de marque et visage visibles. Écartée au profit de P03, visuellement plus sobre et moins exposée aux éléments tiers.

###### 2. Emplacements et cadrages validés pour implémentation

Les ratios ci-dessous sont **largeur:hauteur**. Desktop : à partir de 900 px ; tablette : 600–899 px ; petit mobile : moins de 600 px. Les points focaux sont des repères proposés dans la photo source (x depuis la gauche, y depuis le haut), **pas des recadrages déjà validés dans le navigateur**. Ne jamais déformer une photo pour remplir son cadre.

| Page / emplacement actuel | Traitement photographique retenu | Desktop | Tablette et petit mobile |
| --- | --- | --- | --- |
| **Accueil — hero**, à la place de la grande composition | **P01 en arrière-plan du hero sur desktop uniquement**, avec texte et CTA sur un panneau Ivoire opaque à gauche. C'est le principal fond photo du site ; ni la navigation ni toute la page ne deviennent photographiques. | Bandeau d'environ 560–640 px à 1440 px, sans hauteur plein écran ; grille interne 1200 px. Panneau de texte d'environ 440 px, marge intérieure 32 px. Geste visible à droite ; repère focal 70 % / 35 %. La hauteur reste extensible avec le texte. | **Sous 900 px : sur-titre et H1 → P01 en image de contenu 3:2 → mention d'illustration → introduction → CTA**, sur Ivoire et sans superposition. Repère 65 % / 40 % ; préserver l'ensemble main–ciseaux–mèche. Appliquer les dimensions et critères de premier écran précisés ci-dessous. |
| **Accueil — cartes Coiffure / Barbier** | Remplacer les deux détails abstraits par **P02 / P03**. Images de contenu, titres et liens sur surfaces unies sous les photos, pas surimprimés. | Deux cadres de même taille, **3:2**. P02 focal 60 % / 50 % ; P03 50 % / 50 %. Coiffure conserve son accent Sable/Pêche ; Barbier Encre/Sauge, sans assombrir artificiellement la photo. | Garder le comportement de grille actuel et un cadre **3:2** par carte. Outils et cheveux doivent être identifiables à 320/375 px ; ne pas utiliser un crop macro indéchiffrable. |
| **Accueil — « Le geste juste »** | **P05 en image de contenu**, à la place de la composition secondaire. Le bloc « Notre approche » reste textuel. | Image **3:2** à côté du texte, repère 55 % / 50 %. Mains et ciseaux entiers. | Texte puis image **3:2**, sans texte sur la photo. Pas de troisième répétition de P01. |
| **Coiffure — hero** | **P02 en image de contenu**. Conserver les deux colonnes et le comportement de hauteur corrigé ; ne pas en faire un fond photo. | **3:4**, comme le rendu actuel ; repère 60 % / 50 %. Préserver la courbe de la mèche, la brosse et l'embout du sèche-cheveux. | **600–899 px : 3:2 horizontal**, impérativement conservé. **Moins de 600 px : 4:5**. Texte puis image dans les deux cas ; pas de minimum de hauteur réintroduisant un grand bloc vertical sur tablette. |
| **Coiffure — « La couleur se pense aussi à la lumière »** | **P07 en image de contenu** remplace les rubans secondaires. Ce n'est ni un avant/après ni une preuve de coloration. | **3:2**, repère 50 % / 55 %, garder les pointes brunes et la texture visibles ; texte sur Ivoire/Sable à côté. | **3:2**, texte puis image ; conserver la variation de matière au lieu de serrer sur une seule torsade. Pas de photos ajoutées aux quatre cartes de prestations. |
| **Barbier — hero** | **P03 en image de contenu**, sans changer le rythme compact ni les prestations en liste. | **3:2**, repère 50 % / 50 %. Le profil arrière et les outils partagent le cadre. | **3:2**, texte puis image ; pas de recadrage portrait qui ferait disparaître les outils. |
| **Barbier — « Le détail fait l'équilibre »** | **P06 en image de contenu** remplace la composition de finition. Les trois étapes restent lisibles sur fond uni. | **3:2**, repère 60 % / 45 %. Montrer la relation outil–barbe ; ni gros plan agressif de lame ni mise en scène rétro. | **3:2**, avec le même geste entier. Si retirer la cape coupe la main ou l'outil, garder le cadrage plus large ; ne pas sacrifier le métier à une couleur parasite. |
| **Le salon — bandeau d'ambiance sous l'introduction** | **P04 retenue**, avec son compromis atelier : remplace la composition architecturale. **Fond photographique du bandeau, sans texte superposé** ; introduction et légende sur Ivoire en dehors de l'image. Une seule utilisation. | **16:9**, repère 50 % / 65 %, garder les deux bacs et la plante. Ne pas recadrer sur la seule brique : elle ne raconte pas le métier. | Photo de contenu **3:2**, pour conserver les bacs. Ne pas forcer un portrait ni remettre les coordonnées au-dessus de l'image. |
| **Le salon — seconde composition et contact** | **Ne pas ajouter une deuxième photo du même lieu** : retirer la grande composition secondaire lors de la substitution photographique et laisser le contenu respirer sur Ivoire/Sable. Les informations pratiques restent indépendantes. | Bloc textuel, séparateur fin existant ; aucun faux portrait d'équipe. | Même logique ; aucun arrière-plan photo derrière téléphone, e-mail ou informations de démonstration. |

P02 et P03 sont les seules répétitions prévues : une carte d'orientation sur l'accueil, puis le hero de la page correspondante. Cela crée un repère de navigation, pas une galerie répétitive. Aucun cliché répété deux fois sur une même page. Pas de nouvelles sections pour consommer les images disponibles.

**Accueil mobile — présence photographique au premier écran, prescription confirmée par Simon.** Sous 900 px, l'ordre est : **header → sur-titre et H1 → P01 → mention d'illustration → introduction → CTA**. L'image passe avant le paragraphe et les boutons, mais après la promesse ; ne pas la laisser après tout le bloc texte/CTA. Préserver un ordre de lecture cohérent, sans déplacer visuellement les boutons au détriment du parcours clavier.

- Réduire seulement l'espace supérieur du hero d'accueil sous 900 px à **24 px**, au lieu des 96 px actuels ; garder des écarts de **16–24 px** entre éléments. Ce réglage local ne modifie pas l'échelle d'espacement globale.
- Conserver les marges latérales de **24 px** et le cadre **3:2** : environ **327 × 218 px à 375 px de largeur**. Ne pas déformer la source ni remplacer la photo par une étroite bande décorative. Le cadrage doit rendre visibles ensemble main, ciseaux et mèche.
- Conserver les typographies et tailles lisibles, les textes sur Ivoire, les boutons de **48 px** et les focus existants. Ne pas comprimer ou masquer l'introduction ni les actions pour forcer l'ensemble dans un écran. Le CTA peut nécessiter un léger défilement sur un petit écran : ce compromis est accepté.
- Réserver les dimensions du média dès le chargement. Pas de hauteur de hero verrouillée au viewport, de texte surimprimé ou d'effet animé ajouté.

Les références suivantes désignent la **zone de contenu visible du navigateur en pixels CSS**, hors interface du navigateur, en portrait, menu fermé, sans défilement, zoom 100 %, après chargement des polices locales et de l'image. Les hauteurs visibles demandées doivent comprendre le geste identifiable : un bord de photo ou un premier plan flou seul ne suffit pas.

| Viewport de référence | Critère de présence photographique à vérifier après intégration |
| --- | --- |
| **320 × 568** | Au moins **160 px de hauteur de photo visibles**, comprenant le geste identifiable. |
| **375 × 667** | **P01 entièrement visible** dans le premier écran. |
| **390 × 844** | **P01 entièrement visible** ; vérifier aussi la place restante pour l'introduction et le CTA, sans en réduire la lisibilité. |
| **375 × 550** | Cas de hauteur disponible réduite : au moins **120 px de hauteur visibles montrant réellement le geste**. |

Ce sont des **critères de la future revue, pas des résultats déjà mesurés**. À **200 % de zoom ou avec texte agrandi**, la lisibilité, le défilement naturel et l'absence de contenu coupé priment sur l'objectif de photo visible au premier écran. Aucun titre, texte ou CTA ne doit être masqué pour maintenir cet objectif.

###### 3. Ce qui remplace l'abstraction, ce qui reste

- **Remplacer les quatre grands visuels d'ouverture**, les deux visuels des cartes d'univers et les compositions éditoriales désignées dans le tableau. L'abstraction ne doit plus porter seule la reconnaissance du métier.
- **Conserver le système graphique** : aplats Ivoire/Sable/Encre, filets Cuivre, accents Sauge/Pêche, rayons, rythmes et mise en page propres aux deux univers. Les lignes et séparateurs existants suffisent ; ne pas redessiner une nouvelle famille de motifs.
- Les grandes compositions autonomes « rencontre », « rubans », « contour » et « fenêtre » **ne sont pas conservées comme illustrations principales**. Ne pas les recycler dans chaque carte, en filigrane sur les photos ou dans une galerie. Aucun nouvel ornement n'est nécessaire pour compenser leur retrait.
- **Header, prestations, CTA final sombre et footer restent sur fonds unis**. Le fond photo est une respiration localisée, pas un habillage omniprésent. Le contact et son comportement actuel ne changent pas.

###### 4. Traitement, lisibilité et sincérité

**Traitement commun.** Couleur naturelle, blancs neutres légèrement chauds, ombres lisibles, saturation modérée. Pas de sépia, de noir et blanc généralisé, de grain vintage, de fausse patine ni d'étalonnage Cuivre appliqué à la peau. Ne pas lisser ou recolorer les cheveux pour fabriquer un résultat. Harmoniser légèrement l'exposition si nécessaire ; ne pas prétendre que les scènes de sources différentes montrent le même établissement.

**Texte et fonds photo.** Le panneau du hero d'accueil est **opaque**, pas seulement translucide ; la photo reste visible autour. Texte Encre sur Ivoire : **14,06:1** ; texte Ivoire sur bouton Cuivre : **5,15:1** ; texte Encre sur Sable : **11,09:1**. Ratios calculés sur les couleurs unies de la palette. Ils ne s'appliquent pas à un texte directement posé sur une photo. Le CTA final conserve Encre/Ivoire. Pas de texte Pêche ou Sauge courant ajouté sur les images.

Ne pas compter sur une ombre de texte ou sur un voile noir « à 40 % » pour garantir le contraste. Aucun texte informatif directement sur les photos n'est prévu dans ce brief. Si une superposition différente est demandée ensuite, contrôler le contraste sur la zone réellement derrière chaque ligne, dans chaque recadrage ; viser **4,5:1 pour tout texte**, et au moins **3:1 pour les indicateurs visuels nécessaires aux contrôles**. Références : [WCAG — contraste du texte](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [contraste non textuel](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

**Photographies d'illustration, jamais preuves commerciales.** Afficher dès l'accueil : « Créa’Tif — concept de salon fictif. Photographies d'illustration. » Sur desktop, placer cette mention sous le hero ; sous 900 px, immédiatement après P01 et avant l'introduction. Elle reste en dehors de l'image sur fond uni. Pour Le salon, légender P04 : « Ambiance de salon — photographie d'illustration, lieu non associé à Créa’Tif. » Les pages Coiffure et Barbier comportent également une mention d'illustration proche du premier visuel. Les crédits sont accessibles en texte, pas uniquement au survol.

Ne pas utiliser « notre équipe », « nos réalisations », « nos clients » ou « notre salon en images » pour légender ces médias. Aucune galerie de résultats, portrait nommé, avis ou collaboration inventés. P07 montre une texture et des nuances ; il ne démontre pas que le salon fictif a effectué une coloration ni une spécialisation technique.

Pour une image de contenu informative, l'alternative décrit brièvement le geste réellement visible (par exemple « Brushing d'une mèche avec une brosse ronde »), sans attribution à Créa’Tif. Une image purement décorative ou redondante avec sa légende n'est pas annoncée deux fois. Les arrière-plans n'emportent aucune information exclusive ; titres, CTA et mentions restent de vrais textes. Garder les focus existants sur des supports unis. Pas de zoom automatique, de parallaxe ou de carrousel.

###### 5. Sources et conditions de réutilisation vérifiées

Vérification effectuée le **7 septembre 2026**, sur les fiches des sept photos et les conditions officielles liées ci-dessous. **Licence de droit d'auteur vérifiée ne signifie pas autorisations individuelles de modèle ou de lieu obtenues.** Aucun document de cession/release propre aux scènes n'a été récupéré ; une éventuelle reconnaissance d'une personne ou d'une marque doit être traitée avant publication, pas présumée impossible parce que le visage est partiellement hors champ.

- **P01 à P06 — B, Burst Some Rights Reserved**, telle qu'affichée sur chaque fiche : usage gratuit commercial ou non, copie, adaptation et distribution permis ; attribution facultative mais encouragée. Ce n'est pas du CC0. Interdiction de revendre la photo comme telle, de constituer un service concurrent de banque d'images ou de s'en attribuer la création. La licence ne garantit pas les droits de marques, de vie privée ou de personnalité ; pas d'usage dénigrant des modèles ni d'approbation prétendue du photographe. Sources : [licence Burst](https://www.shopify.com/stock-photos/licenses/shopify-some-rights-reserved), [conditions Burst, notamment section 4](https://www.shopify.com/stock-photos/legal/terms).
- **P07 — U, licence Unsplash gratuite**, explicitement indiquée sur sa fiche : usage gratuit commercial ou non, modification et distribution permis ; crédit non obligatoire, recommandé ici. Ne pas revendre la photo sans modification significative ni recréer une banque d'images concurrente. Les marques, personnes reconnaissables et œuvres représentées ne sont pas automatiquement couvertes par cette licence. Sources : [licence Unsplash](https://unsplash.com/license), [conditions Unsplash, section 5](https://unsplash.com/terms).
- **Traçabilité au moment d'intégrer :** conserver auteur, fiche source, licence et date de consultation avec chaque fichier ; conserver une copie de la licence et noter les recadrages. Crédit conseillé : « Photo d'illustration : [auteur], [Burst ou Unsplash] », avec lien source. Télécharger les fichiers haute définition depuis les fiches officielles, sans utiliser les aperçus du présent brief comme fichiers de production. Les héberger dans le site ; les URL distantes ici ne sont que des aperçus de sélection.
- **Dépôt public :** garder les photographies sous leur licence propre, distincte de celle du code ; ne pas les annoncer comme des créations originales de Créa’Tif ni comme libres de toute restriction. La distribution autorisée par B/U ne dispense pas des droits tiers. Au contrôle du fichier haute définition et des recadrages, examiner marques, vêtements, reflets et personnes reconnaissables ; en cas de doute non résolu, obtenir l'autorisation pertinente ou soumettre un remplacement à Simon avant publication de l'image concernée. La confirmation artistique ne lève pas ces limites. Aucun fichier photo n'a été ajouté au dépôt dans cette intervention.

**Assets V1 :** l'archive `Vitrine Coiffeur.zip` et ses photographies n'ont pas été retrouvées dans le repo, les références locales `sources/` ni la recherche de médias dans le dossier de travail FREELANCE DEV. Impossible d'évaluer ici leur pertinence visuelle ou leurs droits. Cela ne prouve pas leur absence ailleurs. Aucun asset V1 n'est proposé ou réputé réutilisable sans accès au fichier et à sa provenance ; ni l'archive ni `sources/` n'ont été modifiés.

###### 6. Validation acquise et suite limitée

1. **Sélection validée le 7 septembre 2026 : P01–P07 retenues**, destinations et cadrages prescrits en section 2, maintien de P04 avec compromis atelier accepté. Aucune alternative n'est à rechercher pour cette livraison. Les limites concernant les droits tiers et les mentions d'illustration restent applicables ; aucune photo ne représente une équipe, un client, une réalisation ou un lieu réels de Créa’Tif.
2. **Brief prêt à implémenter :** Claude substitue les médias et applique le nouvel ordre mobile du hero d'accueil et les cadrages spécifiés, sans changer les fonctionnalités ni réécrire les pages. Réserver les proportions avant chargement et fournir des tailles adaptées pour éviter flou, décalages et images inutilement lourdes ; pas d'ajout de dépendance d'animation. Cette intervention UI/UX ne modifie que la présente sous-section, sans code ni asset ajouté.
3. **Rendu photographique non encore validé :** après intégration, la revue aval vérifiera uniquement métier perceptible au premier écran, lisibilité, gestes non coupés, distinction Coiffure/Barbier, mentions d'illustration et rythme. Appliquer les viewports et critères mobiles de la section 2 ; compléter par les quatre pages à **768 × 1024** et **1440 × 900 px**. Le hero Coiffure reste horizontal **3:2 entre 600 et 899 px**, avec petit mobile et desktop préservés.
4. **Deux validations distinctes :** l'accord de Simon porte sur la sélection et le brief, pas sur des captures du site photographique qui n'existent pas encore. Le rendu fera l'objet d'une revue UI/UX puis de la validation de Simon après intégration. Les contrôles fonctionnels déjà clôturés ne sont pas rouverts ; aucune nouvelle fonctionnalité ou refonte de l'identité n'est demandée.

#### Complément de direction — univers visuels et éditoriaux

Décision faisant suite à `docs/UX-REVIEW.md` (revue publiée au commit `6c7d3fa`). Ce complément précise les deux points de direction restants et peut être implémenté par Claude. Il ne constitue pas une nouvelle validation des corrections techniques.

**Intention commune :** quatre regards sur une même maison. Conserver les typographies, la navigation, les boutons, les rayons et la palette existants. Différencier les sujets, les cadrages, les compositions et le contenu ; aucune nouvelle identité de marque par page.

##### Direction des images par page

| Page | Sujet photo cible | Cadrage et lumière | Accent visuel et composition |
| --- | --- | --- | --- |
| Accueil | Une scène de conseil ou de coupe montrant la relation entre une personne et le professionnel ; mains et cheveux lisibles. | Plan moyen en 4:5 à côté du texte sur desktop ; lumière naturelle chaude, fond contemporain peu chargé. Sur mobile, recadrage 3:2 pour préserver la visibilité de la promesse et du CTA. | Ivoire dominant, touches Cuivre. Une image principale forte plutôt qu'une mosaïque dans le hero. |
| Coiffure | Cheveux en mouvement, texture naturelle, boucles ou travail de couleur ; diversité de longueurs et de textures. | Hero 4:5, cadrage trois-quarts ou de dos ; lumière latérale douce qui révèle la matière. Détails 3:2 pour les sections secondaires. Préserver la silhouette des cheveux au recadrage. | Sable et Pêche décoratifs, formes souples et composition asymétrique. Texte Encre ; Cuivre reste la couleur du CTA. |
| Barbier | Profil contemporain, ligne de coupe, contour de barbe ou geste de finition ; expression détendue et résultat naturel. | Hero 3:2, cadrage rapproché de profil ; lumière latérale plus dessinée, toujours en couleur. Gros plans secondaires sur le geste, sans peau exagérément lissée. | Encre et Sauge décoratifs, lignes nettes, composition plus resserrée. Les textes explicatifs restent sur Ivoire ; Cuivre reste la couleur du CTA. |
| Le salon / Contact | Espace accueillant : miroir, fauteuil contemporain, bois clair, lumière traversant le lieu ; détails de matières. | Hero panoramique 16:9 sous l'introduction ; plan large à hauteur humaine. Détail secondaire 4:3 d'un coin du lieu. Éviter les grands angles déformants. | Ivoire et Sable, géométrie architecturale, rythme posé. Les informations pratiques forment un bloc sobre indépendant des images. |

Pour toutes les pages : pas de filtre sépia, de noir et blanc systématique, de fauteuil rétro, de cuir/whisky ou de codes de virilité caricaturale. Conserver des couleurs de peau et de cheveux naturelles et une lumière cohérente entre images. Le sujet doit rester compréhensible à 320 px ; ne pas intégrer de texte dans les fichiers image.

##### Décision immédiate sur les assets : compositions éditoriales provisoires

Aucune photographie n'est sélectionnée ou fournie par ce complément. Pour avancer immédiatement, Claude réalisera des compositions graphiques statiques originales en SVG ou CSS, dans son périmètre `sites/` / `shared/`. Ce choix provisoire est acceptable pour la prochaine revue visuelle. Il ne doit pas être présenté comme une preuve photographique de prestations réalisées.

- **Accueil — « La rencontre » :** sur Ivoire, deux grandes formes courbes en Sable et Sauge se répondent autour d'un espace central ; un trait Cuivre les relie. Composition aérée, sans visage abstrait ni outil dessiné.
- **Coiffure — « La matière en mouvement » :** trois larges rubans courbes de largeurs différentes, Pêche et Sable, avec quelques lignes Encre espacées. Composition verticale et fluide, sans motif fin répétitif. Le mouvement est suggéré par la forme, sans animation.
- **Barbier — « La précision du contour » :** fond Encre, un arc large Ivoire et deux lignes franches Sauge composent un cadrage horizontal ; petit repère Cuivre décentré. Aucun rasoir rétro, moustache ou poteau de barbier.
- **Le salon — « La lumière du lieu » :** sur Sable, panneaux rectangulaires Ivoire évoquant une fenêtre et un miroir, avec une ombre géométrique Sauge. Ne pas dessiner de plan géographique ou d'adresse fictive.

Supprimer le dégradé générique Sauge → Pêche des emplacements éditoriaux. Chaque hero utilise sa composition propre ; les cartes d'univers de l'accueil peuvent en reprendre un détail recadré, mais aucune même image ne doit remplir indistinctement hero, portrait, galerie et contact. Ne pas ajouter de pictogramme « image manquante » ni de nom de fichier dans l'interface.

Ces compositions sont décoratives : alternative vide pour une image, ou masquage aux technologies d'assistance selon le support. Les titres et textes porteurs de sens restent dans le HTML. Préserver les styles de contraste et de focus corrigés ; Pêche et Sauge servent ici aux formes, pas au texte courant sur Sable.

En attendant des photographies exploitables : remplacer les portraits fictifs par un bloc éditorial « Notre approche » ; masquer les galeries de réalisations vides. Une seconde composition est possible lorsqu'elle éclaire le rythme de la page, mais ne pas multiplier des cartes abstraites pour remplir une galerie. Les coordonnées inconnues restent non cliquables et aucune carte factice n'est affichée.

**Trajectoire photo :** les quatre sujets du tableau constituent la liste de sélection prioritaire. Pour une future intégration, consigner dans `docs/` la source, l'auteur, les droits d'utilisation vérifiés et la destination de chaque photo. Les images de la V1 ne sont pas réputées réutilisables sans cette vérification. Une photo d'illustration ne doit pas être légendée comme un membre réel de l'équipe, une réalisation du salon ou son adresse. La présentation du projet indique qu'il s'agit d'un concept de salon fictif ; ne pas inventer d'avis, de diplômes, de résultats ni de chiffres.

##### Coiffure — expression, matière et conseil

Ton : sensible mais concret, centré sur les envies et le quotidien. Employer « mouvement », « texture », « nuance », « conseil » ; éviter les promesses génériques comme « transformation parfaite ».

Texte de hero retenu :

- Sur-titre : « Coiffure · coupe, couleur & soin ».
- H1 : « Du mouvement, de la nuance, votre style. »
- Introduction : « Une coupe qui accompagne votre texture, une couleur qui révèle vos nuances, des conseils pour retrouver vos gestes au quotidien. »
- CTA : « Nous contacter », vers le bloc contact de la page Le salon / Contact.

Ordre et contenu :

1. Hero en deux colonnes sur desktop, texte puis visuel sur mobile.
2. Bloc signature **« Partir de vous »**, avant les prestations : trois axes courts « Vos envies » (longueur, couleur, changement souhaité), « Votre matière » (texture et mouvement naturel), « Votre quotidien » (temps et habitudes de coiffage). Présentation ouverte, sans trois nouvelles cartes photo.
3. Prestations en grille 2 × 2 sur desktop, une colonne sur mobile : **Coupe & brushing** — « Une forme et un mouvement adaptés à vos envies. » ; **Couleur** — « Des nuances pensées autour de votre base et de l'effet recherché. » ; **Soins** — « Une attention portée à la douceur et à la matière du cheveu. » ; **Coiffure événementielle** — « Une coiffure imaginée avec vous pour l'occasion. »
4. Module éditorial asymétrique **« La couleur se pense aussi à la lumière »** : « Discrète ou plus affirmée, une nuance change avec la lumière et le mouvement. Le conseil commence par l'effet recherché et l'entretien envisagé. » Accompagner d'un détail de matière lorsque la photo est disponible.
5. Conclusion « Parlons de vos envies », CTA commun « Nous contacter ».

Ne pas ajouter de prix, de durée ou de promesse de résultat sans validation. Le contenu décrit l'intention du concept de salon, pas des prestations effectivement délivrées.

##### Barbier — lignes, confort et entretien

Ton : précis, calme et accessible, phrases courtes. Employer « ligne », « équilibre », « contour », « finition », « entretien » ; éviter « gentleman », « viril », « authentique à l'ancienne » et les superlatifs de performance.

Texte de hero retenu :

- Sur-titre : « Barbier · coupe, contours & entretien ».
- H1 : « Des lignes nettes, une allure naturelle. »
- Introduction : « Une coupe équilibrée, une barbe dessinée selon vos envies et des repères simples pour entretenir le résultat. »
- CTA : « Nous contacter », vers le même bloc contact.

Ordre et contenu :

1. Hero avec visuel horizontal sur desktop ; texte puis visuel sur mobile.
2. Prestations sous forme de **liste éditoriale en quatre lignes séparées**, sans reprendre la grille de cartes Coiffure : **Coupe & contours** — « Équilibrer la coupe et soigner ses lignes. » ; **Taille de barbe** — « Définir une longueur et un contour selon vos préférences. » ; **Rasage** — « Un geste attentif, guidé par le confort recherché. » ; **Soin visage** — « Un temps dédié au confort de la peau. »
3. Module **« Le détail fait l'équilibre »** : trois étapes numérotées « Échanger » (forme, longueur et habitudes), « Dessiner » (volumes et contours), « Entretenir » (repères pour le quotidien). À côté, un gros plan horizontal du geste ou la composition provisoire dédiée. Aucun horaire, réservation ou commande interactive dans ces étapes.
4. Encadré compact **« Entre deux visites »** : « La longueur que vous aimez, le contour que vous souhaitez garder, vos habitudes d'entretien : trois points à partager lors du conseil. » Pas de tutoriel de rasage ni d'allégation médicale sur les soins.
5. Conclusion « Trouvons votre ligne », CTA commun « Nous contacter ».

Cette page garde un rythme plus compact que Coiffure, avec davantage de séparateurs fins et moins de surfaces de cartes. La distinction doit rester perceptible avec les seules images retirées : ordre des sections, liste de prestations et étapes de conseil diffèrent réellement.

##### Validation de ce complément

- Les quatre pages disposent d'un hero visuellement identifiable, y compris sans lire leur titre ; aucun dégradé générique n'est répété à la place des médias.
- Coiffure et Barbier utilisent les contenus et rythmes définis ci-dessus tout en conservant les composants communs de la marque.
- Aucune galerie ou grille de portraits n'est artificiellement remplie par le même motif. Les illustrations ne sont pas présentées comme des réalisations photo.
- Les CTA « Nous contacter » aboutissent à la zone prévue ; les coordonnées fictives ne déclenchent aucun appel ou e-mail.
- Faire vérifier par l'agent UI/UX les quatre pages à 375, 768 et 1440 px, puis par QA l'absence de régression à toutes les largeurs du brief, en particulier 320 et 768 px, et au clavier.
- La prochaine revue peut valider la déclinaison graphique provisoire. La validation des photographies restera distincte si des photos sont intégrées ultérieurement.

#### Responsive, accessibilité et qualité

- Sous 900 px, utiliser un vrai bouton menu accessible au clavier.
- Sous 768 px, contenu en une colonne ; aucune section ne dépend d'une hauteur fixe de viewport.
- Une seule balise `h1` descriptive par page, puis une hiérarchie `h2` / `h3` cohérente.
- Utiliser les structures sémantiques `header`, `nav`, `main` et `footer`.
- Tous les éléments interactifs sont des boutons ou liens réels, avec focus visible et cibles tactiles d'au moins 44 × 44 px.
- Respecter un contraste WCAG AA minimal de 4,5:1 pour les textes courants.
- Prévoir `prefers-reduced-motion` et éviter parallax, zoom continu, carrousels automatiques et animations décoratives lourdes.
- Optimiser les images : formats modernes, dimensions réservées, chargement différé hors écran et suppression des assets inutilisés.

#### Critères d'acceptation avant QA

- Les quatre pages existent, les liens internes fonctionnent et aucune erreur JavaScript n'est générée dans les parcours usuels.
- Aucun écran ne simule un compte, un mot de passe ou une réservation réelle.
- Le menu mobile fonctionne au clic et au clavier.
- Le rendu est vérifié à 320, 375, 768, 1024 et 1440 px, ainsi que sur très grand écran.
- Les focus, contrastes, textes alternatifs et structures de titres sont vérifiés.
- Chaque page possède un titre et une méta-description uniques ; un favicon est présent.
- Les données fictives restent identifiées comme telles dans la présentation du portfolio.

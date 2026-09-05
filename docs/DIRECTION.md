# Direction du projet

Ce fichier centralise les décisions de direction (produit, contenu, périmètre) prises avec Codex (ChatGPT), pour que Claude implémente à partir de la même base.

## Portfolio global

_(à compléter : positionnement du portfolio, cible, nombre de sites prévus, style général)_

## Sites

### coiffeur-mixte

#### Statut et objectif

Premier projet du portfolio : une vitrine statique de démonstration, pensée pour montrer une intégration front-end premium, responsive et accessible. Il ne s'agit pas d'un site commercial prêt à recevoir de vrais rendez-vous.

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

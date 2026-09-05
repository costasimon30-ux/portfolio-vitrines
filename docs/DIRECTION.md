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

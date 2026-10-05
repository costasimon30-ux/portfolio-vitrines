# QA — La Tablée des Forges

## État au 5 octobre 2026

**Verdict : impossible de conclure à la recette ciblée ni à la clôture prépublication.** La matrice QA demandée pour la source exacte `2d325b560a9be87f72d1912b95a543649eddc71a` a été préparée, mais **n'a pas été exécutée**. Aucun défaut fonctionnel bloquant nouveau n'est établi par cette passe ; l'absence de test ne vaut pas conformité. Aucun code ni déploiement n'a été modifié.

## Contrôles effectivement réalisés

- La source exacte a été extraite en isolation dans `/private/tmp/qa-tablee-ZxevM8`, sans utiliser l'état récent de `main` comme substitut. L'assemblage local de production avec le Node officiel 22.23.2 a abouti : `node scripts/assemble-site.mjs la-tablee-des-forges --environment production`. L'artefact local contient 31 fichiers (859,5 KiB), trois notices et zéro fichier partagé ; le SHA-256 du script `js/defilement.js` assemblé correspond à celui de la source. Cela prouve seulement que la construction locale aboutit, pas que l'inventaire public et tous les parcours sont conformes.
- Les conventions et critères de `docs/DIRECTION.md`, ainsi que la revue `docs/UX-REVIEW-la-tablee-des-forges.md` au commit `3e6a3b255c9942f00eff31fcbd462f89e096377a`, ont été consultés. Cette revue est une preuve UI/UX séparée, non une exécution de la présente recette QA.
- Un précontrôle visuel antérieur a produit 15 PNG et un inventaire dans `/private/tmp/tablee-vis-2d325b5-2beV80/`. Une observation ponctuelle à 1680 px a montré une entrée, sortie puis seconde entrée de groupes au défilement. Ces éléments ne remplacent pas les scénarios de la matrice 3 pages × 4 dimensions et ne justifient aucun verdict de passage.

## Non vérifié dans cette recette

- Accueil, La carte et Le lieu à 320×568, 375×667, 768×1024 et 1440×900 : navigation, liens, ancres, CTA, footer, prix, mentions fictives, photos et crédits ; entrée/sortie/réentrée complète des groupes, stabilité après arrêt du défilement, bas de page, débordement horizontal et CLS imputable au lot.
- Accès directs, retour d'historique, Origine/Fin, vrai parcours clavier et focus ; absence de JavaScript, mouvement réduit et échec d'observation ; contraste calculé, erreurs console/réseau et ressources manquantes.
- **Zoom Chrome natif 200 % : non vérifié.** Une simulation de viewport ne le remplace pas. Selon `docs/DIRECTION.md`, son absence bloque la clôture prépublication, sans établir à elle seule un défaut du code. Le débordement de 1 px émulé à 160 px sur La carte reste une réserve antérieure à confirmer ou infirmer en zoom réel.
- Vraie 404 et en-têtes Cloudflare : contrôles hébergés non applicables avant dépôt autorisé.

Les réserves photo P02/P03/P04 bis et l'arbitrage esthétique de Simon restent distincts de cette absence de recette et ne sont pas rouverts ici. **Suite nécessaire :** exécuter la matrice ciblée sur cet artefact exact, puis obtenir le contrôle du zoom natif 200 % par QA ou par Simon avant toute décision de clôture. Ce rapport n'autorise aucune publication.

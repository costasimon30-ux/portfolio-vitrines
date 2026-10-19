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

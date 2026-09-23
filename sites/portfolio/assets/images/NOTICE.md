# Aperçu de Créa’Tif — portfolio

Ce dossier contient les deux fichiers utilisés par la carte Créa’Tif de la
section « Réalisations » (`index.html`), en remplacement de la composition
abstraite d’origine. Décision : « Arbitrage produit — aperçu réel de Créa’Tif
dans « Réalisations » » du 23 septembre 2026, `docs/DIRECTION.md`. Cette
dérogation ne vaut que pour cet emplacement ; elle ne rouvre pas la décision
P06 (`sites/coiffeur-mixte/assets/photos/NOTICE.md`), qui reste en vigueur
partout ailleurs.

## Page et date de capture

- **Page capturée :** l’accueil de Créa’Tif (`sites/coiffeur-mixte/index.html`,
  révision `edeeb30`, identique à la version publiée le 8 septembre 2026 sur
  <https://portfolio-vitrines-coiffeur-mixte.costa-simon30.workers.dev/> —
  aucun changement entre les deux au moment de la capture).
- **Méthode :** artefact de production assemblé localement
  (`node scripts/assemble-site.mjs coiffeur-mixte --environment production`)
  et servi en HTTP local, capturé avec Chromium (Playwright), sans zoom, sans
  émulation d’appareil, `deviceScaleFactor: 1`. Aucune capture n’a été prise
  sur la page Barbier ni sur le bloc « Le détail fait l’équilibre » (P06).
- **Date :** 23 septembre 2026.
- **Élément capturé :** le bandeau `.hero--home .hero__band` dans son
  intégralité (panneau de titre + photographie de fond), aucune autre zone de
  la page.

## Les deux cadrages

| Fichier | Largeur de prise (viewport) | Cadrage final | Dimensions livrées |
| --- | --- | --- | --- |
| `creatif-hero-mobile-3-2.webp` | 1024 px | 3:2 | 720 × 480 px |
| `creatif-hero-desktop-16-9.webp` | 1200 px | 16:9 | 896 × 504 px |

Dans les deux cas, la capture d’origine est un export PNG exact du bandeau
rendu (1024 × 641 px, puis 1200 × 641 px). Le seul traitement appliqué est un
recadrage géométrique — retrait d’une marge à droite (fond flou / manche,
sans aucun outil ni geste), jamais à gauche ni en haut, pour atteindre
exactement 3:2 puis 16:9 — suivi d’un redimensionnement uniforme (Lanczos,
sans déformation) et d’une conversion en WebP (qualité 82). Aucune retouche
colorimétrique, aucun filtre, aucune recomposition de l’interface : le titre,
le geste de coupe (ciseaux) et l’outil (peigne) restent visibles ensemble
dans les deux fichiers, tels que rendus par le navigateur.

Les deux thèmes Clair et Sombre du portfolio utilisent ces deux mêmes
fichiers, sans variante par thème, dans un simple filet neutre de 1 px
(`--c-filet`) posé par `css/style.css` — aucun faux cadre de navigateur n’est
ajouté à l’image.

## Photographie visible dans la capture

La photographie visible en fond du bandeau est **P01, « Stylist Cutting Long
Hair »**, attribuée à **Shopify Partners**, distribuée sous licence **Burst —
« Some Rights Reserved »**. Fiche source, conditions de licence complètes et
contrôle du fichier (aucun visage identifiable relevé pour P01) :
`sites/coiffeur-mixte/assets/photos/NOTICE.md`.

**Cette licence ne vaut pas autorisation individuelle garantie pour une
personne représentée.** Comme le rappelle la notice source, une licence de
droit d’auteur vérifiée ne couvre ni la vie privée ni les droits de la
personnalité, et aucun document de cession propre à cette scène n’a été
obtenu. La présente capture ne lève donc aucune réserve relative aux droits
des personnes ; elle n’en introduit pas non plus de nouvelle : le cadrage
retenu ne montre ni P06 ni aucune marque ou personne reconnaissable qui ne
soit déjà couverte par le contrôle fait sur P01 dans la notice source.

## Statut de la démonstration

Le statut de salon fictif et de photographies d’illustration reste explicite
sur la carte elle-même (« Un concept de salon fictif... photographies
d’illustration ») et sur la page source de Créa’Tif ; cette notice ne le
répète pas ailleurs dans le portfolio.

## Avant toute nouvelle publication

Cette validation porte sur la sélection et une implémentation limitée à
`sites/portfolio/` ; elle n’autorise ni la validation du rendu final ni la
publication du portfolio (`docs/DIRECTION.md`, 23 septembre 2026). Avant
publication, revérifier que la révision de Créa’Tif effectivement en ligne
correspond toujours à `edeeb30` ; en cas d’écart, réexaminer si la capture
reste fidèle à l’interface réellement affichée.

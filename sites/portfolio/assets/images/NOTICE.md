# Aperçu de Créa’Tif — portfolio

> Ce fichier documente deux aperçus de la section « Réalisations » : celui de
> Créa’Tif (ci-dessous) et celui de La Tablée des Forges (en fin de fichier).

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

---

# Aperçu de La Tablée des Forges — portfolio

Ce chapitre documente le fichier `tablee-hero-desktop-16-9.webp`, utilisé à
toutes les largeurs par la carte « La Tablée des Forges » de la section
« Réalisations » (`index.html`). Décision : « Deux démos dans Réalisations » du
6 octobre 2026 et § 11, `docs/DIRECTION.md` : capture fidèle du hero d'accueil
de la démo effectivement publiée, sans filtre, sans retouche de l'interface,
sans faux navigateur ni substitution photographique.

**Révision du 6 octobre 2026 (arbitrage de Simon).** La première intégration
(commit `09ded67`) livrait aussi un cadrage 3:2 pour les largeurs inférieures
à 1024 px. Simon l'a remplacé par le 16:9 complet : le 3:2 coupait la moitié
droite du verre et la fin du crédit. Le fichier `tablee-hero-mobile-3-2.webp`
est retiré du dossier et de `publication.json` ; il reste consultable dans
l'historique git. Le nom `…-desktop-16-9.webp` est conservé tel quel pour que
le fichier reste identique octet pour octet à celui déjà validé ; il sert
désormais à toutes les largeurs.

## Page capturée, date et méthode

- **Page :** l'accueil de La Tablée des Forges,
  <https://la-tablee-des-forges.costa-simon30.workers.dev/>, source figée
  `2d325b560a9be87f72d1912b95a543649eddc71a`, version Cloudflare active
  `b462d268` (dépôt manuel du 6 octobre 2026).
- **Élément capturé :** le bandeau `.hero` de l'accueil dans son intégralité
  (nom, offre, boutons, photographie et sa légende de crédit), aucune autre
  zone de la page.
- **Date :** 6 octobre 2026.
- **Méthode :** Chromium (Playwright), fenêtre de 1024 × 900 px,
  `deviceScaleFactor: 1`, sans zoom ni émulation d'appareil ; export PNG exact
  du bandeau (1024 × 498 px, SHA-256
  `e7edeecafc56994d3eede36c54dfbf310c70e40267e65be9bc7db4fc2b670175`).
- **Écart à signaler :** l'accès réseau de l'environnement de travail vers
  l'adresse publique est refusé par la politique de sortie (HTTP 403), la
  capture n'a donc **pas** été prise sur l'URL en ligne. Elle a été prise sur
  le paquet de dépôt conservé hors du dépôt, servi en HTTP local : 31 fichiers,
  empreinte agrégée
  `64a057e23253cc4dae12665532643505231d14cd4c5f7c4360dd582c11b55fd0`
  (`find . -type f | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256`). Après le
  dépôt, les 30 fichiers publiquement servis sur 31 avaient été comparés
  individuellement à ce paquet (30 identiques, 0 écart ; `_headers` n'est pas
  servi) : le HTML, le CSS, le JavaScript et les images rendus sont donc ceux
  de la démo publiée. Avant toute nouvelle publication de la démo, revérifier
  que la version en ligne correspond toujours à cette source.

## Le cadrage

| Fichier | Zone recadrée dans la capture (x, y, largeur × hauteur) | Cadrage | Dimensions livrées | SHA-256 |
| --- | --- | --- | --- | --- |
| `tablee-hero-desktop-16-9.webp` | 0, 0, 880 × 495 | 16:9 | 880 × 495 px | `01f79b931a3fe270e20556dbf51bc9603a821fb358ae3248d541c04818e68c31` |

Le seul traitement est un recadrage géométrique à partir du coin supérieur
gauche (retrait de 144 px à droite et de 3 px en bas de la capture de
1024 × 498 px), **sans
rééchantillonnage**, suivi de la conversion en WebP (qualité 90, sans
métadonnées). Aucune retouche colorimétrique, aucun filtre, aucune
recomposition. Dans ce cadrage, le nom « La Tablée des Forges », le burger, les
frites et le verre de bière sont visibles (le verre tel que la photographie
elle-même le cadre), ainsi que la légende de crédit de la photographie (« Photographie d’illustration. Andrea Prochilo,
Pexels »), qui n'est pas tronquée. Sur les écrans étroits (320 et 375 px), la
vignette est réduite d'un seul bloc : le texte du bandeau et le crédit y
deviennent petits mais restent entiers ; le texte alternatif de l'image les
transcrit. La démo elle-même n'est pas modifiée.

**Limite à connaître.** Le 16:9 n'est pas le bandeau entier : la capture
complète fait 1024 × 498 px (environ 2,06:1). La bande de 144 px retirée à
droite contient le cinquième droit de la photographie (fond sombre et frites)
et son filet droit : dans la vignette, la photographie touche donc le bord droit
du cadre. Titre, burger, frites, verre et crédit complet restent dans le
cadrage. Montrer toute la photographie imposerait un rapport d'environ 2:1
(hors du 16:9 arbitré le 6 octobre 2026) ; ce choix reste à Simon.

Les deux thèmes Clair et Sombre du portfolio utilisent ce même fichier, sans
variante par thème, dans un filet neutre de 1 px (`--c-filet`) posé par
`css/style.css`. Aucun texte de la carte n'est posé sur l'image.

## Photographie visible dans la capture

La photographie du bandeau est **P01 de La Tablée des Forges**, « Burger and
Fries » :

- **Fiche :** <https://www.pexels.com/photo/burger-and-fries-24554391/>
- **Auteur :** Andrea Prochilo, Pexels
- **Licence :** [Pexels License](https://www.pexels.com/license/)
- **Original reçu :** 7008 × 4672 px, SHA-256
  `d160b94066506afd40a20c54e67779a9ce60999356afbafab086ec168e3f0877`
  (l'original n'est pas dans le dépôt)
- **Fichier affiché dans la capture :** `p01-accueil-burger-960.webp` de la
  démo, image entière en 3:2 ; transformations de la démo : réduction (Lanczos)
  et export WebP, sans EXIF. Détails dans
  `sites/la-tablee-des-forges/assets/NOTICE.md`.

**Réserve acceptée, non levée.** Le verre à l'arrière-plan porte un marquage
clair, entièrement flou (aucune lettre ni aucun logo lisible), examiné à pleine
résolution lors de l'intégration de la démo. Simon accepte cette réserve pour
l'usage sur le portfolio indexable et décidera d'un retrait ou d'un
remplacement si un problème concret apparaît (décision du 6 octobre 2026). La
licence Pexels ne garantit pas les droits de marque ou de personne : cette
capture ne lève aucune réserve et n'en ajoute pas. Les autres photographies de
la démo (P02, P03, P04 bis) ne sont pas importées dans le portfolio.

## Statut de la démonstration

Le statut de démonstration fictive est explicite sur la carte elle-même
(« Démonstration », « Un concept de brasserie-bar fictif… Aucun établissement de
ce nom n'existe ») et sur le site source. L'adresse, les horaires et les prix de
la démo ne sont pas repris dans le portfolio.


# Ligne Posée — notice des visuels produits

Notice **locale** : ce fichier n'est pas listé dans `publication.json`, il n'est donc pas publié. Sa version **publique** courte, sans informations de suivi, est `assets/produits/NOTICE.md` (publiée et liée depuis le pied de page des sept pages, LP-QA-02).

## Provenance

- 20 visuels de produits **générés par IA** (outil de génération d'images intégré, fond non transparent), un par modèle du catalogue de démonstration. Produits, marque, références et prix de Ligne Posée sont fictifs.
- Direction et prompts : voir `INVENTAIRE.md` et `PILOTE.md` dans le dossier source local `/Users/simoncosta/Documents/ChatGPT/PORTFOLIO/visuels-ligne-posee/` (hors dépôt). Le pilote `sup-01` puis les 19 autres images ont été validés visuellement par Simon le 12 octobre 2026 (`docs/DIRECTION.md`, « Actualisation médias »). Cette validation n'est ni celle du rendu intégré, ni une autorisation de publier.
- Aucune photographie réelle, aucun fabricant, aucune marque ni aucun partenariat : les images ne représentent aucun produit existant et ne portent ni texte, ni logo.
- Sources maîtresses : PNG carrés de 1254 × 1254 px, conservés tels quels hors dépôt.

## Fichiers du site

- `assets/produits/<id du modèle>-<largeur>.webp`, trois largeurs carrées (320, 640 et 960 px) par modèle, soit 60 fichiers WebP (qualité 88, redimensionnement Lanczos, aucune retouche d'image ni de couleur). Environ 0,9 Mo au total ; une carte ou une fiche ne charge qu'une largeur, choisie par `srcset`/`sizes`.
- `js/visuels.js` : correspondance modèle → fichiers (par l'identifiant du modèle), textes alternatifs, mentions, repli. `data/catalogue.json` n'a pas été modifié.

| Modèle | Nom | Source maîtresse | SHA-256 de la source |
| --- | --- | --- | --- |
| sup-01 | Rehausseur d’écran | `pilote-sup-01-noir-mat.png` | `d45aa28754155a6a…` |
| sup-02 | Support d’ordinateur portable | `sup-02-noir-mat.png` | `6d4856164ee62bd2…` |
| sup-03 | Bras d’écran articulé | `sup-03-noir-mat.png` | `b8e699d8a37eab41…` |
| sup-04 | Support de tablette | `sup-04-noir-mat.png` | `1cf0e1c277bfa208…` |
| sup-05 | Support de casque | `sup-05-noir-mat.png` | `637114bf76f85679…` |
| tap-01 | Tapis compact | `tap-01-graphite.png` | `30d56989310839e7…` |
| tap-02 | Tapis classique | `tap-02-graphite.png` | `3caa90f9f281f70b…` |
| tap-03 | Tapis grand format | `tap-03-graphite.png` | `c9471abd3b358a43…` |
| tap-04 | Tapis en feutre | `tap-04-graphite.png` | `63db8c5faa42937e…` |
| tap-05 | Sous-main avec rangement | `tap-05-graphite.png` | `4971460716a83050…` |
| lum-01 | Lampe de bureau | `lum-01-noir-mat-chaud.png` | `e75ffe1cc5c492a4…` |
| lum-02 | Barre lumineuse d’écran | `lum-02-noir-mat-chaud.png` | `386991a07853dc62…` |
| lum-03 | Lampe articulée | `lum-03-noir-mat-chaud.png` | `2f47c7129b787df9…` |
| lum-04 | Éclairage d’ambiance | `lum-04-noir-mat-chaud.png` | `2b5ce7079e617fd8…` |
| lum-05 | Lampe nomade | `lum-05-noir-mat-chaud.png` | `1a00e0256191f7ae…` |
| ran-01 | Organiseur de bureau | `ran-01-compact-noir-mat.png` | `1fa75c633a3778cf…` |
| ran-02 | Boîte range-câbles | `ran-02-noir-mat.png` | `63abcec87d11438f…` |
| ran-03 | Vide-poche | `ran-03-noir-mat.png` | `ece69e1996e8150a…` |
| ran-04 | Rangement vertical | `ran-04-noir-mat.png` | `a1edbdf516d8462b…` |
| ran-05 | Module à tiroir | `ran-05-noir-mat.png` | `26488cfa27bd160d…` |

## Règles d'affichage

- **Une seule image par modèle**, jamais par variante : elle montre une configuration illustrative (noir mat, graphite pour les tapis, éclairage blanc chaud). Choisir une autre finition, un autre format ou une autre température de lumière ne change pas l'image et ne doit jamais laisser croire qu'elle montre la variante choisie.
- Mention visible sous chaque visuel : « Visuel d’illustration généré ; variantes non représentées. » sur les cartes du catalogue ; « Visuel d’illustration généré ; la variante sélectionnée (finition, format) n’est pas représentée. » sur la fiche.
- Textes alternatifs : nom du modèle, « illustration générée » et forme visible de l'objet ; aucune couleur, finition, matière de variante ni caractéristique technique.
- Dimensions réservées avant chargement (attributs `width`/`height` et ratio 1/1) ; si l'image ne charge pas, un cadre de même taille affiche « Visuel indisponible » et la mention est retirée.
- Accueil : seul le visuel du modèle sup-01 ouvre la page (cadre 4:3, légende « Illustration générée — modèle fictif, finitions non représentées. »).

## Limites connues

- Les images sont illustratives : proportions, tailles relatives, matières et finitions ne sont pas contractuelles. Aucune échelle n'est visible : les formats « petit » et « grand » des tapis et des rangements ne se distinguent pas sur l'image.
- Les finitions autres que celle illustrée (blanc satiné, sable, aspect aluminium brossé, etc.) ne sont pas représentées, de même que les deux températures de lumière : l'image du modèle d'éclairage montre un éclairage chaud.
- Les images sont générées par IA : de petits détails de construction (assemblages, fixations, proportions fines) peuvent être imprécis et ne doivent pas être lus comme des spécifications.
- Rendu vérifié avec Chromium (Playwright) ; WebP seul, sans AVIF ni repli PNG.
- Aperçu local : `cd sites/boutique-setup/dist && python3 -m http.server 8080` après `node scripts/assemble-site.mjs boutique-setup --environment preview`, puis http://localhost:8080/catalogue.html.

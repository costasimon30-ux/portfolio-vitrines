# Publication du portfolio — journal

Ce fichier consigne les mises en ligne du site `sites/portfolio`, conformément
à `docs/ARCHITECTURE.md` § 5.4 et § 5.6. Une entrée par dépôt. Aucune entrée
n'est rédigée par anticipation : chaque ligne est un constat, pas une intention.

## Dépôt n° 1 — 18 septembre 2026

### Identification

| | |
| --- | --- |
| Révision source | `a5d03952d6f5c75d176018640c829ab87bc6e56c` |
| Arbre source | `943b3d175a63a8066c0048eadb901c62a87725da` |
| Message | `site(portfolio): laisse le contact des mentions légales en texte simple` |
| Empreinte de l'artefact | `8fb2220c64447ff5da30bfda5252ae23d78069631037d2cf73e279a28504a043` |
| Volume | 11 fichiers, 68 513 octets |
| URL publique | `https://portfolio-simon-costa.costa-simon30.workers.dev/` |
| Hébergement | Cloudflare Workers Static Assets, Worker `portfolio-simon-costa` |
| Compte | même compte que la démo Créa'Tif (un seul compte, deux Workers) |
| Accord de Simon | donné sur cet artefact précis, après présentation du hash et de l'empreinte |
| Constat de mise en ligne | 2026-09-18T19:47:51Z (en-tête `date` de la première réponse observée) |
| Version Cloudflare | `664503f4` — relevée le 19 septembre, voir réserve n° 1 |

### Méthode

1. Copie propre de la révision hors du dépôt de travail (`git archive a5d0395`),
   `git status --short` vide au moment de l'extraction.
2. Assemblage `node scripts/assemble-site.mjs portfolio --environment production`,
   Node 22.23.2 (conforme à `.node-version`).
3. Empreinte calculée par
   `find . -type f | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256`
   depuis la racine de `dist/`.
4. Dépôt **manuel** par le tableau de bord Cloudflare, écran
   « Create an app → Upload your static files → Upload and deploy », dossier
   `~/Sites/artefacts/portfolio-simon-costa` déposé par Simon lui-même.
   Aucun raccordement Git, aucun déploiement automatique.
   Simon a saisi lui-même son authentification ; aucun secret n'a transité par
   la conversation, les captures ou le dépôt.

### Vérifications avant dépôt (local, § 5.6)

- Suite `scripts/verif-assemblage.mjs` : 89 réussis, 0 échec, `Conformité : OUI`.
- Preview → `noindex, follow` sur les deux pages ; production → `index, follow`
  sur l'accueil, `noindex, follow` sur la 404.
- Double assemblage identique octet pour octet ; `sites/coiffeur-mixte/dist`
  ni créé ni nettoyé.
- Inventaire strictement conforme au manifeste : 2 pages + 7 `publicFiles` +
  0 `sharedFiles` + 2 générés = 11.
- Aucun contenu interne (`docs`, `publication.json`, `scripts`, `.git`,
  `shared`, `CLAUDE.md`, `.gitignore`, `.node-version`).
- 7/7 ressources copiées identiques à la source ; les trois WOFF2 correspondent
  aux empreintes documentées dans `assets/fonts/NOTICE.md`.
- Service HTTP local sur `dist/` seul : aucune requête en échec, aucune erreur
  JavaScript, aucune dépendance hors artefact.
- 4 balises `og:` actives ; `og:url`, `og:image` et `canonical` absents.
- Empreinte reproduite à l'identique sur deux machines et deux versions de Node
  (22.23.2 et 22.22.2) : la sortie est déterministe.

### Vérifications après dépôt (hébergé, contrôles de fumée)

Ces contrôles **ne constituent pas la recette QA hébergée** (§ 5.6, dernier
paragraphe). Ils établissent seulement le lien entre la source et ce qui est
servi, et ce qui a été observé le jour du dépôt.

- **Lien source ↔ publication démontré par empreinte** : les 10 fichiers
  publiquement servis ont été récupérés depuis l'origine et hachés en SHA-256
  dans le navigateur. Les 10 sont **identiques octet pour octet** aux fichiers
  de l'artefact validé. Le onzième, `_headers`, n'est pas servi (404) : c'est le
  comportement attendu, Cloudflare le consomme comme configuration.
- **`_headers` est bien interprété** : `/assets/fonts/NOTICE.md` est servi en
  `text/plain; charset=utf-8` avec `X-Robots-Tag: noindex, follow`.
- **HTTPS** : origine servie en `https:`.
- **Routage** : `/index.html` et `/index` redirigent vers `/` ;
  `/404.html` redirige vers `/404`. Toutes ces pages répondent ensuite en 200
  avec le bon titre.
- **404 réelles** : `/chemin-qui-nexiste-pas` et `/dossier/imbrique/inexistant`
  répondent **404** (et non 200) avec la page « Page introuvable — Simon COSTA »
  et `noindex, follow`.
- **Aucun contenu interne exposé** : `/publication.json`, `/docs/DIRECTION.md`,
  `/docs/`, `/CLAUDE.md`, `/package.json`, `/scripts/assemble-site.mjs`,
  `/css/`, `/assets/` répondent tous 404. Le chemin d'un autre site du dépôt,
  `/sites/coiffeur-mixte/index.html`, répond 404 : les deux publications sont
  bien étanches.
- **Chargement de la page** : accueil, deux feuilles de style, trois fontes et
  le favicon, tous en 200. Aucune erreur JavaScript, aucune ressource manquante.
- **Indexation** : `robots.txt` servi sans `Disallow` ; accueil en
  `index, follow` ; 404 en `noindex, follow`.

### Réserves

1. ~~**Identifiants de version et de déploiement Cloudflare non relevés.**~~
   **Levée le 19 septembre 2026, lors de la préparation du dépôt n° 2 :** la
   version de ce dépôt est **`664503f4`**, « Manually deployed — Dashboard — by
   costa.simon30 ». Relevée dans l'onglet *Deployments* du Worker, où elle était
   l'unique entrée de l'historique jusqu'au dépôt n° 2. Le tableau de bord
   n'expose que ce préfixe court, pas l'identifiant complet.
2. **La règle `https://:version.:project.pages.dev/*` de `_headers` est inerte
   sur un Worker.** Elle vient du modèle Cloudflare Pages. Les éventuelles URL
   versionnées du Worker ne sont donc pas couvertes par un `X-Robots-Tag`.
   À trancher : soit adapter la règle au format Workers, soit la retirer et
   documenter que la non-indexation des previews repose ailleurs.
3. **`X-Robots-Tag` absent des réponses 404.** La règle `/404.html` de
   `_headers` ne s'applique pas à la réponse 404 réécrite. La non-indexation de
   ces réponses repose donc sur la seule balise `<meta name="robots">` de la
   page, qui est bien présente. Effet pratique faible, mais ce n'est pas ce que
   `_headers` laisse attendre.
4. **Contrôles de fumée uniquement.** Rien ici ne remplace la recette QA
   hébergée : paliers 320/375/768/1440, clavier, focus, lien d'évitement, zoom
   200 %, cache froid, erreurs réseau. **La mise en avant du portfolio auprès de
   prospects ou d'employeurs reste suspendue à cette recette.**
5. **Divergence assumée entre la source et l'artefact déployé, sur `_headers`.**
   L'arbitrage de l'Architecte du 18 septembre (commit `83ad43e`) demandait de
   retirer de `_headers` la règle héritée du gabarit Pages
   (`https://:version.:project.pages.dev/*`) et la règle `/404.html`
   (réserves 2 et 3 ci-dessus). L'Architecte a tranché le 19 septembre : les
   deux règles sont inertes sur ce Worker (aucune ne matche jamais une requête
   réelle), leur retrait ne change donc aucun en-tête réellement reçu par un
   visiteur ou un robot. Republier ce dépôt pour ce seul motif contredirait la
   règle déjà actée « pas de republication pour une amélioration de confort
   isolée » (`docs/DIRECTION.md`). Décision : le générateur (`scripts/
   assemble-site.mjs`) est corrigé à la source pour un futur dépôt ; l'artefact
   du dépôt n° 1 ci-dessus continue de contenir les deux règles inertes, sans
   effet sur le comportement réellement servi. Écart connu et assumé, pas une
   régression à corriger par une republication séparée.

### Suite

- Passer la recette QA hébergée (§ 5.6, dernier paragraphe) avant toute
  diffusion de l'URL.
- ~~Compléter les identifiants Cloudflare dans le tableau ci-dessus.~~ Fait le 19 septembre (réserve n° 1).
- Réserves 2 et 3 sur `_headers` tranchées par l'Architecte le 19 septembre (voir réserve 5 ci-dessus) : écart assumé, pas de republication pour ce seul motif. Reste à faire : corriger `scripts/assemble-site.mjs` pour qu'un futur dépôt n'émette plus ces deux règles.


## Dépôt n° 2 — 19 septembre 2026

**Ce dépôt met en ligne la nouvelle direction artistique « boisée et cocooning »
et les deux corrections du 19 septembre.** Il remplace intégralement l'apparence
publiée par le dépôt n° 1 : palette, typographie, formes et motif changent, la
structure, le contenu et les paliers responsive ne changent pas.

### Identification

| | |
| --- | --- |
| Révision source | `3dc315082e2290fb877dc3cce2edfeecb14d33de` |
| Message | `build(assemblage): retire deux regles _headers inertes sur Workers` |
| Empreinte de l'artefact | `62d1f22a17c35c81dbc7242c99b33e1c8b2cf7f0d14befc2e2c8728f3ceb87db` |
| Volume | 11 fichiers, 88 326 octets |
| URL publique | `https://portfolio-simon-costa.costa-simon30.workers.dev/` (inchangée) |
| Hébergement | Cloudflare Workers Static Assets, Worker `portfolio-simon-costa` |
| Accord de Simon | explicite, sur cette révision précise, relayé par le Chef de projet |
| Constat de mise en ligne | 2026-09-19T18:08:27Z (en-tête `date` de la première réponse observée) |
| Version Cloudflare | **`d3806c5f`** — « Manually deployed — Dashboard — by costa.simon30 », 100 % du trafic |
| Version précédente | `664503f4` (dépôt n° 1), conservée dans l'historique des versions |

### Ce que cette révision apporte

Trois commits, tous déjà sur `main` au moment du dépôt :

- `0b925b6` — refonte complète de la direction artistique (`docs/DIRECTION.md`,
  commit `c9266ab`) : palette bois/crème/anthracite en sept jetons, Nunito
  400/700/800 en remplacement de Manrope, boutons en pilule 999px de 52px de
  hauteur minimale, cartes crème, motif de veinage de bois en SVG, focus dont la
  couleur suit le fond, interlignage 1.6, nouveau favicon.
- `8c9189d` — rayon des cartes porté à 24px sur arbitrage de l'UI/UX
  (`docs/DIRECTION.md`, commit `3bc8ee5`) ; le rayon du visuel intérieur en
  dérive par calcul et vaut donc 18px.
- `3dc3150` — retrait des deux règles `_headers` inertes sur arbitrage de
  l'Architecte (réserve n° 5 du dépôt n° 1). **C'est le premier artefact publié
  qui en est exempt** : la divergence consignée en réserve n° 5 est donc levée
  pour le portfolio à partir de ce dépôt.

### Méthode

Identique au dépôt n° 1.

1. Copie propre de la révision hors du dépôt de travail
   (`git archive 3dc315082e2290fb877dc3cce2edfeecb14d33de`), `git status --short`
   vide au moment de l'extraction.
2. Assemblage `node scripts/assemble-site.mjs portfolio --environment production`,
   Node 22.23.2 (conforme à `.node-version`).
3. Empreinte calculée par
   `find . -type f | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256`
   depuis la racine de `dist/`.
4. Dépôt **manuel** par le tableau de bord Cloudflare, écran
   « Deployments → New deployment → Upload static files to update your Worker »,
   dossier `~/Sites/artefacts/portfolio-simon-costa-v2` déposé par Simon
   lui-même. Aucun raccordement Git, aucun déploiement automatique. Simon a
   saisi lui-même son authentification ; aucun secret n'a transité par la
   conversation, les captures ou le dépôt.

### Vérifications avant dépôt (local, § 5.6)

- Suite `scripts/verif-assemblage.mjs` : **89 réussis, 0 échec**,
  `Conformité : OUI — rejeu sur la version figée`.
- Preview → `noindex, follow` sur les deux pages (empreinte
  `92641bc41bebbb481d086ab030a17e1e7e1cf696032c16b9b938cfb8b4594498`) ;
  production → `index, follow` sur l'accueil, `noindex, follow` sur la 404.
- Double assemblage identique octet pour octet ; `sites/coiffeur-mixte/dist`
  ni créé ni nettoyé.
- Inventaire strictement conforme au manifeste : 2 pages + 7 `publicFiles` +
  0 `sharedFiles` + 2 générés = 11.
- Aucun contenu interne (`docs`, `publication.json`, `scripts`, `.git`,
  `shared`, `CLAUDE.md`, `.gitignore`, `.node-version`) — ni aucune trace de
  Manrope, dont les fichiers ont été retirés du dépôt.
- 7/7 ressources copiées identiques à la source ; les trois WOFF2 Nunito
  correspondent aux empreintes documentées dans `assets/fonts/NOTICE.md`.
- `_headers` réduit à la seule règle qui peut matcher une requête réelle, celle
  de la notice de polices.
- Service HTTP local sur `dist/` seul : aucune requête en échec, aucune erreur
  JavaScript, aucune dépendance hors artefact, sur les deux pages.
- 4 balises `og:` actives ; `og:url`, `og:image` et `canonical` toujours absents
  (URL de publication déclarée provisoire, `docs/DIRECTION.md` du 19 septembre).
- Contrastes mesurés dans le rendu, composition alpha comprise : le plus faible
  de la page est à 6,99:1. Focus au clavier vérifié sur fond bois et sur carte
  crème, de 10,84:1 à 13,67:1. Paliers 320/375/768/1024/1440 sans débordement ni
  contenu tronqué ; zoom 200 % sans coupure.
- Empreinte reproduite à l'identique sur deux machines et deux versions de Node
  (22.23.2 et 22.22.2) : la sortie est déterministe.

### Vérifications après dépôt (hébergé, contrôles de fumée)

Ces contrôles **ne constituent pas la recette QA hébergée** (§ 5.6, dernier
paragraphe). Ils établissent le lien entre la source et ce qui est servi, et ce
qui a été observé le jour du dépôt.

- **Lien source ↔ publication démontré par empreinte** : les 10 fichiers
  publiquement servis ont été récupérés depuis l'origine et hachés en SHA-256
  dans le navigateur. Les 10 sont **identiques octet pour octet** aux fichiers de
  l'artefact validé, **y compris les trois nouvelles polices Nunito et le nouveau
  favicon**. Le onzième, `_headers`, n'est pas servi (404) : comportement
  attendu, Cloudflare le consomme comme configuration.
- **`_headers` est bien interprété** : `/assets/fonts/NOTICE.md` est servi en
  `text/plain; charset=utf-8` avec `X-Robots-Tag: noindex, follow` — la seule
  règle restante fait donc bien son effet.
- **HTTPS** : origine servie en `https:`.
- **Routage** : `/index.html` et `/index` redirigent vers `/` ; `/404.html`
  redirige vers `/404`. Toutes répondent ensuite en 200 avec le bon titre.
- **404 réelles** : `/chemin-inexistant` et `/dossier/imbrique/inexistant`
  répondent **404** avec la page « Page introuvable — Simon COSTA » et
  `noindex, follow`.
- **Aucun contenu interne exposé** : `/publication.json`, `/docs/DIRECTION.md`,
  `/docs/`, `/CLAUDE.md`, `/package.json`, `/scripts/assemble-site.mjs`,
  `/css/`, `/assets/` répondent tous 404, ainsi que
  `/sites/coiffeur-mixte/index.html` — les deux publications restent étanches.
  L'ancien chemin `/assets/fonts/manrope/manrope-400.woff2` répond lui aussi
  404 : les fichiers du dépôt n° 1 ne subsistent pas à côté des nouveaux.
- **Chargement de la page** : accueil, deux feuilles de style et les trois
  fontes Nunito, tous en 200. Aucune erreur JavaScript, aucune ressource
  manquante. La nouvelle apparence est bien celle qui est servie.
- **Indexation** : `robots.txt` servi sans `Disallow` ; accueil en
  `index, follow` ; 404 en `noindex, follow`.

### Réserves

1. **Preview URLs : réglage non atteint dans le tableau de bord, mais observation
   rassurante.** L'arbitrage du 18 septembre (commit `83ad43e`) demande de
   désactiver le réglage « Preview URLs » du Worker avant toute publication
   indexable. L'onglet *Domains* du Worker s'affiche vide (trois tentatives, mise
   en page du tableau de bord modifiée depuis) : le réglage n'a pas pu être lu ni
   modifié. Contrôle de substitution, effectué depuis l'extérieur : l'URL de
   préversion construite sur le préfixe de version,
   `https://d3806c5f-portfolio-simon-costa.costa-simon30.workers.dev/`, **ne sert
   pas le site** — elle renvoie la page générique « There is nothing here yet »
   de Cloudflare. C'est ce qu'on observe quand les Preview URLs sont désactivées,
   mais ce n'est pas une preuve : le format d'alias pourrait différer. À
   confirmer dans le tableau de bord au prochain accès.
2. **Contrôles de fumée uniquement.** Rien ici ne remplace la recette QA
   hébergée : paliers 320/375/768/1440, menu, clavier, focus, lien d'évitement,
   zoom 200 %, cache froid, erreurs réseau et console. **La recette du dépôt n° 1
   ne vaut plus pour l'apparence** : elle portait sur `a5d0395`, dont la palette,
   la typographie et les formes sont remplacées. Ce qui n'a pas bougé (structure,
   contenu, paliers responsive) reste couvert. **La mise en avant du portfolio
   auprès de prospects ou d'employeurs reste suspendue à une nouvelle recette.**

### Suite

- Faire passer une recette QA hébergée sur cette apparence avant toute diffusion
  de l'URL. Le Chef de projet la commande ; elle n'est pas lancée par ce dépôt.
- Confirmer l'état du réglage « Preview URLs » dans le tableau de bord
  (réserve n° 1).


## Dépôt n° 3 — 23 septembre 2026

**Ce dépôt met en ligne la nouvelle direction « Clarté et structure » (thème
Clair/Sombre) et le premier aperçu réel de la démonstration Créa'Tif dans la
carte « Réalisations ».** Il remplace intégralement l'apparence boisée et
cocooning publiée par le dépôt n° 2 : palette, typographie, structure du
thème et vignette changent ; le contenu textuel et les paliers responsive ne
changent pas.

### Identification

| | |
| --- | --- |
| Révision source | `52584f0d65cb4b1eee7cdcea071794f664b34ae5` |
| Message | `site(portfolio): aperçu réel de Créa'Tif dans la carte « Réalisations »` |
| Empreinte de l'artefact | `fdced2eb7caf9bc8ec812b772f4567022275e01134177ee443c309d624bf3d4c` |
| Volume | 17 fichiers, 206 924 octets |
| URL publique | `https://portfolio-simon-costa.costa-simon30.workers.dev/` (inchangée) |
| Hébergement | Cloudflare Workers Static Assets, Worker `portfolio-simon-costa` |
| Accord de Simon | explicite, sur cette révision et cette empreinte précises, donné en conversation avant dépôt |
| Constat de mise en ligne | 2026-09-23T15:55:37Z (en-tête `date` de la première réponse observée) |
| Version Cloudflare | **`ad384491`** — « Manually deployed — Dashboard — by costa.simon30 » |
| Version précédente | `d3806c5f` (dépôt n° 2), conservée dans l'historique des versions (`664503f4`, dépôt n° 1, également présente) |

### Ce que cette révision apporte

Ensemble de commits déjà sur `main` au moment du dépôt, depuis le dépôt n° 2 :

- `a23cc25` — bascule de la direction artistique boisée et cocooning vers
  « Clarté et structure » : thème Clair/Sombre piloté par `data-theme`,
  bouton de bascule, persistance `localStorage`, repli sur
  `prefers-color-scheme`.
- Suite de corrections QA ciblées (`c7ace6a` et commits associés) sur le lien
  d'évitement, au zoom natif.
- `52584f0` — remplacement du visuel de substitution de la carte
  « Réalisations » par un aperçu réel de la démonstration Créa'Tif : image
  responsive (`<picture>`, source mobile 3:2 et desktop 16:9), même fichier
  dans les deux thèmes, filet `--c-filet` d'1px.

### Méthode

Identique aux dépôts n° 1 et n° 2, avec assemblage et vérification exécutés
sous la version de Node exacte prescrite (aucun repli `--runtime-alternatif`
nécessaire cette fois).

1. Copie propre de la révision hors du dépôt de travail
   (`git archive 52584f0d65cb4b1eee7cdcea071794f664b34ae5`), `git status --short`
   vide au moment de l'extraction.
2. Assemblage `node scripts/assemble-site.mjs portfolio --environment production`,
   Node 22.23.2 (conforme à `.node-version`).
3. Empreinte calculée par
   `find . -type f | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256`
   depuis la racine de `dist/`, reproduite à l'identique sur un second
   assemblage (déterminisme confirmé).
4. Dossier de dépôt distinct préparé et vérifié séparément de la sauvegarde
   (celle-ci mélangeait fichiers publics et fiches de suivi) :
   `~/Sites/artefacts/portfolio-simon-costa-candidat-52584f0-depot`, aplati à
   la racine, strictement les 17 fichiers publics, sans
   `INVENTAIRE-SHA256.txt`, `EMPREINTE-AGREGEE.txt` ni `README.txt`.
5. Dépôt **manuel** par le tableau de bord Cloudflare, écran
   « Deployments → New deployment → Upload static files to update your
   Worker », dossier ci-dessus déposé **par Simon lui-même**. Aucun
   raccordement Git, aucun déploiement automatique, aucune nouvelle
   assemblage ni publication de `main`. Simon a saisi lui-même son
   authentification et effectué le glisser-déposer ; aucun secret n'a
   transité par la conversation, les captures ou le dépôt.

### Vérifications avant dépôt (local, § 5.6)

- Suite `scripts/verif-assemblage.mjs` : **90 réussis, 0 échec**,
  `Conformité : OUI — rejeu sur la version figée`.
- Assemblage production : 17 fichiers, `index, follow` sur l'accueil,
  `noindex, follow` sur la 404, 202,1 Kio.
- Double assemblage identique octet pour octet (`diff -rq` vide) ;
  `sites/coiffeur-mixte/dist` ni créé ni nettoyé.
- Inventaire du dossier de dépôt distinct recompté depuis sa racine :
  17 fichiers, SHA-256 individuels et empreinte agrégée identiques à
  l'artefact autorisé par Simon.
- Aucune fiche de suivi (`INVENTAIRE-SHA256.txt`, `EMPREINTE-AGREGEE.txt`,
  `README.txt`) présente dans le dossier de dépôt.
- Aucun contenu interne (`docs`, `publication.json`, `scripts`, `.git`,
  `shared`, `CLAUDE.md`, `.gitignore`, `.node-version`).

### Vérifications après dépôt (hébergé, contrôles de fumée)

Ces contrôles **ne constituent pas la recette QA hébergée** (§ 5.6, dernier
paragraphe). Ils établissent le lien entre la source et ce qui est servi, et
ce qui a été observé le jour du dépôt.

- **Fichiers publics servis en 200** : les 17 fichiers de l'artefact
  répondent 200 depuis l'origine. `_headers` n'est pas servi (404) :
  comportement attendu, Cloudflare le consomme comme configuration.
- **Apparence effectivement servie** : capture à 1440×900 en thème clair et
  en thème sombre — la nouvelle direction « Clarté et structure » est bien
  celle qui est en ligne, palette et bouton de bascule (« Sombre »/« Clair »)
  conformes. Le mécanisme de thème (`data-theme` sur `<html>`, bouton,
  persistance) fonctionne dans le navigateur.
- **Vignette Créa'Tif servie et conforme** : les deux images
  (`creatif-hero-mobile-3-2.webp`, `creatif-hero-desktop-16-9.webp`)
  répondent 200 et s'affichent dans la carte « Réalisations », en thème
  clair comme en thème sombre, avec le texte alternatif attendu — vérifié
  visuellement par capture d'écran, en complément (non en remplacement) de la
  preuve par empreinte du dossier de dépôt.
- **`_headers` bien interprété** : `/assets/fonts/NOTICE.md` et
  `/assets/images/NOTICE.md` sont servis en `text/plain; charset=utf-8` avec
  `X-Robots-Tag: noindex, follow`.
- **HTTPS** : origine servie en `https:`.
- **404 réelle** : un chemin inexistant répond **404** avec la page
  « Page introuvable — Simon COSTA » et `noindex, follow`.
- **Aucun contenu interne exposé** : `/publication.json`, `/docs/`,
  `/CLAUDE.md`, `/scripts/assemble-site.mjs`, `.node-version`, `/shared/`
  répondent tous 404, ainsi que `/sites/coiffeur-mixte/index.html` — les deux
  publications restent étanches. Les anciennes polices Nunito du dépôt n° 2
  ne répondent plus (404) : elles ne subsistent pas à côté des nouvelles.
- **Lien vers Créa'Tif et CTA de contact** : le lien vers la démonstration et
  l'appel à l'action de contact sont présents et pointent vers les bonnes
  cibles sur la page en ligne.
- **Indexation** : `robots.txt` servi sans `Disallow` ; accueil en
  `index, follow` ; 404 en `noindex, follow`.
- **Aucune différence non attendue constatée.** La seule différence observée
  est celle recherchée par ce dépôt : remplacement complet de l'apparence
  boisée et cocooning par « Clarté et structure », et remplacement du visuel
  de substitution par l'aperçu réel de Créa'Tif.

### Réserves

1. **Preview URLs déclarées désactivées par Simon, non re-vérifiées dans le
   tableau de bord par ce dépôt.** Simon a confirmé avoir désactivé ce
   réglage avant d'autoriser ce dépôt (réserve n° 1 du dépôt n° 2, laissée
   ouverte à l'époque). Ce dépôt n'a pas relu l'onglet *Domains & Routes* du
   Worker pour la confirmer par accès direct ; l'accord de Simon a été pris
   comme fait établi, conformément à son message d'autorisation.
2. **Dépôt effectué par Simon lui-même, pas par l'agent.** Le blocage de
   permission du navigateur (Claude in Chrome n'était pas autorisé à
   téléverser depuis le dossier de dépôt) a empêché un dépôt automatisé ; le
   dossier vérifié a été transmis à Simon, qui a réalisé le glisser-déposer
   et l'authentification lui-même — comme pour les dépôts n° 1 et n° 2.
3. **Contrôles de fumée uniquement.** Rien ici ne remplace la recette QA
   hébergée : paliers 320/375/768/1440, clavier, focus, lien d'évitement,
   zoom 200 %, cache froid, erreurs réseau et console. **La recette des
   dépôts n° 1 et n° 2 ne vaut plus pour l'apparence** : elle portait sur des
   révisions dont la palette, la typographie et la vignette sont remplacées.
   **La mise en avant du portfolio auprès de prospects ou d'employeurs reste
   suspendue à une nouvelle recette.**

### Suite

- Faire passer une recette QA hébergée sur cette apparence et cette vignette
  avant toute diffusion de l'URL.
- Confirmer par accès direct au tableau de bord, au prochain accès, que
  « Preview URLs » est bien désactivé pour ce Worker (réserve n° 1).

## Dépôt n° 4 — 25 septembre 2026

**Ce dépôt met en ligne les corrections QA-MVT-01/02 et la généralisation du mouvement de
défilement discret du § 10 alors en vigueur**, sur l'apparence « Clarté et structure » déjà
publiée par le dépôt n° 3. Il ne change ni la palette, ni la typographie, ni la vignette
Créa'Tif ; le contenu textuel et les paliers responsive ne changent pas.

Ce dépôt n'avait pas été consigné dans ce journal au moment des faits ; cette entrée le fait
a posteriori, à partir des éléments explicitement documentés dans
`docs/DIRECTION.md` (« Point d'étape — pause du 25 septembre 2026 ») et dans
`docs/QA-portfolio.md` (contre-vérification ciblée du 25 septembre 2026, source `a51f11a`).
Aucun élément non documenté par ailleurs n'est ajouté ici.

### Identification

| | |
| --- | --- |
| Révision source | `a51f11adde87e7b9c341aca6af21190d2b5e0a54` |
| Message | `site(portfolio): corrige l'ancre interne animée et le délai de thème (QA-MVT-01/02)` |
| Empreinte de l'artefact | `94e464619fb90a58e7645432a831d7702153ce96cb7407a127c31107642d99af` |
| Volume | 18 fichiers, 229 636 octets (224,3 Kio) |
| URL publique | `https://portfolio-simon-costa.costa-simon30.workers.dev/` (inchangée) |
| Hébergement | Cloudflare Workers Static Assets, Worker `portfolio-simon-costa` |
| Accord de Simon | donné sur ce candidat source précis, consigné dans `docs/DIRECTION.md` (« Simon a autorisé le dépôt manuel du candidat source `a51f11a`... ») |
| Constat de mise en ligne | non documenté avec un horodatage précis ; daté du 25 septembre 2026 par le « Point d'étape » de `docs/DIRECTION.md` |
| **Version Cloudflare (Dashboard)** | **`ab9e2c4a`**, relevée par Simon dans le tableau de bord au moment du dépôt |
| **Version précédente (Dashboard)** | `49bef56d`, conservée dans l'historique des versions |

### Ce que cette révision apporte

Cinq commits déjà sur `main` au moment du dépôt, depuis le dépôt n° 3 (`52584f0`) :

- `38d9166` — mouvement d'entrée ciblé sur la carte Créa'Tif.
- `20d8b85` — correction de deux replis non immédiats du mouvement ciblé.
- `32020e7` — fixe la couleur du CTA hero sur `--c-fond`, y compris à l'état visité.
- `004218b` — généralise le mouvement de défilement discret (§ 10 de `docs/DIRECTION.md`
  alors en vigueur, depuis remplacé par la décision du 27 septembre).
- `a51f11a` — corrige l'ancre interne animée et le délai de thème (clôture QA-MVT-01 et
  QA-MVT-02).

### Méthode

Identique aux dépôts n° 1 à 3 : copie propre de la révision hors du dépôt de travail,
assemblage `node scripts/assemble-site.mjs portfolio --environment production` sous Node
`22.23.2`, dossier de dépôt distinct préparé et vérifié séparément de toute fiche de suivi,
dépôt **manuel** par le tableau de bord Cloudflare (écran de mise à jour du Worker), réalisé
par Simon lui-même — aucun raccordement Git, aucun secret transité par la conversation.

### Vérifications avant dépôt (local, § 5.6)

- **Contre-vérification QA ciblée, source exacte `a51f11a`** (`docs/QA-portfolio.md`,
  25 septembre 2026) : **QA-MVT-01 PASS, QA-MVT-02 PASS**, candidat jugé prêt pour décision
  de publication sur ce périmètre. Assemblage production exécuté sur cette révision avec
  Node `22.23.2` : 18 fichiers, 224,3 Kio, servi uniquement en local — aucun déploiement ni
  contrôle du Worker effectué à ce stade.
- Inventaire et empreinte agrégée de l'artefact relevés avant dépôt : 18 fichiers,
  `94e464619fb90a58e7645432a831d7702153ce96cb7407a127c31107642d99af` (méthode de
  `docs/ARCHITECTURE.md` § 5.4), consignés dans `docs/DIRECTION.md`.
- Aucun raccordement Git ni domaine personnalisé ; aucune publication de Créa'Tif effectuée
  par ce dépôt.

### Vérifications après dépôt (hébergé, contrôles de fumée)

Ces contrôles **ne constituent pas la recette QA hébergée** (§ 5.6, dernier paragraphe).
Repris tels que documentés dans le « Point d'étape » de `docs/DIRECTION.md`, sans ajout :

- **Observations sur l'URL publique** : accueil chargé, présence des contenus et des liens,
  bascule de thème fonctionnelle, références CSS/JS correctes, aucune erreur console
  observée, page 404 personnalisée servie avec `noindex, follow`, `/docs/` non exposé.
- **Identifiants relevés dans le Dashboard** : nouvelle version active `ab9e2c4a`, version
  précédente `49bef56d` conservée dans l'historique des versions du Worker.

### Réserves

1. **Comportement de mouvement non démontré à toutes les largeurs et aux deux thèmes sur
   l'hébergement.** Les contrôles de fumée confirment le chargement et l'absence d'erreur,
   pas le mouvement de défilement lui-même sur le Worker.
2. **Statuts, en-têtes et types MIME des ressources non tous vérifiés** sur cette version
   hébergée.
3. **Zoom natif 200 % non vérifié** sur le Worker.
4. **Réglage « Preview URLs » non recontrôlé** dans le tableau de bord à ce dépôt ; déclaré
   désactivé par Simon lors du dépôt n° 2, non revérifié par accès direct depuis.
5. **Contrôles de fumée uniquement.** Rien ici ne remplace une recette QA hébergée complète
   (paliers 320/375/768/1440, clavier, focus, lien d'évitement, zoom 200 %, cache froid,
   erreurs réseau). La mise en avant du portfolio auprès de prospects ou d'employeurs reste
   suspendue à cette recette.

### Suite

- Ce dépôt a ensuite motivé, après examen personnel de Simon de la version publiée
  `ab9e2c4a`, la décision produit du 27 septembre 2026 sur l'apparition réversible par seuil
  de défilement (`docs/DIRECTION.md`), à l'origine du dépôt n° 5 ci-dessous.
- Les réserves 1 à 4 ci-dessus n'ont pas été reprises par une recette hébergée dédiée à cette
  version précise avant son remplacement par le dépôt n° 5.


## Dépôt n° 5 — 5 octobre 2026

**Ce dépôt met en ligne le nouveau système d'apparition réversible par seuil de défilement**
(décision produit du 27 septembre 2026, `docs/DIRECTION.md` § 10), qui remplace le mouvement
à déclenchement unique du dépôt n° 4. Hero et « À propos » restent statiques ; Réalisations,
Ce que je fais, Contact et le pied de page apparaissent et disparaissent par seuil bidirectionnel.
Apparence, contenu, ordre, thèmes, liens et CTA ne changent pas.

### Identification

| | |
| --- | --- |
| Révision source | `4f9f192fcde5b68cd87de3b687537518cfc582d7` |
| Message | `site(portfolio): apparition réversible par seuil de défilement` |
| Empreinte de l'artefact | `f13974dc302058ef62012da05cc14066732b0937449a21e35a411139ec69416e` |
| Volume | 18 fichiers, 227 473 octets (222,1 Kio) |
| URL publique | `https://portfolio-simon-costa.costa-simon30.workers.dev/` (inchangée) |
| Hébergement | Cloudflare Workers Static Assets, Worker `portfolio-simon-costa` |
| Compte (Dashboard) | `costa.simon30`, confirmé à l'écran avant dépôt |
| Accord de Simon | explicite en conversation, sur ce commit précis, décision prépublication favorable après QA (`9cf60f0`) et UI/UX (`083875f`) ; confirmation du dépôt effectué donnée en conversation |
| Constat de mise en ligne | 5 octobre 2026, observé en direct pendant la session (horodatage précis de réponse non capturé) |
| **Version Cloudflare (Dashboard)** | **`c0592a94`**, relevée dans l'onglet *Versions* du Worker immédiatement après le dépôt |
| **Version précédente (Dashboard)** | `ab9e2c4a` (dépôt n° 4), conservée dans l'historique des versions |

### Ce que cette révision apporte

Un commit, déjà sur `main` au moment du dépôt : `4f9f192` — réécriture complète de
`js/mouvement-sections.js`, nouveau § 14 de `css/style.css` (classe unique
`.defilement`/`.defilement--armee`, durées d'entrée/sortie asymétriques par résolution CSS
de l'état de destination) et retrait des classes de l'ancien système dans `index.html`.

### Méthode

Identique aux dépôts précédents, avec préparation et vérification intégralement exécutées
dans cette session :

1. Copie propre de la révision hors du dépôt de travail (`git archive
   4f9f192fcde5b68cd87de3b687537518cfc582d7`), octets vérifiés identiques aux objets Git du
   commit ; `git status --short` vide au moment de l'extraction.
2. `node scripts/verif-assemblage.mjs` : **90 réussis, 0 échec**, Node `22.23.2` conforme à
   `.node-version`. Assemblage `node scripts/assemble-site.mjs portfolio --environment
   production` : 18 fichiers, 222,1 Kio. Double assemblage, `diff -rq` vide (déterminisme
   confirmé).
3. Inventaire et empreinte agrégée calculés depuis la racine de `dist/` (méthode de
   `docs/ARCHITECTURE.md` § 5.4) ; comparés au manifeste `publication.json`
   (2 pages + 14 `publicFiles` + 0 `sharedFiles` + 2 générés = 18, aucun fichier inattendu) ;
   seuls `index.html`, `css/style.css` et `js/mouvement-sections.js` diffèrent des 15 autres
   fichiers de l'inventaire du dépôt n° 4, restés identiques.
4. Copie de la version alors en ligne (source `a51f11a`, Cloudflare `ab9e2c4a`) vérifiée
   octet pour octet et par empreinte avant dépôt, conservée pour retour arrière dans
   `rollback-avant-depot-4f9f192-20261005T061802Z/live-a51f11a-verifie-hash/` (hors dépôt
   Git).
5. Dossier de dépôt distinct préparé, strictement les 18 fichiers publics, sans fiche de
   suivi.
6. Dépôt **manuel** par le tableau de bord Cloudflare, écran de mise à jour du Worker,
   réalisé par **Simon lui-même** dans son propre navigateur. Une tentative de dépôt assisté
   par navigateur automatisé a été interrompue avant tout envoi de fichier : l'outil de
   téléversement dispose de sa propre liste d'autorisation de dossiers, distincte du pont
   utilisé pour le reste de la préparation, et a refusé le dossier de dépôt sans alternative
   trouvée dans cette session. Aucun fichier n'a été envoyé par cette voie ; le dépôt effectif
   a été réalisé par Simon. Aucun secret n'a transité par la conversation.

### Vérifications avant dépôt (local, § 5.6)

- `verif-assemblage.mjs` : 90/90, conformité OUI.
- Double assemblage identique octet pour octet.
- Inventaire strictement conforme au manifeste, aucun fichier inattendu, aucun contenu
  interne (`docs`, `publication.json`, `scripts`, `.git`, `shared`, `CLAUDE.md`,
  `.gitignore`, `.node-version`).
- Indexation : `index, follow` sur l'accueil, `noindex, follow` sur la 404 ; `_headers`
  limité aux quatre notices typées, sans règle inerte héritée de Pages.
- Worker et compte cibles confirmés à l'écran (`portfolio-simon-costa` / `costa.simon30`,
  version alors active `ab9e2c4a`) avant tout dépôt — aucune divergence constatée.

### Vérifications après dépôt (hébergé, contrôles de fumée)

Ces contrôles **ne constituent pas la recette QA hébergée** (§ 5.6, dernier paragraphe).

- **Identifiants relevés dans le Dashboard** : nouvelle version active `c0592a94` (« Manually
  deployed — Dashboard — by costa.simon30 »), remplaçant `ab9e2c4a` comme version précédente
  dans l'historique des versions du Worker.
- **Lien source ↔ publication démontré par empreinte, sur l'URL publique** : les 17 fichiers
  publiquement servis récupérés et hachés en SHA-256 dans le navigateur sont **identiques
  octet pour octet** aux 17 fichiers correspondants de l'artefact déposé (18ᵉ fichier,
  `_headers`, non servi — 404, consommé comme configuration, comportement attendu).
- **`_headers` bien interprété, sur l'URL publique** : `/assets/fonts/NOTICE.md` rendu en
  texte brut par le navigateur (confirme `Content-Type: text/plain`).
- **Cycle de défilement, sur l'URL publique**, produit par événements de molette réels
  (pas de défilement simulé par script) : Réalisations, Ce que je fais, Contact et pied de
  page passent de masqués à révélés en descendant jusqu'au bas de page ; en remontant
  jusqu'en haut, les quatre groupes se réarment ; une seconde descente les révèle à nouveau.
  Hero et « À propos » visibles sans dépendre de ce cycle.
- **Thèmes, sur l'URL publique** : bascule Clair/Sombre fonctionnelle, persiste sur la page
  404.
- **Démo, contact, pied de page, sur l'URL publique** : lien « Voir la démo » pointe vers
  `portfolio-vitrines-coiffeur-mixte.costa-simon30.workers.dev` (Créa'Tif, non touché) ;
  `mailto:costa.simon30@outlook.com` correct ; lien « Retour en haut de page » correct.
- **404, sur l'URL publique** : page « Page introuvable — Simon COSTA » servie avec
  `noindex, follow`, bouton de retour présent.
- **Routage, sur l'URL publique** : `/index.html` et `/index` redirigent vers `/` ;
  `/404.html` redirige vers `/404` ; toutes répondent ensuite en 200.
- **Aucun contenu interne exposé, sur l'URL publique** : `/publication.json`,
  `/docs/DIRECTION.md`, `/CLAUDE.md`, `/scripts/assemble-site.mjs`, `/.node-version`
  répondent tous 404, ainsi que `/sites/coiffeur-mixte/index.html` — les deux publications
  restent étanches.
- **Console et réseau, sur l'URL publique** : aucune erreur console sur l'accueil ni sur la
  404 ; aucune requête vers une ressource du site en échec. Des requêtes vers des domaines
  tiers sans rapport avec le site (`static-lib.com`, `google-analytics.com`) ont été
  observées pendant les contrôles ; absentes du code source et de l'artefact vérifié
  (confirmé par recherche textuelle), elles sont attribuées à une extension du navigateur
  utilisé pour les contrôles, pas au dépôt.

### Réserves

1. **CLS de chargement non revérifié.** Un Layout Shift de `0,051864` au chargement à froid
   (320×900, thème clair) avait été mesuré par QA sur cette même source (`docs/QA-portfolio.md`,
   contre-vérification du 5 octobre 2026) sans lien causal établi avec les transitions de
   défilement. Non repris ici : limite explicitement documentée et acceptée par Simon avant ce
   dépôt.
2. **Zoom navigateur natif à 200 % non vérifié.** Non mesuré par QA (`9cf60f0`) ni par
   UI/UX (`083875f`) sur cette source, ni repris ici : limite explicitement documentée et
   acceptée par Simon avant ce dépôt.
3. **Réglage « Preview URLs » toujours non recontrôlé** dans le tableau de bord à ce dépôt ;
   réserve ouverte depuis le dépôt n° 2.
4. **Contrôles de fumée uniquement.** Rien ici ne remplace une recette QA hébergée complète :
   paliers 320/375/768/1440, clavier, focus, lien d'évitement, ancres, mouvement réduit,
   absence de JavaScript et cache froid n'ont pas été repris sur l'URL publique dans ce
   dépôt — ces aspects restent couverts par les contre-vérifications locales de QA
   (`9cf60f0`) et UI/UX (`083875f`) sur la même source, pas par une recette hébergée. La mise
   en avant du portfolio auprès de prospects ou d'employeurs reste suspendue à cette recette.

### Suite

- Faire passer une recette QA hébergée complète sur cette version avant toute diffusion de
  l'URL, couvrant notamment le zoom natif 200 % et une investigation dédiée du CLS de
  chargement si ce critère doit être levé.
- Confirmer par accès direct au tableau de bord l'état du réglage « Preview URLs »
  (réserve n° 3).

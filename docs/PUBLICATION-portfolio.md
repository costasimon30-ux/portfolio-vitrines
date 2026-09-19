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
| Identifiants Cloudflare | **non relevés** — voir « Réserves » |

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

1. **Identifiants de version et de déploiement Cloudflare non relevés.**
   La liaison avec le navigateur s'est interrompue juste avant le dépôt ; le
   déploiement a été confirmé par Simon et vérifié depuis l'extérieur, mais les
   identifiants internes (version ID, deployment ID) n'ont pas pu être lus dans
   le tableau de bord. À compléter ici lors du prochain accès.
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
- Compléter les identifiants Cloudflare dans le tableau ci-dessus.
- Réserves 2 et 3 sur `_headers` tranchées par l'Architecte le 19 septembre (voir réserve 5 ci-dessus) : écart assumé, pas de republication pour ce seul motif. Reste à faire : corriger `scripts/assemble-site.mjs` pour qu'un futur dépôt n'émette plus ces deux règles.

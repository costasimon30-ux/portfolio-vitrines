# portfolio-vitrines

Portfolio de sites vitrine (monorepo), développé avec Claude, direction produit avec Codex (ChatGPT).

Voir `CLAUDE.md` pour les conventions du projet, et `docs/DIRECTION.md` pour le brief / cahier des charges.

## Sites

- `sites/coiffeur-mixte` — en cours

## Structure

```
sites/            un dossier par site vitrine
shared/           design system et assets communs
docs/             brief et décisions de direction
scripts/          outillage de publication
```

## Publication

Chaque site est publié comme un artefact autonome, assemblé dans
`sites/<slug>/dist/` par `scripts/assemble-site.mjs`. Le contrat complet est
dans `docs/ARCHITECTURE.md`, section 5.

L'assembleur n'utilise que la bibliothèque standard de Node : rien à installer.
La version est figée dans `.node-version`.

```sh
# Assembler la démo Créa'Tif
node scripts/assemble-site.mjs coiffeur-mixte --environment production
node scripts/assemble-site.mjs coiffeur-mixte --environment preview
node scripts/assemble-site.mjs coiffeur-mixte      # défaut : preview
```

Sans option, le mode est lu dans `PUBLICATION_ENV` (`production` ou `preview`
uniquement) ; en son absence, `preview`. Une valeur inconnue fait échouer la
commande. Sous Cloudflare Pages, une branche autre que `main` ramène le mode à
`preview`.

Ce qui entre dans l'artefact est déclaré explicitement dans
`sites/<slug>/publication.json` : ajouter une photo ou une dépendance implique
d'ajouter son chemin au manifeste. `dist/` n'est jamais versionné.

Le manifeste ne peut pas tout déclarer. Sont refusés, avant tout nettoyage :
les chemins cachés, le manifeste et les fichiers de configuration, les sorties
générées (`dist/`), les archives, sourcemaps et templates, les pages HTML hors
de `pages`, les noms réservés à l'assembleur (`robots.txt`, `_headers`,
`sitemap.xml`, le dossier `shared/`), ainsi que toute collision de destination,
y compris entre un fichier et un répertoire ou entre deux variantes de casse.

**Convention des notices publiques.** Un fichier déclaré reçoit
automatiquement son type MIME `text/plain` et son exception d'indexation dans
`_headers` si son nom, extension retirée, est `NOTICE`, `LICENSE`, `LICENCE`,
`COPYING` ou `CREDITS`, avec une extension `.md`, `.txt` ou aucune. Une licence
au format texte est donc traitée comme une notice, et non plus seulement les
fichiers `.md`.

Pour regarder le résultat, servir **uniquement** la sortie — servir le dépôt
masquerait une dépendance sortante :

```sh
ruby -run -e httpd sites/coiffeur-mixte/dist -p 8765
# puis http://localhost:8765/
```

Le site source reste par ailleurs consultable depuis la racine du dépôt
(`python3 -m http.server`, puis `/sites/coiffeur-mixte/`), sans passer par
l'assemblage.

Les contrôles locaux sont rejouables. Ils n'exigent que Node — ni Bash, ni
Python, ni utilitaire externe — et travaillent exclusivement dans un répertoire
temporaire unique dont ils sont propriétaires : le dépôt de travail n'est
jamais modifié.

```sh
node scripts/verif-assemblage.mjs
```

La suite refuse de démarrer si la version de Node en cours n'est pas celle
figée dans `.node-version` ; activez-la d'abord (`nvm use`, `fnm use`). Pour un
contrôle croisé sur une autre version, `--runtime-alternatif` l'autorise en
signalant explicitement que le résultat ne vaut pas rejeu sur la version figée.

Un serveur statique local ne reproduit ni le fichier `_headers`, ni les
redirections `.html`, ni un vrai statut 404 : ces comportements relèvent de
l'hébergement et restent à vérifier sur l'URL hébergée.

### Réglages d'hébergement à venir

Non appliqués : ils supposent l'accord de Simon sur le compte, la connexion Git
et la première mise en ligne. Valeurs proposées par `docs/ARCHITECTURE.md`
§ 5.4 — commande de build `node scripts/assemble-site.mjs coiffeur-mixte`,
répertoire racine laissé vide, répertoire de sortie `sites/coiffeur-mixte/dist`,
`PUBLICATION_ENV` valorisée par environnement, aucun framework preset.

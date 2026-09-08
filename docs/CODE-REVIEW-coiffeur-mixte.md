# Code review — coiffeur-mixte (passe 2)

## Verdict

**À corriger avant validation finale.** Aucun P0 ou P1 actif n’a été identifié sur la révision `e2187ce`. Quatre P2 restent ouverts, tous liés à l’accessibilité ou à la robustesse du rendu mobile.

Périmètre : `sites/coiffeur-mixte/` et `shared/design-system/tokens.css`, après intégration des corrections de Claude. Les décisions documentées dans `docs/ARCHITECTURE.md` — duplication temporaire du shell pour ce premier site et auto-hébergement des polices avant publication — ne sont pas requalifiées comme anomalies dans cette passe.

## Constats

### P2 — Le lien d’évitement ne déplace pas le focus sur la page Salon

**Fichier :** `sites/coiffeur-mixte/salon.html:36`.

**Impact :** le lien « Aller au contenu principal » cible `#main`, mais l’élément cible ne possède pas `tabindex="-1"`, contrairement aux trois autres pages. L’URL et le défilement changent, mais le focus clavier peut rester sur le lien d’évitement selon le navigateur ou la technologie d’assistance. Le bénéfice du raccourci est donc incohérent entre les pages.

**Recommandation :** ajouter `tabindex="-1"` à `<main id="main">` dans `salon.html`, puis vérifier l’activation du lien d’évitement au clavier sur les quatre pages.

### P2 — Les trois étapes Barbier ne sont pas annoncées comme une séquence ordonnée

**Fichier :** `sites/coiffeur-mixte/barbier.html:84-100`.

**Impact :** les étapes sont construites avec des `div` et leurs chiffres sont masqués avec `aria-hidden="true"`. Un lecteur d’écran entend trois blocs indépendants (« Échanger », « Dessiner », « Entretenir »), sans information qu’il s’agit d’un parcours en trois étapes ni dans quel ordre il doit être lu. Cette perte de structure n’affecte pas le rendu visuel, mais elle réduit le sens porté par le contenu.

**Recommandation :** utiliser `<ol class="steps">` et des `<li class="step">`. Les numéros décoratifs peuvent alors rester masqués, car la liste expose déjà la position et le total. Adapter les sélecteurs CSS si nécessaire.

### P2 — Un titre de section de premier niveau est placé en `h3`

**Fichier :** `sites/coiffeur-mixte/barbier.html:105-112`.

**Impact :** « Entre deux visites » est le titre d’une section sœur de « Nos prestations » et « Le détail fait l’équilibre », tous deux en `h2`, mais il est balisé `h3`. La hiérarchie de titres devient incohérente pour la navigation par titres des lecteurs d’écran et pour les outils d’extraction de structure.

**Recommandation :** remplacer `<h3 id="visites-title">` par `<h2 id="visites-title">` et mettre à jour le sélecteur `.callout h3` en un sélecteur de composant qui ne dépend pas du niveau de titre, par exemple `.callout :is(h2, h3)` ou `.callout__title`.

### P2 — La classe qui active le menu repliable est ajoutée trop tard pour garantir l’absence de flash mobile

**Fichiers :** `sites/coiffeur-mixte/js/main.js:4-7`, scripts chargés en fin de document, par exemple `sites/coiffeur-mixte/index.html:152`; `sites/coiffeur-mixte/css/style.css:74-95`.

**Impact :** sans la classe `js`, la navigation mobile est volontairement développée ; une fois `main.js` exécuté, elle passe à `display: none`. Comme le script est placé après tout le contenu, un premier rendu peut afficher brièvement la navigation développée puis la retirer, ce qui produit un décalage de mise en page perceptible sur connexion ou appareil lent. Le commentaire « le plus tôt possible » ne correspond pas au point réel de chargement.

**Recommandation :** ajouter la classe dans un micro-script synchrone dans le `<head>`, avant les feuilles de style qui consomment `html.js`, et conserver `main.js` en bas de page pour les interactions. Si une politique CSP est ajoutée, autoriser ce script par nonce ou déplacer ce mécanisme dans une feuille de style ou une stratégie compatible CSP.

## Corrections confirmées depuis la première revue

- Les coordonnées de démonstration ne déclenchent plus d’appels ni d’e-mails.
- La navigation reste utilisable sans JavaScript ; le menu est refermé après activation d’un de ses liens.
- Les compositions CSS sont désormais décoratives pour les technologies d’assistance et les faux contenus (équipe, galerie) ont été retirés.
- Les pages Coiffure et Barbier ont maintenant des structures éditoriales distinctes conformément à `docs/DIRECTION.md`.
- Le code CSS mort relevé précédemment a été retiré.

## Contrôles effectués

- Lecture de `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/AGENTS.md`, `docs/DIRECTION.md` et `docs/ARCHITECTURE.md`.
- Inspection du diff de correction `e2187ce`, des quatre documents HTML, de `style.css`, de `main.js` et des tokens partagés.
- Vérification des liens internes, des ressources locales déclarées et de `git diff --check`.

## Ordre de correction

1. Rendre le lien d’évitement fiable sur Salon.
2. Restituer la structure ordonnée et la hiérarchie de titres de la page Barbier.
3. Éviter le décalage de navigation mobile au chargement.

---

## Revue ciblée — outillage de publication — livraison `33d71b4`

Date : 7 septembre 2026. Commit audité : `33d71b4738fb248245eec603ac48f58567ba686c`, après `git pull --ff-only` sur `main`. Références : `CLAUDE.md`, `docs/WORKFLOW.md`, `docs/AGENTS.md`, cadrage de publication de `docs/DIRECTION.md` (`174ebdb`) et section 5 de `docs/ARCHITECTURE.md` (`21f819f`).

Cette section s’ajoute à la revue historique ci-dessus, qui décrit sa propre révision et ne constitue pas un état courant des anciens contrôles. Aucun constat artistique, ancien contrôle fonctionnel ou dossier P06 n’est rouvert ici.

### Verdict et périmètre

**Outillage non validé : 4 P1 et 6 P2 indispensables restent à traiter.** Aucun P0 identifié. Le script de vérification peut détruire des données préexistantes, altérer le manifeste de travail et conclure au succès malgré des assemblages en échec. L’assembleur accepte une racine partagée symbolique et plusieurs entrées ou références contraires à son contrat. Ces défauts empêchent de considérer cette suite comme une barrière fiable avant publication.

L’artefact du manifeste livré passe les contrôles indépendants décrits plus bas. Les cas adverses exposent des défauts des garde-fous ; ils ne signifient pas que les 42 fichiers actuellement assemblés contiennent ces anomalies.

Fichiers examinés : `scripts/assemble-site.mjs`, `scripts/verif-assemblage.sh`, `sites/coiffeur-mixte/publication.json`, `.node-version`, `README.md`, `sites/coiffeur-mixte/404.html` et l’ajout CSS associé. Seul le présent rapport est modifié dans le dépôt.

### Corrections indispensables

#### PUB-01 — P1 — La suite supprime un dossier de site sans en être propriétaire

**Fichier / lignes :** `scripts/verif-assemblage.sh:53-54,176` ; commande proposée dans `README.md:57-61`.

**Scénario concret :** un dossier `sites/tmp-portfolio-test/` existe déjà et contient du travail. Lancer la commande documentée exécute immédiatement `rm -rf` sur ce dossier, puis le supprime de nouveau en fin de suite. Dans la copie isolée, une sentinelle préexistante `sites/tmp-portfolio-test/preexisting.txt` disparaît et la suite termine avec le code 0. Aucun contrôle d’appartenance, d’existence préalable ou d’exclusivité n’a lieu. Deux lancements se partagent également ce même dossier.

**Conséquence :** perte de fichiers sans rapport avec le contrôle et collisions entre exécutions. Les sentinelles créées plus tard par la suite ne détectent pas cette suppression initiale.

**Correction recommandée :** créer un répertoire temporaire unique avec `mktemp -d`, y préparer une copie de test autonome de l’assembleur et de ses entrées, puis n’effacer que cette copie dont la suite est propriétaire. Vérifier la création avant de poursuivre ; protéger le nettoyage par un `trap` adapté. Le test ne doit créer ni nettoyer de site dans le dépôt de travail.

#### PUB-02 — P1 — Manifeste réel modifié, sauvegarde globale et restauration non garantie

**Fichier / lignes :** `scripts/verif-assemblage.sh:25-49,98-130` ; absence de gestion d’interruption à partir de la ligne 10.

**Scénario concret :** après ajout de `css/inexistant.css` dans le manifeste, un `SIGTERM` interrompt la suite avant la ligne 130. Reproduit dans une copie jetable : le processus est interrompu et le manifeste reste différent de l’original. Les fichiers `/tmp/manifeste.bak`, `/tmp/prod.log`, etc. ont des noms globaux fixes. Deux exécutions peuvent écraser leurs sauvegardes et leurs résultats ; par exemple B sauvegarde le manifeste déjà altéré par A, puis A « restaure » la sauvegarde de B. Une sauvegarde échouée n’empêche pas les modifications suivantes. Les redirections et copies vers ces noms peuvent aussi suivre un lien symbolique préexistant.

**Conséquence :** état source invalide après interruption, restauration des données d’une autre exécution, écrasement de fichiers temporaires préexistants et résultats non isolés. La commande de test n’est pas sûre dans un dépôt utilisé par plusieurs agents.

**Correction recommandée :** modifier exclusivement le manifeste d’une copie jetable ; placer sauvegardes, journaux et fixtures sous le répertoire temporaire unique de PUB-01. Vérifier chaque préparation et gérer `EXIT`, `INT` et `TERM` pour les seules ressources de test. Ne pas dépendre d’une restauration du manifeste réel : même un trap ne protège pas d’un arrêt brutal non interceptable.

#### PUB-03 — P1 — Des assemblages échoués sont déclarés testés avec succès

**Fichier / lignes :** `scripts/verif-assemblage.sh:10-11,21,65,68-86,134,169-174`.

**Scénario concret :** après un premier assemblage valide, forcer les appels d’assemblage des lignes 73, 75, 83 et 134 à retourner 1 sans toucher au `dist/` existant. Reproduction par un relais `node` limité à la copie de test : les quatre appels échouent, mais le contrôle de déterminisme compare deux fois l’ancien artefact, les sentinelles restent présentes et l’inventaire est celui de l’ancien build. **La suite affiche `ÉCHECS : 0` et sort avec le code 0.**

**Conséquence :** un résultat vert ne prouve ni deux assemblages réussis, ni l’isolation d’un assemblage exécuté, ni la validité de la dernière sortie. `set -uo pipefail` ne propage pas automatiquement les échecs non vérifiés. Les commandes de préparation, le `cd` initial et les empreintes ne sont pas tous contrôlés. De plus, les branches `grep … && ko … || ok …` confondent absence de motif et erreur de lecture ; « une seule balise robots par page » ne lit que `index.html`, et la vérification MIME ne prouve que la présence d’un bloc quelconque.

**Correction recommandée :** contrôler explicitement le statut de chaque préparation, build et calcul d’empreinte ; ne vérifier une sortie que si le build correspondant a réussi. Distinguer les codes 0, 1 et 2 de `grep`. Vérifier chaque page et chaque notice, avec son bloc exact dans `_headers`. Ajouter des tests de la suite elle-même par injection d’échecs intermédiaires : chacun doit rendre son code final non nul. Un simple ajout de `set -e` ne suffit pas à corriger les listes conditionnelles et les assertions incomplètes.

#### PUB-04 — P1 — La racine `shared/` symbolique contourne le confinement des entrées

**Fichier / lignes :** `scripts/assemble-site.mjs:143-160,191-195,498,541-545`.

**Scénario concret :** remplacer `shared/` par un lien vers un autre dossier, puis déclarer `secret.txt` dans `sharedFiles`. La fonction commence ses `lstat` au premier enfant et ne vérifie jamais `base`, malgré son commentaire. Avec une cible contenant uniquement une donnée factice hors de la racine de la copie de dépôt, l’assemblage retourne 0 et publie cette donnée dans `dist/shared/secret.txt`. Un `publication.json` symbolique est également accepté, car il est lu directement par `readFile`.

**Conséquence :** des fichiers extérieurs peuvent être embarqués dans la publication, contrairement au refus des liens symboliques exigé par l’architecture. Le contrôle lexical `path.relative` ne détecte pas la cible réelle d’un lien. Les protections de `dist/` ne couvrent pas la racine `shared/`.

**Correction recommandée :** vérifier les racines d’entrée elles-mêmes et chaque segment depuis la racine du dépôt, y compris le manifeste, avant lecture ou suppression. Vérifier aussi le confinement des chemins réels. Ajouter des tests distincts pour racine partagée, manifeste, répertoire intermédiaire, fichier terminal et chemin de sortie symboliques. Les tests actuels ne couvrent pas ces variantes.

#### PUB-05 — P2 — Les exclusions du manifeste ne sont pas imposées par l’assembleur

**Fichier / lignes :** `scripts/assemble-site.mjs:217-237,523-538,552-574` ; contrat `docs/ARCHITECTURE.md`, sections 5.2 et 5.3.

**Scénario concret :** déclarer `publication.json` et `.env` dans `publicFiles` est accepté avec le code 0 et copie les deux fichiers dans la sortie — testé avec un `.env` exclusivement factice. Déclarer `dist/old.txt` est aussi accepté pendant la validation ; la ligne 553 supprime ensuite ce fichier source avant sa copie, qui échoue avec `ENOENT`. Enfin, placer `extra.html` dans `publicFiles` copie cette page sans transformation des liens ni balise robots, même en preview.

**Conséquence :** la liste explicite ne suffit pas à garantir les exclusions promises : configurations, fichiers cachés ou anciennes sorties peuvent être sélectionnés. Une ancienne sortie peut même devenir une entrée détruite par le build. La classification `publicFiles` permet de contourner les règles prévues pour les pages. L’en-tête global d’une preview reste présent, mais la balise exigée dans chaque HTML manque.

**Correction recommandée :** valider le manifeste contre les exclusions du contrat avant le nettoyage : configurations et manifeste, chemins cachés, sorties générées, archives, sourcemaps, templates et fichiers internes. Exclure toute source située dans `dist/`. Réserver les HTML à `pages`, avec refus explicite de leur présence dans les autres listes, tout en conservant les notices autorisées.

#### PUB-06 — P2 — Les collisions de destinations ne sont pas toutes refusées avant suppression

**Fichier / lignes :** `scripts/assemble-site.mjs:503-520,552-554,581-582`.

**Scénario concret :** `publicFiles: ["robots.txt/child.txt"]` passe la réservation, car elle compare le chemin entier au nom réservé. Le build efface l’ancien `dist/`, copie le fichier puis échoue avec `EISDIR` en générant `robots.txt` ; une sentinelle dans l’ancienne sortie a déjà disparu. Sur le volume macOS testé, insensible à la casse, `ROBOTS.TXT` est également accepté puis écrasé par le `robots.txt` généré ; le build retourne 0 avec quatre fichiers au lieu des cinq destinations attendues et les octets de la ressource déclarée sont perdus.

**Conséquence :** la validation préalable annoncée est incomplète. Selon le système de fichiers, une collision provoque un échec tardif destructeur de l’ancienne sortie ou une réussite avec un artefact non conforme ; le comportement diffère entre local et hébergement.

**Correction recommandée :** intégrer les fichiers générés au plan des destinations, refuser les conflits fichier/répertoire et les variantes de casse des noms réservés. Adopter une règle de nommage/collision portable entre volumes sensibles et insensibles à la casse. Vérifier l’inventaire final contre le plan, y compris les fichiers générés, sans se limiter à l’annoncer.

#### PUB-07 — P2 — Le contrôle des références accepte des ressources absentes ou sortantes

**Fichier / lignes :** `scripts/assemble-site.mjs:324-344,361-377`.

**Scénarios reproduits, chacun avec code de sortie 0 :**

- `<img src=absent.webp>` : attribut valide non entouré de guillemets, ignoré.
- `<img srcset='absent.webp 1x'>` : `srcset` à apostrophes, ignoré.
- `@import "absent.css";` dans une CSS déclarée : import sans `url()`, ignoré.
- `<img src="/assets/../../publication.json">` : le chemin absolu est testé avant normalisation ; `fs.access` finit par vérifier le manifeste source hors de `dist/`. Le navigateur résout cette URL vers `/publication.json`, absent de la publication.
- `<img src="assets/">` : l’existence d’un dossier est prise pour celle d’une ressource image.
- Une image chargée depuis `https://example.invalid/absent.webp` : les schémas distants sont exclus du contrôle indistinctement, même pour une ressource chargée automatiquement.

**Conséquence :** un artefact annoncé valide peut conserver des ressources cassées ou dépendre d’un tiers. L’absence de dépendance sortante n’est pas garantie. Les liens de crédits externes légitimes ne doivent pas être confondus avec des images, CSS, fontes ou scripts chargés à distance.

**Correction recommandée :** couvrir les syntaxes HTML/CSS acceptées, ou refuser explicitement les syntaxes non prises en charge. Normaliser et décoder les chemins conformément aux URL avant de vérifier leur confinement ; ne jamais satisfaire un contrôle grâce à un fichier source hors sortie. Exiger un fichier pour une ressource, distinguer les liens de navigation des chargements automatiques et refuser les ressources réseau hors contrat. Ajouter chacun de ces cas aux tests négatifs.

#### PUB-08 — P2 — La détection par expressions régulières laisse passer des consignes robots ambiguës

**Fichier / lignes :** `scripts/assemble-site.mjs:289-317`.

**Scénario concret :** dans une fixture `portfolio/production`, ajouter `<meta name=googlebot content=noindex>` au `<head>`. Le build retourne 0, conserve cette directive et ajoute `robots="index, follow"` : la contradiction que le contrat demande de refuser est présente. Autre cas reproduit : une balise robots placée dans un commentaire est « remplacée » à l’intérieur du commentaire ; aucune balise robots effective n’est insérée.

**Conséquence :** le portfolio peut être annoncé indexable alors qu’une directive spécifique le désindexe ; la présence d’une balise réelle dans le `<head>` n’est pas garantie. Le `_headers` global protège encore les previews servies sur la plateforme prévue, mais ne répare pas la non-conformité HTML ni le cas portfolio/production.

**Correction recommandée :** identifier les vraies balises du `<head>` hors commentaires et contenu script, reconnaître les formes d’attributs admises, puis refuser les directives spécifiques contradictoires. Contrôler après transformation qu’il existe exactement une balise robots effective, au bon emplacement. Si le transformateur reste volontairement limité, échouer explicitement sur une structure non supportée plutôt que la déclarer valide.

#### PUB-09 — P2 — Les licences textuelles hors `.md` échappent à la politique des notices

**Fichier / lignes :** `scripts/assemble-site.mjs:37-38,463-468,578-582` ; `sites/coiffeur-mixte/publication.json:40-47`.

**Scénario concret :** ajouter une licence `LICENSE.txt` à une fixture `portfolio/production`. Le fichier est copié, le build retourne 0, mais `_headers` ne contient aucune exception pour cette licence ; seule la notice `.md` est reconnue.

**Conséquence :** une licence textuelle explicitement incluse reste sans directive de non-indexation et sans le type explicite prévu par la section 5.5. Les deux notices `.md` du manifeste actuel sont correctement traitées ; le défaut concerne l’ajout autorisé de licences dans d’autres formats textuels.

**Correction recommandée :** identifier explicitement les notices/licences publiques et valider cette déclaration, ou établir une convention documentée couvrant les formats textuels autorisés. Générer puis tester l’exception HTTP pour chaque fichier concerné, au lieu de déduire sa fonction du seul suffixe `.md`.

#### PUB-10 — P2 — La version Node annoncée et les prérequis de vérification ne sont pas effectivement garantis

**Fichier / lignes :** `.node-version:1`, `README.md:26-33,57-61`, `scripts/verif-assemblage.sh:10-25,99,135`.

**Scénario concret :** `.node-version` fixe `22.16.0`, mais le message de livraison rapporte des essais sous `22.23.2` et `22.22.2`. La commande `node` utilise le `PATH` sans lire ni vérifier ce fichier. La suite exige aussi Bash, Python 3, `shasum` et des utilitaires Unix, sans les contrôler avant ses opérations mutantes. Dans cette revue, aucun `node` n’était initialement dans le `PATH` ; le runtime local disponible a permis les reproductions sous **24.19.0**, pas sous la version figée.

**Conséquence :** les essais rapportés ne prouvent pas le fonctionnement sous le runtime exactement annoncé. Un poste disposant seulement de Node peut commencer la suite puis échouer en cours de modification du manifeste. Cela ne démontre aucune incompatibilité de l’assembleur avec Node 22.16.0 ; cela démontre un manque de cohérence et de vérification des prérequis.

**Correction recommandée :** aligner la version figée et celle réellement utilisée pour les essais, documenter son activation locale et afficher/vérifier la version au démarrage de la suite. Rejouer les cas corrigés sur cette version exacte. Documenter et vérifier tous les prérequis avant toute écriture ; supprimer les dépendances supplémentaires si elles ne sont pas nécessaires au test isolé.

### Amélioration facultative, distincte des blocages ci-dessus

#### PUB-A1 — P2 — Préserver la dernière sortie valide et sérialiser les assemblages d’un même site

**Fichier / lignes :** `scripts/assemble-site.mjs:552-590`.

**Scénario :** après un build valide, une référence manquante fait échouer le contrôle final après remplacement de `dist/`. Deux commandes simultanées visant le même slug peuvent également se supprimer ou se réécrire mutuellement leurs sorties. Le premier cas découle de l’ordre des opérations ; aucune garantie de concurrence n’existe dans le code. Une course concurrente de l’assembleur n’a pas été exécutée pour cette revue.

**Conséquence :** la dernière sortie valide n’est plus disponible et un serveur local peut lire un artefact partiel. Un hébergeur qui respecte le code de sortie non nul ne devrait pas publier ce build ; ce point n’est donc pas présenté comme un contournement constaté du déploiement. La concurrence de la suite de tests, elle, relève déjà des corrections indispensables PUB-01 à PUB-03.

**Amélioration recommandée :** construire et contrôler dans une sortie temporaire unique, puis promouvoir l’artefact validé avec une stratégie de remplacement et de verrouillage par site. Cette évolution peut suivre les corrections des validations préalables ; elle ne remplace aucune d’elles.

### Vérifications réalisées et limites de preuve

Toutes les exécutions ont eu lieu sous un répertoire unique créé avec `mktemp -d` : `/private/tmp/review-publication-33d71b4.p5WgJW`. Les copies réelles proviennent de `git archive 33d71b4` limité à `scripts/`, `.node-version`, `sites/coiffeur-mixte/` et `shared/`. Les cas adverses utilisent des fixtures et sentinelles exclusivement jetables. L’assembleur copié n’a pas été modifié.

Le script de vérification **n’a jamais été exécuté dans le dépôt de travail**. Pour ses essais isolés, ses chemins littéraux `/tmp/…` ont été redirigés vers un sous-dossier privé de chaque copie ; aucune autre logique de la suite n’a été changée. Un relais `node` a ensuite servi uniquement à injecter les quatre codes 1 de PUB-03 et l’interruption de PUB-02. Les résultats de ces essais adaptés ne sont pas présentés comme une exécution inchangée du script original. Les journaux et le harnais sont locaux au répertoire temporaire, non versionnés ; les scénarios ci-dessus décrivent les entrées permettant de reproduire les constats.

| Contrôle | Résultat observé |
| --- | --- |
| Manifeste livré, production et preview | Code 0 dans les deux modes ; 42 fichiers, 8 réécritures CSS ; empreinte déterministe `c6ddb471aa4a6337754b8dd886866c1b2446587cedec2b3582ae2943a573be9d` retrouvée par la suite isolée |
| Inventaire indépendant | Exactement 5 pages + 28 fichiers publics + 7 partagés + 2 générés ; aucun fichier supplémentaire |
| Copies indépendamment comparées | 35 ressources identiques octet pour octet aux sources, dont photos, fontes et notices |
| Références de l’artefact livré | Analyse des attributs avec le parseur HTML standard Python et des `url()` CSS : 39 cibles locales distinctes existantes, pages et racine comprises ; aucune ressource automatique externe détectée dans ce périmètre |
| Démo actuelle | Une balise `noindex, follow` dans chacun des cinq HTML ; `robots.txt` exact ; règle globale et blocs des deux notices présents |
| Matrice de politique sur fixtures | Démo production/preview et portfolio preview en noindex ; portfolio production indexable, 404 et notices exclues, règle d’hôte versionnée présente |
| Environnement | Repli preview sans variable et sur branche non-main ; main/production conservé ; valeur inconnue refusée, via la suite isolée |
| Liens symboliques témoins | Fichier terminal, `sites/` et `dist/` symboliques refusés avec code 1, cibles préservées ; racine `shared/` et manifeste symboliques acceptés à tort |
| Suite, exécution nominale isolée | Code 0 ; sentinelle préexistante du site temporaire détruite |
| Suite, quatre builds injectés en échec | Code final 0 et `ÉCHECS : 0` : faux succès confirmé |
| Suite interrompue après mutation | `SIGTERM`, manifeste non restauré |

La page `404.html:8-11,23` utilise des chemins partant de `/` et un retour vers `/`, cohérents avec une publication à la racine de chaque hôte. L’ajout CSS `style.css:513-520` reste limité à `.error-page` et à son bouton ; aucun défaut supplémentaire retenu dans ce diff. Le comportement HTTP réel de la 404, des en-têtes et des redirections n’est pas validé par cette inspection locale : il reste à la recette hébergée prévue par le contrat, après autorisation de publication.

Les tests indépendants ont utilisé Node **24.19.0** et Python 3 ; ils ne remplacent pas le rejeu sur **22.16.0** demandé dans PUB-10. Aucune installation de runtime, connexion à Cloudflare, création de compte ou publication n’a été effectuée. Le dépôt de travail était propre avant rédaction du rapport ; aucune source ou configuration n’a été modifiée par les reproductions.

### Suite attendue

Traiter d’abord PUB-01 à PUB-04, puis les garanties de manifeste, collisions, références et indexation PUB-05 à PUB-09. Rejouer une suite réellement isolée, qui échoue face aux injections d’erreur, sur la version Node alignée de PUB-10. Les P1 constituent les blocages prioritaires ; les P2 indispensables sont des écarts au contrat de cette livraison, distincts de PUB-A1. Cette revue n’autorise aucun déploiement.

---

## Contre-vérification — corrections de publication — livraison `8cedeb3`

Date : 8 septembre 2026. Livraison auditée : `8cedeb36b9a351fbfab4c0aef43bd93efd428f32`. Rapport initial : `930dd6f9b94fc04d29bbcfb7784c36a6eae64161`, sur l’implémentation `33d71b4`. Les sections précédentes sont conservées comme historique ; le tableau ci-dessous porte le statut de PUB-01 à PUB-10 pour cette nouvelle livraison.

### Verdict

**Validation encore refusée : cinq constats résolus, cinq partiellement résolus.** Il reste **un P1 (PUB-03)** et **quatre P2 (PUB-05 à PUB-08)** dans le périmètre initial. Aucun P0 identifié. PUB-A1 reste facultatif et différé, sans nouvelle condition de clôture.

Le rejeu de référence sous **Node 22.23.2** confirme **62 contrôles réussis, 0 échec** dans la suite livrée. La comparaison indépendante confirme que les **42 fichiers de l’artefact réel sont inchangés octet pour octet** entre `33d71b4` et `8cedeb3`, en production comme en preview. Ces résultats ne couvrent pas les contre-exemples ci-dessous : certaines protections ne traitent encore que les formes utilisées par les tests fournis.

### Statut des dix constats

| Constat | Statut | Preuves de correction et limites |
| --- | --- | --- |
| PUB-01 — suppression d’un dossier préexistant | **Résolu** | Suite Bash supprimée. `verif-assemblage.mjs:72-90,114-131` crée et nettoie son propre bac. Une sentinelle dans `sites/tmp-portfolio-test/` et une ancienne sortie, préparées dans la copie servant de dépôt à la suite, sont conservées. Inventaire et empreintes de toute cette copie inchangés après les essais. |
| PUB-02 — manifeste réel et temporaires globaux | **Résolu** | Copies isolées, aucun manifeste source réécrit. Deux exécutions concurrentes terminent avec code 0 dans des bacs distincts. `SIGINT` et `SIGTERM`, déclenchés après confirmation du premier build réussi, interrompent les processus, suppriment leurs bacs et préservent la copie source. Aucun temporaire global fixe créé. Un arrêt non interceptable n’est pas présenté comme nettoyé ; il ne nécessite plus de restaurer le manifeste source. |
| PUB-03 — faux succès et ancien artefact | **Partiellement résolu — P1 restant** | Les six injections indépendantes de code 73 après un premier succès rendent toutes la suite non nulle. En revanche, cinq appels remplacés par un retour 0 sans production réutilisent le `dist/` précédent : 58 contrôles réussis, 0 échec, code final 0 dans le mode enfant sans auto-tests récursifs. Voir le détail ci-dessous. |
| PUB-04 — liens symboliques | **Résolu** | Sept variantes indépendantes — racine `shared/`, manifeste, répertoire intermédiaire, fichier terminal, dossier du site, racine `sites/`, sortie `dist/` — sont refusées avec code 1 avant nettoyage. Cibles extérieures factices et ancienne sortie préservées. Contrôles par segment et confinement réel : `assemble-site.mjs:176-209,264-269,706-719,764-782`. Pas de simulation d’un remplacement malveillant de lien pendant la validation. |
| PUB-05 — exclusions du manifeste | **Partiellement résolu — P2 restant** | Les cas initiaux `publication.json`, `.env`, `dist/old.txt`, HTML hors `pages`, sourcemap, template, ainsi qu’une archive, sont refusés avant nettoyage. Mais `PUBLICATION.JSON` est publié, `DIST/old.txt` détruit sa propre entrée sur le volume insensible à la casse testé, et les chemins internes `docs/…` / `Claude outputs/…` restent acceptés. |
| PUB-06 — collisions | **Partiellement résolu — P2 restant** | Les cas initiaux `robots.txt/child.txt`, `ROBOTS.TXT` et `_headers` sont refusés avant nettoyage. `_HEADERS/child.txt` provoque encore un `EISDIR` après suppression de l’ancienne sortie ; `SITEMAP.XML` et `Shared/intrus.css` sont acceptés malgré leur nom réservé. |
| PUB-07 — références | **Partiellement résolu — P2 restant** | Les six cas initiaux échouent désormais, ainsi qu’une remontée encodée ; le lien de crédit externe reste autorisé. Les balises `script` et les blocs `style` sont toutefois masqués en entier et leurs ressources échappent au contrôle. Une apostrophe dans un attribut pourtant valide provoque aussi un refus erroné. |
| PUB-08 — robots effectifs | **Partiellement résolu — P2 restant** | Directive `googlebot` sans guillemets, doublons et robots hors head refusés ; robots en commentaire correctement ignorés et commentaire conservé. Des entités HTML, attributs dupliqués et une balise dans `template` contournent encore le contrôle d’effectivité. |
| PUB-09 — notices/licences | **Résolu** | La convention documentée dans `README.md:52-57` est une solution admise. `LICENSE.txt`, `notice.MD`, `LICENCE`, `Copying.txt`, `CREDITS.md` testés dans les quatre combinaisons démo/portfolio × production/preview : blocs MIME exacts et exclusion globale ou individuelle présents. Aucun nouveau champ de manifeste exigé. Les noms hors convention ne sont pas déclarés couverts. |
| PUB-10 — runtime/prérequis | **Résolu** | `.node-version` et rejeu réel alignés sur **22.23.2** ; suite Node seule. Un essai séparé sous **24.19.0**, sans option de dérogation, sort avec code 1 avant création d’un bac. Le refus de version concerne la suite, comme le précise le README ; l’assembleur affiche sa version sans imposer lui-même ce refus. |

### Corrections indispensables restantes

#### PUB-03 — P1 — Un succès silencieux après un premier build valide réutilise toujours l’ancien artefact

**Fichiers / lignes :** `scripts/verif-assemblage.mjs:358-377,680-695,765-775`.

**Ce qui est corrigé :** les statuts des builds sont désormais vérifiés. Les injections de code 73 au build preview, à chacun des deux builds du test de déterminisme, au contrôle d’isolation, aux notices puis à l’inventaire ont toutes produit un code final 1 et nommé le contrôle en échec. L’ancien problème « code non nul ignoré » est donc clos.

**Scénario résiduel reproduit :** dans une copie jetable, un préambule d’injection laisse l’assembleur réel travailler au début, puis remplace uniquement ses appels 7 à 11 pour `coiffeur-mixte` dans la copie principale `depot` par `process.exit(0)`, sans sortie standard ni écriture. Cela neutralise les deux builds du déterminisme, celui d’isolation, celui des notices et celui de l’inventaire. Les autres fixtures utilisent l’assembleur réel. Le journal d’injection confirme les cinq appels neutralisés. Le résultat reste **`Réussis : 58 Échecs : 0`, code 0** avec `--self-test-enfant`.

**Conséquence :** le contrôle prétend comparer deux nouveaux builds et valider une nouvelle production alors qu’il relit l’ancienne. L’auto-test « assembleur muet » fourni ne détecte ce défaut que sur une copie sans sortie préalable ; il ne couvre pas le scénario de réutilisation après succès demandé dans la revue initiale. Ce test n’établit pas que l’assembleur livré retourne spontanément 0 sans produire : il prouve que la suite ne détecterait pas cette régression.

**Correction recommandée :** faire les builds positifs dans des sorties de test indépendantes et initialement absentes, ou invalider explicitement la sortie précédente avant l’appel dont on vérifie la production. Garder des tests séparés pour le remplacement d’une sortie préexistante. Ajouter l’injection « muet après premier succès » aux auto-tests. Une vérification du seul code 0 et de fichiers déjà présents ne prouve pas leur production par l’appel testé.

#### PUB-05 — P2 — La casse et les chemins internes contournent encore les exclusions

**Fichiers / lignes :** `scripts/assemble-site.mjs:51-56,224-248,764-767,801-819` ; promesse documentaire `README.md:45-50`.

**Scénarios reproduits :**

- `publicFiles: ["PUBLICATION.JSON"]` : code 0 et manifeste source copié dans la sortie sur le volume macOS insensible à la casse.
- `publicFiles: ["DIST/old.txt"]`, fichier préexistant dans la sortie : le filtre compare exactement `dist`, laisse passer `DIST`, puis le nettoyage efface l’entrée. Échec `ENOENT` lors de la copie, ancienne sentinelle supprimée.
- Fichiers factices `docs/review.md` et `Claude outputs/internal.txt` situés dans la fixture du site et déclarés publics : code 0, fichiers publiés. Aucune exclusion de ces segments internes n’est implémentée. Ce test ne prétend pas accéder au `docs/` réel du dépôt parent.

**Conséquence :** le manifeste et une ancienne sortie restent sélectionnables via leur casse, avec le même effet destructeur sur l’entrée que dans PUB-05 initial. La garantie d’exclusion des fichiers internes reste plus large que ce que vérifie le code.

**Correction recommandée :** appliquer les exclusions aux noms et segments sous une forme normalisée portable, avant tout nettoyage ; vérifier également qu’aucune source réelle n’appartient à la sortie calculée. Couvrir explicitement les chemins internes du contrat, sans interdire les notices autorisées. Ajouter les variantes de casse aux tests avec vérification de préservation de l’ancienne sortie.

#### PUB-06 — P2 — Les noms réservés et conflits de préfixes ne partagent pas la normalisation de casse

**Fichiers / lignes :** `scripts/assemble-site.mjs:727-758,785-803`.

**Scénarios reproduits :** `_HEADERS/child.txt` passe la réservation, puis échoue avec `EISDIR` à l’écriture de `_headers`, après destruction de la sentinelle de l’ancien `dist/`. `SITEMAP.XML` et `Shared/intrus.css` sont acceptés avec code 0. Le contrôle `parCasse` compare les destinations entières ; les noms réservés et la comparaison fichier/préfixe restent sensibles à la casse. `sitemap.xml` n’étant pas généré, sa variante n’est même pas rattrapée par l’ajout des fichiers générés au plan.

**Conséquence :** le comportement dépend encore du système de fichiers et certaines collisions ne sont découvertes qu’après nettoyage. Un nom réservé peut être publié sous une autre casse. Le cas `_HEADERS/child.txt` est une collision préalable de manifeste, pas la préservation atomique facultative de PUB-A1.

**Correction recommandée :** normaliser de façon cohérente tous les noms réservés, segments de répertoire et préfixes du plan. Vérifier les conflits fichier/répertoire sur cette représentation avant suppression, pas seulement les doublons complets. Conserver ensuite le contrôle final d’inventaire déjà ajouté.

#### PUB-07 — P2 — Des ressources automatiquement chargées restent invisibles au contrôle

**Fichiers / lignes :** `scripts/assemble-site.mjs:328-336,340-359,521-549,593,621-633`.

**Scénario concret sur une copie du site réel :** retirer seulement `js/main.js` de `publicFiles`, en conservant les HTML et leur `<script src="js/main.js"></script>`. L’assemblage retourne **0**, annonce **41 fichiers**, et `dist/js/main.js` est absent. La conformité de l’inventaire au manifeste ne détecte pas la référence cassée.

**Autres variantes reproduites :** un script distant `https://example.invalid/a.js`, un script local absent et `url(absent.png)` dans un bloc `<style>` sont tous acceptés avec code 0. `masquerZonesNonBalises` retire les balises `script` en entier avant l’extraction des attributs ; il retire aussi les blocs `style`, dont le contenu CSS n’est jamais analysé séparément. `<img src="/">` est accepté parce que l’exception de racine ne distingue pas navigation et ressource. Avec deux attributs `src`, le parseur conserve le dernier et peut ignorer la première valeur absente utilisée par l’analyse HTML du navigateur.

**Régression de syntaxe reproduite :** `<img src="present.webp" alt="L'atelier">`, avec une ressource déclarée et présente, est refusé comme « guillemet non fermé ». Le comptage global des apostrophes traite celle du texte comme un délimiteur. Deux apostrophes passent, une seule échoue : le contrôle ne suit pas le délimiteur réel de l’attribut.

**Conséquence :** des JavaScript absents ou des ressources externes peuvent être déclarés valides ; une simple apostrophe dans un attribut valide peut au contraire casser le build. Les cas initiaux d’images sont corrigés, mais la garantie générale sur les ressources ne l’est pas.

**Correction recommandée :** conserver et analyser les attributs des balises `script`, analyser séparément le CSS des blocs `style`, réserver le raccourci de racine aux liens de navigation, et analyser les guillemets selon leur contexte. Refuser explicitement les attributs dupliqués plutôt que choisir silencieusement la dernière valeur. Ajouter un test retirant `js/main.js` du manifeste réel, les ressources dans `script`/`style` et l’attribut français avec apostrophe.

#### PUB-08 — P2 — Entités HTML et contenu inerte contournent encore la politique robots

**Fichiers / lignes :** `scripts/assemble-site.mjs:328-359,426-497`.

**Scénarios reproduits en `portfolio/production`, tous avec code 0 :**

- `<meta name="goog&#108;ebot" content="noindex">` est conservé à côté de `robots="index, follow"`. Après décodage HTML, son nom est bien `googlebot`.
- `<meta name=googlebot content="no&#105;ndex">` laisse de même subsister `noindex` : la recherche travaille sur la chaîne encodée.
- `<meta name=googlebot name=description content=noindex>` contourne la détection par écrasement de la première valeur dans la `Map`, au lieu de refuser cet attribut dupliqué.
- `<template><meta name=robots content=index></template>` dans le head voit sa balise remplacée à l’intérieur du template. Aucune balise robots active n’est ajoutée au head : le contenu d’un template est inerte tant qu’il n’est pas instancié.

**Conséquence :** la sortie peut encore contenir une directive spécifique contradictoire ou aucune balise robots effective, alors que l’assembleur annonce une politique appliquée. Le `_headers` global des démos/previews ne corrige ni le HTML produit ni le cas portfolio/production sans règle globale.

**Correction recommandée :** décoder les références de caractères dans les attributs pertinents avant d’évaluer la politique, refuser les attributs dupliqués et tenir compte des contextes inertes. Si ces structures restent hors du périmètre du transformateur, les refuser explicitement. La vérification finale ne doit pas simplement répéter les mêmes hypothèses d’analyse qui ont permis la transformation incorrecte.

### Méthode, preuves indépendantes et limites

Conventions relues après `git pull --ff-only` ; lecture complète des deux scripts avant exécution et examen du diff correctif, du README et du pin Node. Aucune exécution des scripts dans le dépôt de travail. Toutes les reproductions utilisent des copies issues de `git archive` ou des fixtures factices sous **`/private/tmp/review-publication-8cedeb3.FLrKwL`**, créé par `mktemp -d`. `TMPDIR` pointe vers un sous-dossier de ce répertoire pour contenir aussi les bacs créés par la suite. Les sources du dépôt réel sont restées inchangées.

Le runtime officiel **Node 22.23.2 pour Darwin arm64** a été téléchargé et extrait uniquement dans ce dossier jetable. SHA-256 de l’archive comparé à `SHASUMS256.txt` de la même distribution : `61130f394c1630d211dd50aecc4353d379480f36d3ac913cd85dbba1aed585c6`. `node --version` retourne `v22.23.2`. Tous les essais fonctionnels de cette contre-vérification utilisent ce runtime. Le seul lancement sous **24.19.0** vérifie le refus de version ; il ne sert pas de preuve de compatibilité ou de rejeu de référence.

Le harnais indépendant ne réutilise pas les fonctions de validation de l’assembleur pour décider de la conformité. Il prépare les fichiers et les sentinelles, observe les codes, compare les contenus et conserve ses résultats localement (`countercheck.mjs`, `results.json`, journaux des suites et injections). Les tests négatifs ordinaires exécutent l’assembleur copié inchangé. Les injections ajoutent un préambule uniquement à une copie jetable et passent par `VERIF_ASSEMBLEUR_INJECTE`, sans modifier la suite livrée.

| Vérification | Preuve observée |
| --- | --- |
| Suite livrée complète | 62 réussis, 0 échec, code 0 sous 22.23.2 |
| Deux suites lancées indépendamment en concurrence | Deux bacs distincts ; 58 réussis chacune, codes 0 ; mode `--self-test-enfant` pour éviter les auto-tests récursifs |
| Interruptions pilotées par un événement | `SIGINT` puis `SIGTERM` après lecture de `[OK] assemblage production` ; signal de fin attendu, bac supprimé, copie source conservée |
| Sources de la copie servant de dépôt à la suite | Inventaire et empreintes inchangés après concurrence, interruptions et injections non nulles ; sentinelles du site préexistant et de l’ancienne sortie conservées ; dossier temporaire des bacs vide après ces essais |
| Six injections non nulles après succès | Code 73 injecté à six étapes ; six sorties finales 1 avec identification du test en échec |
| Injection muette après succès | Appels 7–11 neutralisés sans écriture ; cinq réutilisations de la sortie précédente, résultat final 0 : défaut PUB-03 résiduel |
| Liens symboliques | Sept variantes refusées avec code 1, cibles factices et ancienne sortie intactes |
| Convention des notices | Cinq formes de nom, extension et casse dans les quatre modes/type ; blocs exacts présents, exceptions individuelles pour portfolio/production |
| Inventaire réel | 42 fichiers exactement : 5 pages + 28 publics + 7 partagés + `robots.txt` et `_headers` |
| Ressources réelles copiées | 35 fichiers identiques à leurs sources, comparés par contenu, photos/fontes/notices comprises |
| Comparaison de livraisons | Ensemble des chemins et SHA-256 de chacun des 42 fichiers identiques entre `33d71b4` et `8cedeb3`, et entre production/preview pour cette démo |

Les deux sorties de chaque livraison ont été comparées indépendamment ; les pages HTML font partie de la comparaison, pas seulement les ressources copiées. L’agrégat SHA-256 du dictionnaire JSON trié des chemins vers leurs SHA-256 est `61baa3bee04b5a01a478f29523b052453ed26c0ebec90a64dd1da0e9f72838c4`. Sa méthode diffère de l’empreinte shell du rapport initial : ces deux agrégats ne doivent pas être comparés directement.

Les effets de casse ont été reproduits sur le volume macOS insensible à la casse utilisé ici ; aucun rejeu Linux n’est revendiqué. Les essais d’interruption ne prouvent pas un nettoyage sur `SIGKILL`. Aucun contrôle artistique, ancien parcours fonctionnel ou point P06 n’a été rouvert. Aucun changement de code, compte, connexion Cloudflare ou déploiement.

### Clôture attendue et séparation avec QA

Il reste à corriger et contre-vérifier **PUB-03, PUB-05, PUB-06, PUB-07 et PUB-08**. Les autres constats sont clos pour le périmètre et les preuves indiqués. Les 62 contrôles actuels ne suffisent pas à clore ces cinq variantes résiduelles. **PUB-A1 demeure facultatif et différé.**

Les contrôles HTTP réels — statut 404 sur URL simple/imbriquée, redirections, en-têtes effectivement servis, HTTPS et règles d’hôte — restent réservés à QA sur l’hébergement après autorisation. Ils sont distincts des cinq corrections locales ci-dessus et ne sont pas utilisés pour maintenir artificiellement un constat local ouvert.

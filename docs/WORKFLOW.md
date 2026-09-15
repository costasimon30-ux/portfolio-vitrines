# Workflow multi-agents (Codex + Claude)

Ce repo est travaillé par plusieurs agents IA + Simon. Pour éviter les conflits, chacun a un périmètre de fichiers clair. La liste complète des agents actifs, leur rôle et leur identifiant est dans `docs/AGENTS.md` — ce fichier-ci décrit les règles et le cycle, `AGENTS.md` décrit qui elles concernent.

## Répartition

- **Codex — Chef de projet** : lit et écrit uniquement dans `docs/DIRECTION.md` (hors sous-section « Direction artistique »). Positionnement, contenu, arborescence, fonctionnalités, parcours utilisateur, contraintes, critères de réussite — une section par site.
- **Codex — UI/UX & Direction artistique** : écrit la sous-section « Direction artistique » de `docs/DIRECTION.md` en amont, et un rapport `docs/UX-REVIEW-<site>.md` en aval, une fois le site rendu par Claude.
- **Codex — Architecte Front-end** : intervient en amont sur un nouveau site ou un changement structurel important. Écrit dans `docs/ARCHITECTURE.md` (notes valables pour tout le portfolio, pas un fichier par site). N'implémente pas.
- **Codex — Code Reviewer** : intervient après une implémentation de Claude. Écrit un rapport dans `docs/CODE-REVIEW-<site>.md`. Ne corrige pas lui-même.
- **Codex — QA / Audit** : dernière étape avant mise en avant du site dans le portfolio. Écrit un rapport dans `docs/QA-<site>.md`. Ne corrige pas lui-même.
- **Codex — Freelance Business** : n'écrit jamais dans ce repo (voir `docs/AGENTS.md` § Confidentialité).
- **Claude (implémentation)** : lit `docs/DIRECTION.md` et tous les rapports `docs/UX-REVIEW*.md`, `docs/CODE-REVIEW*.md`, `docs/QA-*.md` avant de travailler. Écrit dans `sites/`, `shared/`, et les fichiers de config à la racine (`.gitignore`, `README.md`, `CLAUDE.md`).
- **Simon** : arbitre, décide, et peut écrire n'importe où.

Règle simple : si un agent doit sortir de son périmètre, on en parle d'abord avec Simon.

## Accès Git

- Repo : `git@github.com:costasimon30-ux/portfolio-vitrines.git`
- Branche unique : `main` (pas de branches séparées pour l'instant, le projet est petit et le périmètre de fichiers évite déjà les conflits)
- Avant d'écrire : toujours `git pull` pour récupérer les derniers changements des autres agents.
- Convention de commit : préfixer par `docs:` pour les mises à jour de direction/architecture/revue, `site(nom-du-site):` pour l'implémentation d'un site, `chore:` pour le reste.
- **Trailer d'agent obligatoire** : chaque commit se termine par une ligne `Agent: <identifiant>` reprenant l'identifiant défini dans `docs/AGENTS.md` (ex: `Agent: claude-qa`). Les agents côté Codex partagent la même identité Git et la même clé SSH — ce trailer est le seul moyen de savoir, après coup, quel agent précis a fait un commit donné.

## Cycle de travail

Pour un site simple, seules les étapes 1, 2, 3 et 6 sont nécessaires. Les étapes 4 et 5 (Architecte, Code Reviewer, QA) sont des renforts à mobiliser quand le site le justifie — pas systématiques à chaque changement.

1. **Chef de projet** rédige les spécifications fonctionnelles dans `docs/DIRECTION.md`. **UI/UX** y ajoute la direction artistique. Commit + push (trailers `claude-chef-de-projet` / `claude-ui-ux`).
2. *(Optionnel, nouveau site ou refonte structurelle)* **Architecte Front-end** propose une organisation technique dans `docs/ARCHITECTURE.md`. Commit + push (trailer `claude-architecte-frontend`).
3. **Claude** `git pull`, lit `docs/DIRECTION.md` (et `docs/ARCHITECTURE.md` si présent), implémente dans `sites/<nom-du-site>/`. Commit + push (trailer `claude-cowork`).
4. *(Optionnel)* **Code Reviewer** audite le code produit, écrit `docs/CODE-REVIEW-<site>.md`. Commit + push (trailer `claude-code-reviewer`).
5. *(Optionnel, avant mise en avant définitive)* **QA** fait l'audit fonctionnel/responsive/accessibilité/SEO/performance, écrit `docs/QA-<site>.md`. Commit + push (trailer `claude-qa`).
6. **UI/UX** audite le rendu, écrit `docs/UX-REVIEW-<site>.md`. Commit + push (trailer `claude-ui-ux`).
7. **Claude** `git pull`, lit tous les rapports disponibles, corrige ce qui relève du code. Ce qui relève d'une décision de direction remonte au Chef de projet via Simon, et repart au point 1.
8. **Simon** valide en local ou en ligne.

### Règles de travail partagé

Le dépôt est partagé entre plusieurs agents qui écrivent tous sur `main` :

1. **Repartir de l'état courant avant d'écrire** : `git pull --rebase` avant toute modification en voie locale, ou relecture de l'URL `raw` du fichier avant édition en voie web.
2. **Ne toucher qu'à ses propres fichiers** : jamais `git add -A` en voie locale — des chemins nommés, et eux seuls.
3. **Publier immédiatement** : push juste après le commit. Un commit qui reste local est invisible des autres agents et remontera au pire moment.

## Indépendance des agents de revue

Les rôles qui revoient — UI/UX en aval, Code Reviewer, QA — vérifient le travail d'une autre conversation Claude. Même modèle, mêmes angles morts : leur mode d'échec n'est pas la sévérité, c'est l'accord réflexe.

Ils ne reçoivent que **le résultat** : le dépôt à un commit précis et, s'il existe, l'URL hébergée. Jamais le raisonnement de l'implémenteur. Si on leur transmet des explications sur les choix faits, ils les ignorent et jugent ce qu'ils observent.

Un constat n'entre dans un rapport que s'il est reproductible : une commande exécutée, une page ouverte, une mesure relevée. Ce qui paraît douteux sans preuve va dans une section séparée et ne compte pas comme un défaut.

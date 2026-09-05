# Workflow multi-agents (Codex + Claude)

Ce repo est travaillé par plusieurs agents IA + Simon. Pour éviter les conflits, chacun a un périmètre de fichiers clair. La liste complète des agents actifs, leur périmètre et leur identifiant est dans `docs/AGENTS.md` — ce fichier-ci décrit les règles, `AGENTS.md` décrit qui elles s'appliquent.

## Répartition

- **Codex — Chef de projet (direction produit)** : lit et écrit uniquement dans `docs/DIRECTION.md`. Il y consigne le positionnement, le contenu, les choix fonctionnels de chaque site (une section par site).
- **Codex — UX Review** : lit `docs/DIRECTION.md` et le code du site concerné, écrit uniquement dans `docs/UX-REVIEW*.md`. Ne modifie jamais `sites/` ni `shared/` directement — ses constats passent par un rapport, à charge de Claude de les implémenter.
- **Claude (implémentation)** : lit `docs/DIRECTION.md` et les rapports `docs/UX-REVIEW*.md` avant de travailler, et écrit dans `sites/`, `shared/`, et les fichiers de config à la racine (`.gitignore`, `README.md`, `CLAUDE.md`).
- **Simon** : arbitre, décide, et peut écrire n'importe où.

Règle simple : si un agent doit sortir de son périmètre, on en parle d'abord avec Simon.

## Accès Git

- Repo : `git@github.com:costasimon30-ux/portfolio-vitrines.git`
- Branche unique : `main` (pas de branches séparées pour l'instant, le projet est petit et le périmètre de fichiers évite déjà les conflits)
- Avant d'écrire : toujours `git pull` pour récupérer les derniers changements des autres agents.
- Convention de commit : préfixer par `docs:` pour les mises à jour de direction ou de revue, `site(nom-du-site):` pour l'implémentation d'un site, `chore:` pour le reste.
- **Trailer d'agent obligatoire** : chaque commit se termine par une ligne `Agent: <identifiant>` reprenant l'identifiant défini dans `docs/AGENTS.md` (ex: `Agent: codex-ux-review`). Les agents côté Codex partagent la même identité Git et la même clé SSH — ce trailer est le seul moyen de savoir, après coup, quel agent précis a fait un commit donné.

## Cycle de travail

1. Codex (Chef de projet) met à jour `docs/DIRECTION.md` avec la direction pour un site (nouveau ou évolution). Commit + push (`docs: ...`, trailer `Agent: codex-chef-de-projet`).
2. Claude `git pull`, lit `docs/DIRECTION.md`, implémente dans `sites/<nom-du-site>/`. Commit + push (`site(<nom-du-site>): ...`, trailer `Agent: claude-cowork`).
3. Codex (UX Review) `git pull`, audite le site rendu, écrit son rapport dans `docs/UX-REVIEW-<nom-du-site>.md`. Commit + push (`docs: ...`, trailer `Agent: codex-ux-review`).
4. Claude `git pull`, lit le rapport UX, corrige ce qui relève du code ; ce qui relève d'une décision de direction remonte à Codex (Chef de projet) via Simon, et repart au point 1.
5. Simon valide en local ou en ligne.

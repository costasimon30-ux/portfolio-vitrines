# Workflow multi-agents (Codex + Claude)

Ce repo est travaillé par deux assistants IA + Simon. Pour éviter les conflits, chacun a un périmètre de fichiers clair.

## Répartition

- **Codex (chef de projet, direction produit)** : lit et écrit uniquement dans `docs/`. Il y consigne le positionnement, le contenu, les choix fonctionnels de chaque site, dans `docs/DIRECTION.md` (une section par site).
- **Claude (implémentation)** : lit `docs/DIRECTION.md` avant de travailler, et écrit dans `sites/`, `shared/`, et les fichiers de config à la racine (`.gitignore`, `README.md`, `CLAUDE.md`).
- **Simon** : arbitre, décide, et peut écrire n'importe où.

Règle simple : si un agent doit sortir de son périmètre, on en parle d'abord avec Simon.

## Accès Git

- Repo : `git@github.com:costasimon30-ux/portfolio-vitrines.git`
- Branche unique : `main` (pas de branches séparées pour l'instant, le projet est petit et le périmètre de fichiers évite déjà les conflits)
- Avant d'écrire : toujours `git pull` pour récupérer les derniers changements de l'autre agent.
- Convention de commit : préfixer par `docs:` pour les mises à jour de direction, `site(nom-du-site):` pour l'implémentation d'un site, `chore:` pour le reste.

## Cycle de travail

1. Codex met à jour `docs/DIRECTION.md` avec la direction pour un site (nouveau ou évolution).
2. Codex commit + push (`docs: ...`).
3. Claude `git pull`, lit `docs/DIRECTION.md`, implémente dans `sites/<nom-du-site>/`.
4. Claude commit + push (`site(<nom-du-site>): ...`).
5. Simon valide en local ou en ligne.

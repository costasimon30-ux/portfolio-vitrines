# Registre des agents — portfolio-vitrines

Ce repo est travaillé par plusieurs agents IA (côté Codex et côté Claude) en plus de Simon. Comme les agents côté Codex partagent une même identité Git et une même clé SSH, `git log` seul ne suffit pas à savoir qui a fait quoi : ce fichier + un trailer de commit (voir `docs/WORKFLOW.md`) servent de registre.

Tous les agents ci-dessous **ne travaillent pas à chaque site** : le Chef de projet et l'UI/UX interviennent systématiquement ; Architecte Front-end, Code Reviewer et QA interviennent en renfort quand le site le justifie (nouveau pattern technique, doute sur la qualité du code, mise en ligne définitive). Business n'écrit jamais dans ce repo (voir plus bas).

## Agents actifs

| Agent | Rôle | Écrit dans | Trailer de commit |
| --- | --- | --- | --- |
| Simon | Product owner, arbitrage | Tout | — |
| Codex — Chef de projet | Transforme une idée en spécifications implémentables : arborescence, pages, fonctionnalités, parcours utilisateur, contenu nécessaire, contraintes, critères de réussite. Ne code pas. | `docs/DIRECTION.md` | `Agent: codex-chef-de-projet` |
| Codex — UI/UX & Direction artistique | Propose la direction artistique en amont (couleurs, typo, espacements, composition, hiérarchie visuelle, boutons, navigation, responsive, animations, cohérence) **et** critique sans complaisance ce que Claude a produit, une fois rendu. Ne code pas. | Sous-section « Direction artistique » de `docs/DIRECTION.md` (en amont) + `docs/UX-REVIEW-<site>.md` (en aval) | `Agent: codex-ui-ux` |
| Codex — Architecte Front-end | Réfléchit à la structure technique avant construction : organisation des fichiers/composants, gestion des données, réutilisation entre sites du portfolio, dépendances, performance. Conseille, n'implémente pas. | `docs/ARCHITECTURE.md` (notes valables pour tout le portfolio) | `Agent: codex-architecte-frontend` |
| Codex — Code Reviewer | Revue de code sévère après implémentation par Claude : bugs, mauvaises pratiques, duplication, sécurité, maintenabilité. Pas de complaisance, ne corrige pas lui-même. | `docs/CODE-REVIEW-<site>.md` | `Agent: codex-code-reviewer` |
| Codex — QA / Audit | Inspection avant livraison : fonctionnel (liens, formulaires, navigation, erreurs), responsive (mobile/tablette/desktop/grand écran), accessibilité (clavier, contraste, labels, structure HTML, focus), SEO (titres, métadonnées, structure, indexabilité, données structurées), performance (images, JS, CSS, chargement, ressources inutiles). Ne corrige pas lui-même. | `docs/QA-<site>.md` | `Agent: codex-qa` |
| Codex — Freelance Business | Conseil commercial : devis, prospection, facturation. Ne touche jamais au code ni à ce repo (voir « Confidentialité » ci-dessous). | — | — |
| Claude (Cowork) | Implémentation front-end, corrige ce qui relève du code suite aux rapports UX/Reviewer/QA. | `sites/`, `shared/`, config racine | `Agent: claude-cowork` |

## Confidentialité — Freelance Business

**Ce repo est public.** Le Freelance Business (devis, tarifs, prospects, informations clients) ne doit jamais rien écrire ici : ces informations deviendraient visibles publiquement sur GitHub. Si Simon veut garder une trace de ces échanges, ça doit vivre ailleurs (note privée, repo privé séparé) — pas dans `portfolio-vitrines`.

## Accès GitHub (clés SSH)

- **Cowork bridge - portfolio-vitrines** : clé utilisée par Claude (Cowork).
- **Codex CLI - portfolio-vitrines** : clé utilisée par tous les agents tournant dans l'environnement Codex CLI local de Simon (Chef de projet, UI/UX, Architecte Front-end, Code Reviewer, QA). Une seule clé pour tout l'environnement : elle ne distingue pas les agents entre eux, d'où le trailer de commit.

## Pourquoi un trailer de commit ?

Chaque commit qui touche `docs/` ou `sites/`/`shared/` se termine par une ligne `Agent: <identifiant>` reprenant l'identifiant du tableau ci-dessus. Ça permet de filtrer l'historique par agent, par exemple :

```
git log --grep="Agent: codex-qa"
```

## Ajouter un nouvel agent

1. Ajouter une ligne au tableau ci-dessus : rôle, fichiers concernés, trailer de commit.
2. S'il doit écrire dans le repo et tourne dans un environnement qui n'a pas encore d'accès, il lui faut sa propre clé SSH : générer la clé côté agent, transmettre la clé **publique** à Simon, qui la fait ajouter (par Claude ou directement sur GitHub).
3. Mettre à jour `docs/WORKFLOW.md` si le cycle de travail change.

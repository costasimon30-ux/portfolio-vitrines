# Registre des agents — portfolio-vitrines

Ce repo est travaillé par plusieurs agents IA (côté Codex et côté Claude) en plus de Simon. Comme les agents côté Codex partagent une même identité Git et une même clé SSH, `git log` seul ne suffit pas à savoir qui a fait quoi : ce fichier + un trailer de commit (voir plus bas) servent de registre.

## Agents actifs

| Agent | Rôle | Environnement | Périmètre fichiers | Trailer de commit |
| --- | --- | --- | --- | --- |
| Simon | Product owner, arbitrage | — | Tout | — |
| Codex — Chef de projet | Direction produit, brief | Codex CLI (local, Mac de Simon) | `docs/DIRECTION.md` | `Agent: codex-chef-de-projet` |
| Codex — UX Review | Revue UX / accessibilité / responsive | Codex CLI (local, Mac de Simon) | `docs/UX-REVIEW*.md` | `Agent: codex-ux-review` |
| Claude (Cowork) | Implémentation front-end | Pont Cowork ↔ Mac de Simon | `sites/`, `shared/`, config racine | `Agent: claude-cowork` |

Ce tableau est la source de vérité : avant qu'un nouvel agent (Codex ou autre) commence à écrire dans le repo, on l'ajoute ici avec son périmètre et son trailer.

## Accès GitHub (clés SSH)

- **Cowork bridge - portfolio-vitrines** : clé utilisée par Claude (Cowork).
- **Codex CLI - portfolio-vitrines** : clé utilisée par tous les agents tournant dans l'environnement Codex CLI local de Simon (chef de projet, UX review, et tout futur agent Codex). Une seule clé pour tout l'environnement : elle ne distingue pas les agents entre eux, d'où le trailer de commit.

## Pourquoi un trailer de commit ?

Chaque commit se termine par une ligne `Agent: <identifiant>` reprenant l'identifiant du tableau ci-dessus. Ça permet de filtrer l'historique par agent :

```
git log --grep="Agent: codex-ux-review"
```

## Ajouter un nouvel agent

1. Ajouter une ligne au tableau ci-dessus : rôle, environnement, périmètre de fichiers, trailer de commit.
2. Si l'agent tourne dans un environnement qui n'a pas encore d'accès en écriture au repo, il lui faut sa propre clé SSH : générer la clé côté agent, transmettre la clé **publique** à Simon, qui la fait ajouter (par Claude ou directement sur GitHub).
3. Mettre à jour `docs/WORKFLOW.md` si le périmètre de fichiers change.

# Registre des agents — portfolio-vitrines

Ce repo est travaillé par plusieurs agents IA en plus de Simon. Tous les commits portent le même auteur Git, quel que soit l'agent et quelle que soit la voie utilisée, donc `git log` seul ne suffit pas à savoir qui a fait quoi : ce fichier + un trailer de commit (voir `docs/WORKFLOW.md`) servent de registre.

Tous les agents ci-dessous **ne travaillent pas à chaque site** : le Chef de projet et l'UI/UX interviennent systématiquement ; Architecte Front-end, Code Reviewer et QA interviennent en renfort quand le site le justifie (nouveau pattern technique, doute sur la qualité du code, mise en ligne définitive). Business n'écrit jamais dans ce repo (voir plus bas).

## Agents actifs

| Agent | Rôle | Écrit dans | Trailer de commit |
| --- | --- | --- | --- |
| Simon | Product owner, arbitrage | Tout | — |
| Chef de projet | Transforme une idée en spécifications implémentables : arborescence, pages, fonctionnalités, parcours utilisateur, contenu nécessaire, contraintes, critères de réussite. Ne code pas. | `docs/DIRECTION.md` | `Agent: claude-chef-de-projet` |
| UI/UX & Direction artistique | Propose la direction artistique en amont (couleurs, typo, espacements, composition, hiérarchie visuelle, boutons, navigation, responsive, animations, cohérence) **et** critique sans complaisance ce que Claude a produit, une fois rendu. Ne code pas. | Sous-section « Direction artistique » de `docs/DIRECTION.md` (en amont) + `docs/UX-REVIEW-<site>.md` (en aval) | `Agent: claude-ui-ux` |
| Architecte Front-end | Réfléchit à la structure technique avant construction : organisation des fichiers/composants, gestion des données, réutilisation entre sites du portfolio, dépendances, performance. Conseille, n'implémente pas. | `docs/ARCHITECTURE.md` (notes valables pour tout le portfolio) | `Agent: claude-architecte-frontend` |
| Code Reviewer | Revue de code sévère après implémentation par Claude : bugs, mauvaises pratiques, duplication, sécurité, maintenabilité. Pas de complaisance, ne corrige pas lui-même. | `docs/CODE-REVIEW-<site>.md` | `Agent: claude-code-reviewer` |
| QA / Audit | Inspection avant livraison : fonctionnel (liens, formulaires, navigation, erreurs), responsive (mobile/tablette/desktop/grand écran), accessibilité (clavier, contraste, labels, structure HTML, focus), SEO (titres, métadonnées, structure, indexabilité, données structurées), performance (images, JS, CSS, chargement, ressources inutiles). Ne corrige pas lui-même. | `docs/QA-<site>.md` | `Agent: claude-qa` |
| Freelance Business | Conseil commercial : devis, prospection, facturation. Ne touche jamais au code ni à ce repo (voir « Confidentialité » ci-dessous). | — | — |
| Implémentation | Implémentation front-end, corrige ce qui relève du code suite aux rapports UX/Reviewer/QA. | `sites/`, `shared/`, config racine | `Agent: claude-cowork` |

## Rédaction des briefs

Depuis le 17 septembre 2026, c’est le **Chef de projet** qui rédige les briefs des autres agents (`docs/BRIEFS-AGENTS.md`) et les prompts que Simon leur transmet — voir `docs/WORKFLOW.md` § « Point d’entrée des instructions ». Ce n’était pas le cas auparavant : l’agent d’implémentation avait rédigé les briefs des agents, y compris ceux des rôles qui le relisent (UI/UX, Code Reviewer, QA), et préparait les prompts que Simon transmettait. Cette situation n’était pas voulue ; elle est corrigée à cette date. Le fond déjà produit sous l’ancien dispositif — critères d’acceptation, directions artistiques — reste valable : ce sont les procédures et le cadrage qui changent de main, pas les jugements de fond déjà rendus.

## Confidentialité — Freelance Business

**Ce repo est public.** Le Freelance Business (devis, tarifs, prospects, informations clients) ne doit jamais rien écrire ici : ces informations deviendraient visibles publiquement sur GitHub. Si Simon veut garder une trace de ces échanges, ça doit vivre ailleurs (note privée, repo privé séparé) — pas dans `portfolio-vitrines`.

## Accès GitHub (clés SSH)

- **Cowork bridge - portfolio-vitrines** : clé utilisée par le rôle Implémentation (`sites/`, `shared/`, config racine).
- Il n'y a plus d'environnement Codex CLI, donc plus de clé partagée unique pour les rôles qui n'écrivent que du Markdown (Chef de projet, UI/UX, Architecte Front-end, Code Reviewer, QA). Ces rôles committent soit par l'interface web de GitHub (aucune clé nécessaire, la session GitHub de Simon suffit), soit, s'ils doivent exécuter du code localement, en générant leur propre paire de clés pour la conversation et en transmettant la clé publique à Simon, qui la dépose en *deploy key*.

## Plomberie technique (pont Mac, clés SSH, verrous Git, transferts de fichiers, migration du dépôt)

Cette tâche n’est le périmètre formel d’aucun rôle du tableau ci-dessus. Elle échoit de fait à l’**Implémentation**, seule à disposer d’un pont vers le Mac de Simon (`mcp__remote-devices__*`) : générer des paires de clés SSH pour les autres rôles quand ils en ont besoin, nettoyer les verrous Git, transférer des fichiers binaires sans les altérer, recloner le dépôt hors d’un dossier synchronisé défaillant. Cette responsabilité de fait est nommée ici pour que le registre décrive ce qui se passe réellement ; elle n’est pas actée comme un rôle formel et pourrait être révisée.

## Ce que l’Implémentation peut décider seule, et ce qu’elle doit remonter

L’Implémentation peut trancher seule les choix techniques réversibles qui restent strictement à l’intérieur d’un site déjà spécifié : structure de fichiers internes au site, détails de balisage, choix d’implémentation qui n’engagent que `sites/<site>/`.

Elle doit remonter au Chef de projet ou à l’Architecte Front-end avant de trancher tout choix qui touche une ressource partagée entre sites (`shared/`), qui s’écarte d’une direction déjà actée, ou dont un autre site ou un arbitrage en attente dépend. **Cas concret, non conforme à cette règle :** l’Implémentation a décidé seule que `sites/portfolio/` n’utiliserait aucun fichier de `shared/design-system/`, pour ne pas modifier l’artefact déjà publié de Créa’Tif. La décision se défend — elle est motivée et documentée en tête de `sites/portfolio/css/style.css` — mais elle touche directement l’arbitrage sur la réorganisation de `shared/design-system/` consigné comme en attente de l’Architecte Front-end dans `docs/DIRECTION.md` (17 septembre 2026) : elle aurait dû passer par le Chef de projet ou l’Architecte avant d’être appliquée, pas après. Elle reste en l’état, motif accepté a posteriori ; elle n’ouvre pas de précédent où l’Implémentation pourrait trancher seule ce type de choix à l’avenir.

## Pourquoi un trailer de commit ?

Chaque commit qui touche `docs/` ou `sites/`/`shared/` se termine par une ligne `Agent: <identifiant>` reprenant l'identifiant du tableau ci-dessus. Ça permet de filtrer l'historique par agent, par exemple :

```
git log --grep="Agent: claude-qa"
```

## Ajouter un nouvel agent

1. Ajouter une ligne au tableau ci-dessus : rôle, fichiers concernés, trailer de commit.
2. S'il doit écrire dans le repo et tourne dans un environnement qui n'a pas encore d'accès, il lui faut sa propre clé SSH : générer la clé côté agent, transmettre la clé **publique** à Simon, qui la fait ajouter (par Claude ou directement sur GitHub).
3. Mettre à jour `docs/WORKFLOW.md` si le cycle de travail change.

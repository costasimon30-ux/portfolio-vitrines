# QA — La Tablée des Forges

## Bilan QA et GET publics ciblés — 19 octobre 2026

**Verdict borné : pages et ressources échantillonnées accessibles, types cohérents, vraie 404 et non-indexation observées. Les couvertures manquantes de la recette du 5 octobre restent non certifiées ; aucune nouvelle recette navigateur n'a été menée.** La publication a été autorisée par Simon avec dérogation explicite après le verdict local ci-dessous : ne pas interpréter ce verdict historique comme une interdiction actuelle de maintenir la démo.

### Version, méthode et traçabilité

- URL : `https://la-tablee-des-forges.costa-simon30.workers.dev`. GET indépendants le **19 octobre, 05 h 52–05 h 54 Europe/Paris** (UTC+02) ; première série horodatée `2026-10-19T03:52:44.9586380+00:00`, complément de redirection terminé à `03:53:22.9519337+00:00`.
- PowerShell / `System.Net.Http.HttpClient`, GET HTTPS, validation TLS normale, suivi des redirections puis complément sans suivi. SHA-256 par `SHA256.HashData` sur les octets reçus en mémoire avant décodage UTF-8. Aucun fichier de preuve créé, aucun build ou test local exécuté.
- Résolution DNS initialement impossible dans le bac à sable, outil web également inaccessible ; **limite levée par l'accès réseau hors bac à sable autorisé**. Les réponses ci-dessous remplacent la conclusion préparatoire d'impossibilité de contrôle HTTP.
- Dernière publication documentée dans DIRECTION : source **2d325b5**, version Cloudflare **b462d268**. Aucun nouvel identifiant distant n'a été inspecté. L'accueil reçu fait **5 823 octets**, SHA-256 `c0093d321f331d3db15095ad7d4446fcc97ac436c64f558b63dc9404506bdbc9`, identique aux octets HTML de `2d325b5` lus depuis Git. Le script reçu conserve le hash de la recette locale du 5 octobre. Ces correspondances ne prouvent pas l'identité complète du paquet ni sa version Cloudflare actuelle.

### Chemins réellement demandés et résultats

Toutes les réponses contrôlées portent `X-Robots-Tag: noindex, follow`. Les pages finales et les 404 portent aussi la meta `noindex, follow`.

| Chemin GET | Résultat observé |
| --- | --- |
| `/`, `/le-lieu` | 200 ; `text/html` |
| `/la-carte.html` | 307 vers `/la-carte`, puis 200 `text/html` ; redirection sans suivi : corps vide, aucun Content-Type |
| `/css/style.css` | 200 ; `text/css` |
| `/js/defilement.js` | 200 ; `text/javascript` |
| `/assets/NOTICE.md` | 200 ; `text/plain; charset=utf-8` |
| `/robots.txt` | 200 ; `text/plain` ; corps `User-agent: *` puis `Allow: /` |
| `/inexistant-qa-bilan/niveau` | **404 réelle** ; `text/html` ; titre « Page introuvable — La Tablée des Forges » |
| `/publication.json` | 404 ; même corps HTML que la 404 imbriquée |

Empreintes complémentaires des corps reçus :

| Ressource | Octets | SHA-256 |
| --- | ---: | --- |
| `/la-carte` après redirection | 8 707 | `cacc471734cdabfb15f4dc0c7972103697bcda654263ff07b782cd2b1be58bc7` |
| `/le-lieu` | 6 122 | `c1c46c939d1208ae8576df5d3307f275dda02fae529784eb5cf33e552e472bce` |
| `/css/style.css` | 18 130 | `09343021ca342f1b035cafae04b78e979c962bbdc1e3f55f762a21bad9631e48` |
| `/js/defilement.js` | 11 019 | `3cce129704492ffb0076d7eca27ebaa40ecd639989c8675ede4aa9ed54c6e640` |
| `/assets/NOTICE.md` | 7 607 | `7d57214b14125831aeac8decb4f893d6df46af6b20aa4cda623622cd3e08e736` |
| 404 imbriquée | 1 593 | `a91c55e914baab2002671b523f3d2cc8b4ed3d9dc8c9e0df864fbe27b6723973` |

### Acquis, réserves et suite

La matrice locale trois pages/quatre formats, les contrôles d'évitement, les replis sans JS/mouvement réduit et le bas de page restent acquis dans le périmètre de la recette du 5 octobre. DIRECTION consigne ensuite l'autorisation de publication par Simon, **avec exception pour le zoom natif non prouvé**, puis la publication du 6 octobre et la comparaison historique de 30 fichiers publics. Cette décision n'a pas transformé les contrôles incomplets en réussites.

**Restent au suivi accepté, non retestés :** zoom natif 200 %, sortie/réentrée de La carte à 768 après franchissement réel du seuil, clic réel du CTA La carte vers Le lieu à 1440, focus dans chaque groupe, échec d'observation, contrastes détaillés et CLS du chargement froid. Hystérésis acceptée ; P02/P03/P04 bis maintenues avec leurs réserves de crédits/droits/cadrage. Aucun défaut nouveau n'est démontré par cette passe.

**Action nécessaire :** aucune correction ni nouvelle recette générale automatique. Si une clôture complémentaire est demandée, limiter les essais aux scénarios non certifiés ci-dessus. Les HTTP actuels apportent une preuve hébergée ciblée ; ils ne remplacent pas ces interactions et n'autorisent aucune republication.

### Ce qui n'a pas été vérifié

Aucun navigateur, rendu, clic, clavier, zoom, appareil physique, console ou mesure de performance nouvelle ; pas de contrôle des images, polices, crédits externes/droits, inventaire complet des fichiers ou compte Cloudflare. Aucun code, réglage ou déploiement ; seul ce rapport est modifié dans le créneau documentaire QA.

---

## Recette ciblée du 5 octobre 2026 — source 2d325b560a9be87f72d1912b95a543649eddc71a

**Verdict : impossible de clore la prépublication.** La matrice locale demandée a cette fois été exécutée sur les trois pages aux quatre dimensions. Aucun défaut nouveau du code n'est démontré sur les contrôles passés. Le zoom navigateur **natif** 200 % demeure non testé et un clic CTA desktop automatisé reste ambigu ; ces limites ne valent ni conformité ni demande de correction présumée. Aucun code, réglage ou déploiement n'a été changé. Ce résultat remplace l'état préparatoire du commit QA `6f2c12b`.

### Artefact et méthode

Extraction isolée du SHA exact dans `/private/tmp/qa-tablee-ZxevM8`, assemblage production avec Node 22.23.2 : 31 fichiers, 859,5 KiB, 3 notices, 0 fichier partagé. SHA-256 de `dist/js/defilement.js` identique à celui du même fichier dans le commit : `3cce129704492ffb0076d7eca27ebaa40ecd639989c8675ede4aa9ed54c6e640`. Serveur local `127.0.0.1:8766` ; Chrome headless piloté par Playwright avec largeur/hauteur CSS mesurées et contextes neufs, plus un vrai clic au premier plan dans Chrome. Scripts de mesure temporaires : `/private/tmp/qa-tablee-run.js`, `/private/tmp/qa-tablee-extra.js`, `/private/tmp/qa-tablee-target.js` (hors dépôt). Une automation DOM/HTTP ne prouve pas le rendu tactile ou le zoom natif.

### Résultats observés — 3 pages × 4 viewports

| Page | Dimensions CSS réellement mesurées | Groupes | Entrée → sortie → seconde entrée à la molette | Bas de page | Débordement / ressources |
| --- | --- | ---: | --- | --- | --- |
| Accueil | 320×568, 375×667, 768×1024, 1440×900 | 4 | **Passé** aux 4 largeurs : premier groupe hors champ armé/opacité 0, puis opacité 1 après 600 ms sans poursuivre le scroll, retour opacité 0 après remontée, seconde entrée opacité 1. Exemple 320 : titre T=977→427→977→427 px. | Dernier groupe et pied opaques (1) au dernier pixel ; footer visible aux 4 tailles. | 0 px horizontal, image chargée, HTTP 200, 0 erreur console, 0 requête en échec aux 4 tailles. |
| La carte | 320×568, 375×667, 768×1024, 1440×900 | 7 | **Passé** à 320, 375 et 1440. À 768, entrée nette à T=776 px, mais après remontée le titre s'arrête à T=934 px, en deçà du seuil de sortie 0,92H=942 px : groupe resté opaque (1), comportement cohérent avec l'hystérésis acceptée ; sortie/réentrée à cette largeur **non prouvée**, pas un défaut démontré. | Dernier groupe et pied opaques (1), footer visible aux 4 tailles. | 0 px horizontal, image chargée, HTTP 200, 0 erreur console, 0 requête en échec aux 4 tailles. |
| Le lieu | 320×568, 375×667, 768×1024, 1440×900 | 3 | **Passé** aux 4 largeurs ; exemple 375 : T=809→504→809→504 px, opacité 0→1→0→1. | Dernier groupe et pied opaques (1), footer visible aux 4 tailles. | 0 px horizontal, les 2 images chargées, HTTP 200, 0 erreur console, 0 requête en échec aux 4 tailles. |

À chaque largeur/page, tous les liens internes du document ont été demandés par HTTP : aucun 4xx ni fragment local manquant. Les liens de navigation ont été activés et le retour d'historique a retrouvé la page d'origine. Les CTA Accueil→La carte et Le lieu→La carte ont navigué dans les essais automatisés ; le CTA La carte→Le lieu a navigué à 320/375. À 768/1440, Playwright a focalisé le CTA sans navigation observée après 5 s, mais un **clic au premier plan dans Chrome à 768** sur ce même lien a bien ouvert `le-lieu.html` : le résultat headless est discordant, à ne pas classer comme défaut sans reproduction réelle desktop. Le clic réel à 1440 demeure non vérifié.

Sur les 12 couples, le **premier Tab** a focalisé le lien « Aller au contenu » (anneau `solid`, rectangle visible Y=0–49 ou 0–52 px) ; Entrée a transféré le focus réel à `main#contenu` avec fragment `#contenu`. L'accès direct à `#contenu` donne `main` à Y=16 px. À 375×667, les accès directs à `la-carte.html#cat-burgers`, `#cat-bieres` et `le-lieu.html#titre-infos` ont affiché le titre à Y=16–17 px, groupe opaque et non armé. Les touches Fin/Origine ont été émises dans les 12 scénarios ; l'opacité des derniers groupes au bas est mesurée ci-dessus, mais la position finale après Origine n'a pas été conservée comme preuve distincte.

**Sans JavaScript et avec `prefers-reduced-motion: reduce`**, dans 24 chargements séparés (12 cas × 2 replis), tous les groupes ont opacité 1, transform `none`, débordement horizontal 0. Images, légendes de crédit, lien vers la notice, mention explicite du caractère fictif et prix fictifs sont présents ; les images ont `complete=true` et `naturalWidth>0`. Les crédits externes n'ont pas été ouverts et les droits P02/P03/P04 bis ne sont pas réexaminés. L'observateur `layout-shift` n'a relevé aucune entrée non imputable à une interaction sur les retours de navigation mesurés (CLS 0) ; cela ne mesure pas isolément le premier chargement à cache froid ni ne prouve causalement toute absence de CLS du lot.

### En défaut / non testé / réserves existantes

- **Défaut nouveau démontré : aucun** dans les scénarios passés. Le maintien opaque à 768 px dans la bande d'hystérésis est une réserve déjà acceptée, non un clignotement.
- **Non testé, bloquant pour la clôture : zoom Chrome natif 200 %.** Essai unique depuis Chrome avec viewport temporaire 768×1024 et raccourci de zoom : les mesures sont restées `innerWidth=768`, `devicePixelRatio=1`, puis le viewport a été rétabli. La commande n'a donc pas fourni une preuve de zoom natif. L'émulation 160/187 px n'est pas substituée. Le débordement préexistant de 1 px émulé à 160 px sur La carte doit être tranché par un contrôle réel de lecture/focus/overflow à 200 %.
- **Non vérifiés complètement :** sortie/réentrée du premier groupe de La carte à 768 après franchissement réel du seuil ; clic réel du CTA La carte→Le lieu à 1440 ; focus au clavier dans chaque groupe, échec d'observation forcé, contraste chiffré sur chaque surface et CLS du premier chargement froid. Les contrôles HTTP hébergés, la vraie 404 Cloudflare et le tactile réel attendent un dépôt autorisé ou un appareil distinct selon le cadrage.
- **Réserves existantes :** P02/P03/P04 bis (crédits/droits/cadrage) et choix final de Simon sur le fond ; non rouverts par cette recette. Les 15 planches du précontrôle UI/UX dans `/private/tmp/tablee-vis-2d325b5-2beV80/` sont des preuves visuelles séparées, non un substitut aux tests dynamiques.

**Décision QA :** pas de correction de code demandée sur ces seules observations. La clôture reste impossible tant que le zoom natif 200 % et les quelques scénarios explicitement non vérifiés n'ont pas reçu une preuve. Ce rapport n'autorise pas la publication.

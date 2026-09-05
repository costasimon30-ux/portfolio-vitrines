# Revue UX — Créa’Tif

**Périmètre :** `sites/coiffeur-mixte/` · branche `main` · commit audité `7aed1b4`

**Référentiel :** `docs/DIRECTION.md`
**Méthode :** rendu local réel des quatre pages dans un navigateur, à 320, 375, 768, 1024 et 1440 px ; vérification du débordement horizontal, des ruptures de grille, du menu mobile, des contrastes et de la console.

## Verdict

La direction est solide : chaleureuse, contemporaine, lisible et cohérente d’une page à l’autre. La hiérarchie, les CTA et la navigation respectent bien l’intention du brief. Le site ne peut toutefois pas être considéré comme validé tel quel : un débordement horizontal bloque la page **Le salon / Contact** à la largeur de tablette exigée (768 px), et deux usages de texte sur fond Sable ne respectent pas le contraste AA.

**Statut : à corriger avant présentation finale de portfolio.**

## Contrôle du rendu et de la navigation

| Largeur de viewport | Accueil | Coiffure | Barbier | Le salon / Contact |
| --- | --- | --- | --- | --- |
| 320 px | Conforme, une colonne, CTA empilés, aucun débordement | Conforme | Conforme | Conforme |
| 375 px | Conforme, aucun débordement | Conforme | Conforme | Conforme |
| 768 px | Conforme, menu mobile, aucun débordement | Conforme | Conforme | **Débordement horizontal** |
| 1024 px | Conforme, navigation desktop et hero en deux colonnes | Conforme | Conforme | Conforme |
| 1440 px | Conforme, container et rythme visuel équilibrés | Conforme | Conforme | Conforme |

Le menu sous 900 px a été manipulé au clic et au clavier :

- `Tab` atteint successivement le lien d’évitement, le logo puis le bouton ; le focus est visible (contour Cuivre de 3 px).
- `Entrée` ouvre le menu, met `aria-expanded` à `true` et affiche la navigation.
- `Échap` ferme le menu, rétablit `aria-expanded="false"` et rend le focus au bouton.
- Le clic ouvre puis referme également le menu. Aucune erreur ou alerte console observée.

La page Contact respecte le périmètre : les deux actions utiles sont de vrais liens `mailto:` et `tel:` ; aucun formulaire, calendrier, compte ou simulacre de réservation n’est présent. C’est cohérent avec l’intention du projet.

## Points réussis

- La combinaison Encre / Ivoire, Cuivre, Sauge et Sable produit une identité calme, premium et non-vintage. Elle tient la même promesse sur les quatre pages.
- Le duo Cormorant Garamond / DM Sans différencie clairement l’éditorial et l’information pratique. Les H1 gardent de l’impact sans devenir illisibles à 320 px.
- La structure est très claire : promesse, preuve / approche, prestations, réalisations, puis contact. Les états actifs de navigation et les CTA primaires rendent le parcours évident.
- Les composants sont cohérents : boutons de 48 px, rayons sobres, cartes aérées, bandeau CTA sombre et footer stable.
- Le passage d’une à deux colonnes est propre à 900 px ; les cartes et les blocs éditoriaux se replient lisiblement en mobile.
- Les placeholders sont techniquement propres : aucun visuel cassé, des libellés accessibles décrivent chaque emplacement et les coordonnées fictives sont signalées.

## Problèmes

### P0 — débordement horizontal à 768 px sur Le salon / Contact

Dans la grille des informations pratiques, le placeholder de carte au ratio 16:9 force sa colonne à environ 756 px. À un viewport de 768 px (largeur utile mesurée : 753 px), la page atteint 942 px de largeur : la carte sort à droite et impose un scroll horizontal. Cette largeur fait partie des critères explicites du brief.

**Correction attendue :** sécuriser les pistes de grille avec des colonnes qui peuvent réellement rétrécir (`minmax(0, 1fr)`), autoriser le média à se contracter (`min-width: 0`) ou conserver une colonne unique jusqu’à une largeur où le duo liste + carte est confortable. Retester précisément à 768 px après correction.

### P1 — contraste insuffisant du texte secondaire sur Sable

- Sauge `#61766D` sur Sable `#E6DDD0` : **3,61:1**, insuffisant pour le texte courant. Cela concerne notamment les introductions de section placées dans une section alternative et la note de footer.
- Cuivre `#A84F3A` sur le haut du dégradé commençant par Sable : **4,06:1** dans sa zone la moins contrastée. L’eyebrow du hero ne doit pas dépendre d’un dégradé pour atteindre 4,5:1.

**Correction attendue :** employer Encre pour ces textes sur Sable, ou assombrir une variante dédiée de Sauge / Cuivre jusqu’au seuil AA. Garder le contraste en vérification après chaque changement de token.

### P1 — placeholders trop répétitifs pour une démo portfolio finale

Le dégradé Sauge → Pêche est élégant en tant qu’état transitoire, mais il remplace à lui seul le hero, les portraits, les réalisations, l’éditorial et la carte. Répété à cette échelle, il fait davantage penser à un prototype incomplet qu’à la vitrine d’un salon premium : les pages Coiffure et Barbier n’apportent ni preuve du savoir-faire ni univers visuel propre.

**Décision :** acceptable temporairement pour valider le layout, **pas assez abouti tel quel** pour la démo portfolio qui doit vendre le travail de direction artistique. Prévoir de vraies images dirigées ou, au minimum, quelques compositions provisoires différenciées et clairement intentionnelles ; ne pas conserver le même aplat dégradé dans toutes les zones.

### P2 — rupture de rythme entre le bandeau CTA et le footer

Un blanc important sépare le bandeau CTA sombre du footer. Sur mobile comme sur desktop, il donne l’impression que le site est terminé avant de recommencer avec le pied de page.

**Correction attendue :** supprimer ou réduire la marge haute du footer lorsqu’il suit directement un bandeau CTA ; garder la respiration à l’intérieur du bandeau et du footer plutôt qu’entre les deux.

### P2 — différenciation faible entre Coiffure et Barbier

Les deux pages sont structurellement et visuellement presque jumelles. La cohérence de système est très bonne, mais les mêmes proportions de médias et le même placeholder ne donnent aucune personnalité spécifique aux deux univers.

**Correction attendue :** conserver la grille et le langage de marque, mais différencier le cadrage photo, la densité, les matières et un accent éditorial par univers — sans basculer vers un imaginaire barbershop vintage.

### P2 — libellé du bouton de menu quand il est ouvert

Le bouton conserve le nom accessible « Ouvrir le menu » alors que son état est ouvert. `aria-expanded` est correct, donc ce n’est pas bloquant, mais « Fermer le menu » (ou un libellé neutre « Menu principal » accompagné de l’état) réduirait l’ambiguïté pour les lecteurs d’écran.

## Contrastes vérifiés

| Usage | Contraste | État |
| --- | ---: | --- |
| Encre / Ivoire (texte principal) | 14,06:1 | Conforme |
| Ivoire / Cuivre (bouton primaire) | 5,15:1 | Conforme |
| Sauge / Ivoire (texte secondaire) | 4,59:1 | Conforme, marge faible |
| Encre / Sable | 11,09:1 | Conforme |
| Sauge / Sable | 3,61:1 | Non conforme AA texte courant |
| Cuivre / Sable | 4,06:1 | Non conforme AA texte courant |
| Ivoire / Encre (bandeau CTA sombre) | 14,06:1 | Conforme |

## Plan de correction priorisé

1. **P0 — Responsive Contact :** corriger la grille à 768 px, puis revalider les cinq largeurs demandées sans scroll horizontal.
2. **P1 — Accessibilité visuelle :** corriger Sauge / Sable et l’eyebrow Cuivre sur le dégradé ; vérifier les états hover et focus concernés.
3. **P1 — Crédibilité portfolio :** remplacer la majorité des aplats par une direction photo cohérente et différente pour Coiffure, Barbier et le salon. Garder éventuellement un seul placeholder volontaire pour indiquer un futur asset.
4. **P2 — Finition :** resserrer la transition CTA → footer et ajuster le libellé accessible du menu ouvert.
5. **P2 — Singularité des pages :** différencier les univers avec les futurs assets, les cadrages et un rythme de composition spécifique, sans changer le système de base validé.

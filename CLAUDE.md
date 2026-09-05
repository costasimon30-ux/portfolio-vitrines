# portfolio-vitrines

Monorepo regroupant plusieurs sites vitrine (portfolio freelance). Ce fichier est lu par Claude au début de chaque session sur ce repo : il centralise les conventions du projet.

## Stack

- HTML / CSS / JS statique, pas de framework.
- Un site = un dossier autonome dans `sites/`, déployable indépendamment (GitHub Pages, Netlify, ou autre hébergement — à définir par site).

## Structure

```
portfolio-vitrines/
├── CLAUDE.md              # ce fichier
├── docs/
│   └── DIRECTION.md       # brief / cahier des charges, alimenté par Codex (ChatGPT) + Simon
├── shared/
│   ├── design-system/     # CSS variables, composants HTML réutilisables, fonts communes
│   └── assets/            # logos, images communes au portfolio
└── sites/
    ├── coiffeur-mixte/    # site vitrine "Vitrine coiffeur mixte"
    └── ...                # un dossier par nouveau site vitrine
```

## Convention de nommage

- Dossiers de sites en kebab-case dans `sites/` (ex: `coiffeur-mixte`, `restaurant-le-jardin`).
- Un site autonome contient au minimum `index.html`, `css/`, `assets/`.

## Workflow à trois (Simon / Codex / Claude)

- **Codex (ChatGPT)** pose la direction produit : positionnement, contenu, choix fonctionnels. Ces décisions sont consignées dans `docs/DIRECTION.md`.
- **Claude** implémente à partir de ce brief : intégration HTML/CSS/JS, structure de fichiers, respect du design system partagé.
- **Simon** arbitre et valide.
- Toute décision de direction qui n'est pas encore dans `docs/DIRECTION.md` doit y être ajoutée avant implémentation, pour que les deux IA travaillent à partir de la même source de vérité.

## État actuel

- Repo initialisé, structure de dossiers en place.
- `sites/coiffeur-mixte` : premier site du portfolio, en attente du cahier des charges (à intégrer dans `docs/DIRECTION.md`).

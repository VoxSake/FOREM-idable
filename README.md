# FOREM-idable

Agrégateur d'offres d'emploi orienté Forem, avec interface compacte, favoris, export CSV, comparaison d'offres et filtres localités multi-sélection.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS + shadcn/ui
- Vitest + Testing Library

## Fonctionnalités

- Recherche par mots-clés avec opérateur booléen (`OU` / `ET`)
- Filtres localités multi-sélection (régions, provinces, arrondissements, communes, localités)
- Tableau d'offres compact (pagination 15)
- Bouton PDF direct par offre quand disponible (proxy serveur)
- Favoris en local
- Export CSV (colonnes sélectionnables, métadonnées)
- Comparateur d'offres
- Provider principal: Forem
- Provider optionnel: Adzuna (désactivé par défaut)

## Installation

```bash
npm install
```

## Configuration

Copier l'exemple d'environnement:

```bash
cp env.example .env.local
```

### Variables utiles

- `ADZUNA_ENABLED=false` par défaut
- `ADZUNA_APP_ID=...`
- `ADZUNA_APP_KEY=...`

Pour activer Adzuna:

1. Mettre `ADZUNA_ENABLED=true`
2. Renseigner `ADZUNA_APP_ID` et `ADZUNA_APP_KEY`

## Lancer le projet

```bash
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Scripts

```bash
npm run dev        # développement
npm run build      # build production
npm run start      # lancement production
npm run lint       # lint
npm test           # tests unitaires/intégration (vitest run)
npm run test:watch # tests en watch
```

## Sources API

- Forem Open Data (ODWB):
  - `https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem`
- Nomenclature des localisations Forem:
  - `https://www.leforem.be/recherche-offres/api/Nomenclature/Localisations`
- PDF offre Forem (proxy interne):
  - `https://www.leforem.be/recherche-offres/api/Document/PDF/{offreId}`
- Adzuna (optionnel):
  - `https://developer.adzuna.com/docs/search`

## Licence

MIT  
Copyright (c) 2026 Jordi Brisbois

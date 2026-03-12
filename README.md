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
- Suivi des candidatures, relances et entretiens
- Comptes `user` / `coach` / `admin`
- Synchronisation multi-device via compte Postgres
- API externe sécurisée pour export `JSON` / `CSV`
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
- `UMAMI_ENABLED=false` par défaut
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID=...`
- `NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js` (optionnel)

Pour activer Adzuna:

1. Mettre `ADZUNA_ENABLED=true`
2. Renseigner `ADZUNA_APP_ID` et `ADZUNA_APP_KEY`

Pour activer Umami:

1. Mettre `UMAMI_ENABLED=true`
2. Renseigner `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
3. Laisser `NEXT_PUBLIC_UMAMI_SCRIPT_URL` tel quel (cloud) ou pointer vers votre script self-hosted
4. Le script Umami n'est charg&eacute; qu'apr&egrave;s consentement explicite via la banni&egrave;re RGPD

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

## API externe

FOREM-idable expose une API externe en lecture seule pour les comptes `coach` et `admin`.

Cas d'usage principaux:

- export Excel / Power Query
- intégration no-code
- reporting JSON / CSV
- extraction par utilisateur, groupe ou candidatures filtrées

Authentification:

- génération d'une clé API depuis `Mon compte`
- utilisation via header `Authorization: Bearer ...`

Documentation complète:

- [DOCAPI.md](./DOCAPI.md)

Le projet étant open source sous licence MIT, il peut aussi être self-hosted si un hébergement interne est requis pour des raisons de sécurité ou de conformité.

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

# FOREM-idable

FOREM-idable est une application Next.js orientee recherche d'emploi, suivi de candidatures et accompagnement par coachs. Le projet cible un usage reel, mais aussi un niveau de code defendable en entretien: front coherent, contrats d'entree valides, persistance type-safe, erreurs gerees explicitement et couverture de test sur les flux critiques.

Version live:
- https://forem.brisbois.dev

## Produit

Le produit couvre six domaines principaux:
- recherche d'offres avec moteur multi-source et historique
- suivi des candidatures pour les beneficiaires
- dashboard coach pour le pilotage par groupe
- administration des coachs, recherches mises en avant et cles API
- messagerie de groupe et messages prives
- API externe JSON/CSV pour reporting et automatisation

## Stack

- Next.js 16 App Router
- React 19
- TypeScript strict
- PostgreSQL + Drizzle ORM
- Zod pour la validation serveur
- Tailwind CSS + composants shadcn/ui
- Vitest pour l'unitaire
- Playwright pour l'end-to-end
- Redis optionnel pour rate limiting et diffusion d'evenements messages

Runtime cible:
- Node 24

## Architecture

Le code suit une organisation feature-first:

```txt
src/
  app/                    routes Next.js et handlers API
  features/               UI, hooks et logique de presentation par domaine
  lib/server/             logique serveur, acces DB, services metier
  components/ui/          primitives UI
  types/                  contrats applicatifs partages
```

Principes utilises dans le repo:
- routes API minces: auth, validation, orchestration, mapping d'erreurs
- logique metier serveur dans `src/lib/server`
- etat de page concentre dans des hooks `use*PageState`
- schemas Zod pour verrouiller les payloads d'entree
- types partages pour garder le contrat front/server explicite

## Choix techniques

### Validation

Les mutations critiques passent par Zod avant d'entrer dans la logique metier. L'objectif n'est pas seulement d'eviter des 500, mais de rendre les contrats defendables et homogenes.

### Persistance

Drizzle est utilise pour garder une base typée et evolutive, avec PostgreSQL comme source de verite. Une partie du domaine candidature repose sur une couche relationnelle explicite pour les operations coach, l'API externe et les exports.

### Messagerie

La messagerie utilise HTTP pour les mutations et SSE pour les mises a jour live. Le bus d'evenements est hybride:
- fallback memoire pour un runtime simple
- Redis pub/sub si `REDIS_URL` est configure

Ce choix est volontairement plus simple qu'un WebSocket complet tout en restant defensable pour un produit interne ou un MVP enrichi.

### Gestion d'erreurs

Les pages majeures disposent d'error boundaries segmentaires (`error.tsx`) et les routes API renvoient des erreurs metier explicites plutot que de laisser remonter des erreurs non controlees.

### Tests

Le projet couvre:
- la logique pure et les helpers metier avec Vitest
- les parcours critiques UI et metier avec Playwright

La cible n'est pas le 100% coverage, mais une couverture utile des flux a risque:
- auth
- suivi candidatures
- actions coach
- admin mobile
- messagerie
- workspace de recherche

## External API

L'API externe est reservee aux comptes `coach` et `admin`, via cles API.

Elle expose:
- listes et details utilisateurs
- listes et details groupes
- listes, details et mutations de candidatures
- exports CSV pour Excel / Power Query

Points importants:
- les filtres ne sont pas identiques sur tous les endpoints
- les reponses applications exposent maintenant des champs derives:
  - `isFollowUpDue`
  - `isInterviewScheduled`
- les exports CSV gardent des headers francais mais utilisent `yes/no` sur ces indicateurs derives

Documentation detaillee:
- [DOCAPI.md](/home/computebox/code/FOREM-idable/DOCAPI.md)

## Scripts

```bash
npm install
npm run dev
npm run lint
npm test
npm run test:e2e
npm run build
```

Drizzle:

```bash
npm run db:generate
npm run db:migrate
```

## Installation locale

```bash
cp env.example .env.local
npm install
npm run dev
```

Variables importantes:
- `DATABASE_URL`
- `REDIS_URL` optionnel
- `RESEND_API_KEY` pour le reset password
- `ADZUNA_*` si le provider secondaire est active
- `SERVER_TIMING_LOGS`, `SERVER_AUDIT_LOGS`, `DB_SLOW_QUERY_MS` pour l'observabilite

## Conventions de code

- validation d'entree via Zod sur les mutations
- front compose par domaine avant de descendre au niveau composant
- refactors prudents: extraction de modules serveurs sans casser les facades publiques
- pas de logique metier lourde dans les composants de rendu
- tests E2E axes sur les parcours critiques, pas sur le pixel perfect

## Etat actuel

Le repo vise un niveau "portfolio propre", pas une demo jetable:
- lint
- build production Next
- tests unitaires
- tests E2E Playwright

Le codebase continue toutefois d'etre refactorise par tranches. Les zones encore les plus denses sont principalement dans le domaine coach et certains services serveur historiques.

## Licence

MIT

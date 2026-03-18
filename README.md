# FOREM-idable

Agrégateur d'offres d'emploi orienté Forem, avec interface compacte, suivi de candidatures, export CSV, comparaison d'offres et filtres localités multi-sélection.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS + shadcn/ui
- PostgreSQL + Drizzle ORM (schéma, migrations, couche data progressive)
- Redis optionnel pour le rate limiting distribué
- Vitest + Testing Library

## Fonctionnalités

- Recherche par mots-clés avec opérateur booléen (`OU` / `ET`)
- Filtres localités multi-sélection (régions, provinces, arrondissements, communes, localités)
- Tableau d'offres compact (pagination 15)
- Bouton PDF direct par offre quand disponible (proxy serveur)
- Suivi des candidatures, relances et entretiens
- Comptes `user` / `coach` / `admin`
- Attribution de un ou plusieurs coachs par groupe, avec notion de manager par groupe
- Candidatures et historique liés au compte utilisateur
- API externe sécurisée pour export `JSON` / `CSV`, alignée sur les scopes coach/admin
- Synchronisation calendrier des entretiens pour `coach` / `admin` via lien d'abonnement ICS par groupe ou global
- Import CSV de candidatures côté coach avec auto-détection des colonnes, mapping manuel, gestion des statuts non reconnus et mise à jour des doublons existants
- Dashboard coach enrichi avec sections `À traiter`, `Activité récente` et édition / suppression de candidatures depuis le sidepanel bénéficiaire
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
- `PASSWORD_RESET_ENABLED=false` par défaut
- `NEXT_PUBLIC_PASSWORD_RESET_ENABLED=false` par défaut
- `APP_BASE_URL=...`
- `REDIS_URL=...` pour un rate limit partagé entre instances
- `SERVER_TIMING_LOGS=false` pour activer des logs structurés de timings DB/Redis côté serveur
- `RESEND_API_KEY=...`
- `RESEND_FROM_EMAIL=...`
- `RESEND_REPLY_TO=...`
- `PRIVACY_CONTROLLER_NAME=...`
- `PRIVACY_CONTACT_EMAIL=...`
- `PRIVACY_PROJECT_LABEL=...`
- `PRIVACY_SOURCE_URL=...`
- `COPYRIGHT_NAME=...`

Pour activer Adzuna:

1. Mettre `ADZUNA_ENABLED=true`
2. Renseigner `ADZUNA_APP_ID` et `ADZUNA_APP_KEY`

Pour activer Umami:

1. Mettre `UMAMI_ENABLED=true`
2. Renseigner `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
3. Laisser `NEXT_PUBLIC_UMAMI_SCRIPT_URL` tel quel (cloud) ou pointer vers votre script self-hosted
4. Le script Umami n'est charg&eacute; qu'apr&egrave;s consentement explicite via la banni&egrave;re RGPD

Pour activer la réinitialisation de mot de passe par email:

1. Mettre `PASSWORD_RESET_ENABLED=true`
2. Mettre `NEXT_PUBLIC_PASSWORD_RESET_ENABLED=true`
3. Définir `APP_BASE_URL`
4. Renseigner `RESEND_API_KEY`
5. Définir une adresse d’envoi valide dans `RESEND_FROM_EMAIL`

Pour activer un rate limit partagé entre plusieurs instances:

1. Déployer un service Redis sur le réseau privé de l'application
2. Définir `REDIS_URL`
3. Redéployer l'application

Sans `REDIS_URL`, l'application continue de fonctionner avec un fallback mémoire local.

Pour personnaliser la page `Confidentialité`:

1. Définir `PRIVACY_CONTROLLER_NAME`
2. Définir `PRIVACY_CONTACT_EMAIL`
3. Ajuster au besoin `PRIVACY_PROJECT_LABEL` et `PRIVACY_SOURCE_URL`

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

Scopes actuels:

- `admin`: accès global à toutes les données du suivi coach
- `coach`: accès limité aux groupes qui lui sont attribués et aux bénéficiaires visibles dans ces groupes

Cas d'usage principaux:

- export Excel / Power Query
- intégration no-code
- reporting JSON / CSV
- extraction par utilisateur, groupe ou candidatures filtrées

Authentification:

- génération d'une clé API depuis `Mon compte`
- utilisation via header `Authorization: Bearer ...`

Le contrat actuel expose aussi les coachs attribués et le manager de chaque groupe, et applique le même périmètre de visibilité que le dashboard coach.

Documentation complète:

- [DOCAPI.md](./DOCAPI.md)

## Synchronisation calendrier coach

Les comptes `coach` et `admin` peuvent générer des liens d'abonnement calendrier depuis la page `Suivi coach`.

Cas d'usage:

- abonnement Google Calendar / Outlook / Apple Calendar
- synchronisation des entretiens planifiés d'un groupe
- calendrier global regroupant tous les groupes bénéficiaires

Règles actuelles:

- un lien par groupe standard peut être copié depuis `Suivi coach`
- un lien global "tous les groupes bénéficiaires" est disponible
- le lien global ne contient que les groupes bénéficiaires réellement visibles par le compte courant
- la régénération d'un lien invalide les anciens abonnements
- la régénération est réservée aux comptes `admin`

Important:

- la mise à jour n'est pas instantanée: Google Calendar décide lui-même de la fréquence de rafraîchissement des flux ICS
- si un entretien est ajouté, modifié ou supprimé, le flux source est immédiatement à jour côté FOREM-idable, mais l'agenda abonné peut mettre un certain temps à refléter le changement

## Import CSV coach

Les comptes `coach` et `admin` peuvent importer un suivi existant directement depuis le sidepanel d'un bénéficiaire.

Fonctionnalités actuelles:

- import `CSV` depuis `Suivi des bénéficiaires`
- modèle CSV téléchargeable
- auto-détection des colonnes les plus courantes
- mapping manuel si les en-têtes diffèrent
- choix explicite du format de date (`JJ-MM-AAAA` ou `MM-DD-YYYY`, avec `-` ou `/`, année sur 2 ou 4 chiffres)
- correction manuelle des statuts non reconnus avant import
- détection des doublons dans le fichier importé
- mise à jour des candidatures existantes au lieu de créer un doublon si la candidature est déjà présente en base

Les lignes importées sont créées comme candidatures manuelles.

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

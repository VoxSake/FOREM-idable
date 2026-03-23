# DOCAPI

Documentation de l'API externe `FOREM-idable`.

Cette API est destinée aux comptes `coach` et `admin` pour:
- consulter les bénéficiaires, groupes et candidatures visibles dans leur périmètre
- exporter les données vers Excel / Power Query
- modifier les candidatures et notes coach via JSON

## Vue d'ensemble

Base URL production:

```txt
https://forem.brisbois.dev
```

Authentification:

```txt
Authorization: Bearer VOTRE_CLE_API
```

Portée:
- `admin`: accès global
- `coach`: accès limité aux groupes où il est coach et aux bénéficiaires visibles dans ces groupes

Formats:
- `json` par défaut
- `csv` sur les endpoints de liste via `?format=csv`

Important:
- les endpoints de détail et de mutation sont en `json` uniquement
- les exports CSV neutralisent les cellules de type formule pour Excel

## Endpoints

### `GET /api/external/me`

Retourne:
- l'identité du porteur de clé
- les capacités disponibles

### `GET /api/external/applications`

Liste les candidatures visibles.

Filtres supportés:
- `search`
- `userId`
- `groupId`
- `role`
- `status`
- `dueOnly`
- `interviewOnly`
- `updatedAfter`
- `updatedBefore`
- `appliedAfter`
- `appliedBefore`
- `hasPrivateNote`
- `hasSharedNotes`
- `limit`
- `offset`
- `includePrivateNote`
- `includeSharedNotes`
- `includeContributors`
- `format=json|csv`

Recherche `search` sur:
- prénom
- nom
- nom complet
- email
- nom de groupe
- entreprise
- intitulé
- lieu
- notes bénéficiaire
- note privée coach
- notes coach partagées
- auteurs / contributeurs

Exemples:

```txt
/api/external/applications
/api/external/applications?search=durand
/api/external/applications?groupId=5&status=in_progress
/api/external/applications?dueOnly=1&format=csv
/api/external/applications?includePrivateNote=1&includeSharedNotes=1
```

Colonnes principales du CSV:
- `Application ID`
- `User ID`
- `Job ID`
- prénom / nom / email
- groupes
- entreprise / intitulé / lieu
- statut
- dates de suivi
- notes bénéficiaire
- note privée coach
- notes partagées
- contributeurs
- date de mise à jour

### `PUT /api/external/applications`

Upsert candidature par clé métier `userId + jobId`.

Payload:

```json
{
  "match": {
    "userId": 1,
    "jobId": "manual-import-abc"
  },
  "data": {
    "status": "in_progress",
    "appliedAt": "2026-03-23T10:00:00.000Z",
    "notes": "Relancé par mail",
    "job": {
      "title": "Développeur frontend",
      "company": "ACME",
      "location": "Namur",
      "contractType": "CDI",
      "url": "#",
      "source": "forem"
    }
  }
}
```

Réponse:
- `201` si création
- `200` si mise à jour

### `GET /api/external/applications/:applicationId`

Retourne le détail complet d'une candidature:
- identité bénéficiaire
- groupes
- job
- note privée
- notes partagées

### `PATCH /api/external/applications/:applicationId`

Patch de candidature.

Champs usuels:
- `status`
- `notes`
- `proofs`
- `interviewAt`
- `interviewDetails`
- `lastFollowUpAt`
- `followUpDueAt`
- `followUpEnabled`
- `appliedAt`
- `job` pour les candidatures manuelles uniquement

Exemple:

```json
{
  "patch": {
    "status": "follow_up",
    "followUpDueAt": "2026-03-30T10:00:00.000Z",
    "notes": "A rappeler lundi"
  }
}
```

### `DELETE /api/external/applications/:applicationId`

Supprime une candidature visible par le porteur de clé.

### `PUT /api/external/applications/:applicationId/private-note`

Crée ou remplace la note coach privée commune.

Payload:

```json
{
  "content": "Note coach commune"
}
```

### `POST /api/external/applications/:applicationId/shared-notes`

Crée une note coach partagée.

Payload:

```json
{
  "content": "Point à revoir avec le bénéficiaire"
}
```

### `PATCH /api/external/applications/:applicationId/shared-notes/:noteId`

Met à jour une note coach partagée.

### `DELETE /api/external/applications/:applicationId/shared-notes/:noteId`

Supprime une note coach partagée.

## Endpoints utilisateurs et groupes

### `GET /api/external/users`

Liste les utilisateurs visibles.

Filtres principaux:
- `search`
- `groupId`
- `role`
- `includeApplications`
- `limit`
- `offset`
- `format=json|csv`

### `GET /api/external/users/:userId`

Détail d'un utilisateur visible.

Si `format=csv`, exporte les candidatures visibles de cet utilisateur.

### `GET /api/external/groups`

Liste les groupes visibles.

Filtres principaux:
- `search`
- `groupId`
- `includeApplications`
- `limit`
- `offset`
- `format=json|csv`

### `GET /api/external/groups/:groupId`

Détail d'un groupe visible.

Si `format=csv`, exporte les candidatures visibles du groupe.

## Codes de réponse

Réponses courantes:
- `200 OK`
- `201 Created`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `429 Too Many Requests`

## Notes Excel / Power Query

Recommandation:
- utiliser `format=csv` pour les vues tabulaires
- utiliser les endpoints `json` pour les mutations

Workflow typique:
1. Power Query recharge `/api/external/applications?format=csv`
2. Excel affiche et filtre les lignes
3. macro / script appelle les endpoints JSON pour créer ou modifier candidatures et notes

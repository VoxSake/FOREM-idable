# External API

Documentation de l'API externe de FOREM-idable.

Cette API est reservee aux comptes `coach` et `admin` et sert a:
- exporter des donnees vers Excel / Power Query / BI
- lire les groupes, utilisateurs et candidatures visibles
- piloter les candidatures et notes coach via JSON

## Base URL et auth

Production:

```txt
https://forem.brisbois.dev
```

Authentification:

```txt
Authorization: Bearer VOTRE_CLE_API
```

Portee:
- `admin`: acces global
- `coach`: acces limite aux groupes assignes et aux beneficiaires visibles dans ces groupes

Formats:
- `json` par defaut
- `csv` sur les endpoints de liste et certains endpoints de detail export

## Modele de statut

Important: l'API distingue bien:
- le statut metier brut d'une candidature: `in_progress`, `follow_up`, `interview`, `accepted`, `rejected`
- les indicateurs derives

Sur les reponses `applications`, deux champs derives sont exposes:
- `isFollowUpDue`
- `isInterviewScheduled`

CSV:
- headers francais
- valeurs derivees `yes/no`

JSON:
- booleens natifs `true/false`

## Endpoints

### `GET /api/external/me`

Retourne:
- l'identite du porteur de cle
- les capacites de l'API
- les filtres supportes globalement et par endpoint

Usage typique:
- introspection pour un connecteur
- verification des champs derives exposes

### `GET /api/external/applications`

Liste les candidatures visibles dans le perimetre de la cle.

Filtres supportes:
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
- prenom
- nom
- nom complet
- email
- nom de groupe
- entreprise
- intitule
- lieu
- notes beneficiaire
- note privee coach
- notes coach partagees
- auteurs / contributeurs

Exemples:

```txt
/api/external/applications
/api/external/applications?groupId=5&status=in_progress
/api/external/applications?dueOnly=1
/api/external/applications?search=durand&includePrivateNote=1
/api/external/applications?format=csv&includeSharedNotes=1&includeContributors=1
```

Exemple JSON:

```json
{
  "applicationId": 123,
  "userId": 21,
  "userFirstName": "Alice",
  "userLastName": "Durand",
  "groupNames": ["Promo A"],
  "isFollowUpDue": true,
  "isInterviewScheduled": false,
  "application": {
    "status": "in_progress",
    "followUpDueAt": "2026-03-20T09:00:00.000Z",
    "interviewAt": null
  }
}
```

Colonnes principales du CSV:
- `Application ID`
- `User ID`
- `Job ID`
- `Prenom`
- `Nom`
- `Email`
- `Role`
- `Groupes`
- `Entreprise`
- `Intitule`
- `Type`
- `Lieu`
- `Date envoyee`
- `Date relance`
- `Derniere relance`
- `Date entretien`
- `Entretien planifie`
- `Details entretien`
- `Statut`
- `Relance due`
- `Notes beneficiaire`
- `Preuves`
- `Note privee coach`
- `Contributeurs note privee`
- `Nombre notes partagees`
- `Notes coach partagees`
- `Contributeurs notes partagees`
- `Lien`
- `PDF`
- `Mis a jour le`

### `PUT /api/external/applications`

Upsert de candidature par cle metier `userId + jobId`.

Payload minimal:

```json
{
  "match": {
    "userId": 1,
    "jobId": "manual-import-abc"
  },
  "data": {
    "status": "in_progress",
    "appliedAt": "2026-03-23T10:00:00.000Z",
    "job": {
      "title": "Developpeur frontend",
      "company": "ACME",
      "location": "Namur",
      "contractType": "CDI",
      "url": "#",
      "source": "forem"
    }
  }
}
```

Reponse:
- `201` si creation
- `200` si mise a jour

### `GET /api/external/applications/:applicationId`

Retourne le detail complet d'une candidature visible:
- identite beneficiaire
- groupes
- job
- note privee
- notes partagees
- flags derives `isFollowUpDue` et `isInterviewScheduled`

### `PATCH /api/external/applications/:applicationId`

Patch partiel de candidature.

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
- `job` uniquement pour les candidatures manuelles

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

Supprime une candidature visible par le porteur de cle.

### `PUT /api/external/applications/:applicationId/private-note`

Cree ou remplace la note coach privee commune.

Payload:

```json
{
  "content": "Note coach commune"
}
```

### `POST /api/external/applications/:applicationId/shared-notes`

Cree une note coach partagee.

Payload:

```json
{
  "content": "Point a revoir avec le beneficiaire"
}
```

### `PATCH /api/external/applications/:applicationId/shared-notes/:noteId`

Met a jour une note coach partagee.

### `DELETE /api/external/applications/:applicationId/shared-notes/:noteId`

Supprime une note coach partagee.

## Utilisateurs

### `GET /api/external/users`

Liste les utilisateurs visibles.

Filtres supportes:
- `search`
- `groupId`
- `role`
- `includeApplications`
- `limit`
- `offset`
- `format=json|csv`

Important:
- cet endpoint expose des agregats utilisateur comme `dueCount`
- `dueCount` n'est pas un statut candidature
- pour filtrer les candidatures dues, il faut utiliser `/api/external/applications?dueOnly=1`

### `GET /api/external/users/:userId`

Retourne le detail d'un utilisateur visible.

Si `format=csv`, exporte les candidatures visibles de cet utilisateur.

## Groupes

### `GET /api/external/groups`

Liste les groupes visibles.

Filtres supportes:
- `search`
- `groupId`
- `includeApplications`
- `limit`
- `offset`
- `format=json|csv`

### `GET /api/external/groups/:groupId`

Retourne le detail d'un groupe visible.

Si `format=csv`, exporte les candidatures visibles du groupe.

## Codes de reponse

Codes courants:
- `200 OK`
- `201 Created`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `429 Too Many Requests`

## Notes Power Query / Excel

Recommandations:
- utiliser `format=csv` pour les vues tabulaires
- utiliser `json` pour l'automatisation et les mutations
- ne pas inferer `Relance due` depuis `Statut`

Exemple:
- `status=follow_up` cible le statut metier
- `dueOnly=1` cible les candidatures effectivement dues

Workflow typique:
1. Power Query recharge `/api/external/applications?format=csv`
2. Excel filtre et transforme localement
3. un script ou un connecteur appelle les endpoints JSON pour creer ou modifier candidatures et notes

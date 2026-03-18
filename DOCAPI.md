# DOCAPI

Documentation complète de l'API externe `FOREM-idable`, de la génération des clés API, des endpoints disponibles, des paramètres de filtrage, des formats de sortie, et de l'intégration Excel / Power Query.

Cette documentation décrit l'état réellement implémenté dans l'application au moment de sa rédaction.

Note importante:

- la synchronisation calendrier coach via lien ICS n'utilise pas cette API externe Bearer
- elle se gère depuis l'interface `Suivi coach`
- les endpoints de calendrier sont internes au produit et distincts de l'API externe documentée ici

## Vue d'ensemble

L'API externe permet à un compte `coach` ou `admin` d'extraire les données de suivi pour les intégrer ailleurs:

- Excel
- Power Query
- Power BI
- ETL
- scripts internes
- outils no-code

L'API est:

- en lecture seule
- sécurisée par clé API Bearer
- disponible en `JSON` ou `CSV`
- pensée pour l'export global, par groupe, par utilisateur, ou filtré
- capable d'inclure la note privée coach commune et les notes coach partagées sur les candidatures

## Base URL

Production:

```txt
https://forem.brisbois.dev
```

Exemple de base:

```txt
https://forem.brisbois.dev/api/external/me
```

## Qui peut utiliser l'API

Seuls les rôles suivants peuvent générer et utiliser des clés API:

- `coach`
- `admin`

Un `user` standard ne peut pas générer de clé API et ne peut pas appeler l'API externe.

Les clés API donnent accès à l'ensemble des données visibles dans le suivi coach:

- `admin`: accès global à tous les utilisateurs, groupes, candidatures, entretiens et relances
- `coach`: accès limité aux groupes qui lui sont attribués et aux bénéficiaires visibles dans ces groupes
- les exports détaillés peuvent inclure:
  - détails utilisateur
  - note privée coach commune
  - notes coach partagées
  - auteurs / contributeurs des notes partagées

## Modèle de sécurité

### Authentification

Toutes les requêtes se font avec un header HTTP:

```txt
Authorization: Bearer VOTRE_CLE_API
```

### Stockage des clés

Les clés ne sont pas stockées en clair en base:

- seul leur hash est stocké
- la clé complète n'est affichée qu'une seule fois à la création
- chaque clé a:
  - un nom
  - un préfixe visible
  - les 4 derniers caractères
  - une date de création
  - une date d'expiration optionnelle
  - une date de dernière utilisation
  - une date éventuelle de révocation

### Révocation

Une clé révoquée:

- ne fonctionne plus
- renvoie `401 Unauthorized`
- reste visible dans l'interface comme historique

### Expiration

Une clé peut être créée:

- sans expiration
- avec expiration à 30 jours
- avec expiration à 90 jours
- avec expiration à 365 jours

Une clé expirée:

- ne fonctionne plus
- renvoie `401 Unauthorized`
- reste visible dans l'interface

### Type d'accès

L'API externe est strictement:

- read-only
- sans mutation
- sans création ou suppression de données métier

### Scope réel des données

Le périmètre d'une clé API est toujours celui du dashboard coach du porteur:

- un `admin` voit tout
- un `coach` ne voit que les groupes qui lui sont attribués
- les utilisateurs, candidatures, groupes et exports dérivés sont limités à ce même périmètre
- si un bénéficiaire appartient à plusieurs groupes, il est visible par les coachs des groupes auxquels il appartient

## Générer une clé API

### Depuis l'interface

1. Se connecter avec un compte `coach` ou `admin`
2. Ouvrir `Mon compte`
3. Aller à la section `Clés API`
4. Donner un nom à la clé
5. Cliquer sur `Générer une clé`
6. Copier immédiatement la clé affichée

Important:

- la clé complète n'est affichée qu'une seule fois
- si vous la perdez, il faut en créer une nouvelle

### Gestion des clés

Dans `Mon compte`, il est possible de:

- créer plusieurs clés
- choisir une expiration optionnelle
- voir leurs métadonnées
- voir si elles ont déjà été utilisées
- révoquer une clé

## Formats de sortie

Chaque endpoint externe peut répondre dans deux formats:

- `json` par défaut
- `csv` via `?format=csv`

Exemples:

```txt
/api/external/users
/api/external/users?format=csv
```

## Paramètres communs

Plusieurs endpoints utilisent les mêmes filtres.

### `search`

Recherche plein texte sur:

- prénom
- nom
- nom complet
- email

Selon l'endpoint, la recherche peut aussi porter sur:

- nom de groupe
- entreprise
- intitulé d'offre
- lieu

Exemple:

```txt
?search=jordi
```

### `format`

Valeurs:

- `json`
- `csv`

Exemple:

```txt
?format=csv
```

### `limit`

Nombre maximum de lignes retournées.

Bornes appliquées côté serveur:

- minimum: `1`
- maximum: `500`

Valeurs par défaut:

- `users`: `200`
- `groups`: `200`
- `applications`: `500`

Exemple:

```txt
?limit=100
```

### `offset`

Décalage de pagination.

Exemple:

```txt
?limit=100&offset=200
```

### `groupId`

Filtre sur un groupe précis.

Exemple:

```txt
?groupId=5
```

### `userId`

Filtre sur un utilisateur précis.

Exemple:

```txt
?userId=42
```

### `role`

Valeurs possibles:

- `user`
- `coach`
- `admin`

Exemple:

```txt
?role=user
```

### `includeApplications`

Booléen:

- `1`
- `true`

Permet d'inclure les candidatures directement dans certaines réponses `users` ou `groups`.

Exemple:

```txt
?includeApplications=1
```

### Paramètres spécifiques aux candidatures

#### `status`

Valeurs possibles:

- `in_progress`
- `follow_up`
- `interview`
- `accepted`
- `rejected`

Exemple:

```txt
?status=interview
```

#### `dueOnly`

Retourne uniquement les candidatures avec relance due.

Valeurs:

- `1`
- `true`

Exemple:

```txt
?dueOnly=1
```

#### `interviewOnly`

Retourne uniquement les candidatures en entretien.

Valeurs:

- `1`
- `true`

Exemple:

```txt
?interviewOnly=1
```

#### `updatedAfter`

Filtre sur `application.updatedAt >= updatedAfter`.

Exemple:

```txt
?updatedAfter=2026-03-01T00:00:00.000Z
```

#### `updatedBefore`

Filtre sur `application.updatedAt <= updatedBefore`.

Exemple:

```txt
?updatedBefore=2026-03-31T23:59:59.999Z
```

## Règle de construction d'URL

Une URL ne peut contenir qu'un seul `?`.

Le premier paramètre utilise `?`, tous les suivants utilisent `&`.

Correct:

```txt
/api/external/applications?search=jordi&format=csv
```

Incorrect:

```txt
/api/external/applications?format=csv?search=jordi
```

## Endpoints

### 1. `GET /api/external/me`

Retourne:

- l'identité du porteur de clé
- les capacités disponibles

#### Exemple

```http
GET /api/external/me
Authorization: Bearer VOTRE_CLE_API
```

#### Réponse JSON type

```json
{
  "actor": {
    "id": 1,
    "email": "coach@example.com",
    "firstName": "Jordi",
    "lastName": "Brisbois",
    "role": "admin"
  },
  "capabilities": {
    "formats": ["json", "csv"],
    "searchFields": ["firstName", "lastName", "fullName", "email"],
    "filters": [
      "search",
      "groupId",
      "userId",
      "role",
      "status",
      "dueOnly",
      "interviewOnly",
      "updatedAfter",
      "updatedBefore",
      "limit",
      "offset",
      "includeApplications"
    ],
    "scope": {
      "visibility": "assigned_groups",
      "description": "Accès limité aux groupes attribués au coach et aux bénéficiaires visibles dans ces groupes."
    }
  }
}
```

#### Cas d'usage

- tester la clé API
- vérifier le rôle courant
- afficher les capacités côté intégration

### 2. `GET /api/external/users`

Retourne la liste des utilisateurs suivis.

#### Paramètres utiles

- `search`
- `groupId`
- `userId`
- `role`
- `includeApplications`
- `limit`
- `offset`
- `format`

#### Exemples

```txt
/api/external/users
/api/external/users?search=jordi
/api/external/users?role=user
/api/external/users?groupId=5
/api/external/users?includeApplications=1
/api/external/users?format=csv
```

#### Réponse JSON

```json
{
  "actor": {},
  "stats": {
    "userCount": 20,
    "groupCount": 4,
    "applicationCount": 380,
    "interviewCount": 12,
    "dueCount": 27
  },
  "users": [
    {
      "id": 42,
      "email": "jordi@example.com",
      "firstName": "Jordi",
      "lastName": "Brisbois",
      "fullName": "Jordi Brisbois",
      "role": "admin",
      "groupIds": [1, 5],
      "groupNames": ["Promo A", "Promo B"],
      "applicationCount": 15,
      "interviewCount": 2,
      "dueCount": 1,
      "acceptedCount": 0,
      "rejectedCount": 3,
      "inProgressCount": 6,
      "latestActivityAt": "2026-03-12T12:00:00.000Z"
    }
  ]
}
```

#### CSV

Colonnes:

- `ID`
- `Prénom`
- `Nom`
- `Email`
- `Rôle`
- `Groupes`
- `Candidatures`
- `Entretiens`
- `Relances dues`
- `Acceptées`
- `Refusées`
- `En cours`
- `Dernière activité`

### 3. `GET /api/external/users/:userId`

Retourne le détail complet d'un utilisateur.

#### JSON

Inclut:

- profil utilisateur
- groupes
- stats
- candidatures

Les candidatures détaillées peuvent inclure aussi:

- `privateCoachNote`
- `sharedCoachNotes`

#### Exemples

```txt
/api/external/users/42
/api/external/users/42?format=csv
```

#### CSV

Quand `format=csv`, retourne les candidatures de cet utilisateur.

#### Cas d'usage

- extraire le suivi complet d'un élève
- intégrer un utilisateur précis dans Excel
- auditer ses candidatures

### 4. `GET /api/external/groups`

Retourne la liste des groupes.

#### Paramètres utiles

- `search`
- `groupId`
- `includeApplications`
- `limit`
- `offset`
- `format`

#### Exemples

```txt
/api/external/groups
/api/external/groups?search=promo
/api/external/groups?groupId=5
/api/external/groups?includeApplications=1
/api/external/groups?format=csv
```

#### Réponse JSON

Chaque groupe contient:

- id
- nom
- date de création
- créateur
- `managerCoachId`
- `manager`
- nombre de coachs attribués
- liste des coachs attribués
- nombre de membres
- nombre de candidatures
- nombre d'entretiens
- membres si `includeApplications=1`

Le manager d'un groupe est toujours un `coach` déjà attribué à ce groupe.

#### Exemple JSON

```json
{
  "actor": {},
  "stats": {
    "userCount": 12,
    "groupCount": 3,
    "applicationCount": 90,
    "interviewCount": 7,
    "dueCount": 11
  },
  "groups": [
    {
      "id": 5,
      "name": "Promo A",
      "createdAt": "2026-03-16T08:00:00.000Z",
      "createdBy": {
        "id": 2,
        "email": "admin@example.com"
      },
      "managerCoachId": 11,
      "manager": {
        "id": 11,
        "email": "coach@example.com",
        "firstName": "Jordi",
        "lastName": "Brisbois",
        "fullName": "Jordi Brisbois",
        "role": "coach",
        "isManager": true
      },
      "coachCount": 2,
      "coaches": [
        {
          "id": 11,
          "email": "coach@example.com",
          "firstName": "Jordi",
          "lastName": "Brisbois",
          "fullName": "Jordi Brisbois",
          "role": "coach",
          "isManager": true
        },
        {
          "id": 14,
          "email": "coach2@example.com",
          "firstName": "Alex",
          "lastName": "Martin",
          "fullName": "Alex Martin",
          "role": "coach",
          "isManager": false
        }
      ],
      "memberCount": 4,
      "totalApplications": 18,
      "totalInterviews": 3
    }
  ]
}
```

#### CSV

Colonnes:

- `ID groupe`
- `Nom groupe`
- `Créé le`
- `Créé par`
- `Manager`
- `Nombre de coachs`
- `Coachs attribués`
- `Membres`
- `Candidatures`
- `Entretiens`

### 5. `GET /api/external/groups/:groupId`

Retourne le détail d'un groupe.

#### JSON

Inclut:

- métadonnées du groupe
- manager du groupe
- coachs attribués au groupe
- membres
- candidatures des membres

Les candidatures embarquées peuvent inclure aussi:

- `privateCoachNote`
- `sharedCoachNotes`

#### CSV

Quand `format=csv`, retourne toutes les candidatures du groupe.

#### Exemples

```txt
/api/external/groups/5
/api/external/groups/5?format=csv
```

### 6. `GET /api/external/applications`

Endpoint principal d'export métier.

Retourne la liste des candidatures visibles.

#### Paramètres supportés

- `search`
- `groupId`
- `userId`
- `role`
- `status`
- `dueOnly`
- `interviewOnly`
- `updatedAfter`
- `updatedBefore`
- `limit`
- `offset`
- `format`

#### Exemples

```txt
/api/external/applications
/api/external/applications?search=jordi
/api/external/applications?userId=42
/api/external/applications?groupId=5
/api/external/applications?status=interview
/api/external/applications?dueOnly=1
/api/external/applications?interviewOnly=1
/api/external/applications?updatedAfter=2026-03-01T00:00:00.000Z
/api/external/applications?format=csv
```

#### Réponse JSON

Chaque ligne contient:

- identité utilisateur
- rôle utilisateur
- groupes
- candidature complète

La candidature complète peut inclure aussi:

- `privateCoachNote`
- `sharedCoachNotes`

#### CSV

Colonnes:

- `User ID`
- `Prénom`
- `Nom`
- `Email`
- `Rôle`
- `Groupes`
- `Entreprise`
- `Intitulé`
- `Type`
- `Lieu`
- `Date envoyée`
- `Date relance`
- `Dernière relance`
- `Date entretien`
- `Détails entretien`
- `Statut`
- `Notes`
- `Preuves`
- `Note privée coach`
- `Contributeurs note privée`
- `Notes coach partagées`
- `Contributeurs notes partagées`
- `Lien`
- `PDF`
- `Mis à jour le`

## Exemples Postman

### Header commun

```txt
Authorization: Bearer VOTRE_CLE_API
```

### Tester la clé

```http
GET https://forem.brisbois.dev/api/external/me
```

### Exporter tous les users en CSV

```http
GET https://forem.brisbois.dev/api/external/users?format=csv
```

### Exporter les candidatures d'un user par recherche

```http
GET https://forem.brisbois.dev/api/external/applications?search=jordi&format=csv
```

### Exporter les candidatures d'un user par id

```http
GET https://forem.brisbois.dev/api/external/users/42?format=csv
```

### Exporter les candidatures d'un groupe

```http
GET https://forem.brisbois.dev/api/external/groups/5?format=csv
```

### Exporter les entretiens uniquement

```http
GET https://forem.brisbois.dev/api/external/applications?status=interview&format=csv
```

### Exporter les relances dues

```http
GET https://forem.brisbois.dev/api/external/applications?dueOnly=1&format=csv
```

## Codes de réponse

### `200 OK`

La requête a réussi.

### `400 Bad Request`

Paramètre invalide:

- `userId` invalide
- `groupId` invalide
- paramètre mal formé

### `401 Unauthorized`

Cas possibles:

- header `Authorization` absent
- clé invalide
- clé révoquée
- clé d'un compte sans rôle autorisé

### `404 Not Found`

Cas possibles:

- utilisateur introuvable
- groupe introuvable

### `500 Internal Server Error`

Erreur serveur.

## Bonnes pratiques d'intégration

### Recommandations

- stocker la clé API dans un emplacement sécurisé
- créer une clé par usage
- donner des noms explicites aux clés
- préférer une clé avec expiration si l'usage est temporaire
- révoquer les clés non utilisées
- préférer `csv` pour Excel simple
- préférer `json` pour ETL, scripts ou intégration avancée

### Recommandations de pagination

Pour de gros exports:

- utiliser `limit`
- utiliser `offset`

Exemple:

```txt
/api/external/applications?limit=500&offset=0
/api/external/applications?limit=500&offset=500
```

### Recommandations de filtrage

Pour éviter de charger trop de données:

- filtrez par `groupId`
- filtrez par `userId`
- filtrez par `status`
- filtrez par `updatedAfter`

## Documentation Power Query

## Pourquoi Power Query

Pour Excel, `Power Query` est préférable à une macro VBA dans la majorité des cas:

- plus simple à maintenir
- rafraîchissement intégré
- pas besoin d'écrire de VBA
- support natif du web et du CSV

## Méthode recommandée

Ne pas utiliser la petite boîte `À partir du Web` simple si vous devez envoyer un header `Authorization`.

Utiliser:

1. `Données`
2. `Obtenir des données`
3. `À partir d'autres sources`
4. `Requête vide`
5. `Éditeur avancé`

## Exemple Power Query minimal pour les candidatures

```powerquery
let
    Url = "https://forem.brisbois.dev/api/external/applications?format=csv",
    Source = Web.Contents(
        Url,
        [
            Headers = [
                Authorization = "Bearer TA_CLE_API"
            ]
        ]
    ),
    CsvData = Csv.Document(
        Source,
        [
            Delimiter = ",",
            Encoding = 65001,
            QuoteStyle = QuoteStyle.Csv
        ]
    ),
    PromotedHeaders = Table.PromoteHeaders(CsvData, [PromoteAllScalars = true])
in
    PromotedHeaders
```

## Exemple Power Query avec recherche

```powerquery
let
    Url = "https://forem.brisbois.dev/api/external/applications?search=jordi&format=csv",
    Source = Web.Contents(
        Url,
        [
            Headers = [
                Authorization = "Bearer TA_CLE_API"
            ]
        ]
    ),
    CsvData = Csv.Document(
        Source,
        [
            Delimiter = ",",
            Encoding = 65001,
            QuoteStyle = QuoteStyle.Csv
        ]
    ),
    PromotedHeaders = Table.PromoteHeaders(CsvData, [PromoteAllScalars = true])
in
    PromotedHeaders
```

## Exemple Power Query pour un groupe

```powerquery
let
    Url = "https://forem.brisbois.dev/api/external/groups/5?format=csv",
    Source = Web.Contents(
        Url,
        [
            Headers = [
                Authorization = "Bearer TA_CLE_API"
            ]
        ]
    ),
    CsvData = Csv.Document(
        Source,
        [
            Delimiter = ",",
            Encoding = 65001,
            QuoteStyle = QuoteStyle.Csv
        ]
    ),
    PromotedHeaders = Table.PromoteHeaders(CsvData, [PromoteAllScalars = true])
in
    PromotedHeaders
```

## Exemple Power Query pour un utilisateur précis

```powerquery
let
    Url = "https://forem.brisbois.dev/api/external/users/42?format=csv",
    Source = Web.Contents(
        Url,
        [
            Headers = [
                Authorization = "Bearer TA_CLE_API"
            ]
        ]
    ),
    CsvData = Csv.Document(
        Source,
        [
            Delimiter = ",",
            Encoding = 65001,
            QuoteStyle = QuoteStyle.Csv
        ]
    ),
    PromotedHeaders = Table.PromoteHeaders(CsvData, [PromoteAllScalars = true])
in
    PromotedHeaders
```

## Exemple Power Query avec paramètres Excel

Très utile pour éviter d'écrire la clé API ou la recherche en dur dans le script.

### Préparation dans Excel

Créer une feuille `Config` avec:

- cellule `B1`: clé API
- cellule `B2`: texte de recherche
- cellule `B3`: base URL

Exemple:

- `B1` = `frm_live_...`
- `B2` = `jordi`
- `B3` = `https://forem.brisbois.dev`

Nommer les cellules:

- `ApiKey`
- `SearchText`
- `BaseUrl`

### Script Power Query

```powerquery
let
    ApiKey = Excel.CurrentWorkbook(){[Name="ApiKey"]}[Content]{0}[Column1],
    SearchText = Excel.CurrentWorkbook(){[Name="SearchText"]}[Content]{0}[Column1],
    BaseUrl = Excel.CurrentWorkbook(){[Name="BaseUrl"]}[Content]{0}[Column1],
    Url = BaseUrl & "/api/external/applications?search=" & Uri.EscapeDataString(Text.From(SearchText)) & "&format=csv",
    Source = Web.Contents(
        Url,
        [
            Headers = [
                Authorization = "Bearer " & Text.From(ApiKey)
            ]
        ]
    ),
    CsvData = Csv.Document(
        Source,
        [
            Delimiter = ",",
            Encoding = 65001,
            QuoteStyle = QuoteStyle.Csv
        ]
    ),
    PromotedHeaders = Table.PromoteHeaders(CsvData, [PromoteAllScalars = true])
in
    PromotedHeaders
```

## Exemple Power Query avec paramètres avancés

```powerquery
let
    ApiKey = Excel.CurrentWorkbook(){[Name="ApiKey"]}[Content]{0}[Column1],
    BaseUrl = Excel.CurrentWorkbook(){[Name="BaseUrl"]}[Content]{0}[Column1],
    GroupId = Excel.CurrentWorkbook(){[Name="GroupId"]}[Content]{0}[Column1],
    Status = Excel.CurrentWorkbook(){[Name="Status"]}[Content]{0}[Column1],
    Url =
        BaseUrl &
        "/api/external/applications?groupId=" & Text.From(GroupId) &
        "&status=" & Uri.EscapeDataString(Text.From(Status)) &
        "&format=csv",
    Source = Web.Contents(
        Url,
        [
            Headers = [
                Authorization = "Bearer " & Text.From(ApiKey)
            ]
        ]
    ),
    CsvData = Csv.Document(Source, [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    PromotedHeaders = Table.PromoteHeaders(CsvData, [PromoteAllScalars = true])
in
    PromotedHeaders
```

## Actualisation

Une fois la requête chargée dans Excel:

- `Données`
- `Actualiser tout`

La requête rappellera l'API avec la même clé et les mêmes paramètres.

## Conseils Excel

- utiliser `csv` pour les exports tabulaires
- utiliser une requête par besoin métier
- séparer:
  - une requête `users`
  - une requête `groups`
  - une requête `applications`
- stocker la clé dans une cellule nommée plutôt qu'en dur

## Dépannage Power Query

### Erreur `401 Unauthorized`

Vérifier:

- le header `Authorization`
- le format `Bearer VOTRE_CLE`
- que la clé n'est pas révoquée
- qu'il n'y a pas d'espace parasite

### Aucun résultat

Vérifier:

- les filtres `search`
- `groupId`
- `userId`
- `status`

### URL mal formée

Rappel:

- un seul `?`
- tous les autres paramètres avec `&`

Correct:

```txt
.../api/external/applications?search=jordi&format=csv
```

Incorrect:

```txt
.../api/external/applications?format=csv?search=jordi
```

### Problème d'encodage

Le CSV est servi en UTF-8 avec BOM pour Excel.

Les cellules CSV sont neutralisées côté serveur pour éviter qu'Excel interprète des valeurs en formule quand elles commencent par:

- `=`
- `+`
- `-`
- `@`

Dans Power Query, utiliser:

- `Encoding = 65001`

## Exemples d'usages concrets

### Suivi d'un élève

```txt
/api/external/users/42?format=csv
```

### Pipeline Excel de tous les entretiens

```txt
/api/external/applications?status=interview&format=csv
```

### Dashboard des relances dues

```txt
/api/external/applications?dueOnly=1&format=csv
```

### Export d'un groupe complet

```txt
/api/external/groups/5?format=csv
```

### Liste des users d'un groupe

```txt
/api/external/users?groupId=5&format=csv
```

## Limites actuelles

L'API actuelle:

- ne permet pas d'écrire des données
- ne permet pas de permissions fines par clé
- ne limite pas encore par IP
- ne fournit pas encore d'endpoint stats dédié séparé
- ne fait pas encore de rate limiting

Pour l'instant, la philosophie est:

- simple
- robuste
- sécurisée
- exploitable rapidement dans Excel

## Résumé rapide

Pour Excel / Power Query, les endpoints les plus utiles sont:

- tous les users:

```txt
https://forem.brisbois.dev/api/external/users?format=csv
```

- toutes les candidatures:

```txt
https://forem.brisbois.dev/api/external/applications?format=csv
```

- candidatures d'un user:

```txt
https://forem.brisbois.dev/api/external/users/42?format=csv
```

- candidatures d'un groupe:

```txt
https://forem.brisbois.dev/api/external/groups/5?format=csv
```

Toujours avec le header:

```txt
Authorization: Bearer VOTRE_CLE_API
```

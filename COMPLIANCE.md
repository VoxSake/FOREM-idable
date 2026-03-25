# Compliance Notes

Cette note documente le périmètre de la phase 1 conformité implémentée dans le projet.

## Couverture actuelle

- export JSON des données utilisateur depuis `Mon compte`
- demande de suppression de compte avec revue manuelle
- `legal holds` administratifs pour geler une suppression ou une purge
- journalisation des divulgations administratives
- purge minimale via `npm run maintenance:purge`

## Rétention minimale

- `sessions`: suppression des sessions expirées
- `password_reset_tokens`: suppression des jetons expirés ou utilisés au-delà de la fenêtre de rétention
- `user_search_history`: purge basée sur l'ancienneté
- `data_export_requests`: purge des exports expirés

Variables d'environnement optionnelles:

- `PASSWORD_RESET_RETENTION_DAYS`
- `SEARCH_HISTORY_RETENTION_DAYS`
- `DATA_EXPORT_RETENTION_DAYS`

## Principes

- pas d'accès direct à la base pour une demande d'autorité
- export ciblé et journalisé plutôt qu'extraction ad hoc
- suppression utilisateur bloquée si un `legal hold` actif existe
- conservation minimale et purge planifiée des données temporaires

## Hors périmètre de cette phase

- centre admin complet de gestion conformité
- purge automatique des messages
- workflow juridique complet ou validation par conseil externe
- chiffrement applicatif spécifique des messages

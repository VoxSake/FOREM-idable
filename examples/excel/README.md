# Excel Coach Template

Ce dossier contient un modele de classeur Excel pour un compte `coach`.

Contenu:

- `coach-api-template.xlsx`: classeur vide structure pour groupes, beneficiaires, candidatures et dashboard
- `power-query/*.pq`: scripts Power Query a coller dans Excel
- `vba/CoachApiTools.bas`: module VBA pret a importer dans un `.xlsm`

Limite assumee:

- le classeur `.xlsx` est genere hors Excel Desktop
- les objets Power Query et boutons natifs ne sont donc pas embarques automatiquement
- la methode prevue est: ouvrir le classeur, renseigner `Config`, puis importer les scripts `.pq`

Workflow recommande:

1. Ouvrir `coach-api-template.xlsx`
2. Renseigner `Config!B2` avec la cle API Bearer du coach
3. Ajuster `Config!B4` pour le groupe cible
4. Dans Excel: `Donnees > Obtenir des donnees > A partir d'autres sources > Requete vide`
5. Ouvrir l'editeur avance et coller un script `.pq`
6. Charger la requete dans la feuille cible
7. Utiliser `Actualiser tout`
8. Optionnel: importer `vba/CoachApiTools.bas`, enregistrer en `.xlsm`, puis affecter les macros a des boutons

Requetes fournies:

- `coach_groups.pq`: liste des groupes visibles par le coach
- `coach_users_by_group.pq`: beneficiaires du groupe choisi
- `coach_applications_by_group.pq`: candidatures du groupe choisi
- `coach_interviews_by_group.pq`: uniquement les candidatures en entretien
- `coach_due_followups_by_group.pq`: uniquement les candidatures avec relance due
- `coach_applications_search.pq`: recherche libre sur le portefeuille du coach

Macros fournies:

- `RefreshCoachWorkbook`: lance `RefreshAll`
- `GoToDashboard`: ouvre `Dashboard`
- `GoToApplications`: ouvre `Applications`
- `GoToBeneficiaires`: ouvre `Beneficiaires`

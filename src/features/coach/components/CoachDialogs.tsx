"use client";

import { ApiKeySummary } from "@/types/externalApi";
import { UserPickerDialog } from "@/components/coach/UserPickerDialog";
import { CoachApiKeysDialog } from "@/features/coach/components/dialogs/CoachApiKeysDialog";
import { CoachConfirmationDialog } from "@/features/coach/components/dialogs/CoachConfirmationDialog";
import { CoachCreateGroupDialog } from "@/features/coach/components/dialogs/CoachCreateGroupDialog";
import { CoachEditUserDialog } from "@/features/coach/components/dialogs/CoachEditUserDialog";
import {
  CoachApiKeysTarget,
  CoachCalendarRegenerationTarget,
  CoachDeleteUserTarget,
  CoachEditTarget,
  CoachManagerPickerGroup,
  CoachMemberPickerGroup,
  CoachRevokeApiKeyTarget,
  CoachRemoveGroupTarget,
  CoachRemoveCoachTarget,
  CoachRemoveMembershipTarget,
} from "@/features/coach/types";
import { CoachUserSummary } from "@/types/coach";

interface CoachDialogsProps {
  groupName: string;
  onGroupNameChange: (value: string) => void;
  isCreateGroupOpen: boolean;
  onCreateGroupOpenChange: (open: boolean) => void;
  onCreateGroup: () => void;
  memberPickerGroup: CoachMemberPickerGroup | null;
  assignableUsers: CoachUserSummary[];
  onMemberPickerOpenChange: (open: boolean) => void;
  onMemberSelect: (userId: number) => void;
  coachPickerGroup: CoachMemberPickerGroup | null;
  assignableCoaches: CoachMemberPickerGroup["coaches"];
  onCoachPickerOpenChange: (open: boolean) => void;
  onCoachSelect: (userId: number) => void;
  managerPickerGroup: CoachManagerPickerGroup | null;
  assignableManagers: CoachManagerPickerGroup["coaches"];
  onManagerPickerOpenChange: (open: boolean) => void;
  onManagerSelect: (userId: number) => void;
  removeMembership: CoachRemoveMembershipTarget | null;
  onRemoveMembershipOpenChange: (open: boolean) => void;
  onConfirmRemoveMembership: () => void;
  removeCoach: CoachRemoveCoachTarget | null;
  onRemoveCoachOpenChange: (open: boolean) => void;
  onConfirmRemoveCoach: () => void;
  removeGroup: CoachRemoveGroupTarget | null;
  onRemoveGroupOpenChange: (open: boolean) => void;
  onConfirmRemoveGroup: () => void;
  editTarget: CoachEditTarget | null;
  editedFirstName: string;
  editedLastName: string;
  newPassword: string;
  confirmNewPassword: string;
  onEditedFirstNameChange: (value: string) => void;
  onEditedLastNameChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmNewPasswordChange: (value: string) => void;
  onEditOpenChange: (open: boolean) => void;
  onConfirmEdit: () => void;
  apiKeysTarget: CoachApiKeysTarget | null;
  apiKeys: ApiKeySummary[];
  apiKeysFeedback: string | null;
  isApiKeysLoading: boolean;
  onApiKeysOpenChange: (open: boolean) => void;
  onRequestRevokeApiKey: (key: ApiKeySummary) => void;
  revokeApiKeyTarget: CoachRevokeApiKeyTarget | null;
  onRevokeApiKeyOpenChange: (open: boolean) => void;
  onConfirmRevokeApiKey: () => void;
  deleteUserTarget: CoachDeleteUserTarget | null;
  isDeletingUser: boolean;
  onDeleteUserOpenChange: (open: boolean) => void;
  onConfirmDeleteUser: () => void;
  calendarRegenerationTarget: CoachCalendarRegenerationTarget | null;
  onCalendarRegenerationOpenChange: (open: boolean) => void;
  onConfirmCalendarRegeneration: () => void;
}

export function CoachDialogs({
  groupName,
  onGroupNameChange,
  isCreateGroupOpen,
  onCreateGroupOpenChange,
  onCreateGroup,
  memberPickerGroup,
  assignableUsers,
  onMemberPickerOpenChange,
  onMemberSelect,
  coachPickerGroup,
  assignableCoaches,
  onCoachPickerOpenChange,
  onCoachSelect,
  managerPickerGroup,
  assignableManagers,
  onManagerPickerOpenChange,
  onManagerSelect,
  removeMembership,
  onRemoveMembershipOpenChange,
  onConfirmRemoveMembership,
  removeCoach,
  onRemoveCoachOpenChange,
  onConfirmRemoveCoach,
  removeGroup,
  onRemoveGroupOpenChange,
  onConfirmRemoveGroup,
  editTarget,
  editedFirstName,
  editedLastName,
  newPassword,
  confirmNewPassword,
  onEditedFirstNameChange,
  onEditedLastNameChange,
  onNewPasswordChange,
  onConfirmNewPasswordChange,
  onEditOpenChange,
  onConfirmEdit,
  apiKeysTarget,
  apiKeys,
  apiKeysFeedback,
  isApiKeysLoading,
  onApiKeysOpenChange,
  onRequestRevokeApiKey,
  revokeApiKeyTarget,
  onRevokeApiKeyOpenChange,
  onConfirmRevokeApiKey,
  deleteUserTarget,
  isDeletingUser,
  onDeleteUserOpenChange,
  onConfirmDeleteUser,
  calendarRegenerationTarget,
  onCalendarRegenerationOpenChange,
  onConfirmCalendarRegeneration,
}: CoachDialogsProps) {
  return (
    <>
      <CoachCreateGroupDialog
        open={isCreateGroupOpen}
        groupName={groupName}
        onOpenChange={onCreateGroupOpenChange}
        onGroupNameChange={onGroupNameChange}
        onCreateGroup={onCreateGroup}
      />

      <UserPickerDialog
        open={Boolean(memberPickerGroup)}
        onOpenChange={onMemberPickerOpenChange}
        title={memberPickerGroup ? `Ajouter une personne à ${memberPickerGroup.name}` : "Ajouter une personne"}
        description="Recherche dynamique parmi toutes les personnes disponibles."
        users={assignableUsers}
        onSelect={(entry) => onMemberSelect(entry.id)}
      />

      <UserPickerDialog
        open={Boolean(coachPickerGroup)}
        onOpenChange={onCoachPickerOpenChange}
        title={coachPickerGroup ? `Attribuer un coach à ${coachPickerGroup.name}` : "Attribuer un coach"}
        description="Recherche parmi les comptes coach disponibles."
        users={assignableCoaches}
        onSelect={(entry) => onCoachSelect(entry.id)}
      />

      <UserPickerDialog
        open={Boolean(managerPickerGroup)}
        onOpenChange={onManagerPickerOpenChange}
        title={managerPickerGroup ? `Définir le manager de ${managerPickerGroup.name}` : "Définir le manager"}
        description="Le manager doit être un coach déjà attribué à ce groupe."
        users={assignableManagers}
        onSelect={(entry) => onManagerSelect(entry.id)}
      />

      <CoachConfirmationDialog
        open={Boolean(removeMembership)}
        title="Retirer du groupe ?"
        description={
          removeMembership
            ? `${removeMembership.userEmail} sera retiré de ${removeMembership.groupName}.`
            : "Cet utilisateur sera retiré du groupe."
        }
        confirmLabel="Retirer"
        onOpenChange={onRemoveMembershipOpenChange}
        onConfirm={onConfirmRemoveMembership}
      />

      <CoachConfirmationDialog
        open={Boolean(removeCoach)}
        title="Retirer ce coach du groupe ?"
        description={
          removeCoach
            ? `${removeCoach.userEmail} ne sera plus attribué à ${removeCoach.groupName}.`
            : "Ce coach ne sera plus attribué au groupe."
        }
        confirmLabel="Retirer"
        onOpenChange={onRemoveCoachOpenChange}
        onConfirm={onConfirmRemoveCoach}
      />

      <CoachConfirmationDialog
        open={Boolean(removeGroup)}
        title="Supprimer ce groupe ?"
        description={
          removeGroup
            ? `Le groupe ${removeGroup.groupName} sera supprimé avec ses affectations.`
            : "Le groupe sera supprimé."
        }
        confirmLabel="Supprimer"
        onOpenChange={onRemoveGroupOpenChange}
        onConfirm={onConfirmRemoveGroup}
      />

      <CoachEditUserDialog
        editTarget={editTarget}
        editedFirstName={editedFirstName}
        editedLastName={editedLastName}
        newPassword={newPassword}
        confirmNewPassword={confirmNewPassword}
        onEditedFirstNameChange={onEditedFirstNameChange}
        onEditedLastNameChange={onEditedLastNameChange}
        onNewPasswordChange={onNewPasswordChange}
        onConfirmNewPasswordChange={onConfirmNewPasswordChange}
        onOpenChange={onEditOpenChange}
        onConfirm={onConfirmEdit}
      />

      <CoachApiKeysDialog
        apiKeysTarget={apiKeysTarget}
        apiKeys={apiKeys}
        apiKeysFeedback={apiKeysFeedback}
        isApiKeysLoading={isApiKeysLoading}
        onOpenChange={onApiKeysOpenChange}
        onRequestRevokeApiKey={onRequestRevokeApiKey}
      />

      <CoachConfirmationDialog
        open={Boolean(revokeApiKeyTarget)}
        title="Révoquer cette clé API ?"
        description={
          revokeApiKeyTarget
            ? `La clé ${revokeApiKeyTarget.keyName} de ${revokeApiKeyTarget.email} sera révoquée.`
            : "La clé API sera révoquée."
        }
        confirmLabel="Révoquer"
        onOpenChange={onRevokeApiKeyOpenChange}
        onConfirm={onConfirmRevokeApiKey}
      />

      <CoachConfirmationDialog
        open={Boolean(deleteUserTarget)}
        title="Supprimer ce compte ?"
        description={
          deleteUserTarget
            ? `Le compte ${deleteUserTarget.email} et ses données seront supprimés.`
            : "Le compte et ses données seront supprimés."
        }
        confirmLabel="Supprimer"
        onOpenChange={onDeleteUserOpenChange}
        onConfirm={onConfirmDeleteUser}
        isPending={isDeletingUser}
      />

      <CoachConfirmationDialog
        open={Boolean(calendarRegenerationTarget)}
        title="Régénérer ce lien calendrier ?"
        description={
          calendarRegenerationTarget
            ? `L'ancien lien sera invalidé pour ${calendarRegenerationTarget.label}. Les abonnements Google Calendar existants devront être recréés avec la nouvelle URL.`
            : "Le lien calendrier actuel sera invalidé et remplacé."
        }
        confirmLabel="Régénérer"
        onOpenChange={onCalendarRegenerationOpenChange}
        onConfirm={onConfirmCalendarRegeneration}
      />
    </>
  );
}

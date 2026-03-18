"use client";

import { ApiKeySummary } from "@/types/externalApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserPickerDialog } from "@/components/coach/UserPickerDialog";
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
import { formatCoachDate } from "@/features/coach/utils";
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
      <Dialog open={isCreateGroupOpen} onOpenChange={onCreateGroupOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un groupe</DialogTitle>
            <DialogDescription>
              Les admins verront toujours le groupe. Un coach créateur y sera attribué automatiquement.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={groupName}
            onChange={(event) => onGroupNameChange(event.target.value)}
            placeholder="Nom du groupe"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onCreateGroupOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={onCreateGroup} disabled={!groupName.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={Boolean(removeMembership)} onOpenChange={onRemoveMembershipOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Retirer du groupe ?</DialogTitle>
            <DialogDescription>
              {removeMembership
                ? `${removeMembership.userEmail} sera retiré de ${removeMembership.groupName}.`
                : "Cet utilisateur sera retiré du groupe."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onRemoveMembershipOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirmRemoveMembership}>
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removeCoach)} onOpenChange={onRemoveCoachOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Retirer ce coach du groupe ?</DialogTitle>
            <DialogDescription>
              {removeCoach
                ? `${removeCoach.userEmail} ne sera plus attribué à ${removeCoach.groupName}.`
                : "Ce coach ne sera plus attribué au groupe."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onRemoveCoachOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirmRemoveCoach}>
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removeGroup)} onOpenChange={onRemoveGroupOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce groupe ?</DialogTitle>
            <DialogDescription>
              {removeGroup
                ? `Le groupe ${removeGroup.groupName} sera supprimé avec ses affectations.`
                : "Le groupe sera supprimé."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onRemoveGroupOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirmRemoveGroup}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editTarget)} onOpenChange={onEditOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Éditer l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              {editTarget
                ? `Mettre à jour le profil de ${editTarget.email}. Le mot de passe est optionnel.`
                : "Mettre à jour le profil utilisateur."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={editedFirstName}
              onChange={(event) => onEditedFirstNameChange(event.target.value)}
              placeholder="Prénom"
            />
            <Input
              value={editedLastName}
              onChange={(event) => onEditedLastNameChange(event.target.value)}
              placeholder="Nom"
            />
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="mb-3 text-sm font-medium text-foreground">Mot de passe</p>
            <div className="space-y-3">
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => onNewPasswordChange(event.target.value)}
                placeholder="Laisser vide pour ne pas changer"
              />
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(event) => onConfirmNewPasswordChange(event.target.value)}
                placeholder="Confirmer le mot de passe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onEditOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={onConfirmEdit}
              disabled={
                !editedFirstName.trim() ||
                !editedLastName.trim() ||
                ((newPassword.length > 0 || confirmNewPassword.length > 0) &&
                  (newPassword.length < 8 ||
                    confirmNewPassword.length < 8 ||
                    newPassword !== confirmNewPassword))
              }
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(apiKeysTarget)} onOpenChange={onApiKeysOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Clés API</DialogTitle>
            <DialogDescription>
              {apiKeysTarget
                ? `Clés API de ${apiKeysTarget.email}. Les clés ne sont jamais affichées en clair.`
                : "Clés API de l'utilisateur."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {apiKeysFeedback && <p className="text-sm text-muted-foreground">{apiKeysFeedback}</p>}
            {isApiKeysLoading ? (
              <p className="text-sm text-muted-foreground">Chargement des clés API...</p>
            ) : apiKeys.length > 0 ? (
              apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="rounded-xl border bg-muted/20 p-4">
                  <p className="font-medium">{apiKey.name}</p>
                  <p className="mt-1 font-mono text-sm text-muted-foreground">
                    {apiKey.keyPrefix}...{apiKey.lastFour}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Créée: {formatCoachDate(apiKey.createdAt, true)} •{" "}
                    {apiKey.expiresAt
                      ? `Expire: ${formatCoachDate(apiKey.expiresAt, true)}`
                      : "Sans expiration"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Dernier usage:{" "}
                    {apiKey.lastUsedAt ? formatCoachDate(apiKey.lastUsedAt, true) : "Jamais"}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onRequestRevokeApiKey(apiKey)}
                    >
                      Révoquer
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune clé API active pour cet utilisateur.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(revokeApiKeyTarget)} onOpenChange={onRevokeApiKeyOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Révoquer cette clé API ?</DialogTitle>
            <DialogDescription>
              {revokeApiKeyTarget
                ? `La clé ${revokeApiKeyTarget.keyName} de ${revokeApiKeyTarget.email} sera révoquée.`
                : "La clé API sera révoquée."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onRevokeApiKeyOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirmRevokeApiKey}>
              Révoquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteUserTarget)} onOpenChange={onDeleteUserOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce compte ?</DialogTitle>
            <DialogDescription>
              {deleteUserTarget
                ? `Le compte ${deleteUserTarget.email} et ses données seront supprimés.`
                : "Le compte et ses données seront supprimés."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onDeleteUserOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmDeleteUser}
              disabled={isDeletingUser}
            >
              {isDeletingUser ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(calendarRegenerationTarget)}
        onOpenChange={onCalendarRegenerationOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Régénérer ce lien calendrier ?</DialogTitle>
            <DialogDescription>
              {calendarRegenerationTarget
                ? `L'ancien lien sera invalidé pour ${calendarRegenerationTarget.label}. Les abonnements Google Calendar existants devront être recréés avec la nouvelle URL.`
                : "Le lien calendrier actuel sera invalidé et remplacé."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCalendarRegenerationOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmCalendarRegeneration}
            >
              Régénérer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

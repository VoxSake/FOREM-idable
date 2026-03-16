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
  CoachMemberPickerGroup,
  CoachRevokeApiKeyTarget,
  CoachRemoveGroupTarget,
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
  removeMembership: CoachRemoveMembershipTarget | null;
  onRemoveMembershipOpenChange: (open: boolean) => void;
  onConfirmRemoveMembership: () => void;
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
  removeMembership,
  onRemoveMembershipOpenChange,
  onConfirmRemoveMembership,
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
              Le groupe sera visible par tous les coaches et admins.
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
        title={memberPickerGroup ? `Ajouter un user à ${memberPickerGroup.name}` : "Ajouter un user"}
        description="Recherche dynamique parmi tous les utilisateurs."
        users={assignableUsers}
        onSelect={(entry) => onMemberSelect(entry.id)}
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
            <DialogTitle>Editer l&apos;utilisateur</DialogTitle>
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
            <Button type="button" variant="destructive" onClick={onConfirmDeleteUser}>
              Supprimer
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

"use client";

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
  CoachDeleteUserTarget,
  CoachEditTarget,
  CoachMemberPickerGroup,
  CoachRemoveGroupTarget,
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
  deleteUserTarget: CoachDeleteUserTarget | null;
  onDeleteUserOpenChange: (open: boolean) => void;
  onConfirmDeleteUser: () => void;
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
  deleteUserTarget,
  onDeleteUserOpenChange,
  onConfirmDeleteUser,
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
    </>
  );
}

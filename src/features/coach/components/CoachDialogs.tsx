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
  CoachMemberPickerGroup,
  CoachPasswordTarget,
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
  passwordTarget: CoachPasswordTarget | null;
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  onPasswordOpenChange: (open: boolean) => void;
  onConfirmPasswordChange: () => void;
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
  passwordTarget,
  newPassword,
  onNewPasswordChange,
  onPasswordOpenChange,
  onConfirmPasswordChange,
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

      <Dialog open={Boolean(passwordTarget)} onOpenChange={onPasswordOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              {passwordTarget
                ? `Définir un nouveau mot de passe pour ${passwordTarget.email}.`
                : "Définir un nouveau mot de passe."}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
            placeholder="8 caractères minimum"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onPasswordOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={onConfirmPasswordChange} disabled={newPassword.length < 8}>
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

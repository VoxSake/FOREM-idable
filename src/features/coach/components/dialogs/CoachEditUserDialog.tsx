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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CoachEditTarget } from "@/features/coach/types";

interface CoachEditUserDialogProps {
  editTarget: CoachEditTarget | null;
  editedFirstName: string;
  editedLastName: string;
  newPassword: string;
  confirmNewPassword: string;
  onEditedFirstNameChange: (value: string) => void;
  onEditedLastNameChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmNewPasswordChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function CoachEditUserDialog({
  editTarget,
  editedFirstName,
  editedLastName,
  newPassword,
  confirmNewPassword,
  onEditedFirstNameChange,
  onEditedLastNameChange,
  onNewPasswordChange,
  onConfirmNewPasswordChange,
  onOpenChange,
  onConfirm,
}: CoachEditUserDialogProps) {
  const hasPasswordChange = newPassword.length > 0 || confirmNewPassword.length > 0;
  const isPasswordInvalid =
    hasPasswordChange &&
    (newPassword.length < 8 || confirmNewPassword.length < 8 || newPassword !== confirmNewPassword);

  return (
    <Dialog open={Boolean(editTarget)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Éditer l&apos;utilisateur</DialogTitle>
          <DialogDescription>
            {editTarget
              ? `Mettre à jour le profil de ${editTarget.email}. Le mot de passe est optionnel.`
              : "Mettre à jour le profil utilisateur."}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="coach-edit-first-name">Prénom</FieldLabel>
              <Input
                id="coach-edit-first-name"
                value={editedFirstName}
                onChange={(event) => onEditedFirstNameChange(event.target.value)}
                placeholder="Prénom"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="coach-edit-last-name">Nom</FieldLabel>
              <Input
                id="coach-edit-last-name"
                value={editedLastName}
                onChange={(event) => onEditedLastNameChange(event.target.value)}
                placeholder="Nom"
              />
            </Field>
          </FieldGroup>
          <FieldGroup className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <Field>
              <FieldLabel htmlFor="coach-edit-password">Nouveau mot de passe</FieldLabel>
              <Input
                id="coach-edit-password"
                type="password"
                value={newPassword}
                onChange={(event) => onNewPasswordChange(event.target.value)}
                placeholder="Laisser vide pour ne pas changer"
              />
              <FieldDescription>Au moins 8 caractères si un changement est demandé.</FieldDescription>
            </Field>
            <Field data-invalid={isPasswordInvalid || undefined}>
              <FieldLabel htmlFor="coach-edit-password-confirm">Confirmer le mot de passe</FieldLabel>
              <Input
                id="coach-edit-password-confirm"
                type="password"
                value={confirmNewPassword}
                onChange={(event) => onConfirmNewPasswordChange(event.target.value)}
                placeholder="Confirmer le mot de passe"
                aria-invalid={isPasswordInvalid}
              />
              {isPasswordInvalid ? (
                <FieldDescription className="text-destructive">
                  Les deux mots de passe doivent être identiques et faire au moins 8 caractères.
                </FieldDescription>
              ) : null}
            </Field>
          </FieldGroup>
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!editedFirstName.trim() || !editedLastName.trim() || isPasswordInvalid}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

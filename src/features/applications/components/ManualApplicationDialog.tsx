"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApplicationStatus } from "@/types/application";

export interface ManualApplicationFormState {
  company: string;
  title: string;
  contractType: string;
  location: string;
  appliedAt: string;
  status: ApplicationStatus;
  notes: string;
  proofs: string;
  url: string;
}

interface ManualApplicationDialogProps {
  open: boolean;
  form: ManualApplicationFormState;
  onOpenChange: (open: boolean) => void;
  onFormChange: (next: ManualApplicationFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ManualApplicationDialog({
  open,
  form,
  onOpenChange,
  onFormChange,
  onCancel,
  onSubmit,
}: ManualApplicationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter une candidature manuelle</DialogTitle>
          <DialogDescription>
            Ajoutez une candidature faite ailleurs pour l&apos;inclure dans votre suivi.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Entreprise</label>
            <Input
              value={form.company}
              onChange={(event) => onFormChange({ ...form, company: event.target.value })}
              placeholder="Nom de l'entreprise"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Input
              value={form.contractType}
              onChange={(event) => onFormChange({ ...form, contractType: event.target.value })}
              placeholder="CDI, CDD, intérim..."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Intitulé</label>
            <Input
              value={form.title}
              onChange={(event) => onFormChange({ ...form, title: event.target.value })}
              placeholder="Titre du poste"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lieu</label>
            <Input
              value={form.location}
              onChange={(event) => onFormChange({ ...form, location: event.target.value })}
              placeholder="Ville ou région"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date envoyée</label>
            <Input
              type="date"
              value={form.appliedAt}
              onChange={(event) => onFormChange({ ...form, appliedAt: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.status}
              onChange={(event) => onFormChange({ ...form, status: event.target.value as ApplicationStatus })}
            >
              <option value="in_progress">En cours</option>
              <option value="follow_up">Relance à faire</option>
              <option value="interview">Entretien</option>
              <option value="accepted">Acceptée</option>
              <option value="rejected">Refusée</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lien de l&apos;offre</label>
            <Input
              value={form.url}
              onChange={(event) => onFormChange({ ...form, url: event.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.notes}
              onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
              placeholder="Contexte, contact RH, retour, salaire..."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Pièces / références</label>
            <textarea
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.proofs}
              onChange={(event) => onFormChange({ ...form, proofs: event.target.value })}
              placeholder="Lien mail, capture, référence de refus..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!form.company.trim() || !form.title.trim()}
          >
            Ajouter la candidature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

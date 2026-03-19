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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Entreprise</span>
            <Input
              value={form.company}
              onChange={(event) => onFormChange({ ...form, company: event.target.value })}
              placeholder="Nom de l'entreprise"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Type</span>
            <Input
              value={form.contractType}
              onChange={(event) => onFormChange({ ...form, contractType: event.target.value })}
              placeholder="CDI, CDD, intérim..."
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Intitulé</span>
            <Input
              value={form.title}
              onChange={(event) => onFormChange({ ...form, title: event.target.value })}
              placeholder="Titre du poste"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Lieu</span>
            <Input
              value={form.location}
              onChange={(event) => onFormChange({ ...form, location: event.target.value })}
              placeholder="Ville ou région"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Date envoyée</span>
            <Input
              type="date"
              value={form.appliedAt}
              onChange={(event) => onFormChange({ ...form, appliedAt: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Statut</span>
            <Select
              value={form.status}
              onValueChange={(value) => onFormChange({ ...form, status: value as ApplicationStatus })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="follow_up">Relance à faire</SelectItem>
                  <SelectItem value="interview">Entretien</SelectItem>
                  <SelectItem value="accepted">Acceptée</SelectItem>
                  <SelectItem value="rejected">Refusée</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Lien de l&apos;offre</span>
            <Input
              value={form.url}
              onChange={(event) => onFormChange({ ...form, url: event.target.value })}
              placeholder="https://..."
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Notes</span>
            <Textarea
              className="min-h-24"
              value={form.notes}
              onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
              placeholder="Contexte, contact RH, retour, salaire..."
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Pièces / références</span>
            <Textarea
              className="min-h-24"
              value={form.proofs}
              onChange={(event) => onFormChange({ ...form, proofs: event.target.value })}
              placeholder="Lien mail, capture, référence de refus..."
            />
          </label>
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

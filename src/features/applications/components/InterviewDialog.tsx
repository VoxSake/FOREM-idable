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
import { JobApplication } from "@/types/application";

export interface InterviewFormState {
  interviewAt: string;
  interviewDetails: string;
}

interface InterviewDialogProps {
  application: JobApplication | null;
  open: boolean;
  form: InterviewFormState;
  onOpenChange: (open: boolean) => void;
  onFormChange: (next: InterviewFormState) => void;
  onRemove: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function InterviewDialog({
  application,
  open,
  form,
  onOpenChange,
  onFormChange,
  onRemove,
  onCancel,
  onSubmit,
}: InterviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Planifier un entretien</DialogTitle>
          <DialogDescription>
            {application
              ? `Planifiez la date d'entretien pour ${application.job.company || application.job.title}.`
              : "Planifiez une date d'entretien."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date et heure</label>
            <Input
              type="datetime-local"
              value={form.interviewAt}
              onChange={(event) => onFormChange({ ...form, interviewAt: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Détails</label>
            <textarea
              className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.interviewDetails}
              onChange={(event) => onFormChange({ ...form, interviewDetails: event.target.value })}
              placeholder="Adresse, Teams, contact, documents à prévoir..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={onRemove}
            disabled={!application?.interviewAt}
          >
            Supprimer l&apos;entretien
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" onClick={onSubmit} disabled={!form.interviewAt}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

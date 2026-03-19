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
import { Textarea } from "@/components/ui/textarea";
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

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Date et heure</span>
            <Input
              type="datetime-local"
              value={form.interviewAt}
              onChange={(event) => onFormChange({ ...form, interviewAt: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Informations pratiques</span>
            <Textarea
              className="min-h-28"
              value={form.interviewDetails}
              onChange={(event) => onFormChange({ ...form, interviewDetails: event.target.value })}
              placeholder="Adresse, Teams, contact, documents à prévoir..."
            />
          </label>
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

"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCoachUserDisplayName } from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

interface CoachUserSheetDialogsProps {
  user: CoachUserSummary;
  editingJobId: string | null;
  deleteApplicationTarget: { jobId: string; title: string } | null;
  deleteSharedTarget: { jobId: string; noteId: string } | null;
  savingCoachNoteKey: string | null;
  onDeleteApplicationTargetChange: (target: { jobId: string; title: string } | null) => void;
  onDeleteSharedTargetChange: (target: { jobId: string; noteId: string } | null) => void;
  onResetApplicationEditor: () => void;
  onDeleteApplication: (userId: number, jobId: string) => Promise<boolean>;
  onDeleteSharedCoachNote: (userId: number, jobId: string, noteId: string) => Promise<boolean>;
}

export function CoachUserSheetDialogs({
  user,
  editingJobId,
  deleteApplicationTarget,
  deleteSharedTarget,
  savingCoachNoteKey,
  onDeleteApplicationTargetChange,
  onDeleteSharedTargetChange,
  onResetApplicationEditor,
  onDeleteApplication,
  onDeleteSharedCoachNote,
}: CoachUserSheetDialogsProps) {
  return (
    <>
      <Dialog
        open={Boolean(deleteApplicationTarget)}
        onOpenChange={(open) => !open && onDeleteApplicationTargetChange(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer la candidature</DialogTitle>
            <DialogDescription>
              La candidature <strong>{deleteApplicationTarget?.title}</strong> sera retirée du suivi de{" "}
              {getCoachUserDisplayName(user)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onDeleteApplicationTargetChange(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (!deleteApplicationTarget) return;
                const deleted = await onDeleteApplication(user.id, deleteApplicationTarget.jobId);
                if (deleted) {
                  if (editingJobId === deleteApplicationTarget.jobId) {
                    onResetApplicationEditor();
                  }
                  onDeleteApplicationTargetChange(null);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteSharedTarget)}
        onOpenChange={(open) => !open && onDeleteSharedTargetChange(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer la note partagée</DialogTitle>
            <DialogDescription>
              Cette note ne sera plus visible par le bénéficiaire. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onDeleteSharedTargetChange(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (!deleteSharedTarget) return;
                const deleted = await onDeleteSharedCoachNote(
                  user.id,
                  deleteSharedTarget.jobId,
                  deleteSharedTarget.noteId
                );
                if (deleted) {
                  onDeleteSharedTargetChange(null);
                }
              }}
              disabled={
                !deleteSharedTarget ||
                savingCoachNoteKey === `delete:${deleteSharedTarget.noteId}`
              }
            >
              {deleteSharedTarget && savingCoachNoteKey === `delete:${deleteSharedTarget.noteId}` ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

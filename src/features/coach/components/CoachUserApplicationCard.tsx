"use client";

import {
  ChevronDown,
  ExternalLink,
  FilePenLine,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Ref } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CoachApplicationEditDraft,
  CoachApplicationEditor,
} from "@/features/coach/components/CoachApplicationEditor";
import { CoachUserPrivateNoteSection } from "@/features/coach/components/CoachUserPrivateNoteSection";
import { CoachUserSharedNotesSection } from "@/features/coach/components/CoachUserSharedNotesSection";
import { getDisplayApplicationStatus, isManualApplication } from "@/features/applications/utils";
import {
  coachStatusLabel,
  formatCoachDate,
  isApplicationDue,
} from "@/features/coach/utils";
import { getJobExternalUrl, getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { CoachUserSummary } from "@/types/coach";
import { JobApplication } from "@/types/application";
import { cn } from "@/lib/utils";

interface CoachUserApplicationCardProps {
  application: CoachUserSummary["applications"][number];
  targetRef?: Ref<HTMLDivElement>;
  isOpen: boolean;
  isEditing: boolean;
  applicationDraft: CoachApplicationEditDraft | null;
  isSavingApplication: boolean;
  privateCoachNoteDraft: string;
  newSharedNoteDraft: string;
  savingCoachNoteKey: string | null;
  hasNewSharedDraft: boolean;
  getSharedDraft: (noteId: string, fallback: string) => string;
  onToggleOpen: (nextOpen: boolean) => void;
  onOpenEditor: () => void;
  onDeleteApplication: () => void;
  onApplicationDraftChange: (
    updater: (draft: CoachApplicationEditDraft) => CoachApplicationEditDraft
  ) => void;
  onCancelEdit: () => void;
  onSaveApplication: () => void;
  onPrivateDraftChange: (value: string) => void;
  onSavePrivateNote: () => void;
  onSharedDraftChange: (noteId: string, value: string) => void;
  onStartCreateSharedNote: () => void;
  onCancelCreateSharedNote: () => void;
  onNewSharedDraftChange: (value: string) => void;
  onCreateSharedNote: () => Promise<void>;
  onDeleteSharedNote: (noteId: string) => void;
  onSaveSharedNote: (noteId: string, content: string) => void;
}

export function CoachUserApplicationCard({
  application,
  targetRef,
  isOpen,
  isEditing,
  applicationDraft,
  isSavingApplication,
  privateCoachNoteDraft,
  newSharedNoteDraft,
  savingCoachNoteKey,
  hasNewSharedDraft,
  getSharedDraft,
  onToggleOpen,
  onOpenEditor,
  onDeleteApplication,
  onApplicationDraftChange,
  onCancelEdit,
  onSaveApplication,
  onPrivateDraftChange,
  onSavePrivateNote,
  onSharedDraftChange,
  onStartCreateSharedNote,
  onCancelCreateSharedNote,
  onNewSharedDraftChange,
  onCreateSharedNote,
  onDeleteSharedNote,
  onSaveSharedNote,
}: CoachUserApplicationCardProps) {
  const isDue = isApplicationDue(application);
  const isManual = isManualApplication(application);
  const jobUrl = getJobExternalUrl(application.job);
  const privateCoachNote = application.privateCoachNote;
  const displayStatus = getDisplayApplicationStatus(application);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggleOpen}>
      <div ref={targetRef} className={getApplicationCardClassName(application.status, isDue)}>
        <div className="flex items-start gap-3 p-4">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-start justify-between gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-expanded={isOpen}
            >
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="font-semibold">
                    {application.job.company || "Entreprise non précisée"}
                  </p>
                  <p className="text-sm text-muted-foreground">{application.job.title}</p>
                  <p className="text-xs text-muted-foreground">{application.job.location}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={getApplicationStatusBadgeVariant(application.status, isDue)}>
                    {coachStatusLabel(displayStatus)}
                  </Badge>
                  <Badge variant="outline">{isManual ? "Manuelle" : "Importée"}</Badge>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Envoyée: {formatCoachDate(application.appliedAt)}</p>
                  {application.status === "rejected" ||
                  application.status === "accepted" ||
                  application.status === "interview" ? (
                    <p>Aucune relance automatique</p>
                  ) : (
                    <p>Relance: {formatCoachDate(application.followUpDueAt)}</p>
                  )}
                  <p>
                    Entretien:{" "}
                    {application.interviewAt
                      ? formatCoachDate(application.interviewAt, true)
                      : "Aucun"}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-foreground/80">
                  <span>{isOpen ? "Masquer le détail" : "Cliquer pour voir le détail"}</span>
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isOpen && "rotate-180")}
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isOpen ? "Masquer" : "Détails"}
                </span>
                <div className="rounded-full border border-border/70 bg-background/90 p-2 text-muted-foreground shadow-sm">
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                  />
                </div>
              </div>
            </button>
          </CollapsibleTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions candidature</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onOpenEditor}>
                <FilePenLine className="h-4 w-4" />
                Éditer la candidature
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDeleteApplication}>
                <Trash2 className="h-4 w-4" />
                Supprimer la candidature
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent className="border-t px-4 pb-4 pt-4">
          <div className="space-y-4">
            {isEditing && applicationDraft ? (
              <CoachApplicationEditor
                draft={applicationDraft}
                isManual={isManual}
                isSaving={isSavingApplication}
                onDraftChange={onApplicationDraftChange}
                onCancel={onCancelEdit}
                onSave={onSaveApplication}
              />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  <p>Statut: {coachStatusLabel(displayStatus)}</p>
                  <p>Type: {application.job.contractType || "Non précisé"}</p>
                  {application.lastFollowUpAt ? (
                    <p>Dernière relance: {formatCoachDate(application.lastFollowUpAt)}</p>
                  ) : null}
                </div>
                <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  <p>Offre: {isManual ? "Encodée manuellement" : "Issue du site"}</p>
                  {application.interviewDetails ? (
                    <p className="mt-1 whitespace-pre-wrap">{application.interviewDetails}</p>
                  ) : null}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {application.job.url && application.job.url !== "#" ? (
                <Button type="button" size="sm" asChild>
                  <a href={jobUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    WEB
                  </a>
                </Button>
              ) : null}
              {getJobPdfUrl(application.job) ? (
                <Button type="button" size="sm" variant="outline" asChild>
                  <a
                    href={getJobPdfUrl(application.job) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </a>
                </Button>
              ) : null}
            </div>

            {application.notes || application.proofs ? (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">Notes bénéficiaire</p>
                  <div className="max-h-40 overflow-y-auto pr-1">
                    <p className="whitespace-pre-wrap">{application.notes || "Aucune note"}</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">Pièces / références</p>
                  <div className="max-h-40 overflow-y-auto pr-1">
                    <p className="whitespace-pre-wrap">{application.proofs || "Aucune preuve"}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-4 rounded-lg border bg-background/80 p-3">
              <CoachUserPrivateNoteSection
                note={privateCoachNote}
                draft={privateCoachNoteDraft}
                isSaving={savingCoachNoteKey === `private:${application.job.id}`}
                onDraftChange={onPrivateDraftChange}
                onSave={onSavePrivateNote}
              />

              <CoachUserSharedNotesSection
                jobId={application.job.id}
                notes={application.sharedCoachNotes ?? []}
                savingCoachNoteKey={savingCoachNoteKey}
                newDraft={newSharedNoteDraft}
                hasNewDraft={hasNewSharedDraft}
                getDraft={getSharedDraft}
                onDraftChange={onSharedDraftChange}
                onStartCreate={onStartCreateSharedNote}
                onCancelCreate={onCancelCreateSharedNote}
                onNewDraftChange={onNewSharedDraftChange}
                onCreate={onCreateSharedNote}
                onDelete={onDeleteSharedNote}
                onSave={onSaveSharedNote}
              />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function getApplicationCardClassName(status: JobApplication["status"], isDue: boolean) {
  const baseClassName = "rounded-xl border transition-colors";

  if (status === "interview") {
    return cn(
      baseClassName,
      "border-[#9FCAE8] bg-[#EEF6FC] hover:border-[#87BADF] hover:bg-[#E3F0FA] dark:border-[#2A5573] dark:bg-[#10202B] dark:hover:border-[#3A6C8E] dark:hover:bg-[#152B39]"
    );
  }

  if (status === "accepted") {
    return cn(
      baseClassName,
      "border-[#9BD7A1] bg-[#EEF9F0] hover:border-[#7FC788] hover:bg-[#E5F5E8] dark:border-[#245A31] dark:bg-[#12261A] dark:hover:border-[#357A45] dark:hover:bg-[#173120]"
    );
  }

  if (status === "rejected") {
    return cn(
      baseClassName,
      "border-[#F3A19B] bg-[#FFF0EE] hover:border-[#E78D86] hover:bg-[#FEE4E0] dark:border-[#6E3531] dark:bg-[#2C1715] dark:hover:border-[#8A4742] dark:hover:bg-[#351C19]"
    );
  }

  if (isDue) {
    return cn(
      baseClassName,
      "border-[#F2C27A] bg-[#FFF5E8] hover:border-[#E6B35E] hover:bg-[#FDEED8] dark:border-[#6D4B1E] dark:bg-[#2A1D0F] dark:hover:border-[#8A6027] dark:hover:bg-[#352514]"
    );
  }

  return cn(baseClassName, "bg-card hover:border-primary/50 hover:bg-primary/5");
}

function getApplicationStatusBadgeVariant(
  status: JobApplication["status"],
  isDue: boolean
) {
  if (status === "accepted") {
    return "success";
  }

  if (status === "rejected") {
    return "error";
  }

  if (status === "interview") {
    return "info";
  }

  if (isDue) {
    return "warning";
  }

  return "secondary";
}

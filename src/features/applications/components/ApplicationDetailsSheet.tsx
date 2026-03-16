"use client";

import { CalendarDays, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { ApplicationsOfferButtons } from "@/features/applications/components/ApplicationsOfferButtons";
import {
  applicationStatusLabel,
  formatApplicationDate,
  formatApplicationDateTime,
  isManualApplication,
  shouldShowFollowUpDetails,
} from "@/features/applications/utils";
import { formatCoachAuthorName, summarizeCoachContributors } from "@/lib/coachNotes";
import { ApplicationStatus, JobApplication } from "@/types/application";

interface ApplicationDetailsSheetProps {
  application: JobApplication | null;
  open: boolean;
  hasUnreadCoachUpdate: boolean;
  notesDraft: string;
  proofsDraft: string;
  onOpenChange: (open: boolean) => void;
  onApplyStatus: (jobId: string, status: ApplicationStatus) => void;
  onNotesDraftChange: (value: string) => void;
  onProofsDraftChange: (value: string) => void;
  onSaveNotes: () => Promise<void>;
  onSaveProofs: () => Promise<void>;
  onMarkFollowUpDone: (jobId: string) => void;
  onOpenInterview: (application: JobApplication) => void;
}

export function ApplicationDetailsSheet({
  application,
  open,
  hasUnreadCoachUpdate,
  notesDraft,
  proofsDraft,
  onOpenChange,
  onApplyStatus,
  onNotesDraftChange,
  onProofsDraftChange,
  onSaveNotes,
  onSaveProofs,
  onMarkFollowUpDone,
  onOpenInterview,
}: ApplicationDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        {application ? (
          <>
            <SheetHeader className="border-b bg-muted/30 p-5 pr-12">
              <SheetTitle>{application.job.title}</SheetTitle>
              <SheetDescription>
                {application.job.company || "Entreprise non précisée"} • {application.job.location}
              </SheetDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                <ContractTypeBadge contractType={application.job.contractType || "N/A"} />
                {isManualApplication(application) ? (
                  <Badge className="border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                    MANUEL
                  </Badge>
                ) : (
                  <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                    SITE
                  </Badge>
                )}
                {application.sharedCoachNotes && application.sharedCoachNotes.length > 0 ? (
                  <Badge className="border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                    {hasUnreadCoachUpdate ? "Nouveau" : "Retour coach"}
                  </Badge>
                ) : null}
                <Badge variant="outline">Envoyée le {formatApplicationDate(application.appliedAt)}</Badge>
                <Badge variant="secondary">{applicationStatusLabel(application.status)}</Badge>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
              <div className="space-y-2">
                <p className="font-medium">Statut</p>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={application.status}
                  onChange={(event) => onApplyStatus(application.job.id, event.target.value as ApplicationStatus)}
                >
                  <option value="in_progress">En cours</option>
                  <option value="follow_up">Relance à faire</option>
                  <option value="interview">Entretien</option>
                  <option value="accepted">Acceptée</option>
                  <option value="rejected">Refusée</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Relance</p>
                {shouldShowFollowUpDetails(application.status) ? (
                  <>
                    <p className="text-muted-foreground">
                      Prochaine relance: {formatApplicationDate(application.followUpDueAt)}
                    </p>
                    {application.lastFollowUpAt ? (
                      <p className="text-muted-foreground">
                        Dernière relance: {formatApplicationDate(application.lastFollowUpAt)}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Aucune relance automatique sur une candidature clôturée.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-medium">Entretien</p>
                <p className="text-muted-foreground">
                  {application.interviewAt
                    ? formatApplicationDateTime(application.interviewAt ?? undefined)
                    : "Aucun entretien planifié"}
                </p>
                {application.interviewDetails ? (
                  <p className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
                    {application.interviewDetails}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="font-medium">Notes</p>
                <textarea
                  className="min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={notesDraft}
                  onChange={(event) => onNotesDraftChange(event.target.value)}
                  placeholder="Contexte, contact RH, retour, salaire..."
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void onSaveNotes()}
                    disabled={notesDraft === (application.notes ?? "")}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Preuves / références</p>
                <textarea
                  className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={proofsDraft}
                  onChange={(event) => onProofsDraftChange(event.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void onSaveProofs()}
                    disabled={proofsDraft === (application.proofs ?? "")}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </div>
              </div>

              {application.sharedCoachNotes && application.sharedCoachNotes.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-medium">Notes du coach</p>
                  <div className="space-y-3">
                    {application.sharedCoachNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-md border border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground"
                      >
                        <div className="space-y-1 text-xs">
                          <p>
                            Rédigée par {formatCoachAuthorName(note.createdBy)} •{" "}
                            {formatApplicationDateTime(note.updatedAt)}
                          </p>
                          {note.contributors.length > 1 ? (
                            <p>Contributions: {summarizeCoachContributors(note.contributors)}</p>
                          ) : null}
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <SheetFooter className="border-t bg-background/95 p-4">
              <div className="flex w-full flex-col gap-2">
                <ApplicationsOfferButtons application={application} layout="sheet" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => onMarkFollowUpDone(application.job.id)}
                    disabled={application.status === "accepted"}
                  >
                    Relancer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => onOpenInterview(application)}
                    disabled={application.status === "accepted" || application.status === "rejected"}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Entretien
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  ExternalLink,
  FileKey2,
  FilePenLine,
  FileText,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { isManualApplication, sortApplicationsByMostRecent } from "@/features/applications/utils";
import {
  coachStatusLabel,
  formatCoachDate,
  getCoachUserDisplayName,
  isApplicationDue,
} from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

interface CoachUserSheetProps {
  currentUserId: number | undefined;
  isAdmin: boolean;
  canEditUser: boolean;
  canManageApiKeys: boolean;
  open: boolean;
  user: CoachUserSummary | null;
  savingCoachNoteJobId: string | null;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onOpenApiKeys: () => void;
  onEdit: () => void;
  onDeleteUser: () => void;
  onSaveCoachNote: (
    userId: number,
    jobId: string,
    coachNote: string,
    shareCoachNoteWithBeneficiary: boolean
  ) => Promise<boolean>;
}

export function CoachUserSheet({
  currentUserId,
  isAdmin,
  canEditUser,
  canManageApiKeys,
  open,
  user,
  savingCoachNoteJobId,
  onOpenChange,
  onExport,
  onOpenApiKeys,
  onEdit,
  onDeleteUser,
  onSaveCoachNote,
}: CoachUserSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[60vw]">
        {user && (
          <CoachUserSheetBody
            key={user.id}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            canEditUser={canEditUser}
            canManageApiKeys={canManageApiKeys}
            user={user}
            savingCoachNoteJobId={savingCoachNoteJobId}
            onExport={onExport}
            onOpenApiKeys={onOpenApiKeys}
            onEdit={onEdit}
            onDeleteUser={onDeleteUser}
            onSaveCoachNote={onSaveCoachNote}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface CoachUserSheetBodyProps
  extends Omit<CoachUserSheetProps, "open" | "onOpenChange" | "user"> {
  user: CoachUserSummary;
}

function CoachUserSheetBody({
  currentUserId,
  isAdmin,
  canEditUser,
  canManageApiKeys,
  user,
  savingCoachNoteJobId,
  onExport,
  onOpenApiKeys,
  onEdit,
  onDeleteUser,
  onSaveCoachNote,
}: CoachUserSheetBodyProps) {
  const sortedApplications = useMemo(() => sortApplicationsByMostRecent(user.applications), [user.applications]);
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);
  const [coachNoteDrafts, setCoachNoteDrafts] = useState<Record<string, string>>({});
  const [shareDrafts, setShareDrafts] = useState<Record<string, boolean>>({});

  const toggleExpanded = (jobId: string, nextOpen: boolean) => {
    setExpandedJobIds((current) =>
      nextOpen
        ? [...current.filter((entry) => entry !== jobId), jobId]
        : current.filter((entry) => entry !== jobId)
    );
  };

  const getDraftNote = (jobId: string, fallback?: string) => coachNoteDrafts[jobId] ?? fallback ?? "";
  const getDraftShare = (jobId: string, fallback?: boolean) => shareDrafts[jobId] ?? fallback ?? false;

  return (
    <>
      <SheetHeader className="border-b bg-muted/30 p-5 pr-12">
        <SheetTitle>{getCoachUserDisplayName(user)}</SheetTitle>
        <SheetDescription>
          <span className="block text-sm">{user.email}</span>
          <span className="block">
            {user.groupNames.length > 0 ? user.groupNames.join(" • ") : "Aucun groupe assigné"}
          </span>
        </SheetDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary" className="capitalize">
            {user.role}
          </Badge>
          <Badge variant="outline">{user.applicationCount} candidatures</Badge>
          <Badge variant="outline">{user.interviewCount} entretien(s)</Badge>
          <Badge variant="outline">{user.dueCount} relance(s) dues</Badge>
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {canManageApiKeys && (
            <Button type="button" size="sm" variant="outline" onClick={onOpenApiKeys}>
              <FileKey2 className="mr-2 h-4 w-4" />
              API
            </Button>
          )}
          {canEditUser && (
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              <FilePenLine className="mr-2 h-4 w-4" />
              Editer
            </Button>
          )}
          {isAdmin && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onDeleteUser}
              disabled={user.id === currentUserId}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          )}
        </div>
      </SheetHeader>

      <div className="space-y-4 overflow-y-auto p-5">
        {sortedApplications.length > 0 ? (
          sortedApplications.map((application) => {
            const isDue = isApplicationDue(application);
            const isOpen = expandedJobIds.includes(application.job.id);
            const isManual = isManualApplication(application);
            const coachNote = getDraftNote(application.job.id, application.coachNote);
            const shareCoachNote = getDraftShare(
              application.job.id,
              application.shareCoachNoteWithBeneficiary
            );

            return (
              <Collapsible
                key={application.job.id}
                open={isOpen}
                onOpenChange={(nextOpen) => toggleExpanded(application.job.id, nextOpen)}
              >
                <div
                  className={`rounded-xl border ${
                    application.status === "interview"
                      ? "border-sky-300 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20"
                      : application.status === "accepted"
                        ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"
                        : application.status === "rejected"
                          ? "border-rose-300 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20"
                          : isDue
                            ? "border-amber-400/70 bg-amber-50/50 dark:bg-amber-950/20"
                            : "bg-card"
                  } transition-colors hover:border-primary/50 hover:bg-primary/5`}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
                          <Badge variant={isDue ? "destructive" : "secondary"}>
                            {coachStatusLabel(application.status)}
                          </Badge>
                          {isManual ? (
                            <Badge className="border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                              MANUEL
                            </Badge>
                          ) : (
                            <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                              SITE
                            </Badge>
                          )}
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
                            className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {isOpen ? "Ouvert" : "Détails"}
                        </span>
                        <div className="rounded-full border border-border/70 bg-background/90 p-2 text-muted-foreground shadow-sm">
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="border-t px-4 pb-4 pt-4">
                    <div className="space-y-4">
                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                          <p>Statut: {coachStatusLabel(application.status)}</p>
                          <p>Type: {application.job.contractType || "Non précisé"}</p>
                          {application.lastFollowUpAt && (
                            <p>Dernière relance: {formatCoachDate(application.lastFollowUpAt)}</p>
                          )}
                        </div>
                        <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                          <p>Offre: {isManual ? "Encodée manuellement" : "Issue du site"}</p>
                          {application.interviewDetails && (
                            <p className="mt-1 whitespace-pre-wrap">{application.interviewDetails}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {application.job.url && application.job.url !== "#" ? (
                          <Button type="button" size="sm" asChild>
                            <a href={application.job.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              WEB
                            </a>
                          </Button>
                        ) : null}
                        {getJobPdfUrl(application.job) && (
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
                        )}
                      </div>

                      {(application.notes || application.proofs) && (
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                            <p className="mb-1 font-medium text-foreground">Notes bénéficiaire</p>
                            <div className="max-h-40 overflow-y-auto pr-1">
                              <p className="whitespace-pre-wrap">{application.notes || "Aucune note"}</p>
                            </div>
                          </div>
                          <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                            <p className="mb-1 font-medium text-foreground">Preuves</p>
                            <div className="max-h-40 overflow-y-auto pr-1">
                              <p className="whitespace-pre-wrap">{application.proofs || "Aucune preuve"}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="rounded-lg border bg-background/80 p-3">
                        <p className="mb-2 font-medium text-foreground">Notes coach</p>
                        <textarea
                          className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                          value={coachNote}
                          onChange={(event) =>
                            setCoachNoteDrafts((current) => ({
                              ...current,
                              [application.job.id]: event.target.value,
                            }))
                          }
                          placeholder="Observation coach, piste de relance, préparation entretien..."
                        />
                        <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={shareCoachNote}
                            onChange={(event) =>
                              setShareDrafts((current) => ({
                                ...current,
                                [application.job.id]: event.target.checked,
                              }))
                            }
                          />
                          Partager avec le bénéficiaire
                        </label>
                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              void onSaveCoachNote(
                                user.id,
                                application.job.id,
                                coachNote,
                                shareCoachNote
                              )
                            }
                            disabled={savingCoachNoteJobId === application.job.id}
                          >
                            {savingCoachNoteJobId === application.job.id ? (
                              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Aucune candidature enregistrée pour cet utilisateur.
          </div>
        )}
      </div>
    </>
  );
}

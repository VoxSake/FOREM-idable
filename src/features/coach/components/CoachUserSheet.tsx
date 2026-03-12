"use client";

import { Download, ExternalLink, FilePenLine, FileText, LockKeyhole, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
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
  open: boolean;
  user: CoachUserSummary | null;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onEditProfile: () => void;
  onChangePassword: () => void;
  onDeleteUser: () => void;
}

export function CoachUserSheet({
  currentUserId,
  isAdmin,
  open,
  user,
  onOpenChange,
  onExport,
  onEditProfile,
  onChangePassword,
  onDeleteUser,
}: CoachUserSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[50vw]">
        {user && (
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
                {isAdmin && (
                  <>
                    <Button type="button" size="sm" variant="outline" onClick={onEditProfile}>
                      <FilePenLine className="mr-2 h-4 w-4" />
                      Nom / prénom
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={onChangePassword}>
                      <LockKeyhole className="mr-2 h-4 w-4" />
                      Mot de passe
                    </Button>
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
                  </>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-4 overflow-y-auto p-5">
              {user.applications.length > 0 ? (
                user.applications.map((application) => {
                  const isDue = isApplicationDue(application);

                  return (
                    <div
                      key={application.job.id}
                      className={`rounded-xl border p-4 ${
                        application.status === "interview"
                          ? "border-sky-300 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20"
                          : application.status === "accepted"
                            ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"
                            : application.status === "rejected"
                              ? "border-rose-300 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20"
                          : isDue
                            ? "border-amber-400/70 bg-amber-50/50 dark:bg-amber-950/20"
                            : "bg-card"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {application.job.company || "Entreprise non précisée"}
                          </p>
                          <p className="text-sm text-muted-foreground">{application.job.title}</p>
                          <p className="text-xs text-muted-foreground">{application.job.location}</p>
                        </div>
                        <Badge variant={isDue ? "destructive" : "secondary"}>
                          {coachStatusLabel(application.status)}
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                          <p>Envoyée: {formatCoachDate(application.appliedAt)}</p>
                          <p>Relance: {formatCoachDate(application.followUpDueAt)}</p>
                          {application.lastFollowUpAt && (
                            <p>Dernière relance: {formatCoachDate(application.lastFollowUpAt)}</p>
                          )}
                        </div>
                        <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                          <p>
                            Entretien:{" "}
                            {application.interviewAt
                              ? formatCoachDate(application.interviewAt, true)
                              : "Aucun"}
                          </p>
                          {application.interviewDetails && (
                            <p className="mt-1 line-clamp-3">{application.interviewDetails}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
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
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                            <p className="mb-1 font-medium text-foreground">Notes</p>
                            <div className="max-h-48 overflow-y-auto pr-1">
                              <p className="whitespace-pre-wrap">
                                {application.notes || "Aucune note"}
                              </p>
                            </div>
                          </div>
                          <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                            <p className="mb-1 font-medium text-foreground">Preuves</p>
                            <div className="max-h-48 overflow-y-auto pr-1">
                              <p className="whitespace-pre-wrap">
                                {application.proofs || "Aucune preuve"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Aucune candidature enregistrée pour cet utilisateur.
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

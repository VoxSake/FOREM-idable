"use client";

import { useMemo, useState } from "react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { useApplications } from "@/hooks/useApplications";
import { getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { exportApplicationsToCSV } from "@/lib/exportApplicationsCsv";
import { ApplicationStatus, JobApplication } from "@/types/application";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "dd MMM yyyy", { locale: fr });
}

function formatDateTime(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "dd MMM yyyy 'a' HH:mm", { locale: fr });
}

function isFollowUpPending(status: ApplicationStatus) {
  return status === "in_progress" || status === "follow_up";
}

function statusLabel(status: ApplicationStatus) {
  switch (status) {
    case "accepted":
      return "Acceptée";
    case "rejected":
      return "Refusée";
    case "interview":
      return "Entretien";
    case "follow_up":
      return "Relance à faire";
    case "in_progress":
    default:
      return "En cours";
  }
}

export default function ApplicationsPage() {
  const {
    applications,
    addManualApplication,
    markAsInProgress,
    markAsAccepted,
    markAsRejected,
    markAsFollowUp,
    scheduleInterview,
    clearInterview,
    saveNotes,
    saveProofs,
    markFollowUpDone,
    removeApplication,
    isLoaded,
  } = useApplications();
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [interviewJobId, setInterviewJobId] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    company: "",
    title: "",
    contractType: "",
    location: "",
    appliedAt: format(new Date(), "yyyy-MM-dd"),
    status: "in_progress" as ApplicationStatus,
    notes: "",
    proofs: "",
    url: "",
  });
  const [interviewForm, setInterviewForm] = useState({
    interviewAt: "",
    interviewDetails: "",
  });

  const now = new Date();
  const dueCount = applications.filter(
    (entry) => isFollowUpPending(entry.status) && !isAfter(new Date(entry.followUpDueAt), now)
  ).length;

  const selectedApplication = useMemo(
    () => applications.find((entry) => entry.job.id === detailsJobId) ?? null,
    [applications, detailsJobId]
  );
  const deleteApplication = useMemo(
    () => applications.find((entry) => entry.job.id === deleteJobId) ?? null,
    [applications, deleteJobId]
  );
  const interviewApplication = useMemo(
    () => applications.find((entry) => entry.job.id === interviewJobId) ?? null,
    [applications, interviewJobId]
  );

  if (!isLoaded) return null;

  const applyStatus = (jobId: string, status: ApplicationStatus) => {
    if (status === "accepted") markAsAccepted(jobId);
    else if (status === "rejected") markAsRejected(jobId);
    else if (status === "follow_up") markAsFollowUp(jobId);
    else if (status === "interview") {
      const existing = applications.find((entry) => entry.job.id === jobId);
      if (existing?.interviewAt) {
        scheduleInterview(jobId, existing.interviewAt, existing.interviewDetails);
      } else {
        setInterviewJobId(jobId);
        setInterviewForm({
          interviewAt: "",
          interviewDetails: existing?.interviewDetails ?? "",
        });
      }
    } else {
      markAsInProgress(jobId);
    }
  };

  const toggleSelection = (jobId: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const removeSelected = () => {
    for (const jobId of selectedJobIds) {
      removeApplication(jobId);
    }
    setSelectedJobIds(new Set());
  };

  const resetManualForm = () => {
    setManualForm({
      company: "",
      title: "",
      contractType: "",
      location: "",
      appliedAt: format(new Date(), "yyyy-MM-dd"),
      status: "in_progress",
      notes: "",
      proofs: "",
      url: "",
    });
  };

  const submitManualForm = () => {
    if (!manualForm.company.trim() || !manualForm.title.trim()) return;

    addManualApplication({
      company: manualForm.company.trim(),
      title: manualForm.title.trim(),
      contractType: manualForm.contractType.trim(),
      location: manualForm.location.trim(),
      appliedAt: manualForm.appliedAt,
      status: manualForm.status,
      notes: manualForm.notes.trim(),
      proofs: manualForm.proofs.trim(),
      url: manualForm.url.trim(),
    });

    resetManualForm();
    setIsCreateOpen(false);
  };

  const openInterviewModal = (entry: JobApplication) => {
    const date = entry.interviewAt ? new Date(entry.interviewAt) : null;
    const interviewAt =
      date && !Number.isNaN(date.getTime()) ? format(date, "yyyy-MM-dd'T'HH:mm") : "";

    setInterviewJobId(entry.job.id);
    setInterviewForm({
      interviewAt,
      interviewDetails: entry.interviewDetails ?? "",
    });
  };

  const submitInterview = () => {
    if (!interviewApplication || !interviewForm.interviewAt) return;

    const interviewAt = new Date(interviewForm.interviewAt);
    if (Number.isNaN(interviewAt.getTime())) return;

    scheduleInterview(
      interviewApplication.job.id,
      interviewAt.toISOString(),
      interviewForm.interviewDetails.trim()
    );
    setInterviewJobId(null);
    setInterviewForm({
      interviewAt: "",
      interviewDetails: "",
    });
  };

  const removeInterview = () => {
    if (!interviewApplication) return;

    clearInterview(interviewApplication.job.id);
    setInterviewJobId(null);
    setInterviewForm({
      interviewAt: "",
      interviewDetails: "",
    });
  };

  const renderOfferButtons = (entry: JobApplication, layout: "card" | "sheet" = "card") => {
    const pdfUrl = getJobPdfUrl(entry.job);
    const isSheet = layout === "sheet";

    return (
      <div
        className={
          isSheet ? "flex flex-wrap gap-2" : "grid grid-cols-2 gap-2 sm:grid-cols-3"
        }
        onClick={(event) => event.stopPropagation()}
      >
        {entry.job.url !== "#" ? (
          <Button
            size="sm"
            asChild
            className={`h-8 gap-1 whitespace-nowrap ${isSheet ? "px-3" : "w-full"}`}
          >
            <a href={entry.job.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              WEB
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Ajout manuel</span>
        )}
        {pdfUrl && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className={`h-8 whitespace-nowrap ${isSheet ? "px-3" : "w-full"}`}
          >
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="mr-1 h-3 w-3" />
              PDF
            </a>
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Candidatures envoyées
        </h1>
        <p className="text-muted-foreground text-lg">
          Suivez vos candidatures avec une vue simple sur desktop et mobile.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {applications.length} candidature{applications.length > 1 ? "s" : ""} suivie{applications.length > 1 ? "s" : ""}
          </p>
          <p className="text-sm font-medium text-foreground">
            {dueCount > 0 ? `${dueCount} relance${dueCount > 1 ? "s" : ""} à faire` : "Aucune relance urgente"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter manuellement
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => exportApplicationsToCSV(applications)}
            disabled={applications.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={removeSelected}
            disabled={selectedJobIds.size === 0}
          >
            Supprimer la sélection
          </Button>
        </div>
      </div>

      {applications.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {applications.map((entry) => {
            const isSelected = selectedJobIds.has(entry.job.id);
            const followUpDue = new Date(entry.followUpDueAt);
            const interviewDate = entry.interviewAt ? new Date(entry.interviewAt) : null;
            const hasInterview =
              Boolean(interviewDate) && interviewDate !== null && !Number.isNaN(interviewDate.getTime());
            const isDue = isFollowUpPending(entry.status) && !isAfter(followUpDue, now);
            const isSoon =
              isFollowUpPending(entry.status) &&
              isAfter(followUpDue, now) &&
              isBefore(followUpDue, addDays(now, 2));

            return (
              <div
                key={entry.job.id}
                className={`rounded-xl border bg-card p-4 shadow-sm cursor-pointer transition-colors hover:bg-muted/20 ${
                  hasInterview
                    ? "border-sky-300 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20"
                    : entry.status === "accepted"
                      ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"
                      : entry.status === "rejected"
                        ? "border-rose-300 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20"
                    : isDue
                      ? "border-amber-400/70"
                      : ""
                }`}
                onClick={() => setDetailsJobId(entry.job.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-primary cursor-pointer"
                    checked={isSelected}
                    onChange={() => toggleSelection(entry.job.id)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label="Sélectionner la candidature"
                  />

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0 text-left">
                        <p className="truncate font-semibold leading-snug hover:text-primary">
                          {entry.job.company || "Entreprise non précisée"}
                        </p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{entry.job.title}</p>
                        <p className="text-xs text-muted-foreground">{entry.job.location}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <ContractTypeBadge contractType={entry.job.contractType || "N/A"} />
                        <Badge variant={isDue ? "destructive" : "secondary"}>
                          {statusLabel(entry.status)}
                        </Badge>
                        <Badge variant="outline">Envoyée le {formatDate(entry.appliedAt)}</Badge>
                        {hasInterview && (
                          <Badge className="bg-sky-600 text-white hover:bg-sky-600">
                            Entretien {formatDateTime(entry.interviewAt)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                      <div className="space-y-3">
                        <select
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-[180px]"
                          value={entry.status}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            applyStatus(entry.job.id, event.target.value as ApplicationStatus)
                          }
                        >
                          <option value="in_progress">En cours</option>
                          <option value="follow_up">Relance à faire</option>
                          <option value="interview">Entretien</option>
                          <option value="accepted">Acceptée</option>
                          <option value="rejected">Refusée</option>
                        </select>

                        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                          <p>Relance: {formatDate(entry.followUpDueAt)}</p>
                          {isSoon && <p>Bientôt</p>}
                          {entry.lastFollowUpAt && <p>Dernière: {formatDate(entry.lastFollowUpAt)}</p>}
                          {hasInterview && <p>Entretien: {formatDateTime(entry.interviewAt)}</p>}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:w-[260px]">
                        <div className="space-y-2">
                          {renderOfferButtons(entry)}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-full"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDetailsJobId(entry.job.id);
                            }}
                          >
                            Détails
                          </Button>
                        </div>

                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 w-full"
                            onClick={(event) => {
                              event.stopPropagation();
                              markFollowUpDone(entry.job.id);
                            }}
                            disabled={entry.status === "accepted" || entry.status === "rejected"}
                          >
                            <Clock3 className="mr-2 h-4 w-4" />
                            Relancer
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 w-full"
                            onClick={(event) => {
                              event.stopPropagation();
                              openInterviewModal(entry);
                            }}
                            disabled={entry.status === "accepted" || entry.status === "rejected"}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Entretien
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 self-center text-destructive hover:text-destructive"
                            title="Supprimer"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteJobId(entry.job.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-card rounded-xl border border-dashed border-border mt-8">
          <BriefcaseBusiness className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium text-lg">
            Aucune candidature suivie pour le moment.
          </p>
          <p className="text-sm text-muted-foreground/70 text-center max-w-md">
            Utilisez le bouton de candidature depuis les résultats ou encodez une candidature faite ailleurs.
          </p>
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Encoder une candidature externe
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <Clock3 className="h-3.5 w-3.5" />
            Les relances sont mises en avant 7 jours après l&apos;envoi.
          </div>
        </div>
      )}

      <Sheet open={Boolean(selectedApplication)} onOpenChange={(open) => !open && setDetailsJobId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          {selectedApplication && (
            <>
              <SheetHeader className="border-b bg-muted/30 p-5 pr-12">
                <SheetTitle>{selectedApplication.job.title}</SheetTitle>
                <SheetDescription>
                  {selectedApplication.job.company || "Entreprise non précisée"} • {selectedApplication.job.location}
                </SheetDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <ContractTypeBadge contractType={selectedApplication.job.contractType || "N/A"} />
                  <Badge variant="outline">Envoyée le {formatDate(selectedApplication.appliedAt)}</Badge>
                  <Badge variant="secondary">{statusLabel(selectedApplication.status)}</Badge>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
                <div className="space-y-2">
                  <p className="font-medium">Statut</p>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={selectedApplication.status}
                    onChange={(event) =>
                      applyStatus(selectedApplication.job.id, event.target.value as ApplicationStatus)
                    }
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
                  <p className="text-muted-foreground">Prochaine relance: {formatDate(selectedApplication.followUpDueAt)}</p>
                  {selectedApplication.lastFollowUpAt && (
                    <p className="text-muted-foreground">Dernière relance: {formatDate(selectedApplication.lastFollowUpAt)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Entretien</p>
                  <p className="text-muted-foreground">
                    {selectedApplication.interviewAt
                      ? formatDateTime(selectedApplication.interviewAt)
                      : "Aucun entretien planifié"}
                  </p>
                  {selectedApplication.interviewDetails && (
                    <p className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
                      {selectedApplication.interviewDetails}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Notes</p>
                  <textarea
                    className="min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={selectedApplication.notes ?? ""}
                    onChange={(event) => saveNotes(selectedApplication.job.id, event.target.value)}
                    placeholder="Contexte, contact RH, retour, salaire..."
                  />
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Preuves / références</p>
                  <textarea
                    className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={selectedApplication.proofs ?? ""}
                    onChange={(event) => saveProofs(selectedApplication.job.id, event.target.value)}
                  />
                </div>
              </div>

              <SheetFooter className="border-t bg-background/95 p-4">
                <div className="flex w-full flex-col gap-2">
                  {renderOfferButtons(selectedApplication, "sheet")}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => markFollowUpDone(selectedApplication.job.id)}
                      disabled={
                        selectedApplication.status === "accepted" ||
                        selectedApplication.status === "rejected"
                      }
                    >
                      Relancer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => openInterviewModal(selectedApplication)}
                      disabled={
                        selectedApplication.status === "accepted" ||
                        selectedApplication.status === "rejected"
                      }
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Entretien
                    </Button>
                  </div>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Encoder une candidature manuelle</DialogTitle>
            <DialogDescription>
              Ajoutez une candidature faite ailleurs pour l&apos;inclure dans le tableau de suivi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Entreprise</label>
              <Input
                value={manualForm.company}
                onChange={(event) => setManualForm((prev) => ({ ...prev, company: event.target.value }))}
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Input
                value={manualForm.contractType}
                onChange={(event) => setManualForm((prev) => ({ ...prev, contractType: event.target.value }))}
                placeholder="CDI, CDD, intérim..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Intitulé</label>
              <Input
                value={manualForm.title}
                onChange={(event) => setManualForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Titre du poste"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lieu</label>
              <Input
                value={manualForm.location}
                onChange={(event) => setManualForm((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="Ville ou région"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date envoyée</label>
              <Input
                type="date"
                value={manualForm.appliedAt}
                onChange={(event) => setManualForm((prev) => ({ ...prev, appliedAt: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={manualForm.status}
                onChange={(event) =>
                  setManualForm((prev) => ({ ...prev, status: event.target.value as ApplicationStatus }))
                }
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
                value={manualForm.url}
                onChange={(event) => setManualForm((prev) => ({ ...prev, url: event.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={manualForm.notes}
                onChange={(event) => setManualForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Contexte, contact RH, retour, salaire..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Preuves</label>
              <textarea
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={manualForm.proofs}
                onChange={(event) => setManualForm((prev) => ({ ...prev, proofs: event.target.value }))}
                placeholder="Lien mail, capture, référence de refus..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetManualForm();
                setIsCreateOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={submitManualForm}
              disabled={!manualForm.company.trim() || !manualForm.title.trim()}
            >
              Ajouter la candidature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(interviewApplication)}
        onOpenChange={(open) => {
          if (!open) {
            setInterviewJobId(null);
            setInterviewForm({
              interviewAt: "",
              interviewDetails: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Planifier un entretien</DialogTitle>
            <DialogDescription>
              {interviewApplication
                ? `Planifiez la date d'entretien pour ${interviewApplication.job.company || interviewApplication.job.title}.`
                : "Planifiez une date d'entretien."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date et heure</label>
              <Input
                type="datetime-local"
                value={interviewForm.interviewAt}
                onChange={(event) =>
                  setInterviewForm((prev) => ({ ...prev, interviewAt: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Détails</label>
              <textarea
                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={interviewForm.interviewDetails}
                onChange={(event) =>
                  setInterviewForm((prev) => ({ ...prev, interviewDetails: event.target.value }))
                }
                placeholder="Adresse, Teams, contact, documents à prévoir..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={removeInterview}
              disabled={!interviewApplication?.interviewAt}
            >
              Supprimer l&apos;entretien
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setInterviewJobId(null);
                setInterviewForm({
                  interviewAt: "",
                  interviewDetails: "",
                });
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={submitInterview}
              disabled={!interviewForm.interviewAt}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteApplication)} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette candidature ?</DialogTitle>
            <DialogDescription>
              {deleteApplication
                ? `Cette action retirera ${deleteApplication.job.title} de votre suivi.`
                : "Cette action retirera la candidature de votre suivi."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteJobId(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteApplication) return;
                removeApplication(deleteApplication.job.id);
                setDeleteJobId(null);
                if (detailsJobId === deleteApplication.job.id) {
                  setDetailsJobId(null);
                }
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

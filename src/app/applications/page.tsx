"use client";

import { useMemo, useState } from "react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BriefcaseBusiness,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "dd MMM yyyy", { locale: fr });
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
    saveNotes,
    markFollowUpDone,
    removeApplication,
    isLoaded,
  } = useApplications();
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null);
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

  const now = new Date();
  const dueCount = applications.filter(
    (entry) => isFollowUpPending(entry.status) && !isAfter(new Date(entry.followUpDueAt), now)
  ).length;

  const selectedApplication = useMemo(
    () => applications.find((entry) => entry.job.id === detailsJobId) ?? null,
    [applications, detailsJobId]
  );

  if (!isLoaded) return null;

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

  const renderOfferButtons = (entry: JobApplication) => {
    const pdfUrl = getJobPdfUrl(entry.job);

    return (
      <div className="flex items-center gap-2">
        {pdfUrl && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-full h-8 px-3 whitespace-nowrap"
          >
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="mr-1 h-3 w-3" />
              PDF
            </a>
          </Button>
        )}
        {entry.job.url !== "#" ? (
          <Button
            size="sm"
            asChild
            className="rounded-full h-8 px-3 gap-1 whitespace-nowrap"
          >
            <a href={entry.job.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              WEB
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Ajout manuel</span>
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
            variant="outline"
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
        <>
          <div className="md:hidden space-y-3">
            {applications.map((entry) => {
              const isSelected = selectedJobIds.has(entry.job.id);
              const isDue =
                isFollowUpPending(entry.status) &&
                !isAfter(new Date(entry.followUpDueAt), now);

              return (
                <div key={entry.job.id} className={`rounded-xl border bg-card p-4 shadow-sm space-y-3 ${isDue ? "border-amber-400/70" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="text-left min-w-0 flex-1"
                      onClick={() => setDetailsJobId(entry.job.id)}
                    >
                      <p className="font-semibold leading-snug">{entry.job.company || "Entreprise non précisée"}</p>
                      <p className="text-sm text-muted-foreground">{entry.job.title}</p>
                      <p className="text-xs text-muted-foreground">{entry.job.location}</p>
                    </button>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary cursor-pointer"
                      checked={isSelected}
                      onChange={() => toggleSelection(entry.job.id)}
                      aria-label="Sélectionner la candidature"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ContractTypeBadge contractType={entry.job.contractType || "N/A"} />
                    <Badge variant={isDue ? "destructive" : "secondary"}>{statusLabel(entry.status)}</Badge>
                    <Badge variant="outline">Envoyée le {formatDate(entry.appliedAt)}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {renderOfferButtons(entry)}
                    <Button type="button" variant="outline" size="sm" onClick={() => setDetailsJobId(entry.job.id)}>
                      Notes
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => markFollowUpDone(entry.job.id)}
                      disabled={entry.status === "accepted" || entry.status === "rejected"}
                    >
                      <Clock3 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeApplication(entry.job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="table-fixed min-w-[980px]">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12">Sel.</TableHead>
                    <TableHead className="w-[280px]">Entreprise</TableHead>
                    <TableHead className="w-[140px]">Type</TableHead>
                    <TableHead className="w-[140px]">Date envoyée</TableHead>
                    <TableHead className="w-[170px]">Statut</TableHead>
                    <TableHead className="hidden lg:table-cell w-[160px]">Relance</TableHead>
                    <TableHead className="w-[170px]">Offre</TableHead>
                    <TableHead className="text-right w-[90px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((entry) => {
                    const isSelected = selectedJobIds.has(entry.job.id);
                    const followUpDue = new Date(entry.followUpDueAt);
                    const isDue = isFollowUpPending(entry.status) && !isAfter(followUpDue, now);
                    const isSoon =
                      isFollowUpPending(entry.status) &&
                      isAfter(followUpDue, now) &&
                      isBefore(followUpDue, addDays(now, 2));

                    return (
                      <TableRow key={entry.job.id} className={isDue ? "bg-amber-50/80 dark:bg-amber-950/20" : ""}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleSelection(entry.job.id)}
                            aria-label="Sélectionner la candidature"
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => setDetailsJobId(entry.job.id)}
                          >
                            <p className="font-semibold leading-snug hover:text-primary">{entry.job.company || "Entreprise non précisée"}</p>
                            <p className="text-xs text-muted-foreground">{entry.job.title}</p>
                            <p className="text-xs text-muted-foreground">{entry.job.location}</p>
                          </button>
                        </TableCell>
                        <TableCell className="align-top">
                          <ContractTypeBadge contractType={entry.job.contractType || "N/A"} />
                        </TableCell>
                        <TableCell>{formatDate(entry.appliedAt)}</TableCell>
                        <TableCell className="align-top">
                          <select
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            value={entry.status}
                            onChange={(event) => {
                              const nextStatus = event.target.value as ApplicationStatus;
                              if (nextStatus === "accepted") markAsAccepted(entry.job.id);
                              else if (nextStatus === "rejected") markAsRejected(entry.job.id);
                              else if (nextStatus === "follow_up") markAsFollowUp(entry.job.id);
                              else markAsInProgress(entry.job.id);
                            }}
                          >
                            <option value="in_progress">En cours</option>
                            <option value="follow_up">Relance à faire</option>
                            <option value="accepted">Acceptée</option>
                            <option value="rejected">Refusée</option>
                          </select>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-1">
                            <p>{formatDate(entry.followUpDueAt)}</p>
                            {isDue && <Badge className="bg-amber-500 text-white hover:bg-amber-500">Relance à faire</Badge>}
                            {isSoon && <Badge variant="secondary">Bientôt</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">{renderOfferButtons(entry)}</TableCell>
                        <TableCell className="text-right align-top">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              title="Relance faite"
                              onClick={() => markFollowUpDone(entry.job.id)}
                              disabled={entry.status === "accepted" || entry.status === "rejected"}
                            >
                              <Clock3 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              title="Supprimer"
                              onClick={() => removeApplication(entry.job.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
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
                    onChange={(event) => {
                      const nextStatus = event.target.value as ApplicationStatus;
                      if (nextStatus === "accepted") markAsAccepted(selectedApplication.job.id);
                      else if (nextStatus === "rejected") markAsRejected(selectedApplication.job.id);
                      else if (nextStatus === "follow_up") markAsFollowUp(selectedApplication.job.id);
                      else markAsInProgress(selectedApplication.job.id);
                    }}
                  >
                    <option value="in_progress">En cours</option>
                    <option value="follow_up">Relance à faire</option>
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
                    readOnly
                  />
                </div>
              </div>

              <SheetFooter className="border-t bg-background/95 p-4">
                <div className="flex flex-wrap gap-2">
                  {renderOfferButtons(selectedApplication)}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => markFollowUpDone(selectedApplication.job.id)}
                    disabled={selectedApplication.status === "accepted" || selectedApplication.status === "rejected"}
                  >
                    Relance faite
                  </Button>
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
    </div>
  );
}

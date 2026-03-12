"use client";

import { useState } from "react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { BriefcaseBusiness, Clock3, Download, Plus, Trash2 } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportApplicationsToCSV } from "@/lib/exportApplicationsCsv";
import { ApplicationStatus } from "@/types/application";
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

function getStatusLabel(status: ApplicationStatus) {
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
    saveProofs,
    markFollowUpDone,
    removeApplication,
    isLoaded,
  } = useApplications();
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
    (entry) =>
      (entry.status === "in_progress" || entry.status === "follow_up") &&
      !isAfter(new Date(entry.followUpDueAt), now)
  ).length;

  if (!isLoaded) return null;

  const toggleSelection = (jobId: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Candidatures envoyées
        </h1>
        <p className="text-muted-foreground text-lg">
          Suivez vos candidatures, réponses, relances et preuves dans un seul tableau.
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
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table className="table-fixed">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12">Sel.</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Date envoyée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Relance</TableHead>
                <TableHead className="hidden xl:table-cell">Notes</TableHead>
                <TableHead className="hidden xl:table-cell">Preuves</TableHead>
                <TableHead className="hidden 2xl:table-cell">Offre</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((entry) => {
                const isSelected = selectedJobIds.has(entry.job.id);
                const followUpDue = new Date(entry.followUpDueAt);
                const isDue =
                  (entry.status === "in_progress" || entry.status === "follow_up") &&
                  !isAfter(followUpDue, now);
                const isSoon =
                  (entry.status === "in_progress" || entry.status === "follow_up") &&
                  isAfter(followUpDue, now) &&
                  isBefore(followUpDue, addDays(now, 2));

                return (
                  <TableRow
                    key={entry.job.id}
                    className={isDue ? "bg-amber-50/80 dark:bg-amber-950/20" : ""}
                  >
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
                      <div className="space-y-1">
                        <p className="font-semibold leading-snug">
                          {entry.job.company || "Entreprise non précisée"}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.job.title}</p>
                        <p className="text-xs text-muted-foreground">{entry.job.location}</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">{entry.job.contractType || "N/A"}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(entry.appliedAt)}</TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-2">
                        <Badge
                          variant={
                            entry.status === "accepted"
                              ? "default"
                              : entry.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {getStatusLabel(entry.status)}
                        </Badge>
                        <select
                          className="h-9 rounded-md border bg-background px-3 text-sm"
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
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1">
                        <p>{formatDate(entry.followUpDueAt)}</p>
                        {isDue && (
                          <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                            Relance à faire
                          </Badge>
                        )}
                        {isSoon && <Badge variant="secondary">Bientôt</Badge>}
                        {entry.lastFollowUpAt && (
                          <p className="text-xs text-muted-foreground">
                            Dernière relance: {formatDate(entry.lastFollowUpAt)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell align-top">
                      <textarea
                        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={entry.notes ?? ""}
                        onChange={(event) => saveNotes(entry.job.id, event.target.value)}
                        placeholder="Infos utiles, contact RH, salaire, retour..."
                      />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell align-top">
                      <textarea
                        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={entry.proofs ?? ""}
                        onChange={(event) => saveProofs(entry.job.id, event.target.value)}
                        placeholder="Preuve d'envoi, refus, lien mail, capture..."
                      />
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell align-top">
                      {entry.job.url !== "#" ? (
                        <a
                          href={entry.job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline-offset-2 hover:underline"
                        >
                          Voir l&apos;offre
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">Ajout manuel</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => markFollowUpDone(entry.job.id)}
                          disabled={entry.status === "accepted" || entry.status === "rejected"}
                        >
                          Relance faite
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeApplication(entry.job.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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

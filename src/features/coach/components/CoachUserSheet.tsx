"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  ExternalLink,
  FileKey2,
  FileSpreadsheet,
  FilePenLine,
  FileText,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocalPagination } from "@/components/ui/local-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { isManualApplication, sortApplicationsByMostRecent } from "@/features/applications/utils";
import {
  coachStatusLabel,
  formatCoachAuthorName,
  formatCoachDate,
  getCoachUserDisplayName,
  isApplicationDue,
  summarizeCoachContributors,
} from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";
import { JobApplication } from "@/types/application";

interface CoachUserSheetProps {
  currentUserId: number | undefined;
  isAdmin: boolean;
  canEditUser: boolean;
  canManageApiKeys: boolean;
  open: boolean;
  user: CoachUserSummary | null;
  initialJobId?: string | null;
  savingCoachNoteKey: string | null;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onOpenApiKeys: () => void;
  onOpenImport: () => void;
  onEdit: () => void;
  onDeleteUser: () => void;
  onSavePrivateCoachNote: (userId: number, jobId: string, content: string) => Promise<boolean>;
  onCreateSharedCoachNote: (userId: number, jobId: string, content: string) => Promise<boolean>;
  onUpdateSharedCoachNote: (
    userId: number,
    jobId: string,
    noteId: string,
    content: string
  ) => Promise<boolean>;
  onDeleteSharedCoachNote: (userId: number, jobId: string, noteId: string) => Promise<boolean>;
  onUpdateApplication: (
    userId: number,
    jobId: string,
    patch: Partial<JobApplication>
  ) => Promise<boolean>;
  onDeleteApplication: (userId: number, jobId: string) => Promise<boolean>;
}

interface CoachApplicationEditDraft {
  company: string;
  title: string;
  contractType: string;
  location: string;
  url: string;
  appliedAt: string;
  status: JobApplication["status"];
  notes: string;
  proofs: string;
  interviewAt: string;
  interviewDetails: string;
  followUpEnabled: boolean;
  followUpDueAt: string;
}

export function CoachUserSheet({
  currentUserId,
  isAdmin,
  canEditUser,
  canManageApiKeys,
  open,
  user,
  initialJobId,
  savingCoachNoteKey,
  onOpenChange,
  onExport,
  onOpenApiKeys,
  onOpenImport,
  onEdit,
  onDeleteUser,
  onSavePrivateCoachNote,
  onCreateSharedCoachNote,
  onUpdateSharedCoachNote,
  onDeleteSharedCoachNote,
  onUpdateApplication,
  onDeleteApplication,
}: CoachUserSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[60vw]">
        {user && (
          <CoachUserSheetBody
            key={`${user.id}:${initialJobId ?? "base"}`}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            canEditUser={canEditUser}
            canManageApiKeys={canManageApiKeys}
            user={user}
            initialJobId={initialJobId}
            savingCoachNoteKey={savingCoachNoteKey}
            onExport={onExport}
            onOpenApiKeys={onOpenApiKeys}
            onOpenImport={onOpenImport}
            onEdit={onEdit}
            onDeleteUser={onDeleteUser}
            onSavePrivateCoachNote={onSavePrivateCoachNote}
            onCreateSharedCoachNote={onCreateSharedCoachNote}
            onUpdateSharedCoachNote={onUpdateSharedCoachNote}
            onDeleteSharedCoachNote={onDeleteSharedCoachNote}
            onUpdateApplication={onUpdateApplication}
            onDeleteApplication={onDeleteApplication}
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
  initialJobId,
  savingCoachNoteKey,
  onExport,
  onOpenApiKeys,
  onOpenImport,
  onEdit,
  onDeleteUser,
  onSavePrivateCoachNote,
  onCreateSharedCoachNote,
  onUpdateSharedCoachNote,
  onDeleteSharedCoachNote,
  onUpdateApplication,
  onDeleteApplication,
}: CoachUserSheetBodyProps) {
  const sortedApplications = useMemo(() => sortApplicationsByMostRecent(user.applications), [user.applications]);
  const applicationsPageSize = 10;
  const initialFocusPage = (() => {
    if (!initialJobId) {
      return 1;
    }

    const jobIndex = sortedApplications.findIndex((application) => application.job.id === initialJobId);
    if (jobIndex < 0) {
      return 1;
    }

    return Math.floor(jobIndex / applicationsPageSize) + 1;
  })();
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>(initialJobId ? [initialJobId] : []);
  const [privateNoteDrafts, setPrivateNoteDrafts] = useState<Record<string, string>>({});
  const [sharedNoteDrafts, setSharedNoteDrafts] = useState<Record<string, string>>({});
  const [newSharedNoteDrafts, setNewSharedNoteDrafts] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(initialFocusPage);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [applicationDraft, setApplicationDraft] = useState<CoachApplicationEditDraft | null>(null);
  const [isSavingApplication, setIsSavingApplication] = useState(false);
  const [deleteApplicationTarget, setDeleteApplicationTarget] = useState<{
    jobId: string;
    title: string;
  } | null>(null);
  const [deleteSharedTarget, setDeleteSharedTarget] = useState<{
    jobId: string;
    noteId: string;
  } | null>(null);

  const pageCount = Math.max(1, Math.ceil(sortedApplications.length / applicationsPageSize));
  const effectivePage = Math.min(currentPage, pageCount);
  const paginatedApplications = useMemo(() => {
    const start = (effectivePage - 1) * applicationsPageSize;
    return sortedApplications.slice(start, start + applicationsPageSize);
  }, [effectivePage, sortedApplications]);

  const toggleExpanded = (jobId: string, nextOpen: boolean) => {
    setExpandedJobIds((current) =>
      nextOpen
        ? [...current.filter((entry) => entry !== jobId), jobId]
        : current.filter((entry) => entry !== jobId)
    );
  };

  const getPrivateDraft = (jobId: string, fallback?: string) =>
    privateNoteDrafts[jobId] ?? fallback ?? "";
  const getSharedDraft = (noteId: string, fallback: string) =>
    sharedNoteDrafts[noteId] ?? fallback;

  const openApplicationEditor = (application: CoachUserSummary["applications"][number]) => {
    setEditingJobId(application.job.id);
    setApplicationDraft({
      company: application.job.company || "",
      title: application.job.title,
      contractType: application.job.contractType || "",
      location: application.job.location || "",
      url: application.job.url === "#" ? "" : application.job.url || "",
      appliedAt: toEditableDate(application.appliedAt),
      status: application.status,
      notes: application.notes || "",
      proofs: application.proofs || "",
      interviewAt: toEditableDateTime(application.interviewAt),
      interviewDetails: application.interviewDetails || "",
      followUpEnabled: application.followUpEnabled !== false,
      followUpDueAt: toEditableDate(application.followUpDueAt),
    });
    if (!expandedJobIds.includes(application.job.id)) {
      setExpandedJobIds((current) => [...current, application.job.id]);
    }
  };

  const resetApplicationEditor = () => {
    setEditingJobId(null);
    setApplicationDraft(null);
    setIsSavingApplication(false);
  };

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
          {(canManageApiKeys || canEditUser || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canManageApiKeys && (
                  <DropdownMenuItem onClick={onOpenApiKeys}>
                    <FileKey2 className="h-4 w-4" />
                    Clés API
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onOpenImport}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Importer un suivi (CSV)
                </DropdownMenuItem>
                {canEditUser && (
                  <DropdownMenuItem onClick={onEdit}>
                    <FilePenLine className="h-4 w-4" />
                    Éditer
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    {canManageApiKeys || canEditUser ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={onDeleteUser}
                      disabled={user.id === currentUserId}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SheetHeader>

      <div className="space-y-4 overflow-y-auto p-5">
        {sortedApplications.length > 0 ? (
          <>
          <LocalPagination
            currentPage={effectivePage}
            pageCount={pageCount}
            totalCount={sortedApplications.length}
            pageSize={applicationsPageSize}
            itemLabel="candidatures"
            onPageChange={setCurrentPage}
            compact
          />
          {paginatedApplications.map((application) => {
            const isDue = isApplicationDue(application);
            const isOpen = expandedJobIds.includes(application.job.id);
            const isManual = isManualApplication(application);
            const isEditingApplication =
              editingJobId === application.job.id && applicationDraft !== null;
            const privateCoachNote = application.privateCoachNote;
            const privateCoachNoteDraft = getPrivateDraft(
              application.job.id,
              privateCoachNote?.content
            );
            const newSharedNoteDraft = newSharedNoteDrafts[application.job.id] ?? "";

            return (
              <Collapsible
                key={application.job.id}
                open={isOpen}
                onOpenChange={(nextOpen) => toggleExpanded(application.job.id, nextOpen)}
              >
                <div
                  className={`rounded-xl border transition-colors ${
                    application.status === "interview"
                      ? "border-sky-300 bg-sky-50/60 hover:border-sky-400 hover:bg-sky-100/70 dark:border-sky-900 dark:bg-sky-950/20 dark:hover:border-sky-800 dark:hover:bg-sky-950/30"
                      : application.status === "accepted"
                        ? "border-emerald-300 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-100/70 dark:border-emerald-900 dark:bg-emerald-950/20 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
                        : application.status === "rejected"
                          ? "border-rose-300 bg-rose-50/60 hover:border-rose-400 hover:bg-rose-100/70 dark:border-rose-900 dark:bg-rose-950/20 dark:hover:border-rose-800 dark:hover:bg-rose-950/30"
                          : isDue
                            ? "border-amber-400/70 bg-amber-50/50 hover:border-amber-500 hover:bg-amber-100/60 dark:bg-amber-950/20 dark:hover:border-amber-700 dark:hover:bg-amber-950/30"
                            : "bg-card hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
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
                          <Badge variant={isDue ? "destructive" : "secondary"}>
                            {coachStatusLabel(application.status)}
                          </Badge>
                    {isManual ? (
                      <Badge className="border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                        Manuelle
                      </Badge>
                    ) : (
                      <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                        Importée
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
                          {isOpen ? "Masquer" : "Détails"}
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
                        <DropdownMenuItem
                          onClick={() => openApplicationEditor(application)}
                        >
                          <FilePenLine className="h-4 w-4" />
                          Éditer la candidature
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            setDeleteApplicationTarget({
                              jobId: application.job.id,
                              title: application.job.title,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer la candidature
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CollapsibleContent className="border-t px-4 pb-4 pt-4">
                    <div className="space-y-4">
                      {isEditingApplication ? (
                        <div className="space-y-4 rounded-xl border bg-background/80 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-foreground">Éditer la candidature</p>
                            <Badge variant="outline">
                              {isManual ? "Candidature manuelle" : "Candidature importée"}
                            </Badge>
                          </div>

                          {isManual ? (
                            <div className="grid gap-3 lg:grid-cols-2">
                              <label className="space-y-1">
                                <span className="text-xs text-muted-foreground">Entreprise</span>
                                <input
                                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                  value={applicationDraft.company}
                                  onChange={(event) =>
                                    setApplicationDraft((current) =>
                                      current
                                        ? { ...current, company: event.target.value }
                                        : current
                                    )
                                  }
                                />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs text-muted-foreground">Type</span>
                                <input
                                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                  value={applicationDraft.contractType}
                                  onChange={(event) =>
                                    setApplicationDraft((current) =>
                                      current
                                        ? { ...current, contractType: event.target.value }
                                        : current
                                    )
                                  }
                                />
                              </label>
                              <label className="space-y-1 lg:col-span-2">
                                <span className="text-xs text-muted-foreground">Intitulé</span>
                                <input
                                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                  value={applicationDraft.title}
                                  onChange={(event) =>
                                    setApplicationDraft((current) =>
                                      current ? { ...current, title: event.target.value } : current
                                    )
                                  }
                                />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs text-muted-foreground">Lieu</span>
                                <input
                                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                  value={applicationDraft.location}
                                  onChange={(event) =>
                                    setApplicationDraft((current) =>
                                      current
                                        ? { ...current, location: event.target.value }
                                        : current
                                    )
                                  }
                                />
                              </label>
                              <label className="space-y-1">
                                <span className="text-xs text-muted-foreground">Lien de l’offre</span>
                                <input
                                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                  value={applicationDraft.url}
                                  onChange={(event) =>
                                    setApplicationDraft((current) =>
                                      current ? { ...current, url: event.target.value } : current
                                    )
                                  }
                                  placeholder="https://..."
                                />
                              </label>
                            </div>
                          ) : null}

                          <div className="grid gap-3 lg:grid-cols-2">
                            <label className="space-y-1">
                              <span className="text-xs text-muted-foreground">Date d’envoi</span>
                              <input
                                type="date"
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                value={applicationDraft.appliedAt}
                                onChange={(event) =>
                                  setApplicationDraft((current) =>
                                    current
                                      ? { ...current, appliedAt: event.target.value }
                                      : current
                                  )
                                }
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-xs text-muted-foreground">Statut</span>
                              <select
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                value={applicationDraft.status}
                                onChange={(event) =>
                                  setApplicationDraft((current) =>
                                    current
                                      ? {
                                          ...current,
                                          status: event.target.value as JobApplication["status"],
                                        }
                                      : current
                                  )
                                }
                              >
                                <option value="in_progress">En cours</option>
                                <option value="follow_up">Relance à faire</option>
                                <option value="interview">Entretien</option>
                                <option value="accepted">Acceptée</option>
                                <option value="rejected">Refusée</option>
                              </select>
                            </label>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-2">
                            <label className="space-y-1">
                              <span className="text-xs text-muted-foreground">Relance active</span>
                              <select
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                value={applicationDraft.followUpEnabled ? "yes" : "no"}
                                onChange={(event) =>
                                  setApplicationDraft((current) =>
                                    current
                                      ? {
                                          ...current,
                                          followUpEnabled: event.target.value === "yes",
                                        }
                                      : current
                                  )
                                }
                              >
                                <option value="yes">Oui</option>
                                <option value="no">Non</option>
                              </select>
                            </label>
                            <label className="space-y-1">
                              <span className="text-xs text-muted-foreground">Date de relance</span>
                              <input
                                type="date"
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                value={applicationDraft.followUpDueAt}
                                onChange={(event) =>
                                  setApplicationDraft((current) =>
                                    current
                                      ? { ...current, followUpDueAt: event.target.value }
                                      : current
                                  )
                                }
                              />
                            </label>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-2">
                            <label className="space-y-1">
                              <span className="text-xs text-muted-foreground">Entretien</span>
                              <input
                                type="datetime-local"
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                value={applicationDraft.interviewAt}
                                onChange={(event) =>
                                  setApplicationDraft((current) =>
                                    current
                                      ? { ...current, interviewAt: event.target.value }
                                      : current
                                  )
                                }
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-xs text-muted-foreground">Détails entretien</span>
                              <textarea
                                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={applicationDraft.interviewDetails}
                                onChange={(event) =>
                                  setApplicationDraft((current) =>
                                    current
                                      ? {
                                          ...current,
                                          interviewDetails: event.target.value,
                                        }
                                      : current
                                  )
                                }
                              />
                            </label>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-2">
                            <label className="space-y-1">
                              <span className="text-xs text-muted-foreground">Notes bénéficiaire</span>
                              <textarea
                                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={applicationDraft.notes}
                                onChange={(event) =>
                                  setApplicationDraft((current) =>
                                    current ? { ...current, notes: event.target.value } : current
                                  )
                                }
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-xs text-muted-foreground">Pièces / références</span>
                              <textarea
                                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={applicationDraft.proofs}
                                onChange={(event) =>
                                  setApplicationDraft((current) =>
                                    current ? { ...current, proofs: event.target.value } : current
                                  )
                                }
                              />
                            </label>
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={resetApplicationEditor}
                              disabled={isSavingApplication}
                            >
                              Annuler
                            </Button>
                            <Button
                              type="button"
                              onClick={async () => {
                                if (!applicationDraft) return;
                                setIsSavingApplication(true);
                                const saved = await onUpdateApplication(user.id, application.job.id, {
                                  status: applicationDraft.status,
                                  appliedAt: toIsoDate(applicationDraft.appliedAt) ?? application.appliedAt,
                                  notes: applicationDraft.notes,
                                  proofs: applicationDraft.proofs,
                                  interviewAt: toIsoDateTime(applicationDraft.interviewAt),
                                  interviewDetails: applicationDraft.interviewDetails,
                                  followUpEnabled: applicationDraft.followUpEnabled,
                                  followUpDueAt:
                                    toIsoDate(applicationDraft.followUpDueAt) ?? application.followUpDueAt,
                                  ...(isManual
                                    ? {
                                        job: {
                                          ...application.job,
                                          company: applicationDraft.company,
                                          title: applicationDraft.title,
                                          contractType: applicationDraft.contractType,
                                          location: applicationDraft.location,
                                          url: applicationDraft.url,
                                        },
                                      }
                                    : {}),
                                });
                                setIsSavingApplication(false);
                                if (saved) {
                                  resetApplicationEditor();
                                }
                              }}
                              disabled={
                                isSavingApplication ||
                                (isManual &&
                                  (!applicationDraft.company.trim() ||
                                    !applicationDraft.title.trim()))
                              }
                            >
                              {isSavingApplication ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Enregistrer les changements
                            </Button>
                          </div>
                        </div>
                      ) : (
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
                      )}

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
                            <p className="mb-1 font-medium text-foreground">Pièces / références</p>
                            <div className="max-h-40 overflow-y-auto pr-1">
                              <p className="whitespace-pre-wrap">{application.proofs || "Aucune preuve"}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4 rounded-lg border bg-background/80 p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-foreground">Note privée coach</p>
                            {privateCoachNote ? (
                              <span className="text-xs text-muted-foreground">
                                {formatCoachDate(privateCoachNote.updatedAt, true)}
                              </span>
                            ) : null}
                          </div>
                          {privateCoachNote ? (
                            <p className="text-xs text-muted-foreground">
                              Rédigée par {formatCoachAuthorName(privateCoachNote.createdBy)}
                              {privateCoachNote.contributors.length > 1
                                ? ` • Contributions: ${summarizeCoachContributors(
                                    privateCoachNote.contributors
                                  )}`
                                : ""}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Visible uniquement par les coachs et admins.
                            </p>
                          )}
                        </div>
                        <textarea
                          className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                          value={privateCoachNoteDraft}
                          onChange={(event) =>
                            setPrivateNoteDrafts((current) => ({
                              ...current,
                              [application.job.id]: event.target.value,
                            }))
                          }
                          placeholder="Note privée commune pour l'équipe coach..."
                        />
                        <div className="flex justify-end">
                         <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              void onSavePrivateCoachNote(
                                user.id,
                                application.job.id,
                                privateCoachNoteDraft
                              )
                            }
                            disabled={
                              savingCoachNoteKey === `private:${application.job.id}` ||
                              privateCoachNoteDraft === (privateCoachNote?.content ?? "")
                            }
                          >
                            {savingCoachNoteKey === `private:${application.job.id}` ? (
                              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Enregistrer
                          </Button>
                        </div>

                        <div className="space-y-3 border-t pt-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">Notes partagées</p>
                              <p className="text-xs text-muted-foreground">
                                Ces notes sont visibles par le bénéficiaire.
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-sky-600 text-white hover:bg-sky-700"
                              onClick={() =>
                                setNewSharedNoteDrafts((current) => ({
                                  ...current,
                                  [application.job.id]: current[application.job.id] ?? "",
                                }))
                              }
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Ajouter une note partagée
                            </Button>
                          </div>

                          {application.sharedCoachNotes && application.sharedCoachNotes.length > 0 ? (
                            <div className="space-y-3">
                              {application.sharedCoachNotes.map((note) => (
                                <div key={note.id} className="space-y-2 rounded-lg border bg-card p-3">
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Rédigée par {formatCoachAuthorName(note.createdBy)} •{" "}
                                      {formatCoachDate(note.updatedAt, true)}
                                    </p>
                                    {note.contributors.length > 1 ? (
                                      <p className="text-xs text-muted-foreground">
                                        Contributions: {summarizeCoachContributors(note.contributors)}
                                      </p>
                                    ) : null}
                                  </div>
                                  <textarea
                                    className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={getSharedDraft(note.id, note.content)}
                                    onChange={(event) =>
                                      setSharedNoteDrafts((current) => ({
                                        ...current,
                                        [note.id]: event.target.value,
                                      }))
                                    }
                                  />
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() =>
                                        setDeleteSharedTarget({
                                          jobId: application.job.id,
                                          noteId: note.id,
                                        })
                                      }
                                      disabled={savingCoachNoteKey === `delete:${note.id}`}
                                    >
                                      {savingCoachNoteKey === `delete:${note.id}` ? (
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                      )}
                                      Supprimer
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() =>
                                        void onUpdateSharedCoachNote(
                                          user.id,
                                          application.job.id,
                                          note.id,
                                          getSharedDraft(note.id, note.content)
                                        )
                                      }
                                      disabled={
                                        savingCoachNoteKey === `shared:${note.id}` ||
                                        getSharedDraft(note.id, note.content) === note.content
                                      }
                                    >
                                      {savingCoachNoteKey === `shared:${note.id}` ? (
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                      )}
                                      Enregistrer
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="bg-sky-600 text-white hover:bg-sky-700"
                                  onClick={() =>
                                    setNewSharedNoteDrafts((current) => ({
                                      ...current,
                                      [application.job.id]: current[application.job.id] ?? "",
                                    }))
                                  }
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Ajouter une note partagée
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Aucune note partagée pour l’instant.
                            </p>
                          )}

                          {Object.prototype.hasOwnProperty.call(newSharedNoteDrafts, application.job.id) && (
                            <div className="space-y-2 rounded-lg border border-dashed bg-card p-3">
                              <p className="text-sm font-medium text-foreground">Nouvelle note partagée</p>
                              <textarea
                                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={newSharedNoteDraft}
                                onChange={(event) =>
                                  setNewSharedNoteDrafts((current) => ({
                                    ...current,
                                    [application.job.id]: event.target.value,
                                  }))
                                }
                                placeholder="Message ou consigne visible par le bénéficiaire..."
                              />
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setNewSharedNoteDrafts((current) => {
                                      const next = { ...current };
                                      delete next[application.job.id];
                                      return next;
                                    })
                                  }
                                >
                                  Annuler
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={async () => {
                                    const created = await onCreateSharedCoachNote(
                                      user.id,
                                      application.job.id,
                                      newSharedNoteDraft
                                    );
                                    if (!created) return;

                                    setNewSharedNoteDrafts((current) => {
                                      const next = { ...current };
                                      delete next[application.job.id];
                                      return next;
                                    });
                                  }}
                                  disabled={
                                    savingCoachNoteKey === `create:${application.job.id}` ||
                                    !newSharedNoteDraft.trim()
                                  }
                                >
                                  {savingCoachNoteKey === `create:${application.job.id}` ? (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                  )}
                                  Ajouter
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
          <LocalPagination
            currentPage={effectivePage}
            pageCount={pageCount}
            totalCount={sortedApplications.length}
            pageSize={applicationsPageSize}
            itemLabel="candidatures"
            onPageChange={setCurrentPage}
          />
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Aucune candidature enregistrée pour cet utilisateur.
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(deleteApplicationTarget)}
        onOpenChange={(open) => !open && setDeleteApplicationTarget(null)}
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
            <Button type="button" variant="outline" onClick={() => setDeleteApplicationTarget(null)}>
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
                    resetApplicationEditor();
                  }
                  setDeleteApplicationTarget(null);
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
        onOpenChange={(open) => !open && setDeleteSharedTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer la note partagée</DialogTitle>
            <DialogDescription>
              Cette note ne sera plus visible par le bénéficiaire. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteSharedTarget(null)}>
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
                  setDeleteSharedTarget(null);
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

function toEditableDate(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function toEditableDateTime(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 16);
}

function toIsoDate(value: string) {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function toIsoDateTime(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

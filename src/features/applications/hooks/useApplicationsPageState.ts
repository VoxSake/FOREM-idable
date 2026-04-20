"use client";

import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { useApplications } from "@/hooks/useApplications";
import {
  ApplicationModeFilter,
  countClosedApplications,
  countUpcomingInterviews,
  filterApplications,
  getApplicationsDueSummary,
  getLatestSharedCoachNoteAt,
  isApplicationFollowUpDue,
  isFollowUpEnabled,
  shouldShowFollowUpDetails,
} from "@/features/applications/utils";
import {
  markCoachNoteView,
  useCoachNoteViews,
} from "@/features/applications/coachNoteViews";
import { exportApplicationsToCSV } from "@/lib/exportApplicationsCsv";
import { exportInterviewsToICS } from "@/lib/exportApplicationsIcs";
import { ApplicationStatus, JobApplication } from "@/types/application";
import {
  InterviewFormState,
} from "@/features/applications/components/InterviewDialog";
import {
  ManualApplicationFormState,
} from "@/features/applications/components/ManualApplicationDialog";

const APPLICATIONS_PAGE_SIZE = 20;

type BulkDialogAction =
  | "delete-selected"
  | "disable-followup-selected"
  | "enable-followup-selected"
  | "change-status-selected"
  | null;

function createManualForm(): ManualApplicationFormState {
  return {
    company: "",
    title: "",
    contractType: "",
    location: "",
    appliedAt: format(new Date(), "yyyy-MM-dd"),
    status: "in_progress",
    notes: "",
    proofs: "",
    url: "",
  };
}

function createEmptyInterviewForm(): InterviewFormState {
  return {
    interviewAt: "",
    interviewDetails: "",
  };
}

function formatApplicationsCount(count: number) {
  return `${count} candidature${count > 1 ? "s" : ""}`;
}

export function useApplicationsPageState() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    applications,
    addManualApplication,
    markAsInProgress: persistInProgress,
    markAsAccepted: persistAccepted,
    markAsRejected: persistRejected,
    markAsFollowUp: persistFollowUp,
    scheduleInterview: persistInterview,
    clearInterview: persistInterviewClear,
    saveNotes,
    saveProofs,
    updateManualApplicationDetails,
    markFollowUpDone: persistFollowUpDone,
    updateFollowUpSettings,
    removeApplication,
    patchApplication,
    isLoaded,
  } = useApplications();
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [bulkDialogAction, setBulkDialogAction] = useState<BulkDialogAction>(null);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<ApplicationStatus | null>(null);
  const [isBulkMutating, setIsBulkMutating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [interviewJobId, setInterviewJobId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<ApplicationModeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [manualForm, setManualForm] = useState<ManualApplicationFormState>(createManualForm);
  const [interviewForm, setInterviewForm] = useState<InterviewFormState>(createEmptyInterviewForm);
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [proofsDrafts, setProofsDrafts] = useState<Record<string, string>>({});
  const now = useMemo(() => new Date(), []);
  const coachNoteViews = useCoachNoteViews(user?.id);

  const hasUnreadCoachUpdate = useCallback((application: JobApplication) => {
    const latestSharedNoteAt = getLatestSharedCoachNoteAt(application);
    if (!latestSharedNoteAt) return false;
    const seenAt = coachNoteViews[application.job.id];
    if (!seenAt) return true;
    return new Date(latestSharedNoteAt).getTime() > new Date(seenAt).getTime();
  }, [coachNoteViews]);

  const dueCount = useMemo(
    () => applications.filter((entry) => isApplicationFollowUpDue(entry)).length,
    [applications]
  );
  const dueSummary = useMemo(() => getApplicationsDueSummary(applications), [applications]);
  const upcomingInterviewCount = useMemo(
    () => countUpcomingInterviews(applications, now),
    [applications, now]
  );
  const closedCount = useMemo(() => countClosedApplications(applications), [applications]);
  const unreadCoachUpdateCount = useMemo(
    () => applications.filter((entry) => hasUnreadCoachUpdate(entry)).length,
    [applications, hasUnreadCoachUpdate]
  );
  const hasCoachContext = useMemo(
    () => applications.some((entry) => (entry.sharedCoachNotes?.length ?? 0) > 0),
    [applications]
  );
  const filteredApplications = useMemo(() => {
    return filterApplications(applications, {
      search,
      modeFilter,
      hasUnreadCoachUpdate,
    });
  }, [applications, hasUnreadCoachUpdate, modeFilter, search]);
  const applicationsPageCount = Math.max(
    1,
    Math.ceil(filteredApplications.length / APPLICATIONS_PAGE_SIZE)
  );
  const effectiveApplicationsPage = Math.min(currentPage, applicationsPageCount);
  const paginatedApplications = useMemo(() => {
    const start = (effectiveApplicationsPage - 1) * APPLICATIONS_PAGE_SIZE;
    return filteredApplications.slice(start, start + APPLICATIONS_PAGE_SIZE);
  }, [effectiveApplicationsPage, filteredApplications]);

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
  const currentNotesDraft = selectedApplication
    ? notesDrafts[selectedApplication.job.id] ?? (selectedApplication.notes ?? "")
    : "";
  const currentProofsDraft = selectedApplication
    ? proofsDrafts[selectedApplication.job.id] ?? (selectedApplication.proofs ?? "")
    : "";

  const isAllSelected = useMemo(
    () =>
      filteredApplications.length > 0 &&
      filteredApplications.every((app) => selectedJobIds.has(app.job.id)),
    [filteredApplications, selectedJobIds]
  );

  const selectedFollowUpCount = useMemo(
    () =>
      applications.filter(
        (app) =>
          selectedJobIds.has(app.job.id) &&
          isFollowUpEnabled(app) &&
          shouldShowFollowUpDetails(app.status)
      ).length,
    [applications, selectedJobIds]
  );

  const selectedFollowUpDisabledCount = useMemo(
    () =>
      applications.filter(
        (app) =>
          selectedJobIds.has(app.job.id) &&
          !isFollowUpEnabled(app) &&
          shouldShowFollowUpDetails(app.status)
      ).length,
    [applications, selectedJobIds]
  );

  const resetManualForm = useCallback(() => {
    setManualForm(createManualForm());
  }, []);

  const resetInterviewDialog = useCallback(() => {
    setInterviewJobId(null);
    setInterviewForm(createEmptyInterviewForm());
  }, []);

  const notifyActionError = useCallback((message: string) => {
    toast.error(message, { description: "Candidatures" });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleModeFilterChange = useCallback((value: ApplicationModeFilter) => {
    setModeFilter(value);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setModeFilter("all");
    setCurrentPage(1);
  }, []);

  const markCoachUpdateSeen = useCallback((application: JobApplication | null) => {
    if (!application) return;
    markCoachNoteView(user?.id, application.job.id, getLatestSharedCoachNoteAt(application));
  }, [user?.id]);

  const openDetails = useCallback((jobId: string) => {
    setDetailsJobId(jobId);
    markCoachUpdateSeen(applications.find((entry) => entry.job.id === jobId) ?? null);
  }, [applications, markCoachUpdateSeen]);

  const applyStatus = useCallback((jobId: string, status: ApplicationStatus) => {
    void (async () => {
      if (status === "accepted") {
        const saved = await persistAccepted(jobId);
        if (!saved) notifyActionError("Impossible de passer la candidature en acceptée.");
        return;
      }
      if (status === "rejected") {
        const saved = await persistRejected(jobId);
        if (!saved) notifyActionError("Impossible de passer la candidature en refusée.");
        return;
      }
      if (status === "follow_up") {
        const saved = await persistFollowUp(jobId);
        if (!saved) notifyActionError("Impossible de marquer la candidature en relance.");
        return;
      }
      if (status === "interview") {
        const existing = applications.find((entry) => entry.job.id === jobId);
        if (existing?.interviewAt) {
          const saved = await persistInterview(
            jobId,
            existing.interviewAt,
            existing.interviewDetails ?? undefined
          );
          if (!saved) notifyActionError("Impossible de mettre à jour l'entretien.");
        } else {
          setInterviewJobId(jobId);
          setInterviewForm({
            interviewAt: "",
            interviewDetails: existing?.interviewDetails ?? "",
          });
        }
        return;
      }

      const saved = await persistInProgress(jobId);
      if (!saved) notifyActionError("Impossible de repasser la candidature en cours.");
    })();
  }, [
    applications,
    notifyActionError,
    persistAccepted,
    persistFollowUp,
    persistInProgress,
    persistInterview,
    persistRejected,
  ]);

  const toggleSelection = useCallback((jobId: string) => {
    setSelectedJobIds((current) => {
      const next = new Set(current);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(filteredApplications.map((app) => app.job.id)));
    }
  }, [filteredApplications, isAllSelected]);

  const clearSelection = useCallback(() => {
    setSelectedJobIds(new Set());
  }, []);

  const removeSelected = useCallback(() => {
    if (selectedJobIds.size === 0 || isBulkMutating) return;
    setBulkDialogAction("delete-selected");
  }, [isBulkMutating, selectedJobIds]);

  const confirmBulkDeleteSelected = useCallback(async () => {
    if (selectedJobIds.size === 0 || isBulkMutating) return;

    setIsBulkMutating(true);
    try {
      const results = await Promise.all(
        [...selectedJobIds].map(async (jobId) => ({
          jobId,
          ok: await removeApplication(jobId),
        }))
      );
      const failedIds = results.filter((entry) => !entry.ok).map((entry) => entry.jobId);
      const successIds = results.filter((entry) => entry.ok).map((entry) => entry.jobId);

      if (successIds.length > 0 && detailsJobId && successIds.includes(detailsJobId)) {
        setDetailsJobId(null);
      }

      setSelectedJobIds(new Set(failedIds));
      setBulkDialogAction(null);

      if (successIds.length === results.length) {
        toast.success(`${formatApplicationsCount(successIds.length)} supprimée${successIds.length > 1 ? "s" : ""}.`);
        return;
      }

      if (successIds.length > 0) {
        toast.error("Suppression partielle de la sélection.", {
          description: `${formatApplicationsCount(successIds.length)} supprimée${successIds.length > 1 ? "s" : ""}, ${formatApplicationsCount(failedIds.length)} en échec.`,
        });
        return;
      }

      notifyActionError("Impossible de supprimer la sélection.");
    } finally {
      setIsBulkMutating(false);
    }
  }, [detailsJobId, isBulkMutating, notifyActionError, removeApplication, selectedJobIds]);

  const openDisableFollowUpDialog = useCallback(() => {
    if (selectedFollowUpCount === 0 || isBulkMutating) return;
    setBulkDialogAction("disable-followup-selected");
  }, [isBulkMutating, selectedFollowUpCount]);

  const openEnableFollowUpDialog = useCallback(() => {
    if (selectedFollowUpDisabledCount === 0 || isBulkMutating) return;
    setBulkDialogAction("enable-followup-selected");
  }, [isBulkMutating, selectedFollowUpDisabledCount]);

  const openChangeStatusDialog = useCallback((status: ApplicationStatus) => {
    if (selectedJobIds.size === 0 || isBulkMutating) return;
    setBulkTargetStatus(status);
    setBulkDialogAction("change-status-selected");
  }, [isBulkMutating, selectedJobIds]);

  const disableFollowUpForSelected = useCallback(async () => {
    if (isBulkMutating) return;

    const applicationsToDisable = applications.filter(
      (app) =>
        selectedJobIds.has(app.job.id) &&
        isFollowUpEnabled(app) &&
        shouldShowFollowUpDetails(app.status)
    );

    if (applicationsToDisable.length === 0) {
      setBulkDialogAction(null);
      notifyActionError("Aucune candidature avec relance active dans la sélection.");
      return;
    }

    setIsBulkMutating(true);
    try {
      const results = await Promise.all(
        applicationsToDisable.map(async (app) => ({
          jobId: app.job.id,
          ok: await updateFollowUpSettings(app.job.id, {
            enabled: false,
            dueAt: app.followUpDueAt,
            status: app.status,
          }),
        }))
      );
      const failedIds = results.filter((entry) => !entry.ok).map((entry) => entry.jobId);
      const successCount = results.length - failedIds.length;

      setSelectedJobIds(new Set(failedIds));
      setBulkDialogAction(null);

      if (successCount === results.length) {
        toast.success(`Relance désactivée pour ${formatApplicationsCount(successCount)}.`);
        return;
      }

      if (successCount > 0) {
        toast.error("Désactivation partielle des relances.", {
          description: `${formatApplicationsCount(successCount)} mise${successCount > 1 ? "s" : ""} à jour, ${formatApplicationsCount(failedIds.length)} en échec.`,
        });
        return;
      }

      notifyActionError("Impossible de désactiver les relances sélectionnées.");
    } finally {
      setIsBulkMutating(false);
    }
  }, [applications, isBulkMutating, notifyActionError, selectedJobIds, updateFollowUpSettings]);

  const enableFollowUpForSelected = useCallback(async () => {
    if (isBulkMutating) return;

    const applicationsToEnable = applications.filter(
      (app) =>
        selectedJobIds.has(app.job.id) &&
        !isFollowUpEnabled(app) &&
        shouldShowFollowUpDetails(app.status)
    );

    if (applicationsToEnable.length === 0) {
      setBulkDialogAction(null);
      notifyActionError("Aucune candidature avec relance désactivée dans la sélection.");
      return;
    }

    setIsBulkMutating(true);
    try {
      const results = await Promise.all(
        applicationsToEnable.map(async (app) => ({
          jobId: app.job.id,
          ok: await updateFollowUpSettings(app.job.id, {
            enabled: true,
            dueAt: app.followUpDueAt,
            status: app.status,
          }),
        }))
      );
      const failedIds = results.filter((entry) => !entry.ok).map((entry) => entry.jobId);
      const successCount = results.length - failedIds.length;

      setSelectedJobIds(new Set(failedIds));
      setBulkDialogAction(null);

      if (successCount === results.length) {
        toast.success(`Relance réactivée pour ${formatApplicationsCount(successCount)}.`);
        return;
      }

      if (successCount > 0) {
        toast.error("Réactivation partielle des relances.", {
          description: `${formatApplicationsCount(successCount)} mise${successCount > 1 ? "s" : ""} à jour, ${formatApplicationsCount(failedIds.length)} en échec.`,
        });
        return;
      }

      notifyActionError("Impossible de réactiver les relances sélectionnées.");
    } finally {
      setIsBulkMutating(false);
    }
  }, [applications, isBulkMutating, notifyActionError, selectedJobIds, updateFollowUpSettings]);

  const confirmBulkChangeStatus = useCallback(async () => {
    if (isBulkMutating) return;
    if (!bulkTargetStatus) return;

    if (bulkTargetStatus === "interview") {
      setBulkDialogAction(null);
      setBulkTargetStatus(null);
      notifyActionError("Le statut Entretien doit être défini avec une date.");
      return;
    }

    setIsBulkMutating(true);
    try {
      const results = await Promise.all(
        [...selectedJobIds].map(async (jobId) => ({
          jobId,
          ok: await patchApplication(jobId, {
            status: bulkTargetStatus,
            interviewAt: null,
            interviewDetails: null,
          }),
        }))
      );
      const failedIds = results.filter((entry) => !entry.ok).map((entry) => entry.jobId);
      const successCount = results.length - failedIds.length;

      setSelectedJobIds(new Set(failedIds));
      setBulkDialogAction(null);
      setBulkTargetStatus(null);

      if (successCount === results.length) {
        toast.success(`Statut mis à jour pour ${formatApplicationsCount(successCount)}.`);
        return;
      }

      if (successCount > 0) {
        toast.error("Mise à jour partielle du statut.", {
          description: `${formatApplicationsCount(successCount)} mise${successCount > 1 ? "s" : ""} à jour, ${formatApplicationsCount(failedIds.length)} en échec.`,
        });
        return;
      }

      notifyActionError("Impossible de modifier le statut de la sélection.");
    } finally {
      setIsBulkMutating(false);
    }
  }, [bulkTargetStatus, isBulkMutating, notifyActionError, patchApplication, selectedJobIds]);

  const submitManualForm = useCallback(async () => {
    if (!manualForm.company.trim() || !manualForm.title.trim()) return;

    const saved = await addManualApplication({
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
    if (!saved) {
      notifyActionError("Impossible d'ajouter la candidature manuelle.");
      return;
    }

    resetManualForm();
    setIsCreateOpen(false);
  }, [addManualApplication, manualForm, notifyActionError, resetManualForm]);

  const openInterviewModal = useCallback((application: JobApplication) => {
    const date = application.interviewAt ? new Date(application.interviewAt) : null;
    const interviewAt =
      date && !Number.isNaN(date.getTime()) ? format(date, "yyyy-MM-dd'T'HH:mm") : "";

    setInterviewJobId(application.job.id);
    setInterviewForm({
      interviewAt,
      interviewDetails: application.interviewDetails ?? "",
    });
  }, []);

  const submitInterview = useCallback(async () => {
    if (!interviewApplication || !interviewForm.interviewAt) return;

    const interviewAt = new Date(interviewForm.interviewAt);
    if (Number.isNaN(interviewAt.getTime())) return;

    const saved = await persistInterview(
      interviewApplication.job.id,
      interviewAt.toISOString(),
      interviewForm.interviewDetails.trim()
    );
    if (saved) {
      resetInterviewDialog();
      return;
    }
    notifyActionError("Impossible d'enregistrer l'entretien.");
  }, [interviewApplication, interviewForm, notifyActionError, persistInterview, resetInterviewDialog]);

  const removeInterview = useCallback(async () => {
    if (!interviewApplication) return;
    const cleared = await persistInterviewClear(interviewApplication.job.id);
    if (cleared) {
      resetInterviewDialog();
      return;
    }
    notifyActionError("Impossible de supprimer l'entretien.");
  }, [interviewApplication, notifyActionError, persistInterviewClear, resetInterviewDialog]);

  const saveSelectedNotes = useCallback(async () => {
    if (!selectedApplication) return;
    const saved = await saveNotes(selectedApplication.job.id, currentNotesDraft);
    if (!saved) {
      notifyActionError("Impossible d'enregistrer les notes.");
      return;
    }
    setNotesDrafts((current) => {
      const next = { ...current };
      delete next[selectedApplication.job.id];
      return next;
    });
  }, [currentNotesDraft, notifyActionError, saveNotes, selectedApplication]);

  const saveSelectedProofs = useCallback(async () => {
    if (!selectedApplication) return;
    const saved = await saveProofs(selectedApplication.job.id, currentProofsDraft);
    if (!saved) {
      notifyActionError("Impossible d'enregistrer les preuves.");
      return;
    }
    setProofsDrafts((current) => {
      const next = { ...current };
      delete next[selectedApplication.job.id];
      return next;
    });
  }, [currentProofsDraft, notifyActionError, saveProofs, selectedApplication]);

  const confirmDelete = useCallback(() => {
    if (!deleteApplication) return;
    void (async () => {
      const deleted = await removeApplication(deleteApplication.job.id);
      if (!deleted) {
        notifyActionError("Impossible de supprimer la candidature.");
        return;
      }

      if (detailsJobId === deleteApplication.job.id) setDetailsJobId(null);
      setDeleteJobId(null);
    })();
  }, [deleteApplication, detailsJobId, notifyActionError, removeApplication]);

  const markFollowUpDone = useCallback((jobId: string) => {
    void (async () => {
      const saved = await persistFollowUpDone(jobId);
      if (!saved) {
        notifyActionError("Impossible d'enregistrer la relance.");
      }
    })();
  }, [notifyActionError, persistFollowUpDone]);

  return {
    user,
    isAuthLoading,
    isLoaded,
    applications,
    filteredApplications,
    paginatedApplications,
    selectedJobIds,
    isAllSelected,
    selectedFollowUpCount,
    selectedFollowUpDisabledCount,
    bulkDialogAction,
    bulkTargetStatus,
    isBulkMutating,
    isCreateOpen,
    detailsJobId,
    deleteJobId,
    interviewJobId,
    search,
    modeFilter,
    currentPage,
    manualForm,
    interviewForm,
    now,
    dueCount,
    dueSummary,
    upcomingInterviewCount,
    closedCount,
    unreadCoachUpdateCount,
    hasCoachContext,
    pageSize: APPLICATIONS_PAGE_SIZE,
    applicationsPageCount,
    effectiveApplicationsPage,
    selectedApplication,
    deleteApplication,
    interviewApplication,
    currentNotesDraft,
    currentProofsDraft,
    hasUnreadCoachUpdate,
    setIsCreateOpen,
    setDetailsJobId,
    setDeleteJobId,
    setBulkDialogAction,
    setBulkTargetStatus,
    setInterviewForm,
    setManualForm,
    setCurrentPage,
    setNotesDrafts,
    setProofsDrafts,
    handleSearchChange,
    handleModeFilterChange,
    resetFilters,
    openDetails,
    applyStatus,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    removeSelected,
    confirmBulkDeleteSelected,
    openDisableFollowUpDialog,
    openEnableFollowUpDialog,
    openChangeStatusDialog,
    disableFollowUpForSelected,
    enableFollowUpForSelected,
    confirmBulkChangeStatus,
    submitManualForm,
    openInterviewModal,
    submitInterview,
    removeInterview,
    saveSelectedNotes,
    saveSelectedProofs,
    confirmDelete,
    resetManualForm,
    resetInterviewDialog,
    markFollowUpDone,
    updateManualApplicationDetails,
    updateFollowUpSettings,
    exportApplications: () => exportApplicationsToCSV(filteredApplications),
    exportCalendar: () => exportInterviewsToICS(filteredApplications),
  };
}

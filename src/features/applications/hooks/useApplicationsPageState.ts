"use client";

import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
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

export function useApplicationsPageState() {
  const { user, isLoading: isAuthLoading } = useAuth();
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
    updateManualApplicationDetails,
    markFollowUpDone,
    updateFollowUpSettings,
    removeApplication,
    isLoaded,
  } = useApplications();
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
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

  const resetManualForm = useCallback(() => {
    setManualForm(createManualForm());
  }, []);

  const resetInterviewDialog = useCallback(() => {
    setInterviewJobId(null);
    setInterviewForm(createEmptyInterviewForm());
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
    if (status === "accepted") {
      void markAsAccepted(jobId);
      return;
    }
    if (status === "rejected") {
      void markAsRejected(jobId);
      return;
    }
    if (status === "follow_up") {
      void markAsFollowUp(jobId);
      return;
    }
    if (status === "interview") {
      const existing = applications.find((entry) => entry.job.id === jobId);
      if (existing?.interviewAt) {
        void scheduleInterview(jobId, existing.interviewAt, existing.interviewDetails ?? undefined);
      } else {
        setInterviewJobId(jobId);
        setInterviewForm({
          interviewAt: "",
          interviewDetails: existing?.interviewDetails ?? "",
        });
      }
      return;
    }

    void markAsInProgress(jobId);
  }, [applications, markAsAccepted, markAsFollowUp, markAsInProgress, markAsRejected, scheduleInterview]);

  const toggleSelection = useCallback((jobId: string) => {
    setSelectedJobIds((current) => {
      const next = new Set(current);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const removeSelected = useCallback(() => {
    for (const jobId of selectedJobIds) {
      void removeApplication(jobId);
    }
    setSelectedJobIds(new Set());
  }, [removeApplication, selectedJobIds]);

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
    if (!saved) return;

    resetManualForm();
    setIsCreateOpen(false);
  }, [addManualApplication, manualForm, resetManualForm]);

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

    const saved = await scheduleInterview(
      interviewApplication.job.id,
      interviewAt.toISOString(),
      interviewForm.interviewDetails.trim()
    );
    if (saved) {
      resetInterviewDialog();
    }
  }, [interviewApplication, interviewForm, resetInterviewDialog, scheduleInterview]);

  const removeInterview = useCallback(async () => {
    if (!interviewApplication) return;
    const cleared = await clearInterview(interviewApplication.job.id);
    if (cleared) {
      resetInterviewDialog();
    }
  }, [clearInterview, interviewApplication, resetInterviewDialog]);

  const saveSelectedNotes = useCallback(async () => {
    if (!selectedApplication) return;
    const saved = await saveNotes(selectedApplication.job.id, currentNotesDraft);
    if (!saved) return;
    setNotesDrafts((current) => {
      const next = { ...current };
      delete next[selectedApplication.job.id];
      return next;
    });
  }, [currentNotesDraft, saveNotes, selectedApplication]);

  const saveSelectedProofs = useCallback(async () => {
    if (!selectedApplication) return;
    const saved = await saveProofs(selectedApplication.job.id, currentProofsDraft);
    if (!saved) return;
    setProofsDrafts((current) => {
      const next = { ...current };
      delete next[selectedApplication.job.id];
      return next;
    });
  }, [currentProofsDraft, saveProofs, selectedApplication]);

  const confirmDelete = useCallback(() => {
    if (!deleteApplication) return;
    void removeApplication(deleteApplication.job.id);
    if (detailsJobId === deleteApplication.job.id) setDetailsJobId(null);
    setDeleteJobId(null);
  }, [deleteApplication, detailsJobId, removeApplication]);

  return {
    user,
    isAuthLoading,
    isLoaded,
    applications,
    filteredApplications,
    paginatedApplications,
    selectedJobIds,
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
    removeSelected,
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

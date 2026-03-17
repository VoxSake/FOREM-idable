"use client";

import { useCallback, useMemo, useState } from "react";
import { format, isAfter, isBefore } from "date-fns";
import { BriefcaseBusiness, Clock3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalPagination } from "@/components/ui/local-pagination";
import { useAuth } from "@/components/auth/AuthProvider";
import { AccountAccessPrompt } from "@/components/auth/AccountAccessPrompt";
import { useApplications } from "@/hooks/useApplications";
import { ApplicationsHeaderControls } from "@/features/applications/components/ApplicationsHeaderControls";
import { ApplicationsInsights } from "@/features/applications/components/ApplicationsInsights";
import { ApplicationCard } from "@/features/applications/components/ApplicationCard";
import { ApplicationDetailsSheet } from "@/features/applications/components/ApplicationDetailsSheet";
import {
  DeleteApplicationDialog,
} from "@/features/applications/components/DeleteApplicationDialog";
import {
  InterviewDialog,
  InterviewFormState,
} from "@/features/applications/components/InterviewDialog";
import {
  ManualApplicationDialog,
  ManualApplicationFormState,
} from "@/features/applications/components/ManualApplicationDialog";
import {
  ApplicationModeFilter,
  getLatestSharedCoachNoteAt,
  isFollowUpPending,
  isManualApplication,
  sortApplicationsByMostRecent,
} from "@/features/applications/utils";
import {
  markCoachNoteView,
  useCoachNoteViews,
} from "@/features/applications/coachNoteViews";
import { exportApplicationsToCSV } from "@/lib/exportApplicationsCsv";
import { exportInterviewsToICS } from "@/lib/exportApplicationsIcs";
import { ApplicationStatus, JobApplication } from "@/types/application";

const createManualForm = (): ManualApplicationFormState => ({
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

const emptyInterviewForm: InterviewFormState = {
  interviewAt: "",
  interviewDetails: "",
};

const APPLICATIONS_PAGE_SIZE = 20;

export default function ApplicationsPage() {
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
    removeApplication,
    isLoaded,
  } = useApplications();
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [interviewJobId, setInterviewJobId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [modeFilter, setModeFilter] = useState<ApplicationModeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [manualForm, setManualForm] = useState<ManualApplicationFormState>(createManualForm);
  const [interviewForm, setInterviewForm] = useState<InterviewFormState>(emptyInterviewForm);
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

  const dueCount = applications.filter(
    (entry) => isFollowUpPending(entry.status) && !isAfter(new Date(entry.followUpDueAt), now)
  ).length;
  const upcomingInterviewCount = applications.filter((entry) => {
    if (!entry.interviewAt) return false;
    const interviewDate = new Date(entry.interviewAt);
    return !Number.isNaN(interviewDate.getTime()) && !isBefore(interviewDate, now);
  }).length;
  const closedCount = applications.filter(
    (entry) => entry.status === "accepted" || entry.status === "rejected"
  ).length;

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return sortApplicationsByMostRecent(
      applications.filter((entry) => {
        if (statusFilter !== "all" && entry.status !== statusFilter) return false;

        if (modeFilter === "due") {
          const dueDate = new Date(entry.followUpDueAt);
          if (
            !isFollowUpPending(entry.status) ||
            Number.isNaN(dueDate.getTime()) ||
            isAfter(dueDate, now)
          ) {
            return false;
          }
        }

        if (modeFilter === "interviews" && !entry.interviewAt) return false;
        if (modeFilter === "manual" && !isManualApplication(entry)) return false;
        if (modeFilter === "coach_updates" && !hasUnreadCoachUpdate(entry)) return false;
        if (!normalizedSearch) return true;

        return [
          entry.job.company || "",
          entry.job.title,
          entry.job.location,
          entry.job.contractType,
          entry.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
    );
  }, [applications, hasUnreadCoachUpdate, modeFilter, now, search, statusFilter]);

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

  const markCoachUpdateSeen = (application: JobApplication | null) => {
    if (!application) return;
    markCoachNoteView(user?.id, application.job.id, getLatestSharedCoachNoteAt(application));
  };

  const unreadCoachUpdateCount = applications.filter((entry) => hasUnreadCoachUpdate(entry)).length;

  if (isAuthLoading || !isLoaded) return null;

  if (!user) {
    return (
      <AccountAccessPrompt
        title="Candidatures"
        description="Connectez-vous pour suivre vos candidatures, relances, entretiens et notes dans un espace dédié."
        summary="Avec un compte, vous retrouvez automatiquement vos candidatures et votre historique de recherche, et vous pouvez partager votre suivi avec un coach si besoin."
      />
    );
  }

  const resetManualForm = () => {
    setManualForm(createManualForm());
  };

  const resetInterviewDialog = () => {
    setInterviewJobId(null);
    setInterviewForm(emptyInterviewForm);
  };

  const applyStatus = (jobId: string, status: ApplicationStatus) => {
    if (status === "accepted") {
      markAsAccepted(jobId);
      return;
    }
    if (status === "rejected") {
      markAsRejected(jobId);
      return;
    }
    if (status === "follow_up") {
      markAsFollowUp(jobId);
      return;
    }
    if (status === "interview") {
      const existing = applications.find((entry) => entry.job.id === jobId);
      if (existing?.interviewAt) {
        scheduleInterview(jobId, existing.interviewAt, existing.interviewDetails ?? undefined);
      } else {
        setInterviewJobId(jobId);
        setInterviewForm({
          interviewAt: "",
          interviewDetails: existing?.interviewDetails ?? "",
        });
      }
      return;
    }

    markAsInProgress(jobId);
  };

  const toggleSelection = (jobId: string) => {
    setSelectedJobIds((current) => {
      const next = new Set(current);
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

  const openInterviewModal = (application: JobApplication) => {
    const date = application.interviewAt ? new Date(application.interviewAt) : null;
    const interviewAt =
      date && !Number.isNaN(date.getTime()) ? format(date, "yyyy-MM-dd'T'HH:mm") : "";

    setInterviewJobId(application.job.id);
    setInterviewForm({
      interviewAt,
      interviewDetails: application.interviewDetails ?? "",
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
    resetInterviewDialog();
  };

  const removeInterview = () => {
    if (!interviewApplication) return;
    clearInterview(interviewApplication.job.id);
    resetInterviewDialog();
  };

  const currentNotesDraft =
    selectedApplication ? notesDrafts[selectedApplication.job.id] ?? (selectedApplication.notes ?? "") : "";
  const currentProofsDraft =
    selectedApplication ? proofsDrafts[selectedApplication.job.id] ?? (selectedApplication.proofs ?? "") : "";

  const saveSelectedNotes = async () => {
    if (!selectedApplication) return;
    const saved = await saveNotes(selectedApplication.job.id, currentNotesDraft);
    if (!saved) return;
    setNotesDrafts((current) => {
      const next = { ...current };
      delete next[selectedApplication.job.id];
      return next;
    });
  };

  const saveSelectedProofs = async () => {
    if (!selectedApplication) return;
    const saved = await saveProofs(selectedApplication.job.id, currentProofsDraft);
    if (!saved) return;
    setProofsDrafts((current) => {
      const next = { ...current };
      delete next[selectedApplication.job.id];
      return next;
    });
  };

  const confirmDelete = () => {
    if (!deleteApplication) return;
    removeApplication(deleteApplication.job.id);
    if (detailsJobId === deleteApplication.job.id) setDetailsJobId(null);
    setDeleteJobId(null);
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

      <ApplicationsHeaderControls
        displayedCount={filteredApplications.length}
        totalCount={applications.length}
        dueCount={dueCount}
        selectedCount={selectedJobIds.size}
        canExportCalendar={filteredApplications.some((entry) => entry.interviewAt)}
        onCreateManual={() => setIsCreateOpen(true)}
        onExportCsv={() => exportApplicationsToCSV(filteredApplications)}
        onExportCalendar={() => exportInterviewsToICS(filteredApplications)}
        onRemoveSelected={removeSelected}
      />

      <ApplicationsInsights
        totalCount={applications.length}
        dueCount={dueCount}
        upcomingInterviewCount={upcomingInterviewCount}
        closedCount={closedCount}
        coachUpdateCount={unreadCoachUpdateCount}
        search={search}
        statusFilter={statusFilter}
        modeFilter={modeFilter}
        onSearchChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}
        onModeFilterChange={(value) => {
          setModeFilter(value);
          setCurrentPage(1);
        }}
      />

      {filteredApplications.length > 0 ? (
        <>
          <div className="grid gap-3 xl:grid-cols-2">
            {paginatedApplications.map((application) => (
              <ApplicationCard
                key={application.job.id}
                application={application}
                now={now}
                isSelected={selectedJobIds.has(application.job.id)}
                hasUnreadCoachUpdate={hasUnreadCoachUpdate(application)}
                onToggleSelection={toggleSelection}
                onOpenDetails={(jobId) => {
                  setDetailsJobId(jobId);
                  markCoachUpdateSeen(applications.find((entry) => entry.job.id === jobId) ?? null);
                }}
                onApplyStatus={applyStatus}
                onMarkFollowUpDone={markFollowUpDone}
                onOpenInterview={openInterviewModal}
              />
            ))}
          </div>
          <LocalPagination
            currentPage={effectiveApplicationsPage}
            pageCount={applicationsPageCount}
            totalCount={filteredApplications.length}
            pageSize={APPLICATIONS_PAGE_SIZE}
            itemLabel="candidatures"
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-card rounded-xl border border-dashed border-border mt-8">
          <BriefcaseBusiness className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium text-lg">
            {applications.length === 0
              ? "Aucune candidature suivie pour le moment."
              : "Aucune candidature ne correspond aux filtres actuels."}
          </p>
          <p className="text-sm text-muted-foreground/70 text-center max-w-md">
            {applications.length === 0
              ? "Utilisez le bouton de candidature depuis les résultats ou encodez une candidature faite ailleurs."
              : "Ajustez la recherche ou les filtres pour retrouver vos candidatures."}
          </p>
          {applications.length === 0 ? (
            <Button type="button" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Encoder une candidature externe
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setModeFilter("all");
              }}
            >
              Réinitialiser les filtres
            </Button>
          )}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <Clock3 className="h-3.5 w-3.5" />
            Les relances sont mises en avant 7 jours après l&apos;envoi.
          </div>
        </div>
      )}

      <ApplicationDetailsSheet
        application={selectedApplication}
        open={Boolean(selectedApplication)}
        hasUnreadCoachUpdate={selectedApplication ? hasUnreadCoachUpdate(selectedApplication) : false}
        notesDraft={currentNotesDraft}
        proofsDraft={currentProofsDraft}
        onOpenChange={(open) => {
          if (!open) setDetailsJobId(null);
        }}
        onApplyStatus={applyStatus}
        onNotesDraftChange={(value) =>
          selectedApplication
            ? setNotesDrafts((current) => ({ ...current, [selectedApplication.job.id]: value }))
            : undefined
        }
        onProofsDraftChange={(value) =>
          selectedApplication
            ? setProofsDrafts((current) => ({ ...current, [selectedApplication.job.id]: value }))
            : undefined
        }
        onSaveNotes={saveSelectedNotes}
        onSaveProofs={saveSelectedProofs}
        onSaveManualDetails={(input) =>
          selectedApplication
            ? updateManualApplicationDetails(selectedApplication.job.id, selectedApplication.job, input)
            : Promise.resolve(false)
        }
        onMarkFollowUpDone={markFollowUpDone}
        onOpenInterview={openInterviewModal}
        onRequestDelete={setDeleteJobId}
      />

      <ManualApplicationDialog
        open={isCreateOpen}
        form={manualForm}
        onOpenChange={setIsCreateOpen}
        onFormChange={setManualForm}
        onCancel={() => {
          resetManualForm();
          setIsCreateOpen(false);
        }}
        onSubmit={submitManualForm}
      />

      <InterviewDialog
        application={interviewApplication}
        open={Boolean(interviewApplication)}
        form={interviewForm}
        onOpenChange={(open) => {
          if (!open) resetInterviewDialog();
        }}
        onFormChange={setInterviewForm}
        onRemove={removeInterview}
        onCancel={resetInterviewDialog}
        onSubmit={submitInterview}
      />

      <DeleteApplicationDialog
        application={deleteApplication}
        open={Boolean(deleteApplication)}
        onOpenChange={(open) => {
          if (!open) setDeleteJobId(null);
        }}
        onCancel={() => setDeleteJobId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

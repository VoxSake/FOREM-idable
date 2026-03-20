"use client";

import { AccountAccessPrompt } from "@/components/auth/AccountAccessPrompt";
import { LocalPagination } from "@/components/ui/local-pagination";
import { ApplicationCard } from "@/features/applications/components/ApplicationCard";
import { ApplicationDetailsSheet } from "@/features/applications/components/ApplicationDetailsSheet";
import { ApplicationsEmptyState } from "@/features/applications/components/ApplicationsEmptyState";
import { ApplicationsHeaderControls } from "@/features/applications/components/ApplicationsHeaderControls";
import { ApplicationsInsights } from "@/features/applications/components/ApplicationsInsights";
import { ApplicationsPageIntro } from "@/features/applications/components/ApplicationsPageIntro";
import { DeleteApplicationDialog } from "@/features/applications/components/DeleteApplicationDialog";
import { InterviewDialog } from "@/features/applications/components/InterviewDialog";
import { ManualApplicationDialog } from "@/features/applications/components/ManualApplicationDialog";
import { useApplicationsPageState } from "@/features/applications/hooks/useApplicationsPageState";

export default function ApplicationsPage() {
  const page = useApplicationsPageState();
  const selectedApplication = page.selectedApplication;

  if (page.isAuthLoading || !page.isLoaded) return null;

  if (!page.user) {
    return (
      <AccountAccessPrompt
        title="Candidatures"
        description="Connectez-vous pour suivre vos candidatures, relances, entretiens et notes dans un espace dédié."
        summary="Avec un compte, vous retrouvez automatiquement vos candidatures et votre historique de recherche, et vous pouvez partager votre suivi avec un coach si besoin."
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <ApplicationsPageIntro />

      <ApplicationsHeaderControls
        displayedCount={page.filteredApplications.length}
        totalCount={page.applications.length}
        dueCount={page.dueCount}
        dueSummary={page.dueSummary}
        selectedCount={page.selectedJobIds.size}
        canExportCalendar={page.filteredApplications.some((entry) => entry.interviewAt)}
        onCreateManual={() => page.setIsCreateOpen(true)}
        onExportCsv={page.exportApplications}
        onExportCalendar={page.exportCalendar}
        onRemoveSelected={page.removeSelected}
      />

      <ApplicationsInsights
        totalCount={page.applications.length}
        dueCount={page.dueCount}
        upcomingInterviewCount={page.upcomingInterviewCount}
        closedCount={page.closedCount}
        coachUpdateCount={page.unreadCoachUpdateCount}
        search={page.search}
        modeFilter={page.modeFilter}
        onSearchChange={page.handleSearchChange}
        onModeFilterChange={page.handleModeFilterChange}
      />

      {page.filteredApplications.length > 0 ? (
        <>
          <div className="grid gap-3 xl:grid-cols-2">
            {page.paginatedApplications.map((application) => (
              <ApplicationCard
                key={application.job.id}
                application={application}
                now={page.now}
                isSelected={page.selectedJobIds.has(application.job.id)}
                hasUnreadCoachUpdate={page.hasUnreadCoachUpdate(application)}
                onToggleSelection={page.toggleSelection}
                onOpenDetails={page.openDetails}
                onApplyStatus={page.applyStatus}
                onMarkFollowUpDone={page.markFollowUpDone}
                onOpenInterview={page.openInterviewModal}
              />
            ))}
          </div>

          <LocalPagination
            currentPage={page.effectiveApplicationsPage}
            pageCount={page.applicationsPageCount}
            totalCount={page.filteredApplications.length}
            pageSize={page.pageSize}
            itemLabel="candidatures"
            onPageChange={page.setCurrentPage}
          />
        </>
      ) : (
        <ApplicationsEmptyState
          hasApplications={page.applications.length > 0}
          onCreateManual={() => page.setIsCreateOpen(true)}
          onResetFilters={page.resetFilters}
        />
      )}

      <ApplicationDetailsSheet
        application={selectedApplication}
        open={Boolean(selectedApplication)}
        hasUnreadCoachUpdate={
          selectedApplication ? page.hasUnreadCoachUpdate(selectedApplication) : false
        }
        notesDraft={page.currentNotesDraft}
        proofsDraft={page.currentProofsDraft}
        onOpenChange={(open) => {
          if (!open) page.setDetailsJobId(null);
        }}
        onApplyStatus={page.applyStatus}
        onNotesDraftChange={(value) =>
          selectedApplication
            ? page.setNotesDrafts((current) => ({
                ...current,
                [selectedApplication.job.id]: value,
              }))
            : undefined
        }
        onProofsDraftChange={(value) =>
          selectedApplication
            ? page.setProofsDrafts((current) => ({
                ...current,
                [selectedApplication.job.id]: value,
              }))
            : undefined
        }
        onSaveNotes={page.saveSelectedNotes}
        onSaveProofs={page.saveSelectedProofs}
        onSaveManualDetails={(input) =>
          selectedApplication
            ? page.updateManualApplicationDetails(
                selectedApplication.job.id,
                selectedApplication.job,
                input
              )
            : Promise.resolve(false)
        }
        onSaveFollowUpSettings={(input) =>
          selectedApplication
            ? page.updateFollowUpSettings(selectedApplication.job.id, {
                ...input,
                status: selectedApplication.status,
              })
            : Promise.resolve(false)
        }
        onMarkFollowUpDone={page.markFollowUpDone}
        onOpenInterview={page.openInterviewModal}
        onRequestDelete={page.setDeleteJobId}
      />

      <ManualApplicationDialog
        open={page.isCreateOpen}
        form={page.manualForm}
        onOpenChange={page.setIsCreateOpen}
        onFormChange={page.setManualForm}
        onCancel={() => {
          page.resetManualForm();
          page.setIsCreateOpen(false);
        }}
        onSubmit={page.submitManualForm}
      />

      <InterviewDialog
        application={page.interviewApplication}
        open={Boolean(page.interviewApplication)}
        form={page.interviewForm}
        onOpenChange={(open) => {
          if (!open) page.resetInterviewDialog();
        }}
        onFormChange={page.setInterviewForm}
        onRemove={page.removeInterview}
        onCancel={page.resetInterviewDialog}
        onSubmit={page.submitInterview}
      />

      <DeleteApplicationDialog
        application={page.deleteApplication}
        open={Boolean(page.deleteApplication)}
        onOpenChange={(open) => {
          if (!open) page.setDeleteJobId(null);
        }}
        onCancel={() => page.setDeleteJobId(null)}
        onConfirm={page.confirmDelete}
      />
    </div>
  );
}

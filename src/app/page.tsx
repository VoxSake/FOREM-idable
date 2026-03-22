"use client";

import { Suspense } from "react";
import { SearchEngine, SearchState } from "@/components/search/SearchEngine";
import { SearchHistoryPanel } from "@/features/jobs/components/SearchHistoryPanel";
import { ExportDialog } from "@/features/jobs/components/ExportDialog";
import { JobDetailsSheet } from "@/features/jobs/components/JobDetailsSheet";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { HomePageHero } from "@/features/jobs/components/HomePageHero";
import { HomeSearchResultsSection } from "@/features/jobs/components/HomeSearchResultsSection";
import { useHomePageState } from "@/features/jobs/hooks/useHomePageState";

function DashboardPageContent() {
  const page = useHomePageState();

  if (!page.isPageReady) return null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <HomePageHero />

      <SearchEngine
        onSearch={(state: SearchState) => page.handleSearch(state)}
        initialState={page.urlQuery ?? { booleanMode: page.settings.defaultSearchMode }}
      />

      {!page.user ? (
        <Alert className="bg-card">
          <AlertTitle>Connectez-vous pour aller plus loin.</AlertTitle>
          <AlertDescription className="gap-3">
            <p>
              Le compte permet de suivre les candidatures, conserver l&apos;historique de recherche,
              retrouver vos données sur tous vos appareils et partager l&apos;avancement avec un coach.
            </p>
            <Button type="button" size="sm" onClick={() => page.setIsAuthRequiredOpen(true)}>
              Connexion / création de compte
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {page.user && page.isHistoryLoaded && (
        <SearchHistoryPanel
          history={page.history}
          onReplay={async (query) => {
            page.resetSelection();
            page.updateUrlFromQuery(query);
            await page.executeSearch(query, { persistInHistory: false });
          }}
          onClear={page.clearHistory}
        />
      )}

      <HomeSearchResultsSection
        jobs={page.jobs}
        selectedJobs={page.selectedJobs}
        selectedJobIds={page.selectedJobIds}
        hasSearched={page.hasSearched}
        isSearching={page.isSearching}
        isLoadingMore={page.isLoadingMore}
        hasMoreResults={page.hasMoreResults}
        searchSessionId={page.searchSessionId}
        isAuthenticated={page.isApplicationAuth}
        isApplicationsLoaded={page.areApplicationsLoaded}
        jobsCount={page.jobs.length}
        selectedCount={page.selectedJobs.length}
        canCopySearchLink={Boolean(page.lastSearchQuery)}
        isApplied={page.isApplied}
        onLoadMore={page.loadMore}
        onOpenDetails={page.openJobDetails}
        onToggleSelection={page.toggleSelection}
        onResetSelection={page.resetSelection}
        onRemoveSelection={page.toggleSelection}
        onSendToApplications={() => {
          if (!page.user) {
            page.requestAuthForApplications(page.selectedJobs);
            return;
          }

          void page.trackJobs(page.selectedJobs).then(() => page.resetSelection());
        }}
        onExportAll={() => page.openExportDialog("all")}
        onExportSelected={() => page.openExportDialog("selected")}
        onCopySearchLink={page.handleCopySearchLink}
        onTrackApplication={async (job) => {
          await page.addApplication(job);
        }}
        onRequireAuth={(job) => page.requestAuthForApplications([job])}
      />

      {!page.hasSearched && (
        <Empty className="mt-8 min-h-64 bg-card/50">
          <EmptyHeader>
            <EmptyTitle>Effectuez une recherche pour commencer.</EmptyTitle>
            <EmptyDescription>
              Lance une première recherche pour afficher les offres, l&apos;historique et les actions
              d&apos;export.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <ExportDialog
        open={page.isExportDialogOpen}
        onOpenChange={page.setIsExportDialogOpen}
        exportTarget={page.exportTarget}
        jobsCount={page.jobs.length}
        selectedCount={page.selectedJobs.length}
        selectedColumns={page.selectedExportColumns}
        onToggleColumn={page.toggleColumn}
        onSelectAllColumns={page.selectAllColumns}
        onExport={() =>
          page.applyExport({
            jobs: page.jobs,
            selectedJobs: page.selectedJobs,
            lastSearchQuery: page.lastSearchQuery,
          })
        }
      />

      <JobDetailsSheet
        job={page.selectedJob}
        open={page.isDetailsOpen}
        onOpenChange={page.setIsDetailsOpen}
        applied={page.selectedJob ? page.isApplied(page.selectedJob.id) : false}
        isAuthenticated={page.isApplicationAuth}
        isApplicationsLoaded={page.areApplicationsLoaded}
        onTrackApplication={async (job) => {
          await page.addApplication(job);
        }}
        onRequireAuth={() => {
          if (page.selectedJob) {
            page.requestAuthForApplications([page.selectedJob]);
          } else {
            page.setIsAuthRequiredOpen(true);
          }
        }}
      />

      <AuthRequiredDialog
        open={page.isAuthRequiredOpen}
        onOpenChange={page.setIsAuthRequiredOpen}
        onSuccess={page.replayPendingApplications}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}

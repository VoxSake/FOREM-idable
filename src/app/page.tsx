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
import { Skeleton } from "@/components/ui/skeleton";
import { HomePageHero } from "@/features/jobs/components/HomePageHero";
import { HomeSearchResultsSection } from "@/features/jobs/components/HomeSearchResultsSection";
import { useHomePageState } from "@/features/jobs/hooks/useHomePageState";

function DashboardPageSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="grid gap-4 rounded-3xl border bg-card/70 p-6 shadow-sm lg:grid-cols-[minmax(0,1.3fr)_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-full max-w-3xl" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-44" />
          </div>
        </div>
        <div className="grid gap-3 rounded-2xl border bg-background/70 p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-28" />
              </div>
              <Skeleton className="h-16 w-full" />
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function DashboardPageContent() {
  const page = useHomePageState();

  if (!page.isPageReady) return <DashboardPageSkeleton />;

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
    <Suspense fallback={<DashboardPageSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}

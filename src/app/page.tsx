"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchEngine, SearchState } from "@/components/search/SearchEngine";
import { JobTable } from "@/components/jobs/JobTable";
import { useSettings } from "@/hooks/useSettings";
import { useJobSearch } from "@/features/jobs/hooks/useJobSearch";
import { useSelectionJobs } from "@/features/jobs/hooks/useSelectionJobs";
import { useExportJobs } from "@/features/jobs/hooks/useExportJobs";
import { SearchHistoryPanel } from "@/features/jobs/components/SearchHistoryPanel";
import { SelectionPanel } from "@/features/jobs/components/SelectionPanel";
import { ResultsToolbar } from "@/features/jobs/components/ResultsToolbar";
import { ExportDialog } from "@/features/jobs/components/ExportDialog";
import { fromSearchParams, toSearchPath } from "@/features/jobs/utils/searchUrl";
import { Job } from "@/types/job";
import { JobDetailsSheet } from "@/features/jobs/components/JobDetailsSheet";
import { useApplications } from "@/hooks/useApplications";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

function DashboardPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasAppliedInitialUrlQuery = useRef(false);
  const { user } = useAuth();
  const { settings, isLoaded } = useSettings();
  const {
    jobs,
    isSearching,
    isLoadingMore,
    hasMoreResults,
    searchSessionId,
    hasSearched,
    lastSearchQuery,
    executeSearch,
    loadMore,
    history,
    clearHistory,
    isHistoryLoaded,
  } = useJobSearch();
  const {
    selectedJobs,
    selectedJobIds,
    toggleSelection,
    resetSelection,
  } = useSelectionJobs();
  const {
    addApplication,
    isApplied,
    isLoaded: areApplicationsLoaded,
    isAuthenticated: isApplicationAuth,
  } = useApplications();
  const {
    isExportDialogOpen,
    setIsExportDialogOpen,
    exportTarget,
    selectedExportColumns,
    openExportDialog,
    selectAllColumns,
    toggleColumn,
    applyExport,
  } = useExportJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState(false);
  const [pendingApplicationJobs, setPendingApplicationJobs] = useState<Job[]>([]);
  const urlQuery = fromSearchParams(searchParams);

  const updateUrlFromQuery = (query: SearchState) => {
    const nextPath = toSearchPath(pathname, query);
    router.replace(nextPath, { scroll: false });
  };

  const handleCopySearchLink = async () => {
    if (!lastSearchQuery) return;

    const path = toSearchPath(pathname, lastSearchQuery);
    const absoluteUrl = typeof window !== "undefined"
      ? `${window.location.origin}${path}`
      : path;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
    } catch (error) {
      console.error("Impossible de copier le lien de recherche", error);
    }
  };

  useEffect(() => {
    if (hasAppliedInitialUrlQuery.current) return;
    hasAppliedInitialUrlQuery.current = true;

    if (!urlQuery) return;

    void executeSearch(urlQuery, { persistInHistory: false });
  }, [urlQuery, executeSearch]);

  const handleSearch = async (state: SearchState) => {
    resetSelection();
    updateUrlFromQuery(state);
    await executeSearch(state);
  };

  const requestAuthForApplications = (jobsToTrack: Job[]) => {
    setPendingApplicationJobs(jobsToTrack);
    setIsAuthRequiredOpen(true);
  };

  const trackJobs = async (jobsToTrack: Job[]) => {
    for (const job of jobsToTrack) {
      await addApplication(job);
    }
  };

  const replayPendingApplications = async () => {
    if (pendingApplicationJobs.length === 0) return;

    await trackJobs(pendingApplicationJobs);
    resetSelection();
    setPendingApplicationJobs([]);
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Trouvez votre prochain défi
        </h1>
        <p className="text-muted-foreground text-lg">
          Recherchez parmi des milliers d&apos;offres en Wallonie et au-delà.
        </p>
      </div>

      <SearchEngine
        onSearch={handleSearch}
        initialState={urlQuery ?? { booleanMode: settings.defaultSearchMode }}
      />

      {!user ? (
        <Alert className="bg-card">
          <AlertTitle>Connectez-vous pour aller plus loin.</AlertTitle>
          <AlertDescription className="gap-3">
            <p>
              Le compte permet de suivre les candidatures, conserver l&apos;historique de recherche,
              retrouver vos données sur tous vos appareils et partager l&apos;avancement avec un coach.
            </p>
            <Button type="button" size="sm" onClick={() => setIsAuthRequiredOpen(true)}>
              Connexion / création de compte
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {user && isHistoryLoaded && (
        <SearchHistoryPanel
          history={history}
          onReplay={async (query) => {
            resetSelection();
            updateUrlFromQuery(query);
            await executeSearch(query, { persistInHistory: false });
          }}
          onClear={clearHistory}
        />
      )}

      {hasSearched && (
        <div className="space-y-4">
          <SelectionPanel
            selectedJobs={selectedJobs}
            onReset={resetSelection}
            onRemove={toggleSelection}
            onSendToApplications={() => {
              if (!user) {
                requestAuthForApplications(selectedJobs);
                return;
              }
              void trackJobs(selectedJobs).then(() => resetSelection());
            }}
          />

          <ResultsToolbar
            jobsCount={jobs.length}
            selectedCount={selectedJobs.length}
            isSearching={isSearching}
            onExportAll={() => openExportDialog("all")}
            onExportSelected={() => openExportDialog("selected")}
            onCopySearchLink={handleCopySearchLink}
            canCopySearchLink={Boolean(lastSearchQuery)}
          />

          {isSearching ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-card rounded-xl border border-border/50">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-muted-foreground font-medium animate-pulse">Le FOREM-fouille analyse les offres...</p>
            </div>
          ) : (
            <JobTable
              data={jobs}
              resetPaginationToken={searchSessionId}
              isLoadingMore={isLoadingMore}
              hasMoreResults={hasMoreResults}
              onLoadMore={loadMore}
              selectedJobIds={selectedJobIds}
              onToggleSelection={toggleSelection}
              onOpenDetails={(job) => {
                setSelectedJob(job);
                setIsDetailsOpen(true);
              }}
              isAuthenticated={isApplicationAuth}
              isApplicationsLoaded={areApplicationsLoaded}
              isApplied={isApplied}
              onTrackApplication={async (job) => {
                await addApplication(job);
              }}
              onRequireAuth={(job) => requestAuthForApplications([job])}
            />
          )}
        </div>
      )}

      {!hasSearched && (
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
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        exportTarget={exportTarget}
        jobsCount={jobs.length}
        selectedCount={selectedJobs.length}
        selectedColumns={selectedExportColumns}
        onToggleColumn={toggleColumn}
        onSelectAllColumns={selectAllColumns}
        onExport={() => applyExport({ jobs, selectedJobs, lastSearchQuery })}
      />

      <JobDetailsSheet
        job={selectedJob}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        applied={selectedJob ? isApplied(selectedJob.id) : false}
        isAuthenticated={isApplicationAuth}
        isApplicationsLoaded={areApplicationsLoaded}
        onTrackApplication={async (job) => {
          await addApplication(job);
        }}
        onRequireAuth={() => {
          if (selectedJob) {
            requestAuthForApplications([selectedJob]);
          } else {
            setIsAuthRequiredOpen(true);
          }
        }}
      />

      <AuthRequiredDialog
        open={isAuthRequiredOpen}
        onOpenChange={setIsAuthRequiredOpen}
        onSuccess={replayPendingApplications}
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

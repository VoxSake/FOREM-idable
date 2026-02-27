"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchEngine, SearchState } from "@/components/search/SearchEngine";
import { JobTable } from "@/components/jobs/JobTable";
import { useSettings } from "@/hooks/useSettings";
import { useJobSearch } from "@/features/jobs/hooks/useJobSearch";
import { useCompareJobs } from "@/features/jobs/hooks/useCompareJobs";
import { useExportJobs } from "@/features/jobs/hooks/useExportJobs";
import { SearchHistoryPanel } from "@/features/jobs/components/SearchHistoryPanel";
import { ComparePanel } from "@/features/jobs/components/ComparePanel";
import { ResultsToolbar } from "@/features/jobs/components/ResultsToolbar";
import { ExportDialog } from "@/features/jobs/components/ExportDialog";
import { fromSearchParams, toSearchPath } from "@/features/jobs/utils/searchUrl";
import { Job } from "@/types/job";
import { JobDetailsSheet } from "@/features/jobs/components/JobDetailsSheet";

function DashboardPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasAppliedInitialUrlQuery = useRef(false);
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
    compareJobs,
    selectedCompareIds,
    toggleCompare,
    resetCompare,
  } = useCompareJobs();
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
    resetCompare();
    updateUrlFromQuery(state);
    await executeSearch(state);
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

      {isHistoryLoaded && (
        <SearchHistoryPanel
          history={history}
          onReplay={async (query) => {
            resetCompare();
            updateUrlFromQuery(query);
            await executeSearch(query, { persistInHistory: false });
          }}
          onClear={clearHistory}
        />
      )}

      {hasSearched && (
        <div className="space-y-4">
          <ComparePanel compareJobs={compareJobs} onReset={resetCompare} onRemove={toggleCompare} />

          <ResultsToolbar
            jobsCount={jobs.length}
            selectedCount={compareJobs.length}
            isSearching={isSearching}
            onExportAll={() => openExportDialog("all")}
            onExportSelected={() => openExportDialog("selected")}
            onCopySearchLink={handleCopySearchLink}
            canCopySearchLink={Boolean(lastSearchQuery)}
          />

          {isSearching ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-card rounded-xl border border-border/50">
              <div className="w-8 h-8 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
              <p className="text-muted-foreground font-medium animate-pulse">Le FOREM-fouille analyse les offres...</p>
            </div>
          ) : (
            <JobTable
              data={jobs}
              resetPaginationToken={searchSessionId}
              isLoadingMore={isLoadingMore}
              hasMoreResults={hasMoreResults}
              onLoadMore={loadMore}
              selectedCompareIds={selectedCompareIds}
              onToggleCompare={toggleCompare}
              onOpenDetails={(job) => {
                setSelectedJob(job);
                setIsDetailsOpen(true);
              }}
            />
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-card/50 rounded-xl border border-dashed border-border mt-8">
          <p className="text-muted-foreground font-medium">Effectuez une recherche pour commencer.</p>
        </div>
      )}

      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        exportTarget={exportTarget}
        jobsCount={jobs.length}
        selectedCount={compareJobs.length}
        selectedColumns={selectedExportColumns}
        onToggleColumn={toggleColumn}
        onSelectAllColumns={selectAllColumns}
        onExport={() => applyExport({ jobs, selectedJobs: compareJobs, lastSearchQuery })}
      />

      <JobDetailsSheet
        job={selectedJob}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
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

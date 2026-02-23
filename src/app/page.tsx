"use client";

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

export default function DashboardPage() {
  const { settings, isLoaded } = useSettings();
  const {
    jobs,
    isSearching,
    hasSearched,
    lastSearchQuery,
    executeSearch,
    history,
    clearHistory,
    isHistoryLoaded,
  } = useJobSearch();
  const {
    compareJobs,
    selectedCompareIds,
    canSelectMoreForCompare,
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

  const handleSearch = async (state: SearchState) => {
    resetCompare();
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
        initialState={{ booleanMode: settings.defaultSearchMode }}
      />

      {isHistoryLoaded && (
        <SearchHistoryPanel
          history={history}
          onReplay={async (query) => {
            resetCompare();
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
            compareCount={compareJobs.length}
            isSearching={isSearching}
            onExportAll={() => openExportDialog("all")}
            onExportCompare={() => openExportDialog("compare")}
          />

          {isSearching ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-card rounded-xl border border-border/50">
              <div className="w-8 h-8 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
              <p className="text-muted-foreground font-medium animate-pulse">Le FOREM-fouille analyse les offres...</p>
            </div>
          ) : (
            <JobTable
              data={jobs}
              selectedCompareIds={selectedCompareIds}
              onToggleCompare={toggleCompare}
              canSelectMoreForCompare={canSelectMoreForCompare}
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
        compareCount={compareJobs.length}
        selectedColumns={selectedExportColumns}
        onToggleColumn={toggleColumn}
        onSelectAllColumns={selectAllColumns}
        onExport={() => applyExport({ jobs, compareJobs, lastSearchQuery })}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { SearchEngine, SearchState } from "@/components/search/SearchEngine";
import { JobTable } from "@/components/jobs/JobTable";
import { jobService } from "@/services/jobs/jobService";
import { Job } from "@/types/job";
import { useSettings } from "@/hooks/useSettings";
import { exportJobsToCSV } from "@/lib/exportCsv";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { settings, isLoaded } = useSettings();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (state: SearchState) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await jobService.searchJobs({
        keywords: state.keywords,
        location: state.location,
        booleanMode: state.booleanMode,
      });
      setJobs(response.jobs);
    } catch (error) {
      console.error("Erreur lors de la recherche", error);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Trouvez votre prochain défi
        </h1>
        <p className="text-muted-foreground text-lg">
          Recherchez parmi des milliers d'offres en Wallonie et au-delà.
        </p>
      </div>

      <SearchEngine
        onSearch={handleSearch}
        initialState={{ booleanMode: settings.defaultSearchMode }}
      />

      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">Résultats de recherche</h2>
              <span className="text-sm text-muted-foreground">
                {jobs.length} offre{jobs.length > 1 ? 's' : ''} trouvée{jobs.length > 1 ? 's' : ''}
              </span>
            </div>

            {!isSearching && jobs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full shadow-sm"
                onClick={() => exportJobsToCSV(jobs)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          {isSearching ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-card rounded-xl border border-border/50">
              <div className="w-8 h-8 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
              <p className="text-muted-foreground font-medium animate-pulse">Le FOREM-fouille analyse les offres...</p>
            </div>
          ) : (
            <JobTable data={jobs} />
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-card/50 rounded-xl border border-dashed border-border mt-8">
          <p className="text-muted-foreground font-medium">Effectuez une recherche pour commencer.</p>
        </div>
      )}
    </div>
  );
}

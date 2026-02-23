"use client";

import { useState } from "react";
import { Job } from "@/types/job";
import { SearchQuery } from "@/types/search";
import { jobService } from "@/services/jobs/jobService";
import { useSearchHistory } from "@/hooks/useSearchHistory";

export function useJobSearch() {
  const { history, addEntry, clearHistory, isLoaded: isHistoryLoaded } = useSearchHistory();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<SearchQuery | null>(null);

  const executeSearch = async (query: SearchQuery, options?: { persistInHistory?: boolean }) => {
    const persistInHistory = options?.persistInHistory ?? true;

    setLastSearchQuery(query);
    if (persistInHistory) addEntry(query);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await jobService.searchJobs({
        keywords: query.keywords,
        locations: query.locations,
        booleanMode: query.booleanMode,
      });
      setJobs(response.jobs);
      return response.jobs;
    } catch (error) {
      console.error("Erreur lors de la recherche", error);
      setJobs([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  return {
    jobs,
    isSearching,
    hasSearched,
    lastSearchQuery,
    executeSearch,
    history,
    clearHistory,
    isHistoryLoaded,
  };
}


"use client";

import { useEffect, useState } from "react";
import { SearchQuery } from "@/types/search";
import { dedupeAndPrependHistory } from "@/features/jobs/utils/searchHistory";
import { SearchHistoryEntry } from "@/features/jobs/types/searchHistory";

const SEARCH_HISTORY_KEY = "forem_idable_search_history_v1";
const MAX_HISTORY_ITEMS = 8;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SearchHistoryEntry[];
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (error) {
      console.error("Unable to load search history", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  }, [history, isLoaded]);

  const addEntry = (state: SearchQuery) => {
    const normalized: SearchHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      state,
      createdAt: new Date().toISOString(),
    };

    setHistory((prev) => {
      return dedupeAndPrependHistory(prev, normalized, MAX_HISTORY_ITEMS);
    });
  };

  const clearHistory = () => setHistory([]);

  return { history, addEntry, clearHistory, isLoaded };
}

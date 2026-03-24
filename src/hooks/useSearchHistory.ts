"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SearchQuery } from "@/types/search";
import {
  SearchHistoryEntry,
  searchHistoryArraySchema,
} from "@/features/jobs/types/searchHistory";

export function useSearchHistory() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);

    try {
      const response = await fetch("/api/search-history", { cache: "no-store" });
      const data = (await response.json()) as { history?: SearchHistoryEntry[] };
      const parsedHistory = searchHistoryArraySchema.safeParse(data.history);
      setHistory(parsedHistory.success ? parsedHistory.data : []);
    } catch {
      setHistory([]);
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthLoading) return;
    void refresh();
  }, [isAuthLoading, refresh]);

  const addEntry = async (state: SearchQuery) => {
    if (!user) return false;

    const entry: SearchHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      state,
      createdAt: new Date().toISOString(),
    };

    const response = await fetch("/api/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry }),
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { history?: SearchHistoryEntry[] };
    const parsedHistory = searchHistoryArraySchema.safeParse(data.history);
    setHistory(parsedHistory.success ? parsedHistory.data : []);
    return true;
  };

  const clearHistory = async () => {
    if (!user) return false;

    const response = await fetch("/api/search-history", { method: "DELETE" });
    if (!response.ok) {
      return false;
    }

    setHistory([]);
    return true;
  };

  return { history, addEntry, clearHistory, isLoaded, isAuthenticated: Boolean(user) };
}

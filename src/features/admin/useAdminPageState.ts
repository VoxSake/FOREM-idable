"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCoachDashboard } from "@/features/coach/useCoachDashboard";
import { FeaturedSearchPayload } from "@/features/featured-searches/featuredSearchSchema";
import { AdminApiKeySummary } from "@/types/externalApi";
import { FeaturedSearch } from "@/types/featuredSearch";

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as T;
  return { response, data };
}

export function useAdminPageState() {
  const coach = useCoachDashboard();
  const [apiKeys, setApiKeys] = useState<AdminApiKeySummary[]>([]);
  const [apiKeysFeedback, setApiKeysFeedback] = useState<string | null>(null);
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AdminApiKeySummary | null>(null);
  const [isRevokingApiKey, setIsRevokingApiKey] = useState(false);
  const [featuredSearches, setFeaturedSearches] = useState<FeaturedSearch[]>([]);
  const [featuredSearchesFeedback, setFeaturedSearchesFeedback] = useState<string | null>(null);
  const [isFeaturedSearchesLoading, setIsFeaturedSearchesLoading] = useState(false);
  const [isSavingFeaturedSearch, setIsSavingFeaturedSearch] = useState(false);
  const [savingFeaturedSearchId, setSavingFeaturedSearchId] = useState<number | null>(null);
  const [isDeletingFeaturedSearch, setIsDeletingFeaturedSearch] = useState(false);

  const isAuthorized = coach.user?.role === "admin";

  const loadApiKeys = useCallback(async () => {
    if (!isAuthorized) {
      setApiKeys([]);
      return;
    }

    setIsApiKeysLoading(true);
    setApiKeysFeedback(null);

    try {
      const { response, data } = await requestJson<{
        error?: string;
        apiKeys?: AdminApiKeySummary[];
      }>("/api/admin/api-keys", { cache: "no-store" });

      if (!response.ok || !data.apiKeys) {
        setApiKeysFeedback(data.error || "Chargement des clés API impossible.");
        return;
      }

      setApiKeys(data.apiKeys);
    } catch {
      setApiKeysFeedback("Chargement des clés API impossible.");
    } finally {
      setIsApiKeysLoading(false);
    }
  }, [isAuthorized]);

  const loadFeaturedSearches = useCallback(async () => {
    if (!isAuthorized) {
      setFeaturedSearches([]);
      return;
    }

    setIsFeaturedSearchesLoading(true);
    setFeaturedSearchesFeedback(null);

    try {
      const { response, data } = await requestJson<{
        error?: string;
        featuredSearches?: FeaturedSearch[];
      }>("/api/admin/featured-searches", { cache: "no-store" });

      if (!response.ok || !data.featuredSearches) {
        setFeaturedSearchesFeedback(data.error || "Chargement des recherches mises en avant impossible.");
        return;
      }

      setFeaturedSearches(data.featuredSearches);
    } catch {
      setFeaturedSearchesFeedback("Chargement des recherches mises en avant impossible.");
    } finally {
      setIsFeaturedSearchesLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (coach.isAuthLoading) return;
    if (!isAuthorized) return;
    void loadApiKeys();
    void loadFeaturedSearches();
  }, [coach.isAuthLoading, isAuthorized, loadApiKeys, loadFeaturedSearches]);

  const revokeApiKey = useCallback(async () => {
    if (!revokeTarget) return false;

    setIsRevokingApiKey(true);
    try {
      const { response, data } = await requestJson<{ error?: string }>(
        `/api/admin/api-keys/${revokeTarget.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        setApiKeysFeedback(data.error || "Révocation impossible.");
        return false;
      }

      const revokedAt = new Date().toISOString();
      setApiKeys((current) =>
        current.map((entry) =>
          entry.id === revokeTarget.id
            ? {
                ...entry,
                revokedAt,
              }
            : entry
        )
      );
      setApiKeysFeedback(`Clé API révoquée: ${revokeTarget.name}.`);
      setRevokeTarget(null);
      return true;
    } catch {
      setApiKeysFeedback("Révocation impossible.");
      return false;
    } finally {
      setIsRevokingApiKey(false);
    }
  }, [revokeTarget]);

  const createFeaturedSearch = useCallback(async (payload: FeaturedSearchPayload) => {
    setIsSavingFeaturedSearch(true);
    setSavingFeaturedSearchId(null);

    try {
      const { response, data } = await requestJson<{
        error?: string;
        featuredSearch?: FeaturedSearch;
      }>("/api/admin/featured-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !data.featuredSearch) {
        setFeaturedSearchesFeedback(data.error || "Création impossible.");
        return false;
      }

      setFeaturedSearches((current) =>
        [...current, data.featuredSearch!].sort((left, right) => left.sortOrder - right.sortOrder)
      );
      setFeaturedSearchesFeedback(`Recherche mise en avant créée: ${data.featuredSearch.title}.`);
      return true;
    } catch {
      setFeaturedSearchesFeedback("Création impossible.");
      return false;
    } finally {
      setIsSavingFeaturedSearch(false);
      setSavingFeaturedSearchId(null);
    }
  }, []);

  const updateFeaturedSearch = useCallback(async (id: number, payload: FeaturedSearchPayload) => {
    setIsSavingFeaturedSearch(true);
    setSavingFeaturedSearchId(id);

    try {
      const { response, data } = await requestJson<{
        error?: string;
        featuredSearch?: FeaturedSearch;
      }>(`/api/admin/featured-searches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !data.featuredSearch) {
        setFeaturedSearchesFeedback(data.error || "Mise à jour impossible.");
        return false;
      }

      setFeaturedSearches((current) =>
        current
          .map((entry) => (entry.id === id ? data.featuredSearch! : entry))
          .sort((left, right) => left.sortOrder - right.sortOrder)
      );
      setFeaturedSearchesFeedback(`Recherche mise en avant mise à jour: ${data.featuredSearch.title}.`);
      return true;
    } catch {
      setFeaturedSearchesFeedback("Mise à jour impossible.");
      return false;
    } finally {
      setIsSavingFeaturedSearch(false);
      setSavingFeaturedSearchId(null);
    }
  }, []);

  const deleteFeaturedSearch = useCallback(async (id: number) => {
    setIsDeletingFeaturedSearch(true);

    try {
      const target = featuredSearches.find((entry) => entry.id === id) ?? null;
      const { response, data } = await requestJson<{ error?: string; ok?: boolean }>(
        `/api/admin/featured-searches/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        setFeaturedSearchesFeedback(data.error || "Suppression impossible.");
        return false;
      }

      setFeaturedSearches((current) => current.filter((entry) => entry.id !== id));
      setFeaturedSearchesFeedback(
        target
          ? `Recherche mise en avant supprimée: ${target.title}.`
          : "Recherche mise en avant supprimée."
      );
      return true;
    } catch {
      setFeaturedSearchesFeedback("Suppression impossible.");
      return false;
    } finally {
      setIsDeletingFeaturedSearch(false);
    }
  }, [featuredSearches]);

  const apiKeyStats = useMemo(() => {
    const now = Date.now();

    return {
      total: apiKeys.length,
      active: apiKeys.filter(
        (entry) =>
          !entry.revokedAt &&
          (!entry.expiresAt || new Date(entry.expiresAt).getTime() > now)
      ).length,
      revoked: apiKeys.filter((entry) => Boolean(entry.revokedAt)).length,
      expiringSoon: apiKeys.filter((entry) => {
        if (entry.revokedAt || !entry.expiresAt) return false;
        const expiresAt = new Date(entry.expiresAt).getTime();
        const fourteenDays = 14 * 24 * 60 * 60 * 1000;
        return expiresAt > now && expiresAt - now <= fourteenDays;
      }).length,
    };
  }, [apiKeys]);

  return {
    ...coach,
    isAuthorized,
    apiKeys,
    apiKeysFeedback,
    isApiKeysLoading,
    apiKeyStats,
    featuredSearches,
    featuredSearchesFeedback,
    isFeaturedSearchesLoading,
    isSavingFeaturedSearch,
    savingFeaturedSearchId,
    isDeletingFeaturedSearch,
    revokeTarget,
    setRevokeTarget,
    isRevokingApiKey,
    loadApiKeys,
    revokeApiKey,
    loadFeaturedSearches,
    createFeaturedSearch,
    updateFeaturedSearch,
    deleteFeaturedSearch,
  };
}

export type AdminPageState = ReturnType<typeof useAdminPageState>;

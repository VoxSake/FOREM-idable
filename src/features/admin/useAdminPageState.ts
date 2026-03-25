"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminAccountDeletionRequests,
  createAdminFeaturedSearch,
  deleteAdminFeaturedSearch,
  fetchAdminApiKeys,
  fetchAdminFeaturedSearches,
  revokeAdminApiKey,
  reviewAdminAccountDeletionRequest,
  updateAdminFeaturedSearch,
} from "@/features/admin/adminApi";
import { useAdminDashboard } from "@/features/admin/useAdminDashboard";
import { FeaturedSearchPayload } from "@/features/featured-searches/featuredSearchSchema";
import { AdminApiKeySummary } from "@/types/externalApi";
import { FeaturedSearch } from "@/types/featuredSearch";
import { AdminAccountDeletionRequest } from "./adminApi";

export function useAdminPageState() {
  const admin = useAdminDashboard();
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
  const [deletionRequests, setDeletionRequests] = useState<AdminAccountDeletionRequest[]>([]);
  const [deletionRequestsFeedback, setDeletionRequestsFeedback] = useState<string | null>(null);
  const [isDeletionRequestsLoading, setIsDeletionRequestsLoading] = useState(false);
  const [reviewingDeletionRequestId, setReviewingDeletionRequestId] = useState<number | null>(null);

  const loadApiKeys = useCallback(async () => {
    if (!admin.isAuthorized) {
      setApiKeys([]);
      return;
    }

    setIsApiKeysLoading(true);
    setApiKeysFeedback(null);

    try {
      const { response, data } = await fetchAdminApiKeys();

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
  }, [admin.isAuthorized]);

  const loadFeaturedSearches = useCallback(async () => {
    if (!admin.isAuthorized) {
      setFeaturedSearches([]);
      return;
    }

    setIsFeaturedSearchesLoading(true);
    setFeaturedSearchesFeedback(null);

    try {
      const { response, data } = await fetchAdminFeaturedSearches();

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
  }, [admin.isAuthorized]);

  const loadDeletionRequests = useCallback(async () => {
    if (!admin.isAuthorized) {
      setDeletionRequests([]);
      return;
    }

    setIsDeletionRequestsLoading(true);
    setDeletionRequestsFeedback(null);

    try {
      const { response, data } = await fetchAdminAccountDeletionRequests();

      if (!response.ok || !data.requests) {
        setDeletionRequestsFeedback(data.error || "Chargement des demandes impossible.");
        return;
      }

      setDeletionRequests(data.requests);
    } catch {
      setDeletionRequestsFeedback("Chargement des demandes impossible.");
    } finally {
      setIsDeletionRequestsLoading(false);
    }
  }, [admin.isAuthorized]);

  useEffect(() => {
    if (admin.isAuthLoading) return;
    if (!admin.isAuthorized) return;
    void loadApiKeys();
    void loadFeaturedSearches();
    void loadDeletionRequests();
  }, [admin.isAuthLoading, admin.isAuthorized, loadApiKeys, loadFeaturedSearches, loadDeletionRequests]);

  const revokeApiKey = useCallback(async () => {
    if (!revokeTarget) return false;

    setIsRevokingApiKey(true);
    try {
      const { response, data } = await revokeAdminApiKey(revokeTarget.id);

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
      const { response, data } = await createAdminFeaturedSearch(payload);

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
      const { response, data } = await updateAdminFeaturedSearch(id, payload);

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
      const { response, data } = await deleteAdminFeaturedSearch(id);

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

  const reviewDeletionRequest = useCallback(async (input: {
    id: number;
    action: "approve" | "reject" | "complete";
    reviewNote?: string;
  }) => {
    setReviewingDeletionRequestId(input.id);

    try {
      const { response, data } = await reviewAdminAccountDeletionRequest(input.id, {
        action: input.action,
        reviewNote: input.reviewNote,
      });

      if (!response.ok) {
        setDeletionRequestsFeedback(data.error || "Traitement impossible.");
        return false;
      }

      if (input.action === "complete") {
        setDeletionRequests((current) => current.filter((entry) => entry.id !== input.id));
        setDeletionRequestsFeedback("Suppression finalisée.");
      } else if (data.request) {
        setDeletionRequests((current) =>
          current.map((entry) => (entry.id === input.id ? data.request! : entry))
        );
        setDeletionRequestsFeedback(
          input.action === "approve" ? "Demande approuvée." : "Demande refusée."
        );
      }

      return true;
    } catch {
      setDeletionRequestsFeedback("Traitement impossible.");
      return false;
    } finally {
      setReviewingDeletionRequestId(null);
    }
  }, []);

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
    ...admin,
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
    deletionRequests,
    deletionRequestsFeedback,
    isDeletionRequestsLoading,
    reviewingDeletionRequestId,
    revokeTarget,
    setRevokeTarget,
    isRevokingApiKey,
    loadApiKeys,
    revokeApiKey,
    loadFeaturedSearches,
    loadDeletionRequests,
    createFeaturedSearch,
    updateFeaturedSearch,
    deleteFeaturedSearch,
    reviewDeletionRequest,
  };
}

export type AdminPageState = ReturnType<typeof useAdminPageState>;

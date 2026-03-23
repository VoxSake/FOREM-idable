"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCoachDashboard } from "@/features/coach/useCoachDashboard";
import { AdminApiKeySummary } from "@/types/externalApi";

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

  useEffect(() => {
    if (coach.isAuthLoading) return;
    if (!isAuthorized) return;
    void loadApiKeys();
  }, [coach.isAuthLoading, isAuthorized, loadApiKeys]);

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
    revokeTarget,
    setRevokeTarget,
    isRevokingApiKey,
    loadApiKeys,
    revokeApiKey,
  };
}

export type AdminPageState = ReturnType<typeof useAdminPageState>;

"use client";

import { useCallback, useEffect, useState } from "react";
import { buildApiKeyExpiryDate } from "@/app/account/account.utils";
import { ApiKeyFormValues, FeedbackState } from "@/app/account/account.schemas";
import { ApiKeyCreateResult, ApiKeySummary } from "@/types/externalApi";

type UseAccountApiKeysOptions = {
  enabled: boolean;
};

export function useAccountApiKeys({ enabled }: UseAccountApiKeysOptions) {
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingApiKeyId, setRevokingApiKeyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setApiKeys([]);
      setFeedback(null);
      setNewApiKey(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/account/api-keys", { cache: "no-store" });
      const data = (await response.json()) as { error?: string; apiKeys?: ApiKeySummary[] };

      if (!response.ok || !data.apiKeys) {
        setFeedback({
          type: "error",
          message: data.error || "Chargement des clés API impossible.",
        });
        setApiKeys([]);
        return;
      }

      setApiKeys(data.apiKeys);
    } catch {
      setFeedback({
        type: "error",
        message: "Chargement des clés API impossible.",
      });
      setApiKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createApiKey = useCallback(async (values: ApiKeyFormValues) => {
    setIsCreating(true);
    setFeedback(null);
    setNewApiKey(null);

    try {
      const response = await fetch("/api/account/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          expiresAt: buildApiKeyExpiryDate(values.expiry),
        }),
      });
      const data = (await response.json()) as { error?: string } & Partial<ApiKeyCreateResult>;

      if (!response.ok || !data.apiKey || !data.plainTextKey) {
        setFeedback({
          type: "error",
          message: data.error || "Création de la clé API impossible.",
        });
        return false;
      }

      setNewApiKey(data.plainTextKey);
      setFeedback({
        type: "success",
        message: "Clé API créée. Copie-la maintenant: elle ne sera plus réaffichée.",
      });
      setApiKeys((current) => [data.apiKey as ApiKeySummary, ...current]);
      return true;
    } catch {
      setFeedback({
        type: "error",
        message: "Création de la clé API impossible.",
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const revokeApiKey = useCallback(async (keyId: number) => {
    setRevokingApiKeyId(keyId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/account/api-keys/${keyId}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: data.error || "Révocation impossible.",
        });
        return;
      }

      setApiKeys((current) =>
        current.map((entry) =>
          entry.id === keyId ? { ...entry, revokedAt: new Date().toISOString() } : entry
        )
      );
      setFeedback({
        type: "success",
        message: "Clé API révoquée.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Révocation impossible.",
      });
    } finally {
      setRevokingApiKeyId(null);
    }
  }, []);

  const copyApiKey = useCallback(async () => {
    if (!newApiKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(newApiKey);
      setFeedback({
        type: "success",
        message: "Clé API copiée.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Copie impossible, sélectionne la clé manuellement.",
      });
    }
  }, [newApiKey]);

  return {
    apiKeys,
    feedback,
    newApiKey,
    isLoading,
    isCreating,
    revokingApiKeyId,
    createApiKey,
    revokeApiKey,
    copyApiKey,
  };
}

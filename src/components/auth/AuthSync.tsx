"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getLocalSyncUpdatedAt, markLocalSyncUpdatedAt } from "@/lib/localSyncState";
import { applySyncSnapshot, createSyncSnapshot } from "@/lib/syncToken";

function hasValues(values: Partial<Record<string, string>> | undefined) {
  return Boolean(values && Object.keys(values).length > 0);
}

export function AuthSync() {
  const { user, isLoading } = useAuth();
  const syncTimeout = useRef<number | null>(null);
  const isApplyingRemote = useRef(false);

  useEffect(() => {
    if (isLoading || !user) return;

    const remoteStateKey = `forem-idable-remote-state-${user.id}`;

    const pullState = async () => {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as {
          state: { values: Record<string, string>; updatedAt: string } | null;
        };
        const localSnapshot = createSyncSnapshot(window.localStorage);
        const remoteValues = data.state?.values ?? {};
        const localValues = localSnapshot.values;
        const remoteUpdatedAt = data.state?.updatedAt ?? null;
        const localUpdatedAt = getLocalSyncUpdatedAt(window.localStorage, localValues);
        const knownRemoteUpdatedAt = remoteUpdatedAt
          ? sessionStorage.getItem(remoteStateKey)
          : null;

        if (hasValues(remoteValues)) {
          const localSerialized = JSON.stringify(localValues);
          const remoteSerialized = JSON.stringify(remoteValues);

          if (localSerialized !== remoteSerialized) {
            const localIsNewer =
              typeof localUpdatedAt === "string" &&
              (!remoteUpdatedAt ||
                new Date(localUpdatedAt).getTime() > new Date(remoteUpdatedAt).getTime());

            if (localIsNewer && hasValues(localValues)) {
              const pushResponse = await fetch("/api/state", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ values: localValues }),
              });
              if (pushResponse.ok) {
                const pushData = (await pushResponse.json()) as {
                  state?: { updatedAt?: string };
                };
                if (pushData.state?.updatedAt) {
                  sessionStorage.setItem(remoteStateKey, pushData.state.updatedAt);
                  markLocalSyncUpdatedAt(window.localStorage, pushData.state.updatedAt);
                }
              }
              return;
            }

            if (remoteUpdatedAt !== knownRemoteUpdatedAt) {
              isApplyingRemote.current = true;
              applySyncSnapshot(window.localStorage, {
                version: 1,
                createdAt: remoteUpdatedAt || new Date().toISOString(),
                values: remoteValues,
              });
              if (remoteUpdatedAt) {
                sessionStorage.setItem(remoteStateKey, remoteUpdatedAt);
                markLocalSyncUpdatedAt(window.localStorage, remoteUpdatedAt);
              }
              window.location.reload();
              return;
            }
          }
        } else if (hasValues(localValues)) {
          const pushResponse = await fetch("/api/state", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ values: localValues }),
          });
          if (pushResponse.ok) {
            const pushData = (await pushResponse.json()) as {
              state?: { updatedAt?: string };
            };
            if (pushData.state?.updatedAt) {
              sessionStorage.setItem(remoteStateKey, pushData.state.updatedAt);
              markLocalSyncUpdatedAt(window.localStorage, pushData.state.updatedAt);
            }
          }
        } else if (remoteUpdatedAt) {
          sessionStorage.setItem(remoteStateKey, remoteUpdatedAt);
          markLocalSyncUpdatedAt(window.localStorage, remoteUpdatedAt);
        }
      } catch {
        // Keep local-only behavior on sync failures
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "hidden") return;
      void pullState();
    };

    void pullState();
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [isLoading, user]);

  useEffect(() => {
    if (!user) return;

    const remoteStateKey = `forem-idable-remote-state-${user.id}`;

    const pushState = () => {
      if (isApplyingRemote.current) {
        isApplyingRemote.current = false;
        return;
      }

      markLocalSyncUpdatedAt(window.localStorage);

      if (syncTimeout.current) {
        window.clearTimeout(syncTimeout.current);
      }

      syncTimeout.current = window.setTimeout(() => {
        const snapshot = createSyncSnapshot(window.localStorage);
        void fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values: snapshot.values }),
        })
          .then(async (response) => {
            if (!response.ok) return;
            const data = (await response.json()) as {
              state?: { updatedAt?: string };
            };
            if (data.state?.updatedAt) {
              sessionStorage.setItem(remoteStateKey, data.state.updatedAt);
              markLocalSyncUpdatedAt(window.localStorage, data.state.updatedAt);
            }
          })
          .catch(() => {
            // Ignore sync failures and keep local behavior
          });
      }, 600);
    };

    const handleStorage = () => pushState();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("forem-idable:applications-change", handleStorage);
    window.addEventListener("forem-idable:analytics-consent-change", handleStorage);
    window.addEventListener("forem-idable:local-state-changed", handleStorage);

    return () => {
      if (syncTimeout.current) {
        window.clearTimeout(syncTimeout.current);
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("forem-idable:applications-change", handleStorage);
      window.removeEventListener("forem-idable:analytics-consent-change", handleStorage);
      window.removeEventListener("forem-idable:local-state-changed", handleStorage);
    };
  }, [user]);

  return null;
}

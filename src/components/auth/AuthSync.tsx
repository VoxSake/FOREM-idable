"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
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

        if (hasValues(remoteValues)) {
          const localSerialized = JSON.stringify(localValues);
          const remoteSerialized = JSON.stringify(remoteValues);

          if (localSerialized !== remoteSerialized) {
            isApplyingRemote.current = true;
            applySyncSnapshot(window.localStorage, {
              version: 1,
              createdAt: data.state?.updatedAt || new Date().toISOString(),
              values: remoteValues,
            });
            window.location.reload();
            return;
          }
        } else if (hasValues(localValues)) {
          await fetch("/api/state", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ values: localValues }),
          });
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

    const pushState = () => {
      if (isApplyingRemote.current) {
        isApplyingRemote.current = false;
        return;
      }

      if (syncTimeout.current) {
        window.clearTimeout(syncTimeout.current);
      }

      syncTimeout.current = window.setTimeout(() => {
        const snapshot = createSyncSnapshot(window.localStorage);
        void fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values: snapshot.values }),
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

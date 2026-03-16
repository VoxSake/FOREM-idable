"use client";

import { useMemo, useSyncExternalStore } from "react";

const CHANGE_EVENT = "forem-idable:coach-note-views-change";

function getStorageKey(userId: number) {
  return `forem_idable_coach_note_views_v1:${userId}`;
}

function readViewsSnapshot(userId?: number) {
  if (typeof window === "undefined" || !userId) return "{}";

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw || "{}";
  } catch {
    return "{}";
  }
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key?.startsWith("forem_idable_coach_note_views_v1:")) {
      onStoreChange();
    }
  };

  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, handleChange);
  };
}

export function useCoachNoteViews(userId?: number) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => readViewsSnapshot(userId),
    () => "{}"
  );

  return useMemo(() => {
    try {
      return JSON.parse(snapshot) as Record<string, string>;
    } catch {
      return {};
    }
  }, [snapshot]);
}

export function markCoachNoteView(
  userId: number | undefined,
  applicationId: string,
  latestSharedNoteAt: string | null
) {
  if (typeof window === "undefined" || !userId || !latestSharedNoteAt) return;

  const current = (() => {
    try {
      return JSON.parse(readViewsSnapshot(userId)) as Record<string, string>;
    } catch {
      return {};
    }
  })();
  if (current[applicationId] === latestSharedNoteAt) return;

  try {
    localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify({ ...current, [applicationId]: latestSharedNoteAt })
    );
  } catch {
    return;
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

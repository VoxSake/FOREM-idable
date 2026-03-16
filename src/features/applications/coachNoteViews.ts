"use client";

import { useSyncExternalStore } from "react";

const CHANGE_EVENT = "forem-idable:coach-note-views-change";

function getStorageKey(userId: number) {
  return `forem_idable_coach_note_views_v1:${userId}`;
}

function readViews(userId?: number): Record<string, string> {
  if (typeof window === "undefined" || !userId) return {};

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
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
  return useSyncExternalStore<Record<string, string>>(
    subscribe,
    () => readViews(userId),
    () => ({})
  );
}

export function markCoachNoteView(
  userId: number | undefined,
  applicationId: string,
  latestSharedNoteAt: string | null
) {
  if (typeof window === "undefined" || !userId || !latestSharedNoteAt) return;

  const current = readViews(userId);
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

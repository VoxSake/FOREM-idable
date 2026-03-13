import { STORAGE_KEYS } from "@/lib/storageKeys";

const LOCAL_SYNC_UPDATED_AT_KEY = "forem_idable_local_sync_updated_at";

function getApplicationsUpdatedAt(values: Partial<Record<string, string>>) {
  const rawApplications = values[STORAGE_KEYS.applications];
  if (!rawApplications) return null;

  try {
    const parsed = JSON.parse(rawApplications) as Array<{
      appliedAt?: string;
      updatedAt?: string;
      interviewAt?: string;
      lastFollowUpAt?: string;
    }>;

    if (!Array.isArray(parsed)) {
      return null;
    }

    const latest = parsed.reduce((current, entry) => {
      const candidates = [
        entry.updatedAt,
        entry.appliedAt,
        entry.interviewAt,
        entry.lastFollowUpAt,
      ];

      for (const value of candidates) {
        if (!value) continue;
        const time = new Date(value).getTime();
        if (!Number.isNaN(time) && time > current) {
          current = time;
        }
      }

      return current;
    }, 0);

    return latest > 0 ? new Date(latest).toISOString() : null;
  } catch {
    return null;
  }
}

export function markLocalSyncUpdatedAt(storage: Storage, updatedAt = new Date().toISOString()) {
  storage.setItem(LOCAL_SYNC_UPDATED_AT_KEY, updatedAt);
}

export function getLocalSyncUpdatedAt(
  storage: Storage,
  values: Partial<Record<string, string>>
) {
  const stored = storage.getItem(LOCAL_SYNC_UPDATED_AT_KEY);
  if (stored) {
    return stored;
  }

  return getApplicationsUpdatedAt(values);
}

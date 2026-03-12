import { STORAGE_KEYS } from "@/lib/storageKeys";

export interface SyncSnapshot {
  version: 1;
  createdAt: string;
  values: Partial<Record<string, string>>;
}

const SYNCABLE_STORAGE_KEYS = [
  STORAGE_KEYS.favorites,
  STORAGE_KEYS.applications,
  STORAGE_KEYS.settings,
  STORAGE_KEYS.searchHistory,
  STORAGE_KEYS.analyticsConsent,
  STORAGE_KEYS.locationsCache,
  STORAGE_KEYS.theme,
] as const;

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function createSyncSnapshot(storage: Storage): SyncSnapshot {
  const values: Partial<Record<string, string>> = {};

  for (const key of SYNCABLE_STORAGE_KEYS) {
    const value = storage.getItem(key);
    if (value !== null) {
      values[key] = value;
    }
  }

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    values,
  };
}

export function encodeSyncToken(snapshot: SyncSnapshot) {
  const payload = JSON.stringify(snapshot);
  const bytes = new TextEncoder().encode(payload);
  return bytesToBase64(bytes);
}

export function decodeSyncToken(token: string): SyncSnapshot {
  const normalized = token.trim();
  const bytes = base64ToBytes(normalized);
  const payload = new TextDecoder().decode(bytes);
  const parsed = JSON.parse(payload) as SyncSnapshot;

  if (parsed.version !== 1 || typeof parsed.values !== "object" || !parsed.values) {
    throw new Error("Invalid sync token");
  }

  return parsed;
}

export function applySyncSnapshot(storage: Storage, snapshot: SyncSnapshot) {
  for (const key of SYNCABLE_STORAGE_KEYS) {
    storage.removeItem(key);
  }

  for (const [key, value] of Object.entries(snapshot.values)) {
    if (typeof value === "string") {
      storage.setItem(key, value);
    }
  }
}

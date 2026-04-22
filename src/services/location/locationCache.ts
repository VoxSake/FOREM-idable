import { STORAGE_KEYS } from "@/lib/storageKeys";

export type LocationCategory = 'Pays' | 'Régions' | 'Provinces' | 'Arrondissements' | 'Communes' | 'Localités';

export interface LocationEntry {
    id: string;
    name: string;
    type: LocationCategory;
    parentId?: string;
    code?: string;
    level?: number;
    postalCode?: string;
}

const fallbackLocations: LocationEntry[] = [
    { id: 'be', name: 'Belgique', type: 'Pays' },
    { id: 'wal', name: 'Wallonie', type: 'Régions', parentId: 'be' },
    { id: 'bru', name: 'Région de Bruxelles-Capitale', type: 'Régions', parentId: 'be' },
    { id: 'vla', name: 'Flandre', type: 'Régions', parentId: 'be' },
    { id: 'bw', name: 'Brabant Wallon', type: 'Provinces', parentId: 'wal' },
    { id: 'lg', name: 'Liège', type: 'Provinces', parentId: 'wal' },
    { id: 'arr-ve', name: 'Arrondissement de Verviers', type: 'Arrondissements', parentId: 'lg', code: '63000' },
    { id: 'com-ve', name: 'Verviers', type: 'Communes', parentId: 'arr-ve' },
    { id: 'loc-ve-4800', name: '4800 Verviers', type: 'Localités', parentId: 'arr-ve', postalCode: '4800' },
    { id: 'loc-ve-4801', name: '4801 Verviers', type: 'Localités', parentId: 'arr-ve', postalCode: '4801' },
    { id: 'loc-ve-4802', name: '4802 Verviers', type: 'Localités', parentId: 'arr-ve', postalCode: '4802' },
    { id: 'loc-ve-4860', name: '4860 Verviers', type: 'Localités', parentId: 'arr-ve', postalCode: '4860' },
    { id: 'loc-ve-4870', name: '4870 Verviers', type: 'Localités', parentId: 'arr-ve', postalCode: '4870' },
    { id: 'bx', name: 'Bruxelles', type: 'Provinces', parentId: 'bru' },
    { id: 'ant', name: 'Anvers', type: 'Provinces', parentId: 'vla' },
    { id: 'lim', name: 'Limbourg', type: 'Provinces', parentId: 'vla' },
    { id: 'ovl', name: 'Flandre-Orientale', type: 'Provinces', parentId: 'vla' },
    { id: 'wvl', name: 'Flandre-Occidentale', type: 'Provinces', parentId: 'vla' },
    { id: 'arr-bx', name: 'Arrondissement de Bruxelles', type: 'Arrondissements', parentId: 'bx', code: '21000' },
    { id: 'com-bx', name: 'Bruxelles', type: 'Communes', parentId: 'arr-bx' },
    { id: 'loc-bx-1000', name: '1000 Bruxelles', type: 'Localités', parentId: 'arr-bx', postalCode: '1000' },
    { id: 'loc-bx-1030', name: '1030 Schaerbeek', type: 'Localités', parentId: 'arr-bx', postalCode: '1030' },
    { id: 'arr-an', name: 'Arrondissement d\'Anvers', type: 'Arrondissements', parentId: 'ant', code: '11000' },
    { id: 'com-an', name: 'Anvers', type: 'Communes', parentId: 'arr-an' },
    { id: 'loc-an-2000', name: '2000 Anvers', type: 'Localités', parentId: 'arr-an', postalCode: '2000' },
    { id: 'arr-lg', name: 'Arrondissement de Liège', type: 'Arrondissements', parentId: 'lg', code: '62000' },
    { id: 'com-lg', name: 'Liège', type: 'Communes', parentId: 'arr-lg' },
    { id: 'loc-lg-4000', name: '4000 Liège', type: 'Localités', parentId: 'arr-lg', postalCode: '4000' },
];

export const CATEGORIES_ORDER: LocationCategory[] = [
    'Pays',
    'Régions',
    'Provinces',
    'Arrondissements',
    'Communes',
    'Localités'
];

let memoryCache: LocationEntry[] | null = null;
const CACHE_KEY = STORAGE_KEYS.locationsCache;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function saveToLocalStorage(entries: LocationEntry[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            ts: Date.now(),
            entries,
        }));
    } catch {
        // Ignore localStorage quota errors
    }
}

function mergeWithFallback(apiEntries: LocationEntry[], fallback: LocationEntry[]): LocationEntry[] {
    const byKey = new Map<string, LocationEntry>();

    for (const entry of apiEntries) {
        const key = `${entry.type}::${entry.name.toLowerCase()}`;
        byKey.set(key, entry);
    }

    for (const entry of fallback) {
        const key = `${entry.type}::${entry.name.toLowerCase()}`;
        if (!byKey.has(key)) {
            byKey.set(key, entry);
        } else {
            // Merge: prefer API data but backfill missing hierarchy fields from fallback
            const existing = byKey.get(key)!;
            byKey.set(key, {
                ...existing,
                parentId: existing.parentId || entry.parentId,
                code: existing.code || entry.code,
                postalCode: existing.postalCode || entry.postalCode,
                level: existing.level ?? entry.level,
            });
        }
    }

    return Array.from(byKey.values());
}

function readFromLocalStorage(): LocationEntry[] | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.ts || !Array.isArray(parsed?.entries)) return null;
        if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
        // Ensure cached data is merged with fallback (handles old caches + partial API data)
        return mergeWithFallback(parsed.entries as LocationEntry[], fallbackLocations);
    } catch {
        return null;
    }
}

export const locationCache = {
    search: (query: string): LocationEntry[] => {
        if (!query) return [];
        const normalized = query.toLowerCase();
        const source = memoryCache || fallbackLocations;
        return source.filter(loc => loc.name.toLowerCase().includes(normalized));
    },

    /** @internal Only for tests. */
    __resetForTests: () => {
        memoryCache = null;
        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem(CACHE_KEY);
            } catch {
                // ignore
            }
        }
    },

    getHierarchy: async (): Promise<LocationEntry[]> => {
        if (memoryCache && memoryCache.length > 0) {
            return memoryCache;
        }

        const cached = readFromLocalStorage();
        if (cached && cached.length > 0) {
            memoryCache = cached;
            return cached;
        }

        try {
            const response = await fetch("/api/locations");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (Array.isArray(data?.entries) && data.entries.length > 0) {
                // Merge API entries with fallback locations to ensure we always have
                // a complete hierarchy (arrondissements, communes, parent links)
                // even when the API returns partial data (e.g. ODWB fallback).
                const merged = mergeWithFallback(data.entries, fallbackLocations);
                memoryCache = merged;
                saveToLocalStorage(merged);
                return merged;
            }
        } catch (error) {
            console.error("Unable to load locations from API, using fallback.", error);
        }

        memoryCache = fallbackLocations;
        return fallbackLocations;
    }
};

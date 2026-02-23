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
    { id: 'arr-ve', name: 'Arrondissement de Verviers', type: 'Arrondissements', parentId: 'lg' },
    { id: 'com-ve', name: 'Verviers', type: 'Communes', parentId: 'arr-ve' },
    { id: 'loc-ve', name: '4800 Verviers', type: 'Localités', parentId: 'arr-ve' },
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
const CACHE_KEY = "forem_idable_locations_cache_v1";
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

function readFromLocalStorage(): LocationEntry[] | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.ts || !Array.isArray(parsed?.entries)) return null;
        if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
        return parsed.entries as LocationEntry[];
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
                memoryCache = data.entries;
                saveToLocalStorage(data.entries);
                return data.entries;
            }
        } catch (error) {
            console.error("Unable to load locations from API, using fallback.", error);
        }

        memoryCache = fallbackLocations;
        return fallbackLocations;
    }
};

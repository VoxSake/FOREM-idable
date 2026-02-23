export type LocationCategory = 'Pays' | 'Régions' | 'Provinces' | 'Arrondissements' | 'Localités';

export interface LocationEntry {
    id: string;
    name: string;
    type: LocationCategory;
    parentId?: string;
}

const mockLocations: LocationEntry[] = [
    // Pays
    { id: 'be', name: 'Belgique', type: 'Pays' },

    // Régions
    { id: 'wal', name: 'Wallonie', type: 'Régions', parentId: 'be' },
    { id: 'bru', name: 'Région de Bruxelles-Capitale', type: 'Régions', parentId: 'be' },
    { id: 'vla', name: 'Flandre', type: 'Régions', parentId: 'be' },

    // Provinces
    { id: 'bw', name: 'Brabant Wallon', type: 'Provinces', parentId: 'wal' },
    { id: 'ht', name: 'Hainaut', type: 'Provinces', parentId: 'wal' },
    { id: 'lg', name: 'Liège', type: 'Provinces', parentId: 'wal' },
    { id: 'lx', name: 'Luxembourg', type: 'Provinces', parentId: 'wal' },
    { id: 'na', name: 'Namur', type: 'Provinces', parentId: 'wal' },

    // Arrondissements (sélection pour l'exemple)
    { id: 'arr-lg', name: 'Arrondissement de Liège', type: 'Arrondissements', parentId: 'lg' },
    { id: 'arr-ve', name: 'Arrondissement de Verviers', type: 'Arrondissements', parentId: 'lg' },
    { id: 'arr-na', name: 'Arrondissement de Namur', type: 'Arrondissements', parentId: 'na' },
    { id: 'arr-ch', name: 'Arrondissement de Charleroi', type: 'Arrondissements', parentId: 'ht' },

    // Localités (villes et communes clés)
    { id: 'loc-bru', name: '1000 Bruxelles', type: 'Localités', parentId: 'bru' },
    { id: 'loc-wavre', name: '1300 Wavre', type: 'Localités', parentId: 'bw' },
    { id: 'loc-wb', name: '1410 Waterloo', type: 'Localités', parentId: 'bw' },
    { id: 'loc-lg', name: '4000 Liège', type: 'Localités', parentId: 'arr-lg' },
    { id: 'loc-ve', name: '4800 Verviers', type: 'Localités', parentId: 'arr-ve' },
    { id: 'loc-hf', name: '4840 Welkenraedt', type: 'Localités', parentId: 'arr-ve' },
    { id: 'loc-na', name: '5000 Namur', type: 'Localités', parentId: 'arr-na' },
    { id: 'loc-char', name: '6000 Charleroi', type: 'Localités', parentId: 'arr-ch' },
    { id: 'loc-arl', name: '6700 Arlon', type: 'Localités', parentId: 'lx' },
    { id: 'loc-mons', name: '7000 Mons', type: 'Localités', parentId: 'ht' },
];

export const CATEGORIES_ORDER: LocationCategory[] = [
    'Pays',
    'Régions',
    'Provinces',
    'Arrondissements',
    'Localités'
];

export const locationCache = {
    search: (query: string): LocationEntry[] => {
        if (!query) return [];
        const normalized = query.toLowerCase();
        return mockLocations.filter(loc => loc.name.toLowerCase().includes(normalized));
    },

    getHierarchy: (): LocationEntry[] => {
        return mockLocations;
    }
};

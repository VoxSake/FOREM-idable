import { Job } from '@/types/job';
import { LocationEntry, locationCache } from '@/services/location/locationCache';

const FOREM_API_BASE = 'https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/records';

export interface ForemSearchParams {
    keywords?: string[];
    locations?: LocationEntry[];
    limit?: number;
    offset?: number;
    booleanMode?: 'AND' | 'OR';
}

export async function fetchForemJobs(params: ForemSearchParams): Promise<{ jobs: Job[]; total: number }> {
    try {
        const url = new URL(FOREM_API_BASE);
        // L'API ODWB permet -1 pour récupérer tous les résultats de la recherche d'un coup
        url.searchParams.append('limit', (params.limit !== undefined ? params.limit : -1).toString());
        url.searchParams.append('offset', (params.offset || 0).toString());

        // Forem ODWB dataset uses specific text search
        // We can use the 'where' clause for opendatasoft API (v2.1)
        const filters: string[] = [];

        if (params.keywords && params.keywords.length > 0) {
            // Create search query for each keyword. We search broadly across all fields using "search" function
            const joiner = params.booleanMode === 'AND' ? ' AND ' : ' OR ';
            const keywordQuery = params.keywords.map(kw => `search("${kw}")`).join(joiner);
            filters.push(`(${keywordQuery})`);
        }

        if (params.locations && params.locations.length > 0) {
            const locationClauses = await Promise.all(
                params.locations.map((entry) => buildLocationFilter(entry.name, entry))
            );
            const effectiveClauses = locationClauses.filter(Boolean);
            if (effectiveClauses.length > 0) {
                filters.push(`(${effectiveClauses.join(" OR ")})`);
            }
        }

        if (filters.length > 0) {
            url.searchParams.append('where', filters.join(' AND '));
        }

        const response = await fetch(url.toString(), {
            // In Next.js App Router, we can configure cache behaviors here. Default is fine for now.
            method: "GET"
        });

        if (!response.ok) {
            console.error(`Forem API error: ${response.status} ${response.statusText}`);
            return { jobs: [], total: 0 };
        }

        const data = await response.json();
        return {
            jobs: data.results ? data.results.map(mapForemJobToStandard) : [],
            total: data.total_count || 0
        };
    } catch (error) {
        console.error('Error fetching Forem jobs:', error);
        return { jobs: [], total: 0 };
    }
}

function escapeOdsString(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function stripPostalPrefix(value: string): string {
    return value.replace(/^\d{4}\s+/, '').trim();
}

function normalizeRegionLabel(label: string): string {
    if (label === "Wallonie") return "RÉGION WALLONNE";
    if (label === "Flandre") return "RÉGION FLAMANDE";
    if (label === "Région de Bruxelles-Capitale") return "RÉGION DE BRUXELLES-CAPITALE";
    return label;
}

function buildInClause(field: string, values: string[]): string | null {
    const unique = Array.from(new Set(values.map(v => v.trim()).filter(Boolean)));
    if (unique.length === 0) return null;
    const quoted = unique.map(v => `"${escapeOdsString(v)}"`).join(",");
    return `${field} in (${quoted})`;
}

async function buildArrondissementClause(locationEntry: LocationEntry): Promise<string | null> {
    const entries = await locationCache.getHierarchy();
    const arrondissementCode = locationEntry.code;
    if (!arrondissementCode || !/^\d{5}$/.test(arrondissementCode)) return null;

    const prefix = arrondissementCode.slice(0, 2);

    const localityNames = entries
        .filter((entry) =>
            entry.type === "Localités" &&
            entry.code &&
            entry.code.startsWith(prefix) &&
            entry.postalCode
        )
        .map((entry) => stripPostalPrefix(entry.name));

    const postals = entries
        .filter((entry) =>
            entry.type === "Localités" &&
            entry.code &&
            entry.code.startsWith(prefix) &&
            entry.postalCode
        )
        .map((entry) => entry.postalCode as string);

    const localitiesClause = buildInClause("lieuxtravaillocalite", [
        ...localityNames,
        ...localityNames.map((name) => name.toUpperCase()),
    ]);
    const postalsClause = buildInClause("lieuxtravailcodepostal", postals);

    if (localitiesClause && postalsClause) return `(${localitiesClause} OR ${postalsClause})`;
    return localitiesClause || postalsClause;
}

async function buildLocationFilter(location: string, locationEntry?: LocationEntry): Promise<string> {
    const cleanLocation = stripPostalPrefix(location);
    const normalizedRegion = normalizeRegionLabel(cleanLocation);

    if (!locationEntry) {
        // Fallback for legacy values
        return `search("${escapeOdsString(normalizedRegion)}")`;
    }

    if (locationEntry.type === "Pays") {
        return `lieuxtravailregion in ("Belgique")`;
    }

    if (locationEntry.type === "Régions") {
        return buildInClause("lieuxtravailregion", [normalizeRegionLabel(locationEntry.name)]) || `search("${escapeOdsString(normalizedRegion)}")`;
    }

    if (locationEntry.type === "Provinces") {
        let provinceName = locationEntry.name.trim();
        if (!/^Province\s+/i.test(provinceName)) {
            provinceName = `Province de ${provinceName}`;
        }
        return buildInClause("lieuxtravailregion", [provinceName]) || `search("${escapeOdsString(normalizedRegion)}")`;
    }

    if (locationEntry.type === "Arrondissements") {
        const arrClause = await buildArrondissementClause(locationEntry);
        return arrClause || `search("${escapeOdsString(normalizedRegion)}")`;
    }

    if (locationEntry.type === "Communes" || locationEntry.type === "Localités") {
        const localityName = stripPostalPrefix(locationEntry.name);
        const localityClause = buildInClause("lieuxtravaillocalite", [localityName, localityName.toUpperCase()]);
        const cp = locationEntry.postalCode || (locationEntry.name.match(/^(\d{4})\s+/)?.[1] ?? "");
        const postalClause = cp ? buildInClause("lieuxtravailcodepostal", [cp]) : null;

        if (localityClause && postalClause) return `(${localityClause} OR ${postalClause})`;
        return localityClause || postalClause || `search("${escapeOdsString(normalizedRegion)}")`;
    }

    return `search("${escapeOdsString(normalizedRegion)}")`;
}

function mapForemJobToStandard(record: Record<string, unknown>): Job {
    const localites = Array.isArray(record.lieuxtravaillocalite) ? record.lieuxtravaillocalite as string[] : [];
    const locationString = localites.length > 0 ? localites.join(', ') : 'Wallonie';

    return {
        id: (record.numerooffreforem as string) || Math.random().toString(),
        title: (record.titreoffre as string) || 'Poste non spécifié',
        company: record.nomemployeur as string | undefined,
        location: locationString,
        contractType: (record.typecontrat as string) || 'Non spécifié',
        publicationDate: (record.datedebutdiffusion as string) || new Date().toISOString(),
        url: (record.url as string) || `https://www.leforem.be/recherche-offres/offre-detail/${record.numerooffreforem}`,
        description: (record.metier as string) || '',
        source: 'forem',
        pdfUrl: undefined
    };
}

import { z } from "zod";
import { Job } from '@/types/job';
import { LocationEntry, locationCache } from '@/services/location/locationCache';

const FOREM_API_BASE = 'https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/records';
const FOREM_API_PAGE_SIZE = 100;
const FOREM_DEFAULT_FETCH_LIMIT = 1000;
const FOREM_MAX_FETCH_LIMIT = 9900;
const FOREM_API_PARALLEL_REQUESTS = 4;

export interface ForemSearchParams {
    keywords?: string[];
    locations?: LocationEntry[];
    limit?: number;
    offset?: number;
    booleanMode?: 'AND' | 'OR';
}

const foremRecordSchema = z
    .object({
        numerooffreforem: z.union([z.string(), z.number()]).optional(),
        titreoffre: z.string().optional(),
        nomemployeur: z.string().optional(),
        lieuxtravaillocalite: z.array(z.string()).optional(),
        typecontrat: z.string().optional(),
        datedebutdiffusion: z.string().optional(),
        url: z.string().optional(),
        metier: z.string().optional(),
    })
    .passthrough();

const foremApiResponseSchema = z
    .object({
        results: z.array(foremRecordSchema).default([]),
        total_count: z.number().optional(),
    })
    .passthrough();

export async function fetchForemJobs(params: ForemSearchParams): Promise<{ jobs: Job[]; total: number }> {
    try {
        const whereClause = await buildWhereClause(params);
        const targetLimit = clampRequestedLimit(params.limit);
        const startOffset = Math.max(params.offset || 0, 0);
        const firstPageLimit = Math.min(FOREM_API_PAGE_SIZE, targetLimit);
        const firstPage = await fetchForemPage({
            where: whereClause,
            limit: firstPageLimit,
            offset: startOffset,
        });

        if (!firstPage) {
            return { jobs: [], total: 0 };
        }

        const jobs: Job[] = [...firstPage.jobs];
        const totalCount = firstPage.total;

        const cappedTotal = totalCount > 0
            ? Math.min(Math.max(totalCount - startOffset, 0), targetLimit)
            : targetLimit;

        if (jobs.length >= cappedTotal || firstPage.jobs.length < firstPageLimit) {
            return {
                jobs: jobs.slice(0, cappedTotal),
                total: totalCount || jobs.length,
            };
        }

        const offsets: number[] = [];
        for (
            let offset = startOffset + firstPageLimit;
            offset < startOffset + cappedTotal && offset < FOREM_MAX_FETCH_LIMIT;
            offset += FOREM_API_PAGE_SIZE
        ) {
            offsets.push(offset);
        }

        for (let index = 0; index < offsets.length; index += FOREM_API_PARALLEL_REQUESTS) {
            const chunk = offsets.slice(index, index + FOREM_API_PARALLEL_REQUESTS);
            const pageResults = await Promise.all(
                chunk.map(async (offset) => {
                    const remaining = cappedTotal - (offset - startOffset);
                    const limit = Math.min(FOREM_API_PAGE_SIZE, remaining);
                    return fetchForemPage({ where: whereClause, limit, offset });
                })
            );

            for (const page of pageResults) {
                if (!page) continue;
                jobs.push(...page.jobs);
            }
        }

        return {
            jobs: jobs.slice(0, cappedTotal),
            total: totalCount || jobs.length,
        };
    } catch (error) {
        console.error('Error fetching Forem jobs:', error);
        return { jobs: [], total: 0 };
    }
}

function clampRequestedLimit(limit?: number): number {
    if (typeof limit !== "number" || limit <= 0) return FOREM_DEFAULT_FETCH_LIMIT;
    return Math.min(limit, FOREM_MAX_FETCH_LIMIT);
}

async function buildWhereClause(params: ForemSearchParams): Promise<string | null> {
    const filters: string[] = [];

    if (params.keywords && params.keywords.length > 0) {
        const joiner = params.booleanMode === 'AND' ? ' AND ' : ' OR ';
        const keywordQuery = params.keywords.map(kw => `search("${kw}")`).join(joiner);
        filters.push(`(${keywordQuery})`);
    }

    if (params.locations && params.locations.length > 0) {
        const resolvedLocations = await resolveLocations(params.locations);
        const locationClauses = await Promise.all(
            resolvedLocations.map((entry) => buildLocationFilter(entry.name, entry))
        );
        const effectiveClauses = locationClauses.filter(Boolean);
        if (effectiveClauses.length > 0) {
            filters.push(`(${effectiveClauses.join(" OR ")})`);
        }
    }

    return filters.length > 0 ? filters.join(' AND ') : null;
}

function buildForemSearchUrl(options: { where: string | null; limit: number; offset: number }): URL {
    const url = new URL(FOREM_API_BASE);
    url.searchParams.append("limit", String(options.limit));
    url.searchParams.append("offset", String(options.offset));
    url.searchParams.append("order_by", "datedebutdiffusion desc");

    if (options.where) {
        url.searchParams.append("where", options.where);
    }

    return url;
}

async function fetchForemPage(options: { where: string | null; limit: number; offset: number }): Promise<{ jobs: Job[]; total: number } | null> {
    const url = buildForemSearchUrl(options);
    const response = await fetch(url.toString(), { method: "GET" });

    if (!response.ok) {
        console.error(`Forem API error: ${response.status} ${response.statusText}`);
        return null;
    }

    const parsed = foremApiResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
        console.error("Forem API payload validation failed", parsed.error.flatten());
        return null;
    }

    const results = parsed.data.results;
    const total = Number.isFinite(parsed.data.total_count) ? parsed.data.total_count ?? 0 : 0;

    return {
        jobs: results.map(mapForemJobToStandard),
        total,
    };
}

async function resolveLocations(input: LocationEntry[]): Promise<LocationEntry[]> {
    const hierarchy = await locationCache.getHierarchy();
    const byId = new Map(hierarchy.map((entry) => [entry.id, entry]));

    return input.map((entry) => {
        const fromCache = byId.get(entry.id);
        if (!fromCache) return entry;

        return {
            ...fromCache,
            ...entry,
            code: entry.code || fromCache.code,
            postalCode: entry.postalCode || fromCache.postalCode,
            level: entry.level ?? fromCache.level,
            parentId: entry.parentId || fromCache.parentId,
        };
    });
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

function mapForemJobToStandard(record: z.infer<typeof foremRecordSchema>): Job {
    const localites = record.lieuxtravaillocalite ?? [];
    const locationString = localites.length > 0 ? localites.join(', ') : 'Wallonie';
    const offerId =
        typeof record.numerooffreforem === "number"
            ? String(record.numerooffreforem)
            : record.numerooffreforem;
    const url = record.url || `https://www.leforem.be/recherche-offres/offre-detail/${offerId ?? ""}`;
    const title = record.titreoffre || 'Poste non spécifié';
    const company = record.nomemployeur;
    const fallbackId = buildStableForemFallbackId({
        url,
        title,
        company,
        location: locationString,
    });

    return {
        id: offerId || fallbackId,
        title,
        company,
        location: locationString,
        contractType: record.typecontrat || 'Non spécifié',
        publicationDate: record.datedebutdiffusion || new Date().toISOString(),
        url,
        description: record.metier || '',
        source: 'forem',
        pdfUrl: undefined
    };
}

function buildStableForemFallbackId(parts: {
    url: string;
    title: string;
    company?: string;
    location: string;
}): string {
    const signature = [
        parts.url.trim().toLowerCase(),
        parts.title.trim().toLowerCase(),
        (parts.company || '').trim().toLowerCase(),
        parts.location.trim().toLowerCase(),
    ].join('|');

    let hash = 5381;
    for (let index = 0; index < signature.length; index += 1) {
        hash = ((hash << 5) + hash) ^ signature.charCodeAt(index);
    }

    return `forem-fallback-${Math.abs(hash >>> 0).toString(36)}`;
}

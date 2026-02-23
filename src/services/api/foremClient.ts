import { Job } from '@/types/job';

const FOREM_API_BASE = 'https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/records';

export interface ForemSearchParams {
    keywords?: string[];
    location?: string;
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

        if (params.location) {
            // Forem ODWD requires exact string matches for macro-regions
            let mappedLocation = params.location;
            if (mappedLocation === "Wallonie") mappedLocation = "RÉGION WALLONNE";
            else if (mappedLocation === "Flandre") mappedLocation = "RÉGION FLAMANDE";
            else if (mappedLocation === "Région de Bruxelles-Capitale") mappedLocation = "RÉGION DE BRUXELLES-CAPITALE";

            // Clean location to match ODS search better
            const cleanLocation = mappedLocation
                .replace(/^\d+\s+/, '') // Remove postal codes
                .replace(/^(Arrondissement de|Arrondissement d'|Province de|Province du)\s+/i, '')
                .trim();

            // ODS search() is highly resilient and matches the location accurately
            filters.push(`search("${cleanLocation}")`);
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

function mapForemJobToStandard(record: any): Job {
    const localites = record.lieuxtravaillocalite || [];
    const locationString = localites.length > 0 ? localites.join(', ') : 'Wallonie';

    return {
        id: record.numerooffreforem || Math.random().toString(),
        title: record.titreoffre || 'Poste non spécifié',
        company: record.nomemployeur,
        location: locationString,
        contractType: record.typecontrat || 'Non spécifié',
        publicationDate: record.datedebutdiffusion || new Date().toISOString(),
        url: record.url || `https://www.leforem.be/recherche-offres/offre-detail/${record.numerooffreforem}`,
        description: record.metier || '',
        source: 'forem',
        pdfUrl: undefined
    };
}

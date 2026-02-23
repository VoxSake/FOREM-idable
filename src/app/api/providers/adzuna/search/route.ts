import { NextRequest, NextResponse } from "next/server";
import { Job } from "@/types/job";
import { ForemSearchParams } from "@/services/api/foremClient";
import { LocationEntry } from "@/services/location/locationCache";
import { runtimeConfig } from "@/config/runtime";

interface AdzunaResult {
  id?: string | number;
  title?: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  contract_type?: string;
  contract_time?: string;
  category?: { label?: string };
}

interface AdzunaApiResponse {
  count?: number;
  results?: AdzunaResult[];
}

const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs";

function sanitizeLocationName(entry: LocationEntry): string {
  const raw = entry.name.trim();
  const noPostal = raw.replace(/^\d{4}\s+/, "");

  if (entry.type === "Arrondissements") {
    return noPostal.replace(/^Arrondissement\s+d[eu]?\s+/i, "").trim();
  }
  if (entry.type === "Provinces") {
    return noPostal.replace(/^Province\s+d[eu]?\s+/i, "").trim();
  }
  if (entry.type === "Régions") {
    if (/bruxelles/i.test(noPostal)) return "Brussels";
    if (/flandre/i.test(noPostal)) return "Flanders";
    if (/wallonie/i.test(noPostal)) return "Wallonia";
  }
  return noPostal;
}

function buildLocationQueries(locations?: LocationEntry[]): string[] {
  if (!locations || locations.length === 0) return [];
  const unique = new Set<string>();
  for (const entry of locations) {
    const value = sanitizeLocationName(entry);
    if (value) unique.add(value);
  }
  // Protect free-tier quota: max 5 location calls per search.
  return Array.from(unique).slice(0, 5);
}

function normalizeContract(result: AdzunaResult): string {
  const parts = [result.contract_type, result.contract_time].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(" · ");
  return result.category?.label || "Non spécifié";
}

function mapAdzunaResultToJob(result: AdzunaResult): Job | null {
  const url = result.redirect_url?.trim();
  const title = result.title?.trim();
  if (!url || !title) return null;

  const area = Array.isArray(result.location?.area) ? result.location?.area : [];
  const location = result.location?.display_name || area?.join(", ") || "Belgique";

  return {
    id: `adzuna-${String(result.id || url)}`,
    title,
    company: result.company?.display_name,
    location,
    contractType: normalizeContract(result),
    publicationDate: result.created || new Date().toISOString(),
    url,
    description: result.description || "",
    source: "adzuna",
    pdfUrl: undefined,
  };
}

function dedupeJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  const unique: Job[] = [];

  for (const job of jobs) {
    const key = [
      job.url.toLowerCase(),
      (job.title || "").toLowerCase(),
      (job.company || "").toLowerCase(),
      (job.location || "").toLowerCase(),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(job);
  }
  return unique;
}

async function fetchAdzunaPage(options: {
  appId: string;
  appKey: string;
  where?: string;
  keywords?: string[];
  resultsPerPage: number;
}): Promise<AdzunaApiResponse> {
  const searchUrl = new URL(
    `${ADZUNA_BASE_URL}/${runtimeConfig.adzuna.country}/search/1`
  );
  searchUrl.searchParams.set("app_id", options.appId);
  searchUrl.searchParams.set("app_key", options.appKey);
  searchUrl.searchParams.set("results_per_page", String(options.resultsPerPage));
  searchUrl.searchParams.set("content-type", "application/json");

  if (options.keywords && options.keywords.length > 0) {
    searchUrl.searchParams.set("what", options.keywords.join(" "));
  }

  if (options.where) {
    searchUrl.searchParams.set("where", options.where);
  }

  const response = await fetch(searchUrl.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    return { count: 0, results: [] };
  }

  return (await response.json()) as AdzunaApiResponse;
}

export async function POST(request: NextRequest) {
  try {
    const appId = runtimeConfig.adzuna.appId;
    const appKey = runtimeConfig.adzuna.appKey;

    if (!runtimeConfig.adzuna.enabled || !appId || !appKey) {
      return NextResponse.json({ jobs: [], total: 0, enabled: false });
    }

    const body = (await request.json()) as ForemSearchParams;
    const keywords = Array.isArray(body.keywords) ? body.keywords : [];
    const requestedLimit = typeof body.limit === "number" && body.limit > 0 ? body.limit : 50;
    const resultsPerPage = Math.min(Math.max(requestedLimit, 10), 50);
    const locations = Array.isArray(body.locations) ? body.locations : [];

    const locationQueries = buildLocationQueries(locations);
    const whereQueries = locationQueries.length > 0 ? locationQueries : [undefined];

    const responses = await Promise.all(
      whereQueries.map((where) =>
        fetchAdzunaPage({
          appId,
          appKey,
          where,
          keywords,
          resultsPerPage,
        })
      )
    );

    const rawJobs = responses.flatMap((r) => (Array.isArray(r.results) ? r.results : []));
    const mapped = rawJobs
      .map(mapAdzunaResultToJob)
      .filter((job): job is Job => Boolean(job));

    const deduped = dedupeJobs(mapped);
    const total = deduped.length;

    return NextResponse.json({
      jobs: deduped,
      total,
      enabled: true,
    });
  } catch (error) {
    console.error("Adzuna provider error:", error);
    return NextResponse.json({ jobs: [], total: 0, enabled: true }, { status: 500 });
  }
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchForemJobByOfferId, fetchForemJobs } from "@/services/api/foremClient";
import { locationCache } from "@/services/location/locationCache";

describe("foremClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts null optional fields from Forem payloads for keyword-only searches", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        total_count: 1,
        results: [
          {
            numerooffreforem: "1833207",
            titreoffre: "IT Support Officer (H/F/X)",
            nomemployeur: "L.I.P. Belgique",
            lieuxtravaillocalite: null,
            typecontrat: "CDI",
            datedebutdiffusion: "2026-03-20T10:00:00.000Z",
            url: "https://example.test/offre/1833207",
            metier: null,
          },
        ],
      }),
    } as Response);

    const result = await fetchForemJobs({
      keywords: ["developpeur"],
      locations: [],
      booleanMode: "OR",
      limit: 5,
      offset: 0,
    });

    expect(result.total).toBe(1);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]).toMatchObject({
      id: "1833207",
      title: "IT Support Officer (H/F/X)",
      location: "Wallonie",
      source: "forem",
    });
  });

  it("fetches a single Forem offer by offer id", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        total_count: 1,
        results: [
          {
            numerooffreforem: "1836265",
            titreoffre: "Développeur full stack",
            nomemployeur: "Forem Test",
            lieuxtravaillocalite: ["Namur"],
            typecontrat: "CDI",
            datedebutdiffusion: "2026-03-21T10:00:00.000Z",
            url: "https://www.leforem.be/recherche-offres/offre-detail/1836265",
            metier: "Développement applicatif",
          },
        ],
      }),
    } as Response);

    const job = await fetchForemJobByOfferId("1836265");

    expect(job).toMatchObject({
      id: "1836265",
      title: "Développeur full stack",
      company: "Forem Test",
      location: "Namur",
      source: "forem",
    });
  });

  it("falls back to clean arrondissement name in search() when no localities match", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ total_count: 3, results: [] }),
    } as Response);

    // Ensure location cache is seeded with fallback data
    vi.spyOn(locationCache, "getHierarchy").mockResolvedValue([
      { id: "arr-ve", name: "Arrondissement de Verviers", type: "Arrondissements", parentId: "lg", code: "63000" },
    ]);

    await fetchForemJobs({
      keywords: ["administratif"],
      locations: [{ id: "arr-ve", name: "Arrondissement de Verviers", type: "Arrondissements" }],
      booleanMode: "OR",
      limit: 5,
      offset: 0,
    });

    const url = new URL(fetchSpy.mock.calls[0][0] as string);
    const where = url.searchParams.get("where");
    // Should fallback to search("Verviers") instead of search("Arrondissement de Verviers")
    expect(where).toContain('search("Verviers")');
    expect(where).not.toContain('search("Arrondissement de Verviers")');
  });

  it("builds arrondissement clause from parentId-linked localities when available", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ total_count: 5, results: [] }),
    } as Response);

    vi.spyOn(locationCache, "getHierarchy").mockResolvedValue([
      { id: "arr-ve", name: "Arrondissement de Verviers", type: "Arrondissements", parentId: "lg", code: "63000" },
      { id: "loc-ve-4800", name: "4800 Verviers", type: "Localités", parentId: "arr-ve", postalCode: "4800" },
      { id: "loc-ve-4860", name: "4860 Verviers", type: "Localités", parentId: "arr-ve", postalCode: "4860" },
    ]);

    await fetchForemJobs({
      keywords: ["administratif"],
      locations: [{ id: "arr-ve", name: "Arrondissement de Verviers", type: "Arrondissements" }],
      booleanMode: "OR",
      limit: 5,
      offset: 0,
    });

    const url = new URL(fetchSpy.mock.calls[0][0] as string);
    const where = url.searchParams.get("where");
    // Should use locality names and postal codes from parentId-linked entries
    expect(where).toContain('lieuxtravaillocalite in ("Verviers","VERVIERS")');
    expect(where).toContain('lieuxtravailcodepostal in ("4800","4860")');
  });
});

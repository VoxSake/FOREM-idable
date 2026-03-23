import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchForemJobByOfferId, fetchForemJobs } from "@/services/api/foremClient";

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
});

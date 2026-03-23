import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchForemJobs } from "@/services/api/foremClient";

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
});

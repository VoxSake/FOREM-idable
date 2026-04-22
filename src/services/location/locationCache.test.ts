import { beforeEach, describe, expect, it, vi } from "vitest";
import { locationCache } from "@/services/location/locationCache";

describe("locationCache", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    locationCache.__resetForTests();
  });

  it("merges API entries with fallback to preserve hierarchy", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [
          { id: "reg-wal", name: "RÉGION WALLONNE", type: "Régions" },
          { id: "loc-4800", name: "4800 Verviers", type: "Localités", postalCode: "4800" },
        ],
      }),
    } as Response);

    const hierarchy = await locationCache.getHierarchy();

    // Should contain the API entry
    expect(hierarchy.some((e) => e.name === "4800 Verviers")).toBe(true);

    // Should also contain fallback arrondissement (not present in API data)
    expect(hierarchy.some((e) => e.name === "Arrondissement de Verviers")).toBe(true);

    // Should contain fallback province
    expect(hierarchy.some((e) => e.name === "Liège" && e.type === "Provinces")).toBe(true);
  });

  it("backfills missing hierarchy fields from fallback when merging", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [
          { id: "loc-4800", name: "4800 Verviers", type: "Localités", postalCode: "4800" },
        ],
      }),
    } as Response);

    const hierarchy = await locationCache.getHierarchy();
    const verviersLoc = hierarchy.find((e) => e.name === "4800 Verviers");

    expect(verviersLoc).toBeDefined();
    // Fallback has parentId for this locality
    expect(verviersLoc?.parentId).toBe("arr-ve");
  });

  it("prefers API data over fallback when both exist", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [
          { id: "loc-ve-4800", name: "4800 Verviers", type: "Localités", postalCode: "9999" },
        ],
      }),
    } as Response);

    const hierarchy = await locationCache.getHierarchy();
    const verviersLoc = hierarchy.find((e) => e.name === "4800 Verviers");

    expect(verviersLoc?.postalCode).toBe("9999");
    // But still backfills parentId from fallback
    expect(verviersLoc?.parentId).toBe("arr-ve");
  });
});

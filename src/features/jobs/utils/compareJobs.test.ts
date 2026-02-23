import { MAX_COMPARE_ITEMS, toggleCompareJobs } from "./compareJobs";
import { Job } from "@/types/job";

function makeJob(id: string): Job {
  return {
    id,
    title: `Job ${id}`,
    location: "Liège",
    contractType: "CDI",
    publicationDate: "2026-01-01",
    url: `https://example.com/${id}`,
    source: "forem",
  };
}

describe("toggleCompareJobs", () => {
  it("adds a job when absent", () => {
    const result = toggleCompareJobs([], makeJob("1"));
    expect(result.map((job) => job.id)).toEqual(["1"]);
  });

  it("removes a job when already selected", () => {
    const result = toggleCompareJobs([makeJob("1"), makeJob("2")], makeJob("1"));
    expect(result.map((job) => job.id)).toEqual(["2"]);
  });

  it("does not add beyond max compare items", () => {
    const seed = Array.from({ length: MAX_COMPARE_ITEMS }, (_, i) => makeJob(String(i + 1)));
    const result = toggleCompareJobs(seed, makeJob("999"));
    expect(result).toHaveLength(MAX_COMPARE_ITEMS);
    expect(result.map((job) => job.id)).not.toContain("999");
  });
});


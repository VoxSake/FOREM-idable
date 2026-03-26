import { describe, expect, it } from "vitest";
import { normalizeApplicationPatch } from "@/lib/server/requestSchemas";

describe("requestSchemas", () => {
  it("preserves explicit null values when normalizing an application patch", () => {
    const patch = normalizeApplicationPatch("job-1", {
      status: "in_progress",
      interviewAt: null,
      interviewDetails: null,
      lastFollowUpAt: null,
    });

    expect(patch).toMatchObject({
      status: "in_progress",
      interviewAt: null,
      interviewDetails: null,
      lastFollowUpAt: null,
      followUpDueAt: undefined,
    });
  });

  it("leaves omitted nullable fields undefined", () => {
    const patch = normalizeApplicationPatch("job-1", {
      status: "interview",
    });

    expect(patch.interviewAt).toBeUndefined();
    expect(patch.interviewDetails).toBeUndefined();
    expect(patch.lastFollowUpAt).toBeUndefined();
    expect(patch.followUpDueAt).toBeUndefined();
  });
});

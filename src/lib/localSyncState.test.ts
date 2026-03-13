import { describe, expect, it } from "vitest";
import { getLocalSyncUpdatedAt } from "@/lib/localSyncState";
import { STORAGE_KEYS } from "@/lib/storageKeys";

describe("localSyncState", () => {
  it("infers the latest local update time from stored applications when no sync marker exists", () => {
    const storage = window.localStorage;
    storage.clear();

    const appliedAt = "2026-03-10T08:00:00.000Z";
    const updatedAt = "2026-03-13T08:30:00.000Z";
    const interviewAt = "2026-03-12T09:00:00.000Z";

    const values = {
      [STORAGE_KEYS.applications]: JSON.stringify([
        {
          appliedAt,
          updatedAt,
          interviewAt,
          lastFollowUpAt: "2026-03-11T10:00:00.000Z",
        },
      ]),
    };

    expect(getLocalSyncUpdatedAt(storage, values)).toBe(updatedAt);
  });
});

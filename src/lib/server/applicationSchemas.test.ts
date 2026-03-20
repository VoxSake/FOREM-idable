import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseStoredJobApplication,
  safeParseStoredJobApplication,
} from "@/lib/server/applicationSchemas";

describe("applicationSchemas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses a valid stored application payload", () => {
    const application = parseStoredJobApplication(
      {
        job: {
          id: "forem-1",
          title: "Dev React",
          location: "Namur",
          contractType: "CDI",
          publicationDate: "2026-03-18T10:00:00.000Z",
          url: "https://example.com/job/1",
          source: "forem",
        },
        appliedAt: "2026-03-18T10:00:00.000Z",
        followUpDueAt: "2026-03-25T10:00:00.000Z",
        status: "in_progress",
        updatedAt: "2026-03-18T10:00:00.000Z",
      },
      "test"
    );

    expect(application.job.title).toBe("Dev React");
    expect(application.status).toBe("in_progress");
  });

  it("returns null in safe mode for an invalid payload", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(safeParseStoredJobApplication({ bad: true }, "invalid")).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "Skipping invalid stored application payload",
      expect.objectContaining({
        context: "invalid",
        userId: null,
        jobId: null,
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: "job",
          }),
        ]),
      })
    );
  });

  it("normalizes legacy coach note payloads before validation", () => {
    const application = parseStoredJobApplication(
      {
        job: {
          id: "forem-2",
          title: "Dev Node",
          location: "Liège",
          contractType: "CDI",
          publicationDate: "2026-03-18T10:00:00.000Z",
          url: "https://example.com/job/2",
          source: "forem",
        },
        appliedAt: "2026-03-18T10:00:00.000Z",
        followUpDueAt: "2026-03-25T10:00:00.000Z",
        status: "follow_up",
        privateCoachNote: {
          content: "Note privée legacy",
          updatedAt: "2026-03-19T10:00:00.000Z",
        },
        sharedCoachNotes: [
          {
            content: "Note partagée legacy",
            updatedAt: "2026-03-20T10:00:00.000Z",
          },
        ],
        updatedAt: "2026-03-18T10:00:00.000Z",
      },
      "legacy-notes"
    );

    expect(application.privateCoachNote?.createdBy.role).toBe("system");
    expect(application.privateCoachNote?.contributors).toHaveLength(1);
    expect(application.sharedCoachNotes?.[0]?.id).toBe("legacy-shared-note-0");
    expect(application.sharedCoachNotes?.[0]?.createdBy.role).toBe("system");
  });

  it("includes user and job identifiers in safe-parse warnings when available", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      safeParseStoredJobApplication(
        {
          job: {
            id: "manual-42",
          },
        },
        "user:1:position:0"
      )
    ).toBeNull();

    expect(warnSpy).toHaveBeenCalledWith(
      "Skipping invalid stored application payload",
      expect.objectContaining({
        context: "user:1:position:0",
        userId: "1",
        jobId: "manual-42",
      })
    );
  });
});

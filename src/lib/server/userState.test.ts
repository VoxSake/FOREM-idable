import { describe, expect, it } from "vitest";
import {
  mergeApplicationsWithServerFields,
  sanitizeApplicationsForBeneficiary,
} from "@/lib/server/userState";
import { JobApplication } from "@/types/application";

const baseApplication: JobApplication = {
  job: {
    id: "job-1",
    title: "Collaborateur admin polyvalent",
    company: "ESI Informatique",
    location: "Verviers",
    contractType: "CDD",
    publicationDate: "2026-03-10T10:00:00.000Z",
    url: "https://example.com/job-1",
    source: "forem",
  },
  appliedAt: "2026-03-13T10:00:00.000Z",
  followUpDueAt: "2026-03-20T10:00:00.000Z",
  status: "rejected",
  updatedAt: "2026-03-13T10:00:00.000Z",
};

describe("userState helpers", () => {
  it("preserves server-side coach fields when local sync payload does not include them", () => {
    const merged = mergeApplicationsWithServerFields({
      incoming: [{ ...baseApplication, notes: "note beneficiary" }],
      existing: [
        {
          ...baseApplication,
          coachNote: "Relancer le bénéficiaire sur la suite",
          shareCoachNoteWithBeneficiary: true,
        },
      ],
    });

    expect(merged[0]?.coachNote).toBe("Relancer le bénéficiaire sur la suite");
    expect(merged[0]?.shareCoachNoteWithBeneficiary).toBe(true);
  });

  it("hides non-shared coach notes from the beneficiary payload", () => {
    const sanitized = sanitizeApplicationsForBeneficiary([
      {
        ...baseApplication,
        coachNote: "Ne pas exposer",
        shareCoachNoteWithBeneficiary: false,
      },
      {
        ...baseApplication,
        job: { ...baseApplication.job, id: "job-2" },
        coachNote: "Visible",
        shareCoachNoteWithBeneficiary: true,
      },
    ]);

    expect(sanitized[0]?.coachNote).toBeUndefined();
    expect(sanitized[1]?.coachNote).toBe("Visible");
  });
});

import { describe, expect, it } from "vitest";
import { buildCoachPrioritySections, buildCoachRecentActivity, isCoachUserInactive } from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

function makeUser(overrides: Partial<CoachUserSummary>): CoachUserSummary {
  return {
    id: overrides.id ?? 1,
    email: overrides.email ?? "user@example.com",
    firstName: overrides.firstName ?? "Jane",
    lastName: overrides.lastName ?? "Doe",
    role: overrides.role ?? "user",
    groupIds: overrides.groupIds ?? [1],
    groupNames: overrides.groupNames ?? ["Groupe A"],
    applicationCount: overrides.applicationCount ?? 1,
    interviewCount: overrides.interviewCount ?? 0,
    dueCount: overrides.dueCount ?? 0,
    acceptedCount: overrides.acceptedCount ?? 0,
    rejectedCount: overrides.rejectedCount ?? 0,
    inProgressCount: overrides.inProgressCount ?? 1,
    latestActivityAt: overrides.latestActivityAt ?? "2026-03-01T09:00:00.000Z",
    lastSeenAt: overrides.lastSeenAt ?? null,
    lastCoachActionAt: overrides.lastCoachActionAt ?? null,
    applications: overrides.applications ?? [],
  };
}

describe("buildCoachPrioritySections", () => {
  it("groups due follow-ups and upcoming interviews by beneficiary", () => {
    const users = [
      makeUser({
        id: 1,
        firstName: "Alice",
        dueCount: 2,
        interviewCount: 1,
        latestActivityAt: "2026-03-10T10:00:00.000Z",
        applications: [
          {
            job: {
              id: "job-1",
              title: "Dev",
              company: "Acme",
              location: "Bruxelles",
              contractType: "CDI",
              publicationDate: "2026-03-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-03-01T09:00:00.000Z",
            followUpDueAt: "2026-03-12T00:00:00.000Z",
            followUpEnabled: true,
            status: "follow_up",
            updatedAt: "2026-03-10T10:00:00.000Z",
            interviewAt: "2026-03-20T09:00:00.000Z",
          },
          {
            job: {
              id: "job-2",
              title: "UX",
              company: "Acme",
              location: "Namur",
              contractType: "CDD",
              publicationDate: "2026-03-05T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-03-05T09:00:00.000Z",
            followUpDueAt: "2026-03-14T00:00:00.000Z",
            followUpEnabled: true,
            status: "in_progress",
            updatedAt: "2026-03-11T10:00:00.000Z",
          },
        ],
      }),
    ];

    const sections = buildCoachPrioritySections(users, new Date("2026-03-18T12:00:00.000Z"));

    expect(sections[0].total).toBe(1);
    expect(sections[0].items[0]?.summary).toContain("2 relances");
    expect(sections[1].total).toBe(1);
    expect(sections[1].items[0]?.detail).toContain("20 mars 2026");
  });

  it("flags inactive beneficiaries with applications after 14 days", () => {
    const users = [
      makeUser({
        id: 2,
        firstName: "Bruno",
        latestActivityAt: "2026-02-20T09:00:00.000Z",
        applicationCount: 3,
        applications: [
          {
            job: {
              id: "job-3",
              title: "Ops",
              company: "Beta",
              location: "Liege",
              contractType: "CDI",
              publicationDate: "2026-02-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-02-01T09:00:00.000Z",
            followUpDueAt: "2026-02-08T09:00:00.000Z",
            followUpEnabled: false,
            status: "rejected",
            updatedAt: "2026-02-20T09:00:00.000Z",
          },
        ],
      }),
    ];

    const sections = buildCoachPrioritySections(users, new Date("2026-03-18T12:00:00.000Z"));

    expect(sections[2].total).toBe(1);
    expect(sections[2].items[0]?.summary).toContain("Inactif depuis");
  });
});

describe("coach activity helpers", () => {
  it("detects inactive beneficiaries after 14 days", () => {
    expect(
      isCoachUserInactive(
        makeUser({
          latestActivityAt: "2026-03-01T09:00:00.000Z",
          applicationCount: 2,
        }),
        new Date("2026-03-18T12:00:00.000Z")
      )
    ).toBe(true);
  });

  it("builds recent activity entries ordered from newest to oldest", () => {
    const items = buildCoachRecentActivity([
      makeUser({
        id: 3,
        firstName: "Carla",
        latestActivityAt: "2026-03-17T09:00:00.000Z",
        applications: [
          {
            job: {
              id: "job-4",
              title: "Data",
              company: "Gamma",
              location: "Mons",
              contractType: "CDI",
              publicationDate: "2026-03-01T00:00:00.000Z",
              url: "#",
              source: "forem",
            },
            appliedAt: "2026-03-01T09:00:00.000Z",
            followUpDueAt: "2026-03-08T09:00:00.000Z",
            followUpEnabled: true,
            status: "in_progress",
            updatedAt: "2026-03-17T09:00:00.000Z",
            sharedCoachNotes: [
              {
                id: "note-1",
                content: "Point fait",
                createdAt: "2026-03-16T09:00:00.000Z",
                updatedAt: "2026-03-18T08:00:00.000Z",
                createdBy: {
                  id: 10,
                  firstName: "Coach",
                  lastName: "One",
                  email: "coach@example.com",
                  role: "coach",
                },
                contributors: [],
              },
            ],
          },
        ],
      }),
    ]);

    expect(items[0]?.title).toBe("Note coach partagée mise à jour");
    expect(items[0]?.timestamp).toBe("2026-03-18T08:00:00.000Z");
  });
});

import { expect, test } from "@playwright/test";

type Actor = "user" | "coach";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  publicationDate: string;
  url: string;
  source: "forem";
};

type Application = {
  job: Job;
  appliedAt: string;
  followUpDueAt: string;
  followUpEnabled: boolean;
  status: "in_progress";
  notes: string | null;
  proofs: string | null;
  interviewAt: null;
  interviewDetails: null;
  updatedAt: string;
};

const locationEntries = [
  { id: "be", name: "Belgique", type: "Pays" },
  { id: "wal", name: "Wallonie", type: "Régions", parentId: "be" },
  { id: "lg", name: "Liège", type: "Provinces", parentId: "wal" },
  { id: "loc-liege", name: "4000 Liège", type: "Localités", parentId: "lg", postalCode: "4000" },
];

const searchJob: Job = {
  id: "forem-1",
  title: "Développeur Frontend React",
  company: "ACME",
  location: "Liège",
  contractType: "CDI",
  publicationDate: "2026-03-20T09:00:00.000Z",
  url: "https://example.test/jobs/forem-1",
  source: "forem",
};

function createApplication(job: Job): Application {
  return {
    job,
    appliedAt: "2026-03-21T10:00:00.000Z",
    followUpDueAt: "2026-03-28T10:00:00.000Z",
    followUpEnabled: true,
    status: "in_progress",
    notes: null,
    proofs: null,
    interviewAt: null,
    interviewDetails: null,
    updatedAt: "2026-03-21T10:00:00.000Z",
  };
}

function buildCoachDashboard(applications: Application[]) {
  return {
    viewer: {
      id: 2,
      email: "coach@example.com",
      firstName: "Camille",
      lastName: "Coach",
      role: "coach",
    },
    users: [
      {
        id: 1,
        email: "user@example.com",
        firstName: "Jordi",
        lastName: "User",
        role: "user",
        groupIds: [10],
        groupNames: ["Groupe Liège"],
        applicationCount: applications.length,
        interviewCount: 0,
        dueCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        inProgressCount: applications.length,
        latestActivityAt: applications[0]?.updatedAt ?? null,
        lastSeenAt: "2026-03-21T12:00:00.000Z",
        lastCoachActionAt: null,
        applications,
      },
    ],
    groups: [
      {
        id: 10,
        name: "Groupe Liège",
        createdAt: "2026-03-20T09:00:00.000Z",
        createdBy: {
          id: 2,
          email: "coach@example.com",
          firstName: "Camille",
          lastName: "Coach",
        },
        managerCoachId: 2,
        members: [
          {
            id: 1,
            email: "user@example.com",
            firstName: "Jordi",
            lastName: "User",
            role: "user",
            lastSeenAt: "2026-03-21T12:00:00.000Z",
          },
        ],
        coaches: [
          {
            id: 2,
            email: "coach@example.com",
            firstName: "Camille",
            lastName: "Coach",
            role: "coach",
            lastSeenAt: "2026-03-21T12:00:00.000Z",
          },
        ],
      },
    ],
    availableCoaches: [
      {
        id: 2,
        email: "coach@example.com",
        firstName: "Camille",
        lastName: "Coach",
        role: "coach",
        lastSeenAt: "2026-03-21T12:00:00.000Z",
      },
    ],
  };
}

test("user can add a job to tracking and the coach can see it", async ({ page }) => {
  let actor: Actor = "user";
  let applications: Application[] = [];

  await page.route("**/api/auth/me", async (route) => {
    const user =
      actor === "user"
        ? {
            id: 1,
            email: "user@example.com",
            firstName: "Jordi",
            lastName: "User",
            role: "user",
          }
        : {
            id: 2,
            email: "coach@example.com",
            firstName: "Camille",
            lastName: "Coach",
            role: "coach",
          };

    await route.fulfill({ json: { user } });
  });

  await page.route("**/api/locations", async (route) => {
    await route.fulfill({ json: { entries: locationEntries } });
  });

  await page.route("**/api/search-history", async (route) => {
    await route.fulfill({ json: { history: [] } });
  });

  await page.route("https://www.odwb.be/api/explore/**", async (route) => {
    await route.fulfill({
      json: {
        results: [
          {
            numerooffreforem: searchJob.id,
            titreoffre: searchJob.title,
            nomemployeur: searchJob.company,
            lieuxtravaillocalite: [searchJob.location],
            typecontrat: searchJob.contractType,
            datedebutdiffusion: searchJob.publicationDate,
            url: searchJob.url,
          },
        ],
        total_count: 1,
      },
    });
  });

  await page.route("**/api/providers/adzuna/search", async (route) => {
    await route.fulfill({ json: { enabled: false, jobs: [], total: 0 } });
  });

  await page.route("**/api/applications", async (route) => {
    const request = route.request();

    if (request.method() === "GET") {
      await route.fulfill({ json: { applications } });
      return;
    }

    if (request.method() === "POST") {
      const body = request.postDataJSON() as { job: Job };
      const application = createApplication(body.job);
      applications = [application];
      await route.fulfill({ json: { application } });
      return;
    }

    await route.fallback();
  });

  await page.route("**/api/coach/dashboard", async (route) => {
    await route.fulfill({
      json: {
        dashboard: buildCoachDashboard(applications),
      },
    });
  });

  await page.goto("/?kw=react&bm=OR");

  await expect(page.getByText("Développeur Frontend React")).toBeVisible();
  await page.getByTitle("Ajouter au suivi").click();
  await expect(page.getByTitle("Déjà dans le suivi")).toBeVisible();

  actor = "coach";
  await page.goto("/coach");

  await expect(page.getByText("Jordi User")).toBeVisible();
  await page.getByText("Jordi User").first().click();
  await expect(page.getByRole("heading", { name: "Jordi User" })).toBeVisible();
  await expect(page.getByText("Développeur Frontend React")).toBeVisible();
  await expect(page.getByText("1 candidatures")).toBeVisible();
});

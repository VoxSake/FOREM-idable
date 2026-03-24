import { expect, test } from "@playwright/test";

test("shows the search workspace and a collapsed recent history for authenticated users", async ({
  page,
}) => {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      json: {
        user: {
          id: 42,
          email: "demo@example.test",
          firstName: "Demo",
          lastName: "User",
          role: "user",
        },
      },
    });
  });

  await page.route("**/api/applications", async (route) => {
    await route.fulfill({ json: { applications: [] } });
  });

  await page.route("**/api/search-history", async (route) => {
    await route.fulfill({
      json: {
        history: [
          makeHistoryEntry("history-one", "2026-03-24T08:00:00.000Z"),
          makeHistoryEntry("history-two", "2026-03-24T07:00:00.000Z"),
          makeHistoryEntry("history-three", "2026-03-24T06:00:00.000Z"),
          makeHistoryEntry("history-four", "2026-03-24T05:00:00.000Z"),
          makeHistoryEntry("history-five", "2026-03-24T04:00:00.000Z"),
          makeHistoryEntry("history-six", "2026-03-24T03:00:00.000Z"),
        ],
      },
    });
  });

  await page.route("**/api/featured-searches", async (route) => {
    await route.fulfill({
      json: {
        featuredSearches: [
          {
            id: 1,
            title: "Sélection maintenance",
            message: "Une recherche guidée pour vérifier la vue workspace.",
            ctaLabel: "Consulter les offres",
            query: {
              keywords: ["maintenance"],
              locations: [],
              booleanMode: "OR",
            },
            isActive: true,
            sortOrder: 0,
            createdAt: "2026-03-24T10:00:00.000Z",
            updatedAt: "2026-03-24T10:00:00.000Z",
          },
        ],
      },
    });
  });

  await page.route("https://www.odwb.be/api/explore/v2.1/**", async (route) => {
    await route.fulfill({
      json: {
        total_count: 2,
        results: [
          {
            numerooffreforem: "forem-maintenance-1",
            titreoffre: "Technicien de maintenance",
            nomemployeur: "Atelier central",
            lieuxtravaillocalite: ["Liège"],
            typecontrat: "CDI",
            datedebutdiffusion: "2026-03-24T08:00:00.000Z",
            url: "https://example.test/offres/maintenance-1",
            metier: "Technicien",
          },
          {
            numerooffreforem: "forem-maintenance-2",
            titreoffre: "Electromécanicien",
            nomemployeur: "Usine pilote",
            lieuxtravaillocalite: ["Seraing"],
            typecontrat: "CDD",
            datedebutdiffusion: "2026-03-23T08:00:00.000Z",
            url: "https://example.test/offres/maintenance-2",
            metier: "Electromécanicien",
          },
        ],
      },
    });
  });

  await page.route("**/api/providers/adzuna/search", async (route) => {
    await route.fulfill({
      json: {
        jobs: [],
        total: 0,
        enabled: true,
      },
    });
  });

  await page.goto("/");

  await page.getByRole("button", { name: /Sélection maintenance/ }).click();

  await expect(page).toHaveURL(/kw=maintenance/);
  await expect(page.getByRole("heading", { name: "Résultats de recherche" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reprenez la recherche ou affinez-la." })).toBeVisible();
  await expect(page.locator("tbody").getByText("Technicien de maintenance")).toBeVisible();
  await expect(page.locator("tbody").getByText("Electromécanicien")).toBeVisible();
  await page.getByRole("button", { name: "Historique (6)" }).click();

  await expect(page.getByRole("heading", { name: "Historique récent" })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-one/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-two/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-three/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-four/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-five/i })).not.toBeVisible();
  await expect(page.getByRole("button", { name: /history-six/i })).not.toBeVisible();

  await page.getByRole("button", { name: "Voir 2 de plus" }).click();

  await expect(page.getByRole("button", { name: /history-five/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /history-six/i })).toBeVisible();
});

function makeHistoryEntry(keyword: string, createdAt: string) {
  return {
    id: `${keyword}-id`,
    state: {
      keywords: [keyword],
      locations: [],
      booleanMode: "OR" as const,
    },
    createdAt,
  };
}

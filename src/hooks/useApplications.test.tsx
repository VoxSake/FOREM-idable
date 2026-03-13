import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useApplications } from "@/hooks/useApplications";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { JobApplication } from "@/types/application";
import { Job } from "@/types/job";

const existingApplications: JobApplication[] = [
  {
    job: {
      id: "job-1",
      title: "Frontend Developer",
      company: "Acme",
      location: "Brussels",
      contractType: "CDI",
      publicationDate: "2026-03-10T10:00:00.000Z",
      url: "https://example.com/job-1",
      source: "forem",
    },
    appliedAt: "2026-03-11T10:00:00.000Z",
    followUpDueAt: "2026-03-18T10:00:00.000Z",
    status: "in_progress",
    updatedAt: "2026-03-11T10:00:00.000Z",
  },
  {
    job: {
      id: "job-2",
      title: "Backend Developer",
      company: "Beta",
      location: "Liege",
      contractType: "CDD",
      publicationDate: "2026-03-09T10:00:00.000Z",
      url: "https://example.com/job-2",
      source: "forem",
    },
    appliedAt: "2026-03-10T10:00:00.000Z",
    followUpDueAt: "2026-03-17T10:00:00.000Z",
    status: "follow_up",
    updatedAt: "2026-03-10T10:00:00.000Z",
  },
];

const newJob: Job = {
  id: "job-3",
  title: "Product Designer",
  company: "Gamma",
  location: "Namur",
  contractType: "CDI",
  publicationDate: "2026-03-12T10:00:00.000Z",
  url: "https://example.com/job-3",
  source: "forem",
};

function TestHarness() {
  const { applications, addApplication, isLoaded } = useApplications();

  return (
    <div>
      <div data-testid="loaded">{isLoaded ? "yes" : "no"}</div>
      <div data-testid="count">{applications.length}</div>
      <button type="button" onClick={() => addApplication(newJob)}>
        add
      </button>
    </div>
  );
}

describe("useApplications", () => {
  it("does not wipe stored applications while hydrating and preserves them on add", async () => {
    localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(existingApplications));

    render(<TestHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("loaded").textContent).toBe("yes");
      expect(screen.getByTestId("count").textContent).toBe("2");
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.applications) ?? "[]")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("3");
    });

    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.applications) ?? "[]"
    ) as JobApplication[];

    expect(stored).toHaveLength(3);
    expect(stored.some((entry) => entry.job.id === "job-1")).toBe(true);
    expect(stored.some((entry) => entry.job.id === "job-2")).toBe(true);
    expect(stored.some((entry) => entry.job.id === "job-3")).toBe(true);
  });
});

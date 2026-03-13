import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApplications } from "@/hooks/useApplications";
import { JobApplication } from "@/types/application";

const mockUseAuth = vi.fn();

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

const applications: JobApplication[] = [
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
];

function TestHarness() {
  const { applications, isLoaded, isAuthenticated } = useApplications();

  return (
    <div>
      <div data-testid="loaded">{isLoaded ? "yes" : "no"}</div>
      <div data-testid="authenticated">{isAuthenticated ? "yes" : "no"}</div>
      <div data-testid="count">{applications.length}</div>
    </div>
  );
}

describe("useApplications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty loaded state when the visitor is not connected", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(<TestHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("loaded").textContent).toBe("yes");
      expect(screen.getByTestId("authenticated").textContent).toBe("no");
      expect(screen.getByTestId("count").textContent).toBe("0");
    });
  });

  it("loads applications from the authenticated API", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
      },
      isLoading: false,
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ applications }), { status: 200 })
    );

    render(<TestHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("loaded").textContent).toBe("yes");
      expect(screen.getByTestId("authenticated").textContent).toBe("yes");
      expect(screen.getByTestId("count").textContent).toBe("1");
    });
  });
});

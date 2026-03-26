import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useApplicationsPageState } from "@/features/applications/hooks/useApplicationsPageState";
import { JobApplication } from "@/types/application";

const mockUseAuth = vi.fn();
const mockUseApplications = vi.fn();
const mockUseCoachNoteViews = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useApplications", () => ({
  useApplications: () => mockUseApplications(),
}));

vi.mock("@/features/applications/coachNoteViews", () => ({
  useCoachNoteViews: (...args: unknown[]) => mockUseCoachNoteViews(...args),
  markCoachNoteView: vi.fn(),
}));

vi.mock("@/lib/exportApplicationsCsv", () => ({
  exportApplicationsToCSV: vi.fn(),
}));

vi.mock("@/lib/exportApplicationsIcs", () => ({
  exportInterviewsToICS: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

const application: JobApplication = {
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
};

function buildUseApplicationsResult(overrides?: Partial<ReturnType<typeof mockUseApplications>>) {
  return {
    applications: [application],
    addManualApplication: vi.fn(),
    markAsInProgress: vi.fn(),
    markAsAccepted: vi.fn(),
    markAsRejected: vi.fn(),
    markAsFollowUp: vi.fn(),
    scheduleInterview: vi.fn().mockResolvedValue(true),
    clearInterview: vi.fn().mockResolvedValue(true),
    saveNotes: vi.fn().mockResolvedValue(true),
    saveProofs: vi.fn().mockResolvedValue(true),
    updateManualApplicationDetails: vi.fn().mockResolvedValue(true),
    markFollowUpDone: vi.fn().mockResolvedValue(true),
    updateFollowUpSettings: vi.fn().mockResolvedValue(true),
    removeApplication: vi.fn().mockResolvedValue(true),
    isLoaded: true,
    ...overrides,
  };
}

describe("useApplicationsPageState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    mockUseCoachNoteViews.mockReturnValue({});
  });

  it("keeps the interview dialog open when interview scheduling fails", async () => {
    const scheduleInterview = vi.fn().mockResolvedValue(false);
    mockUseApplications.mockReturnValue(
      buildUseApplicationsResult({
        scheduleInterview,
      })
    );

    const { result } = renderHook(() => useApplicationsPageState());

    await act(async () => {
      result.current.openInterviewModal(application);
    });

    await act(async () => {
      result.current.setInterviewForm({
        interviewAt: "2026-03-29T14:30",
        interviewDetails: "Visio RH",
      });
    });

    await act(async () => {
      await result.current.submitInterview();
    });

    expect(scheduleInterview).toHaveBeenCalledWith(
      "job-1",
      "2026-03-29T14:30:00.000Z",
      "Visio RH"
    );
    expect(mockToastError).toHaveBeenCalledWith(
      "Impossible d'enregistrer l'entretien.",
      { description: "Candidatures" }
    );
    await waitFor(() => {
      expect(result.current.interviewApplication?.job.id).toBe("job-1");
    });
  });
});

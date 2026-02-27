import { fireEvent, render, screen } from "@testing-library/react";
import DashboardPage from "./page";
import { SearchQuery } from "@/types/search";
import { Job } from "@/types/job";

const mockUseSettings = vi.fn();
const mockUseJobSearch = vi.fn();
const mockUseSelectionJobs = vi.fn();
const mockUseExportJobs = vi.fn();
const mockReplace = vi.fn();

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => mockUseSettings(),
}));

vi.mock("@/features/jobs/hooks/useJobSearch", () => ({
  useJobSearch: () => mockUseJobSearch(),
}));

vi.mock("@/features/jobs/hooks/useSelectionJobs", () => ({
  useSelectionJobs: () => mockUseSelectionJobs(),
}));

vi.mock("@/features/jobs/hooks/useExportJobs", () => ({
  useExportJobs: () => mockUseExportJobs(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/search/SearchEngine", () => ({
  SearchEngine: ({ onSearch }: { onSearch: (state: SearchQuery) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSearch({
          keywords: ["dev"],
          locations: [{ id: "loc1", name: "4000 Liège", type: "Localités" }],
          booleanMode: "OR",
        })
      }
    >
      trigger-search
    </button>
  ),
}));

vi.mock("@/components/jobs/JobTable", () => ({
  JobTable: () => <div>job-table</div>,
}));

vi.mock("@/features/jobs/components/SearchHistoryPanel", () => ({
  SearchHistoryPanel: ({
    history,
    onReplay,
  }: {
    history: Array<{ state: SearchQuery }>;
    onReplay: (query: SearchQuery) => void;
  }) => (
    <button type="button" onClick={() => onReplay(history[0].state)}>
      replay-history
    </button>
  ),
}));

vi.mock("@/features/jobs/components/SelectionPanel", () => ({
  SelectionPanel: () => <div>selection-panel</div>,
}));

vi.mock("@/features/jobs/components/ResultsToolbar", () => ({
  ResultsToolbar: ({
    onExportAll,
    onExportSelected,
    onCopySearchLink,
  }: {
    onExportAll: () => void;
    onExportSelected: () => void;
    onCopySearchLink: () => void;
  }) => (
    <div>
      <button type="button" onClick={onExportAll}>
        export-all
      </button>
      <button type="button" onClick={onCopySearchLink}>
        copy-link
      </button>
      <button type="button" onClick={onExportSelected}>
        export-selected
      </button>
    </div>
  ),
}));

vi.mock("@/features/jobs/components/ExportDialog", () => ({
  ExportDialog: () => <div>export-dialog</div>,
}));

vi.mock("@/features/jobs/components/JobDetailsSheet", () => ({
  JobDetailsSheet: () => <div>job-details-sheet</div>,
}));

const sampleQuery: SearchQuery = {
  keywords: ["dev"],
  locations: [{ id: "loc1", name: "4000 Liège", type: "Localités" }],
  booleanMode: "OR",
};

const sampleJob: Job = {
  id: "1",
  title: "Développeur",
  location: "Liège",
  contractType: "CDI",
  publicationDate: "2026-02-23",
  url: "https://example.com/1",
  source: "forem",
};

describe("DashboardPage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSettings.mockReturnValue({
      settings: { defaultSearchMode: "OR" },
      isLoaded: true,
    });

    mockUseJobSearch.mockReturnValue({
      jobs: [sampleJob],
      isSearching: false,
      hasSearched: true,
      lastSearchQuery: sampleQuery,
      executeSearch: vi.fn(),
      history: [{ id: "h1", state: sampleQuery, createdAt: "2026-02-23T10:00:00.000Z" }],
      clearHistory: vi.fn(),
      isHistoryLoaded: true,
    });

    mockUseSelectionJobs.mockReturnValue({
      selectedJobs: [sampleJob],
      selectedJobIds: new Set(["1"]),
      toggleSelection: vi.fn(),
      resetSelection: vi.fn(),
    });

    mockUseExportJobs.mockReturnValue({
      isExportDialogOpen: false,
      setIsExportDialogOpen: vi.fn(),
      exportTarget: "all",
      selectedExportColumns: ["title"],
      openExportDialog: vi.fn(),
      selectAllColumns: vi.fn(),
      toggleColumn: vi.fn(),
      applyExport: vi.fn(),
    });
  });

  it("executes search and resets selection when SearchEngine emits a query", async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByText("trigger-search"));

    const { executeSearch } = mockUseJobSearch.mock.results[0].value as {
      executeSearch: ReturnType<typeof vi.fn>;
    };
    const { resetSelection } = mockUseSelectionJobs.mock.results[0].value as {
      resetSelection: ReturnType<typeof vi.fn>;
    };

    expect(resetSelection).toHaveBeenCalledTimes(1);
    expect(executeSearch).toHaveBeenCalledWith(sampleQuery);
  });

  it("replays history with persistInHistory=false and resets selection", async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByText("replay-history"));

    const { executeSearch } = mockUseJobSearch.mock.results[0].value as {
      executeSearch: ReturnType<typeof vi.fn>;
    };
    const { resetSelection } = mockUseSelectionJobs.mock.results[0].value as {
      resetSelection: ReturnType<typeof vi.fn>;
    };

    expect(resetSelection).toHaveBeenCalledTimes(1);
    expect(executeSearch).toHaveBeenCalledWith(sampleQuery, {
      persistInHistory: false,
    });
  });

  it("opens export dialog for all and selected targets", async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByText("export-all"));
    fireEvent.click(screen.getByText("export-selected"));

    const { openExportDialog } = mockUseExportJobs.mock.results[0].value as {
      openExportDialog: ReturnType<typeof vi.fn>;
    };

    expect(openExportDialog).toHaveBeenNthCalledWith(1, "all");
    expect(openExportDialog).toHaveBeenNthCalledWith(2, "selected");
  });
});

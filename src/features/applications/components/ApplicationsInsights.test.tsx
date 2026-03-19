import { fireEvent, render, screen } from "@testing-library/react";
import { ApplicationsInsights } from "./ApplicationsInsights";

describe("ApplicationsInsights", () => {
  it("updates search and quick filters", () => {
    const onSearchChange = vi.fn();
    const onModeFilterChange = vi.fn();

    render(
      <ApplicationsInsights
        totalCount={12}
        dueCount={3}
        upcomingInterviewCount={2}
        closedCount={4}
        coachUpdateCount={1}
        search=""
        statusFilter="all"
        modeFilter="all"
        onSearchChange={onSearchChange}
        onStatusFilterChange={vi.fn()}
        onModeFilterChange={onModeFilterChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/rechercher une entreprise/i), {
      target: { value: "Acme" },
    });
    fireEvent.click(screen.getAllByRole("radio", { name: /filtrer: manuel/i })[0]);

    expect(onSearchChange).toHaveBeenCalledWith("Acme");
    expect(onModeFilterChange).toHaveBeenCalledWith("manual");
  });

  it("shows the coach hint when coach updates are present", () => {
    render(
      <ApplicationsInsights
        totalCount={12}
        dueCount={3}
        upcomingInterviewCount={2}
        closedCount={4}
        coachUpdateCount={2}
        search=""
        statusFilter="all"
        modeFilter="all"
        onSearchChange={vi.fn()}
        onStatusFilterChange={vi.fn()}
        onModeFilterChange={vi.fn()}
      />
    );

    expect(
      screen.getByText("2 candidatures avec un nouveau retour coach.")
    ).toBeInTheDocument();
  });
});

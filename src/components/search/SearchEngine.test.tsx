import { fireEvent, render, screen } from "@testing-library/react";
import { SearchEngine } from "./SearchEngine";

vi.mock("./LocationAutocomplete", () => ({
  LocationAutocomplete: () => <div>location-autocomplete</div>,
}));

describe("SearchEngine", () => {
  it("converts a trailing space into a keyword tag from input change events", () => {
    const onSearch = vi.fn();

    render(<SearchEngine onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Ex: Développeur, Comptable...");
    fireEvent.change(input, { target: { value: "developpeur " } });

    expect(screen.getByText("developpeur")).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("keeps the last unfinished fragment in the input while committing previous keywords", () => {
    const onSearch = vi.fn();

    render(<SearchEngine onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Ex: Développeur, Comptable...");
    fireEvent.change(input, { target: { value: "developpeur compt" } });

    expect(screen.getByText("developpeur")).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("compt");
  });
});

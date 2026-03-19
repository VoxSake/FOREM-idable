import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AccountPage from "./page";

const mockUseAuth = vi.fn();
const mockUseSettings = vi.fn();

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => mockUseSettings(),
}));

vi.mock("@/components/auth/AccountAccessPrompt", () => ({
  AccountAccessPrompt: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div>
      {title}
      {description}
    </div>
  ),
}));

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "user@example.com",
        firstName: "Jordi",
        lastName: "Brisbois",
        role: "user",
      },
      isLoading: false,
      refresh: vi.fn().mockResolvedValue(undefined),
      setUser: vi.fn(),
    });

    mockUseSettings.mockReturnValue({
      settings: { defaultSearchMode: "OR" },
      updateSettings: vi.fn(),
      isLoaded: true,
    });
  });

  it("submits the profile form with validated values", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            id: 1,
            email: "user@example.com",
            firstName: "Jordan",
            lastName: "Brisbois",
            role: "user",
          },
        }),
        { status: 200 }
      )
    );

    render(<AccountPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Prénom")).toHaveValue("Jordi");
      expect(screen.getByLabelText("Nom")).toHaveValue("Brisbois");
    });

    const firstNameInput = screen.getByLabelText("Prénom");
    fireEvent.change(firstNameInput, { target: { value: "Jordan" } });
    fireEvent.submit(firstNameInput.closest("form")!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Jordan",
          lastName: "Brisbois",
        }),
      });
    });

    expect(await screen.findByText("Nom et prénom mis à jour.")).toBeInTheDocument();
  });

  it("shows a field error when password confirmation does not match", async () => {
    render(<AccountPage />);

    fireEvent.change(screen.getByLabelText("Nouveau mot de passe"), {
      target: { value: "motdepasse1" },
    });
    fireEvent.change(screen.getByLabelText("Confirmer le mot de passe"), {
      target: { value: "motdepasse2" },
    });

    expect(await screen.findByText("Les mots de passe ne correspondent pas.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Changer le mot de passe" })).toBeDisabled();
  });

  it("updates the default search mode through the toggle group", async () => {
    const updateSettings = vi.fn();

    mockUseSettings.mockReturnValue({
      settings: { defaultSearchMode: "OR" },
      updateSettings,
      isLoaded: true,
    });

    render(<AccountPage />);

    fireEvent.click(screen.getByRole("radio", { name: /ET \(plus précis\)/i }));

    expect(updateSettings).toHaveBeenCalledWith({ defaultSearchMode: "AND" });
  });
});

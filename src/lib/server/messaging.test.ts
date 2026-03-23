import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthUser } from "@/types/auth";

const { mockQuery, mockEnsureDatabase } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockEnsureDatabase: vi.fn(),
}));

vi.mock("@/lib/server/db", () => ({
  db: {
    query: mockQuery,
  },
  ensureDatabase: mockEnsureDatabase,
}));

import { canDirectMessage } from "@/lib/server/messaging";

const coachActor: AuthUser = {
  id: 11,
  email: "coach@example.com",
  firstName: "Coach",
  lastName: "One",
  role: "coach",
};

describe("messaging permissions", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockEnsureDatabase.mockReset();
  });

  it("allows admins to message anyone without querying group scope", async () => {
    const allowed = await canDirectMessage(
      {
        id: 1,
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      },
      42
    );

    expect(allowed).toBe(true);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("allows direct messaging when users share at least one group scope", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ exists: true }] });

    const allowed = await canDirectMessage(coachActor, 42);

    expect(allowed).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("rejects direct messaging when users do not share a common group scope", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ exists: false }] });

    const allowed = await canDirectMessage(coachActor, 42);

    expect(allowed).toBe(false);
  });
});

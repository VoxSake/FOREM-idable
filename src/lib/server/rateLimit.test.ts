import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

describe("checkRateLimit", () => {
  beforeEach(() => {
    headersMock.mockResolvedValue(
      new Headers({
        "x-forwarded-for": "203.0.113.10",
      })
    );
  });

  afterEach(() => {
    globalThis.__foremIdableRateLimitStore?.clear();
    globalThis.__foremIdableRedisRateLimitClient = undefined;
    globalThis.__foremIdableRedisRateLimitPromise = undefined;
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("enforces the limit with the in-memory fallback", async () => {
    vi.stubEnv("REDIS_URL", "");
    const { checkRateLimit } = await import("@/lib/server/rateLimit");

    const first = await checkRateLimit({
      scope: "test",
      limit: 2,
      windowMs: 60_000,
    });
    const second = await checkRateLimit({
      scope: "test",
      limit: 2,
      windowMs: 60_000,
    });
    const third = await checkRateLimit({
      scope: "test",
      limit: 2,
      windowMs: 60_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it("isolates buckets when an identifier is provided", async () => {
    vi.stubEnv("REDIS_URL", "");
    const { checkRateLimit } = await import("@/lib/server/rateLimit");

    const firstEmail = await checkRateLimit({
      scope: "auth-login",
      limit: 1,
      windowMs: 60_000,
      identifier: "first@example.com",
    });
    const secondEmail = await checkRateLimit({
      scope: "auth-login",
      limit: 1,
      windowMs: 60_000,
      identifier: "second@example.com",
    });
    const blockedFirstEmail = await checkRateLimit({
      scope: "auth-login",
      limit: 1,
      windowMs: 60_000,
      identifier: "first@example.com",
    });

    expect(firstEmail.allowed).toBe(true);
    expect(secondEmail.allowed).toBe(true);
    expect(blockedFirstEmail.allowed).toBe(false);
  });
});

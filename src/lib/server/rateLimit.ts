import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

declare global {
  var __foremIdableRateLimitStore: Map<string, Bucket> | undefined;
}

const store = globalThis.__foremIdableRateLimitStore ?? new Map<string, Bucket>();

if (!globalThis.__foremIdableRateLimitStore) {
  globalThis.__foremIdableRateLimitStore = store;
}

function getNow() {
  return Date.now();
}

async function getClientIp() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headerStore.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = headerStore.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "unknown";
}

export async function checkRateLimit(input: {
  scope: string;
  limit: number;
  windowMs: number;
}) {
  const ip = await getClientIp();
  const now = getNow();
  const key = `${input.scope}:${ip}`;
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + input.windowMs,
    });

    return {
      allowed: true,
      remaining: input.limit - 1,
      retryAfterMs: input.windowMs,
    };
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, existing.resetAt - now),
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    remaining: input.limit - existing.count,
    retryAfterMs: Math.max(0, existing.resetAt - now),
  };
}

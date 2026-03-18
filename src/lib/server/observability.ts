import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

type ObservabilityLevel = "info" | "warn" | "error";

interface RequestLogContext {
  requestId: string;
  method: string;
  path: string;
}

const requestContextStore = new AsyncLocalStorage<RequestLogContext>();

function isTimingEnabled() {
  return process.env.SERVER_TIMING_LOGS?.trim().toLowerCase() === "true";
}

function shouldEmitEvent(level: ObservabilityLevel) {
  if (level === "error" || level === "warn") {
    return true;
  }

  const raw = process.env.SERVER_AUDIT_LOGS?.trim().toLowerCase();
  if (!raw) {
    return true;
  }

  return raw !== "false";
}

function redactKey(key: string, value: unknown) {
  const normalizedKey = key.toLowerCase();
  const sensitive =
    normalizedKey.includes("password") ||
    normalizedKey.includes("token") ||
    normalizedKey.includes("secret") ||
    normalizedKey.includes("apikey") ||
    normalizedKey.includes("authorization") ||
    normalizedKey.includes("cookie") ||
    normalizedKey.includes("email");

  if (sensitive) {
    return "[redacted]";
  }

  return value;
}

function sanitizeMeta(meta: Record<string, unknown> | undefined) {
  if (!meta) return undefined;

  return Object.fromEntries(
    Object.entries(meta)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, redactKey(key, value)])
  );
}

export function createRequestContext(request: NextRequest): RequestLogContext {
  return {
    requestId: request.headers.get("x-request-id")?.trim() || randomUUID(),
    method: request.method,
    path: request.nextUrl.pathname,
  };
}

export function getCurrentRequestContext() {
  return requestContextStore.getStore() ?? null;
}

export async function withRequestContext<T>(
  request: NextRequest,
  run: (context: RequestLogContext) => Promise<T>
) {
  const context = createRequestContext(request);
  return requestContextStore.run(context, () => run(context));
}

export function logServerEvent(input: {
  category: string;
  action: string;
  level?: ObservabilityLevel;
  durationMs?: number;
  meta?: Record<string, unknown>;
  timing?: boolean;
}) {
  const level = input.level ?? "info";
  const context = getCurrentRequestContext();

  if (input.timing) {
    if (!isTimingEnabled()) return;
  } else if (!shouldEmitEvent(level)) {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    level,
    category: input.category,
    action: input.action,
    requestId: context?.requestId,
    method: context?.method,
    path: context?.path,
    durationMs:
      typeof input.durationMs === "number" ? Math.round(input.durationMs * 100) / 100 : undefined,
    meta: sanitizeMeta(input.meta),
  };

  console.log(JSON.stringify(payload));
}

export async function measureServerOperation<T>(input: {
  category: string;
  action: string;
  meta?: Record<string, unknown>;
  timing?: boolean;
  run: () => Promise<T>;
}) {
  const start = performance.now();

  try {
    const result = await input.run();
    logServerEvent({
      category: input.category,
      action: input.action,
      durationMs: performance.now() - start,
      meta: input.meta,
      timing: input.timing ?? true,
    });
    return result;
  } catch (error) {
    logServerEvent({
      category: input.category,
      action: input.action,
      level: "error",
      durationMs: performance.now() - start,
      meta: {
        ...input.meta,
        error: error instanceof Error ? error.message : "unknown",
      },
      timing: input.timing ?? true,
    });
    throw error;
  }
}

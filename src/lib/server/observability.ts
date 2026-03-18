type ObservabilityLevel = "info" | "warn" | "error";

function isEnabled() {
  return process.env.SERVER_TIMING_LOGS?.trim().toLowerCase() === "true";
}

function sanitizeMeta(meta: Record<string, unknown> | undefined) {
  if (!meta) return undefined;

  return Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined)
  );
}

export function logServerEvent(input: {
  category: string;
  action: string;
  level?: ObservabilityLevel;
  durationMs?: number;
  meta?: Record<string, unknown>;
}) {
  if (!isEnabled()) {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    level: input.level ?? "info",
    category: input.category,
    action: input.action,
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
    });
    throw error;
  }
}

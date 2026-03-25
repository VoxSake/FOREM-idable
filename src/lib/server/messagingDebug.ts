import { logServerEvent } from "@/lib/server/observability";

export function isMessagingDebugEnabled() {
  return process.env.MESSAGING_DEBUG?.trim().toLowerCase() === "true";
}

export function logMessagingDebug(action: string, meta?: Record<string, unknown>) {
  if (!isMessagingDebugEnabled()) {
    return;
  }

  logServerEvent({
    category: "messages-debug",
    action,
    meta,
  });
}

import { ApiKeySummary } from "@/types/externalApi";
import { JobApplication } from "@/types/application";
import { CalendarSubscriptionSummary } from "@/types/calendar";
import { CoachDashboardData } from "@/types/coach";

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as T;
  return { response, data };
}

export async function fetchCoachDashboard() {
  return requestJson<{ error?: string; dashboard?: CoachDashboardData }>("/api/coach/dashboard", {
    cache: "no-store",
  });
}

export async function requestCoachApplicationNote(input: {
  userId: number;
  jobId: string;
  action: "save-private" | "create-shared" | "update-shared" | "delete-shared";
  content?: string;
  noteId?: string;
}) {
  return requestJson<{ error?: string; application?: JobApplication }>(
    `/api/coach/users/${input.userId}/applications`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: input.jobId,
        action: input.action,
        content: input.content,
        noteId: input.noteId,
      }),
    }
  );
}

export async function fetchManagedUserApiKeys(userId: number) {
  return requestJson<{ error?: string; apiKeys?: ApiKeySummary[] }>(
    `/api/admin/users/${userId}/api-keys`,
    { cache: "no-store" }
  );
}

export async function requestCalendarSubscription(input: {
  scope: "group" | "all_groups";
  groupId?: number | null;
  regenerate?: boolean;
}) {
  return requestJson<{ error?: string; subscription?: CalendarSubscriptionSummary }>(
    "/api/coach/calendar-subscriptions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: input.scope,
        groupId: input.groupId,
        regenerate: input.regenerate === true,
      }),
    }
  );
}

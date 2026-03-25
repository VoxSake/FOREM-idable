import { FeaturedSearchPayload } from "@/features/featured-searches/featuredSearchSchema";
import { CoachDashboardData } from "@/types/coach";
import { AdminApiKeySummary } from "@/types/externalApi";
import { FeaturedSearch } from "@/types/featuredSearch";

export type AdminAccountDeletionRequest = {
  id: number;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  reason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  reviewNote: string | null;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
};

export type AdminLegalHold = {
  id: number;
  targetType: "user" | "conversation" | "application";
  targetId: number;
  reason: string;
  createdAt: string;
  releasedAt: string | null;
};

export type AdminDisclosureLog = {
  id: number;
  requestType: "authority_request" | "litigation" | "other";
  authorityName: string;
  legalBasis: string | null;
  targetType: "user" | "conversation" | "application" | "export" | "other";
  targetId: number | null;
  scopeSummary: string;
  exportReference: string | null;
  createdByUserId: number | null;
  createdAt: string;
};

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as T;
  return { response, data };
}

export function fetchAdminDashboard() {
  return requestJson<{ error?: string; dashboard?: CoachDashboardData }>("/api/coach/dashboard", {
    cache: "no-store",
  });
}

export function promoteCoachRole(userId: number) {
  return requestJson<{ error?: string; ok?: boolean }>("/api/admin/coaches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export function demoteCoachRole(userId: number) {
  return requestJson<{ error?: string; ok?: boolean }>(`/api/admin/coaches?userId=${userId}`, {
    method: "DELETE",
  });
}

export function fetchAdminApiKeys() {
  return requestJson<{ error?: string; apiKeys?: AdminApiKeySummary[] }>("/api/admin/api-keys", {
    cache: "no-store",
  });
}

export function revokeAdminApiKey(keyId: number) {
  return requestJson<{ error?: string; ok?: boolean }>(`/api/admin/api-keys/${keyId}`, {
    method: "DELETE",
  });
}

export function fetchAdminFeaturedSearches() {
  return requestJson<{ error?: string; featuredSearches?: FeaturedSearch[] }>(
    "/api/admin/featured-searches",
    {
      cache: "no-store",
    }
  );
}

export function createAdminFeaturedSearch(payload: FeaturedSearchPayload) {
  return requestJson<{ error?: string; featuredSearch?: FeaturedSearch }>(
    "/api/admin/featured-searches",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

export function updateAdminFeaturedSearch(id: number, payload: FeaturedSearchPayload) {
  return requestJson<{ error?: string; featuredSearch?: FeaturedSearch }>(
    `/api/admin/featured-searches/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

export function deleteAdminFeaturedSearch(id: number) {
  return requestJson<{ error?: string; ok?: boolean }>(`/api/admin/featured-searches/${id}`, {
    method: "DELETE",
  });
}

export function fetchAdminAccountDeletionRequests() {
  return requestJson<{ error?: string; requests?: AdminAccountDeletionRequest[] }>(
    "/api/admin/account-deletion-requests",
    {
      cache: "no-store",
    }
  );
}

export function reviewAdminAccountDeletionRequest(
  id: number,
  payload: { action: "approve" | "reject" | "complete"; reviewNote?: string }
) {
  return requestJson<{
    error?: string;
    request?: AdminAccountDeletionRequest | null;
    deletedUserId?: number | null;
  }>(`/api/admin/account-deletion-requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchAdminLegalHolds() {
  return requestJson<{ error?: string; holds?: AdminLegalHold[] }>("/api/admin/legal-holds", {
    cache: "no-store",
  });
}

export function createAdminLegalHold(payload: {
  targetType: "user" | "conversation" | "application";
  targetId: number;
  reason: string;
}) {
  return requestJson<{ error?: string; hold?: AdminLegalHold }>("/api/admin/legal-holds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function releaseAdminLegalHold(id: number) {
  return requestJson<{ error?: string; hold?: AdminLegalHold }>(`/api/admin/legal-holds/${id}`, {
    method: "DELETE",
  });
}

export function fetchAdminDisclosureLogs() {
  return requestJson<{ error?: string; logs?: AdminDisclosureLog[] }>(
    "/api/admin/disclosure-logs",
    {
      cache: "no-store",
    }
  );
}

export function createAdminDisclosureLog(payload: {
  requestType?: "authority_request" | "litigation" | "other";
  authorityName: string;
  legalBasis?: string;
  targetType: "user" | "conversation" | "application" | "export" | "other";
  targetId?: number;
  scopeSummary: string;
  exportReference?: string;
}) {
  return requestJson<{
    error?: string;
    log?: { id: number; createdAt: string };
  }>("/api/admin/disclosure-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

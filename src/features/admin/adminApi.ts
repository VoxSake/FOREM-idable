import { FeaturedSearchPayload } from "@/features/featured-searches/featuredSearchSchema";
import { CoachDashboardData } from "@/types/coach";
import { AdminApiKeySummary } from "@/types/externalApi";
import { FeaturedSearch } from "@/types/featuredSearch";

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

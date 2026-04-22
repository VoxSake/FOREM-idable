import { get, post } from "@/lib/api/client";
import { AuthUser } from "@/types/auth";

export function fetchCurrentUser() {
  return get<{ user?: AuthUser | null }>("/api/auth/me", { cache: "no-store" });
}

export function logoutUser() {
  return post<{ ok?: boolean }>("/api/auth/logout");
}

export function requestPasswordReset(email: string) {
  return post<{ message?: string }>("/api/auth/forgot-password", { email });
}

"use client";

export function getDisplayName(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
  fallback: string;
}) {
  const fullName = `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();
  return fullName || input.email || input.fallback;
}

export function getInitials(label: string) {
  const chunks = label.trim().split(/\s+/).filter(Boolean);
  if (chunks.length === 0) return "??";
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
  return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
}

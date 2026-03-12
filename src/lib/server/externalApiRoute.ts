import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus } from "@/types/application";
import { UserRole } from "@/types/auth";
import { requireExternalApiActor } from "@/lib/server/apiKeys";
import { ExternalApiActor, ExternalApiFilters } from "@/types/externalApi";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "in_progress",
  "follow_up",
  "interview",
  "accepted",
  "rejected",
];

const USER_ROLES: UserRole[] = ["user", "coach", "admin"];

export async function requireExternalApiAccess() {
  const actor = await requireExternalApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return actor;
}

function parseInteger(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseBoolean(value: string | null) {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

export function getRequestedFormat(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");
  return format === "csv" ? "csv" : "json";
}

export function parseExternalFilters(request: NextRequest): ExternalApiFilters {
  const status = request.nextUrl.searchParams.get("status");
  const role = request.nextUrl.searchParams.get("role");

  return {
    search: request.nextUrl.searchParams.get("search") || undefined,
    groupId: parseInteger(request.nextUrl.searchParams.get("groupId")),
    userId: parseInteger(request.nextUrl.searchParams.get("userId")),
    role: role && USER_ROLES.includes(role as UserRole) ? (role as UserRole) : null,
    status:
      status && APPLICATION_STATUSES.includes(status as ApplicationStatus)
        ? (status as ApplicationStatus)
        : null,
    dueOnly: parseBoolean(request.nextUrl.searchParams.get("dueOnly")),
    interviewOnly: parseBoolean(request.nextUrl.searchParams.get("interviewOnly")),
    updatedAfter: request.nextUrl.searchParams.get("updatedAfter"),
    updatedBefore: request.nextUrl.searchParams.get("updatedBefore"),
    limit: parseInteger(request.nextUrl.searchParams.get("limit")) ?? undefined,
    offset: parseInteger(request.nextUrl.searchParams.get("offset")) ?? undefined,
    includeApplications: parseBoolean(request.nextUrl.searchParams.get("includeApplications")),
  };
}

export function csvResponse(filename: string, content: string) {
  return new NextResponse("\uFEFF" + content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function jsonActorMeta(actor: ExternalApiActor) {
  return {
    id: actor.id,
    email: actor.email,
    firstName: actor.firstName,
    lastName: actor.lastName,
    role: actor.role,
  };
}

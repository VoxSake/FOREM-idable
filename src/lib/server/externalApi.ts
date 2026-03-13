import { isAfter } from "date-fns";
import { formatCoachAuthorName, summarizeCoachContributors } from "@/lib/coachNotes";
import { getCoachDashboard } from "@/lib/server/coach";
import {
  ExternalApiActor,
  ExternalApiApplicationRow,
  ExternalApiApplicationsResponse,
  ExternalApiFilters,
  ExternalApiGroupSummary,
  ExternalApiGroupsResponse,
  ExternalApiStats,
  ExternalApiUserSummary,
  ExternalApiUserDetail,
  ExternalApiUsersResponse,
} from "@/types/externalApi";
import { ApplicationStatus } from "@/types/application";
import { CoachUserSummary } from "@/types/coach";

function matchesSearch(haystack: string[], search?: string) {
  const normalized = search?.trim().toLowerCase();
  if (!normalized) return true;
  return haystack.join(" ").toLowerCase().includes(normalized);
}

function isDue(status: ApplicationStatus, dueAt: string) {
  const due = new Date(dueAt);
  return (
    (status === "in_progress" || status === "follow_up") &&
    !Number.isNaN(due.getTime()) &&
    !isAfter(due, new Date())
  );
}

function buildStats(
  users: Array<
    Pick<
      ExternalApiUserSummary,
      "groupIds" | "applicationCount" | "interviewCount" | "dueCount"
    >
  >
): ExternalApiStats {
  return {
    userCount: users.length,
    groupCount: new Set(users.flatMap((entry) => entry.groupIds)).size,
    applicationCount: users.reduce((sum, entry) => sum + entry.applicationCount, 0),
    interviewCount: users.reduce((sum, entry) => sum + entry.interviewCount, 0),
    dueCount: users.reduce((sum, entry) => sum + entry.dueCount, 0),
  };
}

function normalizeLimit(value: number | undefined, fallback: number) {
  if (!value || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(500, Math.floor(value)));
}

function normalizeOffset(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function toExternalUserSummary(
  user: CoachUserSummary,
  includeApplications: boolean
): ExternalApiUserSummary {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role,
    groupIds: user.groupIds,
    groupNames: user.groupNames,
    applicationCount: user.applicationCount,
    interviewCount: user.interviewCount,
    dueCount: user.dueCount,
    acceptedCount: user.acceptedCount,
    rejectedCount: user.rejectedCount,
    inProgressCount: user.inProgressCount,
    latestActivityAt: user.latestActivityAt,
    applications: includeApplications ? user.applications : undefined,
  };
}

async function loadDashboard(actor: ExternalApiActor) {
  return getCoachDashboard(actor);
}

export async function getExternalUsers(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
): Promise<ExternalApiUsersResponse> {
  const dashboard = await loadDashboard(actor);
  const offset = normalizeOffset(filters.offset);
  const limit = normalizeLimit(filters.limit, 200);

  const users = dashboard.users.filter((entry) => {
    if (filters.userId && entry.id !== filters.userId) return false;
    if (filters.groupId && !entry.groupIds.includes(filters.groupId)) return false;
    if (filters.role && entry.role !== filters.role) return false;

    return matchesSearch(
      [entry.firstName, entry.lastName, `${entry.firstName} ${entry.lastName}`.trim(), entry.email],
      filters.search
    );
  });

  const serializedUsers = users
    .slice(offset, offset + limit)
    .map((entry) => toExternalUserSummary(entry, Boolean(filters.includeApplications)));

  return {
    actor,
    stats: buildStats(dashboard.users),
    users: serializedUsers,
  };
}

export async function getExternalUserDetail(actor: ExternalApiActor, userId: number): Promise<ExternalApiUserDetail | null> {
  const dashboard = await loadDashboard(actor);
  const user = dashboard.users.find((entry) => entry.id === userId);
  if (!user) return null;

  return toExternalUserSummary(user, true);
}

export async function getExternalGroups(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
): Promise<ExternalApiGroupsResponse> {
  const dashboard = await loadDashboard(actor);
  const offset = normalizeOffset(filters.offset);
  const limit = normalizeLimit(filters.limit, 200);

  let groups: ExternalApiGroupSummary[] = dashboard.groups
    .filter((group) => matchesSearch([group.name, group.createdBy.email], filters.search))
    .map((group) => {
      const members = dashboard.users.filter((entry) => group.members.some((member) => member.id === entry.id));
      return {
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        createdBy: group.createdBy,
        memberCount: members.length,
        totalApplications: members.reduce((sum, entry) => sum + entry.applicationCount, 0),
        totalInterviews: members.reduce((sum, entry) => sum + entry.interviewCount, 0),
        members: members.map((entry) =>
          toExternalUserSummary(entry, Boolean(filters.includeApplications))
        ),
      };
    });

  if (filters.groupId) {
    groups = groups.filter((group) => group.id === filters.groupId);
  }

  return {
    actor,
    stats: buildStats(dashboard.users),
    groups: groups.slice(offset, offset + limit),
  };
}

export async function getExternalGroupDetail(actor: ExternalApiActor, groupId: number) {
  const response = await getExternalGroups(actor, {
    groupId,
    includeApplications: true,
    limit: 1,
  });

  return response.groups[0] ?? null;
}

export async function getExternalApplications(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
): Promise<ExternalApiApplicationsResponse> {
  const dashboard = await loadDashboard(actor);
  const offset = normalizeOffset(filters.offset);
  const limit = normalizeLimit(filters.limit, 500);

  let applications: ExternalApiApplicationRow[] = dashboard.users.flatMap((user) =>
    user.applications.map((application) => ({
      userId: user.id,
      userEmail: user.email,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      userRole: user.role,
      groupIds: user.groupIds,
      groupNames: user.groupNames,
      application,
    }))
  );

  applications = applications.filter((row) => {
    if (filters.userId && row.userId !== filters.userId) return false;
    if (filters.groupId && !row.groupIds.includes(filters.groupId)) return false;
    if (filters.role && row.userRole !== filters.role) return false;
    if (filters.status && row.application.status !== filters.status) return false;
    if (filters.dueOnly && !isDue(row.application.status, row.application.followUpDueAt)) return false;
    if (filters.interviewOnly && row.application.status !== "interview") return false;
    if (filters.updatedAfter && row.application.updatedAt < filters.updatedAfter) return false;
    if (filters.updatedBefore && row.application.updatedAt > filters.updatedBefore) return false;

    return matchesSearch(
      [
        row.userFirstName,
        row.userLastName,
        `${row.userFirstName} ${row.userLastName}`.trim(),
        row.userEmail,
        row.application.job.company || "",
        row.application.job.title,
        row.application.job.location,
        row.groupNames.join(" "),
      ],
      filters.search
    );
  });

  return {
    actor,
    stats: buildStats(dashboard.users),
    applications: applications.slice(offset, offset + limit),
  };
}

export function buildUsersCsv(users: ExternalApiUsersResponse["users"]) {
  const headers = [
    "ID",
    "Prénom",
    "Nom",
    "Email",
    "Rôle",
    "Groupes",
    "Candidatures",
    "Entretiens",
    "Relances dues",
    "Acceptées",
    "Refusées",
    "En cours",
    "Dernière activité",
  ];

  const rows = users.map((user) => [
    String(user.id),
    user.firstName,
    user.lastName,
    user.email,
    user.role,
    user.groupNames.join(" | "),
    String(user.applicationCount),
    String(user.interviewCount),
    String(user.dueCount),
    String(user.acceptedCount),
    String(user.rejectedCount),
    String(user.inProgressCount),
    user.latestActivityAt || "",
  ]);

  return toCsv(headers, rows);
}

export function buildGroupsCsv(groups: ExternalApiGroupsResponse["groups"]) {
  const headers = [
    "ID groupe",
    "Nom groupe",
    "Créé le",
    "Créé par",
    "Membres",
    "Candidatures",
    "Entretiens",
  ];

  const rows = groups.map((group) => [
    String(group.id),
    group.name,
    group.createdAt,
    group.createdBy.email,
    String(group.memberCount),
    String(group.totalApplications),
    String(group.totalInterviews),
  ]);

  return toCsv(headers, rows);
}

export function buildApplicationsCsv(applications: ExternalApiApplicationsResponse["applications"]) {
  const headers = [
    "User ID",
    "Prénom",
    "Nom",
    "Email",
    "Rôle",
    "Groupes",
    "Entreprise",
    "Intitulé",
    "Type",
    "Lieu",
    "Date envoyée",
    "Date relance",
    "Dernière relance",
    "Date entretien",
    "Détails entretien",
    "Statut",
    "Notes",
    "Preuves",
    "Note privée coach",
    "Contributeurs note privée",
    "Notes coach partagées",
    "Contributeurs notes partagées",
    "Lien",
    "PDF",
    "Mis à jour le",
  ];

  const rows = applications.map((row) => [
    String(row.userId),
    row.userFirstName,
    row.userLastName,
    row.userEmail,
    row.userRole,
    row.groupNames.join(" | "),
    row.application.job.company || "",
    row.application.job.title,
    row.application.job.contractType,
    row.application.job.location,
    row.application.appliedAt,
    row.application.followUpDueAt,
    row.application.lastFollowUpAt || "",
    row.application.interviewAt || "",
    row.application.interviewDetails || "",
    row.application.status,
    row.application.notes || "",
    row.application.proofs || "",
    row.application.privateCoachNote?.content || "",
    row.application.privateCoachNote
      ? summarizeCoachContributors(row.application.privateCoachNote.contributors)
      : "",
    (row.application.sharedCoachNotes ?? [])
      .map((note) => `${formatCoachAuthorName(note.createdBy)}: ${note.content}`)
      .join(" | "),
    (row.application.sharedCoachNotes ?? [])
      .map((note) => summarizeCoachContributors(note.contributors))
      .join(" | "),
    row.application.job.url || "",
    row.application.job.pdfUrl || "",
    row.application.updatedAt,
  ]);

  return toCsv(headers, rows);
}

function neutralizeSpreadsheetFormula(value: string) {
  if (!value) return value;
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function escapeCell(value: string) {
  return `"${neutralizeSpreadsheetFormula(value).replace(/"/g, '""').replace(/\n/g, " ")}"`;
}

function toCsv(headers: string[], rows: string[][]) {
  return [headers, ...rows].map((row) => row.map((cell) => escapeCell(cell ?? "")).join(",")).join("\n");
}

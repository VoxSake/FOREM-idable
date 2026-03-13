import { format, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { CoachApplicationExportRow } from "@/lib/exportCoachApplicationsCsv";
import { CoachNoteAuthor, JobApplication } from "@/types/application";
import { CoachGroupSummary, CoachUserSummary } from "@/types/coach";
import {
  CoachGroupedUserGroup,
  CoachMemberPickerGroup,
  CoachUserFilter,
} from "@/features/coach/types";

export function getCoachUserDisplayName(user: Pick<CoachUserSummary, "firstName" | "lastName" | "email">) {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

export function formatCoachAuthorName(author: Pick<CoachNoteAuthor, "firstName" | "lastName" | "email">) {
  return `${author.firstName} ${author.lastName}`.trim() || author.email || "Historique";
}

export function summarizeCoachContributors(contributors: CoachNoteAuthor[]) {
  const seen = new Set<number>();
  return contributors
    .filter((entry) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    })
    .map((entry) => formatCoachAuthorName(entry))
    .join(", ");
}

export function formatCoachDate(value?: string | null, withTime = false) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, withTime ? "dd MMM yyyy 'a' HH:mm" : "dd MMM yyyy", { locale: fr });
}

export function coachStatusLabel(status: JobApplication["status"]) {
  switch (status) {
    case "accepted":
      return "Acceptée";
    case "rejected":
      return "Refusée";
    case "follow_up":
      return "Relance à faire";
    case "interview":
      return "Entretien";
    case "in_progress":
    default:
      return "En cours";
  }
}

export function isApplicationDue(application: JobApplication) {
  const due = new Date(application.followUpDueAt);
  return (
    (application.status === "in_progress" || application.status === "follow_up") &&
    !Number.isNaN(due.getTime()) &&
    !isAfter(due, new Date())
  );
}

export function buildMemberPickerGroup(
  groups: CoachGroupSummary[] | undefined,
  memberPickerGroupId: number | null
): CoachMemberPickerGroup | null {
  return (
    groups?.find((group) => group.id === memberPickerGroupId) ??
    (memberPickerGroupId === -2
      ? {
          id: -2,
          name: "Coaches",
          createdAt: "",
          createdBy: { id: 0, email: "" },
          members: [],
        }
      : null)
  );
}

export function buildGroupedUsers(input: {
  groups: CoachGroupSummary[];
  users: CoachUserSummary[];
  normalizedSearch: string;
  canManageCoachGroup: boolean;
  userFilter: CoachUserFilter;
}): CoachGroupedUserGroup[] {
  const { groups, users, normalizedSearch, canManageCoachGroup, userFilter } = input;
  const matchesSearch = (user: CoachUserSummary) =>
    !normalizedSearch ||
    [
      user.firstName,
      user.lastName,
      `${user.firstName} ${user.lastName}`.trim(),
      user.email,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);

  const matchesFilter = (user: CoachUserSummary) => {
    switch (userFilter) {
      case "due":
        return user.dueCount > 0;
      case "interviews":
        return user.interviewCount > 0;
      case "accepted":
        return user.acceptedCount > 0;
      case "rejected":
        return user.rejectedCount > 0;
      case "all":
      default:
        return true;
    }
  };

  const sortMembers = (members: CoachUserSummary[]) =>
    [...members].sort((left, right) => {
      if (right.dueCount !== left.dueCount) return right.dueCount - left.dueCount;

      const leftLatest = left.latestActivityAt ? new Date(left.latestActivityAt).getTime() : 0;
      const rightLatest = right.latestActivityAt ? new Date(right.latestActivityAt).getTime() : 0;
      if (rightLatest !== leftLatest) return rightLatest - leftLatest;

      if (right.applicationCount !== left.applicationCount) {
        return right.applicationCount - left.applicationCount;
      }

      return getCoachUserDisplayName(left).localeCompare(getCoachUserDisplayName(right), "fr");
    });

  const standardGroups = groups.map((group) => {
    const members = users.filter((entry) => group.members.some((member) => member.id === entry.id));
    const visibleMembers = sortMembers(
      members.filter((entry) => matchesSearch(entry) && matchesFilter(entry))
    );

    return {
      id: group.id,
      name: group.name,
      createdByEmail: group.createdBy.email,
      canAddMembers: true,
      kind: "standard" as const,
      totalApplications: members.reduce((sum, entry) => sum + entry.applicationCount, 0),
      totalInterviews: members.reduce((sum, entry) => sum + entry.interviewCount, 0),
      totalDue: members.reduce((sum, entry) => sum + entry.dueCount, 0),
      totalAccepted: members.reduce((sum, entry) => sum + entry.acceptedCount, 0),
      totalRejected: members.reduce((sum, entry) => sum + entry.rejectedCount, 0),
      members: visibleMembers,
    };
  });

  const ungroupedMembers = users.filter(
    (entry) =>
      entry.role === "user" &&
      entry.groupIds.length === 0 &&
      matchesSearch(entry) &&
      matchesFilter(entry)
  );
  const coachMembers = users.filter(
    (entry) =>
      (entry.role === "coach" || entry.role === "admin") &&
      matchesSearch(entry) &&
      matchesFilter(entry)
  );
  const allUngroupedMembers = users.filter(
    (entry) => entry.role === "user" && entry.groupIds.length === 0
  );
  const allCoachMembers = users.filter(
    (entry) => entry.role === "coach" || entry.role === "admin"
  );

  const syntheticGroups: CoachGroupedUserGroup[] = [
    {
      id: -1,
      name: "Aucun groupe attribué",
      createdByEmail: null,
      canAddMembers: false,
      kind: "ungrouped",
      totalApplications: allUngroupedMembers.reduce((sum, entry) => sum + entry.applicationCount, 0),
      totalInterviews: allUngroupedMembers.reduce((sum, entry) => sum + entry.interviewCount, 0),
      totalDue: allUngroupedMembers.reduce((sum, entry) => sum + entry.dueCount, 0),
      totalAccepted: allUngroupedMembers.reduce((sum, entry) => sum + entry.acceptedCount, 0),
      totalRejected: allUngroupedMembers.reduce((sum, entry) => sum + entry.rejectedCount, 0),
      members: sortMembers(ungroupedMembers),
    },
    {
      id: -2,
      name: "Coaches",
      createdByEmail: null,
      canAddMembers: canManageCoachGroup,
      kind: "coaches",
      totalApplications: allCoachMembers.reduce((sum, entry) => sum + entry.applicationCount, 0),
      totalInterviews: allCoachMembers.reduce((sum, entry) => sum + entry.interviewCount, 0),
      totalDue: allCoachMembers.reduce((sum, entry) => sum + entry.dueCount, 0),
      totalAccepted: allCoachMembers.reduce((sum, entry) => sum + entry.acceptedCount, 0),
      totalRejected: allCoachMembers.reduce((sum, entry) => sum + entry.rejectedCount, 0),
      members: sortMembers(coachMembers),
    },
  ];

  return [...standardGroups, ...syntheticGroups].filter(
    (group) => group.members.length > 0 || !normalizedSearch
  );
}

export function buildUserExportRows(user: CoachUserSummary): CoachApplicationExportRow[] {
  return user.applications.length > 0
    ? user.applications.map((application) => ({
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userEmail: user.email,
        groupName: user.groupNames[0] ?? "",
        application,
      }))
    : [
        {
          userFirstName: user.firstName,
          userLastName: user.lastName,
          userEmail: user.email,
          groupName: user.groupNames[0] ?? "",
          message: "Utilisateur sans candidature au moment de l'export.",
        },
      ];
}

export function buildGroupExportRows(
  groupName: string,
  members: CoachUserSummary[]
): CoachApplicationExportRow[] {
  const rows: CoachApplicationExportRow[] = [];

  for (const entry of members) {
    if (entry.applications.length > 0) {
      for (const application of entry.applications) {
        rows.push({
          userFirstName: entry.firstName,
          userLastName: entry.lastName,
          userEmail: entry.email,
          groupName,
          application,
        });
      }
    } else {
      rows.push({
        userFirstName: entry.firstName,
        userLastName: entry.lastName,
        userEmail: entry.email,
        groupName,
        message: "Aucune candidature pour cet utilisateur dans ce groupe.",
      });
    }
  }

  return rows;
}

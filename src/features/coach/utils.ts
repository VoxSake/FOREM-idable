import { addDays, differenceInCalendarDays, format, isAfter, isBefore, startOfDay } from "date-fns";
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
    application.followUpEnabled !== false &&
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
  const getMostRelevantActivityTime = (user: CoachUserSummary) => {
    const timestamps =
      user.role === "coach" || user.role === "admin"
        ? [user.lastCoachActionAt, user.lastSeenAt, user.latestActivityAt]
        : [user.latestActivityAt];

    for (const value of timestamps) {
      const time = value ? new Date(value).getTime() : 0;
      if (!Number.isNaN(time) && time > 0) {
        return time;
      }
    }

    return 0;
  };
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

      const leftLatest = getMostRelevantActivityTime(left);
      const rightLatest = getMostRelevantActivityTime(right);
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

export interface CoachPriorityItem {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  groupLabel: string;
  summary: string;
  detail: string;
  timestamp: string | null;
}

export interface CoachPrioritySection {
  id: "due" | "interviews" | "inactive";
  title: string;
  description: string;
  emptyLabel: string;
  total: number;
  items: CoachPriorityItem[];
}

export function buildCoachPrioritySections(
  users: CoachUserSummary[],
  now = new Date()
): CoachPrioritySection[] {
  const startToday = startOfDay(now);
  const interviewWindowEnd = addDays(startToday, 7);

  const beneficiaryUsers = users.filter((entry) => entry.role === "user");

  const dueItems = beneficiaryUsers
    .map((user) => {
      const dueApplications = user.applications.filter((application) => isApplicationDue(application));
      if (dueApplications.length === 0) {
        return null;
      }

      const oldestDue = dueApplications
        .map((application) => parseTimestamp(application.followUpDueAt))
        .filter((value): value is number => value !== null)
        .sort((left, right) => left - right)[0];

      return {
        id: `due-${user.id}`,
        userId: user.id,
        userName: getCoachUserDisplayName(user),
        userEmail: user.email,
        groupLabel: user.groupNames[0] ?? "Aucun groupe",
        summary: `${dueApplications.length} relance${dueApplications.length > 1 ? "s" : ""} due${dueApplications.length > 1 ? "s" : ""}`,
        detail:
          oldestDue !== undefined
            ? `Plus ancienne le ${formatCoachDate(new Date(oldestDue).toISOString())}`
            : "Relance due à vérifier",
        timestamp: oldestDue ? new Date(oldestDue).toISOString() : null,
      } satisfies CoachPriorityItem;
    })
    .filter((item): item is CoachPriorityItem => item !== null)
    .sort(comparePriorityItemsByTimestamp);

  const interviewItems = beneficiaryUsers
    .map((user) => {
      const upcomingInterviews = user.applications.filter((application) => {
        if (!application.interviewAt) {
          return false;
        }

        const interviewDate = new Date(application.interviewAt);
        return (
          !Number.isNaN(interviewDate.getTime()) &&
          !isBefore(interviewDate, startToday) &&
          !isAfter(interviewDate, interviewWindowEnd)
        );
      });

      if (upcomingInterviews.length === 0) {
        return null;
      }

      const earliestInterview = upcomingInterviews
        .map((application) => parseTimestamp(application.interviewAt))
        .filter((value): value is number => value !== null)
        .sort((left, right) => left - right)[0];

      return {
        id: `interview-${user.id}`,
        userId: user.id,
        userName: getCoachUserDisplayName(user),
        userEmail: user.email,
        groupLabel: user.groupNames[0] ?? "Aucun groupe",
        summary: `${upcomingInterviews.length} entretien${upcomingInterviews.length > 1 ? "s" : ""} à venir`,
        detail:
          earliestInterview !== undefined
            ? `Prochain le ${formatCoachDate(new Date(earliestInterview).toISOString(), true)}`
            : "Entretien programmé à vérifier",
        timestamp: earliestInterview ? new Date(earliestInterview).toISOString() : null,
      } satisfies CoachPriorityItem;
    })
    .filter((item): item is CoachPriorityItem => item !== null)
    .sort(comparePriorityItemsByTimestamp);

  const inactiveItems = beneficiaryUsers
    .filter((user) => user.applicationCount > 0)
    .map((user) => {
      const latestActivityTime = parseTimestamp(user.latestActivityAt);
      if (latestActivityTime !== null && differenceInCalendarDays(now, new Date(latestActivityTime)) < 14) {
        return null;
      }

      return {
        id: `inactive-${user.id}`,
        userId: user.id,
        userName: getCoachUserDisplayName(user),
        userEmail: user.email,
        groupLabel: user.groupNames[0] ?? "Aucun groupe",
        summary: latestActivityTime
          ? `Inactif depuis ${differenceInCalendarDays(now, new Date(latestActivityTime))} jours`
          : "Aucune activité enregistrée",
        detail: `${user.applicationCount} candidature${user.applicationCount > 1 ? "s" : ""} à suivre`,
        timestamp: latestActivityTime ? new Date(latestActivityTime).toISOString() : null,
      } satisfies CoachPriorityItem;
    })
    .filter((item): item is CoachPriorityItem => item !== null)
    .sort((left, right) => {
      const leftTime = parseTimestamp(left.timestamp);
      const rightTime = parseTimestamp(right.timestamp);

      if (leftTime === null && rightTime === null) return left.userName.localeCompare(right.userName, "fr");
      if (leftTime === null) return -1;
      if (rightTime === null) return 1;
      if (leftTime !== rightTime) return leftTime - rightTime;

      return left.userName.localeCompare(right.userName, "fr");
    });

  return [
    {
      id: "due",
      title: "Relances à traiter",
      description: "Bénéficiaires avec au moins une relance échue ou en retard.",
      emptyLabel: "Aucune relance urgente.",
      total: dueItems.length,
      items: dueItems,
    },
    {
      id: "interviews",
      title: "Entretiens proches",
      description: "Entretiens programmés aujourd'hui ou dans les 7 prochains jours.",
      emptyLabel: "Aucun entretien proche.",
      total: interviewItems.length,
      items: interviewItems,
    },
    {
      id: "inactive",
      title: "Suivis à relancer",
      description: "Bénéficiaires sans activité récente depuis au moins 14 jours.",
      emptyLabel: "Aucun suivi inactif notable.",
      total: inactiveItems.length,
      items: inactiveItems,
    },
  ];
}

function parseTimestamp(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function comparePriorityItemsByTimestamp(left: CoachPriorityItem, right: CoachPriorityItem) {
  const leftTime = parseTimestamp(left.timestamp);
  const rightTime = parseTimestamp(right.timestamp);

  if (leftTime === null && rightTime === null) return left.userName.localeCompare(right.userName, "fr");
  if (leftTime === null) return 1;
  if (rightTime === null) return -1;
  if (leftTime !== rightTime) return leftTime - rightTime;

  return left.userName.localeCompare(right.userName, "fr");
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

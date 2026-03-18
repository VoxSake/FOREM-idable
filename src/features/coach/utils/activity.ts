import {
  addDays,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import { CoachUserSummary } from "@/types/coach";
import {
  formatCoachDate,
  getCoachUserDisplayName,
  isApplicationDue,
  isTrackedCoachBeneficiary,
  parseTimestamp,
} from "@/features/coach/utils/formatting";

export interface CoachRecentActivityItem {
  id: string;
  userId: number;
  jobId: string | null;
  userName: string;
  groupLabel: string;
  title: string;
  detail: string;
  timestamp: string;
}

export function buildCoachRecentActivity(
  users: CoachUserSummary[],
  maxItems = 10
): CoachRecentActivityItem[] {
  const items: CoachRecentActivityItem[] = [];

  for (const user of users) {
    if (!isTrackedCoachBeneficiary(user)) {
      continue;
    }

    const groupLabel = user.groupNames[0] ?? "Aucun groupe";
    const userName = getCoachUserDisplayName(user);

    for (const application of user.applications) {
      if (parseTimestamp(application.updatedAt) !== null) {
        items.push({
          id: `application-${user.id}-${application.job.id}`,
          userId: user.id,
          jobId: application.job.id,
          userName,
          groupLabel,
          title: application.job.title,
          detail: `${application.job.company || "Entreprise non précisée"} • candidature mise à jour`,
          timestamp: application.updatedAt,
        });
      }

      if (
        application.interviewAt &&
        parseTimestamp(application.interviewAt) !== null &&
        application.updatedAt &&
        parseTimestamp(application.updatedAt) !== null
      ) {
        items.push({
          id: `interview-${user.id}-${application.job.id}`,
          userId: user.id,
          jobId: application.job.id,
          userName,
          groupLabel,
          title: application.job.title,
          detail: `${application.job.company || "Entreprise non précisée"} • entretien planifié`,
          timestamp: application.interviewAt,
        });
      }
    }
  }

  return items
    .sort((left, right) => {
      const leftTime = parseTimestamp(left.timestamp) ?? 0;
      const rightTime = parseTimestamp(right.timestamp) ?? 0;
      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      return left.userName.localeCompare(right.userName, "fr");
    })
    .slice(0, maxItems);
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

function comparePriorityItemsByTimestamp(left: CoachPriorityItem, right: CoachPriorityItem) {
  const leftTime = parseTimestamp(left.timestamp);
  const rightTime = parseTimestamp(right.timestamp);

  if (leftTime === null && rightTime === null) return left.userName.localeCompare(right.userName, "fr");
  if (leftTime === null) return 1;
  if (rightTime === null) return -1;
  if (leftTime !== rightTime) return leftTime - rightTime;

  return left.userName.localeCompare(right.userName, "fr");
}

export function buildCoachPrioritySections(
  users: CoachUserSummary[],
  now = new Date()
): CoachPrioritySection[] {
  const startToday = startOfDay(now);
  const interviewWindowEnd = addDays(startToday, 7);

  const beneficiaryUsers = users.filter((entry) => isTrackedCoachBeneficiary(entry));

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

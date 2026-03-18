import { buildCoachApplicationSummary, sortApplicationsByAppliedAtDesc } from "@/features/coach/applicationSummary";
import { JobApplication } from "@/types/application";
import { UserRole } from "@/types/auth";
import { CoachDashboardData, CoachUserSummary } from "@/types/coach";

export function summarizeUserApplications(
  entry: CoachUserSummary,
  nextApplications: JobApplication[]
): CoachUserSummary {
  return {
    ...entry,
    applications: nextApplications,
    ...buildCoachApplicationSummary(nextApplications),
  };
}

export function applyApplicationUpdateToDashboard(
  dashboard: CoachDashboardData,
  userId: number,
  application: JobApplication
): CoachDashboardData {
  return {
    ...dashboard,
    users: dashboard.users.map((entry) => {
      if (entry.id !== userId) {
        return entry;
      }

      const nextApplications = sortApplicationsByAppliedAtDesc(
        entry.applications.map((existing) =>
          existing.job.id === application.job.id ? application : existing
        )
      );

      return summarizeUserApplications(entry, nextApplications);
    }),
  };
}

export function removeApplicationFromDashboard(
  dashboard: CoachDashboardData,
  userId: number,
  jobId: string
): CoachDashboardData {
  return {
    ...dashboard,
    users: dashboard.users.map((entry) => {
      if (entry.id !== userId) {
        return entry;
      }

      return summarizeUserApplications(
        entry,
        entry.applications.filter((application) => application.job.id !== jobId)
      );
    }),
  };
}

export function removeMembershipFromDashboard(
  dashboard: CoachDashboardData,
  groupId: number,
  userId: number
): CoachDashboardData {
  const targetGroup = dashboard.groups.find((group) => group.id === groupId);
  const nextGroups = dashboard.groups.map((group) =>
    group.id === groupId
      ? {
          ...group,
          members: group.members.filter((member) => member.id !== userId),
        }
      : group
  );

  const nextUsers = dashboard.users.map((entry) => {
    if (entry.id !== userId) {
      return entry;
    }

    return {
      ...entry,
      groupIds: entry.groupIds.filter((id) => id !== groupId),
      groupNames:
        targetGroup && entry.groupNames.includes(targetGroup.name)
          ? entry.groupNames.filter((name) => name !== targetGroup.name)
          : entry.groupNames,
    };
  });

  return {
    ...dashboard,
    groups: nextGroups,
    users: nextUsers,
  };
}

export function addMembershipToDashboard(
  dashboard: CoachDashboardData,
  groupId: number,
  userId: number
): CoachDashboardData {
  const targetGroup = dashboard.groups.find((group) => group.id === groupId);
  const targetUser = dashboard.users.find((entry) => entry.id === userId);
  if (!targetGroup || !targetUser) {
    return dashboard;
  }

  const nextGroups = dashboard.groups.map((group) =>
    group.id === groupId && !group.members.some((member) => member.id === userId)
      ? {
          ...group,
          members: [
            ...group.members,
            {
              id: targetUser.id,
              email: targetUser.email,
              firstName: targetUser.firstName,
              lastName: targetUser.lastName,
              role: targetUser.role,
            },
          ].sort((left, right) => left.email.localeCompare(right.email, "fr")),
        }
      : group
  );

  const nextUsers = dashboard.users.map((entry) => {
    if (entry.id !== userId) {
      return entry;
    }

    return {
      ...entry,
      groupIds: entry.groupIds.includes(groupId) ? entry.groupIds : [...entry.groupIds, groupId],
      groupNames: entry.groupNames.includes(targetGroup.name)
        ? entry.groupNames
        : [...entry.groupNames, targetGroup.name],
    };
  });

  return {
    ...dashboard,
    groups: nextGroups,
    users: nextUsers,
  };
}

export function updateUserRoleInDashboard(
  dashboard: CoachDashboardData,
  userId: number,
  nextRole: UserRole
): CoachDashboardData {
  return {
    ...dashboard,
    users: dashboard.users.map((entry) =>
      entry.id === userId
        ? {
            ...entry,
            role: nextRole,
          }
        : entry
    ),
  };
}

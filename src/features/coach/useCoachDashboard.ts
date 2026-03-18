"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CoachApplicationExportRow,
  exportCoachApplicationsToCSV,
} from "@/lib/exportCoachApplicationsCsv";
import { ApiKeySummary } from "@/types/externalApi";
import { JobApplication } from "@/types/application";
import { CalendarSubscriptionSummary } from "@/types/calendar";
import { CoachDashboardData, CoachUserSummary } from "@/types/coach";
import {
  CoachApiKeysTarget,
  CoachCalendarRegenerationTarget,
  CoachDeleteUserTarget,
  CoachEditTarget,
  CoachGroupedUserGroup,
  CoachMemberPickerGroup,
  CoachUserFilter,
  CoachRevokeApiKeyTarget,
  CoachRemoveGroupTarget,
  CoachRemoveMembershipTarget,
} from "@/features/coach/types";
import {
  buildCoachRecentActivity,
  buildGroupedUsers,
  buildGroupExportRows,
  buildMemberPickerGroup,
  buildUserExportRows,
} from "@/features/coach/utils";

type CoachUndoAction =
  | {
      type: "remove-membership";
      label: string;
      groupId: number;
      userId: number;
      groupName: string;
    }
  | {
      type: "demote-coach";
      label: string;
      userId: number;
      previousRole: "coach" | "admin";
    };

export function useCoachDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [dashboard, setDashboard] = useState<CoachDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<CoachUndoAction | null>(null);
  const [groupName, setGroupName] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [memberPickerGroupId, setMemberPickerGroupId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [removeMembership, setRemoveMembership] = useState<CoachRemoveMembershipTarget | null>(null);
  const [removeGroup, setRemoveGroup] = useState<CoachRemoveGroupTarget | null>(null);
  const [editTarget, setEditTarget] = useState<CoachEditTarget | null>(null);
  const [apiKeysTarget, setApiKeysTarget] = useState<CoachApiKeysTarget | null>(null);
  const [managedApiKeys, setManagedApiKeys] = useState<ApiKeySummary[]>([]);
  const [apiKeysFeedback, setApiKeysFeedback] = useState<string | null>(null);
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(false);
  const [revokeApiKeyTarget, setRevokeApiKeyTarget] = useState<CoachRevokeApiKeyTarget | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<CoachDeleteUserTarget | null>(null);
  const [calendarRegenerationTarget, setCalendarRegenerationTarget] =
    useState<CoachCalendarRegenerationTarget | null>(null);
  const [savingCoachNoteKey, setSavingCoachNoteKey] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [editedFirstName, setEditedFirstName] = useState("");
  const [editedLastName, setEditedLastName] = useState("");
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<CoachUserFilter>("all");
  const deferredSearch = useDeferredValue(search);

  const applyApplicationUpdate = (userId: number, application: JobApplication) => {
    setDashboard((current) => {
      if (!current) return current;

      return {
        ...current,
        users: current.users.map((entry) => {
          if (entry.id !== userId) {
            return entry;
          }

          const nextApplications = entry.applications
            .map((existing) =>
              existing.job.id === application.job.id ? application : existing
            )
            .sort((left, right) => {
              const leftTime = new Date(left.appliedAt).getTime();
              const rightTime = new Date(right.appliedAt).getTime();
              return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
            });

          const now = new Date();

          return {
            ...entry,
            applications: nextApplications,
            applicationCount: nextApplications.length,
            interviewCount: nextApplications.filter((item) => item.status === "interview").length,
            dueCount: nextApplications.filter((item) => {
              const due = new Date(item.followUpDueAt);
              return (
                (item.status === "in_progress" || item.status === "follow_up") &&
                item.followUpEnabled !== false &&
                !Number.isNaN(due.getTime()) &&
                due <= now
              );
            }).length,
            acceptedCount: nextApplications.filter((item) => item.status === "accepted").length,
            rejectedCount: nextApplications.filter((item) => item.status === "rejected").length,
            inProgressCount: nextApplications.filter((item) => item.status === "in_progress").length,
            latestActivityAt:
              nextApplications
                .map((item) => item.updatedAt)
                .filter(Boolean)
                .sort((a, b) => (a > b ? -1 : 1))[0] ?? null,
          };
        }),
      };
    });
  };

  const removeMembershipLocally = (groupId: number, userId: number) => {
    setDashboard((current) => {
      if (!current) return current;

      const targetGroup = current.groups.find((group) => group.id === groupId);
      const nextGroups = current.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              members: group.members.filter((member) => member.id !== userId),
            }
          : group
      );

      const nextUsers = current.users.map((entry) => {
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
        ...current,
        groups: nextGroups,
        users: nextUsers,
      };
    });
  };

  const addMembershipLocally = (groupId: number, userId: number) => {
    setDashboard((current) => {
      if (!current) return current;

      const targetGroup = current.groups.find((group) => group.id === groupId);
      const targetUser = current.users.find((entry) => entry.id === userId);
      if (!targetGroup || !targetUser) {
        return current;
      }

      const nextGroups = current.groups.map((group) =>
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

      const nextUsers = current.users.map((entry) => {
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
        ...current,
        groups: nextGroups,
        users: nextUsers,
      };
    });
  };

  const updateUserRoleLocally = (userId: number, nextRole: "user" | "coach" | "admin") => {
    setDashboard((current) => {
      if (!current) return current;

      return {
        ...current,
        users: current.users.map((entry) =>
          entry.id === userId
            ? {
                ...entry,
                role: nextRole,
              }
            : entry
        ),
      };
    });
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/coach/dashboard", { cache: "no-store" });
      const data = (await response.json()) as { error?: string; dashboard?: CoachDashboardData };

      if (!response.ok || !data.dashboard) {
        setDashboard(null);
        setFeedback(data.error || "Accès coach indisponible.");
        return;
      }

      setDashboard(data.dashboard);
    } catch {
      setDashboard(null);
      setFeedback("Accès coach indisponible.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user || (user.role !== "coach" && user.role !== "admin")) {
      setIsLoading(false);
      return;
    }

    void loadDashboard();
  }, [isAuthLoading, user]);

  const selectedUser = useMemo(
    () => dashboard?.users.find((entry) => entry.id === selectedUserId) ?? null,
    [dashboard, selectedUserId]
  );

  const memberPickerGroup: CoachMemberPickerGroup | null = useMemo(
    () => buildMemberPickerGroup(dashboard?.groups, memberPickerGroupId),
    [dashboard?.groups, memberPickerGroupId]
  );

  const assignableUsers = useMemo(() => {
    if (!dashboard || !memberPickerGroup) return [];
    if (memberPickerGroup.id === -2) {
      return dashboard.users.filter((entry) => entry.role === "user");
    }

    const memberIds = new Set(memberPickerGroup.members.map((entry) => entry.id));
    return dashboard.users.filter((entry) => !memberIds.has(entry.id));
  }, [dashboard, memberPickerGroup]);

  const groupedUsers: CoachGroupedUserGroup[] = useMemo(() => {
    if (!dashboard) return [];

    return buildGroupedUsers({
      groups: dashboard.groups,
      users: dashboard.users,
      normalizedSearch: deferredSearch.trim().toLowerCase(),
      canManageCoachGroup: user?.role === "admin",
      userFilter,
    });
  }, [dashboard, deferredSearch, user?.role, userFilter]);
  const recentActivity = useMemo(
    () => buildCoachRecentActivity(dashboard?.users ?? []),
    [dashboard?.users]
  );

  const totalApplications = dashboard?.users.reduce((sum, entry) => sum + entry.applicationCount, 0) ?? 0;
  const totalInterviews = dashboard?.users.reduce((sum, entry) => sum + entry.interviewCount, 0) ?? 0;
  const totalDue = dashboard?.users.reduce((sum, entry) => sum + entry.dueCount, 0) ?? 0;
  const totalAccepted = dashboard?.users.reduce((sum, entry) => sum + entry.acceptedCount, 0) ?? 0;
  const totalRejected = dashboard?.users.reduce((sum, entry) => sum + entry.rejectedCount, 0) ?? 0;
  const canEditSelectedUser = useMemo(() => {
    if (!selectedUser || !user) return false;
    if (user.role === "admin") return true;
    return selectedUser.role === "user";
  }, [selectedUser, user]);
  const canManageSelectedUserApiKeys = useMemo(
    () =>
      user?.role === "admin" &&
      Boolean(selectedUser) &&
      (selectedUser?.role === "coach" || selectedUser?.role === "admin"),
    [selectedUser, user?.role]
  );

  const createGroup = async () => {
    if (!groupName.trim()) return;

    const response = await fetch("/api/coach/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName }),
    });

    if (!response.ok) {
      setFeedback("Création du groupe impossible.");
      return;
    }

    setUndoAction(null);
    setGroupName("");
    setIsCreateGroupOpen(false);
    await loadDashboard();
  };

  const promoteCoach = async (userId: number) => {
    const response = await fetch("/api/admin/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      setFeedback("Promotion coach impossible.");
      return false;
    }

    setUndoAction(null);
    await loadDashboard();
    return true;
  };

  const addMember = async (groupId: number, userId: number) => {
    if (groupId === -2) {
      await promoteCoach(userId);
      return;
    }

    const response = await fetch(`/api/coach/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      setFeedback("Ajout au groupe impossible.");
      return;
    }

    setUndoAction(null);
    await loadDashboard();
  };

  const removeMember = async (groupId: number, userId: number) => {
    const targetGroup = dashboard?.groups.find((group) => group.id === groupId);
    if (!targetGroup) {
      setFeedback("Groupe introuvable.");
      return;
    }

    removeMembershipLocally(groupId, userId);
    const response = await fetch(`/api/coach/groups/${groupId}/members?userId=${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      addMembershipLocally(groupId, userId);
      setFeedback("Suppression du groupe impossible.");
      return;
    }

    setUndoAction({
      type: "remove-membership",
      label: "Retrait du groupe effectué.",
      groupId,
      userId,
      groupName: targetGroup.name,
    });
    setFeedback("Membre retiré du groupe.");
  };

  const demoteCoach = async (userId: number) => {
    const targetUser = dashboard?.users.find((entry) => entry.id === userId);
    if (!targetUser || (targetUser.role !== "coach" && targetUser.role !== "admin")) {
      setFeedback("Utilisateur introuvable.");
      return;
    }

    updateUserRoleLocally(userId, "user");
    const response = await fetch(`/api/admin/coaches?userId=${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      updateUserRoleLocally(userId, targetUser.role);
      setFeedback("Retrait du rôle coach impossible.");
      return;
    }

    setUndoAction({
      type: "demote-coach",
      label: "Retrait du rôle coach effectué.",
      userId,
      previousRole: targetUser.role,
    });
    setFeedback("Rôle coach retiré.");
  };

  const deleteGroup = async (groupId: number) => {
    const response = await fetch(`/api/coach/groups?groupId=${groupId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setFeedback("Suppression du groupe impossible.");
      return;
    }

    setUndoAction(null);
    await loadDashboard();
  };

  const updateManagedUser = async () => {
    if (!editTarget || !editedFirstName.trim() || !editedLastName.trim()) {
      setFeedback("Nom et prénom invalides.");
      return;
    }

    if ((newPassword.length > 0 || confirmNewPassword.length > 0) && (newPassword.length < 8 || newPassword !== confirmNewPassword)) {
      setFeedback("Mot de passe invalide.");
      return;
    }

    const response = await fetch(`/api/admin/users/${editTarget.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: editedFirstName,
        lastName: editedLastName,
        password: newPassword || undefined,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setFeedback(data.error || "Mise à jour utilisateur impossible.");
      return;
    }

    setUndoAction(null);
    setFeedback(`Utilisateur mis à jour: ${editTarget.email}.`);
    setEditTarget(null);
    setEditedFirstName("");
    setEditedLastName("");
    setNewPassword("");
    setConfirmNewPassword("");
    await loadDashboard();
  };

  const deleteUser = async () => {
    if (!deleteUserTarget) return;

    const response = await fetch(`/api/admin/users/${deleteUserTarget.userId}`, {
      method: "DELETE",
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setFeedback(data.error || "Suppression utilisateur impossible.");
      return;
    }

    setUndoAction(null);
    if (selectedUserId === deleteUserTarget.userId) {
      setSelectedUserId(null);
    }
    setFeedback(`Compte supprimé: ${deleteUserTarget.email}.`);
    setDeleteUserTarget(null);
    await loadDashboard();
  };

  const savePrivateCoachNote = async (
    userId: number,
    jobId: string,
    content: string
  ) => {
    setSavingCoachNoteKey(`private:${jobId}`);

    const response = await fetch(`/api/coach/users/${userId}/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        action: "save-private",
        content,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      application?: JobApplication;
    };
    if (!response.ok) {
      setFeedback(data.error || "Note coach impossible à enregistrer.");
      setSavingCoachNoteKey(null);
      return false;
    }

    setFeedback("Note privée enregistrée.");
    if (data.application) {
      applyApplicationUpdate(userId, data.application);
    }
    setSavingCoachNoteKey(null);
    return true;
  };

  const createSharedCoachNote = async (userId: number, jobId: string, content: string) => {
    setSavingCoachNoteKey(`create:${jobId}`);

    const response = await fetch(`/api/coach/users/${userId}/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        action: "create-shared",
        content,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      application?: JobApplication;
    };
    if (!response.ok) {
      setFeedback(data.error || "Note partagée impossible à créer.");
      setSavingCoachNoteKey(null);
      return false;
    }

    setFeedback("Note partagée enregistrée.");
    if (data.application) {
      applyApplicationUpdate(userId, data.application);
    }
    setSavingCoachNoteKey(null);
    return true;
  };

  const updateSharedCoachNote = async (
    userId: number,
    jobId: string,
    noteId: string,
    content: string
  ) => {
    setSavingCoachNoteKey(`shared:${noteId}`);

    const response = await fetch(`/api/coach/users/${userId}/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        noteId,
        action: "update-shared",
        content,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      application?: JobApplication;
    };
    if (!response.ok) {
      setFeedback(data.error || "Note partagée impossible à mettre à jour.");
      setSavingCoachNoteKey(null);
      return false;
    }

    setFeedback("Note partagée mise à jour.");
    if (data.application) {
      applyApplicationUpdate(userId, data.application);
    }
    setSavingCoachNoteKey(null);
    return true;
  };

  const deleteSharedCoachNote = async (userId: number, jobId: string, noteId: string) => {
    setSavingCoachNoteKey(`delete:${noteId}`);

    const response = await fetch(`/api/coach/users/${userId}/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        noteId,
        action: "delete-shared",
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      application?: JobApplication;
    };
    if (!response.ok) {
      setFeedback(data.error || "Suppression de la note partagée impossible.");
      setSavingCoachNoteKey(null);
      return false;
    }

    setFeedback("Note partagée supprimée.");
    if (data.application) {
      applyApplicationUpdate(userId, data.application);
    }
    setSavingCoachNoteKey(null);
    return true;
  };

  const openManagedUserApiKeys = async () => {
    if (!selectedUser || user?.role !== "admin") return;
    if (selectedUser.role !== "coach" && selectedUser.role !== "admin") return;

    setApiKeysTarget({
      userId: selectedUser.id,
      email: selectedUser.email,
      role: selectedUser.role,
    });
    setManagedApiKeys([]);
    setApiKeysFeedback(null);
    setIsApiKeysLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/api-keys`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        apiKeys?: ApiKeySummary[];
      };

      if (!response.ok || !data.apiKeys) {
        setApiKeysFeedback(data.error || "Chargement des clés API impossible.");
        return;
      }

      setManagedApiKeys(data.apiKeys);
    } catch {
      setApiKeysFeedback("Chargement des clés API impossible.");
    } finally {
      setIsApiKeysLoading(false);
    }
  };

  const revokeManagedApiKey = async () => {
    if (!revokeApiKeyTarget) return;

    const response = await fetch(
      `/api/admin/users/${revokeApiKeyTarget.userId}/api-keys/${revokeApiKeyTarget.keyId}`,
      { method: "DELETE" }
    );
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setApiKeysFeedback(data.error || "Révocation impossible.");
      return;
    }

    setManagedApiKeys((current) =>
      current.filter((entry) => entry.id !== revokeApiKeyTarget.keyId)
    );
    setApiKeysFeedback(`Clé API révoquée: ${revokeApiKeyTarget.keyName}.`);
    setRevokeApiKeyTarget(null);
  };

  const exportRows = (filenamePrefix: string, rows: CoachApplicationExportRow[]) => {
    exportCoachApplicationsToCSV({
      filenamePrefix,
      rows,
    });
  };

  const buildAbsoluteCalendarUrl = (subscription: CalendarSubscriptionSummary) => {
    if (typeof window === "undefined") {
      return subscription.path;
    }

    return `${window.location.origin}${subscription.path}`;
  };

  const writeCalendarUrl = async (
    subscription: CalendarSubscriptionSummary,
    label: string,
    actionLabel: string
  ) => {
    const absoluteUrl = buildAbsoluteCalendarUrl(subscription);

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setFeedback(`${actionLabel} : ${label}.`);
      return true;
    } catch {
      setFeedback(`Calendrier prêt, mais copie impossible: ${label}.`);
      return false;
    }
  };

  const requestCalendarSubscription = async (input: {
    scope: "group" | "all_groups";
    groupId?: number | null;
    regenerate?: boolean;
    label: string;
  }) => {
    const response = await fetch("/api/coach/calendar-subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: input.scope,
        groupId: input.groupId,
        regenerate: input.regenerate === true,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      subscription?: CalendarSubscriptionSummary;
    };

    if (!response.ok || !data.subscription) {
      setFeedback(data.error || "Calendrier indisponible.");
      return false;
    }

    await writeCalendarUrl(
      data.subscription,
      input.label,
      input.regenerate ? "Nouvelle URL calendrier régénérée et copiée" : "Nouvelle URL calendrier copiée"
    );
    return true;
  };

  const exportUserApplications = () => {
    if (!selectedUser) return;

    const rows = buildUserExportRows(selectedUser);
    exportRows(
      `candidatures-${selectedUser.email.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
      rows
    );

    if (selectedUser.applications.length === 0) {
      setFeedback("Export généré avec une ligne vide: aucune candidature pour cet utilisateur.");
    }
  };

  const exportGroupApplications = (groupName: string, members: CoachUserSummary[]) => {
    const rows = buildGroupExportRows(groupName, members);
    exportRows(`groupe-${groupName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`, rows);

    if (members.every((entry) => entry.applications.length === 0)) {
      setFeedback("Export généré avec des lignes vides: aucune candidature dans ce groupe.");
    }
  };

  const copyGroupCalendarUrl = async (groupId: number, groupName: string) =>
    requestCalendarSubscription({
      scope: "group",
      groupId,
      label: `groupe ${groupName}`,
    });

  const copyAllGroupsCalendarUrl = async () =>
    requestCalendarSubscription({
      scope: "all_groups",
      label: "tous les groupes bénéficiaires",
    });

  const regenerateCalendarUrl = async () => {
    if (!calendarRegenerationTarget) return;

    const success = await requestCalendarSubscription({
      scope: calendarRegenerationTarget.scope,
      groupId: calendarRegenerationTarget.groupId,
      regenerate: true,
      label: calendarRegenerationTarget.label,
    });

    if (success) {
      setCalendarRegenerationTarget(null);
    }
  };

  const undoLastAction = async () => {
    if (!undoAction) return;

    if (undoAction.type === "remove-membership") {
      addMembershipLocally(undoAction.groupId, undoAction.userId);
      const response = await fetch(`/api/coach/groups/${undoAction.groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: undoAction.userId }),
      });

      if (!response.ok) {
        removeMembershipLocally(undoAction.groupId, undoAction.userId);
        setFeedback("Impossible d'annuler le retrait du groupe.");
        return;
      }

      setUndoAction(null);
      setFeedback("Retrait du groupe annulé.");
      return;
    }

    if (undoAction.type === "demote-coach") {
      updateUserRoleLocally(undoAction.userId, undoAction.previousRole);
      const response = await fetch("/api/admin/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: undoAction.userId }),
      });

      if (!response.ok) {
        updateUserRoleLocally(undoAction.userId, "user");
        setFeedback("Impossible d'annuler le retrait du rôle coach.");
        return;
      }

      setUndoAction(null);
      setFeedback("Retrait du rôle coach annulé.");
    }
  };

  return {
    user,
    isAuthLoading,
    dashboard,
    isLoading,
    feedback,
    setFeedback,
    undoAction,
    groupName,
    setGroupName,
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    memberPickerGroupId,
    setMemberPickerGroupId,
    selectedUserId,
    setSelectedUserId,
    removeMembership,
    setRemoveMembership,
    removeGroup,
    setRemoveGroup,
    editTarget,
    setEditTarget,
    apiKeysTarget,
    setApiKeysTarget,
    managedApiKeys,
    apiKeysFeedback,
    isApiKeysLoading,
    revokeApiKeyTarget,
    setRevokeApiKeyTarget,
    deleteUserTarget,
    setDeleteUserTarget,
    calendarRegenerationTarget,
    setCalendarRegenerationTarget,
    savingCoachNoteKey,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    editedFirstName,
    setEditedFirstName,
    editedLastName,
    setEditedLastName,
    search,
    setSearch,
    userFilter,
    setUserFilter,
    selectedUser,
    canEditSelectedUser,
    canManageSelectedUserApiKeys,
    memberPickerGroup,
    assignableUsers,
    groupedUsers,
    recentActivity,
    totalApplications,
    totalInterviews,
    totalDue,
    totalAccepted,
    totalRejected,
    loadDashboard,
    createGroup,
    addMember,
    removeMember,
    demoteCoach,
    deleteGroup,
    updateManagedUser,
    openManagedUserApiKeys,
    revokeManagedApiKey,
    deleteUser,
    savePrivateCoachNote,
    createSharedCoachNote,
    updateSharedCoachNote,
    deleteSharedCoachNote,
    exportUserApplications,
    exportGroupApplications,
    copyGroupCalendarUrl,
    copyAllGroupsCalendarUrl,
    regenerateCalendarUrl,
    undoLastAction,
  };
}

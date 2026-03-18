"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CoachApplicationExportRow,
  exportCoachApplicationsToCSV,
} from "@/lib/exportCoachApplicationsCsv";
import {
  fetchCoachDashboard,
  fetchManagedUserApiKeys,
  requestCalendarSubscription as requestCalendarSubscriptionApi,
  requestCoachApplicationNote,
} from "@/features/coach/coachDashboardApi";
import {
  addMembershipToDashboard,
  addCoachAssignmentToDashboard,
  applyApplicationUpdateToDashboard,
  insertGroupIntoDashboard,
  removeApplicationFromDashboard,
  removeCoachAssignmentFromDashboard,
  removeGroupFromDashboard,
  removeMembershipFromDashboard,
  replaceGroupIdInDashboard,
  setGroupManagerInDashboard,
  updateManagedUserInDashboard,
  updateUserRoleInDashboard,
} from "@/features/coach/dashboardState";
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
  CoachRemoveCoachTarget,
  CoachUserFilter,
  CoachRevokeApiKeyTarget,
  CoachRemoveGroupTarget,
  CoachRemoveMembershipTarget,
} from "@/features/coach/types";
import {
  buildCoachRecentActivity,
  buildGroupedUsers,
  buildGroupExportRows,
  buildManagerPickerGroup,
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
  const [isPromoteCoachOpen, setIsPromoteCoachOpen] = useState(false);
  const [memberPickerGroupId, setMemberPickerGroupId] = useState<number | null>(null);
  const [coachPickerGroupId, setCoachPickerGroupId] = useState<number | null>(null);
  const [managerPickerGroupId, setManagerPickerGroupId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [removeMembership, setRemoveMembership] = useState<CoachRemoveMembershipTarget | null>(null);
  const [removeCoach, setRemoveCoach] = useState<CoachRemoveCoachTarget | null>(null);
  const [removeGroup, setRemoveGroup] = useState<CoachRemoveGroupTarget | null>(null);
  const [editTarget, setEditTarget] = useState<CoachEditTarget | null>(null);
  const [apiKeysTarget, setApiKeysTarget] = useState<CoachApiKeysTarget | null>(null);
  const [importTargetUserId, setImportTargetUserId] = useState<number | null>(null);
  const [managedApiKeys, setManagedApiKeys] = useState<ApiKeySummary[]>([]);
  const [apiKeysFeedback, setApiKeysFeedback] = useState<string | null>(null);
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(false);
  const [isImportingApplications, setIsImportingApplications] = useState(false);
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
      return applyApplicationUpdateToDashboard(current, userId, application);
    });
  };

  const removeApplicationLocally = (userId: number, jobId: string) => {
    setDashboard((current) => {
      if (!current) return current;
      return removeApplicationFromDashboard(current, userId, jobId);
    });
  };

  const removeMembershipLocally = (groupId: number, userId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return removeMembershipFromDashboard(current, groupId, userId);
    });
  };

  const addMembershipLocally = (groupId: number, userId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return addMembershipToDashboard(current, groupId, userId);
    });
  };

  const addCoachLocally = (groupId: number, coachId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return addCoachAssignmentToDashboard(current, groupId, coachId);
    });
  };

  const removeCoachLocally = (groupId: number, coachId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return removeCoachAssignmentFromDashboard(current, groupId, coachId);
    });
  };

  const setGroupManagerLocally = (groupId: number, coachId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return setGroupManagerInDashboard(current, groupId, coachId);
    });
  };

  const updateUserRoleLocally = (userId: number, nextRole: "user" | "coach" | "admin") => {
    setDashboard((current) => {
      if (!current) return current;
      return updateUserRoleInDashboard(current, userId, nextRole);
    });
  };

  const updateManagedUserLocally = (
    userId: number,
    patch: Pick<CoachUserSummary, "firstName" | "lastName">
  ) => {
    setDashboard((current) => {
      if (!current) return current;
      return updateManagedUserInDashboard(current, userId, patch);
    });
  };

  const addGroupLocally = (input: {
    id: number;
    name: string;
    createdAt: string;
    createdBy: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
    };
    managerCoachId: number | null;
    initialCoach?: Pick<
      CoachUserSummary,
      "id" | "email" | "firstName" | "lastName" | "role" | "lastSeenAt"
    > | null;
  }) => {
    setDashboard((current) => {
      if (!current) return current;
      return insertGroupIntoDashboard(current, input);
    });
  };

  const replaceGroupIdLocally = (currentGroupId: number, nextGroupId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return replaceGroupIdInDashboard(current, currentGroupId, nextGroupId);
    });
  };

  const removeGroupLocally = (groupId: number) => {
    setDashboard((current) => {
      if (!current) return current;
      return removeGroupFromDashboard(current, groupId);
    });
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const { response, data } = await fetchCoachDashboard();

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
  const coachPickerGroup: CoachMemberPickerGroup | null = useMemo(
    () => buildMemberPickerGroup(dashboard?.groups, coachPickerGroupId),
    [dashboard?.groups, coachPickerGroupId]
  );
  const managerPickerGroup = useMemo(
    () => buildManagerPickerGroup(dashboard?.groups, managerPickerGroupId),
    [dashboard?.groups, managerPickerGroupId]
  );

  const assignableUsers = useMemo(() => {
    if (!dashboard || !memberPickerGroup) return [];
    const memberIds = new Set(memberPickerGroup.members.map((entry) => entry.id));
    return dashboard.users.filter((entry) => !memberIds.has(entry.id));
  }, [dashboard, memberPickerGroup]);

  const assignableCoaches = useMemo(() => {
    if (!dashboard || !coachPickerGroup) return [];

    const assignedCoachIds = new Set(coachPickerGroup.coaches.map((entry) => entry.id));
    return dashboard.availableCoaches.filter((entry) => !assignedCoachIds.has(entry.id));
  }, [coachPickerGroup, dashboard]);

  const assignableManagers = useMemo(
    () => managerPickerGroup?.coaches ?? [],
    [managerPickerGroup]
  );

  const groupedUsers: CoachGroupedUserGroup[] = useMemo(() => {
    if (!dashboard) return [];

    return buildGroupedUsers({
      groups: dashboard.groups,
      users: dashboard.users,
      normalizedSearch: deferredSearch.trim().toLowerCase(),
      userFilter,
    });
  }, [dashboard, deferredSearch, userFilter]);
  const recentActivity = useMemo(
    () => buildCoachRecentActivity(dashboard?.users ?? []),
    [dashboard?.users]
  );
  const importTargetUser = useMemo(
    () => dashboard?.users.find((entry) => entry.id === importTargetUserId) ?? null,
    [dashboard, importTargetUserId]
  );

  const totalApplications = dashboard?.users.reduce((sum, entry) => sum + entry.applicationCount, 0) ?? 0;
  const totalInterviews = dashboard?.users.reduce((sum, entry) => sum + entry.interviewCount, 0) ?? 0;
  const totalDue = dashboard?.users.reduce((sum, entry) => sum + entry.dueCount, 0) ?? 0;
  const totalAccepted = dashboard?.users.reduce((sum, entry) => sum + entry.acceptedCount, 0) ?? 0;
  const totalRejected = dashboard?.users.reduce((sum, entry) => sum + entry.rejectedCount, 0) ?? 0;
  const promotableUsers = useMemo(
    () => dashboard?.users.filter((entry) => entry.role === "user") ?? [],
    [dashboard?.users]
  );
  const managedCoaches = useMemo(
    () => dashboard?.users.filter((entry) => entry.role === "coach") ?? [],
    [dashboard?.users]
  );
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
    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName) return;

    const temporaryGroupId = -Date.now();
    const createdAt = new Date().toISOString();
    const creatorEmail = user?.email ?? dashboard?.viewer.email ?? "";
    const creatorRole = user?.role;

    addGroupLocally({
      id: temporaryGroupId,
      name: trimmedGroupName,
      createdAt,
      createdBy: {
        id: user?.id ?? 0,
        email: creatorEmail,
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
      },
      managerCoachId: creatorRole === "coach" ? user?.id ?? null : null,
      initialCoach:
        creatorRole === "coach"
          ? {
              id: user?.id ?? 0,
              email: creatorEmail,
              firstName: user?.firstName ?? "",
              lastName: user?.lastName ?? "",
              role: "coach",
              lastSeenAt: null,
            }
          : null,
    });

    const response = await fetch("/api/coach/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedGroupName }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      group?: { id: number };
    };

    if (!response.ok) {
      removeGroupLocally(temporaryGroupId);
      setFeedback(data.error || "Création du groupe impossible.");
      return;
    }

    if (data.group?.id) {
      replaceGroupIdLocally(temporaryGroupId, data.group.id);
    }

    setUndoAction(null);
    setGroupName("");
    setIsCreateGroupOpen(false);
    setFeedback(`Groupe créé: ${trimmedGroupName}.`);
  };

  const promoteCoach = async (userId: number) => {
    updateUserRoleLocally(userId, "coach");
    const response = await fetch("/api/admin/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      updateUserRoleLocally(userId, "user");
      setFeedback("Promotion coach impossible.");
      return false;
    }

    setUndoAction(null);
    setIsPromoteCoachOpen(false);
    setFeedback("Utilisateur promu coach.");
    return true;
  };

  const addMember = async (groupId: number, userId: number) => {
    addMembershipLocally(groupId, userId);
    const response = await fetch(`/api/coach/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      removeMembershipLocally(groupId, userId);
      setFeedback("Ajout au groupe impossible.");
      return;
    }

    setUndoAction(null);
    setMemberPickerGroupId(null);
    setFeedback("Membre ajouté au groupe.");
  };

  const addCoach = async (groupId: number, userId: number) => {
    addCoachLocally(groupId, userId);
    const response = await fetch(`/api/coach/groups/${groupId}/coaches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      removeCoachLocally(groupId, userId);
      setFeedback("Attribution du coach impossible.");
      return;
    }

    setUndoAction(null);
    setCoachPickerGroupId(null);
    setFeedback("Coach attribué au groupe.");
  };

  const setGroupManager = async (groupId: number, userId: number) => {
    const previousManagerId =
      dashboard?.groups.find((entry) => entry.id === groupId)?.managerCoachId ?? null;
    setGroupManagerLocally(groupId, userId);
    const response = await fetch(`/api/coach/groups/${groupId}/manager`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      setDashboard((current) => {
        if (!current) return current;
        return {
          ...current,
          groups: current.groups.map((entry) =>
            entry.id === groupId
              ? {
                  ...entry,
                  managerCoachId: previousManagerId,
                }
              : entry
          ),
        };
      });
      setFeedback("Définition du manager impossible.");
      return;
    }

    setManagerPickerGroupId(null);
    setUndoAction(null);
    setFeedback("Manager du groupe mis à jour.");
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

  const removeAssignedCoach = async (groupId: number, userId: number) => {
    const previousManagerId =
      dashboard?.groups.find((entry) => entry.id === groupId)?.managerCoachId ?? null;
    removeCoachLocally(groupId, userId);
    const response = await fetch(`/api/coach/groups/${groupId}/coaches?userId=${userId}`, {
      method: "DELETE",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      addCoachLocally(groupId, userId);
      if (previousManagerId) {
        setGroupManagerLocally(groupId, previousManagerId);
      }
      setFeedback(data.error || "Retrait du coach impossible.");
      return;
    }

    setUndoAction(null);
    setFeedback("Coach retiré du groupe.");
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
    const previousDashboard = dashboard;
    removeGroupLocally(groupId);
    const response = await fetch(`/api/coach/groups?groupId=${groupId}`, {
      method: "DELETE",
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setDashboard(previousDashboard);
      setFeedback(data.error || "Suppression du groupe impossible.");
      return;
    }

    setUndoAction(null);
    setFeedback("Groupe supprimé.");
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

    updateManagedUserLocally(editTarget.userId, {
      firstName: editedFirstName,
      lastName: editedLastName,
    });
    setUndoAction(null);
    setFeedback(`Utilisateur mis à jour: ${editTarget.email}.`);
    setEditTarget(null);
    setEditedFirstName("");
    setEditedLastName("");
    setNewPassword("");
    setConfirmNewPassword("");
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

    const { response, data } = await requestCoachApplicationNote({
      userId,
      jobId,
      action: "save-private",
      content,
    });
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

    const { response, data } = await requestCoachApplicationNote({
      userId,
      jobId,
      action: "create-shared",
      content,
    });
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

    const { response, data } = await requestCoachApplicationNote({
      userId,
      jobId,
      noteId,
      action: "update-shared",
      content,
    });
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

    const { response, data } = await requestCoachApplicationNote({
      userId,
      jobId,
      noteId,
      action: "delete-shared",
    });
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
      const { response, data } = await fetchManagedUserApiKeys(selectedUser.id);

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
    const { response, data } = await requestCalendarSubscriptionApi({
      scope: input.scope,
      groupId: input.groupId,
      regenerate: input.regenerate,
    });

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

  const importApplicationsForUser = async (
    userId: number,
    dateFormat: "dmy" | "mdy",
    rows: Array<{
      company: string;
      contractType: string;
      title: string;
      location: string;
      appliedAt: string;
      status: string;
      notes: string;
    }>
  ) => {
    setIsImportingApplications(true);

    const response = await fetch(`/api/coach/users/${userId}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateFormat, rows }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      importedCount?: number;
      createdCount?: number;
      updatedCount?: number;
      ignoredCount?: number;
    };

    setIsImportingApplications(false);

    if (!response.ok) {
      setFeedback(data.error || "Import CSV impossible.");
      return null;
    }

    setFeedback(
      `Import CSV terminé: ${data.importedCount ?? rows.length} candidature${(data.importedCount ?? rows.length) > 1 ? "s" : ""} ajoutée${(data.importedCount ?? rows.length) > 1 ? "s" : ""}.`
    );
    setImportTargetUserId(null);
    await loadDashboard();
    return {
      importedCount: data.importedCount ?? rows.length,
      createdCount: data.createdCount ?? 0,
      updatedCount: data.updatedCount ?? 0,
      ignoredCount: data.ignoredCount ?? 0,
    };
  };

  const updateManagedApplication = async (
    userId: number,
    jobId: string,
    patch: Partial<
      Pick<
        JobApplication,
        | "status"
        | "notes"
        | "proofs"
        | "interviewAt"
        | "interviewDetails"
        | "lastFollowUpAt"
        | "followUpDueAt"
        | "followUpEnabled"
        | "appliedAt"
        | "job"
      >
    >
  ) => {
    const response = await fetch(`/api/coach/users/${userId}/applications/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      application?: JobApplication;
    };

    if (!response.ok || !data.application) {
      setFeedback(data.error || "Mise à jour de la candidature impossible.");
      return false;
    }

    setFeedback("Candidature mise à jour.");
    applyApplicationUpdate(userId, data.application);
    return true;
  };

  const deleteManagedApplication = async (userId: number, jobId: string) => {
    const response = await fetch(`/api/coach/users/${userId}/applications/${jobId}`, {
      method: "DELETE",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setFeedback(data.error || "Suppression de la candidature impossible.");
      return false;
    }

    setFeedback("Candidature supprimée.");
    removeApplicationLocally(userId, jobId);
    return true;
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
    isPromoteCoachOpen,
    setIsPromoteCoachOpen,
    memberPickerGroupId,
    setMemberPickerGroupId,
    coachPickerGroupId,
    setCoachPickerGroupId,
    managerPickerGroupId,
    setManagerPickerGroupId,
    selectedUserId,
    setSelectedUserId,
    removeMembership,
    setRemoveMembership,
    removeCoach,
    setRemoveCoach,
    removeGroup,
    setRemoveGroup,
    editTarget,
    setEditTarget,
    apiKeysTarget,
    setApiKeysTarget,
    importTargetUser,
    importTargetUserId,
    setImportTargetUserId,
    managedApiKeys,
    apiKeysFeedback,
    isApiKeysLoading,
    isImportingApplications,
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
    coachPickerGroup,
    managerPickerGroup,
    assignableUsers,
    assignableCoaches,
    assignableManagers,
    groupedUsers,
    promotableUsers,
    managedCoaches,
    recentActivity,
    totalApplications,
    totalInterviews,
    totalDue,
    totalAccepted,
    totalRejected,
    loadDashboard,
    createGroup,
    promoteCoach,
    addMember,
    addCoach,
    setGroupManager,
    removeMember,
    removeAssignedCoach,
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
    importApplicationsForUser,
    updateManagedApplication,
    deleteManagedApplication,
  };
}

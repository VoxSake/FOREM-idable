"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CoachApplicationExportRow,
  exportCoachApplicationsToCSV,
} from "@/lib/exportCoachApplicationsCsv";
import { ApiKeySummary } from "@/types/externalApi";
import { JobApplication } from "@/types/application";
import { CoachDashboardData, CoachUserSummary } from "@/types/coach";
import {
  CoachApiKeysTarget,
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
  buildGroupedUsers,
  buildGroupExportRows,
  buildMemberPickerGroup,
  buildUserExportRows,
} from "@/features/coach/utils";

export function useCoachDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [dashboard, setDashboard] = useState<CoachDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
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

    await loadDashboard();
  };

  const removeMember = async (groupId: number, userId: number) => {
    const response = await fetch(`/api/coach/groups/${groupId}/members?userId=${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setFeedback("Suppression du groupe impossible.");
      return;
    }

    await loadDashboard();
  };

  const demoteCoach = async (userId: number) => {
    const response = await fetch(`/api/admin/coaches?userId=${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setFeedback("Retrait du rôle coach impossible.");
      return;
    }

    await loadDashboard();
  };

  const deleteGroup = async (groupId: number) => {
    const response = await fetch(`/api/coach/groups?groupId=${groupId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setFeedback("Suppression du groupe impossible.");
      return;
    }

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

  return {
    user,
    isAuthLoading,
    dashboard,
    isLoading,
    feedback,
    setFeedback,
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
  };
}

"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CoachApplicationExportRow,
  exportCoachApplicationsToCSV,
} from "@/lib/exportCoachApplicationsCsv";
import { CoachDashboardData, CoachUserSummary } from "@/types/coach";
import {
  CoachDeleteUserTarget,
  CoachEditTarget,
  CoachGroupedUserGroup,
  CoachMemberPickerGroup,
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
  const [deleteUserTarget, setDeleteUserTarget] = useState<CoachDeleteUserTarget | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [editedFirstName, setEditedFirstName] = useState("");
  const [editedLastName, setEditedLastName] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

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
    });
  }, [dashboard, deferredSearch, user?.role]);

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
  const noApplicationsUsers = useMemo(
    () => dashboard?.users.filter((entry) => entry.applicationCount === 0) ?? [],
    [dashboard?.users]
  );
  const dueUsers = useMemo(
    () => dashboard?.users.filter((entry) => entry.dueCount > 0).sort((a, b) => b.dueCount - a.dueCount) ?? [],
    [dashboard?.users]
  );
  const noInterviewUsers = useMemo(
    () =>
      dashboard?.users.filter((entry) => entry.applicationCount > 0 && entry.interviewCount === 0) ?? [],
    [dashboard?.users]
  );
  const inactiveUsers = useMemo(
    () =>
      dashboard?.users.filter((entry) => entry.applicationCount > 0 && !entry.latestActivityAt) ?? [],
    [dashboard?.users]
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
    deleteUserTarget,
    setDeleteUserTarget,
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
    selectedUser,
    canEditSelectedUser,
    memberPickerGroup,
    assignableUsers,
    groupedUsers,
    totalApplications,
    totalInterviews,
    totalDue,
    totalAccepted,
    totalRejected,
    noApplicationsUsers,
    dueUsers,
    noInterviewUsers,
    inactiveUsers,
    loadDashboard,
    createGroup,
    addMember,
    removeMember,
    demoteCoach,
    deleteGroup,
    updateManagedUser,
    deleteUser,
    exportUserApplications,
    exportGroupApplications,
  };
}

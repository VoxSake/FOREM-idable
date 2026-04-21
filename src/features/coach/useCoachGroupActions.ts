"use client";

import { Dispatch, SetStateAction, useCallback } from "react";
import { CoachDashboardData, CoachUserSummary } from "@/types/coach";
import { AuthUser } from "@/types/auth";
import { CoachUndoAction } from "@/features/coach/types";

export function useCoachGroupActions(input: {
  user: AuthUser | null;
  dashboard: CoachDashboardData | null;
  groupName: string;
  addCoachLocally: (groupId: number, userId: number) => void;
  addGroupLocally: (input: {
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
    initialCoach?: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      role: "coach";
      lastSeenAt: string | null;
    } | null;
  }) => void;
  addMembershipLocally: (groupId: number, userId: number) => void;
  loadDashboard: (options?: { preserveFeedback?: boolean }) => Promise<void>;
  removeCoachLocally: (groupId: number, userId: number) => void;
  removeGroupLocally: (groupId: number) => void;
  removeMembershipLocally: (groupId: number, userId: number) => void;
  replaceGroupIdLocally: (currentGroupId: number, nextGroupId: number) => void;
  setCoachPickerGroupId: Dispatch<SetStateAction<number | null>>;
  setDashboard: Dispatch<SetStateAction<CoachDashboardData | null>>;
  setFeedback: Dispatch<SetStateAction<string | null>>;
  setGroupName: Dispatch<SetStateAction<string>>;
  setIsCreateGroupOpen: Dispatch<SetStateAction<boolean>>;
  setManagerPickerGroupId: Dispatch<SetStateAction<number | null>>;
  setMemberPickerGroupId: Dispatch<SetStateAction<number | null>>;
  setUndoAction: Dispatch<SetStateAction<CoachUndoAction | null>>;
  setGroupManagerLocally: (groupId: number, coachId: number) => void;
  setIsDeletingGroup: Dispatch<SetStateAction<boolean>>;
}) {
  const createGroup = useCallback(async () => {
    const trimmedGroupName = input.groupName.trim();
    if (!trimmedGroupName) return;

    const temporaryGroupId = -Date.now();
    const createdAt = new Date().toISOString();
    const creatorEmail = input.user?.email ?? input.dashboard?.viewer.email ?? "";
    const creatorRole = input.user?.role;

    input.addGroupLocally({
      id: temporaryGroupId,
      name: trimmedGroupName,
      createdAt,
      createdBy: {
        id: input.user?.id ?? 0,
        email: creatorEmail,
        firstName: input.user?.firstName ?? "",
        lastName: input.user?.lastName ?? "",
      },
      managerCoachId: creatorRole === "coach" ? input.user?.id ?? null : null,
      initialCoach:
        creatorRole === "coach"
          ? {
              id: input.user?.id ?? 0,
              email: creatorEmail,
              firstName: input.user?.firstName ?? "",
              lastName: input.user?.lastName ?? "",
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
      input.removeGroupLocally(temporaryGroupId);
      input.setFeedback(data.error || "Création du groupe impossible.");
      return;
    }

    if (data.group?.id) {
      input.replaceGroupIdLocally(temporaryGroupId, data.group.id);
    }

    input.setUndoAction(null);
    input.setGroupName("");
    input.setIsCreateGroupOpen(false);
    input.setFeedback(`Groupe créé: ${trimmedGroupName}.`);
  }, [input]);

  const addMember = useCallback(
    async (groupId: number, userId: number) => {
      input.addMembershipLocally(groupId, userId);
      const response = await fetch(`/api/coach/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        input.removeMembershipLocally(groupId, userId);
        input.setFeedback("Ajout au groupe impossible.");
        return;
      }

      input.setUndoAction(null);
      input.setMemberPickerGroupId(null);
      input.setFeedback("Membre ajouté au groupe.");
    },
    [input]
  );

  const addCoach = useCallback(
    async (groupId: number, userId: number) => {
      input.addCoachLocally(groupId, userId);
      const response = await fetch(`/api/coach/groups/${groupId}/coaches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        input.removeCoachLocally(groupId, userId);
        input.setFeedback("Attribution du coach impossible.");
        return;
      }

      input.setUndoAction(null);
      input.setCoachPickerGroupId(null);
      input.setFeedback("Coach attribué au groupe.");
    },
    [input]
  );

  const setGroupManager = useCallback(
    async (groupId: number, userId: number) => {
      const previousManagerId =
        input.dashboard?.groups.find((entry) => entry.id === groupId)?.managerCoachId ?? null;
      input.setGroupManagerLocally(groupId, userId);
      const response = await fetch(`/api/coach/groups/${groupId}/manager`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        input.setDashboard((current) => {
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
        input.setFeedback("Définition du manager impossible.");
        return;
      }

      input.setManagerPickerGroupId(null);
      input.setUndoAction(null);
      input.setFeedback("Manager du groupe mis à jour.");
    },
    [input]
  );

  const removeMember = useCallback(
    async (groupId: number, userId: number) => {
      const targetGroup = input.dashboard?.groups.find((group) => group.id === groupId);
      if (!targetGroup) {
        input.setFeedback("Groupe introuvable.");
        return;
      }

      input.removeMembershipLocally(groupId, userId);
      const response = await fetch(`/api/coach/groups/${groupId}/members?userId=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        input.addMembershipLocally(groupId, userId);
        input.setFeedback("Suppression du groupe impossible.");
        return;
      }

      input.setUndoAction({
        type: "remove-membership",
        label: "Retrait du groupe effectué.",
        groupId,
        userId,
        groupName: targetGroup.name,
      });
      input.setFeedback("Membre retiré du groupe.");
    },
    [input]
  );

  const removeAssignedCoach = useCallback(
    async (groupId: number, userId: number) => {
      const previousManagerId =
        input.dashboard?.groups.find((entry) => entry.id === groupId)?.managerCoachId ?? null;
      input.removeCoachLocally(groupId, userId);
      const response = await fetch(`/api/coach/groups/${groupId}/coaches?userId=${userId}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        input.addCoachLocally(groupId, userId);
        if (previousManagerId) {
          input.setGroupManagerLocally(groupId, previousManagerId);
        }
        input.setFeedback(data.error || "Retrait du coach impossible.");
        return;
      }

      input.setUndoAction(null);
      input.setFeedback("Coach retiré du groupe.");
    },
    [input]
  );

  const deleteGroup = useCallback(
    async (groupId: number) => {
      input.setIsDeletingGroup(true);
      input.removeGroupLocally(groupId);
      const response = await fetch(`/api/coach/groups?groupId=${groupId}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        await input.loadDashboard();
        input.setFeedback(data.error || "Suppression du groupe impossible.");
        input.setIsDeletingGroup(false);
        return;
      }

      input.setUndoAction(null);
      input.setFeedback("Groupe supprimé.");
      input.setIsDeletingGroup(false);
    },
    [input]
  );

  const restoreMembership = useCallback(
    async (undoAction: Extract<CoachUndoAction, { type: "remove-membership" }>) => {
      input.addMembershipLocally(undoAction.groupId, undoAction.userId);
      const response = await fetch(`/api/coach/groups/${undoAction.groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: undoAction.userId }),
      });

      if (!response.ok) {
        input.removeMembershipLocally(undoAction.groupId, undoAction.userId);
        input.setFeedback("Impossible d'annuler le retrait du groupe.");
        return false;
      }

      input.setUndoAction(null);
      input.setFeedback("Retrait du groupe annulé.");
      return true;
    },
    [input]
  );

  const updateGroupPhase = useCallback(
    async (groupId: number, phase: string, reason?: string) => {
      const previousUsers = input.dashboard?.users.map((user) => ({
        id: user.id,
        phase: user.trackingPhase,
      }));

      input.setDashboard((current) => {
        if (!current) return current;
        const group = current.groups.find((g) => g.id === groupId);
        if (!group) return current;
        const memberIds = new Set(group.members.map((m) => m.id));
        return {
          ...current,
          users: current.users.map((user) =>
            memberIds.has(user.id) ? { ...user, trackingPhase: phase as CoachUserSummary["trackingPhase"] } : user
          ),
        };
      });

      const response = await fetch(`/api/coach/groups/${groupId}/phase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase, reason }),
      });

      if (!response.ok) {
        input.setDashboard((current) => {
          if (!current) return current;
          return {
            ...current,
            users: current.users.map((user) => {
              const prev = previousUsers?.find((u) => u.id === user.id);
              return prev ? { ...user, trackingPhase: prev.phase } : user;
            }),
          };
        });
        input.setFeedback("Changement de phase impossible.");
        return;
      }

      input.setUndoAction(null);
      input.setFeedback("Phase du groupe mise à jour.");
    },
    [input]
  );

  const archiveGroup = useCallback(
    async (groupId: number, archived: boolean) => {
      input.setDashboard((current) => {
        if (!current) return current;
        return {
          ...current,
          groups: current.groups.map((group) =>
            group.id === groupId
              ? { ...group, archivedAt: archived ? new Date().toISOString() : null }
              : group
          ),
        };
      });

      const response = await fetch(`/api/coach/groups/${groupId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });

      if (!response.ok) {
        input.setDashboard((current) => {
          if (!current) return current;
          return {
            ...current,
            groups: current.groups.map((group) =>
              group.id === groupId
                ? { ...group, archivedAt: archived ? null : new Date().toISOString() }
                : group
            ),
          };
        });
        input.setFeedback(archived ? "Archivage impossible." : "Désarchivage impossible.");
        return;
      }

      input.setUndoAction(null);
      input.setFeedback(archived ? "Groupe archivé." : "Groupe désarchivé.");
    },
    [input]
  );

  return {
    addCoach,
    addMember,
    archiveGroup,
    createGroup,
    deleteGroup,
    removeAssignedCoach,
    removeMember,
    restoreMembership,
    setGroupManager,
    updateGroupPhase,
  };
}

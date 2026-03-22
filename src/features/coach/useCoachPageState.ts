"use client";

import { useCallback, useMemo, useState } from "react";
import { buildCoachPrioritySections } from "@/features/coach/utils";
import { useCoachDashboard } from "@/features/coach/useCoachDashboard";

export function useCoachPageState() {
  const coach = useCoachDashboard();
  const [activityTargetJobId, setActivityTargetJobId] = useState<string | null>(null);

  const followedUserCount = useMemo(
    () =>
      coach.dashboard?.users.filter(
        (entry) => entry.role === "user" || entry.groupIds.length > 0
      ).length ?? 0,
    [coach.dashboard?.users]
  );
  const prioritySections = useMemo(
    () => buildCoachPrioritySections(coach.dashboard?.users ?? []),
    [coach.dashboard?.users]
  );
  const isAuthorized =
    coach.user?.role === "coach" || coach.user?.role === "admin";

  const closeSelectedUserSheet = useCallback(
    (open: boolean) => {
      if (open) return;

      coach.setSelectedUserId(null);
      setActivityTargetJobId(null);
    },
    [coach]
  );

  const openUserFromActivity = useCallback(
    (userId: number, jobId?: string | null) => {
      setActivityTargetJobId(jobId ?? null);
      coach.setSelectedUserId(userId);
    },
    [coach]
  );

  const openSelectedUserEditor = useCallback(() => {
    if (!coach.selectedUser) return;

    coach.setEditTarget({
      userId: coach.selectedUser.id,
      email: coach.selectedUser.email,
      firstName: coach.selectedUser.firstName,
      lastName: coach.selectedUser.lastName,
      role: coach.selectedUser.role,
    });
    coach.setEditedFirstName(coach.selectedUser.firstName);
    coach.setEditedLastName(coach.selectedUser.lastName);
    coach.setNewPassword("");
    coach.setConfirmNewPassword("");
  }, [coach]);

  const openSelectedUserDeletion = useCallback(() => {
    if (!coach.selectedUser) return;

    coach.setDeleteUserTarget({
      userId: coach.selectedUser.id,
      email: coach.selectedUser.email,
    });
  }, [coach]);

  const resetEditDialog = useCallback(
    (open: boolean) => {
      if (open) return;

      coach.setEditTarget(null);
      coach.setEditedFirstName("");
      coach.setEditedLastName("");
      coach.setNewPassword("");
      coach.setConfirmNewPassword("");
    },
    [coach]
  );

  const resetApiKeysDialog = useCallback(
    (open: boolean) => {
      if (open) return;

      coach.setApiKeysTarget(null);
      coach.setRevokeApiKeyTarget(null);
    },
    [coach]
  );

  const requestRevokeApiKey = useCallback(
    (apiKey: (typeof coach.managedApiKeys)[number]) => {
      if (!coach.apiKeysTarget) return;

      coach.setRevokeApiKeyTarget({
        userId: coach.apiKeysTarget.userId,
        keyId: apiKey.id,
        keyName: apiKey.name,
        email: coach.apiKeysTarget.email,
      });
    },
    [coach]
  );

  const closeImportDialog = useCallback(
    (open: boolean) => {
      if (open) return;
      coach.setImportTargetUserId(null);
    },
    [coach]
  );

  return {
    ...coach,
    activityTargetJobId,
    followedUserCount,
    prioritySections,
    isAuthorized,
    closeSelectedUserSheet,
    openUserFromActivity,
    openSelectedUserEditor,
    openSelectedUserDeletion,
    resetEditDialog,
    resetApiKeysDialog,
    requestRevokeApiKey,
    closeImportDialog,
  };
}

export type CoachPageState = ReturnType<typeof useCoachPageState>;

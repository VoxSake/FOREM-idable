"use client";

import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoachDialogs } from "@/features/coach/components/CoachDialogs";
import { CoachGroupsSection } from "@/features/coach/components/CoachGroupsSection";
import { CoachSummaryCards } from "@/features/coach/components/CoachSummaryCards";
import { CoachUserSheet } from "@/features/coach/components/CoachUserSheet";
import { useCoachDashboard } from "@/features/coach/useCoachDashboard";

export default function CoachPage() {
  const coach = useCoachDashboard();

  if (coach.isAuthLoading || coach.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Chargement du suivi coach...
        </div>
      </div>
    );
  }

  if (!coach.user || (coach.user.role !== "coach" && coach.user.role !== "admin")) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight">Accès réservé</h1>
        <p className="mt-2 text-muted-foreground">
          Cette page est réservée aux comptes `coach` et `admin`.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">Suivi coach</h1>
          <Badge variant="secondary" className="capitalize">
            {coach.user.role}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Vue transverse sur tous les utilisateurs, leurs groupes et leurs candidatures.
        </p>
        {coach.feedback && <p className="text-sm text-muted-foreground">{coach.feedback}</p>}
      </div>

      <CoachSummaryCards
        userCount={coach.dashboard?.users.length ?? 0}
        totalApplications={coach.totalApplications}
        totalInterviews={coach.totalInterviews}
        totalDue={coach.totalDue}
      />

      <CoachGroupsSection
        search={coach.search}
        onSearchChange={coach.setSearch}
        groupedUsers={coach.groupedUsers}
        onCreateGroup={() => coach.setIsCreateGroupOpen(true)}
        onAddMember={coach.setMemberPickerGroupId}
        onExportGroup={coach.exportGroupApplications}
        onRemoveGroup={(groupId, groupName) => coach.setRemoveGroup({ groupId, groupName })}
        onOpenUser={coach.setSelectedUserId}
        onRemoveMembership={coach.setRemoveMembership}
        onDemoteCoach={(userId) => void coach.demoteCoach(userId)}
      />

      <CoachUserSheet
        currentUserId={coach.user.id}
        isAdmin={coach.user.role === "admin"}
        open={Boolean(coach.selectedUser)}
        user={coach.selectedUser}
        onOpenChange={(open) => !open && coach.setSelectedUserId(null)}
        onExport={coach.exportUserApplications}
        onChangePassword={() => {
          if (!coach.selectedUser) return;
          coach.setPasswordTarget({
            userId: coach.selectedUser.id,
            email: coach.selectedUser.email,
          });
        }}
        onDeleteUser={() => {
          if (!coach.selectedUser) return;
          coach.setDeleteUserTarget({
            userId: coach.selectedUser.id,
            email: coach.selectedUser.email,
          });
        }}
      />

      <CoachDialogs
        groupName={coach.groupName}
        onGroupNameChange={coach.setGroupName}
        isCreateGroupOpen={coach.isCreateGroupOpen}
        onCreateGroupOpenChange={coach.setIsCreateGroupOpen}
        onCreateGroup={() => void coach.createGroup()}
        memberPickerGroup={coach.memberPickerGroup}
        assignableUsers={coach.assignableUsers}
        onMemberPickerOpenChange={(open) => !open && coach.setMemberPickerGroupId(null)}
        onMemberSelect={(userId) => void coach.addMember(coach.memberPickerGroup?.id ?? 0, userId)}
        removeMembership={coach.removeMembership}
        onRemoveMembershipOpenChange={(open) => !open && coach.setRemoveMembership(null)}
        onConfirmRemoveMembership={() => {
          if (!coach.removeMembership) return;
          void coach.removeMember(coach.removeMembership.groupId, coach.removeMembership.userId);
          coach.setRemoveMembership(null);
        }}
        removeGroup={coach.removeGroup}
        onRemoveGroupOpenChange={(open) => !open && coach.setRemoveGroup(null)}
        onConfirmRemoveGroup={() => {
          if (!coach.removeGroup) return;
          void coach.deleteGroup(coach.removeGroup.groupId);
          coach.setRemoveGroup(null);
        }}
        passwordTarget={coach.passwordTarget}
        newPassword={coach.newPassword}
        onNewPasswordChange={coach.setNewPassword}
        onPasswordOpenChange={(open) => {
          if (!open) {
            coach.setPasswordTarget(null);
            coach.setNewPassword("");
          }
        }}
        onConfirmPasswordChange={() => void coach.changeUserPassword()}
        deleteUserTarget={coach.deleteUserTarget}
        onDeleteUserOpenChange={(open) => !open && coach.setDeleteUserTarget(null)}
        onConfirmDeleteUser={() => void coach.deleteUser()}
      />
    </div>
  );
}

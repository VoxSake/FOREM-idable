"use client";

import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoachDialogs } from "@/features/coach/components/CoachDialogs";
import { CoachPriorityBoard } from "@/features/coach/components/CoachPriorityBoard";
import { CoachGroupsSection } from "@/features/coach/components/CoachGroupsSection";
import { CoachSummaryCards } from "@/features/coach/components/CoachSummaryCards";
import { CoachUserSheet } from "@/features/coach/components/CoachUserSheet";
import { buildCoachPrioritySections } from "@/features/coach/utils";
import { useCoachDashboard } from "@/features/coach/useCoachDashboard";

export default function CoachPage() {
  const coach = useCoachDashboard();
  const followedUserCount =
    coach.dashboard?.users.filter((entry) => entry.role === "user" || entry.groupIds.length > 0)
      .length ?? 0;
  const prioritySections = buildCoachPrioritySections(coach.dashboard?.users ?? []);

  if (coach.isAuthLoading || coach.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Chargement du suivi des bénéficiaires...
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
          <h1 className="text-3xl font-black tracking-tight">Suivi des bénéficiaires</h1>
          <Badge variant="secondary" className="capitalize">
            {coach.user.role}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Vue d&apos;ensemble sur les personnes suivies, leurs groupes et leurs candidatures.
        </p>
        {coach.feedback && <p className="text-sm text-muted-foreground">{coach.feedback}</p>}
      </div>

      <CoachSummaryCards
        userCount={followedUserCount}
        totalApplications={coach.totalApplications}
        totalInterviews={coach.totalInterviews}
        totalDue={coach.totalDue}
        totalAccepted={coach.totalAccepted}
        totalRejected={coach.totalRejected}
      />

      <CoachPriorityBoard sections={prioritySections} onOpenUser={coach.setSelectedUserId} />

      <CoachGroupsSection
        search={coach.search}
        onSearchChange={coach.setSearch}
        userFilter={coach.userFilter}
        onUserFilterChange={coach.setUserFilter}
        groupedUsers={coach.groupedUsers}
        canRegenerateCalendars={coach.user.role === "admin"}
        onCreateGroup={() => coach.setIsCreateGroupOpen(true)}
        onCopyAllGroupsCalendar={() => void coach.copyAllGroupsCalendarUrl()}
        onRequestRegenerateAllGroupsCalendar={() =>
          coach.setCalendarRegenerationTarget({
            scope: "all_groups",
            groupId: null,
            label: "tous les groupes bénéficiaires",
          })
        }
        onAddMember={coach.setMemberPickerGroupId}
        onExportGroup={coach.exportGroupApplications}
        onCopyGroupCalendar={(groupId, groupName) =>
          void coach.copyGroupCalendarUrl(groupId, groupName)
        }
        onRequestRegenerateGroupCalendar={(groupId, groupName) =>
          coach.setCalendarRegenerationTarget({
            scope: "group",
            groupId,
            label: `groupe ${groupName}`,
          })
        }
        onRemoveGroup={(groupId, groupName) => coach.setRemoveGroup({ groupId, groupName })}
        onOpenUser={coach.setSelectedUserId}
        onRemoveMembership={coach.setRemoveMembership}
        onDemoteCoach={(userId) => void coach.demoteCoach(userId)}
      />

      <CoachUserSheet
        currentUserId={coach.user.id}
        isAdmin={coach.user.role === "admin"}
        canEditUser={coach.canEditSelectedUser}
        canManageApiKeys={Boolean(coach.canManageSelectedUserApiKeys)}
        open={Boolean(coach.selectedUser)}
        user={coach.selectedUser}
        savingCoachNoteKey={coach.savingCoachNoteKey}
        onOpenChange={(open) => !open && coach.setSelectedUserId(null)}
        onExport={coach.exportUserApplications}
        onOpenApiKeys={() => void coach.openManagedUserApiKeys()}
        onEdit={() => {
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
        }}
        onDeleteUser={() => {
          if (!coach.selectedUser) return;
          coach.setDeleteUserTarget({
            userId: coach.selectedUser.id,
            email: coach.selectedUser.email,
          });
        }}
        onSavePrivateCoachNote={(userId, jobId, content) =>
          coach.savePrivateCoachNote(userId, jobId, content)
        }
        onCreateSharedCoachNote={(userId, jobId, content) =>
          coach.createSharedCoachNote(userId, jobId, content)
        }
        onUpdateSharedCoachNote={(userId, jobId, noteId, content) =>
          coach.updateSharedCoachNote(userId, jobId, noteId, content)
        }
        onDeleteSharedCoachNote={(userId, jobId, noteId) =>
          coach.deleteSharedCoachNote(userId, jobId, noteId)
        }
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
        editTarget={coach.editTarget}
        editedFirstName={coach.editedFirstName}
        editedLastName={coach.editedLastName}
        newPassword={coach.newPassword}
        confirmNewPassword={coach.confirmNewPassword}
        onEditedFirstNameChange={coach.setEditedFirstName}
        onEditedLastNameChange={coach.setEditedLastName}
        onNewPasswordChange={coach.setNewPassword}
        onConfirmNewPasswordChange={coach.setConfirmNewPassword}
        onEditOpenChange={(open) => {
          if (!open) {
            coach.setEditTarget(null);
            coach.setEditedFirstName("");
            coach.setEditedLastName("");
            coach.setNewPassword("");
            coach.setConfirmNewPassword("");
          }
        }}
        onConfirmEdit={() => void coach.updateManagedUser()}
        apiKeysTarget={coach.apiKeysTarget}
        apiKeys={coach.managedApiKeys}
        apiKeysFeedback={coach.apiKeysFeedback}
        isApiKeysLoading={coach.isApiKeysLoading}
        onApiKeysOpenChange={(open) => {
          if (!open) {
            coach.setApiKeysTarget(null);
            coach.setRevokeApiKeyTarget(null);
          }
        }}
        onRequestRevokeApiKey={(apiKey) => {
          if (!coach.apiKeysTarget) return;
          coach.setRevokeApiKeyTarget({
            userId: coach.apiKeysTarget.userId,
            keyId: apiKey.id,
            keyName: apiKey.name,
            email: coach.apiKeysTarget.email,
          });
        }}
        revokeApiKeyTarget={coach.revokeApiKeyTarget}
        onRevokeApiKeyOpenChange={(open) => {
          if (!open) {
            coach.setRevokeApiKeyTarget(null);
          }
        }}
        onConfirmRevokeApiKey={() => void coach.revokeManagedApiKey()}
        deleteUserTarget={coach.deleteUserTarget}
        onDeleteUserOpenChange={(open) => !open && coach.setDeleteUserTarget(null)}
        onConfirmDeleteUser={() => void coach.deleteUser()}
        calendarRegenerationTarget={coach.calendarRegenerationTarget}
        onCalendarRegenerationOpenChange={(open) => {
          if (!open) {
            coach.setCalendarRegenerationTarget(null);
          }
        }}
        onConfirmCalendarRegeneration={() => void coach.regenerateCalendarUrl()}
      />
    </div>
  );
}

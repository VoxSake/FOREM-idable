"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoachAdminSection } from "@/features/coach/components/CoachAdminSection";
import { CoachDialogs } from "@/features/coach/components/CoachDialogs";
import { CoachImportApplicationsDialog } from "@/features/coach/components/CoachImportApplicationsDialog";
import { CoachPriorityBoard } from "@/features/coach/components/CoachPriorityBoard";
import { CoachRecentActivity } from "@/features/coach/components/CoachRecentActivity";
import { CoachGroupsSection } from "@/features/coach/components/CoachGroupsSection";
import { CoachSummaryCards } from "@/features/coach/components/CoachSummaryCards";
import { CoachUserSheet } from "@/features/coach/components/CoachUserSheet";
import { buildCoachPrioritySections } from "@/features/coach/utils";
import { useCoachDashboard } from "@/features/coach/useCoachDashboard";

export default function CoachPage() {
  const coach = useCoachDashboard();
  const [activityTargetJobId, setActivityTargetJobId] = useState<string | null>(null);
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
        {coach.feedback || coach.undoAction ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
            <p className="text-muted-foreground">{coach.feedback ?? coach.undoAction?.label}</p>
            {coach.undoAction ? (
              <Button type="button" size="sm" variant="outline" onClick={() => void coach.undoLastAction()}>
                Annuler
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <CoachSummaryCards
        userCount={followedUserCount}
        totalApplications={coach.totalApplications}
        totalInterviews={coach.totalInterviews}
        totalDue={coach.totalDue}
        totalAccepted={coach.totalAccepted}
        totalRejected={coach.totalRejected}
      />

      {coach.user.role === "admin" ? (
        <CoachAdminSection
          coaches={coach.managedCoaches}
          promotableUsers={coach.promotableUsers}
          isPromoteCoachOpen={coach.isPromoteCoachOpen}
          onPromoteCoachOpenChange={coach.setIsPromoteCoachOpen}
          onPromoteCoach={(userId) => void coach.promoteCoach(userId)}
          onDemoteCoach={(userId) => void coach.demoteCoach(userId)}
        />
      ) : null}

      {followedUserCount === 0 ? (
        <section className="rounded-2xl border border-dashed bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold">Aucun bénéficiaire suivi pour l&apos;instant</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Commencez par créer un groupe, puis ajoutez un bénéficiaire pour centraliser ses candidatures,
            ses relances et ses entretiens.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => coach.setIsCreateGroupOpen(true)}>
              Créer un groupe
            </Button>
          </div>
        </section>
      ) : (
        <>
          <div id="a-traiter" className="scroll-mt-6">
            <CoachPriorityBoard sections={prioritySections} onOpenUser={coach.setSelectedUserId} />
          </div>
          <CoachRecentActivity
            items={coach.recentActivity}
            onOpenItem={(userId, jobId) => {
              setActivityTargetJobId(jobId);
              coach.setSelectedUserId(userId);
            }}
          />
        </>
      )}

      <div id="groupes" className="scroll-mt-6">
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
          onAddCoach={coach.setCoachPickerGroupId}
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
          onRemoveCoach={coach.setRemoveCoach}
        />
      </div>

      <CoachUserSheet
        currentUserId={coach.user.id}
        isAdmin={coach.user.role === "admin"}
        canEditUser={coach.canEditSelectedUser}
        canManageApiKeys={Boolean(coach.canManageSelectedUserApiKeys)}
        open={Boolean(coach.selectedUser)}
        user={coach.selectedUser}
        initialJobId={activityTargetJobId}
        savingCoachNoteKey={coach.savingCoachNoteKey}
        onOpenChange={(open) => {
          if (!open) {
            coach.setSelectedUserId(null);
            setActivityTargetJobId(null);
          }
        }}
        onExport={coach.exportUserApplications}
        onOpenApiKeys={() => void coach.openManagedUserApiKeys()}
        onOpenImport={() => coach.setImportTargetUserId(coach.selectedUser?.id ?? null)}
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
        onUpdateApplication={(userId, jobId, patch) =>
          coach.updateManagedApplication(userId, jobId, patch)
        }
        onDeleteApplication={(userId, jobId) => coach.deleteManagedApplication(userId, jobId)}
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
        coachPickerGroup={coach.coachPickerGroup}
        assignableCoaches={coach.assignableCoaches}
        onCoachPickerOpenChange={(open) => !open && coach.setCoachPickerGroupId(null)}
        onCoachSelect={(userId) => void coach.addCoach(coach.coachPickerGroup?.id ?? 0, userId)}
        removeMembership={coach.removeMembership}
        onRemoveMembershipOpenChange={(open) => !open && coach.setRemoveMembership(null)}
        onConfirmRemoveMembership={() => {
          if (!coach.removeMembership) return;
          void coach.removeMember(coach.removeMembership.groupId, coach.removeMembership.userId);
          coach.setRemoveMembership(null);
        }}
        removeCoach={coach.removeCoach}
        onRemoveCoachOpenChange={(open) => !open && coach.setRemoveCoach(null)}
        onConfirmRemoveCoach={() => {
          if (!coach.removeCoach) return;
          void coach.removeAssignedCoach(coach.removeCoach.groupId, coach.removeCoach.userId);
          coach.setRemoveCoach(null);
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

      <CoachImportApplicationsDialog
        open={Boolean(coach.importTargetUser)}
        userLabel={coach.importTargetUser ? coach.importTargetUser.email : "ce bénéficiaire"}
        isImporting={coach.isImportingApplications}
        onOpenChange={(open) => {
          if (!open) {
            coach.setImportTargetUserId(null);
          }
        }}
        onImport={(rows, dateFormat) => {
          if (!coach.importTargetUser) return Promise.resolve(null);
          return coach.importApplicationsForUser(coach.importTargetUser.id, dateFormat, rows);
        }}
      />
    </div>
  );
}

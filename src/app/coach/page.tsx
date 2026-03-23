"use client";

import { LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CoachDialogs } from "@/features/coach/components/CoachDialogs";
import { CoachImportApplicationsDialog } from "@/features/coach/components/CoachImportApplicationsDialog";
import { CoachPageContent } from "@/features/coach/components/CoachPageContent";
import { CoachPageHeader } from "@/features/coach/components/CoachPageHeader";
import { CoachSummaryCards } from "@/features/coach/components/CoachSummaryCards";
import { CoachUserSheet } from "@/features/coach/components/CoachUserSheet";
import { useCoachPageState } from "@/features/coach/useCoachPageState";
import { useToastFeedback } from "@/hooks/useToastFeedback";

export default function CoachPage() {
  const page = useCoachPageState();

  useToastFeedback(page.feedback, { title: "Espace coach" });
  useToastFeedback(page.apiKeysFeedback, { title: "Clés API coach" });

  if (page.isAuthLoading || page.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Chargement du suivi des bénéficiaires...
        </div>
      </div>
    );
  }

  if (
    !page.user ||
    (page.user.role !== "coach" && page.user.role !== "admin")
  ) {
    return (
      <Card className="mx-auto max-w-3xl gap-0 py-0">
        <CardContent className="p-8">
          <h1 className="text-2xl font-black tracking-tight">Accès réservé</h1>
          <p className="mt-2 text-muted-foreground">
            Cette page est réservée aux comptes `coach` et `admin`.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <CoachPageHeader
        role={page.user.role}
        undoLabel={page.undoAction?.label ?? null}
        onUndo={() => void page.undoLastAction()}
      />

      <CoachSummaryCards
        userCount={page.followedUserCount}
        totalApplications={page.totalApplications}
        totalInterviews={page.totalInterviews}
        totalDue={page.totalDue}
        totalAccepted={page.totalAccepted}
        totalRejected={page.totalRejected}
      />

      <CoachPageContent
        page={page}
        currentUserId={page.user.id}
        currentUserRole={page.user.role}
      />

      <CoachUserSheet
        key={`${page.selectedUser?.id ?? "none"}:${page.activityTargetJobId ?? "base"}`}
        currentUserId={page.user.id}
        isAdmin={page.user.role === "admin"}
        canEditUser={page.canEditSelectedUser}
        canManageApiKeys={Boolean(page.canManageSelectedUserApiKeys)}
        open={Boolean(page.selectedUser)}
        user={page.selectedUser}
        initialJobId={page.activityTargetJobId}
        savingCoachNoteKey={page.savingCoachNoteKey}
        onOpenChange={page.closeSelectedUserSheet}
        onExport={page.exportUserApplications}
        onOpenApiKeys={() => void page.openManagedUserApiKeys()}
        onOpenImport={() => page.setImportTargetUserId(page.selectedUser?.id ?? null)}
        onEdit={page.openSelectedUserEditor}
        onDeleteUser={page.openSelectedUserDeletion}
        onSavePrivateCoachNote={(userId, jobId, content) =>
          page.savePrivateCoachNote(userId, jobId, content)
        }
        onCreateSharedCoachNote={(userId, jobId, content) =>
          page.createSharedCoachNote(userId, jobId, content)
        }
        onUpdateSharedCoachNote={(userId, jobId, noteId, content) =>
          page.updateSharedCoachNote(userId, jobId, noteId, content)
        }
        onDeleteSharedCoachNote={(userId, jobId, noteId) =>
          page.deleteSharedCoachNote(userId, jobId, noteId)
        }
        onUpdateApplication={(userId, jobId, patch) =>
          page.updateManagedApplication(userId, jobId, patch)
        }
        onDeleteApplication={(userId, jobId) =>
          page.deleteManagedApplication(userId, jobId)
        }
      />

      <CoachDialogs page={page} />

      <CoachImportApplicationsDialog
        open={Boolean(page.importTargetUser)}
        userLabel={page.importTargetUser ? page.importTargetUser.email : "ce bénéficiaire"}
        isImporting={page.isImportingApplications}
        onOpenChange={page.closeImportDialog}
        onImport={(rows, dateFormat) => {
          if (!page.importTargetUser) return Promise.resolve(null);
          return page.importApplicationsForUser(
            page.importTargetUser.id,
            dateFormat,
            rows
          );
        }}
      />
    </div>
  );
}

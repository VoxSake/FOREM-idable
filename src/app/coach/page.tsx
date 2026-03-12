"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { format, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { FolderPlus, LoaderCircle, ShieldPlus, UserRoundPlus, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserPickerDialog } from "@/components/coach/UserPickerDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { JobApplication } from "@/types/application";
import { CoachDashboardData } from "@/types/coach";

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, withTime ? "dd MMM yyyy 'a' HH:mm" : "dd MMM yyyy", { locale: fr });
}

function statusLabel(status: JobApplication["status"]) {
  switch (status) {
    case "accepted":
      return "Acceptée";
    case "rejected":
      return "Refusée";
    case "follow_up":
      return "Relance à faire";
    case "interview":
      return "Entretien";
    case "in_progress":
    default:
      return "En cours";
  }
}

export default function CoachPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [dashboard, setDashboard] = useState<CoachDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [memberPickerGroupId, setMemberPickerGroupId] = useState<number | null>(null);
  const [coachPickerOpen, setCoachPickerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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

  const filteredUsers = useMemo(() => {
    const list = dashboard?.users ?? [];
    const normalized = deferredSearch.trim().toLowerCase();
    if (!normalized) return list;
    return list.filter((entry) => entry.email.toLowerCase().includes(normalized));
  }, [dashboard, deferredSearch]);

  const memberPickerGroup =
    dashboard?.groups.find((group) => group.id === memberPickerGroupId) ?? null;

  const assignableUsers = useMemo(() => {
    if (!dashboard || !memberPickerGroup) return [];
    const memberIds = new Set(memberPickerGroup.members.map((entry) => entry.id));
    return dashboard.users.filter((entry) => entry.role === "user" && !memberIds.has(entry.id));
  }, [dashboard, memberPickerGroup]);

  const promotableUsers = useMemo(
    () => (dashboard?.users ?? []).filter((entry) => entry.role === "user"),
    [dashboard]
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

  const addMember = async (groupId: number, userId: number) => {
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

  const promoteCoach = async (userId: number) => {
    const response = await fetch("/api/admin/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      setFeedback("Promotion coach impossible.");
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

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Chargement du suivi coach...
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "coach" && user.role !== "admin")) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight">Accès réservé</h1>
        <p className="mt-2 text-muted-foreground">
          Cette page est réservée aux comptes `coach` et `admin`.
        </p>
      </div>
    );
  }

  const totalApplications = dashboard?.users.reduce((sum, entry) => sum + entry.applicationCount, 0) ?? 0;
  const totalInterviews = dashboard?.users.reduce((sum, entry) => sum + entry.interviewCount, 0) ?? 0;
  const totalDue = dashboard?.users.reduce((sum, entry) => sum + entry.dueCount, 0) ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">Suivi coach</h1>
          <Badge variant="secondary" className="capitalize">
            {user.role}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Vue transverse sur tous les utilisateurs, leurs groupes et leurs candidatures.
        </p>
        {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Utilisateurs suivis</p>
          <p className="mt-2 text-3xl font-black">{dashboard?.users.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Candidatures visibles</p>
          <p className="mt-2 text-3xl font-black">{totalApplications}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Entretiens / relances dues</p>
          <p className="mt-2 text-3xl font-black">
            {totalInterviews} / {totalDue}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Groupes</h2>
              <p className="text-sm text-muted-foreground">
                Tous les coaches voient tous les groupes et peuvent gérer les affectations.
              </p>
            </div>
            <Button type="button" onClick={() => setIsCreateGroupOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Créer un groupe
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {dashboard?.groups.map((group) => (
              <div key={group.id} className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.members.length} membre{group.members.length > 1 ? "s" : ""} • créé par{" "}
                      {group.createdBy.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMemberPickerGroupId(group.id)}
                  >
                    <UserRoundPlus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  {group.members.length > 0 ? (
                    group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{member.email}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => void removeMember(group.id, member.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun membre pour le moment.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Utilisateurs</h2>
              <p className="text-sm text-muted-foreground">
                Recherche rapide, promotion coach et accès au suivi individuel.
              </p>
            </div>
            {user.role === "admin" && (
              <Button type="button" variant="outline" onClick={() => setCoachPickerOpen(true)}>
                <ShieldPlus className="mr-2 h-4 w-4" />
                Ajouter un coach
              </Button>
            )}
          </div>

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un email..."
          />

          <div className="space-y-2">
            {filteredUsers.map((entry) => (
              <div
                key={entry.id}
                role="button"
                tabIndex={0}
                className="flex w-full items-center justify-between gap-4 rounded-xl border px-3 py-3 text-left transition-colors hover:bg-muted/30"
                onClick={() => setSelectedUserId(entry.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedUserId(entry.id);
                  }
                }}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{entry.email}</p>
                    <Badge variant="secondary" className="capitalize">
                      {entry.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.groupNames.length > 0 ? entry.groupNames.join(" • ") : "Sans groupe"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">{entry.applicationCount} candidatures</Badge>
                  {entry.interviewCount > 0 && (
                    <Badge className="bg-sky-600 text-white hover:bg-sky-600">
                      {entry.interviewCount} entretien{entry.interviewCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {entry.dueCount > 0 && <Badge variant="destructive">{entry.dueCount} relance(s)</Badge>}
                  {user.role === "admin" && entry.role === "user" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        void promoteCoach(entry.id);
                      }}
                    >
                      Coach
                    </Button>
                  )}
                  {user.role === "admin" && entry.role === "coach" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        void demoteCoach(entry.id);
                      }}
                    >
                      Retirer coach
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Sheet open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
          {selectedUser && (
            <>
              <SheetHeader className="border-b bg-muted/30 p-5 pr-12">
                <SheetTitle>{selectedUser.email}</SheetTitle>
                <SheetDescription>
                  {selectedUser.groupNames.length > 0
                    ? selectedUser.groupNames.join(" • ")
                    : "Aucun groupe assigné"}
                </SheetDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary" className="capitalize">
                    {selectedUser.role}
                  </Badge>
                  <Badge variant="outline">{selectedUser.applicationCount} candidatures</Badge>
                  <Badge variant="outline">{selectedUser.interviewCount} entretien(s)</Badge>
                  <Badge variant="outline">{selectedUser.dueCount} relance(s) dues</Badge>
                </div>
              </SheetHeader>

              <div className="space-y-4 overflow-y-auto p-5">
                {selectedUser.applications.length > 0 ? (
                  selectedUser.applications.map((application) => {
                    const due = new Date(application.followUpDueAt);
                    const isDue =
                      (application.status === "in_progress" || application.status === "follow_up") &&
                      !Number.isNaN(due.getTime()) &&
                      !isAfter(due, new Date());

                    return (
                      <div
                        key={application.job.id}
                        className={`rounded-xl border p-4 ${
                          application.status === "interview"
                            ? "border-sky-300 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20"
                            : isDue
                              ? "border-amber-400/70 bg-amber-50/50 dark:bg-amber-950/20"
                              : "bg-card"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {application.job.company || "Entreprise non précisée"}
                            </p>
                            <p className="text-sm text-muted-foreground">{application.job.title}</p>
                            <p className="text-xs text-muted-foreground">{application.job.location}</p>
                          </div>
                          <Badge variant={isDue ? "destructive" : "secondary"}>
                            {statusLabel(application.status)}
                          </Badge>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                            <p>Envoyée: {formatDate(application.appliedAt)}</p>
                            <p>Relance: {formatDate(application.followUpDueAt)}</p>
                            {application.lastFollowUpAt && (
                              <p>Dernière relance: {formatDate(application.lastFollowUpAt)}</p>
                            )}
                          </div>
                          <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                            <p>
                              Entretien:{" "}
                              {application.interviewAt
                                ? formatDate(application.interviewAt, true)
                                : "Aucun"}
                            </p>
                            {application.interviewDetails && (
                              <p className="mt-1 line-clamp-3">{application.interviewDetails}</p>
                            )}
                          </div>
                        </div>

                        {(application.notes || application.proofs) && (
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                              <p className="mb-1 font-medium text-foreground">Notes</p>
                              <p className="whitespace-pre-wrap line-clamp-5">
                                {application.notes || "Aucune note"}
                              </p>
                            </div>
                            <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                              <p className="mb-1 font-medium text-foreground">Preuves</p>
                              <p className="whitespace-pre-wrap line-clamp-5">
                                {application.proofs || "Aucune preuve"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    Aucune candidature enregistrée pour cet utilisateur.
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un groupe</DialogTitle>
            <DialogDescription>
              Le groupe sera visible par tous les coaches et admins.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Nom du groupe"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void createGroup()} disabled={!groupName.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserPickerDialog
        open={Boolean(memberPickerGroup)}
        onOpenChange={(open) => !open && setMemberPickerGroupId(null)}
        title={memberPickerGroup ? `Ajouter un user à ${memberPickerGroup.name}` : "Ajouter un user"}
        description="Recherche dynamique parmi tous les utilisateurs."
        users={assignableUsers}
        onSelect={(entry) => {
          if (!memberPickerGroup) return;
          void addMember(memberPickerGroup.id, entry.id);
        }}
      />

      <UserPickerDialog
        open={coachPickerOpen}
        onOpenChange={setCoachPickerOpen}
        title="Ajouter un coach"
        description="Seuls les admins peuvent promouvoir un utilisateur en coach."
        users={promotableUsers}
        onSelect={(entry) => {
          void promoteCoach(entry.id);
        }}
      />
    </div>
  );
}

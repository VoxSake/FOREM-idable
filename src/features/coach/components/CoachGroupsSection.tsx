"use client";

import { Download, FolderPlus, Trash2, UserRoundPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCoachDate, getCoachUserDisplayName } from "@/features/coach/utils";
import {
  CoachGroupedUserGroup,
  CoachRemoveMembershipTarget,
  CoachUserFilter,
} from "@/features/coach/types";
import { CoachUserSummary } from "@/types/coach";

interface CoachGroupsSectionProps {
  search: string;
  onSearchChange: (value: string) => void;
  userFilter: CoachUserFilter;
  onUserFilterChange: (value: CoachUserFilter) => void;
  groupedUsers: CoachGroupedUserGroup[];
  onCreateGroup: () => void;
  onAddMember: (groupId: number) => void;
  onExportGroup: (groupName: string, members: CoachUserSummary[]) => void;
  onRemoveGroup: (groupId: number, groupName: string) => void;
  onOpenUser: (userId: number) => void;
  onRemoveMembership: (target: CoachRemoveMembershipTarget) => void;
  onDemoteCoach: (userId: number) => void;
}

export function CoachGroupsSection({
  search,
  onSearchChange,
  userFilter,
  onUserFilterChange,
  groupedUsers,
  onCreateGroup,
  onAddMember,
  onExportGroup,
  onRemoveGroup,
  onOpenUser,
  onRemoveMembership,
  onDemoteCoach,
}: CoachGroupsSectionProps) {
  const filterOptions: Array<{ value: CoachUserFilter; label: string }> = [
    { value: "all", label: "Tous" },
    { value: "due", label: "A relancer" },
    { value: "interviews", label: "Entretiens" },
    { value: "accepted", label: "Acceptées" },
    { value: "rejected", label: "Refusées" },
  ];

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Groupes</h2>
          <p className="text-sm text-muted-foreground">
            Recherche, suivi et gestion des users directement par groupe.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button type="button" className="w-full sm:w-auto" onClick={onCreateGroup}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Créer un groupe
          </Button>
        </div>
      </div>

      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Rechercher par nom, prénom ou email..."
      />

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={userFilter === option.value ? "default" : "outline"}
            onClick={() => onUserFilterChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {groupedUsers.map((group) => (
          <div key={`${group.kind}-${group.id}`} className="rounded-xl border bg-muted/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{group.name}</p>
                  <Badge variant="outline">{group.totalApplications} candidatures</Badge>
                  <Badge variant="outline">{group.totalInterviews} entretien(s)</Badge>
                  {group.totalDue > 0 && <Badge variant="destructive">{group.totalDue} relance(s)</Badge>}
                  {group.totalAccepted > 0 && <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{group.totalAccepted} acceptée(s)</Badge>}
                  {group.totalRejected > 0 && <Badge className="bg-rose-600 text-white hover:bg-rose-600">{group.totalRejected} refusée(s)</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {group.members.length} membre{group.members.length > 1 ? "s" : ""}
                  {group.createdByEmail ? ` • créé par ${group.createdByEmail}` : ""}
                </p>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                  onClick={() => onExportGroup(group.name, group.members)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                {group.canAddMembers && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => onAddMember(group.id)}
                  >
                    <UserRoundPlus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                )}
                {group.kind === "standard" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive sm:w-auto"
                    onClick={() => onRemoveGroup(group.id, group.name)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {group.members.length > 0 ? (
                group.members.map((entry) => (
                  <div
                    key={`${group.id}-${entry.id}`}
                    role="button"
                    tabIndex={0}
                    className="min-w-0 rounded-xl border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/30"
                    onClick={() => onOpenUser(entry.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenUser(entry.id);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 break-words font-medium">
                            {getCoachUserDisplayName(entry)}
                          </p>
                          <Badge variant="secondary" className="capitalize">
                            {entry.role}
                          </Badge>
                        </div>
                        <p className="break-all text-xs text-muted-foreground">{entry.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.groupNames.length > 0 ? entry.groupNames.join(" • ") : "Sans groupe"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Dernière activité: {formatCoachDate(entry.latestActivityAt)}
                        </p>
                      </div>
                      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                        {entry.applicationCount > 0 ? (
                          <Badge variant="outline">{entry.applicationCount} candidatures</Badge>
                        ) : (
                          <Badge variant="outline">Aucune candidature</Badge>
                        )}
                        {entry.interviewCount > 0 && (
                          <Badge className="bg-sky-600 text-white hover:bg-sky-600">
                            {entry.interviewCount} entretien{entry.interviewCount > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {entry.dueCount > 0 && (
                          <Badge variant="destructive">{entry.dueCount} relance(s)</Badge>
                        )}
                        {entry.acceptedCount > 0 && (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                            {entry.acceptedCount} acceptée{entry.acceptedCount > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {entry.rejectedCount > 0 && (
                          <Badge className="bg-rose-600 text-white hover:bg-rose-600">
                            {entry.rejectedCount} refusée{entry.rejectedCount > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {group.kind === "standard" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              onRemoveMembership({
                                groupId: group.id,
                                userId: entry.id,
                                userEmail: entry.email,
                                groupName: group.name,
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {group.kind === "coaches" && entry.role === "coach" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDemoteCoach(entry.id);
                            }}
                          >
                            Retirer coach
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Aucun utilisateur correspondant.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

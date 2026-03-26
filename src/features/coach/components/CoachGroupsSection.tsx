"use client";

import { useState } from "react";
import { CalendarDays, CircleHelp, Download, Filter, FolderPlus, MoreHorizontal, Trash2, UserRoundPlus, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CoachFilterToggleGroup } from "@/features/coach/components/CoachFilterToggleGroup";
import { coachUserFilterOptions } from "@/features/coach/filters";
import { CoachUserActivityMeta } from "@/features/coach/components/CoachUserActivityMeta";
import { formatCoachDate, getCoachUserDisplayName } from "@/features/coach/utils";
import {
  CoachGroupedUserGroup,
  CoachRemoveCoachTarget,
  CoachRemoveMembershipTarget,
  CoachUserFilter,
} from "@/features/coach/types";
import { runtimeConfig } from "@/config/runtime";
import { CoachUserSummary } from "@/types/coach";

interface CoachGroupsSectionProps {
  currentUserId: number;
  currentUserRole: "coach" | "admin";
  search: string;
  onSearchChange: (value: string) => void;
  userFilter: CoachUserFilter;
  onUserFilterChange: (value: CoachUserFilter) => void;
  groupedUsers: CoachGroupedUserGroup[];
  canRegenerateCalendars: boolean;
  onCreateGroup: () => void;
  onCopyAllGroupsCalendar: () => void;
  onRequestRegenerateAllGroupsCalendar: () => void;
  onAddMember: (groupId: number) => void;
  onAddCoach: (groupId: number) => void;
  onSetManager: (groupId: number) => void;
  onExportGroup: (groupName: string, members: CoachUserSummary[]) => void;
  onCopyGroupCalendar: (groupId: number, groupName: string) => void;
  onRequestRegenerateGroupCalendar: (groupId: number, groupName: string) => void;
  onRemoveGroup: (groupId: number, groupName: string) => void;
  onOpenUser: (userId: number) => void;
  onRemoveMembership: (target: CoachRemoveMembershipTarget) => void;
  onRemoveCoach: (target: CoachRemoveCoachTarget) => void;
}

export function CoachGroupsSection({
  currentUserId,
  currentUserRole,
  search,
  onSearchChange,
  userFilter,
  onUserFilterChange,
  groupedUsers,
  canRegenerateCalendars,
  onCreateGroup,
  onCopyAllGroupsCalendar,
  onRequestRegenerateAllGroupsCalendar,
  onAddMember,
  onAddCoach,
  onSetManager,
  onExportGroup,
  onCopyGroupCalendar,
  onRequestRegenerateGroupCalendar,
  onRemoveGroup,
  onOpenUser,
  onRemoveMembership,
  onRemoveCoach,
}: CoachGroupsSectionProps) {
  const [isCalendarHelpOpen, setIsCalendarHelpOpen] = useState(false);
  const canManageAssignedCoaches = (managerCoachId: number | null) =>
    currentUserRole === "admin" || managerCoachId === currentUserId;
  const canRemoveAssignedCoach = (managerCoachId: number | null, coachId: number) =>
    canManageAssignedCoaches(managerCoachId) && !(currentUserRole === "coach" && coachId === currentUserId);

  return (
    <Card className="gap-4 py-0">
      <CardHeader className="border-b px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">Groupes</CardTitle>
            <CardDescription>
              Recherche, suivi et gestion détaillée des personnes directement par groupe.
            </CardDescription>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button type="button" className="flex-1 sm:flex-none" onClick={onCreateGroup}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Créer un groupe
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="flex-1 sm:flex-none">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Calendriers
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={onCopyAllGroupsCalendar}>
                  <CalendarDays className="h-4 w-4" />
                  Copier le lien d&apos;agenda global
                </DropdownMenuItem>
                {canRegenerateCalendars ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={onRequestRegenerateAllGroupsCalendar}
                  >
                    <Trash2 className="h-4 w-4" />
                    Régénérer le lien global
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              onClick={() => setIsCalendarHelpOpen(true)}
              aria-label="Aide agenda"
              title="Aide agenda"
            >
              <CircleHelp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-5 pb-5 sm:space-y-4">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher par nom, prénom ou email..."
        />

        <CoachFilterToggleGroup
          options={coachUserFilterOptions}
          value={userFilter}
          onValueChange={onUserFilterChange}
          renderIcon={(option) =>
            option.value === "all" ? <Filter data-icon="inline-start" /> : null
          }
        />

        <div className="space-y-4">
        {groupedUsers.length > 0 ? (
          groupedUsers.map((group) => (
          <div key={`${group.kind}-${group.id}`} className="rounded-xl border border-border/60 bg-muted/20 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold">{group.name}</p>
                  <Badge variant={group.kind === "ungrouped" ? "secondary" : "outline"}>
                    {group.kind === "ungrouped" ? "Groupe système" : "Groupe actif"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:gap-2">
                  <Badge variant="outline">
                    <Users data-icon="inline-start" />
                    {group.members.length} membre{group.members.length > 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline">{group.totalApplications} candidatures</Badge>
                  <Badge variant="info" className="hidden sm:inline-flex">
                    {group.totalInterviews} entretien(s)
                  </Badge>
                  {group.totalDue > 0 && <Badge variant="warning">{group.totalDue} relance(s)</Badge>}
                  {group.totalAccepted > 0 && (
                    <Badge variant={getSummaryBadgeVariant("accepted")}>
                      {group.totalAccepted} acceptée(s)
                    </Badge>
                  )}
                  {group.totalRejected > 0 && (
                    <Badge variant={getSummaryBadgeVariant("rejected")}>
                      {group.totalRejected} refusée(s)
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {group.kind === "standard"
                    ? `${group.coaches.length} coach${group.coaches.length > 1 ? "s" : ""}`
                    : "Aucun coach attribué"}
                  {group.createdByLabel ? ` • créé par ${group.createdByLabel}` : ""}
                </p>
                {group.kind === "standard" ? (
                  <TooltipProvider>
                    <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                    {group.coaches.length > 0 ? (
                      group.coaches.map((coach) => (
                        <Tooltip key={`${group.id}-coach-${coach.id}`}>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="flex items-center gap-1.5 py-1 text-[11px] sm:gap-2 sm:text-xs">
                              <span className="max-w-52 truncate">
                                {getCoachUserDisplayName(coach)}
                              </span>
                              {group.managerCoachId === coach.id ? (
                                <Badge variant="outline" className="px-1.5 text-[10px] uppercase tracking-wide">
                                  Manager
                                </Badge>
                              ) : null}
                              {canRemoveAssignedCoach(group.managerCoachId, coach.id) ? (
                                <button
                                  type="button"
                                  className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onRemoveCoach({
                                      groupId: group.id,
                                      userId: coach.id,
                                      userEmail: coach.email,
                                      groupName: group.name,
                                    });
                                  }}
                                  aria-label={`Retirer ${coach.email} du groupe ${group.name}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              ) : null}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>
                            Dernière connexion: {formatCoachDate(coach.lastSeenAt, true)}
                          </TooltipContent>
                        </Tooltip>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Aucun coach attribué.</span>
                    )}
                    </div>
                  </TooltipProvider>
                ) : null}
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => onExportGroup(group.name, group.members)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                {(group.kind === "standard" || group.canAddMembers) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
                        <MoreHorizontal className="h-4 w-4" />
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {group.kind === "standard" && (
                        <>
                          <DropdownMenuItem onClick={() => onCopyGroupCalendar(group.id, group.name)}>
                            <CalendarDays className="h-4 w-4" />
                            Copier le lien d&apos;agenda
                          </DropdownMenuItem>
                          {canRegenerateCalendars ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onRequestRegenerateGroupCalendar(group.id, group.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Régénérer le lien
                            </DropdownMenuItem>
                          ) : null}
                        </>
                      )}
                      {group.canAddMembers && (
                        <>
                          {group.kind === "standard" ? <DropdownMenuSeparator /> : null}
                          <DropdownMenuItem onClick={() => onAddMember(group.id)}>
                            <UserRoundPlus className="h-4 w-4" />
                            Ajouter un membre
                          </DropdownMenuItem>
                        </>
                      )}
                      {group.kind === "standard" &&
                      group.canManageCoaches &&
                      canManageAssignedCoaches(group.managerCoachId) ? (
                        <>
                          <DropdownMenuItem onClick={() => onAddCoach(group.id)}>
                            <UserRoundPlus className="h-4 w-4" />
                            Attribuer un coach
                          </DropdownMenuItem>
                          {currentUserRole === "admin" ? (
                            <DropdownMenuItem onClick={() => onSetManager(group.id)}>
                              <UserRoundPlus className="h-4 w-4" />
                              Définir le manager
                            </DropdownMenuItem>
                          ) : null}
                        </>
                      ) : null}
                      {group.kind === "standard" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onRemoveGroup(group.id, group.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer le groupe
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3 lg:grid-cols-2">
              {group.members.length > 0 ? (
                group.members.map((entry) => (
                  <div
                    key={`${group.id}-${entry.id}`}
                    role="button"
                    tabIndex={0}
                    className="min-w-0 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/30 sm:px-4"
                    onClick={() => onOpenUser(entry.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenUser(entry.id);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="min-w-0 break-words font-medium">
                                {getCoachUserDisplayName(entry)}
                              </p>
                              <Badge variant="secondary" className="capitalize">
                                {entry.role}
                              </Badge>
                            </div>
                          </div>
                          {group.kind === "standard" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="mt-[-2px] shrink-0"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <DropdownMenuItem
                                  variant="destructive"
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
                                  <Trash2 className="h-4 w-4" />
                                  Retirer du groupe
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>
                        <p className="break-all text-xs text-muted-foreground">{entry.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.groupNames.length > 0 ? entry.groupNames.join(" • ") : "Sans groupe"}
                        </p>
                        <CoachUserActivityMeta
                          user={entry}
                          className="text-xs text-muted-foreground"
                          firstItemClassName="mt-1 text-xs text-muted-foreground"
                        />
                      </div>
                      <div className="grid min-w-0 gap-2 sm:min-w-[250px]">
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          <div className="rounded-lg border border-border/60 bg-muted/10 px-2.5 py-2 text-center sm:px-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Candidatures
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {entry.applicationCount}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-[#EEF6FC] px-2.5 py-2 text-center dark:border-[#2A5573] dark:bg-[#10202B] sm:px-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Entretiens
                            </p>
                            <p className="text-sm font-semibold text-[#2E6E99] dark:text-sky-300">
                              {entry.interviewCount}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-[#FFF5E8] px-2.5 py-2 text-center dark:border-[#6D4B1E] dark:bg-[#2A1D0F] sm:px-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Relances
                            </p>
                            <p className="text-sm font-semibold text-[#A46110] dark:text-amber-300">
                              {entry.dueCount}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-background px-2.5 py-2 text-center sm:px-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Résultats
                            </p>
                            <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                              <span className="text-[#2F7A3E] dark:text-emerald-300">
                                {entry.acceptedCount}
                              </span>
                              <span className="text-muted-foreground">/</span>
                              <span className="text-[#C85A50] dark:text-rose-300">
                                {entry.rejectedCount}
                              </span>
                            </div>
                          </div>
                        </div>
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
          ))
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/10 p-6">
            <p className="font-medium">Aucun résultat dans cette vue</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {search.trim()
                ? "Essayez un autre nom, prénom ou email, ou retirez un filtre rapide."
                : userFilter === "all"
                  ? "Ajoutez un groupe ou un bénéficiaire pour commencer le suivi coach."
                  : "Aucun bénéficiaire ne correspond à ce filtre pour l'instant."}
            </p>
          </div>
        )}
        </div>
      </CardContent>

      <Dialog open={isCalendarHelpOpen} onOpenChange={setIsCalendarHelpOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Synchronisation calendrier</DialogTitle>
            <DialogDescription>
              Les liens calendrier permettent d&apos;abonner Google Calendar, Outlook ou Apple Calendar
              a un flux d&apos;entretiens mis a jour automatiquement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              `Copier le lien d&apos;agenda` copie une URL a coller dans Google Calendar via
              `Ajouter un agenda` puis `A partir de l&apos;URL`.
            </p>
            <p>
              Le calendrier se met ensuite a jour quand un entretien est ajoute, modifie ou
              supprime dans {runtimeConfig.privacy.projectLabel}.
            </p>
            <p>
              La synchronisation n&apos;est pas immediate: Google choisit lui-meme la frequence de
              rafraichissement.
            </p>
            <p>
              Si vous remplacez le lien utilise dans votre agenda, il faut re-ajouter la nouvelle
              URL dans Google Calendar.
            </p>
            <p>
              Le lien global rassemble tous les groupes beneficiaires visibles par votre compte.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsCalendarHelpOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function getSummaryBadgeVariant(tone: "accepted" | "rejected" | "interview") {
  if (tone === "rejected") {
    return "error";
  }

  if (tone === "accepted") {
    return "success";
  }

  return "info";
}

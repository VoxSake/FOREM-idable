"use client";

import { AlertTriangle, CalendarDays, Inbox, TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCoachUserDisplayName } from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

interface CoachWatchlistProps {
  noApplicationsUsers: CoachUserSummary[];
  dueUsers: CoachUserSummary[];
  noInterviewUsers: CoachUserSummary[];
  inactiveUsers: CoachUserSummary[];
  onOpenUser: (userId: number) => void;
}

function WatchlistBlock({
  title,
  icon,
  users,
  emptyLabel,
  accentClass,
  onOpenUser,
}: {
  title: string;
  icon: React.ReactNode;
  users: CoachUserSummary[];
  emptyLabel: string;
  accentClass: string;
  onOpenUser: (userId: number) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={accentClass}>{icon}</span>
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="outline">{users.length}</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {users.length > 0 ? (
          users.slice(0, 5).map((user) => (
            <Button
              key={user.id}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-between rounded-lg border px-3 py-2 text-left"
              onClick={() => onOpenUser(user.id)}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{getCoachUserDisplayName(user)}</span>
                <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {user.applicationCount} cand.
              </span>
            </Button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

export function CoachWatchlist(props: CoachWatchlistProps) {
  const { noApplicationsUsers, dueUsers, noInterviewUsers, inactiveUsers, onOpenUser } = props;

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <WatchlistBlock
        title="Sans candidature"
        icon={<Inbox className="h-4 w-4" />}
        users={noApplicationsUsers}
        emptyLabel="Tout le monde a au moins une candidature."
        accentClass="text-slate-600 dark:text-slate-300"
        onOpenUser={onOpenUser}
      />
      <WatchlistBlock
        title="Relances dues"
        icon={<TimerReset className="h-4 w-4" />}
        users={dueUsers}
        emptyLabel="Aucune relance urgente."
        accentClass="text-amber-600 dark:text-amber-300"
        onOpenUser={onOpenUser}
      />
      <WatchlistBlock
        title="Aucun entretien"
        icon={<CalendarDays className="h-4 w-4" />}
        users={noInterviewUsers}
        emptyLabel="Tout le monde a déjà au moins un entretien."
        accentClass="text-sky-600 dark:text-sky-300"
        onOpenUser={onOpenUser}
      />
      <WatchlistBlock
        title="Inactifs récemment"
        icon={<AlertTriangle className="h-4 w-4" />}
        users={inactiveUsers}
        emptyLabel="Aucun profil inactif détecté."
        accentClass="text-rose-600 dark:text-rose-300"
        onOpenUser={onOpenUser}
      />
    </section>
  );
}

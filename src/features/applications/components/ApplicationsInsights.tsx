"use client";

import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApplicationStatus } from "@/types/application";
import { ApplicationModeFilter } from "@/features/applications/utils";

interface ApplicationsInsightsProps {
  totalCount: number;
  dueCount: number;
  upcomingInterviewCount: number;
  closedCount: number;
  coachUpdateCount: number;
  search: string;
  statusFilter: "all" | ApplicationStatus;
  modeFilter: ApplicationModeFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | ApplicationStatus) => void;
  onModeFilterChange: (value: ApplicationModeFilter) => void;
}

const QUICK_FILTERS: Array<{ value: ApplicationModeFilter; label: string }> = [
  { value: "all", label: "Tout" },
  { value: "due", label: "Relances" },
  { value: "interviews", label: "Entretiens" },
  { value: "coach_updates", label: "Nouveaux retours" },
  { value: "manual", label: "Manuel" },
];

export function ApplicationsInsights({
  totalCount,
  dueCount,
  upcomingInterviewCount,
  closedCount,
  coachUpdateCount,
  search,
  statusFilter,
  modeFilter,
  onSearchChange,
  onStatusFilterChange,
  onModeFilterChange,
}: ApplicationsInsightsProps) {
  const stats = [
    {
      label: "En suivi",
      value: totalCount,
      valueClassName: "",
      fullWidth: false,
    },
    {
      label: "Relances dues",
      value: dueCount,
      valueClassName: "text-amber-700 dark:text-amber-300",
      fullWidth: false,
    },
    {
      label: "Entretiens à venir",
      value: upcomingInterviewCount,
      valueClassName: "text-sky-700 dark:text-sky-300",
      fullWidth: false,
    },
    {
      label: "Clôturées",
      value: closedCount,
      valueClassName: "text-emerald-700 dark:text-emerald-300",
      fullWidth: false,
    },
    {
      label: "Retours coach",
      value: coachUpdateCount,
      valueClassName: "text-sky-700 dark:text-sky-300",
      fullWidth: coachUpdateCount > 0,
      hint:
        coachUpdateCount > 0
          ? `${coachUpdateCount} candidature${coachUpdateCount > 1 ? "s" : ""} avec un nouveau retour coach.`
          : null,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border bg-card p-3 shadow-sm sm:p-4 ${
              stat.fullWidth ? "col-span-2 lg:col-span-5" : ""
            }`}
          >
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {stat.label}
            </p>
            <p className={`mt-1 text-2xl font-black sm:mt-2 ${stat.valueClassName}`}>
              {stat.value}
            </p>
            {stat.hint ? (
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Rechercher une entreprise, un poste, une note..."
              className="pl-9"
            />
          </div>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as "all" | ApplicationStatus)}
          >
            <option value="all">Tous les statuts</option>
            <option value="in_progress">En cours</option>
            <option value="follow_up">Relance à faire</option>
            <option value="interview">Entretien</option>
            <option value="accepted">Acceptée</option>
            <option value="rejected">Refusée</option>
          </select>
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                variant={modeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => onModeFilterChange(filter.value)}
              >
                {filter.value === "all" ? <Filter className="mr-2 h-4 w-4" /> : null}
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

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
  { value: "manual", label: "Manuel" },
];

export function ApplicationsInsights({
  totalCount,
  dueCount,
  upcomingInterviewCount,
  closedCount,
  search,
  statusFilter,
  modeFilter,
  onSearchChange,
  onStatusFilterChange,
  onModeFilterChange,
}: ApplicationsInsightsProps) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">En suivi</p>
          <p className="mt-2 text-2xl font-black">{totalCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Relances dues</p>
          <p className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">{dueCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Entretiens à venir</p>
          <p className="mt-2 text-2xl font-black text-sky-700 dark:text-sky-300">{upcomingInterviewCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Clôturées</p>
          <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">{closedCount}</p>
        </div>
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

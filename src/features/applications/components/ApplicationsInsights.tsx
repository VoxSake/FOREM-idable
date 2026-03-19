"use client";

import { Filter, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
      valueClassName: "text-foreground",
      fullWidth: false,
    },
    {
      label: "Relances dues",
      value: dueCount,
      valueClassName: "text-foreground",
      fullWidth: false,
    },
    {
      label: "Entretiens à venir",
      value: upcomingInterviewCount,
      valueClassName: "text-foreground",
      fullWidth: false,
    },
    {
      label: "Clôturées",
      value: closedCount,
      valueClassName: "text-foreground",
      fullWidth: false,
    },
    {
      label: "Retours coach",
      value: coachUpdateCount,
      valueClassName: "text-foreground",
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
          <Card
            key={stat.label}
            className={`gap-0 py-0 ${
              stat.fullWidth ? "col-span-2 lg:col-span-5" : ""
            }`}
          >
            <CardHeader className="gap-1 p-3 sm:p-4">
              <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
              <p className={`text-2xl font-black ${stat.valueClassName}`}>{stat.value}</p>
              {stat.hint ? (
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.hint}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="p-4">
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
            <Select
              value={statusFilter}
              onValueChange={(value) => onStatusFilterChange(value as "all" | ApplicationStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="follow_up">Relance à faire</SelectItem>
                  <SelectItem value="interview">Entretien</SelectItem>
                  <SelectItem value="accepted">Acceptée</SelectItem>
                  <SelectItem value="rejected">Refusée</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <ToggleGroup
              type="single"
              variant="outline"
              value={modeFilter}
              onValueChange={(value) => {
                if (value) {
                  onModeFilterChange(value as ApplicationModeFilter);
                }
              }}
              className="flex w-full flex-wrap"
            >
              {QUICK_FILTERS.map((filter) => (
                <ToggleGroupItem
                  key={filter.value}
                  value={filter.value}
                  size="sm"
                  aria-label={`Filtrer: ${filter.label}`}
                >
                  {filter.value === "all" ? <Filter data-icon="inline-start" /> : null}
                  {filter.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

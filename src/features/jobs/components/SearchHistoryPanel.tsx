"use client";

import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchQuery } from "@/types/search";
import { SearchHistoryEntry } from "@/features/jobs/types/searchHistory";

interface SearchHistoryPanelProps {
  history: SearchHistoryEntry[];
  onReplay: (query: SearchQuery) => void;
  onClear: () => void;
}

export function SearchHistoryPanel({
  history,
  onReplay,
  onClear,
}: SearchHistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <History data-icon="inline-start" />
            Historique des recherches
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Rejouez rapidement les combinaisons qui ont deja donne de bons resultats.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Vider
        </Button>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {history.map((entry) => (
          <Button
            key={entry.id}
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onReplay(entry.state)}
            title={new Date(entry.createdAt).toLocaleString("fr-BE")}
          >
            <span className="truncate max-w-[320px]">
              {entry.state.keywords.slice(0, 3).join(
                ` ${entry.state.booleanMode === "AND" ? "ET" : "OU"} `
              ) || "Sans mot-clé"}
              {entry.state.locations.length > 0
                ? ` • ${entry.state.locations.length} lieu(x)`
                : ""}
              {" • "}
              {new Date(entry.createdAt).toLocaleDateString("fr-BE")}{" "}
              {new Date(entry.createdAt).toLocaleTimeString("fr-BE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

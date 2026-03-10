"use client";

import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/8 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Historique des recherches
        </h2>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Vider
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((entry) => (
          <Button
            key={entry.id}
            variant="outline"
            size="sm"
            className="rounded-full border-orange-200/80 bg-background/80 hover:bg-orange-50 hover:text-orange-900 dark:border-orange-800/60 dark:hover:bg-orange-950/30 dark:hover:text-orange-200"
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
      </div>
    </div>
  );
}

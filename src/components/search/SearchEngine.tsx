"use client";

import * as React from "react";
import { SearchButton } from "./SearchButton";

export type SearchState = {
  q: string;
  locations: string[];
};

type SearchEngineProps = {
  onSearch?: (state: SearchState) => void;
  initialState?: Partial<SearchState>;
};

export function SearchEngine({ onSearch, initialState }: SearchEngineProps) {
  const [q, setQ] = React.useState(initialState?.q ?? "");
  const [locations, setLocations] = React.useState<string[]>(
    initialState?.locations ?? []
  );

  const triggerSearch = React.useCallback(() => {
    onSearch?.({ q, locations });
  }, [onSearch, q, locations]);

  return (
    <div className="w-full rounded-2xl border bg-card p-4 space-y-3">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ex: Développeur, Comptable..."
        className="w-full h-12 rounded-full border px-4"
      />

      <input
        type="text"
        value={locations.join(", ")}
        onChange={(e) =>
          setLocations(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        }
        placeholder="Ajouter un lieu de travail"
        className="w-full h-12 rounded-full border px-4"
      />

      <SearchButton onClick={triggerSearch} />
    </div>
  );
}
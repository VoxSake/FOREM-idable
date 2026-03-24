"use client";

import { useState, useRef, KeyboardEvent, RefObject } from "react";
import { ArrowRight, History, Search, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { LocationEntry } from "@/services/location/locationCache";
import { cn } from "@/lib/utils";
import { BooleanMode, SearchQuery } from "@/types/search";
import { FeaturedSearch } from "@/types/featuredSearch";

export type SearchState = SearchQuery;

interface SearchEngineProps {
  onSearch: (state: SearchState) => void;
  initialState?: Partial<SearchState>;
  featuredSearches?: FeaturedSearch[];
  onRunFeaturedSearch?: (item: FeaturedSearch) => void;
  historyCount?: number;
  onOpenHistory?: () => void;
}

export function SearchEngine({
  onSearch,
  initialState,
  featuredSearches = [],
  onRunFeaturedSearch,
  historyCount = 0,
  onOpenHistory,
}: SearchEngineProps) {
    const [keywords, setKeywords] = useState<string[]>(initialState?.keywords || []);
    const [inputValue, setInputValue] = useState("");
    const [selectedLocations, setSelectedLocations] = useState<LocationEntry[]>(initialState?.locations || []);
    const [booleanMode, setBooleanMode] = useState<BooleanMode>(initialState?.booleanMode || "OR");
    const inputRef = useRef<HTMLInputElement>(null);

    const splitKeywords = (value: string) => value
        .split(/[,\s]+/)
        .map((part) => part.trim())
        .filter(Boolean);

    const appendKeywords = (currentKeywords: string[], rawValue: string) => {
        const nextKeywords = splitKeywords(rawValue)
            .filter((item) => !currentKeywords.includes(item));

        if (nextKeywords.length === 0) {
            return currentKeywords;
        }

        return [...currentKeywords, ...nextKeywords];
    };

    const extractCommittedKeywords = (value: string) => {
        if (!/[,\s]/.test(value)) {
            return { committed: [], remainder: value };
        }

        const hasTrailingSeparator = /[,\s]+$/.test(value);
        const parts = value
            .split(/[,\s]+/)
            .map((part) => part.trim())
            .filter(Boolean);

        if (parts.length === 0) {
            return { committed: [], remainder: "" };
        }

        if (hasTrailingSeparator) {
            return { committed: parts, remainder: "" };
        }

        return {
            committed: parts.slice(0, -1),
            remainder: parts[parts.length - 1] ?? "",
        };
    };

    const handleInputValueChange = (value: string) => {
        const { committed, remainder } = extractCommittedKeywords(value);

        if (committed.length === 0) {
            setInputValue(value);
            return;
        }

        setKeywords((currentKeywords) => appendKeywords(currentKeywords, committed.join(",")));
        setInputValue(remainder);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === " " || e.key === ",") && inputValue.trim()) {
            e.preventDefault();
            addKeyword(inputValue);
        } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
            removeKeyword(keywords.length - 1);
        }
    };

    const addKeyword = (kw: string) => {
        setKeywords((currentKeywords) => appendKeywords(currentKeywords, kw));

        setInputValue("");
    };

    const removeKeyword = (index: number) => {
        setKeywords(keywords.filter((_, i) => i !== index));
    };

    const toggleBooleanMode = () => {
        setBooleanMode((prev) => (prev === "OR" ? "AND" : "OR"));
    };

    const selectedLocationsLabel = selectedLocations.length > 0 ? `${selectedLocations.length} lieu${selectedLocations.length > 1 ? "x" : ""}` : null;

    const triggerSearch = () => {
        const pendingText = inputValue.trim();
        const pendingKeywords = splitKeywords(pendingText)
            .filter((item) => !keywords.includes(item));
        const finalKeywords = pendingKeywords.length > 0
            ? [...keywords, ...pendingKeywords]
            : [...keywords];

        if (pendingText) {
            setInputValue("");
            if (pendingKeywords.length > 0) {
                setKeywords(finalKeywords);
            }
        }

        onSearch({ keywords: finalKeywords, locations: selectedLocations, booleanMode });
    };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md lg:p-6">
      <div className="flex w-full flex-col items-center gap-3 lg:flex-row">
        <KeywordComposer
          keywords={keywords}
          inputValue={inputValue}
          booleanMode={booleanMode}
          inputRef={inputRef}
          onInputValueChange={handleInputValueChange}
          onInputKeyDown={handleKeyDown}
          onInputBlur={() => {
            if (inputValue.trim()) {
              addKeyword(inputValue);
            }
          }}
          onRemoveKeyword={removeKeyword}
          onToggleBooleanMode={toggleBooleanMode}
        />

        <div className="w-full shrink-0 lg:w-72">
          <LocationAutocomplete values={selectedLocations} onChange={setSelectedLocations} />
        </div>

        <Button
          onClick={triggerSearch}
          className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 lg:w-14"
        >
          <Search className="h-5 w-5 shrink-0" />
          <span className="lg:hidden">Rechercher</span>
        </Button>
      </div>

      <SearchHints
        selectedLocationsLabel={selectedLocationsLabel}
        featuredSearches={featuredSearches}
        onRunFeaturedSearch={onRunFeaturedSearch}
        historyCount={historyCount}
        onOpenHistory={onOpenHistory}
      />
    </div>
  );
}

function KeywordComposer({
    keywords,
    inputValue,
    booleanMode,
    inputRef,
    onInputValueChange,
    onInputKeyDown,
    onInputBlur,
    onRemoveKeyword,
    onToggleBooleanMode,
}: {
    keywords: string[];
    inputValue: string;
    booleanMode: BooleanMode;
    inputRef: RefObject<HTMLInputElement | null>;
    onInputValueChange: (value: string) => void;
    onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onInputBlur: () => void;
    onRemoveKeyword: (index: number) => void;
    onToggleBooleanMode: () => void;
}) {
    return (
        <div
            className={cn(
                "flex min-h-12 w-full flex-1 cursor-text flex-wrap items-center gap-2 border border-border bg-muted/20 p-2 px-4 transition-all focus-within:ring-2 focus-within:ring-primary/20",
                keywords.length > 0 ? "rounded-2xl" : "rounded-full"
            )}
            onClick={() => inputRef.current?.focus()}
        >
            <Search className="mr-1 h-5 w-5 shrink-0 text-muted-foreground" />

            {keywords.map((keyword, index) => (
                <div key={`${keyword}-${index}`} className="flex items-center gap-2">
                    <KeywordBadge
                        keyword={keyword}
                        onRemove={() => onRemoveKeyword(index)}
                    />
                    {index < keywords.length - 1 ? (
                        <BooleanModePill
                            booleanMode={booleanMode}
                            onToggle={onToggleBooleanMode}
                        />
                    ) : null}
                </div>
            ))}

            {keywords.length > 0 ? (
                <span className="mx-1 shrink-0 text-muted-foreground/30">|</span>
            ) : null}

            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(event) => onInputValueChange(event.target.value)}
                onKeyDown={onInputKeyDown}
                onBlur={onInputBlur}
                className="min-w-[80px] flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/70"
                placeholder={
                    keywords.length === 0
                        ? "Ex: Développeur, Comptable..."
                        : "Ajouter un mot-clé..."
                }
            />
        </div>
    );
}

function KeywordBadge({
    keyword,
    onRemove,
}: {
    keyword: string;
    onRemove: () => void;
}) {
    return (
        <Badge
            variant="secondary"
            className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1 text-sm shadow-sm"
        >
            {keyword}
            <Button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onRemove();
                }}
                variant="ghost"
                size="icon-xs"
                className="rounded-full"
            >
                <X className="h-3 w-3" />
            </Button>
        </Badge>
    );
}

function BooleanModePill({
    booleanMode,
    onToggle,
}: {
    booleanMode: BooleanMode;
    onToggle: () => void;
}) {
    const label = booleanMode === "OR" ? "OU" : "ET";

    return (
        <Button
            type="button"
            onClick={(event) => {
                event.stopPropagation();
                onToggle();
            }}
            variant={booleanMode === "OR" ? "outline" : "default"}
            size="xs"
            className={cn(
                "shrink-0 rounded-full text-[10px] font-bold transition-colors",
                booleanMode === "OR"
                    ? "border-border/70 bg-background/80 text-muted-foreground hover:bg-muted/70"
                    : ""
            )}
            title="Basculer OU/ET"
        >
            {label}
        </Button>
    );
}

function SearchHints({
  selectedLocationsLabel,
  featuredSearches,
  onRunFeaturedSearch,
  historyCount,
  onOpenHistory,
}: {
  selectedLocationsLabel: string | null;
  featuredSearches: FeaturedSearch[];
  onRunFeaturedSearch?: (item: FeaturedSearch) => void;
  historyCount: number;
  onOpenHistory?: () => void;
}) {
  const visibleFeaturedSearches = featuredSearches.slice(0, 3);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-muted/15 px-4 py-3 text-xs text-muted-foreground">
      <div className="grid gap-2 sm:grid-cols-2">
        <p className="leading-5">
          Astuce : cliquez sur <strong className="font-semibold text-foreground">OU / ET</strong>{" "}
          entre les mots-clés pour ajuster la recherche.
        </p>
        <p className="leading-5">
          <strong className="font-semibold text-foreground">OU</strong> = plus large{" "}
          (ex: <span className="font-mono">comptable OU aide-comptable</span>).
        </p>
        <p className="leading-5 sm:col-span-2">
          <strong className="font-semibold text-foreground">ET</strong> = plus précis{" "}
          (ex: <span className="font-mono">comptable ET Bruxelles</span>).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selectedLocationsLabel ? (
          <Badge variant="outline" className="rounded-full border-border/70">
            Filtre lieu: {selectedLocationsLabel}
          </Badge>
        ) : null}
        {historyCount > 0 && onOpenHistory ? (
          <Button type="button" variant="outline" size="sm" onClick={onOpenHistory}>
            <History data-icon="inline-start" />
            Historique ({historyCount})
          </Button>
        ) : null}
      </div>

      {visibleFeaturedSearches.length > 0 && onRunFeaturedSearch ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-background/70 p-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Suggestions rapides</p>
              <p className="text-xs text-muted-foreground">
                Recherches mises en avant depuis l’administration.
              </p>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {visibleFeaturedSearches.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onRunFeaturedSearch(item)}
                className="flex min-h-24 flex-col items-start justify-between rounded-2xl border border-border/60 bg-card px-3 py-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/20"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold leading-5 text-foreground">{item.title}</p>
                  {item.message ? (
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {item.message}
                    </p>
                  ) : null}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  {item.ctaLabel}
                  <ArrowRight className="size-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { cn } from "@/lib/utils";

export interface SearchState {
    keywords: string[];
    location: string;
    booleanMode: "AND" | "OR";
}

interface SearchEngineProps {
    onSearch: (state: SearchState) => void;
    initialState?: Partial<SearchState>;
}

export function SearchEngine({ onSearch, initialState }: SearchEngineProps) {
    const [keywords, setKeywords] = useState<string[]>(initialState?.keywords || []);
    const [inputValue, setInputValue] = useState("");
    const [location, setLocation] = useState(initialState?.location || "");
    const [booleanMode, setBooleanMode] = useState<"AND" | "OR">(initialState?.booleanMode || "OR");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === " ") && inputValue.trim()) {
            e.preventDefault();
            addKeyword(inputValue);
        } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
            removeKeyword(keywords.length - 1);
        }
    };

    const addKeyword = (kw: string) => {
        const trimmed = kw.trim();
        if (trimmed && !keywords.includes(trimmed)) {
            setKeywords([...keywords, trimmed]);
        }
        setInputValue("");
    };

    const removeKeyword = (index: number) => {
        setKeywords(keywords.filter((_, i) => i !== index));
    };

    const toggleBooleanMode = () => {
        setBooleanMode((prev) => (prev === "OR" ? "AND" : "OR"));
    };

    const triggerSearch = () => {
        // If there's pending text, add it to keywords first
        let finalKeywords = [...keywords];
        const pendingText = inputValue.trim();
        if (pendingText) {
            if (!finalKeywords.includes(pendingText)) {
                finalKeywords.push(pendingText);
            }
            setInputValue("");
            setKeywords(finalKeywords);
        }
        onSearch({ keywords: finalKeywords, location, booleanMode });
    };

    return (
        <div className="flex flex-col gap-4 p-4 lg:p-6 bg-card rounded-3xl shadow-sm border border-border/50 transition-all hover:shadow-md">
            <div className="flex flex-col lg:flex-row gap-3 items-center w-full">
                {/* Keywords Input Wrapper */}
                <div className="flex-1 flex items-center flex-wrap gap-2 min-h-12 w-full p-2 px-4 rounded-full border border-border bg-muted/20 focus-within:ring-2 focus-within:ring-primary/20 transition-all cursor-text"
                    onClick={() => inputRef.current?.focus()}>

                    <Search className="w-5 h-5 text-muted-foreground shrink-0 mr-1" />

                    {keywords.map((kw, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Badge variant="secondary" className="px-3 py-1 flex items-center gap-1 rounded-full text-sm shrink-0 shadow-sm border border-border">
                                {kw}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeKeyword(i); }}
                                    className="rounded-full hover:bg-muted p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                            {i < keywords.length - 1 && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleBooleanMode(); }}
                                    className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors shrink-0 border",
                                        booleanMode === "OR"
                                            ? "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                            : "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                                    )}
                                    title="Basculer OU/ET"
                                >
                                    {booleanMode}
                                </button>
                            )}
                        </div>
                    ))}

                    {keywords.length > 0 && <span className="text-muted-foreground/30 mx-1 shrink-0">|</span>}

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 min-w-[120px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70"
                        placeholder={keywords.length === 0 ? "Ex: Développeur, Comptable..." : "Ajouter un mot-clé..."}
                    />
                </div>

                {/* Location Dropdown */}
                <div className="w-full lg:w-72 shrink-0">
                    <LocationAutocomplete value={location} onChange={setLocation} />
                </div>

                {/* Search Action */}
                <Button
                    onClick={triggerSearch}
                    className="w-full lg:w-14 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white shrink-0 shadow-sm"
                >
                    <Search className="w-5 h-5 mx-auto" />
                    <span className="lg:hidden ml-2">Rechercher</span>
                </Button>
            </div>

            {/* Boolean hint below the bar */}
            <div className="flex justify-between items-center text-xs text-muted-foreground px-4">
                <p>Astuce : Cliquez sur les <strong className="font-semibold text-foreground">OU / ET</strong> entre les mots-clés pour affiner la recherche.</p>
                <p className="italic font-medium">Le FOREM-fouille cherche pour vous...</p>
            </div>
        </div>
    );
}

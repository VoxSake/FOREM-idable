"use client";

import * as React from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CATEGORIES_ORDER, locationCache, LocationEntry, LocationCategory } from "@/services/location/locationCache";

export function LocationAutocomplete({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const locations = locationCache.getHierarchy();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-12 px-4 rounded-full bg-transparent border border-border focus:ring-2 focus:ring-primary/20 hover:bg-muted/20 text-left font-normal"
                >
                    <div className="flex items-center gap-2 overflow-hidden text-muted-foreground w-full">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate flex-1">
                            {value
                                ? locations.find((l) => l.name === value)?.name || value
                                : "Ajouter un lieu de travail"}
                        </span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] lg:w-[350px] p-0 rounded-xl" align="start">
                {/* We disable cmDK internal filtering so we can handle display ourselves, but keep keyboard nav */}
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Filtrer un lieu (ex: Verviers, Liège...)"
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {CATEGORIES_ORDER.map((category) => (
                            <LocationCategoryGroup
                                key={category}
                                category={category}
                                items={locations.filter((l) => l.type === category)}
                                selectedValue={value}
                                searchQuery={searchQuery}
                                onSelect={(currentValue) => {
                                    onChange(currentValue === value ? "" : currentValue);
                                    setOpen(false);
                                    setSearchQuery("");
                                }}
                            />
                        ))}
                        {searchQuery && locations.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                            <CommandEmpty>Aucun lieu trouvé.</CommandEmpty>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function LocationCategoryGroup({
    category,
    items,
    selectedValue,
    searchQuery,
    onSelect,
}: {
    category: LocationCategory;
    items: LocationEntry[];
    selectedValue: string;
    searchQuery: string;
    onSelect: (value: string) => void;
}) {
    const isSearching = searchQuery.trim().length > 0;
    // If searching, show only matching items
    const filteredItems = isSearching
        ? items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : items;

    // We keep the collapsible open automatically if there's a search, or if the category is "Localités" (by default open)
    const isDefaultOpen = category === "Localités";
    const [isOpen, setIsOpen] = React.useState(isDefaultOpen);

    React.useEffect(() => {
        if (isSearching) {
            setIsOpen(true);
        } else {
            setIsOpen(isDefaultOpen);
        }
    }, [isSearching, isDefaultOpen]);

    if (filteredItems.length === 0) return null;

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="border-b last:border-b-0"
        >
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium hover:bg-muted text-foreground transition-colors group">
                {category}
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-1 pb-1">
                {filteredItems.map((loc) => (
                    <CommandItem
                        key={loc.id}
                        value={loc.name}
                        onSelect={onSelect}
                        className="rounded-md pl-6 cursor-pointer"
                    >
                        <Check
                            className={cn(
                                "mr-2 h-4 w-4 text-primary",
                                selectedValue === loc.name ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {loc.name}
                    </CommandItem>
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
}

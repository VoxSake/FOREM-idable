"use client";

import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Checkbox } from "@/components/ui/checkbox";
import { SCOUT_CATEGORIES } from "@/lib/server/scoutOverpass";
import { ScoutJobCreateInput } from "../scoutSchemas";

const ALL_CATEGORIES = Object.entries(SCOUT_CATEGORIES).map(([key, label]) => ({ key, label }));

interface ScoutFormProps {
  onSubmit: (input: ScoutJobCreateInput) => void;
  isLoading: boolean;
}

export function ScoutForm({ onSubmit, isLoading }: ScoutFormProps) {
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState([5000]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [scrapeEmails, setScrapeEmails] = useState(false);
  const [selectAll, setSelectAll] = useState(true);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedCategories(new Set(ALL_CATEGORIES.map((c) => c.key)));
    } else {
      setSelectedCategories(new Set());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categories = selectAll ? undefined : Array.from(selectedCategories);
    onSubmit({ query, radius: radius[0], categories, scrapeEmails });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="text-primary" />
          Nouvelle recherche
        </CardTitle>
        <CardDescription>
          Découvrez des entreprises autour d&apos;une ville via OpenStreetMap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="scout-query">Ville</Label>
              <Input
                id="scout-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Liège, Bruxelles, Namur..."
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Rayon : {radius[0] >= 1000 ? `${(radius[0] / 1000).toFixed(1)} km` : `${radius[0]} m`}</Label>
              <input
                type="range"
                min={500}
                max={20000}
                step={500}
                value={radius[0]}
                onChange={(e) => setRadius([Number(e.target.value)])}
                className="w-full accent-primary"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
              <Checkbox
                id="scout-scrape"
                checked={scrapeEmails}
                onCheckedChange={(checked) => setScrapeEmails(checked === true)}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5 leading-snug">
                <span className="text-sm font-medium">Scraper les emails</span>
                <span className="text-xs text-muted-foreground">
                  Visite chaque site web pour trouver des emails (plus lent, respecte le rate limiting).
                </span>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
              <Checkbox
                id="scout-all-cats"
                checked={selectAll}
                onCheckedChange={(checked) => handleSelectAll(checked === true)}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5 leading-snug">
                <span className="text-sm font-medium">Tous les secteurs</span>
                <span className="text-xs text-muted-foreground">
                  Sinon, sélectionnez les catégories ci-dessous.
                </span>
              </div>
            </label>
          </div>

          {!selectAll && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALL_CATEGORIES.map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedCategories.has(key)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedCategories.has(key)}
                    onCheckedChange={() => toggleCategory(key)}
                  />
                  <span className="truncate">{label}</span>
                </label>
              ))}
            </div>
          )}

          <Button type="submit" disabled={isLoading || !query.trim()} className="w-full sm:w-auto self-start">
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? "Lancement..." : "Lancer la recherche"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

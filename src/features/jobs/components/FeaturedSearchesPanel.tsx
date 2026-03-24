"use client";

import { Sparkles, ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeaturedSearch } from "@/types/featuredSearch";

interface FeaturedSearchesPanelProps {
  items: FeaturedSearch[];
  onRunSearch: (item: FeaturedSearch) => void;
}

function formatQueryPreview(item: FeaturedSearch) {
  const keywords =
    item.query.keywords.length > 0
      ? item.query.keywords.join(` ${item.query.booleanMode === "AND" ? "ET" : "OU"} `)
      : "Recherche";
  const locations =
    item.query.locations.length > 0
      ? ` • ${item.query.locations.map((location) => location.name).join(" • ")}`
      : "";

  return `${keywords}${locations}`;
}

export function FeaturedSearchesPanel({
  items,
  onRunSearch,
}: FeaturedSearchesPanelProps) {
  if (items.length === 0) return null;

  return (
    <Card className="overflow-hidden border-border/60 bg-linear-to-br from-card via-card to-muted/20 py-0">
      <CardHeader className="gap-4 border-b border-border/60 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Badge variant="secondary" className="w-fit rounded-full">
              <Sparkles data-icon="inline-start" />
              À la une
            </Badge>
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle className="text-xl font-black tracking-tight">
                Recherches mises en avant
              </CardTitle>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Accès rapide aux recherches préparées par l&apos;administration.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 p-5 xl:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm transition-colors hover:border-primary/25"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full">
                  Préconfiguré
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  <Search data-icon="inline-start" />
                  {item.query.booleanMode === "AND" ? "Mode ET" : "Mode OU"}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.message}</p>
              </div>

              <p className="text-sm font-medium text-foreground/80">{formatQueryPreview(item)}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Recherche instantanée
              </p>
              <Button
                type="button"
                onClick={() => onRunSearch(item)}
                className="rounded-full px-5 shadow-sm"
              >
                {item.ctaLabel}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

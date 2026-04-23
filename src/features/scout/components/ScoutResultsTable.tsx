"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Download, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { LocalPagination } from "@/components/ui/local-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoutResult } from "../scoutSchemas";

interface ScoutResultsTableProps {
  results: ScoutResult[];
  onApply?: (result: ScoutResult) => void;
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ScoutResultsTable({ results, onApply }: ScoutResultsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) =>
      [r.name, r.type, r.email, r.website, r.address, r.town]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [results, deferredSearch]);

  const pageSize = 15;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage]
  );

  const exportCsv = () => {
    const headers = ["Nom", "Type", "Email", "Téléphone", "Site web", "Adresse", "Ville", "Source email"];
    const rows = filtered.map((r) =>
      [
        r.name,
        r.type,
        r.email ?? "",
        r.phone ?? "",
        r.website ?? "",
        r.address ?? "",
        r.town ?? "",
        r.emailSource,
      ].map(escapeCsvCell)
    );
    const csv = ["\uFEFF" + headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `scout-resultats-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (results.length === 0) {
    return (
      <Empty className="min-h-40 rounded-xl border border-dashed">
        <EmptyHeader>
          <EmptyTitle>Aucun résultat.</EmptyTitle>
          <EmptyDescription>Lancez une recherche pour découvrir des entreprises.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Résultats ({filtered.length})</CardTitle>
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filtrer..."
            className="w-full sm:w-48"
          />
          <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
            <Download data-icon="inline-start" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Site web</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="min-w-0 font-medium">{r.name}</TableCell>
                    <TableCell className="min-w-0 whitespace-nowrap">{r.type}</TableCell>
                    <TableCell className="min-w-0">
                      {r.email ? (
                        <a href={`mailto:${r.email}`} className="truncate text-primary hover:underline">
                          {r.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-0 whitespace-nowrap">{r.phone || "—"}</TableCell>
                    <TableCell className="min-w-0">
                      {r.website ? (
                        <a href={r.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 truncate text-primary hover:underline">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">Site</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="min-w-0 max-w-[200px] truncate">{r.address || "—"}</TableCell>
                    <TableCell className="text-right">
                      {onApply && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => onApply(r)}>
                          <Send className="h-3 w-3" />
                          Candidature
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="mt-4">
          <LocalPagination
            currentPage={safePage}
            pageCount={pageCount}
            totalCount={filtered.length}
            pageSize={pageSize}
            itemLabel="résultats"
            compact
            onPageChange={setPage}
          />
        </div>
      </CardContent>
    </Card>
  );
}

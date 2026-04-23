"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { LocalPagination } from "@/components/ui/local-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoutResult } from "../scoutSchemas";

type SortColumn = "name" | "type" | "email" | "phone" | "website" | "address";
type SortDirection = "asc" | "desc";

interface ScoutResultsTableProps {
  results: ScoutResult[];
  onApply?: (result: ScoutResult) => void;
}

function escapeCsvCell(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ScoutResultsTable({ results, onApply }: ScoutResultsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>(null);
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

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const aVal = String(a[sort.column] ?? "").toLowerCase();
      const bVal = String(b[sort.column] ?? "").toLowerCase();
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }, [filtered, sort]);

  const pageSize = 15;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage]
  );

  function toggleSort(column: SortColumn) {
    setSort((prev) => {
      if (prev?.column === column) {
        return prev.direction === "asc" ? { column, direction: "desc" } : null;
      }
      return { column, direction: "asc" };
    });
    setPage(1);
  }

  function sortIcon(column: SortColumn) {
    if (sort?.column !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/60" />;
    }
    return sort.direction === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-primary" />
    );
  }

  function downloadCsv(format: "excel" | "csv") {
    const headers = ["Nom", "Type", "Email", "Téléphone", "Site web", "Adresse", "Ville", "Source email"];
    const rows = sorted.map((r) =>
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

    if (format === "excel") {
      const content = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      triggerDownload(blob, `scout-resultats-${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      triggerDownload(blob, `scout-resultats-${new Date().toISOString().slice(0, 10)}.csv`);
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

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
        <CardTitle>Résultats ({sorted.length})</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filtrer..."
            className="w-full sm:w-48"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => downloadCsv("excel")}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Excel
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => downloadCsv("csv")}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop table */}
        <div className="hidden rounded-xl border lg:block">
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[26%] cursor-pointer select-none" onClick={() => toggleSort("name")}>
                    <span className="inline-flex items-center">
                      Nom
                      {sortIcon("name")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[12%] cursor-pointer select-none" onClick={() => toggleSort("type")}>
                    <span className="inline-flex items-center">
                      Type
                      {sortIcon("type")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[20%] cursor-pointer select-none" onClick={() => toggleSort("email")}>
                    <span className="inline-flex items-center">
                      Email
                      {sortIcon("email")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[12%] cursor-pointer select-none" onClick={() => toggleSort("phone")}>
                    <span className="inline-flex items-center">
                      Tél.
                      {sortIcon("phone")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[10%] cursor-pointer select-none" onClick={() => toggleSort("website")}>
                    <span className="inline-flex items-center">
                      Site
                      {sortIcon("website")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[14%] cursor-pointer select-none" onClick={() => toggleSort("address")}>
                    <span className="inline-flex items-center">
                      Adresse
                      {sortIcon("address")}
                    </span>
                  </TableHead>
                  <TableHead className="w-[6%] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="truncate cursor-help" title={r.name}>
                      <span className="font-medium">
                        {r.name.length > 25 ? `${r.name.slice(0, 25)}…` : r.name}
                      </span>
                    </TableCell>
                    <TableCell className="truncate whitespace-nowrap cursor-help" title={r.type}>
                      {r.type}
                    </TableCell>
                    <TableCell className="truncate cursor-help" title={r.email ?? undefined}>
                      {r.email ? (
                        <a href={`mailto:${r.email}`} className="text-primary hover:underline">
                          {r.email.length > 22 ? `${r.email.slice(0, 22)}…` : r.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="truncate whitespace-nowrap cursor-help" title={r.phone ?? undefined}>
                      {r.phone || "—"}
                    </TableCell>
                    <TableCell className="truncate cursor-help" title={r.website ?? undefined}>
                      {r.website ? (
                        <a href={r.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">Site</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="truncate cursor-help" title={r.address ?? undefined}>
                      {r.address ? (
                        r.address.length > 16 ? `${r.address.slice(0, 16)}…` : r.address
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {onApply && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Ajouter comme candidature"
                          onClick={() => onApply(r)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-3 lg:hidden">
          {visible.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-lg border bg-card p-3 shadow-sm">
              {/* Row 1: Name + type badge + action */}
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold leading-tight" title={r.name}>
                    {r.name}
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {r.type}
                  </span>
                  {onApply && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Ajouter comme candidature"
                      onClick={() => onApply(r)}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Row 2: Contact chips */}
              <div className="mt-2.5 flex min-w-0 flex-wrap gap-2">
                {r.email && (
                  <a
                    href={`mailto:${r.email}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                  >
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{r.email}</span>
                  </a>
                )}
                {r.phone && (
                  <a
                    href={`tel:${r.phone}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{r.phone}</span>
                  </a>
                )}
                {r.website && (
                  <a
                    href={r.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{r.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
              </div>

              {/* Row 3: Address */}
              {(r.address || r.town) && (
                <div className="mt-2 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{[r.address, r.town].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <LocalPagination
            currentPage={safePage}
            pageCount={pageCount}
            totalCount={sorted.length}
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

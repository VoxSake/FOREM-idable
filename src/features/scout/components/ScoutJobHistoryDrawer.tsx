"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { History, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalPagination } from "@/components/ui/local-pagination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoutJob } from "../scoutSchemas";

type StatusFilter = "all" | "queued" | "running" | "completed" | "failed";

interface ScoutJobHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: ScoutJob[];
  activeJobId?: number;
  onSelect: (job: ScoutJob) => void;
  onDelete: (jobId: number) => void;
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: ScoutJob["status"]) {
  switch (status) {
    case "queued": return { text: "En file", className: "bg-gray-100 text-gray-800" };
    case "pending": return { text: "En attente", className: "bg-yellow-100 text-yellow-800" };
    case "running": return { text: "En cours", className: "bg-blue-100 text-blue-800" };
    case "completed": return { text: "Terminé", className: "bg-green-100 text-green-800" };
    case "failed": return { text: "Échec", className: "bg-red-100 text-red-800" };
  }
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "queued", label: "En file" },
  { value: "running", label: "En cours" },
  { value: "completed", label: "Terminés" },
  { value: "failed", label: "Échecs" },
];

export function ScoutJobHistoryDrawer({
  open,
  onOpenChange,
  jobs,
  activeJobId,
  onSelect,
  onDelete,
}: ScoutJobHistoryDrawerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    let list = jobs;
    if (statusFilter !== "all") {
      list = list.filter((j) => j.status === statusFilter);
    }
    const q = deferredSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((j) => j.query.toLowerCase().includes(q));
    }
    return list;
  }, [jobs, statusFilter, deferredSearch]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Historique des recherches
              <span className="ml-2 text-sm font-normal text-muted-foreground">({jobs.length})</span>
            </SheetTitle>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrer par ville..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>

            <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
              <TabsList className="grid h-8 w-full grid-cols-5">
                {STATUS_OPTIONS.map((opt) => (
                  <TabsTrigger key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {visible.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-sm text-muted-foreground">
              Aucune recherche ne correspond aux filtres.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Ville</TableHead>
                    <TableHead className="w-[18%]">Statut</TableHead>
                    <TableHead className="w-[18%]">Résultats</TableHead>
                    <TableHead className="w-[24%]">Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((job) => {
                    const status = statusBadge(job.status);
                    const isActive = job.id === activeJobId;
                    return (
                      <TableRow
                        key={job.id}
                        className={`cursor-pointer ${isActive ? "bg-primary/5" : ""}`}
                        onClick={() => {
                          onSelect(job);
                          onOpenChange(false);
                        }}
                      >
                        <TableCell className="truncate font-medium" title={job.query}>
                          {job.query.length > 25 ? `${job.query.slice(0, 25)}…` : job.query}
                          <div className="text-xs text-muted-foreground">
                            {job.radius >= 1000 ? `${(job.radius / 1000).toFixed(1)} km` : `${job.radius} m`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${status.className}`}>
                            {status.text}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {job.status === "completed" ? `${job.resultCount}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(job.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(job.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {filtered.length > pageSize && (
          <div className="border-t pt-4">
            <LocalPagination
              currentPage={safePage}
              pageCount={pageCount}
              totalCount={filtered.length}
              pageSize={pageSize}
              itemLabel="recherches"
              compact
              onPageChange={setPage}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

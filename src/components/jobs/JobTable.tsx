"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Job } from "@/types/job";
import { CalendarDays, ExternalLink, FileText, MapPin, MessagesSquare, Send } from "lucide-react";
import { getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { cn } from "@/lib/utils";
import { ShareOfferDialog } from "@/features/jobs/components/ShareOfferDialog";

interface JobTableProps {
  data: Job[];
  resetPaginationToken?: number;
  isLoadingMore?: boolean;
  hasMoreResults?: boolean;
  onLoadMore?: () => void;
  selectedJobIds?: Set<string>;
  onToggleSelection?: (job: Job) => void;
  onOpenDetails?: (job: Job) => void;
  isAuthenticated?: boolean;
  isApplicationsLoaded?: boolean;
  isApplied?: (jobId: string) => boolean;
  onTrackApplication?: (job: Job) => Promise<void> | void;
  onRequireAuth?: (job: Job) => void;
}

const COLUMN_CLASSES: Record<string, { head?: string; cell?: string }> = {
  selection: {
    head: "w-[52px]",
    cell: "w-[52px] align-top",
  },
  title: {
    head: "w-[44%]",
    cell: "w-[44%] whitespace-normal align-top",
  },
  location: {
    head: "hidden sm:table-cell sm:w-[96px] lg:w-[112px]",
    cell: "hidden sm:table-cell sm:w-[96px] lg:w-[112px] align-top",
  },
  contractType: {
    head: "hidden md:table-cell md:w-[92px] lg:w-[104px]",
    cell: "hidden md:table-cell md:w-[92px] lg:w-[104px] whitespace-normal align-top",
  },
  publicationDate: {
    head: "hidden xl:table-cell xl:w-[112px]",
    cell: "hidden xl:table-cell xl:w-[112px] align-top",
  },
  actions: {
    head: "w-[96px] text-right lg:w-[144px]",
    cell: "w-[96px] whitespace-nowrap align-top lg:w-[144px]",
  },
};

export function JobTable({
  data,
  resetPaginationToken,
  isLoadingMore = false,
  hasMoreResults = false,
  onLoadMore,
  selectedJobIds,
  onToggleSelection,
  onOpenDetails,
  isAuthenticated = false,
  isApplicationsLoaded = true,
  isApplied = () => false,
  onTrackApplication,
  onRequireAuth,
}: JobTableProps) {
  const [shareJob, setShareJob] = useState<Job | null>(null);
  const columns: ColumnDef<Job>[] = [
    {
      id: "selection",
      header: "",
      cell: ({ row }) => {
        const job = row.original;

        if (!onToggleSelection) {
          return null;
        }

        return (
          <SelectionCheckbox
            checked={selectedJobIds?.has(job.id) ?? false}
            onChange={() => onToggleSelection(job)}
            title={selectedJobIds?.has(job.id) ? "Retirer de la sélection" : "Ajouter à la sélection"}
          />
        );
      },
    },
    {
      accessorKey: "title",
      header: "Offre",
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        const company = row.original.company;
        const canOpenDetails = Boolean(onOpenDetails);

        return (
          <div className="flex min-w-0 flex-col gap-2">
            <div className="min-w-0">
              <p
                className={cn(
                  "overflow-hidden text-sm font-semibold leading-6 text-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-[15px]",
                  canOpenDetails
                    ? "group-hover:text-primary group-hover:underline underline-offset-2"
                    : undefined
                )}
                title={title}
              >
                {title}
              </p>
              <p
                className="truncate text-xs text-muted-foreground sm:text-sm"
                title={company || "Entreprise non précisée"}
              >
                {company || "Entreprise non précisée"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground xl:hidden">
                <CalendarDays className="size-3.5" />
                {formatPublicationDateCompact(row.original.publicationDate)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Lieu",
      cell: ({ row }) => {
        const location = row.getValue("location") as string;

        return (
          <div className="flex items-start gap-2 pt-0.5 text-sm text-foreground">
            <MapPin className="mt-0.5 size-3.5 text-muted-foreground" />
            <span className="max-w-[10ch] truncate" title={location || "Lieu non précisé"}>
              {location || "Lieu non précisé"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "contractType",
      header: "Contrat",
      cell: ({ row }) => {
        const type = row.getValue("contractType") as string;
        return <ContractTypeBadge contractType={type} />;
      },
    },
    {
      accessorKey: "publicationDate",
      header: "Publication",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground" title={row.original.publicationDate}>
          {formatPublicationDateTable(row.original.publicationDate)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const job = row.original;
        return (
          <JobActions
            job={job}
            layout="table"
            isSelected={selectedJobIds?.has(job.id) ?? false}
            isAuthenticated={isAuthenticated}
            isApplicationsLoaded={isApplicationsLoaded}
            isApplied={isApplied(job.id)}
            onToggleSelection={onToggleSelection}
            onTrackApplication={onTrackApplication}
            onRequireAuth={onRequireAuth}
            onOpenDetails={onOpenDetails}
            onShareJob={isAuthenticated ? (selectedJob) => setShareJob(selectedJob) : undefined}
          />
        );
      },
    },
  ];

  // TanStack Table exposes mutable callbacks; React Compiler can't safely memoize it yet.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [resetPaginationToken, table]);

  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();
  const totalCount = data.length;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, pageCount, 1),
    [currentPage, pageCount]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:hidden">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const job = row.original;
            return (
              <JobMobileCard
                key={job.id}
                job={job}
                isSelected={selectedJobIds?.has(job.id) ?? false}
                isAuthenticated={isAuthenticated}
                isApplicationsLoaded={isApplicationsLoaded}
                isApplied={isApplied(job.id)}
                onToggleSelection={onToggleSelection}
                onTrackApplication={onTrackApplication}
                onRequireAuth={onRequireAuth}
                onOpenDetails={onOpenDetails}
                onShareJob={isAuthenticated ? (selectedJob) => setShareJob(selectedJob) : undefined}
              />
            );
          })
        ) : (
          <div className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
            Aucune offre ne correspond à vos critères.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-background sm:block">
        <Table className="table-fixed">
          <TableHeader className="bg-muted/35 [&_tr]:border-border/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-11 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
                      COLUMN_CLASSES[header.column.id]?.head
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    row.index % 2 === 0 ? "bg-background" : "bg-muted/10",
                    "group border-border/60 hover:bg-muted/30 data-[state=selected]:bg-primary/6",
                    onOpenDetails ? "cursor-pointer" : undefined
                  )}
                  onClick={onOpenDetails ? () => onOpenDetails(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-3 py-4 align-top",
                        COLUMN_CLASSES[cell.column.id]?.cell
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-36 text-center text-muted-foreground">
                  Aucune offre ne correspond à vos critères.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <JobTablePagination
        currentPage={currentPage}
        pageCount={pageCount}
        isLoadingMore={isLoadingMore}
        hasMoreResults={hasMoreResults}
        canPreviousPage={table.getCanPreviousPage()}
        canNextPage={table.getCanNextPage()}
        paginationItems={paginationItems}
        startItem={startItem}
        endItem={endItem}
        totalCount={totalCount}
        onPreviousPage={() => table.previousPage()}
        onSelectPage={(page) => table.setPageIndex(page - 1)}
        onNextPage={() => table.nextPage()}
        onLoadMore={onLoadMore}
      />

      <ShareOfferDialog
        job={shareJob}
        open={Boolean(shareJob)}
        onOpenChange={(open) => {
          if (!open) {
            setShareJob(null);
          }
        }}
      />
    </div>
  );
}

function JobMobileCard({
    job,
    isSelected,
    isAuthenticated,
    isApplicationsLoaded,
    isApplied,
    onToggleSelection,
    onTrackApplication,
    onRequireAuth,
    onOpenDetails,
    onShareJob,
}: {
    job: Job;
    isSelected: boolean;
    isAuthenticated: boolean;
    isApplicationsLoaded: boolean;
    isApplied: boolean;
    onToggleSelection?: (job: Job) => void;
    onTrackApplication?: (job: Job) => Promise<void> | void;
    onRequireAuth?: (job: Job) => void;
    onOpenDetails?: (job: Job) => void;
    onShareJob?: (job: Job) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-background p-4 transition-colors",
        onOpenDetails ? "cursor-pointer hover:bg-muted/20" : undefined
      )}
      onClick={onOpenDetails ? () => onOpenDetails(job) : undefined}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ContractTypeBadge contractType={job.contractType} />
          <span className="text-xs text-muted-foreground">
            {formatPublicationDateCompact(job.publicationDate)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold leading-snug text-foreground">
            {job.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {job.company || "Entreprise non précisée"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          <span>{job.location || "Lieu non précisé"}</span>
        </div>
        <JobActions
          job={job}
          layout="mobile"
          isSelected={isSelected}
          isAuthenticated={isAuthenticated}
          isApplicationsLoaded={isApplicationsLoaded}
          isApplied={isApplied}
          onToggleSelection={onToggleSelection}
          onTrackApplication={onTrackApplication}
          onRequireAuth={onRequireAuth}
          onOpenDetails={onOpenDetails}
          onShareJob={onShareJob}
        />
      </div>
    </div>
  );
}

function JobActions({
    job,
    layout,
    isSelected,
    isAuthenticated,
    isApplicationsLoaded,
    isApplied,
    onToggleSelection,
    onTrackApplication,
    onRequireAuth,
    onOpenDetails,
    onShareJob,
}: {
    job: Job;
    layout: "table" | "mobile";
    isSelected: boolean;
    isAuthenticated: boolean;
    isApplicationsLoaded: boolean;
    isApplied: boolean;
    onToggleSelection?: (job: Job) => void;
    onTrackApplication?: (job: Job) => Promise<void> | void;
    onRequireAuth?: (job: Job) => void;
    onOpenDetails?: (job: Job) => void;
    onShareJob?: (job: Job) => void;
}) {
    const pdfUrl = getJobPdfUrl(job);

    const handleTrackApplication = async () => {
        if (!isAuthenticated) {
            onRequireAuth?.(job);
            return;
        }

        await onTrackApplication?.(job);
    };

    if (layout === "mobile") {
        return (
            <div className="flex flex-col gap-3" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-3">
                    {onToggleSelection ? (
                        <SelectionCheckbox
                            checked={isSelected}
                            label="Comparer"
                            onChange={() => onToggleSelection(job)}
                        />
                    ) : <span />}
                    <span className="text-xs text-muted-foreground">
                      {formatPublicationDateCompact(job.publicationDate)}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant={isApplied ? "secondary" : "default"}
                        className="col-span-2 h-11 w-full"
                        onClick={handleTrackApplication}
                        disabled={!isApplicationsLoaded}
                    >
                        <Send data-icon="inline-start" className={isApplied ? "fill-current" : undefined} />
                        {isApplied ? "Déjà dans le suivi" : "Ajouter au suivi"}
                    </Button>

                    {onShareJob ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            className="rounded-md"
                            onClick={() => onShareJob(job)}
                        >
                            <MessagesSquare />
                        </Button>
                    ) : null}

                    <Button type="button" className="h-10 w-full" asChild>
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink data-icon="inline-start" />
                            WEB
                        </a>
                    </Button>

                    {pdfUrl ? (
                        <Button variant="outline" type="button" className="h-10 w-full" asChild>
                            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                <FileText data-icon="inline-start" />
                                PDF
                            </a>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            className="h-10 w-full"
                            onClick={() => onOpenDetails?.(job)}
                            variant="outline"
                        >
                            Détails
                        </Button>
                    )}

                    <Button
                        type="button"
                        className="col-span-2 h-10 w-full"
                        onClick={() => onOpenDetails?.(job)}
                        variant="outline"
                    >
                        Détails
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-end gap-1 sm:gap-2" onClick={(event) => event.stopPropagation()}>
            <Button
                variant={isApplied ? "success" : "outline"}
                size="icon-sm"
                className="rounded-md"
                onClick={handleTrackApplication}
                title={isApplied ? "Déjà dans le suivi" : "Ajouter au suivi"}
                disabled={!isApplicationsLoaded}
            >
                <Send className={isApplied ? "fill-current" : undefined} />
            </Button>

            {onShareJob ? (
                <Button
                    variant="outline"
                    size="icon-sm"
                    className="rounded-md"
                    onClick={() => onShareJob(job)}
                    title="Partager dans les messages"
                >
                    <MessagesSquare />
                </Button>
            ) : null}

            {pdfUrl ? (
                <Button
                    variant="outline"
                    size="icon-sm"
                    className="rounded-md"
                    asChild
                >
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        <FileText />
                    </a>
                </Button>
            ) : null}

            <Button
                size="sm"
                asChild
                className="h-8 w-8 gap-1 rounded-full p-0 whitespace-nowrap sm:h-8 sm:w-auto sm:px-3"
            >
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <span className="hidden sm:inline">Voir l&apos;offre</span>
                    <ExternalLink />
                </a>
            </Button>
        </div>
    );
}

function SelectionCheckbox({
    checked,
    onChange,
    label,
    title,
}: {
    checked: boolean;
    onChange: () => void;
    label?: string;
    title?: string;
}) {
    return (
        <label
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
            onClick={(event) => event.stopPropagation()}
        >
            <Checkbox
                checked={checked}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={() => onChange()}
                title={title}
                aria-label="Sélectionner l'offre"
            />
            {label ? label : null}
        </label>
    );
}

function JobTablePagination({
  currentPage,
  pageCount,
  isLoadingMore,
  hasMoreResults,
  canPreviousPage,
  canNextPage,
  paginationItems,
  startItem,
  endItem,
  totalCount,
  onPreviousPage,
  onSelectPage,
  onNextPage,
  onLoadMore,
}: {
  currentPage: number;
  pageCount: number;
  isLoadingMore: boolean;
  hasMoreResults: boolean;
  canPreviousPage: boolean;
  canNextPage: boolean;
  paginationItems: PaginationItem[];
  startItem: number;
  endItem: number;
  totalCount: number;
  onPreviousPage: () => void;
  onSelectPage: (page: number) => void;
  onNextPage: () => void;
  onLoadMore?: () => void;
}) {
  if (pageCount <= 1 && !(hasMoreResults && onLoadMore)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/15 px-4 py-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {startItem}-{endItem} sur {totalCount} offres
        </p>
        <p className="text-sm text-muted-foreground">
          Page {currentPage} sur {pageCount}
          {isLoadingMore ? " · Chargement..." : ""}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Pagination className="justify-start lg:justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={onPreviousPage} disabled={!canPreviousPage} />
            </PaginationItem>
            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${item}`}>
                  <PaginationLink
                    isActive={item === currentPage}
                    onClick={() => onSelectPage(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext onClick={onNextPage} disabled={!canNextPage} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {hasMoreResults && currentPage === pageCount && onLoadMore ? (
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-full"
          >
            {isLoadingMore ? "Chargement..." : "Charger plus d'offres"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function formatPublicationDateCompact(dateStr: string) {
  if (!dateStr) return "Date inconnue";

  const parsedDate = new Date(dateStr);
  if (Number.isNaN(parsedDate.getTime())) return "Date inconnue";

  return format(parsedDate, "dd MMM", { locale: fr });
}

function formatPublicationDateTable(dateStr: string) {
  if (!dateStr) return "Date inconnue";

  const parsedDate = new Date(dateStr);
  if (Number.isNaN(parsedDate.getTime())) return "Date inconnue";

  return format(parsedDate, "dd MMM yyyy", { locale: fr });
}

type PaginationItem = number | "ellipsis";

function buildPaginationItems(currentPage: number, totalPages: number, siblingCount = 1): PaginationItem[] {
    if (totalPages <= 0) return [];
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const startPage = Math.max(2, currentPage - siblingCount);
    const endPage = Math.min(totalPages - 1, currentPage + siblingCount);
    const items: PaginationItem[] = [1];

    if (startPage > 2) {
        items.push("ellipsis");
    }

    for (let page = startPage; page <= endPage; page += 1) {
        items.push(page);
    }

    if (endPage < totalPages - 1) {
        items.push("ellipsis");
    }

    items.push(totalPages);
    return items;
}

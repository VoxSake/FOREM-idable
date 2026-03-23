"use client";

import { useEffect, useMemo } from "react";
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
import { Job } from "@/types/job";
import { ExternalLink, FileText, Send } from "lucide-react";
import { getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";

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
    title: {
        head: "w-[38%]",
        cell: "w-[38%] whitespace-normal align-top",
    },
    location: {
        head: "max-[380px]:hidden sm:w-[20%]",
        cell: "max-[380px]:hidden sm:w-[20%]",
    },
    contractType: {
        head: "hidden md:table-cell md:w-[120px] lg:w-[132px]",
        cell: "hidden md:table-cell md:w-[120px] lg:w-[132px] whitespace-normal",
    },
    publicationDate: {
        head: "hidden lg:table-cell lg:w-[172px]",
        cell: "hidden lg:table-cell lg:w-[172px]",
    },
    actions: {
        head: "text-right w-[96px] sm:w-[196px]",
        cell: "whitespace-nowrap w-[96px] sm:w-[196px]",
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
    const columns: ColumnDef<Job>[] = [
        {
            accessorKey: "title",
            header: "Intitulé du poste",
            cell: ({ row }) => {
                const title = row.getValue("title") as string;
                const company = row.original.company;
                const canOpenDetails = Boolean(onOpenDetails);
                return (
                    <div className="w-full min-w-0">
                        <p
                            className={`font-bold text-foreground leading-snug overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] ${canOpenDetails ? "cursor-pointer group-hover:text-primary group-hover:underline underline-offset-2" : ""}`}
                            title={title}
                        >
                            {title}
                        </p>
                        {company && <p className="text-xs text-muted-foreground truncate" title={company}>{company}</p>}
                    </div>
                );
            },
        },
        {
            accessorKey: "location",
            header: "Région/Ville",
            cell: ({ row }) => {
                const location = row.getValue("location") as string;
                return (
                    <p className="max-w-[120px] sm:max-w-[180px] truncate" title={location}>
                        {location}
                    </p>
                );
            },
        },
        {
            accessorKey: "contractType",
            header: "Contrat",
            cell: ({ row }) => {
                const type = row.getValue("contractType") as string;
                return <ContractTypeBadge contractType={type} />;
            }
        },
        {
            accessorKey: "publicationDate",
            header: "Date de publication",
            cell: ({ row }) => {
                const dateStr = row.getValue("publicationDate") as string;
                if (!dateStr) return "N/A";
                const parsedDate = new Date(dateStr);
                if (Number.isNaN(parsedDate.getTime())) return "N/A";
                return format(parsedDate, 'dd MMM yyyy', { locale: fr });
            }
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
    const pageCount = table.getPageCount();
    const paginationItems = useMemo(
        () => buildPaginationItems(currentPage, pageCount, 1),
        [currentPage, pageCount]
    );

    return (
        <div className="space-y-4">
            <div className="space-y-3 sm:hidden">
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
                            />
                        );
                    })
                ) : (
                    <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground shadow-sm">
                        Aucune offre ne correspond à vos critères.
                    </div>
                )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm sm:block">
                <Table className="table-fixed">
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={`h-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${COLUMN_CLASSES[header.column.id]?.head ?? ""}`}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={`border-b border-border/70 hover:bg-primary/5 data-[state=selected]:bg-primary/8 transition-colors group ${onOpenDetails ? "cursor-pointer" : ""}`}
                                    onClick={onOpenDetails ? () => onOpenDetails(row.original) : undefined}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={`py-2 px-1 sm:py-3 sm:px-2 ${COLUMN_CLASSES[cell.column.id]?.cell ?? ""}`}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center text-muted-foreground"
                                >
                                    Aucune offre ne correspond à vos critères.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {pageCount > 1 && (
                <JobTablePagination
                    currentPage={currentPage}
                    pageCount={pageCount}
                    isLoadingMore={isLoadingMore}
                    hasMoreResults={hasMoreResults}
                    canPreviousPage={table.getCanPreviousPage()}
                    canNextPage={table.getCanNextPage()}
                    paginationItems={paginationItems}
                    onFirstPage={() => table.setPageIndex(0)}
                    onPreviousPage={() => table.previousPage()}
                    onSelectPage={(page) => table.setPageIndex(page - 1)}
                    onNextPage={() => table.nextPage()}
                    onLastPage={() => table.setPageIndex(pageCount - 1)}
                    onLoadMore={onLoadMore}
                />
            )}
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
}) {
    return (
        <div
            className={`rounded-xl border bg-card p-4 shadow-sm transition-colors ${onOpenDetails ? "cursor-pointer hover:bg-primary/5" : ""}`}
            onClick={onOpenDetails ? () => onOpenDetails(job) : undefined}
        >
            <div className="space-y-3">
                <div className="space-y-1">
                    <p className="text-base font-bold leading-snug text-foreground">
                        {job.title}
                    </p>
                    {job.company ? (
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                    ) : null}
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
            <div className="space-y-3" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-3">
                    {onToggleSelection ? (
                        <SelectionCheckbox
                            checked={isSelected}
                            label="Comparer"
                            onChange={() => onToggleSelection(job)}
                        />
                    ) : <span />}
                    <div className="flex flex-wrap items-center gap-2">
                        {job.contractType ? (
                            <ContractTypeBadge contractType={job.contractType} />
                        ) : null}
                        {job.location ? (
                            <span className="rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
                                {job.location}
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant={isApplied ? "secondary" : "default"}
                        className="col-span-2 h-11 w-full"
                        onClick={handleTrackApplication}
                        disabled={!isApplicationsLoaded}
                    >
                        <Send className={`mr-2 h-4 w-4 ${isApplied ? "fill-current" : ""}`} />
                        {isApplied ? "Déjà dans le suivi" : "Ajouter au suivi"}
                    </Button>

                    <Button type="button" className="h-10 w-full" asChild>
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            WEB
                        </a>
                    </Button>

                    {pdfUrl ? (
                        <Button variant="outline" type="button" className="h-10 w-full" asChild>
                            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-4 w-4" />
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
            {onToggleSelection ? (
                <SelectionCheckbox
                    checked={isSelected}
                    onChange={() => onToggleSelection(job)}
                    title={isSelected ? "Retirer de la sélection" : "Ajouter à la sélection"}
                />
            ) : null}

            <Button
                variant={isApplied ? "success" : "ghost"}
                size="icon"
                className={isApplied ? "" : "text-muted-foreground transition-colors hover:text-emerald-600"}
                onClick={handleTrackApplication}
                title={isApplied ? "Déjà dans le suivi" : "Ajouter au suivi"}
                disabled={!isApplicationsLoaded}
            >
                <Send className={`h-4 w-4 ${isApplied ? "fill-current" : ""}`} />
            </Button>

            {pdfUrl ? (
                <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-8 w-8 rounded-full p-0 whitespace-nowrap sm:h-8 sm:w-auto sm:px-3"
                >
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        <span className="hidden sm:inline">PDF</span>
                        <FileText className="h-3 w-3 flex-shrink-0" />
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
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
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
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Checkbox
                checked={checked}
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
    onFirstPage,
    onPreviousPage,
    onSelectPage,
    onNextPage,
    onLastPage,
    onLoadMore,
}: {
    currentPage: number;
    pageCount: number;
    isLoadingMore: boolean;
    hasMoreResults: boolean;
    canPreviousPage: boolean;
    canNextPage: boolean;
    paginationItems: PaginationItem[];
    onFirstPage: () => void;
    onPreviousPage: () => void;
    onSelectPage: (page: number) => void;
    onNextPage: () => void;
    onLastPage: () => void;
    onLoadMore?: () => void;
}) {
    return (
        <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {pageCount}
                {isLoadingMore ? " · Chargement..." : ""}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onFirstPage}
                    disabled={!canPreviousPage}
                    className="rounded-full"
                >
                    Première
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onPreviousPage}
                    disabled={!canPreviousPage}
                    className="rounded-full"
                >
                    Précédent
                </Button>
                {paginationItems.map((item, index) => (
                    item === "ellipsis" ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-sm text-muted-foreground"
                            aria-hidden="true"
                        >
                            ...
                        </span>
                    ) : (
                        <Button
                            key={`page-${item}`}
                            variant={item === currentPage ? "default" : "outline"}
                            size="sm"
                            className="min-w-9 rounded-full"
                            onClick={() => onSelectPage(item)}
                        >
                            {item}
                        </Button>
                    )
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onNextPage}
                    disabled={!canNextPage}
                    className="rounded-full"
                >
                    Suivante
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onLastPage}
                    disabled={!canNextPage}
                    className="rounded-full"
                >
                    Dernière
                </Button>
                {hasMoreResults && currentPage === pageCount && onLoadMore ? (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="rounded-full"
                    >
                        {isLoadingMore ? "Chargement..." : "Charger plus"}
                    </Button>
                ) : null}
            </div>
        </div>
    );
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

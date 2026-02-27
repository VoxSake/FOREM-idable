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
import { Job } from "@/types/job";
import { Heart, ExternalLink, FileText, Scale, PanelRightOpen } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { getJobPdfUrl } from "@/features/jobs/utils/jobLinks";

interface JobTableProps {
    data: Job[];
    resetPaginationToken?: number;
    isLoadingMore?: boolean;
    hasMoreResults?: boolean;
    onLoadMore?: () => void;
    selectedCompareIds?: Set<string>;
    onToggleCompare?: (job: Job) => void;
    canSelectMoreForCompare?: boolean;
    onOpenDetails?: (job: Job) => void;
}

const COLUMN_CLASSES: Record<string, { head?: string; cell?: string }> = {
    title: {
        cell: "whitespace-normal align-top",
    },
    location: {
        head: "max-[380px]:hidden",
        cell: "max-[380px]:hidden",
    },
    contractType: {
        head: "hidden md:table-cell",
        cell: "hidden md:table-cell whitespace-normal",
    },
    publicationDate: {
        head: "hidden lg:table-cell",
        cell: "hidden lg:table-cell",
    },
    actions: {
        head: "text-right w-[124px] sm:w-[220px]",
        cell: "whitespace-nowrap w-[124px] sm:w-[220px]",
    },
};
export function JobTable({
    data,
    resetPaginationToken,
    isLoadingMore = false,
    hasMoreResults = false,
    onLoadMore,
    selectedCompareIds,
    onToggleCompare,
    canSelectMoreForCompare = true,
    onOpenDetails,
}: JobTableProps) {
    const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();

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
                            className={`font-semibold text-foreground leading-snug overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] ${canOpenDetails ? "cursor-pointer group-hover:underline underline-offset-2" : ""}`}
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
                return (
                    <span
                        title={type}
                        className="inline-flex max-w-[180px] items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] leading-none font-medium text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/40 dark:text-amber-300 whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                        {type}
                    </span>
                );
            }
        },
        {
            accessorKey: "publicationDate",
            header: "Date de publication",
            cell: ({ row }) => {
                const dateStr = row.getValue("publicationDate") as string;
                if (!dateStr) return "N/A";
                return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const job = row.original;
                const fav = isFavorite(job.id);
                const pdfUrl = getJobPdfUrl(job);
                const isSelectedForCompare = selectedCompareIds?.has(job.id) ?? false;
                const compareDisabled = !isSelectedForCompare && !canSelectMoreForCompare;

                return (
                    <div className="flex items-center gap-1 sm:gap-2 justify-end" onClick={(event) => event.stopPropagation()}>
                        {onOpenDetails && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground"
                                onClick={() => onOpenDetails(job)}
                                title="Voir les détails"
                            >
                                <PanelRightOpen className="w-4 h-4" />
                            </Button>
                        )}

                        {onToggleCompare && (
                            <Button
                                variant={isSelectedForCompare ? "secondary" : "ghost"}
                                size="icon"
                                className={isSelectedForCompare ? "text-primary" : "text-muted-foreground"}
                                onClick={() => onToggleCompare(job)}
                                title={isSelectedForCompare ? "Retirer du comparateur" : "Ajouter au comparateur"}
                                disabled={compareDisabled}
                            >
                                <Scale className={`w-4 h-4 ${isSelectedForCompare ? "fill-current" : ""}`} />
                            </Button>
                        )}

                        <Button
                            variant={fav ? "secondary" : "ghost"}
                            size="icon"
                            className={fav ? "text-rose-500 hover:text-rose-600 bg-rose-100/50 hover:bg-rose-100 dark:bg-rose-950/50" : "text-muted-foreground transition-colors hover:text-rose-500"}
                            onClick={() => fav ? removeFavorite(job.id) : addFavorite(job)}
                            title={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
                            disabled={!isLoaded}
                        >
                            <Heart className={`w-4 h-4 ${fav ? "fill-current" : ""}`} />
                        </Button>

                        {pdfUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="rounded-full h-8 w-8 p-0 sm:h-8 sm:w-auto sm:px-3 whitespace-nowrap"
                            >
                                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                    <span className="hidden sm:inline">PDF</span>
                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                </a>
                            </Button>
                        )}

                        <Button
                            size="sm"
                            asChild
                            className="rounded-full h-8 w-8 p-0 sm:h-8 sm:w-auto sm:px-3 gap-1 whitespace-nowrap"
                        >
                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                                <span className="hidden sm:inline">Voir l&apos;offre</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                        </Button>
                    </div>
                );
            },
        },
    ];

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
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
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
                                    className={`hover:bg-muted/30 transition-colors group ${onOpenDetails ? "cursor-pointer" : ""}`}
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
                <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} sur {pageCount}
                        {isLoadingMore && " · Chargement..."}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                            className="rounded-full"
                        >
                            Première
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
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
                                    onClick={() => table.setPageIndex(item - 1)}
                                >
                                    {item}
                                </Button>
                            )
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="rounded-full"
                        >
                            Suivante
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.setPageIndex(pageCount - 1)}
                            disabled={!table.getCanNextPage()}
                            className="rounded-full"
                        >
                            Dernière
                        </Button>
                        {hasMoreResults && currentPage === pageCount && onLoadMore && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onLoadMore}
                                disabled={isLoadingMore}
                                className="rounded-full"
                            >
                                {isLoadingMore ? "Chargement..." : "Charger plus"}
                            </Button>
                        )}
                    </div>
                </div>
            )}
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

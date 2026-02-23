"use client";

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
import { Heart, ExternalLink, FileText, Scale } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

interface JobTableProps {
    data: Job[];
    selectedCompareIds?: Set<string>;
    onToggleCompare?: (job: Job) => void;
    canSelectMoreForCompare?: boolean;
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
        head: "text-right w-[88px] sm:w-[180px]",
        cell: "whitespace-nowrap w-[88px] sm:w-[180px]",
    },
};

function getForemOfferId(job: Job): string | null {
    if (job.id && /^\d+$/.test(job.id)) return job.id;

    if (!job.url) return null;
    const match = job.url.match(/offre-detail\/(\d+)/);
    return match?.[1] ?? null;
}

export function JobTable({ data, selectedCompareIds, onToggleCompare, canSelectMoreForCompare = true }: JobTableProps) {
    const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();

    const columns: ColumnDef<Job>[] = [
        {
            accessorKey: "title",
            header: "Intitulé du poste",
            cell: ({ row }) => {
                const title = row.getValue("title") as string;
                const company = row.original.company;
                return (
                    <div className="w-full min-w-0">
                        <p
                            className="font-semibold text-foreground leading-snug overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
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
                const offerId = getForemOfferId(job);
                const pdfUrl = offerId ? `/api/pdf/${offerId}` : undefined;
                const isSelectedForCompare = selectedCompareIds?.has(job.id) ?? false;
                const compareDisabled = !isSelectedForCompare && !canSelectMoreForCompare;

                return (
                    <div className="flex items-center gap-1 sm:gap-2 justify-end">
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
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 15,
            },
        },
    });

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
                                    className="hover:bg-muted/30 transition-colors group"
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
            {table.getPageCount() > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} sur{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="rounded-full"
                        >
                            Précédent
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="rounded-full"
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
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
import { Heart, ExternalLink, FileText } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

interface JobTableProps {
    data: Job[];
}

export function JobTable({ data }: JobTableProps) {
    const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();

    const columns: ColumnDef<Job>[] = [
        {
            accessorKey: "title",
            header: "Intitulé du poste",
            cell: ({ row }) => {
                const title = row.getValue("title") as string;
                const company = row.original.company;
                return (
                    <div className="w-[200px] sm:w-[250px] md:w-[300px] lg:w-[400px]">
                        <p className="font-semibold text-foreground truncate" title={title}>{title}</p>
                        {company && <p className="text-xs text-muted-foreground truncate" title={company}>{company}</p>}
                    </div>
                );
            },
        },
        {
            accessorKey: "location",
            header: "Région/Ville",
        },
        {
            accessorKey: "contractType",
            header: "Contrat",
            cell: ({ row }) => {
                const type = row.getValue("contractType") as string;
                return (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-800/60">
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

                return (
                    <div className="flex items-center gap-2 justify-end">
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

                        {/* Bouton PDF retiré : Le Forem utilise des Blob URLs générées dynamiquement côté client (irrécupérables) */}
                        <Button size="sm" asChild className="ml-2 gap-1 rounded-full whitespace-nowrap">
                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                                <span>Voir l'offre</span>
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
                pageSize: 10,
            },
        },
    });

    return (
        <div className="space-y-4">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="h-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                                        <TableCell key={cell.id} className="py-3">
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

"use client";

import { Button } from "@/components/ui/button";

interface LocalPaginationProps {
  currentPage: number;
  pageCount: number;
  totalCount: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export function LocalPagination({
  currentPage,
  pageCount,
  totalCount,
  pageSize,
  itemLabel,
  onPageChange,
}: LocalPaginationProps) {
  if (pageCount <= 1) return null;

  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {start}-{end} sur {totalCount} {itemLabel}
      </p>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Précédent
        </Button>
        <span className="min-w-24 text-center text-sm text-muted-foreground">
          Page {currentPage} / {pageCount}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

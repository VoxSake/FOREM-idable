"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SearchButtonProps = {
  onClick?: () => void;
  className?: string;
  label?: string;
  disabled?: boolean;
};

export function SearchButton({
  onClick,
  className,
  label = "Rechercher",
  disabled = false,
}: SearchButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full lg:w-14 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white shrink-0 shadow-sm",
        "grid grid-cols-[1.25rem_1fr_1.25rem] items-center px-5",
        "lg:flex lg:items-center lg:justify-center lg:px-0",
        className
      )}
    >
      <Search className="h-5 w-5 justify-self-start lg:justify-self-center" />
      <span className="text-base font-semibold text-center truncate lg:hidden">
        {label}
      </span>
      <span aria-hidden className="h-5 w-5 lg:hidden" />
    </Button>
  );
}
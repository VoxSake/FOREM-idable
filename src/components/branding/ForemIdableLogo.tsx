import { cn } from "@/lib/utils";

interface ForemIdableLogoProps {
  className?: string;
}

export function ForemIdableLogo({ className }: ForemIdableLogoProps) {
  return (
    <div className={cn("inline-flex h-full items-center", className)}>
      <span className="[font-family:var(--font-brand)] text-[1.45rem] leading-none font-semibold tracking-[-0.025em] text-foreground">
        FOREM
        <span className="text-primary">-idable</span>
      </span>
    </div>
  );
}

import { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccountFieldProps = {
  label: string;
  error?: string;
} & ComponentProps<"input">;

export function AccountField({ label, error, ...inputProps }: AccountFieldProps) {
  const errorId = inputProps.id && error ? `${inputProps.id}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputProps.id}>{label}</Label>
      <Input
        {...inputProps}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={errorId}
      />
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

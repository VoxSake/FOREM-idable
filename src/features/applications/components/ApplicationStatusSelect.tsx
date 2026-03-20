"use client";

import { ComponentProps } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ApplicationStatus } from "@/types/application";

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: "in_progress", label: "En cours" },
  { value: "follow_up", label: "Relance à faire" },
  { value: "interview", label: "Entretien" },
  { value: "accepted", label: "Acceptée" },
  { value: "rejected", label: "Refusée" },
];

interface ApplicationStatusSelectProps {
  value: ApplicationStatus;
  onValueChange: (value: ApplicationStatus) => void;
  placeholder?: string;
  triggerId?: string;
  triggerClassName?: string;
  onTriggerClick?: ComponentProps<typeof SelectTrigger>["onClick"];
}

export function ApplicationStatusSelect({
  value,
  onValueChange,
  placeholder = "Choisir un statut",
  triggerId,
  triggerClassName,
  onTriggerClick,
}: ApplicationStatusSelectProps) {
  return (
    <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as ApplicationStatus)}>
      <SelectTrigger
        id={triggerId}
        className={cn("w-full", triggerClassName)}
        onClick={onTriggerClick}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

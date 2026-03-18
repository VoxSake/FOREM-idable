"use client";

import { Download, FileKey2, FilePenLine, FileSpreadsheet, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CoachUserActivityMeta } from "@/features/coach/components/CoachUserActivityMeta";
import { getCoachUserDisplayName } from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

interface CoachUserSheetHeaderProps {
  currentUserId: number | undefined;
  isAdmin: boolean;
  canEditUser: boolean;
  canManageApiKeys: boolean;
  user: CoachUserSummary;
  onExport: () => void;
  onOpenApiKeys: () => void;
  onOpenImport: () => void;
  onEdit: () => void;
  onDeleteUser: () => void;
}

export function CoachUserSheetHeader({
  currentUserId,
  isAdmin,
  canEditUser,
  canManageApiKeys,
  user,
  onExport,
  onOpenApiKeys,
  onOpenImport,
  onEdit,
  onDeleteUser,
}: CoachUserSheetHeaderProps) {
  return (
    <SheetHeader className="border-b bg-muted/30 p-5 pr-12">
      <SheetTitle>{getCoachUserDisplayName(user)}</SheetTitle>
      <SheetDescription>
        <span className="block text-sm">{user.email}</span>
        <span className="block">
          {user.groupNames.length > 0 ? user.groupNames.join(" • ") : "Aucun groupe assigné"}
        </span>
        <CoachUserActivityMeta user={user} as="span" className="block" />
      </SheetDescription>
      <div className="flex flex-wrap gap-2 pt-2">
        <Badge variant="secondary" className="capitalize">
          {user.role}
        </Badge>
        <Badge variant="outline">{user.applicationCount} candidatures</Badge>
        <Badge variant="outline">{user.interviewCount} entretien(s)</Badge>
        <Badge variant="outline">{user.dueCount} relance(s) dues</Badge>
        <Button
          type="button"
          size="sm"
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={onExport}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        {(canManageApiKeys || canEditUser || isAdmin) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {canManageApiKeys && (
                <DropdownMenuItem onClick={onOpenApiKeys}>
                  <FileKey2 className="h-4 w-4" />
                  Clés API
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onOpenImport}>
                <FileSpreadsheet className="h-4 w-4" />
                Importer un suivi (CSV)
              </DropdownMenuItem>
              {canEditUser && (
                <DropdownMenuItem onClick={onEdit}>
                  <FilePenLine className="h-4 w-4" />
                  Éditer
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <>
                  {canManageApiKeys || canEditUser ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={onDeleteUser}
                    disabled={user.id === currentUserId}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </SheetHeader>
  );
}

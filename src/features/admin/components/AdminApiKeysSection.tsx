"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { KeyRound, RotateCw, ShieldBan } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CoachConfirmationDialog } from "@/features/coach/components/dialogs/CoachConfirmationDialog";
import { formatCoachDate, getCoachUserDisplayName } from "@/features/coach/utils";
import { cn } from "@/lib/utils";
import { AdminApiKeySummary } from "@/types/externalApi";

type ApiKeyStatusFilter = "all" | "active" | "revoked" | "expired" | "expiring";

function getApiKeyStatus(entry: AdminApiKeySummary) {
  if (entry.revokedAt) return "revoked";
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now()) return "expired";
  if (entry.expiresAt) {
    const expiresAt = new Date(entry.expiresAt).getTime();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    if (expiresAt - Date.now() <= fourteenDays) return "expiring";
  }
  return "active";
}

function getAdminApiKeyOwnerName(entry: AdminApiKeySummary) {
  return getCoachUserDisplayName({
    firstName: entry.userFirstName,
    lastName: entry.userLastName,
    email: entry.userEmail,
  });
}

function getStatusBadge(entry: AdminApiKeySummary) {
  const status = getApiKeyStatus(entry);

  switch (status) {
    case "revoked":
      return <Badge variant="destructive">Révoquée</Badge>;
    case "expired":
      return <Badge variant="outline">Expirée</Badge>;
    case "expiring":
      return <Badge variant="secondary">Expire bientôt</Badge>;
    case "active":
    default:
      return <Badge variant="secondary">Active</Badge>;
  }
}

export function AdminApiKeysSection({
  apiKeys,
  isLoading,
  isRevoking,
  revokeTarget,
  onRefresh,
  onRevokeRequest,
  onRevokeConfirm,
  onRevokeDialogOpenChange,
}: {
  apiKeys: AdminApiKeySummary[];
  isLoading: boolean;
  isRevoking: boolean;
  revokeTarget: AdminApiKeySummary | null;
  onRefresh: () => void;
  onRevokeRequest: (entry: AdminApiKeySummary) => void;
  onRevokeConfirm: () => void;
  onRevokeDialogOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ApiKeyStatusFilter>("all");
  const deferredSearch = useDeferredValue(search);

  const filteredKeys = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return apiKeys.filter((entry) => {
      const entryStatus = getApiKeyStatus(entry);
      if (status !== "all" && entryStatus !== status) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        entry.name,
        entry.userEmail,
        entry.userFirstName,
        entry.userLastName,
        getAdminApiKeyOwnerName(entry),
        entry.keyPrefix,
        entry.lastFour,
        entry.userRole,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [apiKeys, deferredSearch, status]);
  const hasKeys = filteredKeys.length > 0;
  const isInitialLoading = isLoading && apiKeys.length === 0;

  return (
    <>
      <Card id="cles-api" className="overflow-hidden border-border/60 py-0">
        <CardHeader className="gap-4 border-b border-border/60 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <KeyRound data-icon="inline-start" className="text-primary" />
                Clés API Bearer
              </CardTitle>
              <CardDescription>
                Inventaire global des clés générées. Les valeurs restent masquées, avec suivi du
                dernier usage, de l&apos;expiration et révocation centralisée.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={isLoading}>
              <RotateCw
                data-icon="inline-start"
                className={isLoading ? "animate-spin" : undefined}
              />
              {isLoading ? "Actualisation..." : "Rafraîchir"}
            </Button>
          </div>

          <FieldGroup className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Field>
              <FieldLabel htmlFor="admin-api-key-search">Recherche</FieldLabel>
              <Input
                id="admin-api-key-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nom, email, rôle, préfixe..."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-api-key-status">Statut</FieldLabel>
              <Select value={status} onValueChange={(value) => setStatus(value as ApiKeyStatusFilter)}>
                <SelectTrigger id="admin-api-key-status" className="w-full">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="expiring">Expirent bientôt</SelectItem>
                    <SelectItem value="expired">Expirées</SelectItem>
                    <SelectItem value="revoked">Révoquées</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardHeader>

        <CardContent className="px-4 py-4 sm:px-6">
          {isInitialLoading ? (
            <div className="rounded-xl border border-border/60 px-6 py-8 text-sm text-muted-foreground">
              Chargement des clés API...
            </div>
          ) : !hasKeys ? (
            <Empty className="min-h-52 rounded-xl border border-dashed border-border/60">
              <EmptyHeader>
                <EmptyTitle>Aucune clé à afficher.</EmptyTitle>
                <EmptyDescription>
                  Ajuste les filtres ou génère des clés depuis les comptes coach/admin.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div
              aria-busy={isLoading}
              className={cn(
                "rounded-xl border border-border/60 bg-background/80 transition-opacity",
                isLoading ? "opacity-80" : "opacity-100"
              )}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {filteredKeys.length} clé{filteredKeys.length > 1 ? "s" : ""} affichée
                  {filteredKeys.length > 1 ? "s" : ""}
                </p>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <RotateCw className="animate-spin" />
                    Mise à jour en cours...
                  </span>
                ) : null}
              </div>
              <div className="px-2 py-2 sm:px-3">
                <Table>
                  <TableCaption className="sr-only">
                    Inventaire des clés API générées côté administration.
                  </TableCaption>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Clé</TableHead>
                      <TableHead>Créée le</TableHead>
                      <TableHead>Dernier usage</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeys.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="align-top">
                          <div className="flex min-w-52 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{getAdminApiKeyOwnerName(entry)}</span>
                              <Badge variant="outline" className="capitalize">
                                {entry.userRole}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{entry.userEmail}</span>
                            <span className="text-xs text-muted-foreground">{entry.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <code className="text-xs">
                            {entry.keyPrefix}...{entry.lastFour}
                          </code>
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          {formatCoachDate(entry.createdAt, true)}
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          {entry.lastUsedAt ? formatCoachDate(entry.lastUsedAt, true) : "Jamais"}
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          {entry.expiresAt
                            ? formatCoachDate(entry.expiresAt, true)
                            : "Sans expiration"}
                        </TableCell>
                        <TableCell className="align-top">{getStatusBadge(entry)}</TableCell>
                        <TableCell className="align-top text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            disabled={Boolean(entry.revokedAt)}
                            onClick={() => onRevokeRequest(entry)}
                          >
                            <ShieldBan data-icon="inline-start" />
                            Révoquer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CoachConfirmationDialog
        open={Boolean(revokeTarget)}
        title="Révoquer cette clé API ?"
        description={
          revokeTarget
            ? `La clé ${revokeTarget.name} (${revokeTarget.keyPrefix}...${revokeTarget.lastFour}) de ${revokeTarget.userEmail} sera invalidée immédiatement.`
            : "Cette clé sera invalidée immédiatement."
        }
        confirmLabel="Révoquer la clé"
        onOpenChange={onRevokeDialogOpenChange}
        onConfirm={onRevokeConfirm}
        isPending={isRevoking}
      />
    </>
  );
}

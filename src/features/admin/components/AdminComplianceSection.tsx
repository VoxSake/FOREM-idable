"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { BookLock, Check, ChevronsUpDown, FilePlus2, Hand, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LocalPagination } from "@/components/ui/local-pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminDisclosureLog,
  AdminLegalHold,
} from "@/features/admin/adminApi";
import {
  AdminDisclosureLogFormValues,
  adminDisclosureLogFormSchema,
  AdminLegalHoldFormValues,
  adminLegalHoldFormSchema,
} from "@/features/admin/adminComplianceSchemas";

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("fr-FR");
}

function formatLegalHoldTarget(targetType: AdminLegalHold["targetType"]) {
  switch (targetType) {
    case "conversation":
      return "Conversation";
    case "application":
      return "Candidature";
    default:
      return "Utilisateur";
  }
}

function formatDisclosureRequestType(type: AdminDisclosureLog["requestType"]) {
  switch (type) {
    case "litigation":
      return "Litige";
    case "other":
      return "Autre";
    default:
      return "Autorité";
  }
}

function formatDisclosureTargetType(type: AdminDisclosureLog["targetType"]) {
  switch (type) {
    case "conversation":
      return "Conversation";
    case "application":
      return "Candidature";
    case "export":
      return "Export";
    case "other":
      return "Autre";
    default:
      return "Utilisateur";
  }
}

type AdminLegalHoldUserTarget = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

function getUserTargetLabel(user: AdminLegalHoldUserTarget) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email;
}

function AdminLegalHoldUserCombobox({
  users,
  selectedUserId,
  onSelect,
}: {
  users: AdminLegalHoldUserTarget[];
  selectedUserId: number | null;
  onSelect: (userId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedUser = users.find((entry) => entry.id === selectedUserId) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate text-left">
            {selectedUser
              ? `${getUserTargetLabel(selectedUser)} · ${selectedUser.email}`
              : "Sélectionner un utilisateur"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un utilisateur..." />
          <CommandList>
            <CommandEmpty>Aucun utilisateur correspondant.</CommandEmpty>
            <CommandGroup heading="Utilisateurs">
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${getUserTargetLabel(user)} ${user.email} ${user.role}`}
                  onSelect={() => {
                    onSelect(user.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{getUserTargetLabel(user)}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email} · {user.role}
                    </span>
                  </div>
                  {selectedUserId === user.id ? <Check /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type AdminComplianceSectionProps = {
  userTargets: AdminLegalHoldUserTarget[];
  legalHolds: AdminLegalHold[];
  disclosureLogs: AdminDisclosureLog[];
  legalHoldDialogOpen: boolean;
  onLegalHoldDialogOpenChange: (open: boolean) => void;
  legalHoldDraft: {
    targetType: "user" | "conversation" | "application";
    targetId: number | null;
  } | null;
  isLegalHoldsLoading: boolean;
  isDisclosureLogsLoading: boolean;
  isCreatingLegalHold: boolean;
  isReleasingLegalHold: boolean;
  isCreatingDisclosureLog: boolean;
  onRefreshLegalHolds: () => void;
  onRefreshDisclosureLogs: () => void;
  onCreateLegalHold: (payload: {
    targetType: "user" | "conversation" | "application";
    targetId: number;
    reason: string;
  }) => Promise<boolean>;
  onReleaseLegalHold: (id: number) => Promise<boolean>;
  onCreateDisclosureLog: (payload: {
    requestType?: "authority_request" | "litigation" | "other";
    authorityName: string;
    legalBasis?: string;
    targetType: "user" | "conversation" | "application" | "export" | "other";
    targetId?: number;
    scopeSummary: string;
    exportReference?: string;
  }) => Promise<boolean>;
};

export function AdminComplianceSection({
  userTargets,
  legalHolds,
  disclosureLogs,
  legalHoldDialogOpen,
  onLegalHoldDialogOpenChange,
  legalHoldDraft,
  isLegalHoldsLoading,
  isDisclosureLogsLoading,
  isCreatingLegalHold,
  isReleasingLegalHold,
  isCreatingDisclosureLog,
  onRefreshLegalHolds,
  onRefreshDisclosureLogs,
  onCreateLegalHold,
  onReleaseLegalHold,
  onCreateDisclosureLog,
}: AdminComplianceSectionProps) {
  const [isDisclosureDialogOpen, setIsDisclosureDialogOpen] = useState(false);
  const [legalHoldPage, setLegalHoldPage] = useState(1);
  const [disclosurePage, setDisclosurePage] = useState(1);
  const legalHoldForm = useForm<AdminLegalHoldFormValues>({
    resolver: zodResolver(adminLegalHoldFormSchema),
    defaultValues: {
      targetType: "user",
      targetId: "",
      reason: "",
    },
  });
  const disclosureForm = useForm<AdminDisclosureLogFormValues>({
    resolver: zodResolver(adminDisclosureLogFormSchema),
    defaultValues: {
      requestType: "authority_request",
      authorityName: "",
      legalBasis: "",
      targetType: "user",
      targetId: "",
      scopeSummary: "",
      exportReference: "",
    },
  });

  const legalHoldPageSize = 5;
  const disclosurePageSize = 5;
  const legalHoldTargetType = useWatch({
    control: legalHoldForm.control,
    name: "targetType",
  });
  const legalHoldTargetId = useWatch({
    control: legalHoldForm.control,
    name: "targetId",
  });
  const selectedLegalHoldTargetId = useMemo(() => {
    const currentValue = legalHoldTargetId;
    const parsed = Number(currentValue);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [legalHoldTargetId]);
  const disclosureRequestType = useWatch({
    control: disclosureForm.control,
    name: "requestType",
  });
  const disclosureTargetType = useWatch({
    control: disclosureForm.control,
    name: "targetType",
  });
  const legalHoldPageCount = Math.max(1, Math.ceil(legalHolds.length / legalHoldPageSize));
  const disclosurePageCount = Math.max(1, Math.ceil(disclosureLogs.length / disclosurePageSize));

  const visibleLegalHolds = useMemo(
    () =>
      legalHolds.slice(
        (legalHoldPage - 1) * legalHoldPageSize,
        legalHoldPage * legalHoldPageSize
      ),
    [legalHoldPage, legalHolds]
  );

  const visibleDisclosureLogs = useMemo(
    () =>
      disclosureLogs.slice(
        (disclosurePage - 1) * disclosurePageSize,
        disclosurePage * disclosurePageSize
      ),
    [disclosureLogs, disclosurePage]
  );

  const submitLegalHold = legalHoldForm.handleSubmit(async (values) => {
    const success = await onCreateLegalHold({
      targetType: values.targetType,
      targetId: Number(values.targetId),
      reason: values.reason,
    });
    if (!success) return;

    legalHoldForm.reset({
      targetType: "user",
      targetId: "",
      reason: "",
    });
    onLegalHoldDialogOpenChange(false);
    setLegalHoldPage(1);
  });

  useEffect(() => {
    if (!legalHoldDialogOpen) {
      legalHoldForm.reset({
        targetType: "user",
        targetId: "",
        reason: "",
      });
      return;
    }

    legalHoldForm.reset({
      targetType: legalHoldDraft?.targetType ?? "user",
      targetId:
        legalHoldDraft?.targetId && Number.isInteger(legalHoldDraft.targetId)
          ? String(legalHoldDraft.targetId)
          : "",
      reason: "",
    });
  }, [legalHoldDialogOpen, legalHoldDraft, legalHoldForm]);

  const submitDisclosureLog = disclosureForm.handleSubmit(async (values) => {
    const parsedTargetId =
      values.targetId && values.targetId.trim().length > 0
        ? Number(values.targetId.trim())
        : undefined;

    const success = await onCreateDisclosureLog({
      requestType: values.requestType,
      authorityName: values.authorityName,
      legalBasis: values.legalBasis || undefined,
      targetType: values.targetType,
      targetId: Number.isFinite(parsedTargetId) ? parsedTargetId : undefined,
      scopeSummary: values.scopeSummary,
      exportReference: values.exportReference || undefined,
    });
    if (!success) return;

    disclosureForm.reset({
      requestType: "authority_request",
      authorityName: "",
      legalBasis: "",
      targetType: "user",
      targetId: "",
      scopeSummary: "",
      exportReference: "",
    });
    setIsDisclosureDialogOpen(false);
    setDisclosurePage(1);
  });

  return (
    <>
      <Card className="gap-0 border-border/60 bg-card py-0">
        <CardHeader className="border-b border-border/60 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl">Conformité</CardTitle>
              <CardDescription>
                Outils de gel légal et journalisation des divulgations ciblées.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={onRefreshLegalHolds}>
                Actualiser les legal holds
              </Button>
              <Button type="button" variant="outline" onClick={onRefreshDisclosureLogs}>
                Actualiser les logs
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 px-5 py-5 xl:grid-cols-2">
          <Card className="gap-0 border-border/60 py-0 shadow-none">
            <CardHeader className="border-b border-border/60 px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Hand data-icon="inline-start" />
                    Legal Holds
                  </CardTitle>
                  <CardDescription>
                    Geler une suppression ou une purge ciblée tant qu&apos;une contrainte s&apos;applique.
                  </CardDescription>
                </div>
                  <Button type="button" onClick={() => onLegalHoldDialogOpenChange(true)}>
                    <ShieldAlert data-icon="inline-start" />
                    Ajouter
                  </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 py-5">
              {isLegalHoldsLoading ? (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                  Chargement des legal holds...
                </div>
              ) : legalHolds.length === 0 ? (
                <Empty className="min-h-44 rounded-xl border border-dashed border-border/60">
                  <EmptyHeader>
                    <EmptyTitle>Aucun legal hold actif.</EmptyTitle>
                    <EmptyDescription>
                      Ajoute un gel ciblé lorsqu&apos;une suppression doit être suspendue.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <div className="grid gap-3">
                    {visibleLegalHolds.map((hold) => (
                      <div
                        key={hold.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{formatLegalHoldTarget(hold.targetType)}</Badge>
                            <Badge variant="outline">ID {hold.targetId}</Badge>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isReleasingLegalHold}
                            onClick={() => void onReleaseLegalHold(hold.id)}
                          >
                            <ShieldCheck data-icon="inline-start" />
                            Libérer
                          </Button>
                        </div>
                        <p className="text-sm text-foreground">{hold.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          Créé le {formatDateTime(hold.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <LocalPagination
                    currentPage={legalHoldPage}
                    pageCount={legalHoldPageCount}
                    totalCount={legalHolds.length}
                    pageSize={legalHoldPageSize}
                    itemLabel="legal holds"
                    compact
                    onPageChange={setLegalHoldPage}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 border-border/60 py-0 shadow-none">
            <CardHeader className="border-b border-border/60 px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookLock data-icon="inline-start" />
                    Disclosure Logs
                  </CardTitle>
                  <CardDescription>
                    Historique des divulgations ciblées et de leur base légale.
                  </CardDescription>
                </div>
                <Button type="button" onClick={() => setIsDisclosureDialogOpen(true)}>
                  <FilePlus2 data-icon="inline-start" />
                  Journaliser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 py-5">
              {isDisclosureLogsLoading ? (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                  Chargement des disclosure logs...
                </div>
              ) : disclosureLogs.length === 0 ? (
                <Empty className="min-h-44 rounded-xl border border-dashed border-border/60">
                  <EmptyHeader>
                    <EmptyTitle>Aucune divulgation journalisée.</EmptyTitle>
                    <EmptyDescription>
                      Ajoute une entrée lorsqu&apos;une extraction ciblée est remise à une autorité.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <div className="grid gap-3">
                    {visibleDisclosureLogs.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {formatDisclosureRequestType(entry.requestType)}
                          </Badge>
                          <Badge variant="outline">
                            {formatDisclosureTargetType(entry.targetType)}
                            {entry.targetId ? ` #${entry.targetId}` : ""}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1 text-sm">
                          <p className="font-medium text-foreground">{entry.authorityName}</p>
                          <p className="text-muted-foreground">{entry.scopeSummary}</p>
                          {entry.legalBasis ? (
                            <p className="text-xs text-muted-foreground">
                              Base légale: {entry.legalBasis}
                            </p>
                          ) : null}
                          {entry.exportReference ? (
                            <p className="text-xs text-muted-foreground">
                              Référence export: {entry.exportReference}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            Créé le {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <LocalPagination
                    currentPage={disclosurePage}
                    pageCount={disclosurePageCount}
                    totalCount={disclosureLogs.length}
                    pageSize={disclosurePageSize}
                    itemLabel="logs"
                    compact
                    onPageChange={setDisclosurePage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Dialog open={legalHoldDialogOpen} onOpenChange={onLegalHoldDialogOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Créer un legal hold</DialogTitle>
            <DialogDescription>
              Gèle une suppression ou une purge ciblée jusqu&apos;à levée manuelle.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-5" onSubmit={submitLegalHold}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="legal-hold-target-type">Type de cible</FieldLabel>
                <Select
                  value={legalHoldTargetType}
                  onValueChange={(value) =>
                    legalHoldForm.setValue("targetType", value as AdminLegalHoldFormValues["targetType"])
                  }
                >
                  <SelectTrigger id="legal-hold-target-type">
                    <SelectValue placeholder="Type de cible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="conversation">Conversation</SelectItem>
                      <SelectItem value="application">Candidature</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              {legalHoldTargetType === "user" ? (
                <Field data-invalid={legalHoldForm.formState.errors.targetId ? "true" : undefined}>
                  <FieldLabel>Utilisateur ciblé</FieldLabel>
                  <AdminLegalHoldUserCombobox
                    users={userTargets}
                    selectedUserId={selectedLegalHoldTargetId}
                    onSelect={(userId) => {
                      legalHoldForm.setValue("targetId", String(userId), {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                  {legalHoldForm.formState.errors.targetId ? (
                    <FieldError>{legalHoldForm.formState.errors.targetId.message}</FieldError>
                  ) : null}
                </Field>
              ) : (
                <Field data-invalid={legalHoldForm.formState.errors.targetId ? "true" : undefined}>
                  <FieldLabel htmlFor="legal-hold-target-id">Identifiant cible</FieldLabel>
                  <Input
                    id="legal-hold-target-id"
                    type="number"
                    aria-invalid={legalHoldForm.formState.errors.targetId ? "true" : "false"}
                    {...legalHoldForm.register("targetId")}
                  />
                  {legalHoldForm.formState.errors.targetId ? (
                    <FieldError>{legalHoldForm.formState.errors.targetId.message}</FieldError>
                  ) : null}
                </Field>
              )}
              <Field data-invalid={legalHoldForm.formState.errors.reason ? "true" : undefined}>
                <FieldLabel htmlFor="legal-hold-reason">Motif</FieldLabel>
                <Textarea
                  id="legal-hold-reason"
                  aria-invalid={legalHoldForm.formState.errors.reason ? "true" : "false"}
                  {...legalHoldForm.register("reason")}
                />
                {legalHoldForm.formState.errors.reason ? (
                  <FieldError>{legalHoldForm.formState.errors.reason.message}</FieldError>
                ) : null}
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onLegalHoldDialogOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreatingLegalHold}>
                Créer le legal hold
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDisclosureDialogOpen} onOpenChange={setIsDisclosureDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Journaliser une divulgation</DialogTitle>
            <DialogDescription>
              Conserve la trace minimale d&apos;une extraction transmise à une autorité ou dans un litige.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-5" onSubmit={submitDisclosureLog}>
            <FieldGroup className="gap-4">
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="disclosure-request-type">Type de demande</FieldLabel>
                  <Select
                    value={disclosureRequestType}
                    onValueChange={(value) =>
                      disclosureForm.setValue(
                        "requestType",
                        value as AdminDisclosureLogFormValues["requestType"]
                      )
                    }
                  >
                    <SelectTrigger id="disclosure-request-type">
                      <SelectValue placeholder="Type de demande" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="authority_request">Autorité</SelectItem>
                        <SelectItem value="litigation">Litige</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="disclosure-target-type">Type de cible</FieldLabel>
                  <Select
                    value={disclosureTargetType}
                    onValueChange={(value) =>
                      disclosureForm.setValue(
                        "targetType",
                        value as AdminDisclosureLogFormValues["targetType"]
                      )
                    }
                  >
                    <SelectTrigger id="disclosure-target-type">
                      <SelectValue placeholder="Type de cible" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="user">Utilisateur</SelectItem>
                        <SelectItem value="conversation">Conversation</SelectItem>
                        <SelectItem value="application">Candidature</SelectItem>
                        <SelectItem value="export">Export</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <Field data-invalid={disclosureForm.formState.errors.authorityName ? "true" : undefined}>
                <FieldLabel htmlFor="disclosure-authority-name">Autorité ou requérant</FieldLabel>
                <Input
                  id="disclosure-authority-name"
                  aria-invalid={disclosureForm.formState.errors.authorityName ? "true" : "false"}
                  {...disclosureForm.register("authorityName")}
                />
                {disclosureForm.formState.errors.authorityName ? (
                  <FieldError>{disclosureForm.formState.errors.authorityName.message}</FieldError>
                ) : null}
              </Field>

              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="disclosure-target-id">Identifiant cible</FieldLabel>
                  <Input id="disclosure-target-id" {...disclosureForm.register("targetId")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="disclosure-export-reference">Référence export</FieldLabel>
                  <Input
                    id="disclosure-export-reference"
                    {...disclosureForm.register("exportReference")}
                  />
                </Field>
              </FieldGroup>

              <Field>
                <FieldLabel htmlFor="disclosure-legal-basis">Base légale</FieldLabel>
                <Input id="disclosure-legal-basis" {...disclosureForm.register("legalBasis")} />
              </Field>

              <Field data-invalid={disclosureForm.formState.errors.scopeSummary ? "true" : undefined}>
                <FieldLabel htmlFor="disclosure-scope-summary">Périmètre divulgué</FieldLabel>
                <Textarea
                  id="disclosure-scope-summary"
                  aria-invalid={disclosureForm.formState.errors.scopeSummary ? "true" : "false"}
                  {...disclosureForm.register("scopeSummary")}
                />
                {disclosureForm.formState.errors.scopeSummary ? (
                  <FieldError>{disclosureForm.formState.errors.scopeSummary.message}</FieldError>
                ) : null}
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDisclosureDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreatingDisclosureLog}>
                Journaliser
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

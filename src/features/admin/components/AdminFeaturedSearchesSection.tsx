"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CoachConfirmationDialog } from "@/features/coach/components/dialogs/CoachConfirmationDialog";
import {
  FeaturedSearchPayload,
  featuredSearchPayloadSchema,
  parseKeywordInput,
} from "@/features/featured-searches/featuredSearchSchema";
import { FeaturedSearch } from "@/types/featuredSearch";

type FeaturedSearchFormState = {
  title: string;
  message: string;
  ctaLabel: string;
  keywordsInput: string;
  booleanMode: "AND" | "OR";
  isActive: boolean;
  sortOrder: string;
};

type FormErrors = Partial<Record<keyof FeaturedSearchFormState, string>>;

function createEmptyForm(): FeaturedSearchFormState {
  return {
    title: "",
    message: "",
    ctaLabel: "Consulter les offres",
    keywordsInput: "",
    booleanMode: "OR",
    isActive: true,
    sortOrder: "0",
  };
}

function formatQueryPreview(item: FeaturedSearch) {
  return item.query.keywords.join(` ${item.query.booleanMode === "AND" ? "ET" : "OU"} `);
}

function toFormState(item: FeaturedSearch): FeaturedSearchFormState {
  return {
    title: item.title,
    message: item.message,
    ctaLabel: item.ctaLabel,
    keywordsInput: item.query.keywords.join(", "),
    booleanMode: item.query.booleanMode,
    isActive: item.isActive,
    sortOrder: String(item.sortOrder),
  };
}

function validateForm(form: FeaturedSearchFormState) {
  const payload = {
    title: form.title.trim(),
    message: form.message.trim(),
    ctaLabel: form.ctaLabel.trim(),
    query: {
      keywords: parseKeywordInput(form.keywordsInput),
      locations: [],
      booleanMode: form.booleanMode,
    },
    isActive: form.isActive,
    sortOrder: Number.parseInt(form.sortOrder || "0", 10),
  };

  const parsed = featuredSearchPayloadSchema.safeParse(payload);
  if (parsed.success) {
    return {
      payload: parsed.data satisfies FeaturedSearchPayload,
      errors: {} as FormErrors,
    };
  }

  const fieldErrors: FormErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (key === "title" || key === "message" || key === "ctaLabel") {
      fieldErrors[key] ??= issue.message;
    }
    if (key === "query") {
      fieldErrors.keywordsInput ??= issue.message;
    }
    if (key === "sortOrder") {
      fieldErrors.sortOrder ??= issue.message;
    }
  }

  return {
    payload: null,
    errors: fieldErrors,
  };
}

interface AdminFeaturedSearchesSectionProps {
  featuredSearches: FeaturedSearch[];
  isLoading: boolean;
  isSaving: boolean;
  savingId: number | null;
  isDeleting: boolean;
  onRefresh: () => void;
  onCreate: (payload: FeaturedSearchPayload) => Promise<boolean>;
  onUpdate: (id: number, payload: FeaturedSearchPayload) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export function AdminFeaturedSearchesSection({
  featuredSearches,
  isLoading,
  isSaving,
  savingId,
  isDeleting,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}: AdminFeaturedSearchesSectionProps) {
  const [form, setForm] = useState<FeaturedSearchFormState>(createEmptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingItem, setEditingItem] = useState<FeaturedSearch | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FeaturedSearch | null>(null);

  const dialogTitle = editingItem ? "Modifier la recherche" : "Nouvelle recherche";
  const dialogDescription = editingItem
    ? "Ajustez le contenu, l’ordre et le bouton affichés sur la page d’accueil."
    : "Créez une recherche préconfigurée visible sous le moteur principal.";
  const isCurrentSavePending =
    isSaving && (editingItem ? savingId === editingItem.id : savingId === null);

  const sortedItems = useMemo(
    () => [...featuredSearches].sort((left, right) => left.sortOrder - right.sortOrder),
    [featuredSearches]
  );

  const openCreateDialog = () => {
    setForm(createEmptyForm());
    setErrors({});
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: FeaturedSearch) => {
    setForm(toFormState(item));
    setErrors({});
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const result = validateForm(form);
    setErrors(result.errors);
    if (!result.payload) {
      return;
    }

    const success = editingItem
      ? await onUpdate(editingItem.id, result.payload)
      : await onCreate(result.payload);

    if (success) {
      setIsDialogOpen(false);
    }
  };

  return (
    <Card className="gap-0 border-border/60 bg-card py-0">
      <CardHeader className="border-b border-border/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">Recherches mises en avant</CardTitle>
            <CardDescription>
              Cartes éditoriales affichées sur la page d&apos;accueil entre la recherche et
              l&apos;historique.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onRefresh}>
              Actualiser
            </Button>
            <Button type="button" onClick={openCreateDialog}>
              <Plus data-icon="inline-start" />
              Ajouter une recherche
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-5">
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            Chargement des recherches mises en avant...
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            Aucune recherche mise en avant pour l&apos;instant.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className="flex h-full flex-col justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:border-primary/25 hover:bg-muted/30"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.isActive ? "secondary" : "outline"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">Ordre {item.sortOrder}</Badge>
                    <Badge variant="outline">
                      <Search data-icon="inline-start" />
                      {item.query.booleanMode === "AND" ? "Mode ET" : "Mode OU"}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-semibold tracking-tight">{item.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{item.message}</p>
                  </div>

                  <div className="flex flex-col gap-2 text-sm">
                    <p>
                      <span className="font-medium">Bouton:</span> {item.ctaLabel}
                    </p>
                    <p className="text-muted-foreground">{formatQueryPreview(item)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                    <Pencil data-icon="inline-start" />
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 data-icon="inline-start" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setForm(createEmptyForm());
            setErrors({});
            setEditingItem(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-5">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="featured-search-title">Titre</FieldLabel>
                <Input
                  id="featured-search-title"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Salon de l'emploi à SPA"
                />
                {errors.title ? <FieldError>{errors.title}</FieldError> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="featured-search-cta">Label du bouton</FieldLabel>
                <Input
                  id="featured-search-cta"
                  value={form.ctaLabel}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, ctaLabel: event.target.value }))
                  }
                  placeholder="Consulter les offres"
                />
                {errors.ctaLabel ? <FieldError>{errors.ctaLabel}</FieldError> : null}
              </Field>
            </FieldGroup>

            <Field>
              <FieldLabel htmlFor="featured-search-message">Message</FieldLabel>
              <Textarea
                id="featured-search-message"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Le salon aura lieu le 1er avril à SPA. Consultez les offres publiées pour l'événement."
                rows={5}
              />
              <FieldDescription>
                Texte affiché sur la carte. Restez direct et court.
              </FieldDescription>
              {errors.message ? <FieldError>{errors.message}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="featured-search-keywords">Mots-clés</FieldLabel>
              <Textarea
                id="featured-search-keywords"
                value={form.keywordsInput}
                onChange={(event) =>
                  setForm((current) => ({ ...current, keywordsInput: event.target.value }))
                }
                placeholder="SALONSPA, forum emploi, jobday"
                rows={3}
              />
              <FieldDescription>
                Séparez les mots-clés par des virgules ou des retours à la ligne.
              </FieldDescription>
              {errors.keywordsInput ? <FieldError>{errors.keywordsInput}</FieldError> : null}
            </Field>

            <FieldGroup className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px_160px]">
              <Field>
                <FieldLabel htmlFor="featured-search-mode">Mode booléen</FieldLabel>
                <Select
                  value={form.booleanMode}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, booleanMode: value as "AND" | "OR" }))
                  }
                >
                  <SelectTrigger id="featured-search-mode" className="w-full">
                    <SelectValue placeholder="Choisir un mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OR">OU</SelectItem>
                    <SelectItem value="AND">ET</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="featured-search-order">Ordre</FieldLabel>
                <Input
                  id="featured-search-order"
                  type="number"
                  min="0"
                  max="999"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                />
                {errors.sortOrder ? <FieldError>{errors.sortOrder}</FieldError> : null}
              </Field>

              <Field className="justify-end">
                <FieldLabel htmlFor="featured-search-active">Statut</FieldLabel>
                <label
                  htmlFor="featured-search-active"
                  className="flex min-h-9 items-center gap-3 rounded-md border border-border/60 px-3"
                >
                  <Checkbox
                    id="featured-search-active"
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({ ...current, isActive: checked === true }))
                    }
                  />
                  <span className="text-sm">{form.isActive ? "Visible" : "Masquée"}</span>
                </label>
              </Field>
            </FieldGroup>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isCurrentSavePending}>
              {isCurrentSavePending ? (
                <LoaderCircle data-icon="inline-start" className="animate-spin" />
              ) : null}
              {editingItem ? "Enregistrer" : "Créer la recherche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CoachConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Supprimer cette recherche ?"
        description={
          deleteTarget
            ? `La recherche "${deleteTarget.title}" sera retirée de l'administration et de la page d'accueil.`
            : "Cette recherche sera supprimée."
        }
        confirmLabel="Supprimer"
        isPending={isDeleting}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void onDelete(deleteTarget.id).then((success) => {
            if (success) {
              setDeleteTarget(null);
            }
          });
        }}
      />
    </Card>
  );
}

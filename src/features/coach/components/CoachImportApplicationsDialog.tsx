"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { Download, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const IMPORT_FIELDS = [
  { key: "company", label: "Entreprise", required: true },
  { key: "contractType", label: "Type de contrat", required: false },
  { key: "title", label: "Intitulé de poste", required: true },
  { key: "location", label: "Lieu", required: false },
  { key: "appliedAt", label: "Date d'envoi", required: false },
  { key: "status", label: "Statut", required: false },
  { key: "notes", label: "Note", required: false },
] as const;

const STATUS_OPTIONS = [
  { value: "in_progress", label: "En cours" },
  { value: "follow_up", label: "Relance à faire" },
  { value: "interview", label: "Entretien" },
  { value: "accepted", label: "Acceptée" },
  { value: "rejected", label: "Refusée" },
] as const;

type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

type CsvRecord = Record<string, string>;

interface CoachImportApplicationsDialogProps {
  open: boolean;
  userLabel: string;
  isImporting: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: Array<Record<ImportFieldKey, string>>) => Promise<{
    importedCount: number;
    createdCount: number;
    updatedCount: number;
    ignoredCount: number;
  } | null>;
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function detectFieldMapping(headers: string[]) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  const headerFor = (patterns: string[]) =>
    normalizedHeaders.find((header) => patterns.some((pattern) => header.normalized.includes(pattern)))
      ?.original ?? "";

  return {
    company: headerFor(["entreprise", "societe", "societe"]),
    contractType: headerFor(["contrat", "type de contrat", "type contrat"]),
    title: headerFor(["intitule poste", "intituler poste", "poste", "fonction", "intitule"]),
    location: headerFor(["lieu", "ville", "localisation"]),
    appliedAt: headerFor(["date envoi", "date envois", "date candidature", "date"]),
    status: headerFor(["statut", "status"]),
    notes: headerFor(["note", "remarque", "commentaire"]),
  } satisfies Record<ImportFieldKey, string>;
}

function normalizeStatusValue(value?: string) {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "en cours":
    case "encours":
    case "in progress":
      return "in_progress";
    case "relance":
    case "a relancer":
    case "à relancer":
    case "suivi":
      return "follow_up";
    case "entretien":
    case "interview":
      return "interview";
    case "refuse":
    case "refusé":
    case "refusee":
    case "refusée":
    case "rejetee":
    case "rejetée":
      return "rejected";
    case "accepte":
    case "accepté":
    case "acceptee":
    case "acceptée":
      return "accepted";
    default:
      return "";
  }
}

export function CoachImportApplicationsDialog({
  open,
  userLabel,
  isImporting,
  onOpenChange,
  onImport,
}: CoachImportApplicationsDialogProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRecord[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<ImportFieldKey, string>>({
    company: "",
    contractType: "",
    title: "",
    location: "",
    appliedAt: "",
    status: "",
    notes: "",
  });
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<{
    importedCount: number;
    createdCount: number;
    updatedCount: number;
    ignoredCount: number;
  } | null>(null);

  const hasRequiredMapping = mapping.company && mapping.title;

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);
  const duplicateCount = useMemo(() => {
    const seen = new Set<string>();
    let duplicates = 0;

    for (const row of rows) {
      const company = (row[mapping.company] ?? "").trim().toLowerCase();
      const title = (row[mapping.title] ?? "").trim().toLowerCase();
      const appliedAt = mapping.appliedAt ? (row[mapping.appliedAt] ?? "").trim().toLowerCase() : "";
      if (!company || !title) continue;

      const fingerprint = `${company}|${title}|${appliedAt}`;
      if (seen.has(fingerprint)) {
        duplicates += 1;
      } else {
        seen.add(fingerprint);
      }
    }

    return duplicates;
  }, [mapping.appliedAt, mapping.company, mapping.title, rows]);
  const unresolvedStatuses = useMemo(() => {
    if (!mapping.status) {
      return [];
    }

    const seen = new Set<string>();
    return rows
      .map((row) => (row[mapping.status] ?? "").trim())
      .filter((status) => {
        if (!status) return false;
        if (normalizeStatusValue(status)) return false;
        if (seen.has(status)) return false;
        seen.add(status);
        return true;
      });
  }, [mapping.status, rows]);

  const resetState = (preserveSummary = false) => {
    setHeaders([]);
    setRows([]);
    setFeedback(null);
    setMapping({
      company: "",
      contractType: "",
      title: "",
      location: "",
      appliedAt: "",
      status: "",
      notes: "",
    });
    setStatusOverrides({});
    if (!preserveSummary) {
      setSummary(null);
    }
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse([
      {
        Entreprise: "TB IMMO",
        "Type de contrat": "Stage",
        "Intitulé de poste": "Collaboratrice administrative",
        Lieu: "Bruxelles",
        "Date d'envoi": "13-03-23",
        Statut: "En cours",
        Note: "",
      },
    ]);

    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modele-import-suivi.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setFeedback(null);

    const parsed = await new Promise<Papa.ParseResult<CsvRecord>>((resolve, reject) => {
      Papa.parse<CsvRecord>(file, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject,
      });
    }).catch(() => null);

    if (!parsed) {
      setFeedback("Impossible de lire ce fichier CSV.");
      return;
    }

    const nextHeaders = parsed.meta.fields ?? [];
    const cleanedRows = parsed.data.filter((row) =>
      Object.values(row).some((value) => (value ?? "").toString().trim() !== "")
    );

    if (nextHeaders.length === 0 || cleanedRows.length === 0) {
      setFeedback("Le fichier ne contient aucune ligne exploitable.");
      return;
    }

    setHeaders(nextHeaders);
    setRows(cleanedRows);
    setMapping(detectFieldMapping(nextHeaders));
  };

  const handleImport = async () => {
    if (!hasRequiredMapping) {
      setFeedback("Les colonnes Entreprise et Intitulé de poste sont obligatoires.");
      return;
    }

    if (unresolvedStatuses.some((status) => !statusOverrides[status])) {
      setFeedback("Choisissez un vrai statut pour chaque valeur non reconnue avant l'import.");
      return;
    }

    const mappedRows = rows
      .map((row) => ({
        company: row[mapping.company] ?? "",
        contractType: mapping.contractType ? row[mapping.contractType] ?? "" : "",
        title: row[mapping.title] ?? "",
        location: mapping.location ? row[mapping.location] ?? "" : "",
        appliedAt: mapping.appliedAt ? row[mapping.appliedAt] ?? "" : "",
        status: mapping.status
          ? normalizeStatusValue(row[mapping.status] ?? "") || statusOverrides[(row[mapping.status] ?? "").trim()] || ""
          : "",
        notes: mapping.notes ? row[mapping.notes] ?? "" : "",
      }))
      .filter((row) => row.company.trim() && row.title.trim());

    if (mappedRows.length === 0) {
      setFeedback("Aucune ligne importable après mapping.");
      return;
    }

    const result = await onImport(mappedRows);
    if (result) {
      setSummary(result);
      resetState(true);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetState();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Importer un suivi (CSV)</DialogTitle>
          <DialogDescription>
            Importer un tableau CSV de candidatures pour {userLabel}. Les lignes seront créées comme
            candidatures manuelles.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 pb-4">
          <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/10 px-6 py-8 text-center">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Choisir un fichier CSV</span>
            <span className="text-xs text-muted-foreground">
              Un export Excel enregistré en CSV fonctionne très bien.
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex justify-start">
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger un modèle CSV
            </Button>
          </div>

          {headers.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {IMPORT_FIELDS.map((field) => (
                <label key={field.key} className="space-y-1">
                  <span className="text-sm font-medium">
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={mapping[field.key]}
                    onChange={(event) =>
                      setMapping((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Ne pas importer</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : null}

          {unresolvedStatuses.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-sm font-medium">Statuts à confirmer</p>
              <p className="text-xs text-muted-foreground">
                Certaines valeurs de statut ne sont pas reconnues automatiquement. Choisis leur équivalent avant l&apos;import.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {unresolvedStatuses.map((status) => (
                  <label key={status} className="space-y-1">
                    <span className="text-sm font-medium">{status}</span>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={statusOverrides[status] ?? ""}
                      onChange={(event) =>
                        setStatusOverrides((current) => ({
                          ...current,
                          [status]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Choisir un statut</option>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {rows.length > 0 ? (
            <div className="rounded-xl border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
              <p>
                {rows.length} ligne{rows.length > 1 ? "s" : ""} détectée{rows.length > 1 ? "s" : ""}.
                {duplicateCount > 0
                  ? ` ${duplicateCount} doublon${duplicateCount > 1 ? "s" : ""} interne${duplicateCount > 1 ? "s" : ""} sera${duplicateCount > 1 ? "ont" : ""} ignoré${duplicateCount > 1 ? "s" : ""}.`
                  : " Aucun doublon interne détecté."}
              </p>
            </div>
          ) : null}

          {previewRows.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Aperçu ({rows.length} lignes détectées)</p>
              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      {headers.map((header) => (
                        <th key={header} className="border-b px-3 py-2 text-left font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, index) => (
                      <tr key={`${index}-${row[headers[0]] ?? "row"}`}>
                        {headers.map((header) => (
                          <td key={header} className="border-b px-3 py-2 align-top text-muted-foreground">
                            {row[header] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {summary ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">
              <p className="font-medium text-foreground">Dernier import terminé</p>
              <p className="text-muted-foreground">
                {summary.createdCount} créée{summary.createdCount > 1 ? "s" : ""} • {summary.updatedCount} mise
                {summary.updatedCount > 1 ? "s" : ""} à jour • {summary.ignoredCount} ignorée
                {summary.ignoredCount > 1 ? "s" : ""}.
              </p>
            </div>
          ) : null}

            {feedback ? <p className="text-sm text-destructive">{feedback}</p> : null}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void handleImport()} disabled={!rows.length || isImporting}>
            {isImporting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Importer le suivi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

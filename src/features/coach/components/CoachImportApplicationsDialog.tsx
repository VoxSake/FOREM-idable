"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { LoaderCircle, Upload } from "lucide-react";
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
  { key: "title", label: "Intitulé du poste", required: true },
  { key: "appliedAt", label: "Date d'envoi", required: false },
  { key: "status", label: "Statut", required: false },
  { key: "notes", label: "Note", required: false },
] as const;

type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

type CsvRecord = Record<string, string>;

interface CoachImportApplicationsDialogProps {
  open: boolean;
  userLabel: string;
  isImporting: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: Array<Record<ImportFieldKey, string>>) => Promise<void>;
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
    appliedAt: headerFor(["date envoi", "date envois", "date candidature", "date"]),
    status: headerFor(["statut", "status"]),
    notes: headerFor(["note", "remarque", "commentaire"]),
  } satisfies Record<ImportFieldKey, string>;
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
    appliedAt: "",
    status: "",
    notes: "",
  });

  const hasRequiredMapping = mapping.company && mapping.title;

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);

  const resetState = () => {
    setHeaders([]);
    setRows([]);
    setFeedback(null);
    setMapping({
      company: "",
      contractType: "",
      title: "",
      appliedAt: "",
      status: "",
      notes: "",
    });
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
      setFeedback("Les colonnes Entreprise et Intitulé du poste sont obligatoires.");
      return;
    }

    const mappedRows = rows
      .map((row) => ({
        company: row[mapping.company] ?? "",
        contractType: mapping.contractType ? row[mapping.contractType] ?? "" : "",
        title: row[mapping.title] ?? "",
        appliedAt: mapping.appliedAt ? row[mapping.appliedAt] ?? "" : "",
        status: mapping.status ? row[mapping.status] ?? "" : "",
        notes: mapping.notes ? row[mapping.notes] ?? "" : "",
      }))
      .filter((row) => row.company.trim() && row.title.trim());

    if (mappedRows.length === 0) {
      setFeedback("Aucune ligne importable après mapping.");
      return;
    }

    await onImport(mappedRows);
    resetState();
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importer un suivi (CSV)</DialogTitle>
          <DialogDescription>
            Importer un tableau CSV de candidatures pour {userLabel}. Les lignes seront créées comme
            candidatures manuelles.
          </DialogDescription>
        </DialogHeader>

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

          {feedback ? <p className="text-sm text-destructive">{feedback}</p> : null}
        </div>

        <DialogFooter>
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

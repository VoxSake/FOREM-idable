"use client";

import { addDays, format } from "date-fns";
import { useState } from "react";
import { CalendarDays, FilePenLine, Save, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationsOfferButtons } from "@/features/applications/components/ApplicationsOfferButtons";
import { ApplicationStatusSelect } from "@/features/applications/components/ApplicationStatusSelect";
import {
  applicationStatusLabel,
  formatApplicationDate,
  formatApplicationDateTime,
  getDisplayApplicationStatus,
  isFollowUpEnabled,
  isManualApplication,
  shouldShowFollowUpDetails,
} from "@/features/applications/utils";
import { formatCoachAuthorName, summarizeCoachContributors } from "@/lib/coachNotes";
import { ApplicationStatus, JobApplication } from "@/types/application";

interface ApplicationDetailsSheetProps {
  application: JobApplication | null;
  open: boolean;
  hasUnreadCoachUpdate: boolean;
  notesDraft: string;
  proofsDraft: string;
  onOpenChange: (open: boolean) => void;
  onApplyStatus: (jobId: string, status: ApplicationStatus) => void;
  onNotesDraftChange: (value: string) => void;
  onProofsDraftChange: (value: string) => void;
  onSaveNotes: () => Promise<void>;
  onSaveProofs: () => Promise<void>;
  onSaveManualDetails: (input: {
    company: string;
    title: string;
    contractType: string;
    location: string;
    url: string;
  }) => Promise<boolean>;
  onSaveFollowUpSettings: (input: { enabled: boolean; dueAt: string }) => Promise<boolean>;
  onMarkFollowUpDone: (jobId: string) => void;
  onOpenInterview: (application: JobApplication) => void;
  onRequestDelete: (jobId: string) => void;
}

export function ApplicationDetailsSheet({
  application,
  open,
  hasUnreadCoachUpdate,
  notesDraft,
  proofsDraft,
  onOpenChange,
  onApplyStatus,
  onNotesDraftChange,
  onProofsDraftChange,
  onSaveNotes,
  onSaveProofs,
  onSaveManualDetails,
  onSaveFollowUpSettings,
  onMarkFollowUpDone,
  onOpenInterview,
  onRequestDelete,
}: ApplicationDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[60vw]">
        {application ? (
          <ApplicationDetailsSheetBody
            key={application.job.id}
            application={application}
            hasUnreadCoachUpdate={hasUnreadCoachUpdate}
            notesDraft={notesDraft}
            proofsDraft={proofsDraft}
            onApplyStatus={onApplyStatus}
            onNotesDraftChange={onNotesDraftChange}
            onProofsDraftChange={onProofsDraftChange}
            onSaveNotes={onSaveNotes}
            onSaveProofs={onSaveProofs}
            onSaveManualDetails={onSaveManualDetails}
            onSaveFollowUpSettings={onSaveFollowUpSettings}
            onMarkFollowUpDone={onMarkFollowUpDone}
            onOpenInterview={onOpenInterview}
            onRequestDelete={onRequestDelete}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

interface ApplicationDetailsSheetBodyProps
  extends Omit<ApplicationDetailsSheetProps, "application" | "open" | "onOpenChange"> {
  application: JobApplication;
}

function ApplicationDetailsSheetBody({
  application,
  hasUnreadCoachUpdate,
  notesDraft,
  proofsDraft,
  onApplyStatus,
  onNotesDraftChange,
  onProofsDraftChange,
  onSaveNotes,
  onSaveProofs,
  onSaveManualDetails,
  onSaveFollowUpSettings,
  onMarkFollowUpDone,
  onOpenInterview,
  onRequestDelete,
}: ApplicationDetailsSheetBodyProps) {
  const isManual = isManualApplication(application);
  const followUpEnabled = isFollowUpEnabled(application);
  const displayStatus = getDisplayApplicationStatus(application);
  const defaultFollowUpDate = formatDefaultFollowUpDate(application.appliedAt);
  const initialFollowUpForm = {
    enabled: followUpEnabled,
    dueAt: getEditableFollowUpDate(application.followUpDueAt, defaultFollowUpDate),
  };
  const [isEditingManualDetails, setIsEditingManualDetails] = useState(false);
  const [followUpForm, setFollowUpForm] = useState(initialFollowUpForm);
  const [followUpSaveState, setFollowUpSaveState] = useState<"idle" | "error">("idle");
  const [manualDetailsForm, setManualDetailsForm] = useState(createManualDetailsForm(application));
  const resetManualDetailsForm = () => {
    setManualDetailsForm(createManualDetailsForm(application));
  };

  const saveFollowUpForm = async (nextForm: typeof initialFollowUpForm) => {
    const normalizedForm = {
      enabled: nextForm.enabled,
      dueAt: nextForm.dueAt || defaultFollowUpDate,
    };

    const saved = await onSaveFollowUpSettings(normalizedForm);
    if (saved) {
      setFollowUpForm(normalizedForm);
      setFollowUpSaveState("idle");
      return;
    }

    setFollowUpSaveState("error");
  };

  return (
    <>
      <SheetHeader className="border-b bg-muted/30 p-5 pr-12">
        <SheetTitle>{application.job.title}</SheetTitle>
        <SheetDescription>
          {application.job.company || "Entreprise non précisée"} • {application.job.location}
        </SheetDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline">{application.job.contractType || "Non précisé"}</Badge>
          {isManual ? (
            <Badge variant="secondary">
              Manuelle
            </Badge>
          ) : (
            <Badge variant="secondary">
              Importée
            </Badge>
          )}
          {application.sharedCoachNotes && application.sharedCoachNotes.length > 0 ? (
            <Badge variant="secondary">
              {hasUnreadCoachUpdate ? "Nouveau" : "Retour coach"}
            </Badge>
          ) : null}
          <Badge variant="outline">Envoyée le {formatApplicationDate(application.appliedAt)}</Badge>
          <Badge variant={displayStatus === "follow_up" ? "destructive" : "secondary"}>
            {applicationStatusLabel(displayStatus)}
          </Badge>
          {isManual ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (isEditingManualDetails) {
                  setIsEditingManualDetails(false);
                  resetManualDetailsForm();
                  return;
                }

                setIsEditingManualDetails(true);
              }}
            >
              <FilePenLine data-icon="inline-start" />
              {isEditingManualDetails ? "Annuler" : "Éditer"}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => onRequestDelete(application.job.id)}
          >
            <Trash2 data-icon="inline-start" />
            Supprimer
          </Button>
        </div>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 text-sm">
        <DetailsSection title="Informations de l&apos;offre">
          <OfferDetailsSection
            application={application}
            isManual={isManual}
            isEditingManualDetails={isEditingManualDetails}
            manualDetailsForm={manualDetailsForm}
            onManualDetailsFormChange={setManualDetailsForm}
            onCancelEdit={() => {
              setIsEditingManualDetails(false);
              resetManualDetailsForm();
            }}
            onSave={async () => {
              const saved = await onSaveManualDetails(manualDetailsForm);
              if (saved) {
                setIsEditingManualDetails(false);
              }
            }}
          />
        </DetailsSection>

        <Separator />

        <DetailsSection title="Statut">
          <ApplicationStatusSelect
            value={displayStatus}
            onValueChange={(value) => onApplyStatus(application.job.id, value)}
          />
        </DetailsSection>

        <Separator />

        <DetailsSection title="Relance">
          <FollowUpSection
            application={application}
            followUpForm={followUpForm}
            followUpSaveState={followUpSaveState}
            defaultFollowUpDate={defaultFollowUpDate}
            onFollowUpFormChange={(nextForm) => {
              setFollowUpForm(nextForm);
              setFollowUpSaveState("idle");
            }}
            onSave={saveFollowUpForm}
          />
        </DetailsSection>

        <Separator />

        <DetailsSection title="Entretien">
          <InterviewDetailsSection application={application} />
        </DetailsSection>

        <Separator />

        <DetailsSection title="Notes">
          <EditableTextSection
            value={notesDraft}
            initialValue={application.notes ?? ""}
            minHeightClassName="min-h-40"
            placeholder="Contexte, contact RH, retour, salaire..."
            onChange={onNotesDraftChange}
            onSave={onSaveNotes}
          />
        </DetailsSection>

        <Separator />

        <DetailsSection title="Preuves / références">
          <EditableTextSection
            value={proofsDraft}
            initialValue={application.proofs ?? ""}
            minHeightClassName="min-h-32"
            onChange={onProofsDraftChange}
            onSave={onSaveProofs}
          />
        </DetailsSection>

        {application.sharedCoachNotes && application.sharedCoachNotes.length > 0 ? (
          <>
            <Separator />
            <DetailsSection title="Notes du coach">
              <CoachNotesSection application={application} />
            </DetailsSection>
          </>
        ) : null}
      </div>

      <SheetFooter className="border-t bg-background/95 p-4">
        <div className="flex w-full flex-col gap-2">
          <ApplicationsOfferButtons application={application} layout="sheet" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onMarkFollowUpDone(application.job.id)}
              disabled={application.status === "accepted"}
            >
              Relancer
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpenInterview(application)}
              disabled={application.status === "accepted" || application.status === "rejected"}
            >
              <CalendarDays data-icon="inline-start" />
              Entretien
            </Button>
          </div>
        </div>
      </SheetFooter>
    </>
  );
}

function DetailsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-medium">{title}</h3>
      {children}
    </section>
  );
}

function OfferDetailsSection({
  application,
  isManual,
  isEditingManualDetails,
  manualDetailsForm,
  onManualDetailsFormChange,
  onCancelEdit,
  onSave,
}: {
  application: JobApplication;
  isManual: boolean;
  isEditingManualDetails: boolean;
  manualDetailsForm: {
    company: string;
    title: string;
    contractType: string;
    location: string;
    url: string;
  };
  onManualDetailsFormChange: React.Dispatch<
    React.SetStateAction<{
      company: string;
      title: string;
      contractType: string;
      location: string;
      url: string;
    }>
  >;
  onCancelEdit: () => void;
  onSave: () => Promise<void>;
}) {
  if (isManual && isEditingManualDetails) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
        <FieldGroup className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sheet-manual-company">Entreprise</FieldLabel>
            <Input
              id="sheet-manual-company"
              value={manualDetailsForm.company}
              onChange={(event) =>
                onManualDetailsFormChange((current) => ({
                  ...current,
                  company: event.target.value,
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sheet-manual-contract-type">Type</FieldLabel>
            <Input
              id="sheet-manual-contract-type"
              value={manualDetailsForm.contractType}
              onChange={(event) =>
                onManualDetailsFormChange((current) => ({
                  ...current,
                  contractType: event.target.value,
                }))
              }
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="sheet-manual-title">Intitulé</FieldLabel>
            <Input
              id="sheet-manual-title"
              value={manualDetailsForm.title}
              onChange={(event) =>
                onManualDetailsFormChange((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sheet-manual-location">Lieu</FieldLabel>
            <Input
              id="sheet-manual-location"
              value={manualDetailsForm.location}
              onChange={(event) =>
                onManualDetailsFormChange((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sheet-manual-url">Lien de l&apos;offre</FieldLabel>
            <Input
              id="sheet-manual-url"
              value={manualDetailsForm.url}
              onChange={(event) =>
                onManualDetailsFormChange((current) => ({
                  ...current,
                  url: event.target.value,
                }))
              }
              placeholder="https://..."
            />
          </Field>
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void onSave()}
            disabled={!manualDetailsForm.company.trim() || !manualDetailsForm.title.trim()}
          >
            <Save data-icon="inline-start" />
            Enregistrer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
      <p>{application.job.company || "Entreprise non précisée"}</p>
      <p className="font-medium text-foreground">{application.job.title}</p>
      <p>{application.job.location || "Non précisé"}</p>
      <p>Type: {application.job.contractType || "Non précisé"}</p>
      <p className="break-all">
        Lien: {application.job.url && application.job.url !== "#" ? application.job.url : "Aucun"}
      </p>
    </div>
  );
}

function FollowUpSection({
  application,
  followUpForm,
  followUpSaveState,
  defaultFollowUpDate,
  onFollowUpFormChange,
  onSave,
}: {
  application: JobApplication;
  followUpForm: {
    enabled: boolean;
    dueAt: string;
  };
  followUpSaveState: "idle" | "error";
  defaultFollowUpDate: string;
  onFollowUpFormChange: (nextForm: { enabled: boolean; dueAt: string }) => void;
  onSave: (nextForm: { enabled: boolean; dueAt: string }) => Promise<void>;
}) {
  if (!shouldShowFollowUpDetails(application.status)) {
    return (
      <p className="text-muted-foreground">
        Aucune relance automatique sur une candidature clôturée.
      </p>
    );
  }

  return (
    <FieldGroup className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <Field>
        <FieldLabel htmlFor="sheet-follow-up-date">
          {followUpForm.enabled ? "Relance active" : "Relance désactivée"}
        </FieldLabel>
        <Input
          id="sheet-follow-up-date"
          type="date"
          value={followUpForm.dueAt}
          onChange={(event) =>
            onFollowUpFormChange({
              ...followUpForm,
              dueAt: event.target.value,
            })
          }
        />
        <FieldDescription>
          {followUpForm.enabled
            ? `Prochaine relance: ${formatApplicationDate(followUpForm.dueAt)}`
            : "Relance désactivée pour cette candidature."}
        </FieldDescription>
      </Field>
      <div className="flex flex-col gap-1 text-muted-foreground">
        {application.lastFollowUpAt ? (
          <p>Dernière relance: {formatApplicationDate(application.lastFollowUpAt)}</p>
        ) : null}
        {followUpSaveState === "error" ? (
          <Alert variant="destructive">
            <AlertTitle>Relance</AlertTitle>
            <AlertDescription>Impossible d&apos;enregistrer la relance.</AlertDescription>
          </Alert>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onFollowUpFormChange({
              ...followUpForm,
              dueAt: defaultFollowUpDate,
            })
          }
          disabled={followUpForm.dueAt === defaultFollowUpDate}
        >
          Remettre à J+7
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void onSave({
              enabled: !followUpForm.enabled,
              dueAt: followUpForm.dueAt || defaultFollowUpDate,
            })
          }
        >
          {followUpForm.enabled ? "Désactiver la relance" : "Activer la relance"}
        </Button>
        <Button
          type="button"
          onClick={() =>
            void onSave({
              enabled: true,
              dueAt: followUpForm.dueAt || defaultFollowUpDate,
            })
          }
          disabled={!followUpForm.dueAt}
        >
          <Save data-icon="inline-start" />
          Mettre à jour la relance
        </Button>
      </div>
    </FieldGroup>
  );
}

function InterviewDetailsSection({ application }: { application: JobApplication }) {
  return (
    <>
      <p className="text-muted-foreground">
        {application.interviewAt
          ? formatApplicationDateTime(application.interviewAt ?? undefined)
          : "Aucun entretien planifié"}
      </p>
      {application.interviewDetails ? (
        <p className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
          {application.interviewDetails}
        </p>
      ) : null}
    </>
  );
}

function EditableTextSection({
  value,
  initialValue,
  minHeightClassName,
  placeholder,
  onChange,
  onSave,
}: {
  value: string;
  initialValue: string;
  minHeightClassName: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <>
      <Textarea
        className={minHeightClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={() => void onSave()}
          disabled={value === initialValue}
        >
          <Save data-icon="inline-start" />
          Enregistrer
        </Button>
      </div>
    </>
  );
}

function CoachNotesSection({ application }: { application: JobApplication }) {
  return (
    <>
      {application.sharedCoachNotes?.map((note) => (
        <div
          key={note.id}
          className="rounded-md border border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground"
        >
          <div className="flex flex-col gap-1 text-xs">
            <p>
              Rédigée par {formatCoachAuthorName(note.createdBy)} •{" "}
              {formatApplicationDateTime(note.updatedAt)}
            </p>
            {note.contributors.length > 1 ? (
              <p>Contributions: {summarizeCoachContributors(note.contributors)}</p>
            ) : null}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm">{note.content}</p>
        </div>
      ))}
    </>
  );
}

function formatDefaultFollowUpDate(appliedAt: string) {
  const baseDate = new Date(appliedAt);
  const normalizedDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;

  return format(addDays(normalizedDate, 7), "yyyy-MM-dd");
}

function getEditableFollowUpDate(followUpDueAt: string | undefined, fallbackDate: string) {
  if (!followUpDueAt) {
    return fallbackDate;
  }

  const followUpDate = new Date(followUpDueAt);
  if (Number.isNaN(followUpDate.getTime())) {
    return fallbackDate;
  }

  return format(followUpDate, "yyyy-MM-dd");
}

function createManualDetailsForm(application: JobApplication) {
  return {
    company: application.job.company || "",
    title: application.job.title,
    contractType: application.job.contractType || "",
    location: application.job.location || "",
    url: isManualApplication(application) ? "" : application.job.url,
  };
}

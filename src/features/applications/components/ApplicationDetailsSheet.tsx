"use client";

import { addDays, format } from "date-fns";
import { useState } from "react";
import { CalendarDays, FilePenLine, Save, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { ApplicationsOfferButtons } from "@/features/applications/components/ApplicationsOfferButtons";
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
  const [manualDetailsForm, setManualDetailsForm] = useState({
    company: application.job.company || "",
    title: application.job.title,
    contractType: application.job.contractType || "",
    location: application.job.location || "",
    url: application.job.url === "#" ? "" : application.job.url,
  });

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
          <ContractTypeBadge contractType={application.job.contractType || "N/A"} />
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
                  setManualDetailsForm({
                    company: application.job.company || "",
                    title: application.job.title,
                    contractType: application.job.contractType || "",
                    location: application.job.location || "",
                    url: application.job.url === "#" ? "" : application.job.url,
                  });
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
        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Informations de l&apos;offre</h3>
          {isManual && isEditingManualDetails ? (
            <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Entreprise</span>
                <Input
                  value={manualDetailsForm.company}
                  onChange={(event) =>
                    setManualDetailsForm((current) => ({
                      ...current,
                      company: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Type</span>
                <Input
                  value={manualDetailsForm.contractType}
                  onChange={(event) =>
                    setManualDetailsForm((current) => ({
                      ...current,
                      contractType: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Intitulé</span>
                <Input
                  value={manualDetailsForm.title}
                  onChange={(event) =>
                    setManualDetailsForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Lieu</span>
                <Input
                  value={manualDetailsForm.location}
                  onChange={(event) =>
                    setManualDetailsForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Lien de l&apos;offre</span>
                <Input
                  value={manualDetailsForm.url}
                  onChange={(event) =>
                    setManualDetailsForm((current) => ({
                      ...current,
                      url: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingManualDetails(false);
                    setManualDetailsForm({
                      company: application.job.company || "",
                      title: application.job.title,
                      contractType: application.job.contractType || "",
                      location: application.job.location || "",
                      url: application.job.url === "#" ? "" : application.job.url,
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    const saved = await onSaveManualDetails(manualDetailsForm);
                    if (saved) {
                      setIsEditingManualDetails(false);
                    }
                  }}
                  disabled={!manualDetailsForm.company.trim() || !manualDetailsForm.title.trim()}
                >
                  <Save data-icon="inline-start" />
                  Enregistrer
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
              <p>{application.job.company || "Entreprise non précisée"}</p>
              <p className="font-medium text-foreground">{application.job.title}</p>
              <p>{application.job.location || "Non précisé"}</p>
              <p>Type: {application.job.contractType || "Non précisé"}</p>
              <p className="break-all">
                Lien: {application.job.url && application.job.url !== "#" ? application.job.url : "Aucun"}
              </p>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Statut</h3>
          <Select
            value={displayStatus}
            onValueChange={(value) => onApplyStatus(application.job.id, value as ApplicationStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="follow_up">Relance à faire</SelectItem>
                <SelectItem value="interview">Entretien</SelectItem>
                <SelectItem value="accepted">Acceptée</SelectItem>
                <SelectItem value="rejected">Refusée</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Relance</h3>
          {shouldShowFollowUpDetails(application.status) ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="font-medium text-foreground">
                {followUpForm.enabled ? "Relance active" : "Relance desactivee"}
              </p>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Date de relance</span>
                <Input
                  type="date"
                  value={followUpForm.dueAt}
                  onChange={(event) => {
                    setFollowUpForm((current) => ({
                      ...current,
                      dueAt: event.target.value,
                    }));
                    setFollowUpSaveState("idle");
                  }}
                />
              </label>
              <div className="flex flex-col gap-1 text-muted-foreground">
                {followUpForm.enabled ? (
                  <p>Prochaine relance: {formatApplicationDate(followUpForm.dueAt)}</p>
                ) : (
                  <p>Relance désactivée pour cette candidature.</p>
                )}
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
                  onClick={() => {
                    setFollowUpForm((current) => ({
                      ...current,
                      dueAt: defaultFollowUpDate,
                    }));
                    setFollowUpSaveState("idle");
                  }}
                  disabled={followUpForm.dueAt === defaultFollowUpDate}
                >
                  Remettre a J+7
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void saveFollowUpForm({
                      enabled: !followUpForm.enabled,
                      dueAt: followUpForm.dueAt || defaultFollowUpDate,
                    })
                  }
                >
                  {followUpForm.enabled ? "Desactiver la relance" : "Activer la relance"}
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    void saveFollowUpForm({
                      enabled: true,
                      dueAt: followUpForm.dueAt || defaultFollowUpDate,
                    })
                  }
                  disabled={!followUpForm.dueAt}
                >
                  <Save data-icon="inline-start" />
                  Mettre a jour la relance
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Aucune relance automatique sur une candidature clôturée.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Entretien</h3>
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
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Notes</h3>
          <Textarea
            className="min-h-40"
            value={notesDraft}
            onChange={(event) => onNotesDraftChange(event.target.value)}
            placeholder="Contexte, contact RH, retour, salaire..."
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => void onSaveNotes()}
              disabled={notesDraft === (application.notes ?? "")}
            >
              <Save data-icon="inline-start" />
              Enregistrer
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-medium">Preuves / références</h3>
          <Textarea
            className="min-h-32"
            value={proofsDraft}
            onChange={(event) => onProofsDraftChange(event.target.value)}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => void onSaveProofs()}
              disabled={proofsDraft === (application.proofs ?? "")}
            >
              <Save data-icon="inline-start" />
              Enregistrer
            </Button>
          </div>
        </section>

        {application.sharedCoachNotes && application.sharedCoachNotes.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h3 className="font-medium">Notes du coach</h3>
              {application.sharedCoachNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-md border border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground"
                >
                  <div className="space-y-1 text-xs">
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
          </section>
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

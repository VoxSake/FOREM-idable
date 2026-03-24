"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BriefcaseBusiness,
  ChevronLeft,
  EllipsisVertical,
  ExternalLink,
  FileText,
  LoaderCircle,
  MessageSquareDashed,
  MessagesSquare,
  Send,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { ConversationAvatar, ParticipantStack } from "@/features/messages/components/MessagesPrimitives";
import { getDisplayName, getInitials } from "@/features/messages/messages.utils";
import { cn } from "@/lib/utils";
import { Job } from "@/types/job";
import { ConversationDetail, ConversationMessage, ConversationPreview } from "@/types/messaging";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function SharedJobCard({
  job,
  isTracked,
  onTrack,
}: {
  job: Job;
  isTracked: boolean;
  onTrack: (job: Job) => void;
}) {
  const pdfUrl = getJobPdfUrl(job);

  return (
    <div className="mt-4 rounded-2xl border border-border/70 bg-background/95 p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <BriefcaseBusiness className="size-4" />
              Offre Forem
            </div>
            <p className="mt-2 text-base font-semibold leading-snug break-words">
              {job.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground break-words">
              {job.company || "Entreprise non précisée"} • {job.location}
            </p>
          </div>
          <div className="self-start">
            <ContractTypeBadge contractType={job.contractType} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">FOREM</Badge>
          <span>
            Publiée le{" "}
            {format(new Date(job.publicationDate), "dd/MM/yyyy", {
              locale: fr,
            })}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button size="sm" asChild>
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink data-icon="inline-start" />
              Ouvrir l&apos;offre
            </a>
          </Button>
          <Button
            size="sm"
            variant={isTracked ? "secondary" : "outline"}
            disabled={isTracked}
            onClick={() => onTrack(job)}
          >
            <Send data-icon="inline-start" />
            {isTracked ? "Déjà dans le suivi" : "Ajouter au suivi"}
          </Button>
          {pdfUrl ? (
            <Button size="sm" variant="outline" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText data-icon="inline-start" />
                PDF
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  canModerateMessages,
  trackedJobIds,
  onTrackJob,
  onDeleteMessage,
}: {
  message: ConversationMessage;
  canModerateMessages: boolean;
  trackedJobIds: string[];
  onTrackJob: (job: Job) => void;
  onDeleteMessage: (message: ConversationMessage) => void;
}) {
  const displayName = message.author
    ? getDisplayName({
        firstName: message.author.firstName,
        lastName: message.author.lastName,
        email: message.author.email,
        fallback: "Message",
      })
    : "Système";
  const sharedJob =
    message.type === "job_share" && message.metadata.sharedJob
      ? message.metadata.sharedJob
      : null;
  const isTracked = sharedJob ? trackedJobIds.includes(sharedJob.id) : false;

  return (
    <div
      className={cn(
        "flex gap-3",
        message.isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {!message.isOwnMessage ? (
        <Avatar className="mt-1 border border-border/70 bg-background">
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      ) : null}

      <div
        className={cn(
          "min-w-0 max-w-[92%] rounded-3xl border px-4 py-4 shadow-sm lg:max-w-[78%]",
          message.isOwnMessage
            ? "border-primary/25 bg-primary/10"
            : "border-border/60 bg-background"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium break-words">{displayName}</p>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), "dd/MM/yyyy HH:mm", {
              locale: fr,
            })}
          </span>
          {message.editedAt ? <Badge variant="outline">modifié</Badge> : null}
          {(message.isOwnMessage || canModerateMessages) && !message.deletedAt ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-8"
                >
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteMessage(message)}
                >
                  {message.isOwnMessage && !canModerateMessages
                    ? "Supprimer pour moi"
                    : "Supprimer le message"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {message.deletedAt ? (
          <p className="mt-3 text-sm italic text-muted-foreground">
            Message supprimé par l&apos;équipe d&apos;encadrement.
          </p>
        ) : message.content ? (
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : null}

        {sharedJob ? (
          <SharedJobCard
            job={sharedJob}
            isTracked={isTracked}
            onTrack={onTrackJob}
          />
        ) : null}
      </div>
    </div>
  );
}

function MessageComposer({
  conversation,
  draft,
  isSending,
  onDraftChange,
  onSend,
  inputId,
}: {
  conversation: ConversationDetail;
  draft: string;
  isSending: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  inputId: string;
}) {
  return (
    <div className="border-t border-border/60 bg-background/85 px-4 py-4 backdrop-blur">
      <FieldGroup>
        <Field>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <FieldLabel htmlFor={inputId}>Nouveau message</FieldLabel>
            <p className="text-[11px] text-muted-foreground">
              Entrée envoie, Shift + Entrée ajoute une ligne
            </p>
          </div>
          <Textarea
            id={inputId}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Écris un message utile, clair et actionnable..."
            className="mt-2 min-h-20 resize-none"
          />
          {conversation.canModerateMessages && conversation.type === "group" ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              `/clean` efface tout l&apos;historique de ce groupe.
            </p>
          ) : null}
        </Field>
      </FieldGroup>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isSending || !draft.trim()}
          onClick={onSend}
        >
          {isSending ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Send data-icon="inline-start" />
          )}
          Envoyer
        </Button>
      </div>
    </div>
  );
}

export function ConversationPanel({
  selectedPreview,
  selectedConversation,
  error,
  isConversationLoading,
  isClosingDirectConversation,
  trackedJobIds,
  draft,
  isSending,
  isMobile,
  onBack,
  onCloseDirectConversation,
  onTrackJob,
  onDeleteMessage,
  onDraftChange,
  onSend,
  threadBottomRef,
  threadScrollAreaRef,
}: {
  selectedPreview: ConversationPreview | null;
  selectedConversation: ConversationDetail | null;
  error: string | null;
  isConversationLoading: boolean;
  isClosingDirectConversation: boolean;
  trackedJobIds: string[];
  draft: string;
  isSending: boolean;
  isMobile?: boolean;
  onBack?: () => void;
  onCloseDirectConversation: () => void;
  onTrackJob: (job: Job) => void;
  onDeleteMessage: (message: ConversationMessage) => void;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  threadBottomRef: React.RefObject<HTMLDivElement | null>;
  threadScrollAreaRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!selectedPreview) {
    return (
      <Card className="overflow-hidden border-border/60 py-0">
        <CardContent className="px-6 py-10">
          <Empty className="min-h-[420px] rounded-2xl border border-dashed border-border/60 bg-muted/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessagesSquare />
              </EmptyMedia>
              <EmptyTitle>Sélectionne une conversation.</EmptyTitle>
              <EmptyDescription>
                Ouvre un groupe ou démarre un DM pour afficher le fil des messages.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/60 py-0 md:flex md:h-full md:flex-col">
      <CardHeader className="gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {isMobile && onBack ? (
              <Button type="button" variant="ghost" size="icon" onClick={onBack}>
                <ChevronLeft />
              </Button>
            ) : null}
            <ConversationAvatar conversation={selectedPreview} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div>
                <CardTitle className="break-words text-xl">
                  {selectedPreview.title}
                </CardTitle>
                {selectedConversation?.subtitle ? (
                  <CardDescription>{selectedConversation.subtitle}</CardDescription>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedConversation ? (
                  <>
                    <Badge variant="outline">
                      {selectedConversation.type === "group" ? "Groupe" : "Privé"}
                    </Badge>
                    <Badge variant="outline">
                      {selectedConversation.participantCount} participant
                      {selectedConversation.participantCount > 1 ? "s" : ""}
                    </Badge>
                    <ParticipantStack participants={selectedConversation.participants} />
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Historique synchronisé automatiquement
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {selectedPreview.type === "direct" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isClosingDirectConversation}
              onClick={onCloseDirectConversation}
            >
              <X data-icon="inline-start" />
              Fermer le DM
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4">
        {error ? (
          <Empty className="min-h-72 rounded-2xl border border-dashed border-border/60 bg-muted/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareDashed />
              </EmptyMedia>
              <EmptyTitle>Conversation indisponible.</EmptyTitle>
              <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : isConversationLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className={cn(
                  "h-24 rounded-3xl",
                  index % 2 === 0 ? "w-3/4" : "ml-auto w-2/3"
                )}
              />
            ))}
          </div>
        ) : selectedConversation ? (
          <div className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] border border-border/60 bg-muted/10">
            <ScrollArea
              ref={threadScrollAreaRef}
              className="min-h-[220px] flex-1 px-3 py-3 sm:px-4 sm:py-4"
            >
              {selectedConversation.messages.length === 0 ? (
                <Empty className="min-h-[320px] rounded-2xl border border-dashed border-border/60 bg-background/75">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessagesSquare />
                    </EmptyMedia>
                    <EmptyTitle>Aucun message pour l&apos;instant.</EmptyTitle>
                    <EmptyDescription>
                      Lance la conversation avec un premier message clair et utile.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex flex-col gap-4 pb-1">
                  {selectedConversation.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      canModerateMessages={selectedConversation.canModerateMessages}
                      trackedJobIds={trackedJobIds}
                      onTrackJob={onTrackJob}
                      onDeleteMessage={onDeleteMessage}
                    />
                  ))}
                  <div ref={threadBottomRef} />
                </div>
              )}
            </ScrollArea>

            <MessageComposer
              conversation={selectedConversation}
              draft={draft}
              isSending={isSending}
              onDraftChange={onDraftChange}
              onSend={onSend}
              inputId={isMobile ? "message-compose-mobile" : "message-compose"}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

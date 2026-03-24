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
  isMobile,
}: {
  message: ConversationMessage;
  canModerateMessages: boolean;
  trackedJobIds: string[];
  onTrackJob: (job: Job) => void;
  onDeleteMessage: (message: ConversationMessage) => void;
  isMobile?: boolean;
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
        isMobile && "gap-2",
        message.isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {!message.isOwnMessage ? (
        <Avatar
          className={cn(
            "mt-1 border border-border/70 bg-background",
            isMobile && "size-8"
          )}
        >
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      ) : null}

      <div
        className={cn(
          "min-w-0 max-w-[92%] rounded-3xl border px-4 py-4 shadow-sm lg:max-w-[78%]",
          isMobile && "max-w-[96%] rounded-[1.6rem] px-3.5 py-3",
          message.isOwnMessage
            ? "border-primary/25 bg-primary/10"
            : "border-border/60 bg-background"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {!message.isOwnMessage || !isMobile ? (
            <p className="font-medium break-words">{displayName}</p>
          ) : null}
          <span className={cn("text-xs text-muted-foreground", isMobile && "text-[11px]")}>
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
          <p className={cn("mt-3 text-sm italic text-muted-foreground", isMobile && "mt-2")}>
            Message supprimé par l&apos;équipe d&apos;encadrement.
          </p>
        ) : message.content ? (
          <p
            className={cn(
              "mt-3 text-sm leading-relaxed whitespace-pre-wrap",
              isMobile && "mt-2 text-[0.95rem] leading-6"
            )}
          >
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
  draft,
  isSending,
  onDraftChange,
  onSend,
  inputId,
  isMobile,
}: {
  draft: string;
  isSending: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  inputId: string;
  isMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-t border-border/60 bg-background/85 px-4 py-4 backdrop-blur",
        isMobile && "px-3 pb-[calc(env(safe-area-inset-bottom)+0.8rem)] pt-2.5"
      )}
    >
      <FieldGroup>
        <Field>
          {!isMobile ? (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <FieldLabel htmlFor={inputId}>Nouveau message</FieldLabel>
              <p className="text-[11px] text-muted-foreground">
                Entrée pour envoyer, Shift + Entrée pour une ligne
              </p>
            </div>
          ) : (
            <FieldLabel htmlFor={inputId} className="sr-only">
              Nouveau message
            </FieldLabel>
          )}
          <div
            className={cn(
              !isMobile && "mt-2",
              isMobile && "flex items-end gap-2 rounded-[1.6rem] border border-border/70 bg-background px-2.5 py-2 shadow-sm"
            )}
          >
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
              placeholder={
                isMobile
                  ? "Message"
                  : "Écrire un message"
              }
              className={cn(
                "resize-none",
                isMobile
                  ? "min-h-0 border-0 bg-transparent px-1 py-1 text-[0.95rem] leading-6 shadow-none focus-visible:ring-0"
                  : "min-h-20"
              )}
              rows={isMobile ? 1 : 4}
            />
            {isMobile ? (
              <Button
                type="button"
                size="icon"
                className="mb-0.5 size-10 shrink-0 rounded-full"
                disabled={isSending || !draft.trim()}
                onClick={onSend}
                aria-label="Envoyer le message"
              >
                {isSending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Send />
                )}
              </Button>
            ) : null}
          </div>
        </Field>
      </FieldGroup>

      {!isMobile ? (
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
      ) : null}
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
                Choisis une conversation pour voir les messages.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/60 py-0 md:flex md:h-full md:flex-col",
        isMobile &&
          "fixed inset-x-0 top-14 z-20 flex h-[calc(100svh-3.5rem)] flex-col rounded-none border-x-0 border-y-0 shadow-none"
      )}
    >
      <CardHeader
        className={cn(
          "gap-2.5 border-b border-border/60 px-4 py-3.5 sm:px-5",
          isMobile && "sticky top-0 z-10 gap-1.5 bg-background/95 px-2.5 py-2 backdrop-blur"
        )}
      >
        <div className={cn("flex flex-wrap items-start justify-between gap-3", isMobile && "gap-2")}>
          <div className={cn("flex min-w-0 flex-1 items-center gap-2.5", isMobile && "gap-2")}>
            {isMobile && onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Retour aux conversations"
                onClick={onBack}
                className="-ml-1 size-8 shrink-0"
              >
                <ChevronLeft />
              </Button>
            ) : null}
            <ConversationAvatar conversation={selectedPreview} size={isMobile ? "sm" : "lg"} />
            <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", isMobile && "gap-0.5")}>
              <div className="min-w-0">
                <CardTitle
                  className={cn(
                    "break-words text-xl",
                    isMobile && "truncate text-sm leading-tight font-semibold"
                  )}
                >
                  {selectedPreview.title}
                </CardTitle>
                {selectedConversation?.subtitle ? (
                  <CardDescription className={cn(isMobile && "truncate text-[11px] leading-tight")}>
                    {selectedConversation.subtitle}
                  </CardDescription>
                ) : null}
              </div>

              {!isMobile && selectedConversation ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {selectedConversation.type === "group" ? "Groupe" : "Privé"}
                  </Badge>
                  <Badge variant="outline">
                    {selectedConversation.participantCount} participant
                    {selectedConversation.participantCount > 1 ? "s" : ""}
                  </Badge>
                  <ParticipantStack
                    participants={selectedConversation.participants}
                    className="ml-1"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {selectedPreview.type === "direct" ? (
            isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0">
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isClosingDirectConversation}
                    onClick={onCloseDirectConversation}
                  >
                    <X data-icon="inline-start" />
                    Fermer le DM
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                disabled={isClosingDirectConversation}
                onClick={onCloseDirectConversation}
              >
                <X data-icon="inline-start" />
                Fermer le DM
              </Button>
            )
          ) : null}
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4",
          isMobile && "px-0 py-0"
        )}
      >
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
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col rounded-[1.75rem] border border-border/60 bg-muted/10",
              isMobile && "rounded-none border-x-0 border-b-0 bg-background"
            )}
          >
            <ScrollArea
              ref={threadScrollAreaRef}
              className={cn(
                "min-h-[220px] flex-1 px-3 py-3 sm:px-4 sm:py-4",
                isMobile && "min-h-0 px-2 py-2"
              )}
            >
              {selectedConversation.messages.length === 0 ? (
                <Empty className="min-h-[320px] rounded-2xl border border-dashed border-border/60 bg-background/75">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessagesSquare />
                    </EmptyMedia>
                    <EmptyTitle>Aucun message pour l&apos;instant.</EmptyTitle>
                    <EmptyDescription>
                      Envoie le premier message.
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
                      isMobile={isMobile}
                    />
                  ))}
                  <div ref={threadBottomRef} />
                </div>
              )}
            </ScrollArea>

            <MessageComposer
              draft={draft}
              isSending={isSending}
              onDraftChange={onDraftChange}
              onSend={onSend}
              inputId={isMobile ? "message-compose-mobile" : "message-compose"}
              isMobile={isMobile}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

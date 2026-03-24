"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
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
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { cn } from "@/lib/utils";
import { JobApplication } from "@/types/application";
import { Job } from "@/types/job";
import {
  ConversationDetail,
  ConversationMessage,
  ConversationParticipantSummary,
  ConversationPreview,
  DirectMessageTarget,
} from "@/types/messaging";

function getDisplayName(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
  fallback: string;
}) {
  const fullName = `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();
  return fullName || input.email || input.fallback;
}

function getInitials(label: string) {
  const chunks = label.trim().split(/\s+/).filter(Boolean);
  if (chunks.length === 0) return "??";
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
  return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
}

function ConversationAvatar({
  conversation,
  size = "default",
}: {
  conversation: Pick<ConversationPreview, "title" | "type">;
  size?: "sm" | "default" | "lg";
}) {
  return (
    <Avatar size={size} className="border border-border/70 bg-background">
      <AvatarFallback
        className={cn(
          conversation.type === "group"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {conversation.type === "group" ? <Users /> : <UserRound />}
      </AvatarFallback>
    </Avatar>
  );
}

function ParticipantStack({
  participants,
}: {
  participants: ConversationParticipantSummary[];
}) {
  const visibleParticipants = participants.slice(0, 3);
  const hiddenCount = Math.max(participants.length - visibleParticipants.length, 0);

  if (participants.length === 0) {
    return null;
  }

  return (
    <AvatarGroup>
      {visibleParticipants.map((participant) => {
        const displayName = getDisplayName({
          firstName: participant.firstName,
          lastName: participant.lastName,
          email: participant.email,
          fallback: "Participant",
        });

        return (
          <Avatar
            key={participant.userId}
            size="sm"
            className="border border-border/70 bg-background"
          >
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        );
      })}
      {hiddenCount > 0 ? <AvatarGroupCount>+{hiddenCount}</AvatarGroupCount> : null}
    </AvatarGroup>
  );
}

function MessagesPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 lg:px-6">
      <Card className="overflow-hidden border-border/60 py-0">
        <CardHeader className="gap-4 border-b border-border/60 px-6 py-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </CardHeader>
        <CardContent className="grid gap-3 px-6 py-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="overflow-hidden border-border/60 py-0">
          <CardHeader className="border-b border-border/60 px-4 py-4">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="px-3 py-3">
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border/60 px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/60 py-0">
          <CardHeader className="border-b border-border/60 px-6 py-5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-6 py-5">
            <Skeleton className="h-20 w-3/4 rounded-2xl" />
            <Skeleton className="ml-auto h-20 w-2/3 rounded-2xl" />
            <Skeleton className="h-20 w-4/5 rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
}: {
  conversation: ConversationPreview;
  isSelected: boolean;
  onSelect: (conversationId: number) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all",
        isSelected
          ? "border-primary/35 bg-primary/8 shadow-sm"
          : "border-border/60 bg-background/70 hover:border-primary/20 hover:bg-muted/40"
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <ConversationAvatar conversation={conversation} size="lg" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 break-words font-medium">{conversation.title}</p>
            {conversation.subtitle ? (
              <p className="truncate text-sm text-muted-foreground">
                {conversation.subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
            {conversation.unreadCount > 0 ? (
              <Badge variant="secondary">{conversation.unreadCount}</Badge>
            ) : null}
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {conversation.lastMessagePreview || "Aucun message pour l'instant."}
        </p>
      </div>
    </button>
  );
}

function ConversationSidebar({
  groupedConversations,
  selectedConversationId,
  onSelectConversation,
  conversationQuery,
  onConversationQueryChange,
}: {
  groupedConversations: {
    group: ConversationPreview[];
    direct: ConversationPreview[];
  };
  selectedConversationId: number | null;
  onSelectConversation: (conversationId: number) => void;
  conversationQuery: string;
  onConversationQueryChange: (value: string) => void;
}) {
  const filteredDirectConversations = useMemo(() => {
    const normalizedQuery = conversationQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return groupedConversations.direct;
    }

    return groupedConversations.direct.filter((conversation) =>
      `${conversation.title} ${conversation.subtitle ?? ""} ${
        conversation.lastMessagePreview ?? ""
      }`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [conversationQuery, groupedConversations.direct]);

  const hasConversations =
    groupedConversations.group.length > 0 || groupedConversations.direct.length > 0;

  return (
    <Card className="overflow-hidden border-border/60 py-0 xl:sticky xl:top-6 xl:self-start">
      <CardHeader className="border-b border-border/60 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <CardDescription>
              Groupes de coordination et échanges privés autorisés.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {groupedConversations.group.length + groupedConversations.direct.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-3 py-3">
        {!hasConversations ? (
          <Empty className="min-h-72 rounded-2xl border border-dashed border-border/60 bg-muted/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareDashed />
              </EmptyMedia>
              <EmptyTitle>Aucune conversation.</EmptyTitle>
              <EmptyDescription>
                Rejoins un groupe ou démarre un DM autorisé.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <ScrollArea className="h-[min(64vh,42rem)] pr-1 xl:h-[calc(100dvh-20rem)]">
              <div className="flex flex-col gap-4 pb-1">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Groupes
                    </p>
                    <Badge variant="outline">{groupedConversations.group.length}</Badge>
                  </div>

                  {groupedConversations.group.length === 0 ? (
                    <Empty className="min-h-40 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Users />
                        </EmptyMedia>
                        <EmptyTitle>Aucun groupe actif.</EmptyTitle>
                        <EmptyDescription>
                          Les conversations de groupe apparaîtront ici.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    groupedConversations.group.map((conversation) => (
                      <ConversationListItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversationId === conversation.id}
                        onSelect={onSelectConversation}
                      />
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Messages privés
                    </p>
                    <Badge variant="outline">{groupedConversations.direct.length}</Badge>
                  </div>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="dm-search">Rechercher un message privé</FieldLabel>
                      <Input
                        id="dm-search"
                        value={conversationQuery}
                        onChange={(event) => onConversationQueryChange(event.target.value)}
                        placeholder="Nom, email ou dernier message"
                      />
                    </Field>
                  </FieldGroup>

                  {groupedConversations.direct.length === 0 ? (
                    <Empty className="min-h-40 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <UserRound />
                        </EmptyMedia>
                        <EmptyTitle>Aucun DM ouvert.</EmptyTitle>
                        <EmptyDescription>
                          Démarre un échange privé depuis l&apos;action en haut de page.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : filteredDirectConversations.length === 0 ? (
                    <Empty className="min-h-40 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <MessageSquareDashed />
                        </EmptyMedia>
                        <EmptyTitle>Aucun résultat.</EmptyTitle>
                        <EmptyDescription>
                          Ajuste la recherche pour retrouver un DM existant.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    filteredDirectConversations.map((conversation) => (
                      <ConversationListItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversationId === conversation.id}
                        onSelect={onSelectConversation}
                      />
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
          {message.editedAt ? (
            <Badge variant="outline">modifié</Badge>
          ) : null}
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

function ConversationPanel({
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
    <Card className="overflow-hidden border-border/60 py-0 lg:flex lg:h-[calc(100dvh-15rem)] lg:max-h-[calc(100dvh-15rem)] lg:flex-col">
      <CardHeader className="border-b border-border/60 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {isMobile && onBack ? (
              <Button type="button" variant="ghost" size="icon" onClick={onBack}>
                <ChevronLeft />
              </Button>
            ) : null}
            <ConversationAvatar conversation={selectedPreview} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                      {selectedConversation.participantCount} participant
                      {selectedConversation.participantCount > 1 ? "s" : ""}
                    </Badge>
                    <ParticipantStack participants={selectedConversation.participants} />
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

      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
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
            <div className="border-b border-border/60 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <Badge variant="outline">
                  {selectedConversation.type === "group" ? "Groupe" : "Privé"}
                </Badge>
                <span>Historique synchronisé automatiquement</span>
              </div>
            </div>

            <ScrollArea
              ref={threadScrollAreaRef}
              className="min-h-[220px] flex-1 px-3 py-4 sm:px-4"
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

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [hasMessagingAccess, setHasMessagingAccess] = useState<boolean | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationDetail | null>(null);
  const [contacts, setContacts] = useState<DirectMessageTarget[]>([]);
  const [trackedJobIds, setTrackedJobIds] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactQuery, setContactQuery] = useState("");
  const [conversationQuery, setConversationQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [isDirectDialogOpen, setIsDirectDialogOpen] = useState(false);
  const [isClosingDirectConversation, setIsClosingDirectConversation] = useState(false);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const [messagePendingDeletion, setMessagePendingDeletion] =
    useState<ConversationMessage | null>(null);
  const threadBottomRef = useRef<HTMLDivElement | null>(null);
  const threadScrollAreaRef = useRef<HTMLDivElement | null>(null);

  const selectedPreview = useMemo(
    () =>
      conversations.find((entry) => entry.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const groupedConversations = useMemo(
    () => ({
      group: conversations.filter((entry) => entry.type === "group"),
      direct: conversations.filter((entry) => entry.type === "direct"),
    }),
    [conversations]
  );

  const filteredContacts = useMemo(() => {
    const normalizedQuery = contactQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return contacts;
    }

    return contacts.filter((contact) =>
      `${contact.firstName} ${contact.lastName} ${contact.email}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [contactQuery, contacts]);

  const unreadConversationCount = useMemo(
    () => conversations.reduce((total, conversation) => total + conversation.unreadCount, 0),
    [conversations]
  );

  const scrollThreadToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
    const viewport = threadScrollAreaRef.current?.querySelector<HTMLElement>(
      "[data-slot='scroll-area-viewport']"
    );

    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      });
      return;
    }

    threadBottomRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
    },
    []
  );

  const scheduleScrollThreadToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollThreadToBottom(behavior);
        });
      });
    },
    [scrollThreadToBottom]
  );

  function openConversation(conversationId: number) {
    setSelectedConversationId(conversationId);
    setIsMobileConversationOpen(true);
    setConversations((current) =>
      current.map((entry) =>
        entry.id === conversationId
          ? {
              ...entry,
              unreadCount: 0,
            }
          : entry
      )
    );
    void (async () => {
      await loadConversationDetail(conversationId, { markAsRead: true });
      await loadConversations(conversationId, { silent: true });
      scheduleScrollThreadToBottom("auto");
    })();
  }

  async function loadConversations(
    preferredConversationId?: number | null,
    options?: { silent?: boolean }
  ) {
    if (!options?.silent) {
      setError(null);
    }

    const response = await fetch("/api/messages/conversations", {
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      conversations?: ConversationPreview[];
    };

    if (!response.ok || !data.conversations) {
      throw new Error(data.error || "Chargement des conversations impossible.");
    }

    setConversations(data.conversations);
    setHasMessagingAccess(data.conversations.some((entry) => entry.type === "group"));

    const nextConversationId =
      preferredConversationId &&
      data.conversations.some((entry) => entry.id === preferredConversationId)
        ? preferredConversationId
        : data.conversations[0]?.id ?? null;

    setSelectedConversationId(nextConversationId);
    return nextConversationId;
  }

  async function loadConversationDetail(
    conversationId: number,
    options?: { markAsRead?: boolean; silent?: boolean }
  ) {
    if (!options?.silent) {
      setIsConversationLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(
        `/api/messages/conversations/${conversationId}${
          options?.markAsRead ? "?markAsRead=1" : ""
        }`,
        {
          cache: "no-store",
        }
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        conversation?: ConversationDetail;
      };

      if (!response.ok || !data.conversation) {
        throw new Error(data.error || "Chargement de la conversation impossible.");
      }

      setSelectedConversation(data.conversation);
      if (options?.markAsRead) {
        setConversations((current) =>
          current.map((entry) =>
            entry.id === conversationId
              ? {
                  ...entry,
                  unreadCount: 0,
                }
              : entry
          )
        );
      }
    } catch (conversationError) {
      if (!options?.silent) {
        setSelectedConversation(null);
        setError(
          conversationError instanceof Error
            ? conversationError.message
            : "Chargement de la conversation impossible."
        );
      }
    } finally {
      if (!options?.silent) {
        setIsConversationLoading(false);
      }
    }
  }

  async function loadContacts(options?: {
    silent?: boolean;
    signal?: AbortSignal;
  }) {
    setIsContactsLoading(true);
    if (!options?.silent) {
      setContactsError(null);
    }

    try {
      const response = await fetch("/api/messages/contacts", {
        cache: "no-store",
        signal: options?.signal,
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        contacts?: DirectMessageTarget[];
      };

      if (!response.ok || !data.contacts) {
        throw new Error(data.error || "Chargement des contacts impossible.");
      }

      setContacts(data.contacts);
    } catch (contactsLoadError) {
      if (
        contactsLoadError instanceof Error &&
        contactsLoadError.name === "AbortError"
      ) {
        return;
      }

      if (!options?.silent) {
        setContactsError(
          contactsLoadError instanceof Error
            ? contactsLoadError.message
            : "Chargement des contacts impossible."
        );
      }
    } finally {
      setIsContactsLoading(false);
    }
  }

  async function loadTrackedApplications() {
    try {
      const response = await fetch("/api/applications", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        applications?: JobApplication[];
      };

      if (!response.ok || !data.applications) {
        return;
      }

      setTrackedJobIds(data.applications.map((application) => application.job.id));
    } catch {
      // Best effort only: messaging should still work if applications are unavailable.
    }
  }

  function syncConversationListPreview(message: {
    conversationId: number;
    createdAt: string;
    content: string | null;
  }) {
    setConversations((current) => {
      const next = current.map((entry) =>
        entry.id === message.conversationId
          ? {
              ...entry,
              lastMessageAt: message.createdAt,
              lastMessagePreview: message.content,
            }
          : entry
      );

      return [...next].sort((left, right) => {
        if (left.type !== right.type) {
          return left.type === "group" ? -1 : 1;
        }

        return (
          new Date(right.lastMessageAt).getTime() -
          new Date(left.lastMessageAt).getTime()
        );
      });
    });
  }

  async function sendCurrentMessage() {
    if (!selectedConversation || !draft.trim()) return;

    const normalizedDraft = draft.trim();
    if (normalizedDraft === "/clean") {
      if (selectedConversation.type !== "group") {
        toast.error("`/clean` est réservé aux conversations de groupe.");
        return;
      }

      if (!selectedConversation.canModerateMessages) {
        toast.error("Tu n'as pas les droits pour nettoyer cette conversation.");
        return;
      }
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/messages/conversations/${selectedConversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: normalizedDraft }),
        }
      );
      const data = (await response.json().catch(() => ({}))) as {
        command?: "clean";
        error?: string;
        message?: ConversationMessage;
      };

      if (!response.ok) {
        throw new Error(data.error || "Envoi du message impossible.");
      }

      if (data.command === "clean") {
        setDraft("");
        setSelectedConversation((current) =>
          current && current.id === selectedConversation.id
            ? {
                ...current,
                messages: [],
              }
            : current
        );
        setConversations((current) =>
          current.map((entry) =>
            entry.id === selectedConversation.id
              ? {
                  ...entry,
                  lastMessagePreview: null,
                }
              : entry
          )
        );
        toast.success("Conversation nettoyée.");
        return;
      }

      if (!data.message) {
        throw new Error("Envoi du message impossible.");
      }

      setDraft("");
      setSelectedConversation((current) =>
        current && current.id === data.message?.conversationId
          ? {
              ...current,
              messages: [...current.messages, data.message],
            }
          : current
      );
      syncConversationListPreview({
        conversationId: data.message.conversationId,
        createdAt: data.message.createdAt,
        content: data.message.content,
      });
      scheduleScrollThreadToBottom();
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : "Envoi du message impossible.";
      if (normalizedDraft === "/clean") {
        toast.error(message);
      } else {
        setError(message);
      }
    } finally {
      setIsSending(false);
    }
  }

  async function addSharedJobToApplications(job: Job) {
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Impossible d'ajouter la candidature.");
      }

      setTrackedJobIds((current) =>
        current.includes(job.id) ? current : [...current, job.id]
      );
      toast.success("Offre ajoutée au suivi.");
    } catch (trackedJobError) {
      toast.error(
        trackedJobError instanceof Error
          ? trackedJobError.message
          : "Impossible d'ajouter la candidature."
      );
    }
  }

  async function deleteSelectedMessage() {
    if (!selectedConversation || !messagePendingDeletion) return;

    setIsDeletingMessage(true);
    try {
      const response = await fetch(
        `/api/messages/conversations/${selectedConversation.id}/messages/${messagePendingDeletion.id}`,
        {
          method: "DELETE",
        }
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: ConversationMessage;
      };

      if (!response.ok) {
        throw new Error(data.error || "Suppression du message impossible.");
      }

      if (data.message) {
        setSelectedConversation((current) =>
          current && current.id === selectedConversation.id
            ? {
                ...current,
                messages: current.messages.map((message) =>
                  message.id === data.message?.id ? data.message : message
                ),
              }
            : current
        );
      } else {
        setSelectedConversation((current) =>
          current && current.id === selectedConversation.id
            ? {
                ...current,
                messages: current.messages.filter(
                  (message) => message.id !== messagePendingDeletion.id
                ),
              }
            : current
        );
      }
      setMessagePendingDeletion(null);
      await loadConversations(selectedConversation.id, { silent: true });
      toast.success("Message supprimé.");
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Suppression du message impossible."
      );
    } finally {
      setIsDeletingMessage(false);
    }
  }

  async function closeSelectedDirectConversation() {
    if (!selectedConversationId) {
      return;
    }

    setIsClosingDirectConversation(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/messages/conversations/${selectedConversationId}/close`,
        {
          method: "POST",
        }
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Fermeture du DM impossible.");
      }

      const remaining = conversations.filter(
        (entry) => entry.id !== selectedConversationId
      );
      const nextConversationId = remaining[0]?.id ?? null;

      setConversations(remaining);
      setSelectedConversationId(nextConversationId);
      setSelectedConversation(null);
      setIsMobileConversationOpen(false);

      if (nextConversationId) {
        await loadConversationDetail(nextConversationId, { markAsRead: true });
      }
    } catch (closeError) {
      setError(
        closeError instanceof Error
          ? closeError.message
          : "Fermeture du DM impossible."
      );
    } finally {
      setIsClosingDirectConversation(false);
    }
  }

  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setIsLoading(true);
      try {
        const [nextConversationId] = await Promise.all([
          loadConversations(),
          loadTrackedApplications(),
        ]);
        if (!cancelled && nextConversationId) {
          await loadConversationDetail(nextConversationId, { markAsRead: true });
          await loadConversations(nextConversationId, { silent: true });
          scheduleScrollThreadToBottom("auto");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Chargement des conversations impossible."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, [scheduleScrollThreadToBottom]);

  useEffect(() => {
    if (!isDirectDialogOpen) {
      return;
    }

    const controller = new AbortController();

    setContactsError(null);
    setContactQuery("");
    void loadContacts({ silent: false, signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [isDirectDialogOpen]);

  useEffect(() => {
    scheduleScrollThreadToBottom("auto");
  }, [
    scheduleScrollThreadToBottom,
    selectedConversationId,
    selectedConversation?.messages.length,
  ]);

  useEffect(() => {
    if (!selectedConversationId) {
      setIsMobileConversationOpen(false);
      return;
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        await loadConversationDetail(selectedConversationId, {
          markAsRead: true,
          silent: true,
        });
        await loadConversations(selectedConversationId, { silent: true });
      })();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedConversationId]);

  useEffect(() => {
    if (isLoading || hasMessagingAccess !== false) {
      return;
    }

    toast.error("La messagerie est réservée aux personnes rattachées à un groupe.");
    router.replace("/");
  }, [hasMessagingAccess, isLoading, router]);

  if (isLoading) {
    return <MessagesPageSkeleton />;
  }

  if (hasMessagingAccess === false) {
    return <MessagesPageSkeleton />;
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 overflow-x-hidden px-3 animate-in fade-in duration-500 sm:px-4 lg:px-6">
        <Card className="overflow-hidden border-border/60 py-0">
          <CardHeader className="gap-4 border-b border-border/60 px-4 py-6 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
                  <MessagesSquare data-icon="inline-start" className="text-primary" />
                  Messages
                </CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-relaxed">
                  Un espace de coordination propre, lisible et actionnable pour les
                  groupes, avec des DM limités aux personnes déjà dans le même cadre
                  d&apos;accompagnement.
                </CardDescription>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Badge variant="outline">
                  {unreadConversationCount} non lu
                  {unreadConversationCount > 1 ? "s" : ""}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setIsDirectDialogOpen(true)}
                >
                  <UserRound data-icon="inline-start" />
                  Nouveau DM
                </Button>
              </div>
            </div>
          </CardHeader>

        </Card>

        <div className="md:hidden">
          {isMobileConversationOpen && selectedPreview ? (
            <ConversationPanel
              selectedPreview={selectedPreview}
              selectedConversation={selectedConversation}
              error={error}
              isConversationLoading={isConversationLoading}
              isClosingDirectConversation={isClosingDirectConversation}
              trackedJobIds={trackedJobIds}
              draft={draft}
              isSending={isSending}
              isMobile
              onBack={() => setIsMobileConversationOpen(false)}
              onCloseDirectConversation={() => {
                void closeSelectedDirectConversation();
              }}
              onTrackJob={(job) => {
                void addSharedJobToApplications(job);
              }}
              onDeleteMessage={setMessagePendingDeletion}
              onDraftChange={setDraft}
              onSend={() => {
                void sendCurrentMessage();
              }}
              threadBottomRef={threadBottomRef}
              threadScrollAreaRef={threadScrollAreaRef}
            />
          ) : (
            <ConversationSidebar
              groupedConversations={groupedConversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={openConversation}
              conversationQuery={conversationQuery}
              onConversationQueryChange={setConversationQuery}
            />
          )}
        </div>

        <div className="hidden min-w-0 gap-6 md:grid xl:grid-cols-[360px_minmax(0,1fr)]">
          <ConversationSidebar
            groupedConversations={groupedConversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={openConversation}
            conversationQuery={conversationQuery}
            onConversationQueryChange={setConversationQuery}
          />

          <ConversationPanel
            selectedPreview={selectedPreview}
            selectedConversation={selectedConversation}
            error={error}
            isConversationLoading={isConversationLoading}
            isClosingDirectConversation={isClosingDirectConversation}
            trackedJobIds={trackedJobIds}
            draft={draft}
            isSending={isSending}
            onCloseDirectConversation={() => {
              void closeSelectedDirectConversation();
            }}
            onTrackJob={(job) => {
              void addSharedJobToApplications(job);
            }}
            onDeleteMessage={setMessagePendingDeletion}
            onDraftChange={setDraft}
            onSend={() => {
              void sendCurrentMessage();
            }}
            threadBottomRef={threadBottomRef}
            threadScrollAreaRef={threadScrollAreaRef}
          />
        </div>
      </div>

      <Dialog open={isDirectDialogOpen} onOpenChange={setIsDirectDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau message privé</DialogTitle>
            <DialogDescription>
              Choisis une personne déjà reliée à l&apos;un de tes groupes pour démarrer
              un échange privé.
            </DialogDescription>
          </DialogHeader>

          {contactsError ? (
            <Alert>
              <AlertTitle>Contacts indisponibles</AlertTitle>
              <AlertDescription>{contactsError}</AlertDescription>
            </Alert>
          ) : isContactsLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <Empty className="min-h-56 rounded-2xl border border-dashed border-border/60 bg-muted/10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserRound />
                </EmptyMedia>
                <EmptyTitle>Aucun contact disponible.</EmptyTitle>
                <EmptyDescription>
                  Aucun DM autorisé pour l&apos;instant dans ton périmètre.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="contact-search">
                    Rechercher un contact autorisé
                  </FieldLabel>
                  <Input
                    id="contact-search"
                    value={contactQuery}
                    onChange={(event) => setContactQuery(event.target.value)}
                    placeholder="Nom ou email"
                  />
                </Field>
              </FieldGroup>

              {filteredContacts.length === 0 ? (
                <Empty className="min-h-48 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessageSquareDashed />
                    </EmptyMedia>
                    <EmptyTitle>Aucun contact trouvé.</EmptyTitle>
                    <EmptyDescription>
                      Ajuste la recherche ou vérifie ton périmètre de groupe.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ScrollArea className="max-h-[420px] pr-1">
                  <div className="flex flex-col gap-2">
                    {filteredContacts.map((contact) => {
                      const displayName = getDisplayName({
                        firstName: contact.firstName,
                        lastName: contact.lastName,
                        email: contact.email,
                        fallback: "Contact",
                      });

                      return (
                        <button
                          key={contact.userId}
                          type="button"
                          className="flex flex-col gap-3 rounded-2xl border border-border/60 px-4 py-4 text-left transition-colors hover:border-primary/20 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                          onClick={async () => {
                            setContactsError(null);
                            setIsDirectDialogOpen(false);

                            try {
                              const response = await fetch(
                                "/api/messages/conversations/direct",
                                {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    targetUserId: contact.userId,
                                  }),
                                }
                              );
                              const data = (await response.json().catch(() => ({}))) as {
                                error?: string;
                                conversation?: ConversationDetail;
                              };

                              if (!response.ok || !data.conversation) {
                                throw new Error(
                                  data.error || "Création du DM impossible."
                                );
                              }

                              setSelectedConversation(data.conversation);
                              setSelectedConversationId(data.conversation.id);
                              await loadConversations(data.conversation.id, {
                                silent: true,
                              });
                              setIsMobileConversationOpen(true);
                            } catch (directError) {
                              setIsDirectDialogOpen(true);
                              setContactsError(
                                directError instanceof Error
                                  ? directError.message
                                  : "Création du DM impossible."
                              );
                            }
                          }}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="border border-border/70 bg-background">
                              <AvatarFallback>
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{displayName}</span>
                                <Badge variant="outline" className="capitalize">
                                  {contact.role}
                                </Badge>
                              </div>
                              <span className="truncate text-sm text-muted-foreground">
                                {contact.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{contact.relationLabel}</Badge>
                            <Badge variant="outline">
                              {contact.sharedGroupCount} groupe
                              {contact.sharedGroupCount > 1 ? "s" : ""} partagé
                              {contact.sharedGroupCount > 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(messagePendingDeletion)}
        onOpenChange={(open) => {
          if (!open && !isDeletingMessage) {
            setMessagePendingDeletion(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le message restera dans l&apos;historique comme supprimé. Cette action est
              réservée à l&apos;encadrement du groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingMessage}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingMessage}
              onClick={(event) => {
                event.preventDefault();
                void deleteSelectedMessage();
              }}
            >
              {isDeletingMessage ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  LoaderCircle,
  MessagesSquare,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { cn } from "@/lib/utils";
import { JobApplication } from "@/types/application";
import { Job } from "@/types/job";
import { ConversationDetail, ConversationPreview, DirectMessageTarget } from "@/types/messaging";

function MessagesPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 lg:px-6">
      <Card className="border-border/60 py-0">
        <CardHeader className="gap-3 border-b border-border/60 px-6 py-5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </CardHeader>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-border/60 py-0">
          <CardContent className="flex flex-col gap-3 px-4 py-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-border/60 px-4 py-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/60 py-0">
          <CardContent className="flex flex-col gap-4 px-6 py-5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-3/4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [contacts, setContacts] = useState<DirectMessageTarget[]>([]);
  const [trackedJobIds, setTrackedJobIds] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactQuery, setContactQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [isDirectDialogOpen, setIsDirectDialogOpen] = useState(false);
  const [isClosingDirectConversation, setIsClosingDirectConversation] = useState(false);
  const threadViewportRef = useRef<HTMLDivElement | null>(null);

  const selectedPreview = useMemo(
    () => conversations.find((entry) => entry.id === selectedConversationId) ?? null,
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
      `${contact.firstName} ${contact.lastName} ${contact.email}`.toLowerCase().includes(normalizedQuery)
    );
  }, [contactQuery, contacts]);

  function getSharedJob(message: ConversationDetail["messages"][number]): Job | null {
    if (message.type !== "job_share" || !message.metadata.sharedJob) {
      return null;
    }

    return message.metadata.sharedJob;
  }

  async function loadConversations(
    preferredConversationId?: number | null,
    options?: { silent?: boolean }
  ) {
    if (!options?.silent) {
      setError(null);
    }

    const response = await fetch("/api/messages/conversations", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      conversations?: ConversationPreview[];
    };

    if (!response.ok || !data.conversations) {
      throw new Error(data.error || "Chargement des conversations impossible.");
    }

    setConversations(data.conversations);

    const nextConversationId =
      preferredConversationId && data.conversations.some((entry) => entry.id === preferredConversationId)
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
        `/api/messages/conversations/${conversationId}${options?.markAsRead ? "?markAsRead=1" : ""}`,
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

  async function loadContacts(options?: { silent?: boolean }) {
    setIsContactsLoading(true);
    if (!options?.silent) {
      setContactsError(null);
    }

    try {
      const response = await fetch("/api/messages/contacts", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        contacts?: DirectMessageTarget[];
      };

      if (!response.ok || !data.contacts) {
        throw new Error(data.error || "Chargement des contacts impossible.");
      }

      setContacts(data.contacts);
    } catch (contactsLoadError) {
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

        return new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime();
      });
    });
  }

  function scrollThreadToBottom(behavior: ScrollBehavior = "smooth") {
    const viewport = threadViewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior,
    });
  }

  async function sendCurrentMessage() {
    if (!selectedConversation || !draft.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/messages/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: ConversationDetail["messages"][number];
      };

      if (!response.ok || !data.message) {
        throw new Error(data.error || "Envoi du message impossible.");
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
      scrollThreadToBottom();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Envoi du message impossible.");
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

      setTrackedJobIds((current) => (current.includes(job.id) ? current : [...current, job.id]));
      toast.success("Offre ajoutée au suivi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'ajouter la candidature.");
    }
  }

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
  }, []);

  useEffect(() => {
    if (!isDirectDialogOpen || isContactsLoading) {
      return;
    }

    setContactsError(null);
    setContactQuery("");
    void loadContacts({ silent: false });
  }, [isContactsLoading, isDirectDialogOpen]);

  useEffect(() => {
    scrollThreadToBottom("auto");
  }, [selectedConversationId, selectedConversation?.messages.length]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadConversations(selectedConversationId, { silent: true });
      void loadConversationDetail(selectedConversationId, { silent: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedConversationId]);

  if (isLoading) {
    return <MessagesPageSkeleton />;
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 animate-in fade-in duration-500 lg:px-6">
        <Card className="border-border/60 py-0">
          <CardHeader className="gap-4 border-b border-border/60 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
                  <MessagesSquare data-icon="inline-start" className="text-primary" />
                  Messages
                </CardTitle>
                <CardDescription className="max-w-3xl">
                  Conversations de groupe et messages privés entre personnes reliées par un même
                  groupe. Cette V2 permet d&apos;ouvrir un fil, écrire, et démarrer un DM.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
                </Badge>
                <Button type="button" variant="outline" onClick={() => setIsDirectDialogOpen(true)}>
                  <UserRound data-icon="inline-start" />
                  Nouveau DM
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="border-border/60 py-0 xl:sticky xl:top-6 xl:self-start">
            <CardHeader className="border-b border-border/60 px-4 py-4">
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[calc(100dvh-19rem)] overflow-y-auto px-3 py-3 xl:max-h-[calc(100dvh-15rem)]">
              {conversations.length === 0 ? (
                <Empty className="min-h-64 rounded-xl border border-dashed border-border/60">
                  <EmptyHeader>
                    <EmptyTitle>Aucune conversation.</EmptyTitle>
                    <EmptyDescription>
                      Rejoins un groupe ou démarre un DM autorisé.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Groupes
                    </p>
                    {groupedConversations.group.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        className={cn(
                          "flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition-colors",
                          selectedConversationId === conversation.id
                            ? "border-primary/40 bg-primary/5 shadow-sm"
                            : "border-border/60 hover:border-primary/20 hover:bg-muted/30"
                        )}
                        onClick={() => {
                          setSelectedConversationId(conversation.id);
                          void loadConversationDetail(conversation.id, { markAsRead: true });
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <Users className="text-primary" />
                            <span className="truncate font-medium">{conversation.title}</span>
                          </div>
                          {conversation.unreadCount > 0 ? (
                            <Badge variant="secondary">{conversation.unreadCount}</Badge>
                          ) : null}
                        </div>
                        {conversation.subtitle ? (
                          <p className="truncate text-sm text-muted-foreground">
                            {conversation.subtitle}
                          </p>
                        ) : null}
                        {conversation.lastMessagePreview ? (
                          <p className="line-clamp-2 text-sm text-foreground/80">
                            {conversation.lastMessagePreview}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </button>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Messages privés
                    </p>
                    {groupedConversations.direct.length === 0 ? (
                      <p className="px-1 text-sm text-muted-foreground">
                        Aucun DM ouvert pour l&apos;instant.
                      </p>
                    ) : (
                      groupedConversations.direct.map((conversation) => (
                        <button
                          key={conversation.id}
                          type="button"
                          className={cn(
                            "flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition-colors",
                            selectedConversationId === conversation.id
                              ? "border-primary/40 bg-primary/5 shadow-sm"
                              : "border-border/60 hover:border-primary/20 hover:bg-muted/30"
                          )}
                          onClick={() => {
                            setSelectedConversationId(conversation.id);
                            void loadConversationDetail(conversation.id, { markAsRead: true });
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <UserRound className="text-primary" />
                              <span className="truncate font-medium">{conversation.title}</span>
                            </div>
                            {conversation.unreadCount > 0 ? (
                              <Badge variant="secondary">{conversation.unreadCount}</Badge>
                            ) : null}
                          </div>
                          {conversation.subtitle ? (
                            <p className="truncate text-sm text-muted-foreground">
                              {conversation.subtitle}
                            </p>
                          ) : null}
                          {conversation.lastMessagePreview ? (
                            <p className="line-clamp-2 text-sm text-foreground/80">
                              {conversation.lastMessagePreview}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 py-0 lg:flex lg:h-[calc(100dvh-15rem)] lg:max-h-[calc(100dvh-15rem)] lg:flex-col lg:overflow-hidden">
            {selectedPreview ? (
              <>
                <CardHeader className="border-b border-border/60 px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        {selectedPreview.type === "group" ? (
                          <Users data-icon="inline-start" className="text-primary" />
                        ) : (
                          <UserRound data-icon="inline-start" className="text-primary" />
                        )}
                        {selectedPreview.title}
                      </CardTitle>
                      {selectedConversation?.subtitle ? (
                        <CardDescription>{selectedConversation.subtitle}</CardDescription>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedConversation ? (
                        <Badge variant="outline">
                          {selectedConversation.participantCount} participant
                          {selectedConversation.participantCount > 1 ? "s" : ""}
                        </Badge>
                      ) : null}
                      {selectedPreview.type === "direct" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isClosingDirectConversation}
                          onClick={async () => {
                            if (!selectedConversationId) return;
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
                              setConversations(remaining);
                              const nextConversationId = remaining[0]?.id ?? null;
                              setSelectedConversationId(nextConversationId);
                              setSelectedConversation(null);
                              if (nextConversationId) {
                                void loadConversationDetail(nextConversationId, { markAsRead: true });
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
                          }}
                        >
                          <X data-icon="inline-start" />
                          Fermer le DM
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
                  {error ? (
                    <Empty className="min-h-72 rounded-xl border border-dashed border-border/60">
                      <EmptyHeader>
                        <EmptyTitle>Conversation indisponible.</EmptyTitle>
                        <EmptyDescription>{error}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : isConversationLoading ? (
                    <div className="flex flex-col gap-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton
                          key={index}
                          className={cn("h-20 rounded-2xl", index % 2 === 0 ? "w-3/4" : "ml-auto w-2/3")}
                        />
                      ))}
                    </div>
                  ) : selectedConversation ? (
                    <>
                      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/60 bg-muted/10">
                        <div
                          ref={threadViewportRef}
                          className="min-h-[220px] flex-1 overflow-y-auto px-4 py-4"
                        >
                          {selectedConversation.messages.length === 0 ? (
                            <Empty className="min-h-[220px] rounded-xl border border-dashed border-border/60 bg-background/70">
                              <EmptyHeader>
                                <EmptyTitle>Aucun message pour l&apos;instant.</EmptyTitle>
                                <EmptyDescription>
                                  Lance la conversation avec un premier message.
                                </EmptyDescription>
                              </EmptyHeader>
                            </Empty>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {selectedConversation.messages.map((message) => {
                                const sharedJob = getSharedJob(message);
                                const pdfUrl = sharedJob ? getJobPdfUrl(sharedJob) : null;
                                const isTracked = sharedJob ? trackedJobIds.includes(sharedJob.id) : false;

                                return (
                                  <div
                                    key={message.id}
                                    className={cn(
                                      "max-w-[92%] rounded-2xl border px-4 py-3 lg:max-w-[78%]",
                                      message.isOwnMessage
                                        ? "ml-auto border-primary/30 bg-primary/10"
                                        : "border-border/60 bg-background"
                                    )}
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-medium">
                                        {message.author
                                          ? `${message.author.firstName} ${message.author.lastName}`.trim() ||
                                            message.author.email
                                          : "Système"}
                                      </p>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(message.createdAt), "dd/MM/yyyy HH:mm", {
                                          locale: fr,
                                        })}
                                      </span>
                                    </div>
                                    {message.content ? (
                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                                        {message.content}
                                      </p>
                                    ) : null}
                                    {sharedJob ? (
                                      <div className="mt-3 rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm">
                                        <div className="flex flex-col gap-3">
                                          <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                                <BriefcaseBusiness className="h-3.5 w-3.5" />
                                                Offre Forem
                                              </div>
                                              <p className="mt-2 text-base font-semibold leading-snug">
                                                {sharedJob.title}
                                              </p>
                                              <p className="mt-1 text-sm text-muted-foreground">
                                                {sharedJob.company || "Entreprise non précisée"} •{" "}
                                                {sharedJob.location}
                                              </p>
                                            </div>
                                            <ContractTypeBadge contractType={sharedJob.contractType} />
                                          </div>

                                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="outline">FOREM</Badge>
                                            <span>
                                              Publiée le{" "}
                                              {format(new Date(sharedJob.publicationDate), "dd/MM/yyyy", {
                                                locale: fr,
                                              })}
                                            </span>
                                          </div>

                                          <div className="flex flex-wrap gap-2">
                                            <Button size="sm" asChild>
                                              <a href={sharedJob.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink data-icon="inline-start" />
                                                Ouvrir l&apos;offre
                                              </a>
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant={isTracked ? "secondary" : "outline"}
                                              disabled={isTracked}
                                              onClick={() => {
                                                void addSharedJobToApplications(sharedJob);
                                              }}
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
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-border/60 bg-background/80 px-4 py-4 backdrop-blur">
                          <FieldGroup>
                            <Field>
                              <FieldLabel htmlFor="message-compose">Nouveau message</FieldLabel>
                              <Textarea
                                id="message-compose"
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault();
                                    void sendCurrentMessage();
                                  }
                                }}
                                placeholder="Écris un message utile, clair et actionnable..."
                                className="min-h-20"
                              />
                              <p className="text-xs text-muted-foreground">
                                `Entrée` envoie le message, `Shift + Entrée` ajoute une ligne.
                              </p>
                            </Field>
                          </FieldGroup>

                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              disabled={isSending || !draft.trim()}
                              onClick={() => {
                                void sendCurrentMessage();
                              }}
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
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </>
            ) : (
              <CardContent className="px-6 py-10">
                <Empty className="min-h-[420px] rounded-xl border border-dashed border-border/60">
                  <EmptyHeader>
                    <EmptyTitle>Sélectionne une conversation.</EmptyTitle>
                    <EmptyDescription>
                      Ouvre un groupe ou démarre un DM pour afficher le fil des messages.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={isDirectDialogOpen} onOpenChange={setIsDirectDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau message privé</DialogTitle>
            <DialogDescription>
              Seules les personnes reliées à tes groupes sont proposées ici.
            </DialogDescription>
          </DialogHeader>

          {contactsError ? (
            <Empty className="min-h-48 rounded-xl border border-dashed border-border/60">
              <EmptyHeader>
                <EmptyTitle>Contacts indisponibles.</EmptyTitle>
                <EmptyDescription>{contactsError}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : isContactsLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <Empty className="min-h-48 rounded-xl border border-dashed border-border/60">
              <EmptyHeader>
                <EmptyTitle>Aucun contact disponible.</EmptyTitle>
                <EmptyDescription>
                  Aucun DM autorisé pour l&apos;instant dans ton périmètre.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              <Input
                value={contactQuery}
                onChange={(event) => setContactQuery(event.target.value)}
                placeholder="Rechercher un contact autorisé..."
              />
              {filteredContacts.length === 0 ? (
                <Empty className="min-h-48 rounded-xl border border-dashed border-border/60">
                  <EmptyHeader>
                    <EmptyTitle>Aucun contact autorisé trouvé.</EmptyTitle>
                    <EmptyDescription>
                      Ajuste la recherche ou vérifie ton périmètre de groupe.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.userId}
                      type="button"
                      className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3 text-left transition-colors hover:border-primary/20 hover:bg-muted/30"
                      onClick={async () => {
                        setContactsError(null);

                        try {
                          const response = await fetch("/api/messages/conversations/direct", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ targetUserId: contact.userId }),
                          });
                          const data = (await response.json().catch(() => ({}))) as {
                            error?: string;
                            conversation?: ConversationDetail;
                          };

                          if (!response.ok || !data.conversation) {
                            throw new Error(data.error || "Création du DM impossible.");
                          }

                          setIsDirectDialogOpen(false);
                          setSelectedConversation(data.conversation);
                          setSelectedConversationId(data.conversation.id);
                          await loadConversations(data.conversation.id, { silent: true });
                        } catch (directError) {
                          setContactsError(
                            directError instanceof Error
                              ? directError.message
                              : "Création du DM impossible."
                          );
                        }
                      }}
                    >
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {`${contact.firstName} ${contact.lastName}`.trim() || contact.email}
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {contact.role}
                          </Badge>
                        </div>
                        <span className="truncate text-sm text-muted-foreground">{contact.email}</span>
                      </div>

                      <Badge variant="secondary">
                        {contact.sharedGroupCount > 0
                          ? `${contact.sharedGroupCount} groupe${contact.sharedGroupCount > 1 ? "s" : ""} commun${contact.sharedGroupCount > 1 ? "s" : ""}`
                          : "Admin"}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

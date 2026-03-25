"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Job } from "@/types/job";
import {
  ConversationDetail,
  ConversationMessage,
  ConversationPreview,
  DirectMessageTarget,
} from "@/types/messaging";
import {
  closeDirectMessageConversation,
  createDirectMessageConversation,
  createTrackedApplication,
  fetchConversationDetail,
  fetchConversations,
  fetchMessageContacts,
  fetchTrackedApplications,
  postConversationMessage,
  removeConversationMessage,
} from "@/features/messages/messages.api";
import { useMessagesDerivedState } from "@/features/messages/hooks/useMessagesDerivedState";
import { useMessageThreadScroll } from "@/features/messages/hooks/useMessageThreadScroll";
import { useMessagesStream } from "@/features/messages/hooks/useMessagesStream";
import { MessageStreamEvent } from "@/types/messaging";

export function useMessagesPageState() {
  const isMobileViewport = useIsMobile();
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
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const {
    desktopThreadBottomRef,
    desktopThreadScrollAreaRef,
    mobileThreadBottomRef,
    mobileThreadScrollAreaRef,
    scheduleScrollThreadToBottom,
  } = useMessageThreadScroll(isMobileViewport);
  const {
    selectedPreview,
    groupedConversations,
    filteredContacts,
    unreadConversationCount,
  } = useMessagesDerivedState({
    contactQuery,
    contacts,
    conversations,
    selectedConversationId,
  });

  const loadConversations = useCallback(
    async (preferredConversationId?: number | null, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setError(null);
      }

      const { response, data } = await fetchConversations();

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
    },
    []
  );

  const loadConversationDetail = useCallback(
    async (
      conversationId: number,
      options?: { markAsRead?: boolean; silent?: boolean }
    ) => {
      if (!options?.silent) {
        setIsConversationLoading(true);
        setError(null);
      }

      try {
        const { response, data } = await fetchConversationDetail(conversationId, {
          markAsRead: options?.markAsRead,
        });

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
    },
    []
  );

  const loadContacts = useCallback(
    async (options?: { silent?: boolean; signal?: AbortSignal }) => {
      setIsContactsLoading(true);
      if (!options?.silent) {
        setContactsError(null);
      }

      try {
        const { response, data } = await fetchMessageContacts(options?.signal);

        if (!response.ok || !data.contacts) {
          throw new Error(data.error || "Chargement des contacts impossible.");
        }

        setContacts(data.contacts);
      } catch (contactsLoadError) {
        if (contactsLoadError instanceof Error && contactsLoadError.name === "AbortError") {
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
    },
    []
  );

  const loadTrackedApplications = useCallback(async () => {
    try {
      const { response, data } = await fetchTrackedApplications();

      if (!response.ok || !data.applications) {
        return;
      }

      setTrackedJobIds(data.applications.map((application) => application.job.id));
    } catch {
      // Best effort only.
    }
  }, []);

  const syncConversationListPreview = useCallback(
    (message: { conversationId: number; createdAt: string; content: string | null }) => {
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
    },
    []
  );

  const openConversation = useCallback(
    (conversationId: number) => {
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
    },
    [loadConversationDetail, loadConversations, scheduleScrollThreadToBottom]
  );

  const sendCurrentMessage = useCallback(async () => {
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
      const { response, data } = await postConversationMessage(
        selectedConversation.id,
        normalizedDraft
      );

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
        sendError instanceof Error ? sendError.message : "Envoi du message impossible.";
      if (normalizedDraft === "/clean") {
        toast.error(message);
      } else {
        setError(message);
      }
    } finally {
      setIsSending(false);
    }
  }, [
    draft,
    scheduleScrollThreadToBottom,
    selectedConversation,
    syncConversationListPreview,
  ]);

  const addSharedJobToApplications = useCallback(async (job: Job) => {
    try {
      const { response, data } = await createTrackedApplication(job);

      if (!response.ok) {
        throw new Error(data.error || "Impossible d'ajouter la candidature.");
      }

      setTrackedJobIds((current) => (current.includes(job.id) ? current : [...current, job.id]));
      toast.success("Offre ajoutée au suivi.");
    } catch (trackedJobError) {
      toast.error(
        trackedJobError instanceof Error
          ? trackedJobError.message
          : "Impossible d'ajouter la candidature."
      );
    }
  }, []);

  const deleteSelectedMessage = useCallback(async () => {
    if (!selectedConversation || !messagePendingDeletion) return;

    setIsDeletingMessage(true);
    try {
      const { response, data } = await removeConversationMessage(
        selectedConversation.id,
        messagePendingDeletion.id
      );

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
  }, [loadConversations, messagePendingDeletion, selectedConversation]);

  const closeSelectedDirectConversation = useCallback(async () => {
    if (!selectedConversationId) {
      return;
    }

    setIsClosingDirectConversation(true);
    setError(null);

    try {
      const { response, data } = await closeDirectMessageConversation(selectedConversationId);

      if (!response.ok) {
        throw new Error(data.error || "Fermeture du DM impossible.");
      }

      const remaining = conversations.filter((entry) => entry.id !== selectedConversationId);
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
        closeError instanceof Error ? closeError.message : "Fermeture du DM impossible."
      );
    } finally {
      setIsClosingDirectConversation(false);
    }
  }, [conversations, loadConversationDetail, selectedConversationId]);

  const createDirectConversation = useCallback(
    async (contact: DirectMessageTarget) => {
      setContactsError(null);
      setIsDirectDialogOpen(false);

      try {
        const { response, data } = await createDirectMessageConversation(contact.userId);

        if (!response.ok || !data.conversation) {
          throw new Error(data.error || "Création du DM impossible.");
        }

        setSelectedConversation(data.conversation);
        setSelectedConversationId(data.conversation.id);
        await loadConversations(data.conversation.id, { silent: true });
        setIsMobileConversationOpen(true);
      } catch (directError) {
        setIsDirectDialogOpen(true);
        setContactsError(
          directError instanceof Error ? directError.message : "Création du DM impossible."
        );
      }
    },
    [loadConversations]
  );

  const handleStreamEvent = useCallback(
    (event: MessageStreamEvent) => {
      if (event.type === "stream.connected") {
        return;
      }

      void (async () => {
        const preferredConversationId =
          selectedConversationId === event.conversationId
            ? selectedConversationId
            : selectedConversationId ?? event.conversationId;

        await loadConversations(preferredConversationId, { silent: true });

        if (selectedConversationId === event.conversationId) {
          await loadConversationDetail(event.conversationId, {
            markAsRead: true,
            silent: true,
          });

          if (
            event.type === "conversation.message_created" ||
            event.type === "conversation.cleared"
          ) {
            scheduleScrollThreadToBottom("auto");
          }
        }
      })();
    },
    [
      loadConversationDetail,
      loadConversations,
      scheduleScrollThreadToBottom,
      selectedConversationId,
    ]
  );

  useMessagesStream({
    enabled: !isLoading && hasMessagingAccess !== false,
    onEvent: handleStreamEvent,
  });

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
  }, [loadConversationDetail, loadConversations, loadTrackedApplications, scheduleScrollThreadToBottom]);

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
  }, [isDirectDialogOpen, loadContacts]);

  useEffect(() => {
    scheduleScrollThreadToBottom("auto");
  }, [scheduleScrollThreadToBottom, selectedConversationId, selectedConversation?.messages.length]);

  useEffect(() => {
    if (!isMobileConversationOpen || !selectedConversationId) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
    scheduleScrollThreadToBottom("auto");
  }, [isMobileConversationOpen, scheduleScrollThreadToBottom, selectedConversationId]);

  useEffect(() => {
    if (!isMobileConversationOpen || window.innerWidth >= 768) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileConversationOpen]);

  useEffect(() => {
    if (!selectedConversationId) {
      setIsMobileConversationOpen(false);
    }
  }, [selectedConversationId]);

  return {
    contacts,
    contactQuery,
    contactsError,
    conversations,
    conversationQuery,
    draft,
    error,
    filteredContacts,
    groupedConversations,
    hasMessagingAccess,
    isClosingDirectConversation,
    isContactsLoading,
    isConversationLoading,
    isDeletingMessage,
    isDirectDialogOpen,
    isLoading,
    isMobileConversationOpen,
    isSending,
    messagePendingDeletion,
    selectedConversation,
    selectedConversationId,
    selectedPreview,
    desktopThreadBottomRef,
    desktopThreadScrollAreaRef,
    trackedJobIds,
    unreadConversationCount,
    mobileThreadBottomRef,
    mobileThreadScrollAreaRef,
    addSharedJobToApplications,
    closeSelectedDirectConversation,
    createDirectConversation,
    deleteSelectedMessage,
    openConversation,
    sendCurrentMessage,
    setContactQuery,
    setConversationQuery,
    setDraft,
    setIsDirectDialogOpen,
    setIsMobileConversationOpen,
    setMessagePendingDeletion,
  };
}

export type MessagesPageState = ReturnType<typeof useMessagesPageState>;

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { JobApplication } from "@/types/application";
import { Job } from "@/types/job";
import {
  ConversationDetail,
  ConversationMessage,
  ConversationPreview,
  DirectMessageTarget,
} from "@/types/messaging";

export function useMessagesPageState() {
  const router = useRouter();
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
  const mobileThreadBottomRef = useRef<HTMLDivElement | null>(null);
  const mobileThreadScrollAreaRef = useRef<HTMLDivElement | null>(null);
  const desktopThreadBottomRef = useRef<HTMLDivElement | null>(null);
  const desktopThreadScrollAreaRef = useRef<HTMLDivElement | null>(null);

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
      `${contact.firstName} ${contact.lastName} ${contact.email}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [contactQuery, contacts]);

  const unreadConversationCount = useMemo(
    () => conversations.reduce((total, conversation) => total + conversation.unreadCount, 0),
    [conversations]
  );

  const scrollThreadToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const activeScrollAreaRef = isMobileViewport
      ? mobileThreadScrollAreaRef
      : desktopThreadScrollAreaRef;
    const activeThreadBottomRef = isMobileViewport ? mobileThreadBottomRef : desktopThreadBottomRef;

    const viewport = activeScrollAreaRef.current?.querySelector<HTMLElement>(
      "[data-slot='scroll-area-viewport']"
    );

    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      });
      return;
    }

    activeThreadBottomRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  }, [isMobileViewport]);

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

  const loadConversations = useCallback(
    async (preferredConversationId?: number | null, options?: { silent?: boolean }) => {
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
        const response = await fetch(
          `/api/messages/conversations/${conversationId}${
            options?.markAsRead ? "?markAsRead=1" : ""
          }`,
          { cache: "no-store" }
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
      const response = await fetch("/api/applications", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        applications?: JobApplication[];
      };

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
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

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
  }, [loadConversations, messagePendingDeletion, selectedConversation]);

  const closeSelectedDirectConversation = useCallback(async () => {
    if (!selectedConversationId) {
      return;
    }

    setIsClosingDirectConversation(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/messages/conversations/${selectedConversationId}/close`,
        { method: "POST" }
      );
      const data = (await response.json().catch(() => ({}))) as { error?: string };

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
  }, [loadConversationDetail, loadConversations, selectedConversationId]);

  useEffect(() => {
    if (isLoading || hasMessagingAccess !== false) {
      return;
    }

    toast.error("La messagerie est réservée aux personnes rattachées à un groupe.");
    router.replace("/");
  }, [hasMessagingAccess, isLoading, router]);

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

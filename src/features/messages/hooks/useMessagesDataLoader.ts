"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  fetchConversationDetail,
  fetchConversations,
  fetchMessageContacts,
  fetchTrackedApplications,
} from "@/features/messages/messages.api";
import { ConversationDetail, ConversationPreview, DirectMessageTarget } from "@/types/messaging";

type MessagesDataLoaderInput = {
  setConversations: Dispatch<SetStateAction<ConversationPreview[]>>;
  setHasMessagingAccess: Dispatch<SetStateAction<boolean | null>>;
  setSelectedConversationId: Dispatch<SetStateAction<number | null>>;
  setSelectedConversation: Dispatch<SetStateAction<ConversationDetail | null>>;
  setTrackedJobIds: Dispatch<SetStateAction<string[]>>;
  setContacts: Dispatch<SetStateAction<DirectMessageTarget[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setContactsError: Dispatch<SetStateAction<string | null>>;
  setIsConversationLoading: Dispatch<SetStateAction<boolean>>;
  setIsContactsLoading: Dispatch<SetStateAction<boolean>>;
};

export function useMessagesDataLoader({
  setConversations,
  setHasMessagingAccess,
  setSelectedConversationId,
  setSelectedConversation,
  setTrackedJobIds,
  setContacts,
  setError,
  setContactsError,
  setIsConversationLoading,
  setIsContactsLoading,
}: MessagesDataLoaderInput) {
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
    [setConversations, setError, setHasMessagingAccess, setSelectedConversationId]
  );

  const loadConversationDetail = useCallback(
    async (conversationId: number, options?: { markAsRead?: boolean; silent?: boolean }) => {
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
    [setConversations, setError, setIsConversationLoading, setSelectedConversation]
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
    [setContacts, setContactsError, setIsContactsLoading]
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
  }, [setTrackedJobIds]);

  return {
    loadConversations,
    loadConversationDetail,
    loadContacts,
    loadTrackedApplications,
  };
}

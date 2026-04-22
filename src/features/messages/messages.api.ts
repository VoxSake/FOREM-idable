"use client";

import { JobApplication } from "@/types/application";
import { Job } from "@/types/job";
import {
  ConversationDetail,
  ConversationMessage,
  ConversationPreview,
  DirectMessageTarget,
} from "@/types/messaging";

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export async function fetchConversations() {
  const response = await fetch("/api/messages/conversations", { cache: "no-store" });
  const data = await readJson<{
    error?: string;
    conversations?: ConversationPreview[];
  }>(response);

  return { response, data };
}

export async function fetchConversationDetail(
  conversationId: number,
  options?: { markAsRead?: boolean }
) {
  if (options?.markAsRead) {
    await fetch(`/api/messages/conversations/${conversationId}/read`, {
      method: "POST",
    });
  }

  const response = await fetch(`/api/messages/conversations/${conversationId}`, {
    cache: "no-store",
  });
  const data = await readJson<{
    error?: string;
    conversation?: ConversationDetail;
  }>(response);

  return { response, data };
}

export async function fetchMessageContacts(signal?: AbortSignal) {
  const response = await fetch("/api/messages/contacts", {
    cache: "no-store",
    signal,
  });
  const data = await readJson<{
    error?: string;
    contacts?: DirectMessageTarget[];
  }>(response);

  return { response, data };
}

export async function fetchTrackedApplications() {
  const response = await fetch("/api/applications", { cache: "no-store" });
  const data = await readJson<{
    applications?: JobApplication[];
  }>(response);

  return { response, data };
}

export async function postConversationMessage(conversationId: number, content: string) {
  const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const data = await readJson<{
    cleared?: boolean;
    error?: string;
    message?: ConversationMessage;
  }>(response);

  return { response, data };
}

export async function createTrackedApplication(job: Job) {
  const response = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job }),
  });
  const data = await readJson<{ error?: string }>(response);

  return { response, data };
}

export async function removeConversationMessage(conversationId: number, messageId: number) {
  const response = await fetch(
    `/api/messages/conversations/${conversationId}/messages/${messageId}`,
    { method: "DELETE" }
  );
  const data = await readJson<{
    error?: string;
    message?: ConversationMessage;
  }>(response);

  return { response, data };
}

export async function closeDirectMessageConversation(conversationId: number) {
  const response = await fetch(`/api/messages/conversations/${conversationId}/close`, {
    method: "POST",
  });
  const data = await readJson<{ error?: string }>(response);

  return { response, data };
}

export async function createDirectMessageConversation(targetUserId: number) {
  const response = await fetch("/api/messages/conversations/direct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
  const data = await readJson<{
    error?: string;
    conversation?: ConversationDetail;
  }>(response);

  return { response, data };
}

export async function shareDirectMessage(targetUserId: number, content: string) {
  const response = await fetch("/api/messages/share/direct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId, content }),
  });
  const data = await readJson<{ error?: string }>(response);
  return { response, data };
}

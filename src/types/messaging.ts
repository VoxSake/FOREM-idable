import { UserRole } from "@/types/auth";

export type ConversationType = "group" | "direct";
export type ConversationMessageType = "text" | "job_share";

export interface ConversationParticipantSummary {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  joinedAt: string;
  leftAt: string | null;
}

export interface ConversationPreview {
  id: number;
  type: ConversationType;
  groupId: number | null;
  title: string;
  subtitle: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  participantCount: number;
}

export interface ConversationMessageAuthor {
  userId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface ConversationMessage {
  id: number;
  conversationId: number;
  type: ConversationMessageType;
  content: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  author: ConversationMessageAuthor | null;
  isOwnMessage: boolean;
}

export interface ConversationDetail extends ConversationPreview {
  participants: ConversationParticipantSummary[];
  messages: ConversationMessage[];
}

export interface DirectMessageTarget {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  sharedGroupCount: number;
}

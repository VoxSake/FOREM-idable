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
  unreadCount: number;
  participantCount: number;
}

import { CoachGroupSummary, CoachUserSummary } from "@/types/coach";
import { CalendarSubscriptionScope } from "@/types/calendar";

export type CoachGroupedGroupKind = "standard" | "ungrouped" | "coaches";
export type CoachUserFilter =
  | "all"
  | "urgent"
  | "due"
  | "interviews"
  | "inactive"
  | "accepted"
  | "rejected";

export interface CoachRemoveMembershipTarget {
  groupId: number;
  userId: number;
  userEmail: string;
  groupName: string;
}

export interface CoachRemoveGroupTarget {
  groupId: number;
  groupName: string;
}

export interface CoachEditTarget {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: CoachUserSummary["role"];
}

export interface CoachDeleteUserTarget {
  userId: number;
  email: string;
}

export interface CoachCalendarRegenerationTarget {
  scope: CalendarSubscriptionScope;
  groupId: number | null;
  label: string;
}

export interface CoachApiKeysTarget {
  userId: number;
  email: string;
  role: CoachUserSummary["role"];
}

export interface CoachRevokeApiKeyTarget {
  userId: number;
  keyId: number;
  keyName: string;
  email: string;
}

export type CoachMemberPickerGroup = CoachGroupSummary;

export interface CoachGroupedUserGroup {
  id: number;
  name: string;
  createdByEmail: string | null;
  canAddMembers: boolean;
  kind: CoachGroupedGroupKind;
  totalApplications: number;
  totalInterviews: number;
  totalDue: number;
  totalAccepted: number;
  totalRejected: number;
  members: CoachUserSummary[];
}

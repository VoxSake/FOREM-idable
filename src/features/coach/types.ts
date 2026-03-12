import { CoachGroupSummary, CoachUserSummary } from "@/types/coach";

export type CoachGroupedGroupKind = "standard" | "ungrouped" | "coaches";

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

export interface CoachPasswordTarget {
  userId: number;
  email: string;
}

export interface CoachDeleteUserTarget {
  userId: number;
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
  members: CoachUserSummary[];
}

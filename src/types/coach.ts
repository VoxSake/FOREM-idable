import { JobApplication } from "@/types/application";
import { AuthUser, UserRole } from "@/types/auth";

export interface CoachGroupMember {
  id: number;
  email: string;
  role: UserRole;
}

export interface CoachGroupSummary {
  id: number;
  name: string;
  createdAt: string;
  createdBy: {
    id: number;
    email: string;
  };
  members: CoachGroupMember[];
}

export interface CoachUserSummary {
  id: number;
  email: string;
  role: UserRole;
  groupIds: number[];
  groupNames: string[];
  applicationCount: number;
  interviewCount: number;
  dueCount: number;
  acceptedCount: number;
  rejectedCount: number;
  inProgressCount: number;
  latestActivityAt: string | null;
  applications: JobApplication[];
}

export interface CoachDashboardData {
  viewer: AuthUser;
  users: CoachUserSummary[];
  groups: CoachGroupSummary[];
}

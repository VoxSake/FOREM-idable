import { JobApplication } from "@/types/application";
import { AuthUser, UserRole } from "@/types/auth";

export interface CoachGroupMember {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  lastSeenAt: string | null;
}

export interface CoachGroupSummary {
  id: number;
  name: string;
  createdAt: string;
  createdBy: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  managerCoachId: number | null;
  members: CoachGroupMember[];
  coaches: CoachGroupMember[];
}

export interface CoachUserSummary {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
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
  lastSeenAt: string | null;
  lastCoachActionAt: string | null;
  applications: JobApplication[];
}

export interface CoachDashboardData {
  viewer: AuthUser;
  users: CoachUserSummary[];
  groups: CoachGroupSummary[];
  availableCoaches: CoachGroupMember[];
}

import { ApplicationStatus, JobApplication } from "@/types/application";
import { UserRole } from "@/types/auth";
import { Job } from "@/types/job";

export interface ApiKeySummary {
  id: number;
  name: string;
  keyPrefix: string;
  lastFour: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface ApiKeyCreateResult {
  apiKey: ApiKeySummary;
  plainTextKey: string;
}

export interface ExternalApiActor {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Extract<UserRole, "coach" | "admin">;
}

export interface ExternalApiApplicationRow {
  userId: number;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userRole: UserRole;
  groupIds: number[];
  groupNames: string[];
  application: JobApplication;
}

export interface ExternalApiUserSummary {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
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
  applications?: JobApplication[];
}

export interface ExternalApiUserDetail extends ExternalApiUserSummary {
  favorites: Job[];
}

export interface ExternalApiGroupSummary {
  id: number;
  name: string;
  createdAt: string;
  createdBy: {
    id: number;
    email: string;
  };
  memberCount: number;
  totalApplications: number;
  totalInterviews: number;
  members?: ExternalApiUserSummary[];
}

export interface ExternalApiStats {
  userCount: number;
  groupCount: number;
  applicationCount: number;
  interviewCount: number;
  dueCount: number;
}

export interface ExternalApiUsersResponse {
  actor: ExternalApiActor;
  stats: ExternalApiStats;
  users: ExternalApiUserSummary[];
}

export interface ExternalApiGroupsResponse {
  actor: ExternalApiActor;
  stats: ExternalApiStats;
  groups: ExternalApiGroupSummary[];
}

export interface ExternalApiApplicationsResponse {
  actor: ExternalApiActor;
  stats: ExternalApiStats;
  applications: ExternalApiApplicationRow[];
}

export interface ExternalApiFilters {
  search?: string;
  groupId?: number | null;
  userId?: number | null;
  role?: UserRole | null;
  status?: ApplicationStatus | null;
  dueOnly?: boolean;
  interviewOnly?: boolean;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
  limit?: number;
  offset?: number;
  includeApplications?: boolean;
}

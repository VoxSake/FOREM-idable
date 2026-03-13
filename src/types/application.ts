import { Job } from "@/types/job";
import { UserRole } from "@/types/auth";

export type ApplicationStatus =
  | "in_progress"
  | "follow_up"
  | "interview"
  | "accepted"
  | "rejected";

export type CoachNoteAuthorRole = Extract<UserRole, "coach" | "admin"> | "system";

export interface CoachNoteAuthor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: CoachNoteAuthorRole;
}

export interface CoachSharedNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: CoachNoteAuthor;
  contributors: CoachNoteAuthor[];
}

export interface CoachPrivateNote {
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: CoachNoteAuthor;
  contributors: CoachNoteAuthor[];
}

export interface JobApplication {
  job: Job;
  appliedAt: string;
  followUpDueAt: string;
  lastFollowUpAt?: string;
  status: ApplicationStatus;
  notes?: string;
  proofs?: string;
  privateCoachNote?: CoachPrivateNote;
  sharedCoachNotes?: CoachSharedNote[];
  interviewAt?: string;
  interviewDetails?: string;
  updatedAt: string;
}

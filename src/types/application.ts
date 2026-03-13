import { Job } from "@/types/job";

export type ApplicationStatus =
  | "in_progress"
  | "follow_up"
  | "interview"
  | "accepted"
  | "rejected";

export interface JobApplication {
  job: Job;
  appliedAt: string;
  followUpDueAt: string;
  lastFollowUpAt?: string;
  status: ApplicationStatus;
  notes?: string;
  proofs?: string;
  coachNote?: string;
  shareCoachNoteWithBeneficiary?: boolean;
  interviewAt?: string;
  interviewDetails?: string;
  updatedAt: string;
}

import { Job } from "@/types/job";

export type ApplicationStatus =
  | "in_progress"
  | "follow_up"
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
  updatedAt: string;
}

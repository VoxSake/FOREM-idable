import { normalizeContractType } from "@/lib/contractType";
import { JobApplication } from "@/types/application";

export function isStageContract(contractType: string): boolean {
  return normalizeContractType(contractType) === "STAGE";
}

export function hasAcceptedStage(applications: JobApplication[]): boolean {
  return applications.some(
    (a) => a.status === "accepted" && isStageContract(a.job.contractType)
  );
}

export function hasAcceptedJob(applications: JobApplication[]): boolean {
  return applications.some(
    (a) => a.status === "accepted" && !isStageContract(a.job.contractType)
  );
}

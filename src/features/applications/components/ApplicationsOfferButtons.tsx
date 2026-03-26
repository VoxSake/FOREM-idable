"use client";

import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getJobExternalUrl, getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { isManualApplication } from "@/lib/applications/sourceType";
import { JobApplication } from "@/types/application";

interface ApplicationsOfferButtonsProps {
  application: JobApplication;
  layout?: "card" | "sheet";
}

export function ApplicationsOfferButtons({
  application,
  layout = "card",
}: ApplicationsOfferButtonsProps) {
  const pdfUrl = getJobPdfUrl(application.job);
  const jobUrl = getJobExternalUrl(application.job);
  const isSheet = layout === "sheet";
  const hasWebLink = Boolean(application.job.url) && !isManualApplication(application);

  return (
    <div
      className={isSheet ? "flex flex-wrap gap-2" : "grid grid-cols-2 gap-2"}
      onClick={(event) => event.stopPropagation()}
    >
      {hasWebLink ? (
        <Button
          size="sm"
          asChild
          className={`h-8 gap-1 whitespace-nowrap ${isSheet ? "px-3" : "w-full"}`}
        >
          <a href={jobUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />
            WEB
          </a>
        </Button>
      ) : null}
      {pdfUrl ? (
        <Button
          variant="outline"
          size="sm"
          asChild
          className={`h-8 whitespace-nowrap ${isSheet ? "px-3" : "w-full"}`}
        >
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <FileText className="mr-1 h-3 w-3" />
            PDF
          </a>
        </Button>
      ) : null}
    </div>
  );
}

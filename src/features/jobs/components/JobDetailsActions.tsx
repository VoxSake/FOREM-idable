"use client";

import { ExternalLink, FileText, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApplications } from "@/hooks/useApplications";
import { Job } from "@/types/job";

interface JobDetailsActionsProps {
  mailtoHref: string;
  pdfUrl: string | null;
  jobUrl: string;
  job: Job;
}

export function JobDetailsActions({ mailtoHref, pdfUrl, jobUrl, job }: JobDetailsActionsProps) {
  const { addApplication, isApplied, isLoaded } = useApplications();
  const applied = isApplied(job.id);

  return (
    <>
      <Button
        variant={applied ? "secondary" : "outline"}
        type="button"
        onClick={() => addApplication(job)}
        disabled={!isLoaded}
        className="w-full sm:w-auto whitespace-normal h-auto py-2.5 px-3 text-center"
      >
        <Send className="w-4 h-4 mr-2" />
        {applied ? "Candidature suivie" : "Marquer comme candidature envoyée"}
      </Button>
      <Button
        variant="outline"
        asChild
        className="w-full sm:w-auto whitespace-normal h-auto py-2.5 px-3 text-center"
      >
        <a href={mailtoHref}>
          <Mail className="w-4 h-4 mr-2" />
          Partager par email
        </a>
      </Button>
      {pdfUrl && (
        <Button
          variant="outline"
          asChild
          className="w-full sm:w-auto whitespace-normal h-auto py-2.5 px-3 text-center"
        >
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <FileText className="w-4 h-4 mr-2" />
            Ouvrir le PDF
          </a>
        </Button>
      )}
      <Button
        asChild
        size="lg"
        className="w-full sm:w-auto whitespace-normal h-auto py-2.5 px-3 text-center font-semibold"
      >
        <a href={jobUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-4 h-4 mr-2" />
          Voir tous les détails de l&apos;offre
        </a>
      </Button>
    </>
  );
}

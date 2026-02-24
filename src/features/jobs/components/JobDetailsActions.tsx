"use client";

import { ExternalLink, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobDetailsActionsProps {
  mailtoHref: string;
  pdfUrl: string | null;
  jobUrl: string;
}

export function JobDetailsActions({ mailtoHref, pdfUrl, jobUrl }: JobDetailsActionsProps) {
  return (
    <>
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

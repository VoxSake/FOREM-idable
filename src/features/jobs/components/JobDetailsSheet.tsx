"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Job } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getForemOfferId, getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { useOfferDetails } from "@/features/jobs/hooks/useOfferDetails";
import { buildOfferMailtoLink } from "@/features/jobs/utils/shareOfferMail";
import { JobDetailsActions } from "@/features/jobs/components/JobDetailsActions";


interface JobDetailsSheetProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailsSheet({ job, open, onOpenChange }: JobDetailsSheetProps) {
  const offerId = job ? getForemOfferId(job) : null;
  const { details } = useOfferDetails({
    offerId,
    source: job?.source,
    open,
  });

  if (!job) return null;

  const pdfUrl = getJobPdfUrl(job);
  const description = details?.description || job.description;
  const publicationLabel = job.publicationDate
    ? format(new Date(job.publicationDate), "dd MMM yyyy", { locale: fr })
    : "N/A";
  const mailtoHref = buildOfferMailtoLink(job, publicationLabel);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        <SheetHeader className="border-b bg-muted/30 p-5 pr-12">
          <SheetTitle className="text-lg leading-snug">{job.title}</SheetTitle>
          <SheetDescription className="text-sm">
            {job.company || "Entreprise non précisée"} • {job.location}
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="outline">{job.contractType}</Badge>
            <Badge variant="secondary">{job.source.toUpperCase()}</Badge>
            <Badge variant="outline">
              Publiée le {job.publicationDate ? format(new Date(job.publicationDate), "dd MMM yyyy", { locale: fr }) : "N/A"}
            </Badge>
          </div>
        </SheetHeader>

        <div className="p-5 text-sm leading-6 text-foreground/90 overflow-y-auto space-y-5">
          {description ? (
            <p className="whitespace-pre-wrap">{description}</p>
          ) : (
            <p className="text-muted-foreground">Aucune description détaillée disponible pour cette offre.</p>
          )}

          {details?.highlights && details.highlights.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
              <h3 className="font-semibold text-foreground">Informations complémentaires</h3>
              <div className="space-y-2">
                {details.highlights.map((item) => (
                  <p key={`${item.label}-${item.value}`} className="text-xs leading-5 text-foreground/85">
                    <span className="font-semibold text-foreground">{item.label}:</span> {item.value}
                  </p>
                ))}
              </div>
            </div>
          )}

          {details?.sections && details.sections.length > 0 && (
            <div className="space-y-3">
              {details.sections.map((section) => (
                <section key={`${section.title}-${section.content.slice(0, 20)}`} className="rounded-xl border border-border/60 bg-card p-4">
                  <h3 className="font-semibold text-foreground">{section.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{section.content}</p>
                </section>
              ))}
            </div>
          )}
        </div>

        <SheetFooter className="border-t bg-background/95 p-4">
          <JobDetailsActions
            mailtoHref={mailtoHref}
            pdfUrl={pdfUrl}
            jobUrl={job.url}
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

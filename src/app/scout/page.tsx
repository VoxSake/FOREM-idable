"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import { ScoutForm } from "@/features/scout/components/ScoutForm";
import { ScoutProgressPanel } from "@/features/scout/components/ScoutProgressPanel";
import { ScoutResultsTable } from "@/features/scout/components/ScoutResultsTable";
import { ScoutJobHistory } from "@/features/scout/components/ScoutJobHistory";
import { useScoutPageState } from "@/features/scout/hooks/useScoutPageState";
import { ScoutResult } from "@/features/scout/scoutSchemas";

export default function ScoutPage() {
  const { user } = useAuth();
  const page = useScoutPageState();
  const [appliedResult, setAppliedResult] = useState<ScoutResult | null>(null);

  if (!user) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-bold">Connexion requise</h1>
          <p className="mt-2 text-muted-foreground">
            Connectez-vous pour utiliser le Scout.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleApply = (result: ScoutResult) => {
    setAppliedResult(result);
    // For now, open in new tab with pre-filled params or show a toast
    // We'll integrate with ManualApplicationDialog in a follow-up
    const params = new URLSearchParams({
      company: result.name,
      url: result.website ?? "",
      location: result.address ?? result.town ?? "",
    });
    window.open(`/applications?${params.toString()}`, "_blank");
  };

  return (
    <div className="mx-auto flex min-w-0 max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <MapPin className="text-primary" />
          Scout
        </h1>
        <p className="text-muted-foreground">
          Découvrez des entreprises autour d&apos;une ville via OpenStreetMap.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <ScoutForm onSubmit={page.startJob} isLoading={page.isSubmitting} />

          {page.progress && (
            <ScoutProgressPanel
              step={page.progress.step}
              total={page.progress.total}
              found={page.progress.found}
              message={page.progress.message}
            />
          )}

          {(page.activeJob?.status === "completed" || page.results.length > 0) && (
            <ScoutResultsTable results={page.results} onApply={handleApply} />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <ScoutJobHistory
            jobs={page.jobs}
            activeJobId={page.activeJob?.id}
            onSelect={(job) => page.loadJobDetail(job.id)}
            onDelete={(jobId) => page.removeJob(jobId)}
          />
        </div>
      </div>
    </div>
  );
}

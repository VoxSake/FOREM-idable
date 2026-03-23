"use client";

import Link from "next/link";
import { ShieldCheck, Users, KeyRound, ArrowRight } from "lucide-react";
import { useToastFeedback } from "@/hooks/useToastFeedback";
import { CoachAdminSection } from "@/features/coach/components/CoachAdminSection";
import { useAdminPageState } from "@/features/admin/useAdminPageState";
import { AdminApiKeysSection } from "@/features/admin/components/AdminApiKeysSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Users;
}) {
  return (
    <Card className="border-border/60 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-col gap-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-3xl font-black tracking-tight">{value}</CardTitle>
        </div>
        <div className="rounded-full border border-border/60 bg-muted/30 p-3">
          <Icon className="text-primary" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 text-sm text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  );
}

function AdminPageSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-56" />
            </div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-full max-w-3xl" />
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  const page = useAdminPageState();
  const isInitialPageLoading = page.isAuthLoading || (page.isLoading && !page.dashboard);

  useToastFeedback(page.feedback, { title: "Administration" });
  useToastFeedback(page.apiKeysFeedback, { title: "Clés API admin" });

  if (isInitialPageLoading) {
    return <AdminPageSkeleton />;
  }

  if (!page.user || !page.isAuthorized) {
    return (
      <Card className="mx-auto max-w-3xl gap-0 py-0">
        <CardContent className="p-8">
          <h1 className="text-2xl font-black tracking-tight">Accès réservé</h1>
          <p className="mt-2 text-muted-foreground">
            Cette page est réservée aux comptes `admin`.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <Card className="overflow-hidden border-border/60 bg-card py-0">
        <CardHeader className="gap-5 border-b border-border/60 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">admin</Badge>
                <Badge variant="outline">Pilotage des rôles et des accès API</Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
                  Administration
                </CardTitle>
                <CardDescription className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                  Espace dédié aux opérations sensibles: gestion des coachs, visibilité globale
                  des clés Bearer et révocation centralisée sans surcharger l&apos;espace `/coach`.
                </CardDescription>
              </div>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]">
              <Button asChild variant="outline" className="justify-between bg-card/80">
                <a href="#coachs">
                  <span className="inline-flex items-center gap-2">
                    <Users data-icon="inline-start" />
                    Coachs
                  </span>
                  <ArrowRight data-icon="inline-end" />
                </a>
              </Button>
              <Button asChild variant="outline" className="justify-between bg-card/80">
                <a href="#cles-api">
                  <span className="inline-flex items-center gap-2">
                    <KeyRound data-icon="inline-start" />
                    Clés API
                  </span>
                  <ArrowRight data-icon="inline-end" />
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Le suivi opérationnel reste disponible dans{" "}
            <Link href="/coach" className="text-primary hover:underline">
              l&apos;espace coach
            </Link>
            . Cette page concentre uniquement les fonctions d&apos;administration.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Coachs actifs"
          value={page.managedCoaches.length}
          description="Comptes actuellement promus au rôle coach."
          icon={Users}
        />
        <SummaryCard
          title="Groupes"
          value={page.dashboard?.groups.length ?? 0}
          description="Groupes actuellement configurés dans l'espace coach."
          icon={ShieldCheck}
        />
        <SummaryCard
          title="Clés actives"
          value={page.apiKeyStats.active}
          description="Clés Bearer non révoquées et encore valides."
          icon={KeyRound}
        />
        <SummaryCard
          title="Expirent bientôt"
          value={page.apiKeyStats.expiringSoon}
          description="Clés arrivant à échéance dans les 14 prochains jours."
          icon={ShieldCheck}
        />
      </div>

      <div id="coachs">
        <CoachAdminSection
          coaches={page.managedCoaches}
          groups={page.dashboard?.groups ?? []}
          promotableUsers={page.promotableUsers}
          isPromoteCoachOpen={page.isPromoteCoachOpen}
          onPromoteCoachOpenChange={page.setIsPromoteCoachOpen}
          onPromoteCoach={(userId) => void page.promoteCoach(userId)}
          onDemoteCoach={(userId) => void page.demoteCoach(userId)}
        />
      </div>

      <AdminApiKeysSection
        apiKeys={page.apiKeys}
        isLoading={page.isApiKeysLoading}
        isRevoking={page.isRevokingApiKey}
        revokeTarget={page.revokeTarget}
        onRefresh={() => void page.loadApiKeys()}
        onRevokeRequest={page.setRevokeTarget}
        onRevokeConfirm={() => void page.revokeApiKey()}
        onRevokeDialogOpenChange={(open) => !open && page.setRevokeTarget(null)}
      />
    </div>
  );
}

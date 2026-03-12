"use client";

interface CoachSummaryCardsProps {
  userCount: number;
  totalApplications: number;
  totalInterviews: number;
  totalDue: number;
  totalAccepted: number;
  totalRejected: number;
}

export function CoachSummaryCards({
  userCount,
  totalApplications,
  totalInterviews,
  totalDue,
  totalAccepted,
  totalRejected,
}: CoachSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Utilisateurs suivis</p>
        <p className="mt-2 text-3xl font-black">{userCount}</p>
      </div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Candidatures visibles</p>
        <p className="mt-2 text-3xl font-black">{totalApplications}</p>
      </div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Entretiens</p>
        <p className="mt-2 text-3xl font-black text-sky-700 dark:text-sky-300">{totalInterviews}</p>
      </div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Relances dues</p>
        <p className="mt-2 text-3xl font-black text-amber-700 dark:text-amber-300">{totalDue}</p>
      </div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Acceptées / refusées</p>
        <p className="mt-2 text-3xl font-black">
          <span className="text-emerald-700 dark:text-emerald-300">{totalAccepted}</span>
          {" / "}
          <span className="text-rose-700 dark:text-rose-300">{totalRejected}</span>
        </p>
      </div>
    </div>
  );
}

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
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      <div className="rounded-2xl border bg-card p-3 shadow-sm md:p-4">
        <p className="text-xs text-muted-foreground md:text-sm">Bénéficiaires suivis</p>
        <p className="mt-1 text-2xl font-black md:mt-2 md:text-3xl">{userCount}</p>
      </div>
      <div className="rounded-2xl border bg-card p-3 shadow-sm md:p-4">
        <p className="text-xs text-muted-foreground md:text-sm">Candidatures</p>
        <p className="mt-1 text-2xl font-black md:mt-2 md:text-3xl">{totalApplications}</p>
      </div>
      <div className="rounded-2xl border bg-card p-3 shadow-sm md:p-4">
        <p className="text-xs text-muted-foreground md:text-sm">Entretiens</p>
        <p className="mt-1 text-2xl font-black text-sky-700 md:mt-2 md:text-3xl dark:text-sky-300">{totalInterviews}</p>
      </div>
      <div className="rounded-2xl border bg-card p-3 shadow-sm md:p-4">
        <p className="text-xs text-muted-foreground md:text-sm">Relances</p>
        <p className="mt-1 text-2xl font-black text-amber-700 md:mt-2 md:text-3xl dark:text-amber-300">{totalDue}</p>
      </div>
      <div className="col-span-2 rounded-2xl border bg-card p-3 shadow-sm md:col-span-1 md:p-4">
        <p className="text-xs text-muted-foreground md:text-sm">Acceptées / refusées</p>
        <p className="mt-1 text-2xl font-black md:mt-2 md:text-3xl">
          <span className="text-emerald-700 dark:text-emerald-300">{totalAccepted}</span>
          {" / "}
          <span className="text-rose-700 dark:text-rose-300">{totalRejected}</span>
        </p>
      </div>
    </div>
  );
}

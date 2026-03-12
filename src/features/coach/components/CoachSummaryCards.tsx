"use client";

interface CoachSummaryCardsProps {
  userCount: number;
  totalApplications: number;
  totalInterviews: number;
  totalDue: number;
}

export function CoachSummaryCards({
  userCount,
  totalApplications,
  totalInterviews,
  totalDue,
}: CoachSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Utilisateurs suivis</p>
        <p className="mt-2 text-3xl font-black">{userCount}</p>
      </div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Candidatures visibles</p>
        <p className="mt-2 text-3xl font-black">{totalApplications}</p>
      </div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Entretiens / relances dues</p>
        <p className="mt-2 text-3xl font-black">
          {totalInterviews} / {totalDue}
        </p>
      </div>
    </div>
  );
}

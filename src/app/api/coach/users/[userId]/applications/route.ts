import { NextRequest, NextResponse } from "next/server";
import { requireCoachAccess, updateCoachApplicationNote } from "@/lib/server/coach";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const viewer = await requireCoachAccess();
    if (!viewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await context.params;
    const body = (await request.json()) as {
      jobId?: string;
      coachNote?: string;
      shareCoachNoteWithBeneficiary?: boolean;
    };

    if (!body.jobId || typeof body.jobId !== "string") {
      return NextResponse.json({ error: "jobId requis." }, { status: 400 });
    }

    const application = await updateCoachApplicationNote({
      userId: Number(userId),
      jobId: body.jobId,
      coachNote: body.coachNote ?? "",
      shareCoachNoteWithBeneficiary: Boolean(body.shareCoachNoteWithBeneficiary),
    });

    return NextResponse.json({ application });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Impossible de mettre à jour la note coach." },
      { status: 500 }
    );
  }
}

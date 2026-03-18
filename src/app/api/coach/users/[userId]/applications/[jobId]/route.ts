import { NextRequest, NextResponse } from "next/server";
import {
  deleteCoachManagedApplication,
  requireCoachAccess,
  updateCoachManagedApplication,
} from "@/lib/server/coach";
import { JobApplication } from "@/types/application";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string; jobId: string }> }
) {
  try {
    const viewer = await requireCoachAccess();
    if (!viewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, jobId } = await context.params;
    const body = (await request.json()) as {
      patch?: Partial<
        Pick<
          JobApplication,
          | "status"
          | "notes"
          | "proofs"
          | "interviewAt"
          | "interviewDetails"
          | "lastFollowUpAt"
          | "followUpDueAt"
          | "followUpEnabled"
          | "appliedAt"
          | "job"
        >
      >;
    };

    if (!body.patch || typeof body.patch !== "object") {
      return NextResponse.json({ error: "Modification invalide." }, { status: 400 });
    }

    const application = await updateCoachManagedApplication({
      actor: viewer,
      userId: Number(userId),
      jobId,
      patch: body.patch,
    });

    return NextResponse.json({ application });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Manual job editing forbidden") {
      return NextResponse.json(
        { error: "Seules les candidatures manuelles peuvent modifier ces champs." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de mettre à jour la candidature." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ userId: string; jobId: string }> }
) {
  try {
    const viewer = await requireCoachAccess();
    if (!viewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, jobId } = await context.params;
    await deleteCoachManagedApplication({
      actor: viewer,
      userId: Number(userId),
      jobId,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de supprimer la candidature." },
      { status: 500 }
    );
  }
}

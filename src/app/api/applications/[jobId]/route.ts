import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import {
  deleteApplicationForUser,
  updateApplicationForUser,
} from "@/lib/server/applications";
import { JobApplication } from "@/types/application";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await context.params;
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

    const application = await updateApplicationForUser({
      userId: user.id,
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

    return NextResponse.json({ error: "Impossible de mettre à jour la candidature." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await context.params;
    await deleteApplicationForUser(user.id, jobId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Impossible de supprimer la candidature." }, { status: 500 });
  }
}

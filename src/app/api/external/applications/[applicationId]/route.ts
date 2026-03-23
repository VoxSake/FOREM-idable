import { NextRequest, NextResponse } from "next/server";
import {
  deleteExternalApplication,
  getExternalApplicationDetail,
  patchExternalApplication,
} from "@/lib/server/externalApi";
import { requireExternalApiAccess } from "@/lib/server/externalApiRoute";
import { JobApplication } from "@/types/application";

function parseApplicationId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { applicationId: rawApplicationId } = await context.params;
    const applicationId = parseApplicationId(rawApplicationId);
    if (!applicationId) {
      return NextResponse.json({ error: "Candidature invalide." }, { status: 400 });
    }

    const application = await getExternalApplicationDetail(actor, applicationId);
    if (!application) {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }

    return NextResponse.json({ actor, application });
  } catch {
    return NextResponse.json({ error: "Lecture candidature impossible." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { applicationId: rawApplicationId } = await context.params;
    const applicationId = parseApplicationId(rawApplicationId);
    if (!applicationId) {
      return NextResponse.json({ error: "Candidature invalide." }, { status: 400 });
    }

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
      return NextResponse.json({ error: "Patch invalide." }, { status: 400 });
    }

    const response = await patchExternalApplication(actor, applicationId, body.patch);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Manual job editing forbidden") {
      return NextResponse.json(
        { error: "Seules les candidatures manuelles peuvent modifier le job." },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: "Mise à jour candidature impossible." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { applicationId: rawApplicationId } = await context.params;
    const applicationId = parseApplicationId(rawApplicationId);
    if (!applicationId) {
      return NextResponse.json({ error: "Candidature invalide." }, { status: 400 });
    }

    await deleteExternalApplication(actor, applicationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }

    return NextResponse.json({ error: "Suppression candidature impossible." }, { status: 500 });
  }
}

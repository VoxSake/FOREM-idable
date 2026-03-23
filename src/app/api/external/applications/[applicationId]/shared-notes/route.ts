import { NextRequest, NextResponse } from "next/server";
import { createExternalSharedNote } from "@/lib/server/externalApi";
import { requireExternalApiAccess } from "@/lib/server/externalApiRoute";

function parseApplicationId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function POST(
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

    const body = (await request.json()) as { content?: string };
    if (typeof body.content !== "string" || !body.content.trim()) {
      return NextResponse.json({ error: "content requis." }, { status: 400 });
    }

    const response = await createExternalSharedNote(actor, applicationId, body.content);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Shared note content required") {
      return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
    }

    return NextResponse.json({ error: "Création note partagée impossible." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  CoachImportDateFormat,
  importCoachApplicationsForUser,
  requireCoachAccess,
  updateCoachApplicationNotes,
} from "@/lib/server/coach";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const viewer = await requireCoachAccess();
    if (!viewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await context.params;
    const body = (await request.json()) as {
      jobId?: string;
      action?: "save-private" | "create-shared" | "update-shared" | "delete-shared";
      content?: string;
      noteId?: string;
    };

    if (!body.jobId || typeof body.jobId !== "string") {
      return NextResponse.json({ error: "jobId requis." }, { status: 400 });
    }

    if (!body.action) {
      return NextResponse.json({ error: "Action requise." }, { status: 400 });
    }

    const application = await updateCoachApplicationNotes({
      actor: viewer,
      userId: Number(userId),
      jobId: body.jobId,
      privateNoteContent: body.action === "save-private" ? body.content ?? "" : undefined,
      sharedNoteContent:
        body.action === "create-shared" || body.action === "update-shared"
          ? body.content ?? ""
          : undefined,
      sharedNoteId:
        body.action === "update-shared" || body.action === "delete-shared"
          ? body.noteId
          : undefined,
      createSharedNote: body.action === "create-shared",
      deleteSharedNote: body.action === "delete-shared",
    });

    return NextResponse.json({ application });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
      return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "Shared note content required") {
      return NextResponse.json({ error: "Contenu de note partagée requis." }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Impossible de mettre à jour les notes coach." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const viewer = await requireCoachAccess();
    if (!viewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await context.params;
    const body = (await request.json()) as {
      dateFormat?: CoachImportDateFormat;
      rows?: Array<{
        company?: string;
        contractType?: string;
        title?: string;
        location?: string;
        appliedAt?: string;
        status?: string;
        notes?: string;
      }>;
    };

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json({ error: "Aucune ligne à importer." }, { status: 400 });
    }

    const importedApplications = await importCoachApplicationsForUser({
      actor: viewer,
      userId: Number(userId),
      dateFormat: body.dateFormat === "mdy" ? "mdy" : "dmy",
      rows: body.rows.map((row) => ({
        company: row.company ?? "",
        contractType: row.contractType,
        title: row.title ?? "",
        location: row.location,
        appliedAt: row.appliedAt,
        status: row.status as never,
        notes: row.notes,
      })),
    });

    return NextResponse.json({
      importedCount: importedApplications.applications.length,
      createdCount: importedApplications.createdCount,
      updatedCount: importedApplications.updatedCount,
      ignoredCount: importedApplications.ignoredCount,
      applications: importedApplications.applications,
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'importer le suivi CSV." },
      { status: 500 }
    );
  }
}

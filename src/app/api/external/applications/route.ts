import { NextRequest, NextResponse } from "next/server";
import {
  buildApplicationsCsv,
  getExternalApplications,
  upsertExternalApplication,
} from "@/lib/server/externalApi";
import {
  csvResponse,
  getRequestedFormat,
  parseExternalFilters,
  requireExternalApiAccess,
} from "@/lib/server/externalApiRoute";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const response = await getExternalApplications(actor, parseExternalFilters(request));
    if (getRequestedFormat(request) === "csv") {
      return csvResponse("forem-applications.csv", buildApplicationsCsv(response.applications));
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Export candidatures impossible." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const body = (await request.json()) as {
      match?: { userId?: number; jobId?: string };
      data?: {
        status?: string;
        notes?: string;
        proofs?: string;
        interviewAt?: string | null;
        interviewDetails?: string | null;
        lastFollowUpAt?: string | null;
        followUpDueAt?: string | null;
        followUpEnabled?: boolean;
        appliedAt?: string;
        job?: {
          title?: string;
          company?: string;
          location?: string;
          contractType?: string;
          url?: string;
          publicationDate?: string;
          description?: string;
          source?: "forem" | "linkedin" | "indeed" | "adzuna";
          pdfUrl?: string;
        };
      };
    };

    if (!body.match?.userId || !body.match?.jobId || !body.data?.job?.title) {
      return NextResponse.json(
        { error: "match.userId, match.jobId et data.job.title sont requis." },
        { status: 400 }
      );
    }

    const response = await upsertExternalApplication(actor, {
      match: {
        userId: body.match.userId,
        jobId: body.match.jobId,
      },
      data: {
        status: body.data.status as never,
        notes: body.data.notes,
        proofs: body.data.proofs,
        interviewAt: body.data.interviewAt ?? undefined,
        interviewDetails: body.data.interviewDetails ?? undefined,
        lastFollowUpAt: body.data.lastFollowUpAt ?? undefined,
        followUpDueAt: body.data.followUpDueAt ?? undefined,
        followUpEnabled: body.data.followUpEnabled,
        appliedAt: body.data.appliedAt,
        job: {
          title: body.data.job.title,
          company: body.data.job.company,
          location: body.data.job.location,
          contractType: body.data.job.contractType,
          url: body.data.job.url,
          publicationDate: body.data.job.publicationDate,
          description: body.data.job.description,
          source: body.data.job.source,
          pdfUrl: body.data.job.pdfUrl,
        },
      },
    });

    return NextResponse.json(response, { status: response.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Upsert candidature impossible." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import {
  createTrackedApplicationForUser,
  listApplicationsForUser,
} from "@/lib/server/applications";
import { ApplicationStatus } from "@/types/application";
import { Job } from "@/types/job";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await listApplicationsForUser(user.id);
    return NextResponse.json({ applications });
  } catch {
    return NextResponse.json({ error: "Impossible de charger les candidatures." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      job?: Job;
      appliedAt?: string;
      status?: ApplicationStatus;
      notes?: string;
      proofs?: string;
      interviewAt?: string;
      interviewDetails?: string;
    };

    if (!body.job || typeof body.job.id !== "string") {
      return NextResponse.json({ error: "Offre invalide." }, { status: 400 });
    }

    const application = await createTrackedApplicationForUser({
      userId: user.id,
      job: body.job,
      appliedAt: body.appliedAt,
      status: body.status,
      notes: body.notes,
      proofs: body.proofs,
      interviewAt: body.interviewAt,
      interviewDetails: body.interviewDetails,
    });

    return NextResponse.json({ application });
  } catch {
    return NextResponse.json({ error: "Impossible d'ajouter la candidature." }, { status: 500 });
  }
}

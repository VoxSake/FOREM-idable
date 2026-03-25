import { NextRequest, NextResponse } from "next/server";
import {
  cancelPendingAccountDeletionRequest,
  createAccountDeletionRequest,
  listAccountDeletionRequests,
} from "@/lib/server/compliance";
import { getCurrentUser } from "@/lib/server/auth";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { accountDeletionRequestSchema, readValidatedJson } from "@/lib/server/requestSchemas";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await listAccountDeletionRequests(user.id);
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Demandes indisponibles." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await readValidatedJson(request, accountDeletionRequestSchema);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const deletionRequest = await createAccountDeletionRequest(user, parsed.data.reason);
    return NextResponse.json({ request: deletionRequest }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "ActiveLegalHoldError") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      if (error.name === "DuplicateDeletionRequestError") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Demande impossible." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cancelled = await cancelPendingAccountDeletionRequest(user);
    if (!cancelled) {
      return NextResponse.json({ error: "Aucune demande en attente." }, { status: 404 });
    }

    return NextResponse.json({ request: cancelled });
  } catch {
    return NextResponse.json({ error: "Annulation impossible." }, { status: 500 });
  }
}

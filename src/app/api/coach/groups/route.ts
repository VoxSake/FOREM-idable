import { NextRequest, NextResponse } from "next/server";
import { createCoachGroup, deleteCoachGroup, requireCoachAccess } from "@/lib/server/coach";
import { withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await requireCoachAccess();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name : "";
    if (!name.trim()) {
      return NextResponse.json({ error: "Nom de groupe requis." }, { status: 400 });
    }

    const group = await createCoachGroup(name, user);
    return NextResponse.json({ group });
  } catch {
    return NextResponse.json({ error: "Création de groupe impossible." }, { status: 500 });
  }});
}

export async function DELETE(request: NextRequest) {
  return withRequestContext(request, async () => {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await requireCoachAccess();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const groupId = Number(request.nextUrl.searchParams.get("groupId"));
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return NextResponse.json({ error: "Groupe invalide." }, { status: 400 });
    }

    await deleteCoachGroup(groupId, user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Suppression du groupe impossible." }, { status: 500 });
  }});
}

import { NextRequest, NextResponse } from "next/server";
import {
  addCoachToGroup,
  removeCoachFromGroup,
  requireCoachAccess,
} from "@/lib/server/coach";
import { withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

function parseGroupId(value: string) {
  const groupId = Number(value);
  return Number.isInteger(groupId) ? groupId : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  return withRequestContext(request, async () => {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await requireCoachAccess();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { groupId: rawGroupId } = await context.params;
    const groupId = parseGroupId(rawGroupId);
    const body = await request.json();
    const userId = typeof body.userId === "number" ? body.userId : Number(body.userId);

    if (!groupId || !Number.isInteger(userId)) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await addCoachToGroup(groupId, userId, user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Coach required") {
      return NextResponse.json({ error: "Seuls les comptes coach peuvent être attribués." }, { status: 400 });
    }

    return NextResponse.json({ error: "Attribution du coach impossible." }, { status: 500 });
  }});
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  return withRequestContext(request, async () => {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await requireCoachAccess();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { groupId: rawGroupId } = await context.params;
    const groupId = parseGroupId(rawGroupId);
    const userId = Number(request.nextUrl.searchParams.get("userId"));

    if (!groupId || !Number.isInteger(userId)) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await removeCoachFromGroup(groupId, userId, user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "SelfRemovalForbidden") {
      return NextResponse.json(
        { error: "Un coach ne peut pas se retirer lui-même d'un groupe attribué." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Retrait du coach impossible." }, { status: 500 });
  }});
}

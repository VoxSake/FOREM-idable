import { NextRequest, NextResponse } from "next/server";
import { addUserToCoachGroup, removeUserFromCoachGroup, requireCoachAccess } from "@/lib/server/coach";
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

    await addUserToCoachGroup(groupId, userId, user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Ajout au groupe impossible." }, { status: 500 });
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

    await removeUserFromCoachGroup(groupId, userId, user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Suppression du groupe impossible." }, { status: 500 });
  }});
}

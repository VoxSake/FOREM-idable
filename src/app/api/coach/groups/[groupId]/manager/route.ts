import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, setCoachGroupManager } from "@/lib/server/coach";
import { withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

function parseGroupId(value: string) {
  const groupId = Number(value);
  return Number.isInteger(groupId) ? groupId : null;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  return withRequestContext(request, async () => {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await requireAdminAccess();
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

    await setCoachGroupManager(groupId, userId, user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Coach assignment required") {
      return NextResponse.json(
        { error: "Le manager doit être un coach déjà attribué à ce groupe." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Définition du manager impossible." }, { status: 500 });
  }});
}

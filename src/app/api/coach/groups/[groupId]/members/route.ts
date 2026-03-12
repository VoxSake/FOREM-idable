import { NextRequest, NextResponse } from "next/server";
import { addUserToCoachGroup, removeUserFromCoachGroup, requireCoachAccess } from "@/lib/server/coach";

function parseGroupId(value: string) {
  const groupId = Number(value);
  return Number.isInteger(groupId) ? groupId : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
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

    await addUserToCoachGroup(groupId, userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ajout au groupe impossible." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
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

    await removeUserFromCoachGroup(groupId, userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Suppression du groupe impossible." }, { status: 500 });
  }
}

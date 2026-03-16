import { NextResponse } from "next/server";
import { markCoachAction, requireAdminAccess } from "@/lib/server/coach";
import { revokeApiKey } from "@/lib/server/apiKeys";

function parseInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ userId: string; keyId: string }> }
) {
  try {
    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId: rawUserId, keyId: rawKeyId } = await context.params;
    const userId = parseInteger(rawUserId);
    const keyId = parseInteger(rawKeyId);
    if (!userId || !keyId) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    await revokeApiKey(userId, keyId);
    await markCoachAction(admin.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Révocation impossible." }, { status: 500 });
  }
}

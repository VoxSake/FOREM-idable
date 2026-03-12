import { NextResponse } from "next/server";
import { revokeApiKey } from "@/lib/server/apiKeys";
import { getCurrentUser } from "@/lib/server/auth";

function parseKeyId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

function canManageApiKeys(role: string) {
  return role === "coach" || role === "admin";
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ keyId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageApiKeys(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { keyId: rawKeyId } = await context.params;
    const keyId = parseKeyId(rawKeyId);
    if (!keyId) {
      return NextResponse.json({ error: "Clé API invalide." }, { status: 400 });
    }

    await revokeApiKey(user.id, keyId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Révocation impossible." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { deleteUserAccount, setUserPassword } from "@/lib/server/auth";
import { requireAdminAccess } from "@/lib/server/coach";

function parseUserId(value: string) {
  const userId = Number(value);
  return Number.isInteger(userId) ? userId : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId: rawUserId } = await context.params;
    const userId = parseUserId(rawUserId);
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";

    if (!userId || password.length < 8) {
      return NextResponse.json({ error: "Mot de passe invalide." }, { status: 400 });
    }

    await setUserPassword(userId, password);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Changement de mot de passe impossible." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId: rawUserId } = await context.params;
    const userId = parseUserId(rawUserId);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Suppression de votre propre compte admin impossible." },
        { status: 400 }
      );
    }

    await deleteUserAccount(userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Suppression utilisateur impossible." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, setUserRole } from "@/lib/server/coach";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminAccess();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const userId = typeof body.userId === "number" ? body.userId : Number(body.userId);
    if (!Number.isInteger(userId)) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    await setUserRole(userId, "coach");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Promotion coach impossible." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdminAccess();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = Number(request.nextUrl.searchParams.get("userId"));
    if (!Number.isInteger(userId)) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    await setUserRole(userId, "user");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Retrait du rôle coach impossible." }, { status: 500 });
  }
}

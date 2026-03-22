import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, setUserRole } from "@/lib/server/coach";
import { withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await requireAdminAccess();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const userId = typeof body.userId === "number" ? body.userId : Number(body.userId);
    if (!Number.isInteger(userId)) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    await setUserRole(userId, "coach", user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    return NextResponse.json({ error: "Promotion coach impossible." }, { status: 500 });
  }});
}

export async function DELETE(request: NextRequest) {
  return withRequestContext(request, async () => {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await requireAdminAccess();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = Number(request.nextUrl.searchParams.get("userId"));
    if (!Number.isInteger(userId)) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    await setUserRole(userId, "user", user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    return NextResponse.json({ error: "Retrait du rôle coach impossible." }, { status: 500 });
  }});
}

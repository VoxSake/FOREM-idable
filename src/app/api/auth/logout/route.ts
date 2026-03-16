import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/server/auth";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    await deleteSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Déconnexion impossible." }, { status: 500 });
  }
}

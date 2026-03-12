import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/server/auth";

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Déconnexion impossible." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createCoachGroup, requireCoachAccess } from "@/lib/server/coach";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCoachAccess();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name : "";
    if (!name.trim()) {
      return NextResponse.json({ error: "Nom de groupe requis." }, { status: 400 });
    }

    const group = await createCoachGroup(name, user.id);
    return NextResponse.json({ group });
  } catch {
    return NextResponse.json({ error: "Création de groupe impossible." }, { status: 500 });
  }
}

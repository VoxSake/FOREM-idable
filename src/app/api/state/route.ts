import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getUserState, saveUserState } from "@/lib/server/userState";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await getUserState(user.id);
    return NextResponse.json({ state });
  } catch {
    return NextResponse.json({ error: "Impossible de charger l'état." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const state = await saveUserState(user.id, body.values);

    return NextResponse.json({ state });
  } catch {
    return NextResponse.json({ error: "Impossible de sauvegarder l'état." }, { status: 500 });
  }
}

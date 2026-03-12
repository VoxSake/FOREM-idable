import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, setUserPassword } from "@/lib/server/auth";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";

    if (password.length < 8) {
      return NextResponse.json({ error: "Mot de passe invalide." }, { status: 400 });
    }

    await setUserPassword(user.id, password);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Mise à jour du mot de passe impossible." }, { status: 500 });
  }
}

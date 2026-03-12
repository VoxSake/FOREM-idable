import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createSession } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Connexion impossible." }, { status: 500 });
  }
}

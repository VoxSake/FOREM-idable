import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createSession } from "@/lib/server/auth";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const rateLimit = await checkRateLimit({
      scope: "auth-login",
      limit: 10,
      windowMs: 5 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

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

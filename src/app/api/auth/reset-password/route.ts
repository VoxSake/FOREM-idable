import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/server/auth";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { isPasswordResetEnabled } from "@/lib/server/mail";

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    if (!isPasswordResetEnabled()) {
      return NextResponse.json({ error: "Fonction désactivée." }, { status: 404 });
    }

    const rateLimit = await checkRateLimit({
      scope: "auth-reset-password",
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token || password.length < 8) {
      return NextResponse.json(
        { error: "Lien invalide ou mot de passe trop court." },
        { status: 400 }
      );
    }

    const success = await resetPasswordWithToken(token, password);
    if (!success) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Réinitialisation impossible." },
      { status: 500 }
    );
  }
}

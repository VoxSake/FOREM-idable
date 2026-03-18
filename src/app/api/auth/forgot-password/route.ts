import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/server/auth";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { isPasswordResetEnabled, sendPasswordResetEmail } from "@/lib/server/mail";

const GENERIC_SUCCESS_MESSAGE =
  "Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.";

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    if (!isPasswordResetEnabled()) {
      return NextResponse.json({ error: "Fonction désactivée." }, { status: 404 });
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const rateLimit = await checkRateLimit({
      scope: "auth-forgot-password",
      limit: 5,
      windowMs: 30 * 60 * 1000,
      identifier: email || null,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: "Adresse email requise." }, { status: 400 });
    }

    const resetData = await createPasswordResetToken(email);
    if (resetData) {
      await sendPasswordResetEmail({
        to: resetData.user.email,
        firstName: resetData.user.firstName,
        token: resetData.token,
      });
    }

    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE });
  } catch {
    return NextResponse.json({ error: "Envoi impossible." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { isPasswordResetEnabled, sendPasswordResetEmail } from "@/lib/server/mail";

const GENERIC_SUCCESS_MESSAGE =
  "Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.";

export async function POST(request: NextRequest) {
  try {
    if (!isPasswordResetEnabled()) {
      return NextResponse.json({ error: "Fonction désactivée." }, { status: 404 });
    }

    const rateLimit = await checkRateLimit({
      scope: "auth-forgot-password",
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

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

import { NextRequest, NextResponse } from "next/server";
import { createSession, createUser } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "auth-register",
      limit: 6,
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
    const password = typeof body.password === "string" ? body.password : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";

    if (!email || !firstName || !lastName || !password || password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Nom, prénom, adresse email et mot de passe valide requis (8 caractères minimum).",
        },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, firstName, lastName);
    await createSession(user.id);

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to register";
    const isDuplicate = message.includes("duplicate") || message.includes("unique");

    return NextResponse.json(
      { error: isDuplicate ? "Inscription impossible." : "Inscription impossible." },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}

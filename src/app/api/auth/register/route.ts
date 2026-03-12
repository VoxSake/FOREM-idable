import { NextRequest, NextResponse } from "next/server";
import { createSession, createUser } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
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
      { error: isDuplicate ? "Un compte existe déjà avec cet email." : "Inscription impossible." },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, updateUserProfile } from "@/lib/server/auth";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Compte indisponible." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Nom et prénom requis." }, { status: 400 });
    }

    await updateUserProfile(user.id, firstName, lastName);
    return NextResponse.json({
      user: {
        ...user,
        firstName,
        lastName,
      },
    });
  } catch {
    return NextResponse.json({ error: "Mise à jour du profil impossible." }, { status: 500 });
  }
}

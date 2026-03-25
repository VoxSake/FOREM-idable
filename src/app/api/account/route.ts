import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, updateUserProfile } from "@/lib/server/auth";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { profileUpdateSchema, readValidatedJson } from "@/lib/server/requestSchemas";

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

    const parsed = await readValidatedJson(request, profileUpdateSchema);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { firstName, lastName } = parsed.data;
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

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, setUserPassword } from "@/lib/server/auth";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { passwordUpdateSchema, readValidatedJson } from "@/lib/server/requestSchemas";

export async function PATCH(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await readValidatedJson(request, passwordUpdateSchema);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { password } = parsed.data;
    await setUserPassword(user.id, password);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Mise à jour du mot de passe impossible." }, { status: 500 });
  }
}

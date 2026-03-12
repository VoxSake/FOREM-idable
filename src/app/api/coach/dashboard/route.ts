import { NextResponse } from "next/server";
import { getCoachDashboard, requireCoachAccess } from "@/lib/server/coach";

export async function GET() {
  try {
    const user = await requireCoachAccess();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dashboard = await getCoachDashboard(user);
    return NextResponse.json({ dashboard });
  } catch {
    return NextResponse.json({ error: "Impossible de charger le suivi coach." }, { status: 500 });
  }
}

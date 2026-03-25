import { NextRequest, NextResponse } from "next/server";
import { createUserDataExport, listUserDataExportRequests } from "@/lib/server/compliance";
import { getCurrentUser } from "@/lib/server/auth";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await listUserDataExportRequests(user.id);
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Exports indisponibles." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exportRequest = await createUserDataExport(user);
    return NextResponse.json({ request: exportRequest }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Export impossible." }, { status: 500 });
  }
}

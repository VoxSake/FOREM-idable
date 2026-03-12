import { NextResponse } from "next/server";
import { requireExternalApiAccess } from "@/lib/server/externalApiRoute";

export async function GET() {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;
    return NextResponse.json({
      actor,
      capabilities: {
        formats: ["json", "csv"],
        searchFields: ["firstName", "lastName", "fullName", "email"],
        filters: ["search", "groupId", "userId", "role", "status", "dueOnly", "interviewOnly"],
      },
    });
  } catch {
    return NextResponse.json({ error: "API externe indisponible." }, { status: 500 });
  }
}

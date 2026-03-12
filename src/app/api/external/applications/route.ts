import { NextRequest, NextResponse } from "next/server";
import { buildApplicationsCsv, getExternalApplications } from "@/lib/server/externalApi";
import {
  csvResponse,
  getRequestedFormat,
  parseExternalFilters,
  requireExternalApiAccess,
} from "@/lib/server/externalApiRoute";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const response = await getExternalApplications(actor, parseExternalFilters(request));
    if (getRequestedFormat(request) === "csv") {
      return csvResponse("forem-applications.csv", buildApplicationsCsv(response.applications));
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Export candidatures impossible." }, { status: 500 });
  }
}

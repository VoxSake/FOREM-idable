import { NextRequest, NextResponse } from "next/server";
import { buildApplicationsCsv } from "@/lib/server/externalApi";
import {
  csvResponse,
  getRequestedFormat,
  requireExternalApiAccess,
} from "@/lib/server/externalApiRoute";
import { getExternalUserDetail } from "@/lib/server/externalApi";

function parseUserId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { userId: rawUserId } = await context.params;
    const userId = parseUserId(rawUserId);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    const user = await getExternalUserDetail(actor, userId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    if (getRequestedFormat(request) === "csv") {
      return csvResponse(
        `forem-user-${userId}.csv`,
        buildApplicationsCsv(
          (user.applications ?? []).map((application) => ({
            userId: user.id,
            userEmail: user.email,
            userFirstName: user.firstName,
            userLastName: user.lastName,
            userRole: user.role,
            groupIds: user.groupIds,
            groupNames: user.groupNames,
            application,
          }))
        )
      );
    }

    return NextResponse.json({ actor, user });
  } catch {
    return NextResponse.json({ error: "Export utilisateur impossible." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { buildApplicationsCsv, getExternalGroupDetail } from "@/lib/server/externalApi";
import {
  csvResponse,
  getRequestedFormat,
  requireExternalApiAccess,
} from "@/lib/server/externalApiRoute";

function parseGroupId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const actor = await requireExternalApiAccess();
    if (actor instanceof NextResponse) return actor;

    const { groupId: rawGroupId } = await context.params;
    const groupId = parseGroupId(rawGroupId);
    if (!groupId) {
      return NextResponse.json({ error: "Groupe invalide." }, { status: 400 });
    }

    const group = await getExternalGroupDetail(actor, groupId);
    if (!group) {
      return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
    }

    if (getRequestedFormat(request) === "csv") {
      const rows = (group.members ?? []).flatMap((member) =>
        (member.applications ?? []).map((application) => ({
          userId: member.id,
          userEmail: member.email,
          userFirstName: member.firstName,
          userLastName: member.lastName,
          userRole: member.role,
          groupIds: member.groupIds,
          groupNames: member.groupNames,
          application,
        }))
      );
      return csvResponse(`forem-group-${groupId}.csv`, buildApplicationsCsv(rows));
    }

    return NextResponse.json({ actor, group });
  } catch {
    return NextResponse.json({ error: "Export groupe impossible." }, { status: 500 });
  }
}

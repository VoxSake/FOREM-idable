import { NextRequest, NextResponse } from "next/server";
import { requireCoachAccess } from "@/lib/server/coach";
import { archiveCoachGroup } from "@/lib/server/coachGroups";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

function parseGroupId(value: string) {
  const groupId = Number(value);
  return Number.isInteger(groupId) ? groupId : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const user = await requireCoachAccess();
      if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { groupId: rawGroupId } = await context.params;
      const groupId = parseGroupId(rawGroupId);
      const body = await request.json();
      const archived = body.archived === true;

      if (!groupId) {
        return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
      }

      await archiveCoachGroup(groupId, archived, user);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const { groupId: rawGroupId } = await context.params;
      const groupId = parseGroupId(rawGroupId);

      logServerEvent({
        category: "coach",
        action: "group_archive_failed",
        level: error instanceof Error && error.message === "Forbidden" ? "warn" : "error",
        meta: {
          groupId: groupId ?? undefined,
          error: error instanceof Error ? error.message : "unknown",
        },
      });

      if (error instanceof Error && error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ error: "Archivage impossible." }, { status: 500 });
    }
  });
}

import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { checkRateLimit } from "@/lib/server/rateLimit";
import {
  createCalendarSubscription,
  regenerateCalendarSubscription,
} from "@/lib/server/calendarSubscriptions";
import { canManageCoachGroup, markCoachAction, requireCoachAccess } from "@/lib/server/coach";
import { CalendarSubscriptionScope } from "@/types/calendar";

function parseScope(value: unknown): CalendarSubscriptionScope | null {
  return value === "group" || value === "all_groups" ? value : null;
}

export async function POST(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const rateLimit = await checkRateLimit({
      scope: "coach-calendar-subscriptions",
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
    }

    const actor = await requireCoachAccess();
    if (!actor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const scope = parseScope(body.scope);
    const regenerate = body.regenerate === true;
    const groupId =
      typeof body.groupId === "number" ? body.groupId : Number(body.groupId);

    if (!scope) {
      return NextResponse.json({ error: "Scope invalide." }, { status: 400 });
    }

    if (scope === "group" && (!Number.isInteger(groupId) || groupId <= 0)) {
      return NextResponse.json({ error: "Groupe invalide." }, { status: 400 });
    }

    if (scope === "group" && !(await canManageCoachGroup(actor, groupId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (regenerate && actor.role !== "admin") {
      return NextResponse.json({ error: "Régénération réservée aux admins." }, { status: 403 });
    }

    const subscription = regenerate
      ? await regenerateCalendarSubscription({
          scope,
          groupId: scope === "group" ? groupId : null,
          actorId: actor.id,
        })
      : await createCalendarSubscription({
          scope,
          groupId: scope === "group" ? groupId : null,
          actorId: actor.id,
        });

    await markCoachAction(actor.id);

    return NextResponse.json({ subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Group not found") {
      return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
    }
    if (message === "Invalid group") {
      return NextResponse.json({ error: "Groupe invalide." }, { status: 400 });
    }

    return NextResponse.json({ error: "Gestion du calendrier impossible." }, { status: 500 });
  }
}

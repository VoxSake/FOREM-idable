import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import {
  addSearchHistoryEntryForUser,
  clearSearchHistoryForUser,
  listSearchHistoryForUser,
} from "@/lib/server/searchHistory";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import {
  searchHistoryArraySchema,
  searchHistoryEntrySchema,
} from "@/features/jobs/types/searchHistory";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = searchHistoryArraySchema.parse(
      await listSearchHistoryForUser(user.id)
    );
    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ error: "Impossible de charger l'historique." }, { status: 500 });
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

    const body = await request.json();
    const parsed = searchHistoryEntrySchema.safeParse(body?.entry);
    if (!parsed.success) {
      return NextResponse.json({ error: "Entrée invalide." }, { status: 400 });
    }

    const history = searchHistoryArraySchema.parse(
      await addSearchHistoryEntryForUser(user.id, parsed.data)
    );
    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ error: "Impossible d'ajouter l'historique." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await clearSearchHistoryForUser(user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Impossible de vider l'historique." }, { status: 500 });
  }
}

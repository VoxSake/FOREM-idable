import { NextRequest, NextResponse } from "next/server";
import { createApiKey, listApiKeysForUser } from "@/lib/server/apiKeys";
import { getCurrentUser } from "@/lib/server/auth";

function canManageApiKeys(role: string) {
  return role === "coach" || role === "admin";
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageApiKeys(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKeys = await listApiKeysForUser(user.id);
    return NextResponse.json({ apiKeys });
  } catch {
    return NextResponse.json({ error: "Chargement des clés API impossible." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageApiKeys(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Nom de clé requis." }, { status: 400 });
    }

    const result = await createApiKey(user.id, name);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Création de la clé API impossible." }, { status: 500 });
  }
}

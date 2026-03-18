import { NextRequest, NextResponse } from "next/server";
import { db, ensureDatabase } from "@/lib/server/db";
import { deleteUserAccount, setUserPassword, updateUserProfile } from "@/lib/server/auth";
import { markCoachAction, requireAdminAccess, requireCoachAccess } from "@/lib/server/coach";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { UserRole } from "@/types/auth";

function parseUserId(value: string) {
  const userId = Number(value);
  return Number.isInteger(userId) ? userId : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const actor = await requireCoachAccess();
    if (!actor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId: rawUserId } = await context.params;
    const userId = parseUserId(rawUserId);
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    await ensureDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    const targetResult = await db.query<{ role: UserRole; email: string }>(
      `SELECT role, email
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId]
    );

    const target = targetResult.rows[0];
    if (!target) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    if (actor.role !== "admin" && target.role !== "user") {
      return NextResponse.json({ error: "Modification interdite pour ce rôle." }, { status: 403 });
    }

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Nom et prénom invalides." }, { status: 400 });
    }

    await updateUserProfile(userId, firstName, lastName);

    if (password) {
      if (password.length < 8) {
        return NextResponse.json({ error: "Mot de passe invalide." }, { status: 400 });
      }

      await setUserPassword(userId, password);
    }

    await markCoachAction(actor.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Mise à jour utilisateur impossible." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const forbidden = rejectCrossOriginRequest(request);
    if (forbidden) return forbidden;

    const admin = await requireAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId: rawUserId } = await context.params;
    const userId = parseUserId(rawUserId);
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Suppression de votre propre compte admin impossible." },
        { status: 400 }
      );
    }

    await deleteUserAccount(userId);
    await markCoachAction(admin.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Suppression utilisateur impossible." }, { status: 500 });
  }
}

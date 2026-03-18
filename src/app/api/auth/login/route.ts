import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createSession } from "@/lib/server/auth";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { checkRateLimit } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const forbidden = rejectCrossOriginRequest(request);
      if (forbidden) return forbidden;

      const body = await request.json();
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";

      const rateLimit = await checkRateLimit({
        scope: "auth-login",
        limit: 8,
        windowMs: 10 * 60 * 1000,
        identifier: email || null,
      });
      if (!rateLimit.allowed) {
        logServerEvent({
          category: "security",
          action: "auth_rate_limited",
          level: "warn",
          meta: {
            scope: "auth-login",
            retryAfterMs: rateLimit.retryAfterMs,
          },
        });
        return NextResponse.json(
          { error: "Trop de tentatives. Réessayez dans quelques minutes." },
          { status: 429 }
        );
      }

      const user = await authenticateUser(email, password);
      if (!user) {
        logServerEvent({
          category: "security",
          action: "auth_login_failed",
          level: "warn",
          meta: {
            hasIdentifier: Boolean(email),
          },
        });
        return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
      }

      await createSession(user.id);
      return NextResponse.json({ user });
    } catch {
      return NextResponse.json({ error: "Connexion impossible." }, { status: 500 });
    }
  });
}

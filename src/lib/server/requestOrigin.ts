import { NextRequest, NextResponse } from "next/server";

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "");
}

function getExpectedOrigin(request: NextRequest) {
  return normalizeOrigin(request.nextUrl.origin);
}

function getReceivedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")?.trim();
  if (origin) return normalizeOrigin(origin);

  const referer = request.headers.get("referer")?.trim();
  if (!referer) return null;

  try {
    return normalizeOrigin(new URL(referer).origin);
  } catch {
    return null;
  }
}

export function rejectCrossOriginRequest(request: NextRequest) {
  const expectedOrigin = getExpectedOrigin(request);
  const receivedOrigin = getReceivedOrigin(request);
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();

  if (receivedOrigin) {
    if (receivedOrigin !== expectedOrigin) {
      return NextResponse.json({ error: "Requête interdite." }, { status: 403 });
    }

    return null;
  }

  if (fetchSite === "cross-site") {
    return NextResponse.json({ error: "Requête interdite." }, { status: 403 });
  }

  return null;
}

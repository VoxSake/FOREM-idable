import { NextRequest, NextResponse } from "next/server";

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "");
}

function getExpectedOrigin(request: NextRequest) {
  const configuredOrigin = process.env.APP_BASE_URL?.trim();
  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  if (forwardedProto && forwardedHost) {
    return normalizeOrigin(`${forwardedProto}://${forwardedHost}`);
  }

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

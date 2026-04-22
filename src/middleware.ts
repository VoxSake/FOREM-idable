import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/about",
  "/privacy",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/me",
  "/api/locations",
  "/api/offers",
  "/api/providers",
  "/api/featured-searches",
  "/api/calendar/subscriptions",
  "/api/pdf",
  "/api/external",
  "/_next",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths without auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie presence (actual validation happens in API routes)
  const sessionCookie = request.cookies.get("forem_idable_session");
  if (!sessionCookie?.value) {
    // For API routes, return 403
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // For pages, redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

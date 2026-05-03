/**
 * Auth gate.
 *
 * Public routes (no auth required):
 *   /login                      — the login page itself
 *   /api/auth/*                 — login + logout endpoints
 *   /apply (page + the POST endpoint /api/applications) — applicants must
 *                                  be able to submit without an account
 *   _next, favicon, static      — Next.js internals
 *
 * Everything else requires a valid session cookie. Unauthenticated requests
 * to a gated route get redirected to /login?next=<original-path> so the
 * user lands back at where they were trying to go.
 *
 * Runs in Edge runtime — uses only WebCrypto (via lib/auth.ts).
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/** Exact pathname matches that bypass the gate. */
const PUBLIC_EXACT = new Set<string>([
  "/login",
  "/apply",
  "/api/applications", // applicant submission — POST only at runtime
]);

/** Pathname prefixes (with trailing slash semantics) that bypass the gate. */
const PUBLIC_PREFIXES = ["/api/auth/"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // Misconfigured deploy — fail closed with a clear signal rather than
    // silently letting traffic through.
    return new NextResponse(
      "Auth not configured (AUTH_SECRET missing).",
      { status: 500 }
    );
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySession(token, secret);
  if (valid) {
    return NextResponse.next();
  }

  // Redirect to login, preserving where the user wanted to go.
  const loginUrl = new URL("/login", req.url);
  if (pathname !== "/") {
    loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
  }
  return NextResponse.redirect(loginUrl);
}

/**
 * Matcher excludes Next.js internals and common static assets so middleware
 * doesn't run on every chunk request. The auth check still applies to
 * every page and API route except those listed in PUBLIC_EXACT/PREFIXES.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};

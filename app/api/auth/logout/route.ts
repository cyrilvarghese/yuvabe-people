/**
 * POST /api/auth/logout
 *
 * Clears the session cookie. The cookie *is* the session — there's no
 * server-side store to invalidate — so deleting it client-side is enough.
 *
 * Returns a 303 redirect to /login so a plain HTML <form> can post here
 * with no JavaScript and end up at the right place.
 */

import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const url = new URL("/login", req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

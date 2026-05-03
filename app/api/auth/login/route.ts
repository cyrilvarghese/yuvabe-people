/**
 * POST /api/auth/login
 *
 * Body: { user: string, pass: string }
 *
 * Validates against AUTH_USER + AUTH_PASS env vars. On success, signs a
 * session cookie with AUTH_SECRET and returns 200. On failure, returns 401.
 *
 * The form on /login posts here as JSON. Cookie is HTTP-only (not readable
 * by client-side JS) and SameSite=Lax (sent on top-level navigations but not
 * cross-site requests — fine for our redirect-after-login flow).
 */

import { NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth";

export async function POST(req: Request) {
  const expectedUser = process.env.AUTH_USER;
  const expectedPass = process.env.AUTH_PASS;
  const secret = process.env.AUTH_SECRET;

  if (!expectedUser || !expectedPass || !secret) {
    return NextResponse.json(
      { error: "Auth not configured. See .env.example." },
      { status: 500 }
    );
  }

  let body: { user?: string; pass?: string };
  try {
    body = (await req.json()) as { user?: string; pass?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.user !== expectedUser || body.pass !== expectedPass) {
    return NextResponse.json(
      { error: "Wrong credentials." },
      { status: 401 }
    );
  }

  const token = await signSession(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

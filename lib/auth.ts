/**
 * Session cookie helpers for the hardcoded-credentials login.
 *
 * The cookie value is `<expiry>.<hmac(expiry, secret)>` — base64url-encoded
 * HMAC-SHA256 of the expiry timestamp. Verifying re-computes the HMAC and
 * compares constant-time, then checks the timestamp is in the future.
 *
 * Web Crypto only — no `node:crypto` — so the same module works in both
 * Edge runtime middleware AND Node.js route handlers. Next.js middleware
 * defaults to Edge; using only WebCrypto avoids a runtime split.
 */

export const SESSION_COOKIE = "yuvabe-session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Encode an ArrayBuffer as a base64url string (URL-safe, unpadded).
 * Used because Buffer is a Node-only API; this works in Edge too.
 */
function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toBase64Url(sig);
}

/**
 * Constant-time string comparison — never returns early on mismatch, so the
 * attacker can't time-attack the HMAC by observing how fast the verify call
 * fails. Overkill for a hardcoded shared password, but cheap insurance.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Build a signed session token good for SESSION_TTL_SECONDS. */
export async function signSession(secret: string): Promise<string> {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  const sig = await hmac(expiry, secret);
  return `${expiry}.${sig}`;
}

/** True if the token's HMAC is valid AND the expiry hasn't passed. */
export async function verifySession(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expiry = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(expiry, secret);
  if (!constantTimeEqual(sig, expected)) return false;
  const exp = Number(expiry);
  if (!Number.isFinite(exp)) return false;
  return Math.floor(Date.now() / 1000) < exp;
}

import crypto from "crypto";

/**
 * GSP Swarm HQ — unified session (fix 30-08-2026).
 *
 * HQ login now verifies against the SAME account store as the Brahma WebUI
 * (table WebUiUser, verified via src/lib/webui-rbac.ts). On success we issue
 * an HMAC-signed cookie (same signing secret as NextAuth: NEXTAUTH_SECRET)
 * that the middleware validates with Web Crypto (edge-safe), so no DB call
 * is needed per request.
 *
 * Token format:  base64url(JSON payload) + "." + base64url(HMAC-SHA256)
 * Payload:       { u: username, r: role, p: hermesProfile, exp: epoch-seconds }
 */

export const SESSION_COOKIE = "gsp_hq_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 jam

export interface HqSession {
  u: string;
  r: string;
  p: string;
  exp: number;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/** Sign a session token. Returns null when NEXTAUTH_SECRET is absent (fail-closed). */
export function createSessionToken(input: {
  u: string;
  r: string;
  p: string;
}): string | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        u: input.u,
        r: input.r,
        p: input.p,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      }),
    ),
  );
  const sig = b64url(
    crypto.createHmac("sha256", secret).update(payload).digest(),
  );
  return `${payload}.${sig}`;
}

/** Verify + decode a session token. Returns null when invalid/expired/unset. */
export function readSessionToken(raw: string | undefined | null): HqSession | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || !raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = b64url(
    crypto.createHmac("sha256", secret).update(payload).digest(),
  );
  if (sig.length !== expected.length) return null;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const data = JSON.parse(fromB64url(payload).toString("utf8")) as HqSession;
    if (typeof data.exp !== "number" || data.exp * 1000 < Date.now()) return null;
    if (typeof data.u !== "string" || !data.u) return null;
    return data;
  } catch {
    return null;
  }
}

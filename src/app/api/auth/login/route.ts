import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, publicUser } from "@/lib/webui-rbac";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
} from "@/lib/hq-session";

/**
 * POST /api/auth/login  { username, password }
 *
 * Unified login (30-08-2026): Swarm HQ accepts the SAME accounts as the
 * Brahma WebUI — WebUiUser, verified with the shared scrypt verifyPassword()
 * from src/lib/webui-rbac.ts. On success issues the `gsp_hq_session` HMAC
 * cookie validated by src/middleware.ts.
 *
 * Supersedes the old single-password ADMIN_PASSWORD route which was
 * fail-closed AND whose cookie was never checked by the middleware (dead end).
 */

// ── naive per-IP throttle (single-process server) ───────────────────────────
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { n: number; t: number }>();
function throttled(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.t > WINDOW_MS) {
    attempts.set(ip, { n: 1, t: now });
    if (attempts.size > 1000) {
      for (const [k, v] of attempts) if (now - v.t > WINDOW_MS) attempts.delete(k);
    }
    return false;
  }
  rec.n += 1;
  return rec.n > MAX_ATTEMPTS;
}
function clearThrottle(ip: string) {
  attempts.delete(ip);
}

export async function POST(req: NextRequest) {
  const ip =
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (throttled(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 },
    );
  }

  const user = await prisma.webUiUser.findUnique({ where: { username } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 },
    );
  }

  const token = createSessionToken({
    u: user.username,
    r: user.role,
    p: user.hermesProfile,
  });
  if (!token) {
    // fail-CLOSED: no signing secret configured
    return NextResponse.json(
      { error: "Login not configured (NEXTAUTH_SECRET missing)." },
      { status: 503 },
    );
  }

  clearThrottle(ip);
  const res = NextResponse.json({ ok: true, user: publicUser(user) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
  return res;
}

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/hq-session";

/** GET /api/auth/me — who is signed in to HQ (from the unified session cookie). */
export async function GET(req: NextRequest) {
  const s = readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!s) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { username: s.u, role: s.r, hermesProfile: s.p } });
}

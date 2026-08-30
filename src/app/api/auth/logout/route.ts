import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/hq-session";

/** POST /api/auth/logout — clear the unified HQ session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}

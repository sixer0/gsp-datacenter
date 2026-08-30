import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// SEC-003 fix (30-08): fail-CLOSED bila ADMIN_PASSWORD tidak diset; cookie berisi
// token acak (bukan password), umur 24 jam. Middleware memvalidasi sesi via NextAuth.
export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "Login not configured" }, { status: 503 });
  }
  const { password } = await req.json();
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("gspagenthq_auth", crypto.randomUUID() + "-" + crypto.randomBytes(16).toString("hex"), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return res;
}

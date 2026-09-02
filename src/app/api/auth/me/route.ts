import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/hq-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — who is signed in to HQ (from the unified session cookie). */
export async function GET(req: NextRequest) {
  const s = readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!s) return NextResponse.json({ user: null }, { status: 401 });
  // FIX 02-09-2026 (temuan #1): expose displayName dari WebUiUser supaya UI
  // bisa menampilkan identitas login sebenarnya, bukan nama pemilik yang
  // di-hardcode lewat env NEXT_PUBLIC_OWNER_NAME.
  let displayName: string | null = null;
  try {
    const u = await prisma.webUiUser.findUnique({
      where: { username: s.u },
      select: { displayName: true },
    });
    displayName = u?.displayName ?? null;
  } catch {
    /* DB unavailable → username/role from the cookie still answer */
  }
  return NextResponse.json({
    user: { username: s.u, role: s.r, hermesProfile: s.p, displayName },
  });
}

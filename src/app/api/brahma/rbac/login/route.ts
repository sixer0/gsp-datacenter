import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rbacTokenOk, unauthorized, verifyPassword, publicUser } from "@/lib/webui-rbac";

/**
 * POST /api/brahma/rbac/login
 * { username, password } → verify credentials against WebUiUser.
 * Returns the public user record (the WebUI issues its own session cookie).
 */
export async function POST(request: NextRequest) {
  if (!rbacTokenOk(request)) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }
  const user = await prisma.webUiUser.findUnique({ where: { username } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user: publicUser(user) });
}

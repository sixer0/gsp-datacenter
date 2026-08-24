import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  isValidPassword,
  isValidUsername,
  publicUser,
} from "@/lib/webui-rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * /api/user-access — WebUI RBAC user management for the Agent HQ admin UI.
 *
 * Same data as the token-guarded /api/brahma/rbac (WebUiUser table), but
 * intended for browser use from the HQ dashboard (local, dev-mode posture;
 * the Next middleware already bypasses in development).
 *
 * GET  → list users
 * POST → create a user directly (admin action from the HQ UI)
 */
export async function GET() {
  const users = await prisma.webUiUser.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ users: users.map(publicUser) });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const displayName = body.displayName ? String(body.displayName).trim().slice(0, 80) : null;
  const hermesProfile = String(body.hermesProfile || "").trim();
  const role = String(body.role || "USER").toUpperCase() === "ADMINISTRATOR" ? "ADMINISTRATOR" : "USER";

  if (!isValidUsername(username)) {
    return NextResponse.json({ error: "Username must be 1-32 chars: lowercase letters, digits, _ or - (no leading -)." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!hermesProfile) {
    return NextResponse.json({ error: "hermesProfile is required." }, { status: 400 });
  }

  const existing = await prisma.webUiUser.findFirst({
    where: { OR: [{ username }, { hermesProfile }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: existing.username === username ? "Username already taken." : "Hermes profile already assigned to another user." },
      { status: 409 }
    );
  }

  const user = await prisma.webUiUser.create({
    data: { username, passwordHash: hashPassword(password), displayName, role, hermesProfile },
  });
  return NextResponse.json({ ok: true, user: publicUser(user) }, { status: 201 });
}

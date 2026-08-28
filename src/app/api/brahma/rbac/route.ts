import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  rbacTokenOk,
  unauthorized,
  hashPassword,
  isValidUsername,
  isValidPassword,
  publicUser,
} from "@/lib/webui-rbac";

/**
 * /api/brahma/rbac
 * GET  → list WebUI users (admin; guarded by x-rbac-token)
 * POST → create a user directly (admin; guarded by x-rbac-token)
 */
export async function GET(request: NextRequest) {
  if (!rbacTokenOk(request)) return unauthorized();
  const users = await prisma.webUiUser.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ users: users.map(publicUser) });
}

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
      { error: existing.username === username ? "Username already taken." : "Swarm profile already assigned to another user." },
      { status: 409 }
    );
  }

  const user = await prisma.webUiUser.create({
    data: { username, passwordHash: hashPassword(password), displayName, role, hermesProfile },
  });
  return NextResponse.json({ ok: true, user: publicUser(user) }, { status: 201 });
}

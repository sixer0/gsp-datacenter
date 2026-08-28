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
 * POST /api/brahma/rbac/signup
 * { username, password, displayName?, hermesProfile } → create a USER account.
 *
 * The Brahma WebUI clones the Hermes profile FIRST (locally via hermes CLI),
 * then calls this endpoint with the new profile name so the mapping is atomic
 * on the DB side. Username/profile conflicts return 409 — the WebUI rolls the
 * cloned profile back on conflict.
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
  const displayName = body.displayName ? String(body.displayName).trim().slice(0, 80) : null;
  const hermesProfile = String(body.hermesProfile || "").trim();

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
    data: { username, passwordHash: hashPassword(password), displayName, role: "USER", hermesProfile },
  });
  return NextResponse.json({ ok: true, user: publicUser(user) }, { status: 201 });
}

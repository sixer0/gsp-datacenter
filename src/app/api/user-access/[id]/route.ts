import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, isValidPassword, publicUser } from "@/lib/webui-rbac";

/**
 * /api/user-access/[id] — update or delete a WebUI RBAC user (HQ admin UI).
 * PATCH  → role / displayName / password
 * DELETE → remove a user (last ADMINISTRATOR is protected)
 */
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const user = await prisma.webUiUser.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.role !== undefined) {
    const role = String(body.role).toUpperCase();
    if (role !== "ADMINISTRATOR" && role !== "USER") {
      return NextResponse.json({ error: "role must be ADMINISTRATOR or USER" }, { status: 400 });
    }
    data.role = role;
  }
  if (body.displayName !== undefined) {
    data.displayName = body.displayName ? String(body.displayName).trim().slice(0, 80) : null;
  }
  if (body.password !== undefined && body.password !== "") {
    const password = String(body.password);
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    data.passwordHash = hashPassword(password);
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.webUiUser.update({ where: { id }, data });
  return NextResponse.json({ ok: true, user: publicUser(updated) });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const user = await prisma.webUiUser.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role === "ADMINISTRATOR") {
    const adminCount = await prisma.webUiUser.count({ where: { role: "ADMINISTRATOR" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Cannot delete the last administrator." }, { status: 409 });
    }
  }
  await prisma.webUiUser.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: id });
}

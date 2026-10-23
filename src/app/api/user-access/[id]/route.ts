import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import {
  hashPassword,
  isValidPassword,
  isValidUsername,
  publicUser,
} from "@/lib/webui-rbac";
import {
  countLeafSkills,
  ensureProfileComplete,
  isValidProfileName,
  profileDir,
  provisionLeanProfile,
  resolveBaseHome,
} from "../../../../../scripts/ensure-profile-complete.mjs";

/**
 * /api/user-access/[id] — update or delete a WebUI RBAC user (HQ admin UI).
 * PATCH  → role / displayName / password / hermesProfile (re-bind)
 * DELETE → remove a user (last ADMINISTRATOR is protected)
 *
 * hermesProfile re-bind uses the same provisioning rules as POST:
 * valid lowercase name, USER never binds 'default', non-existent USER
 * profiles are provisioned as a complete clone from default, existing
 * directories get an idempotent completeness top-up, and an incomplete
 * result rejects the change instead of leaving a broken binding.
 */
type Ctx = { params: Promise<{ id: string }> };

function inspectOnDisk(name: string): { ok: boolean; problems: string[] } {
  const baseHome = resolveBaseHome();
  const dir = profileDir(name, baseHome);
  const problems: string[] = [];
  if (!fs.existsSync(dir)) return { ok: false, problems: ["profile-dir-missing"] };
  if (!fs.existsSync(path.join(dir, "config.yaml"))) problems.push("config.yaml-missing");
  if (!fs.existsSync(path.join(dir, ".env"))) problems.push(".env-missing");
  if (!fs.existsSync(path.join(dir, "SOUL.md"))) problems.push("SOUL.md-missing");
  const skillCount = countLeafSkills(path.join(dir, "skills"));
  // FIX 02-09-2026: lean-marked profiles pass with lane skills only.
  if (fs.existsSync(path.join(dir, ".lean-policy"))) {
    if (skillCount < 1) problems.push(`lean-skills-empty:${skillCount}`);
    return { ok: problems.length === 0, problems };
  }
  const rootSkills = countLeafSkills(path.join(baseHome, "skills"));
  if (rootSkills > 0 && skillCount < Math.max(1, Math.floor(rootSkills * 0.8))) {
    problems.push(`skills-incomplete:${skillCount}/${rootSkills}`);
  }
  return { ok: problems.length === 0, problems };
}

export async function PATCH(request: Request, ctx: Ctx) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const user = await prisma.webUiUser.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Validate new role first if provided (needed for the profile rules below).
  let newRole: string | null = null;
  if (body.role !== undefined) {
    const role = String(body.role).toUpperCase();
    if (role !== "ADMINISTRATOR" && role !== "USER") {
      return NextResponse.json({ error: "role must be ADMINISTRATOR or USER" }, { status: 400 });
    }
    newRole = role;
  }
  const effectiveRole = newRole || user.role;

  // Optional hermesProfile re-bind (fix 2026-08-27 — previously impossible,
  // so a mis-typed binding like "GSP-1" could never be corrected from the UI).
  const data: Record<string, unknown> = {};
  if (body.hermesProfile !== undefined) {
    const requested = String(body.hermesProfile || "").trim() || usernameToProfile(user.username);
    if (!isValidProfileName(requested)) {
      return NextResponse.json(
        { error: "hermesProfile must be 1-64 chars: lowercase letters, digits, _ or - (no leading -); 'default' is reserved." },
        { status: 400 },
      );
    }
    if (requested === "default" && effectiveRole !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "Binding USER accounts to the shared 'default' profile is not allowed." },
        { status: 400 },
      );
    }
    if (requested !== user.hermesProfile) {
      const clash = await prisma.webUiUser.findFirst({
        where: { hermesProfile: requested, NOT: { id: user.id } },
      });
      if (clash) {
        return NextResponse.json(
          { error: "Swarm profile already assigned to another user." },
          { status: 409 },
        );
      }
    }
    if (requested !== "default") {
      // Same provisioning contract as POST (fix 2026-09-02: lean by default,
      // idempotent, never clobbers curated state).
      const dir = profileDir(requested);
      if (!fs.existsSync(dir)) {
        provisionLeanProfile(requested, { lane: "controller" });
      } else if (fs.existsSync(path.join(dir, ".lean-policy"))) {
        provisionLeanProfile(requested, { lane: "controller" });
      } else {
        ensureProfileComplete(requested, {});
      }
      const after = inspectOnDisk(requested);
      if (!after.ok) {
        return NextResponse.json(
          { error: `Bound profile "${requested}" is incomplete (${after.problems.join(", ")}); run scripts/ensure-profile-complete.mjs and retry.` },
          { status: 500 },
        );
      }
    }
    data.hermesProfile = requested;
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
  if (newRole) data.role = newRole;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.webUiUser.update({ where: { id }, data });
  return NextResponse.json({ ok: true, user: publicUser(updated) });
}

// USER usernames are lowercase [a-z0-9][a-z0-9_-]{0,31}, so they double as
// valid profile names; admins fall back to their own username-based profile.
function usernameToProfile(username: string): string {
  return isValidUsername(username) ? username : "";
}

export async function DELETE(req: Request, ctx: Ctx) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
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

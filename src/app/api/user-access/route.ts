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
} from "../../../../scripts/ensure-profile-complete.mjs";

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
 *
 * Profile provisioning guard (fix 2026-08-27; LEAN policy fix 2026-09-02):
 *  - profile NOT on disk (USER atau ADMINISTRATOR) → provision LEAN sejak
 *    lahir: config/.env/SOUL + skill fisik lane (controller ≤5) + marker
 *    .lean-policy & .no-bundled-skills (provisionLeanProfile)
 *  - ADMIN + 'default'                → allowed to share the root profile
 *  - existing lean-marked profile     → lean top-up (never re-bloat)
 *  - existing unmarked profile        → idempotent full-clone top-up (legacy)
 *  - everything else invalid          → 400
 * The sync is idempotent and also top-ups an existing-but-partial clone
 * (missing SOUL/skills get merged from default; curated files never clobbered).
 */
export async function GET() {
  const users = await prisma.webUiUser.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ users: users.map(publicUser) });
}

export async function POST(request: Request) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(request);
  if (denied) return denied;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const displayName = body.displayName ? String(body.displayName).trim().slice(0, 80) : null;
  const roleRaw = String(body.role || "USER").toUpperCase();
  const role = roleRaw === "ADMINISTRATOR" ? "ADMINISTRATOR" : "USER";
  const hermesProfileInput = String(body.hermesProfile || "").trim();

  if (!isValidUsername(username)) {
    return NextResponse.json({ error: "Username must be 1-32 chars: lowercase letters, digits, _ or - (no leading -)." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // ── Resolve + validate the bound Hermes profile BEFORE writing anything. ──
  // Default when omitted: a per-user named profile.
  let hermesProfile = hermesProfileInput || username;

  if (!isValidProfileName(hermesProfile)) {
    return NextResponse.json(
      {
        error:
          "hermesProfile must be 1-64 chars: lowercase letters, digits, _ or - (no leading -); 'default' is reserved.",
      },
      { status: 400 },
    );
  }
  if (hermesProfile === "default" && role !== "ADMINISTRATOR") {
    return NextResponse.json(
      { error: "Binding USER accounts to the shared 'default' profile is not allowed. Pick or create a personal profile." },
      { status: 400 },
    );
  }
  if (hermesProfile === "default") {
    // Administrator sharing the root profile — no provisioning needed/allowed.
    return await createUser(username, password, displayName, role, hermesProfile);
  }

  const baseHome = resolveBaseHome();
  const dir = profileDir(hermesProfile, baseHome);
  const onDisk = fs.existsSync(dir) && fs.statSync(dir).isDirectory();

  // FIX 02-09-2026 (temuan #2 & #3): SEMUA role baru diprovisioni LEAN sejak
  // lahir (dulu: USER dapat clone penuh ~141 skill + seed bundled; ADMIN
  // ditolak 400 sehingga akun tak bisa dipakai). Lane = controller untuk dua
  // role (kebijakan 31-08: profil terikat akun RBAC = CONTROLLER).
  if (!onDisk) {
    const result = provisionLeanProfile(hermesProfile, { lane: "controller" });
    if (!result.ok || result.error) {
      return NextResponse.json(
        { error: `Failed to provision lean Swarm profile "${hermesProfile}": ${result.error || "unknown error"}` },
        { status: 500 },
      );
    }
  } else {
    // Existing directory: idempotent top-up. Lean-marked profiles are repaired
    // lean; unmarked (legacy full-clone) keep the old completeness behaviour.
    if (fs.existsSync(path.join(dir, ".lean-policy"))) {
      provisionLeanProfile(hermesProfile, { lane: "controller" });
    } else {
      ensureProfileComplete(hermesProfile, {});
    }
  }

  const after = inspectOnDisk(hermesProfile);
  if (!after.complete) {
    return NextResponse.json(
      {
        error: `Provisioned profile "${hermesProfile}" is incomplete (${after.problems.join(", ")}). Account not created.`,
      },
      { status: 500 },
    );
  }

  return await createUser(username, password, displayName, role, hermesProfile);
}

function inspectOnDisk(name: string): { complete: boolean; problems: string[] } {
  const baseHome = resolveBaseHome();
  const dir = profileDir(name, baseHome);
  const problems: string[] = [];
  if (!fs.existsSync(dir)) return { complete: false, problems: ["profile-dir-missing"] };
  if (!fs.existsSync(path.join(dir, "config.yaml"))) problems.push("config.yaml-missing");
  if (!fs.existsSync(path.join(dir, ".env"))) problems.push(".env-missing");
  if (!fs.existsSync(path.join(dir, "SOUL.md"))) problems.push("SOUL.md-missing");
  const skillCount = countLeafSkills(path.join(dir, "skills"));
  // FIX 02-09-2026: lean-marked profiles are complete with their lane skills
  // only — the old >=80%-of-root bar would reject every lean account.
  if (fs.existsSync(path.join(dir, ".lean-policy"))) {
    if (skillCount < 1) problems.push(`lean-skills-empty:${skillCount}`);
    return { complete: problems.length === 0, problems };
  }
  const rootSkills = countLeafSkills(path.join(baseHome, "skills"));
  if (skillCount < Math.max(1, Math.floor(rootSkills * 0.8)) && rootSkills > 0) {
    problems.push(`skills-incomplete:${skillCount}/${rootSkills}`);
  }
  return { complete: problems.length === 0, problems };
}

async function createUser(
  username: string,
  password: string,
  displayName: string | null,
  role: string,
  hermesProfile: string,
) {
  const existing = await prisma.webUiUser.findFirst({
    where: { OR: [{ username }, { hermesProfile }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: existing.username === username ? "Username already taken." : "Swarm profile already assigned to another user." },
      { status: 409 },
    );
  }

  const user = await prisma.webUiUser.create({
    data: { username, passwordHash: hashPassword(password), displayName, role, hermesProfile },
  });
  return NextResponse.json({ ok: true, user: publicUser(user) }, { status: 201 });
}

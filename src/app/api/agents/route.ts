import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { getRoster, GROUP_LABELS } from "@/lib/agent-roster";
import { requireSession } from '@/lib/require-session';

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── GSP AI Team roster — DYNAMIC from disk (audit W1.3+W3.3) ────────────
// Dibangun src/lib/agent-roster.ts: satu entri per folder profil Hermes
// (C:/Users/TRIAL/AppData/Local/hermes/profiles/*) + label model dari
// config.yaml tiap profil, cache 60s, fallback statis-safe. Menggantikan
// array ROSTER statis lama (entri hantu gsp-vendor-crawler-orchestrator
// N-1 + 38 label deepseek basi N-2 + 7 profil drift N-3 ikut hilang).
// Tetap ada entri DINAMIS tambahan dari tabel WebUiUser (webuiUserAgents()
// di bawah) — signup WebUI baru otomatis muncul tanpa edit kode.
// level: 1 = orchestrator (Brahma), 2 = advisors, 3 = specialist groups, 9 = webui user

// ── Live gateway status from watchdog PID files ─────────────────────────────
const GATEWAY_LOG_DIR = join(homedir(), ".hermes", "gateway-logs");

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function liveStatusFor(profile: string): { status: string; pid?: number } {
  // gsp-* profiles: read PID file written by gsp_gateway_watchdog.sh
  if (profile !== "default") {
    const pidFile = join(GATEWAY_LOG_DIR, `${profile}.pid`);
    if (existsSync(pidFile)) {
      try {
        const pid = parseInt(readFileSync(pidFile, "utf8").trim(), 10);
        if (pid && isAlive(pid)) return { status: "online", pid };
      } catch {}
    }
    return { status: "offline" };
  }
  // default/brahma: detect via `hermes gateway status` cache — we read the
  // gateway state file if present, else fall back to offline (no spawn here).
  // The default gateway is managed outside the watchdog; its state file lives
  // in ~/.hermes/gateway_state.json
  try {
    const stateFile = join(homedir(), ".hermes", "gateway_state.json");
    if (existsSync(stateFile)) {
      const st = JSON.parse(readFileSync(stateFile, "utf8"));
      if (st && (st.running === true || st.pid)) {
        const pid = Number(st.pid || 0);
        if (!pid || isAlive(pid)) return { status: "online", pid: pid || undefined };
      }
    }
  } catch {}
  return { status: "offline" };
}


// Profiles already in the (dynamic) roster — snapshot per call; getRoster()
// is cached 60s so this stays cheap.
function rosterProfiles(): Set<string> {
  return new Set(getRoster().map((a) => a.profile));
}

// WebUI RBAC users (WebUiUser table) get a dynamic agent entry so a fresh
// signup shows up in the Agents list & Orchestration map without manual edits.
// GSP directive (2026-08-23): user-access agents serve AS CONTROLLERS, so they
// are placed at level 3 in the "controller" group.
async function webuiUserAgents(stateMap: Record<string, any>) {
  const users = await prisma.webUiUser.findMany({ orderBy: { createdAt: "asc" } });
  return users
    .filter((u) => !rosterProfiles().has(u.hermesProfile))
    .map((u) => {
      const s = stateMap[u.hermesProfile] || {};
      const live = liveStatusFor(u.hermesProfile);
      return {
        id: `webui-${u.username}`,
        profile: u.hermesProfile,
        name: u.displayName || u.username,
        emoji: "👤",
        role:
          u.role === "ADMINISTRATOR"
            ? "WebUI Administrator · Full Access"
            : "WebUI User · Controller Access",
        model: "webui",
        level: 3,
        group: "controller",
        groupLabel: GROUP_LABELS["controller"],
        status: s.status && s.status !== "offline" ? s.status : live.status,
        gatewayPid: live.pid,
        currentTask: s.currentTask || undefined,
        lastActive: s.lastActive || undefined,
        tasksCompleted: 0,
        totalCost: 0,
        recentActivity: [],
      };
    });
}

export async function GET() {
  try {
    const states = await prisma.agentState.findMany();
    const stateMap: Record<string, any> = {};
    for (const s of states) stateMap[s.id] = s;

    const agents = getRoster().map((agent) => {
      const s = stateMap[agent.id] || stateMap[agent.profile] || {};
      const live = liveStatusFor(agent.profile);
      return {
        ...agent,
        groupLabel: GROUP_LABELS[agent.group] || agent.group,
        status: s.status && s.status !== "offline" ? s.status : live.status,
        gatewayPid: live.pid,
        currentTask: s.currentTask || undefined,
        lastActive: s.lastActive || undefined,
        tasksCompleted: s.tasksCompleted || 0,
        totalCost: s.totalCost || 0,
        recentActivity: s.recentActivity || [],
      };
    });

    // Merge dynamic WebUI user-access entries (complete signup flow: a new
    // WebUI account automatically appears in Agents + Orchestration map).
    const userAgents = await webuiUserAgents(stateMap);
    return NextResponse.json([...agents, ...userAgents], {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("Agents API error:", error);
    // Fall back to roster with live status only (no DB)
    const agents = getRoster().map((agent) => {
      const live = liveStatusFor(agent.profile);
      return {
        ...agent,
        groupLabel: GROUP_LABELS[agent.group] || agent.group,
        status: live.status,
        gatewayPid: live.pid,
        currentTask: undefined,
        lastActive: undefined,
        tasksCompleted: 0,
        totalCost: 0,
        recentActivity: [],
      };
    });
    return NextResponse.json(agents, { status: 200 });
  }
}

// POST to update agent state (called by cron jobs / bridge)
export async function POST(request: Request) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { agentId, action, status, currentTask } = body;

    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    const defaultAgent = getRoster().find((a) => a.id === agentId);

    let existing = await prisma.agentState.findUnique({ where: { id: agentId } });

    const recentActivity = (existing?.recentActivity as any[]) || [];
    const newRecentActivity = action
      ? [{ timestamp: new Date().toISOString(), action }, ...recentActivity.slice(0, 19)]
      : recentActivity;

    const updatedState = await prisma.agentState.upsert({
      where: { id: agentId },
      update: {
        ...(status ? { status } : {}),
        ...(currentTask !== undefined ? { currentTask } : {}),
        lastActive: new Date(),
        ...(action
          ? {
              recentActivity: newRecentActivity,
              tasksCompleted: (existing?.tasksCompleted || 0) + 1,
            }
          : {}),
      },
      create: {
        id: agentId,
        name: defaultAgent?.name || agentId,
        emoji: defaultAgent?.emoji,
        role: defaultAgent?.role,
        status: status || "idle",
        currentTask: currentTask || null,
        lastActive: new Date(),
        tasksCompleted: action ? 1 : 0,
        totalCost: 0,
        recentActivity: newRecentActivity,
      },
    });

    return NextResponse.json({ ok: true, agent: updatedState });
  } catch (error) {
    console.error("Agent update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

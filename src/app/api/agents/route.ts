import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readdirSync, readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── GSP AI Team roster — 36 static profiles (Brahma/default + 35 gsp-*) ─────
// plus DYNAMIC WebUI user-access entries from the WebUiUser table (see
// webuiUserAgents() below) — a new WebUI signup automatically appears here.
// level: 1 = orchestrator (Brahma), 2 = advisors, 3 = specialist groups, 9 = webui user
const ROSTER = [
  {
    id: "brahma",
    profile: "default",
    name: "Brahma",
    emoji: "🧠",
    role: "AI Orchestrator · Mission Control",
    model: "deepseek-v4-flash-0731",
    level: 1,
    group: "core",
  },
  // Level 2 — Penasihat Utama
  {
    id: "gsp-task-architect",
    profile: "gsp-task-architect",
    name: "Task Architect",
    emoji: "📐",
    role: "Perancang Cetak Biru Tugas · Blueprint",
    model: "deepseek-v4-flash-0731",
    level: 2,
    group: "advisor",
  },
  {
    id: "gsp-request-translator",
    profile: "gsp-request-translator",
    name: "Request Translator",
    emoji: "🔄",
    role: "Penerjemah Permintaan · Intent Parsing",
    model: "deepseek-v4-flash-0731",
    level: 2,
    group: "advisor",
  },
  // Level 3 — Kontroler
  {
    id: "gsp-vendor-crawler-orchestrator",
    profile: "gsp-vendor-crawler-orchestrator",
    name: "Vendor Crawler Orchestrator",
    emoji: "🕸️",
    role: "Intelijen Vendor/Expo · Delegasi Paralel",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "controller",
  },
  // Level 3 — Analisis & Riset
  {
    id: "gsp-explore",
    profile: "gsp-explore",
    name: "Explore",
    emoji: "🔍",
    role: "Pemetaan Struktur Codebase",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "analysis",
  },
  {
    id: "gsp-data-collector",
    profile: "gsp-data-collector",
    name: "Data Collector",
    emoji: "📥",
    role: "Pengumpulan Data Sistematis",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "analysis",
  },
  {
    id: "gsp-data-analyst",
    profile: "gsp-data-analyst",
    name: "Data Analyst",
    emoji: "📊",
    role: "Sintesis & Spesifikasi",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "analysis",
  },
  {
    id: "gsp-image-analyst",
    profile: "gsp-image-analyst",
    name: "Image Analyst",
    emoji: "👁️",
    role: "Analisis & Ekstraksi Gambar (Vision)",
    model: "qwen3.7-flash",
    level: 3,
    group: "analysis",
  },
  {
    id: "gsp-document-analyst",
    profile: "gsp-document-analyst",
    name: "Document Analyst",
    emoji: "🧾",
    role: "Penilaian Kualitas & Relevansi Dokumen",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "analysis",
  },
  {
    id: "gsp-pm-analyst",
    profile: "gsp-pm-analyst",
    name: "PM Analyst",
    emoji: "🎯",
    role: "Analisis Kebutuhan PM/BA",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "analysis",
  },
  {
    id: "gsp-social-media-analyst",
    profile: "gsp-social-media-analyst",
    name: "Social Media Analyst",
    emoji: "📈",
    role: "Insight Sosial Media · Sentimen · Tren · Laporan Tersitasi",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "analysis",
  },
  {
    id: "gsp-architecture-specialist",
    profile: "gsp-architecture-specialist",
    name: "Architecture Specialist",
    emoji: "🏛️",
    role: "Arsitek Bangunan Senior · Desain, Regulasi & Fisika Bangunan",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "analysis",
  },
  // Level 3 — Eksekusi
  {
    id: "gsp-coder-execution",
    profile: "gsp-coder-execution",
    name: "Coder Execution",
    emoji: "💻",
    role: "Implementasi Kode · Test-First",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-database-specialist",
    profile: "gsp-database-specialist",
    name: "Database Specialist",
    emoji: "🗄️",
    role: "Skema · Migrasi · Kueri · Seed",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-docker-specialist",
    profile: "gsp-docker-specialist",
    name: "Docker Specialist",
    emoji: "🐳",
    role: "Kontainer & Docker Compose",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-git-specialist",
    profile: "gsp-git-specialist",
    name: "Git Specialist",
    emoji: "🌿",
    role: "Status · Diff · Branch · Release",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-design-system-specialist",
    profile: "gsp-design-system-specialist",
    name: "Design System Specialist",
    emoji: "🎨",
    role: "Design System Calibration (Vision)",
    model: "qwen3.7-flash",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-image-specialist",
    profile: "gsp-image-specialist",
    name: "Image Specialist",
    emoji: "🖼️",
    role: "Pembuatan & Editing Gambar (Vision)",
    model: "qwen3.7-flash",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-image-prompt-specialist",
    profile: "gsp-image-prompt-specialist",
    name: "Image Prompt Specialist",
    emoji: "✨",
    role: "Prompt Eksekusi Slide/Gambar (Vision)",
    model: "qwen3.7-flash",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-vendor-crawler-specialist",
    profile: "gsp-vendor-crawler-specialist",
    name: "Vendor Crawler Specialist",
    emoji: "🏪",
    role: "Pipeline Intelijen Vendor 6 Tahap",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-social-media-crawler",
    profile: "gsp-social-media-crawler",
    name: "Social Media Crawler",
    emoji: "🕷️",
    role: "Koleksi Sosial Media Multi-Platform · Corpus + Provenance",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-document-writer",
    profile: "gsp-document-writer",
    name: "Document Writer",
    emoji: "✍️",
    role: "Produksi PDF · DOCX · XLSX · PPTX",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-document-converter",
    profile: "gsp-document-converter",
    name: "Document Converter",
    emoji: "🔁",
    role: "Konversi Antar Format Dokumen",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-document-translator",
    profile: "gsp-document-translator",
    name: "Document Translator",
    emoji: "🌐",
    role: "Terjemahan Lintas Bahasa",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "execution",
  },
  {
    id: "gsp-pm-writer",
    profile: "gsp-pm-writer",
    name: "PM Writer",
    emoji: "📝",
    role: "Laporan & Presentasi PM/BA",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "execution",
  },
  // Level 3 — Verifikasi
  {
    id: "gsp-verifier",
    profile: "gsp-verifier",
    name: "Verifier",
    emoji: "✅",
    role: "Verifikasi Fungsional · Regresi",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "verification",
  },
  {
    id: "gsp-senior-code-reviewer",
    profile: "gsp-senior-code-reviewer",
    name: "Senior Code Reviewer",
    emoji: "🔎",
    role: "Duplikasi · Maintainability · Dependensi",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "verification",
  },
  {
    id: "gsp-security-review",
    profile: "gsp-security-review",
    name: "Security Review",
    emoji: "🛡️",
    role: "Pemindaian Kerentanan · OWASP",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "verification",
  },
  {
    id: "gsp-test-expert",
    profile: "gsp-test-expert",
    name: "Test Expert",
    emoji: "🧪",
    role: "Strategi & Generasi Pengujian",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "verification",
  },
  {
    id: "gsp-document-reviewer",
    profile: "gsp-document-reviewer",
    name: "Document Reviewer",
    emoji: "📖",
    role: "Review & Revisi Dokumen",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "verification",
  },
  {
    id: "gsp-pm-verifier",
    profile: "gsp-pm-verifier",
    name: "PM Verifier",
    emoji: "✔️",
    role: "Kelengkapan · Kualitas · Kelayakan",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "verification",
  },
  {
    id: "gsp-librarian",
    profile: "gsp-librarian",
    name: "GSP Librarian",
    emoji: "📚",
    role: "Gatekeeper Information Library: kurasi, attest, promote vault → wiki",
    model: "deepseek/deepseek-v4-flash-0731",
    level: 3,
    group: "verification",
  },
  // Level 3 — Utilitas & Perencanaan
  {
    id: "gsp-document-reader",
    profile: "gsp-document-reader",
    name: "Document Reader",
    emoji: "📚",
    role: "Parse PDF · DOCX · XLSX · PPTX",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "utility",
  },
  {
    id: "gsp-pm-planner",
    profile: "gsp-pm-planner",
    name: "PM Planner",
    emoji: "🗺️",
    role: "Rencana Implementasi Terlacak",
    model: "deepseek-v4-flash-0731",
    level: 3,
    group: "utility",
  },
];

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

const GROUP_LABELS: Record<string, string> = {
  core: "Core Orchestrator",
  advisor: "Tim Penasihat Utama",
  controller: "Kontroler",
  analysis: "Analisis & Riset",
  execution: "Eksekusi",
  verification: "Verifikasi",
  utility: "Utilitas & Perencanaan",
  "user-access": "WebUI User Access",
};

// Profiles already in the static ROSTER (by profile name).
const ROSTER_PROFILES = new Set(ROSTER.map((a) => a.profile).filter(Boolean));

// WebUI RBAC users (WebUiUser table) get a dynamic agent entry so a fresh
// signup shows up in the Agents list & Orchestration map without manual edits.
// GSP directive (2026-08-23): user-access agents serve AS CONTROLLERS, so they
// are placed at level 3 in the "controller" group.
async function webuiUserAgents(stateMap: Record<string, any>) {
  const users = await prisma.webUiUser.findMany({ orderBy: { createdAt: "asc" } });
  return users
    .filter((u) => !ROSTER_PROFILES.has(u.hermesProfile))
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

    const agents = ROSTER.map((agent) => {
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
    const agents = ROSTER.map((agent) => {
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
  try {
    const body = await request.json();
    const { agentId, action, status, currentTask } = body;

    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    const defaultAgent = ROSTER.find((a) => a.id === agentId);

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

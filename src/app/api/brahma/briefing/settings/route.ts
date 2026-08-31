import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from '@/lib/require-session';

// Settings for the auto daily brief ("greeting" cron) live in DataStore.
// The bridge reads this key on every tick; the dashboard reads/writes it here.
const KEY = "hermes-briefing-settings";

const DEFAULTS = {
  enabled: true,
  hour: 8,
  prompt:
    "You are the operator's chief of staff. Produce today's brief. Read your memory wiki open-loops " +
    "(~/.hermes/wiki), the kanban board, and recent activity. Output ONLY valid JSON (no prose, no code fences) " +
    'in exactly this shape: {"greeting":"one warm line","summary":"2-3 sentences on where things stand",' +
    '"sections":[{"label":"Needs your decision","items":["..."]},{"label":"Top priorities","items":["..."]},' +
    '{"label":"Recently shipped","items":["..."]},{"label":"Next actions","items":["..."]}]}. ' +
    "Keep every item short, concrete, and specific. Omit a section if it has nothing.",
};

function sanitize(b: Record<string, unknown>) {
  const enabled = b.enabled !== false;
  const h = Number(b.hour);
  const hour = Number.isInteger(h) && h >= 0 && h <= 23 ? h : DEFAULTS.hour;
  const prompt =
    typeof b.prompt === "string" && b.prompt.trim() ? b.prompt.trim() : DEFAULTS.prompt;
  return { enabled, hour, prompt };
}

export async function GET() {
  const row = await prisma.dataStore.findUnique({ where: { key: KEY } });
  const d = (row?.data ?? {}) as Record<string, unknown>;
  const settings = sanitize(d);
  return NextResponse.json({ settings, source: row ? "stored" : "default" });
}

// PUT { enabled?, hour?, prompt? } → validate + persist to DataStore.
export async function PUT(req: Request) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const next = sanitize(body);
  const payload = { ...next, updatedAt: new Date().toISOString() };
  await prisma.dataStore.upsert({
    where: { key: KEY },
    update: { data: payload },
    create: { key: KEY, data: payload },
  });
  return NextResponse.json({ settings: next, ok: true });
}

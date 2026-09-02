import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from '@/lib/require-session';
import { getRequester } from "@/lib/hq-session";

// POST { kind?, title, prompt?, profile?, sideEffecting?, hermesTaskId?, agentId? } → queue work for Brahma.
// profile = target Hermes profile id (mis. "gsp-master-controller"); null = default/brahma.
// hermesTaskId = id kartu kanban KONTAK (dari gsp-kanban-contract) — bridge akan
// mengeksekusi & menutup kartu itu (tanpa membuat kartu duplikat).
// agentId (FIX 02-09, temuan #4): utk pemanggil mesin (bridge/skill helper),
// isi id profil pengirim agar telemetri tidak menyamakan semua edge dgn brahma.
// Side-effecting work waits for approval; safe work is queued immediately.
export async function POST(req: Request) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const title = (b.title || b.prompt || "").toString().trim();
  if (!title) return NextResponse.json({ error: "title or prompt required" }, { status: 400 });
  const sideEffecting = Boolean(b.sideEffecting);
  const hermesTaskId = b.hermesTaskId ? b.hermesTaskId.toString().trim().slice(0, 80) || null : null;
  const requestedBy = getRequester(req, b.agentId ? String(b.agentId) : null);
  const row = await prisma.agentRequest.create({
    data: {
      origin: "web",
      requestedBy,
      kind: (b.kind || "oneshot").toString(),
      title: title.slice(0, 200),
      prompt: (b.prompt ?? b.title ?? "").toString() || null,
      profile: b.profile ? b.profile.toString().trim().slice(0, 80) || null : null,
      sideEffecting,
      hermesTaskId,
      status: sideEffecting ? "awaiting_approval" : "queued",
    },
  });
  return NextResponse.json({ request: row });
}

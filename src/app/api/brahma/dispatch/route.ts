import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST { kind?, title, prompt?, profile?, sideEffecting?, hermesTaskId? } → queue work for Brahma.
// profile = target Hermes profile id (mis. "gsp-master-controller"); null = default/brahma.
// hermesTaskId = id kartu kanban KONTAK (dari gsp-kanban-contract) — bridge akan
// mengeksekusi & menutup kartu itu (tanpa membuat kartu duplikat).
// Side-effecting work waits for approval; safe work is queued immediately.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const title = (b.title || b.prompt || "").toString().trim();
  if (!title) return NextResponse.json({ error: "title or prompt required" }, { status: 400 });
  const sideEffecting = Boolean(b.sideEffecting);
  const hermesTaskId = b.hermesTaskId ? b.hermesTaskId.toString().trim().slice(0, 80) || null : null;
  const row = await prisma.agentRequest.create({
    data: {
      origin: "web",
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

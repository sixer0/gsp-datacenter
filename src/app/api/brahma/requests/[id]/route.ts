import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from '@/lib/require-session';

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.agentRequest.findUnique({
    where: { id },
    select: { id: true, title: true, status: true, kind: true, profile: true, result: true, error: true, createdAt: true, startedAt: true, finishedAt: true },
  });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ request: row });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const action = (b.action || "").toString(); // approve | reject | edit | force-done | request-changes
  const existing = await prisma.agentRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data: Record<string, unknown> = { decidedAt: new Date() };
  // Review gate: needs-review hanya boleh disentuh asignor (force-done / request-changes).
  // TRG-0904G-FIX: blocked/failed juga boleh ditutup asignor — sebelumnya request yang
  // diblokir bridge lalu kartunya ditutup jalur lain jadi jejak abadi tanpa penutupan (409).
  const actionable =
    existing.status === "awaiting_approval" || existing.status === "queued"
      ? ["approve", "reject", "edit"]
      : existing.status === "needs-review" || existing.status === "blocked" || existing.status === "failed"
        ? ["force-done", "request-changes"]
        : [];
  if (!actionable.includes(action))
    return NextResponse.json({ error: `cannot ${action || "(empty)"} a ${existing.status} request` }, { status: 409 });
  if (action === "approve") data.status = "approved";
  else if (action === "reject") {
    // FIX-RR (defect TRIAGE-0904D): reject wajib merekam alasan ke kolom result
    // supaya controller tahu dasar penolakan; kosong = penanda tanpa alasan.
    data.status = "rejected";
    const reason = (b.reason || "").toString().trim().slice(0, 2000);
    data.result = `REJECTED BY USER: ${reason || "(tanpa alasan)"}`;
  }
  else if (action === "edit") { data.status = "approved"; if (b.prompt) data.prompt = b.prompt.toString(); if (b.title) data.title = b.title.toString().slice(0, 200); }
  else if (action === "force-done") {
    data.status = "done";
    if (b.note) data.result = (existing.result ? `[FORCE-DONE] ${b.note}\n\n` : `[FORCE-DONE] ${b.note}`) + (existing.result || "");
  }
  else if (action === "request-changes") {
    data.status = "queued";
    const feedback = (b.feedback || b.reason || "").toString().slice(0, 2000);
    if (feedback) {
      const prefix = `\n\n[REVIEW FEEDBACK — changes requested]: ${feedback}\n[Please revise and resubmit for review]\n`;
      data.prompt = (existing.prompt ? existing.prompt + prefix : prefix);
    }
  }
  else return NextResponse.json({ error: "action must be approve|reject|edit|force-done|request-changes" }, { status: 400 });

  const row = await prisma.agentRequest.update({ where: { id }, data });
  return NextResponse.json({ request: row });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const action = (b.action || "").toString(); // approve | reject | edit | force-done | request-changes
  const existing = await prisma.agentRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data: Record<string, unknown> = { decidedAt: new Date() };
  // Review gate: needs-review hanya boleh disentuh asignor (force-done / request-changes).
  const actionable =
    existing.status === "awaiting_approval" || existing.status === "queued"
      ? ["approve", "reject", "edit"]
      : existing.status === "needs-review"
        ? ["force-done", "request-changes"]
        : [];
  if (!actionable.includes(action))
    return NextResponse.json({ error: `cannot ${action || "(empty)"} a ${existing.status} request` }, { status: 409 });
  if (action === "approve") data.status = "approved";
  else if (action === "reject") data.status = "rejected";
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

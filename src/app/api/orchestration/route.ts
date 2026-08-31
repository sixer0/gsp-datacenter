import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from '@/lib/require-session';

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Orchestration Telemetry API ────────────────────────────────────────────
// Jejak interaksi lintas profil GSP. Satu baris = satu edge terarah A→B.
//
// GET  /api/orchestration?from=&to=&kind=&status=&since=&runId=&limit=
//      → { records: [...], stats: {...} }
// POST /api/orchestration  → create / update (idempotent via id atau runId+from+to+kind)
// DELETE /api/orchestration?id=... | ?runId=...  → hapus (housekeeping/test)

const KINDS = ["delegate", "handoff", "verify", "report", "review", "gate", "dispatch"];
const STATUSES = ["running", "done", "blocked", "needs-review", "failed", "rejected"];

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const where: any = {};

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const kind = searchParams.get("kind");
  const status = searchParams.get("status");
  const runId = searchParams.get("runId");
  const since = searchParams.get("since");
  const limit = Math.min(Number(searchParams.get("limit") || 200), 1000);

  if (from) where.fromAgent = from;
  if (to) where.toAgent = to;
  if (kind) where.kind = kind;
  if (status) where.status = status;
  if (runId) where.runId = runId;
  if (since) where.createdAt = { gte: new Date(since) };

  const records = await prisma.orchestrationRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // ── stats (full window, bukan hanya limit) ──
  const all = await prisma.orchestrationRecord.findMany({
    where,
    select: { kind: true, status: true, fromAgent: true, toAgent: true },
  });
  const byKind: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byPair: Record<string, number> = {};
  const byGroup: Record<string, number> = {};
  for (const r of all) {
    byKind[r.kind] = (byKind[r.kind] || 0) + 1;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    const pair = `${r.fromAgent}→${r.toAgent}`;
    byPair[pair] = (byPair[pair] || 0) + 1;
    byGroup[r.fromAgent.startsWith("gsp-") ? r.fromAgent : "brahma"] =
      (byGroup[r.fromAgent.startsWith("gsp-") ? r.fromAgent : "brahma"] || 0) + 1;
  }

  return ok({
    records: records.map((r) => ({
      id: r.id,
      runId: r.runId,
      from: r.fromAgent,
      to: r.toAgent,
      kind: r.kind,
      status: r.status,
      taskId: r.taskId,
      taskTitle: r.taskTitle,
      message: r.message,
      artifactPath: r.artifactPath,
      meta: r.meta,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    stats: { total: all.length, byKind, byStatus, byPair, byGroup },
  });
}

export async function POST(req: Request) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const from = (b.from || b.fromAgent || "").toString().trim();
  const to = (b.to || b.toAgent || "").toString().trim();
  if (!from || !to) return ok({ error: "from and to (agent ids) are required" }, 400);

  const kind = (b.kind || "delegate").toString().trim();
  const status = (b.status || "running").toString().trim();
  if (!KINDS.includes(kind)) return ok({ error: `kind must be one of ${KINDS.join(", ")}` }, 400);
  if (!STATUSES.includes(status)) return ok({ error: `status must be one of ${STATUSES.join(", ")}` }, 400);

  const data = {
    ...(kind ? { kind } : {}),
    ...(status ? { status } : {}),
    ...(b.runId ? { runId: b.runId.toString().slice(0, 120) } : {}),
    ...(b.taskId ? { taskId: b.taskId.toString().slice(0, 120) } : {}),
    ...(b.taskTitle ? { taskTitle: b.taskTitle.toString().slice(0, 300) } : {}),
    ...(b.message ? { message: b.message.toString().slice(0, 1000) } : {}),
    ...(b.artifactPath ? { artifactPath: b.artifactPath.toString().slice(0, 500) } : {}),
    ...(b.meta && typeof b.meta === "object" ? { meta: b.meta } : {}),
  };

  // 1) id known → update that record
  if (b.id) {
    const existing = await prisma.orchestrationRecord.findUnique({ where: { id: b.id } });
    if (!existing) return ok({ error: "record not found" }, 404);
    const updated = await prisma.orchestrationRecord.update({
      where: { id: b.id },
      data,
    });
    return ok({ ok: true, record: updated });
  }

  // 2) runId+from+to+kind → idempotent upsert (controller closes an open edge)
  if (b.runId) {
    const existing = await prisma.orchestrationRecord.findFirst({
      where: { runId: b.runId.toString(), fromAgent: from, toAgent: to, kind },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      const updated = await prisma.orchestrationRecord.update({
        where: { id: existing.id },
        data,
      });
      return ok({ ok: true, record: updated, updated: true });
    }
  }

  // 3) otherwise create
  const created = await prisma.orchestrationRecord.create({
    data: {
      fromAgent: from,
      toAgent: to,
      kind,
      status,
      ...data,
    },
  });
  return ok({ ok: true, record: created, created: true }, 201);
}

export async function DELETE(req: Request) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const runId = searchParams.get("runId");
  if (id) {
    await prisma.orchestrationRecord.deleteMany({ where: { id } });
    return ok({ ok: true, deleted: id });
  }
  if (runId) {
    const res = await prisma.orchestrationRecord.deleteMany({ where: { runId } });
    return ok({ ok: true, deleted: res.count });
  }
  return ok({ error: "id or runId required" }, 400);
}

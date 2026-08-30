import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/brahma/dispatch-kpi — KPI kesehatan dispatch & delegasi (R4, 29-08-2026)
// Metrik: distribusi status, antrean review tertunda, zombie, edge non-brahma
// (multi-hop), self-claim historis, dispatch 24 jam terakhir.
export async function GET() {
  const [statusCounts, pendingReview, runningNow, runningEdgeCount, selfClaim, total] =
    await Promise.all([
      prisma.agentRequest.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.agentRequest.count({ where: { status: "needs-review" } }),
      prisma.agentRequest.count({ where: { status: "running" } }),
      prisma.orchestrationRecord.count({ where: { status: "running" } }),
      prisma.agentRequest.count({
        where: { status: "done", decidedAt: null, kind: { in: ["oneshot", "chat"] } },
      }),
      prisma.agentRequest.count(),
    ]);

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const last24h = await prisma.agentRequest.findMany({
    where: { createdAt: { gte: since } },
    select: { status: true, kind: true, profile: true },
  });
  const last24 = {
    total: last24h.length,
    needsReview: last24h.filter((r) => r.status === "needs-review").length,
    done: last24h.filter((r) => r.status === "done").length,
    failed: last24h.filter((r) => r.status === "failed").length,
  };

  // Edge non-brahma (multi-hop): dari agent selain brahma/default — indikator
  // delegasi antar-profil yang terekam (telemetry), bukan hanya star dari bridge.
  const nonBrahmaEdges = await prisma.orchestrationRecord.count({
    where: { fromAgent: { notIn: ["brahma", "default"] } },
  });
  const totalEdges = await prisma.orchestrationRecord.count();

  // Zombie edge = status 'running' padahal parent request sudah terminal/hilang.
  const runningEdges = await prisma.orchestrationRecord.findMany({
    where: { status: "running" },
    select: { runId: true },
  });
  const parentIds = runningEdges.map((e) => e.runId).filter((x): x is string => Boolean(x));
  const parents = parentIds.length
    ? await prisma.agentRequest.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, status: true },
      })
    : [];
  const parentMap = new Map(parents.map((p) => [p.id, p.status]));
  const zombieEdges = runningEdges.filter((e) => {
    const st = parentMap.get(e.runId || "");
    return st === undefined || st !== "running";
  }).length;

  const byStatus: Record<string, number> = {};
  for (const g of statusCounts) byStatus[g.status] = g._count._all;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    total,
    byStatus,
    review: {
      pending: pendingReview,
      running: runningNow,
      selfClaimHistoris: selfClaim,
      selfClaimNote:
        "done tanpa decidedAt (kind oneshot/chat) — data sebelum review gate 29-08-2026",
    },
    orchestration: {
      zombieEdges,
      runningEdges: runningEdges.length - zombieEdges,
      totalEdges,
      nonBrahmaEdges,
      multiHopPct: totalEdges ? Math.round((nonBrahmaEdges / totalEdges) * 100) : 0,
    },
    last24h: last24,
  });
}

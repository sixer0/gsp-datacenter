"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Panel, SectionHeader, Button, Pill, Skeleton } from "@/components/ui/kit";

interface Kpi {
  generatedAt: string;
  total: number;
  byStatus: Record<string, number>;
  review: { pending: number; running: number; selfClaimHistoris: number; selfClaimNote: string };
  orchestration: { zombieEdges: number; totalEdges: number; nonBrahmaEdges: number; multiHopPct: number };
  last24h: { total: number; needsReview: number; done: number; failed: number };
}

const STATUS_LABEL: Record<string, string> = {
  queued: "Antrean",
  awaiting_approval: "Menunggu persetujuan",
  approved: "Disetujui",
  running: "Berjalan",
  needs_review: "Perlu review",
  "needs-review": "Perlu review",
  done: "Done",
  failed: "Gagal",
  rejected: "Ditolak",
};

export default function DispatchKpiPage() {
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brahma/dispatch-kpi", { cache: "no-store" });
      const j = await res.json();
      setKpi(j.kpi ?? j);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" /> Dispatch KPI
        </h1>
        <Button onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading && !kpi ? (
        <Skeleton className="h-40 w-full" />
      ) : !kpi ? (
        <Panel className="p-6 text-sm text-muted-foreground">Gagal memuat KPI.</Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total dispatch" value={kpi.total} />
            <Stat label="Perlu review (tertunda)" value={kpi.review.pending} accent />
            <Stat label="Berjalan" value={kpi.review.running} />
            <Stat label="Zombie edge" value={kpi.orchestration.zombieEdges} warn={kpi.orchestration.zombieEdges > 0} />
          </div>

          <Panel>
            <SectionHeader>24 jam terakhir</SectionHeader>
            <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-4">
              <Stat small label="Total" value={kpi.last24h.total} />
              <Stat small label="Perlu review" value={kpi.last24h.needsReview} />
              <Stat small label="Done" value={kpi.last24h.done} />
              <Stat small label="Gagal" value={kpi.last24h.failed} />
            </div>
          </Panel>

          <Panel>
            <SectionHeader>Distribusi status (semua waktu)</SectionHeader>
            <div className="flex flex-wrap gap-2 p-3">
              {Object.entries(kpi.byStatus).map(([s, n]) => (
                <Pill key={s}>
                  {STATUS_LABEL[s] ?? s}: <span className="font-semibold">{n}</span>
                </Pill>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeader>Delegasi & review gate</SectionHeader>
            <div className="space-y-2 p-3 text-sm text-muted-foreground">
              <p>
                Edge orkestrasi: <b className="text-foreground">{kpi.orchestration.totalEdges}</b> ·
                non-brahma (multi-hop):{" "}
                <b className="text-foreground">{kpi.orchestration.nonBrahmaEdges}</b> (
                {kpi.orchestration.multiHopPct}%)
              </p>
              <p>
                Self-claim historis (done tanpa keputusan asignor, sebelum review gate):{" "}
                <b className="text-foreground">{kpi.review.selfClaimHistoris}</b>
              </p>
              <p className="text-xs">{kpi.review.selfClaimNote}</p>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  warn,
  small,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
  small?: boolean;
}) {
  return (
    <Panel className={`p-3 ${small ? "" : "md:p-4"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`${small ? "text-lg" : "text-2xl"} font-semibold ${
          warn ? "text-destructive" : accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </Panel>
  );
}

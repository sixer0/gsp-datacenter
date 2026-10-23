"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SectionHeader, Panel, Pill, EmptyState } from "@/components/ui/kit";
import { usePaged, PagedBar } from "@/components/ui/paged";
import { Share2, ArrowRight, Activity, ZoomIn, ZoomOut, Maximize2, X, MousePointer2 } from "lucide-react";

/* ── Tipe ──────────────────────────────────────────────────────────────── */
type Agent = {
  id: string;
  profile: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  level: number;
  group: string;
  groupLabel: string;
  status: string;
  currentTask?: string;
  tasksCompleted: number;
};

type OrchStats = {
  total?: number;
  byKind?: Record<string, number>;
  byStatus?: Record<string, number>;
  byPair?: Record<string, number>;
};

type OrchRecord = {
  id: string;
  runId: string | null;
  from: string;
  to: string;
  kind: string;
  status: string;
  taskId: string | null;
  taskTitle: string | null;
  message: string | null;
  artifactPath: string | null;
  createdAt: string;
  updatedAt: string;
};

/* ── Konfigurasi visual ────────────────────────────────────────────────── */
const GROUP_COLORS: Record<string, string> = {
  core: "var(--accent)",
  advisor: "#a78bfa",
  controller: "#f59e0b",
  analysis: "#38bdf8",
  execution: "#34d399",
  verification: "#fb7185",
  utility: "#c084fc",
  user: "#f472b6",
};
const STATUS_COLORS: Record<string, string> = {
  running: "var(--accent)",
  done: "var(--up)",
  blocked: "var(--warn)",
  "needs-review": "var(--warn)",
  failed: "var(--down)",
  rejected: "var(--text-3)",
};
const STATUS_LABEL: Record<string, string> = {
  running: "Running",
  done: "Done",
  blocked: "Blocked",
  "needs-review": "Needs review",
  failed: "Failed",
  rejected: "Rejected",
};
const statusPill = (st: string) =>
  st === "done" ? "up" : st === "failed" ? "down" : st === "running" ? "accent" : "warn";
const KIND_LABEL: Record<string, string> = {
  delegate: "Delegasi",
  handoff: "Handoff",
  verify: "Verifikasi",
  report: "Laporan",
  review: "Review",
  gate: "Gate",
  dispatch: "Dispatch",
};
const AGENT_STATUS: Record<string, { color: string; label: string; pulse?: boolean }> = {
  online: { color: "var(--up)", label: "Online", pulse: true },
  running: { color: "var(--accent)", label: "Bekerja", pulse: true },
  working: { color: "var(--accent)", label: "Bekerja", pulse: true },
  idle: { color: "var(--warn)", label: "Idle" },
  offline: { color: "var(--text-4)", label: "Offline" },
  error: { color: "var(--down)", label: "Error" },
};

function timeAgo(d: string): string {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ── Filter periode waktu ──────────────────────────────────
const PERIODS: { key: string; label: string; ms: number | null }[] = [
  { key: "all", label: "Semua", ms: null },
  { key: "24h", label: "24 jam", ms: 24 * 3600 * 1000 },
  { key: "7d", label: "7 hari", ms: 7 * 86400 * 1000 },
  { key: "30d", label: "30 hari", ms: 30 * 86400 * 1000 },
];
function withinPeriod(iso: string, period: string): boolean {
  const p = PERIODS.find((x) => x.key === period);
  if (!p || p.ms === null) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t <= p.ms;
}

/* ── Layout hierarkis: baris kepemimpinan → kontroler → kolom spesialis ── */
const CARD_W = 178;
const CARD_H = 46;
const CARD_H_BIG = 58;
const GAP_Y = 8;
const COL_GAP = 150;
const W = 1580;
const H = 1120;

type Pos = { x: number; y: number; w: number; h: number };

function computePositions(agents: Agent[]): Map<string, Pos> {
  const pos = new Map<string, Pos>();
  const byId = new Map(agents.map((a) => [a.id, a]));
  const centerRow = (ids: string[], y: number, gap: number, h: number) => {
    const list = ids.filter((id) => byId.has(id));
    const total = list.length * CARD_W + (list.length - 1) * gap;
    let x = W / 2 - total / 2;
    for (const id of list) {
      pos.set(id, { x, y, w: CARD_W, h });
      x += CARD_W + gap;
    }
  };

  // Baris 1 — Brahma di tengah, penasihat mengapit (jarak bersih dari tepi Brahma)
  const brahma = byId.get("brahma");
  const bx = W / 2 - CARD_W / 2;
  if (brahma) pos.set("brahma", { x: bx, y: 40, w: CARD_W, h: CARD_H_BIG });
  const advisors = agents.filter((a) => a.level === 2);
  advisors.forEach((a, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const idx = Math.floor(i / 2);
    const off = 36 + idx * (CARD_W + 36);
    pos.set(a.id, { x: side < 0 ? bx - off - CARD_W : bx + CARD_W + off, y: 40, w: CARD_W, h: CARD_H_BIG });
  });

  // Baris 1b — node virtual pengguna login (edge "user:<nama>" dari telemetri
  // FIX 02-09 temuan #4): tidak ada di roster profil, jadi digambar sendiri.
  centerRow(agents.filter((a) => a.group === "user").map((a) => a.id), 122, 18, CARD_H);

  // Baris 2 — kontroler (terpusat)
  centerRow(agents.filter((a) => a.group === "controller").map((a) => a.id), 178, 18, CARD_H);

  // Baris 3+ — kolom grup spesialis
  const colGroups = ["analysis", "execution", "verification", "utility"].filter((g) =>
    agents.some((a) => a.group === g)
  );
  const colW = CARD_W;
  const x0 = (W - (colGroups.length * colW + (colGroups.length - 1) * COL_GAP)) / 2;
  const topY = 292;
  colGroups.forEach((g, ci) => {
    const members = agents.filter((a) => a.group === g);
    const colX = x0 + ci * (colW + COL_GAP);
    members.forEach((a, i) => {
      pos.set(a.id, { x: colX, y: topY + i * (CARD_H + GAP_Y), w: CARD_W, h: CARD_H });
    });
  });

  // fallback: node tak dikenal di pojok
  let fy = H - 60;
  for (const a of agents) {
    if (!pos.has(a.id)) {
      pos.set(a.id, { x: 20, y: fy, w: CARD_W, h: CARD_H });
      fy -= CARD_H + GAP_Y;
    }
  }
  return pos;
}

function edgePath(p1: Pos, p2: Pos): { d: string; mid: [number, number] } {
  const c1x = p1.x + p1.w / 2, c1y = p1.y + p1.h / 2;
  const c2x = p2.x + p2.w / 2, c2y = p2.y + p2.h / 2;
  const dx = c2x - c1x, dy = c2y - c1y;
  let s: [number, number], t: [number, number];
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx >= 0) { s = [p1.x + p1.w, c1y]; t = [p2.x, c2y]; }
    else { s = [p1.x, c1y]; t = [p2.x + p2.w, c2y]; }
    const ox = Math.max(36, Math.min(130, Math.abs(dx) * 0.5));
    return { d: `M ${s[0]} ${s[1]} C ${s[0] + ox} ${s[1]}, ${t[0] - ox} ${t[1]}, ${t[0]} ${t[1]}`,
             mid: [(s[0] + t[0]) / 2, (s[1] + t[1]) / 2] };
  } else {
    if (dy >= 0) { s = [c1x, p1.y + p1.h]; t = [c2x, p2.y]; }
    else { s = [c1x, p1.y]; t = [c2x, p2.y + p2.h]; }
    const oy = Math.max(36, Math.min(120, Math.abs(dy) * 0.5));
    return { d: `M ${s[0]} ${s[1]} C ${s[0]} ${s[1] + oy}, ${t[0]} ${t[1] - oy}, ${t[0]} ${t[1]}`,
             mid: [(s[0] + t[0]) / 2, (s[1] + t[1]) / 2] };
  }
}

export default function OrchestrationPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [records, setRecords] = useState<OrchRecord[]>([]);
  const [stats, setStats] = useState<OrchStats>({ total: 0, byKind: {}, byStatus: {}, byPair: {} });
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"graph" | "timeline">("graph");
  const [selected, setSelected] = useState<string | null>(null);
  const [selEdge, setSelEdge] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [fKind, setFKind] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fGroup, setFGroup] = useState("all");
  const [fPeriod, setFPeriod] = useState("all"); // all | 24h | 7d | 30d
  const [q, setQ] = useState("");
  // zoom & pan
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const panRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    panRef.current = false;
    drag.current = { x: e.clientX, y: e.clientY };
    const move = (ev: PointerEvent) => {
      if (!drag.current) return;
      const dx = ev.clientX - drag.current.x, dy = ev.clientY - drag.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) panRef.current = true;
      if (panRef.current) setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
      drag.current.x = ev.clientX; drag.current.y = ev.clientY;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const load = useCallback(async () => {
    try {
      const [a, o] = await Promise.all([
        fetch("/api/agents").then((r) => r.json()),
        fetch("/api/orchestration?limit=250").then((r) => r.json()),
      ]);
      setAgents(Array.isArray(a) ? a : []);
      setRecords(o.records ?? []);
      setStats(o.stats ?? { total: 0, byKind: {}, byStatus: {}, byPair: {} });
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 6000);
    return () => clearInterval(iv);
  }, [load]);

  // wheel zoom (non-passive)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      setView((v) => {
        const ns = Math.min(3, Math.max(0.25, v.s * (e.deltaY < 0 ? 1.12 : 0.89)));
        const k = ns / v.s;
        return { s: ns, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // records dalam periode aktif — dipakai graf (edge), blocker, dan timeline
  const periodRecords = useMemo(
    () => records.filter((r) => withinPeriod(r.createdAt, fPeriod)),
    [records, fPeriod]
  );

  // count status & kind dalam periode aktif — ditampilkan di tombol filter
  const statusCounts = useMemo(() => {
    const m: { [k: string]: number } = {};
    for (const r of periodRecords) m[r.status] = (m[r.status] || 0) + 1;
    return m;
  }, [periodRecords]);
  const kindCounts = useMemo(() => {
    const m: { [k: string]: number } = {};
    for (const r of periodRecords) m[r.kind] = (m[r.kind] || 0) + 1;
    return m;
  }, [periodRecords]);
  // kind yang benar-benar punya data dalam periode — filter kind hanya tampil bila >1 jenis
  const kindOrder = ["delegate", "handoff", "verify", "report", "review", "gate", "dispatch"];
  const activeKinds = kindOrder.filter((k) => (kindCounts[k] ?? 0) > 0);

  const edges = useMemo(() => {
    const map = new Map<string, { from: string; to: string; count: number; status: string; kinds: Set<string>; title: string | null; updatedAt: string; ids: string[] }>();
    for (const r of periodRecords) {
      const key = `${r.from}→${r.to}`;
      const e = map.get(key) || { from: r.from, to: r.to, count: 0, status: r.status, kinds: new Set<string>(), title: null, updatedAt: r.updatedAt, ids: [] };
      e.count += 1;
      e.kinds.add(r.kind);
      if (r.taskTitle) e.title = r.taskTitle;
      if (new Date(r.updatedAt) > new Date(e.updatedAt)) { e.status = r.status; e.updatedAt = r.updatedAt; }
      e.ids.push(r.id);
      map.set(key, e);
    }
    return [...map.values()];
  }, [periodRecords]);

  // FIX 02-09-2026 (temuan #4): tambahkan node virtual utk inisiator login
  // ("user:<nama>") yang muncul di record telemetri tapi tidak ada di roster
  // profil — tanpa ini edge-nya tak tergambar (edge butuh posisi kedua ujung).
  const graphAgents = useMemo(() => {
    const ids = new Set(agents.map((a) => a.id));
    const extra: Agent[] = [];
    for (const r of records) {
      for (const id of [r.from, r.to]) {
        if (!id || ids.has(id) || !id.startsWith("user:")) continue;
        ids.add(id);
        extra.push({
          id, profile: id, name: id.slice(5), emoji: "👤",
          role: "Pengguna login · inisiator dispatch", model: "-", level: 1,
          group: "user", groupLabel: "Pengguna", status: "idle", tasksCompleted: 0,
        });
      }
    }
    return extra.length ? [...extra, ...agents] : agents;
  }, [agents, records]);

  const positions = useMemo(() => computePositions(graphAgents), [graphAgents]);
  const agentById = useMemo(() => new Map(graphAgents.map((a) => [a.id, a])), [graphAgents]);

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => withinPeriod(r.createdAt, fPeriod))
      .filter((r) => (fKind === "all" ? true : r.kind === fKind))
      .filter((r) => (fStatus === "all" ? true : r.status === fStatus))
      .filter((r) => (fGroup === "all" ? true : agentById.get(r.from)?.group === fGroup || agentById.get(r.to)?.group === fGroup))
      .filter((r) => (q ? (r.from + r.to + (r.taskTitle || "") + (r.message || "")).toLowerCase().includes(q.toLowerCase()) : true));
  }, [records, fKind, fStatus, fGroup, fPeriod, q, agentById]);

  // paging timeline — 10 baris/halaman (lazy render), reset saat filter berubah
  const timeline = usePaged(filteredRecords);
  useEffect(() => {
    timeline.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fKind, fStatus, fGroup, fPeriod, q]);

  const filteredEdges = useMemo(() => {
    return edges.filter((e) => {
      if (fStatus !== "all" && e.status !== fStatus) return false;
      if (fKind !== "all" && !e.kinds.has(fKind)) return false;
      if (fGroup !== "all") {
        const a = agentById.get(e.from), b = agentById.get(e.to);
        if (!a || !b) return false;
        if (a.group !== fGroup && b.group !== fGroup) return false;
      }
      if (q && !(e.from + e.to).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [edges, fKind, fStatus, fGroup, q, agentById]);

  // badge interaksi per agen — dihitung dari EDGE TERFILTER agar konsisten
  // dengan filter aktif (letakkan setelah filteredEdges karena dependensi)
  const edgeCountByAgent = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of filteredEdges) {
      m.set(e.from, (m.get(e.from) || 0) + e.count);
      m.set(e.to, (m.get(e.to) || 0) + e.count);
    }
    return m;
  }, [filteredEdges]);

  const selAgent = selected ? agentById.get(selected) : null;
  const selEdgeData = selEdge ? edges.find((e) => `${e.from}→${e.to}` === selEdge) : null;
  const selEdgeRecords = selEdge && selEdgeData
    ? filteredRecords.filter((r) => r.from === selEdgeData.from && r.to === selEdgeData.to)
    : [];

  const focusKey = hover || selected || (hoverEdge || selEdge);
  const isEdgeActive = (e: { from: string; to: string }) => {
    if (!focusKey) return true;
    if (typeof focusKey === "string" && focusKey.includes("→")) return focusKey === `${e.from}→${e.to}` || focusKey === e.from || focusKey === e.to;
    return e.from === focusKey || e.to === focusKey;
  };
  const isCardActive = (id: string) => {
    if (!focusKey) return true;
    if (typeof focusKey === "string" && focusKey.includes("→")) return focusKey === id;
    return id === focusKey;
  };
  const isNeighbor = (id: string) => {
    if (!focusKey || typeof focusKey !== "string" || focusKey.includes("→")) return false;
    return edges.some((e) => (e.from === focusKey && e.to === id) || (e.to === focusKey && e.from === id));
  };

  const filterBtn = (active: boolean) =>
    `px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
      active ? "text-[var(--text)]" : "text-[var(--text-3)] hover:text-[var(--text-2)]"
    }` + (active ? "" : " border-transparent");

  return (
    <div className="flex flex-col gap-4">
      {/* Graf hidup jejak delegasi, handoff, verifikasi, dan pelaporan antar profil — direkam via bridge & gsp-hq-record.
          (Dulu prop `hint`, yang tidak didukung SectionHeader dan tidak pernah dirender.) */}
      <SectionHeader
        label="Orchestration"
        title="Interaksi antar profil ekosistem GSP"
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
        {[
          { label: "Total interaksi", value: stats.total ?? 0, color: "var(--text)" },
          { label: "Running", value: stats.byStatus?.running ?? 0, color: "var(--accent)" },
          { label: "Blocked", value: (stats.byStatus?.blocked ?? 0) + (stats.byStatus?.["needs-review"] ?? 0), color: "var(--warn)" },
          { label: "Done", value: stats.byStatus?.done ?? 0, color: "var(--up)" },
          { label: "Failed", value: stats.byStatus?.failed ?? 0, color: "var(--down)" },
          { label: "Profil aktif", value: agents.filter((a) => a.status === "online" || a.status === "running" || a.status === "working").length, color: "var(--up)" },
        ].map((s) => (
          <div key={s.label} className="panel p-3.5">
            <div className="text-[20px] font-semibold tabular-nums" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-[var(--text-3)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Blocker terbaru ── */}
      {(() => {
        const blockers = filteredRecords.filter((r) => r.status === "blocked" || r.status === "needs-review").slice(0, 5);
        if (blockers.length === 0) return null;
        return (
          <div className="panel p-4" style={{ borderColor: "color-mix(in srgb, var(--warn) 45%, var(--line))" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--warn)" }} />
              <div className="text-[12px] font-semibold text-[var(--text)]">Blocker terbaru ({blockers.length})</div>
              <span className="text-[10.5px] text-[var(--text-3)]">— laporan status blocked / needs-review dari eksekusi nyata</span>
            </div>
            <div className="flex flex-col gap-2">
              {blockers.map((r) => {
                const fa = agentById.get(r.from), ta = agentById.get(r.to);
                const pair = `${r.from}→${r.to}`;
                return (
                  <button
                    key={r.id}
                    className="flex items-start gap-3 text-left p-2.5 rounded-[10px] bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--warn)] transition-colors cursor-pointer"
                    onClick={() => { setTab("graph"); setSelected(null); setSelEdge(pair); }}
                  >
                    <div className="flex items-center gap-1.5 shrink-0 text-[11.5px]">
                      <span className="text-base">{fa?.emoji ?? "❓"}</span>
                      <span className="font-medium text-[var(--text)] truncate max-w-[120px]">{fa?.name ?? r.from}</span>
                      <ArrowRight className="w-3 h-3 text-[var(--text-4)] shrink-0" />
                      <span className="text-base">{ta?.emoji ?? "❓"}</span>
                      <span className="font-medium text-[var(--text)] truncate max-w-[120px]">{ta?.name ?? r.to}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {r.taskTitle && <div className="text-[12px] text-[var(--text)] truncate">{r.taskTitle}</div>}
                      {r.message && <div className="text-[11px] text-[var(--text-3)] line-clamp-2 mt-0.5">{r.message}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Pill tone="warn">{STATUS_LABEL[r.status] ?? r.status}</Pill>
                      <span className="text-[10px] text-[var(--text-4)]">{timeAgo(r.createdAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Panel utama ── */}
      <Panel className="overflow-hidden">
        {/* toolbar: tab + filter (tiap grup dibungkus pill berlabel agar jelas) */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[var(--line)]">
          <div className="flex items-center rounded-full border border-[var(--line)] overflow-hidden shrink-0 mr-1">
            <button
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${tab === "graph" ? "bg-[var(--surface-2)] text-[var(--text)]" : "text-[var(--text-3)] hover:text-[var(--text-2)]"}`}
              onClick={() => setTab("graph")}
              title="Tampilan graf interaksi"
            >
              <MousePointer2 className="w-3 h-3 inline -mt-0.5 mr-1" />Graf
            </button>
            <button
              className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${tab === "timeline" ? "bg-[var(--surface-2)] text-[var(--text)]" : "text-[var(--text-3)] hover:text-[var(--text-2)]"}`}
              onClick={() => setTab("timeline")}
              title="Tampilan timeline interaksi"
            >
              <Activity className="w-3 h-3 inline -mt-0.5 mr-1" />Timeline
            </button>
          </div>

          {/* Grup filter: Kind — hanya tampil bila ada >1 jenis interaksi dalam periode */}
          {activeKinds.length > 1 && (
            <div className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-1)] px-2 py-1" role="group" aria-label="Filter jenis interaksi">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-4)] mr-0.5">Kind</span>
              {["all", ...activeKinds].map((k) => (
                <button key={k} className={filterBtn(fKind === k)} style={fKind === k ? { background: "var(--surface-2)", borderColor: "var(--line)" } : undefined} onClick={() => setFKind(k)} title={`Filter jenis: ${k === "all" ? "semua" : KIND_LABEL[k]}`}>
                  {k === "all" ? "Semua" : KIND_LABEL[k]}
                  {k !== "all" && <span className="num text-[10px] opacity-60 ml-1">{kindCounts[k] ?? 0}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Grup filter: Status */}
          <div className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-1)] px-2 py-1" role="group" aria-label="Filter status interaksi">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-4)] mr-0.5">Status</span>
            {["all", "running", "done", "blocked", "needs-review", "failed"].map((s) => (
              <button key={s} className={filterBtn(fStatus === s)} style={fStatus === s ? { background: "var(--surface-2)", borderColor: "var(--line)" } : undefined} onClick={() => setFStatus(s)} title={`Filter status: ${s === "all" ? "semua" : STATUS_LABEL[s]}`}>
                {s === "all" ? "Semua" : STATUS_LABEL[s]}
                {s !== "all" && <span className="num text-[10px] opacity-60 ml-1">{statusCounts[s] ?? 0}</span>}
              </button>
            ))}
          </div>

          {/* Grup filter: Periode waktu */}
          <div className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-1)] px-2 py-1" role="group" aria-label="Filter periode waktu">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-4)] mr-0.5">Periode</span>
            {PERIODS.map((p) => (
              <button key={p.key} className={filterBtn(fPeriod === p.key)} style={fPeriod === p.key ? { background: "var(--surface-2)", borderColor: "var(--line)" } : undefined} onClick={() => setFPeriod(p.key)} title={`Filter periode: ${p.label}`}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Grup filter: Grup */}
          <div className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-1)] px-2 py-1" role="group" aria-label="Filter grup agen">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-4)] mr-0.5">Grup</span>
            <select
              className="bg-[var(--surface-2)] border border-[var(--line)] rounded-full px-2 py-1 text-[11px] text-[var(--text-2)] outline-none cursor-pointer"
              value={fGroup}
              onChange={(e) => setFGroup(e.target.value)}
              title="Filter berdasarkan grup agen"
            >
              <option value="all">Semua grup</option>
              {[...new Set(graphAgents.map((a) => a.group))].map((g) => (
                <option key={g} value={g}>{agentById.get(graphAgents.find((x) => x.group === g)!.id)?.groupLabel ?? g}</option>
              ))}
            </select>
          </div>

          <input
            className="flex-1 min-w-[160px] bg-[var(--surface-2)] border border-[var(--line)] rounded-full px-3 py-1 text-[11px] text-[var(--text)] outline-none placeholder:text-[var(--text-4)]"
            placeholder="Cari profil…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            title="Cari berdasarkan profil"
          />
        </div>

        {tab === "graph" ? (
          <div className="grid xl:grid-cols-[1fr_330px]">
            {/* ── Panggung graf ── */}
            <div
              ref={stageRef}
              className="relative overflow-hidden select-none"
              style={{ height: 640, background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 4%, transparent), transparent 70%)" }}
              onPointerDown={onPointerDown}
              onClick={() => { if (!panRef.current) { setSelected(null); setSelEdge(null); } }}
            >
              {loaded && agents.length > 0 ? (
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="w-full h-full"
                  style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`, transformOrigin: "0 0", cursor: "grab" }}
                >
                  <defs>
                    {Object.entries(STATUS_COLORS).map(([st, col]) => (
                      <marker key={st} id={`orch-arrow-${st}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                        <path d="M 0 1 L 9 5 L 0 9 z" fill={col} />
                      </marker>
                    ))}
                  </defs>

                  {/* ── edge ── */}
                  {filteredEdges.map((e) => {
                    const p1 = positions.get(e.from);
                    const p2 = positions.get(e.to);
                    if (!p1 || !p2) return null;
                    const { d, mid } = edgePath(p1, p2);
                    const key = `${e.from}→${e.to}`;
                    const col = STATUS_COLORS[e.status] || "var(--text-3)";
                    const active = isEdgeActive(e);
                    const isSel = selEdge === key;
                    const isHov = hoverEdge === key;
                    const strokeW = Math.min(4.5, 1.4 + Math.log2(e.count + 1));
                    const running = e.status === "running";
                    return (
                      <g key={key}>
                        {/* hit area */}
                        <path
                          d={d} fill="none" stroke="transparent" strokeWidth={14} style={{ cursor: "pointer" }}
                          onPointerEnter={() => setHoverEdge(key)}
                          onPointerLeave={() => setHoverEdge(null)}
                          onClick={(ev) => { ev.stopPropagation(); if (panRef.current) return; setSelected(null); setSelEdge(isSel ? null : key); }}
                        />
                        <g opacity={active ? 1 : 0.07} className="transition-opacity duration-200 pointer-events-none">
                          {running && (
                            <path d={d} fill="none" stroke={col} strokeWidth={strokeW + 3} strokeLinecap="round" opacity={0.25}>
                              <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" />
                            </path>
                          )}
                          <path
                            d={d} fill="none" stroke={col} strokeWidth={(isSel || isHov) ? strokeW + 1.5 : strokeW}
                            strokeLinecap="round" opacity={running ? 0.9 : 0.55}
                            strokeDasharray={running ? "6 6" : undefined}
                            markerEnd={`url(#orch-arrow-${e.status})`}
                          />
                          {e.count > 1 && (
                            <g transform={`translate(${mid[0]} ${mid[1]})`}>
                              <circle r={10} fill="var(--surface-2)" stroke={col} strokeWidth={1.2} />
                              <text textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fill="var(--text)">{e.count}</text>
                            </g>
                          )}
                        </g>
                      </g>
                    );
                  })}

                  {/* label kolom */}
                  {["analysis", "execution", "verification", "utility"]
                    .filter((g) => agents.some((a) => a.group === g))
                    .map((g) => {
                      const members = agents.filter((a) => a.group === g);
                      const first = positions.get(members[0].id);
                      if (!first) return null;
                      return (
                        <text key={g} x={first.x + CARD_W / 2} y={first.y - 22} textAnchor="middle" fontSize={11} fontWeight={700} letterSpacing={1} fill={GROUP_COLORS[g]} opacity={0.9} className="uppercase">
                          {agentById.get(members[0].id)?.groupLabel ?? g}
                        </text>
                      );
                    })}

                  {/* ── kartu node ── */}
                  {graphAgents.map((a) => {
                    const p = positions.get(a.id);
                    if (!p) return null;
                    const gcol = GROUP_COLORS[a.group] || "var(--text-3)";
                    const as = AGENT_STATUS[a.status] || AGENT_STATUS.offline;
                    const active = isCardActive(a.id);
                    const neighbor = isNeighbor(a.id);
                    const isSel = selected === a.id;
                    const isHov = hover === a.id;
                    const n = edgeCountByAgent.get(a.id) || 0;
                    return (
                      <g
                        key={a.id}
                        transform={`translate(${p.x} ${p.y})`}
                        opacity={active ? 1 : neighbor ? 0.75 : 0.1}
                        className="transition-opacity duration-200"
                        style={{ cursor: "pointer" }}
                        onPointerEnter={() => setHover(a.id)}
                        onPointerLeave={() => setHover(null)}
                        onClick={(ev) => { ev.stopPropagation(); if (panRef.current) return; setSelEdge(null); setSelected(isSel ? null : a.id); }}
                      >
                        <rect
                          width={p.w} height={p.h} rx={13}
                          fill="var(--surface-2)"
                          stroke={isSel ? "var(--text)" : isHov ? gcol : "var(--line)"}
                          strokeWidth={isSel ? 2 : 1.5}
                          style={isHov && !isSel ? { filter: `drop-shadow(0 0 8px color-mix(in srgb, ${gcol} 45%, transparent))` } : undefined}
                        />
                        {/* dot status */}
                        <circle cx={16} cy={p.h / 2} r={4.5} fill={as.color}>
                          {as.pulse && <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />}
                        </circle>
                        {/* emoji */}
                        <text x={32} y={p.h / 2 + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={20}>{a.emoji}</text>
                        {/* nama */}
                        <text x={52} y={p.h === CARD_H_BIG ? 20 : 17} fontSize={12.5} fontWeight={650} fill="var(--text)">
                          {a.name.length > 20 ? a.name.slice(0, 19) + "…" : a.name}
                        </text>
                        {/* role */}
                        <text x={52} y={p.h === CARD_H_BIG ? 37 : 33} fontSize={9.5} fill="var(--text-4)">
                          {(a.role || a.id).length > 26 ? (a.role || a.id).slice(0, 25) + "…" : (a.role || a.id)}
                        </text>
                        {/* badge interaksi */}
                        {n > 0 && (
                          <g transform={`translate(${p.w - 14} ${p.h / 2})`}>
                            <circle r={10} fill={gcol} opacity={0.18} />
                            <text textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fill={gcol}>{n}</text>
                          </g>
                        )}
                        {a.status === "running" || a.status === "working" ? (
                          <text x={p.w - 14} y={p.h - 8} textAnchor="middle" fontSize={8.5} fill="var(--accent)">{AGENT_STATUS[a.status]?.label}</text>
                        ) : null}
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-[13px] text-[var(--text-3)]">
                  {loaded ? "Belum ada data — kirim dispatch atau catat interaksi via gsp-hq-record." : "Memuat graf…"}
                </div>
              )}

              {/* kontrol zoom */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-[var(--bg)]/85 backdrop-blur rounded-[12px] border border-[var(--line)] p-1.5">
                <button className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--text-2)] hover:bg-[var(--surface-2)]" onClick={() => setView((v) => ({ ...v, s: Math.min(3, v.s * 1.25) }))} title="Perbesar"><ZoomIn className="w-3.5 h-3.5" /></button>
                <button className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--text-2)] hover:bg-[var(--surface-2)]" onClick={() => setView((v) => ({ ...v, s: Math.max(0.25, v.s * 0.8) }))} title="Perkecil"><ZoomOut className="w-3.5 h-3.5" /></button>
                <button className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--text-2)] hover:bg-[var(--surface-2)]" onClick={() => setView({ s: 1, tx: 0, ty: 0 })} title="Reset tampilan"><Maximize2 className="w-3.5 h-3.5" /></button>
              </div>

              {/* legenda */}
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-4 gap-y-1.5 bg-[var(--bg)]/80 backdrop-blur rounded-[10px] border border-[var(--line)] px-3 py-2 max-w-[85%]">
                {Object.entries(GROUP_COLORS).filter(([g]) => agents.some((a) => a.group === g)).map(([g, c]) => (
                  <span key={g} className="flex items-center gap-1.5 text-[10px] text-[var(--text-3)]">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
                    {agentById.get(agents.find((a) => a.group === g)!.id)?.groupLabel ?? g}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-4)] ml-1">· geser untuk pan, scroll untuk zoom</span>
              </div>
            </div>

            {/* ── panel detail ── */}
            <div className="border-t xl:border-t-0 xl:border-l border-[var(--line)] p-4 max-h-[640px] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wide">
                  {selAgent ? "Detail profil" : selEdgeData ? "Detail interaksi" : "Ikhtisar"}
                </div>
                {(selAgent || selEdgeData) && (
                  <button className="text-[var(--text-4)] hover:text-[var(--text)]" onClick={() => { setSelected(null); setSelEdge(null); }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {selAgent ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[var(--r-md)] flex items-center justify-center text-xl shrink-0" style={{ background: "var(--surface-2)", border: `1px solid ${GROUP_COLORS[selAgent.group] || "var(--line)"}` }}>
                      {selAgent.emoji}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-semibold text-[var(--text)] truncate">{selAgent.name}</h3>
                      <p className="text-[11px] text-[var(--text-3)] truncate">{selAgent.role}</p>
                      <p className="text-[10px] text-[var(--text-4)] mt-0.5">
                        <span style={{ color: (AGENT_STATUS[selAgent.status] || AGENT_STATUS.offline).color }}>● {AGENT_STATUS[selAgent.status]?.label ?? selAgent.status}</span>
                        {" · "}{selAgent.model} · {edgeCountByAgent.get(selAgent.id) || 0} interaksi
                      </p>
                    </div>
                  </div>
                  {selAgent.currentTask && (
                    <div className="text-[11.5px] text-[var(--text-2)] bg-[var(--surface-2)] border border-[var(--line)] rounded-[10px] px-3 py-2">
                      🔄 {selAgent.currentTask}
                    </div>
                  )}
                  <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wide mt-1">Interaksi ({selRecords(selAgent.id, filteredRecords).length})</div>
                  {selRecords(selAgent.id, filteredRecords).length === 0 ? (
                    <div className="text-[11.5px] text-[var(--text-3)]">Belum ada interaksi tercatat.</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selRecords(selAgent.id, filteredRecords).map((r) => (
                        <div key={r.id} className="text-[11.5px] bg-[var(--surface-2)] border border-[var(--line)] rounded-[10px] px-3 py-2">
                          <div className="flex items-center gap-1.5 text-[var(--text-2)]">
                            <span>{r.from === selAgent.id ? "→" : "←"}</span>
                            <span className="font-medium">{agentById.get(r.from === selAgent.id ? r.to : r.from)?.name ?? (r.from === selAgent.id ? r.to : r.from)}</span>
                            <span className="text-[var(--text-4)]">· {KIND_LABEL[r.kind] ?? r.kind}</span>
                          </div>
                          {r.taskTitle && <div className="text-[var(--text)] mt-1">{r.taskTitle}</div>}
                          {r.message && <div className="text-[var(--text-3)] mt-0.5 line-clamp-2">{r.message}</div>}
                          {r.artifactPath && <div className="text-[10px] font-mono text-[var(--text-4)] mt-1 truncate">{r.artifactPath}</div>}
                          <div className="flex items-center justify-between mt-1.5">
                            <Pill tone={statusPill(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Pill>
                            <span className="text-[10px] text-[var(--text-4)]">{timeAgo(r.createdAt)} lalu</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : selEdgeData ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{agentById.get(selEdgeData.from)?.emoji ?? "❓"}</span>
                    <span className="text-[12px] font-semibold text-[var(--text)] truncate">{agentById.get(selEdgeData.from)?.name ?? selEdgeData.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-4)] shrink-0" />
                    <span className="text-lg">{agentById.get(selEdgeData.to)?.emoji ?? "❓"}</span>
                    <span className="text-[12px] font-semibold text-[var(--text)] truncate">{agentById.get(selEdgeData.to)?.name ?? selEdgeData.to}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill tone={statusPill(selEdgeData.status)}>{STATUS_LABEL[selEdgeData.status] ?? selEdgeData.status}</Pill>
                    {[...selEdgeData.kinds].map((k) => (
                      <span key={k} className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--line)] text-[var(--text-3)]">{KIND_LABEL[k] ?? k}</span>
                    ))}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--line)] text-[var(--text-3)]">{selEdgeData.count}x interaksi</span>
                  </div>
                  {selEdgeData.title && <div className="text-[12px] text-[var(--text-2)]">{selEdgeData.title}</div>}
                  <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wide mt-1">Rekaman ({selEdgeRecords.length})</div>
                  <div className="flex flex-col gap-2">
                    {selEdgeRecords.map((r) => (
                      <div key={r.id} className="text-[11.5px] bg-[var(--surface-2)] border border-[var(--line)] rounded-[10px] px-3 py-2">
                        {r.taskTitle && <div className="text-[var(--text)]">{r.taskTitle}</div>}
                        {r.message && <div className="text-[var(--text-3)] mt-0.5 line-clamp-2">{r.message}</div>}
                        {r.artifactPath && <div className="text-[10px] font-mono text-[var(--text-4)] mt-1 truncate">{r.artifactPath}</div>}
                        <div className="flex items-center justify-between mt-1.5">
                          <Pill tone={statusPill(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Pill>
                          <span className="text-[10px] text-[var(--text-4)]">{timeAgo(r.createdAt)} lalu</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <EmptyState
                    icon={<Share2 className="w-5 h-5" />}
                    title="Klik profil atau panah interaksi"
                    hint="Hover kartu untuk menyorot koneksinya; klik untuk detail. Zoom dengan scroll / tombol kanan atas; geser untuk pan."
                  />
                  {(stats.byPair && Object.keys(stats.byPair).length > 0) && (
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wide mb-2">Pasangan tersibuk</div>
                      <div className="flex flex-col gap-1.5">
                        {Object.entries(stats.byPair as Record<string, number>).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 6).map(([pair, n]) => {
                          const [f, t] = pair.split("→");
                          return (
                            <button key={pair} className="flex items-center justify-between text-[11.5px] bg-[var(--surface-2)] border border-[var(--line)] rounded-[10px] px-3 py-2 hover:border-[var(--text-3)] cursor-pointer" onClick={() => setSelEdge(pair)}>
                              <span className="truncate">{agentById.get(f)?.name ?? f} <ArrowRight className="w-3 h-3 inline -mt-0.5 text-[var(--text-4)]" /> {agentById.get(t)?.name ?? t}</span>
                              <span className="text-[var(--text-2)] font-semibold ml-2">{n}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Timeline ── */
          <div className="p-4">
            <div className="text-[11px] text-[var(--text-3)] mb-3">
              {filteredRecords.length} interaksi (filter aktif) — paling baru di atas.
            </div>
            {filteredRecords.length === 0 ? (
              <EmptyState
                icon={<Activity className="w-5 h-5" />}
                title="Belum ada interaksi"
                hint="Interaksi muncul di sini setelah controller mendelegasikan ke profil lain, atau saat dispatch dikirim lewat HQ."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {timeline.slice.map((r) => {
                  const fa = agentById.get(r.from), ta = agentById.get(r.to);
                  return <TimelineRow key={r.id} r={r} fa={fa} ta={ta} />;
                })}
              </div>
            )}
            <PagedBar p={timeline} className="mt-3 -mx-4" />
          </div>
        )}
      </Panel>
    </div>
  );
}

// ── Baris timeline: klik untuk memperluas detail (khusus failed: pesan utuh, merah) ──
function TimelineRow({ r, fa, ta }: { r: OrchRecord; fa?: Agent; ta?: Agent }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!(r.message || r.artifactPath);
  const isFailed = r.status === "failed";
  return (
    <div
      role={hasDetail ? "button" : undefined}
      aria-expanded={hasDetail ? open : undefined}
      onClick={() => hasDetail && setOpen((o) => !o)}
      className={`flex items-start gap-3 p-3 rounded-[10px] bg-[var(--surface-2)] border transition-colors ${
        hasDetail ? "cursor-pointer hover:border-[var(--text-3)]" : "border-[var(--line)]"
      } ${isFailed ? "border-l-2" : ""}`}
      style={{
        borderLeftColor: isFailed ? "color-mix(in srgb, var(--down) 60%, transparent)" : undefined,
      }}
    >
      <div className="flex items-center gap-2 shrink-0 w-[300px] min-w-0">
        <span className="text-lg">{fa?.emoji ?? "❓"}</span>
        <span className="text-[12px] font-medium text-[var(--text)] truncate">{fa?.name ?? r.from}</span>
        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-4)] shrink-0" />
        <span className="text-lg">{ta?.emoji ?? "❓"}</span>
        <span className="text-[12px] font-medium text-[var(--text)] truncate">{ta?.name ?? r.to}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--line)] text-[var(--text-3)]">{KIND_LABEL[r.kind] ?? r.kind}</span>
        <Pill tone={statusPill(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Pill>
      </div>
      <div className="flex-1 min-w-0">
        {r.taskTitle && <div className="text-[12px] text-[var(--text)] truncate">{r.taskTitle}</div>}
        {r.message && (
          <div
            className={`text-[11px] ${open ? "whitespace-pre-wrap break-words mt-1" : "truncate"}`}
            style={{ color: open && isFailed ? "var(--down)" : "var(--text-3)" }}
          >
            {r.message}
          </div>
        )}
        {open && r.artifactPath && (
          <div className="text-[10px] font-mono text-[var(--text-4)] mt-1 break-all">{r.artifactPath}</div>
        )}
        {!open && r.artifactPath && (
          <div className="text-[10px] font-mono text-[var(--text-4)] truncate">{r.artifactPath}</div>
        )}
        {hasDetail && (
          <span className="text-[9.5px] text-[var(--text-4)] mt-1 inline-block">
            {open ? "▲ tutup detail" : "▼ lihat detail"}
          </span>
        )}
      </div>
      <span className="text-[10px] text-[var(--text-4)] shrink-0 w-12 text-right">{timeAgo(r.createdAt)}</span>
    </div>
  );
}

// helper terpisah agar tidak membebani render utama
function selRecords(agentId: string, records: OrchRecord[]): OrchRecord[] {
  return records.filter((r) => r.from === agentId || r.to === agentId).slice(0, 12);
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, ChevronRight, Gauge } from "lucide-react";
import { Panel, SectionHeader, Pill, EmptyState, Eyebrow } from "@/components/ui/kit";
import { usePaged, PagedBar } from "@/components/ui/paged";

// ── Types ─────────────────────────────────────────────────
type RunStatus =
  | "queued"
  | "awaiting_approval"
  | "approved"
  | "running"
  | "done"
  | "failed"
  | "rejected";

interface Req {
  id: string;
  origin: string;
  kind: string;
  title: string;
  prompt: string | null;
  sideEffecting: boolean;
  status: RunStatus;
  result: string | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

interface ModelUsage {
  model: string;
  sessions?: number | null;
  tokens?: number | null;
  cost?: number | null;
  calls?: number | null;
}

interface Cost {
  period?: string | null;
  summary?: string | null;
  byModel?: ModelUsage[];
  byPlatform?: { platform: string; sessions?: number | null; messages?: number | null; tokens?: number | null }[];
  overview?: {
    sessions?: number | null;
    messages?: number | null;
    toolCalls?: number | null;
    userMessages?: number | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
  } | null;
  totalCost?: number | null;
  totalTokens?: number | null;
  unknownSessions?: number | null;
  syncedAt?: string | null;
}

// ── Helpers ───────────────────────────────────────────────
function timeAgo(d: string | null): string {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  if (Number.isNaN(diff)) return "—";
  const s = Math.floor(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function duration(start: string | null, finish: string | null): string {
  if (!start || !finish) return "—";
  const ms = new Date(finish).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const totalS = Math.round(ms / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString("en-US");
}
function fmtUsd(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: n < 100 ? 2 : 0,
    maximumFractionDigits: n < 100 ? 2 : 0,
  })}`;
}

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduce;
}

// ── Status → tone / dot ───────────────────────────────────
type Tone = "neutral" | "up" | "down" | "warn" | "accent";
const STATUS_TONE: Record<RunStatus, Tone> = {
  queued: "neutral",
  awaiting_approval: "warn",
  approved: "accent",
  running: "accent",
  done: "up",
  failed: "down",
  rejected: "neutral",
};
const STATUS_LABEL: Record<RunStatus, string> = {
  queued: "Queued",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  running: "Running",
  done: "Done",
  failed: "Failed",
  rejected: "Rejected",
};
function toneVar(t: Tone): string {
  return t === "neutral" ? "var(--text-3)" : `var(--${t})`;
}

// ── Status dot ────────────────────────────────────────────
function StatusDot({ status, reduce }: { status: RunStatus; reduce: boolean }) {
  const tone = STATUS_TONE[status];
  const color = toneVar(tone);
  const pulse = status === "running" && !reduce;
  return (
    <span className="relative flex w-1.5 h-1.5 shrink-0">
      {pulse && (
        <span
          className="absolute inline-flex h-full w-full rounded-full animate-ping"
          style={{ background: `color-mix(in srgb, ${color} 60%, transparent)` }}
        />
      )}
      <span
        className="relative inline-flex w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
    </span>
  );
}

// ── Usage strip ───────────────────────────────────────────
function UsageStrip({ cost }: { cost: Cost | null }) {
  const byModel = cost?.byModel ?? [];
  const byPlatform = cost?.byPlatform ?? [];
  const overview = cost?.overview ?? {};
  const hasAny =
    !!cost &&
    (cost.totalCost != null ||
      cost.totalTokens != null ||
      byModel.length > 0 ||
      !!cost.period ||
      !!cost.summary);

  if (!hasAny) {
    return (
      <Panel className="p-5">
        <p className="text-[13px] text-[var(--text-3)] flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5" />
          Usage syncing from Swarm…
        </p>
      </Panel>
    );
  }

  const maxModel = byModel.reduce(
    (mx, m) => Math.max(mx, m.tokens ?? m.cost ?? m.sessions ?? 0),
    0
  ) || 1;
  const maxPlat = byPlatform.reduce(
    (mx, p) => Math.max(mx, p.tokens ?? p.messages ?? p.sessions ?? 0),
    0
  ) || 1;

  return (
    <Panel className="p-5">
      {/* headline stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <Eyebrow>Total cost</Eyebrow>
          <div className="num font-semibold text-[24px] tracking-[-0.02em] text-[var(--text)] leading-none mt-2">
            {cost?.totalCost != null ? fmtUsd(cost.totalCost) : "—"}
          </div>
          {cost?.unknownSessions ? (
            <div className="num text-[10.5px] text-[var(--text-3)] mt-1">
              {cost.unknownSessions} session(s) unpriced
            </div>
          ) : null}
        </div>
        <div>
          <Eyebrow>Total tokens</Eyebrow>
          <div className="num font-semibold text-[24px] tracking-[-0.02em] text-[var(--text)] leading-none mt-2">
            {cost?.totalTokens != null ? fmtTokens(cost.totalTokens) : "—"}
          </div>
          {overview.inputTokens != null || overview.outputTokens != null ? (
            <div className="num text-[10.5px] text-[var(--text-3)] mt-1">
              {overview.inputTokens != null ? `${fmtTokens(overview.inputTokens)} in` : ""}
              {overview.outputTokens != null
                ? `${overview.inputTokens != null ? " · " : ""}${fmtTokens(overview.outputTokens)} out`
                : ""}
            </div>
          ) : null}
        </div>
        <div>
          <Eyebrow>Sessions</Eyebrow>
          <div className="num font-semibold text-[24px] tracking-[-0.02em] text-[var(--text)] leading-none mt-2">
            {overview.sessions != null ? overview.sessions.toLocaleString("en-US") : "—"}
          </div>
          {overview.toolCalls != null ? (
            <div className="num text-[10.5px] text-[var(--text-3)] mt-1">
              {overview.toolCalls.toLocaleString("en-US")} tool calls
            </div>
          ) : null}
        </div>
        <div>
          <Eyebrow>Synced</Eyebrow>
          <div className="num text-[13px] text-[var(--text-2)] mt-2.5">
            {timeAgo(cost?.syncedAt ?? null)}
          </div>
          {cost?.period ? (
            <div className="num text-[10.5px] text-[var(--text-3)] mt-1 truncate">{cost.period}</div>
          ) : null}
        </div>
      </div>

      {/* per-model bars */}
      {byModel.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[var(--line)] flex flex-col gap-2.5">
          <Eyebrow>By model</Eyebrow>
          {byModel.map((m) => {
            const val = m.tokens ?? m.cost ?? m.sessions ?? 0;
            const pct = Math.max(3, Math.round((val / maxModel) * 100));
            return (
              <div key={m.model} className="flex items-center gap-3">
                <span className="text-[12px] text-[var(--text-2)] w-40 shrink-0 truncate">
                  {m.model}
                </span>
                <div className="flex-1 h-[6px] rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: "color-mix(in srgb, var(--accent) 70%, transparent)",
                    }}
                  />
                </div>
                <span className="num text-[11px] text-[var(--text-3)] shrink-0 w-28 text-right">
                  {m.tokens != null
                    ? `${fmtTokens(m.tokens)} tok`
                    : m.cost != null
                      ? fmtUsd(m.cost)
                      : m.sessions != null
                        ? `${m.sessions} sess`
                        : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* per-platform bars */}
      {byPlatform.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[var(--line)] flex flex-col gap-2.5">
          <Eyebrow>By platform</Eyebrow>
          {byPlatform.map((p) => {
            const val = p.tokens ?? p.messages ?? p.sessions ?? 0;
            const pct = Math.max(3, Math.round((val / maxPlat) * 100));
            return (
              <div key={p.platform} className="flex items-center gap-3">
                <span className="text-[12px] text-[var(--text-2)] w-40 shrink-0 truncate">
                  {p.platform}
                </span>
                <div className="flex-1 h-[6px] rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: "color-mix(in srgb, var(--up) 55%, transparent)",
                    }}
                  />
                </div>
                <span className="num text-[11px] text-[var(--text-3)] shrink-0 w-28 text-right">
                  {p.tokens != null
                    ? `${fmtTokens(p.tokens)} tok`
                    : p.messages != null
                      ? `${p.messages} msgs`
                      : p.sessions != null
                        ? `${p.sessions} sess`
                        : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* raw report — collapsed by default */}
      {cost?.summary ? (
        <details className="mt-5 pt-4 border-t border-[var(--line)] group">
          <summary className="cursor-pointer select-none text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors">
            Raw report
          </summary>
          <pre className="mt-3 text-[11.5px] leading-relaxed whitespace-pre-wrap font-mono text-[var(--text-3)] bg-[var(--surface-2)] rounded-[8px] border border-[var(--line)] p-3 overflow-x-auto">
            {cost.summary}
          </pre>
        </details>
      ) : null}
    </Panel>
  );
}

// ── Run row ───────────────────────────────────────────────
function RunRow({ run, reduce }: { run: Req; reduce: boolean }) {
  const [open, setOpen] = useState(false);
  const tone = STATUS_TONE[run.status];
  const body = run.error || run.result;
  const canExpand = !!body;
  const dur = duration(run.startedAt, run.finishedAt);

  return (
    <div className="px-3.5 py-3">
      <button
        type="button"
        onClick={() => canExpand && setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 text-left ${
          canExpand ? "cursor-pointer" : "cursor-default"
        }`}
        aria-expanded={canExpand ? open : undefined}
      >
        <StatusDot status={run.status} reduce={reduce} />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] text-[var(--text)] leading-snug truncate">
            {run.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-[var(--text-3)] truncate">{run.kind}</span>
            <Pill tone={tone} className="!py-0.5 !text-[10px]">
              {STATUS_LABEL[run.status]}
            </Pill>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-4 text-right">
          <div>
            <div className="num text-[12px] text-[var(--text-2)]">{dur}</div>
            <div className="num text-[10.5px] text-[var(--text-3)] mt-0.5">
              {timeAgo(run.finishedAt || run.startedAt || run.createdAt)}
            </div>
          </div>
          {canExpand && (
            <ChevronRight
              className="w-3.5 h-3.5 text-[var(--text-3)] transition-transform"
              style={{ transform: open ? "rotate(90deg)" : "none" }}
            />
          )}
        </div>
      </button>
      {open && body && (
        <p
          className="mt-3 ml-[18px] text-[12.5px] leading-snug whitespace-pre-wrap rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-3"
          style={{ color: run.error ? "var(--down)" : "var(--text-2)" }}
        >
          {body}
        </p>
      )}
    </div>
  );
}

// ── Run history ───────────────────────────────────────────
type Filter = "all" | "running" | "done" | "failed";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "running", label: "running" },
  { key: "done", label: "done" },
  { key: "failed", label: "failed" },
];

function RunHistory({
  runs,
  loaded,
  reduce,
}: {
  runs: Req[];
  loaded: boolean;
  reduce: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = filter === "all" ? runs : runs.filter((r) => r.status === filter);

  // paging 10 baris/halaman (lazy render) — reset saat ganti filter saja
  // (data runs di-poll tiap 8s; reset pada data akan menendang user ke halaman 1)
  const paged = usePaged(shown);
  useEffect(() => {
    paged.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const count = (f: Filter) =>
    f === "all" ? runs.length : runs.filter((r) => r.status === f).length;

  return (
    <>
      <SectionHeader
        label="Run history"
        title="Recent runs"
        action={
          <div className="flex items-center gap-1 rounded-lg border border-[var(--line)] p-0.5">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-[var(--surface-2)] text-[var(--text)]"
                      : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                  }`}
                >
                  {f.label}
                  <span className="num text-[var(--text-3)] ml-1">{count(f.key)}</span>
                </button>
              );
            })}
          </div>
        }
      />
      {!loaded ? (
        <Panel className="p-2">
          <div className="sk h-40 m-1 rounded-[10px]" />
        </Panel>
      ) : shown.length === 0 ? (
        <Panel className="p-2">
          <EmptyState
            icon={<Activity className="w-6 h-6" />}
            title={filter === "all" ? "No runs yet" : `No ${filter} runs`}
            hint="Runs dispatched to Swarm will show up here with duration and results."
          />
        </Panel>
      ) : (
        <Panel className="p-2">
          <div className="divide-y divide-[var(--line)]">
            {paged.slice.map((r) => (
              <RunRow key={r.id} run={r} reduce={reduce} />
            ))}
          </div>
          <PagedBar p={paged} className="!border-t-0 mt-1" />
        </Panel>
      )}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────
export function BrahmaRuns() {
  const [runs, setRuns] = useState<Req[]>([]);
  const [cost, setCost] = useState<Cost | null>(null);
  const [loaded, setLoaded] = useState(false);
  const reduce = usePrefersReducedMotion();
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const [reqs, c] = await Promise.all([
      getJSON<{ requests: Req[]; pending: number }>("/api/brahma/requests?take=60"),
      getJSON<Cost>("/api/brahma/cost"),
    ]);
    if (!mounted.current) return;
    if (reqs) setRuns(reqs.requests ?? []);
    if (c) setCost(c);
    setLoaded(true);
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    const iv = setInterval(load, 8000);
    return () => {
      mounted.current = false;
      clearInterval(iv);
    };
  }, [load]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Eyebrow>Observability</Eyebrow>
        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] leading-none text-[var(--text)]">
          Runs &amp; usage
        </h2>
      </div>

      <UsageStrip cost={cost} />

      <div>
        <RunHistory runs={runs} loaded={loaded} reduce={reduce} />
      </div>
    </div>
  );
}

"use client";

/**
 * Editor parameter yang DIHASILKAN DARI REGISTRI (`/api/studio/registry?kind=params`):
 * dikelompokkan per bab manual lalu namespace, kontrol sesuai tipe, kelas
 * B/K/T dengan alasan terkunci, nilai induk vs override, reset per kunci.
 * Baris hanya dirender untuk kelompok yang terbuka atau hasil pencarian.
 */
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Filter, Lock, RotateCcw, Search, X } from "lucide-react";
import type { StudioTier } from "@/lib/studio/contract/enums";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { ParamDef } from "@/lib/studio/contract/types/params";
import { Pill } from "@/components/ui/kit";
import { expandParamRef } from "./param-ref";
import { ParamControl, ReadonlyValue } from "./param-control";
import { lockOf } from "./param-rules";
import { ClassBadge, inputCls } from "./shared";
import { namespaceLabel, paramDisplayLabel } from "./param-labels";
import { formatValue, groupParams, hasOwn, unitOf, valuesEqual, type ParamRecord } from "./values";

const SEARCH_LIMIT = 150;

export interface ParamEditorProps {
  registry: readonly ParamDef[];
  /** Nilai induk per kunci (profil dasar ter-resolusi, atau default registri). */
  parentValues: ParamRecord;
  parentLabel: string;
  /** Lapisan override milik versi yang dimuat. */
  loaded: ParamRecord;
  /** `resolvedParams` versi yang dimuat (nilai kelas T terhitung). */
  computed: ParamRecord;
  draft: ParamRecord;
  errors: Readonly<Record<string, string>>;
  isAdmin: boolean;
  tier: StudioTier | undefined;
  /** Kunci remount kontrol per parameter (naik saat reset/buang). */
  controlEpoch: Readonly<Record<string, number>>;
  onSet: (key: string, v: ParamValue) => void;
  onReset: (key: string) => void;
  onInvalid: (key: string, message: string | null) => void;
  /**
   * Rujukan parameter awal dari `?paramFilter=` (tautan penyusun section S59):
   * rentang/ID registri (`P4V-01..16`, `P4T-S01`), kunci/namespace
   * (`toc.levels`), atau teks bebas (dicocokkan ke label/kunci).
   */
  refFilter?: readonly string[];
}

type ClassFilter = "all" | "B" | "K" | "T";

export function ParamEditor(p: ParamEditorProps) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<ClassFilter>("all");
  const [onlyOverridden, setOnlyOverridden] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const [refs, setRefs] = useState<readonly string[]>(() => p.refFilter ?? []);

  const refMatchers = useMemo(() => refs.map((r) => refMatcher(r, p.registry)), [refs, p.registry]);

  const removeRef = (ref: string | null) => {
    const next = ref === null ? [] : refs.filter((r) => r !== ref);
    setRefs(next);
    syncParamFilterUrl(next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return p.registry.filter((d) => {
      if (refMatchers.length > 0 && !refMatchers.some((m) => m.matches(d))) return false;
      if (classFilter !== "all" && d.class !== classFilter) return false;
      if (onlyOverridden && !hasOwn(p.draft, d.key) && !hasOwn(p.loaded, d.key)) return false;
      if (!showInactive && d.inactive) return false;
      if (!q) return true;
      return (
        d.key.toLowerCase().includes(q) ||
        d.label.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.ruleRef.toLowerCase().includes(q)
      );
    });
  }, [p.registry, p.draft, p.loaded, query, classFilter, onlyOverridden, showInactive, refMatchers]);

  const searching = query.trim().length > 0 || onlyOverridden || refMatchers.length > 0;
  // Saat mencari, semua kelompok terbuka: batasi baris yang dirender.
  const groups = useMemo(() => groupParams(searching ? filtered.slice(0, SEARCH_LIMIT) : filtered), [filtered, searching]);
  const counts = useMemo(() => {
    const c = { B: 0, K: 0, T: 0 };
    for (const d of p.registry) c[d.class] += 1;
    return c;
  }, [p.registry]);

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div>
      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Cari parameter</span>
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-3)]" aria-hidden />
          <input
            type="search"
            className={`${inputCls} !pl-8`}
            placeholder="Cari kunci, label, ID, atau aturan (mis. grid.textColumnMm, DT-10)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          className={`${inputCls} md:w-48`}
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value as ClassFilter)}
          aria-label="Saring kelas parameter"
        >
          <option value="all">Semua kelas ({p.registry.length})</option>
          <option value="B">Bebas diubah ({counts.B})</option>
          <option value="K">Standar DATUM, admin ({counts.K})</option>
          <option value="T">Dihitung otomatis ({counts.T})</option>
        </select>
        <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-[var(--text-2)]">
          <label className="inline-flex items-center gap-1.5">
            <input type="checkbox" checked={onlyOverridden} onChange={(e) => setOnlyOverridden(e.target.checked)} /> Hanya yang diubah di templat ini
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Tampilkan nonaktif
          </label>
        </div>
      </div>
      {refMatchers.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Saringan rujukan parameter dari penyusun section">
          <span className="inline-flex items-center gap-1 text-[12px] text-[var(--text-2)]">
            <Filter className="h-3.5 w-3.5" aria-hidden /> Rujukan section:
          </span>
          {refMatchers.map((m) => (
            <span
              key={m.ref}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)] bg-[var(--surface-1)] py-0.5 pl-2.5 pr-1 text-[12px] text-[var(--text)]"
            >
              <span className="font-mono">{m.ref}</span>
              <span className="text-[var(--text-3)]">({m.count})</span>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-3)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                onClick={() => removeRef(m.ref)}
                aria-label={`Hapus saringan ${m.ref}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
          {refMatchers.length > 1 && (
            <button type="button" className="text-[12px] text-[var(--accent)] hover:underline" onClick={() => removeRef(null)}>
              Hapus semua
            </button>
          )}
        </div>
      )}
      <p className="mb-3 text-[12px] text-[var(--text-3)]">
        {filtered.length} dari {p.registry.length} parameter · induk: <span className="font-medium text-[var(--text-2)]">{p.parentLabel}</span>
        {!p.isAdmin && " · kelas K terkunci (bukan sesi ADMINISTRATOR)"}
      </p>

      {groups.length === 0 && <p className="py-8 text-center text-[13px] text-[var(--text-3)]">Tidak ada parameter yang cocok dengan saringan.</p>}

      <div className="space-y-2">
        {groups.map((g) => {
          const chapterId = `ch:${g.chapter}`;
          const chapterOpen = searching || open.has(chapterId);
          const total = g.namespaces.reduce((n, ns) => n + ns.defs.length, 0);
          const changed = g.namespaces.reduce((n, ns) => n + ns.defs.filter((d) => isChanged(d.key, p.draft, p.loaded)).length, 0);
          return (
            <section key={g.chapter} className="rounded-xl border border-[var(--line)]">
              <h3>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                  aria-expanded={chapterOpen}
                  onClick={() => toggle(chapterId)}
                  disabled={searching}
                >
                  <span className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--text)]">
                    {chapterOpen ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
                    {g.chapter}
                  </span>
                  <span className="flex items-center gap-2 text-[12px] text-[var(--text-3)]">
                    {changed > 0 && <Pill tone="accent">{changed} diubah</Pill>}
                    {total} pengaturan · {g.namespaces.length} kelompok
                  </span>
                </button>
              </h3>
              {chapterOpen && (
                <div className="space-y-1 border-t border-[var(--line)] px-2 py-2">
                  {g.namespaces.map((ns) => {
                    const nsId = `ns:${g.chapter}:${ns.namespace}`;
                    const nsOpen = searching || open.has(nsId);
                    return (
                      <div key={ns.namespace} className="rounded-lg">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] text-[var(--text-2)] hover:bg-[var(--surface-1)]"
                          aria-expanded={nsOpen}
                          onClick={() => toggle(nsId)}
                          disabled={searching}
                        >
                          {nsOpen ? <ChevronDown className="h-3.5 w-3.5" aria-hidden /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
                          <span title={ns.namespace}>{namespaceLabel(ns.namespace)}</span>
                          <span className="text-[var(--text-3)]">({ns.defs.length})</span>
                        </button>
                        {nsOpen && (
                          <ul className="divide-y divide-[var(--line)]">
                            {ns.defs.map((d) => (
                              <ParamRow key={d.key} def={d} {...p} />
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {searching && filtered.length > SEARCH_LIMIT && (
        <p className="mt-3 text-[12px] text-[var(--warn)]">
          Menampilkan {SEARCH_LIMIT} hasil pertama dari {filtered.length}; persempit pencarian.
        </p>
      )}
    </div>
  );
}

interface RefMatcher {
  ref: string;
  /** Jumlah parameter registri yang cocok. */
  count: number;
  matches: (d: ParamDef) => boolean;
}

/** Rujukan -> pencocok: ID/rentang/kunci lewat `expandParamRef` (S59); teks bebas ke label/kunci. */
function refMatcher(ref: string, registry: readonly ParamDef[]): RefMatcher {
  const info = expandParamRef(ref, registry);
  let matches: (d: ParamDef) => boolean;
  if (info.kind === "text") {
    const q = info.ref.toLowerCase();
    matches = (d) => d.label.toLowerCase().includes(q) || d.key.toLowerCase().includes(q);
  } else {
    const ids = new Set(info.ids);
    matches = (d) => ids.has(d.id);
  }
  return { ref: info.ref, count: registry.reduce((n, d) => n + (matches(d) ? 1 : 0), 0), matches };
}

/** Selaraskan `?paramFilter=` di URL tanpa navigasi (tautan tetap dapat dibagikan/dimuat ulang). */
function syncParamFilterUrl(refs: readonly string[]): void {
  try {
    const url = new URL(window.location.href);
    if (refs.length > 0) url.searchParams.set("paramFilter", refs.join(","));
    else url.searchParams.delete("paramFilter");
    window.history.replaceState(window.history.state, "", url);
  } catch {
    /* URL tidak dapat diperbarui; saringan lokal tetap berlaku */
  }
}

function isChanged(key: string, draft: ParamRecord, loaded: ParamRecord): boolean {
  const a = hasOwn(draft, key);
  const b = hasOwn(loaded, key);
  return a !== b || (a && b && !valuesEqual(draft[key], loaded[key]));
}

function ParamRow({ def, ...p }: ParamEditorProps & { def: ParamDef }) {
  const overridden = hasOwn(p.draft, def.key);
  const parentValue = p.parentValues[def.key];
  const current: ParamValue | undefined = overridden ? p.draft[def.key] : parentValue;
  const lock = lockOf(def, current, p.isAdmin, p.tier);
  const changed = isChanged(def.key, p.draft, p.loaded);
  const error = p.errors[def.key];
  const domId = `param-${def.id.replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const labelId = `${domId}-label`;
  const descId = `${domId}-desc`;
  const isComputed = def.class === "T" && !lock.editable;

  return (
    <li className="px-2 py-2.5" data-invalid={error ? "true" : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div id={labelId} className="text-[13px] font-medium text-[var(--text)]">
            {paramDisplayLabel(def.key, def.label, unitOf(def.type))}
          </div>
          {/* UI-02 (L15, L18): identitas teknis + catatan kelas pindah ke Info teknis per baris. */}
          <details className="mt-0.5 text-[11.5px] text-[var(--text-3)]">
            <summary className="cursor-pointer select-none">Info teknis</summary>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono">{def.key}</span>
              <span>· {def.id}</span>
              {def.ruleRef && def.ruleRef !== "-" && <span>· {def.ruleRef}</span>}
            </div>
            {def.classNote && <div className="mt-0.5">Catatan: {def.classNote}</div>}
          </details>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ClassBadge cls={lock.cls} />
          {overridden && <Pill tone="accent">diubah di templat</Pill>}
          {changed && <Pill tone="warn">diubah</Pill>}
          {def.inactive && <Pill>nonaktif</Pill>}
          {def.rek && <Pill>Rekomendasi</Pill>}
          {def.unreadable && <Pill tone="down">tak terbaca</Pill>}
          {def.conflictRef && <Pill tone="warn">Bertentangan dengan aturan {def.conflictRef}</Pill>}
        </div>
      </div>

      <div className="mt-2">
        {isComputed ? (
          <ReadonlyValue def={def} value={p.computed[def.key]} />
        ) : lock.editable ? (
          <ParamControl
            key={`${def.key}:${p.controlEpoch[def.key] ?? 0}`}
            def={def}
            value={current ?? null}
            disabled={false}
            labelId={labelId}
            describedBy={descId}
            onChange={(v) => p.onSet(def.key, v)}
            onInvalid={(m) => p.onInvalid(def.key, m)}
          />
        ) : (
          <ReadonlyValue def={def} value={current} />
        )}
      </div>

      <div id={descId} className="mt-1.5 space-y-0.5 text-[11.5px]">
        {!isComputed && (
          <div className="flex flex-wrap items-center gap-2 text-[var(--text-3)]">
            <span>
              Nilai gaya: <span className="font-mono text-[var(--text-2)]">{formatValue(parentValue)}</span>
            </span>
            {overridden && lock.editable && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[var(--accent)] hover:bg-[var(--surface-1)]"
                onClick={() => p.onReset(def.key)}
                aria-label={`Kembalikan ${paramDisplayLabel(def.key, def.label, unitOf(def.type))} ke nilai gaya`}
              >
                <RotateCcw className="h-3 w-3" aria-hidden /> Kembalikan ke nilai gaya
              </button>
            )}
          </div>
        )}
        {lock.reason && (
          <div className={`flex items-center gap-1 ${lock.editable ? "text-[var(--text-3)]" : "text-[var(--warn)]"}`}>
            {!lock.editable && <Lock className="h-3 w-3" aria-hidden />}
            {lock.reason}
          </div>
        )}
        {error && (
          <div role="alert" className="text-[var(--down)]">
            {error}
          </div>
        )}
      </div>
    </li>
  );
}

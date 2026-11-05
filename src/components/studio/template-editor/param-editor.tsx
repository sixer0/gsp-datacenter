"use client";

/**
 * Editor parameter yang DIHASILKAN DARI REGISTRI (`/api/studio/registry?kind=params`):
 * dikelompokkan per kategori lalu subkelompok namespace (U03, D-626/D-627/D-630;
 * `./param-categories`), kontrol sesuai tipe, kelas
 * B/K/T dengan alasan terkunci, nilai induk vs override, reset per kunci.
 * Baris hanya dirender untuk kelompok yang terbuka atau hasil pencarian.
 *
 * Tata letak D-632: satu baris toolbar lengket (cari, Hanya yang diubah, Saringan lain,
 * Buka/Tutup semua); saringan kelas dan nonaktif di balik "Saringan lain". Akordeon
 * kategori adalah satu-satunya navigasi (chip dihapus atas umpan balik USER: dobel dengan
 * akordeon): chevron, deskripsi satu baris, jumlah, lencana "n diubah". Kategori tertutup
 * kecuali yang punya perubahan; kategori kecil tampil datar tanpa subkelompok
 * (`showSubgroups`). Logika murni tata letak ada di `./param-editor-state`.
 */
import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Filter, Lock, RotateCcw, Search, SearchX, X } from "lucide-react";
import type { StudioTier } from "@/lib/studio/contract/enums";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { ParamDef } from "@/lib/studio/contract/types/params";
import { Button, EmptyState, Pill } from "@/components/ui/kit";
import { expandParamRef } from "./param-ref";
import { ParamControl, ReadonlyValue } from "./param-control";
import { lockOf } from "./param-rules";
import { ClassBadge, inputCls } from "./shared";
import { groupByCategory, type ParamCategory } from "./param-categories";
import { allCategoriesOpen, defaultOpenIds, extraFilterCount, highlightParts, resultSummary, setAllCategoriesOpen } from "./param-editor-state";
import { paramDisplayLabel } from "./param-labels";
import { formatValue, hasOwn, unitOf, valuesEqual, type ParamRecord } from "./values";

const SEARCH_LIMIT = 150;
const NO_OPEN: ReadonlySet<string> = new Set();

/** Id DOM unik per instans editor (`useId`) untuk bagian/tombol/panel kategori. */
function domIdOf(uid: string, id: string, part: string): string {
  return `${uid}-${id.replace(/[^A-Za-z0-9_-]/g, "_")}-${part}`;
}

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
  /** Tingkat judul kategori: 3 (bawaan, di bawah h2 panel) atau 2 (mode gaya, langsung di bawah h1). */
  headingLevel?: 2 | 3;
}

export type ClassFilter = "all" | "B" | "K" | "T";

export function ParamEditor(p: ParamEditorProps) {
  const uid = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<ClassFilter>("all");
  const [onlyOverridden, setOnlyOverridden] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [moreFilters, setMoreFilters] = useState(false);
  // Status buka hidup selama komponen terpasang (sama seperti sebelumnya); awalnya hanya
  // kategori yang punya perubahan belum tersimpan yang terbuka.
  const [open, setOpen] = useState<ReadonlySet<string>>(() =>
    defaultOpenIds(paramEditorView(p.registry, { searching: false, open: NO_OPEN, draft: p.draft, loaded: p.loaded })),
  );
  const [refs, setRefs] = useState<readonly string[]>(() => p.refFilter ?? []);

  const refMatchers = useMemo(() => refs.map((r) => refMatcher(r, p.registry)), [refs, p.registry]);

  const removeRef = (ref: string | null) => {
    const next = ref === null ? [] : refs.filter((r) => r !== ref);
    setRefs(next);
    syncParamFilterUrl(next);
  };

  const filtered = useMemo(
    () => filterParamDefs(p.registry, { query, classFilter, onlyOverridden, showInactive, refMatchers, draft: p.draft, loaded: p.loaded }),
    [p.registry, p.draft, p.loaded, query, classFilter, onlyOverridden, showInactive, refMatchers],
  );

  const searching = query.trim().length > 0 || onlyOverridden || refMatchers.length > 0;
  // Saat mencari, semua kelompok terbuka: batasi baris yang dirender.
  const groups = useMemo(
    () => paramEditorView(searching ? filtered.slice(0, SEARCH_LIMIT) : filtered, { searching, open, draft: p.draft, loaded: p.loaded }),
    [filtered, searching, open, p.draft, p.loaded],
  );
  const allOpen = allCategoriesOpen(groups);
  const counts = useMemo(() => {
    const c = { B: 0, K: 0, T: 0 };
    for (const d of p.registry) c[d.class] += 1;
    return c;
  }, [p.registry]);
  // Kunci nonaktif hanya ada di registri lengkap (mode gaya); di permukaan lanjutan kotak
  // centang "Tampilkan yang nonaktif" tidak berarti apa-apa sehingga tidak ditawarkan.
  const hasInactive = useMemo(() => p.registry.some((d) => d.inactive), [p.registry]);
  const extraActive = extraFilterCount({ classFilter, showInactive });
  const filtersActive = searching || extraActive > 0;

  const domId = (id: string, part: string) => domIdOf(uid, id, part);

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const clearSearch = () => {
    setQuery("");
    setClassFilter("all");
    setOnlyOverridden(false);
    setShowInactive(true);
    if (refs.length > 0) removeRef(null);
    searchRef.current?.focus();
  };

  const Heading = p.headingLevel === 2 ? "h2" : "h3";
  const highlight = query.trim();

  return (
    <div>
      <div className="top-16 z-20 mb-3 rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-2 sm:sticky md:top-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label className="relative block min-w-0 flex-[1_1_16rem]">
            <span className="sr-only">Cari pengaturan</span>
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-3)]" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              className={`${inputCls} !pl-8`}
              placeholder="Cari nama pengaturan, kunci, atau aturan (mis. margin, DT-10)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-2)]">
            <input type="checkbox" checked={onlyOverridden} onChange={(e) => setOnlyOverridden(e.target.checked)} /> Hanya yang diubah
          </label>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              aria-expanded={moreFilters}
              aria-controls={domId("filters", "panel")}
              onClick={() => setMoreFilters((v) => !v)}
            >
              Saringan lain
              {extraActive > 0 && <Pill tone="accent" className="!px-1.5 !py-0">{extraActive}</Pill>}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 motion-reduce:transition-none ${moreFilters ? "rotate-180" : ""}`} aria-hidden />
            </button>
            <Button size="sm" disabled={searching || groups.length === 0} onClick={() => setOpen((s) => setAllCategoriesOpen(groups, s, !allOpen))}>
              {allOpen ? "Tutup semua" : "Buka semua"}
            </Button>
          </div>
        </div>
        <div id={domId("filters", "panel")} hidden={!moreFilters} className="mt-2 border-t border-[var(--line)] pt-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-[var(--text-2)]">
            <select
              className={`${inputCls} sm:w-auto`}
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as ClassFilter)}
              aria-label="Saring jenis pengaturan"
            >
              <option value="all">Semua pengaturan ({p.registry.length})</option>
              <option value="B">Bebas diubah ({counts.B})</option>
              <option value="K">Standar DATUM, khusus admin ({counts.K})</option>
              <option value="T">Dihitung otomatis ({counts.T})</option>
            </select>
            {hasInactive && (
              <label className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Tampilkan yang nonaktif
              </label>
            )}
          </div>
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
      <p className="mb-3 text-[12px] text-[var(--text-3)]" aria-live="polite">
        {resultSummary(filtered.length, p.registry.length)} · nilai asal: <span className="font-medium text-[var(--text-2)]">{p.parentLabel}</span>
        {!p.isAdmin && " · pengaturan Standar DATUM hanya dapat diubah admin"}
      </p>

      {groups.length === 0 && (
        <EmptyState
          className="rounded-xl border border-dashed border-[var(--line)] !py-10"
          icon={<SearchX className="h-6 w-6" aria-hidden />}
          title="Tidak ada pengaturan yang cocok"
          hint="Coba kata lain, atau hapus pencarian dan saringan untuk melihat semua pengaturan."
          action={
            filtersActive ? (
              <Button size="sm" onClick={clearSearch}>
                Hapus pencarian
              </Button>
            ) : undefined
          }
        />
      )}

      <div className="space-y-2">
        {groups.map((g) => {
          const titleId = domId(g.id, "title");
          const metaId = domId(g.id, "meta");
          const descId = domId(g.id, "desc");
          const panelId = domId(g.id, "panel");
          return (
            <section key={g.id} aria-labelledby={titleId} className="rounded-xl border border-[var(--line)]">
              <Heading className="m-0">
                <button
                  type="button"
                  className="flex w-full items-start gap-2.5 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--surface-2)] disabled:cursor-default disabled:hover:bg-transparent motion-reduce:transition-none"
                  aria-expanded={g.open}
                  aria-controls={panelId}
                  aria-labelledby={`${titleId} ${metaId}`}
                  aria-describedby={descId}
                  data-category={g.category.id}
                  onClick={() => toggle(g.id)}
                  disabled={searching}
                >
                  <ChevronRight
                    className={`mt-0.5 h-4 w-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${g.open ? "rotate-90 text-[var(--accent)]" : "text-[var(--text-2)]"}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span id={titleId} className="block text-[13.5px] font-semibold text-[var(--text)]">
                      {g.category.label}
                    </span>
                    <span id={descId} className="mt-0.5 block text-[12px] font-normal leading-snug text-[var(--text-2)]">
                      {g.category.help}
                    </span>
                  </span>
                  <span id={metaId} className="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 pt-0.5 text-[12px] font-normal text-[var(--text-3)]">
                    <span>{g.total} pengaturan</span>
                    {g.changed > 0 && <Pill tone="accent">{g.changed} diubah</Pill>}
                  </span>
                </button>
              </Heading>
              <div id={panelId} hidden={!g.open} className="border-t border-[var(--line)] px-2 py-2">
                {g.open &&
                  (g.flat ? (
                    <ul className="divide-y divide-[var(--line)]">
                      {g.subgroups.flatMap((ns) => ns.defs.map((d) => <ParamRow key={d.key} def={d} highlight={highlight} {...p} />))}
                    </ul>
                  ) : (
                    <div className="space-y-1">
                      {g.subgroups.map((ns) => {
                        const listId = domId(ns.id, "list");
                        return (
                          <div key={ns.id}>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12.5px] text-[var(--text-2)] hover:bg-[var(--surface-2)] disabled:cursor-default disabled:hover:bg-transparent"
                              aria-expanded={ns.open}
                              aria-controls={listId}
                              data-subgroup={ns.key}
                              onClick={() => toggle(ns.id)}
                              disabled={searching}
                            >
                              <ChevronRight
                                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${ns.open ? "rotate-90" : ""}`}
                                aria-hidden
                              />
                              <span title={ns.key} className="font-medium text-[var(--text)]">
                                {ns.label}
                              </span>
                              <span className="text-[var(--text-3)]">{ns.defs.length}</span>
                              {ns.changed > 0 && <span className="text-[var(--accent)]">· {ns.changed} diubah</span>}
                            </button>
                            <ul id={listId} hidden={!ns.open} className="divide-y divide-[var(--line)] pl-3">
                              {ns.open && ns.defs.map((d) => <ParamRow key={d.key} def={d} highlight={highlight} {...p} />)}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
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

export interface ParamFilterState {
  query: string;
  classFilter: ClassFilter;
  onlyOverridden: boolean;
  showInactive: boolean;
  refMatchers: readonly Pick<RefMatcher, "matches">[];
  draft: ParamRecord;
  loaded: ParamRecord;
}

/** Saringan murni editor: rujukan section, kelas, hanya-diubah, nonaktif, lalu teks cari. */
export function filterParamDefs(registry: readonly ParamDef[], f: ParamFilterState): ParamDef[] {
  const q = f.query.trim().toLowerCase();
  return registry.filter((d) => {
    if (f.refMatchers.length > 0 && !f.refMatchers.some((m) => m.matches(d))) return false;
    if (f.classFilter !== "all" && d.class !== f.classFilter) return false;
    if (f.onlyOverridden && !hasOwn(f.draft, d.key) && !hasOwn(f.loaded, d.key)) return false;
    if (!f.showInactive && d.inactive) return false;
    if (!q) return true;
    return (
      d.key.toLowerCase().includes(q) ||
      d.label.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.ruleRef.toLowerCase().includes(q)
    );
  });
}

export interface ParamSubgroupView {
  /** `ns:<categoryId>:<subkelompok>`. */
  id: string;
  key: string;
  label: string;
  open: boolean;
  /** Jumlah "diubah" (draf vs versi dimuat) di subkelompok ini. */
  changed: number;
  defs: ParamDef[];
}

export interface ParamCategoryView {
  /** `cat:<categoryId>`. */
  id: string;
  category: ParamCategory;
  open: boolean;
  total: number;
  changed: number;
  /** Tampil datar tanpa tingkat subkelompok (`showSubgroups`, D-632). */
  flat: boolean;
  subgroups: ParamSubgroupView[];
}

/**
 * View-model kelompok: kategori -> subkelompok (`groupByCategory`), status buka (mode cari
 * membuka semua), hitungan "n diubah" per kategori dan subkelompok, dan tanda `flat`
 * (kategori kecil tanpa tingkat subkelompok). Kategori kosong tidak muncul.
 */
export function paramEditorView(
  defs: readonly ParamDef[],
  s: { searching: boolean; open: ReadonlySet<string>; draft: ParamRecord; loaded: ParamRecord },
): ParamCategoryView[] {
  return groupByCategory(defs).map((g) => {
    const subgroups = g.subgroups.map((sg) => ({
      id: sg.id,
      key: sg.key,
      label: sg.label,
      open: s.searching || s.open.has(sg.id),
      changed: sg.defs.filter((d) => isChanged(d.key, s.draft, s.loaded)).length,
      defs: sg.defs,
    }));
    return {
      id: g.id,
      category: g.category,
      open: s.searching || s.open.has(g.id),
      total: g.total,
      changed: subgroups.reduce((n, sg) => n + sg.changed, 0),
      flat: g.flat,
      subgroups,
    };
  });
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

/** Label dengan kata cari disorot (D-632). */
function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  return (
    <>
      {highlightParts(text, query).map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded-[3px] bg-[color-mix(in_srgb,var(--accent)_28%,transparent)] px-0.5 text-inherit">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function ParamRow({ def, highlight, ...p }: ParamEditorProps & { def: ParamDef; highlight: string }) {
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
            <Highlighted text={paramDisplayLabel(def.key, def.label, unitOf(def.type))} query={highlight} />
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
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[var(--text-3)]">
            <span className="min-w-0">
              Nilai gaya: <span className="font-mono text-[var(--text-2)]">{formatValue(parentValue)}</span>
            </span>
            {overridden && lock.editable && (
              <button
                type="button"
                className="ml-auto inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[var(--accent)] hover:bg-[var(--surface-2)]"
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

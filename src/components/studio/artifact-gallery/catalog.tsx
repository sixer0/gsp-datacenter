"use client";

/*
 * Katalog jenis artefak dari R03 (S62; FIX-4b: `useStudioQuery` + `ErrorView`
 * bersama, istilah kamus UX-01 §1.2): 58 grafik tergambar per
 * kelompok (P/H/K/W/S/G) dengan pakai/hindari dan bentuk data, 18 jenis
 * drawn=false bertanda beserta alternatif, 9 keluarga diagram, dan 41 simbol
 * per dialek. Tombol "Pakai" membuka tab Buat dengan jenis terpilih.
 */

import { useId, useState } from "react";
import { Ban, BarChart3, Search, Waypoints } from "lucide-react";
import type { DiagramFamily, SymbolDialect } from "@/lib/studio/contract/enums";
import type { ChartDef } from "@/lib/studio/contract/types/params";
import { Button, EmptyState, Panel, Pill, SectionHeader, Skeleton } from "@/components/ui/kit";
import { ErrorView } from "@/components/studio/shared/error-view";
import type { StudioQueryResult } from "@/components/studio/shared/use-studio-query";
import type { ChartRegistryResponse, DiagramRegistryResponse, SymbolRegistryResponse } from "./api";
import { inputCls } from "./gallery";
import {
  DIALECT_LABEL,
  FAMILY_HINT,
  FAMILY_LABEL,
  GROUP_LABEL,
  GROUP_ORDER,
  PURPOSE_LABEL,
  SHAPE_FIELDS,
  SHAPE_LABEL,
  labelOrKey,
  symbolName,
} from "./labels";

export type UseChoice = { kind: "CHART"; code: string } | { kind: "DIAGRAM"; family: DiagramFamily };

function QueryState<T>({ q, label }: { q: StudioQueryResult<T>; label: string }) {
  if (q.error && !q.data) {
    return <ErrorView error={q.error} title={`Katalog ${label} tidak dapat dimuat`} onRetry={() => q.retry()} cooldown={q.cooldown} />;
  }
  if (q.isLoading) return <Skeleton className="h-40 rounded-[16px]" />;
  return null;
}

function ChartCard({ def, byCode, onUse }: { def: ChartDef; byCode: Map<string, ChartDef>; onUse: (c: UseChoice) => void }) {
  const titleId = useId();
  return (
    <li>
      <Panel className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="eyebrow">
              {def.code} · Tabel {def.manualTable}
            </span>
            <h4 id={titleId} className="mt-0.5 text-[13.5px] font-medium text-[var(--text)]">
              {def.name}
            </h4>
          </div>
          {def.drawn ? (
            <Pill tone="up">Tergambar</Pill>
          ) : (
            <Pill tone="warn">
              <Ban className="h-3 w-3" aria-hidden /> Tidak digambar
            </Pill>
          )}
        </div>
        <p className="text-[12px] text-[var(--text-2)]">{def.fn}</p>
        <dl className="space-y-1 text-[12px]">
          <div>
            <dt className="inline text-[var(--up)]">Pakai: </dt>
            <dd className="inline text-[var(--text-2)]">{def.useWhen}</dd>
          </div>
          <div>
            <dt className="inline text-[var(--down)]">Hindari: </dt>
            <dd className="inline text-[var(--text-2)]">{def.avoidWhen}</dd>
          </div>
          {def.drawn && def.dataShape && (
            <div>
              <dt className="inline text-[var(--text-3)]">Bentuk data: </dt>
              <dd className="inline text-[var(--text-2)]">
                {SHAPE_LABEL[def.dataShape]} <code className="font-mono text-[11px] text-[var(--text-3)]">({SHAPE_FIELDS[def.dataShape]})</code>
              </dd>
            </div>
          )}
          {!def.drawn && (
            <div>
              <dt className="inline text-[var(--text-3)]">Alternatif: </dt>
              <dd className="inline">
                {(def.alternatives ?? []).length === 0
                  ? "-"
                  : (def.alternatives ?? []).map((alt, i) => (
                      <span key={alt}>
                        {i > 0 && ", "}
                        <button
                          type="button"
                          className="text-[var(--accent)] underline-offset-2 hover:underline"
                          onClick={() => onUse({ kind: "CHART", code: alt })}
                          aria-label={`Pakai alternatif ${alt} ${byCode.get(alt)?.name ?? ""}`}
                        >
                          {alt} {byCode.get(alt)?.name ?? ""}
                        </button>
                      </span>
                    ))}
              </dd>
            </div>
          )}
        </dl>
        {def.drawn && (
          <div className="mt-auto pt-1">
            <Button size="sm" onClick={() => onUse({ kind: "CHART", code: def.code })}>
              <BarChart3 className="h-3.5 w-3.5" aria-hidden /> Pakai {def.code}
            </Button>
          </div>
        )}
      </Panel>
    </li>
  );
}

function ChartCatalog({ q, onUse }: { q: StudioQueryResult<ChartRegistryResponse>; onUse: (c: UseChoice) => void }) {
  const [term, setTerm] = useState("");
  const [show, setShow] = useState<"all" | "drawn" | "undrawn">("all");
  const items = q.data?.items ?? [];
  const byCode = new Map(items.map((c) => [c.code, c]));
  const t = term.trim().toLowerCase();
  const filtered = items.filter(
    (c) =>
      (show === "all" || (show === "drawn" ? c.drawn : !c.drawn)) &&
      (!t || `${c.code} ${c.name} ${c.fn} ${c.useWhen} ${c.avoidWhen}`.toLowerCase().includes(t)),
  );
  const drawnCount = items.filter((c) => c.drawn).length;

  return (
    <section aria-labelledby="cat-chart" className="space-y-4">
      <SectionHeader
        label="Grafik"
        title={<span id="cat-chart">Jenis grafik</span>}
        action={
          q.data ? (
            <span className="text-[12px] text-[var(--text-3)]">
              {drawnCount} tergambar · {items.length - drawnCount} tidak digambar
            </span>
          ) : null
        }
      />
      <QueryState q={q} label="grafik" />
      {q.data && (
        <>
          <div className="panel grid grid-cols-1 gap-3 p-4 sm:grid-cols-3" role="search" aria-label="Cari jenis grafik">
            <div className="sm:col-span-2">
              <label htmlFor="cat-term" className="eyebrow mb-1 block">
                Cari
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-3)]" aria-hidden />
                <input
                  id="cat-term"
                  className={`${inputCls} pl-8`}
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Kode, nama, atau kegunaan (mis. P-01, tren, proporsi)"
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <label htmlFor="cat-show" className="eyebrow mb-1 block">
                Tampilkan
              </label>
              <select id="cat-show" className={inputCls} value={show} onChange={(e) => setShow(e.target.value as typeof show)}>
                <option value="all">Semua jenis</option>
                <option value="drawn">Hanya tergambar</option>
                <option value="undrawn">Hanya tidak digambar</option>
              </select>
            </div>
          </div>
          <p className="text-[12px] text-[var(--text-3)]" aria-live="polite">
            {filtered.length} jenis cocok.
          </p>
          {filtered.length === 0 && (
            <Panel>
              <EmptyState title="Tidak ada jenis grafik yang cocok" hint="Ubah kata kunci atau pilihan tampilan." />
            </Panel>
          )}
          {GROUP_ORDER.map((g) => {
            const group = filtered.filter((c) => c.group === g);
            if (group.length === 0) return null;
            const headingId = `cat-group-${g}`;
            return (
              <section key={g} aria-labelledby={headingId} className="space-y-2">
                <h3 id={headingId} className="text-[13px] font-semibold text-[var(--text-2)]">
                  {g} · {GROUP_LABEL[g]}{" "}
                  <span className="font-normal text-[var(--text-3)]">
                    ({group.filter((c) => c.drawn).length} tergambar
                    {group.some((c) => !c.drawn) ? `, ${group.filter((c) => !c.drawn).length} tidak` : ""})
                  </span>
                </h3>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {group.map((c) => (
                    <ChartCard key={c.code} def={c} byCode={byCode} onUse={onUse} />
                  ))}
                </ul>
                {group.some((c) => c.purpose !== group[0].purpose) && (
                  <p className="text-[11.5px] text-[var(--text-3)]">
                    Tujuan dalam kelompok ini: {[...new Set(group.map((c) => labelOrKey(PURPOSE_LABEL, c.purpose)))].join(", ")}.
                  </p>
                )}
              </section>
            );
          })}
        </>
      )}
    </section>
  );
}

function DiagramCatalog({ q, onUse }: { q: StudioQueryResult<DiagramRegistryResponse>; onUse: (c: UseChoice) => void }) {
  return (
    <section aria-labelledby="cat-diagram" className="space-y-4">
      <SectionHeader label="Diagram" title={<span id="cat-diagram">Keluarga diagram</span>} />
      <QueryState q={q} label="diagram" />
      {q.data && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {q.data.items.map((d) => (
            <li key={d.family}>
              <Panel className="flex h-full flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="eyebrow font-mono">{d.family}</span>
                    <h4 className="mt-0.5 text-[13.5px] font-medium">{labelOrKey(FAMILY_LABEL, d.family)}</h4>
                  </div>
                  {d.layout !== d.family && <Pill>tata letak {d.layout}</Pill>}
                </div>
                <p className="text-[12px] text-[var(--text-2)]">{labelOrKey(FAMILY_HINT, d.family)}</p>
                <div className="mt-auto pt-1">
                  <Button size="sm" onClick={() => onUse({ kind: "DIAGRAM", family: d.family as DiagramFamily })}>
                    <Waypoints className="h-3.5 w-3.5" aria-hidden /> Pakai {labelOrKey(FAMILY_LABEL, d.family)}
                  </Button>
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SymbolCatalog({ q }: { q: StudioQueryResult<SymbolRegistryResponse> }) {
  const items = q.data?.items ?? [];
  const dialects = [...new Set(items.map((s) => s.dialect))];
  return (
    <section aria-labelledby="cat-symbol" className="space-y-4">
      <SectionHeader
        label="Simbol"
        title={<span id="cat-symbol">Simbol diagram per dialek</span>}
        action={q.data ? <span className="text-[12px] text-[var(--text-3)]">{items.length} simbol</span> : null}
      />
      <QueryState q={q} label="simbol" />
      {q.data && (
        <>
          <p className="text-[12px] text-[var(--text-3)]">
            Rujuk simbol pada simpul diagram dengan id lengkap <code className="font-mono">dialek:nama</code>, mis.{" "}
            <code className="font-mono">iec:breaker</code>.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {dialects.map((d) => {
              const list = items.filter((s) => s.dialect === d);
              return (
                <Panel key={d} className="p-4">
                  <h4 className="text-[13px] font-medium">
                    {labelOrKey(DIALECT_LABEL as Record<SymbolDialect, string>, d)}{" "}
                    <span className="font-normal text-[var(--text-3)]">({list.length})</span>
                  </h4>
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Simbol ${d}`}>
                    {list.map((s) => (
                      <li key={s.id}>
                        <code className="inline-block rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[11.5px] text-[var(--text-2)]" title={s.id}>
                          {symbolName(s.id)}
                        </code>
                      </li>
                    ))}
                  </ul>
                </Panel>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export function ArtifactCatalog({
  charts,
  diagrams,
  symbols,
  onUse,
}: {
  charts: StudioQueryResult<ChartRegistryResponse>;
  diagrams: StudioQueryResult<DiagramRegistryResponse>;
  symbols: StudioQueryResult<SymbolRegistryResponse>;
  onUse: (c: UseChoice) => void;
}) {
  return (
    <div className="space-y-10">
      <ChartCatalog q={charts} onUse={onUse} />
      <DiagramCatalog q={diagrams} onUse={onUse} />
      <SymbolCatalog q={symbols} />
    </div>
  );
}

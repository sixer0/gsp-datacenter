"use client";

/**
 * Riwayat versi templat `/studio/templates/[id]/versions` (S58; disesuaikan
 * SR-29 ke bahasa awam UX-01 P3): daftar versi + pembanding dua versi dalam
 * label pengaturan ("Ukuran kertas: A4 jadi F4"). Rincian per kunci rinci dan
 * sidik hanya di "Info teknis" (ADMIN).
 */
import Link from "next/link";
import { useCallback, useId, useMemo, useState } from "react";
import { ArrowLeftRight, Pencil } from "lucide-react";
import type { TemplateVersionDto } from "@/lib/studio/contract/types/api";
import { Button, EmptyState, Panel, Pill, Skeleton } from "@/components/ui/kit";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { ErrorView } from "@/components/studio/shared/error-view";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { formatDateTime } from "@/components/studio/shared/labels";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { getEssentials, getTemplateDetail, type EssentialKnob, type TemplateDetailV2 } from "./api";
import { creatorLabel, knobKey, knobValueLabel } from "./model";
import { diffRecords, formatValue, valuesEqual } from "./values";

interface HistoryData {
  detail: TemplateDetailV2;
  knobs: EssentialKnob[];
}

const selectCls =
  "mt-1 w-32 rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-3 py-1.5 text-[13px] text-[var(--text)] outline-none focus-visible:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]";

export function VersionHistory({ templateId }: { templateId: string }) {
  const fetcher = useCallback(async (signal: AbortSignal): Promise<HistoryData> => {
    const [detail, ess] = await Promise.all([getTemplateDetail(templateId, undefined, signal), getEssentials(signal)]);
    return { detail, knobs: Array.isArray(ess.global) ? ess.global : [] };
  }, [templateId]);
  const q = useStudioQuery(`template-editor:history:${templateId}`, fetcher, { source: "template-editor.history" });

  if (q.error && !q.data) {
    return (
      <ErrorView
        error={q.error}
        title="Riwayat versi tidak dapat dimuat"
        context={{ subject: "Templat" }}
        onRetry={() => q.retry()}
        cooldown={q.cooldown}
        actions={<Button href="/studio/templates">Kembali ke Templat</Button>}
      />
    );
  }
  if (!q.data) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Memuat riwayat versi">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  return <HistoryBody data={q.data} />;
}

function HistoryBody({ data }: { data: HistoryData }) {
  const { detail, knobs } = data;
  const versions = useMemo(() => [...detail.versions].sort((a, b) => b.versionNo - a.versionNo), [detail.versions]);
  const latest = versions[0]?.versionNo ?? detail.version.versionNo;
  const [a, setA] = useState<number>(versions[1]?.versionNo ?? latest);
  const [b, setB] = useState<number>(latest);
  const [cmp, setCmp] = useState<{ a: TemplateDetailV2; b: TemplateDetailV2 } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aId = useId();
  const bId = useId();
  const tid = detail.template.id;
  const editorHref = `/studio/templates/${encodeURIComponent(tid)}`;

  async function compare() {
    if (busy || a === b) return;
    setBusy(true);
    setError(null);
    try {
      const [va, vb] = await Promise.all([getTemplateDetail(tid, a), getTemplateDetail(tid, b)]);
      setCmp({ a: va, b: vb });
    } catch (e) {
      setError(errorMessages(e, { subject: "Templat" }).body);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <nav aria-label="Remah roti" className="text-[12.5px] text-[var(--text-2)]">
          <Link href="/studio/templates" className="hover:text-[var(--text)] hover:underline">
            Templat
          </Link>
          <span aria-hidden className="mx-1.5">
            /
          </span>
          <Link href={editorHref} className="hover:text-[var(--text)] hover:underline">
            {detail.template.name}
          </Link>
          <span aria-hidden className="mx-1.5">
            /
          </span>
          <span className="text-[var(--text)]">Riwayat versi</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-[var(--text)]">Riwayat versi</h1>
            <p className="mt-1 text-[13px] text-[var(--text-2)]">Setiap simpan menjadi versi baru. Dokumen tetap memakai versi saat dokumen itu dibuat.</p>
          </div>
          <Button href={editorHref} size="sm">
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden /> Buka editor
          </Button>
        </div>
      </header>

      {versions.length === 0 ? (
        <Panel>
          <EmptyState title="Belum ada versi." hint="Versi pertama dibuat saat templat dibuat." />
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-[var(--line)]">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0 max-w-[44rem]">
                  <p className="flex items-center gap-2 text-[14px] font-medium text-[var(--text)]">
                    Versi {v.versionNo.toLocaleString("id-ID")}
                    {v.versionNo === latest && <Pill tone="accent">Terbaru</Pill>}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-[var(--text-2)]">{v.changeNote}</p>
                  <p className="mt-1 text-[12px] text-[var(--text-2)]">
                    {creatorLabel(v.createdBy)} · {formatDateTime(v.createdAt)}
                  </p>
                </div>
                <Button size="sm" href={`${editorHref}${v.versionNo === latest ? "" : `?version=${v.versionNo}`}`}>
                  Lihat
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {versions.length > 1 && (
        <Panel className="p-5">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--text)]">Bandingkan dua versi</h2>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void compare();
            }}
          >
            <div>
              <label htmlFor={aId} className="text-[12.5px] text-[var(--text-2)]">
                Versi lama
              </label>
              <select id={aId} className={`${selectCls} block`} value={a} onChange={(e) => setA(Number(e.target.value))}>
                {versions.map((v) => (
                  <option key={v.id} value={v.versionNo}>
                    Versi {v.versionNo}
                  </option>
                ))}
              </select>
            </div>
            <ArrowLeftRight className="mb-2.5 h-4 w-4 text-[var(--text-2)]" strokeWidth={2} aria-hidden />
            <div>
              <label htmlFor={bId} className="text-[12.5px] text-[var(--text-2)]">
                Versi baru
              </label>
              <select id={bId} className={`${selectCls} block`} value={b} onChange={(e) => setB(Number(e.target.value))}>
                {versions.map((v) => (
                  <option key={v.id} value={v.versionNo}>
                    Versi {v.versionNo}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary" ariaDisabled={busy || a === b}>
              {busy ? "Memuat…" : "Bandingkan"}
            </Button>
            {a === b && <span className="text-[12.5px] text-[var(--text-2)]">Pilih dua versi berbeda.</span>}
          </form>
          {error && (
            <p role="alert" className="mt-3 text-[12.5px] text-[var(--down)]">
              {error}
            </p>
          )}
          {cmp && <Comparison a={cmp.a} b={cmp.b} knobs={knobs} />}
        </Panel>
      )}

      <InfoTeknis
        summary="Info teknis versi"
        items={Object.fromEntries(versions.map((v) => [`Versi ${v.versionNo}`, `${v.paramsSha256} · ${v.createdBy}`]))}
      />
    </div>
  );
}

function Comparison({ a, b, knobs }: { a: TemplateDetailV2; b: TemplateDetailV2; knobs: readonly EssentialKnob[] }) {
  const va: TemplateVersionDto = a.version;
  const vb: TemplateVersionDto = b.version;
  const knobLines = knobs
    .map((k) => {
      const before = va.resolvedParams?.[knobKey(k)];
      const after = vb.resolvedParams?.[knobKey(k)];
      return valuesEqual(before, after) ? null : `${k.label}: ${knobValueLabel(k, before)} jadi ${knobValueLabel(k, after)}`;
    })
    .filter((l): l is string => l !== null);
  const presetA = a.definition?.preset?.slug ?? null;
  const presetB = b.definition?.preset?.slug ?? null;
  const skeletonChanged = (a.skeletonSha256 ?? null) !== (b.skeletonSha256 ?? null);
  const knobKeys = new Set(knobs.map(knobKey));
  const otherResolved = diffRecords(va.resolvedParams ?? {}, vb.resolvedParams ?? {}).filter((c) => !knobKeys.has(c.key));
  const overrides = diffRecords(va.overrides ?? {}, vb.overrides ?? {});
  const lines = [
    ...(presetA !== presetB && presetB ? ["Gaya diganti"] : []),
    ...knobLines,
    ...(skeletonChanged ? ["Susunan dokumen berubah"] : []),
    ...(otherResolved.length > 0 ? [`${otherResolved.length.toLocaleString("id-ID")} pengaturan rinci lain berubah`] : []),
  ];
  return (
    <div className="mt-4 space-y-3" aria-live="polite">
      <h3 className="text-[13px] font-medium text-[var(--text)]">
        Versi {va.versionNo.toLocaleString("id-ID")} ke versi {vb.versionNo.toLocaleString("id-ID")}
      </h3>
      {lines.length === 0 ? (
        <p className="text-[13px] text-[var(--text-2)]">Tidak ada perbedaan pengaturan.</p>
      ) : (
        <ul className="space-y-1 text-[13px] text-[var(--text)]">
          {lines.map((l) => (
            <li key={l} className="flex gap-2">
              <span aria-hidden className="text-[var(--accent)]">
                •
              </span>
              {l}
            </li>
          ))}
        </ul>
      )}
      <InfoTeknis summary="Rincian per kunci">
        <div className="max-h-[24rem] overflow-auto">
          <table className="w-full text-left text-[11.5px]">
            <thead>
              <tr className="text-[var(--text-2)]">
                <th scope="col" className="py-1 pr-2 font-medium">Kunci</th>
                <th scope="col" className="py-1 pr-2 font-medium">Versi {va.versionNo}</th>
                <th scope="col" className="py-1 font-medium">Versi {vb.versionNo}</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((r) => (
                <tr key={r.key} className="border-t border-[var(--line)] align-top">
                  <td className="py-1 pr-2 font-mono text-[var(--text)]">{r.key}</td>
                  <td className="break-all py-1 pr-2 font-mono text-[var(--text-2)]">{formatValue(r.before, 160)}</td>
                  <td className="break-all py-1 font-mono text-[var(--text-2)]">{formatValue(r.after, 160)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {overrides.length === 0 && <p className="text-[var(--text-2)]">Lapis templat sama.</p>}
        </div>
      </InfoTeknis>
    </div>
  );
}

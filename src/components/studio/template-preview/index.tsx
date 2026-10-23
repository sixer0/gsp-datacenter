"use client";

/**
 * U71 `TemplatePreviewPane` (01_specs.md §9; isi S101; disesuaikan SR-29 untuk
 * UX-01 W3): pratinjau langsung di samping Pengaturan.
 *
 * Jalur v2 (FIX-V, FIX-U M5; bawaan bila `draftTemplate` membawa kerangka): dokumen contoh
 * `studio.doc/v2` dibentuk dari kerangka draf (`sampleDocumentV2`) lalu dikirim ke
 * POST /api/studio/validate?preview=html bersama `draftTemplate` (preset + esensial +
 * lanjutan ADMIN + roleFormats ADMIN + kerangka, base = templat yang disunting); server
 * meresolusi draf tanpa simpan dan merakit HTML norm/v2 sadar slot.
 *
 * Jalur v1 lama (tanpa `draftTemplate` atau kerangka belum terbaca): dokumen contoh
 * (bawaan `SAMPLE_DOCUMENT` atau `sampleDocument`) dengan nilai draf: `essentials`
 * (kenop esensial global, kunci rinci) ∪ `advanced` (ADMIN) ∪ `draftOverrides`.
 * Jeda `debounceMs` (bawaan 600 ms), permintaan lama dibatalkan
 * (AbortController). Saat memuat, pratinjau lama tetap tampil dengan opasitas
 * 60% (tidak berkedip). HTML tampil di iframe `sandbox` TANPA allow-scripts
 * (srcdoc). Tidak menyimpan apa pun.
 *
 * Permukaan utama berbahasa awam (P3): kunci parameter, kode, dan ringkasan
 * pemeriksaan standar hanya di "Info teknis" (ADMIN). Galat lewat `shared/http`
 * + `ErrorView` (coba ulang berjeda 3/6/12 s, maks 3).
 */
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import type { TemplatePreviewPaneProps } from "@/lib/studio/contract/ui";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { StudioTemplateV2 } from "@/lib/studio/contract/types/v2/template";
import { STUDIO_TIERS, type StudioTier } from "@/lib/studio/contract/enums";
import { ErrorView } from "@/components/studio/shared/error-view";
import { isStudioApiError, type StudioApiError } from "@/components/studio/shared/http";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { TERMS, TIER_LABEL } from "@/components/studio/shared/labels";
import { fetchTemplateRef, isAbort, postValidatePreviewV2, postValidatePreviewWithRoles, type DraftTemplateBody, type PreviewValidateResponse } from "./api";
import { paramKeyFromPointer } from "./param-tools";
import { listPreviewUnits, previewSrcDoc } from "./preview-html";
import { SAMPLE_DOCUMENT, withDraft } from "./sample-document";
import { sampleDocumentV2 } from "./sample-document-v2";

export type { TemplatePreviewPaneProps };

export { SAMPLE_DOCUMENT, withDraft, type DraftInput } from "./sample-document";
export { sampleDocumentV2, type SampleDocumentV2Input } from "./sample-document-v2";
export {
  PARAM_CLASS_BADGE,
  changedKeys,
  chapterRank,
  groupParams,
  isOverriddenFromParent,
  isParamEditable,
  paramKeyFromPointer,
  resetParamToParent,
  searchParams,
  type ParamChapterGroup,
  type ParamClass,
  type ParamNamespaceGroup,
  type ParamSearchOptions,
} from "./param-tools";
export { fetchParamRegistry, type PreviewApiError, type PreviewValidateResponse } from "./api";
export { listPreviewUnits, previewSrcDoc, type PreviewUnit } from "./preview-html";

/** Ringkasan hasil validasi untuk pemanggil. */
export interface TemplatePreviewResult {
  valid: boolean;
  issues: ValidationIssue[];
  /** Kunci parameter yang dirujuk isu (`/document/overrides/<kunci>`). */
  paramKeys: string[];
}

/** Props kontrak + tambahan opsional (S101, SR-29). `draftTemplate` kini medan kontrak (FIX-Y). */
export interface TemplatePreviewPaneExtraProps {
  /** Nilai kenop esensial global draf (kunci rinci, `studio.template/v2` `essentials`). */
  essentials?: Readonly<Record<string, ParamValue>>;
  /** Lapis lanjutan draf (ADMIN). */
  advanced?: Readonly<Record<string, ParamValue>>;
  /** Tingkat terbitan awal pratinjau; bawaan = tingkat dokumen contoh. */
  defaultTier?: StudioTier;
  /** Tampilkan pilihan tingkat terbitan (bawaan true). */
  showTier?: boolean;
  /**
   * Format peran draf (peta efektif utuh). Dikirim sebagai medan opsional
   * `roleFormats` di badan validate (IP-10); bila server belum mendukungnya,
   * pratinjau memakai format peran versi dasar.
   */
  draftRoleFormats?: Readonly<Record<string, unknown>>;
  /** Judul panel (bawaan "Pratinjau"). */
  title?: string;
  /** Dipanggil setiap hasil validasi baru. */
  onResult?: (r: TemplatePreviewResult) => void;
  className?: string;
}

export type TemplatePreviewPaneFullProps = TemplatePreviewPaneProps & TemplatePreviewPaneExtraProps;

const DEFAULT_DEBOUNCE_MS = 600;

interface TemplateRef {
  slug: string;
  versionNo: number;
  name: string;
}

interface Settled<T> {
  key: string;
  data: T | null;
  error: StudioApiError | Error | null;
  at: number;
}

function asError(err: unknown): StudioApiError | Error {
  return isStudioApiError(err) || err instanceof Error ? err : new Error(String(err));
}

const TIME = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function TemplatePreviewPane(props: TemplatePreviewPaneFullProps): ReactElement | null {
  const {
    templateId,
    versionNo,
    draftOverrides,
    essentials,
    advanced,
    sampleDocument,
    debounceMs,
    defaultTier,
    showTier = true,
    draftRoleFormats,
    draftTemplate,
    title = "Pratinjau",
    onResult,
    className = "",
  } = props;
  const baseDoc = sampleDocument ?? SAMPLE_DOCUMENT;
  const delay = Math.max(0, debounceMs ?? DEFAULT_DEBOUNCE_MS);

  const [tier, setTier] = useState<StudioTier>(defaultTier ?? baseDoc.meta.tier);
  const [unitChoice, setUnitChoice] = useState<string>("");
  const [refNonce, setRefNonce] = useState(0);
  const [valNonce, setValNonce] = useState(0);

  // ── 1. Templat -> slug (validate merujuk templat lewat slug) ──────────
  const refKey = `${templateId}#${versionNo ?? ""}#${refNonce}`;
  const [refSettled, setRefSettled] = useState<Settled<TemplateRef> | null>(null);
  useEffect(() => {
    if (!templateId) return;
    const ctrl = new AbortController();
    const key = `${templateId}#${versionNo ?? ""}#${refNonce}`;
    fetchTemplateRef(templateId, versionNo, ctrl.signal).then(
      (data) => setRefSettled({ key, data, error: null, at: Date.now() }),
      (err: unknown) => {
        if (isAbort(err)) return;
        setRefSettled({ key, data: null, error: asError(err), at: Date.now() });
      },
    );
    return () => ctrl.abort();
  }, [templateId, versionNo, refNonce]);
  const ref = refSettled?.key === refKey ? refSettled.data : null;
  const refError = refSettled?.key === refKey ? refSettled.error : null;

  // ── 2. Nilai draf gabungan -> dokumen (kunci stabil walau objek props baru) ─
  // v2 (FIX-V): draf templat berkerangka; v1: dokumen contoh + override draf.
  const draftJson = useMemo(() => (draftTemplate && draftTemplate.skeleton?.slots?.length > 0 ? JSON.stringify(draftTemplate) : ""), [draftTemplate]);
  const v2 = draftJson !== "";
  const valuesJson = useMemo(() => JSON.stringify({ ...(essentials ?? {}), ...(advanced ?? {}), ...draftOverrides }), [essentials, advanced, draftOverrides]);
  const body = useMemo(() => {
    if (!ref) return null;
    if (draftJson) {
      const template = JSON.parse(draftJson) as StudioTemplateV2;
      const draft: DraftTemplateBody = { template, base: { slug: ref.slug, version: ref.versionNo } };
      return JSON.stringify({ v2: { document: sampleDocumentV2({ slug: ref.slug, tier, slots: template.skeleton.slots }), draftTemplate: draft } });
    }
    const values = JSON.parse(valuesJson) as Record<string, ParamValue>;
    return JSON.stringify(withDraft(baseDoc, { slug: ref.slug, versionNo: ref.versionNo, tier, draftOverrides: values }));
  }, [ref, baseDoc, tier, valuesJson, draftJson]);
  const rolesJson = useMemo(
    () => (!v2 && draftRoleFormats && Object.keys(draftRoleFormats).length > 0 ? JSON.stringify(draftRoleFormats) : ""),
    [draftRoleFormats, v2],
  );
  const reqKey = body ? `${body}#${rolesJson}#${valNonce}` : null;

  // ── 3. Debounce + batalkan permintaan lama ───────────────────────────
  const [inflightKey, setInflightKey] = useState<string | null>(null);
  const [settled, setSettled] = useState<Settled<PreviewValidateResponse> | null>(null);
  const [lastOk, setLastOk] = useState<{ html: string; at: number } | null>(null);
  useEffect(() => {
    if (!body) return;
    const key = `${body}#${rolesJson}#${valNonce}`;
    const roles = rolesJson ? (JSON.parse(rolesJson) as Record<string, unknown>) : undefined;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      setInflightKey(key);
      const parsed = JSON.parse(body) as { v2?: { document: Record<string, unknown>; draftTemplate: DraftTemplateBody } };
      const request = parsed.v2
        ? postValidatePreviewV2(parsed.v2.document, parsed.v2.draftTemplate, ctrl.signal).then((data) => ({ data }))
        : postValidatePreviewWithRoles(JSON.parse(body), roles, ctrl.signal);
      request.then(
        ({ data }) => {
          const at = Date.now();
          setSettled({ key, data, error: null, at });
          if (data.previewHtml) setLastOk({ html: data.previewHtml, at });
        },
        (err: unknown) => {
          if (isAbort(err)) return;
          setSettled({ key, data: null, error: asError(err), at: Date.now() });
        },
      );
    }, delay);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [body, rolesJson, delay, valNonce]);

  const current = settled && settled.key === reqKey ? settled : null;
  const loading = reqKey !== null && !current;
  const waiting = loading && inflightKey !== reqKey;
  const result = current?.data ?? null;
  const valError = current?.error ?? null;

  useEffect(() => {
    if (!result || !onResult) return;
    const paramKeys = Array.from(new Set(result.issues.map((i) => paramKeyFromPointer(i.pointer)).filter((k): k is string => k !== null)));
    onResult({ valid: result.valid, issues: result.issues, paramKeys });
  }, [result, onResult]);

  // ── 4. Halaman (unit) ────────────────────────────────────────────────
  const lastHtml = lastOk?.html ?? null;
  const units = useMemo(() => (lastHtml ? listPreviewUnits(lastHtml) : []), [lastHtml]);
  const unitKey = unitChoice && units.some((u) => u.key === unitChoice) ? unitChoice : null;
  const srcDoc = useMemo(() => (lastHtml ? previewSrcDoc(lastHtml, unitKey) : null), [lastHtml, unitKey]);
  const stale = loading || !!valError || (result !== null && !result.previewHtml);
  const ids = `tpv-${templateId.replace(/[^A-Za-z0-9_-]/g, "")}`;

  let status: string;
  if (refError) status = "";
  else if (!ref) status = "Menyiapkan pratinjau…";
  else if (waiting) status = "Menunggu Anda selesai mengubah pengaturan…";
  else if (loading) status = "Menyusun pratinjau…";
  else if (valError) status = "";
  else if (result && !result.valid) status = "Dokumen contoh belum memenuhi pemeriksaan standar dengan pengaturan ini. Pengaturan tetap bisa disimpan.";
  else if (result?.previewError) status = "Pratinjau tidak dapat disusun untuk pengaturan ini. Pengaturan tetap bisa disimpan.";
  else if (result && lastOk) status = `Diperbarui pukul ${TIME.format(lastOk.at)}.`;
  else status = "";

  const failChecks = result?.lint ? result.lint.checks.filter((c) => c.status === "FAIL").length : null;

  return (
    <section
      aria-labelledby={`${ids}-title`}
      data-template-id={templateId}
      className={`flex min-w-0 flex-col gap-3 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface-1)] p-4 ${className}`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${ids}-title`} className="text-[15px] font-semibold text-[var(--text)]">
          {title}
        </h2>
        {ref && <span className="text-[12px] text-[var(--text-2)]">Dokumen contoh</span>}
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[9rem] flex-1 flex-col gap-1">
          <label htmlFor={`${ids}-unit`} className="text-[12px] text-[var(--text-2)]">
            Halaman
          </label>
          <select
            id={`${ids}-unit`}
            value={unitKey ?? ""}
            onChange={(e) => setUnitChoice(e.target.value)}
            disabled={units.length === 0}
            className="rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-[12.5px] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] disabled:opacity-50"
          >
            <option value="">Semua halaman</option>
            {units.map((u) => (
              <option key={u.key} value={u.key}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        {showTier && (
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-[12px] text-[var(--text-2)]">{TERMS.tier}</legend>
            <div className="flex gap-1">
              {STUDIO_TIERS.map((t) => (
                <label
                  key={t}
                  className={`cursor-pointer whitespace-nowrap rounded-[var(--r-sm)] border px-2.5 py-1 text-[12px] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
                    tier === t ? "border-[var(--accent)] text-[var(--text)]" : "border-[var(--line)] text-[var(--text-2)] hover:border-[var(--line-strong)]"
                  }`}
                >
                  <input type="radio" name={`${ids}-tier`} value={t} checked={tier === t} onChange={() => setTier(t)} className="sr-only" />
                  {TIER_LABEL[t]}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {status && (
        <p role="status" aria-live="polite" className="flex items-start gap-2 text-[12.5px] text-[var(--text-2)]">
          {loading || !ref ? (
            <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none" strokeWidth={2} aria-hidden />
          ) : result?.valid && !result.previewError ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--up)]" strokeWidth={2} aria-hidden />
          ) : (
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warn)]" strokeWidth={2} aria-hidden />
          )}
          <span>{status}</span>
        </p>
      )}

      {refError && (
        <ErrorView variant="inline" error={refError} title="Pratinjau tidak dapat dibuat" context={{ subject: "Templat" }} onRetry={() => setRefNonce((n) => n + 1)} />
      )}
      {valError && !refError && (
        <ErrorView variant="inline" error={valError} title="Pratinjau tidak dapat dibuat" onRetry={() => setValNonce((n) => n + 1)} />
      )}

      <div className="relative min-h-[420px] overflow-hidden rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--studio-paper)]">
        {srcDoc ? (
          <iframe
            title="Pratinjau dokumen contoh"
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={srcDoc}
            aria-busy={loading}
            className={`h-[66vh] min-h-[420px] w-full transition-opacity duration-150 motion-reduce:transition-none ${stale ? "opacity-60" : "opacity-100"}`}
          />
        ) : (
          <div aria-busy={loading} className="flex h-[420px] items-center justify-center p-6 text-center text-[13px] text-[var(--studio-ink-2)]">
            {loading || !ref ? "Pratinjau sedang disiapkan…" : "Belum ada pratinjau untuk ditampilkan."}
          </div>
        )}
      </div>
      <p className="text-[12px] text-[var(--text-2)]">Pratinjau perkiraan; hasil akhir ada di berkas PDF.</p>

      <InfoTeknis
        items={{
          Templat: ref ? `${ref.slug} versi ${ref.versionNo}` : undefined,
          "Pemeriksaan standar": result?.lint ? `${result.lint.tier} ${result.lint.releaseStatus}; ${failChecks} gagal dari ${result.lint.checks.length}` : undefined,
          "Kode pratinjau": result?.previewError?.code,
        }}
      >
        {result && result.issues.length > 0 && (
          <ul className="max-h-48 space-y-1 overflow-auto">
            {result.issues.map((issue, i) => {
              const key = paramKeyFromPointer(issue.pointer);
              return (
                <li key={`${issue.pointer}-${issue.keyword}-${i}`} className="text-[12px] text-[var(--text-2)]">
                  <span className="mr-1.5 font-mono text-[11px] text-[var(--text)]">{key ?? issue.pointer}</span>
                  {issue.message}
                  {issue.checkId && <span className="ml-1.5 text-[11px] text-[var(--text-3)]">({issue.checkId})</span>}
                </li>
              );
            })}
          </ul>
        )}
      </InfoTeknis>
    </section>
  );
}

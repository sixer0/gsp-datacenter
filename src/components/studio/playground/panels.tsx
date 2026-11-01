"use client";

/*
 * Panel hasil Alat developer (SR-31; pola S100): daftar masalah per JSON
 * Pointer + ID cek, ringkasan lint, kelengkapan sesudah kirim (rel bersama),
 * pratinjau HTML ber-sandbox, hasil kiriman v2 (`SubmitResultV2`) dengan
 * berkas lewat `fileUrl` bersama (S86 R06: Buka = inline, Unduh = attachment),
 * galat tindakan awam + Info teknis, dan respons mentah terlipat.
 */

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Copy, FileText, MapPin, XCircle } from "lucide-react";
import type { LintIssue, LintReport } from "@/lib/studio/contract/engine";
import type { CompletenessReportV2 } from "@/lib/studio/contract/types/v2";
import { Panel, Pill } from "@/components/ui/kit";
import { CompletenessRail, describeMissing } from "@/components/studio/shared/completeness-rail";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { isStudioApiError } from "@/components/studio/shared/http";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import {
  COMPLETENESS_STATUS_LABEL,
  RELEASE_LABEL,
  RELEASE_TONE,
} from "@/components/studio/shared/labels";
import { MissionName } from "@/components/studio/shared/raw-id";
import type { CooldownState } from "@/components/studio/shared/use-cooldown";
import type { ActionFailure } from "./use-playground-actions";
import type { SubmitResultV2, ValidateResultV2 } from "./types";

export interface EditorIssue {
  /** Pointer relatif isi editor ("" = akar). */
  pointer: string;
  keyword: string;
  message: string;
  checkId?: string;
  /** Baris editor terkait (null bila tidak dapat dipetakan). */
  line: number | null;
}

export function IssueList({
  issues,
  activeIndex,
  onSelect,
  title,
}: {
  issues: EditorIssue[];
  activeIndex: number | null;
  onSelect: (index: number) => void;
  title: string;
}) {
  if (issues.length === 0) return null;
  return (
    <section aria-label={title}>
      <h3 className="mb-2 text-[12.5px] font-semibold text-[var(--text-2)]">
        {title} <span className="num text-[var(--text-2)]">({issues.length})</span>
      </h3>
      <ul className="max-h-[300px] space-y-1 overflow-y-auto pr-1">
        {issues.map((it, i) => {
          const active = i === activeIndex;
          return (
            <li key={`${it.pointer}-${it.keyword}-${i}`}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                disabled={it.line === null}
                aria-current={active ? "true" : undefined}
                className={`w-full rounded-[var(--r-sm)] border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  active ? "border-[var(--line-strong)] bg-[var(--surface-2)]" : "border-[var(--line)] hover:bg-[var(--surface-1)]"
                } ${it.line === null ? "cursor-default" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[11.5px] text-[var(--text)] break-all">
                    {it.pointer || "/"}
                  </code>
                  {it.checkId && <Pill tone="warn">{it.checkId}</Pill>}
                  <span className="font-mono text-[11px] text-[var(--text-2)]">{it.keyword}</span>
                  {it.line !== null && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--text-2)] num">
                      <MapPin className="h-3 w-3" aria-hidden />
                      baris {it.line}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12.5px] text-[var(--text-2)]">{it.message}</p>
                {it.line !== null && <span className="sr-only">Pilih untuk menyorot baris {it.line} di editor.</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const STATUS_TONE: Record<string, "up" | "down" | "warn" | "neutral"> = { PASS: "up", FAIL: "down", REPORT: "warn", NOT_RUN: "neutral" };
const STATUS_LABEL: Record<string, string> = { PASS: "Lulus", FAIL: "Gagal", REPORT: "Laporan", NOT_RUN: "Belum dijalankan" };

function LintRows({ checks, onPointer }: { checks: LintIssue[]; onPointer: (pointer: string) => void }) {
  return (
    <ul className="space-y-1">
      {checks.map((c, i) => (
        <li key={`${c.checkId}-${i}`} className="rounded-[var(--r-sm)] border border-[var(--line)] px-3 py-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[12px] text-[var(--text)]">{c.checkId}</span>
            <Pill tone={STATUS_TONE[c.status] ?? "neutral"}>{STATUS_LABEL[c.status] ?? c.status}</Pill>
            {c.address && <span className="font-mono text-[11px] text-[var(--text-2)]">nomor {c.address}</span>}
            {c.pointer && (
              <button
                type="button"
                onClick={() => onPointer(c.pointer as string)}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline"
              >
                <MapPin className="h-3 w-3" aria-hidden />
                Tunjukkan di editor
              </button>
            )}
          </div>
          {c.detail && <p className="mt-0.5 text-[12px] text-[var(--text-2)] break-words">{c.detail}</p>}
        </li>
      ))}
    </ul>
  );
}

export function LintSummary({ lint, onPointer }: { lint: LintReport; onPointer: (pointer: string) => void }) {
  const by = (s: string) => lint.checks.filter((c) => c.status === s);
  const fail = by("FAIL");
  const report = by("REPORT");
  const pass = by("PASS");
  return (
    <section aria-label="Hasil pemeriksaan standar" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] font-semibold text-[var(--text-2)]">Pemeriksaan standar</span>
        <Pill tone={RELEASE_TONE[lint.releaseStatus] ?? "neutral"}>{RELEASE_LABEL[lint.releaseStatus] ?? lint.releaseStatus}</Pill>
        <span className="text-[11.5px] text-[var(--text-2)] num">
          {pass.length} lulus · {fail.length} gagal · {report.length} laporan
        </span>
      </div>
      {lint.banner && <p className="text-[12px] leading-relaxed text-[var(--text-2)]">{lint.banner}</p>}
      {fail.length + report.length > 0 && <LintRows checks={[...fail, ...report]} onPointer={onPointer} />}
      {pass.length > 0 && (
        <details>
          <summary className="cursor-pointer text-[12px] text-[var(--text-2)]">Cek lulus ({pass.length})</summary>
          <div className="mt-2">
            <LintRows checks={pass} onPointer={onPointer} />
          </div>
        </details>
      )}
    </section>
  );
}

/** Kelengkapan sesudah kirim (pratinjau R08 atau hasil kiriman): rel + kekurangan + langkah. */
export function CompletenessBlock({ report, title }: { report: CompletenessReportV2; title: string }) {
  const missing = describeMissing(report);
  return (
    <section aria-label={title} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] font-semibold text-[var(--text-2)]">{title}</span>
        <Pill tone={report.status === "COMPLETE" ? "up" : "warn"}>{COMPLETENESS_STATUS_LABEL[report.status]}</Pill>
      </div>
      <CompletenessRail summary={report} size="sm" />
      {missing.length > 0 && <p className="text-[12px] text-[var(--text-2)]">Belum ada: {missing.join(", ")}</p>}
      {report.nextSteps.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-[12px] text-[var(--text-2)]">
          {report.nextSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
      <InfoTeknis items={{ "Kunci belum ada": report.missingRequired.join(", ") || "-", "Pesan server": report.message, forwardToController: report.forwardToController }} />
    </section>
  );
}

/** Pratinjau HTML: iframe ber-sandbox penuh (tanpa allow-scripts, tanpa same-origin; SEC-1). */
export function PreviewFrame({ html }: { html: string }) {
  return (
    <iframe
      title="Pratinjau HTML kiriman"
      sandbox=""
      referrerPolicy="no-referrer"
      srcDoc={html}
      className="h-[640px] w-full rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--studio-paper)]"
    />
  );
}

/** Respons mentah terlipat (W11 "Respons mentah >"). */
export function RawResponse({ value, label = "Respons mentah" }: { value: unknown; label?: string }) {
  return (
    <details className="rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--surface-1)] text-[12px]">
      <summary className="cursor-pointer select-none px-3 py-2 text-[var(--text-2)] hover:text-[var(--text)]">{label}</summary>
      <pre className="max-h-[360px] overflow-auto border-t border-[var(--line)] px-3 py-2 font-mono text-[11.5px] leading-relaxed text-[var(--text)]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

export function CopyText({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState<"idle" | "ok" | "fail">("idle");
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(
          () => setDone("ok"),
          () => setDone("fail"),
        );
      }}
      aria-label={label}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[var(--text-2)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
    >
      <Copy className="h-3 w-3" aria-hidden />
      {done === "ok" ? "Tersalin" : done === "fail" ? "Gagal menyalin" : "Salin"}
    </button>
  );
}

export function SubmitResultPanel({ result }: { result: SubmitResultV2 }) {
  const doc = result.document;
  const headline = result.unchanged
    ? "Tidak ada perubahan: isi identik dengan versi terakhir"
    : result.created
      ? `Dokumen baru dibuat (versi ${result.revision.revisionNo})`
      : `Disimpan sebagai versi ${result.revision.revisionNo}`;
  return (
    <Panel className="space-y-4 p-5">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--up)]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">{headline}</h3>
          <p className="text-[12.5px] text-[var(--text-2)]">
            {doc.docNumber} · <MissionName folder={doc.missionFolder} />
            {result.rebased ? " · digabung di atas versi terbaru" : ""}
          </p>
        </div>
        <Link href={`/studio/documents/${encodeURIComponent(doc.id)}`} className="btn-ghost inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-[12px]">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Buka dokumen
        </Link>
      </div>
      <CompletenessBlock report={result.completeness} title="Kelengkapan setelah kirim" />
      <InfoTeknis
        items={{
          "Id dokumen": doc.id,
          "Kunci dokumen": doc.docKey,
          Templat: `${doc.template.slug} v${doc.template.versionNo}`,
          changeScope: result.revision.changeScope,
          "Bab (pid)": result.chapter ? `${result.chapter.chapterKey} (${result.chapter.pid})` : undefined,
          "Bagian (alamat)": result.slot ? `${result.slot.slotKey} (${result.slot.address})` : undefined,
        }}
      />
      <RawResponse value={result} />
    </Panel>
  );
}

/** Hasil Validasi R08: status, kelengkapan sesudah kirim, pemeriksaan standar, respons mentah. */
export function ValidationPanel({ result, stale, onPointer }: { result: ValidateResultV2; stale: boolean; onPointer: (pointer: string) => void }) {
  return (
    <section aria-label="Hasil validasi">
      <Panel className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[13px] font-semibold text-[var(--text)]">Hasil validasi</h2>
          <Pill tone={result.valid ? "up" : "down"}>{result.valid ? "Valid" : `Tidak valid · ${result.issues.length} masalah`}</Pill>
          {stale && <span className="text-[11.5px] text-[var(--warn)]">JSON berubah sejak validasi terakhir; validasi ulang.</span>}
        </div>
        {result.completenessPreview && <CompletenessBlock report={result.completenessPreview} title="Kelengkapan setelah kirim" />}
        {result.lint && <LintSummary lint={result.lint} onPointer={onPointer} />}
        {result.previewError && (
          <p role="status" className="text-[12.5px] text-[var(--text-2)]">
            Pratinjau tidak dapat dirakit ({result.previewError.code}); validasi tetap berlaku.
          </p>
        )}
        <RawResponse value={{ ...result, previewHtml: result.previewHtml ? "(dipotong)" : undefined }} />
      </Panel>
    </section>
  );
}

/** Galat tindakan inline (role="alert") dekat tombol pemicu (UX-01 §5.1). */
export function ActionError({ failure, cooldown }: { failure: ActionFailure; cooldown: CooldownState }) {
  const msg = errorMessages(failure.error);
  const local = failure.localMessage;
  const err = isStudioApiError(failure.error) ? failure.error : null;
  return (
    <div role="alert" className="space-y-1.5 rounded-[var(--r-sm)] border border-[color-mix(in_srgb,var(--down)_35%,transparent)] px-3 py-2 text-[12.5px] text-[var(--text-2)]">
      <p className="flex items-start gap-2">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--down)]" aria-hidden />
        <span>
          <span className="font-medium text-[var(--text)]">{local ? "Belum dapat dikirim" : msg.title}.</span> {local ?? msg.body}
        </span>
      </p>
      {!local && msg.retryable && (
        <p className="pl-6 text-[12px]">
          {cooldown.exhausted
            ? "Masih gagal. Muat ulang halaman atau hubungi admin."
            : cooldown.secondsLeft > 0
              ? `Tombol aktif kembali dalam ${cooldown.secondsLeft} detik.`
              : "Anda dapat mencoba lagi."}
        </p>
      )}
      {!local && msg.actions.some((a) => a.kind === "login") && (
        <a href="/login?next=%2Fstudio%2Fplayground" className="ml-6 inline-block text-[12px] text-[var(--accent)] hover:underline">
          Masuk lagi
        </a>
      )}
      <InfoTeknis
        className="ml-6"
        items={{
          Kode: err ? String(err.code) : msg.code,
          Status: err?.status,
          "Id korelasi": err?.correlationId,
          Jalur: err ? `${err.method} ${err.url}` : undefined,
          "Pesan server": err?.message,
        }}
      />
    </div>
  );
}

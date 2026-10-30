"use client";

/*
 * Kartu "Buat berkas" di kepala halaman dokumen (SR-30; UX-01 §3b, W6, P5).
 *
 * - "Berkas lengkap" = satu-satunya tombol utama halaman, aktif hanya bila
 *   `fullRenderAllowed` (D-131). Bila belum, tombol tetap dapat difokus
 *   (`aria-disabled` + alasan tertulis) dan mengkliknya membuka daftar
 *   kekurangan dengan tautan ke tiap bagian dan alternatif draf. Tidak ada
 *   POST R17 lingkup dokumen saat Belum lengkap (kriteria A7).
 * - Draf bab / draf bagian selalu boleh (berkas bertanda DRAF).
 * - R17 bersifat sinkron (respons membawa job + berkas). Bila job masih
 *   menunggu/berjalan, kepala dimuat ulang berjeda 2/4/8 s (maks 15 s) hanya
 *   saat tab terlihat.
 * - 409 DOCUMENT_INCOMPLETE (balapan): pesan awam + rel diperbarui. 429/503:
 *   hitung mundur dari Retry-After.
 * - FIX-HZ1 (D-325): 503 PDF_ENGINE_UNAVAILABLE tahap preflight (server menolak
 *   sebelum pekerjaan dibuat) -> alasan + penyebab awam dan tombol "Buat tanpa PDF"
 *   memakai `suggestedFormats` server (tidak menunggu hitung mundur, karena permintaan
 *   tanpa PDF tidak terhalang). Hasil sebagian (`partial`, `failedFormats`) -> kalimat
 *   awam format mana yang belum berhasil (`render-card-outcome.ts`).
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FileCheck2, FileClock, Loader2, RefreshCw } from "lucide-react";
import type { CompletenessReportV2 } from "@/lib/studio/contract";
import type { StudioOutputFormat } from "@/lib/studio/contract/enums";
import { Button } from "@/components/ui/kit";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { isStudioApiError } from "@/components/studio/shared/http";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { FORMAT_LABEL } from "@/components/studio/shared/labels";
import { useNotice } from "@/components/studio/shared/notice";
import { useCooldown } from "@/components/studio/shared/use-cooldown";
import { renderDocument } from "./doc-api";
import { incompleteReportOf, missingLabel, type RenderResponse } from "./doc-model";
import { useDocPage } from "./doc-context";
import { outcomeOf, pdfNotReadyOf, type DocFormat, type PdfNotReadyView, type RenderOutcomeInput } from "./render-card-outcome";
const FORMAT_CHOICES: Array<{ id: DocFormat; label: string; code: StudioOutputFormat }> = [
  { id: "pdf", label: "PDF", code: "PDF" },
  { id: "docx", label: "Word", code: "DOCX" },
  { id: "html", label: "Halaman web", code: "HTML" },
];

const POLL_DELAYS_MS = [2000, 4000, 8000];

interface DraftOption {
  value: string;
  label: string;
  scope: "chapter" | "slot";
  key: string;
  group: "Bab" | "Bagian";
}

function draftOptions(report: CompletenessReportV2 | null): DraftOption[] {
  if (!report) return [];
  const out: DraftOption[] = [];
  for (const [slotKey, prog] of Object.entries(report.chapters ?? {})) {
    const appendix = report.slots.find((s) => s.slotKey === slotKey)?.sectionType === "appendix";
    for (const p of prog.present) {
      out.push({
        value: `chapter:${p.key}`,
        label: appendix ? `Lampiran ${p.key}` : `Bab ${p.key}`,
        scope: "chapter",
        key: p.key,
        group: "Bab",
      });
    }
  }
  for (const s of report.slots) {
    if (s.sectionType === "chapter" || s.sectionType === "appendix" || s.state === "OMITTED") continue;
    out.push({ value: `slot:${s.slotKey}`, label: s.label || "Bagian", scope: "slot", key: s.slotKey, group: "Bagian" });
  }
  return out;
}

/** Respons R17 + penanda hasil sebagian FIX-H1 (opsional untuk server lama). */
type RenderResult = RenderResponse & Pick<RenderOutcomeInput, "partial" | "failedFormats">;

function jobProblems(res: RenderResult): string[] {
  const out: string[] = [];
  const outcome = outcomeOf(res);
  if (outcome.text) out.push(outcome.text);
  for (const e of res.job.errors ?? []) {
    if (e.code === "PDF_ENGINE_UNAVAILABLE") out.push("Mesin cetak PDF sedang tidak siap.");
    else if (!outcome.text) {
      const fmt = e.format ? FORMAT_LABEL[e.format] ?? e.format : null;
      out.push(fmt ? `${fmt} gagal dibuat.` : "Sebagian berkas gagal dibuat.");
    }
  }
  return [...new Set(out)];
}

export function RenderCard() {
  const { id, report, detail, navigate, refreshAll } = useDocPage();
  const { notify, announce } = useNotice();
  const [formats, setFormats] = useState<Record<DocFormat, boolean>>({ pdf: true, docx: true, html: false });
  const [draft, setDraft] = useState<string>("");
  const [busy, setBusy] = useState<null | "full" | "draft">(null);
  const [showMissing, setShowMissing] = useState(false);
  const [error, setError] = useState<{ title: string; body: string; retryable: boolean; code: string } | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [lastJob, setLastJob] = useState<RenderResponse["job"] | null>(null);
  const [pdfBlock, setPdfBlock] = useState<{ view: PdfNotReadyView; withoutPdf: (() => void) | null } | null>(null);
  const cooldown = useCooldown();
  const reasonId = useId();
  const missingId = useId();
  const lastAttempt = useRef<null | (() => void)>(null);

  // Laporan yang lebih baru dari 409 (balapan) dipakai sampai kepala dimuat ulang.
  const [raceReport, setRaceReport] = useState<CompletenessReportV2 | null>(null);
  const effective = raceReport && (!report || raceReport.revisionNo >= report.revisionNo) ? raceReport : report;
  const allowed = effective ? effective.fullRenderAllowed : true; // dokumen lama tanpa laporan: server yang memutuskan
  const missing = useMemo(() => (effective ? effective.missingRequired.map((m) => ({ raw: m, label: missingLabel(m, effective) })) : []), [effective]);
  const options = useMemo(() => draftOptions(effective), [effective]);
  const chosenFormats = FORMAT_CHOICES.filter((f) => formats[f.id]).map((f) => f.id);
  const draftValue = draft && options.some((o) => o.value === draft) ? draft : options[0]?.value ?? "";

  // Muat ulang berjeda saat job masih berjalan; berhenti saat tab tersembunyi.
  useEffect(() => {
    if (!lastJob || (lastJob.status !== "QUEUED" && lastJob.status !== "RUNNING")) return;
    let i = 0;
    let timer: number | undefined;
    const tick = () => {
      if (i >= POLL_DELAYS_MS.length) return;
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") refreshAll();
        i += 1;
        tick();
      }, POLL_DELAYS_MS[i]);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [lastJob, refreshAll]);

  async function run(kind: "full" | "draft", body: Parameters<typeof renderDocument>[1], label: string, bypassCooldown = false) {
    if (busy || (!bypassCooldown && cooldown.secondsLeft > 0)) return;
    setBusy(kind);
    setError(null);
    setProblems([]);
    setPdfBlock(null);
    announce("Berkas sedang dibuat");
    try {
      const res: RenderResult = await renderDocument(id, body);
      setLastJob(res.job);
      setRaceReport(null);
      cooldown.reset();
      const probs = jobProblems(res);
      const outcome = outcomeOf(res);
      setProblems(probs);
      if (res.job.status === "FAILED") {
        setError({ title: "Berkas gagal dibuat", body: probs.join(" ") || "Coba lagi. Bila berulang, hubungi admin.", retryable: true, code: res.job.errorCode ?? "FAILED" });
        cooldown.arm();
      } else if (res.job.status === "QUEUED" || res.job.status === "RUNNING") {
        notify({ message: `${label}: berkas sedang dibuat`, tone: "info" });
      } else {
        notify({
          message: outcome.partial
            ? `${label}: sebagian berkas siap${outcome.failedNames.length ? ` (${outcome.failedNames.join(", ")} belum berhasil)` : ""}`
            : `${label}: berkas siap`,
          tone: outcome.partial ? "warn" : "success",
          action: { label: "Lihat berkas", onClick: () => navigate({ tab: "berkas" }) },
        });
      }
      refreshAll();
    } catch (e) {
      const pdf = pdfNotReadyOf(e);
      if (pdf) {
        // FIX-HZ1: server menolak PDF sebelum pekerjaan dibuat; tawarkan format lain.
        const suggested = kind === "draft" ? (["docx"] as DocFormat[]) : pdf.suggestedFormats;
        const withoutPdf =
          suggested.length > 0
            ? () => {
                if (kind === "full") setFormats((s) => ({ ...s, pdf: false }));
                void run(kind, { ...body, formats: suggested }, label, true);
              }
            : null;
        setPdfBlock({ view: pdf, withoutPdf });
        setError({ title: pdf.title, body: pdf.body, retryable: true, code: pdf.technical.code });
        cooldown.arm();
        if (pdf.retryAfterSec) cooldown.holdFor(pdf.retryAfterSec);
        announce(pdf.title);
        return;
      }
      const incomplete = isStudioApiError(e) && e.code === "DOCUMENT_INCOMPLETE" ? incompleteReportOf(e.details) : null;
      if (incomplete) {
        setRaceReport(incomplete);
        setShowMissing(true);
        refreshAll();
      }
      const msg = errorMessages(e, { missing: incomplete ? incomplete.missingRequired.map((m) => missingLabel(m, incomplete)) : undefined });
      setError({ title: msg.title, body: msg.body, retryable: msg.retryable, code: msg.code });
      if (msg.retryable) {
        cooldown.arm();
        if (msg.retryAfterSec) cooldown.holdFor(msg.retryAfterSec);
      }
    } finally {
      setBusy(null);
    }
  }

  function makeFull() {
    if (!allowed) {
      setShowMissing((v) => !v);
      return;
    }
    if (chosenFormats.length === 0) {
      setError({ title: "Pilih format berkas", body: "Centang paling sedikit satu format: PDF, Word, atau Halaman web.", retryable: false, code: "NO_FORMAT" });
      return;
    }
    const attempt = () => void run("full", { scope: "document", formats: chosenFormats }, "Berkas lengkap");
    lastAttempt.current = attempt;
    attempt();
  }

  function makeDraft(opt?: DraftOption) {
    const o = opt ?? options.find((x) => x.value === draftValue);
    if (!o) return;
    const fm = chosenFormats.filter((f) => f !== "html");
    const attempt = () => void run("draft", { scope: o.scope, key: o.key, formats: fm.length ? fm : ["pdf"] }, `Draf ${o.label}`);
    lastAttempt.current = attempt;
    attempt();
  }

  const disabledAll = !detail.data;
  return (
    <section aria-label="Buat berkas" className="rounded-[12px] border border-[var(--line)] bg-[var(--surface-1)] p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="text-[13px] font-medium text-[var(--text)]">Buat berkas</h2>
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">Format berkas</legend>
          {FORMAT_CHOICES.map((f) => (
            <label
              key={f.id}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-[12px] text-[var(--text-2)] has-[:checked]:border-[var(--line-strong)] has-[:checked]:text-[var(--text)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-[var(--accent)]"
                checked={formats[f.id]}
                onChange={(e) => setFormats((s) => ({ ...s, [f.id]: e.target.checked }))}
              />
              {f.label}
            </label>
          ))}
        </fieldset>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant={allowed ? "primary" : "ghost"}
          onClick={makeFull}
          ariaDisabled={!allowed || !!busy || disabledAll || cooldown.secondsLeft > 0}
          ariaDescribedBy={!allowed ? reasonId : undefined}
          className="whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {busy === "full" ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" strokeWidth={2} aria-hidden /> : <FileCheck2 className="h-4 w-4" strokeWidth={2} aria-hidden />}
          {busy === "full" ? "Berkas sedang dibuat…" : "Berkas lengkap"}
        </Button>

        {options.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`${missingId}-draft`}>
              Pilih bab atau bagian untuk draf
            </label>
            <select
              id={`${missingId}-draft`}
              value={draftValue}
              onChange={(e) => setDraft(e.target.value)}
              className="rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[12.5px] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {(["Bab", "Bagian"] as const).map((g) => {
                const list = options.filter((o) => o.group === g);
                if (list.length === 0) return null;
                return (
                  <optgroup key={g} label={g}>
                    {list.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <Button
              size="sm"
              onClick={() => makeDraft()}
              ariaDisabled={!!busy || cooldown.secondsLeft > 0}
              className="whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {busy === "draft" ? <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" strokeWidth={2} aria-hidden /> : <FileClock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
              {busy === "draft" ? "Draf sedang dibuat…" : "Buat draf"}
            </Button>
          </div>
        )}
      </div>

      {!allowed && missing.length > 0 && (
        <p id={reasonId} className="mt-2 text-[12.5px] text-[var(--text-2)]">
          Berkas lengkap dapat dibuat setelah {missing.map((m) => m.label).join(", ")} terisi. Draf bab atau bagian tetap bisa dibuat.
        </p>
      )}

      {showMissing && !allowed && (
        <div role="region" aria-label="Belum dapat membuat berkas lengkap" className="mt-3 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface-2)] p-3">
          <p className="text-[13px] font-medium text-[var(--text)]">Belum dapat membuat berkas lengkap</p>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-2)]">Bagian wajib berikut belum terisi. Agen akan mengisinya, atau minta pengisian lewat controller.</p>
          <ul className="mt-2 space-y-1">
            {missing.map((m) => {
              const i = m.raw.indexOf(":");
              const slotKey = i > 0 ? m.raw.slice(0, i) : m.raw;
              return (
                <li key={m.raw} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                  <button
                    type="button"
                    onClick={() => navigate({ tab: "baca", target: i > 0 ? m.raw : slotKey })}
                    className="text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    {m.label}
                  </button>
                </li>
              );
            })}
          </ul>
          {options.length > 0 && <p className="mt-2 text-[12px] text-[var(--text-2)]">Sementara itu, pilih bab atau bagian di atas lalu gunakan Buat draf.</p>}
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {busy ? "Berkas sedang dibuat" : ""}
      </div>

      {problems.length > 0 && !error && (
        <p className="mt-2 text-[12.5px] text-[var(--warn)]">
          {problems.join(" ")}
          {problems.some((p) => p.includes("tab Berkas")) ? "" : " Berkas lain tetap tersedia di tab Berkas."}
        </p>
      )}

      {error && (
        <div role="alert" className="mt-3 space-y-1.5 text-[12.5px]">
          <p className="font-medium text-[var(--down)]">{error.title}</p>
          <p className="text-[var(--text-2)]">{error.body}</p>
          {pdfBlock && pdfBlock.view.causes.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-[var(--text-2)]">
              {pdfBlock.view.causes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          {pdfBlock?.withoutPdf && pdfBlock.view.suggestLabel && (
            <Button size="sm" variant="primary" onClick={pdfBlock.withoutPdf} ariaDisabled={!!busy} className="whitespace-nowrap">
              <FileCheck2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {busy ? "Berkas sedang dibuat…" : pdfBlock.view.suggestLabel}
            </Button>
          )}
          {error.retryable && lastAttempt.current && !cooldown.exhausted && (
            <Button
              size="sm"
              ariaDisabled={cooldown.secondsLeft > 0}
              onClick={() => {
                if (cooldown.trigger()) lastAttempt.current?.();
              }}
              className="whitespace-nowrap"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {cooldown.secondsLeft > 0 ? `Coba lagi (${cooldown.secondsLeft} dtk)` : "Coba lagi"}
            </Button>
          )}
          {error.retryable && cooldown.exhausted && <p className="text-[var(--text-2)]">Masih gagal. Muat ulang halaman atau hubungi admin.</p>}
          <InfoTeknis
            items={{
              Kode: error.code,
              Pekerjaan: lastJob?.id,
              ...(pdfBlock ? { Penyebab: pdfBlock.view.technical.causeCodes, Diperiksa: pdfBlock.view.technical.checkedAt } : {}),
            }}
          />
        </div>
      )}

      {lastJob && !error && (
        <InfoTeknis className="mt-2" items={{ Pekerjaan: lastJob.id, Status: lastJob.status, Lingkup: `${lastJob.scope.kind}${lastJob.scope.key ? `:${lastJob.scope.key}` : ""}` }} />
      )}
    </section>
  );
}

"use client";

/*
 * Tab Kelengkapan (SR-30; UX-01 W6, §3b): satu baris per bagian (status,
 * pengisi, kapan, tindakan draf), kisi chip bab untuk bagian berbab, tombol
 * "Salin ringkasan kekurangan" (teks awam disusun klien), dan Info teknis
 * `forwardToController` mentah untuk ADMIN. Di ponsel tabel menjadi kartu.
 */
import { useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";
import type { CompletenessReportV2, SlotStatusV2 } from "@/lib/studio/contract";
import { Button, EmptyState, Panel, Pill } from "@/components/ui/kit";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { SLOT_STATE_LABEL, SLOT_STATE_TONE, actorLabel, actorLabelWithId, formatDateTime, rawIdTitle, slotLabel } from "@/components/studio/shared/labels";
import { useNotice } from "@/components/studio/shared/notice";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { renderDocument } from "./doc-api";
import { missingSummaryText, type RenderResponse } from "./doc-model";
import { useDocPage } from "./doc-context";
import { outcomeOf, pdfNotReadyOf, type RenderOutcomeInput } from "./render-card-outcome";

/** FIX-F (D-314): pengisi slot dalam label awam (`actorLabel`, D-297), bukan nilai mentah `agent:<id>`. */
export function slotFillerText(by: string | null | undefined): string {
  return by ? actorLabel(by) : "-";
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* lanjut ke cadangan */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export { copyToClipboard };

/** Teks notifikasi hasil draf (FIX-HZ1: hasil sebagian dalam bahasa awam). */
export function draftNotice(label: string, res: RenderOutcomeInput): { message: string; tone: "warn" | "success" } {
  const o = outcomeOf(res);
  if (o.failed) return { message: `Draf ${label} gagal dibuat${o.text ? `: ${o.text}` : ""}`, tone: "warn" };
  if (o.partial) return { message: `Draf ${label}: ${o.text}`, tone: "warn" };
  return { message: `Draf ${label}: berkas siap`, tone: "success" };
}

/**
 * "Buat draf bagian ini" (W6): draf PDF bertanda DRAF; galat ditampilkan inline.
 * FIX-HZ1 (D-325): 503 PDF tahap preflight -> alasan + penyebab awam dan tombol
 * "Buat draf Word" (permintaan tanpa PDF tidak terhalang mesin PDF).
 */
function DraftButton({ scope, keyName, label }: { scope: "slot" | "chapter"; keyName: string; label: string }) {
  const { id, navigate, refreshAll } = useDocPage();
  const { notify } = useNotice();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfCauses, setPdfCauses] = useState<string[] | null>(null);
  async function run(formats: Array<"pdf" | "docx"> = ["pdf"]) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setPdfCauses(null);
    try {
      const r: RenderResponse & Pick<RenderOutcomeInput, "partial" | "failedFormats"> = await renderDocument(id, { scope, key: keyName, formats });
      notify({ ...draftNotice(label, r), action: { label: "Lihat berkas", onClick: () => navigate({ tab: "berkas" }) } });
      refreshAll();
    } catch (e) {
      const pdf = pdfNotReadyOf(e);
      if (pdf) {
        setError(`${pdf.title}. ${pdf.body}`);
        setPdfCauses(pdf.causes);
        return;
      }
      const m = errorMessages(e);
      setError(`${m.title}. ${m.body}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-1">
      <Button size="sm" onClick={() => void run()} ariaDisabled={busy} className="whitespace-nowrap">
        {busy ? "Draf sedang dibuat…" : "Buat draf bagian ini"}
      </Button>
      {error && (
        <div role="alert" className="space-y-1 text-[12px]">
          <p className="text-[var(--down)]">{error}</p>
          {pdfCauses && pdfCauses.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-4 text-[var(--text-2)]">
              {pdfCauses.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          {pdfCauses && (
            <Button size="sm" onClick={() => void run(["docx"])} ariaDisabled={busy} className="whitespace-nowrap">
              {busy ? "Draf sedang dibuat…" : "Buat draf tanpa PDF (Word)"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ChapterChips({ slot, report, onOpen }: { slot: SlotStatusV2; report: CompletenessReportV2; onOpen: (key: string) => void }) {
  const prog = report.chapters?.[slot.slotKey];
  if (!prog) return null;
  const present = new Map(prog.present.map((p) => [p.key, p]));
  const keys = [...new Set([...prog.expected, ...prog.present.map((p) => p.key)])].sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
  const appendix = slot.sectionType === "appendix";
  if (keys.length === 0) {
    return <p className="text-[12px] text-[var(--text-2)]">{appendix ? "Belum ada lampiran." : "Belum ada bab. Agen akan mengirim bab pertama."}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={appendix ? "Lampiran" : "Bab"}>
      {keys.map((k) => {
        const p = present.get(k);
        const name = appendix ? `Lampiran ${k}` : `Bab ${k}`;
        return (
          <li key={k}>
            <button
              type="button"
              onClick={() => onOpen(k)}
              title={p ? `${name}: diisi oleh ${actorLabelWithId(p.by)}, ${formatDateTime(p.at)}` : `${name}: belum ada`}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                p
                  ? "border-[color-mix(in_srgb,var(--up)_35%,transparent)] text-[var(--text)]"
                  : "border-dashed border-[var(--down)] text-[var(--text-2)]"
              }`}
            >
              <span className="font-medium">{name}</span>
              <span className="text-[var(--text-2)]">
                {/* UI-02 (UA-M06): inisial agen tidak bermakna; jam saja, nama lengkap di tooltip. */}
                {p ? `· ${formatDateTime(p.at).split(", ")[1] ?? ""}` : "· belum ada"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CompletenessTab() {
  const { report, detail, navigate } = useDocPage();
  const { notify } = useNotice();
  const [copied, setCopied] = useState(false);
  const d = detail.data;

  if (!report || !d) {
    return (
      <Panel className="p-5">
        <EmptyState title="Rincian kelengkapan belum tersedia" hint="Dokumen ini dibuat dengan format lama. Kelengkapan per bagian muncul setelah agen mengirim versi baru." />
      </Panel>
    );
  }

  const rows = report.slots.filter((s) => s.state !== "OMITTED" || !s.required);
  const draftable = (s: SlotStatusV2) => s.sectionType !== "chapter" && s.sectionType !== "appendix" && s.state !== "OMITTED";

  async function copy() {
    const ok = await copyToClipboard(missingSummaryText(d!.document.title, d!.document.docNumber, report!));
    if (ok) {
      setCopied(true);
      notify({ message: "Ringkasan kekurangan disalin" });
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      notify({ message: "Ringkasan tidak dapat disalin otomatis. Pilih teks lalu salin manual.", tone: "warn" });
    }
  }

  return (
    <div className="space-y-4">
      <Panel className="p-0">
        <div className="overflow-x-auto">
          <table className="hidden w-full min-w-[640px] text-left text-[13px] md:table">
            <caption className="sr-only">Kelengkapan per bagian dokumen</caption>
            <thead className="border-b border-[var(--line)] text-[12px] text-[var(--text-2)]">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Bagian</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Diisi oleh</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Kapan</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {rows.map((s) => {
                const label = slotLabel(s.slotKey, s.label);
                const prog = report.chapters?.[s.slotKey];
                const auto = s.state === "AUTO_READY";
                return (
                  <tr key={s.slotKey} className="align-top">
                    <th scope="row" className="px-4 py-3 font-medium text-[var(--text)]">
                      <button
                        type="button"
                        onClick={() => navigate({ tab: "baca", target: s.slotKey })}
                        className="text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      >
                        {label}
                      </button>
                      {!s.required && <span className="ml-1.5 text-[11.5px] font-normal text-[var(--text-2)]">opsional</span>}
                    </th>
                    <td className="px-4 py-3">
                      <Pill tone={SLOT_STATE_TONE[s.state]}>{SLOT_STATE_LABEL[s.state]}</Pill>
                      {prog && (
                        <span className="ml-2 text-[12px] text-[var(--text-2)]">
                          {prog.present.length} dari {Math.max(prog.expected.length, prog.present.length)} bab
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-2)]" title={auto ? undefined : rawIdTitle(s.lastFilledBy)}>{auto ? "dibuat sistem" : slotFillerText(s.lastFilledBy)}</td>
                    <td className="px-4 py-3 text-[var(--text-2)]">{s.lastFilledAt ? formatDateTime(s.lastFilledAt) : "-"}</td>
                    <td className="px-4 py-3 text-[12px] text-[var(--text-2)]">
                      {draftable(s) ? <DraftButton scope="slot" keyName={s.slotKey} label={slotLabel(s.slotKey, s.label)} /> : prog ? <ChapterChips slot={s} report={report} onOpen={(k) => navigate({ tab: "baca", target: `${s.slotKey}:${k}` })} /> : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-[var(--line)] md:hidden">
          {rows.map((s) => {
            const prog = report.chapters?.[s.slotKey];
            return (
              <li key={s.slotKey} className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate({ tab: "baca", target: s.slotKey })}
                    className="text-left text-[13.5px] font-medium text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    {slotLabel(s.slotKey, s.label)}
                  </button>
                  <Pill tone={SLOT_STATE_TONE[s.state]}>{SLOT_STATE_LABEL[s.state]}</Pill>
                </div>
                <p className="text-[12px] text-[var(--text-2)]" title={s.state === "AUTO_READY" ? undefined : rawIdTitle(s.lastFilledBy)}>
                  {s.state === "AUTO_READY" ? "Dibuat sistem" : s.lastFilledBy ? `Diisi oleh ${actorLabel(s.lastFilledBy)}, ${formatDateTime(s.lastFilledAt)}` : "Belum ada pengisi"}
                </p>
                {prog && <ChapterChips slot={s} report={report} onOpen={(k) => navigate({ tab: "baca", target: `${s.slotKey}:${k}` })} />}
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="flex flex-wrap items-start gap-3">
        <Button onClick={() => void copy()} className="whitespace-nowrap">
          {copied ? <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> : <ClipboardCopy className="h-4 w-4" strokeWidth={2} aria-hidden />}
          Salin ringkasan kekurangan
        </Button>
        <InfoTeknis className="min-w-0 flex-1" summary="Info teknis kelengkapan" items={{ "Revisi laporan": report.revisionNo, "Kunci kurang": report.missingRequired.join(", ") }}>
          {report.forwardToController && <p className="whitespace-pre-wrap font-mono text-[11.5px] text-[var(--text)]">{report.forwardToController}</p>}
        </InfoTeknis>
      </div>
    </div>
  );
}

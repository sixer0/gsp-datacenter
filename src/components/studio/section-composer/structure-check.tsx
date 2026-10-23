"use client";

/*
 * Pemeriksaan susunan (UX-01 W4 "PEMERIKSAAN SUSUNAN"; R08). Dua lapis:
 * aturan susunan di browser (cermin register §4.7, seketika) dan validasi
 * bentuk di server (R08 `studio.skeleton/v1`, dijeda setelah perubahan).
 * Setiap masalah adalah kalimat awam yang menautkan ke kartu bagian; pesan
 * server mentah hanya di Info teknis (ADMIN).
 */
import { CheckCircle2, CircleAlert, Loader2, TriangleAlert } from "lucide-react";
import { Panel } from "@/components/ui/kit";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import type { StructureIssue } from "./model";

export type RemoteState =
  | { status: "checking" }
  | { status: "ok" }
  | { status: "invalid"; issues: StructureIssue[]; raw: string }
  | { status: "unavailable" };

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function StructureCheck({
  local,
  remote,
  labels,
  onFocusSlot,
}: {
  local: readonly StructureIssue[];
  remote: RemoteState;
  /** Nama bagian berurutan (untuk kalimat "Contoh dokumen tersusun ..."). */
  labels: readonly string[];
  onFocusSlot: (index: number) => void;
}) {
  const remoteIssues = remote.status === "invalid" ? remote.issues : [];
  const errors = [...local.filter((i) => i.level === "error"), ...remoteIssues];
  const warns = local.filter((i) => i.level === "warn");
  const passed = errors.length === 0 && remote.status !== "checking";

  return (
    <Panel className="p-5">
      <section aria-labelledby="pemeriksaan-susunan" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="pemeriksaan-susunan" className="text-[15px] font-semibold text-[var(--text)]">
            Pemeriksaan susunan
          </h2>
          {remote.status === "checking" && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-2)]">
              <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" strokeWidth={2} aria-hidden />
              Memeriksa…
            </span>
          )}
        </div>

        {passed && (
          <p className="mt-2 flex items-start gap-2 text-[13px] text-[var(--text)]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--up)]" strokeWidth={2} aria-hidden />
            <span>
              Lolos. Contoh dokumen tersusun {labels.length.toLocaleString("id-ID")} bagian: {labels.join(", ")}.
            </span>
          </p>
        )}

        {errors.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {errors.map((i, n) => (
              <li key={`e${n}`} className="flex items-start gap-2 text-[13px] text-[var(--text)]">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--down)]" strokeWidth={2} aria-hidden />
                <IssueText issue={i} onFocusSlot={onFocusSlot} />
              </li>
            ))}
          </ul>
        )}

        {warns.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {warns.map((i, n) => (
              <li key={`w${n}`} className="flex items-start gap-2 text-[13px] text-[var(--text-2)]">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" strokeWidth={2} aria-hidden />
                <IssueText issue={i} onFocusSlot={onFocusSlot} />
              </li>
            ))}
          </ul>
        )}

        {remote.status === "unavailable" && (
          <p className="mt-2 text-[12.5px] text-[var(--text-2)]">
            Pemeriksaan di server belum dapat dijalankan; pemeriksaan di browser tetap berlaku dan server memeriksa lagi saat menyimpan.
          </p>
        )}
        {remote.status === "invalid" && remote.raw && <InfoTeknis className="mt-3" items={{ "Rincian server": remote.raw }} />}
      </section>
    </Panel>
  );
}

function IssueText({ issue, onFocusSlot }: { issue: StructureIssue; onFocusSlot: (i: number) => void }) {
  if (issue.index === undefined) return <span>{issue.message}</span>;
  return (
    <button type="button" onClick={() => onFocusSlot(issue.index!)} className={`text-left underline decoration-[var(--line-strong)] underline-offset-2 hover:decoration-[var(--accent)] ${FOCUS}`}>
      {issue.message}
    </button>
  );
}

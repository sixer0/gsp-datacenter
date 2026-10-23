"use client";

/*
 * Kartu kesiapan mesin cetak (S102; W12 FIX-4b, judul awam kamus UX-01 §1.2):
 * ringkasan siap/tidak, "Mesin cetak Word/PDF" (LibreOffice), "Huruf
 * terpasang", "Pembuat PDF dari halaman web" (Chromium), "Antrean",
 * petunjuk perbaikan, dan tabel huruf. Jalur, sidik berkas, dan galat mentah
 * hanya di Info teknis (ADMIN).
 */

import { useId, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleSlash, Info, XCircle } from "lucide-react";
import { Panel, Pill } from "@/components/ui/kit";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { formatDateTime } from "@/components/studio/shared/labels";
import { deriveHints, type FixHint, type HintSeverity } from "./hints";
import type { RenderEnvFontStatus, RenderEnvStatusResponse } from "./types";

type Tone = "up" | "down" | "warn" | "neutral" | "accent";

function StatusIcon({ ok, warn = false }: { ok: boolean; warn?: boolean }) {
  if (ok) return <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--up)]" aria-hidden />;
  if (warn) return <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--warn)]" aria-hidden />;
  return <XCircle className="h-4 w-4 shrink-0 text-[var(--down)]" aria-hidden />;
}

function CheckCard({
  title,
  tone,
  state,
  children,
}: {
  title: string;
  tone: Tone;
  state: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[13.5px] font-semibold text-[var(--text)]">{title}</h3>
        <Pill tone={tone}>{state}</Pill>
      </div>
      <div className="mt-3 space-y-1.5 text-[12.5px] text-[var(--text-2)]">{children}</div>
    </Panel>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[var(--text-2)]">{label}</span>
      <span className="text-right font-medium text-[var(--text)]">{children}</span>
    </div>
  );
}

const HINT_TONE: Record<HintSeverity, string> = {
  error: "var(--down)",
  warn: "var(--warn)",
  info: "var(--accent)",
};

function HintCard({ hint }: { hint: FixHint }) {
  const Icon = hint.severity === "info" ? Info : hint.severity === "warn" ? AlertTriangle : XCircle;
  const color = HINT_TONE[hint.severity];
  return (
    <li
      className="rounded-lg p-4"
      style={{ border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`, background: `color-mix(in srgb, ${color} 6%, transparent)` }}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} aria-hidden />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[var(--text)]">{hint.title}</p>
          {hint.detail && <p className="mt-1 text-[12.5px] text-[var(--text-2)]">{hint.detail}</p>}
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[12.5px] text-[var(--text-2)]">
            {hint.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {hint.technical && hint.technical.length > 0 && (
            <InfoTeknis className="mt-2" items={Object.fromEntries(hint.technical.map((t, i) => [`Rincian ${i + 1}`, t]))} />
          )}
        </div>
      </div>
    </li>
  );
}

function YesNo({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusIcon ok={ok} />
      <span className={ok ? "text-[var(--text-2)]" : "font-medium text-[var(--down)]"}>{ok ? yes : no}</span>
    </span>
  );
}

function FontTable({ fonts }: { fonts: RenderEnvFontStatus[] }) {
  const [onlyProblems, setOnlyProblems] = useState(false);
  const toggleId = useId();
  const shown = onlyProblems ? fonts.filter((f) => !f.ok) : fonts;
  const problems = fonts.filter((f) => !f.ok).length;
  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[13.5px] font-semibold text-[var(--text)]">Rincian huruf ({fonts.length})</h3>
        <label htmlFor={toggleId} className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-[var(--text-2)]">
          <input
            id={toggleId}
            type="checkbox"
            checked={onlyProblems}
            onChange={(e) => setOnlyProblems(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Hanya yang bermasalah ({problems})
        </label>
      </div>
      {fonts.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-[var(--text-2)]">Daftar huruf tidak tersedia karena daftar acuan lingkungan cetak tidak terbaca.</p>
      ) : shown.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-[var(--text-2)]">Semua huruf siap dipakai.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
            <caption className="sr-only">Status setiap huruf: berkas, kecocokan sidik berkas, dan pemuatan oleh Windows</caption>
            <thead>
              <tr className="border-b border-[var(--line)] text-[11.5px] uppercase tracking-wide text-[var(--text-2)]">
                <th scope="col" className="py-2 pr-3 font-medium">Keluarga</th>
                <th scope="col" className="py-2 pr-3 font-medium">Gaya</th>
                <th scope="col" className="py-2 pr-3 font-medium">Berkas</th>
                <th scope="col" className="py-2 pr-3 font-medium">Ada di disk</th>
                <th scope="col" className="py-2 pr-3 font-medium">Sidik cocok</th>
                <th scope="col" className="py-2 font-medium">Dimuat Windows</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((f) => (
                <tr key={`${f.family}|${f.style}`} className="border-b border-[var(--line)] last:border-0">
                  <th scope="row" className="py-2 pr-3 font-medium text-[var(--text)]">
                    {f.family}
                    {!f.required && <span className="ml-1.5 text-[11px] font-normal text-[var(--text-2)]">(opsional)</span>}
                  </th>
                  <td className="py-2 pr-3 text-[var(--text-2)]">{f.style}</td>
                  <td className="py-2 pr-3 font-mono text-[11.5px] text-[var(--text-2)]">{f.file ?? "-"}</td>
                  <td className="py-2 pr-3">
                    <YesNo ok={f.fileExists} yes="Ya" no="Tidak ada" />
                  </td>
                  <td className="py-2 pr-3">
                    {f.fileExists ? <YesNo ok={f.sha256Ok} yes="Cocok" no="Berbeda" /> : <span className="text-[var(--text-2)]">-</span>}
                  </td>
                  <td className="py-2">
                    <YesNo ok={f.registered} yes="Ya" no="Belum (masuk ulang Windows)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function ReadinessSection({ data }: { data: RenderEnvStatusResponse }) {
  const { readiness, fonts, queue, manifest } = data;
  const required = fonts.filter((f) => f.required);
  const fontsOk = required.filter((f) => f.ok).length;
  const allFontsOk = required.length > 0 && fontsOk === required.length;
  const hints = deriveHints(data);
  const sofficeOk = readiness.soffice.found && readiness.soffice.versionOk;

  return (
    <section aria-labelledby="readiness-heading" className="space-y-4">
      <h2 id="readiness-heading" className="sr-only">
        Kesiapan mesin cetak
      </h2>

      <div
        role="status"
        className="flex flex-wrap items-center gap-3 rounded-lg p-4"
        style={{
          border: `1px solid color-mix(in srgb, ${readiness.ready ? "var(--up)" : "var(--down)"} 30%, transparent)`,
          background: `color-mix(in srgb, ${readiness.ready ? "var(--up)" : "var(--down)"} 7%, transparent)`,
        }}
      >
        {readiness.ready ? (
          <CheckCircle2 className="h-5 w-5 text-[var(--up)]" aria-hidden />
        ) : (
          <CircleSlash className="h-5 w-5 text-[var(--down)]" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[var(--text)]">
            {readiness.ready ? "Mesin cetak siap" : "Mesin cetak belum siap"}
          </p>
          <p className="text-[12.5px] text-[var(--text-2)]">
            {readiness.ready
              ? "Word, halaman web, dan PDF dapat dibuat."
              : "PDF tidak dibuat sampai masalah di bawah diperbaiki. Word dan halaman web tetap dibuat (status: Sebagian berkas siap)."}
          </p>
        </div>
        <span className="text-[12px] text-[var(--text-2)]">
          Diperiksa {formatDateTime(readiness.checkedAt)}
          {data.refreshed ? " (baru diperiksa ulang)" : ""}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CheckCard
          title="Mesin cetak Word/PDF"
          tone={sofficeOk ? "up" : "down"}
          state={!readiness.soffice.found ? "Tidak ditemukan" : readiness.soffice.versionOk ? "Siap" : "Versi salah"}
        >
          <Row label="LibreOffice terpasang">{readiness.soffice.version ?? "-"}</Row>
          <Row label="Diperlukan">{manifest.sofficeVersion ?? "24.2.3.2"}</Row>
        </CheckCard>
        <CheckCard
          title={`Huruf terpasang (${required.length})`}
          tone={allFontsOk ? "up" : "down"}
          state={allFontsOk ? "Siap" : `${required.length - fontsOk} bermasalah`}
        >
          <Row label="Siap">
            {fontsOk} dari {required.length} wajib
          </Row>
          <Row label="Belum dimuat Windows">{required.filter((f) => f.fileExists && !f.registered).length}</Row>
          <Row label="Berkas hilang/berbeda">{required.filter((f) => !f.fileExists || !f.sha256Ok).length}</Row>
        </CheckCard>
        <CheckCard
          title="Pembuat PDF dari halaman web"
          tone={readiness.chromium.found ? "up" : "warn"}
          state={readiness.chromium.found ? "Ditemukan" : "Tidak ditemukan"}
        >
          <Row label="Chromium yang diharapkan">{manifest.chromiumVersion ?? "-"}</Row>
          <p className="text-[12px] text-[var(--text-2)]">Hanya dilaporkan; kesiapan PDF utama tidak bergantung padanya.</p>
        </CheckCard>
        <CheckCard
          title="Antrean"
          tone={queue.queued > 0 ? "warn" : queue.active > 0 ? "accent" : "neutral"}
          state={queue.queued > 0 ? `${queue.queued} menunggu` : queue.active > 0 ? "Sibuk" : "Kosong"}
        >
          <Row label="Sedang dikerjakan">
            {queue.active} dari {queue.max}
          </Row>
          <Row label="Menunggu giliran">{queue.queued}</Row>
          <p className="text-[12px] text-[var(--text-2)]">Antrean pembuatan PDF milik proses server ini.</p>
        </CheckCard>
      </div>

      {hints.length > 0 && (
        <Panel className="p-5">
          <h3 className="text-[13.5px] font-semibold text-[var(--text)]">Langkah perbaikan</h3>
          <ul className="mt-3 space-y-3">
            {hints.map((h) => (
              <HintCard key={h.id} hint={h} />
            ))}
          </ul>
          <InfoTeknis
            className="mt-4"
            summary={`Info teknis (${readiness.errors.length} pesan)`}
            items={Object.fromEntries(readiness.errors.map((e, i) => [`Pesan ${i + 1}`, e]))}
          />
        </Panel>
      )}

      <FontTable fonts={fonts} />

      <InfoTeknis
        items={{
          "Daftar acuan": manifest.path,
          Disusun: manifest.createdAt ? formatDateTime(manifest.createdAt) : null,
          "Sidik daftar acuan": readiness.manifestSha256,
        }}
      />
    </section>
  );
}

"use client";

/*
 * Tampilan bagian tak-berbab di Lembar baca (SR-30; UX-01 §3c): bagian
 * otomatis (Sampul, Daftar isi) = kartu ringkas "Dibuat otomatis saat berkas
 * dibuat"; bagian kosong = placeholder bergaris putus-putus; bagian terisi =
 * ringkasan isi yang dapat dibaca (tanda tangan, daftar sumber, lembar
 * kendali, sampul). Isi bagian ini dikirim agen; penyuntingannya di luar v2.1.
 */
import type { InlineV2 } from "@/lib/studio/contract";
import type { StudioSlotState } from "@/lib/studio/contract/enums";
import { InlineText } from "./blocks";

function isInline(v: unknown): v is InlineV2 {
  return !!v && typeof v === "object" && (typeof (v as { text?: unknown }).text === "string" || Array.isArray((v as { runs?: unknown }).runs));
}

function Line({ label, value }: { label: string; value: unknown }) {
  if (!isInline(value)) return null;
  return (
    <p>
      <span className="mr-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--studio-ink-2)]">{label}</span>
      <InlineText value={value} />
    </p>
  );
}

function countOf(v: unknown): number | null {
  if (Array.isArray(v)) return v.length;
  if (v && typeof v === "object" && Array.isArray((v as { rows?: unknown }).rows)) return ((v as { rows: unknown[] }).rows.length || 1) - 1;
  return null;
}

function PayloadSummary({ sectionType, payload, onOpenPdf }: { sectionType: string; payload: Record<string, unknown>; onOpenPdf?: () => void }) {
  switch (sectionType) {
    case "signatureBlock": {
      const roles = Array.isArray(payload.roles) ? (payload.roles as Array<{ role?: InlineV2; holder?: InlineV2; date?: InlineV2 }>) : [];
      return (
        <ul className="grid gap-3 sm:grid-cols-2">
          {roles.map((r, i) => (
            <li key={i} className="rounded-[6px] border border-[color-mix(in_srgb,var(--studio-ink)_15%,transparent)] px-3 py-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--studio-ink-2)]">{isInline(r.role) && <InlineText value={r.role} />}</p>
              <p className="mt-1">{isInline(r.holder) && <InlineText value={r.holder} />}</p>
              {isInline(r.date) && (
                <p className="text-[12px] text-[var(--studio-ink-2)]">
                  <InlineText value={r.date} />
                </p>
              )}
            </li>
          ))}
        </ul>
      );
    }
    case "sourceRegister": {
      const entries = Array.isArray(payload.entries) ? (payload.entries as Array<{ citation?: InlineV2 }>) : [];
      return (
        <ol className="list-decimal space-y-1 pl-6 text-[13.5px]">
          {entries.map((e, i) => (
            <li key={i}>{isInline(e.citation) && <InlineText value={e.citation} />}</li>
          ))}
        </ol>
      );
    }
    case "controlSheet": {
      const rev = countOf(payload.revisionHistory);
      const ver = countOf(payload.verificationChain);
      const dist = countOf(payload.distribution);
      return (
        <div className="space-y-1.5">
          <Line label="Judul" value={payload.title} />
          <Line label="Metode" value={payload.methodStatement} />
          <ul className="text-[13px] text-[var(--studio-ink-2)]">
            {rev !== null && <li>Riwayat revisi: {rev} entri</li>}
            {ver !== null && <li>Rantai verifikasi: {ver} entri</li>}
            {dist !== null && <li>Distribusi: {dist} salinan</li>}
          </ul>
          <SummaryHint onOpenPdf={onOpenPdf} />
        </div>
      );
    }
    case "cover": {
      const lines = Array.isArray(payload.titleLines) ? (payload.titleLines as unknown[]) : [];
      return (
        <div className="space-y-1.5">
          <Line label="Tagline" value={payload.tagline} />
          {lines.filter(isInline).map((l, i) => (
            <p key={i} className="text-[18px] font-semibold leading-snug">
              <InlineText value={l} />
            </p>
          ))}
          <Line label="Pengantar" value={payload.standfirst} />
          <Line label="Lingkup" value={payload.scopeLine} />
          <SummaryHint onOpenPdf={onOpenPdf} />
        </div>
      );
    }
    default:
      return <SummaryHint onOpenPdf={onOpenPdf} />;
  }
}

function SummaryHint({ onOpenPdf }: { onOpenPdf?: () => void }) {
  return onOpenPdf ? (
    <button
      type="button"
      onClick={onOpenPdf}
      className="text-[12px] font-medium text-[var(--studio-ink)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      Lihat tampilan lengkap di PDF
    </button>
  ) : (
    <p className="text-[12px] text-[var(--studio-ink-2)]">Tampilan lengkap tersedia setelah berkas dibuat.</p>
  );
}

export function SlotView({
  label,
  sectionType,
  state,
  payload,
  onOpenPdf,
}: {
  label: string;
  sectionType: string;
  state: StudioSlotState;
  payload: Record<string, unknown> | null;
  onOpenPdf?: () => void;
}) {
  if (state === "AUTO_READY" && !payload) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-[color-mix(in_srgb,var(--studio-ink)_15%,transparent)] bg-[color-mix(in_srgb,var(--studio-ink)_4%,transparent)] px-4 py-3">
        <p className="text-[13px]">{label} dibuat otomatis saat berkas dibuat.</p>
        <SummaryHint onOpenPdf={onOpenPdf} />
      </div>
    );
  }
  if (state === "EMPTY" || state === "OPTIONAL_EMPTY" || !payload) {
    return (
      <div className="rounded-[6px] border border-dashed border-[color-mix(in_srgb,var(--studio-ink)_35%,transparent)] px-4 py-4 text-[13px] text-[var(--studio-ink-2)]">
        {label} belum diisi.{" "}
        {state === "OPTIONAL_EMPTY" ? "Bagian ini opsional." : "Agen akan mengisinya, atau minta pengisian lewat controller."}
      </div>
    );
  }
  return <PayloadSummary sectionType={sectionType} payload={payload} onOpenPdf={onOpenPdf} />;
}

"use client";

/*
 * Rel kelengkapan — elemen khas Studio (FIX-4a; UX-01 §1.3, P4; blueprint §2.6).
 *
 * Satu pita horizontal dibagi per bagian dokumen sesuai urutan susunan; bagian
 * berbab (berulang) dibagi lagi per bab yang diharapkan. Status dibedakan
 * dengan warna DAN pola (WCAG 1.4.1). Tiga ukuran:
 *   - `list`: 6 px, baris daftar dokumen (tanpa fokus per segmen; baris = satu tautan);
 *   - `md`:   10 px + label di bawah, kepala halaman dokumen; segmen dapat difokus,
 *             tooltip (label, status, pengisi, waktu), klik -> `onSegmentClick`;
 *   - `sm`:   pita 6 px + daftar kekurangan, kartu "Buat berkas".
 *
 * Masukan = ringkasan kelengkapan KONTRAK murni (`CompletenessSummary`,
 * `src/lib/studio/contract/types/v2/completeness.ts`). `CompletenessReportV2`
 * penuh juga sah (penjaga kompilasi di kontrak), jadi pemanggil meneruskan
 * laporan apa adanya tanpa adaptor (FIX-U, IP-57). Bagian berulang (bab,
 * lampiran) dibaca dari `chapters.<slotKey>` (KD-15); medan lama `content`
 * tidak diterima lagi.
 * `buildRailSegments` adalah satu-satunya titik pemetaan.
 */
import { useId, useState } from "react";
import type { StudioSlotState } from "@/lib/studio/contract/enums";
import type {
  ChapterProgressSummary,
  CompletenessSlotSummary,
  CompletenessSummary as ContractCompletenessSummary,
} from "@/lib/studio/contract/types/v2";
import { COMPLETENESS_STATUS_LABEL, SLOT_STATE_LABEL, actorLabel, actorLabelWithId, formatDateTime, missingLabels, repeatItemLabel, slotLabel } from "./labels";
import { progressText, requiredProgress } from "./completeness-text";

// ── Tipe (kontrak SR-04) ─────────────────────────────────────────────────

export type SlotState = StudioSlotState;
export type { CompletenessSlotSummary, ChapterProgressSummary };

/** Ringkasan kelengkapan kontrak (tanpa medan tambahan lokal). */
export type CompletenessSummary = ContractCompletenessSummary;

// ── Pemetaan murni (dapat diuji tanpa React) ─────────────────────────────

export interface RailSegment {
  /** Kunci stabil: slotKey atau `slotKey:bab`. */
  key: string;
  slotKey: string;
  chapterKey?: string;
  label: string;
  state: Exclude<SlotState, "OMITTED">;
  required: boolean;
  by: string | null;
  at: string | null;
}

const DONE: ReadonlySet<SlotState> = new Set<SlotState>(["FILLED", "AUTO_READY"]);

/** Kemajuan bab per slot berulang dari `chapters` kontrak. */
function chapterGroups(summary: CompletenessSummary): Map<string, ChapterProgressSummary> {
  const out = new Map<string, ChapterProgressSummary>();
  for (const [slotKey, prog] of Object.entries(summary.chapters ?? {})) {
    if (prog) out.set(slotKey, prog);
  }
  return out;
}

function chapterKeys(c: ChapterProgressSummary): string[] {
  if (c.expected && c.expected.length) return c.expected;
  const keys = new Set<string>([...(c.present ?? []).map((p) => p.key), ...c.missing]);
  return [...keys].sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
}

/**
 * Ringkasan -> segmen rel dalam urutan susunan. `OMITTED` tidak digambar.
 * Bagian berbab dipecah per bab: ada = Terisi, tidak ada = Belum diisi
 * (bila bagian wajib) atau Opsional, kosong.
 */
export function buildRailSegments(summary: CompletenessSummary): RailSegment[] {
  const groups = chapterGroups(summary);
  const out: RailSegment[] = [];
  for (const slot of summary.slots) {
    if (slot.state === "OMITTED") continue;
    const prog = groups.get(slot.slotKey);
    if (prog) {
      const keys = chapterKeys(prog);
      if (keys.length > 0) {
        const missing = new Set(prog.missing);
        const present = new Map((prog.present ?? []).map((p) => [p.key, p]));
        for (const k of keys) {
          const p = present.get(k);
          const isMissing = missing.has(k) || (!p && prog.present !== undefined);
          out.push({
            key: `${slot.slotKey}:${k}`,
            slotKey: slot.slotKey,
            chapterKey: k,
            label: repeatItemLabel(slot, k),
            state: isMissing ? (slot.required ? "EMPTY" : "OPTIONAL_EMPTY") : "FILLED",
            required: slot.required,
            by: p?.by ?? null,
            at: p?.at ?? null,
          });
        }
        continue;
      }
    }
    out.push({
      key: slot.slotKey,
      slotKey: slot.slotKey,
      label: slotLabel(slot.slotKey, slot.label),
      state: slot.state,
      required: slot.required,
      by: slot.lastFilledBy ?? null,
      at: slot.lastFilledAt ?? null,
    });
  }
  return out;
}

/** Label kekurangan awam (pemeta tunggal `labels.missingLabels`, L5). */
export function describeMissing(summary: Pick<CompletenessSummary, "missingRequired" | "slots" | "chapters">): string[] {
  return missingLabels(summary);
}

export interface RailStats {
  done: number;
  total: number;
  missing: string[];
}

export function railStats(segments: readonly RailSegment[]): RailStats {
  return {
    done: segments.filter((s) => DONE.has(s.state)).length,
    total: segments.length,
    missing: segments.filter((s) => s.state === "EMPTY" || s.state === "PARTIAL").map((s) => s.label),
  };
}

/**
 * "5 dari 6 bagian wajib terisi, 1 opsional kosong; belum diisi: Lembar kendali".
 * UI-04 (L-3): angka sama dengan teks terlihat (`requiredProgress`), bukan semua segmen.
 */
export function railAriaLabel(segments: readonly RailSegment[]): string {
  const { missing } = railStats(segments);
  const p = requiredProgress(segments);
  const n = (x: number) => x.toLocaleString("id-ID");
  const head = `${n(p.requiredDone)} dari ${n(p.requiredTotal)} bagian wajib terisi${p.optionalEmpty > 0 ? `, ${n(p.optionalEmpty)} opsional kosong` : ""}`;
  return missing.length ? `${head}; belum diisi: ${missing.join(", ")}` : head;
}

// ── Tampilan ─────────────────────────────────────────────────────────────

/** Warna + pola per status (§1.3); bukan hanya warna. */
function segmentStyle(state: RailSegment["state"]): React.CSSProperties {
  switch (state) {
    case "FILLED":
      return { background: "var(--up)" };
    case "AUTO_READY":
      return { background: "color-mix(in srgb, var(--accent) 60%, transparent)" };
    case "PARTIAL":
      return {
        background:
          "repeating-linear-gradient(135deg, var(--warn) 0 3px, color-mix(in srgb, var(--warn) 25%, transparent) 3px 6px)",
      };
    case "EMPTY":
      return { background: "transparent", border: "1px dashed var(--down)" };
    case "OPTIONAL_EMPTY":
      return { background: "transparent", border: "1px solid var(--line-strong)" };
  }
}

/** UI-02 (UA-m13): legenda kecil arti segmen bilah (warna + pola), sekali di atas daftar. */
export function RailLegend({ className = "" }: { className?: string }) {
  const items: ReadonlyArray<RailSegment["state"]> = ["FILLED", "AUTO_READY", "PARTIAL", "EMPTY", "OPTIONAL_EMPTY"];
  return (
    <ul aria-label="Arti warna bilah kelengkapan" className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-[var(--text-2)] ${className}`}>
      {items.map((st) => (
        <li key={st} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-[6px] w-4 rounded-[2px]" style={segmentStyle(st)} />
          {SLOT_STATE_LABEL[st]}
        </li>
      ))}
    </ul>
  );
}

export type RailSize = "list" | "md" | "sm";

export interface CompletenessRailProps {
  summary: CompletenessSummary;
  size?: RailSize;
  /** `md`: klik/Enter segmen -> bawa ke bagian itu (tab Baca). */
  onSegmentClick?: (segment: RailSegment) => void;
  className?: string;
}

const HEIGHT: Record<RailSize, string> = { list: "h-[6px]", sm: "h-[6px]", md: "h-[10px]" };

export function CompletenessRail({ summary, size = "md", onSegmentClick, className = "" }: CompletenessRailProps) {
  const segments = buildRailSegments(summary);
  const aria = railAriaLabel(segments);
  const stats = railStats(segments);
  const tipId = useId();
  const [hover, setHover] = useState<string | null>(null);

  if (segments.length === 0) return null;

  const interactive = size === "md";
  const bar = (
    <div className={`flex w-full items-stretch gap-[2px] ${HEIGHT[size]}`}>
      {segments.map((seg) => {
        const style = segmentStyle(seg.state);
        const full = `${seg.label}: ${SLOT_STATE_LABEL[seg.state]}${seg.by ? `, diisi oleh ${actorLabelWithId(seg.by)}` : ""}${seg.at ? `, ${formatDateTime(seg.at)}` : ""}`;
        if (!interactive) {
          return <span key={seg.key} className="min-w-[3px] flex-1 rounded-[2px] motion-safe:transition-[background-color,border-color] motion-safe:duration-300" style={style} />;
        }
        const shown = hover === seg.key;
        return (
          <span key={seg.key} className="relative flex min-w-[6px] flex-1">
            <button
              type="button"
              aria-label={full}
              aria-describedby={shown ? tipId : undefined}
              onClick={() => onSegmentClick?.(seg)}
              onMouseEnter={() => setHover(seg.key)}
              onMouseLeave={() => setHover((h) => (h === seg.key ? null : h))}
              onFocus={() => setHover(seg.key)}
              onBlur={() => setHover((h) => (h === seg.key ? null : h))}
              className="w-full rounded-[2px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--accent)] motion-safe:transition-[background-color,border-color] motion-safe:duration-300"
              style={style}
            />
            {shown && (
              <span
                id={tipId}
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-20 w-max max-w-[16rem] -translate-x-1/2 rounded-md border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[11.5px] leading-snug text-[var(--text)] shadow-lg"
              >
                <span className="block font-medium">{seg.label}</span>
                <span className="block text-[var(--text-2)]">
                  {SLOT_STATE_LABEL[seg.state]}
                  {seg.by ? ` · ${actorLabel(seg.by)}` : ""}
                  {seg.at ? ` · ${formatDateTime(seg.at)}` : ""}
                </span>
                {/* UI-04 (M-2): ID mentah pengisi tetap terbaca (nama tampilan lossy). */}
                {seg.by && seg.by.trim() !== actorLabel(seg.by) && <span className="block break-all font-mono text-[10.5px] text-[var(--text-3)]">ID: {seg.by.trim()}</span>}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );

  if (size === "list") {
    return (
      <div role="img" aria-label={aria} className={className}>
        {bar}
      </div>
    );
  }

  if (size === "sm") {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div role="img" aria-label={aria}>
          {bar}
        </div>
        {stats.missing.length > 0 ? (
          <p className="text-[12px] text-[var(--text-2)]">Belum: {stats.missing.join(", ")}</p>
        ) : (
          <p className="text-[12px] text-[var(--text-2)]">Semua bagian wajib terisi.</p>
        )}
      </div>
    );
  }

  // md: segmen interaktif -> `group` berlabel (anak `role="img"` tidak boleh interaktif).
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div role="group" aria-label={`Kelengkapan dokumen: ${aria}`}>
        {bar}
      </div>
      <p className="text-[12px] text-[var(--text-2)]">
        <span className="font-medium text-[var(--text)]">{COMPLETENESS_STATUS_LABEL[summary.status]}</span>
        {" · "}
        {/* UI-02 (UA-M05): hitung bagian wajib; opsional kosong disebut, bukan dihitung kurang. */}
        <span className="num">{progressText(requiredProgress(segments))}</span>
        {summary.revisionNo !== undefined ? ` · versi ${summary.revisionNo.toLocaleString("id-ID")}` : ""}
      </p>
    </div>
  );
}

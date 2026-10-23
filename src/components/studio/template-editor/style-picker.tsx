"use client";

/**
 * Pemilih gaya (UX-01 §3a langkah 0-1, W2 dialog + W3 tab Gaya). Kartu radio
 * dengan gambar mini halaman: proporsi kertas, kerapatan margin, dan warna
 * aksen dibaca dari nilai gaya itu sendiri (R02 `resolvedParams` versi
 * terbaru), jadi gambar mini mengatakan sesuatu yang benar tentang gaya.
 * Gaya terbatas (mis. Manual 000) hanya tampil untuk ADMIN.
 */
import { useCallback } from "react";
import { Lock } from "lucide-react";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import { PAPER_SIZE_MM, type PaperSize } from "@/lib/studio/contract/enums";
import { Pill } from "@/components/ui/kit";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { getTemplateDetail, type PresetItem } from "./api";

/**
 * Ukuran kertas mm (lebar x tinggi tegak) = tabel kontrak E38 `PAPER_SIZE_MM`
 * (L4: tanpa salinan lokal yang dibulatkan). Dipertahankan sebagai alias ekspor.
 */
export const PAPER_MM: Readonly<Record<string, readonly [number, number]>> = PAPER_SIZE_MM;

const MARGIN_FACTOR: Readonly<Record<string, number>> = { compact: 0.75, standard: 1, wide: 1.25 };

export interface PagePortrait {
  /** Nama kertas (E38), atau "Ukuran khusus" bila `page.customSizeMm` diisi. */
  paper: string;
  landscape: boolean;
  /** Ukuran halaman tampil (mm, sudah sesuai orientasi). */
  sizeMm: readonly [number, number];
  accent: string | null;
  margin: number;
}

function str(v: ParamValue | undefined): string | null {
  return typeof v === "string" && v ? v : null;
}

function mmPair(v: ParamValue | undefined): readonly [number, number] | null {
  return Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === "number" && Number.isFinite(n) && n > 0)
    ? [v[0] as number, v[1] as number]
    : null;
}

function isPaperSize(v: string | null): v is PaperSize {
  return v !== null && Object.prototype.hasOwnProperty.call(PAPER_SIZE_MM, v);
}

/**
 * Gambar mini dari nilai parameter (tanpa nilai = A4 tegak, margin sedang).
 * Ukuran: `page.sizeMm` efektif (turunan, sudah berorientasi) bila ada; selain
 * itu `page.customSizeMm ?? PAPER_SIZE_MM[page.size]`, ditukar bila mendatar
 * (aturan yang sama dengan `page.sizeMm`, `params/page.ts` P4G-01).
 */
export function portraitOf(params: Readonly<Record<string, ParamValue>> | null | undefined): PagePortrait {
  const p = params ?? {};
  const named = str(p["page.size"]);
  const custom = mmPair(p["page.customSizeMm"]);
  const landscape = p["page.orientation"] === "landscape";
  const accent = str(p["color.interior.signal"]);
  const base = custom ?? PAPER_SIZE_MM[isPaperSize(named) ? named : "A4"];
  const oriented: readonly [number, number] = landscape ? [base[1], base[0]] : base;
  return {
    paper: custom ? "Ukuran khusus" : isPaperSize(named) ? named : "A4",
    landscape,
    sizeMm: mmPair(p["page.sizeMm"]) ?? oriented,
    accent: accent && /^#[0-9a-fA-F]{3,8}$/.test(accent) ? accent : null,
    margin: MARGIN_FACTOR[str(p["grid.marginDensity"]) ?? "standard"] ?? 1,
  };
}

/** Halaman mini (dekoratif; maknanya disampaikan teks di sampingnya). */
export function MiniPage({ portrait, className = "" }: { portrait: PagePortrait; className?: string }) {
  const [pw, ph] = portrait.sizeMm;
  const pad = `${(10 * portrait.margin).toFixed(1)}%`;
  const accent = portrait.accent ?? "var(--accent)";
  return (
    <div aria-hidden className={`flex items-center justify-center ${className}`}>
      <div
        className="relative h-full overflow-hidden rounded-[3px] shadow-[0_1px_6px_rgba(0,0,0,0.35)] transition-[aspect-ratio] duration-300 motion-reduce:transition-none"
        style={{ aspectRatio: `${pw} / ${ph}`, background: "var(--studio-paper)", padding: pad, width: "auto", maxWidth: "100%" }}
      >
        <div className="flex h-full flex-col gap-[6%]">
          <div className="h-[3%] min-h-[2px] w-[38%] rounded-full" style={{ background: accent }} />
          <div className="h-[5%] min-h-[3px] w-[72%] rounded-[1px] bg-[var(--studio-ink)] opacity-80" />
          <div className="flex flex-1 flex-col gap-[5%] pt-[4%]">
            {[92, 100, 86, 97, 64].map((n, i) => (
              <div key={i} className="h-[2.4%] min-h-[1px] rounded-full bg-[var(--studio-ink-2)] opacity-45" style={{ width: `${n}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ORIENT_LABEL = (landscape: boolean) => (landscape ? "mendatar" : "tegak");

function StyleCard({
  preset,
  name,
  checked,
  disabled,
  onChange,
}: {
  preset: PresetItem;
  name: string;
  checked: boolean;
  disabled: boolean;
  onChange: (slug: string) => void;
}) {
  const fetcher = useCallback((signal: AbortSignal) => getTemplateDetail(preset.id, undefined, signal), [preset.id]);
  const q = useStudioQuery(`template-editor:preset-thumb:${preset.id}:${preset.latestVersionNo}`, fetcher, { source: "template-editor.preset-thumb" });
  const portrait = portraitOf(q.data?.version.resolvedParams);
  return (
    <label
      className={`group relative flex cursor-pointer flex-col gap-2 rounded-[12px] border p-3 transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
        checked ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input type="radio" name={name} value={preset.slug} checked={checked} disabled={disabled} onChange={() => onChange(preset.slug)} className="sr-only" />
      <div className={`h-28 rounded-[8px] bg-[var(--surface-2)] p-3 ${q.isLoading ? "opacity-60" : ""}`}>
        <MiniPage portrait={portrait} className="h-full" />
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13.5px] font-medium text-[var(--text)]">{preset.name}</span>
          <span
            aria-hidden
            className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border ${checked ? "border-[var(--accent)] bg-[var(--accent)] shadow-[inset_0_0_0_2px_var(--surface-1)]" : "border-[var(--line-strong)]"}`}
          />
        </div>
        <p className="mt-0.5 text-[12px] text-[var(--text-2)]">
          {portrait.paper} {ORIENT_LABEL(portrait.landscape)}
          {preset.description ? ` · ${preset.description}` : ""}
        </p>
        {preset.restricted && (
          <Pill tone="warn" className="mt-1.5">
            <Lock className="h-3 w-3" strokeWidth={2} aria-hidden /> Terbatas, khusus admin
          </Pill>
        )}
      </div>
    </label>
  );
}

export interface StylePickerProps {
  presets: readonly PresetItem[];
  value: string | null;
  onChange: (slug: string) => void;
  isAdmin: boolean;
  /** Nama grup radio (unik per halaman). */
  name: string;
  legend?: string;
  disabled?: boolean;
}

export function StylePicker({ presets, value, onChange, isAdmin, name, legend = "Pilih gaya dokumen", disabled = false }: StylePickerProps) {
  const visible = presets.filter((p) => isAdmin || !p.restricted);
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-[12.5px] font-medium text-[var(--text)]">{legend}</legend>
      {visible.length === 0 ? (
        <p className="text-[13px] text-[var(--text-2)]">Belum ada gaya yang tersedia. Minta admin menyiapkan gaya dokumen.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <StyleCard key={p.id} preset={p} name={name} checked={value === p.slug} disabled={disabled} onChange={onChange} />
          ))}
        </div>
      )}
    </fieldset>
  );
}

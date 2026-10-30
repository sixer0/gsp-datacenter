/**
 * Konteks compose yang disimpan di snapshot norm/v2 (`snapshot.compose`) agar
 * rekonstruksi M14-M18 -> compose ulang -> sha sama (register §4.6, SC-5) dapat
 * dijalankan tanpa DB templat: kerangka, tier, dan HANYA kunci parameter yang
 * dibaca compose (`COMPOSE_PARAM_KEYS`). Medan ini tambahan (+) atas T2-54;
 * diajukan ke SR-04 lewat file_requests (tipe lokal sampai diratifikasi).
 */
import type { NormDocSnapshotV2, ParamMap, ParamValue, StudioTier } from "../../contract";
import type { ComposeAssetInfo, ComposeInput, SkeletonInput } from "./types";

/** Satu-satunya kunci parameter yang dibaca compose (tingkat dokumen dan slot). */
export const COMPOSE_PARAM_KEYS = [
  "render.run.symbolGlyphs",
  "chart.output.widthMm",
  "diagram.widthMm",
  "grid.textColumnMm",
  "grid.allowedFigureWidthsMm",
  "render.table.columnProfiles",
  "chart.composite.columns",
  "chart.composite.gapMm",
  "slot.setup",
  "slot.placement",
  "slot.placeholderText",
  // RQ-8 (DF-58, RK-10): diajukan ke NORM_COMPOSE_PARAM_KEYS (contract/types/v2/norm.ts) lewat file_requests.
  "render.toc.title",
  "render.toc.note",
  "image.widthMm",
  "symbolSheet.widthMm",
] as const;

export interface ComposeContextRecord {
  v: 1;
  skeleton: SkeletonInput;
  tier: StudioTier;
  params: Record<string, ParamValue>;
  slotParams?: Record<string, Record<string, ParamValue>>;
  assets?: Record<string, ComposeAssetInfo>;
  /** Jenis kontrak templat (DC-10); hanya ditulis bila diberikan pemanggil (sha dokumen lain tetap). */
  contractKind?: string;
}

/** Snapshot norm/v2 dengan konteks compose (+). */
export type ComposedSnapshotV2 = NormDocSnapshotV2 & { compose?: ComposeContextRecord };

function pick(params: ParamMap): Record<string, ParamValue> {
  const out: Record<string, ParamValue> = {};
  for (const k of COMPOSE_PARAM_KEYS) if (params[k] !== undefined) out[k] = params[k];
  return out;
}

/** Proyeksi masukan compose ke konteks tersimpan (deterministik). */
export function composeContextOf(input: ComposeInput, tier: StudioTier): ComposeContextRecord {
  const ctx: ComposeContextRecord = { v: 1, skeleton: input.skeleton, tier, params: pick(input.params) };
  if (input.slotParams) {
    ctx.slotParams = {};
    for (const [k, p] of Object.entries(input.slotParams)) ctx.slotParams[k] = pick(p);
  }
  if (input.assets) ctx.assets = { ...input.assets };
  if (input.contractKind !== undefined) ctx.contractKind = input.contractKind;
  return ctx;
}

/** Konteks tersimpan di snapshot, atau undefined (snapshot norm/v1 / sebelum SR-08). */
export function storedComposeContext(snapshot: unknown): ComposeContextRecord | undefined {
  const c = (snapshot as ComposedSnapshotV2 | null)?.compose;
  return c && c.v === 1 && c.skeleton && typeof c.tier === "string" && c.params ? c : undefined;
}

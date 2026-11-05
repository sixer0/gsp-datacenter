/**
 * Utilitas nilai parameter murni (tanpa React) untuk editor template S58:
 * kesetaraan stabil, ringkasan tampilan, satuan, dan pembanding versi.
 */
import type { RoleFormatMap } from "@/lib/studio/contract/engine";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { ParamType } from "@/lib/studio/contract/types/params";

export type ParamRecord = Record<string, ParamValue>;

/** JSON dengan kunci objek terurut (kesetaraan nilai, bukan urutan kunci). */
export function stableStringify(v: unknown): string {
  if (v === undefined) return "undefined";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
    .join(",")}}`;
}

export function valuesEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

export function hasOwn(o: object, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, k);
}

const UNIT: Partial<Record<ParamType, string>> = {
  mm: "mm",
  pt: "pt",
  em: "em",
  deg: "°",
  percent: "%",
  cm: "cm",
  rp: "Rp",
};

export function unitOf(t: ParamType): string {
  return UNIT[t] ?? "";
}

export const NUMERIC_TYPES: ReadonlySet<ParamType> = new Set(["int", "number", "mm", "pt", "em", "deg", "percent", "cm", "rp"]);

/** Ringkasan satu baris untuk tabel/diff. */
export function formatValue(v: ParamValue | undefined, max = 120): string {
  if (v === undefined) return "(tidak ada)";
  if (v === null) return "(kosong)";
  if (typeof v === "boolean") return v ? "ya" : "tidak";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Hex registri boleh berawalan `#`; input warna HTML butuh `#rrggbb`. */
export function toCssHex(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = /^#?([0-9A-Fa-f]{6})$/.exec(v.trim());
  return m ? `#${m[1]}` : null;
}

// ── Pembanding versi ─────────────────────────────────────────────────────

export interface KeyChange {
  key: string;
  kind: "tambah" | "ubah" | "hapus";
  before: ParamValue | undefined;
  after: ParamValue | undefined;
}

export function diffRecords(a: Readonly<Record<string, unknown>>, b: Readonly<Record<string, unknown>>): KeyChange[] {
  const out: KeyChange[] = [];
  for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    const inA = hasOwn(a, key);
    const inB = hasOwn(b, key);
    if (inA && inB && valuesEqual(a[key], b[key])) continue;
    out.push({
      key,
      kind: !inA ? "tambah" : !inB ? "hapus" : "ubah",
      before: inA ? (a[key] as ParamValue) : undefined,
      after: inB ? (b[key] as ParamValue) : undefined,
    });
  }
  return out;
}

export function diffRoleFormats(a: RoleFormatMap, b: RoleFormatMap): KeyChange[] {
  return diffRecords(a as Record<string, unknown>, b as Record<string, unknown>);
}

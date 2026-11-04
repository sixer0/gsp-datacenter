/**
 * S20: pembaca persentase cakupan butir (U2, D-593; matriks S33) untuk putusan harness.
 *
 * Bentuk JSON yang diterima (pilih salah satu):
 *   { "percent": 91.4 }
 *   { "covered": 32, "applicable": 35 }
 *   { "pairs": [ { "template": "datum-standar", "language": "ID", "percent"?: n, "covered"?: n, "applicable"?: n } ] }
 * Bentuk `pairs` dipilih per pasangan (slug + bahasa); pasangan yang tidak ada = cakupan tidak diketahui.
 */
import { readFileSync } from "node:fs";

export interface CoverageResult {
  /** Persen cakupan, null bila tidak diketahui. */
  readonly percent: number | null;
  readonly covered?: number;
  readonly applicable?: number;
  readonly source?: string;
  readonly note?: string;
}

export class CoverageInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoverageInputError";
  }
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function fromRecord(o: Record<string, unknown>, source: string): CoverageResult {
  if (o.percent !== undefined) {
    if (!isNum(o.percent) || o.percent < 0 || o.percent > 100) throw new CoverageInputError(`${source}: percent harus angka 0..100`);
    return { percent: o.percent, covered: isNum(o.covered) ? o.covered : undefined, applicable: isNum(o.applicable) ? o.applicable : undefined, source };
  }
  if (o.covered !== undefined || o.applicable !== undefined) {
    if (!isNum(o.covered) || !isNum(o.applicable) || o.covered < 0 || o.applicable < 0 || o.covered > o.applicable) {
      throw new CoverageInputError(`${source}: covered/applicable harus angka dengan 0 <= covered <= applicable`);
    }
    if (o.applicable === 0) return { percent: null, covered: 0, applicable: 0, source, note: "penyebut cakupan 0" };
    return { percent: (o.covered / o.applicable) * 100, covered: o.covered, applicable: o.applicable, source };
  }
  throw new CoverageInputError(`${source}: butuh percent atau covered + applicable`);
}

export function parseCoverage(data: unknown, pair: { template: string; language: string }, source = "coverage"): CoverageResult {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new CoverageInputError(`${source}: akar harus objek`);
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.pairs)) {
    const hit = o.pairs.find(
      (x): x is Record<string, unknown> =>
        !!x && typeof x === "object" && (x as Record<string, unknown>).template === pair.template && String((x as Record<string, unknown>).language).toUpperCase() === pair.language,
    );
    if (!hit) return { percent: null, source, note: `pasangan ${pair.template}/${pair.language} tidak ada di ${source}` };
    return fromRecord(hit, source);
  }
  return fromRecord(o, source);
}

export function readCoverageFile(file: string, pair: { template: string; language: string }): CoverageResult {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch (e) {
    throw new CoverageInputError(`${file}: tidak dapat dibaca sebagai JSON (${(e as Error).message})`);
  }
  return parseCoverage(data, pair, file);
}

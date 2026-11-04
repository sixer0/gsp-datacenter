/**
 * S20: penyerapan hasil pemeriksa bentrok teks PDF (S24, `clash/clash.py`) ke harness.
 *
 * Kontrak JSON (D-593; detektor G-01..G-06 research/32 §13):
 *   { "pdf": str, "pages": int,
 *     "clashes": [ { "page": int, "kind": "overlap|out_of_page|out_of_margin|clipped|overflow",
 *                    "bbox": [x0, y0, x1, y1], "text": str, "detail": str } ] }
 * Masukan divalidasi ketat; bentuk yang menyimpang = galat (bukan "0 bentrok").
 */
import { readFileSync } from "node:fs";

export const CLASH_KINDS = ["overlap", "out_of_page", "out_of_margin", "clipped", "overflow"] as const;
export type ClashKind = (typeof CLASH_KINDS)[number];

/** Pemetaan jenis ke kode katalog (research/32 §13). `clipped` mencakup sel tabel dan blok sampul. */
export const CLASH_KIND_CODES: Readonly<Record<ClashKind, string>> = {
  overlap: "G-01",
  out_of_page: "G-02",
  out_of_margin: "G-03",
  clipped: "G-04/G-05",
  overflow: "G-06",
};

export interface PdfClash {
  readonly page: number;
  readonly kind: ClashKind;
  readonly bbox: readonly [number, number, number, number];
  readonly text: string;
  readonly detail: string;
}

export interface ClashResult {
  readonly pdf: string;
  readonly pages: number;
  readonly clashes: readonly PdfClash[];
  /** Berkas JSON asal (diisi pembaca berkas). */
  readonly source?: string;
}

export class ClashInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClashInputError";
  }
}

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Memvalidasi objek hasil pemeriksa bentrok terhadap kontrak. */
export function parseClashResult(data: unknown, source = "clash"): ClashResult {
  const bad = (msg: string): never => {
    throw new ClashInputError(`${source}: ${msg}`);
  };
  if (!data || typeof data !== "object" || Array.isArray(data)) bad("akar harus objek");
  const o = data as Record<string, unknown>;
  if (typeof o.pdf !== "string") bad("medan pdf harus string");
  if (!isInt(o.pages) || (o.pages as number) < 0) bad("medan pages harus bilangan bulat >= 0");
  if (!Array.isArray(o.clashes)) bad("medan clashes harus larik");
  const pages = o.pages as number;
  const clashes = (o.clashes as unknown[]).map((c, i): PdfClash => {
    const at = `clashes[${i}]`;
    if (!c || typeof c !== "object" || Array.isArray(c)) bad(`${at} harus objek`);
    const x = c as Record<string, unknown>;
    if (!isInt(x.page) || (x.page as number) < 1 || (pages > 0 && (x.page as number) > pages)) bad(`${at}.page harus bilangan bulat 1..${pages}`);
    if (typeof x.kind !== "string" || !(CLASH_KINDS as readonly string[]).includes(x.kind)) bad(`${at}.kind harus salah satu ${CLASH_KINDS.join("|")}`);
    if (!Array.isArray(x.bbox) || x.bbox.length !== 4 || !x.bbox.every(isNum)) bad(`${at}.bbox harus [x0, y0, x1, y1] angka`);
    if (typeof x.text !== "string") bad(`${at}.text harus string`);
    if (typeof x.detail !== "string") bad(`${at}.detail harus string`);
    const b = x.bbox as number[];
    return { page: x.page as number, kind: x.kind as ClashKind, bbox: [b[0], b[1], b[2], b[3]], text: x.text as string, detail: x.detail as string };
  });
  return { pdf: o.pdf as string, pages, clashes, source };
}

export function readClashFile(file: string): ClashResult {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (e) {
    throw new ClashInputError(`${file}: tidak dapat dibaca (${(e as Error).message})`);
  }
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch (e) {
    throw new ClashInputError(`${file}: bukan JSON yang sah (${(e as Error).message})`);
  }
  return parseClashResult(data, file);
}

export function countByKind(clashes: readonly PdfClash[]): Record<ClashKind, number> {
  const out = Object.fromEntries(CLASH_KINDS.map((k) => [k, 0])) as Record<ClashKind, number>;
  for (const c of clashes) out[c.kind] += 1;
  return out;
}

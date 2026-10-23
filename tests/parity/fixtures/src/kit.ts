/**
 * Pembantu korpus fixture paritas (S63). Semua fixture dibangun sebagai objek
 * bertipe kontrak (KS-01: fixture bertipe TS sekaligus lolos ajv), lalu ditulis
 * ke JSON oleh `build_fixtures.ts`. Data ilustratif netral, bukan data klien.
 */
import { deflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import type {
  AssetRef,
  Caption,
  Cell,
  ColumnSpec,
  Inline,
  ProvenanceMark,
  Row,
  SourceLine,
  TableBlock,
  TableBlockType,
} from "../../../../src/lib/studio/contract";

export const TEMPLATE = { slug: "datum-kanonik", version: 1 } as const;
export const ISSUE_DATE = "2026-10-20";

/** Inline md-lite (KS-03). */
export const tx = (text: string): Inline => ({ text });

export const cap = (text: string): Caption => ({ inline: tx(text) });

export const src = (text: string, provenance?: ProvenanceMark[]): SourceLine =>
  provenance ? { inline: tx(text), provenance } : { inline: tx(text) };

export const cell = (text: string, extra: Omit<Cell, "text" | "runs" | "paragraphs"> = {}): Cell => ({ text, ...extra });

export const row = (cells: Array<string | Cell>, kind?: Row["kind"]): Row => {
  const r: Row = { cells: cells.map((c) => (typeof c === "string" ? cell(c) : c)) };
  if (kind) r.kind = kind;
  return r;
};

export const head = (labels: string[]): Row => ({ ...row(labels, "header"), repeatHeader: true });

/** Tabel data ber-caption + SUMBER (DATUM-10). */
export function table(
  type: TableBlockType,
  opts: {
    caption?: string;
    source?: string;
    columns: ColumnSpec[];
    header?: string[];
    body: Array<Array<string | Cell> | Row>;
    preset?: string;
    blockId?: string;
    sourcePlacement?: TableBlock["sourcePlacement"];
    layout?: TableBlock["layout"];
  },
): TableBlock {
  const rows: Row[] = [];
  if (opts.header) rows.push(head(opts.header));
  for (const b of opts.body) rows.push(Array.isArray(b) ? row(b) : b);
  const t: TableBlock = { type, columns: opts.columns, rows };
  if (opts.blockId) t.blockId = opts.blockId;
  if (opts.caption) t.caption = cap(opts.caption);
  if (opts.source) t.source = src(opts.source);
  if (opts.preset) t.preset = opts.preset;
  if (opts.sourcePlacement) t.sourcePlacement = opts.sourcePlacement;
  if (opts.layout) t.layout = opts.layout;
  return t;
}

export const colText = (widthMm?: number): ColumnSpec => (widthMm ? { role: "text", widthMm } : { role: "text" });
export const colId = (widthMm?: number): ColumnSpec => (widthMm ? { role: "id", widthMm } : { role: "id" });
export const colNum = (unit?: string, widthMm?: number): ColumnSpec => {
  const c: ColumnSpec = { role: "numeral", align: "right" };
  if (unit) c.unit = unit;
  if (widthMm) c.widthMm = widthMm;
  return c;
};
export const colUnit = (): ColumnSpec => ({ role: "unit" });

// ── PNG deterministik (aset raster ilustratif) ───────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/**
 * PNG RGB 8-bit deterministik (zlib level 9, tanpa metadata waktu). `paint`
 * mengembalikan [r, g, b] per piksel.
 */
export function makePng(w: number, h: number, paint: (x: number, y: number) => [number, number, number]): Buffer {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0; // filter None
    for (let x = 0; x < w; x++) {
      const [r, g, b] = paint(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

export function pngAsset(png: Buffer, w: number, h: number): AssetRef {
  return {
    kind: "raster",
    mime: "image/png",
    sha256: createHash("sha256").update(png).digest("hex"),
    dataBase64: png.toString("base64"),
    widthPx: w,
    heightPx: h,
  };
}

const PAPER: [number, number, number] = [0xf6, 0xf4, 0xef];
const INK2: [number, number, number] = [0xc9, 0xc6, 0xbf];
const INK7: [number, number, number] = [0x4a, 0x48, 0x44];

/** Denah ilustratif: kisi tipis + dua ruang bergaris tebal. 1512 x 630 px = 128 mm pada 300 dpi. */
export function floorPlanAsset(): AssetRef {
  const w = 1512;
  const h = 630;
  const png = makePng(w, h, (x, y) => {
    const wall =
      ((x >= 120 && x <= 126) || (x >= 760 && x <= 766) || (x >= 1386 && x <= 1392)) && y >= 90 && y <= 540
        ? true
        : ((y >= 90 && y <= 96) || (y >= 534 && y <= 540)) && x >= 120 && x <= 1392;
    if (wall) return INK7;
    if (x % 63 === 0 || y % 63 === 0) return INK2;
    return PAPER;
  });
  return pngAsset(png, w, h);
}

/** Logo ilustratif netral: persegi gelap + garis. 600 x 200 px. */
export function logoAsset(): AssetRef {
  const w = 600;
  const h = 200;
  const png = makePng(w, h, (x, y) => {
    if (x >= 20 && x <= 180 && y >= 20 && y <= 180) return INK7;
    if (x >= 210 && x <= 580 && y >= 95 && y <= 105) return INK7;
    return PAPER;
  });
  return pngAsset(png, w, h);
}

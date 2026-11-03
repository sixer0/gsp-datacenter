/**
 * IMPL-W2 (D-522, D-527): jalur tulis minimal untuk DOKUMEN KLIEN (templat DATUM). Agen mengirim `meta` datar +
 * bagian (judul + blok); modul murni ini menyusun semua bentuk yang dipahami server: `DocMetaV2` (tanpa `docNumber`
 * server), payload slot `cover` (blok kendali dengan NOMOR TAMPILAN dari meta), `controlSheet`, `signature`, dan satu
 * `ChapterV2` per bagian (tabel/grafik selalu berketerangan + bersumber; kode grafik dipilih mesin). Penomoran bab,
 * tabel ("Tabel N.M"), dan gambar ("Gambar N.M") dihitung server dari kunci bab, jadi kunci bab = nomor bab di judul
 * (bila ada dan naik) atau urutan. Tanpa I/O.
 */
import type { InlineV2 } from "../../../src/lib/studio/contract";
import { parseInline } from "../../../src/lib/studio/services/import/inline";
import { McpToolError } from "./safety";
import { tok, type ToolWarning } from "./tool-kit";
import { isRows, type Cell, type ChartInput, type Rows } from "./write-content";

type Rec = Record<string, unknown>;
const NOOP = { warn: () => undefined, drop: () => undefined };
const inl = (s: string): InlineV2 => parseInline(s.replace(/\s+/g, " ").trim(), NOOP);
const txt = (s: string): InlineV2 => ({ text: s.replace(/\s+/g, " ").trim() });

// ── meta ────────────────────────────────────────────────────────────────

export type MetaField =
  | "title" | "number" | "rev" | "date" | "author" | "checker" | "approver" | "classification" | "audience" | "custodian"
  | "subject" | "basis" | "language" | "standfirst" | "method" | "distribution" | "source" | "revisionNote";

const META_ALIASES: Readonly<Record<string, MetaField>> = {
  title: "title", judul: "title",
  number: "number", nomor: "number", "nomor dokumen": "number", docnumber: "number", "doc number": "number", "document number": "number", no: "number",
  rev: "rev", revisi: "rev", revision: "rev",
  date: "date", tanggal: "date", issuedate: "date", "tanggal terbit": "date",
  author: "author", penyusun: "author", penulis: "author", "disusun oleh": "author",
  checker: "checker", pemeriksa: "checker", reviewer: "checker", "diperiksa oleh": "checker",
  approver: "approver", penyetuju: "approver", "disetujui oleh": "approver",
  classification: "classification", klasifikasi: "classification",
  audience: "audience", "ditujukan kepada": "audience", kepada: "audience",
  custodian: "custodian", kustodian: "custodian",
  subject: "subject", perihal: "subject", subjek: "subject",
  basis: "basis", dasar: "basis",
  language: "language", bahasa: "language",
  standfirst: "standfirst", subtitle: "standfirst", abstrak: "standfirst",
  method: "method", metode: "method", "pernyataan metode": "method",
  distribution: "distribution", distribusi: "distribution",
  source: "source", sumber: "source",
  revisionnote: "revisionNote", "revision note": "revisionNote", "catatan revisi": "revisionNote", perubahan: "revisionNote",
};

export type ClientMeta = Partial<Record<MetaField, string>>;
const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Meta datar agen -> medan kanonik; kunci tak dikenal = peringatan. title + author wajib (tidak dikarang). */
export function normalizeMeta(raw: Record<string, string>, title: string | null, today: string, warn: (w: ToolWarning) => void): ClientMeta {
  const m: ClientMeta = {};
  const unknown: string[] = [];
  for (const [k, v] of Object.entries(raw)) {
    const f = META_ALIASES[k.trim().toLowerCase()];
    const val = String(v).replace(/\s+/g, " ").trim();
    if (f === undefined) unknown.push(k);
    else if (val !== "") m[f] = val;
  }
  if (title !== null && title.trim() !== "") m.title = title.replace(/\s+/g, " ").trim();
  if (unknown.length > 0) warn({ code: "META_IGNORED", message: `meta tidak dikenal: ${unknown.slice(0, 8).join(", ")} (dikenal: title, number, rev, date, author, checker, approver, classification, audience, custodian, subject, basis, language, standfirst, method, distribution, source)` });
  const missing = (["title", "author"] as const).filter((f) => m[f] === undefined);
  if (missing.length > 0) {
    throw new McpToolError("META_MISSING", `meta wajib untuk dokumen klien: ${missing.join(", ")} (judul dan penyusun dicetak di sampul, lembar kendali, dan tanda tangan; tidak dikarang). Contoh: "meta": { "title": "...", "author": "...", "number": "..." }. Tidak ada yang dikirim`, { details: { missing } });
  }
  if (m.date !== undefined && !ISO_DATE.test(m.date)) {
    warn({ code: "DATE_DEFAULTED", message: `meta.date "${m.date}" bukan YYYY-MM-DD; dipakai ${today}` });
    m.date = today;
  }
  m.date ??= today;
  if (m.language !== undefined) {
    const l = m.language.toUpperCase();
    m.language = l === "EN" || l === "ENGLISH" || l === "INGGRIS" ? "EN" : "ID";
  }
  return m;
}

/** DocMetaV2 untuk R04/R14: TANPA docNumber (nomor unik server; D-527: nomor meta = nomor tampilan). */
export function docMetaOf(m: ClientMeta, warn: (w: ToolWarning) => void): Rec {
  const out: Rec = { title: m.title };
  if (m.rev !== undefined) {
    if (/^[A-Z]{1,2}$/.test(m.rev.toUpperCase())) out.rev = m.rev.toUpperCase();
    else warn({ code: "REV_DISPLAY_ONLY", message: `meta.rev "${m.rev}" bukan huruf revisi (A, B, ...); hanya dicetak di sampul/lembar kendali` });
  }
  for (const f of ["classification", "author", "custodian", "audience", "basis", "subject"] as const) if (m[f] !== undefined) out[f] = m[f];
  if (m.language !== undefined) out.language = m.language;
  if (m.date !== undefined) out.issueDate = m.date;
  return out;
}

const LABELS = {
  ID: { number: "Nomor dokumen", rev: "Revisi", author: "Penyusun", classification: "Klasifikasi", audience: "Ditujukan kepada", custodian: "Kustodian", basis: "Dasar", sheet: "Lembar Kendali", made: "Disusun", checked: "Diperiksa", approved: "Disetujui", first: "Terbit pertama", by: "Diolah oleh" },
  EN: { number: "Document number", rev: "Revision", author: "Author", classification: "Classification", audience: "Addressed to", custodian: "Custodian", basis: "Basis", sheet: "Control Sheet", made: "Prepared", checked: "Checked", approved: "Approved", first: "First issue", by: "Compiled by" },
} as const;
export const labelsOf = (m: ClientMeta) => LABELS[m.language === "EN" ? "EN" : "ID"];

// ── slot dari meta ──────────────────────────────────────────────────────

/**
 * Slot depan dari meta. Sampul: blok kendali eksplisit HANYA bila meta.number ada (agar sampul mencetak nomor
 * tampilan, bukan nomor unik server); tanpa nomor, blok kendali otomatis mesin dipakai.
 */
export function frontSlots(m: ClientMeta, warn: (w: ToolWarning) => void): { cover: Rec; controlSheet: Rec; signature: Rec } {
  const L = labelsOf(m);
  const revShown = m.rev ?? "A";
  if (m.rev === undefined) warn({ code: "REV_DEFAULTED", message: "meta.rev tidak diisi; revisi A dipakai di lembar kendali" });
  const cover: Rec = { type: "cover" };
  if (m.number !== undefined) {
    const pairs: Array<[string, string]> = [[L.number, m.number], [L.rev, `${revShown} · ${m.date}`], [L.author, m.author as string]];
    for (const f of ["classification", "audience", "custodian", "basis"] as const) if (m[f] !== undefined) pairs.push([L[f], m[f] as string]);
    const rows: InlineV2[][] = [];
    for (let i = 0; i < pairs.length; i += 2) {
      const r = pairs[i + 1] ?? ["", ""];
      rows.push([txt(pairs[i][0]), txt(pairs[i][1]), txt(r[0]), txt(r[1])]);
    }
    cover.control = rows;
  }
  if (m.standfirst !== undefined) cover.standfirst = inl(m.standfirst);
  const chain = [
    { layer: "1", role: L.author, name: m.author as string },
    ...(m.checker !== undefined ? [{ layer: "2", role: L.checked, name: m.checker }] : []),
    ...(m.approver !== undefined ? [{ layer: m.checker !== undefined ? "3" : "2", role: L.approved, name: m.approver }] : []),
  ];
  const controlSheet: Rec = {
    type: "controlSheet",
    ...(m.number !== undefined ? { title: txt(`${L.sheet} ${m.number}`) } : {}),
    revisionHistory: [{ rev: revShown, date: m.date, what: m.revisionNote ?? L.first, by: m.author }],
    verificationChain: chain,
    ...(m.method !== undefined ? { methodStatement: inl(m.method) } : {}),
    ...(m.distribution !== undefined ? { distribution: m.distribution.split(/[;,]/).map((h) => h.trim()).filter((h) => h !== "").map((holder, i) => ({ copy: String(i + 1), holder })) } : {}),
  };
  const signature: Rec = {
    type: "signatureBlock",
    roles: [
      { role: txt(L.made), holder: txt(m.author as string), date: txt(m.date as string) },
      ...(m.checker !== undefined ? [{ role: txt(L.checked), holder: txt(m.checker) }] : []),
      ...(m.approver !== undefined ? [{ role: txt(L.approved), holder: txt(m.approver) }] : []),
    ],
  };
  return { cover, controlSheet, signature };
}

// ── grafik ──────────────────────────────────────────────────────────────

export type ClientChart = ChartInput & { stacked?: boolean };
const CODE_RE = /^[A-Z]{1,2}-\d{2}$/;
const FRIENDLY: Readonly<Record<string, string>> = { bar: "P-01", column: "P-02", grouped: "P-03", "grouped column": "P-03", stacked: "K-01", "stacked bar": "K-01", line: "W-01", area: "W-04", "stacked area": "W-05", lollipop: "P-04", dumbbell: "P-06", slope: "P-08", "small multiples": "P-12" };

/**
 * Kode grafik dari bentuk data (D-527: agen tidak perlu kode). 1 seri: label panjang (> 14) atau > 8 kategori -> P-01
 * (bar urut), selain itu P-02 (kolom); >= 2 seri: `stacked` -> K-01, 2..3 seri -> P-03 (kolom berkelompok), 4..6 seri ->
 * P-12 (small multiples), > 6 seri tanpa `stacked` -> ditolak. `type` (kode atau nama: bar, column, line, stacked, ...) menang.
 */
export function chartCodeOf(c: ClientChart, warn: (w: ToolWarning) => void, where: string): string {
  const t = c.type?.trim();
  if (t !== undefined && t !== "") {
    if (CODE_RE.test(t.toUpperCase())) return t.toUpperCase();
    const f = FRIENDLY[t.toLowerCase()];
    if (f !== undefined) return f === "P-02" && c.series.length > 1 ? "P-03" : f === "W-04" && c.series.length > 1 ? "W-05" : f;
    warn({ code: "CHART_TYPE_UNKNOWN", message: `${where}: type "${tok(t, "(bukan token aman)")}" tidak dikenal; kode dipilih mesin dari bentuk data` });
  }
  const n = c.series.length;
  if (n === 1) return c.categories.length > 8 || c.categories.some((x) => String(x).length > 14) ? "P-01" : "P-02";
  if (c.stacked === true) return "K-01";
  if (n <= 3) return "P-03";
  if (n <= 6) return "P-12";
  throw new McpToolError("CHART_TOO_MANY_SERIES", `${where}: ${n} seri tanpa stacked: true terlalu banyak untuk satu grafik (maks 6); pecah menjadi beberapa grafik atau set stacked: true. Tidak ada yang dikirim`);
}

/** Data grafik: kode berbentuk categorical (P-01/P-02/P-04/W-02/W-04 ...) -> points; selain itu series. */
const CATEGORICAL = new Set(["P-01", "P-02", "P-04", "P-09", "P-10", "P-11", "K-05", "K-06", "K-07", "K-08", "K-09", "K-10", "W-02", "W-04"]);
export function chartBlock(c: ClientChart, defaultSource: string, warn: (w: ToolWarning) => void, where: string, chapterTitle: string): Rec {
  const len = c.categories.length;
  if (c.series.some((s) => s.values.length !== len)) {
    throw new McpToolError("CHART_DATA_INVALID", `${where}: setiap seri harus punya ${len} nilai (sama dengan jumlah categories). Tidak ada yang dikirim`);
  }
  const code = chartCodeOf(c, warn, where);
  const cats = c.categories.map((x) => String(x));
  let data: Rec;
  if (CATEGORICAL.has(code)) {
    const s = c.series[0];
    const points = cats.map((label, i) => ({ label, value: s.values[i] })).filter((p): p is { label: string; value: number } => typeof p.value === "number");
    if (points.length < len) warn({ code: "CHART_NULL_DROPPED", message: `${where}: ${len - points.length} nilai kosong dibuang dari grafik satu seri` });
    data = { shape: "categorical", points };
  } else data = { shape: "series", categories: cats, series: c.series.map((s) => ({ name: s.name, values: s.values })) };
  const caption = c.caption?.trim() || `${c.series.map((s) => s.name).join(", ")} per ${chapterTitle}`;
  if (!c.caption?.trim()) warn({ code: "CAPTION_GENERATED", message: `${where}: grafik tanpa caption; keterangan dibangkitkan dari nama seri` });
  const source = c.source?.trim() || defaultSource;
  if (!c.source?.trim()) warn({ code: "SOURCE_DEFAULTED", message: `${where}: grafik tanpa source; dipakai "${defaultSource}"` });
  return { type: "chart", code, data, ...(c.unit ? { unit: c.unit } : {}), caption: inl(caption), source: inl(source) };
}

// ── tabel ───────────────────────────────────────────────────────────────

const NUMERAL = /^[−+-]?(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d+)?\s*%?$/;
const cellOf = (c: Cell): Rec => {
  const s = String(c ?? "").replace(/\s+/g, " ").trim();
  if (s === "") return {};
  const i = inl(s);
  return "text" in i ? { text: i.text } : { runs: i.runs };
};

/** Tabel selalu berketerangan (penomoran "Tabel N.M" butuh caption) dan bersumber (gerbang DATUM-10). */
export function tableBlock(rows: Rows, caption: string | undefined, source: string | undefined, defaultSource: string, warn: (w: ToolWarning) => void, where: string, chapterTitle: string): Rec {
  const width = Math.max(1, ...rows.map((r) => r.length));
  if (width > 20) throw new McpToolError("TABLE_TOO_WIDE", `${where}: tabel ${width} kolom; maks 20. Tidak ada yang dikirim`);
  const norm = rows.map((r) => (r.length === width ? r : [...r, ...Array.from({ length: width - r.length }, () => "")]));
  if (norm.some((r, i) => r !== rows[i])) warn({ code: "TABLE_ROW_PADDED", message: `${where}: baris tabel disamakan lebarnya (${width} kolom)` });
  const body = norm.slice(1);
  const columns = Array.from({ length: width }, (_, c) => {
    const vals = body.map((r) => String(r[c] ?? "").trim()).filter((v) => v !== "");
    return vals.length > 0 && vals.every((v) => NUMERAL.test(v)) ? { role: "numeral" } : { role: "text" };
  });
  const cells = body.flat().map((v) => String(v ?? "").trim()).filter((v) => v !== "");
  const head = norm[0].map((h) => String(h)).join(" ");
  if (cells.length > 0 && cells.filter((v) => NUMERAL.test(v)).length / cells.length >= 0.5 && !/(satuan|unit)|\(([^)]{1,12})\)/i.test(head)) {
    // DATUM-09 (DT-17): tabel data numerik wajib menyebut satuan; satuan tidak dapat ditebak mesin.
    throw new McpToolError("TABLE_UNIT_MISSING", `${where}: tabel angka tanpa satuan; tulis satuan di judul kolom angka, mis. "${String(norm[0][norm[0].length - 1]).trim() || "Nilai"} (unit)" atau "(%)". Tidak ada yang dikirim`);
  }
  const cap = caption?.trim() || `${chapterTitle}: ${norm[0].map((h) => String(h).trim()).filter((h) => h !== "").join(", ")}`;
  if (!caption?.trim()) warn({ code: "CAPTION_GENERATED", message: `${where}: tabel tanpa caption; keterangan dibangkitkan dari judul bab + judul kolom (pakai { table, caption } untuk teks sendiri)` });
  const src = source?.trim() || defaultSource;
  if (!source?.trim()) warn({ code: "SOURCE_DEFAULTED", message: `${where}: tabel tanpa source; dipakai "${defaultSource}"` });
  return {
    type: "table",
    caption: inl(cap),
    columns,
    rows: [{ kind: "header", cells: norm[0].map(cellOf) }, ...body.map((r) => ({ kind: "body", cells: r.map(cellOf) }))],
    source: inl(src),
  };
}

// ── bab ─────────────────────────────────────────────────────────────────

export type ClientBlock = string | Rows | { table: Rows; caption?: string; source?: string } | { chart: ClientChart } | { list: string[]; ordered?: boolean } | { subheading: string };
export interface ClientSection {
  heading: string;
  blocks: ClientBlock[];
}

const HEADING_NUM = /^\s*(?:bab|chapter|bagian)?\s*(\d{1,3})\s*[.:)\-–]?\s+(.+)$/i;

/** Kunci bab: nomor di judul bila naik, selain itu urutan (kunci terakhir + 1); judul tanpa nomor (label BAB milik mesin). */
export function chapterKeys(sections: readonly ClientSection[], warn: (w: ToolWarning) => void): Array<{ key: string; title: string }> {
  let last = 0;
  const fixed: string[] = [];
  return sections.map((s, i) => {
    const m = HEADING_NUM.exec(s.heading);
    const title = (m ? m[2] : s.heading).replace(/\s+/g, " ").trim();
    let n = last + 1;
    if (m) {
      const want = Number(m[1]);
      if (want > last && want <= 999) n = want;
      else fixed.push(`bagian ${i + 1} "${m[1]}" -> ${n}`);
    }
    last = n;
    return { key: String(n), title: title === "" ? `Bab ${n}` : title };
  }).map((x, i, all) => {
    if (i === all.length - 1 && fixed.length > 0) warn({ code: "CHAPTER_RENUMBERED", message: `nomor bab di judul tidak naik; dipakai urutan: ${fixed.join("; ")}` });
    return x;
  });
}

/** Satu bagian -> ChapterV2 (blok sebelum subheading pertama = intro; setiap subheading = section). */
export function chapterOf(sec: ClientSection, key: string, title: string, defaultSource: string, warn: (w: ToolWarning) => void, where: string): Rec {
  const intro: Rec[] = [];
  const sections: Array<{ title: InlineV2; blocks: Rec[] }> = [];
  const push = (b: Rec) => (sections.length > 0 ? sections[sections.length - 1].blocks : intro).push(b);
  sec.blocks.forEach((b, k) => {
    const w = `${where} blok ${k + 1}`;
    if (typeof b === "string") {
      for (const p of b.split(/\n\s*\n/)) if (p.trim() !== "") push({ type: "paragraph", ...inl(p) });
      return;
    }
    if (isRows(b)) {
      if (b.length > 0) push(tableBlock(b, undefined, undefined, defaultSource, warn, w, title));
      return;
    }
    const o = b as unknown as Rec;
    if (typeof o.subheading === "string") sections.push({ title: inl(o.subheading), blocks: [] });
    else if (isRows(o.table)) push(tableBlock(o.table, o.caption as string | undefined, o.source as string | undefined, defaultSource, warn, w, title));
    else if (o.chart !== null && typeof o.chart === "object") push(chartBlock(o.chart as ClientChart, defaultSource, warn, w, title));
    else if (Array.isArray(o.list)) {
      const items = (o.list as unknown[]).map((x) => String(x).trim()).filter((x) => x !== "").map((x) => inl(x));
      if (items.length > 0) push({ type: "list", ...(o.ordered === true ? { ordered: true } : {}), items });
    } else throw new McpToolError("INVALID_ARGUMENT", `${w}: blok tidak dikenal (string, larik baris, {table}, {chart}, {list}, {subheading})`);
  });
  if (intro.length === 0 && sections.every((s) => s.blocks.length === 0)) {
    throw new McpToolError("SECTION_MISSING", `${where} ("${title}") tanpa isi; tambahkan paragraf/tabel/grafik. Tidak ada yang dikirim`);
  }
  return { key, title: inl(title), ...(intro.length > 0 ? { intro } : {}), sections };
}

// ── rakit ───────────────────────────────────────────────────────────────

export interface BuiltClient {
  meta: ClientMeta;
  docMeta: Rec;
  slots: { cover: Rec; controlSheet: Rec; signature: Rec };
  chapters: Rec[];
  warnings: ToolWarning[];
}

export function buildClient(input: { meta: Record<string, string>; title: string | null; sections: ClientSection[]; today: string }): BuiltClient {
  const warnings: ToolWarning[] = [];
  const warn = (w: ToolWarning) => warnings.push(w);
  const meta = normalizeMeta(input.meta, input.title, input.today, warn);
  const docMeta = docMetaOf(meta, warn);
  const slots = frontSlots(meta, warn);
  const defaultSource = meta.source ?? `${labelsOf(meta).by} ${meta.author as string}`;
  const keys = chapterKeys(input.sections, warn);
  const chapters = input.sections.map((s, i) => chapterOf(s, keys[i].key, keys[i].title, defaultSource, warn, `bagian ${i + 1}`));
  // Peringatan sejenis digabung agar hasil tetap ringkas.
  const merged = new Map<string, ToolWarning[]>();
  for (const w of warnings) merged.set(w.code, [...(merged.get(w.code) ?? []), w]);
  const compact = [...merged.values()].map((ws) => (ws.length === 1 ? ws[0] : { code: ws[0].code, message: `${ws.length}x: ${ws.slice(0, 3).map((w) => w.message).join(" | ")}${ws.length > 3 ? " | ..." : ""}` }));
  return { meta, docMeta, slots, chapters, warnings: compact };
}

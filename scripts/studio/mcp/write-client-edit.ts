/**
 * IMPL-W2 `studio_edit` untuk dokumen klien (murni, tanpa I/O): satuan sunting dari proyeksi R20 = paragraf, butir
 * daftar, sel tabel, keterangan/sumber tabel dan figur, judul bab/section, medan meta, dan teks slot depan (sampul,
 * lembar kendali, tanda tangan). Aturan cocok sama dengan laporan kerja (`write-edit.ts`): substring persis, spasi
 * dinormalkan, tepat satu satuan sekali; bila semua kecocokan ada di teks depan (meta, sampul, lembar kendali, tanda
 * tangan; salinan meta seperti nomor tampilan dan penyusun), semua salinan diganti bersama. Suntingan data grafik dicari lewat teks keterangan figur.
 */
import { McpToolError } from "./safety";
import { tok, type ToolWarning } from "./tool-kit";
import { chartBlock, type ClientChart } from "./write-client";
import { parseInline } from "../../../src/lib/studio/services/import/inline";
import { normalize } from "./write-edit";
import { findCell, findText, fold, spliceSpans, type MatchUnit } from "./write-match";
import { isPositionEdit, paragraphsOf, resolvePosition, type PositionEdit } from "./write-position";

const NOOP = { warn: () => undefined, drop: () => undefined };

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => v !== null && typeof v === "object" && !Array.isArray(v);

export type Scope = { kind: "chapter"; key: string } | { kind: "slot"; slot: string } | { kind: "meta" };
export interface JUnit {
  scope: Scope;
  kind: "paragraph" | "item" | "cell" | "caption" | "source" | "title" | "field";
  /** IMPL-W3: judul bab/section tempat satuan berada; sel: teks baris, judul kolom, baris judul. */
  section: string;
  rowCells?: string[];
  column?: string;
  headerRow?: boolean;
  get(): string;
  set(v: string, warn: (w: ToolWarning) => void): void;
  /** hapus satuan (paragraf/butir) dari lariknya; null = kosongkan saja. */
  remove: (() => void) | null;
  /** larik blok + indeks untuk sisipan sesudahnya (satuan di dalam bab). */
  after: { list: Rec[]; block: Rec } | null;
}

/** Teks InlineV2 ({text} | {runs:[{t}]}). */
const inlineText = (h: Rec): string => (typeof h.text === "string" ? h.text : Array.isArray(h.runs) ? (h.runs as Rec[]).map((r) => (typeof r.t === "string" ? r.t : "")).join("") : "");

/** Tulis teks InlineV2: run tunggal yang memuat seluruh perubahan diedit di tempat; selain itu diratakan (MARKUP_DROPPED). */
function setInline(h: Rec, v: string, warn: (w: ToolWarning) => void): void {
  if (Array.isArray(h.runs)) {
    const runs = h.runs as Rec[];
    const old = inlineText(h);
    let pre = 0;
    while (pre < old.length && pre < v.length && old[pre] === v[pre]) pre++;
    let suf = 0;
    while (suf < old.length - pre && suf < v.length - pre && old[old.length - 1 - suf] === v[v.length - 1 - suf]) suf++;
    let at = 0;
    for (const r of runs) {
      const t = typeof r.t === "string" ? r.t : "";
      if (pre >= at && old.length - suf <= at + t.length && typeof r.t === "string") {
        r.t = t.slice(0, pre - at) + v.slice(pre, v.length - suf) + t.slice(old.length - suf - at);
        return;
      }
      at += t.length;
    }
    if (runs.some((r) => Object.keys(r).some((k) => k !== "t"))) warn({ code: "MARKUP_DROPPED", message: "suntingan melintasi beberapa run berformat; satuan itu ditulis ulang sebagai teks polos" });
    delete h.runs;
  }
  h.text = v;
}

const inlineUnit = (scope: Scope, kind: JUnit["kind"], h: Rec, extra: Partial<JUnit> = {}): JUnit => ({
  scope,
  kind,
  section: "",
  get: () => inlineText(h),
  set: (v, warn) => setInline(h, v, warn),
  remove: null,
  after: null,
  ...extra,
});

const FRONT_SKIP = new Set(["type", "id", "layer", "copy"]);

/** Teks slot depan: setiap InlineV2 dan medan string entri (rev, date, what, by, role, name, holder). */
function slotUnits(slot: string, payload: unknown, out: JUnit[]): void {
  const scope: Scope = { kind: "slot", slot };
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!isObj(v)) return;
    if (typeof v.text === "string" || Array.isArray(v.runs)) {
      out.push(inlineUnit(scope, "field", v, { section: slot }));
      return;
    }
    for (const [k, x] of Object.entries(v)) {
      if (typeof x === "string" && !FRONT_SKIP.has(k)) out.push({ scope, kind: "field", section: slot, get: () => v[k] as string, set: (s) => (v[k] = s), remove: null, after: null });
      else walk(x);
    }
  };
  walk(payload);
}

const META_EDITABLE = ["title", "author", "classification", "audience", "custodian", "subject", "basis"];

function blockUnits(key: string, list: Rec[], out: JUnit[], section: string): void {
  const scope: Scope = { kind: "chapter", key };
  list.forEach((b) => {
    const after = { list, block: b };
    if (b.type === "paragraph") out.push(inlineUnit(scope, "paragraph", b, { section, remove: () => list.splice(list.indexOf(b), 1), after }));
    else if (b.type === "list" && Array.isArray(b.items)) {
      const items = b.items as Rec[];
      items.forEach((it) => out.push(inlineUnit(scope, "item", it, { section, remove: () => items.splice(items.indexOf(it), 1), after })));
    } else if (Array.isArray(b.rows)) {
      const rows = (b.rows as Rec[]).filter(isObj);
      const cellsOf = (r: Rec) => (Array.isArray(r.cells) ? (r.cells as Rec[]) : []);
      const head = rows.find((r) => r.kind === "header") ?? rows[0];
      const header = head !== undefined ? cellsOf(head).map(inlineText) : [];
      for (const r of rows) {
        const rowCells = cellsOf(r).map(inlineText);
        cellsOf(r).forEach((c, ci) => out.push(inlineUnit(scope, "cell", c, { section, rowCells, column: header[ci] ?? "", headerRow: r === head, after })));
      }
    }
    if (isObj(b.caption)) out.push(inlineUnit(scope, "caption", b.caption, { section, after }));
    if (isObj(b.source)) out.push(inlineUnit(scope, "source", b.source, { section, after }));
  });
}

export function clientUnits(content: Rec): JUnit[] {
  const out: JUnit[] = [];
  const meta = isObj(content.meta) ? content.meta : {};
  for (const f of META_EDITABLE) if (typeof meta[f] === "string") out.push({ scope: { kind: "meta" }, kind: "field", section: "meta", get: () => meta[f] as string, set: (s) => (meta[f] = s), remove: null, after: null });
  const sections = isObj(content.sections) ? content.sections : {};
  for (const slot of ["cover", "controlSheet", "signature"]) if (isObj(sections[slot])) slotUnits(slot, sections[slot], out);
  const chapters = isObj(sections.content) && Array.isArray(sections.content.chapters) ? (sections.content.chapters as Rec[]) : [];
  for (const ch of chapters) {
    const key = String(ch.key);
    const chTitle = isObj(ch.title) ? inlineText(ch.title) : "";
    if (isObj(ch.title)) out.push(inlineUnit({ kind: "chapter", key }, "title", ch.title, { section: chTitle }));
    if (Array.isArray(ch.intro)) blockUnits(key, ch.intro as Rec[], out, chTitle);
    for (const s of Array.isArray(ch.sections) ? (ch.sections as Rec[]) : []) {
      const sTitle = isObj(s.title) ? `${chTitle} / ${inlineText(s.title)}` : chTitle;
      if (isObj(s.title)) out.push(inlineUnit({ kind: "chapter", key }, "title", s.title, { section: sTitle }));
      if (Array.isArray(s.blocks)) blockUnits(key, s.blocks as Rec[], out, sTitle);
    }
  }
  return out;
}

const scopeName = (s: Scope): string => (s.kind === "chapter" ? `bab ${s.key}` : s.kind === "slot" ? `slot ${s.slot}` : "meta");
const snip = (s: string): string => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 120 ? `${t.slice(0, 120)}...` : t;
};
/** Satuan klien -> satuan pencocokan bersama (IMPL-W3, `write-match.ts`); teks klien sudah polos (tanpa tingkat markah). */
function matchUnits(units: readonly JUnit[]): MatchUnit[] {
  return units.map((u) => ({
    text: u.get(),
    section: u.section,
    part: scopeName(u.scope),
    kind: u.kind,
    noPlain: true,
    ...(u.rowCells !== undefined ? { rowCells: u.rowCells, column: u.column ?? "", headerRow: u.headerRow === true } : {}),
  }));
}

/**
 * Satuan untuk `find` (persis -> samar; dibatasi section; semua bila `all`). Teks depan (meta, sampul, lembar kendali,
 * tanda tangan) adalah salinan meta: bila SEMUA kecocokan ada di sana dan masing-masing sekali, semua salinan diganti
 * bersama (perilaku IMPL-W2).
 */
export function locateClient(find: string, units: readonly JUnit[], label: string, opts: { section?: string; all?: boolean } = {}): Array<{ u: JUnit; spans: Array<[number, number]> | null; tier: string }> {
  const { hits } = findText(find, matchUnits(units), { ...opts, sameCopies: (hs) => /* W3-I2: hanya kecocokan persis */ hs.every((h) => h.tier === "exact" && units[h.index].scope.kind !== "chapter" && (h.spans?.length ?? 1) === 1) }, label);
  return hits.map((h) => ({ u: units[h.index], spans: h.spans, tier: h.tier }));
}

export type ClientEditOp =
  | { find: string; replace: string; section?: string; occurrence?: "all" }
  | { after: string; insert: string; section?: string }
  | { cell: { section?: string; row: string; column: string }; value: string }
  | { figure: string; chart: Partial<ClientChart> }
  | PositionEdit;

/** Paragraf baru dari teks agen: baris kosong memisah paragraf, wrap keras digabung, inline Markdown (`kode`, **tebal**) diurai (butir 13). */
function newParagraphs(text: string): Rec[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p !== "")
    .map((p) => ({ type: "paragraph", ...parseInline(p, NOOP) }));
}

/** Terapkan suntingan berurutan; kembalikan lingkup teks yang berubah dan suntingan grafik (sudah diterapkan ke blok). */
export function applyClientEdits(content: Rec, edits: readonly ClientEditOp[], warn: (w: ToolWarning) => void): { touched: Scope[]; charts: Array<{ key: string; block: Rec; patch: Rec }> } {
  const touched = new Map<string, Scope>();
  const charts: Array<{ key: string; block: Rec; patch: Rec }> = [];
  const touch = (s: Scope) => touched.set(scopeName(s), s);
  edits.forEach((e, i) => {
    const label = `edit ${i + 1}`;
    if ("figure" in e) {
      const c = locateChart(content, e.figure, label);
      const patch = chartPatch(c.block, e.chart, warn, label);
      charts.push({ key: c.key, block: c.block, patch });
      Object.assign(c.block, patch);
      return;
    }
    if (isPositionEdit(e)) {
      // IMPL-W3 butir 14c: pid + offset teks polos (+ expect sebagai penjaga) -> paragraf itu saja.
      const { para, next } = resolvePosition(e, paragraphsOf(content), label);
      if (next !== para.text) {
        setInline(para.block, next, warn);
        touch({ kind: "chapter", key: para.chapter });
      }
      return;
    }
    const units = clientUnits(content);
    if ("cell" in e) {
      const u = units[findCell(e.cell, matchUnits(units), label)];
      u.set(e.value.replace(/\s+/g, " ").trim(), warn);
      touch(u.scope);
      return;
    }
    if ("insert" in e) {
      const [{ u }] = locateClient(e.after, units, label, { ...(e.section !== undefined ? { section: e.section } : {}) });
      if (u.after === null) throw new McpToolError("INVALID_ARGUMENT", `${label}: after harus menunjuk teks di dalam bab (paragraf, tabel, grafik); sisipan tidak berlaku untuk meta/slot`);
      const paras = newParagraphs(e.insert);
      if (paras.length === 0) throw new McpToolError("INVALID_ARGUMENT", `${label}: insert kosong`);
      u.after.list.splice(u.after.list.indexOf(u.after.block) + 1, 0, ...paras);
      touch(u.scope);
      return;
    }
    const hits = locateClient(e.find, units, label, { ...(e.section !== undefined ? { section: e.section } : {}), all: e.occurrence === "all" });
    if (hits.some((h) => h.tier === "fuzzy")) warn({ code: "FUZZY_MATCH", message: `${label}: find cocok setelah normalisasi (huruf besar/kecil, spasi, kutip, tanda pisah, angka); ${hits.length} sasaran diganti` });
    for (const { u, spans } of hits) {
      if (e.replace === "" && u.remove !== null && normalize(e.find).text !== normalize(u.get()).text && fold(e.find).text !== fold(u.get()).text) {
        // L-1 (review 13): hapus paragraf/butir hanya bila find = seluruh teksnya.
        throw new McpToolError("EDIT_INVALID", `${label}: replace "" menghapus paragraf/butir hanya bila find berisi SELURUH teksnya; untuk membuang sebagian kalimat, tulis replace berisi sisa kalimat. Tidak ada yang ditulis`);
      }
      const repl = u.kind === "cell" || u.kind === "field" ? e.replace.replace(/\s+/g, " ") : e.replace;
      if (e.replace === "" && u.remove !== null) u.remove();
      else u.set(spliceSpans(u.get(), spans ?? [], () => repl), warn);
      touch(u.scope);
    }
  });
  return { touched: [...touched.values()], charts };
}

function locateChart(content: Rec, figure: string, label: string): { key: string; block: Rec } {
  const nf = normalize(figure).text;
  const found: Array<{ key: string; block: Rec }> = [];
  const sections = isObj(content.sections) ? content.sections : {};
  const chapters = isObj(sections.content) && Array.isArray(sections.content.chapters) ? (sections.content.chapters as Rec[]) : [];
  for (const ch of chapters) {
    const lists = [ch.intro, ...(Array.isArray(ch.sections) ? (ch.sections as Rec[]).map((s) => s.blocks) : [])];
    for (const l of lists) {
      for (const b of Array.isArray(l) ? (l as Rec[]) : []) {
        if (b.type === "chart" && isObj(b.caption) && nf !== "" && normalize(inlineText(b.caption)).text.includes(nf)) found.push({ key: String(ch.key), block: b });
      }
    }
  }
  if (found.length === 1) return found[0];
  throw new McpToolError(found.length === 0 ? "TEXT_NOT_FOUND" : "TEXT_AMBIGUOUS", `${label}: ${found.length === 0 ? "tidak ada grafik yang keterangannya memuat teks figure" : `${found.length} grafik cocok; perpanjang teks figure`}; tidak ada yang ditulis`, {
    untrusted: true,
    details: { edit: label, figures: found.slice(0, 5).map((f) => ({ part: `bab ${f.key}`, caption: snip(inlineText(f.block.caption as Rec)) })) },
  });
}

/** Data grafik sekarang (categorical/series) digabung dengan suntingan, lalu kode/data disusun ulang mesin. */
function chartPatch(block: Rec, edit: Partial<ClientChart>, warn: (w: ToolWarning) => void, label: string): Rec {
  const d = isObj(block.data) ? block.data : {};
  let categories: Array<string | number> = [];
  let series: Array<{ name: string; values: Array<number | null> }> = [];
  const caption = inlineText(isObj(block.caption) ? block.caption : {});
  if (d.shape === "categorical" && Array.isArray(d.points)) {
    const pts = d.points as Rec[];
    categories = pts.map((p) => String(p.label));
    series = [{ name: caption, values: pts.map((p) => (typeof p.value === "number" ? p.value : null)) }];
  } else if (d.shape === "series") {
    categories = Array.isArray(d.categories) ? (d.categories as string[]) : [];
    series = Array.isArray(d.series) ? (d.series as Array<{ name: string; values: Array<number | null> }>) : [];
  } else throw new McpToolError("INVALID_ARGUMENT", `${label}: grafik berbentuk ${tok(d.shape, "(tidak dikenal)")}; hanya kategori x seri yang dapat disunting lewat studio_edit`);
  const keepCode = edit.type === undefined && edit.stacked === undefined && edit.series === undefined && typeof block.code === "string";
  const merged: ClientChart = {
    categories: edit.categories ?? categories,
    series: edit.series ?? series,
    ...(edit.type !== undefined ? { type: edit.type } : keepCode ? { type: block.code as string } : {}),
    ...(edit.stacked !== undefined ? { stacked: edit.stacked } : {}),
    caption: edit.caption ?? caption,
    source: edit.source ?? inlineText(isObj(block.source) ? block.source : {}),
    ...(edit.unit !== undefined ? { unit: edit.unit } : typeof block.unit === "string" ? { unit: block.unit } : {}),
  };
  // IMPL-W3 butir 10: sumber tidak dikarang; grafik tanpa sumber -> SOURCE_MISSING (hasil normal, 0 tulis).
  const next = chartBlock(merged, null, warn, label, "grafik");
  const patch: Rec = { code: next.code, data: next.data };
  if (edit.caption !== undefined) patch.caption = next.caption;
  if (edit.source !== undefined) patch.source = next.source;
  if (next.unit !== undefined) patch.unit = next.unit;
  return patch;
}

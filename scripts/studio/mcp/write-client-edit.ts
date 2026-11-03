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
import { normalize } from "./write-edit";

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => v !== null && typeof v === "object" && !Array.isArray(v);

export type Scope = { kind: "chapter"; key: string } | { kind: "slot"; slot: string } | { kind: "meta" };
export interface JUnit {
  scope: Scope;
  kind: "paragraph" | "item" | "cell" | "caption" | "source" | "title" | "field";
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
      out.push(inlineUnit(scope, "field", v));
      return;
    }
    for (const [k, x] of Object.entries(v)) {
      if (typeof x === "string" && !FRONT_SKIP.has(k)) out.push({ scope, kind: "field", get: () => v[k] as string, set: (s) => (v[k] = s), remove: null, after: null });
      else walk(x);
    }
  };
  walk(payload);
}

const META_EDITABLE = ["title", "author", "classification", "audience", "custodian", "subject", "basis"];

function blockUnits(key: string, list: Rec[], out: JUnit[]): void {
  const scope: Scope = { kind: "chapter", key };
  list.forEach((b) => {
    const after = { list, block: b };
    if (b.type === "paragraph") out.push(inlineUnit(scope, "paragraph", b, { remove: () => list.splice(list.indexOf(b), 1), after }));
    else if (b.type === "list" && Array.isArray(b.items)) {
      const items = b.items as Rec[];
      items.forEach((it) => out.push(inlineUnit(scope, "item", it, { remove: () => items.splice(items.indexOf(it), 1), after })));
    } else if (Array.isArray(b.rows)) {
      for (const r of b.rows as Rec[]) for (const c of Array.isArray(r.cells) ? (r.cells as Rec[]) : []) out.push(inlineUnit(scope, "cell", c, { after }));
    }
    if (isObj(b.caption)) out.push(inlineUnit(scope, "caption", b.caption, { after }));
    if (isObj(b.source)) out.push(inlineUnit(scope, "source", b.source, { after }));
  });
}

export function clientUnits(content: Rec): JUnit[] {
  const out: JUnit[] = [];
  const meta = isObj(content.meta) ? content.meta : {};
  for (const f of META_EDITABLE) if (typeof meta[f] === "string") out.push({ scope: { kind: "meta" }, kind: "field", get: () => meta[f] as string, set: (s) => (meta[f] = s), remove: null, after: null });
  const sections = isObj(content.sections) ? content.sections : {};
  for (const slot of ["cover", "controlSheet", "signature"]) if (isObj(sections[slot])) slotUnits(slot, sections[slot], out);
  const chapters = isObj(sections.content) && Array.isArray(sections.content.chapters) ? (sections.content.chapters as Rec[]) : [];
  for (const ch of chapters) {
    const key = String(ch.key);
    if (isObj(ch.title)) out.push(inlineUnit({ kind: "chapter", key }, "title", ch.title));
    if (Array.isArray(ch.intro)) blockUnits(key, ch.intro as Rec[], out);
    for (const s of Array.isArray(ch.sections) ? (ch.sections as Rec[]) : []) {
      if (isObj(s.title)) out.push(inlineUnit({ kind: "chapter", key }, "title", s.title));
      if (Array.isArray(s.blocks)) blockUnits(key, s.blocks as Rec[], out);
    }
  }
  return out;
}

const scopeName = (s: Scope): string => (s.kind === "chapter" ? `bab ${s.key}` : s.kind === "slot" ? `slot ${s.slot}` : "meta");
const snip = (s: string): string => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 120 ? `${t.slice(0, 120)}...` : t;
};
function count(hay: string, needle: string): number {
  let n = 0;
  for (let k = hay.indexOf(needle); k >= 0; k = hay.indexOf(needle, k + needle.length)) n++;
  return n;
}

/** Satuan untuk `find`: tepat satu (atau satu kelompok salinan meta identik di depan); selain itu galat (+kandidat). */
export function locateClient(find: string, units: readonly JUnit[], label: string): JUnit[] {
  const nf = normalize(find).text;
  if (nf === "") throw new McpToolError("INVALID_ARGUMENT", `${label}: teks find/after kosong`);
  const hits = units.filter((u) => count(normalize(u.get()).text, nf) > 0);
  const total = hits.reduce((n, u) => n + count(normalize(u.get()).text, nf), 0);
  if (total === 0) {
    const words = new Set(nf.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3));
    const candidates = units
      .map((u) => ({ u, score: [...new Set(u.get().toLowerCase().split(/[^\p{L}\p{N}]+/u))].filter((w) => words.has(w)).length }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => ({ part: scopeName(x.u.scope), kind: x.u.kind, text: snip(x.u.get()) }));
    throw new McpToolError("TEXT_NOT_FOUND", `${label}: teks tidak ditemukan di paragraf, sel, keterangan, judul, atau medan dokumen (dicocokkan persis, spasi dinormalkan). Kandidat terdekat ada di blok rincian; tidak ada yang ditulis`, { untrusted: true, details: { edit: label, candidates } });
  }
  // Teks depan (meta, sampul, lembar kendali, tanda tangan) adalah salinan meta: semua salinan diganti bersama.
  const front = hits.every((u) => u.scope.kind !== "chapter") && hits.every((u) => count(normalize(u.get()).text, nf) === 1);
  if (total > 1 && !front) {
    throw new McpToolError("TEXT_AMBIGUOUS", `${label}: teks muncul ${total} kali; perpanjang find sampai unik. Lokasi ada di blok rincian; tidak ada yang ditulis`, {
      untrusted: true,
      details: { edit: label, matches: hits.slice(0, 5).map((u) => ({ part: scopeName(u.scope), kind: u.kind, text: snip(u.get()) })) },
    });
  }
  return hits;
}

function replaceIn(text: string, find: string, replace: string): string {
  const n = normalize(text);
  const nf = normalize(find).text;
  const k = n.text.indexOf(nf);
  return text.slice(0, n.map[k]) + replace + text.slice(n.map[k + nf.length - 1] + 1);
}

export type ClientEditOp = { find: string; replace: string } | { after: string; insert: string } | { figure: string; chart: Partial<ClientChart> };

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
    const units = clientUnits(content);
    if ("insert" in e) {
      const [u] = locateClient(e.after, units, label);
      if (u.after === null) throw new McpToolError("INVALID_ARGUMENT", `${label}: after harus menunjuk teks di dalam bab (paragraf, tabel, grafik); sisipan tidak berlaku untuk meta/slot`);
      const paras = e.insert
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\s+/g, " ").trim())
        .filter((p) => p !== "")
        .map((text) => ({ type: "paragraph", text }));
      if (paras.length === 0) throw new McpToolError("INVALID_ARGUMENT", `${label}: insert kosong`);
      u.after.list.splice(u.after.list.indexOf(u.after.block) + 1, 0, ...paras);
      touch(u.scope);
      return;
    }
    const hits = locateClient(e.find, units, label);
    for (const u of hits) {
      if (e.replace === "" && u.remove !== null && normalize(e.find).text !== normalize(u.get()).text) {
        // L-1 (review 13): hapus paragraf/butir hanya bila find = seluruh teksnya.
        throw new McpToolError("EDIT_INVALID", `${label}: replace "" menghapus paragraf/butir hanya bila find berisi SELURUH teksnya; untuk membuang sebagian kalimat, tulis replace berisi sisa kalimat. Tidak ada yang ditulis`);
      }
      if (e.replace === "" && u.remove !== null) u.remove();
      else u.set(replaceIn(u.get(), e.find, u.kind === "cell" || u.kind === "field" ? e.replace.replace(/\s+/g, " ") : e.replace), warn);
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
  const next = chartBlock(merged, merged.source as string, warn, label, "grafik");
  const patch: Rec = { code: next.code, data: next.data };
  if (edit.caption !== undefined) patch.caption = next.caption;
  if (edit.source !== undefined) patch.source = next.source;
  if (next.unit !== undefined) patch.unit = next.unit;
  return patch;
}

/**
 * S21: modul aturan structure_a: sampul §8.2 (CV), lembar kendali (CS), perilaku tier (TR).
 * Sumber pemeriksaan: research/32 §3, §4, §9; nilai harapan per bahasa: `expect_structure_a.ts`
 * (register research/31). Aturan memilih harapan lewat `ctx.pair.language`, tidak lewat slug.
 *
 * Unsur sampul E1..E11 dikenali per blok teratas seksi SAMPUL (research/32 CV-01). Keberlakuan
 * tier/bahasa disaring harness; `na` hanya untuk aturan bersyarat (CV-08 tanpa kicker, CV-10,
 * CV-11, CS-10, TR-01 pada blok MCP).
 */
import type { DocxDocument } from "../lib/docx";
import { colorNear, CONTROL_SHEET_KICKERS, isSealBandTable, SEAL_HEX, type ClassifiedSection, type DocLayout } from "../lib/layout";
import { attr, attrNum, childPath, descendants, type XmlElement } from "../lib/xml";
import {
  COLOPHON_LEFT,
  CONTROL_BLOCK_ORDER,
  COPY_NUMBER_RE,
  COVER_ADDRESS,
  COVER_CORE_ORDER,
  COVER_LEFT_TOL,
  COVER_LEFT_TW,
  COVER_REQUIRED_FIELDS,
  LOGO_CX_MAX,
  LOGO_CX_MIN,
  LOGO_CX_TOL,
  MONO_FONT_MARKERS,
  RULE_CX,
  RULE_CX_TOL,
  RULE_CY_MAX,
  SERIF_FONT_MARKERS,
  STRUCTURE_A_EXPECT,
  TIER_NAMES,
  type ControlBlockKind,
  type CoverField,
  type StructureAExpect,
} from "./expect_structure_a";
import { isCondFont } from "./fonts";
import { defineRule, fail, na, pass, type Rule, type RuleContext, type RuleResult } from "./types";

const DOC = "word/document.xml";

// ── Helper umum ───────────────────────────────────────────────────────────

const norm = (s: string) => s.replace(/\u00a0/g, " ").trim();
const within = (v: number | undefined, target: number, tol: number) => v !== undefined && Math.abs(v - target) <= tol;
const inRange = (v: number | undefined, lo: number, hi: number) => v !== undefined && v >= lo && v <= hi;
const hasMarker = (name: string | undefined, markers: readonly string[]) => !!name && markers.some((m) => name.includes(m));
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ALL_LANG_EXPECT: readonly StructureAExpect[] = Object.values(STRUCTURE_A_EXPECT);

function expectFor(ctx: RuleContext): StructureAExpect {
  return STRUCTURE_A_EXPECT[ctx.pair.language];
}

function textRuns(doc: DocxDocument, p: XmlElement): XmlElement[] {
  return doc.runs(p).filter((r) => doc.runText(r).trim() !== "");
}

function runFont(doc: DocxDocument, r: XmlElement): string | undefined {
  const f = doc.effectiveRunProps(r).fonts;
  return f.ascii ?? f.hAnsi;
}

/** Ringkas format run untuk nilai teramati. */
function describeRuns(doc: DocxDocument, runs: readonly XmlElement[]): string {
  return runs
    .map((r) => {
      const rp = doc.effectiveRunProps(r);
      return `${JSON.stringify(doc.runText(r).slice(0, 40))} sz=${rp.sz ?? "?"} font=${runFont(doc, r) ?? "?"} color=${rp.color ?? "?"}${rp.italic ? " i" : ""}${rp.bold ? " b" : ""}${rp.caps ? " caps" : ""}${rp.spacing !== undefined ? ` sp=${rp.spacing}` : ""}`;
    })
    .join("; ");
}

/** Setiap run teks memenuhi predikat; daftar run yang gagal dikembalikan. */
function runsFailing(doc: DocxDocument, runs: readonly XmlElement[], ok: (r: XmlElement) => boolean): XmlElement[] {
  return runs.filter((r) => !ok(r));
}

interface Drawing {
  readonly cx?: number;
  readonly cy?: number;
  /** Nilai `r:embed` semua elemen gambar di bawah drawing (blip, svgBlip). */
  readonly embeds: readonly string[];
}

function drawingsIn(el: XmlElement): Drawing[] {
  return descendants(el, "w:drawing").map((d) => {
    const ext = descendants(d, "wp:extent")[0];
    const embeds = descendants(d)
      .map((e) => attr(e, "r:embed"))
      .filter((v): v is string => !!v);
    return { cx: attrNum(ext, "cx"), cy: attrNum(ext, "cy"), embeds };
  });
}

const isRuleDrawing = (d: Drawing) => within(d.cx, RULE_CX, RULE_CX_TOL) && d.cy !== undefined && d.cy < RULE_CY_MAX;
const isLogoSized = (d: Drawing) => inRange(d.cx, LOGO_CX_MIN - LOGO_CX_TOL, LOGO_CX_MAX + LOGO_CX_TOL);

function loc(section: ClassifiedSection | undefined, extra?: string): string {
  if (!section) return extra ?? "";
  return extra ? `seksi ${section.index}, ${extra}` : `seksi ${section.index}`;
}

// ── Analisis sampul (E1..E11, research/32 CV-01) ──────────────────────────

type Elem = "E1" | "E2" | "E3" | "E5" | "E6" | "E7" | "E8" | "E9" | "E10" | "E11";
const ELEM_ORDER: readonly Elem[] = ["E1", "E2", "E3", "E5", "E6", "E7", "E8", "E9", "E10", "E11"];
const ELEM_REQUIRED: readonly Elem[] = ["E1", "E3", "E5", "E7", "E10", "E11"];
const ELEM_NAME: Readonly<Record<Elem, string>> = {
  E1: "pita segel",
  E2: "logo",
  E3: "baris alamat",
  E5: "Datum Rule",
  E6: "kicker",
  E7: "judul",
  E8: "standfirst",
  E9: "baris cakupan",
  E10: "blok kendali",
  E11: "kolofon",
};
const STAMP_RE = /\/\/ \d{8}/;

interface CoverInfo {
  readonly section: ClassifiedSection;
  readonly blocks: readonly XmlElement[];
  /** Indeks blok kemunculan pertama per unsur. */
  readonly at: Partial<Record<Elem, number>>;
  readonly logo?: Drawing;
  /** Paragraf teks dengan run terbesar (judul untuk CV-09). */
  readonly titlePara?: XmlElement;
}

const coverCache = new WeakMap<DocxDocument, Map<string, CoverInfo | null>>();

function analyzeCover(ctx: RuleContext): CoverInfo | undefined {
  const doc = ctx.docx;
  const key = ctx.pair.kicker;
  let byKicker = coverCache.get(doc);
  if (!byKicker) {
    byKicker = new Map();
    coverCache.set(doc, byKicker);
  }
  if (byKicker.has(key)) return byKicker.get(key) ?? undefined;
  const info = computeCover(doc, ctx.layout, key);
  byKicker.set(key, info ?? null);
  return info;
}

function computeCover(doc: DocxDocument, layout: DocLayout, kicker: string): CoverInfo | undefined {
  const section = layout.cover;
  if (!section) return undefined;
  const blocks = section.blocks;
  const at: Partial<Record<Elem, number>> = {};
  const mark = (e: Elem, i: number) => {
    if (at[e] === undefined) at[e] = i;
  };
  const kick = norm(kicker).toLowerCase();
  let logo: Drawing | undefined;
  let titlePara: XmlElement | undefined;
  let titleMax = -1;

  blocks.forEach((b, i) => {
    if (b.name === "w:tbl") {
      if (isSealBandTable(doc, b)) mark("E1", i);
      else if (doc.gridCols(b).length === 4) mark("E10", i);
      const t = doc.text(b);
      if (t.includes("NIB") && STAMP_RE.test(t)) mark("E11", i);
      return;
    }
    if (b.name !== "w:p") return;
    for (const d of drawingsIn(b)) {
      if (isRuleDrawing(d)) mark("E5", i);
      else if (!logo) {
        logo = d;
        mark("E2", i);
      }
    }
    const text = norm(doc.paragraphText(b));
    if (!text) return;
    const runs = textRuns(doc, b);
    const sizes = runs.map((r) => doc.effectiveRunProps(r).sz ?? 0);
    const maxSz = Math.max(0, ...sizes);
    if (maxSz > titleMax) {
      titleMax = maxSz;
      titlePara = b;
    }
    if (text.includes("NIB") && STAMP_RE.test(text)) {
      mark("E11", i);
      return;
    }
    if (text === COVER_ADDRESS) {
      mark("E3", i);
      return;
    }
    if (kick && text.toLowerCase() === kick) {
      mark("E6", i);
      return;
    }
    if (sizes.some((s) => s >= 48 && s <= 52)) {
      mark("E7", i);
      return;
    }
    if (maxSz >= 40) return; // baris judul lanjutan
    const allItalic = runs.every((r) => doc.effectiveRunProps(r).italic);
    const allSerif = runs.every((r) => hasMarker(runFont(doc, r), SERIF_FONT_MARKERS));
    if (allItalic || allSerif) {
      mark("E8", i);
      return;
    }
    const allCond = runs.every((r) => isCondFont(runFont(doc, r)));
    if (allCond && at.E7 !== undefined && i > at.E7) mark("E9", i);
  });
  return { section, blocks, at, logo, titlePara };
}

function noCover(): RuleResult {
  return fail("tidak ada seksi SAMPUL (seksi pertama bertabel pita segel)", { part: DOC });
}

function elemBlock(c: CoverInfo, e: Elem): XmlElement | undefined {
  const i = c.at[e];
  return i === undefined ? undefined : c.blocks[i];
}

// ── Blok kendali sampul ───────────────────────────────────────────────────

interface LabelCell {
  readonly label: string;
  readonly value: string;
  readonly valueCell: XmlElement;
}

function controlPairs(doc: DocxDocument, tbl: XmlElement): LabelCell[] {
  const out: LabelCell[] = [];
  for (const tr of doc.tableRows(tbl)) {
    const cells = doc.rowCells(tr);
    for (let k = 0; k + 1 < cells.length; k += 2) {
      const label = norm(doc.cellText(cells[k]));
      if (label) out.push({ label, value: norm(doc.cellText(cells[k + 1], { visible: true })), valueCell: cells[k + 1] });
    }
  }
  return out;
}

function fieldOf(exp: StructureAExpect, label: string): CoverField | undefined {
  const l = label.toLowerCase();
  for (const [f, labels] of Object.entries(exp.coverLabels) as [CoverField, readonly string[]][]) {
    if (labels.some((x) => x.toLowerCase() === l)) return f;
  }
  return undefined;
}

function tierValue(ctx: RuleContext): { cover?: CoverInfo; table?: XmlElement; value?: string; labels: string[] } {
  const cover = analyzeCover(ctx);
  const table = cover ? elemBlock(cover, "E10") : undefined;
  if (!table) return { cover, labels: [] };
  const pairs = controlPairs(ctx.docx, table);
  const exp = expectFor(ctx);
  const hit = pairs.find((p) => fieldOf(exp, p.label) === "tier");
  return { cover, table, value: hit?.value, labels: pairs.map((p) => p.label) };
}

// ── Lembar kendali ────────────────────────────────────────────────────────

const BLOCK_HEADING_RE = /^([A-Z]) · (.+)$/;

interface BlockHeading {
  readonly letter: string;
  readonly title: string;
  readonly index: number;
  /** Jenis blok dari judul dalam bahasa mana pun (untuk menemukan tabel). */
  readonly kind?: ControlBlockKind;
  /** Jenis blok bila judul sama dengan bahasa pasangan. */
  readonly kindInLang?: ControlBlockKind;
}

function kindOfTitle(exp: StructureAExpect, title: string): ControlBlockKind | undefined {
  return CONTROL_BLOCK_ORDER.find((k) => exp.blockTitles[k] === title);
}

function controlSheetSection(layout: DocLayout): ClassifiedSection | undefined {
  return layout.controlSheet ?? layout.wrappers[1];
}

function blockHeadings(ctx: RuleContext, section: ClassifiedSection): BlockHeading[] {
  const doc = ctx.docx;
  const exp = expectFor(ctx);
  const out: BlockHeading[] = [];
  section.blocks.forEach((b, index) => {
    if (b.name !== "w:p") return;
    const m = BLOCK_HEADING_RE.exec(norm(doc.paragraphText(b)));
    if (!m) return;
    const kind = ALL_LANG_EXPECT.map((e) => kindOfTitle(e, m[2])).find((k) => k !== undefined);
    out.push({ letter: m[1], title: m[2], index, kind, kindInLang: kindOfTitle(exp, m[2]) });
  });
  return out;
}

type TableKind = Exclude<ControlBlockKind, "method">;
const TABLE_KINDS: readonly TableKind[] = ["revision", "verification", "distribution"];

function headerRow(doc: DocxDocument, tbl: XmlElement): string[] {
  const tr = doc.tableRows(tbl)[0];
  return tr ? doc.rowCells(tr).map((tc) => norm(doc.cellText(tc))) : [];
}

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Tabel blok lembar kendali: tabel pertama sesudah judul blok; cadangan = cocok kepala kolom bahasa mana pun. */
function controlTables(ctx: RuleContext, section: ClassifiedSection): Partial<Record<TableKind, XmlElement>> {
  const doc = ctx.docx;
  const out: Partial<Record<TableKind, XmlElement>> = {};
  const heads = blockHeadings(ctx, section);
  heads.forEach((h, n) => {
    if (!h.kind || h.kind === "method" || out[h.kind]) return;
    const end = n + 1 < heads.length ? heads[n + 1].index : section.blocks.length;
    const t = section.blocks.slice(h.index + 1, end).find((b) => b.name === "w:tbl");
    if (t) out[h.kind] = t;
  });
  for (const t of section.blocks.filter((b) => b.name === "w:tbl")) {
    const head = headerRow(doc, t);
    for (const k of TABLE_KINDS) {
      if (!out[k] && ALL_LANG_EXPECT.some((e) => sameList(e.columns[k], head))) out[k] = t;
    }
  }
  return out;
}

/** Blok tanda tangan: baris 1 memuat peran (bahasa mana pun), baris 2 ruang tanda tangan kosong (`render.ts:521-566`). */
function isSignatureTable(doc: DocxDocument, tbl: XmlElement): boolean {
  const rows = doc.tableRows(tbl);
  if (rows.length < 3) return false;
  const first = doc.rowCells(rows[0]).map((c) => norm(doc.cellText(c)).toLowerCase());
  const second = doc.rowCells(rows[1]).map((c) => norm(doc.cellText(c)));
  const roles = new Set(ALL_LANG_EXPECT.flatMap((e) => e.signatureRoles.map((r) => r.toLowerCase())));
  return first.length > 0 && first.every((t) => t !== "") && first.some((t) => roles.has(t)) && second.every((t) => t === "");
}

function sectionsWithSignature(doc: DocxDocument, sections: readonly ClassifiedSection[]): number[] {
  return sections.filter((s) => doc.tables(s.blocks).some((t) => isSignatureTable(doc, t))).map((s) => s.index);
}

const TOC_RE = /^TOC\b/;

// ── Aturan CV ─────────────────────────────────────────────────────────────

const cvRules: Rule[] = [
  defineRule("CV-01", (ctx) => {
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const found = ELEM_ORDER.filter((e) => c.at[e] !== undefined);
    const observed = found.map((e) => `${e}@${c.at[e]}`).join(" ");
    const missing = ELEM_REQUIRED.filter((e) => c.at[e] === undefined);
    if (missing.length) {
      return fail(`unsur sampul wajib tidak ditemukan: ${missing.map((e) => `${e} ${ELEM_NAME[e]}`).join(", ")}`, { part: DOC, location: loc(c.section), observed });
    }
    for (let k = 1; k < found.length; k++) {
      const a = found[k - 1];
      const b = found[k];
      if (c.at[b]! <= c.at[a]!) {
        return fail(`urutan sampul salah: ${b} ${ELEM_NAME[b]} (blok ${c.at[b]}) tidak sesudah ${a} ${ELEM_NAME[a]} (blok ${c.at[a]})`, { part: DOC, location: loc(c.section), observed });
      }
    }
    return pass(`unsur sampul berurutan E1..E11 (${found.length} unsur dikenali)`, { part: DOC, location: loc(c.section), observed });
  }),

  defineRule("CV-02", (ctx) => {
    const cover = ctx.layout.cover;
    if (!cover) return noCover();
    const first = cover.blocks[0];
    const ok = !!first && first.name === "w:tbl" && isSealBandTable(ctx.docx, first);
    const observed = first ? (first.name === "w:tbl" ? `tabel ${ctx.docx.tableRows(first).length} baris` : `paragraf ${JSON.stringify(norm(ctx.docx.paragraphText(first)).slice(0, 60))}`) : "seksi kosong";
    return ok
      ? pass("blok pertama SAMPUL = tabel pita segel", { part: DOC, location: loc(cover, "blok 0"), observed })
      : fail("blok pertama SAMPUL bukan tabel pita segel", { part: DOC, location: loc(cover, "blok 0"), observed });
  }),

  defineRule("CV-03", (ctx) => {
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    if (!c.logo) return fail("tidak ada gambar logo di SAMPUL (gambar selain Datum Rule)", { part: DOC, location: loc(c.section) });
    const where = loc(c.section, `blok ${c.at.E2}`);
    const observed = `cx=${c.logo.cx ?? "?"} EMU (${c.logo.cx !== undefined ? (c.logo.cx / 36000).toFixed(1) : "?"} mm)`;
    return isLogoSized(c.logo)
      ? pass("lebar logo dalam 44-46 mm", { part: DOC, location: where, observed })
      : fail("lebar logo di luar 44-46 mm (+-0,1 mm)", { part: DOC, location: where, observed });
  }),

  defineRule("CV-04", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    if (!c.logo) return fail("tidak ada gambar logo di SAMPUL", { part: DOC, location: loc(c.section) });
    const docRels = doc.rels(DOC);
    const mediaOf = (rels: Map<string, { part?: string }>, d: Drawing) => new Set(d.embeds.map((id) => rels.get(id)?.part).filter((p): p is string => !!p));
    const logoParts = mediaOf(docRels, c.logo);
    if (logoParts.size === 0) return fail("gambar logo tidak merujuk bagian media", { part: DOC, location: loc(c.section), observed: c.logo.embeds.join(",") });
    const refsLogo = (rels: Map<string, { part?: string }>, d: Drawing) => [...mediaOf(rels, d)].some((p) => logoParts.has(p));
    const problems: string[] = [];
    const inDoc = drawingsIn(doc.body).filter((d) => refsLogo(docRels, d)).length;
    if (inDoc !== 1) problems.push(`media logo dirujuk ${inDoc} kali di document.xml`);
    for (const hf of [...doc.headerParts(), ...doc.footerParts()]) {
      const root = doc.part(hf);
      if (!root) continue;
      const rels = doc.rels(hf);
      const n = drawingsIn(root).filter((d) => refsLogo(rels, d)).length;
      if (n) problems.push(`media logo dirujuk ${n} kali di ${hf}`);
    }
    for (const s of ctx.layout.sections) {
      if (s.index === c.section.index) continue;
      const n = s.blocks.flatMap((b) => drawingsIn(b)).filter(isLogoSized).length;
      if (n) problems.push(`${n} gambar berukuran logo di seksi ${s.index}`);
    }
    const observed = [...logoParts].join(",");
    return problems.length
      ? fail(problems.join("; "), { part: DOC, location: loc(c.section), observed })
      : pass("logo dirujuk sekali, hanya di SAMPUL, tidak di header/footer", { part: DOC, location: loc(c.section), observed });
  }),

  defineRule("CV-05", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const p = elemBlock(c, "E3");
    if (!p) {
      const cand = c.blocks.filter((b) => b.name === "w:p").map((b) => norm(doc.paragraphText(b))).find((t) => /Jl\.|Bangka|Tel\./.test(t));
      return fail("baris alamat persis (research/31 §4.6) tidak ditemukan di SAMPUL", { part: DOC, location: loc(c.section), observed: cand ?? "tidak ada kandidat" });
    }
    const runs = textRuns(doc, p);
    const bad = runsFailing(doc, runs, (r) => within(doc.effectiveRunProps(r).sz, 14, 1));
    const where = loc(c.section, `blok ${c.at.E3}`);
    return bad.length
      ? fail("baris alamat bukan 7 pt (w:sz 14 +-1)", { part: DOC, location: where, observed: describeRuns(doc, bad) })
      : pass("baris alamat persis, 7 pt", { part: DOC, location: where, observed: describeRuns(doc, runs.slice(0, 1)) });
  }),

  defineRule("CV-06", (ctx) => {
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    if (c.at.E5 === undefined) {
      const seen = c.blocks.flatMap((b) => drawingsIn(b)).map((d) => `${d.cx}x${d.cy}`).join(", ");
      return fail("Datum Rule 166 mm (cx 5.976.000 +-18.000 EMU, tinggi < 10 mm) tidak ada di SAMPUL", { part: DOC, location: loc(c.section), observed: seen || "tanpa gambar" });
    }
    return pass("Datum Rule 166 mm ada di SAMPUL", { part: DOC, location: loc(c.section, `blok ${c.at.E5}`) });
  }),

  defineRule("CV-07", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const expected = norm(ctx.pair.kicker);
    if (!expected) return fail("kicker pasangan kosong: unsur 6 sampul (kicker jenis dokumen) tidak ada", { part: DOC, location: loc(c.section) });
    const p = elemBlock(c, "E6");
    if (!p) {
      const before = c.blocks
        .slice(0, c.at.E7 ?? c.blocks.length)
        .filter((b) => b.name === "w:p")
        .map((b) => norm(doc.paragraphText(b)))
        .filter((t) => t && t !== COVER_ADDRESS);
      return fail(`kicker "${expected.toUpperCase()}" tidak ditemukan di SAMPUL`, { part: DOC, location: loc(c.section), observed: before.join(" | ") || "tidak ada paragraf sebelum judul" });
    }
    const visible = norm(doc.paragraphText(p, { visible: true }));
    const where = loc(c.section, `blok ${c.at.E6}`);
    return visible === expected.toUpperCase()
      ? pass(`kicker = "${expected.toUpperCase()}", tampil kapital`, { part: DOC, location: where, observed: visible })
      : fail("kicker tidak tampil kapital", { part: DOC, location: where, observed: visible });
  }),

  defineRule("CV-08", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const p = elemBlock(c, "E6");
    if (!p) return na("kicker sampul (E6) tidak ada; bentuknya tidak dapat dinilai (CV-07 menilai keberadaannya)", { part: DOC, location: loc(c.section) });
    const runs = textRuns(doc, p);
    const bad = runsFailing(doc, runs, (r) => {
      const rp = doc.effectiveRunProps(r);
      return within(rp.sz, 15, 1) && isCondFont(runFont(doc, r)) && colorNear(rp.color, SEAL_HEX) && within(rp.spacing, 30, 4);
    });
    const where = loc(c.section, `blok ${c.at.E6}`);
    return bad.length
      ? fail("run kicker bukan 7,4 pt Cond seal +0,20 em (sz 15 +-1, fon Cond/Condensed, 6E1420, spacing 30 +-4)", { part: DOC, location: where, observed: describeRuns(doc, bad) })
      : pass("kicker 7,4 pt Cond seal +0,20 em", { part: DOC, location: where, observed: describeRuns(doc, runs.slice(0, 1)) });
  }),

  defineRule("CV-09", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const p = c.titlePara;
    if (!p) return fail("tidak ada paragraf teks di SAMPUL", { part: DOC, location: loc(c.section) });
    const runs = textRuns(doc, p);
    const bad = runsFailing(doc, runs, (r) => inRange(doc.effectiveRunProps(r).sz, 48, 52));
    const where = loc(c.section, `blok ${c.blocks.indexOf(p)} (paragraf berukuran terbesar)`);
    return bad.length
      ? fail("judul sampul di luar 24-26 pt (w:sz 48-52)", { part: DOC, location: where, observed: describeRuns(doc, bad) })
      : pass("judul sampul 24-26 pt", { part: DOC, location: where, observed: describeRuns(doc, runs.slice(0, 1)) });
  }),

  defineRule("CV-10", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const p = elemBlock(c, "E8");
    if (!p) return na("standfirst tidak ada (unsur 8 bersyarat)", { part: DOC, location: loc(c.section) });
    const runs = textRuns(doc, p);
    const bad = runsFailing(doc, runs, (r) => {
      const rp = doc.effectiveRunProps(r);
      return rp.italic && hasMarker(runFont(doc, r), SERIF_FONT_MARKERS) && within(rp.sz, 21, 1);
    });
    const where = loc(c.section, `blok ${c.at.E8}`);
    return bad.length
      ? fail("standfirst bukan 10,5 pt Serif miring (sz 21 +-1)", { part: DOC, location: where, observed: describeRuns(doc, bad) })
      : pass("standfirst 10,5 pt Serif miring", { part: DOC, location: where, observed: describeRuns(doc, runs.slice(0, 1)) });
  }),

  defineRule("CV-11", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const p = elemBlock(c, "E9");
    if (!p) return na("baris cakupan tidak ada (unsur 9 bersyarat)", { part: DOC, location: loc(c.section) });
    const runs = textRuns(doc, p);
    const bad = runsFailing(doc, runs, (r) => isCondFont(runFont(doc, r)) && within(doc.effectiveRunProps(r).sz, 15, 1));
    const where = loc(c.section, `blok ${c.at.E9}`);
    return bad.length
      ? fail("baris cakupan bukan 7,6 pt Cond (sz 15 +-1)", { part: DOC, location: where, observed: describeRuns(doc, bad) })
      : pass("baris cakupan 7,6 pt Cond", { part: DOC, location: where, observed: describeRuns(doc, runs.slice(0, 1)) });
  }),

  defineRule("CV-12", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const t = elemBlock(c, "E10");
    if (!t) return fail("blok kendali sampul (tabel 4 kolom) tidak ada", { part: DOC, location: loc(c.section) });
    const where = loc(c.section, `blok ${c.at.E10}`);
    const problems: string[] = [];
    const rows = doc.tableRows(t);
    if (rows.length > 4) problems.push(`${rows.length} baris (> 4)`);
    const labelBad: XmlElement[] = [];
    const valueBad: XmlElement[] = [];
    for (const tr of rows) {
      doc.rowCells(tr).forEach((tc, ci) => {
        const runs = doc.paragraphs(tc).flatMap((p) => textRuns(doc, p));
        if (ci % 2 === 0) labelBad.push(...runsFailing(doc, runs, (r) => within(doc.effectiveRunProps(r).sz, 13, 1) && isCondFont(runFont(doc, r))));
        else valueBad.push(...runsFailing(doc, runs, (r) => within(doc.effectiveRunProps(r).sz, 15, 1) && hasMarker(runFont(doc, r), MONO_FONT_MARKERS)));
      });
    }
    if (labelBad.length) problems.push(`label bukan 6,4 pt Cond (sz 13 +-1, fon Cond/Condensed): ${describeRuns(doc, labelBad.slice(0, 2))}`);
    if (valueBad.length) problems.push(`nilai bukan 7,4 pt Mono (sz 15 +-1, fon IBM Plex Mono): ${describeRuns(doc, valueBad.slice(0, 2))}`);
    const lineOk = (el: XmlElement | undefined) => within(attrNum(el, "w:sz"), 10, 1) && attr(el, "w:val") !== "none" && attr(el, "w:val") !== "nil";
    const tblTop = childPath(t, "w:tblPr", "w:tblBorders", "w:top");
    const firstCells = rows[0] ? doc.rowCells(rows[0]) : [];
    const tcTop = firstCells.length > 0 && firstCells.every((tc) => lineOk(childPath(tc, "w:tcPr", "w:tcBorders", "w:top")));
    const idx = c.at.E10!;
    const prev = idx > 0 ? c.blocks[idx - 1] : undefined;
    const pTop = prev?.name === "w:p" && lineOk(childPath(prev, "w:pPr", "w:pBdr", "w:bottom"));
    if (!lineOk(tblTop) && !tcTop && !pTop) problems.push("garis atas 0,45 mm (w:sz 10 +-1) tidak ada di tblBorders, tcBorders baris pertama, atau pBdr paragraf di atasnya");
    const observed = `grid=${doc.gridCols(t).join(",")} baris=${rows.length}`;
    return problems.length
      ? fail(problems.join("; "), { part: DOC, location: where, observed })
      : pass("blok kendali 4 kolom <= 4 baris, label 6,4 pt Cond, nilai 7,4 pt Mono, garis atas 0,45 mm", { part: DOC, location: where, observed });
  }),

  defineRule("CV-13", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const t = elemBlock(c, "E10");
    if (!t) return fail("blok kendali sampul (tabel 4 kolom) tidak ada", { part: DOC, location: loc(c.section) });
    const exp = expectFor(ctx);
    const pairs = controlPairs(doc, t);
    const fields = pairs.map((p) => fieldOf(exp, p.label)).filter((f): f is CoverField => !!f && COVER_CORE_ORDER.includes(f));
    const observed = pairs.map((p) => p.label).join(" | ");
    const where = loc(c.section, `blok ${c.at.E10}`);
    const missing = COVER_REQUIRED_FIELDS.filter((f) => !fields.includes(f));
    if (missing.length) return fail(`medan inti blok kendali (label ${ctx.pair.language}) tidak ada: ${missing.join(", ")}`, { part: DOC, location: where, observed });
    const ranks = fields.map((f) => COVER_CORE_ORDER.indexOf(f));
    for (let k = 1; k < ranks.length; k++) {
      if (ranks[k] <= ranks[k - 1]) return fail(`urutan medan inti salah: ${fields.join(", ")} (harus ${COVER_CORE_ORDER.join(", ")})`, { part: DOC, location: where, observed });
    }
    return pass(`medan inti berurutan: ${fields.join(", ")}`, { part: DOC, location: where, observed });
  }),

  defineRule("CV-16", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const b = elemBlock(c, "E11");
    if (!b) return fail("kolofon (NIB + cap terbit) tidak ada di SAMPUL", { part: DOC, location: loc(c.section) });
    let left: string;
    if (b.name === "w:tbl") {
      const tr = doc.tableRows(b)[0];
      const tc = tr ? doc.rowCells(tr)[0] : undefined;
      left = tc ? norm(doc.cellText(tc, { visible: true })) : "";
    } else {
      left = norm(doc.paragraphText(b, { visible: true }).split("\t")[0]);
    }
    const where = loc(c.section, `blok ${c.at.E11}, sisi kiri kolofon`);
    return left === COLOPHON_LEFT
      ? pass("kolofon kiri persis", { part: DOC, location: where, observed: left })
      : fail(`kolofon kiri bukan "${COLOPHON_LEFT}" (teks tampak)`, { part: DOC, location: where, observed: left });
  }),

  defineRule("CV-17", (ctx) => {
    const doc = ctx.docx;
    const c = analyzeCover(ctx);
    if (!c) return noCover();
    const paras = [...doc.paragraphs(c.blocks), ...c.blocks.flatMap((b) => descendants(b, "w:txbxContent")).flatMap((x) => doc.paragraphs(x))];
    const month = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/;
    const texts = paras.map((p) => norm(doc.paragraphText(p, { visible: true }))).filter((t) => t.includes(" · "));
    const hit = texts.find((t) => {
      const parts = t.split(" · ").map((x) => x.trim());
      return (
        parts.includes(ctx.pair.typeCode) &&
        parts.includes(ctx.pair.language) &&
        parts.some((x) => /^REV \S+$/.test(x)) &&
        parts.some((x) => month.test(x)) &&
        parts.some((x) => /^\d{4}$/.test(x))
      );
    });
    return hit
      ? pass("string punggung ada di SAMPUL", { part: DOC, location: loc(c.section), observed: hit })
      : fail(`string punggung (${ctx.pair.typeCode} · ... · ${ctx.pair.language} · REV <rev> · <bulan Romawi> · <tahun>) tidak ada di SAMPUL`, {
          part: DOC,
          location: loc(c.section),
          observed: texts.slice(-3).join(" | ") || "tidak ada teks berpemisah ' · '",
        });
  }),

  defineRule("CV-18", (ctx) => {
    const doc = ctx.docx;
    const cover = ctx.layout.cover;
    if (!cover) return noCover();
    const problems: string[] = [];
    if (!within(cover.pgMar.left, COVER_LEFT_TW, COVER_LEFT_TOL)) problems.push(`margin kiri ${cover.pgMar.left ?? "?"} tw (harus 1361 +-28)`);
    const centered = doc.paragraphs(cover.blocks).filter((p) => doc.effectiveParaProps(p).jc === "center");
    if (centered.length) problems.push(`${centered.length} paragraf rata tengah: ${JSON.stringify(norm(doc.paragraphText(centered[0])).slice(0, 40))}`);
    cover.blocks.forEach((b, i) => {
      if (b.name !== "w:p" || childPath(b, "w:pPr", "w:framePr")) return;
      const ind = doc.effectiveParaProps(b).indLeft ?? 0;
      if (!within(ind, 0, COVER_LEFT_TOL)) problems.push(`blok ${i} menjorok ${ind} tw`);
    });
    const observed = `pgMar.left=${cover.pgMar.left ?? "?"}`;
    return problems.length
      ? fail(problems.join("; "), { part: DOC, location: loc(cover), observed })
      : pass("unsur sampul rata kiri pada 24 mm", { part: DOC, location: loc(cover), observed });
  }),
];

// ── Aturan CS ─────────────────────────────────────────────────────────────

function noControlSheet(ctx: RuleContext): RuleResult {
  return fail(`tidak ada seksi LEMBAR KENDALI (kicker "${expectFor(ctx).controlSheetKicker}")`, { part: DOC, observed: `pembungkus: ${ctx.layout.wrappers.map((s) => s.index).join(",") || "-"}` });
}

const csRules: Rule[] = [
  defineRule("CS-01", (ctx) => {
    const second = ctx.layout.wrappers[1];
    if (!second) return fail("tidak ada seksi pembungkus kedua", { part: DOC, observed: `pembungkus: ${ctx.layout.wrappers.map((s) => s.index).join(",") || "-"}` });
    const classes = [...second.classes].join("+");
    if (!second.classes.has("controlSheet")) return fail("seksi pembungkus kedua bukan LEMBAR KENDALI", { part: DOC, location: loc(second), observed: classes });
    const first = second.blocks[0];
    return first && first.name === "w:tbl" && isSealBandTable(ctx.docx, first)
      ? pass("LEMBAR KENDALI = pembungkus kedua, dibuka pita segel", { part: DOC, location: loc(second, "blok 0"), observed: classes })
      : fail("LEMBAR KENDALI tidak dibuka tabel pita segel", { part: DOC, location: loc(second, "blok 0"), observed: first?.name ?? "seksi kosong" });
  }),

  defineRule("CS-02", (ctx) => {
    const doc = ctx.docx;
    const s = controlSheetSection(ctx.layout);
    if (!s) return noControlSheet(ctx);
    const exp = expectFor(ctx).controlSheetKicker;
    const texts = s.blocks.filter((b) => b.name === "w:p").map((b) => norm(doc.paragraphText(b))).filter((t) => t !== "");
    const [kicker, title] = texts;
    const observed = `kicker=${JSON.stringify(kicker ?? "")} judul=${JSON.stringify(title ?? "")}`;
    const titleOk = title === exp || (title !== undefined && new RegExp(`^${escRe(exp)} \\S*\\d`).test(title));
    if (kicker !== exp) return fail(`kicker lembar kendali bukan "${exp}"`, { part: DOC, location: loc(s), observed });
    if (!titleOk) return fail(`judul lembar kendali bukan "${exp}" atau "${exp} <nomor>"`, { part: DOC, location: loc(s), observed });
    return pass(`kicker dan judul lembar kendali = "${exp}"`, { part: DOC, location: loc(s), observed });
  }),

  defineRule("CS-03", (ctx) => {
    const s = controlSheetSection(ctx.layout);
    if (!s) return noControlSheet(ctx);
    const heads = blockHeadings(ctx, s);
    const observed = heads.map((h) => `${h.letter} · ${h.title}`).join(" | ");
    if (!heads.length) return fail("tidak ada judul blok berhuruf (<huruf> · <judul>) di lembar kendali", { part: DOC, location: loc(s) });
    const exp = expectFor(ctx);
    const foreign = heads.filter((h) => !h.kindInLang);
    if (foreign.length) return fail(`judul blok bukan judul ${ctx.pair.language} (research/31 §4.2): ${foreign.map((h) => h.title).join(", ")}`, { part: DOC, location: loc(s), observed });
    for (let k = 0; k < heads.length; k++) {
      const want = String.fromCharCode(65 + k);
      if (heads[k].letter !== want) return fail(`huruf blok ke-${k + 1} = ${heads[k].letter}, harus ${want}`, { part: DOC, location: loc(s), observed });
      if (k > 0 && CONTROL_BLOCK_ORDER.indexOf(heads[k].kindInLang!) <= CONTROL_BLOCK_ORDER.indexOf(heads[k - 1].kindInLang!)) {
        return fail(`urutan blok salah (harus ${CONTROL_BLOCK_ORDER.map((x) => exp.blockTitles[x]).join(", ")})`, { part: DOC, location: loc(s), observed });
      }
    }
    return pass(`${heads.length} judul blok berurutan`, { part: DOC, location: loc(s), observed });
  }),

  defineRule("CS-04", (ctx) => {
    const doc = ctx.docx;
    const s = controlSheetSection(ctx.layout);
    if (!s) return noControlSheet(ctx);
    const exp = expectFor(ctx);
    const tables = controlTables(ctx, s);
    const kinds = TABLE_KINDS.filter((k) => tables[k]);
    if (!kinds.length) return fail("tidak ada tabel riwayat revisi, rantai verifikasi, atau distribusi", { part: DOC, location: loc(s) });
    const bad: string[] = [];
    const seen: string[] = [];
    for (const k of kinds) {
      const head = headerRow(doc, tables[k]!);
      seen.push(`${k}=[${head.join(", ")}]`);
      if (!sameList(head, exp.columns[k])) bad.push(`${k}: [${head.join(", ")}] != [${exp.columns[k].join(", ")}]`);
    }
    return bad.length
      ? fail(`kepala kolom bukan daftar ${ctx.pair.language} research/31 §4.2: ${bad.join("; ")}`, { part: DOC, location: loc(s), observed: seen.join(" ") })
      : pass(`kepala kolom ${kinds.join(", ")} = daftar ${ctx.pair.language}`, { part: DOC, location: loc(s), observed: seen.join(" ") });
  }),

  defineRule("CS-07", (ctx) => {
    const doc = ctx.docx;
    const s = controlSheetSection(ctx.layout);
    if (!s) return noControlSheet(ctx);
    const t = controlTables(ctx, s).revision;
    if (!t) return fail("tabel riwayat revisi tidak ada", { part: DOC, location: loc(s) });
    const rows = doc.tableRows(t);
    const data = rows.slice(1).filter((tr) => doc.rowCells(tr).some((tc) => norm(doc.cellText(tc)) !== ""));
    return data.length >= 1
      ? pass(`riwayat revisi ${data.length} baris data`, { part: DOC, location: loc(s), observed: data.map((tr) => doc.rowCells(tr).map((tc) => norm(doc.cellText(tc))).join(" | ")).join(" / ") })
      : fail("riwayat revisi tanpa baris data", { part: DOC, location: loc(s), observed: `${rows.length} baris (kepala saja)` });
  }),

  defineRule("CS-10", (ctx) => {
    const doc = ctx.docx;
    const numbers = new Set<string>();
    for (const t of ctx.layout.sealBandTables) {
      const tr = doc.tableRows(t)[0];
      const right = tr ? doc.rowCells(tr)[1] : undefined;
      const m = right ? COPY_NUMBER_RE.exec(norm(doc.cellText(right, { visible: true }))) : null;
      if (m) numbers.add(m[2]);
    }
    if (!numbers.size) return na("pita segel tanpa nomor salinan (salinan induk); tidak ada salinan bernomor untuk diperiksa", { part: DOC });
    const s = controlSheetSection(ctx.layout);
    const dist = s ? controlTables(ctx, s).distribution : undefined;
    if (!dist) return fail(`salinan bernomor ${[...numbers].join(", ")} tanpa tabel distribusi`, { part: DOC, location: loc(s) });
    const holders = new Map<string, string>();
    for (const tr of doc.tableRows(dist).slice(1)) {
      const cells = doc.rowCells(tr).map((tc) => norm(doc.cellText(tc)));
      if (cells[0]) holders.set(cells[0], cells[1] ?? "");
    }
    const missing = [...numbers].filter((n) => !holders.get(n));
    const observed = [...holders].map(([n, h]) => `${n}=${h || "(kosong)"}`).join(", ");
    return missing.length
      ? fail(`salinan ${missing.join(", ")} tanpa pemegang bernama di tabel distribusi`, { part: DOC, location: loc(s), observed })
      : pass(`salinan ${[...numbers].join(", ")} punya pemegang`, { part: DOC, location: loc(s), observed });
  }),
];

// ── Aturan TR ─────────────────────────────────────────────────────────────

const trRules: Rule[] = [
  defineRule("TR-01", (ctx) => {
    const { cover, table, value, labels } = tierValue(ctx);
    if (!cover) return noCover();
    if (!table) return fail("blok kendali sampul (tabel 4 kolom) tidak ada", { part: DOC, location: loc(cover.section) });
    const where = loc(cover.section, `blok ${cover.at.E10}`);
    if (value === undefined) {
      return ctx.pair.producedBy === "mcp"
        ? na("blok kendali eksplisit MCP tanpa medan Tier (write-client.ts:141-149)", { part: DOC, location: where, observed: labels.join(" | ") })
        : fail("medan Tier tidak ada di blok kendali sampul", { part: DOC, location: where, observed: labels.join(" | ") });
    }
    return value === ctx.pair.tier
      ? pass(`tier sampul = ${ctx.pair.tier}`, { part: DOC, location: where, observed: value })
      : fail(`tier sampul bukan ${ctx.pair.tier}`, { part: DOC, location: where, observed: value });
  }),

  defineRule("TR-02", (ctx) => {
    const doc = ctx.docx;
    const L = ctx.layout;
    const problems: string[] = [];
    if (L.sealBandTables.length) problems.push(`${L.sealBandTables.length} tabel pita segel`);
    const kickers = doc.paragraphs(doc.body).map((p) => norm(doc.paragraphText(p))).filter((t) => CONTROL_SHEET_KICKERS.includes(t));
    if (kickers.length) problems.push(`kicker lembar kendali "${kickers[0]}"`);
    const toc = doc.fieldInstructions(doc.body).filter((f) => TOC_RE.test(f.instr));
    if (toc.length) problems.push(`medan TOC "${toc[0].instr}"`);
    const sig = sectionsWithSignature(doc, L.sections);
    if (sig.length) problems.push(`blok tanda tangan di seksi ${sig.join(",")}`);
    if (L.firstInteriorIndex !== 0) problems.push(L.firstInteriorIndex < 0 ? "tidak ada seksi interior" : `seksi pertama bukan interior (interior pertama = seksi ${L.firstInteriorIndex})`);
    const observed = L.sections.map((s) => `${s.index}:${[...s.classes].join("+") || "-"}`).join(" ");
    return problems.length
      ? fail(`NOTA memuat unsur depan: ${problems.join("; ")}`, { part: DOC, observed })
      : pass("NOTA tanpa sampul, lembar kendali, tanda tangan, daftar isi; seksi pertama interior", { part: DOC, observed });
  }),

  defineRule("TR-03", (ctx) => {
    const doc = ctx.docx;
    const L = ctx.layout;
    const w = L.wrappers;
    const problems: string[] = [];
    if (!L.cover || w[0] !== L.cover) problems.push("pembungkus pertama bukan SAMPUL");
    if (!L.controlSheet || w[1] !== L.controlSheet) problems.push("pembungkus kedua bukan LEMBAR KENDALI");
    if (!L.toc || !L.toc.classes.has("wrapper")) problems.push("tidak ada seksi DAFTAR ISI (pembungkus bermedan TOC)");
    else if (L.controlSheet && L.toc.index <= L.controlSheet.index) problems.push("DAFTAR ISI tidak sesudah LEMBAR KENDALI");
    if (L.firstInteriorIndex < 0) problems.push("tidak ada seksi interior");
    const sig = sectionsWithSignature(doc, w);
    if (!sig.length) problems.push("blok tanda tangan tidak ada di seksi pembungkus");
    const observed = L.sections.map((s) => `${s.index}:${[...s.classes].join("+") || "-"}`).join(" ") + (sig.length ? ` ttd@${sig.join(",")}` : "");
    return problems.length
      ? fail(problems.join("; "), { part: DOC, observed })
      : pass("SAMPUL, LEMBAR KENDALI, DAFTAR ISI berurutan sebelum interior; tanda tangan di pembungkus", { part: DOC, observed });
  }),

  defineRule("TR-04", (ctx) => {
    const { cover, table, value, labels } = tierValue(ctx);
    if (!cover) return noCover();
    if (!table) return fail("blok kendali sampul (tabel 4 kolom) tidak ada", { part: DOC, location: loc(cover.section) });
    const where = loc(cover.section, `blok ${cover.at.E10}`);
    if (value === undefined) return fail("medan Tier tidak ada di blok kendali sampul; nama tier tidak dapat dibuktikan", { part: DOC, location: where, observed: labels.join(" | ") });
    return (TIER_NAMES as readonly string[]).includes(value)
      ? pass(`nama tier Indonesia "${value}" di dokumen EN`, { part: DOC, location: where, observed: value })
      : fail("nama tier bukan NOTA, TERBIT, atau SERAH", { part: DOC, location: where, observed: value });
  }),

  defineRule("TR-08", (ctx) => {
    const doc = ctx.docx;
    const scope = ctx.layout.toc ? ctx.layout.toc.blocks : doc.body;
    const toc = doc.fieldInstructions(scope).filter((f) => TOC_RE.test(f.instr));
    if (!toc.length) return fail("tidak ada medan TOC", { part: DOC, location: loc(ctx.layout.toc) });
    const levels = toc.map((f) => /\\o\s*"1-(\d)"/.exec(f.instr)?.[1]).map((x) => (x === undefined ? undefined : Number(x)));
    const observed = toc.map((f) => f.instr).join(" | ");
    return levels.some((n) => n !== undefined && n >= 2)
      ? pass("medan TOC sampai tingkat seksi (\\o \"1-n\", n >= 2)", { part: DOC, location: loc(ctx.layout.toc), observed })
      : fail("medan TOC tidak mencakup tingkat 2 (\\o \"1-n\", n >= 2)", { part: DOC, location: loc(ctx.layout.toc), observed });
  }),
];

export const rules: readonly Rule[] = [...cvRules, ...csRules, ...trRules];


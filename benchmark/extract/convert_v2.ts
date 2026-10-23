/**
 * SR-32: benchmark Manual 000 v1 -> v2 (re-runnable, deterministic).
 *
 * Inputs (read-only): benchmark/manual000/doc.json (studio.doc/v1, content only, D-138) and
 * benchmark/manual000/template.json (template-profile/v1, KT-5 baseline after RT-01).
 *
 * Outputs:
 *   benchmark/manual000/doc.v2.json                  studio.doc/v2 = adaptV1(doc.json) (SR-09, D-179) + `preset`
 *                                                    per table (semantic table type, KC-6/D-166) - the leading
 *                                                    "SUMBER"/"KUNCI" label run of source/keyRow removed (machine
 *                                                    label, D-145); 0 display fields;
 *                                                    glyph runs dropped (the engine re-detects them with
 *                                                    render.run.symbolGlyphs); figure blocks keep `image` +
 *                                                    asset bm-fig-NN (D-160); no `render` field (D-247: build only
 *                                                    via POST /api/studio/documents/{id}/render).
 *   benchmark/manual000/datum-manual-000.preset.json preset "DATUM Manual 000" as a template-profile/v1 file
 *                                                    (found by loadResolvedTemplateV2File as <slug>.preset.json):
 *                                                    the informative overrides of template.json (research/09 §8.1;
 *                                                    no-op and class-T overrides dropped) + table/chart/diagram
 *                                                    widthClass full (D-168; BM figures 166 mm) + chapter.kicker.pattern
 *                                                    "Bab {n}" + render.table.layout.widthTw 9412 (D-152) +
 *                                                    render.table.columnProfiles reproducing the BM column widths
 *                                                    (D-166 KC-6) + render.run.symbolGlyphs (set of the 42 glyph runs)
 *                                                    + symbol.sheet.fit true (D-147) + chart.composite.gapMm 4.3
 *                                                    (register R-51) + P4S-13 BM (D-151); roleFormats of template.json
 *                                                    + rail.mark.labelRunByMark (D-144).
 *   benchmark/manual000/template.v2.json             studio.template/v2 = preset reference + essentials read from the
 *                                                    preset + 6-slot skeleton (no references/ruleIndex; toc MIXED,
 *                                                    D-165 KT-11); advanced = none (research/09 §8.1: template-level
 *                                                    advanced = 0).
 *
 * Usage (repo root):
 *   npx tsx --tsconfig tsconfig.json benchmark/extract/convert_v2.ts            write the three files
 *   npx tsx --tsconfig tsconfig.json benchmark/extract/convert_v2.ts --check    regenerate in memory, exit 1 if any file differs
 * Exit: 0 ok, 1 check mismatch / invariant failure, 2 input error.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ParamValue, StudioIngestRequest, StudioTier, TemplateSlotDef } from "../../src/lib/studio/contract";
import { adaptV1 } from "../../src/lib/studio/services/adapt-v1";
import { implicitSkeleton, validateSkeleton } from "../../src/lib/studio/services/skeleton/pure";
import { canonicalSectionPlan, splitDerivedOverrides } from "../../src/lib/studio/services/templates/profile";
import { stableStringify } from "../../src/lib/studio/services/ingest/util";
import { resolveParams } from "../../src/lib/studio/engine/tokens";
import { ALL_PARAMS, PARAMS_BY_KEY } from "../../src/lib/studio/params";
import { ESSENTIAL_KNOBS } from "../../src/lib/studio/registry/essentials";

const REPO = path.resolve(__dirname, "..", "..");
const DIR = path.join(REPO, "benchmark", "manual000");
export const FILES = {
  docV1: path.join(DIR, "doc.json"),
  templateV1: path.join(DIR, "template.json"),
  docV2: path.join(DIR, "doc.v2.json"),
  templateV2: path.join(DIR, "template.v2.json"),
  preset: path.join(DIR, "datum-manual-000.preset.json"),
} as const;
/** Indeks figur S94 (masukan baca-saja): spec chart benchmark yang dirender mesin (bm-fig-17..21). */
const FIGURE_INDEX = path.join(DIR, "figures", "index.json");

export const PRESET_SLUG = "datum-manual-000";
const TIER: StudioTier = "TERBIT";

/** P4S-13 BM (D-151; research/09 §8.1, coder_execution_rq6.md). */
export const BM_BOLD_FIELDS = ["nomor dokumen", "revisi", "nomor lembar", "jumlah lembar", "klasifikasi"];
/** D-152: lebar tabel tingkat atas BM (tblW). */
export const BM_TABLE_WIDTH_TW = 9412;
/** Register R-51 classNote: preset Manual 000 menyematkan 4,3 (S94 spec bm-fig-17..21 gapMm 4.3). */
export const BM_COMPOSITE_GAP_MM = 4.3;
/** P4A-04 terukur BM (doc.json kicker "Bab 1".."Bab 17"; lampiran "Lampiran A" diturunkan mesin). */
export const BM_CHAPTER_KICKER = "Bab {n}";
/**
 * Kunci lama yang nilai efektifnya SENGAJA berbeda dari baseline KT-5 (template.json pasca-RT-01, nilai terukur
 * kunci kelas T dipakai apa adanya; penjaga SR-36 §8.2). P4S-13 tidak termasuk: template.json kini menyematkannya.
 * Dibaca verify_v2.ts dan diusulkan sebagai Δ penjaga seed SR-36 (meta.intendedDelta preset).
 */
export const INTENDED_DELTA = [
  {
    key: "render.table.layout",
    reason: "D-152: lebar tabel tingkat atas BM = tblW 9412 (widthTw)",
    evidence: "BM.docx tblW 9412 dxa; render v1 tanpa widthTw = jumlah kolom 9409-9411 (105 tabel beda dari BM), v2 29",
  },
  {
    key: "chapter.kicker.pattern",
    reason: "v2: kicker bab = label mesin dari pola (DF-42); baseline 'BAB {n}' mencetak 'BAB 1'",
    evidence: "BM.docx unit S96 'Bab 1'..'Bab 17' dan 'Lampiran A'..'D' (0 huruf besar); render v2 dengan 'BAB {n}' = 10 hunk unit beda",
  },
  {
    key: "chart.output.widthMm",
    reason: "chart.widthClass full: figur v2 tanpa lebar (RK-10), lebar dari templat",
    evidence: "BM.docx wp:extent bm-fig-17..21 (chart) cx 5976000 EMU = 166,00 mm (5/5)",
  },
  {
    key: "diagram.widthMm",
    reason: "diagram.widthClass full: figur v2 tanpa lebar (RK-10), lebar dari templat",
    evidence: "BM.docx wp:extent bm-fig-06/08/23/24/38 (diagram) = 166,00 mm; bm-fig-25 = 100,00 mm (6/7 = 166)",
  },
  {
    key: "render.toc.title",
    reason: "RQ-8 (DF-58): judul daftar isi = kenop templat; TocPayloadV2 konten-saja tanpa judul (D-139)",
    evidence: "doc.verbatim.json front.toc.title = \"Peta Isi Manual\"; render v2 tanpa kenop = 4542 unit vs BM 4544 (2 unit TOC hilang)",
  },
  {
    key: "render.toc.note",
    reason: "RQ-8 (DF-58): catatan daftar isi = kenop templat",
    evidence: "doc.verbatim.json front.toc.note (paragraf peran toc.note); render v2 tanpa kenop kehilangan unit ini",
  },
  {
    key: "image.widthClass",
    reason: "RQ-8 (RK-10): figur image v2 tanpa lebar, kelas lebar dari templat; full = mayoritas BM",
    evidence: "doc.json image widthMm: 22/24 = 166 (raster 8/9, lembar simbol bm-fig-27/29/30/31 4/4); pengecualian bm-fig-11 = 128, bm-fig-25 = 100 (diagram)",
  },
  {
    key: "image.widthMm",
    reason: "turunan image.widthClass full (figureWidthFromClass) = bentang penuh",
    evidence: "BM.docx wp:extent figur raster/lembar simbol = 166 mm (lihat image.widthClass)",
  },
  {
    key: "symbolSheet.widthClass",
    reason: "RQ-8 (RK-10): blok symbolSheet v2 tanpa lebar, kelas lebar dari templat",
    evidence: "figures/index.json bm-fig-27/29/30/31 (symbolSheet) widthMm 166 (4/4)",
  },
  {
    key: "symbolSheet.widthMm",
    reason: "turunan symbolSheet.widthClass full (figureWidthFromClass) = bentang penuh",
    evidence: "sama dengan symbolSheet.widthClass",
  },
] as const;
/**
 * D-268 (FIX-A, IP-59): kode chart yang domain sumbunya parameter templat `chart.kind.<KODE>.axis`
 * (konten v2 menolak `axis`, DF-63..65 / D-139). Nilai preset dibaca dari spec chart benchmark
 * (S94, figures/index.json) HANYA bila tunggal per kode (satu nilai per jenis chart, tanpa
 * pengecualian per figur); nilai berbeda antar figur = konflik, tidak disetel dan dilaporkan.
 */
export const AXIS_TEMPLATE_CODES = ["P-13", "P-14", "S-01"] as const;

export interface AxisConversion {
  /** `chart.kind.<KODE>.axis` -> nilai tunggal (hanya kode tanpa konflik). */
  values: Record<string, ParamValue>;
  /** Per kode: sumber "figures/specs/<berkas> <id panel> <nilai>". */
  sources: Record<string, string[]>;
  /** Kode dengan nilai berbeda antar figur (tidak disetel). */
  conflicts: Record<string, string[]>;
  /** Kode tanpa nilai axis di spec benchmark (tetap bawaan registri null). */
  absent: string[];
}

/** Nilai `axis` spec chart benchmark per kode (alias data `params.axis` atau kunci penuh), tunggal/konflik/absen. */
export function chartAxisValues(): AxisConversion {
  const index = readJson(FIGURE_INDEX);
  need(Array.isArray(index.figures), "figures/index.json: figures missing");
  const found: Record<string, Array<{ value: Json; where: string }>> = {};
  const walk = (o: Json, file: string): void => {
    if (Array.isArray(o)) {
      o.forEach((x) => walk(x, file));
      return;
    }
    if (!isObj(o)) return;
    const code = typeof o.kind === "string" ? o.kind : undefined;
    if (code && (AXIS_TEMPLATE_CODES as readonly string[]).includes(code) && isObj(o.params)) {
      const full = `chart.kind.${code}.axis`;
      const value = o.params[full] !== undefined ? o.params[full] : o.params.axis;
      if (value !== undefined && value !== null) (found[code] ??= []).push({ value, where: `${file} ${String(o.id ?? code)} ${stableStringify(value)}` });
    }
    for (const v of Object.values(o)) walk(v, file);
  };
  for (const f of index.figures as Json[]) {
    if (!isObj(f) || f.kind !== "chart" || typeof f.spec !== "string") continue;
    walk(readJson(path.join(REPO, f.spec)), path.relative(DIR, path.join(REPO, f.spec)).split(path.sep).join("/"));
  }
  const out: AxisConversion = { values: {}, sources: {}, conflicts: {}, absent: [] };
  for (const code of AXIS_TEMPLATE_CODES) {
    const list = found[code] ?? [];
    if (list.length === 0) {
      out.absent.push(code);
      continue;
    }
    out.sources[code] = list.map((x) => x.where);
    const distinct = [...new Set(list.map((x) => stableStringify(x.value)))];
    if (distinct.length > 1) out.conflicts[code] = out.sources[code];
    else out.values[`chart.kind.${code}.axis`] = list[0].value as ParamValue;
  }
  return out;
}

/** Entri meta.intendedDelta untuk axis yang disetel (kunci registri lama, beda dari template.json = null). */
function axisIntendedDelta(axis: AxisConversion): Array<{ key: string; reason: string; evidence: string }> {
  return Object.keys(axis.values)
    .sort()
    .map((key) => {
      const code = key.split(".")[2];
      return {
        key,
        reason: `D-268 (FIX-A, IP-59): domain sumbu ${code} = parameter templat (konten v2 menolak axis, DF-63..65, D-139); satu nilai per jenis chart di Manual 000`,
        evidence: `S94 spec chart benchmark (BM Gambar 8.1; status ukur per catatan x.scaleNote spec): ${axis.sources[code].join("; ")} (${axis.sources[code].length}/${axis.sources[code].length} figur ${code}, nilai tunggal)`,
      };
    });
}

/** Nama preset tabel lembar kendali (jenis semantik). */
const CONTROL_SHEET_TABLES = ["revisionHistory", "verificationChain", "distribution"] as const;

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };

export class ConvertError extends Error {}

function need(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new ConvertError(msg);
}

function readJson(file: string): Obj {
  try {
    return JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, "")) as Obj;
  } catch (e) {
    throw new ConvertError(`cannot read ${path.relative(REPO, file)}: ${(e as Error).message}`);
  }
}

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const same = (a: unknown, b: unknown): boolean => stableStringify(a) === stableStringify(b);
export const sha256 = (s: string | Buffer): string => createHash("sha256").update(s).digest("hex");
export const pretty = (v: unknown): string => `${JSON.stringify(v, null, 2)}\n`;

/** Every table object (columns + rows) in document order (depth-first, key order). */
export function tablesInOrder(root: unknown): Obj[] {
  const out: Obj[] = [];
  const walk = (o: unknown): void => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (isObj(o)) {
      if (Array.isArray(o.columns) && Array.isArray(o.rows)) out.push(o);
      for (const k of Object.keys(o)) walk(o[k]);
    }
  };
  walk(root);
  return out;
}

function firstText(t: Obj): string {
  const s = JSON.stringify(t.rows);
  const m = /"t":"((?:[^"\\]|\\.)*)"/.exec(s) ?? /"text":"((?:[^"\\]|\\.)*)"/.exec(s);
  return m ? m[1] : "";
}

// ── doc.json -> doc.v2.json ──────────────────────────────────────────────

export interface DocConversion {
  doc: Obj;
  report: unknown;
  /** presetName -> colsTw (BM widths, from doc.json column widthTw). */
  profiles: Record<string, { colsTw: number[] }>;
  tables: number;
  glyphs: string[];
  glyphRuns: number;
  labelRunsStripped: { source: number; keyRow: number };
  /** RQ-8 (DF-58): judul dan catatan daftar isi BM (doc.json front.toc, teks run digabung) -> render.toc.title/note. */
  tocTitle: string;
  tocNote: string;
}

/** Teks polos `front.toc.<field>` doc.json (run dirangkai); wajib ada dan tak kosong. */
export function tocText(docV1: Obj, field: "title" | "note"): string {
  const front = docV1.front;
  const toc = isObj(front) ? front.toc : undefined;
  const inl = isObj(toc) ? toc[field] : undefined;
  need(isObj(inl) && Array.isArray(inl.runs), `doc.json front.toc.${field} missing`);
  const text = (inl.runs as Json[]).map((r) => (isObj(r) && typeof r.t === "string" ? r.t : "")).join("");
  need(text.trim().length > 0, `doc.json front.toc.${field} is empty`);
  return text;
}

/** Glyph set of the runs doc.json marks `faceRole: "symbolGlyph"` (42 runs, register §14.3), in first-seen order. */
export function glyphSetOf(docV1: unknown, defaults: readonly string[]): { glyphs: string[]; runs: number } {
  const seen: string[] = [...defaults];
  let runs = 0;
  const walk = (o: unknown): void => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (isObj(o)) {
      if (o.faceRole === "symbolGlyph" && typeof o.t === "string") {
        runs++;
        for (const ch of o.t) if (ch.trim() && !seen.includes(ch)) seen.push(ch);
      }
      for (const k of Object.keys(o)) walk(o[k]);
    }
  };
  walk(docV1);
  return { glyphs: seen, runs };
}

export function convertDoc(docV1: Obj): DocConversion {
  const r = adaptV1({ document: docV1 } as unknown as StudioIngestRequest, "strip", false, { tocMixed: true });
  const doc = JSON.parse(JSON.stringify(r.doc)) as Obj;
  // D-247: build hanya lewat endpoint render; doc.v2.json tidak membawa `render` (ingest v2 menolaknya RENDER_FIELD).
  need(!("render" in doc), "adaptV1 emitted doc.render; D-247 forbids render in studio.doc/v2 submissions");

  // Table presets (KC-6): v1 and v2 tables pair by document order (same count, column count and first text).
  const t1 = tablesInOrder(docV1);
  const t2 = tablesInOrder(doc.sections);
  need(t1.length === t2.length, `table count v1 ${t1.length} != v2 ${t2.length}`);
  const byWidths = new Map<string, string>();
  const profiles: Record<string, { colsTw: number[] }> = {};
  let n = 0;
  t1.forEach((a, i) => {
    const b = t2[i];
    const cols = a.columns as Obj[];
    need((b.columns as Json[]).length === cols.length, `table ${i}: column count differs`);
    need(firstText(a) === firstText(b), `table ${i}: first text differs ("${firstText(a)}" vs "${firstText(b)}")`);
    const widths = cols.map((c) => c.widthTw);
    need(widths.every((w) => typeof w === "number" && w > 0), `table ${i}: v1 column without widthTw`);
    const key = JSON.stringify(widths);
    let name = byWidths.get(key);
    if (!name) {
      name = i < CONTROL_SHEET_TABLES.length ? CONTROL_SHEET_TABLES[i] : `m000-t${String(++n).padStart(2, "0")}`;
      byWidths.set(key, name);
      profiles[name] = { colsTw: widths as number[] };
    }
    b.preset = name;
  });
  const cs = (doc.sections as Obj).controlSheet as Obj;
  CONTROL_SHEET_TABLES.forEach((k) => need((cs[k] as Obj).preset === k, `control sheet ${k}: preset not paired`));

  const labelRunsStripped = stripApparatusLabels(doc.sections);

  const defaults = PARAMS_BY_KEY.get("render.run.symbolGlyphs")?.default;
  need(Array.isArray(defaults), "render.run.symbolGlyphs default missing");
  const g = glyphSetOf(docV1, defaults as string[]);
  return { doc, report: r.report, profiles, tables: t2.length, glyphs: g.glyphs, glyphRuns: g.runs, labelRunsStripped, tocTitle: tocText(docV1, "title"), tocNote: tocText(docV1, "note") };
}

/**
 * Apparatus labels are machine-owned in v2 (D-145; compose `apparatusInline` emits "SUMBER  " / "KUNCI  " from the
 * field kind, SR-08). doc.json carries them as the first content run of `source` / `keyRow`; adaptV1 keeps that run,
 * which would print the label twice. Drop the first run when its text is exactly the label (whitespace aside).
 * No-op once the adaptor strips it itself (request to SR-09).
 */
export function stripApparatusLabels(root: unknown): { source: number; keyRow: number } {
  const n = { source: 0, keyRow: 0 };
  const LABEL = { source: "SUMBER", keyRow: "KUNCI" } as const;
  const walk = (o: unknown): void => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (isObj(o)) {
      for (const field of ["source", "keyRow"] as const) {
        const inl = o[field];
        if (isObj(inl) && Array.isArray(inl.runs) && inl.runs.length > 1) {
          const first = inl.runs[0];
          if (isObj(first) && typeof first.t === "string" && first.t.trim() === LABEL[field] && Object.keys(first).every((k) => k === "t" || k === "strong")) {
            inl.runs.shift();
            n[field]++;
          }
        }
      }
      for (const k of Object.keys(o)) walk(o[k]);
    }
  };
  walk(root);
  return n;
}

// ── template.json -> preset + template.v2.json ───────────────────────────

export interface TemplateConversion {
  preset: Obj;
  template: Obj;
  informative: string[];
  droppedNoop: string[];
  droppedDerived: string[];
  added: string[];
  axis: AxisConversion;
}

/** Effective value of every key with no overrides (registry + derivations). */
function canonicalEffective(): Record<string, ParamValue> {
  const { params, errors } = resolveParams({ base: {}, overrides: {}, registry: ALL_PARAMS });
  need(errors.length === 0, `canonical resolution: ${errors.map((e) => e.message).join("; ")}`);
  return params as Record<string, ParamValue>;
}

function presetEffective(overrides: Record<string, ParamValue>): Record<string, ParamValue> {
  const { params, errors } = resolveParams({ base: overrides, overrides: {}, registry: ALL_PARAMS });
  need(errors.length === 0, `preset resolution: ${errors.map((e) => e.message).join("; ")}`);
  return params as Record<string, ParamValue>;
}

export function convertTemplate(tplV1: Obj, conv: DocConversion, tplV1Sha: string, axis: AxisConversion = chartAxisValues()): TemplateConversion {
  need(isObj(tplV1.overrides), "template.json: overrides missing");
  need(isObj(tplV1.roleFormats), "template.json: roleFormats missing");
  const meta = isObj(tplV1.meta) ? tplV1.meta : {};
  need(meta.slug === PRESET_SLUG, `template.json meta.slug ${String(meta.slug)} != ${PRESET_SLUG}`);

  const split = splitDerivedOverrides(tplV1.overrides as Record<string, ParamValue>);
  const canon = canonicalEffective();
  const overrides: Record<string, ParamValue> = {};
  const droppedNoop: string[] = [];
  for (const k of Object.keys(split.kept)) {
    if (same(split.kept[k], canon[k])) droppedNoop.push(k);
    else overrides[k] = split.kept[k];
  }
  const informative = Object.keys(overrides).sort();

  const layout = (overrides["render.table.layout"] ?? split.kept["render.table.layout"] ?? canon["render.table.layout"]) as Obj;
  need(isObj(layout), "render.table.layout is not an object");
  const additions: Record<string, ParamValue> = {
    "table.widthClass": "full",
    // BM charts and diagrams span 166 mm (doc.json widthMm, 12 of 13; bm-fig-25 = 100 mm) -> P7-20/P9-36 via figureWidthFromClass.
    "chart.widthClass": "full",
    "diagram.widthClass": "full",
    // RQ-8 (RK-10): figur image/symbolSheet v2 tanpa lebar; BM 22/24 image = 166 mm (full). Turunan widthMm (class T) tidak ditulis.
    "image.widthClass": "full",
    "symbolSheet.widthClass": "full",
    // RQ-8 (DF-58): judul/catatan daftar isi = kenop templat (TocPayloadV2 konten-saja, D-139); teks BM dari doc.json front.toc.
    "render.toc.title": conv.tocTitle,
    "render.toc.note": conv.tocNote,
    "device.registerBlock.boldFields": BM_BOLD_FIELDS,
    "symbol.sheet.fit": true,
    "chart.composite.gapMm": BM_COMPOSITE_GAP_MM,
    "render.table.layout": { ...layout, widthTw: BM_TABLE_WIDTH_TW } as ParamValue,
    "render.table.columnProfiles": conv.profiles as unknown as ParamValue,
    "render.run.symbolGlyphs": conv.glyphs,
    // v2 kicker = machine label from the pattern (DF-42); BM prints "Bab 1" / "Lampiran A" (appendix word derived).
    "chapter.kicker.pattern": BM_CHAPTER_KICKER,
    // D-268: domain sumbu P-13/P-14/S-01 tunggal per kode dari spec chart benchmark (konflik/absen tidak disetel).
    ...axis.values,
  };
  const added: string[] = [];
  for (const [k, v] of Object.entries(additions)) {
    need(PARAMS_BY_KEY.has(k), `unknown parameter ${k}`);
    if (!same(overrides[k], v)) added.push(k);
    overrides[k] = v;
  }
  const sorted = Object.fromEntries(Object.keys(overrides).sort().map((k) => [k, overrides[k]])) as Obj;

  // roleFormats: template.json as is + rail.mark.labelRunByMark (colour of the mark label = colour of its glyph, S95-C04).
  const roleFormats = JSON.parse(JSON.stringify(tplV1.roleFormats)) as Obj;
  const rail = roleFormats["rail.mark"] as Obj;
  need(isObj(rail) && isObj(rail.glyphRun), "roleFormats rail.mark.glyphRun missing");
  const byMark: Obj = {};
  for (const [mark, run] of Object.entries(rail.glyphRun as Obj)) {
    need(isObj(run) && typeof run.color === "string", `glyphRun ${mark} without color`);
    byMark[mark] = { color: run.color };
  }
  rail.labelRunByMark = byMark;

  const classK = Array.isArray(meta.classKOverrides) ? (meta.classKOverrides as string[]).filter((k) => k in sorted) : [];
  const preset: Obj = {
    base: "datum-kanonik",
    meta: {
      slug: PRESET_SLUG,
      name: "DATUM Manual 000",
      kind: "DOCUMENT",
      description: "Preset terbatas DATUM Manual 000 (profil terukur BM.docx), nilai lengkap terukur (research/09 §8.1)",
      owner: "ADMINISTRATOR",
      ownerCallerKind: "ADMIN_SESSION",
      restricted: true,
      isPreset: true,
      classKOverrides: classK,
      derivedFrom: { file: "benchmark/manual000/template.json", sha256: tplV1Sha },
      generatedBy: "benchmark/extract/convert_v2.ts (SR-32)",
      decisions: ["D-138", "D-144", "D-147", "D-151", "D-152", "D-165 KT-5/KT-11", "D-166 KC-6", "D-168", ...(Object.keys(axis.values).length > 0 ? ["D-268"] : [])],
      intendedDelta: [...INTENDED_DELTA, ...axisIntendedDelta(axis)] as unknown as Json,
    },
    overrides: sorted,
    roleFormats,
    changeNote: "SR-32: preset DATUM Manual 000 dari template.json pasca-RT-01 (override informatif) + sematan v2",
  };

  // Essentials read from the preset (global knobs; per slot knobs of the slot's sectionType).
  const eff = presetEffective(overrides);
  const knobValues = (scope: string): Obj => {
    const out: Obj = {};
    for (const knob of ESSENTIAL_KNOBS) {
      if (knob.scope !== scope || knob.class === "K" || knob.mapping === "medan") continue;
      for (const k of knob.keys) {
        need(k in eff, `essential key ${k} has no effective value`);
        if (eff[k] !== null && eff[k] !== undefined) out[k] = eff[k] as Json;
      }
    }
    return Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]])) as Obj;
  };

  const implicit = implicitSkeleton(canonicalSectionPlan(), TIER);
  const slots: TemplateSlotDef[] = implicit.slots
    .filter((s) => s.sectionType !== "sourceRegister" && s.sectionType !== "ruleIndex")
    .map((s, i) => ({
      ...s,
      position: i + 1,
      ...(s.sectionType === "toc" ? { contentMode: "MIXED" as const } : {}),
      essentials: knobValues(s.sectionType) as Record<string, ParamValue>,
    }));
  const skeleton = validateSkeleton({ slots });
  need(skeleton.slots.length === 6, `skeleton has ${skeleton.slots.length} slots, expected 6`);
  const v2Slots = Object.keys((conv.doc.sections as Obj) ?? {});
  for (const k of v2Slots) need(skeleton.slots.some((s) => s.slotKey === k), `doc.v2 slot ${k} not in skeleton`);

  const template: Obj = {
    $schema: "studio.template/v2",
    preset: { slug: PRESET_SLUG },
    essentials: knobValues("global"),
    skeleton: { slots: skeleton.slots as unknown as Json },
  };
  return { preset, template, informative, droppedNoop, droppedDerived: split.dropped, added, axis };
}

// ── main ─────────────────────────────────────────────────────────────────

export function buildAll(): { outputs: Record<keyof typeof FILES, string> | Record<string, string>; doc: DocConversion; tpl: TemplateConversion } {
  const docV1 = readJson(FILES.docV1);
  const tplText = readFileSync(FILES.templateV1);
  const tplV1 = readJson(FILES.templateV1);
  const doc = convertDoc(docV1);
  const tpl = convertTemplate(tplV1, doc, sha256(tplText));
  return {
    outputs: { docV2: pretty(doc.doc), templateV2: pretty(tpl.template), preset: pretty(tpl.preset) },
    doc,
    tpl,
  };
}

function main(): number {
  const check = process.argv.includes("--check");
  let built: ReturnType<typeof buildAll>;
  try {
    built = buildAll();
  } catch (e) {
    console.error(`convert_v2: ${(e as Error).message}`);
    return e instanceof ConvertError ? 1 : 2;
  }
  const { outputs, doc, tpl } = built;
  let mismatch = 0;
  for (const [k, text] of Object.entries(outputs)) {
    const file = FILES[k as keyof typeof FILES];
    const rel = path.relative(REPO, file).replace(/\\/g, "/");
    if (check) {
      const cur = existsSync(file) ? readFileSync(file, "utf8") : null;
      const ok = cur === text;
      if (!ok) mismatch++;
      console.log(`${ok ? "SAME" : "DIFF"} ${rel} sha256=${sha256(text)}`);
    } else {
      // Tulis atomik (berkas sementara lalu rename; insiden F-063).
      const tmp = `${file}.tmp`;
      writeFileSync(tmp, text, "utf8");
      renameSync(tmp, file);
      console.log(`WROTE ${rel} ${Buffer.byteLength(text)} B sha256=${sha256(text)}`);
    }
  }
  console.log(
    JSON.stringify({
      tables: doc.tables,
      tablePresets: Object.keys(doc.profiles).length,
      glyphRuns: doc.glyphRuns,
      labelRunsStripped: doc.labelRunsStripped,
      symbolGlyphs: doc.glyphs.join(""),
      adaptReport: doc.report,
      presetOverrides: Object.keys(tpl.preset.overrides as Obj).length,
      informativeFromTemplateJson: tpl.informative.length,
      droppedNoop: tpl.droppedNoop.length,
      droppedDerived: tpl.droppedDerived,
      added: tpl.added,
      essentialsGlobal: Object.keys(tpl.template.essentials as Obj),
      chartAxis: { set: tpl.axis.values, conflicts: tpl.axis.conflicts, absent: tpl.axis.absent },
    }),
  );
  return mismatch > 0 ? 1 : 0;
}

if (require.main === module) process.exit(main());

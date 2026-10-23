/**
 * SR-41 (D-138/D-139): konversi dokumen v1 korpus paritas menjadi KONTEN SAJA.
 * Satu sumber logika untuk generator korpus (`tests/parity/fixtures/src/docs.ts`) dan
 * skrip normalisasi `content_only_doc_fixtures.ts`, sehingga bangun ulang menghasilkan
 * berkas yang sama.
 *
 *  1. `overrides` dokumen (tampilan, DF-41) dipindah ke profil templat pendamping
 *     (`<stem>.template.json`, `{ base: "datum-kanonik", overrides }`).
 *  2. Medan tampilan dibuang secara rakus TERPANDU ADAPTOR: sebuah medan/elemen dihapus
 *     hanya bila (a) dokumen tetap lolos skema v1 (`validateDocV1`), (b) jumlah
 *     `stripped` + `dropped` REPORT `SCHEMA_V1_ADAPTED` turun, dan (c) dokumen v2 hasil
 *     adaptor TIDAK berubah (stableStringify identik) — tidak ada konten yang hilang.
 *     Sisa yang tidak dapat dibuang = medan wajib skema v1.
 *  2b. Aset yang tidak dirujuk blok mana pun setelah pembuangan (mis. logo perangkat sampul:
 *     sampul disusun templat, D-138; D-248) dibuang dari v1 dan v2 - satu-satunya perubahan
 *     v2 yang diizinkan, diverifikasi terhadap target v2 tanpa aset itu.
 *  3. Salinan v2 = keluaran `adaptV1` (strip, pemanggil tidak tepercaya); wajib lolos
 *     `validateV2Against("studio.doc/v2")` dengan 0 isu (0 `DISPLAY_FIELD`).
 *
 * Deterministik (urutan kandidat tetap, tanpa acak/waktu).
 */
import type { StudioDocV1, StudioDocV2, StudioIngestRequest, ValidationIssue } from "../../../../src/lib/studio/contract";
import { adaptV1, type AdaptV1Result } from "../../../../src/lib/studio/services/adapt-v1";
import { validateDocV1 } from "../../../../src/lib/studio/services/ingest/v2";
import { validateV2Against } from "../../../../src/lib/studio/services/ingest/validate";
import { stableStringify } from "../../../../src/lib/studio/services/templates/profile";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Seg = string | number;

/** Nama medan yang pernah dibuang adaptor (kandidat; keputusan akhir tetap oleh syarat a-c). */
const CANDIDATE_KEYS = new Set([
  // format inline (R-38) — sama dengan INLINE_FORMAT_FIELDS adaptor
  "format", "runDefaults", "fieldFormats", "labelProps", "headingFormat", "paragraphFormat", "signRowFormat", "trailingFormat",
  "face", "faceRole", "szHalfPt", "color", "caps", "smallCaps", "spacingTw", "u", "x", "overrides",
  // tata letak / label mesin (selalu dibuang adaptor)
  "setup", "layout", "align", "kicker", "repeatHeader", "cantSplit", "widthMm", "heightMm", "width_mm", "widthTw", "widthPx", "heightPx",
  "colsTw", "cols", "cellFormats", "firstRowCell", "rowCell", "borders", "marginsTw", "shading", "vAlign", "sourcePlacement", "rowOrder",
  "numberSeparator", "apparatus", "inDocument", "gapMm", "params", "number", "separator", "marker", "mode", "sealBand", "showChapterList",
  "styleId", "label", "order", "title", "note", "source", "id", "columns", "axis", "max", "belowTargetColour", "compassLabels", "medianLabel",
  "widthClass", "style", "chapterKeys", "body", "entries",
  // permintaan render (bukan konten; studio.doc/v2 tanpa `render`, D-247)
  "outputs", "render",
]);

/** Kunci tingkat akar yang boleh dibuang (permintaan render, bukan konten; D-247). */
const TOP_LEVEL_CANDIDATES = new Set(["outputs", "render"]);

export interface TemplateProfileJson {
  base: "datum-kanonik";
  slug: string;
  kind: "DOCUMENT";
  description: string;
  overrides: Record<string, unknown>;
}

export interface ContentOnlyResult {
  /** Dokumen v1 konten-saja. */
  doc: StudioDocV1;
  /** Profil templat pendamping (hanya bila dokumen membawa `overrides`). */
  template?: TemplateProfileJson;
  /** Salinan studio.doc/v2. */
  v2: StudioDocV2;
  /** Pointer medan/elemen yang dibuang (urutan pembuangan). */
  removed: string[];
  /** Kunci aset v1 yang dibuang karena tidak dirujuk blok mana pun (D-248). */
  prunedAssets: string[];
  /** stripped+dropped REPORT adaptor sebelum dan sesudah. */
  before: number;
  after: number;
  residual: { stripped: Record<string, number>; dropped: Record<string, number> };
  v2Issues: ValidationIssue[];
}

function isObj(v: unknown): v is Record<string, Json> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function adapt(doc: Json): AdaptV1Result {
  return adaptV1({ document: doc as unknown as StudioDocV1 } as StudioIngestRequest, "strip", false, {});
}

function residualScore(r: AdaptV1Result): number {
  let n = 0;
  for (const v of Object.values(r.report.stripped)) n += v;
  for (const v of Object.values(r.report.dropped)) n += v;
  return n;
}

function ptr(p: readonly Seg[]): string {
  return p.length === 0 ? "" : `/${p.map((s) => String(s).replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`;
}

/** Kandidat: kunci objek bernama kandidat, dan elemen larik berisi objek. Terdalam lebih dulu; indeks larik menurun. */
function candidates(root: Json): Seg[][] {
  const out: Seg[][] = [];
  const walk = (v: Json, p: Seg[]): void => {
    if (Array.isArray(v)) {
      v.forEach((e, i) => walk(e, [...p, i]));
      for (let i = v.length - 1; i >= 0; i--) if (isObj(v[i])) out.push([...p, i]);
    } else if (isObj(v)) {
      for (const [k, c] of Object.entries(v)) {
        walk(c, [...p, k]);
        if ((p.length > 0 && CANDIDATE_KEYS.has(k)) || (p.length === 0 && TOP_LEVEL_CANDIDATES.has(k))) out.push([...p, k]);
      }
    }
  };
  walk(root, []);
  return out;
}

function without(root: Json, p: readonly Seg[]): Json | undefined {
  const clone = JSON.parse(JSON.stringify(root)) as Json;
  let cur: Json = clone;
  for (let i = 0; i < p.length - 1; i++) {
    const next: Json | undefined = Array.isArray(cur) ? cur[p[i] as number] : isObj(cur) ? cur[p[i] as string] : undefined;
    if (next === undefined) return undefined;
    cur = next;
  }
  const last = p[p.length - 1];
  if (Array.isArray(cur) && typeof last === "number" && last < cur.length) cur.splice(last, 1);
  else if (isObj(cur) && typeof last === "string" && last in cur) delete cur[last];
  else return undefined;
  return clone;
}

/** Kunci aset yang dirujuk di luar `assets` (nilai string sama dengan kunci aset). */
function referencedAssetKeys(doc: Json): Set<string> {
  const keys = new Set(isObj(doc) && isObj(doc.assets) ? Object.keys(doc.assets) : []);
  const used = new Set<string>();
  const walk = (v: Json, top: boolean): void => {
    if (Array.isArray(v)) v.forEach((e) => walk(e, false));
    else if (isObj(v)) {
      for (const [k, c] of Object.entries(v)) {
        if (top && k === "assets") continue;
        if (typeof c === "string" && keys.has(c)) used.add(c);
        walk(c, false);
      }
    }
  };
  walk(doc, true);
  return used;
}

/** Salinan `doc` tanpa aset yang tidak dirujuk; `assets` kosong dibuang. */
function pruneAssets(doc: Json): { doc: Json; pruned: string[] } {
  if (!isObj(doc) || !isObj(doc.assets)) return { doc, pruned: [] };
  const used = referencedAssetKeys(doc);
  const pruned = Object.keys(doc.assets).filter((k) => !used.has(k)).sort();
  if (pruned.length === 0) return { doc, pruned };
  const clone = JSON.parse(JSON.stringify(doc)) as { [k: string]: Json };
  const assets = clone.assets as { [k: string]: Json };
  for (const k of pruned) delete assets[k];
  if (Object.keys(assets).length === 0) delete clone.assets;
  return { doc: clone, pruned };
}

/** Profil templat pendamping untuk `overrides` dokumen `stem` (nilai sebelumnya dipertahankan, override dokumen menang). */
export function templateProfileFor(stem: string, overrides: Record<string, unknown>, prev: Record<string, unknown> = {}): TemplateProfileJson {
  const prevOverrides = isObj(prev.overrides) ? prev.overrides : {};
  return {
    base: "datum-kanonik",
    slug: `parity-${stem.replace(/_/g, "-")}`,
    kind: "DOCUMENT",
    description: `Profil tampilan fixture paritas ${stem} (SR-41: tampilan dokumen dipindah dari fixture konten-saja ke templat, D-138/D-139/D-248)`,
    ...(prev as Partial<TemplateProfileJson>),
    overrides: { ...prevOverrides, ...overrides },
  };
}

/**
 * Konversi satu dokumen v1 (`stem` = nama berkas tanpa `.json`). Melempar bila dokumen
 * awal tidak lolos skema v1 atau dokumen v2 berubah (konten hilang).
 */
export function toContentOnlyDoc(input: StudioDocV1, stem: string, prevTemplate?: Record<string, unknown>): ContentOnlyResult {
  let doc = JSON.parse(JSON.stringify(input)) as Json;
  if (!isObj(doc) || doc.$schema !== "studio.doc/v1") throw new Error(`${stem}: bukan studio.doc/v1`);
  const v1Before = validateDocV1(doc, "");
  if (v1Before.length > 0) throw new Error(`${stem}: tidak lolos skema v1 sebelum konversi: ${JSON.stringify(v1Before.slice(0, 3))}`);
  const first = adapt(doc);
  const before = residualScore(first);
  const targetV2 = stableStringify(first.doc);

  let template: TemplateProfileJson | undefined;
  if (isObj(doc.overrides) && Object.keys(doc.overrides).length > 0) {
    template = templateProfileFor(stem, doc.overrides, prevTemplate);
    const next = without(doc, ["overrides"]);
    if (next === undefined) throw new Error(`${stem}: gagal membuang overrides`);
    doc = next;
  } else if (prevTemplate && isObj(prevTemplate.overrides) && Object.keys(prevTemplate.overrides).length > 0) {
    // Tampilan sumber yang diangkat ke templat oleh penulis fixture (mis. margin halaman, D-248).
    template = templateProfileFor(stem, {}, prevTemplate);
  }

  const removed: string[] = [];
  let score = residualScore(adapt(doc));
  let progress = true;
  while (progress && score > 0) {
    progress = false;
    for (const p of candidates(doc)) {
      const next = without(doc, p);
      if (next === undefined) continue;
      if (validateDocV1(next, "").length > 0) continue;
      const r = adapt(next);
      const s = residualScore(r);
      if (s >= score) continue;
      if (stableStringify(r.doc) !== targetV2) continue;
      doc = next;
      score = s;
      removed.push(ptr(p));
      progress = true;
      break; // jalur berubah setelah penghapusan; hitung ulang kandidat
    }
  }

  // 2b) Aset tak dirujuk (D-248): buang dari v1; v2 harus = target tanpa aset tak dirujuk.
  let target = targetV2;
  const pv1 = pruneAssets(doc);
  let prunedAssets: string[] = [];
  if (pv1.pruned.length > 0) {
    const pv2 = pruneAssets(first.doc as unknown as Json);
    if (validateDocV1(pv1.doc, "").length === 0 && stableStringify(adapt(pv1.doc).doc) === stableStringify(pv2.doc)) {
      doc = pv1.doc;
      target = stableStringify(pv2.doc);
      prunedAssets = pv1.pruned;
    } else {
      throw new Error(`${stem}: aset tak dirujuk ${pv1.pruned.join(", ")} tidak dapat dibuang tanpa mengubah konten v2`);
    }
  }

  const final = adapt(doc);
  if (stableStringify(final.doc) !== target) throw new Error(`${stem}: dokumen v2 berubah setelah konversi (konten hilang)`);
  return {
    doc: doc as unknown as StudioDocV1,
    ...(template ? { template } : {}),
    v2: final.doc,
    removed,
    prunedAssets,
    before,
    after: score,
    residual: { stripped: final.report.stripped, dropped: Object.fromEntries(Object.entries(final.report.dropped).filter(([, v]) => v > 0)) },
    v2Issues: validateV2Against("studio.doc/v2", final.doc, ""),
  };
}

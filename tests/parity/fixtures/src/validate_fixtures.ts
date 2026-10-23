/**
 * Penjaga data korpus fixture paritas S63.
 *
 *   npx tsx tests/parity/fixtures/src/validate_fixtures.ts [--hs <folder datum-house-style>]
 *
 * 1. Setiap fixture kontrak lolos validator kontrak: ajv 2020 yang dibangun dari
 *    `STUDIO_SCHEMA_LOAD_ORDER` + `STUDIO_AJV_OPTIONS` (tanpa konfigurasi lokal).
 * 2. Dokumen juga lolos cek struktur ingest yang murni (tanpa DB): batas C11-C14,
 *    normalisasi (kunci bab/lampiran, bagian, blockId), G1/DATUM-10, pengikatan
 *    register + turunan, resolusi aset (sha256, MIME), typeCode daftar default P3-20.
 * 3. Cakupan terhitung dan dicetak: 29 jenis section dokumen, 3 tier, 9 keluarga
 *    diagram, 46 kode chart beracuan (kelas CA/CB1/CB2), 41 simbol + 4 lembar.
 * 4. Klaim = berkas tertulis: setiap entri manifest ada dengan sha256 cocok, dan
 *    setiap berkas JSON di folder fixture terdaftar di manifest.
 * SR-41 (D-138/D-139/D-243): dokumen v1 konten-saja (tanpa `overrides`); tampilan dokumen
 * (moda rel `layout.railMode`) dibaca dari profil pendamping `doc/<stem>.template.json`;
 * salinan `doc/v2/<stem>.json` lolos validator v2 produksi (`validateV2Against`, 0 DISPLAY_FIELD).
 * Exit 0 bila semua lolos, 1 bila ada kegagalan.
 */
import Ajv2020 from "ajv/dist/2020";
import type { AnySchema } from "ajv";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  DIAGRAM_EDGE_KINDS,
  DIAGRAM_FAMILIES,
  DIAGRAM_SHAPES,
  STUDIO_AJV_OPTIONS,
  STUDIO_SCHEMA_LOAD_ORDER,
  STUDIO_TIERS,
  SYMBOL_DIALECTS,
  TABLE_BLOCK_TYPES,
  type ChartData,
  type StudioChartV1,
  type StudioDiagramV1,
  type StudioDocV1,
} from "../../../../src/lib/studio/contract";
import { STUDIO_SCHEMA_URL_BASE } from "../../../../src/lib/studio/contract/schema/common.schema";
import { CHART_BY_CODE, CHART_DATA_CONSTRAINTS, CHART_REGISTRY } from "../../../../src/lib/studio/registry/charts";
import { SECTION_REGISTRY } from "../../../../src/lib/studio/registry/sections";
import { SYMBOL_IDS } from "../../../../src/lib/studio/engine/symbols";
import { REGISTER_TABLE_PRESETS, FINANCIAL_TABLE_PRESETS } from "../../../../src/lib/studio/engine/docx/tables/presets";
import { limitIssues, validateV2Against } from "../../../../src/lib/studio/services/ingest/validate";
import { parseTemplateProfile } from "../../../../src/lib/studio/services/templates/profile";
import { normalizeDocument } from "../../../../src/lib/studio/services/ingest/normalize";
import { bindRegister, tableChecks } from "../../../../src/lib/studio/services/ingest/checks";
import { resolveDocAssets } from "../../../../src/lib/studio/services/ingest/assets";
import { PARAMS_BY_KEY } from "../../../../src/lib/studio/params";
import { DEFAULT_HS_DIR } from "./paths";
import { P07_LITERAL, W03_LITERAL } from "./literal_s65";

const ROOT = path.resolve(__dirname, "..");
let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log(`  GAGAL ${msg}`);
};
const check = (ok: boolean, msg: string) => {
  if (!ok) fail(msg);
  return ok;
};

interface Entry {
  id: string;
  kind: string;
  file: string;
  schema?: string;
  parityClass: string[];
  tier?: string;
  code?: string;
  family?: string;
  dialect?: string;
  symbol?: string;
  sha256: string;
}
interface Manifest {
  counts: Record<string, number>;
  fixtures: Entry[];
  sources: Array<{ file: string; origin: string; sha256: string }>;
}

const readJson = <T>(rel: string): T => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8")) as T;
const sha = (rel: string) => createHash("sha256").update(readFileSync(path.join(ROOT, rel))).digest("hex");

// ── 1. ajv kontrak ────────────────────────────────────────────────────────

const ajv = new Ajv2020({ ...STUDIO_AJV_OPTIONS });
for (const s of STUDIO_SCHEMA_LOAD_ORDER) ajv.addSchema(s as unknown as AnySchema);
function validateSchema(schemaId: string, data: unknown): string[] {
  // Kontrak v2 (SID01) memakai validator produksi: pemeta DISPLAY_FIELD/V1_FIELD tunggal (D-172).
  if (schemaId === "studio.doc/v2") {
    return validateV2Against("studio.doc/v2", data, "").slice(0, 5).map((i) => `${i.pointer || "/"} ${(i as { checkId?: string }).checkId ?? i.keyword} ${i.message}`);
  }
  const v = ajv.getSchema(`${STUDIO_SCHEMA_URL_BASE}/${schemaId}.json`);
  if (!v) return [`skema ${schemaId} tidak terdaftar`];
  if (v(data)) return [];
  return (v.errors ?? []).slice(0, 5).map((e) => `${e.instancePath || "/"} ${e.keyword} ${e.message ?? ""}`);
}

// ── Penghitung cakupan dokumen ────────────────────────────────────────────

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

interface DocCoverage {
  sections: Set<string>;
  tableTypes: Set<string>;
  presets: Map<string, Set<string>>;
  asides: Set<string>;
  devices: Set<string>;
  roles: Set<string>;
  frontModes: Set<string>;
  tocModes: Set<string>;
  railModes: Set<string>;
  railKinds: Set<string>;
  headerModes: Set<string>;
  figures: number;
}

function newCoverage(): DocCoverage {
  return {
    sections: new Set(),
    tableTypes: new Set(),
    presets: new Map(),
    asides: new Set(),
    devices: new Set(),
    roles: new Set(),
    frontModes: new Set(),
    tocModes: new Set(),
    railModes: new Set(),
    railKinds: new Set(),
    headerModes: new Set(),
    figures: 0,
  };
}

const TABLE_TYPES = new Set<string>(TABLE_BLOCK_TYPES);
const CONTENT_SECTION_KEYS = new Set(SECTION_REGISTRY.filter((s) => s.group === "DOCUMENT").map((s) => s.key));

function walkItems(node: unknown, cov: DocCoverage): void {
  if (Array.isArray(node)) {
    node.forEach((n) => walkItems(n, cov));
    return;
  }
  if (!isObj(node)) return;
  const t = node.type;
  if (typeof t === "string") {
    if (CONTENT_SECTION_KEYS.has(t)) cov.sections.add(t);
    if (t === "signatureBlock") cov.sections.add("signatureBlock");
    if (TABLE_TYPES.has(t)) {
      cov.tableTypes.add(t);
      if (typeof node.preset === "string") {
        const set = cov.presets.get(t) ?? new Set<string>();
        set.add(node.preset);
        cov.presets.set(t, set);
      }
    }
    if (t === "aside" && typeof node.variant === "string") cov.asides.add(node.variant);
    if (t === "device" && typeof node.device === "string") cov.devices.add(node.device);
    if (t === "paragraph") cov.roles.add(typeof node.role === "string" ? node.role : "body");
    if (t === "chart" || t === "diagram" || t === "image" || t === "symbolSheet") cov.figures++;
  }
  if (Array.isArray(node.rail) && node.rail.length > 0) {
    for (const r of node.rail) if (isObj(r) && typeof r.kind === "string") cov.railKinds.add(r.kind);
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === "x" || k === "spec") continue; // spec chart/diagram bukan blok
    if ((k === "header" || k === "footer") && isObj(v) && typeof v.mode === "string") cov.headerModes.add(`${k}:${v.mode}`);
    if (v !== null && typeof v === "object") walkItems(v, cov);
  }
}

/** Profil tampilan pendamping `doc/<stem>.template.json` (SR-41); `undefined` bila tidak ada. */
function templateOverridesFor(docFile: string): Record<string, unknown> | undefined {
  const rel = docFile.replace(/\.json$/i, ".template.json");
  if (!existsSync(path.join(ROOT, rel))) return undefined;
  const raw = readJson<Obj>(rel);
  return isObj(raw.overrides) ? raw.overrides : {};
}

function docCoverage(doc: StudioDocV1, cov: DocCoverage, templateOverrides: Record<string, unknown> | undefined): void {
  const f = doc.front;
  if (f?.cover) {
    cov.sections.add("cover");
    cov.frontModes.add(`cover:${f.cover.mode}`);
  }
  if (f?.controlSheet) {
    cov.sections.add("controlSheet");
    cov.frontModes.add(`controlSheet:${f.controlSheet.mode}`);
  }
  if (f?.toc) {
    cov.sections.add("toc");
    cov.tocModes.add(f.toc.mode);
  }
  if (f?.signature) cov.sections.add("signatureBlock");
  if ((doc.parts ?? []).length > 0) cov.sections.add("partDivider");
  if (doc.chapters.length > 0) cov.sections.add("chapter");
  if ((doc.appendices ?? []).length > 0) cov.sections.add("appendix");
  for (const c of [...doc.chapters, ...(doc.appendices ?? [])]) if (c.sections.length > 0) cov.sections.add("section");
  // D-139: tampilan milik templat; moda rel dibaca dari profil pendamping, bukan dari dokumen.
  const rm = templateOverrides?.["layout.railMode"];
  if (typeof rm === "string") cov.railModes.add(rm);
  walkItems({ front: doc.front, parts: doc.parts, chapters: doc.chapters, appendices: doc.appendices }, cov);
}

// ── Cek batas data chart (CHART_DATA_CONSTRAINTS + D-63) ─────────────────

type ShapeOf<S extends ChartData["shape"]> = Extract<ChartData, { shape: S }>;
const nSeries = (d: ChartData) => (d.shape === "series" ? d.series.length : -1);
const nGroups = (d: ChartData) => (d.shape === "distribution" ? d.groups.length : -1);
const params = (s: StudioChartV1) => s.params ?? {};

const CONSTRAINT_CHECKS: Record<string, (s: StudioChartV1, d: ChartData) => boolean> = {
  "P-03": (_s, d) => nSeries(d) >= 2,
  "P-05": (_s, d) => nGroups(d) >= 3,
  "P-06": (_s, d) => nSeries(d) >= 2,
  "P-07": (_s, d) => JSON.stringify(d) === JSON.stringify(P07_LITERAL),
  "P-08": (_s, d) => nSeries(d) >= 2,
  "P-09": (s, d) => d.shape === "categorical" && d.points.length === 1 && (typeof s.limit === "number" || typeof params(s).target === "number"),
  "P-12": (_s, d) => nSeries(d) >= 1 && nSeries(d) <= 6,
  "P-15": (s, d) => d.shape === "matrix" || (Array.isArray(params(s).tableRows) && Array.isArray(params(s).tableHead)),
  "H-03": (_s, d) => d.shape === "matrix" && d.rows.length === 6 && d.cols.length === 8 && d.values.length === 6 && d.values.every((r) => r.length === 8),
  "H-04": (_s, d) => d.shape === "xy",
  "H-06": (_s, d) => d.shape === "matrix" && d.values.length === d.rows.length && d.values.every((r) => r.length === d.cols.length),
  "H-07": (s, d) => {
    if (d.shape !== "graph") return false;
    const pos = params(s).positions;
    return pos === undefined || (isObj(pos) && d.nodes.every((n) => Array.isArray((pos as Obj)[n.id])));
  },
  "K-01": (_s, d) => d.shape === "series" && d.series.every((x) => x.values.length === d.categories.length),
  "K-02": (_s, d) => d.shape === "series" && d.series.every((x) => x.values.length === d.categories.length),
  "K-03": (_s, d) => nSeries(d) >= 2,
  "K-04": (_s, d) => nSeries(d) >= 2,
  "K-07": (_s, d) => d.shape === "categorical",
  "K-09": (_s, d) => d.shape === "categorical" && d.points.every((p) => typeof p.sub === "string"),
  "K-12": (s, d) => {
    const w = params(s).widths;
    return d.shape === "series" && (w === undefined || (Array.isArray(w) && w.length === d.categories.length));
  },
  "W-01": (_s, d) => d.shape === "series" && d.series.length >= 2 && d.series.every((x) => x.values.length === 12),
  "W-03": (_s, d) => JSON.stringify(d) === JSON.stringify(W03_LITERAL),
  "W-05": (_s, d) => d.shape === "series" && d.series.length >= 3 && d.series.every((x) => x.values.length === 12),
  "W-06": (_s, d) => d.shape === "series" && d.categories.length === 4,
  "W-07": (_s, d) =>
    d.shape === "intervals" &&
    d.items.filter((i) => i.milestone).length === 1 &&
    d.items.every((i) => typeof i.start === "number" && typeof i.end === "number"),
  "W-08": (_s, d) => nGroups(d) >= 1,
  "S-01": (_s, d) => nGroups(d) >= 1,
  "S-03": (_s, d) => nGroups(d) >= 1,
  "S-04": (_s, d) => nGroups(d) === 3,
  "G-01": (_s, d) => d.shape === "tiles" && d.tiles.length > 0,
  "G-04": (_s, d) => d.shape === "steps" && (d as ShapeOf<"steps">).spec.nodes.length >= 1 && (d as ShapeOf<"steps">).spec.nodes.length <= 6,
};

// ── main ─────────────────────────────────────────────────────────────────

function listJson(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (statSync(abs).isDirectory()) {
      if (name === "src") continue;
      out.push(...listJson(abs));
    } else if (name.endsWith(".json")) out.push(path.relative(ROOT, abs).split(path.sep).join("/"));
  }
  return out;
}

function main(): void {
  const hsArg = process.argv.indexOf("--hs");
  const hsDir = hsArg >= 0 ? process.argv[hsArg + 1] : (process.env.DATUM_HS_DIR ?? DEFAULT_HS_DIR);
  const m = readJson<Manifest>("manifest.json");

  console.log("== 4. Klaim = berkas tertulis (manifest)");
  let present = 0;
  for (const e of m.fixtures) {
    const abs = path.join(ROOT, e.file);
    if (check(existsSync(abs), `${e.id}: berkas ${e.file} tidak ada`) && check(sha(e.file) === e.sha256, `${e.id}: sha256 ${e.file} tidak cocok manifest`)) present++;
  }
  for (const s of m.sources) check(existsSync(path.join(ROOT, s.file)) && sha(s.file) === s.sha256, `sumber ${s.file} hilang/berubah`);
  const listed = new Set([...m.fixtures.map((e) => e.file), ...m.sources.map((s) => s.file), "manifest.json"]);
  const onDisk = listJson(ROOT);
  const unlisted = onDisk.filter((f) => !listed.has(f));
  check(unlisted.length === 0, `berkas JSON tidak terdaftar manifest: ${unlisted.join(", ")}`);
  console.log(`  entri manifest ${m.fixtures.length}, berkas ada + sha256 cocok ${present}/${m.fixtures.length}; JSON di disk ${onDisk.length}, tak terdaftar ${unlisted.length}; sumber Garis A ${m.sources.length}`);

  console.log("== 1. Validator kontrak (ajv STUDIO_SCHEMA_LOAD_ORDER + STUDIO_AJV_OPTIONS)");
  const bySchema = new Map<string, { ok: number; n: number }>();
  const seenFiles = new Set<string>();
  for (const e of m.fixtures) {
    if (!e.schema || seenFiles.has(e.file)) continue;
    seenFiles.add(e.file);
    const errs = validateSchema(e.schema, readJson(e.file));
    const agg = bySchema.get(e.schema) ?? { ok: 0, n: 0 };
    agg.n++;
    if (errs.length === 0) agg.ok++;
    else fail(`${e.id} (${e.file}) tidak lolos ${e.schema}: ${errs.join(" | ")}`);
    bySchema.set(e.schema, agg);
  }
  for (const [k, v] of bySchema) console.log(`  ${k}: ${v.ok}/${v.n} VALID`);

  console.log("== 2. Cek struktur ingest (tanpa DB) dokumen");
  const typeCodes = (PARAMS_BY_KEY.get("doc.typeCode")?.default ?? []) as string[];
  const docs = m.fixtures.filter((e) => e.kind === "doc");
  const cov = newCoverage();
  const tiers = new Set<string>();
  for (const e of docs) {
    const doc = readJson<StudioDocV1>(e.file);
    tiers.add(doc.meta.tier);
    check(!doc.overrides || Object.keys(doc.overrides).length === 0, `${e.id}: dokumen membawa overrides (tampilan milik templat pendamping, D-138/D-139)`);
    docCoverage(doc, cov, templateOverridesFor(e.file));
    const lim = limitIssues(doc);
    const norm = normalizeDocument(doc, {});
    const tbl = tableChecks(norm.snapshot, norm.pointers).filter((i) => i.status === "FAIL");
    const bind = bindRegister(norm.snapshot, norm.pointers, doc.meta.tier, "/register");
    const bindFail = bind.issues.filter((i) => i.status === "FAIL" || i.status === "REPORT");
    const assets = resolveDocAssets(doc, null, [], "");
    const tc = typeCodes.length === 0 || typeCodes.includes(doc.meta.typeCode);
    const all = [...lim.map((i) => i.message), ...norm.issues.map((i) => i.message), ...tbl.map((i) => `${i.checkId} ${i.detail}`), ...bindFail.map((i) => `${i.checkId} ${i.detail}`), ...assets.issues.map((i) => i.message)];
    if (!tc) all.push(`typeCode ${doc.meta.typeCode} di luar daftar default P3-20 (${typeCodes.join(",")})`);
    if (all.length > 0) fail(`${e.id}: ${all.slice(0, 5).join(" | ")}`);
    console.log(
      `  ${e.id} [${doc.meta.tier}] blok beralamat ${norm.snapshot.blocks.filter((b) => b.address !== null).length}, blok total ${norm.snapshot.blocks.length}, aset ${assets.assets.size}, register ${Object.keys(bind.register).length}, isu ${all.length}`,
    );
  }

  // SR-41: pasangan v1 <-> v2 dan profil pendamping.
  const v2Files = new Set(m.fixtures.filter((e) => e.kind === "docV2").map((e) => e.file));
  for (const e of docs) {
    const v2 = e.file.replace(/^doc\//, "doc/v2/");
    check(v2Files.has(v2), `${e.id}: salinan v2 ${v2} tidak terdaftar manifest`);
  }
  for (const v2 of v2Files) check(docs.some((e) => e.file.replace(/^doc\//, "doc/v2/") === v2), `${v2}: salinan v2 tanpa dokumen v1`);
  const tpls = m.fixtures.filter((e) => e.kind === "docTemplate");
  for (const t of tpls) {
    try {
      const parsed = parseTemplateProfile(readJson(t.file));
      check(parsed.droppedDerived.length === 0, `${t.id}: profil membawa kunci kelas T ${parsed.droppedDerived.join(",")}`);
      check(docs.some((e) => e.file.replace(/\.json$/i, ".template.json") === t.file), `${t.id}: profil tanpa dokumen v1`);
    } catch (err) {
      fail(`${t.id}: profil templat tidak sah: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`  salinan v2 ${v2Files.size}/${docs.length}; profil tampilan pendamping ${tpls.length}`);

  console.log("== 3. Cakupan");
  const docKeys = SECTION_REGISTRY.filter((s) => s.group === "DOCUMENT").map((s) => s.key);
  const missingSections = docKeys.filter((k) => !cov.sections.has(k));
  check(missingSections.length === 0, `section dokumen tidak tercakup: ${missingSections.join(", ")}`);
  console.log(`  section dokumen: ${docKeys.filter((k) => cov.sections.has(k)).length}/${docKeys.length} (${docKeys.length === 29 ? "registri 29" : "registri " + docKeys.length})`);
  const missingTiers = STUDIO_TIERS.filter((t) => !tiers.has(t));
  check(missingTiers.length === 0, `tier tidak tercakup: ${missingTiers.join(", ")}`);
  console.log(`  tier: ${STUDIO_TIERS.filter((t) => tiers.has(t)).length}/3 (${[...tiers].join(", ")})`);
  const missTables = TABLE_BLOCK_TYPES.filter((t) => !cov.tableTypes.has(t));
  check(missTables.length === 0, `jenis tabel tidak tercakup: ${missTables.join(", ")}`);
  const reg = cov.presets.get("registerTable") ?? new Set();
  const fin = cov.presets.get("financialTable") ?? new Set();
  check(REGISTER_TABLE_PRESETS.every((p) => reg.has(p)), `preset registerTable kurang: ${REGISTER_TABLE_PRESETS.filter((p) => !reg.has(p)).join(", ")}`);
  check(FINANCIAL_TABLE_PRESETS.every((p) => fin.has(p)), `preset financialTable kurang: ${FINANCIAL_TABLE_PRESETS.filter((p) => !fin.has(p)).join(", ")}`);
  console.log(
    `  keluarga tabel ${TABLE_BLOCK_TYPES.length - missTables.length}/11; preset registerTable ${REGISTER_TABLE_PRESETS.filter((p) => reg.has(p)).length}/${REGISTER_TABLE_PRESETS.length}; financialTable ${FINANCIAL_TABLE_PRESETS.filter((p) => fin.has(p)).length}/${FINANCIAL_TABLE_PRESETS.length}`,
  );
  check(cov.asides.size === 5, `varian aside ${cov.asides.size}/5`);
  check(cov.railModes.has("A") && cov.railModes.has("B"), `moda rel bukti A/B: ${[...cov.railModes].join(",")}`);
  console.log(
    `  aside ${cov.asides.size}/5; perangkat ${[...cov.devices].sort().join(",")} (${cov.devices.size}/6); moda rel ${[...cov.railModes].sort().join("/")}; jenis rel ${[...cov.railKinds].sort().join(",")}; halaman depan ${[...cov.frontModes].sort().join(",")}; toc ${[...cov.tocModes].sort().join(",")}; header/footer ${[...cov.headerModes].sort().join(",")}; peran paragraf ${cov.roles.size}; figur ${cov.figures}`,
  );

  // diagram
  const dgs = m.fixtures.filter((e) => e.kind === "diagram");
  const fam = new Set<string>();
  const shapes = new Set<string>();
  const edgeKinds = new Set<string>();
  for (const e of dgs) {
    const s = readJson<StudioDiagramV1>(e.file);
    fam.add(s.family);
    check(e.family === s.family, `${e.id}: family manifest ${e.family} != spec ${s.family}`);
    check(/\d+\.\d+/.test(s.id) && s.title.trim().endsWith("."), `${e.id}: id/judul melanggar aturan Garis A`);
    check((s.edges ?? []).filter((x) => x.kind === "accent").length <= 1, `${e.id}: > 1 konektor aksen (DATUM-26)`);
    for (const n of s.nodes) shapes.add(n.shape ?? "box");
    for (const x of s.edges ?? []) edgeKinds.add(x.kind);
  }
  const missFam = DIAGRAM_FAMILIES.filter((f) => !fam.has(f));
  check(missFam.length === 0, `keluarga diagram tidak tercakup: ${missFam.join(", ")}`);
  console.log(
    `  keluarga diagram: ${DIAGRAM_FAMILIES.length - missFam.length}/9 (${dgs.length} spec); bentuk ${shapes.size}/${DIAGRAM_SHAPES.length}; jenis konektor ${edgeKinds.size}/${DIAGRAM_EDGE_KINDS.length}`,
  );
  for (const s of m.sources) {
    const hsFile = path.join(hsDir, "fixtures_diagram", path.basename(s.file));
    if (existsSync(hsFile)) {
      const same = createHash("sha256").update(readFileSync(hsFile)).digest("hex") === sha(s.file);
      check(same, `${s.file} tidak byte-identik dengan ${hsFile}`);
      console.log(`  salinan Garis A ${path.basename(s.file)}: ${same ? "byte-identik" : "BERBEDA"} dengan HS`);
    } else console.log(`  salinan Garis A ${path.basename(s.file)}: HS tidak terjangkau, banding dilewati`);
  }

  // chart
  const charts = m.fixtures.filter((e) => e.kind === "chart");
  const referenced = CHART_REGISTRY.filter((c) => c.drawn && c.pyRef.kind !== "none").map((c) => c.code);
  const got = new Set(charts.map((e) => e.code ?? ""));
  const missCodes = referenced.filter((c) => !got.has(c));
  check(missCodes.length === 0, `kode chart beracuan tanpa fixture: ${missCodes.join(", ")}`);
  check(charts.every((e) => referenced.includes(e.code as never)), "ada fixture chart untuk kode tanpa acuan");
  const cls: Record<string, number> = {};
  let constraintsChecked = 0;
  for (const e of charts) {
    const s = readJson<StudioChartV1>(e.file);
    const def = CHART_BY_CODE.get(s.kind as never);
    if (!check(!!def && s.kind === e.code, `${e.id}: kind ${s.kind} tidak cocok`)) continue;
    const d = s.data as ChartData;
    check(d.shape === def!.dataShape, `${e.id}: bentuk data ${d.shape} != dataShape registri ${def!.dataShape}`);
    check(e.parityClass[0] === def!.parityClass, `${e.id}: kelas manifest ${e.parityClass[0]} != registri ${def!.parityClass}`);
    cls[def!.parityClass ?? "?"] = (cls[def!.parityClass ?? "?"] ?? 0) + 1;
    const fn = CONSTRAINT_CHECKS[s.kind];
    if (s.kind in CHART_DATA_CONSTRAINTS) {
      if (check(!!fn, `${e.id}: batas ${s.kind} tanpa pemeriksa`) && check(fn(s, d), `${e.id}: melanggar CHART_DATA_CONSTRAINTS "${CHART_DATA_CONSTRAINTS[s.kind as never]}"`)) constraintsChecked++;
    }
    if (s.kind === "P-01" && d.shape === "categorical") {
      const sorted = d.points.every((p, i) => i === 0 || d.points[i - 1].value >= p.value);
      check(sorted && d.points[0].accent === true && d.points.every((p) => p.value >= 0 && !p.sub), `${e.id}: D-63 (urut menurun, aksen titik pertama, non-negatif, tanpa sub)`);
    }
  }
  console.log(
    `  kode chart beracuan: ${referenced.filter((c) => got.has(c)).length}/${referenced.length} (CA ${cls.CA ?? 0}, CB1 ${cls.CB1 ?? 0}, CB2 ${cls.CB2 ?? 0}); batas CHART_DATA_CONSTRAINTS diperiksa ${constraintsChecked}/${Object.keys(CHART_DATA_CONSTRAINTS).length}`,
  );

  // simbol
  const syms = m.fixtures.filter((e) => e.kind === "symbol").map((e) => e.symbol ?? "");
  const list = readJson<{ ids: string[] }>("symbol/symbols.json").ids;
  check(syms.length === 41 && list.length === 41, `jumlah simbol ${syms.length}/${list.length}, harus 41`);
  check(JSON.stringify(list) === JSON.stringify([...SYMBOL_IDS]), "daftar simbol != SYMBOL_IDS mesin Node (urutan/isi)");
  const sheets = m.fixtures.filter((e) => e.kind === "symbolSheet").map((e) => e.dialect ?? "");
  check(SYMBOL_DIALECTS.every((d) => sheets.includes(d)), `lembar dialek kurang: ${SYMBOL_DIALECTS.filter((d) => !sheets.includes(d)).join(", ")}`);
  const perD = SYMBOL_DIALECTS.map((d) => `${d} ${list.filter((x) => x.startsWith(d + ":")).length}`).join(", ");
  console.log(`  simbol: ${new Set(list).size}/41 unik (${perD}); sama dengan SYMBOL_IDS Node: ${JSON.stringify(list) === JSON.stringify([...SYMBOL_IDS])}; lembar per dialek ${sheets.length}/4`);

  console.log(failures === 0 ? "HASIL: LOLOS (0 kegagalan)" : `HASIL: GAGAL (${failures} kegagalan)`);
  process.exit(failures === 0 ? 0 : 1);
}

main();

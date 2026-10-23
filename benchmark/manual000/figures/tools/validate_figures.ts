/**
 * S94 penjaga data figur benchmark Manual 000.
 *
 * - 52 penempatan terklasifikasi tanpa sisa (id bm-fig-01..52 berurutan, jenis dikenal).
 * - Setiap spec lolos validator kontrak: ajv dari STUDIO_SCHEMA_LOAD_ORDER + STUDIO_AJV_OPTIONS
 *   (01_specs.md §3.10); blok figur lolos `$defs/<Jenis>Block` skema studio.doc/v1.
 * - Aturan isi Garis A yang tidak di skema: id diagram memuat \d+\.\d+, judul berakhir titik,
 *   edge merujuk simpul yang ada, maks 1 edge accent.
 * - sha256 berkas aset = sha256 indeks = sha256 media docx (dan = `x.figures` doc.json S93 bila ada).
 * - IP-02 (D-87): params setiap panel galeri berkunci penuh — resolver engine/chart (`resolveChartParams`)
 *   melaporkan 0 PARAM_ALIAS dan 0 PARAM_IGNORED.
 * - IP-02: setiap spec diagram lolos `buildDiagramSvg` (release) dan setiap komposit chart lolos
 *   `renderChart` tanpa temuan FAIL lewat engine saat ini (lewati dengan `--no-build`).
 *
 * Pemakaian: npx tsx benchmark/manual000/figures/tools/validate_figures.ts [--docx <BM.docx>] [--no-build]
 * Exit: 0 lolos, 1 gagal, 2 masukan salah.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020";
import { unzipSync } from "fflate";
import {
  CHART_SCHEMA_ID,
  DIAGRAM_SCHEMA_ID,
  DOC_SCHEMA_ID,
  IMAGE_SCHEMA_ID,
  STUDIO_AJV_OPTIONS,
  STUDIO_SCHEMA_LOAD_ORDER,
} from "../../../../src/lib/studio/contract";
import type { ChartCode, LintIssue, StudioChartV1, StudioDiagramV1 } from "../../../../src/lib/studio/contract";
import { renderChart } from "../../../../src/lib/studio/engine/chart/core";
import { resolveChartParams } from "../../../../src/lib/studio/engine/chart/core/params";
import { buildDiagramSvg } from "../../../../src/lib/studio/engine/diagram/build";

interface FigureEntry {
  id: string;
  placement: number;
  kind: string;
  page: number;
  bigPage: boolean;
  path: string;
  asset: string;
  spec?: string;
  block?: string;
  sha256: string;
  media: string;
  widthMm: number;
  heightMm: number;
}

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const KINDS = new Set(["chart", "diagram", "raster", "symbolSheet", "device"]);
const BLOCK_DEF: Record<string, string> = {
  chart: "ChartBlock",
  diagram: "DiagramBlock",
  raster: "ImageBlock",
  symbolSheet: "SymbolSheetBlock",
  device: "DeviceBlock",
};
const SPEC_ID: Record<string, string> = {
  "studio.chart/v1": CHART_SCHEMA_ID,
  "studio.diagram/v1": DIAGRAM_SCHEMA_ID,
  "studio.image/v1": IMAGE_SCHEMA_ID,
};

const sha = (b: Uint8Array): string => createHash("sha256").update(b).digest("hex");
const readJson = (rel: string): unknown => JSON.parse(readFileSync(path.join(ROOT, rel), "utf-8"));

interface DiagramLike {
  id: string;
  title: string;
  nodes: Array<{ id: string }>;
  edges?: Array<{ from: string; to: string; kind: string }>;
}

function diagramRules(d: DiagramLike, where: string, errs: string[]): void {
  if (!/\d+\.\d+/.test(d.id)) errs.push(`${where}: id diagram tanpa \\d+.\\d+ (${d.id})`);
  if (!d.title.endsWith(".")) errs.push(`${where}: judul diagram tidak berakhir titik`);
  const ids = new Set(d.nodes.map((n) => n.id));
  if (ids.size !== d.nodes.length) errs.push(`${where}: id simpul ganda`);
  for (const e of d.edges ?? []) {
    if (!ids.has(e.from) || !ids.has(e.to)) errs.push(`${where}: edge ${e.from}->${e.to} merujuk simpul tak ada`);
  }
  if ((d.edges ?? []).filter((e) => e.kind === "accent").length > 1) errs.push(`${where}: edge accent > 1`);
}

interface PanelLike {
  code: string;
  spec: Record<string, unknown>;
}

/** IP-02: params panel harus sudah berkunci penuh (tanpa alias, tanpa kunci abaian). */
function panelParamRules(panels: readonly PanelLike[], where: string, errs: string[]): number {
  let ok = 0;
  for (const p of panels) {
    const spec = { $schema: "studio.chart/v1", title: "t.", source: "s.", widthMm: 128, ...p.spec } as unknown as StudioChartV1;
    const r = resolveChartParams(spec, p.code as ChartCode);
    if (r.aliased.length) errs.push(`${where}/${p.code}: PARAM_ALIAS ${r.aliased.join(", ")}`);
    if (r.ignored.length) errs.push(`${where}/${p.code}: PARAM_IGNORED ${r.ignored.join(", ")}`);
    if (!r.aliased.length && !r.ignored.length) ok += 1;
  }
  return ok;
}

const failsOf = (issues: readonly LintIssue[] | undefined): string[] =>
  (issues ?? []).filter((i) => i.status === "FAIL").map((i) => `${i.checkId}${i.detail ? `: ${i.detail}` : ""}`);

/** IP-02: bangun spec lewat engine saat ini; galat atau temuan FAIL = gagal. */
function buildRules(spec: { $schema: string }, where: string, errs: string[]): boolean {
  try {
    const issues =
      spec.$schema === "studio.diagram/v1"
        ? buildDiagramSvg(spec as unknown as StudioDiagramV1, { release: true }).report.issues
        : renderChart(spec as unknown as StudioChartV1).report.issues;
    const bad = failsOf(issues);
    for (const b of bad) errs.push(`${where}: build FAIL ${b}`);
    return bad.length === 0;
  } catch (e) {
    const err = e as { code?: string; message?: string };
    errs.push(`${where}: build ${err.code ?? "ERROR"} ${err.message ?? String(e)}`);
    return false;
  }
}

function main(): number {
  const doBuild = !process.argv.includes("--no-build");
  const argDocx = process.argv.indexOf("--docx");
  const docxPath = argDocx > 0 ? process.argv[argDocx + 1] : undefined;
  const indexRel = "benchmark/manual000/figures/index.json";
  if (!existsSync(path.join(ROOT, indexRel))) {
    console.error(`input error: ${indexRel} tidak ada`);
    return 2;
  }
  const index = readJson(indexRel) as { figures: FigureEntry[] };
  const ajv = new Ajv2020({ ...STUDIO_AJV_OPTIONS });
  for (const schema of STUDIO_SCHEMA_LOAD_ORDER) ajv.addSchema(schema as object);
  const errs: string[] = [];
  const kinds: Record<string, number> = {};
  let specsOk = 0;
  let blocksOk = 0;
  let shaOk = 0;
  let panelsTotal = 0;
  let panelsOk = 0;
  let buildTotal = 0;
  let buildOk = 0;

  // 1. klasifikasi tanpa sisa
  const figs = index.figures;
  if (figs.length !== 52) errs.push(`jumlah penempatan ${figs.length} != 52`);
  figs.forEach((f, i) => {
    const want = `bm-fig-${String(i + 1).padStart(2, "0")}`;
    if (f.id !== want || f.placement !== i + 1) errs.push(`urutan id: ${f.id} di posisi ${i + 1}`);
    if (!KINDS.has(f.kind)) errs.push(`${f.id}: jenis tak dikenal ${f.kind}`);
    kinds[f.kind] = (kinds[f.kind] ?? 0) + 1;
  });

  // 2. spec dan blok lolos validator kontrak
  for (const f of figs) {
    for (const rel of [f.path, f.asset, f.spec, f.block]) {
      if (rel && !existsSync(path.join(ROOT, rel))) errs.push(`${f.id}: berkas hilang ${rel}`);
    }
    if (f.spec) {
      const spec = readJson(f.spec) as { $schema: string; kind?: string; composite?: { panels: Array<{ spec: { data?: { shape: string; spec?: DiagramLike } } }> }; title?: string };
      const v = ajv.getSchema(SPEC_ID[spec.$schema] ?? "");
      if (!v) errs.push(`${f.id}: $schema tak dikenal ${spec.$schema}`);
      else if (!v(spec)) errs.push(`${f.id}: spec INVALID ${JSON.stringify(v.errors?.slice(0, 3))}`);
      else specsOk += 1;
      if (spec.$schema === "studio.diagram/v1") diagramRules(spec as unknown as DiagramLike, f.id, errs);
      if (spec.$schema === "studio.chart/v1" && !(spec.title ?? "").endsWith(".")) errs.push(`${f.id}: judul chart tanpa titik`);
      for (const p of spec.composite?.panels ?? []) {
        if (p.spec.data?.shape === "steps" && p.spec.data.spec) diagramRules(p.spec.data.spec, `${f.id}/steps`, errs);
      }
      if (spec.composite) {
        const panels = spec.composite.panels as unknown as PanelLike[];
        panelsTotal += panels.length;
        panelsOk += panelParamRules(panels, f.id, errs);
      }
      if (doBuild && (spec.$schema === "studio.diagram/v1" || spec.$schema === "studio.chart/v1")) {
        buildTotal += 1;
        if (buildRules(spec, f.id, errs)) buildOk += 1;
      }
    }
    if (f.block) {
      const v = ajv.getSchema(`${DOC_SCHEMA_ID}#/$defs/${BLOCK_DEF[f.kind]}`);
      const blk = readJson(f.block);
      if (!v) errs.push(`${f.id}: def blok ${BLOCK_DEF[f.kind]} tidak ada`);
      else if (!v(blk)) errs.push(`${f.id}: blok INVALID ${JSON.stringify(v.errors?.slice(0, 3))}`);
      else blocksOk += 1;
    }
  }

  // 3. sha256 aset = indeks = media docx = doc.json S93
  let mediaSha: Record<string, string> | undefined;
  if (docxPath) {
    const files = unzipSync(readFileSync(docxPath));
    mediaSha = {};
    for (const [name, data] of Object.entries(files)) {
      if (name.startsWith("word/media/")) mediaSha[name.slice("word/".length)] = sha(data);
    }
  }
  const docRel = "benchmark/manual000/doc.json";
  const docFigs = new Map<string, string>();
  if (existsSync(path.join(ROOT, docRel))) {
    const doc = readJson(docRel) as { x?: { figures?: Array<{ id: string; sha256: string }> } };
    for (const d of doc.x?.figures ?? []) docFigs.set(d.id, d.sha256);
  }
  for (const f of figs) {
    const actual = sha(readFileSync(path.join(ROOT, f.asset)));
    const okIdx = actual === f.sha256;
    const okDocx = mediaSha ? mediaSha[f.media] === actual : true;
    const okDoc = docFigs.size ? docFigs.get(f.id) === actual : true;
    if (okIdx && okDocx && okDoc) shaOk += 1;
    else errs.push(`${f.id}: sha256 beda (aset ${actual.slice(0, 12)}, indeks ${okIdx}, docx ${okDocx}, doc.json ${okDoc})`);
  }

  const withSpec = figs.filter((f) => f.spec).length;
  const withBlock = figs.filter((f) => f.block).length;
  const rasterLike = figs.filter((f) => f.kind === "raster" || f.kind === "device");
  console.log(`penempatan ${figs.length}; per jenis ${JSON.stringify(kinds)}; tanpa sisa ${Object.values(kinds).reduce((a, b) => a + b, 0) === 52}`);
  console.log(`spec lolos ${specsOk}/${withSpec}; blok lolos ${blocksOk}/${withBlock}`);
  console.log(`params panel berkunci penuh (0 PARAM_ALIAS, 0 PARAM_IGNORED): ${panelsOk}/${panelsTotal}`);
  console.log(doBuild ? `build engine (diagram release + komposit chart) tanpa FAIL: ${buildOk}/${buildTotal}` : "build engine dilewati (--no-build)");
  console.log(`sha256 aset = indeks${mediaSha ? " = media docx" : ""}${docFigs.size ? " = doc.json x.figures" : ""}: ${shaOk}/${figs.length} (raster/perangkat ${rasterLike.length})`);
  console.log(`halaman figur besar ditandai: ${[...new Set(figs.filter((f) => f.bigPage).map((f) => f.page))].join(",")}`);
  if (mediaSha) {
    const assetSet = new Set(figs.map((f) => f.media));
    console.log(`media docx ${Object.keys(mediaSha).length}, dirujuk indeks ${assetSet.size}`);
  }
  if (errs.length) {
    console.log(`GAGAL ${errs.length}`);
    for (const e of errs.slice(0, 40)) console.log(`  ${e}`);
    return 1;
  }
  console.log("LOLOS");
  return 0;
}

process.exit(main());

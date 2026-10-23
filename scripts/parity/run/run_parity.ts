/**
 * H05 - runner harness paritas (S67; masterplan/01_specs.md §11).
 *
 *   npx tsx scripts/parity/run/run_parity.ts --fixtures tests/parity/fixtures --out tests/parity/out/<sNN>
 *       [--only <glob>] [--formats docx,pdf,html,svg,png] [--template <path|slug>]
 *       [--python <python.exe>] [--timeout-ms <n>] [--strict]
 *
 * Per fixture (korpus S63):
 *   1. acuan Python: dokumen -> ref_doc.py (S64, H02; `--pdf` bila PDF diminta),
 *      chart/diagram/simbol -> ref_fig.py (S65, H03; `--png` bila PNG diminta);
 *   2. Node: mesin render tanpa DB yang sama dengan render_cli.ts (H01);
 *   3. pembanding: compare.py (S66, H04) dengan kelas research/06 §6.2:
 *      docx=DX, pdf=PD, chart=CA|CB1|CB2 (CB1/CB2 + `--threshold expectHeightMm=<tinggi_mm>`),
 *      CC/komposit = snapshot beku bila ada, selain itu vonis lint Node,
 *      diagram=DG, simbol=SY (per lembar), html=HT (tanpa acuan Python: DIAGNOSIS + lint),
 *      chart drawn=false = registri wajib menolak (CHART_KIND_NOT_DRAWN);
 *   4. laporan `<out>/<fixture>/fixture_report.{json,md}` + agregat `<out>/summary.{json,md}`,
 *      log JSONL `<out>/harness_log.jsonl`.
 * Modul stub = NOT_READY per fixture (tidak crash). Biner keluaran tidak di-commit
 * (tests/parity/out di-gitignore oleh S69).
 * Exit: 0 tanpa FAIL/ERROR, 1 ada FAIL atau galat (NOT_READY hanya dengan --strict), 2 salah pakai.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ChartCode } from "../../../src/lib/studio/contract";
import { closeBrowser } from "../../../src/lib/studio/engine/browser";
import { CHART_BY_CODE } from "../../../src/lib/studio/registry/charts";
import { errMessage, findRepoRoot, HarnessLog, newCorrelationId, parseArgs, UsageError } from "./lib/common";
import { discoverFixtures, matchesOnly, type Fixture } from "./lib/fixtures";
import { pythonPath, runPython, type PyResult } from "./lib/python";
import { KIND_FORMATS, renderToDir, type RenderReport } from "./lib/render";
import {
  FAILING,
  fixtureMarkdown,
  summaryMarkdown,
  verdictLabel,
  worst,
  type FixtureResult,
  type FormatResult,
  type RunSummary,
  type StepInfo,
  type Verdict,
} from "./lib/summary";

const HELP = `Pemakaian:
  npx tsx scripts/parity/run/run_parity.ts --fixtures <dir> --out <dir> [opsi]

Opsi:
  --fixtures <dir>     korpus fixture (S63), mis. tests/parity/fixtures
  --out <dir>          direktori run, mis. tests/parity/out/s76
  --only <glob>        saring fixture (id relatif tanpa .json, nama dasar, atau kode chart), mis. "chart/**" atau "P-0?"
  --formats <list>     docx,pdf,html,svg,png (default semua yang berlaku per jenis)
  --template <p|slug>  templat dokumen bila fixture tidak punya <stem>.template.json
  --python <path>      interpreter VENV (default env PARITY_PYTHON atau VENV hermes)
  --timeout-ms <n>     batas waktu per proses Python (default 600000)
  --strict             NOT_READY dihitung gagal (exit 1)
  --help               tampilkan bantuan ini

Exit: 0 tanpa FAIL/ERROR | 1 ada FAIL/ERROR | 2 salah pakai`;

const ALL_FORMATS = ["docx", "pdf", "html", "svg", "png"] as const;

interface Ctx {
  repoRoot: string;
  outDir: string;
  python: string;
  timeoutMs: number;
  formats: ReadonlySet<string>;
  template?: string;
  log: HarnessLog;
  scripts: { refDoc: string; refFig: string; compare: string };
}

interface RefOutcome {
  info: StepInfo;
  report: Record<string, unknown> | null;
  /** Skrip acuan belum ada (baris S64/S65 belum mendarat). */
  missing: boolean;
}

function readJson(file: string): Record<string, unknown> | null {
  try {
    if (!existsSync(file)) return null;
    const v: unknown = JSON.parse(readFileSync(file, "utf8"));
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Dokumen v1/v2 (SR-41): `docV2`/`chapterV2` diperlakukan seperti dokumen (format, templat, pembanding DX/PD/HT). */
function isDocKind(kind: Fixture["kind"]): boolean {
  return kind === "doc" || kind === "docV2" || kind === "chapterV2";
}

/**
 * Masukan acuan Python untuk dokumen. ref_doc.py (Garis A) hanya membaca studio.doc/v1, jadi
 * salinan v2 `doc/v2/<stem>.json` memakai pasangan v1 `doc/<stem>.json` (isi sama, SR-41).
 * `null` = tidak ada pasangan v1 (vonis NO_REFERENCE).
 */
function docReferenceInput(f: Fixture): string | null {
  if (f.kind === "doc") return f.input;
  if (f.kind !== "docV2") return null;
  const dir = path.dirname(f.file);
  if (path.basename(dir).toLowerCase() !== "v2") return null;
  const v1 = path.join(path.dirname(dir), path.basename(f.file));
  const data = readJson(v1);
  return data && data.$schema === "studio.doc/v1" ? v1 : null;
}

function pyFailMessage(r: PyResult): string {
  if (r.spawnError) return `spawn gagal: ${r.spawnError}`;
  if (r.timedOut) return "batas waktu terlampaui (tree-kill)";
  const lastErr = r.stderrTail.trim().split(/\r?\n/).slice(-3).join(" | ");
  return `exit ${r.exitCode}${lastErr ? `: ${lastErr}` : ""}`;
}

/** Berkas acuan per format dari `ref_report.json` (urutan tulis = urutan lembar). */
function refFiles(report: Record<string, unknown> | null, fmt: string): string[] {
  const files = Array.isArray(report?.files) ? (report.files as Array<Record<string, unknown>>) : [];
  return files.filter((f) => f.format === fmt && typeof f.path === "string").map((f) => f.path as string);
}

function nodeFiles(report: RenderReport | null, fmt: string): string[] {
  if (!report) return [];
  return report.files
    .filter((f) => f.format === fmt && f.role === "primary")
    .sort((a, b) => (a.sheet ?? 1) - (b.sheet ?? 1))
    .map((f) => f.path);
}

async function runRef(ctx: Ctx, f: Fixture, wd: string, wanted: ReadonlySet<string>): Promise<RefOutcome | null> {
  const out = path.join(wd, "ref");
  let script: string;
  let args: string[];
  if (isDocKind(f.kind)) {
    const refInput = docReferenceInput(f);
    if (!refInput) return null;
    script = ctx.scripts.refDoc;
    args = ["--doc", refInput, "--out", out, ...(wanted.has("pdf") ? ["--pdf"] : [])];
  } else if (f.kind === "chart" || f.kind === "diagram" || f.kind === "symbol") {
    script = ctx.scripts.refFig;
    args = ["--spec", f.input, "--kind", f.kind, "--out", out, ...(wanted.has("png") ? ["--png"] : [])];
  } else return null;
  if (!existsSync(script)) {
    return { info: { exitCode: null, status: "not-ready", message: `skrip acuan belum ada: ${script}`, durationMs: 0 }, report: null, missing: true };
  }
  mkdirSync(out, { recursive: true });
  const r = await runPython(ctx.python, script, args, ctx.timeoutMs);
  const reportPath = path.join(out, "ref_report.json");
  const report = readJson(reportPath);
  const status = typeof report?.status === "string" ? report.status : r.exitCode === 0 ? "ok" : "error";
  const errObj = report?.error && typeof report.error === "object" ? (report.error as Record<string, unknown>) : null;
  const errorCode = (typeof report?.errorCode === "string" ? report.errorCode : undefined) ?? (typeof errObj?.code === "string" ? errObj.code : undefined);
  const info: StepInfo = {
    exitCode: r.exitCode,
    status,
    ...(report ? { report: reportPath } : {}),
    ...(errorCode ? { errorCode } : {}),
    ...(r.exitCode !== 0 ? { message: pyFailMessage(r) } : {}),
    durationMs: r.durationMs,
  };
  if (r.exitCode !== 0) ctx.log.error(`reference failed for ${f.id}`, undefined, { fixture: f.id, script, exitCode: r.exitCode, timedOut: r.timedOut, stderrTail: r.stderrTail.slice(-2000) });
  return { info, report, missing: false };
}

async function compare(
  ctx: Ctx,
  f: Fixture,
  wd: string,
  fmt: string,
  cls: string,
  ref: string,
  node: string,
  sheet: number,
  thresholds: string[],
  context?: Record<string, unknown> | null,
): Promise<FormatResult> {
  const stem = `${fmt}${sheet > 1 ? `-${sheet}` : ""}`;
  const out = path.join(wd, "cmp", `${stem}.json`);
  mkdirSync(path.dirname(out), { recursive: true });
  const base: FormatResult = { format: fmt, class: cls, verdict: "COMPARE_ERROR", mode: "compare", ref, node, compareReport: out, ...(sheet > 1 ? { sheet } : {}), ...(thresholds.length ? { thresholds } : {}) };
  if (!existsSync(ctx.scripts.compare)) return { ...base, verdict: "NOT_READY", note: `pembanding belum ada: ${ctx.scripts.compare}` };
  // Konteks pembanding (FIX-3): laporan mesin DG, port SY, blok no-reference DX.
  let ctxFile: string | null = null;
  if (context && Object.keys(context).length > 0) {
    ctxFile = path.join(wd, "cmp", `${stem}.context.json`);
    writeFileSync(ctxFile, `${JSON.stringify(context, null, 1)}\n`, "utf8");
  }
  const args = ["--format", fmt, "--ref", ref, "--node", node, "--class", cls, "--out", out, ...thresholds.flatMap((t) => ["--threshold", t]), ...(ctxFile ? ["--context", ctxFile] : [])];
  const r = await runPython(ctx.python, ctx.scripts.compare, args, ctx.timeoutMs);
  base.compareExit = r.exitCode;
  const rep = readJson(out);
  if ((r.exitCode === 0 || r.exitCode === 1) && rep) {
    const verdict = rep.verdict === "PASS" || rep.verdict === "FAIL" || rep.verdict === "DIAGNOSIS" ? (rep.verdict as Verdict) : r.exitCode === 1 ? "FAIL" : "COMPARE_ERROR";
    const diffs = Array.isArray(rep.diffs) ? (rep.diffs as Array<Record<string, unknown>>) : [];
    const gates = diffs.filter((d) => d.gate).map((d) => String(d.check));
    // SR46-P2: jumlah cek gagal + tingkat (CompareReport `failedChecks`); vonis tidak berubah.
    const fc = rep.failedChecks as { failed?: unknown; level?: unknown } | undefined;
    const counted = fc && typeof fc.failed === "number" ? { failedChecks: fc.failed, checkLevel: fc.level === "CLEAN" ? ("CLEAN" as const) : ("DIFF" as const) } : {};
    return { ...base, verdict, ...(gates.length ? { failedGates: gates } : {}), ...counted };
  }
  const errRep = readJson(out.replace(/\.json$/i, ".error.json"));
  const note = errRep && typeof errRep.message === "string" ? errRep.message : pyFailMessage(r);
  ctx.log.error(`compare failed for ${f.id} ${fmt}`, undefined, { fixture: f.id, format: fmt, class: cls, exitCode: r.exitCode, stderrTail: r.stderrTail.slice(-2000) });
  return { ...base, note };
}

/** Status format Node -> vonis bila berkas tidak ada; null = berkas tersedia. */
function nodeFormatVerdict(rep: RenderReport | null, fmt: string): { verdict: Verdict; note: string } | null {
  if (!rep) return { verdict: "NODE_ERROR", note: "render Node tidak berjalan" };
  const st = rep.formatStatus[fmt];
  if (st === "OK" && nodeFiles(rep, fmt).length > 0) return null;
  // Alasan penolakan Node ikut dilaporkan (mis. DATUM-25 dg_layered_good, D-137), bukan hanya kodenya.
  const errs = rep.errors.filter((e) => !e.format || e.format === fmt).map((e) => (e.message ? `${e.code}: ${String(e.message).slice(0, 240)}` : `${e.code}`));
  if (st === "NOT_READY") return { verdict: "NOT_READY", note: `modul stub: ${rep.notReady.join(", ")}` };
  if (st === "UNAVAILABLE") return { verdict: "NOT_READY", note: "PDF_ENGINE_UNAVAILABLE (render-env tidak siap)" };
  return { verdict: "NODE_ERROR", note: errs.join(", ") || `format ${fmt} tidak dihasilkan` };
}

function refMissingVerdict(ref: RefOutcome | null): { verdict: Verdict; note: string } {
  if (!ref) return { verdict: "NO_REFERENCE", note: "tidak ada acuan Python untuk jenis ini" };
  if (ref.missing) return { verdict: "NOT_READY", note: ref.info.message ?? "acuan belum ada" };
  if (ref.info.status === "no-reference") return { verdict: "NO_REFERENCE", note: "acuan Python: no-reference" };
  return { verdict: "REF_ERROR", note: `${ref.info.errorCode ?? "acuan gagal"}${ref.info.message ? ` (${ref.info.message})` : ""}` };
}

function lintVerdict(rep: RenderReport): { verdict: Verdict; note: string } {
  const checks = rep.lint?.checks ?? [];
  const fails = checks.filter((c) => c.status === "FAIL").map((c) => c.checkId);
  return fails.length > 0 ? { verdict: "FAIL", note: `lint FAIL: ${[...new Set(fails)].join(", ")}` } : { verdict: "PASS", note: `lint tanpa FAIL (${checks.length} cek)` };
}

/**
 * Konteks pembanding figur (FIX-3): DG = laporan mesin acuan (`ref_report.engineReport`) dan Node
 * (`render_report.figure.engineReport`; F-S78-1/F-S78-5); SY simbol tunggal = port mm acuan
 * (`ref_report.portsInMm`) dan Node (`symbolPortsMm`; F-S78-4); chart = `chartSpec` path spec fixture
 * (data acuan gerbang label isi CB1 (f), D-240/D-246). PNG (FIX-H): chart = pasangan SVG untuk bukti
 * F-007 (D-296); diagram = SVG Node untuk integritas raster kelas D-242 (D-298). DG SVG juga membawa
 * lint artefak Node (`nodeLint`, kelas D-242 butir b).
 */
function figureContext(kind: string, refRep: Record<string, unknown> | null, node: RenderReport | null, fmt: string, specPath?: string): Record<string, unknown> | null {
  if (fmt === "png" && kind === "chart") {
    // F-007/D-296: PNG CA membuktikan selisih skala teks px/pt acuan dari pasangan SVG yang sama.
    const refSvg = refFiles(refRep, "svg")[0];
    const nodeSvg = nodeFiles(node, "svg")[0];
    return refSvg && nodeSvg ? { f007: { refSvg, nodeSvg } } : null;
  }
  if (fmt === "png" && kind === "diagram") {
    const nodeSvg = nodeFiles(node, "svg")[0];
    return nodeSvg ? { d242: { nodeSvg } } : null;
  }
  if (fmt !== "svg") return null;
  if (kind === "chart") return specPath ? { chartSpec: specPath } : null;
  if (!refRep || !node?.figure) return null;
  if (kind === "diagram" && refRep.engineReport && node.figure.engineReport) {
    return { engineReport: { ref: refRep.engineReport, node: node.figure.engineReport }, ...(node.lint ? { nodeLint: node.lint.checks } : {}) };
  }
  if (kind === "symbol" && refRep.portsInMm && node.figure.ports) {
    return { ports: { ref: refRep.portsInMm, node: node.figure.ports } };
  }
  return null;
}

/** Tinggi CB: registri chart (bila memuat medan tinggi) lalu `referenceCanvasMm.height` acuan (= tinggi_mm registri PC). */
function expectHeight(code: string | undefined, ref: Record<string, unknown> | null): { value: number; source: string } | null {
  const def = code ? (CHART_BY_CODE.get(code as ChartCode) as unknown as Record<string, unknown> | undefined) : undefined;
  for (const k of ["tinggiMm", "heightMm", "refHeightMm"]) {
    const v = def?.[k];
    if (typeof v === "number" && v > 0) return { value: v, source: `CHART_BY_CODE.${k}` };
  }
  const rc = ref?.referenceCanvasMm as Record<string, unknown> | undefined;
  const h = rc?.height;
  if (typeof h === "number" && h > 0) return { value: h, source: "ref_report.referenceCanvasMm.height (tinggi_mm registri PC)" };
  return null;
}

async function runFixture(ctx: Ctx, f: Fixture): Promise<FixtureResult> {
  const t0 = Date.now();
  const wd = path.join(ctx.outDir, f.workName);
  mkdirSync(wd, { recursive: true });
  const allowed = KIND_FORMATS[f.kind].allowed.map((x) => x.toLowerCase());
  const defaults = isDocKind(f.kind) ? ["docx", "pdf", "html"] : allowed;
  const wanted = new Set(defaults.filter((x) => ctx.formats.has(x)));
  const result: FixtureResult = { id: f.id, kind: f.kind, ...(f.code ? { code: f.code } : {}), file: f.file, workDir: wd, verdict: "SKIPPED", formats: [], ref: null, node: null, notes: [], durationMs: 0 };
  if (wanted.size === 0) {
    result.notes.push("tidak ada format yang diminta berlaku untuk jenis ini");
    result.durationMs = Date.now() - t0;
    return result;
  }
  ctx.log.info(`fixture ${f.id} started`, { kind: f.kind, formats: [...wanted] });

  // 1. Acuan Python.
  let ref: RefOutcome | null = null;
  try {
    ref = await runRef(ctx, f, wd, wanted);
    result.ref = ref?.info ?? null;
  } catch (err) {
    ctx.log.error(`reference crashed for ${f.id}`, err);
    result.ref = { exitCode: null, status: "error", message: errMessage(err), durationMs: 0 };
    ref = { info: result.ref, report: null, missing: false };
  }

  // 2. Node (proses yang sama; browser dipakai bersama antar fixture).
  let node: RenderReport | null = null;
  try {
    node = await renderToDir({
      input: f.input,
      outDir: path.join(wd, "node"),
      repoRoot: ctx.repoRoot,
      template: f.template ?? (isDocKind(f.kind) ? ctx.template : undefined),
      formats: [...wanted],
      keepBrowser: true,
      correlationId: `${ctx.log.correlationId}_${f.workName}`,
    });
    result.node = { exitCode: node.exitCode, status: node.job.status, ...(node.job.errorCode ? { errorCode: node.job.errorCode } : {}), report: path.join(wd, "node", "render_report.json"), durationMs: node.durationMs };
    result.lint = node.lint ? { releaseStatus: node.lint.releaseStatus, banner: node.lint.banner } : null;
  } catch (err) {
    ctx.log.error(`node render crashed for ${f.id}`, err);
    result.node = { exitCode: null, status: "CRASHED", message: errMessage(err), durationMs: 0 };
  }
  if (node?.job.status === "USAGE") result.notes.push(`Node menolak masukan: ${node.errors.map((e) => e.message).join("; ")}`);

  // 3. Pembanding per format.
  const add = (r: FormatResult) => result.formats.push(r);
  const refRep = ref?.report ?? null;

  if (f.kind === "chart") {
    const def = f.code ? CHART_BY_CODE.get(f.code as ChartCode) : undefined;
    if (def && def.drawn === false) {
      const rejected = node?.errors.some((e) => e.code === "CHART_KIND_NOT_DRAWN") ?? false;
      for (const fmt of wanted) {
        add({ format: fmt, class: null, mode: "registry", verdict: rejected ? "PASS" : "FAIL", note: rejected ? `drawn=false ditolak (alternatif: ${(def.alternatives ?? []).join(", ")})` : "drawn=false wajib ditolak CHART_KIND_NOT_DRAWN" });
      }
    } else {
      const refCls = typeof refRep?.parityClass === "string" ? refRep.parityClass : null;
      const regCls = def?.parityClass ?? null;
      if (refCls && regCls && refCls !== regCls) result.notes.push(`kelas acuan ${refCls} berbeda dari registri ${regCls}; dipakai kelas acuan`);
      const cls = refCls ?? regCls ?? (f.code === "composite" ? "BG" : "CC");
      const thresholds: string[] = [];
      if (cls === "CB1" || cls === "CB2") {
        const h = expectHeight(f.code, refRep);
        if (h) {
          thresholds.push(`expectHeightMm=${h.value}`);
          result.notes.push(`expectHeightMm=${h.value} dari ${h.source}`);
        } else result.notes.push("tinggi_mm acuan tidak tersedia; cek tinggi CB tidak digerbang");
      }
      for (const fmt of wanted) {
        const nv = nodeFormatVerdict(node, fmt);
        if (nv) {
          add({ format: fmt, class: cls, mode: "none", ...nv });
          continue;
        }
        const nfile = nodeFiles(node, fmt)[0];
        if (cls === "CC" || cls === "BG") {
          const snap = fmt === "svg" ? f.snapshotSvg : f.snapshotPng;
          if (snap) add(await compare(ctx, f, wd, fmt, "CC", snap, nfile, 1, []));
          else if (fmt === "svg" && node) add({ format: fmt, class: cls, mode: "lint", node: nfile, ...lintVerdict(node) });
          else add({ format: fmt, class: cls, mode: "none", node: nfile, verdict: "NO_REFERENCE", note: "tanpa acuan dan tanpa snapshot beku" });
          continue;
        }
        const rfile = refFiles(refRep, fmt)[0];
        if (!rfile) {
          add({ format: fmt, class: cls, mode: "none", node: nfile, ...refMissingVerdict(ref) });
          continue;
        }
        // expectHeightMm hanya kunci ambang SVG (PNG CB = diagnosis; compare.py menolak kunci asing).
        add(await compare(ctx, f, wd, fmt, cls, rfile, nfile, 1, fmt === "svg" ? thresholds : [], figureContext(f.kind, refRep, node, fmt, f.input)));
      }
    }
  } else if (f.kind === "diagram" || f.kind === "symbol") {
    const cls = f.kind === "diagram" ? "DG" : "SY";
    for (const fmt of wanted) {
      const nv = nodeFormatVerdict(node, fmt);
      if (nv) {
        add({ format: fmt, class: cls, mode: "none", ...nv });
        continue;
      }
      const nfiles = nodeFiles(node, fmt);
      const rfiles = refFiles(refRep, fmt);
      if (rfiles.length === 0) {
        add({ format: fmt, class: cls, mode: "none", node: nfiles[0], ...refMissingVerdict(ref) });
        continue;
      }
      if (rfiles.length !== nfiles.length) {
        add({ format: fmt, class: cls, mode: "compare", verdict: "FAIL", failedGates: ["pageCount"], note: `jumlah lembar acuan ${rfiles.length} lawan Node ${nfiles.length}` });
      }
      const n = Math.min(rfiles.length, nfiles.length);
      const context = figureContext(f.kind, refRep, node, fmt);
      for (let i = 0; i < n; i++) add(await compare(ctx, f, wd, fmt, cls, rfiles[i], nfiles[i], i + 1, [], context));
    }
  } else if (isDocKind(f.kind)) {
    const refInput = docReferenceInput(f);
    if (f.kind !== "doc") result.notes.push(refInput ? `acuan Python dari pasangan v1 ${path.relative(ctx.repoRoot, refInput).split(path.sep).join("/")} (SR-41)` : "tanpa pasangan v1: tidak ada acuan Python");
    for (const fmt of wanted) {
      const nv = nodeFormatVerdict(node, fmt);
      const cls = fmt === "docx" ? "DX" : fmt === "pdf" ? "PD" : "HT";
      if (nv) {
        add({ format: fmt, class: cls, mode: "none", ...nv });
        continue;
      }
      const nfile = nodeFiles(node, fmt)[0];
      if (fmt === "html") {
        add({ format: fmt, class: "HT", mode: "lint", node: nfile, verdict: "DIAGNOSIS", note: `tanpa acuan Python (research/06 HT); lint ${node?.lint?.releaseStatus ?? "-"}` });
        continue;
      }
      const rfile = refFiles(refRep, fmt)[0];
      if (!rfile) {
        add({ format: fmt, class: cls, mode: "none", node: nfile, ...refMissingVerdict(ref) });
        continue;
      }
      // S76-H2 (F-011/F-012): blok `unsupported` acuan = no-reference; spec = fixture.
      const blocks = Array.isArray(refRep?.blocks) ? refRep.blocks : null;
      const docCtx = fmt === "docx" && blocks ? { noReference: { spec: refInput ?? f.input, blocks } } : null;
      add(await compare(ctx, f, wd, fmt, cls, rfile, nfile, 1, [], docCtx));
    }
  } else {
    for (const fmt of wanted) {
      const nv = nodeFormatVerdict(node, fmt);
      add({ format: fmt, class: null, mode: "none", node: nodeFiles(node, fmt)[0], ...(nv ?? { verdict: "NO_REFERENCE", note: "studio.image/v1 tanpa kelas paritas (research/06)" }) });
    }
  }

  result.verdict = worst(result.formats.map((r) => r.verdict));
  result.durationMs = Date.now() - t0;
  writeFileSync(path.join(wd, "fixture_report.json"), `${JSON.stringify(result, null, 1)}\n`, "utf8");
  writeFileSync(path.join(wd, "fixture_report.md"), fixtureMarkdown(result), "utf8");
  ctx.log.info(`fixture ${f.id} finished`, { verdict: result.verdict, durationMs: result.durationMs });
  return result;
}

async function main(argv: readonly string[]): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }
  const t0 = Date.now();
  let args;
  let formats: string[];
  let timeoutMs = 600000;
  try {
    args = parseArgs(argv, { values: ["fixtures", "out", "only", "formats", "template", "python", "timeout-ms"], flags: ["strict"] });
    if (!args.values.get("fixtures")) throw new UsageError("--fixtures wajib");
    if (!args.values.get("out")) throw new UsageError("--out wajib");
    const fx = path.resolve(args.values.get("fixtures") as string);
    if (!existsSync(fx) || !statSync(fx).isDirectory()) throw new UsageError(`direktori fixture tidak ada: ${fx}`);
    formats = (args.values.get("formats") ?? ALL_FORMATS.join(",")).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const bad = formats.filter((x) => !(ALL_FORMATS as readonly string[]).includes(x));
    if (bad.length > 0 || formats.length === 0) throw new UsageError(`format tidak dikenal: ${bad.join(", ") || "(kosong)"}`);
    if (args.values.has("timeout-ms")) {
      timeoutMs = Number(args.values.get("timeout-ms"));
      if (!Number.isInteger(timeoutMs) || timeoutMs < 1000) throw new UsageError("--timeout-ms harus bilangan bulat >= 1000");
    }
  } catch (err) {
    process.stderr.write(`run_parity: salah pakai: ${errMessage(err)}\n${HELP}\n`);
    return 2;
  }
  const repoRoot = findRepoRoot();
  const fixturesDir = path.resolve(args.values.get("fixtures") as string);
  const outDir = path.resolve(args.values.get("out") as string);
  const tplArg = args.values.get("template");
  const template = tplArg && /[\\/.]/.test(tplArg) ? path.resolve(tplArg) : tplArg;
  const python = pythonPath(args.values.get("python"));
  process.chdir(repoRoot);
  mkdirSync(outDir, { recursive: true });
  const correlationId = newCorrelationId("parity");
  const log = new HarnessLog(path.join(outDir, "harness_log.jsonl"), "parity.run_parity", correlationId);
  const ctx: Ctx = {
    repoRoot,
    outDir,
    python,
    timeoutMs,
    formats: new Set(formats),
    template,
    log,
    scripts: {
      refDoc: path.join(repoRoot, "scripts", "parity", "reference", "doc", "ref_doc.py"),
      refFig: path.join(repoRoot, "scripts", "parity", "reference", "fig", "ref_fig.py"),
      compare: path.join(repoRoot, "scripts", "parity", "compare", "compare.py"),
    },
  };
  if (!existsSync(python)) log.warn(`interpreter Python tidak ditemukan: ${python} (acuan/pembanding akan REF_ERROR)`);

  const disc = discoverFixtures(fixturesDir);
  const only = args.values.get("only");
  const selected = disc.fixtures.filter((f) => matchesOnly(f, only));
  log.info("run started", { fixturesDir, outDir, only: only ?? null, total: disc.fixtures.length, selected: selected.length, skippedFiles: disc.skipped.length, formats });
  process.stdout.write(`run_parity: ${selected.length} fixture (dari ${disc.fixtures.length}; ${disc.skipped.length} berkas dilewati) -> ${outDir}\n`);

  const results: FixtureResult[] = [];
  try {
    for (const [i, f] of selected.entries()) {
      let r: FixtureResult;
      try {
        r = await runFixture(ctx, f);
      } catch (err) {
        log.error(`fixture ${f.id} crashed`, err);
        r = { id: f.id, kind: f.kind, file: f.file, workDir: path.join(outDir, f.workName), verdict: "NODE_ERROR", formats: [], ref: null, node: null, notes: [`runner galat: ${errMessage(err)}`], durationMs: 0 };
      }
      results.push(r);
      process.stdout.write(`  [${i + 1}/${selected.length}] ${r.verdict.padEnd(13)} ${f.id} ${r.formats.map((x) => `${x.format}${x.sheet && x.sheet > 1 ? `#${x.sheet}` : ""}=${verdictLabel(x)}`).join(" ")}\n`);
    }
  } finally {
    try {
      await closeBrowser();
    } catch (err) {
      log.warn("browser close failed", { error: errMessage(err) });
    }
  }

  const strict = args.flags.has("strict");
  const byVerdict: Record<string, number> = {};
  const formatsByVerdict: Record<string, number> = {};
  const diagnosisByLevel: Record<string, number> = {};
  for (const r of results) {
    byVerdict[r.verdict] = (byVerdict[r.verdict] ?? 0) + 1;
    for (const x of r.formats) {
      formatsByVerdict[x.verdict] = (formatsByVerdict[x.verdict] ?? 0) + 1;
      if (x.verdict === "DIAGNOSIS" && x.checkLevel) diagnosisByLevel[x.checkLevel] = (diagnosisByLevel[x.checkLevel] ?? 0) + 1;
    }
  }
  const fmtKey = (x: FormatResult): string => (x.sheet && x.sheet > 1 ? `${x.format}#${x.sheet}` : x.format);
  const failing = results.some((r) => FAILING.has(r.verdict) || (strict && r.verdict === "NOT_READY"));
  const summary: RunSummary = {
    schema: "studio.parity.summary/v1",
    tool: "scripts/parity/run/run_parity.ts",
    correlationId,
    startedAt: new Date(t0).toISOString(),
    finishedAt: new Date().toISOString(),
    fixturesDir,
    outDir,
    only: only ?? null,
    formats,
    python,
    strict,
    counts: { fixtures: results.length, skippedFiles: disc.skipped.length, byVerdict, formatsByVerdict, diagnosisByLevel },
    skipped: disc.skipped,
    fixtures: results.map((r) => {
      const counted = r.formats.filter((x) => typeof x.failedChecks === "number");
      return {
        id: r.id,
        kind: r.kind,
        code: r.code,
        verdict: r.verdict,
        workDir: r.workDir,
        formats: Object.fromEntries(r.formats.map((x) => [fmtKey(x), x.verdict])),
        ...(counted.length ? { failedChecks: Object.fromEntries(counted.map((x) => [fmtKey(x), x.failedChecks as number])) } : {}),
      };
    }),
    exitCode: failing ? 1 : 0,
    durationMs: Date.now() - t0,
  };
  writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 1)}\n`, "utf8");
  writeFileSync(path.join(outDir, "summary.md"), summaryMarkdown(summary, results), "utf8");
  log.info("run finished", { exitCode: summary.exitCode, byVerdict, durationMs: summary.durationMs });
  process.stdout.write(`run_parity: ${JSON.stringify(byVerdict)} exit=${summary.exitCode} summary=${path.join(outDir, "summary.md")}\n`);
  return summary.exitCode;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: "error", source: "parity.run_parity", message: errMessage(err), stack_trace: err instanceof Error ? err.stack : undefined })}\n`);
    process.exitCode = 1;
  });

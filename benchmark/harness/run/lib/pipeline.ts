/**
 * Langkah runner benchmark (S97) tanpa DB: ingest dry-run mode laporan ->
 * templat + override dokumen -> figur (buildFigures layanan render, PNG 300
 * dpi) -> DOCX -> PDF (soffice S92) -> lint pasca-render -> bm_compare.py.
 *
 * FIX-5 (R04): tahap templat/override (`templateForDoc` -> `applyDocOverrides`),
 * pramuat aset (`preloadAssetBytes`), figur (`buildFigures`) dan lint
 * (`lintAfterRender`) memakai fungsi layanan `services/render` apa adanya,
 * bukan salinan logika. Orkestrator penuh tanpa DB diajukan ke FIX-1
 * (`file_requests.md`).
 *
 * Modul mesin dimuat dinamis per langkah sehingga `--help`/`--dry-run` ringan
 * dan modul yang masih stub (`StudioNotImplemented`) hanya menandai langkahnya
 * NOT_READY tanpa menghentikan proses.
 *
 * SR-34: masukan v1 dan v2 memakai pipeline yang sama (ingest v2 = dispatch
 * `$schema` layanan ingest, SR-12). Seam v2 yang belum ada (`inputs.notReady`)
 * membuat ingest NOT_READY tanpa memanggil layanan; figur v2 dipetakan ke
 * indeks S94 lewat `id` (pid) blok karena blok v2 tidak membawa `x`.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type {
  FigureStore,
  LintIssue,
  LintReport,
  NormBlock,
  NormDocSnapshot,
  RenderContext,
  RenderLogEntry,
  ResolvedTemplate,
  StudioCaller,
  StudioDocV1,
  StudioTier,
  SvgResult,
  ValidationIssue,
} from "../../../../src/lib/studio/contract";
import { StudioEngineError, StudioNotImplemented } from "../../../../src/lib/studio/contract/errors";
import { BM_COMPARE, REPO_ROOT, type RunConfig } from "./config";
import { ENGINE_KINDS, readVerifiedAsset, repoRel, sha256Hex, type FigureIndexEntry, type LoadedInputs } from "./inputs";
import type { RunLog } from "./runlog";

export type StepStatus = "OK" | "PARTIAL" | "FAILED" | "NOT_READY" | "SKIPPED" | "PLANNED";

export interface StepRecord {
  id: "load" | "ingest" | "figures" | "docx" | "pdf" | "lint" | "compare" | "report";
  title: string;
  status: StepStatus;
  durationMs?: number;
  module?: string;
  code?: string;
  message?: string;
  detail?: Record<string, unknown>;
}

export interface NotReadyModule {
  step: StepRecord["id"];
  module: string;
  code?: string;
  message: string;
  figure?: string;
}

export interface FigureRecord {
  id: string;
  kind: string;
  page: number;
  bigPage: boolean;
  figure: string | null;
  mode: "ENGINE" | "FALLBACK_RASTER" | "RASTER" | "MISSING";
  /** Sumber byte figur di DOCX: mesin (spec S94/dialek) atau raster aset; null = hilang. */
  source: "mesin" | "raster" | null;
  /** id spec S94 (`spec.id`) atau `dialect:<d>`; null untuk raster. */
  specId: string | null;
  specPath: string | null;
  sheets: number;
  widthMm?: number;
  heightMm?: number;
  files: string[];
  pngSha256?: string;
  error?: string;
  errorCode?: string;
}

export interface OutputFile {
  kind: "docx" | "pdf";
  path: string;
  bytes: number;
  sha256: string;
}

export interface CompareResult {
  exitCode: number | null;
  dir: string;
  reportJson: string | null;
  reportMd: string | null;
  report: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
  stdoutFile: string;
  stderrFile: string;
  timedOut: boolean;
}

export interface PipelineState {
  steps: StepRecord[];
  notReady: NotReadyModule[];
  figures: FigureRecord[];
  outputs: OutputFile[];
  ingest: {
    valid: boolean;
    issues: ValidationIssue[];
    issuesTotal: number;
    lint: LintReport | null;
    releaseStatus: string | null;
    downgraded: string[];
    units: number;
    blocks: number;
  } | null;
  renderLog: { warn: number; error: number };
  /** Konteks render layanan (R04): jumlah override dokumen, tier lint, id job tanpa DB. */
  render: { overrides: number; tier: string; job: string } | null;
  lint: { tier: string; releaseStatus: string; banner: string; checks: number; fail: number; failSample: LintIssue[] } | null;
  compare: CompareResult | null;
}

/** Pemanggil internal tanpa hak kelas K (doc.json benchmark tanpa override). */
const CALLER: StudioCaller = { kind: "INTERNAL_AGENT", requester: "benchmark-runner-s97", canWriteClassK: false };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Klasifikasi galat langkah: stub/lingkungan = NOT_READY, lainnya FAILED. */
function classify(e: unknown, fallbackModule: string): { status: "NOT_READY" | "FAILED"; module: string; code?: string } {
  if (e instanceof StudioNotImplemented) return { status: "NOT_READY", module: e.moduleId };
  if (e instanceof Error && e.name === "StudioBrowserError") return { status: "NOT_READY", module: "engine/browser", code: (e as Error & { reason?: string }).reason };
  if (e instanceof StudioEngineError) {
    if (e.code === "PDF_ENGINE_UNAVAILABLE") return { status: "NOT_READY", module: fallbackModule, code: e.code };
    return { status: "FAILED", module: fallbackModule, code: e.code };
  }
  return { status: "FAILED", module: fallbackModule };
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const t0 = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - t0 };
}

export function newState(): PipelineState {
  return { steps: [], notReady: [], figures: [], outputs: [], ingest: null, renderLog: { warn: 0, error: 0 }, render: null, lint: null, compare: null };
}

export function isEngineKind(kind: string): boolean {
  return (ENGINE_KINDS as readonly string[]).includes(kind);
}

function benchmarkFigureId(block: NormBlock): string | null {
  const c = isRecord(block.content) ? block.content : {};
  const x = isRecord(c.x) ? c.x : {};
  const bf = isRecord(x.benchmarkFigure) ? x.benchmarkFigure : {};
  if (typeof bf.id === "string") return bf.id;
  return typeof c.asset === "string" ? c.asset : null;
}

/**
 * Id figur S94 untuk blok snapshot: penanda `x.benchmarkFigure` (v1), lalu pid
 * blok v2 (`pid` snapshot norm/v2, `content.id`, atau `blockId`) lewat peta
 * substitusi, lalu `blockId`.
 */
function figureIdOf(block: NormBlock, pidToFigure: ReadonlyMap<string, string>): string {
  const direct = benchmarkFigureId(block);
  if (direct) return direct;
  const b = block as unknown as Record<string, unknown>;
  const c = isRecord(block.content) ? block.content : {};
  for (const k of [b.pid, c.id, block.blockId]) {
    if (typeof k === "string" && pidToFigure.has(k)) return pidToFigure.get(k) as string;
  }
  return block.blockId;
}

/** Templat terselesaikan; null hanya bila seam v2 belum ada (ingest sudah NOT_READY). */
function requireTemplate(inputs: LoadedInputs): ResolvedTemplate {
  if (!inputs.template) throw new Error("templat belum terselesaikan (seam v2 belum ada)");
  return inputs.template;
}

/* ------------------------------------------------------------- ingest -- */

async function stepIngest(cfg: RunConfig, inputs: LoadedInputs, st: PipelineState, log: RunLog): Promise<NormDocSnapshot | null> {
  const step: StepRecord = { id: "ingest", title: "Ingest/normalisasi dry-run, mode laporan (D-55)", status: "OK", module: "services/ingest" };
  st.steps.push(step);
  const downgraded: string[] = [];
  const t0 = Date.now();
  // SR-34: seam v2 belum ada -> NOT_READY eksplisit; jalur v1 tidak dipakai diam-diam.
  if (inputs.notReady.length > 0 || !inputs.template) {
    step.status = "NOT_READY";
    step.module = inputs.notReady.map((n) => n.module).join("; ") || "services/templates";
    step.code = "SCHEMA_V2_NOT_READY";
    step.message = `masukan ${inputs.schema.doc} + ${inputs.schema.template} belum dapat diproses: ${inputs.notReady.map((n) => `${n.message} (${n.owner})`).join("; ")}; pakai --schema v1 untuk jalur v1`;
    for (const n of inputs.notReady) st.notReady.push({ step: "ingest", module: n.module, code: "SCHEMA_V2_NOT_READY", message: `${n.message} (${n.owner})` });
    log.log("error", "benchmark.run.ingest", step.message, { code: step.code, context: { schema: inputs.schema, notReady: inputs.notReady } });
    step.durationMs = 0;
    return null;
  }
  try {
    const ingest = await import("../../../../src/lib/studio/services/ingest");
    const templates = await import("../../../../src/lib/studio/services/templates");
    const ingestSink = log.sink("studio.services.ingest");
    ingest.setIngestLogSink((e) => {
      if (e.code === "D34_DOWNGRADED" && isRecord(e.context) && Array.isArray(e.context.checks)) downgraded.push(...e.context.checks.map(String));
      ingestSink(e);
    });
    templates.setTemplatesLogSink(log.sink("studio.services.templates"));

    const r = await ingest.ingestDocument({ document: inputs.doc }, CALLER, {
      dryRun: true,
      enforcement: "report",
      // IP-31/F-042, D-98: runner = harness CLI server tanpa sesi HTTP; tanpa flag ini
      // penanda benchmark/enforcement dibuang dan templat terbatas ditolak 403.
      trustedHarness: true,
      template: requireTemplate(inputs),
      // FIX-B (B-1, D-241): kerangka berkas templat v2; tanpa ini ingest memakai
      // kerangka implisit (toc AUTO) dan menolak entries daftar isi doc.v2.json.
      ...(inputs.skeleton ? { skeleton: inputs.skeleton } : {}),
      assetIndexPath: cfg.figureIndex,
      correlationId: log.correlationId,
    });
    st.ingest = {
      valid: r.valid,
      issues: r.issues.slice(0, 200),
      issuesTotal: r.issues.length,
      lint: r.lint,
      releaseStatus: r.releaseStatus,
      downgraded,
      units: r.snapshot?.units.length ?? 0,
      blocks: r.snapshot?.blocks.length ?? 0,
    };
    if (!r.valid || !r.snapshot) {
      step.status = "FAILED";
      step.code = "SCHEMA_INVALID";
      step.message = `ingest menolak dokumen: ${r.issues.length} isu (pertama: ${r.issues[0]?.pointer ?? ""} ${r.issues[0]?.message ?? ""})`;
      log.log("error", "benchmark.run.ingest", step.message, { code: step.code, context: { issues: r.issues.slice(0, 20) } });
      return null;
    }
    const snapshot = r.snapshot;

    // Byte aset raster ke snapshot (dataBase64) agar renderer tidak membaca penyimpanan
    // workspace (run tanpa DB, tanpa efek samping). sha256 diverifikasi resolveDocAssets.
    const sources = ingest.loadAssetIndex(cfg.figureIndex);
    const res = ingest.resolveDocAssets(snapshot.doc as StudioDocV1, requireTemplate(inputs), sources, "/document");
    if (res.issues.length > 0) {
      step.status = "FAILED";
      step.code = "ASSET_UNRESOLVED";
      step.message = `${res.issues.length} aset tidak terselesaikan: ${res.issues[0].message}`;
      log.log("error", "benchmark.run.ingest", step.message, { code: step.code, context: { issues: res.issues } });
      return null;
    }
    const assets = (snapshot.doc.assets ?? {}) as NonNullable<StudioDocV1["assets"]>;
    for (const [key, a] of res.assets) {
      const ref = assets[key];
      if (!ref) continue;
      const next = { ...ref, sha256: a.sha256, dataBase64: Buffer.from(a.bytes).toString("base64") };
      delete next.path;
      assets[key] = next;
    }
    step.detail = {
      releaseStatus: r.releaseStatus,
      lintReleaseStatus: r.lint?.releaseStatus ?? null,
      downgraded,
      units: snapshot.units.length,
      blocks: snapshot.blocks.length,
      assetsResolved: res.assets.size,
    };
    if (downgraded.length > 0) log.log("warn", "benchmark.run.ingest", `penahan by-construction diturunkan (D-55): ${downgraded.join(", ")}`, { code: "D34_DOWNGRADED" });
    // IP-53 (SR-12): ingest mengembalikan AnyNormSnapshot (norm/v1 | norm/v2). Seam
    // produksi `engineSnapshot` (identitas untuk v1; v2 = perluasan struktural) dipakai
    // apa adanya agar langkah figur/DOCX/lint menerima bentuk yang sama dengan render.
    const common = await import("../../../../src/lib/studio/services/render/common");
    return common.engineSnapshot(snapshot);
  } catch (e) {
    const c = classify(e, "services/ingest");
    step.status = c.status;
    step.module = c.module;
    step.code = c.code;
    step.message = errMessage(e);
    if (c.status === "NOT_READY") st.notReady.push({ step: "ingest", module: c.module, code: c.code, message: step.message });
    log.log("error", "benchmark.run.ingest", `ingest gagal: ${step.message}`, { code: c.code ?? "INGEST_FAILED", err: e });
    return null;
  } finally {
    step.durationMs = Date.now() - t0;
  }
}

/* ------------------------------------------------------- render prep -- */

type RenderJobRow = ConstructorParameters<typeof import("../../../../src/lib/studio/services/render/job").RenderJobHandle>[0];
type ProdJob = import("../../../../src/lib/studio/services/render/job").RenderJobHandle;

/** Galat figur yang ditangkap dari `job.addError` layanan render (buildFigures). */
interface JobFailure {
  code: string;
  message: string;
  err: unknown;
}

/**
 * Konteks render bersama layanan produksi (R04): templat + override dokumen
 * (`templateForDoc` -> `applyDocOverrides`), tier dokumen, job render tanpa DB
 * (konstruktor `RenderJobHandle` hanya menyalin medan; `persist` tidak pernah
 * dipanggil runner), dan byte aset dipramuat (`preloadAssetBytes`).
 */
export interface RenderPrep {
  tpl: ResolvedTemplate;
  tier: StudioTier;
  job: ProdJob;
  failures: JobFailure[];
  assetBytes: NonNullable<RenderContext["assetBytes"]>;
}

async function prepareRender(cfg: RunConfig, inputs: LoadedInputs, snapshot: NormDocSnapshot, st: PipelineState): Promise<RenderPrep> {
  const { RenderJobHandle } = await import("../../../../src/lib/studio/services/render/job");
  const common = await import("../../../../src/lib/studio/services/render/common");
  const row = {
    id: `bench-${cfg.runId}`,
    documentId: null,
    revisionId: null,
    artifactId: null,
    formats: ["DOCX", "PDF"],
    queuedAt: new Date(),
  } as unknown as RenderJobRow;
  const job = new RenderJobHandle(row);
  const failures: JobFailure[] = [];
  const addError = job.addError.bind(job);
  job.addError = (code, message, format, err) => {
    failures.push({ code, message, err });
    addError(code, message, format, err);
  };
  const tpl = common.templateForDoc(requireTemplate(inputs), snapshot.doc, job.log);
  const overrides = Object.keys(snapshot.doc.overrides ?? {}).length;
  const tier = (snapshot.doc.meta.tier ?? "NOTA") as StudioTier;
  st.render = { overrides, tier, job: job.id };
  const assetBytes = await common.preloadAssetBytes(snapshot.doc, job.log);
  return { tpl, tier, job, failures, assetBytes };
}

/** Pindahkan log job layanan render (JobLog di memori) ke run_log.jsonl. */
function flushJobLog(prep: RenderPrep | null, log: RunLog): void {
  if (!prep) return;
  const sink = log.sink("services/render");
  for (const e of prep.job.log.snapshot().entries) sink(e);
}

/* ------------------------------------------------------------ figures -- */

interface StoreEntry {
  svg?: string;
  png?: Uint8Array;
  widthMm: number;
  heightMm: number;
}

export interface FigureStage {
  store: FigureStore;
  svgs: SvgResult[];
  extra: LintIssue[];
}

/**
 * Figur lewat orkestrator figur layanan render (`buildFigures` S51, R04): spec
 * chart/diagram sudah disubstitusi dari berkas spec S94 oleh `loadInputs`,
 * lembar simbol dari dialek, rasterisasi PNG 300 dpi oleh `prepareFigureStore`.
 * Figur yang gagal tidak ada di store; runner mencatatnya (mode MISSING), atau
 * hanya dengan `--figure-fallback raster` menggantinya dengan raster acuan.
 */
async function stepFigures(cfg: RunConfig, inputs: LoadedInputs, snapshot: NormDocSnapshot, prep: RenderPrep, st: PipelineState, log: RunLog): Promise<FigureStage | null> {
  const step: StepRecord = { id: "figures", title: "Figur lewat buildFigures layanan render (spec S94) -> PNG 300 dpi; raster dari aset", status: "OK", module: "services/render/figures (buildFigures)" };
  st.steps.push(step);
  const t0 = Date.now();
  const figDir = path.join(cfg.out, "figures");
  const byId = new Map<string, FigureIndexEntry>(inputs.index.figures.map((f) => [f.id, f]));
  const subById = new Map(inputs.substitutions.map((s) => [s.id, s]));
  const pidToFigure = new Map(inputs.substitutions.filter((s) => typeof s.pid === "string" && s.pid).map((s) => [s.pid as string, s.id]));
  const fallbackMap = new Map<string, StoreEntry>();
  let engineOk = 0;
  let fallback = 0;
  let missing = 0;
  try {
    const figs = await import("../../../../src/lib/studio/engine/docx/figures");
    const render = await import("../../../../src/lib/studio/services/render/figures");
    const browser = await import("../../../../src/lib/studio/engine/browser");
    browser.setBrowserLogSink(log.sink("engine/browser"));
    mkdirSync(figDir, { recursive: true });

    const built = await render.buildFigures({ snapshot, tpl: prep.tpl, tier: prep.tier, job: prep.job, reader: new render.ArtifactSpecReader() });

    for (const block of snapshot.blocks) {
      if (!isEngineKind(block.type)) continue;
      const id = figureIdOf(block, pidToFigure);
      const entry = byId.get(id);
      const sub = subById.get(id);
      const c = isRecord(block.content) ? block.content : {};
      const key = figs.figureStoreKeys(block, snapshot.numbering)[0];
      const rec: FigureRecord = {
        id,
        kind: block.type,
        page: entry?.page ?? 0,
        bigPage: entry?.bigPage ?? false,
        figure: block.artifactLabel ?? entry?.figure ?? null,
        mode: "ENGINE",
        source: "mesin",
        specId: sub?.specId ?? null,
        specPath: sub?.specPath ?? null,
        sheets: 0,
        files: [],
      };
      st.figures.push(rec);
      for (let n = 1; ; n++) {
        const e = built.store.get(figs.sheetKey(key, n));
        if (!e) break;
        const stem = n > 1 ? `${id}_${n}` : id;
        if (e.svg) {
          writeFileSync(path.join(figDir, `${stem}.svg`), e.svg, "utf8");
          rec.files.push(repoRel(path.join(figDir, `${stem}.svg`)));
        }
        if (e.png) {
          writeFileSync(path.join(figDir, `${stem}.png`), e.png);
          rec.files.push(repoRel(path.join(figDir, `${stem}.png`)));
        }
        if (n === 1) {
          rec.widthMm = e.widthMm;
          rec.heightMm = e.heightMm;
          if (e.png) rec.pngSha256 = sha256Hex(e.png);
        }
        rec.sheets = n;
      }
      if (rec.sheets > 0) {
        engineOk++;
        continue;
      }
      // Gagal di buildFigures: galat job berawalan "figure <label> " (S51).
      const label = block.artifactLabel ?? snapshot.numbering[block.blockId] ?? block.blockId;
      const fail = prep.failures.find((f) => f.message.startsWith(`figure ${label} `));
      const cl = classify(fail?.err, `engine/${block.type === "symbolSheet" ? "symbols" : block.type}`);
      rec.error = fail ? errMessage(fail.err ?? fail.message) : "figur tidak dihasilkan buildFigures (tanpa galat job yang cocok)";
      rec.errorCode = cl.code ?? fail?.code;
      if (cl.status === "NOT_READY") st.notReady.push({ step: "figures", module: cl.module, code: cl.code, message: rec.error, figure: id });
      log.log("error", "benchmark.run.figures", `figur ${id} (${block.type}) gagal dirender mesin: ${rec.error}`, {
        code: rec.errorCode ?? "FIGURE_ENGINE_FAILED",
        err: fail?.err,
        context: { id, module: cl.module, specId: rec.specId },
      });
      if (cfg.figureFallback === "raster" && entry) {
        const png = readVerifiedAsset(entry, cfg.figureIndex);
        const widthMm = typeof c.widthMm === "number" ? c.widthMm : (entry.widthMm ?? 166);
        const heightMm = typeof c.heightMm === "number" ? c.heightMm : (entry.heightMm ?? widthMm * 0.75);
        fallbackMap.set(figs.sheetKey(key, 1), { png, widthMm, heightMm });
        rec.mode = "FALLBACK_RASTER";
        rec.source = "raster";
        rec.sheets = 1;
        rec.widthMm = widthMm;
        rec.heightMm = heightMm;
        rec.pngSha256 = sha256Hex(png);
        fallback++;
        log.log("warn", "benchmark.run.figures", `figur ${id}: raster acuan dipakai sebagai pengganti (FALLBACK_RASTER, run DIAGNOSIS)`, { code: "FIGURE_FALLBACK_RASTER" });
      } else {
        rec.mode = "MISSING";
        rec.source = null;
        missing++;
      }
    }
    // Figur raster (foto/logo/ilustrasi/perangkat, atau figur mesin yang tidak disubstitusi).
    const seen = new Set(st.figures.map((f) => f.id));
    for (const f of inputs.index.figures) {
      if (seen.has(f.id)) continue;
      const sub = subById.get(f.id);
      st.figures.push({
        id: f.id,
        kind: f.kind,
        page: f.page,
        bigPage: f.bigPage,
        figure: f.figure ?? null,
        mode: "RASTER",
        source: "raster",
        specId: null,
        specPath: null,
        sheets: 1,
        widthMm: f.widthMm,
        heightMm: f.heightMm,
        files: [],
        pngSha256: f.sha256,
        ...(sub && sub.status !== "SUBSTITUTED" ? { error: `${sub.status}${sub.note ? `: ${sub.note}` : ""}` } : {}),
      });
    }
    st.figures.sort((a, b) => a.id.localeCompare(b.id));
    const rasterForEngine = st.figures.filter((f) => isEngineKind(f.kind) && f.mode === "RASTER").length;
    step.status = missing > 0 ? "FAILED" : fallback > 0 || rasterForEngine > 0 ? "PARTIAL" : "OK";
    step.detail = {
      engine: engineOk,
      fallbackRaster: fallback,
      missing,
      rasterForEngineKinds: rasterForEngine,
      raster: st.figures.filter((f) => f.mode === "RASTER").length,
      svgReports: built.svgs.length,
      extraChecks: built.extra.length,
      dir: repoRel(figDir),
    };
    if (missing > 0) step.message = `${missing} figur mesin gagal tanpa pengganti (--figure-fallback none)`;
    else if (fallback > 0) step.message = `${fallback} figur memakai raster acuan karena render mesin gagal (DIAGNOSIS)`;
    else if (rasterForEngine > 0) step.message = `${rasterForEngine} figur chart/diagram/simbol memakai raster acuan (${cfg.figures === "raster" ? "--figures raster" : "tidak tersubstitusi"})`;
    const store: FigureStore = { get: (label: string) => built.store.get(label) ?? fallbackMap.get(label) };
    return { store, svgs: built.svgs, extra: built.extra };
  } catch (e) {
    const cl = classify(e, "services/render/figures");
    step.status = cl.status;
    step.module = cl.module;
    step.code = cl.code;
    step.message = errMessage(e);
    if (cl.status === "NOT_READY") st.notReady.push({ step: "figures", module: cl.module, code: cl.code, message: step.message });
    log.log("error", "benchmark.run.figures", `langkah figur gagal: ${step.message}`, { code: cl.code ?? "FIGURES_FAILED", err: e });
    return null;
  } finally {
    step.durationMs = Date.now() - t0;
  }
}

/* --------------------------------------------------------------- lint -- */

/** Lint pasca-render layanan produksi (`lintAfterRender`, R04); tidak menahan berkas. */
async function stepLint(snapshot: NormDocSnapshot, prep: RenderPrep, figures: FigureStage | null, st: PipelineState, log: RunLog): Promise<void> {
  const step: StepRecord = { id: "lint", title: "Lint pasca-render (lintAfterRender layanan render; tidak menahan berkas)", status: "OK", module: "services/render/lint" };
  st.steps.push(step);
  const t0 = Date.now();
  try {
    const { lintAfterRender } = await import("../../../../src/lib/studio/services/render/lint");
    const r = lintAfterRender({ snapshot, tpl: prep.tpl, tier: prep.tier, svgs: figures?.svgs ?? [], extra: figures?.extra, log: prep.job.log });
    const fails = r.checks.filter((c) => c.status === "FAIL");
    st.lint = { tier: r.tier, releaseStatus: r.releaseStatus, banner: r.banner, checks: r.checks.length, fail: fails.length, failSample: fails.slice(0, 60) };
    step.detail = { tier: r.tier, releaseStatus: r.releaseStatus, checks: r.checks.length, fail: fails.length, html: false };
    log.log("info", "benchmark.run.lint", `lint ${r.tier}: ${r.releaseStatus} (${r.checks.length} cek, FAIL ${fails.length}; tanpa HTML)`, { code: "LINT_DONE" });
  } catch (e) {
    const cl = classify(e, "services/render/lint");
    step.status = cl.status;
    step.module = cl.module;
    step.code = cl.code;
    step.message = errMessage(e);
    if (cl.status === "NOT_READY") st.notReady.push({ step: "lint", module: cl.module, code: cl.code, message: step.message });
    log.log("error", "benchmark.run.lint", `lint pasca-render gagal: ${step.message}`, { code: cl.code ?? "LINT_FAILED", err: e });
  } finally {
    step.durationMs = Date.now() - t0;
  }
}

/* --------------------------------------------------------------- docx -- */

function outputName(doc: StudioDocV1, ext: string, fallback: string, paths: { datumFileName: (t: string, n: string, r: string, e: string) => string }): string {
  try {
    return paths.datumFileName(doc.meta.title, String(doc.meta.docNumber ?? ""), String(doc.meta.rev ?? ""), ext);
  } catch {
    return `${fallback}.${ext}`;
  }
}

async function stepDocx(cfg: RunConfig, prep: RenderPrep, snapshot: NormDocSnapshot, figures: FigureStore, st: PipelineState, log: RunLog): Promise<{ bytes: Uint8Array; file: string } | null> {
  const step: StepRecord = { id: "docx", title: "DOCX lewat mesin Node (assembleDocx S20)", status: "OK", module: "engine/docx/assemble" };
  st.steps.push(step);
  const t0 = Date.now();
  try {
    const { assembleDocx } = await import("../../../../src/lib/studio/engine/docx/assemble");
    const { Register } = await import("../../../../src/lib/studio/engine/bind");
    const paths = await import("../../../../src/lib/studio/services/storage/paths");
    const renderLog = (e: RenderLogEntry) => {
      if (e.level === "warn") st.renderLog.warn++;
      if (e.level === "error") st.renderLog.error++;
      log.log(e.level, "engine/render", e.message, { code: e.code ? String(e.code) : undefined, context: e.address ? { address: e.address } : undefined });
    };
    // RenderContext sama dengan layanan render S51: templat ber-override + assetBytes.
    const ctx: RenderContext = {
      snapshot,
      tpl: prep.tpl,
      register: new Register(snapshot.register ?? {}),
      fixedDate: snapshot.doc.meta.issueDate,
      figures,
      log: renderLog,
      assetBytes: prep.assetBytes,
    };
    const { value } = await timed(() => assembleDocx(ctx));
    const file = path.join(cfg.out, outputName(snapshot.doc, "docx", "benchmark_output", paths));
    writeFileSync(file, value.bytes);
    st.outputs.push({ kind: "docx", path: repoRel(file), bytes: value.bytes.length, sha256: sha256Hex(value.bytes) });
    step.detail = { file: repoRel(file), bytes: value.bytes.length, facesUsed: value.facesUsed, renderWarnings: st.renderLog.warn, renderErrors: st.renderLog.error };
    return { bytes: value.bytes, file };
  } catch (e) {
    const cl = classify(e, "engine/docx/assemble");
    step.status = cl.status;
    step.module = cl.module;
    step.code = cl.code;
    step.message = errMessage(e);
    if (cl.status === "NOT_READY") st.notReady.push({ step: "docx", module: cl.module, code: cl.code, message: step.message });
    log.log("error", "benchmark.run.docx", `perakitan DOCX gagal: ${step.message}`, { code: cl.code ?? "DOCX_FAILED", err: e });
    return null;
  } finally {
    step.durationMs = Date.now() - t0;
  }
}

/* ---------------------------------------------------------------- pdf -- */

async function stepPdf(cfg: RunConfig, docx: { bytes: Uint8Array; file: string } | null, st: PipelineState, log: RunLog): Promise<string | null> {
  const step: StepRecord = { id: "pdf", title: "DOCX -> PDF lewat layanan soffice S92 (profil per job)", status: "OK", module: "engine/soffice" };
  st.steps.push(step);
  if (cfg.skipPdf) {
    step.status = "SKIPPED";
    step.message = "--skip-pdf";
    return null;
  }
  if (!docx) {
    step.status = "SKIPPED";
    step.message = "DOCX tidak tersedia";
    return null;
  }
  const t0 = Date.now();
  try {
    const soffice = await import("../../../../src/lib/studio/engine/soffice");
    soffice.setSofficeLogSink(log.sink("studio.engine.soffice"));
    const ready = await soffice.checkRenderEnvReadiness({ force: true });
    step.detail = { ready: ready.ready, sofficeVersion: ready.soffice.version, manifestSha256: ready.manifestSha256 };
    if (!ready.ready) {
      step.status = "NOT_READY";
      step.code = "PDF_ENGINE_UNAVAILABLE";
      step.message = `render-env tidak siap: ${ready.errors.join("; ") || "alasan tidak diketahui"}`;
      st.notReady.push({ step: "pdf", module: "engine/soffice (render-env S91)", code: step.code, message: step.message });
      log.log("warn", "benchmark.run.pdf", step.message, { code: step.code });
      return null;
    }
    const stem = path.basename(docx.file).replace(/\.docx$/i, "");
    const r = await soffice.convertDocxToPdf(docx.bytes, { jobId: cfg.runId, fileName: stem });
    const file = path.join(cfg.out, `${stem}.pdf`);
    writeFileSync(file, r.pdf);
    st.outputs.push({ kind: "pdf", path: repoRel(file), bytes: r.pdf.length, sha256: sha256Hex(r.pdf) });
    step.detail = { ...step.detail, file: repoRel(file), bytes: r.pdf.length, convertMs: r.durationMs };
    return file;
  } catch (e) {
    const cl = classify(e, "engine/soffice");
    step.status = cl.status;
    step.module = cl.module;
    step.code = cl.code;
    step.message = errMessage(e);
    if (cl.status === "NOT_READY") st.notReady.push({ step: "pdf", module: cl.module, code: cl.code, message: step.message });
    log.log("error", "benchmark.run.pdf", `konversi PDF gagal: ${step.message}`, { code: cl.code ?? "PDF_CONVERT_FAILED", err: e });
    return null;
  } finally {
    step.durationMs = Date.now() - t0;
  }
}

/* ------------------------------------------------------------ compare -- */

function killTree(pid: number | undefined): void {
  if (!pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" }).on("error", () => undefined);
  } else {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // proses sudah selesai
    }
  }
}

function readJsonMaybe(file: string): Record<string, unknown> | null {
  try {
    const v: unknown = JSON.parse(readFileSync(file, "utf8"));
    return isRecord(v) ? v : null;
  } catch {
    return null;
  }
}

async function stepCompare(cfg: RunConfig, figurePages: string, docxFile: string | null, pdfFile: string | null, st: PipelineState, log: RunLog): Promise<void> {
  const step: StepRecord = { id: "compare", title: "bm_compare.py (S96, H06) terhadap BM.docx/BM.pdf", status: "OK", module: "benchmark/harness/compare" };
  st.steps.push(step);
  if (cfg.skipCompare) {
    step.status = "SKIPPED";
    step.message = "--skip-compare";
    return;
  }
  if (!docxFile && !pdfFile) {
    step.status = "SKIPPED";
    step.message = "tidak ada DOCX maupun PDF keluaran";
    return;
  }
  const script = path.join(REPO_ROOT, BM_COMPARE);
  const missing = [
    ["python (VENV)", cfg.python],
    ["bm_compare.py", script],
    ["BM.docx", cfg.refDocx],
    ["BM.pdf", cfg.refPdf],
  ].filter(([, p]) => !existsSync(p));
  if (missing.length > 0) {
    step.status = "NOT_READY";
    step.code = "COMPARE_ENV_MISSING";
    step.message = `tidak ada: ${missing.map(([n, p]) => `${n} (${p})`).join("; ")}`;
    st.notReady.push({ step: "compare", module: "benchmark/harness/compare", code: step.code, message: step.message });
    log.log("error", "benchmark.run.compare", step.message, { code: step.code });
    return;
  }
  const dir = path.join(cfg.out, "compare");
  mkdirSync(dir, { recursive: true });
  const args = ["-I", "-B", script, "--ref-docx", cfg.refDocx, "--ref-pdf", cfg.refPdf, "--out", dir, "--figure-pages", figurePages];
  if (docxFile) args.push("--docx", docxFile);
  if (pdfFile) args.push("--pdf", pdfFile);
  const stdoutFile = path.join(dir, "bm_compare.stdout.txt");
  const stderrFile = path.join(dir, "bm_compare.stderr.txt");
  const t0 = Date.now();
  const res = await new Promise<{ code: number | null; out: string; err: string; timedOut: boolean; spawnError?: Error }>((resolve) => {
    let out = "";
    let err = "";
    let timedOut = false;
    // Argumen larik, tanpa shell; cwd pendek di luar folder skill.
    const child = spawn(cfg.python, args, { cwd: dir, windowsHide: true, shell: false, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child.pid);
    }, cfg.compareTimeoutMs);
    child.stdout.on("data", (b: Buffer) => (out += b.toString("utf8")));
    child.stderr.on("data", (b: Buffer) => (err += b.toString("utf8")));
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ code: null, out, err, timedOut, spawnError: e });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, out, err, timedOut });
    });
  });
  step.durationMs = Date.now() - t0;
  writeFileSync(stdoutFile, res.out, "utf8");
  writeFileSync(stderrFile, res.err, "utf8");
  const reportJson = path.join(dir, "bm_report.json");
  const reportMd = path.join(dir, "bm_report.md");
  const errorJson = path.join(dir, "bm_error.json");
  st.compare = {
    exitCode: res.code,
    dir: repoRel(dir),
    reportJson: existsSync(reportJson) ? repoRel(reportJson) : null,
    reportMd: existsSync(reportMd) ? repoRel(reportMd) : null,
    report: existsSync(reportJson) ? readJsonMaybe(reportJson) : null,
    error: existsSync(errorJson) ? readJsonMaybe(errorJson) : null,
    stdoutFile: repoRel(stdoutFile),
    stderrFile: repoRel(stderrFile),
    timedOut: res.timedOut,
  };
  if (res.spawnError || res.timedOut || res.code === 2 || res.code === null || !st.compare.report) {
    step.status = "FAILED";
    step.code = res.timedOut ? "COMPARE_TIMEOUT" : "COMPARE_FAILED";
    step.message = res.spawnError
      ? `spawn gagal: ${res.spawnError.message}`
      : res.timedOut
        ? `melebihi ${cfg.compareTimeoutMs} ms (pohon proses dihentikan)`
        : `exit ${res.code}; ${String(st.compare.error?.message ?? res.err.trim().split(/\r?\n/).slice(-1)[0] ?? "")}`;
    log.log("error", "benchmark.run.compare", `bm_compare gagal: ${step.message}`, { code: step.code, err: res.spawnError, context: { args: args.slice(2) } });
    return;
  }
  step.detail = { exitCode: res.code, verdict: st.compare.report.verdict ?? null, report: st.compare.reportJson };
}

/* ------------------------------------------------------------- runner -- */

export async function runPipeline(cfg: RunConfig, inputs: LoadedInputs, figurePages: string, st: PipelineState, log: RunLog): Promise<void> {
  const skip = (id: StepRecord["id"], title: string, why: string) => st.steps.push({ id, title, status: "SKIPPED", message: why });
  let browserUsed = false;
  let prep: RenderPrep | null = null;
  try {
    const snapshot = await stepIngest(cfg, inputs, st, log);
    if (!snapshot) {
      skip("figures", "Figur", "ingest tidak menghasilkan snapshot");
      skip("docx", "DOCX", "ingest tidak menghasilkan snapshot");
      skip("pdf", "PDF", "ingest tidak menghasilkan snapshot");
      skip("lint", "Lint", "ingest tidak menghasilkan snapshot");
      skip("compare", "bm_compare", "tidak ada keluaran");
      return;
    }
    try {
      prep = await prepareRender(cfg, inputs, snapshot, st);
    } catch (e) {
      const cl = classify(e, "services/render/common");
      st.steps.push({ id: "figures", title: "Templat + override dokumen (templateForDoc)", status: cl.status, module: cl.module, code: cl.code, message: errMessage(e) });
      if (cl.status === "NOT_READY") st.notReady.push({ step: "figures", module: cl.module, code: cl.code, message: errMessage(e) });
      log.log("error", "benchmark.run.render", `persiapan render gagal: ${errMessage(e)}`, { code: cl.code ?? "RENDER_PREP_FAILED", err: e });
      skip("docx", "DOCX", "persiapan render gagal");
      skip("pdf", "PDF", "persiapan render gagal");
      skip("lint", "Lint", "persiapan render gagal");
      skip("compare", "bm_compare", "tidak ada keluaran");
      return;
    }
    browserUsed = true;
    const figures = await stepFigures(cfg, inputs, snapshot, prep, st, log);
    const docx = figures ? await stepDocx(cfg, prep, snapshot, figures.store, st, log) : null;
    if (!figures) skip("docx", "DOCX", "FigureStore tidak tersedia");
    const pdf = await stepPdf(cfg, docx, st, log);
    await stepLint(snapshot, prep, figures, st, log);
    await stepCompare(cfg, figurePages, docx?.file ?? null, pdf, st, log);
  } finally {
    flushJobLog(prep, log);
    if (browserUsed) {
      try {
        const browser = await import("../../../../src/lib/studio/engine/browser");
        await browser.closeBrowser();
      } catch (e) {
        log.log("warn", "benchmark.run", `browser tidak dapat ditutup: ${errMessage(e)}`, { code: "BROWSER_CLOSE_FAILED", err: e });
      }
    }
  }
}

/**
 * Mesin render murni (tanpa DB) di balik CLI H01 `render_cli.ts` dan runner
 * H05 `run_parity.ts` (S67; SR-33 v2). Dokumen dirender lewat orkestrator
 * tanpa DB IP-43a (`services/render/pure` `renderSnapshot`, D-155), sehingga
 * CLI menjalankan urutan §8.2 yang sama dengan layanan render:
 *
 *   dokumen v1: validasi skema (S48) -> templat (berkas profil / slug luring /
 *            kanonik) -> override dokumen -> aset raster di-inline (dataBase64)
 *            -> normalize (S48) -> [lingkup] -> renderSnapshot (figur, DOCX,
 *            PDF soffice, HTML, lint)
 *   dokumen v2 (`studio.doc/v2`, `studio.chapter/v2`): validasi skema ->
 *            templat (profil v1 / slug luring / berkas `studio.template/v2`)
 *            -> kerangka + nilai efektif per slot (`resolveSkeletonSlots`
 *            murni, lapis preset <- templat <- slot seperti
 *            `resolveSlotsForVersion` layanan) -> mergeSubmission +
 *            composeV2 dengan `slotParams` (SR-08, pid deterministik
 *            berbenih, KD-22) -> snapshot norm/v2 -> [lingkup] ->
 *            renderSnapshot (`slots`, `tier`)
 *   figur  : chart (S32, komposit = templat bawaan eksplisit D-155) | diagram
 *            (S30, release:false) | simbol (S31; lembar lewat
 *            `symbolSheetFigures` layanan, `symbol.sheet.fit` templat D-147)
 *            | gambar (S53)
 *
 * Lingkup (`--scope document|chapter:<k>|slot:<key>`, register §15.1) memakai
 * `applyRenderScope` lapis render (SR-15); penomoran dihitung dari seluruh
 * dokumen lalu unit difilter. Modul v2 diimpor statis bertipe dari layanan
 * (FIX-C, D-245 M2): drift kontrak terdeteksi tsc.
 *
 * Modul yang masih stub (`StudioNotImplemented`) tidak menghentikan proses:
 * format terdampak ditandai NOT_READY dan job berstatus NOT_READY.
 *
 * Catatan DB: `services/ingest`, `services/images`, dan `services/render`
 * mengimpor modul yang membuat PrismaClient (koneksi malas). Tidak ada fungsi
 * yang mengkueri DB yang dipanggil di sini, sehingga tidak pernah ada koneksi.
 */
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import type {
  AnyNormSnapshot,
  AssetInputV2,
  DocMetaV2,
  LintIssue,
  LintReport,
  NormDocSnapshot,
  ParamMap,
  RenderContext,
  RenderScope,
  ResolvedSlot,
  ResolvedTemplate,
  StudioChapterV2,
  StudioChartV1,
  StudioDiagramV1,
  StudioDocV1,
  StudioDocV2,
  StudioDocV2Resolved,
  StudioImageV1,
  StudioOutputFormat,
  StudioSkeletonV1,
  StudioTier,
  SvgResult,
  ValidationIssue,
} from "../../../../src/lib/studio/contract";
import { STUDIO_MAX_JSON_BYTES } from "../../../../src/lib/studio/contract/env";
import { StudioNotImplemented } from "../../../../src/lib/studio/contract/errors";
import { closeBrowser, rasterizeSvg } from "../../../../src/lib/studio/engine/browser";
import { figureGrid } from "../../../../src/lib/studio/engine/chart/core/guards";
import { buildDiagramSvg } from "../../../../src/lib/studio/engine/diagram/build";
import { checkRenderEnvReadiness } from "../../../../src/lib/studio/engine/soffice";
import { symbolPortsMm, symbolSvg } from "../../../../src/lib/studio/engine/symbols";
import { composeV2, emptyResolvedDoc, figureWidthMm, mergeSubmission, seededPidAllocator, type ComposeResult, type SkeletonInput } from "../../../../src/lib/studio/services/compose";
import { decodeImage, pxGuard } from "../../../../src/lib/studio/services/images";
import { applyDocOverrides, loadAssetIndex, normalize, resolveDocAssets, validateSchema, type IngestAssetSource } from "../../../../src/lib/studio/services/ingest";
import { resolveMetaDefaults } from "../../../../src/lib/studio/services/ingest/meta";
import { svgSizeMm, symbolSheetFigures } from "../../../../src/lib/studio/services/render/figures";
import { installRenderLogSinks, JobLog, registerJobLog, unregisterJobLog } from "../../../../src/lib/studio/services/render/joblog";
import { lintArtifact } from "../../../../src/lib/studio/services/render/lint";
import { FORMAT_EXT, normalizeFormats } from "../../../../src/lib/studio/services/render/naming";
import { applyRenderScope, COMPOSITE_CHART_TEMPLATE, pureChartSvg, renderSnapshot, type PureRenderResult } from "../../../../src/lib/studio/services/render/pure";
import { resolveSkeletonSlots, type SlotParamLayers } from "../../../../src/lib/studio/services/skeleton/resolve";
import { implicitSkeleton, skeletonSha256 } from "../../../../src/lib/studio/services/skeleton/skeleton";
import { loadResolvedTemplateV2File, readTemplateProfileFile } from "../../../../src/lib/studio/services/templates/import";
import { splitDerivedOverrides } from "../../../../src/lib/studio/services/templates/profile";
import { templateLayerOf } from "../../../../src/lib/studio/services/templates/v2";
import { datumPlainName } from "../../../../src/lib/studio/services/storage/paths";
import { errCode, errMessage, HarnessLog, sha256Hex, UsageError } from "./common";
import { loadTemplate, type LoadedTemplate } from "./template";

export const RENDER_REPORT_SCHEMA = "studio.parity.render/v1";
export const RENDER_SOURCE = "parity.render_cli";

/** `docV2` = `studio.doc/v2`, `chapterV2` = `studio.chapter/v2` (SR-33). */
export type InputKind = "doc" | "docV2" | "chapterV2" | "chart" | "diagram" | "symbol" | "image";
export type FormatState = "OK" | "FAILED" | "NOT_READY" | "UNAVAILABLE" | "SKIPPED";
export type JobState = "SUCCEEDED" | "PARTIAL" | "FAILED" | "NOT_READY" | "USAGE";

const DOC_KINDS: ReadonlySet<InputKind> = new Set<InputKind>(["doc", "docV2", "chapterV2"]);
const DOC_FORMATS = { allowed: ["DOCX", "PDF", "HTML", "SVG", "PNG"], defaults: ["DOCX", "PDF", "HTML"] } as const;

/** Format sah per jenis masukan; default bila `--formats` tidak diberikan. */
export const KIND_FORMATS: Readonly<Record<InputKind, { allowed: readonly StudioOutputFormat[]; defaults: readonly StudioOutputFormat[] }>> = {
  doc: DOC_FORMATS,
  docV2: DOC_FORMATS,
  chapterV2: DOC_FORMATS,
  chart: { allowed: ["SVG", "PNG"], defaults: ["SVG", "PNG"] },
  diagram: { allowed: ["SVG", "PNG"], defaults: ["SVG", "PNG"] },
  symbol: { allowed: ["SVG", "PNG"], defaults: ["SVG", "PNG"] },
  image: { allowed: ["PNG"], defaults: ["PNG"] },
};

const SYMBOL_ID_RE = /^[a-z]{3}:[a-z0-9_-]+$/i;
const TEMPLATE_V2_SCHEMA = "studio.template/v2";
/** Kunci lingkup bab/slot: sama longgarnya dengan alamat (validasi sebenarnya di `applyRenderScope`). */
const SCOPE_KEY_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export interface RenderFileEntry {
  format: string;
  path: string;
  sha256: string;
  bytes: number;
  role: "primary" | "figure";
  /** Kunci figur (label artefak) untuk berkas figur dokumen. */
  label?: string;
  /** Nomor lembar (lembar simbol / figur berlembar). */
  sheet?: number;
}

export interface RenderErrorEntry {
  code: string;
  message: string;
  format?: string;
  module?: string;
  address?: string;
}

export interface RenderReport {
  schema: typeof RENDER_REPORT_SCHEMA;
  tool: "scripts/parity/run/render_cli.ts";
  correlationId: string;
  startedAt: string;
  db: "none";
  input: { path: string; sha256: string | null; kind: InputKind | null; schema: string | null; code?: string };
  template: { source: string; templateId: string; versionId: string; droppedDerived: string[]; ignoredFields: string[] } | null;
  formats: string[];
  formatStatus: Record<string, FormatState>;
  files: RenderFileEntry[];
  lint: LintReport | null;
  job: { status: JobState; errorCode?: string };
  errors: RenderErrorEntry[];
  warnings: string[];
  notReady: string[];
  validation: ValidationIssue[];
  renderEnv: { ready: boolean; errors: string[]; sofficeVersion: string | null } | null;
  engineLog: { entries: unknown[]; dropped: number };
  logFile: string;
  durationMs: number;
  exitCode: number;
  /**
   * Fakta figur untuk pembanding (FIX-3): laporan mesin diagram dengan nama medan Python
   * (`checks_run`, `n_nodes`, `n_edges`, `n_hops`, `colour_values`, `n_colour`) dan port simbol
   * dalam mm (`{nama: [x, y]}`). Kosong untuk dokumen/chart.
   */
  figure?: { engineReport?: Record<string, unknown>; ports?: Record<string, [number, number]> };
  /** Lingkup render dokumen (SR-33); absen untuk figur. `draft` = CHAPTER/SLOT. */
  scope?: { kind: RenderScope["kind"]; key?: string; draft: boolean; placeholderSlots?: string[] };
  /** Jalur v2 (SR-33): hasil compose murni. `slots` = slot aktif tier yang nilai efektifnya diteruskan (FIX-C). */
  compose?: { pidSeed: string; snapshotSha256?: string; skeleton: "template" | "implicit"; scopes: string[]; slots?: string[]; warnings: Array<{ code: string; message: string; address?: string }> };
  /** Orkestrator yang merender dokumen (`renderSnapshot` IP-43a). */
  orchestrator?: { jobId: string; status: string; compositeCharts: number; durationMs: number };
}

/** Lingkup render dari CLI (`document`, `chapter:<k>`, `slot:<key>`). */
export function parseScope(arg: string | undefined): RenderScope {
  const raw = (arg ?? "").trim();
  if (raw === "" || raw === "document") return { kind: "DOCUMENT" };
  const m = /^(chapter|slot):(.+)$/.exec(raw);
  if (!m) throw new UsageError(`--scope tidak sah: "${raw}" (sah: document | chapter:<kunci> | slot:<slotKey>)`);
  const key = m[2].trim();
  if (!SCOPE_KEY_RE.test(key)) throw new UsageError(`--scope ${m[1]}: kunci tidak sah "${key}"`);
  return m[1] === "chapter" ? { kind: "CHAPTER", key } : { kind: "SLOT", key };
}

export function formatScope(scope: RenderScope): string {
  return scope.kind === "DOCUMENT" ? "document" : `${scope.kind === "CHAPTER" ? "chapter" : "slot"}:${scope.key}`;
}

export interface RenderOptions {
  /** Berkas JSON masukan, atau id simbol langsung (mis. `iec:breaker`). */
  input: string;
  outDir: string;
  repoRoot: string;
  template?: string;
  formats?: readonly string[];
  assetIndex?: string;
  withCanonicalAssets?: boolean;
  validate?: boolean;
  /** Runner memakai satu browser untuk semua fixture: jangan tutup di akhir. */
  keepBrowser?: boolean;
  correlationId?: string;
  /** Lingkup render dokumen (bawaan DOCUMENT). Figur menolak lingkup selain DOCUMENT. */
  scope?: RenderScope;
  /** Dokumen dasar `studio.doc/v2` tempat kiriman bab digabung (masukan `studio.chapter/v2`). */
  base?: string;
  /** Benih pid deterministik (KD-22); bawaan sha256 masukan. */
  pidSeed?: string;
}

class RenderState {
  readonly report: RenderReport;
  readonly log: JobLog;
  readonly hlog: HarnessLog;
  /** Log job orkestrator (`renderSnapshot`), digabung ke `engineLog`. */
  pureLog: PureRenderResult["log"] | null = null;
  private readonly fmtState = new Map<string, FormatState>();

  constructor(report: RenderReport, log: JobLog, hlog: HarnessLog) {
    this.report = report;
    this.log = log;
    this.hlog = hlog;
  }

  setFormats(fmts: readonly StudioOutputFormat[]): void {
    this.report.formats = fmts.map((f) => FORMAT_EXT[f]);
    for (const f of this.report.formats) this.fmtState.set(f, "OK");
  }

  wants(f: StudioOutputFormat): boolean {
    return this.fmtState.has(FORMAT_EXT[f]);
  }

  ok(f: StudioOutputFormat): boolean {
    return this.fmtState.get(FORMAT_EXT[f]) === "OK";
  }

  /** Catat galat; format terdampak berubah status (NOT_READY menang atas FAILED). */
  fail(err: unknown, fallbackCode: string, message: string, formats: readonly StudioOutputFormat[] = [], address?: string): void {
    const mod = notImplementedModule(err);
    const code = mod ? "NOT_IMPLEMENTED" : errCode(err, fallbackCode);
    if (mod && !this.report.notReady.includes(mod)) this.report.notReady.push(mod);
    const state: FormatState = mod ? "NOT_READY" : code === "PDF_ENGINE_UNAVAILABLE" ? "UNAVAILABLE" : "FAILED";
    for (const f of formats) {
      const k = FORMAT_EXT[f];
      if (!this.fmtState.has(k)) continue;
      if (this.fmtState.get(k) !== "NOT_READY") this.fmtState.set(k, state);
    }
    const full = `${message}: ${errMessage(err)}`;
    this.report.errors.push({
      code,
      message: full,
      ...(formats.length === 1 ? { format: FORMAT_EXT[formats[0]] } : {}),
      ...(mod ? { module: mod } : {}),
      ...(address ? { address } : {}),
    });
    this.log.error(full, { code, err });
    this.hlog.error(full, err, { code, formats: formats.map((f) => FORMAT_EXT[f]), ...(mod ? { module: mod } : {}) });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.report.warnings.push(message);
    this.log.warn(message);
    this.hlog.warn(message, context);
  }

  finalizeFormats(): void {
    for (const [k, v] of this.fmtState) this.report.formatStatus[k] = v;
  }

  /**
   * Serap hasil `renderSnapshot`: galat job -> `errors` (kode kontrak apa adanya),
   * format gagal -> UNAVAILABLE (PDF_ENGINE_UNAVAILABLE) / NOT_READY (modul stub) / FAILED.
   */
  absorbPure(r: PureRenderResult): void {
    for (const e of r.errors) {
      const msg = e.message ?? e.code;
      const mod = /Studio module not implemented: (\S+)/.exec(msg)?.[1];
      if (mod && !this.report.notReady.includes(mod)) this.report.notReady.push(mod);
      const code = mod ? "NOT_IMPLEMENTED" : e.code;
      this.report.errors.push({ code, message: msg, ...(e.format ? { format: FORMAT_EXT[e.format] } : {}), ...(mod ? { module: mod } : {}) });
      this.hlog.error(msg, undefined, { code, ...(e.format ? { format: FORMAT_EXT[e.format] } : {}), jobId: r.jobId });
    }
    for (const f of r.failed) {
      const k = FORMAT_EXT[f];
      if (!this.fmtState.has(k) || this.fmtState.get(k) === "NOT_READY") continue;
      const errs = r.errors.filter((e) => e.format === f);
      const notReady = errs.some((e) => /Studio module not implemented:/.test(e.message ?? ""));
      const unavailable = errs.length > 0 && errs.every((e) => e.code === "PDF_ENGINE_UNAVAILABLE");
      this.fmtState.set(k, notReady ? "NOT_READY" : unavailable ? "UNAVAILABLE" : "FAILED");
    }
    this.pureLog = r.log;
  }
}

/** Modul stub di rantai galat (`StudioNotImplemented`, juga bila dibungkus). */
export function notImplementedModule(err: unknown): string | undefined {
  let cur: unknown = err;
  for (let depth = 0; depth < 6 && cur; depth++) {
    if (cur instanceof StudioNotImplemented) return cur.moduleId;
    if (cur instanceof Error) {
      if (cur.name === "StudioNotImplemented" && "moduleId" in cur) return String((cur as { moduleId: unknown }).moduleId);
      const m = /Studio module not implemented: (\S+)/.exec(cur.message);
      if (m) return m[1];
      cur = (cur as { cause?: unknown }).cause;
    } else break;
  }
  return undefined;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Jenis masukan dari isi JSON (atau id simbol langsung). */
export function detectKind(data: unknown): { kind: InputKind; schema: string | null } | null {
  if (typeof data === "string") return SYMBOL_ID_RE.test(data) ? { kind: "symbol", schema: null } : null;
  if (!isRecord(data)) return null;
  const s = typeof data.$schema === "string" ? data.$schema : null;
  if (s === "studio.doc/v1") return { kind: "doc", schema: s };
  if (s === "studio.doc/v2") return { kind: "docV2", schema: s };
  if (s === "studio.chapter/v2") return { kind: "chapterV2", schema: s };
  if (s === "studio.chart/v1") return { kind: "chart", schema: s };
  if (s === "studio.diagram/v1") return { kind: "diagram", schema: s };
  if (s === "studio.image/v1") return { kind: "image", schema: s };
  if (s === null && (typeof data.id === "string" || typeof data.symbol === "string" || typeof data.sheet === "string" || data.sheet === true)) {
    return { kind: "symbol", schema: null };
  }
  return null;
}

function readInput(input: string): { data: unknown; sha256: string | null; abs: string; baseDir: string } {
  const abs = path.resolve(input);
  if (!existsSync(abs)) {
    if (SYMBOL_ID_RE.test(input)) return { data: input, sha256: null, abs: input, baseDir: process.cwd() };
    throw new UsageError(`berkas masukan tidak ada: ${input}`, "FILE_NOT_FOUND");
  }
  const st = statSync(abs);
  if (!st.isFile()) throw new UsageError(`masukan bukan berkas: ${input}`);
  if (st.size > STUDIO_MAX_JSON_BYTES) throw new UsageError(`masukan ${st.size} byte melebihi batas ${STUDIO_MAX_JSON_BYTES}`, "PAYLOAD_TOO_LARGE");
  const raw = readFileSync(abs);
  let data: unknown;
  try {
    data = JSON.parse(raw.toString("utf8").replace(/^﻿/, ""));
  } catch (err) {
    throw new UsageError(`masukan bukan JSON sah: ${errMessage(err)}`, "JSON_MALFORMED");
  }
  return { data, sha256: sha256Hex(raw), abs, baseDir: path.dirname(abs) };
}

function writeOut(st: RenderState, dir: string, name: string, data: Uint8Array | string, entry: Omit<RenderFileEntry, "path" | "sha256" | "bytes">): void {
  mkdirSync(dir, { recursive: true });
  const abs = path.join(dir, name);
  const bytes = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  writeFileSync(abs, bytes);
  st.report.files.push({ ...entry, path: abs, sha256: sha256Hex(bytes), bytes: bytes.length });
}

function safeName(build: () => string, fallback: string): string {
  try {
    return build();
  } catch {
    return fallback;
  }
}

/** Format diminta (huruf kecil/besar bebas); kosong = default jenis; format tak sah = salah pakai. */
function resolveFormats(kind: InputKind, asked: readonly string[] | undefined, doc?: StudioDocV1): StudioOutputFormat[] {
  const spec = KIND_FORMATS[kind];
  const list = (asked ?? []).flatMap((f) => f.split(",")).map((f) => f.trim()).filter(Boolean);
  if (list.length > 0) {
    const known = normalizeFormats(list);
    const unknown = list.filter((f) => !known.includes(f.toUpperCase() as StudioOutputFormat));
    if (unknown.length > 0) throw new UsageError(`format tidak dikenal: ${unknown.join(", ")}`);
    const bad = known.filter((f) => !spec.allowed.includes(f));
    if (bad.length > 0) throw new UsageError(`format ${bad.map((f) => FORMAT_EXT[f]).join(", ")} tidak sah untuk masukan ${kind} (sah: ${spec.allowed.map((f) => FORMAT_EXT[f]).join(", ")})`);
    return known;
  }
  if (DOC_KINDS.has(kind) && Array.isArray(doc?.outputs) && doc.outputs.length > 0) {
    const fromDoc = normalizeFormats(doc.outputs.map(String));
    if (fromDoc.length > 0) return fromDoc;
  }
  return [...spec.defaults];
}

function newReport(opts: RenderOptions, correlationId: string, logFile: string): RenderReport {
  return {
    schema: RENDER_REPORT_SCHEMA,
    tool: "scripts/parity/run/render_cli.ts",
    correlationId,
    startedAt: new Date().toISOString(),
    db: "none",
    input: { path: opts.input, sha256: null, kind: null, schema: null },
    template: null,
    formats: [],
    formatStatus: {},
    files: [],
    lint: null,
    job: { status: "FAILED" },
    errors: [],
    warnings: [],
    notReady: [],
    validation: [],
    renderEnv: null,
    engineLog: { entries: [], dropped: 0 },
    logFile,
    durationMs: 0,
    exitCode: 1,
  };
}

/** Exit kontrak H01: 0 sukses, 1 galat render (lint FAIL tidak), 2 salah pakai, 3 PDF_ENGINE_UNAVAILABLE. */
function finish(st: RenderState): void {
  const r = st.report;
  st.finalizeFormats();
  if (r.job.status === "USAGE") {
    r.exitCode = 2;
    return;
  }
  const states = Object.values(r.formatStatus);
  const okCount = states.filter((s) => s === "OK").length;
  const hardErrors = r.errors.filter((e) => e.code !== "PDF_ENGINE_UNAVAILABLE");
  if (r.notReady.length > 0) r.job = { status: "NOT_READY", errorCode: "NOT_IMPLEMENTED" };
  else if (r.errors.length === 0) r.job = { status: "SUCCEEDED" };
  else r.job = { status: okCount > 0 ? "PARTIAL" : "FAILED", errorCode: (hardErrors[0] ?? r.errors[0]).code };
  if (r.job.status === "SUCCEEDED") r.exitCode = 0;
  else if (hardErrors.length === 0 && r.notReady.length === 0) r.exitCode = 3;
  else r.exitCode = 1;
}

/**
 * Render satu masukan ke `outDir`; selalu menulis `render_report.json` dan
 * mengembalikan laporannya (tidak melempar, kecuali galat penulisan laporan).
 */
export async function renderToDir(opts: RenderOptions): Promise<RenderReport> {
  const t0 = Date.now();
  const correlationId = opts.correlationId ?? `render-${randomUUID()}`;
  const outDir = path.resolve(opts.outDir);
  const logFile = path.join(outDir, "render_log.jsonl");
  const hlog = new HarnessLog(logFile, RENDER_SOURCE, correlationId);
  const log = new JobLog(correlationId);
  const st = new RenderState(newReport(opts, correlationId, logFile), log, hlog);
  installRenderLogSinks();
  registerJobLog(log);
  try {
    mkdirSync(outDir, { recursive: true });
    const inp = readInput(opts.input);
    st.report.input.path = inp.abs;
    st.report.input.sha256 = inp.sha256;
    const det = detectKind(inp.data);
    if (!det) {
      throw new UsageError(
        "jenis masukan tidak dikenal: butuh $schema studio.doc/v1, studio.doc/v2, studio.chapter/v2, studio.chart/v1, studio.diagram/v1, studio.image/v1, atau simbol {id|sheet}",
      );
    }
    st.report.input.kind = det.kind;
    st.report.input.schema = det.schema;
    const scope = opts.scope ?? { kind: "DOCUMENT" };
    const isDoc = DOC_KINDS.has(det.kind);
    if (!isDoc && scope.kind !== "DOCUMENT") throw new UsageError(`--scope ${formatScope(scope)} hanya untuk dokumen (masukan: ${det.kind})`);
    if (opts.base && det.kind !== "chapterV2") throw new UsageError("--base hanya untuk masukan studio.chapter/v2");
    if (isDoc) st.report.scope = { kind: scope.kind, ...(scope.kind !== "DOCUMENT" ? { key: scope.key } : {}), draft: scope.kind !== "DOCUMENT" };
    if (det.schema && opts.validate !== false) assertSchema(st, det.schema, inp.data, "masukan");
    const doc = det.kind === "doc" ? (inp.data as StudioDocV1) : undefined;
    st.setFormats(resolveFormats(det.kind, opts.formats, doc));
    hlog.info("render started", { input: inp.abs, kind: det.kind, formats: st.report.formats, scope: formatScope(scope) });

    const needTemplate = isDoc || det.kind === "chart";
    let tpl: LoadedTemplate | undefined;
    if (needTemplate || opts.template) {
      tpl = det.kind === "docV2" || det.kind === "chapterV2" ? await loadTemplateAny(opts.template, opts.repoRoot, opts.withCanonicalAssets === true) : await loadTemplate(opts.template, opts.repoRoot, opts.withCanonicalAssets === true);
      st.report.template = {
        source: tpl.source,
        templateId: tpl.template.templateId,
        versionId: tpl.template.versionId,
        droppedDerived: tpl.droppedDerived,
        ignoredFields: tpl.ignoredFields,
      };
    }

    if (det.kind === "doc" && doc && tpl) await renderDocument(st, doc, tpl.template, inp.baseDir, outDir, opts, scope);
    else if ((det.kind === "docV2" || det.kind === "chapterV2") && tpl) await renderDocumentV2(st, det.kind, inp.data, inp.sha256, tpl, outDir, opts, scope);
    else await renderFigure(st, det.kind, inp.data, tpl?.template, outDir, [inp.baseDir, opts.repoRoot]);
  } catch (err) {
    if (err instanceof UsageError) {
      st.report.job = { status: "USAGE", errorCode: err.code };
      st.report.errors.push({ code: err.code, message: err.message });
      hlog.error(`usage: ${err.message}`, err, { code: err.code });
    } else {
      st.fail(err, "RENDER_FAILED", "render aborted", [...(KIND_FORMATS[st.report.input.kind ?? "doc"].allowed)]);
    }
  } finally {
    if (!opts.keepBrowser) {
      try {
        await closeBrowser();
      } catch (err) {
        hlog.warn("browser close failed", { error: errMessage(err) });
      }
    }
    unregisterJobLog(log);
  }
  finish(st);
  const cliLog = log.snapshot();
  st.report.engineLog = st.pureLog
    ? { entries: [...cliLog.entries, ...st.pureLog.entries], dropped: cliLog.dropped + st.pureLog.dropped }
    : cliLog;
  st.report.durationMs = Date.now() - t0;
  hlog.info("render finished", { status: st.report.job.status, exitCode: st.report.exitCode, durationMs: st.report.durationMs });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "render_report.json"), `${JSON.stringify(st.report, null, 1)}\n`, "utf8");
  return st.report;
}

// ── Dokumen ────────────────────────────────────────────────────────────────

/** Validasi ajv kontrak (v1/v2); isu = salah pakai SCHEMA_INVALID (seperti ingest 400). */
function assertSchema(st: RenderState, schemaId: string, data: unknown, what: string): void {
  const issues = validateSchema(schemaId, data);
  if (issues.length > 0) {
    st.report.validation = issues.slice(0, 200);
    throw new UsageError(`${what} tidak lolos skema ${schemaId}: ${issues.length} isu (lihat validation)`, "SCHEMA_INVALID");
  }
}

function inlineAssets(st: RenderState, doc: StudioDocV1, tpl: ResolvedTemplate, baseDir: string, opts: RenderOptions): StudioDocV1 {
  const clone = structuredClone(doc);
  if (!isRecord(clone.assets) || Object.keys(clone.assets).length === 0) return clone;
  const sources: IngestAssetSource[] = [];
  const indexPath = opts.assetIndex ? path.resolve(opts.assetIndex) : path.join(baseDir, "figures", "index.json");
  if (opts.assetIndex || existsSync(indexPath)) {
    try {
      sources.push(...loadAssetIndex(indexPath));
      st.log.info("asset index loaded", { code: "ASSET_INDEX", context: { indexPath, sources: sources.length } });
    } catch (err) {
      st.warn(`indeks aset tidak terbaca: ${indexPath}: ${errMessage(err)}`);
    }
  }
  for (const [key, ref] of Object.entries(clone.assets)) {
    if (typeof ref.path === "string" && ref.path !== "") {
      const abs = path.resolve(baseDir, ref.path);
      if (existsSync(abs)) sources.push({ key, sha256: ref.sha256?.toLowerCase(), absPath: abs });
    }
  }
  const res = resolveDocAssets(clone, tpl, sources, "");
  for (const i of res.issues) st.warn(`aset: ${i.pointer} ${i.message}`);
  for (const [key, a] of res.assets) {
    const ref = clone.assets[key];
    if (!ref) continue;
    const next = { ...ref, sha256: a.sha256, dataBase64: Buffer.from(a.bytes).toString("base64") };
    delete next.path;
    clone.assets[key] = next;
  }
  return clone;
}

async function renderDocument(st: RenderState, input: StudioDocV1, baseTpl: ResolvedTemplate, baseDir: string, outDir: string, opts: RenderOptions, scope: RenderScope): Promise<void> {
  const ov = applyDocOverrides(baseTpl, input);
  for (const i of ov.issues) st.warn(`override dokumen: ${i.pointer} ${i.message}`);
  const tpl = ov.tpl;
  const doc = inlineAssets(st, input, tpl, baseDir, opts);
  let snapshot: NormDocSnapshot;
  try {
    snapshot = normalize(doc, tpl);
  } catch (err) {
    // Struktur dokumen tidak konsisten (ingest akan menolak 400) = masukan tidak sah, bukan galat render.
    if (errCode(err, "") === "SCHEMA_INVALID") {
      const details = (err as { details?: unknown }).details;
      if (Array.isArray(details)) st.report.validation = (details as ValidationIssue[]).slice(0, 200);
      throw new UsageError(`dokumen tidak dapat dinormalisasi: ${errMessage(err)} (lihat validation)`, "SCHEMA_INVALID");
    }
    throw err;
  }
  await renderSnapshotToDir(st, snapshot, tpl, outDir, scope, {});
}

/**
 * Snapshot (v1/v2) -> lingkup -> `renderSnapshot` (IP-43a) -> berkas di `outDir`
 * (+ `figur/`). Override dokumen sudah diterapkan pemanggil (`applyDocOverrides: false`).
 */
async function renderSnapshotToDir(
  st: RenderState,
  full: AnyNormSnapshot,
  tpl: ResolvedTemplate,
  outDir: string,
  scope: RenderScope,
  extra: { assetBytes?: ReadonlyMap<string, Uint8Array>; slots?: ReadonlyMap<string, ResolvedSlot>; tier?: StudioTier },
): Promise<void> {
  const docFormats: StudioOutputFormat[] = (["DOCX", "PDF", "HTML", "SVG", "PNG"] as const).filter((f) => st.wants(f));
  let snapshot: AnyNormSnapshot = full;
  let draft = false;
  if (scope.kind !== "DOCUMENT") {
    try {
      const scoped = applyRenderScope(full, scope);
      snapshot = scoped.snapshot;
      draft = scoped.draft;
      if (st.report.scope) st.report.scope = { ...st.report.scope, draft, ...(scoped.placeholderSlots.length > 0 ? { placeholderSlots: scoped.placeholderSlots } : {}) };
      st.log.info(`render scope ${formatScope(scope)}: ${snapshot.units.length} unit, ${snapshot.blocks.length} blok`, {
        code: "RENDER_SCOPE_APPLIED",
        context: { scope: formatScope(scope), units: snapshot.units.map((u) => u.key), placeholderSlots: scoped.placeholderSlots },
      });
    } catch (err) {
      // ADDRESS_NOT_FOUND (404) / SLOT_UNKNOWN (422) / SCHEMA_INVALID = lingkup salah = salah pakai.
      const code = errCode(err, "SCHEMA_INVALID");
      const details = (err as { details?: unknown }).details;
      throw new UsageError(`lingkup ${formatScope(scope)} tidak dapat diterapkan: ${errMessage(err)}${details ? ` ${JSON.stringify(details)}` : ""}`, code);
    }
  }

  const v2 = snapshot.schema === "studio.norm/v2";
  const jobId = `cli-${randomUUID()}`;
  const result = await renderSnapshot(snapshot as NormDocSnapshot, tpl, {
    formats: docFormats,
    applyDocOverrides: false,
    // Snapshot v2 dibentuk compose (SR-08); `asSnapshot` layanan baru menerima v1 sampai delta §15.1 SR-15.
    validateSnapshot: !v2,
    jobId,
    measureLayout: true,
    // Sama dengan layanan (`services/render/scope.ts` runScopeJob): nilai efektif per slot + tier dokumen v2.
    ...(extra.slots ? { slots: extra.slots } : {}),
    ...(extra.tier ? { tier: extra.tier } : {}),
    readiness: async () => {
      const rd = await checkRenderEnvReadiness();
      st.report.renderEnv = { ready: rd.ready, errors: rd.errors, sofficeVersion: rd.soffice.version };
      return rd;
    },
    extendContext: (ctx: RenderContext): RenderContext => {
      const assetBytes = extra.assetBytes;
      return {
        ...ctx,
        ...(scope.kind !== "DOCUMENT" ? { scope, draft } : {}),
        ...(assetBytes && assetBytes.size > 0 ? { assetBytes: (sha: string, key?: string) => assetBytes.get(String(sha).toLowerCase()) ?? ctx.assetBytes?.(sha, key) } : {}),
      };
    },
  });
  st.report.orchestrator = { jobId: result.jobId, status: result.status, compositeCharts: result.compositeCharts, durationMs: result.durationMs };
  st.absorbPure(result);
  st.report.lint = result.lint ?? null;
  let figures = 0;
  for (const f of result.files) {
    const ext = FORMAT_EXT[f.format];
    if (f.role === "PRIMARY") {
      writeOut(st, outDir, f.fileName, f.data, { format: ext, role: "primary" });
    } else {
      figures++;
      writeOut(st, path.join(outDir, "figur"), f.fileName, f.data, { format: ext, role: "figure", ...(f.figureLabel ? { label: f.figureLabel } : {}), ...(f.sheet ? { sheet: f.sheet } : {}) });
    }
  }
  if ((st.wants("SVG") || st.wants("PNG")) && figures === 0) st.log.info("no figures in document; SVG/PNG produce no files", { code: "NO_FIGURES" });
}

// ── Dokumen v2 (SR-33; FIX-C impor statis + nilai efektif per slot) ─────────

/** Templat v2: kerangka kanonik SR-06 + lapis resolusi slot (preset <- templat), setara baris DB layanan. */
interface TemplateV2Extras {
  skeletonV2?: { skeleton: StudioSkeletonV1; skeletonSha256: string };
  layers?: SlotParamLayers;
}

/** Templat untuk masukan v2: berkas `studio.template/v2` (SR-07), selain itu profil v1 / slug luring / kanonik. */
async function loadTemplateAny(arg: string | undefined, repoRoot: string, withCanonicalAssets: boolean): Promise<LoadedTemplate & TemplateV2Extras> {
  if (arg) {
    const abs = path.resolve(arg);
    if (existsSync(abs) && statSync(abs).isFile()) {
      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(abs, "utf8").replace(/^﻿/, ""));
      } catch (err) {
        throw new UsageError(`templat bukan JSON sah: ${errMessage(err)}`, "JSON_MALFORMED");
      }
      if (isRecord(raw) && (raw.$schema === TEMPLATE_V2_SCHEMA || raw.schema === TEMPLATE_V2_SCHEMA)) {
        const r = await loadResolvedTemplateV2File(abs, { repoRoot });
        // Lapis sama dengan `loadLayers` layanan (repository.ts): preset = override profil preset
        // (kanonik = {}), templat = esensial ∪ lanjutan tanpa kelas T (seperti yang dipakai loader).
        const preset = r.preset.file ? (await readTemplateProfileFile(r.preset.file)).profile.overrides : {};
        const template = splitDerivedOverrides(templateLayerOf(r.definition)).kept;
        return {
          template: r.template,
          source: `file:${abs}`,
          droppedDerived: r.droppedDerived,
          ignoredFields: r.ignoredFields,
          skeletonV2: { skeleton: r.skeleton, skeletonSha256: r.skeletonSha256 },
          layers: { preset, template },
        };
      }
    }
  }
  return loadTemplate(arg, repoRoot, withCanonicalAssets);
}

/** Kerangka compose: kerangka templat v2 eksplisit, selain itu kerangka implisit dari `sectionPlan` (§6.3). */
function skeletonFor(tpl: LoadedTemplate & TemplateV2Extras, tier: StudioTier): SkeletonInput {
  const t = tpl.template;
  if (tpl.skeletonV2) return { templateVersionId: t.versionId, ...tpl.skeletonV2, implicit: false };
  const skeleton = implicitSkeleton(t.sectionPlan, tier);
  return { templateVersionId: t.versionId, skeleton, skeletonSha256: skeletonSha256(skeleton), implicit: true };
}

/**
 * Nilai efektif per slot aktif tier, murni (tanpa DB), dengan urutan lapis yang sama
 * dengan `resolveSlotsForVersion` layanan: registri <- preset <- templat <- slot
 * (`presetPins` = kunci preset). Kerangka implisit: slot tanpa parameter = `tpl.params`.
 * Kunci yang tidak dapat diterapkan dicatat (warn `SLOT_PARAM_SKIPPED`), tidak menggagalkan render.
 */
function resolveSlotsPure(st: RenderState, tpl: LoadedTemplate & TemplateV2Extras, skeleton: SkeletonInput, tier: StudioTier): ReadonlyMap<string, ResolvedSlot> {
  const layers = tpl.layers;
  const { slots, issues } = resolveSkeletonSlots(
    { params: tpl.template.params, roleFormats: tpl.template.roleFormats },
    skeleton.skeleton.slots,
    layers ? new Set(Object.keys(layers.preset)) : undefined,
    { ...(layers ? { layers } : {}), tier },
  );
  if (issues.length > 0) {
    st.warn(`kunci parameter slot tidak diterapkan: ${issues.map((i) => `${i.key} (${i.code})`).join(", ")}`, {
      code: "SLOT_PARAM_SKIPPED",
      issues: issues.map((i) => ({ key: i.key, code: i.code, pointer: i.pointer ?? null })),
    });
  }
  return slots;
}

const TIERS: readonly StudioTier[] = ["NOTA", "TERBIT", "SERAH"];

function readV2Base(file: string): StudioDocV2 {
  const abs = path.resolve(file);
  if (!existsSync(abs) || !statSync(abs).isFile()) throw new UsageError(`--base tidak ada: ${file}`, "FILE_NOT_FOUND");
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(abs, "utf8").replace(/^﻿/, ""));
  } catch (err) {
    throw new UsageError(`--base bukan JSON sah: ${errMessage(err)}`, "JSON_MALFORMED");
  }
  if (!isRecord(data) || data.$schema !== "studio.doc/v2") throw new UsageError("--base harus dokumen $schema studio.doc/v2");
  return data as unknown as StudioDocV2;
}

/**
 * Jalur register §15.1: StudioDocV2/StudioChapterV2 + templat -> kerangka +
 * nilai efektif per slot -> dokumen kosong (§7) -> `mergeSubmission` (pid
 * berbenih) -> `composeV2` dengan `slotParams` (draf bila lingkup bukan
 * DOCUMENT) -> `renderSnapshotToDir` (`slots`, `tier`).
 */
async function renderDocumentV2(
  st: RenderState,
  kind: "docV2" | "chapterV2",
  data: unknown,
  inputSha: string | null,
  tpl: LoadedTemplate & TemplateV2Extras,
  outDir: string,
  opts: RenderOptions,
  scope: RenderScope,
): Promise<void> {
  const base = kind === "chapterV2" && opts.base ? readV2Base(opts.base) : undefined;
  if (base && opts.validate !== false) assertSchema(st, "studio.doc/v2", base, "--base");
  const sub = data as StudioDocV2 | StudioChapterV2;
  const chapter = kind === "chapterV2" ? (data as StudioChapterV2) : undefined;
  const head: StudioDocV2 | StudioChapterV2 = base ?? sub;
  const metaIn: DocMetaV2 | undefined = base?.meta ?? sub.meta;
  if (!metaIn?.title) {
    // Sama dengan R12 tanpa dokumen: kiriman bab pertama wajib membawa meta.title (400 META_REQUIRED_FOR_CREATE).
    throw new UsageError("kiriman bab tanpa --base wajib membawa meta.title untuk membuat dokumen", "META_REQUIRED_FOR_CREATE");
  }

  const params = tpl.template.params as ParamMap;
  // Tanggal terbit absen: hari ini (Asia/Jakarta) lewat bawaan layanan; byte-identik per hari (KD-22).
  const meta = resolveMetaDefaults(metaIn, { params, agentId: sub.agentId ?? "render_cli", requester: "render_cli" });
  for (const f of meta.filled) st.log.info(`meta.${f} dari bawaan templat`, { code: "META_DEFAULT", context: { field: f } });
  const tier: StudioTier = TIERS.includes(meta.meta.tier) ? meta.meta.tier : "TERBIT";
  const skeleton = skeletonFor(tpl, tier);
  const slots = resolveSlotsPure(st, tpl, skeleton, tier);
  const slotParams: Record<string, ParamMap> = {};
  for (const [k, s] of slots) slotParams[k] = s.params;
  const pidSeed = opts.pidSeed ?? inputSha ?? "render_cli";
  const pids = seededPidAllocator(pidSeed);

  // Aset base64 kiriman -> assetRef sha256 (C27); byte disediakan ke perakit lewat RenderContext.assetBytes.
  const assetBytes = new Map<string, Uint8Array>();
  const resolveAsset = (key: string, input: AssetInputV2): string => {
    const b64 = (input as { dataBase64?: unknown }).dataBase64;
    if (typeof b64 !== "string" || b64 === "") throw Object.assign(new Error(`aset ${key} tanpa dataBase64`), { code: "ASSET_NOT_FOUND" });
    const bytes = new Uint8Array(Buffer.from(b64, "base64"));
    const sha = createHash("sha256").update(bytes).digest("hex");
    assetBytes.set(sha, bytes);
    return `sha256:${sha}`;
  };

  const tplRef = (head.template ?? chapter?.template) as { slug: string; version?: number } | undefined;
  const docHead = (base ?? (kind === "docV2" ? (sub as StudioDocV2) : undefined)) as StudioDocV2 | undefined;
  const mission = docHead?.mission ?? chapter?.target?.mission;
  const docKey = docHead?.docKey ?? chapter?.target?.docKey;
  // Dokumen kosong revisi 1 (§7, `emptyResolvedDoc` SR-08).
  const empty = emptyResolvedDoc({
    template: { slug: tplRef?.slug ?? tpl.template.templateId, version: tplRef?.version ?? 1 },
    meta: meta.meta,
    ...(mission ? { mission } : {}),
    ...(docKey ? { docKey } : {}),
  });
  const mergeOpts = { skeleton, tier, pids, resolveAsset };
  const scopes: string[] = [];
  let resolved: StudioDocV2Resolved = empty;
  let composed: ComposeResult;
  try {
    for (const s of base ? [base, sub] : [sub]) {
      const m = mergeSubmission(resolved, s, mergeOpts);
      resolved = m.doc;
      scopes.push(...m.scopes);
    }
    // Sama dengan ingest v2 layanan (`services/ingest/v2.ts`): parameter dokumen + nilai efektif per slot.
    composed = composeV2({ source: resolved, skeleton, tier, params, slotParams, draft: scope.kind !== "DOCUMENT" });
  } catch (err) {
    // Galat struktur compose (SLOT_*, CHAPTER_KEY_INVALID, TEMPLATE_MISMATCH, ...) = kiriman tidak sah (API 4xx) = salah pakai.
    const code = errCode(err, "");
    if (code !== "" && !notImplementedModule(err)) {
      const details = (err as { details?: unknown }).details;
      throw new UsageError(`compose v2 menolak kiriman: ${errMessage(err)}${details ? ` ${JSON.stringify(details).slice(0, 2000)}` : ""}`, code);
    }
    throw err;
  }
  st.report.compose = {
    pidSeed,
    snapshotSha256: composed.snapshotSha256,
    skeleton: skeleton.implicit ? "implicit" : "template",
    scopes,
    slots: [...slots.keys()],
    warnings: composed.warnings,
  };
  for (const w of composed.warnings) st.warn(`compose: [${w.code}] ${w.message}${w.address ? ` (${w.address})` : ""}`);
  await renderSnapshotToDir(st, composed.snapshot, tpl.template, outDir, scope, { assetBytes, slots, tier });
}

// ── Figur mandiri ────────────────────────────────────────────────────────

/** Byte aset gambar: dataBase64, atau `path` relatif dir spec / akar repo dengan sha256 wajib cocok. */
function imageBytes(a: StudioImageV1["asset"], dirs: readonly string[]): { base64?: string; bytes?: Uint8Array } {
  if (typeof a.dataBase64 === "string" && a.dataBase64 !== "") return { base64: a.dataBase64 };
  if (typeof a.path === "string" && a.path !== "") {
    for (const d of dirs) {
      const abs = path.resolve(d, a.path);
      if (!existsSync(abs) || !statSync(abs).isFile()) continue;
      const bytes = new Uint8Array(readFileSync(abs));
      if (sha256Hex(bytes) !== String(a.sha256).toLowerCase()) {
        throw Object.assign(new Error(`sha256 isi ${abs} tidak sama dengan terdaftar ${a.sha256}`), { code: "BY_CONSTRUCTION_FAILED" });
      }
      return { bytes };
    }
  }
  throw Object.assign(new Error("aset gambar tanpa dataBase64 dan path tidak ditemukan (relatif dir spec / akar repo)"), { code: "FILE_NOT_FOUND" });
}

async function renderFigure(
  st: RenderState,
  kind: InputKind,
  data: unknown,
  tpl: ResolvedTemplate | undefined,
  outDir: string,
  assetDirs: readonly string[],
): Promise<void> {
  const svgs: SvgResult[] = [];
  const extra: LintIssue[] = [];
  const sheets: Array<{ svg: string; widthMm: number; heightMm: number }> = [];
  let stem = "Figur";
  try {
    if (kind === "chart") {
      const spec = data as StudioChartV1;
      st.report.input.code = spec.kind;
      stem = `${spec.id ?? spec.kind} ${spec.title ?? ""}`.trim();
      // D-155: jalur produksi (`pureChartSvg`) — komposit memakai templat bawaan eksplisit, bukan templat dokumen.
      const r = pureChartSvg(spec, tpl ?? COMPOSITE_CHART_TEMPLATE);
      svgs.push(r);
      sheets.push({ svg: r.svg, widthMm: r.widthMm, heightMm: r.heightMm });
    } else if (kind === "diagram") {
      const spec = data as StudioDiagramV1;
      st.report.input.code = spec.family;
      stem = `${spec.id ?? spec.family} ${spec.title ?? ""}`.trim();
      // D-252: grid turunan templat (lebar sah, blok teks, kisi X); tanpa templat = grid A4 bawaan mesin.
      const r = buildDiagramSvg(spec, { release: false, ...(tpl ? { grid: figureGrid(tpl.params) } : {}) });
      svgs.push(r);
      sheets.push({ svg: r.svg, widthMm: r.widthMm, heightMm: r.heightMm });
      const rep = r.report;
      st.report.figure = {
        engineReport: {
          checks_run: rep.checksRun,
          n_nodes: rep.nNodes,
          n_edges: rep.nEdges,
          n_hops: rep.nHops,
          colour_values: rep.colourValues,
          n_colour: rep.nColour,
          apparatus: rep.apparatus,
          family: rep.family,
        },
      };
    } else if (kind === "symbol") {
      const spec: Record<string, unknown> = typeof data === "string" ? { id: data } : (data as Record<string, unknown>);
      const sheet = spec.sheet === true ? spec.dialect : spec.sheet;
      if (typeof sheet === "string") {
        st.report.input.code = `sheet:${sheet}`;
        stem = `Lembar simbol ${sheet}`;
        // Jalur layanan (`symbolSheetFigures`): kolom hanya bila spec membawanya (absen = bawaan mesin, kolom
        // yang muat), `fit` dari parameter templat `symbol.sheet.fit` (D-147). Lebar = lebar figur TURUNAN
        // templat (`figureWidthMm("symbolSheet")` = kelas symbolSheet.widthClass, sama dengan compose; FIX-A2 N4).
        // Tanpa --template: parameter kosong = bawaan registri mesin simbol (grid.fullSpanMm, fit false).
        const content: Record<string, unknown> = { dialect: sheet };
        if (typeof spec.cols === "number") content.cols = spec.cols;
        if (tpl) content.widthMm = figureWidthMm("symbolSheet", tpl.params);
        sheets.push(...symbolSheetFigures(content, tpl ?? { params: {} }));
      } else {
        const id = String(spec.id ?? spec.symbol ?? "");
        st.report.input.code = id;
        stem = `Simbol ${id.replace(":", " ")}`;
        const svg = symbolSvg(id);
        sheets.push({ svg, ...svgSizeMm(svg, 24) });
        st.report.figure = { ports: Object.fromEntries(symbolPortsMm(id).map((p) => [p.name, [p.x, p.y] as [number, number]])) };
      }
    } else if (kind === "image") {
      const spec = data as StudioImageV1;
      stem = `${spec.id ?? "Gambar"} ${spec.title ?? ""}`.trim();
      const img = decodeImage(imageBytes(spec.asset, assetDirs));
      extra.push(pxGuard(img.widthPx, spec.widthMm, spec.dpiMin ?? 150) ?? { checkId: "DATUM-39", status: "PASS" });
      if (img.mime !== "image/png") throw Object.assign(new Error(`aset ${img.mime}; keluaran PNG butuh aset PNG (tanpa transkode)`), { code: "ASSET_TYPE_UNSUPPORTED" });
      writeOut(st, outDir, safeName(() => datumPlainName(stem, "png"), "gambar.png"), img.bytes, { format: "png", role: "primary" });
    }
  } catch (err) {
    st.fail(err, kind === "chart" ? "CHART_RENDER_FAILED" : "BY_CONSTRUCTION_FAILED", `${kind} build failed`, [...KIND_FORMATS[kind].allowed]);
  }

  const nameFor = (n: number, ext: string): string =>
    safeName(() => datumPlainName(n === 1 ? stem : `${stem} lembar ${n}`, ext), n === 1 ? `figur.${ext}` : `figur-${n}.${ext}`);
  for (let i = 0; i < sheets.length; i++) {
    const s = sheets[i];
    const n = i + 1;
    if (st.wants("SVG")) writeOut(st, outDir, nameFor(n, "svg"), s.svg, { format: "svg", role: "primary", sheet: n });
    if (st.wants("PNG") && st.ok("PNG")) {
      try {
        const png = await rasterizeSvg(s.svg, { widthMm: s.widthMm, heightMm: s.heightMm, dpi: 300 });
        writeOut(st, outDir, nameFor(n, "png"), png, { format: "png", role: "primary", sheet: n });
      } catch (err) {
        st.fail(err, "BY_CONSTRUCTION_FAILED", `png rasterization failed (sheet ${n})`, ["PNG"]);
      }
    }
  }
  st.report.lint = lintArtifact({ svgs, extra, log: st.log });
}

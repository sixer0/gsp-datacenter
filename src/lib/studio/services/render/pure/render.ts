/**
 * Orkestrator render murni tanpa DB (IP-43a; permintaan FIX-5, D-129, D-134).
 *
 * `renderSnapshot(snapshot, template, opts)` menjalankan urutan render dokumen
 * yang sama dengan `runRevisionJob` (01_specs.md §8.2) dengan memanggil fungsi
 * layanan yang ada, bukan menyalinnya:
 *
 *   templat -> override dokumen (`templateForDoc`) -> aset (`preloadAssetBytes`)
 *   -> figur (`buildFigures`, PNG 300 dpi) -> assemble (DOCX `assembleDocx`,
 *   PDF = DOCX -> soffice `convertDocxToPdf` (D-15), HTML `assembleHtml`)
 *   -> lint (`lintAfterRender`, tidak menahan berkas).
 *
 * Tidak ada Prisma, penyimpanan, atau baris job DB: keluaran berupa byte berkas
 * di memori + nama berkas DATUM yang disarankan; pemanggil (SR-15 layanan,
 * SR-33 CLI, runner benchmark) menyimpan sendiri. Job memakai
 * `DetachedRenderJob` (`persist` no-op) kecuali pemanggil memberi job miliknya.
 * Chart komposit dirender dengan templat bawaan eksplisit
 * (`COMPOSITE_CHART_TEMPLATE`, lihat `./chart`).
 *
 * Galat: tidak melempar untuk galat render; setiap galat tercatat di
 * `result.errors` (kode kontrak) dan di log job terstruktur (`result.log`),
 * format yang gagal di `result.failed`. Yang dilempar sebelum job dimulai hanya
 * snapshot tak sah (`SCHEMA_INVALID`) dan lingkup tak sah (`ADDRESS_NOT_FOUND`,
 * `SLOT_UNKNOWN`).
 *
 * SR-15 (KC-10, register 03 §15.1): snapshot `studio.norm/v1` atau
 * `studio.norm/v2`; opsi `scope` (DOCUMENT/CHAPTER/SLOT, filter `./scope`),
 * `draft` (bawaan: lingkup bukan DOCUMENT), `slots` (nilai efektif per slot ke
 * `RenderContext.slots`), `pidSeed` (jalur compose murni SR-33; dicatat di log).
 * Render lingkup memakai nama berkas DATUM + akhiran lingkup (` Bab 3`).
 */
import type {
  AnyNormSnapshot,
  Inline,
  LayoutMetrics,
  LintReport,
  NormDocSnapshot,
  RenderContext,
  RenderScope,
  ResolvedSlot,
  RenderJobError,
  ResolvedTemplate,
  StudioChartV1,
  StudioOutputFormat,
  StudioRenderJobStatus,
  StudioTier,
} from "../../../contract";
import { registerForSnapshot } from "../../../engine/bind";
import { measureLayout } from "../../../engine/browser";
import { assembleDocx } from "../../../engine/docx/assemble";
import { figureStoreKeys, sheetKey } from "../../../engine/docx/figures";
import { assembleHtml } from "../../../engine/html/assemble";
import { checkRenderEnvReadiness, convertDocxToPdf } from "../../../engine/soffice";
import type { SofficeLogEntry } from "../../../engine/soffice";
import { datumFileNameByForm } from "../../storage/paths";
import {
  asAnySnapshot,
  engineSnapshot,
  errorCodeOf,
  errorMessageOf,
  htmlErrorCodeOf,
  noteChromium,
  preloadAssetBytes,
  templateForDoc,
  type AssetRowLookup,
} from "../common";
import { buildFigures, type FigureBuild } from "../figures";
import { finalStatus, withJobTimeout, type JobEngineInfo, type RenderJobHandle } from "../job";
import { registerJobLog, unregisterJobLog, type JobLogEntry } from "../joblog";
import { lintAfterRender } from "../lint";
import { draftFileName, draftScopeSuffix, FORMAT_EXT, FORMAT_MIME, figureFileName, inlineText, normalizeFormats, type DraftScopeLayout } from "../naming";
import { isCompositeChart } from "./chart";
import { createDetachedJob, InlineSpecReader, type InlineArtifactSpec } from "./job";
import { applyRenderScope, snapshotAssetShas } from "./scope";

/** R-78 (C18 / TR-07): bentuk nama berkas utama (`judulNomorRevisi` bawaan | `judulTanggalIso`). */
const PARAM_NAMING_FILE_FORM = "naming.file.form";

/** Bawaan bila format tidak diminta dan `doc.outputs` kosong (sama dengan layanan revisi). */
export const PURE_DEFAULT_DOC_FORMATS: readonly StudioOutputFormat[] = ["DOCX", "PDF", "HTML"];
const FIGURE_BLOCK_TYPES: ReadonlySet<string> = new Set(["chart", "diagram", "symbolSheet"]);

type RenderEnvReadiness = Awaited<ReturnType<typeof checkRenderEnvReadiness>>;

export interface PureRenderOptions {
  /** Format diminta; kosong -> `doc.outputs` snapshot, lalu DOCX+PDF+HTML. */
  formats?: readonly StudioOutputFormat[];
  /** Tier lint/rilis; bawaan `doc.meta.tier` snapshot, lalu NOTA. Layanan memberi tier baris dokumen. */
  tier?: StudioTier;
  /** Terapkan `doc.overrides` di atas `template` (bawaan true). false bila pemanggil sudah menerapkannya. */
  applyDocOverrides?: boolean;
  /** Validasi bentuk snapshot lewat `asSnapshot` layanan (bawaan true). */
  validateSnapshot?: boolean;
  /**
   * Job milik pemanggil (mis. job DB dari `createRenderJob` layanan). Orkestrator
   * tidak pernah memanggil `persist`/`setStatus`; tanpa ini dipakai job di memori.
   */
  job?: RenderJobHandle;
  /** Id job di memori (correlationId log); diabaikan bila `job` diberikan. */
  jobId?: string;
  /** Spec untuk blok yang merujuk `{ artifactId }` (pengganti baris StudioArtifact). */
  artifacts?: ReadonlyMap<string, InlineArtifactSpec> | Readonly<Record<string, InlineArtifactSpec>>;
  /** Kesiapan render-env: nilai jadi atau fungsi. Bawaan: `checkRenderEnvReadiness` hanya bila PDF diminta. */
  readiness?: RenderEnvReadiness | (() => Promise<RenderEnvReadiness>);
  /** Penamaan DATUM (bawaan dari `doc.meta`: title, docNumber, rev). */
  naming?: { title?: string; docNumber?: string; rev?: string };
  /** Ukur tata letak HTML untuk lint render (bawaan true; butuh Chromium). */
  measureLayout?: boolean;
  /** Batas waktu job (bawaan STUDIO_RENDER_JOB_TIMEOUT_MS layanan). */
  timeoutMs?: number;
  /** Daftarkan log job ke sink soffice/browser (bawaan: true untuk job di memori). */
  registerLog?: boolean;
  /** Peristiwa soffice ber-korelasi job ini (mis. SOFFICE_QUEUED -> pemanggil menyetel status QUEUED). */
  onSofficeEvent?: (e: SofficeLogEntry) => void;
  /** Perluasan RenderContext oleh pemanggil (mis. nilai efektif slot SR-15). */
  extendContext?: (ctx: RenderContext) => RenderContext;
  /** Lingkup render (bawaan DOCUMENT). CHAPTER/SLOT memfilter unit; penomoran tetap seluruh dokumen. */
  scope?: RenderScope;
  /** Render draf (bawaan `scope.kind !== "DOCUMENT"`); perakit memasang `render.draft.marker`. */
  draft?: boolean;
  /** Nilai efektif per slot (`RenderContext.slots`); absen = jalur v1. */
  slots?: ReadonlyMap<string, ResolvedSlot>;
  /** Benih pid jalur compose murni (SR-33). Compose milik pemanggil; di sini hanya dicatat di log job. */
  pidSeed?: string;
  /** Pencari baris aset M13 (D-175); absen = tanpa DB (path eksplisit / jalur datar lama). */
  assetLookup?: AssetRowLookup;
}

export interface PureRenderFile {
  format: StudioOutputFormat;
  role: "PRIMARY" | "FIGURE";
  /** Nama berkas DATUM yang disarankan (penyimpanan memutuskan path akhir). */
  fileName: string;
  mime: string;
  data: Uint8Array | string;
  bytes: number;
  figureLabel?: string;
  sheet?: number;
}

export interface PureRenderResult {
  jobId: string;
  status: StudioRenderJobStatus;
  formats: StudioOutputFormat[];
  files: PureRenderFile[];
  failed: StudioOutputFormat[];
  errors: RenderJobError[];
  lint?: LintReport;
  /** Templat efektif (setelah override dokumen). */
  tpl: ResolvedTemplate;
  tier: StudioTier;
  engine: JobEngineInfo;
  /** Jumlah chart komposit yang dirender dengan templat bawaan eksplisit. */
  compositeCharts: number;
  /** Lingkup yang dirender. */
  scope: RenderScope;
  draft: boolean;
  /** Tata letak berkas draf (direktori `bab-<k>`/`lamp-<k>`/`slot-<slotKey>` + akhiran nama); absen untuk DOCUMENT. */
  scopeLayout?: DraftScopeLayout;
  /** Slot wajib kosong yang dirender sebagai placeholder. */
  placeholderSlots: string[];
  log: { entries: JobLogEntry[]; dropped: number };
  durationMs: number;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function byteLength(data: Uint8Array | string): number {
  return typeof data === "string" ? Buffer.byteLength(data, "utf8") : data.length;
}

/** Format diminta; kosong -> `doc.outputs`, lalu bawaan. */
export function pureRequestedFormats(formats: readonly StudioOutputFormat[] | undefined, snapshot: AnyNormSnapshot): StudioOutputFormat[] {
  const asked = normalizeFormats(formats ?? []);
  if (asked.length > 0) return asked;
  const outputs = (snapshot.doc as { outputs?: unknown }).outputs;
  const fromDoc = Array.isArray(outputs) ? normalizeFormats(outputs.map(String)) : [];
  return fromDoc.length > 0 ? fromDoc : [...PURE_DEFAULT_DOC_FORMATS];
}

function countCompositeCharts(snapshot: NormDocSnapshot, artifacts: PureRenderOptions["artifacts"]): number {
  const lookup = (id: string): InlineArtifactSpec | undefined =>
    artifacts instanceof Map ? artifacts.get(id) : (artifacts as Readonly<Record<string, InlineArtifactSpec>> | undefined)?.[id];
  let n = 0;
  for (const b of snapshot.blocks) {
    if (b.type !== "chart" || !isRecord(b.content)) continue;
    const spec = b.content.spec;
    if (!isRecord(spec)) continue;
    const resolved = typeof spec.artifactId === "string" && !("$schema" in spec) ? lookup(spec.artifactId)?.spec : spec;
    if (isRecord(resolved) && isCompositeChart(resolved as unknown as StudioChartV1)) n++;
  }
  return n;
}

/**
 * Render snapshot dokumen + templat ke berkas (DOCX/PDF/HTML, figur SVG/PNG)
 * tanpa DB. Melempar hanya `SCHEMA_INVALID` untuk snapshot tak sah.
 */
export async function renderSnapshot(snapshotIn: AnyNormSnapshot, template: ResolvedTemplate, opts: PureRenderOptions = {}): Promise<PureRenderResult> {
  const t0 = Date.now();
  const valid = opts.validateSnapshot === false ? snapshotIn : asAnySnapshot(snapshotIn);
  // Lingkup diterapkan sebelum job: kunci bab/slot tak sah dilempar (404/422) tanpa job.
  const scoped = applyRenderScope(valid, opts.scope);
  const draft = opts.draft ?? scoped.draft;
  const snapshot = engineSnapshot(scoped.snapshot);
  const assetShas = snapshotAssetShas(scoped.snapshot);
  const fmts = pureRequestedFormats(opts.formats, snapshot);
  const job = opts.job ?? createDetachedJob(fmts, opts.jobId);
  const registerLog = opts.registerLog ?? opts.job === undefined;
  const tier = (opts.tier ?? snapshot.doc.meta.tier ?? "NOTA") as StudioTier;
  const files: PureRenderFile[] = [];
  const failed = new Set<StudioOutputFormat>();
  const state: { tpl: ResolvedTemplate; lint?: LintReport; composites: number } = { tpl: template, composites: 0 };

  if (registerLog) registerJobLog(job.log);
  job.startedAt = new Date();
  job.status = "RUNNING";
  job.log.info("pure render started", {
    code: "PURE_RENDER_STARTED",
    context: {
      formats: fmts,
      tier,
      schema: valid.schema,
      scope: scoped.scope,
      draft,
      units: snapshot.units.length,
      ...(scoped.placeholderSlots.length ? { placeholderSlots: scoped.placeholderSlots } : {}),
      ...(opts.slots ? { slots: opts.slots.size } : {}),
      ...(opts.pidSeed !== undefined ? { pidSeed: opts.pidSeed } : {}),
    },
  });
  const run: RunScope = { scope: scoped.scope, draft, layout: scoped.layout, assetShas };
  try {
    await withJobTimeout(job, () => runPure(job, snapshot, template, tier, fmts, opts, run, files, failed, state), opts.timeoutMs);
  } catch (err) {
    const code = errorCodeOf(err, "RENDER_FAILED");
    job.addError(code, `render job failed: ${errorMessageOf(err)}`, undefined, err);
    for (const f of fmts) failed.add(f);
  } finally {
    job.log.listener = {};
    if (registerLog) unregisterJobLog(job.log);
  }

  const succeeded = fmts.filter((f) => !failed.has(f)).length;
  const status = finalStatus(fmts.length, succeeded, job.errors.length);
  job.status = status;
  job.log.info(`pure render ${status.toLowerCase()}`, { code: `RENDER_JOB_${status}`, context: { errors: job.errors.length, files: files.length } });
  return {
    jobId: job.id,
    status,
    formats: fmts,
    files: files.filter((f) => !failed.has(f.format) || f.role === "FIGURE"),
    failed: fmts.filter((f) => failed.has(f)),
    errors: [...job.errors],
    ...(state.lint ? { lint: state.lint } : {}),
    tpl: state.tpl,
    tier,
    engine: { ...job.engine },
    compositeCharts: state.composites,
    scope: scoped.scope,
    draft,
    ...(scoped.layout ? { scopeLayout: scoped.layout } : {}),
    placeholderSlots: scoped.placeholderSlots,
    log: job.log.snapshot(),
    durationMs: Date.now() - t0,
  };
}

async function readinessFor(opts: PureRenderOptions): Promise<RenderEnvReadiness> {
  const r = opts.readiness;
  if (typeof r === "function") return r();
  return r ?? checkRenderEnvReadiness();
}

/** Lingkup yang sudah diselesaikan untuk satu run. */
interface RunScope {
  scope: RenderScope;
  draft: boolean;
  layout?: DraftScopeLayout;
  assetShas: string[];
}

async function runPure(
  job: RenderJobHandle,
  snapshot: NormDocSnapshot,
  template: ResolvedTemplate,
  tier: StudioTier,
  fmts: StudioOutputFormat[],
  opts: PureRenderOptions,
  run: RunScope,
  files: PureRenderFile[],
  failed: Set<StudioOutputFormat>,
  state: { tpl: ResolvedTemplate; lint?: LintReport; composites: number },
): Promise<void> {
  const want = new Set(fmts);
  const needPdf = want.has("PDF");
  const needDocx = want.has("DOCX") || needPdf;
  const needHtml = want.has("HTML");

  // 1. Kesiapan render-env (hanya bila PDF diminta atau pemanggil memberinya).
  let pdfReady = false;
  if (needPdf || opts.readiness !== undefined) {
    try {
      const readiness = await readinessFor(opts);
      job.engine.sofficeVersion = readiness.soffice.version ?? undefined;
      job.engine.renderEnvManifestSha256 = readiness.manifestSha256 ?? undefined;
      pdfReady = readiness.ready;
      if (needPdf && !pdfReady) {
        job.addError("PDF_ENGINE_UNAVAILABLE", `render-env not ready: ${readiness.errors.join("; ") || "unknown reason"}`, "PDF");
        failed.add("PDF");
      }
      job.log.info("render-env readiness checked", {
        code: readiness.ready ? "RENDER_ENV_READY" : "RENDER_ENV_NOT_READY",
        context: { checkedAt: readiness.checkedAt, ready: readiness.ready },
      });
    } catch (err) {
      if (needPdf) {
        job.addError("PDF_ENGINE_UNAVAILABLE", `render-env readiness check failed: ${errorMessageOf(err)}`, "PDF", err);
        failed.add("PDF");
      }
    }
  }

  // 2. Templat + override dokumen (parameter render = parameter ingest, D-63).
  const tpl = opts.applyDocOverrides === false ? template : templateForDoc(template, snapshot.doc, job.log);
  state.tpl = tpl;
  const meta = snapshot.doc.meta;
  const fixedDate = meta.issueDate;

  // 3. Figur (SVG -> PNG 300 dpi). Gagal raster = semua format dokumen gagal.
  job.checkAborted("figures");
  state.composites = countCompositeCharts(snapshot, opts.artifacts);
  if (state.composites > 0) {
    job.log.info(`composite charts rendered with the explicit default template: ${state.composites}`, {
      code: "COMPOSITE_DEFAULT_TEMPLATE",
      context: { count: state.composites },
    });
  }
  let figures: FigureBuild | undefined;
  try {
    figures = await buildFigures({ snapshot, tpl, tier, job, reader: new InlineSpecReader(opts.artifacts) });
  } catch (err) {
    job.addError(errorCodeOf(err, "RENDER_FAILED"), `figure assembly failed: ${errorMessageOf(err)}`, undefined, err);
    for (const f of fmts) failed.add(f);
  }
  if (figures && figures.store.entries().length > 0) await noteChromium(job);

  const assetBytes = await preloadAssetBytes(snapshot.doc, job.log, { extraSha256: run.assetShas, lookupRow: opts.assetLookup });
  const base: RenderContext = {
    snapshot,
    tpl,
    register: registerForSnapshot(snapshot),
    fixedDate,
    figures: figures?.store ?? { get: () => undefined },
    log: job.log.renderLog,
    assetBytes,
    scope: run.scope,
    draft: run.draft,
    ...(opts.slots ? { slots: opts.slots } : {}),
  };
  const ctx = opts.extendContext ? opts.extendContext(base) : base;

  const nameFor = (f: StudioOutputFormat): string => {
    const n = opts.naming ?? {};
    try {
      // C18 / TR-07: bentuk dari data templat (R-78 `naming.file.form`); absen = `<Judul> <nomor> Rev<X>`.
      const name = datumFileNameByForm(
        tpl.params[PARAM_NAMING_FILE_FORM],
        { title: n.title ?? meta.title, docNumber: n.docNumber ?? meta.docNumber ?? "", rev: n.rev ?? meta.rev, issueDate: meta.issueDate },
        FORMAT_EXT[f],
      );
      return run.layout ? draftFileName(name, draftScopeSuffix(run.layout)) : name;
    } catch (err) {
      const fallback = `document.${FORMAT_EXT[f]}`;
      job.log.warn(`DATUM file name unavailable, using ${fallback}: ${errorMessageOf(err)}`, { code: "FILE_NAME_FALLBACK", context: { format: f } });
      return fallback;
    }
  };
  const push = (f: StudioOutputFormat, data: Uint8Array | string): void => {
    files.push({ format: f, role: "PRIMARY", fileName: nameFor(f), mime: FORMAT_MIME[f], data, bytes: byteLength(data) });
  };

  // 4a. DOCX (juga sumber PDF).
  let docx: Uint8Array | undefined;
  if (figures && needDocx) {
    job.checkAborted("docx");
    try {
      docx = (await assembleDocx(ctx)).bytes;
      job.log.info("docx assembled", { code: "DOCX_ASSEMBLED", context: { bytes: docx.length } });
    } catch (err) {
      const code = errorCodeOf(err, "RENDER_FAILED");
      if (want.has("DOCX")) {
        job.addError(code, `docx assembly failed: ${errorMessageOf(err)}`, "DOCX", err);
        failed.add("DOCX");
      }
      if (needPdf && !failed.has("PDF")) {
        job.addError(code, `pdf skipped: docx assembly failed: ${errorMessageOf(err)}`, "PDF", err);
        failed.add("PDF");
      }
    }
  }
  if (docx && want.has("DOCX")) push("DOCX", docx);

  // 4b. PDF = DOCX -> soffice (D-15; tidak pernah lewat Chromium, KT-17).
  if (needPdf && pdfReady && docx && !failed.has("PDF")) {
    job.checkAborted("pdf");
    if (opts.onSofficeEvent) job.log.listener = { onSofficeEvent: opts.onSofficeEvent };
    try {
      const fileName = nameFor("PDF").replace(/\.pdf$/i, "");
      const r = await convertDocxToPdf(docx, { jobId: job.id, fileName });
      job.log.info("pdf converted", { code: "PDF_CONVERTED", context: { bytes: r.pdf.length, durationMs: r.durationMs } });
      push("PDF", r.pdf);
    } catch (err) {
      job.addError(errorCodeOf(err, "PDF_CONVERT_FAILED"), `pdf conversion failed: ${errorMessageOf(err)}`, "PDF", err);
      failed.add("PDF");
    } finally {
      job.log.listener = {};
    }
  } else if (needPdf && !failed.has("PDF")) {
    // Prasyarat PDF tidak terpenuhi tanpa galat tercatat (mis. figur gagal sudah menandai semua format).
    failed.add("PDF");
  }

  // 4c. HTML (S24) + metrik tata letak untuk lint render.
  let html: string | undefined;
  let metrics: LayoutMetrics | undefined;
  if (figures && needHtml) {
    job.checkAborted("html");
    try {
      html = await assembleHtml(ctx, { preview: false });
      job.log.info("html assembled", { code: "HTML_ASSEMBLED", context: { chars: html.length } });
      push("HTML", html);
    } catch (err) {
      job.addError(htmlErrorCodeOf(err), `html assembly failed: ${errorMessageOf(err)}`, "HTML", err);
      failed.add("HTML");
    }
    if (html && opts.measureLayout !== false) {
      try {
        metrics = await measureLayout(html);
        await noteChromium(job);
      } catch (err) {
        job.log.warn(`layout measurement skipped (render lint partial): ${errorMessageOf(err)}`, { code: "LAYOUT_NOT_MEASURED" });
      }
    }
  }

  // 5. Lint -> status rilis per tier (tidak menahan berkas).
  job.checkAborted("lint");
  const lint = lintAfterRender({ snapshot, tpl, tier, html, metrics, svgs: figures?.svgs ?? [], extra: figures?.extra, log: job.log });
  state.lint = lint;
  job.log.info(`lint ${lint.tier}: ${lint.releaseStatus}`, { code: "LINT_DONE", context: { checks: lint.checks.length } });

  // 6. Berkas figur (SVG/PNG) bila diminta; penyimpanan milik pemanggil.
  if (figures && (want.has("SVG") || want.has("PNG"))) collectFigureFiles(job, snapshot, figures, want, files);
}

/** Figur per blok (urutan dokumen) -> berkas SVG/PNG ber-nama DATUM. */
function collectFigureFiles(
  job: RenderJobHandle,
  snapshot: NormDocSnapshot,
  figures: FigureBuild,
  want: ReadonlySet<StudioOutputFormat>,
  files: PureRenderFile[],
): void {
  let count = 0;
  for (const block of snapshot.blocks) {
    if (!FIGURE_BLOCK_TYPES.has(block.type)) continue;
    const key = figureStoreKeys(block, snapshot.numbering)[0];
    if (!key) continue;
    const c = isRecord(block.content) ? block.content : {};
    const caption = isRecord(c.caption) ? c.caption : {};
    const title = inlineText(caption.inline as Inline | undefined);
    for (let n = 1; ; n++) {
      const e = figures.store.get(sheetKey(key, n));
      if (!e) break;
      count++;
      if (want.has("SVG") && e.svg) {
        files.push({ format: "SVG", role: "FIGURE", fileName: figureFileName(key, title, n, "svg"), mime: FORMAT_MIME.SVG, data: e.svg, bytes: byteLength(e.svg), figureLabel: key, sheet: n });
      }
      if (want.has("PNG") && e.png && e.png.length > 0) {
        files.push({ format: "PNG", role: "FIGURE", fileName: figureFileName(key, title, n, "png"), mime: FORMAT_MIME.PNG, data: e.png, bytes: e.png.length, figureLabel: key, sheet: n });
      }
    }
  }
  if (count === 0) job.log.info("no figures in snapshot; SVG/PNG produce no files", { code: "NO_FIGURES" });
}

/**
 * Pipeline render artefak mandiri (S51, I41 `renderArtifact`).
 *
 * Format per jenis (kosong = default):
 *   CHART   SVG, PNG (default keduanya)  — chart/core S32, PNG 300 dpi S25
 *   DIAGRAM SVG, PNG (default keduanya)  — diagram/build S30
 *   IMAGE   PNG                          — aset PNG apa adanya (tanpa transkode)
 *   HTML    HTML                         — studio.html/v1 (KT-11: hanya dari templat)
 * Format lain untuk jenis itu -> SCHEMA_INVALID sebelum job dibuat.
 *
 * Gerbang HTML sebelum job dibuat (INT-R; D-98, F-048) — `gateHtmlArtifact`:
 *  - templat artefak lewat `resolveTemplateFor(..., { purpose: "render" })`:
 *    templat TERBATAS oleh pemanggil tidak tepercaya -> 403 FORBIDDEN;
 *  - dokumen inline melewati gerbang ingest yang SAMA (`ingestDocument`
 *    dryRun dengan templat artefak): penegakan per tier/profil, hak override
 *    kelas K/T, penanda `x.benchmark`/`x.enforcement`/`x.lintEnforcement`
 *    hanya dihormati untuk ADMIN/harness (selain itu dibuang, trust.ts).
 *    Penahan -> 422 BY_CONSTRUCTION_FAILED seperti ingest; render memakai
 *    dokumen yang sudah dibuang penandanya;
 *  - `doc.overrides` inline dikupas dengan aturan ingest yang sama
 *    (`gateInlineDocOverrides`, F-068): selain `ingest.inlineFormat = allow`
 *    tepercaya semua override dibuang; kunci K/T atau di luar lapis peran
 *    pemanggil tidak pernah sampai ke `templateForDoc`.
 */
import type { Prisma, StudioArtifact } from "@prisma/client";
import { db } from "./db";
import type {
  DocMeta,
  LayoutMetrics,
  LintIssue,
  LintReport,
  NormDocSnapshot,
  OutputFileDto,
  ParamMap,
  RenderContext,
  RenderOutcome,
  ResolvedTemplate,
  StudioCaller,
  StudioChartV1,
  StudioDiagramV1,
  StudioDocV1,
  StudioErrorCode,
  StudioHtmlV1,
  StudioImageV1,
  StudioOutputFormat,
  StudioTier,
  SvgResult,
  ValidationIssue,
} from "../../contract";
import { STUDIO_ERROR_HTTP } from "../../contract";
import { StudioEngineError } from "../../contract/errors";
import { Register } from "../../engine/bind";
import { measureLayout, rasterizeSvg } from "../../engine/browser";
import { figureGrid } from "../../engine/chart/core/guards";
import { buildDiagramSvg } from "../../engine/diagram/build";
import { assembleHtml } from "../../engine/html/assemble";
import { fontFaceCss, htmlShell } from "../../engine/html/base";
import { escapeHtml } from "../../engine/html/blocks";
import { decodeImage, pxGuard, readImageAsset, type DecodedImage } from "../images";
import {
  BENCHMARK_MARKER_STRIPPED,
  ENFORCEMENT_OVERRIDE_STRIPPED,
  ingestDocument,
  normalize,
  stripBenchmarkMarkers,
  stripEnforcementOverride,
} from "../ingest";
import { isTrustedCaller, resolveTemplate, resolveTemplateFor } from "../templates";
import { INLINE_FORMAT_STRIPPED_ID } from "../../engine/lint/structure";
import {
  asAnySnapshot,
  engineSnapshot,
  errorCodeOf,
  errorMessageOf,
  gateInlineDocOverrides,
  handOff,
  htmlErrorCodeOf,
  noteChromium,
  preloadAssetBytes,
  templateForDoc,
} from "./common";
import { assertFigureCapacity } from "./figure-limits";
import { ArtifactSpecReader, buildFigures, chartSvg } from "./figures";
import {
  createRenderJob,
  finalStatus,
  finishRenderJob,
  releaseRenderJob,
  renderJobToDto,
  withJobTimeout,
  type RenderJobHandle,
} from "./job";
import { lintArtifact } from "./lint";
import { FORMAT_MIME, artifactRelDir, datumSafeName, normalizeFormats } from "./naming";

type ArtifactKind = StudioArtifact["kind"];

const ALLOWED: Readonly<Record<ArtifactKind, readonly StudioOutputFormat[]>> = {
  CHART: ["SVG", "PNG"],
  DIAGRAM: ["SVG", "PNG"],
  IMAGE: ["PNG"],
  HTML: ["HTML"],
};

const artifactInclude = { templateVersion: { include: { template: true } } } satisfies Prisma.StudioArtifactInclude;
type ArtifactRow = Prisma.StudioArtifactGetPayload<{ include: typeof artifactInclude }>;

export async function renderArtifactImpl(
  artifactId: string,
  formats: readonly StudioOutputFormat[],
  caller: StudioCaller,
): Promise<RenderOutcome> {
  const art = await (await db()).studioArtifact.findUnique({ where: { id: artifactId }, include: artifactInclude });
  if (!art) throw new StudioEngineError("ARTIFACT_NOT_FOUND", `artifact ${artifactId} not found`, { artifactId });

  const allowed = ALLOWED[art.kind];
  const asked = normalizeFormats(formats ?? []);
  const bad = asked.filter((f) => !allowed.includes(f));
  if (bad.length > 0) {
    throw new StudioEngineError("SCHEMA_INVALID", `format ${bad.join(", ")} not supported for artifact kind ${art.kind}`, {
      allowed,
      rejected: bad,
    });
  }
  const fmts = asked.length > 0 ? asked : [...allowed];

  // SEC-FIX2 N-1 (D-506): batas kapasitas figur yang sama dengan pratinjau/render dokumen SEBELUM job -> 422
  // `BY_CONSTRUCTION_FAILED` (`FIGURE_CAPACITY`) cepat; spec v1 besar (artefak lama) tidak pernah sampai ke mesin.
  if (art.kind === "CHART") assertFigureCapacity("chart", art.spec);
  else if (art.kind === "DIAGRAM") assertFigureCapacity("diagram", art.spec);

  // INT-R (D-98, F-048): otorisasi templat + gerbang dokumen inline SEBELUM job (403/422 ke pemanggil).
  const htmlGate = art.kind === "HTML" ? await gateHtmlArtifact(art.spec as unknown as StudioHtmlV1, caller) : null;

  const job = await createRenderJob({ artifactId: art.id }, fmts, caller.requester);
  const outputs: OutputFileDto[] = [];
  const failed = new Set<StudioOutputFormat>();
  let lint: LintReport | undefined;
  try {
    lint = await withJobTimeout(job, () => runArtifactJob(job, art, fmts, outputs, failed, htmlGate));
  } catch (err) {
    job.addError(errorCodeOf(err, "RENDER_FAILED"), `render job failed: ${errorMessageOf(err)}`, undefined, err);
    for (const f of fmts) failed.add(f);
  } finally {
    releaseRenderJob(job);
  }
  const succeeded = fmts.filter((f) => !failed.has(f)).length;
  const row = await finishRenderJob(job, finalStatus(fmts.length, succeeded, job.errors.length));
  return { job: renderJobToDto(row), outputs, errors: [...job.errors], ...(lint ? { lint } : {}) };
}

/** Templat artefak: versi yang dipin; tanpa pin -> templat kanonik jenis itu, lalu kanonik DOCUMENT. */
async function artifactTemplate(art: ArtifactRow): Promise<ResolvedTemplate> {
  if (art.templateVersion) return resolveTemplate(art.templateVersion.template.slug, art.templateVersion.versionNo);
  const canonical =
    (await (await db()).studioTemplate.findFirst({ where: { kind: art.kind, isCanonical: true, archived: false }, orderBy: { slug: "asc" } })) ??
    (await (await db()).studioTemplate.findFirst({ where: { kind: "DOCUMENT", isCanonical: true, archived: false }, orderBy: { slug: "asc" } }));
  if (!canonical) throw new StudioEngineError("TEMPLATE_NOT_FOUND", `no canonical template for artifact kind ${art.kind}`);
  return resolveTemplate(canonical.slug);
}

async function runArtifactJob(
  job: RenderJobHandle,
  art: ArtifactRow,
  fmts: StudioOutputFormat[],
  outputs: OutputFileDto[],
  failed: Set<StudioOutputFormat>,
  htmlGate: HtmlArtifactGate | null,
): Promise<LintReport> {
  job.startedAt = new Date();
  job.status = "RUNNING";
  await job.persist({ status: "RUNNING", startedAt: job.startedAt });

  const want = new Set(fmts);
  const relDir = artifactRelDir(art.missionFolder, art.createdAt, art.id);
  const baseName = (art.label ?? "").trim() || art.title;
  const common = { artifactId: art.id, relDir, role: "PRIMARY" as const };
  const svgs: SvgResult[] = [];
  const extra: LintIssue[] = [];
  let html: string | undefined;
  let metrics: LayoutMetrics | undefined;
  let lintParams: ParamMap | undefined;
  const files: Array<{ format: StudioOutputFormat; data: Uint8Array | string; ext: string }> = [];

  if (art.kind === "CHART" || art.kind === "DIAGRAM") {
    let svg: SvgResult | undefined;
    try {
      if (art.kind === "CHART") {
        const tpl = await artifactTemplate(art);
        lintParams = tpl.params;
        svg = chartSvg(art.spec as unknown as StudioChartV1, tpl);
      } else {
        // D-252: grid turunan templat artefak (lebar sah, blok teks, kisi X); A4 identik.
        // FIX-F C6 (D-288): artefak mandiri tidak punya baris KUNCI halaman, jadi tanpa `keyRowOnPage`
        // (KEY tetap di SVG). Blok dokumen yang merujuk artefak + keyRow: `diagramSpecForBlock` (figures.ts).
        const tpl = await artifactTemplate(art);
        svg = buildDiagramSvg(art.spec as unknown as StudioDiagramV1, { release: false, grid: figureGrid(tpl.params) });
      }
      svgs.push(svg);
    } catch (err) {
      for (const f of fmts) failed.add(f);
      job.addError(errorCodeOf(err, "RENDER_FAILED"), `${art.kind.toLowerCase()} build failed: ${errorMessageOf(err)}`, undefined, err);
    }
    if (svg) {
      if (want.has("SVG")) files.push({ format: "SVG", data: svg.svg, ext: "svg" });
      if (want.has("PNG")) {
        job.checkAborted("png");
        try {
          const png = await rasterizeSvg(svg.svg, { widthMm: svg.widthMm, heightMm: svg.heightMm, dpi: 300 });
          files.push({ format: "PNG", data: png, ext: "png" });
          await noteChromium(job);
        } catch (err) {
          job.addError(errorCodeOf(err, "RENDER_FAILED"), `png rasterization failed: ${errorMessageOf(err)}`, "PNG", err);
          failed.add("PNG");
        }
      }
    }
  } else if (art.kind === "IMAGE") {
    try {
      const spec = art.spec as unknown as StudioImageV1;
      const img = await loadImage(spec);
      const guard = pxGuard(img.widthPx, spec.widthMm, spec.dpiMin ?? 150);
      extra.push(guard ?? { checkId: "DATUM-39", status: "PASS" });
      if (img.mime !== "image/png") {
        throw new StudioEngineError("ASSET_TYPE_UNSUPPORTED", `image asset is ${img.mime}; PNG output requires a PNG asset (no transcoding)`);
      }
      files.push({ format: "PNG", data: img.bytes, ext: "png" });
    } catch (err) {
      job.addError(errorCodeOf(err, "RENDER_FAILED"), `image output failed: ${errorMessageOf(err)}`, "PNG", err);
      failed.add("PNG");
    }
  } else {
    try {
      if (!htmlGate) throw new StudioEngineError("RENDER_FAILED", "html artifact rendered without its access gate");
      const r = await renderHtmlArtifact(job, art, art.spec as unknown as StudioHtmlV1, svgs, htmlGate);
      html = r.html;
      lintParams = r.params;
      files.push({ format: "HTML", data: html, ext: "html" });
    } catch (err) {
      job.addError(htmlErrorCodeOf(err), `html artifact failed: ${errorMessageOf(err)}`, "HTML", err);
      failed.add("HTML");
    }
    if (html) {
      try {
        metrics = await measureLayout(html);
        await noteChromium(job);
      } catch (err) {
        job.log.warn(`layout measurement skipped (render lint partial): ${errorMessageOf(err)}`, { code: "LAYOUT_NOT_MEASURED" });
      }
    }
  }

  job.checkAborted("lint");
  const lint = lintArtifact({ svgs, extra, html, metrics, params: lintParams, log: job.log });

  job.checkAborted("storage");
  for (const f of files) {
    await handOff(
      job,
      { ...common, fileName: datumSafeName(baseName, f.ext, "Artefak"), data: f.data, format: f.format, mime: FORMAT_MIME[f.format], lintVerdict: lint.releaseStatus },
      outputs,
      failed,
    );
  }

  try {
    await (await db()).studioArtifact.update({
      where: { id: art.id },
      data: { releaseStatus: lint.releaseStatus, lintReport: JSON.parse(JSON.stringify(lint)) as Prisma.InputJsonValue },
    });
  } catch (err) {
    job.log.error(`artifact release status update failed: ${errorMessageOf(err)}`, { code: "ARTIFACT_UPDATE_FAILED", err });
  }
  return lint;
}

/**
 * Gambar artefak: base64 tertanam -> `decodeImage`; aset tersimpan
 * (`path` atau `assets/<sha256>.<ext>`) -> `readImageAsset` S53 (guard path
 * S52, sha256 + MIME diverifikasi terhadap AssetRef).
 */
async function loadImage(spec: StudioImageV1): Promise<DecodedImage> {
  const a = spec.asset;
  if (a && typeof a.dataBase64 === "string") return decodeImage({ base64: a.dataBase64 });
  if (a && typeof a.sha256 === "string" && a.sha256) {
    const img = await readImageAsset({ sha256: a.sha256, mime: a.mime, path: a.path });
    return { mime: img.mime, widthPx: img.widthPx, heightPx: img.heightPx, bytes: img.bytes, sha256: img.sha256 };
  }
  throw new StudioEngineError("FILE_NOT_FOUND", "image asset has neither dataBase64 nor sha256");
}

// ── Gerbang HTML (INT-R; D-98, F-048) ───────────────────────────────────

/** Hasil gerbang HTML artefak: templat dasar teresolusi + dokumen inline yang boleh dirender. */
export interface HtmlArtifactGate {
  baseTpl: ResolvedTemplate;
  /** Dokumen inline sesudah gerbang (penanda dibuang bila tidak tepercaya); null = sumber bukan inline. */
  inlineDoc: StudioDocV1 | null;
  /** Pointer (relatif spec) penanda benchmark/penegakan yang dibuang dari dokumen inline. */
  stripped: string[];
  /** Pointer (relatif spec) kunci `overrides` yang dikupas dari dokumen inline (F-068). */
  overridesStripped: string[];
}

export interface HtmlArtifactGateOptions {
  /** Harness/CLI server tanpa sesi HTTP (hanya kode server; tidak pernah dari body/header). */
  trustedHarness?: boolean;
  correlationId?: string;
}

const INLINE_DOC_PTR = "/source/document";

/**
 * Pointer isu ingest -> relatif spec artefak: isu skema/struktur berawalan
 * `/document`, temuan lint relatif dokumen (`/chapters/...`; dokumen tidak
 * punya kunci `document`, jadi tidak ambigu). Keduanya -> `/source/document/...`.
 */
function toSpecPointer(p: string): string {
  if (p === "/document" || p.startsWith("/document/")) return `${INLINE_DOC_PTR}${p.slice("/document".length)}`;
  return p.startsWith("/") ? `${INLINE_DOC_PTR}${p}` : p;
}

/**
 * Kode galat untuk hasil dryRun ingest yang tidak sah (dryRun tidak melempar
 * untuk masukan tidak sah): `lint` terisi hanya pada penolakan gerbang
 * by-construction -> 422; isu hak override membawa kodenya sebagai `keyword`
 * (403/400); selain itu struktur/skema -> 400 SCHEMA_INVALID.
 */
function ingestRejectionCode(lint: LintReport | null, issues: readonly ValidationIssue[]): StudioErrorCode {
  if (lint) return "BY_CONSTRUCTION_FAILED";
  const kw = issues[0]?.keyword;
  if (kw && Object.prototype.hasOwnProperty.call(STUDIO_ERROR_HTTP, kw)) return kw as StudioErrorCode;
  return "SCHEMA_INVALID";
}

/**
 * Otorisasi templat + gerbang ingest untuk dokumen inline HTML artefak.
 * Dipakai `renderArtifactImpl` (sebelum job) dan R09 `prepareArtifact`
 * (sebelum baris dibuat, bila route meneruskan pemanggil). Tidak menulis DB
 * maupun berkas (ingest dryRun). Melempar `StudioEngineError` FORBIDDEN 403,
 * BY_CONSTRUCTION_FAILED 422, kode hak override, atau SCHEMA_INVALID 400.
 */
export async function gateHtmlArtifact(
  spec: StudioHtmlV1,
  caller: StudioCaller,
  opts: HtmlArtifactGateOptions = {},
): Promise<HtmlArtifactGate> {
  const trustedHarness = opts.trustedHarness === true;
  const baseTpl = await resolveTemplateFor(spec.template.slug, spec.template.version, caller, { purpose: "render", trustedHarness });
  const src = spec.source;
  if (src.kind !== "inline") return { baseTpl, inlineDoc: null, stripped: [], overridesStripped: [] };

  // Gerbang yang sama dengan ingest R04 (buang penanda, templat terbatas setelah override,
  // hak override K/T, skema, P3-20, aset, bind, ingestPolicy per tier) dengan templat artefak.
  const result = await ingestDocument(
    { document: src.document, ...(caller.agentId ? { agentId: caller.agentId } : {}) },
    caller,
    { dryRun: true, template: baseTpl, trustedHarness, correlationId: opts.correlationId },
  );
  if (!result.valid) {
    const issues = (result.issues ?? []).map((i) => ({ ...i, pointer: toSpecPointer(i.pointer) }));
    const code = ingestRejectionCode(result.lint, issues);
    const what = code === "BY_CONSTRUCTION_FAILED" ? `${issues.length} pelanggaran by-construction` : "dokumen inline tidak sah";
    throw new StudioEngineError(code, `HTML artefak: ${what} (gerbang ingest, F-048)`, issues);
  }

  // Render memakai dokumen yang sama dengan yang lolos gerbang (F-068): override dokumen
  // mengikuti aturan ingest (kebijakan inlineFormat, hak K/T, lapis peran) untuk SEMUA pemanggil;
  // penanda benchmark/penegakan dibuang bila tidak tepercaya.
  const trusted = isTrustedCaller(caller, { trustedHarness });
  const o = gateInlineDocOverrides(baseTpl, src.document, caller, { trusted, pointer: INLINE_DOC_PTR });
  if (trusted) return { baseTpl, inlineDoc: o.doc, stripped: [], overridesStripped: o.stripped };
  const a = stripBenchmarkMarkers(o.doc, INLINE_DOC_PTR);
  const b = stripEnforcementOverride(a.doc, INLINE_DOC_PTR);
  return { baseTpl, inlineDoc: b.doc, stripped: [...a.stripped, ...b.stripped], overridesStripped: o.stripped };
}

/**
 * HTML artefak dari templat (KT-11): sumber dokumen tersimpan, dokumen inline,
 * atau artefak chart/diagram. Mengembalikan juga parameter templat efektif
 * (untuk batas lint render).
 */
async function renderHtmlArtifact(
  job: RenderJobHandle,
  art: ArtifactRow,
  spec: StudioHtmlV1,
  svgs: SvgResult[],
  gate: HtmlArtifactGate,
): Promise<{ html: string; params: ParamMap }> {
  const baseTpl = gate.baseTpl;
  const preview = spec.options?.previewLabel === true;
  const src = spec.source;

  if (src.kind === "artifact") {
    const reader = new ArtifactSpecReader();
    const a = await reader.read(src.artifactId);
    let svg: SvgResult;
    // SEC-FIX2 N-1: artefak yang dibungkus juga dicek batasnya sebelum mesin (galat job, tanpa render).
    if (a.kind === "CHART" || a.kind === "DIAGRAM") assertFigureCapacity(a.kind === "CHART" ? "chart" : "diagram", a.spec);
    if (a.kind === "CHART") svg = chartSvg(a.spec as StudioChartV1, baseTpl);
    else if (a.kind === "DIAGRAM") svg = buildDiagramSvg(a.spec as StudioDiagramV1, { release: false, grid: figureGrid(baseTpl.params) });
    else throw new StudioEngineError("REGISTRY_KIND_UNKNOWN", `html source artifact ${src.artifactId} is ${a.kind}; only CHART/DIAGRAM can be wrapped`);
    svgs.push(svg);
    const meta: DocMeta = {
      title: art.title,
      rev: "A",
      typeCode: "",
      tier: "NOTA",
      classification: "",
      language: "ID",
      author: art.createdBy,
      issueDate: art.createdAt.toISOString().slice(0, 10),
    };
    const body = `<figure class="studio-artifact" data-figure="${escapeHtml(art.label ?? art.id)}">${svg.svg}</figure>`;
    const html = htmlShell({ tpl: baseTpl, meta, bodyHtml: body, fontsCss: fontFaceCss(baseTpl, new Set<string>()), previewLabel: preview });
    return { html, params: baseTpl.params };
  }

  let snapshot: NormDocSnapshot;
  if (src.kind === "document") {
    const doc = await (await db()).studioDocument.findUnique({ where: { id: src.documentId }, select: { id: true, currentRevisionNo: true } });
    if (!doc) throw new StudioEngineError("DOCUMENT_NOT_FOUND", `document ${src.documentId} not found`);
    const revisionNo = src.revisionNo ?? doc.currentRevisionNo;
    const rev = await (await db()).studioRevision.findUnique({ where: { documentId_revisionNo: { documentId: doc.id, revisionNo } }, select: { snapshot: true } });
    if (!rev) throw new StudioEngineError("REVISION_NOT_FOUND", `revision ${revisionNo} of document ${doc.id} not found`);
    snapshot = engineSnapshot(asAnySnapshot(rev.snapshot)); // v1 atau v2 (SR-15)
  } else {
    // Dokumen inline yang sudah lolos gerbang ingest (INT-R, F-048); override dokumen
    // diterapkan sebelum normalisasi (sama dengan jalur ingest).
    const inline = gate.inlineDoc;
    if (!inline) throw new StudioEngineError("RENDER_FAILED", "inline html source was not gated");
    if (gate.stripped.length > 0) {
      job.log.warn(`markers stripped from inline document for untrusted caller: ${gate.stripped.join(", ")}`, {
        code: gate.stripped.some((p) => p.endsWith("/lintEnforcement")) ? ENFORCEMENT_OVERRIDE_STRIPPED : BENCHMARK_MARKER_STRIPPED,
        context: { stripped: gate.stripped },
      });
    }
    if (gate.overridesStripped.length > 0) {
      job.log.warn(`document overrides stripped from inline document (ingest rules, F-068): ${gate.overridesStripped.join(", ")}`, {
        code: INLINE_FORMAT_STRIPPED_ID,
        context: { stripped: gate.overridesStripped },
      });
    }
    snapshot = normalize(inline, templateForDoc(baseTpl, inline, job.log));
  }
  // Parameter render = parameter ingest (D-63): override dokumen di atas templat artefak.
  const tpl = templateForDoc(baseTpl, snapshot.doc, job.log);

  const tier = snapshot.doc.meta.tier as StudioTier;
  const figures = await buildFigures({ snapshot, tpl, tier, job, reader: new ArtifactSpecReader() });
  svgs.push(...figures.svgs);
  const ctx: RenderContext = {
    snapshot,
    tpl,
    register: new Register(snapshot.register ?? {}),
    fixedDate: snapshot.doc.meta.issueDate,
    figures: figures.store,
    log: job.log.renderLog,
    assetBytes: await preloadAssetBytes(snapshot.doc, job.log),
  };
  return { html: await assembleHtml(ctx, { preview }), params: tpl.params };
}

/**
 * Validasi dan persiapan artefak mandiri sebelum baris `StudioArtifact`
 * dibuat (R09 POST, 01_specs.md §3.5-3.8, §6.2-6.3).
 *
 * Urutan: (gambar multipart: dekode aset lebih dulu agar `spec.asset` terisi)
 * -> skema JSON (S48 `validateSchema`, 400 `SCHEMA_INVALID` berpointer relatif
 * spec) -> cek per jenis:
 *   chart   kode tak dikenal 422 `CHART_KIND_UNKNOWN`; drawn=false 422
 *           `CHART_KIND_NOT_DRAWN` + `details.alternatives` (juga per panel komposit)
 *   diagram `loadSpec` (Mermaid 422 `DATUM-31`) + `validateSpec` FAIL 422
 *           `BY_CONSTRUCTION_FAILED` (`details[].checkId`)
 *   image   layanan S53: sniff magic bytes PNG/JPEG (415), batas 413, masukan
 *           rusak 400; px_guard 422 `DATUM-39`; aset disimpan beralamat isi
 *           (`storeImageAsset`) dan `spec.asset` dinormalkan ke
 *           `{ path: "<sha256>.<ext>" }` (base64 tidak disimpan di DB)
 *   html    templat ada (404 `TEMPLATE_NOT_FOUND`), sumber ada (404
 *           `DOCUMENT_NOT_FOUND`/`REVISION_NOT_FOUND`/`ARTIFACT_NOT_FOUND`);
 *           sumber artefak harus CHART/DIAGRAM (KT-11: tanpa HTML mentah).
 *           INT-R (D-98, F-048): bila `ctx.caller` diteruskan route, templat
 *           diresolusi lewat `resolveTemplateFor(..., { purpose: "render" })`
 *           (templat terbatas oleh non-ADMIN/harness -> 403) dan dokumen
 *           inline melewati gerbang ingest (`gateHtmlArtifact`, 422) SEBELUM
 *           baris dibuat. Tanpa `ctx.caller` gerbang yang sama tetap ditegakkan
 *           `renderArtifactImpl` sebelum job render dibuat.
 * Format diminta harus sah untuk jenisnya (sama dengan S51) sebelum baris dibuat.
 */
import { prisma } from "@/lib/prisma";
import type { ChartCode, StudioArtifactKind, StudioOutputFormat } from "@/lib/studio/contract/enums";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import type { StudioChartV1 } from "@/lib/studio/contract/types/chart";
import type { StudioDiagramV1 } from "@/lib/studio/contract/types/diagram";
import type { AssetRef } from "@/lib/studio/contract/types/doc";
import type { StudioHtmlV1 } from "@/lib/studio/contract/types/html";
import type { StudioCaller } from "@/lib/studio/contract/auth";
import type { StudioImageV1 } from "@/lib/studio/contract/types/image";
import { loadSpec, validateSpec } from "@/lib/studio/engine/diagram/core";
import { CHART_BY_CODE } from "@/lib/studio/registry/charts";
import { decodeImage, decodeImageBlob, pxGuard, readImageAsset, storeImageAsset, type DecodedImage } from "@/lib/studio/services/images";
import { validateSchema } from "@/lib/studio/services/ingest";
import { sha256Hex, stableStringify } from "@/lib/studio/services/ingest/util";
import { gateHtmlArtifact } from "@/lib/studio/services/render/artifact";
import { resolveTemplate } from "@/lib/studio/services/templates";
import { isPlainObject, issue } from "@/lib/studio/http";
import type { ArtifactSchemaId, ParsedArtifactRequest } from "./request";

export const KIND_BY_SCHEMA: Readonly<Record<ArtifactSchemaId, StudioArtifactKind>> = {
  "studio.chart/v1": "CHART",
  "studio.diagram/v1": "DIAGRAM",
  "studio.image/v1": "IMAGE",
  "studio.html/v1": "HTML",
};

/** Format sah per jenis (selaras `services/render/artifact.ts` S51). */
export const ARTIFACT_FORMATS: Readonly<Record<StudioArtifactKind, readonly StudioOutputFormat[]>> = {
  CHART: ["SVG", "PNG"],
  DIAGRAM: ["SVG", "PNG"],
  IMAGE: ["PNG"],
  HTML: ["HTML"],
};

const MAX_TITLE_CHARS = 300;
const MAX_LABEL_CHARS = 64;

export interface PreparedArtifact {
  kind: StudioArtifactKind;
  schemaId: ArtifactSchemaId;
  title: string;
  label: string | null;
  spec: Record<string, unknown>;
  specSha256: string;
  templateVersionId: string | null;
  formats: StudioOutputFormat[];
  /** Ringkas untuk log (tanpa isi). */
  logContext: Record<string, unknown>;
}

// ── Util ────────────────────────────────────────────────────────────────

// S85 R-08: JSON kanonik + sha256 satu sumber (services/ingest/util).
function sha256Of(text: string): string {
  return sha256Hex(text);
}

function schemaInvalid(message: string, issues: ValidationIssue[]): StudioEngineError {
  return new StudioEngineError("SCHEMA_INVALID", message, issues);
}

function clip(s: string, n: number): string {
  const t = s.trim();
  return t.length > n ? t.slice(0, n) : t;
}

function checkFormats(kind: StudioArtifactKind, formats: readonly StudioOutputFormat[]): void {
  const allowed = ARTIFACT_FORMATS[kind];
  const issues = formats
    .map((f, i) => (allowed.includes(f) ? null : issue(`/formats/${i}`, "enum", `format ${f} is not supported for ${kind}; allowed: ${allowed.join(", ")}`)))
    .filter((x): x is ValidationIssue => x !== null);
  if (issues.length > 0) throw schemaInvalid(`Format not supported for artifact kind ${kind}`, issues);
}

// ── Chart ───────────────────────────────────────────────────────────────

function checkChartCode(code: unknown, pointer: string): void {
  const def = typeof code === "string" ? CHART_BY_CODE.get(code as ChartCode) : undefined;
  if (!def) {
    throw new StudioEngineError("CHART_KIND_UNKNOWN", `Chart kind '${String(code)}' is not in the chart registry`, [
      issue(pointer, "enum", "unknown chart kind"),
    ]);
  }
  if (!def.drawn) {
    throw new StudioEngineError("CHART_KIND_NOT_DRAWN", `Chart kind ${def.code} is not drawn by the Studio renderer`, {
      kind: def.code,
      pointer,
      alternatives: [...(def.alternatives ?? [])],
    });
  }
}

function checkChart(spec: StudioChartV1): void {
  if (spec.kind === "composite") {
    (spec.composite?.panels ?? []).forEach((p, i) => {
      checkChartCode(p.code, `/composite/panels/${i}/code`);
      if (p.spec && p.spec.kind !== p.code) checkChartCode(p.spec.kind, `/composite/panels/${i}/spec/kind`);
    });
    return;
  }
  checkChartCode(spec.kind, "/kind");
}

// ── Diagram ─────────────────────────────────────────────────────────────

function checkDiagram(spec: Record<string, unknown>): Record<string, unknown> {
  // Mermaid -> DiagramDefect DATUM-31 (422); JSON/objek rusak -> StudioEngineError sesuai kode.
  const loaded = loadSpec(spec);
  const fails = validateSpec(loaded, { release: false }).filter((i) => i.status === "FAIL");
  if (fails.length > 0) {
    throw new StudioEngineError(
      "BY_CONSTRUCTION_FAILED",
      `Diagram spec fails ${fails.length} by-construction check(s)`,
      fails.map((f) => issue(f.pointer ?? "", "by-construction", f.detail ?? f.checkId, f.checkId)),
    );
  }
  return loaded as unknown as Record<string, unknown>;
}

// ── Image (layanan S53; kode galatnya dipetakan apa adanya, D-61) ─────────

/** Nama aset beralamat isi (`AssetRef.path`, relatif akar aset). */
const ASSET_NAME_RE = /^[0-9a-f]{64}\.(png|jpg)$/;

/** Dekode aset dari `dataBase64` atau `path` beralamat isi (bukan path bebas). */
async function decodeSpecAsset(asset: AssetRef): Promise<DecodedImage> {
  if (typeof asset.dataBase64 === "string") return decodeImage({ base64: asset.dataBase64 });
  if (typeof asset.path === "string") {
    const name = asset.path.replace(/^assets\//, "");
    if (!ASSET_NAME_RE.test(name)) {
      throw schemaInvalid("asset.path must be a stored content address '<sha256>.<png|jpg>'", [
        issue("/asset/path", "pattern", "must be '<sha256>.png' or '<sha256>.jpg' (upload the file as multipart 'file' or send dataBase64)"),
      ]);
    }
    try {
      return await readImageAsset({ sha256: asset.sha256, mime: asset.mime, path: name });
    } catch (err) {
      if (err instanceof StudioEngineError && err.code === "FILE_MISSING_ON_DISK") {
        throw schemaInvalid("asset.path does not refer to a stored asset", [issue("/asset/path", "exists", "asset not found in the Studio asset store")]);
      }
      throw err;
    }
  }
  throw schemaInvalid("asset needs dataBase64, path, or a multipart 'file'", [
    issue("/asset", "required", "must have dataBase64 or path (or send a multipart 'file')"),
  ]);
}

async function prepareImage(p: ParsedArtifactRequest, ctx: { correlationId: string }, preDecoded?: DecodedImage): Promise<Record<string, unknown>> {
  const spec = p.spec as unknown as StudioImageV1;
  const img = preDecoded ?? (await decodeSpecAsset(spec.asset));
  const issues: ValidationIssue[] = [];
  if (spec.asset.sha256 !== img.sha256) issues.push(issue("/asset/sha256", "const", "does not match the sha256 of the asset bytes"));
  if (spec.asset.mime !== img.mime) issues.push(issue("/asset/mime", "const", `does not match the sniffed content type ${img.mime}`));
  if (issues.length > 0) throw schemaInvalid("Asset reference does not match the asset bytes", issues);

  const guard = pxGuard(img.widthPx, spec.widthMm, spec.dpiMin ?? 150);
  if (guard && guard.status === "FAIL") {
    throw new StudioEngineError("DATUM-39", guard.detail ?? "Effective image resolution is below the minimum dpi", [
      issue("/widthMm", "px_guard", guard.detail ?? "effective dpi below minimum", guard.checkId || "DATUM-39"),
    ]);
  }

  // Base64 tidak disimpan di DB: aset ditulis ke assets/<sha256>.<ext> dan spec merujuk path.
  const stored = await storeImageAsset(img, { correlationId: ctx.correlationId });
  return { ...p.spec, asset: stored.asset };
}

/** Isi `spec.asset` dari unggahan multipart sebelum validasi skema. */
async function fillAssetFromUpload(p: ParsedArtifactRequest): Promise<DecodedImage | undefined> {
  if (!p.upload) return undefined;
  const given = p.spec.asset;
  if (given !== undefined) {
    if (!isPlainObject(given)) throw schemaInvalid("spec.asset must be object", [issue("/asset", "type", "must be object")]);
    if (given.dataBase64 !== undefined || given.path !== undefined) {
      throw schemaInvalid("spec.asset must not carry dataBase64/path when a file is uploaded", [
        issue("/asset", "not", "dataBase64/path are filled from the uploaded file"),
      ]);
    }
  }
  const d = await decodeImageBlob(p.upload.file);
  const img: DecodedImage = { mime: d.mime, widthPx: d.widthPx, heightPx: d.heightPx, bytes: d.bytes, sha256: d.sha256 };
  if (isPlainObject(given) && given.sha256 !== undefined && given.sha256 !== img.sha256) {
    throw schemaInvalid("spec.asset.sha256 does not match the uploaded file", [issue("/asset/sha256", "const", "does not match the uploaded file")]);
  }
  // `path` sementara agar skema lolos; diganti nama tersimpan di prepareImage.
  p.spec.asset = { kind: "raster", mime: img.mime, sha256: img.sha256, widthPx: img.widthPx, heightPx: img.heightPx, path: "pending" };
  return img;
}

// ── HTML ────────────────────────────────────────────────────────────────

async function prepareHtml(spec: StudioHtmlV1, ctx: PrepareContext): Promise<{ title: string; templateVersionId: string }> {
  // D-98/F-048: dengan pemanggil -> resolveTemplateFor(purpose "render") + gerbang inline (sebelum baris dibuat).
  const tpl = ctx.caller
    ? (await gateHtmlArtifact(spec, ctx.caller, { correlationId: ctx.correlationId })).baseTpl
    : await resolveTemplate(spec.template.slug, spec.template.version);
  const src = spec.source;
  let title: string;
  if (src.kind === "document") {
    const doc = await prisma.studioDocument.findUnique({ where: { id: src.documentId }, select: { id: true, title: true } });
    if (!doc) throw new StudioEngineError("DOCUMENT_NOT_FOUND", "Source document not found", [issue("/source/documentId", "exists", "document not found")]);
    if (src.revisionNo !== undefined) {
      const rev = await prisma.studioRevision.findUnique({
        where: { documentId_revisionNo: { documentId: doc.id, revisionNo: src.revisionNo } },
        select: { id: true },
      });
      if (!rev) throw new StudioEngineError("REVISION_NOT_FOUND", "Source revision not found", [issue("/source/revisionNo", "exists", "revision not found")]);
    }
    title = doc.title;
  } else if (src.kind === "artifact") {
    const art = await prisma.studioArtifact.findUnique({ where: { id: src.artifactId }, select: { kind: true, title: true } });
    if (!art) throw new StudioEngineError("ARTIFACT_NOT_FOUND", "Source artifact not found", [issue("/source/artifactId", "exists", "artifact not found")]);
    if (art.kind !== "CHART" && art.kind !== "DIAGRAM") {
      throw schemaInvalid("Only CHART or DIAGRAM artifacts can be wrapped as HTML", [
        issue("/source/artifactId", "enum", `source artifact kind ${art.kind} cannot be wrapped (CHART or DIAGRAM only)`),
      ]);
    }
    title = art.title;
  } else {
    title = src.document.meta.title;
  }
  return { title, templateVersionId: tpl.versionId };
}

// ── Utama ───────────────────────────────────────────────────────────────

export interface PrepareContext {
  correlationId: string;
  /** Pemanggil (route R09); bila ada, otorisasi templat + gerbang inline HTML dijalankan di sini (INT-R). */
  caller?: StudioCaller;
}

export async function prepareArtifact(p: ParsedArtifactRequest, ctx: PrepareContext): Promise<PreparedArtifact> {
  const kind = KIND_BY_SCHEMA[p.schemaId];
  checkFormats(kind, p.formats);

  const preDecoded = kind === "IMAGE" ? await fillAssetFromUpload(p) : undefined;

  const issues = validateSchema(p.schemaId, p.spec);
  if (issues.length > 0) throw schemaInvalid(`spec does not match ${p.schemaId} (pointers are relative to spec)`, issues);

  let spec: Record<string, unknown> = p.spec;
  let title = "";
  let label: string | null = null;
  let templateVersionId: string | null = null;

  if (kind === "CHART") {
    const c = spec as unknown as StudioChartV1;
    checkChart(c);
    title = c.title;
    label = c.id ?? null;
  } else if (kind === "DIAGRAM") {
    spec = checkDiagram(spec);
    const d = spec as unknown as StudioDiagramV1;
    title = d.title;
    label = d.id;
  } else if (kind === "IMAGE") {
    spec = await prepareImage(p, ctx, preDecoded);
    const im = spec as unknown as StudioImageV1;
    title = im.title;
    label = im.id ?? null;
  } else {
    const h = await prepareHtml(spec as unknown as StudioHtmlV1, ctx);
    title = h.title;
    templateVersionId = h.templateVersionId;
  }

  const specSha256 = sha256Of(stableStringify(spec));
  return {
    kind,
    schemaId: p.schemaId,
    title: clip(title, MAX_TITLE_CHARS) || kind.toLowerCase(),
    label: label && label.trim() ? clip(label, MAX_LABEL_CHARS) : null,
    spec,
    specSha256,
    templateVersionId,
    formats: p.formats,
    logContext: { kind, schemaId: p.schemaId, specSha256, formats: p.formats, uploadBytes: p.upload ? p.upload.bytes : undefined },
  };
}

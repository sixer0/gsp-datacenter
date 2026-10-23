"use client";

/*
 * Lapis data galeri artefak (S62; dimigrasi FIX-4b ke fondasi `shared/*`,
 * UX-01 §6.2, menutup S86 R05 + R06 + R17). Membaca R09 `/api/studio/artifacts`,
 * R03 `/api/studio/registry`, R01 `/api/studio/templates` (templat halaman web),
 * dan R10 `/api/studio/files/[id]` (01_specs.md §6.2).
 *
 * - Semua permintaan lewat `requestJson` bersama (satu `StudioApiError`,
 *   correlationId, log `studio.ui.artifact-gallery.<sumber>`).
 * - URL berkas lewat `fileUrl` bersama (validasi awalan, Buka = inline).
 * - Detail galat POST (isu skema, alternatif grafik) dibaca dari
 *   `StudioApiError.details` (bentuk route: `details[]` isu atau
 *   `details.alternatives` untuk `CHART_KIND_NOT_DRAWN`, `_lib/prepare.ts`).
 */

import type { ChartCode, StudioOutputFormat } from "@/lib/studio/contract/enums";
import { STUDIO_ROUTES } from "@/lib/studio/contract/env";
import type {
  ArtifactCreateRequest,
  ArtifactSummary,
  OutputFileDto,
  RenderJobDto,
  RenderJobError,
  TemplateSummary,
} from "@/lib/studio/contract/types/api";
import type { ChartDef } from "@/lib/studio/contract/types/params";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { fileUrl } from "@/components/studio/shared/file-url";
import { StudioApiError, isStudioApiError, issuesOf, requestJson, withQuery, type StudioIssue } from "@/components/studio/shared/http";

export { fileUrl, isStudioApiError, StudioApiError, withQuery };

/** Sumber log `studio.ui.artifact-gallery.<sumber>` (R17). */
export const src = (name: string) => `artifact-gallery.${name}`;

// ── Bentuk respons ───────────────────────────────────────────────────────

/**
 * Butir daftar R09 GET: `ArtifactSummary & { outputs }` (S57 `_lib/dto.ts`).
 * `chartCode`/`spec` belum dikirim S57 (permintaan S62 di file_requests.md);
 * dibaca bila ada agar filter kode grafik bekerja tanpa ubahan UI.
 */
export type ArtifactListItem = ArtifactSummary & {
  outputs?: OutputFileDto[];
  files?: OutputFileDto[];
  chartCode?: string | null;
  spec?: { kind?: unknown; family?: unknown } | null;
};

export interface ArtifactListResponse {
  artifacts: ArtifactListItem[];
  nextCursor?: string | null;
}

/** R09 POST 201 (pembuatan sinkron: status sudah final saat respons tiba). */
export interface ArtifactCreateResponse {
  artifact: ArtifactListItem;
  outputs: OutputFileDto[];
  job: RenderJobDto | null;
  errors: RenderJobError[];
}

export interface RegistryEnvelope<T, M = Record<string, unknown>> {
  kind: string;
  count: number;
  items: T[];
  meta?: M;
}

export type ChartRegistryResponse = RegistryEnvelope<ChartDef, { drawn?: number; byGroup?: Record<string, number> }>;
export type DiagramRegistryResponse = RegistryEnvelope<{ family: string; layout: string }, { symbolDialects?: string[] }>;
export type SymbolRegistryResponse = RegistryEnvelope<{ id: string; dialect: string }, { byDialect?: Record<string, number> }>;

/** Bagian dokumen JSON Schema yang dibaca validasi klien ringan. */
export interface JsonSchemaDoc {
  $id?: string;
  required?: string[];
  properties?: Record<string, unknown>;
  additionalProperties?: boolean | Record<string, unknown>;
}

export interface TemplateListResponse {
  templates: TemplateSummary[];
}

// ── URL ──────────────────────────────────────────────────────────────────

export const ARTIFACT_SCHEMA_BY_KIND = {
  CHART: "studio.chart/v1",
  DIAGRAM: "studio.diagram/v1",
  IMAGE: "studio.image/v1",
  HTML: "studio.html/v1",
} as const;
export type ArtifactKindKey = keyof typeof ARTIFACT_SCHEMA_BY_KIND;

export const registryUrl = (kind: "charts" | "diagram" | "symbols") => withQuery(STUDIO_ROUTES.R03, { kind });
export const schemaUrl = (kind: ArtifactKindKey) =>
  withQuery(STUDIO_ROUTES.R03, { kind: "schema", schemaId: ARTIFACT_SCHEMA_BY_KIND[kind] });
export const artifactsUrl = (q: { kind?: string; mission?: string; take?: number; cursor?: string }) =>
  withQuery(STUDIO_ROUTES.R09, { kind: q.kind, mission: q.mission, take: q.take, cursor: q.cursor });

/** GET JSON untuk `useStudioQuery` (fetcher bertanda tangan `(signal) => Promise<T>`). */
export function getJson<T>(url: string, source: string, signal?: AbortSignal): Promise<T> {
  return requestJson<T>(url, { source: src(source), signal });
}

// ── Akses medan opsional butir daftar ────────────────────────────────────

export function outputsOf(a: ArtifactListItem): OutputFileDto[] {
  return a.outputs ?? a.files ?? [];
}

export function chartCodeOf(a: ArtifactListItem): string | null {
  if (a.kind !== "CHART") return null;
  if (typeof a.chartCode === "string" && a.chartCode) return a.chartCode;
  const k = a.spec?.kind;
  return typeof k === "string" ? k : null;
}

/** Urutan pilihan pratinjau: SVG, PNG, lalu HTML. */
const PREVIEW_ORDER: readonly StudioOutputFormat[] = ["SVG", "PNG", "HTML"];
export function previewFileOf(files: readonly OutputFileDto[]): OutputFileDto | null {
  for (const f of PREVIEW_ORDER) {
    const hit = files.find((o) => o.format === f);
    if (hit) return hit;
  }
  return null;
}

// ── POST artefak ─────────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Isu validasi dari galat POST (larik `details`, atau `details.issues`). */
export function postIssuesOf(err: unknown): StudioIssue[] {
  if (!isStudioApiError(err)) return [];
  const direct = issuesOf(err);
  if (direct.length > 0) return direct;
  return isRecord(err.details) ? issuesOf(err.details.issues) : [];
}

/** Kode grafik alternatif untuk `CHART_KIND_NOT_DRAWN` (`details.alternatives`, juga per isu). */
export function alternativesOf(err: unknown): ChartCode[] {
  if (!isStudioApiError(err)) return [];
  const pick = (v: unknown): ChartCode[] => (Array.isArray(v) ? v.filter((x): x is ChartCode => typeof x === "string") : []);
  const d = err.details;
  if (isRecord(d) && Array.isArray(d.alternatives)) return pick(d.alternatives);
  if (Array.isArray(d)) {
    for (const it of d) if (isRecord(it) && Array.isArray(it.alternatives)) return pick(it.alternatives);
  }
  return [];
}

/**
 * POST R09. Tanpa berkas: badan JSON. Dengan berkas (hanya studio.image/v1):
 * multipart, medan `request` = amplop lengkap, medan `file` = raster.
 */
export async function postArtifact(body: ArtifactCreateRequest, file?: File | null): Promise<ArtifactCreateResponse> {
  const url = STUDIO_ROUTES.R09;
  let res: Partial<ArtifactCreateResponse> | null;
  if (file) {
    const form = new FormData();
    form.set("request", JSON.stringify(body));
    form.set("file", file, file.name);
    res = await requestJson<Partial<ArtifactCreateResponse> | null>(url, { source: src("create"), method: "POST", body: form });
  } else {
    res = await requestJson<Partial<ArtifactCreateResponse> | null>(url, { source: src("create"), method: "POST", json: body });
  }
  if (!res || typeof res !== "object" || !res.artifact) {
    throw new StudioApiError({ status: 502, code: "BAD_RESPONSE", message: "artifact missing in response", url, method: "POST" });
  }
  return { artifact: res.artifact, outputs: res.outputs ?? [], job: res.job ?? null, errors: res.errors ?? [] };
}

/** Pesan awam khusus pembuatan artefak; kode lain jatuh ke katalog bersama. */
const POST_MESSAGE: Partial<Record<string, string>> = {
  SCHEMA_INVALID: "Spesifikasi belum sesuai bentuk yang diminta. Periksa daftar masalah di bawah isian.",
  JSON_MALFORMED: "Isian spesifikasi tidak dapat dibaca. Periksa tanda kurung dan koma.",
  CHART_KIND_NOT_DRAWN: "Jenis grafik ini belum dapat digambar Studio. Pakai salah satu alternatif.",
  CHART_KIND_UNKNOWN: "Kode grafik tidak dikenal katalog.",
  "DATUM-31": "Diagram berbentuk teks Mermaid ditolak. Pakai bentuk diagram Studio.",
  "DATUM-39": "Resolusi gambar terlalu rendah untuk lebar yang diminta.",
  PAYLOAD_TOO_LARGE: "Ukuran isian atau berkas melebihi batas.",
  ASSET_TOO_LARGE: "Ukuran berkas melebihi batas.",
  ASSET_TYPE_UNSUPPORTED: "Berkas harus PNG atau JPEG.",
  BY_CONSTRUCTION_FAILED: "Spesifikasi melanggar aturan standar DATUM. Periksa daftar masalah.",
  PDF_ENGINE_UNAVAILABLE: "Pembuat PDF belum siap. Pilih format lain atau coba lagi nanti.",
};

export function postErrorMessage(err: unknown): string {
  if (isStudioApiError(err)) {
    const m = POST_MESSAGE[String(err.code)];
    if (m) return m;
    if (err.status === 403) return "Anda tidak memiliki akses untuk membuat artefak ini.";
    if (err.status === 404) return "Rujukan (misi, templat, dokumen) tidak ditemukan.";
  }
  return errorMessages(err).body;
}

/*
 * Tipe dan konstanta Alat developer Studio (SR-31; UX-01 W11; D-161).
 *
 * Empat mode kiriman v2 (blueprint 05 §2.4-§2.5, register 03 §4.5, §12):
 * - `doc`     Kirim dokumen  -> POST R04 `studio.doc/v2` (SID01)
 * - `chapter` Kirim bab      -> POST R12 `studio.chapter/v2` (SID02)
 * - `slot`    Kirim bagian   -> POST R13 `studio.slot/v2` (SID03)
 * - `asset`   Unggah aset    -> POST R18 multipart `file` (PNG/JPEG)
 *
 * Bentuk respons dari kontrak SR-04 (`SubmitResultV2`, `AssetDtoV2`,
 * `CompletenessReportV2`) dan route SR-20/SR-21/SR-25 (komentar header route):
 * - R08 -> 200 `{ valid, issues, lint, completenessPreview?, previewHtml?, previewError? }`;
 *   400 hanya `JSON_MALFORMED`. Pointer isu relatif badan (kiriman v2 tingkat atas).
 * - R04/R12/R13 -> 201 `SubmitResultV2` (200 bila `unchanged`); 400 `SCHEMA_INVALID`
 *   dengan `details` = `ValidationIssue[]` (checkId `DISPLAY_FIELD`/`V1_FIELD`).
 * - R18 -> 201 `{ asset, created: true }` / 200 `{ asset, created: false }`.
 * Tanpa sesi semua route menjawab 401 `{ error: "Unauthorized" }` (curl :9021, 2026-10-23).
 */

import type { LintReport } from "@/lib/studio/contract/engine";
import type { StudioSchemaId } from "@/lib/studio/contract/env";
import { STUDIO_ROUTES } from "@/lib/studio/contract/env";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import type { AssetDtoV2, CompletenessReportV2, SubmitResultV2 } from "@/lib/studio/contract/types/v2";

export type PlaygroundMode = "doc" | "chapter" | "slot" | "asset";
/** Mode yang mengirim JSON (bukan unggah berkas). */
export type JsonMode = Exclude<PlaygroundMode, "asset">;

export interface ModeMeta {
  mode: PlaygroundMode;
  /** Label tombol mode (W11). */
  label: string;
  /** Kalimat bantuan singkat. */
  hint: string;
  /** Skema kiriman (null untuk unggah aset). */
  schemaId: StudioSchemaId | null;
  /** Route tujuan kiriman nyata. */
  route: string;
  /** Lingkup render bila "Buat berkas" dicentang. */
  renderScope: "document" | "chapter" | "slot" | null;
}

export const MODES: readonly ModeMeta[] = [
  {
    mode: "doc",
    label: "Kirim dokumen",
    hint: "Dokumen v2 utuh atau sebagian per bagian (studio.doc/v2). Tampilan diatur templat; kiriman hanya berisi konten.",
    schemaId: "studio.doc/v2",
    route: STUDIO_ROUTES.R04,
    renderScope: "document",
  },
  {
    mode: "chapter",
    label: "Kirim bab",
    hint: "Satu bab ke dokumen misi (studio.chapter/v2). Dokumen dibuat berkerangka bila belum ada.",
    schemaId: "studio.chapter/v2",
    route: STUDIO_ROUTES.R12,
    renderScope: "chapter",
  },
  {
    mode: "slot",
    label: "Kirim bagian",
    hint: "Isi satu bagian tak-berulang, mis. Lembar kendali atau Tanda tangan (studio.slot/v2).",
    schemaId: "studio.slot/v2",
    route: STUDIO_ROUTES.R13,
    renderScope: "slot",
  },
  {
    mode: "asset",
    label: "Unggah aset",
    hint: "Gambar PNG/JPEG disimpan beralamat isi (sha256); rujuk dari kiriman lewat assetRef.",
    schemaId: null,
    route: STUDIO_ROUTES.R18,
    renderScope: null,
  },
];

export function modeMeta(mode: PlaygroundMode): ModeMeta {
  return MODES.find((m) => m.mode === mode) ?? MODES[0];
}

export function isJsonMode(mode: PlaygroundMode): mode is JsonMode {
  return mode !== "asset";
}

/** `$schema` kiriman -> mode (unggah .json). */
export function modeFromSchema(id: unknown): JsonMode | null {
  if (id === "studio.doc/v2") return "doc";
  if (id === "studio.chapter/v2") return "chapter";
  if (id === "studio.slot/v2") return "slot";
  return null;
}

/** Format berkas kiriman v2 (`RenderRequestV2.formats`, T2-10). */
export const RENDER_FORMATS = ["docx", "pdf", "html"] as const;
export type RenderFormat = (typeof RENDER_FORMATS)[number];

/** Folder misi HQ (pola yang sama dengan route R18). */
export const MISSION_FOLDER_RE = /^\d{4}-\d{2}-\d{2}[_-][a-z0-9][a-z0-9_-]{0,80}$/;

/** Isian panel yang menimpa medan JSON saat Validasi dan Kirim (kosong = ikuti JSON). */
export interface PlaygroundOverrides {
  /** Slug templat ("" = ikuti JSON). */
  templateSlug: string;
  missionFolder: string;
  docKey: string;
  /** Hanya bab/bagian: target dokumen lewat id (menggantikan target misi). */
  documentId: string;
  /** Hanya dokumen: tingkat terbitan ("" = ikuti JSON). */
  tier: string;
  agentId: string;
  /** Minta pembuatan berkas setelah kirim. */
  render: boolean;
  formats: RenderFormat[];
}

export const EMPTY_OVERRIDES: PlaygroundOverrides = {
  templateSlug: "",
  missionFolder: "",
  docKey: "",
  documentId: "",
  tier: "",
  agentId: "",
  render: false,
  formats: ["docx", "pdf"],
};

/** R08 v2. */
export interface ValidateResultV2 {
  valid: boolean;
  issues: ValidationIssue[];
  lint: LintReport | null;
  completenessPreview?: CompletenessReportV2;
  previewHtml?: string;
  previewError?: { code: string; message: string };
}

/** R18 POST. */
export interface AssetUploadResult {
  asset: AssetDtoV2;
  created: boolean;
}

export type { SubmitResultV2 };

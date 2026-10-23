/*
 * Lapis data Alat developer (SR-31). Semua permintaan lewat `requestJson`
 * bersama (FIX-4a §6.2): satu kelas galat `StudioApiError`, correlationId
 * server, dan pencatatan `client-log` dengan sumber `studio.ui.playground.*`.
 * Modul ini tidak membuat pembungkus fetch atau kelas galat sendiri
 * (menggantikan `PlaygroundApiError`/`studioPost`/`useActionGuard` S100).
 */

import { STUDIO_ROUTES } from "@/lib/studio/contract/env";
import type { TemplateSummary, ValidationIssue } from "@/lib/studio/contract/types/api";
import { isStudioApiError, requestJson, withQuery } from "@/components/studio/shared/http";
import type { AssetUploadResult, JsonMode, SubmitResultV2, ValidateResultV2 } from "./types";
import { modeMeta } from "./types";

const SRC = "playground";

/** R01: templat dokumen aktif (pemilih templat). */
export function fetchTemplates(signal: AbortSignal): Promise<{ templates: TemplateSummary[] }> {
  return requestJson(withQuery(STUDIO_ROUTES.R01, { archived: 0 }), { source: `${SRC}.templates`, signal });
}

/** R03 `kind=schema`: satu dokumen JSON Schema registri. */
export function fetchSchema(schemaId: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
  return requestJson(withQuery(STUDIO_ROUTES.R03, { kind: "schema", schemaId }), { source: `${SRC}.schema`, signal });
}

/** R08 dry-run (tanpa simpan). `preview` = minta pratinjau HTML. */
export function validateSubmission(body: unknown, preview: boolean, signal?: AbortSignal): Promise<ValidateResultV2> {
  const url = preview ? withQuery(STUDIO_ROUTES.R08, { preview: "html" }) : STUDIO_ROUTES.R08;
  return requestJson(url, { source: `${SRC}.validate`, method: "POST", json: body, signal });
}

/** Kiriman nyata R04 / R12 / R13 menurut mode. */
export function submitV2(mode: JsonMode, body: unknown, signal?: AbortSignal): Promise<SubmitResultV2> {
  return requestJson(modeMeta(mode).route, { source: `${SRC}.submit.${mode}`, method: "POST", json: body, signal });
}

/** R18 multipart `file`; `mission` opsional menautkan aset ke misi. */
export function uploadAsset(file: File, mission: string, signal?: AbortSignal): Promise<AssetUploadResult> {
  const form = new FormData();
  form.append("file", file, file.name);
  return requestJson(withQuery(STUDIO_ROUTES.R18, { mission: mission || undefined }), {
    source: `${SRC}.asset`,
    method: "POST",
    body: form,
    signal,
    logContext: { bytes: file.size, mime: file.type },
  });
}

/**
 * Isu validasi `ValidationIssue[]` (`pointer`, `keyword`, `message`,
 * `checkId?`) dari `details` galat 400/422. `issuesOf` bersama membaca bentuk
 * `{ path }`; route Studio memakai `pointer`, jadi dibaca di sini.
 */
export function validationIssuesOf(err: unknown): ValidationIssue[] {
  const d = isStudioApiError(err) ? err.details : null;
  if (!Array.isArray(d)) return [];
  return d.filter(
    (x): x is ValidationIssue =>
      typeof x === "object" &&
      x !== null &&
      typeof (x as ValidationIssue).pointer === "string" &&
      typeof (x as ValidationIssue).message === "string",
  );
}

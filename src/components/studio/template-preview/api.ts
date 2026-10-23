/**
 * Klien data pratinjau templat (S101; SR-29 memindahkannya ke `shared/http`,
 * UX-01 §6.2 — tanpa pembungkus fetch/kelas galat lokal). Bentuk respons
 * diverifikasi terhadap route nyata (2026-10-23):
 *
 * - GET  /api/studio/templates/[id]?version=n -> 200 `TemplateDetail` (`{ template, version, versions, ... }`);
 *   404 `{ error, code: "TEMPLATE_NOT_FOUND" }`.
 * - POST /api/studio/validate?preview=html, badan `{ document }` -> selalu 200
 *   `{ valid, issues, lint, previewHtml?, previewError? }`; tidak sah = `valid:false`
 *   dengan `issues[].pointer` mis. `/document/overrides/<kunci>` (+ `checkId`);
 *   400 `JSON_MALFORMED`; 413 `PAYLOAD_TOO_LARGE`.
 * - GET  /api/studio/registry?kind=params -> 200 `{ kind, count, items: ParamDef[], meta }`.
 * - FIX-V (FIX-U M5): POST /api/studio/validate?preview=html, badan kiriman `studio.doc/v2`
 *   + `draftTemplate: { template: StudioTemplateV2, base: { slug, version } }` -> 200
 *   `{ valid, issues, lint, completenessPreview, previewHtml?, previewError? }` (HTML norm/v2
 *   sadar slot; isu draf ber-pointer `/draftTemplate/template/essentials/<kunci>`).
 *   Diverifikasi terhadap route nyata (asap FIX-V B1-B6).
 */
import { requestJson, withQuery, type StudioApiError } from "@/components/studio/shared/http";
import { RETRY_DELAYS_MS } from "@/components/studio/shared/retry";
import type { TemplateDetail, ValidateResponse } from "@/lib/studio/contract/types/api";
import type { StudioDocV1 } from "@/lib/studio/contract/types/doc";
import type { ParamDef } from "@/lib/studio/contract/types/params";
import type { StudioTemplateV2 } from "@/lib/studio/contract/types/v2/template";

const SRC = "template-preview";

/** Jeda percobaan ulang manual (ms): 3 s, 6 s, 12 s; maks 3 kali (nilai bersama). */
export const PREVIEW_RETRY_DELAYS_MS = RETRY_DELAYS_MS;

/** Nama lama dipertahankan sebagai alias tipe galat bersama. */
export type PreviewApiError = StudioApiError;

/** Respons validasi beserta galat pratinjau tambahan dari route (S55). */
export type PreviewValidateResponse = ValidateResponse & { previewError?: { code: string; message: string } };

export function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

/** Slug dan nomor versi efektif templat (validate merujuk templat lewat slug). */
export async function fetchTemplateRef(
  templateId: string,
  versionNo: number | undefined,
  signal?: AbortSignal,
): Promise<{ slug: string; versionNo: number; name: string }> {
  const detail = await requestJson<TemplateDetail>(withQuery(`/api/studio/templates/${encodeURIComponent(templateId)}`, { version: versionNo }), {
    signal,
    source: `${SRC}.template-ref`,
  });
  return { slug: detail.template.slug, versionNo: detail.version.versionNo, name: detail.template.name };
}

/** Dry-run validasi + pratinjau HTML; tidak menyimpan apa pun. */
export function postValidatePreview(
  document: StudioDocV1,
  signal?: AbortSignal,
  roleFormats?: Readonly<Record<string, unknown>>,
): Promise<PreviewValidateResponse> {
  return requestJson<PreviewValidateResponse>("/api/studio/validate?preview=html", {
    method: "POST",
    json: roleFormats ? { document, roleFormats } : { document },
    signal,
    source: `${SRC}.validate`,
  });
}

/**
 * Dukungan medan opsional `roleFormats` di badan validate (IP-10, F-028).
 * Server lama menolak medan tingkat atas yang tidak dikenal dengan isu
 * `additionalProperties` ber-pointer "" yang menyebut "roleFormats"; itu
 * ditandai "no" untuk sisa sesi halaman dan permintaan diulang tanpa medan itu.
 */
let roleFormatsSupport: "unknown" | "yes" | "no" = "unknown";

export function isRoleFormatsRejected(res: PreviewValidateResponse): boolean {
  return (
    !res.valid &&
    res.issues.some((i) => i.pointer === "" && i.keyword === "additionalProperties" && i.message.includes('"roleFormats"'))
  );
}

export interface RoleAwarePreview {
  data: PreviewValidateResponse;
  /** true bila server menerima dan menerapkan `roleFormats` draf. */
  roleFormatsApplied: boolean;
}

/**
 * Dry-run dengan format peran draf bila ada dan didukung server; bila server
 * belum mendukungnya, hasil tanpa format peran draf (`roleFormatsApplied=false`).
 */
export async function postValidatePreviewWithRoles(
  document: StudioDocV1,
  roleFormats: Readonly<Record<string, unknown>> | undefined,
  signal?: AbortSignal,
): Promise<RoleAwarePreview> {
  const hasRoles = !!roleFormats && Object.keys(roleFormats).length > 0;
  if (!hasRoles || roleFormatsSupport === "no") {
    return { data: await postValidatePreview(document, signal), roleFormatsApplied: false };
  }
  const data = await postValidatePreview(document, signal, roleFormats);
  if (isRoleFormatsRejected(data)) {
    roleFormatsSupport = "no";
    return { data: await postValidatePreview(document, signal), roleFormatsApplied: false };
  }
  roleFormatsSupport = "yes";
  return { data, roleFormatsApplied: true };
}

/** Draf templat v2 yang dikirim ke R08 (`draftTemplate`). */
export interface DraftTemplateBody {
  template: StudioTemplateV2;
  base: { slug: string; version?: number };
}

/**
 * FIX-V: dry-run dokumen contoh `studio.doc/v2` dengan draf templat (preset + esensial +
 * lanjutan ADMIN + kerangka) + pratinjau HTML norm/v2; tidak menyimpan apa pun.
 */
export function postValidatePreviewV2(document: Readonly<Record<string, unknown>>, draftTemplate: DraftTemplateBody, signal?: AbortSignal): Promise<PreviewValidateResponse> {
  return requestJson<PreviewValidateResponse>("/api/studio/validate?preview=html", {
    method: "POST",
    json: { ...document, draftTemplate },
    signal,
    source: `${SRC}.validate-v2`,
  });
}

/** Registri parameter (katalog + renderer + struktur) untuk pencarian/pengelompokan. */
export async function fetchParamRegistry(signal?: AbortSignal): Promise<readonly ParamDef[]> {
  const body = await requestJson<{ items?: unknown }>("/api/studio/registry?kind=params", { signal, source: `${SRC}.params` });
  return Array.isArray(body.items) ? (body.items as ParamDef[]) : [];
}

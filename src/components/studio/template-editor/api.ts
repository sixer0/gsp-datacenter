/**
 * Klien API editor templat (SR-29; UX-01 §3a, §6.2). Semua permintaan lewat
 * `shared/http` (satu `requestJson`, satu `StudioApiError`, log klien
 * `studio.ui.template-editor.<sumber>`); modul ini tidak membuat pembungkus
 * fetch atau kelas galat sendiri.
 *
 * Bentuk respons (register `03_structural_sections_specs.md` §12; route dibaca 2026-10-23):
 * - R01 GET  `/api/studio/templates?archived=0` -> `{ templates: TemplateSummary & { isPreset, restricted, releasedChecks } }`
 * - R01 POST v2 `{ slug, name, kind, description?, changeNote, template: StudioTemplateV2 }` -> 201 `{ template, version, skeletonSha256 }`
 * - R02 GET  `/api/studio/templates/[id]?version=n` -> `{ template, version, versions, definition, skeletonSha256, implicit, advancedIncluded }`
 *   (SR-61; non-ADMIN: definisi tanpa lanjutan/roleFormats, `version.resolvedParams` tetap = nilai efektif baca saja;
 *   `definition` null -> klien menurunkan dari `version.overrides` + R19, lihat `model.ts`)
 * - R02 POST v2 `{ baseVersionNo, changeNote, template }` -> 201 `{ template, version, skeletonSha256 }` (v1 datar hanya ADMIN: 403 `V1_FLAT_ADMIN_ONLY`)
 * - R03 GET  `?kind=presets` -> `{ items: PresetItem[] }`; `?kind=essentials` -> `{ items, global, bySectionType }`;
 *   `?kind=params` -> `{ items: ParamDef[] }`; `?kind=roles` -> `{ items }`
 * - R19 GET  `/api/studio/templates/[id]/skeleton?version=n` -> `{ skeleton: StudioSkeletonV1, skeletonSha256, implicit }` (SR-26)
 */
import { isStudioApiError, requestJson, withQuery } from "@/components/studio/shared/http";
import type { StudioTemplateKind } from "@/lib/studio/contract/enums";
import type { TemplateSummary, TemplateVersionDto, VersionSummary } from "@/lib/studio/contract/types/api";
import type { ParamDef } from "@/lib/studio/contract/types/params";
import type { EssentialKnobDef, StudioSkeletonV1, StudioTemplateV2 } from "@/lib/studio/contract/types/v2/template";

const SRC = "template-editor";
const REGISTRY = "/api/studio/registry";

/** Medan tambahan R01/R02 (SR-07/SR-61): preset gaya + status terbatas D-98. Opsional agar respons lama tetap terbaca. */
export interface TemplateAccessFields {
  isPreset?: boolean;
  restricted?: boolean;
  releasedChecks?: string[];
}

export type TemplateListItem = TemplateSummary & TemplateAccessFields;

export type TemplateVersionV2 = TemplateVersionDto & TemplateAccessFields & { skeletonSha256?: string | null };

export interface TemplateDetailV2 {
  template: TemplateListItem;
  version: TemplateVersionV2;
  versions: VersionSummary[];
  /** R02 v2 (SR-61): non-ADMIN hanya preset + esensial + kerangka. null/tidak ada = versi lama tanpa definisi. */
  definition?: StudioTemplateV2 | null;
  skeletonSha256?: string | null;
  implicit?: boolean;
  /** Lapis lanjutan + roleFormats ikut (ADMIN). */
  advancedIncluded?: boolean;
}

/** R03 `kind=presets` (SR-27). */
export interface PresetItem {
  id: string;
  slug: string;
  name: string;
  kind: StudioTemplateKind;
  description: string | null;
  isCanonical: boolean;
  isPreset: true;
  restricted: boolean;
  latestVersionNo: number;
  updatedAt: string;
}

/** R03 `kind=essentials`: `EssentialKnobDef` + medan penjelas SR-05 (`help`, `mapping`, ...). */
export interface EssentialKnob extends EssentialKnobDef {
  help?: string;
  mapping?: "langsung" | "petaNilai" | "anggota" | "turunan" | "medan";
  field?: string;
  member?: string;
  multiple?: boolean;
  range?: { min?: number; max?: number; step?: number };
}

export interface EssentialsResponse {
  items: EssentialKnob[];
  global: EssentialKnob[];
  bySectionType: Record<string, EssentialKnob[]>;
}

export interface SkeletonResponse {
  skeleton: StudioSkeletonV1;
  skeletonSha256?: string;
  implicit?: boolean;
}

export interface CreateTemplateV2Body {
  slug: string;
  name: string;
  kind: StudioTemplateKind;
  description?: string;
  changeNote: string;
  template: StudioTemplateV2;
}

export interface SaveTemplateV2Body {
  baseVersionNo: number;
  changeNote: string;
  template: StudioTemplateV2;
}

export interface SaveResult {
  template?: TemplateListItem;
  version: TemplateVersionDto;
  skeletonSha256?: string;
}

const tplUrl = (id: string) => `/api/studio/templates/${encodeURIComponent(id)}`;

// ── R01 ──────────────────────────────────────────────────────────────────

export function listTemplates(signal?: AbortSignal) {
  return requestJson<{ templates: TemplateListItem[] }>(withQuery("/api/studio/templates", { archived: 0 }), {
    signal,
    source: `${SRC}.list`,
  });
}

export function createTemplateV2(body: CreateTemplateV2Body) {
  return requestJson<SaveResult & { template: TemplateListItem }>("/api/studio/templates", {
    method: "POST",
    json: body,
    source: `${SRC}.create`,
    logContext: { preset: body.template.preset?.slug ?? null },
  });
}

/** Impor profil JSON (bentuk template.json S95); server menolak non-ADMINISTRATOR. */
export function importProfile(profile: unknown) {
  return requestJson<{ template: TemplateListItem; version: TemplateVersionDto }>(withQuery("/api/studio/templates", { import: "profile" }), {
    method: "POST",
    json: profile,
    source: `${SRC}.import`,
  });
}

// ── R02 ──────────────────────────────────────────────────────────────────

/** `id` boleh id atau slug (layanan `getTemplate` menerima keduanya). */
export function getTemplateDetail(id: string, versionNo?: number, signal?: AbortSignal) {
  return requestJson<TemplateDetailV2>(withQuery(tplUrl(id), { version: versionNo }), {
    signal,
    source: `${SRC}.detail`,
    logContext: { templateId: id, versionNo: versionNo ?? null },
  });
}

export function saveTemplateVersionV2(id: string, body: SaveTemplateV2Body) {
  return requestJson<SaveResult>(tplUrl(id), {
    method: "POST",
    json: body,
    source: `${SRC}.save`,
    logContext: { templateId: id, baseVersionNo: body.baseVersionNo },
  });
}

// ── R19 ──────────────────────────────────────────────────────────────────

/** Kerangka versi; 404/405 (route belum ada) diredam: pemanggil memakai cadangan. */
export async function getSkeleton(id: string, versionNo?: number, signal?: AbortSignal): Promise<SkeletonResponse | null> {
  try {
    return await requestJson<SkeletonResponse>(withQuery(`${tplUrl(id)}/skeleton`, { version: versionNo }), {
      signal,
      source: `${SRC}.skeleton`,
      quietStatuses: [404, 405],
    });
  } catch (e) {
    if (isStudioApiError(e) && (e.status === 404 || e.status === 405)) return null;
    throw e;
  }
}

// ── R03 ──────────────────────────────────────────────────────────────────

export function listPresets(signal?: AbortSignal) {
  return requestJson<{ items: PresetItem[] }>(withQuery(REGISTRY, { kind: "presets" }), { signal, source: `${SRC}.presets` });
}

export function getEssentials(signal?: AbortSignal) {
  return requestJson<EssentialsResponse>(withQuery(REGISTRY, { kind: "essentials" }), { signal, source: `${SRC}.essentials` });
}

export async function getParamRegistry(signal?: AbortSignal): Promise<ParamDef[]> {
  const r = await requestJson<{ items?: unknown }>(withQuery(REGISTRY, { kind: "params" }), { signal, source: `${SRC}.params` });
  return Array.isArray(r.items) ? (r.items as ParamDef[]) : [];
}

/** Label peran dari `?kind=roles` (item bebas: string atau objek ber-`key`). */
export async function getRoleLabels(signal?: AbortSignal): Promise<Record<string, string>> {
  const r = await requestJson<{ items?: unknown }>(withQuery(REGISTRY, { kind: "roles" }), { signal, source: `${SRC}.roles` });
  const out: Record<string, string> = {};
  for (const it of Array.isArray(r.items) ? r.items : []) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const key = [o.key, o.roleKey, o.role].find((x) => typeof x === "string") as string | undefined;
    const label = [o.label, o.description, o.isi, o.name].find((x) => typeof x === "string") as string | undefined;
    if (key && label) out[key] = label;
  }
  return out;
}

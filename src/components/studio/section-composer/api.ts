/**
 * Klien API Susunan dokumen (SR-28; UX-01 W4, alur 3a langkah 3-4) untuk
 * sumber yang KHUSUS layar ini. Templat (R02 GET/POST gabungan, D-163 T-2) dan
 * kerangka (R19 GET) memakai klien bersama editor templat
 * (`template-editor/api.ts`, SR-29) agar satu "Simpan versi" mengirim satu
 * `studio.template/v2`. Semua permintaan lewat `shared/http` (`requestJson`,
 * satu `StudioApiError`, correlationId + client-log otomatis).
 *
 * Bentuk respons diketik dari route (dibaca 2026-10-23; curl :9021 tanpa
 * sesi -> 401 `{ error: "Unauthorized" }` untuk semua path di bawah):
 * - R03 GET `?kind=slots` -> `{ kind, count, items: SlotKindDef[], meta }`;
 *   `?kind=essentials` -> `{ kind, count, items, global, bySectionType, meta }`;
 *   `?kind=paramScopes&sectionType=&surface=advanced` -> `{ items: {id,key,class,scope,surface}[] }`
 *   (`src/app/api/studio/registry/route.ts` essentialsPayload/slotsPayload/paramScopesPayload).
 * - R08 POST `{ schemaId: "studio.skeleton/v1", spec }` -> 200 `{ valid, issues, lint: null }`
 *   (validasi skema saja, tanpa simpan; `validate/route.ts` cabang `validateSchema`).
 */
import { requestJson, withQuery } from "@/components/studio/shared/http";
import { studioRoutePath } from "@/lib/studio/contract/env";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import type { StudioSkeletonV1 } from "@/lib/studio/contract/types/v2/template";
import type { EssentialKnobSpec } from "@/lib/studio/registry/essentials";
import type { SlotKindDef } from "@/lib/studio/registry/slots";

const MODULE = "section-composer";

export type { EssentialKnobSpec, SlotKindDef };

interface RegistryEnvelope<T> {
  kind: string;
  count?: number;
  items: T[];
}

export async function getSlotKinds(signal?: AbortSignal): Promise<readonly SlotKindDef[]> {
  const r = await requestJson<RegistryEnvelope<SlotKindDef>>(withQuery(studioRoutePath("R03"), { kind: "slots" }), {
    source: `${MODULE}.section-kinds`,
    signal,
  });
  return Array.isArray(r?.items) ? r.items : [];
}

export interface EssentialsCatalog {
  global: readonly EssentialKnobSpec[];
  bySectionType: Readonly<Record<string, readonly EssentialKnobSpec[]>>;
}

export async function getEssentials(signal?: AbortSignal): Promise<EssentialsCatalog> {
  const r = await requestJson<RegistryEnvelope<EssentialKnobSpec> & Partial<EssentialsCatalog>>(
    withQuery(studioRoutePath("R03"), { kind: "essentials" }),
    { source: `${MODULE}.essentials`, signal },
  );
  return { global: r?.global ?? [], bySectionType: r?.bySectionType ?? {} };
}

export interface AdvancedKeyDef {
  id: string;
  key: string;
  class: "B" | "K" | "T";
  scope: string;
  surface: string | null;
}

/** Kunci lanjutan yang sah untuk bagian berjenis `sectionType` (ADMIN); kelas T (dihitung) dibuang. */
export async function getAdvancedKeys(sectionType: string, signal?: AbortSignal): Promise<readonly AdvancedKeyDef[]> {
  const r = await requestJson<RegistryEnvelope<AdvancedKeyDef>>(
    withQuery(studioRoutePath("R03"), { kind: "paramScopes", sectionType, surface: "advanced" }),
    { source: `${MODULE}.advanced-keys`, signal },
  );
  return Array.isArray(r?.items) ? r.items.filter((p) => p.class !== "T") : [];
}

export interface RemoteCheck {
  valid: boolean;
  issues: ValidationIssue[];
}

/** Pemeriksaan susunan di server (R08, validasi bentuk tanpa simpan). */
export async function checkSkeletonRemote(skeleton: StudioSkeletonV1, signal?: AbortSignal): Promise<RemoteCheck> {
  const r = await requestJson<RemoteCheck>(studioRoutePath("R08"), {
    source: `${MODULE}.structure-check`,
    method: "POST",
    json: { schemaId: "studio.skeleton/v1", spec: skeleton },
    signal,
  });
  return { valid: r?.valid === true, issues: Array.isArray(r?.issues) ? r.issues : [] };
}

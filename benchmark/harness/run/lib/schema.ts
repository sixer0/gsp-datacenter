/**
 * SR-34: versi skema masukan benchmark (v1 / v2) dan kesiapan seam v2.
 *
 * - Deteksi murni (tanpa I/O): `$schema` dokumen (`studio.doc/v1`,
 *   `studio.doc/v2`) dan bentuk berkas templat (`studio.template/v2` atau
 *   profil v1 S95 `{ base, meta, ... }`).
 * - Kesiapan seam v2 (impor dinamis, tanpa menulis apa pun): skema
 *   `studio.doc/v2` terdaftar di kontrak (SR-04) dan pemuat templat v2 tanpa DB
 *   diekspor layanan templat (SR-07). Seam yang belum ada membuat langkah
 *   ingest NOT_READY (exit 1), bukan crash dan bukan diam-diam memakai jalur v1.
 */

export type DocSchemaId = "studio.doc/v1" | "studio.doc/v2";
/** `template-profile/v1` = profil templat S95 (`benchmark/manual000/template.json`). */
export type TemplateSchemaId = "template-profile/v1" | "studio.template/v2";
export type SchemaVersion = "v1" | "v2";

export const DOC_SCHEMA_IDS: readonly DocSchemaId[] = ["studio.doc/v1", "studio.doc/v2"];
export const TEMPLATE_V2_SCHEMA_ID = "studio.template/v2";

/**
 * Nama ekspor pemuat templat v2 tanpa DB yang dicari di
 * `src/lib/studio/services/templates` (seam SR-07; diajukan lewat
 * `file_requests.md`). Tanda tangan yang diharapkan sama dengan
 * `loadResolvedProfileFile`: `(filePath, { repoRoot }) => Promise<{ template: ResolvedTemplate; slug?: string; ... }>`.
 */
export const TEMPLATE_V2_LOADER_EXPORT = "loadResolvedTemplateV2File";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** `$schema` dokumen benchmark; null bila bukan doc v1/v2 yang dikenal. */
export function detectDocSchema(data: unknown): DocSchemaId | null {
  if (!isRecord(data)) return null;
  const s = data.$schema;
  return typeof s === "string" && (DOC_SCHEMA_IDS as readonly string[]).includes(s) ? (s as DocSchemaId) : null;
}

/**
 * Bentuk berkas templat: `studio.template/v2` (medan `schema`, atau `$schema`)
 * atau profil v1 S95 (objek tanpa penanda v2). null bila bukan objek JSON.
 */
export function detectTemplateSchema(data: unknown): TemplateSchemaId | null {
  if (!isRecord(data)) return null;
  if (data.schema === TEMPLATE_V2_SCHEMA_ID || data.$schema === TEMPLATE_V2_SCHEMA_ID) return "studio.template/v2";
  return "template-profile/v1";
}

export function versionOfDoc(id: DocSchemaId): SchemaVersion {
  return id === "studio.doc/v2" ? "v2" : "v1";
}

export function versionOfTemplate(id: TemplateSchemaId): SchemaVersion {
  return id === "studio.template/v2" ? "v2" : "v1";
}

/** Seam v2 yang belum tersedia di repo (dilaporkan sebagai modul NOT_READY). */
export interface V2Seam {
  module: string;
  owner: string;
  message: string;
}

/** Skema `studio.doc/v2` sudah terdaftar di `STUDIO_JSON_SCHEMAS` kontrak (SR-04)? */
export async function docV2SchemaRegistered(): Promise<boolean> {
  const contract = await import("../../../../src/lib/studio/contract");
  return Object.prototype.hasOwnProperty.call(contract.STUDIO_JSON_SCHEMAS, "studio.doc/v2");
}

export const DOC_V2_SEAM: V2Seam = {
  module: "contract/schema studio.doc/v2 + services/ingest dispatch v2",
  owner: "SR-04, SR-12",
  message: "skema studio.doc/v2 belum terdaftar di kontrak (STUDIO_JSON_SCHEMAS); ingest v2 belum tersedia",
};

export const TEMPLATE_V2_SEAM: V2Seam = {
  module: `services/templates ${TEMPLATE_V2_LOADER_EXPORT}`,
  owner: "SR-07",
  message: `pemuat templat studio.template/v2 tanpa DB (${TEMPLATE_V2_LOADER_EXPORT}) belum diekspor services/templates`,
};

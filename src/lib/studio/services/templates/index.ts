/**
 * Layanan templat (I39, 01_specs.md §1.2 M01-M02, §5.5, §6.2 R01-R02, §8.2; baris S49).
 *
 * - Versi TAK BERUBAH: setiap simpan = versi baru (`versionNo` berikutnya),
 *   versi lama tidak pernah disunting. Penomoran dalam transaksi Prisma dengan
 *   kunci optimistik `latestVersionNo` (409 VERSION_CONFLICT); unik
 *   `(templateId, versionNo)` penjaga terakhir.
 * - Pewarisan: default registri (profil DATUM-kanonik, slug `datum-kanonik`)
 *   <- overrides rantai `baseVersionId` <- overrides versi; kelas T dihitung
 *   ulang mesin token (S11) dan hanya disimpan di `resolvedParams`.
 * - Hak: kelas K hanya ADMIN_SESSION (KT-16) lewat `assertOverrideRights`
 *   (S11); untuk versi baru hanya kunci yang BERUBAH yang diperiksa.
 * - Validasi kunci terhadap registri: parameter, peran, section, tier (0 kunci asing).
 * - Galat: `StudioEngineError` berkode (route memetakan via `studioErrorFrom`);
 *   setiap jalur galat dicatat ke log JSONL tahan-restart (`log.ts`).
 * - SR-07 (`studio.template/v2`, D-163 T-2): satu simpan = templat/versi +
 *   `baseVersionId` preset + esensial + lanjutan (ADMIN) + kerangka M10-M12 +
 *   `skeletonSha256` dalam SATU transaksi; `isPreset` + 403 PRESET_READONLY;
 *   403 PARAM_SURFACE_FORBIDDEN per kenop (D-170/D-171); impor profil membawa
 *   kerangka; `loadResolvedTemplateV2File` (tanpa DB) untuk runner benchmark.
 */
import { randomUUID } from "node:crypto";
import { Prisma, type StudioTemplate, type StudioTemplateVersion } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateTemplateInput,
  CreateTemplateVersionInput,
  ParamValue,
  ResolvedTemplate,
  RoleFormatMap,
  SectionPlan,
  StudioCaller,
  StudioTemplateKind,
  StudioTemplateV2,
  TemplateDetail,
  TemplateListQuery,
  TemplateProvenance,
  TemplateSlotDef,
  TemplateSummary,
  TemplateVersionDto,
  VersionSummary,
} from "../../contract";
import { STUDIO_TEMPLATE_KINDS } from "../../contract/enums";
import { StudioEngineError } from "../../contract/errors";
import { assertOverrideRights, resolveParams } from "../../engine/tokens";
import { ALL_PARAMS, CATALOG_PARAMS } from "../../params";
import { assertTemplateUsable, isAdminCaller, type TemplateAccessOptions, type TemplateRestriction, templateRestriction } from "./access";
import { resolveRepoAssetPath, scanCanonicalAssets } from "./assets";
import { type ReadProfileOptions, readTemplateProfileFile } from "./import";
import { templatesLog } from "./log";
import {
  canonicalSectionPlan,
  canonicalVersionPayload,
  changedOverrides,
  composeVersion,
  DATUM_CANONICAL_SLUG,
  foldOverrides,
  isPlainObject,
  type ParamRecord,
  type ParsedTemplateProfile,
  sha256Hex,
  stableStringify,
  TEMPLATE_BASE_CHAIN_MAX,
  TEMPLATE_NAME_MAX,
  TEMPLATE_SLUG_MAX,
  TEMPLATE_SLUG_RE,
  type TemplateAssets,
  throwIssues,
  toResolvedTemplate,
  validateOverrideKeys,
  validateRoleFormats,
  type VersionPayload,
  versionContentDigest,
} from "./profile";
import {
  checkTemplateWrite,
  flattenSlotParams,
  getSkeleton,
  type ParamChange,
  skeletonSha256 as skeletonShaOfSlotsRaw,
  validateSkeleton,
  writeSkeleton as writeSkeletonRows,
} from "../skeleton";
import {
  assertAdminOnlyFields,
  assertTemplateLayerKeys,
  carryHiddenForNonAdmin,
  diffEffective,
  layerToSurfaces,
  ownRoleFormats,
  parseTemplateV2,
  sanitizeStoredLayer,
  templateLayerOf,
  throwSchemaIssues,
} from "./v2";

export * from "./profile";
export { essentialProjection, layerToSurfaces, parseTemplateV2, splitBySurface, surfaceOfKey, TEMPLATE_V2_SCHEMA } from "./v2";
export {
  assertTemplateUsable,
  isAdminCaller,
  isTrustedCaller,
  TEMPLATE_RESTRICTED_DENIED,
  templateRestriction,
  type TemplateAccessOptions,
  type TemplateRestriction,
} from "./access";
export { CANONICAL_ASSET_DIR, resolveRepoAssetPath, scanCanonicalAssets } from "./assets";
export {
  loadResolvedProfileFile,
  loadResolvedTemplateV2File,
  readTemplateProfileFile,
  type LoadTemplateV2Options,
  type LoadTemplateV2Result,
  type ReadProfileOptions,
} from "./import";
export { setTemplatesLogSink, templatesLog, type TemplatesLogEntry, type TemplatesLogSink } from "./log";

const CHANGE_NOTE_MAX = 4000;

/**
 * DTO kontrak + status terbatas terhitung D-98 (`restricted`, `releasedChecks`)
 * agar UI/daftar dapat menandai templat yang hanya untuk ADMINISTRATOR/harness.
 * Subtipe struktural: tetap dapat dipakai sebagai `TemplateSummary`/`TemplateVersionDto`.
 */
export type TemplateSummaryAccess = TemplateSummary & TemplateRestriction & {
  /** SR-07 MX01: preset gaya (hanya ADMIN yang membuat versi). */
  isPreset: boolean;
};
export type TemplateVersionDtoAccess = TemplateVersionDto & TemplateRestriction & {
  /** SR-07 MX02: null = versi lama, kerangka implisit. */
  skeletonSha256: string | null;
};
export type TemplateDetailAccess = TemplateDetail & { template: TemplateSummaryAccess; version: TemplateVersionDtoAccess };

/** R01 GET (SR-07): `preset` true = hanya preset, false = tanpa preset, tak diisi = semua. */
export type TemplateListQueryV2 = TemplateListQuery & { preset?: boolean };

// ── Pemetaan baris -> DTO ────────────────────────────────────────────────

/** Ringkasan templat + status terbatas D-98 versi terbaru (`latest` = versi `latestVersionNo`). */
function toSummary(t: StudioTemplate, latest: Pick<StudioTemplateVersion, "resolvedParams"> | null): TemplateSummaryAccess {
  return {
    ...templateRestriction(latest ? (latest.resolvedParams as unknown as ParamRecord) : null),
    id: t.id,
    slug: t.slug,
    name: t.name,
    kind: t.kind,
    description: t.description,
    isCanonical: t.isCanonical,
    isPreset: t.isPreset,
    archived: t.archived,
    latestVersionNo: t.latestVersionNo,
    createdBy: t.createdBy,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

type VersionSummaryRow = Pick<
  StudioTemplateVersion,
  "id" | "templateId" | "versionNo" | "baseVersionId" | "paramsSha256" | "changeNote" | "createdBy" | "createdAt"
>;

const VERSION_SUMMARY_SELECT = {
  id: true,
  templateId: true,
  versionNo: true,
  baseVersionId: true,
  paramsSha256: true,
  changeNote: true,
  createdBy: true,
  createdAt: true,
} as const;

function toVersionSummary(v: VersionSummaryRow): VersionSummary {
  return {
    id: v.id,
    templateId: v.templateId,
    versionNo: v.versionNo,
    baseVersionId: v.baseVersionId,
    paramsSha256: v.paramsSha256,
    changeNote: v.changeNote,
    createdBy: v.createdBy,
    createdAt: v.createdAt.toISOString(),
  };
}

function overridesOf(v: Pick<StudioTemplateVersion, "overrides">): ParamRecord {
  return isPlainObject(v.overrides) ? (v.overrides as unknown as ParamRecord) : {};
}

function toVersionDto(v: StudioTemplateVersion): TemplateVersionDtoAccess {
  return {
    ...toVersionSummary(v),
    ...templateRestriction(isPlainObject(v.resolvedParams) ? (v.resolvedParams as unknown as ParamRecord) : null),
    overrides: overridesOf(v),
    resolvedParams: v.resolvedParams as unknown as Record<string, ParamValue>,
    roleFormats: v.roleFormats as unknown as RoleFormatMap,
    sectionPlan: v.sectionPlan as unknown as SectionPlan,
    assets: v.assets as unknown as TemplateAssets,
    provenance: v.provenance as unknown as TemplateProvenance,
    skeletonSha256: v.skeletonSha256 ?? null,
  };
}

function asJson(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}

// ── Log dan galat ────────────────────────────────────────────────────────

/**
 * Jalankan operasi layanan dengan korelasi; galat dicatat (warn untuk galat
 * kontrak berkode, error + stack untuk galat tak terduga) lalu dilempar ulang.
 */
async function runOp<T>(op: string, context: Record<string, unknown>, fn: (cid: string) => Promise<T>): Promise<T> {
  const cid = randomUUID();
  try {
    return await fn(cid);
  } catch (err) {
    const mapped = mapPrismaError(err);
    if (mapped instanceof StudioEngineError) {
      templatesLog({ level: "warn", message: `${op}: ${mapped.message}`, code: mapped.code, correlationId: cid, context: { op, ...context } });
      throw mapped;
    }
    const e = mapped as Error;
    templatesLog({
      level: "error",
      message: `${op}: galat tak terduga`,
      code: "INTERNAL",
      correlationId: cid,
      stack_trace: e instanceof Error ? e.stack : undefined,
      context: { op, ...context, error: e instanceof Error ? e.message : String(e) },
    });
    throw mapped;
  }
}

function mapPrismaError(err: unknown): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const target = JSON.stringify(err.meta?.target ?? "");
    if (err.code === "P2002" && target.includes("slug")) {
      return new StudioEngineError("TEMPLATE_SLUG_EXISTS", "Slug templat sudah dipakai");
    }
    if (err.code === "P2002" && target.includes("versionNo")) {
      return new StudioEngineError("VERSION_CONFLICT", "Nomor versi templat sudah dipakai (simpan bersamaan)");
    }
    if (err.code === "P2025") return new StudioEngineError("TEMPLATE_NOT_FOUND", "Templat tidak ditemukan");
  }
  return err;
}

// ── Validasi masukan ─────────────────────────────────────────────────────

function assertCaller(caller: StudioCaller): void {
  if (!caller || typeof caller.requester !== "string" || caller.requester.length === 0) {
    throw new StudioEngineError("UNAUTHORIZED", "Pemanggil tidak dikenal");
  }
}

function assertChangeNote(note: unknown): string {
  if (typeof note !== "string" || note.trim().length === 0) {
    throw new StudioEngineError("CHANGE_NOTE_REQUIRED", "Versi templat wajib memiliki catatan perubahan");
  }
  if (note.length > CHANGE_NOTE_MAX) {
    throwIssues([{ key: "changeNote", code: "SCHEMA_INVALID", message: `changeNote maks ${CHANGE_NOTE_MAX} karakter`, pointer: "/changeNote" }]);
  }
  return note.trim();
}

function assertSlug(slug: unknown): string {
  if (typeof slug !== "string" || slug.length > TEMPLATE_SLUG_MAX || !TEMPLATE_SLUG_RE.test(slug)) {
    throwIssues([
      { key: "slug", code: "SCHEMA_INVALID", message: `slug harus ^[a-z0-9]+(-[a-z0-9]+)*$ maks ${TEMPLATE_SLUG_MAX}`, pointer: "/slug" },
    ]);
  }
  return slug;
}

function assertIdentity(input: { name?: unknown; kind?: unknown; description?: unknown }): void {
  const issues = [];
  if (typeof input.name !== "string" || input.name.trim().length === 0 || input.name.length > TEMPLATE_NAME_MAX) {
    issues.push({ key: "name", code: "SCHEMA_INVALID" as const, message: `name wajib, maks ${TEMPLATE_NAME_MAX} karakter`, pointer: "/name" });
  }
  if (typeof input.kind !== "string" || !(STUDIO_TEMPLATE_KINDS as readonly string[]).includes(input.kind)) {
    issues.push({ key: "kind", code: "SCHEMA_INVALID" as const, message: `kind harus salah satu dari ${STUDIO_TEMPLATE_KINDS.join(", ")}`, pointer: "/kind" });
  }
  if (input.description !== undefined && input.description !== null && typeof input.description !== "string") {
    issues.push({ key: "description", code: "SCHEMA_INVALID" as const, message: "description harus string", pointer: "/description" });
  }
  if (issues.length > 0) throwIssues(issues, "Templat tidak sah");
}

/** §13.5 langkah 1 (EC13): versi templat `isPreset` hanya oleh ADMIN. */
function assertPresetWritable(t: Pick<StudioTemplate, "id" | "slug" | "isPreset">, caller: StudioCaller): void {
  if (t.isPreset && !isAdminCaller(caller)) {
    throw new StudioEngineError("PRESET_READONLY", `Preset gaya ${t.slug} hanya dapat diubah peran ADMINISTRATOR`, { templateSlug: t.slug, templateId: t.id });
  }
}

function assertOverridesObject(o: unknown): ParamRecord {
  if (!isPlainObject(o)) {
    throwIssues([{ key: "overrides", code: "SCHEMA_INVALID", message: "overrides wajib objek kunci -> nilai", pointer: "/overrides" }]);
  }
  return o as ParamRecord;
}

// ── Akses DB ─────────────────────────────────────────────────────────────

/** Klien DB: `prisma` global atau klien transaksi (SR-07: baca + tulis v2 dalam satu transaksi). */
type Db = Prisma.TransactionClient;

/** Batas waktu transaksi simpan v2 (templat + versi + hingga 32 slot bersarang). */
const TEMPLATE_V2_TX_TIMEOUT_MS = 20_000;

async function findTemplate(idOrSlug: string, db: Db = prisma): Promise<StudioTemplate> {
  if (typeof idOrSlug !== "string" || idOrSlug.length === 0 || idOrSlug.length > 200) {
    throw new StudioEngineError("TEMPLATE_NOT_FOUND", "Templat tidak ditemukan");
  }
  const t = await db.studioTemplate.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } });
  if (!t) throw new StudioEngineError("TEMPLATE_NOT_FOUND", `Templat tidak ditemukan: ${idOrSlug}`);
  return t;
}

async function findVersion(t: StudioTemplate, versionNo?: number, db: Db = prisma): Promise<StudioTemplateVersion> {
  const no = versionNo ?? t.latestVersionNo;
  if (!Number.isInteger(no) || no < 1) {
    throw new StudioEngineError("TEMPLATE_NOT_FOUND", `Versi templat ${t.slug} tidak sah: ${String(versionNo)}`);
  }
  const v = await db.studioTemplateVersion.findUnique({ where: { templateId_versionNo: { templateId: t.id, versionNo: no } } });
  if (!v) throw new StudioEngineError("TEMPLATE_NOT_FOUND", `Versi ${no} templat ${t.slug} tidak ada`);
  return v;
}

interface BaseLayer {
  baseVersionId: string | null;
  baseOverrides: ParamRecord;
  roleFormats: RoleFormatMap;
  sectionPlan: SectionPlan;
  assets: TemplateAssets;
}

/** Lapisan dasar dari versi dasar: overrides rantai (akar -> versi dasar), peran/rencana/aset efektif versi dasar. */
async function baseLayerFor(baseVersionId: string | null, db: Db = prisma): Promise<BaseLayer> {
  if (!baseVersionId) {
    return { baseVersionId: null, baseOverrides: {}, roleFormats: {}, sectionPlan: canonicalSectionPlan(), assets: {} };
  }
  const base = await db.studioTemplateVersion.findUnique({ where: { id: baseVersionId } });
  if (!base) throw new StudioEngineError("TEMPLATE_NOT_FOUND", `Versi dasar templat tidak ditemukan: ${baseVersionId}`);
  const chain: ParamRecord[] = [overridesOf(base)];
  const visited = new Set([base.id]);
  let next = base.baseVersionId;
  while (next) {
    if (visited.has(next) || visited.size >= TEMPLATE_BASE_CHAIN_MAX) {
      throw new StudioEngineError("SCHEMA_INVALID", `Rantai versi dasar templat melingkar atau lebih dari ${TEMPLATE_BASE_CHAIN_MAX}`);
    }
    visited.add(next);
    const v = await db.studioTemplateVersion.findUnique({ where: { id: next }, select: { id: true, baseVersionId: true, overrides: true } });
    if (!v) throw new StudioEngineError("TEMPLATE_NOT_FOUND", `Versi dasar templat tidak ditemukan: ${next}`);
    chain.unshift(overridesOf(v));
    next = v.baseVersionId;
  }
  return {
    baseVersionId: base.id,
    baseOverrides: foldOverrides(chain),
    roleFormats: base.roleFormats as unknown as RoleFormatMap,
    sectionPlan: base.sectionPlan as unknown as SectionPlan,
    assets: base.assets as unknown as TemplateAssets,
  };
}

/** Nilai efektif warisan lapis dasar (default registri <- rantai preset/dasar), sebelum lapis templat. */
function inheritedParams(base: Pick<BaseLayer, "baseOverrides">): Readonly<Record<string, ParamValue>> {
  return resolveParams({ base: base.baseOverrides, overrides: {}, registry: ALL_PARAMS }).params as Readonly<Record<string, ParamValue>>;
}

/**
 * Hak tulis per kunci yang berubah = layanan kerangka SR-06 (`checkTemplateWrite`: register
 * §13.5 urutan 1-7, lapis per kenop D-170/D-171, D-182 turunan di luar ADMIN-pada-preset
 * = 400 PARAM_CLASS_T_READONLY) + bidang non-parameter khusus ADMIN (roleFormats).
 */
function assertWriteRights(
  caller: StudioCaller,
  target: { isPreset: boolean; restricted: boolean; slug?: string },
  changes: readonly ParamChange[],
  adminOnlyFields: readonly string[] = [],
  expertMode?: boolean,
): void {
  checkTemplateWrite(caller, target, changes, { expertMode });
  assertAdminOnlyFields(caller, adminOnlyFields);
}

/** Versi terbaru profil kanonik, bila sudah di-seed. */
async function canonicalLatestVersionId(db: Db = prisma): Promise<string | null> {
  const t = await db.studioTemplate.findUnique({ where: { slug: DATUM_CANONICAL_SLUG } });
  if (!t || t.latestVersionNo < 1) return null;
  const v = await db.studioTemplateVersion.findUnique({
    where: { templateId_versionNo: { templateId: t.id, versionNo: t.latestVersionNo } },
    select: { id: true },
  });
  return v?.id ?? null;
}

function versionData(
  templateId: string,
  versionNo: number,
  baseVersionId: string | null,
  p: VersionPayload,
  changeNote: string,
  createdBy: string,
) {
  return {
    templateId,
    versionNo,
    baseVersionId,
    overrides: asJson(p.overrides),
    resolvedParams: asJson(p.resolvedParams),
    paramsSha256: p.paramsSha256,
    roleFormats: asJson(p.roleFormats),
    sectionPlan: asJson(p.sectionPlan),
    assets: asJson(p.assets),
    provenance: asJson(p.provenance),
    changeNote,
    createdBy,
  };
}

/**
 * Kerangka versi baru (SR-07): slot yang ditulis, atau salinan kerangka eksplisit versi
 * lain. Penulisan, validasi, sidik `skeletonSha256` = layanan kerangka SR-06.
 */
type SkeletonWrite = { slots: readonly TemplateSlotDef[] } | { copyFromVersionId: string } | null;

async function writeSkeleton(tx: Db, versionId: string, sk: SkeletonWrite): Promise<string | null> {
  if (!sk) return null;
  let slots: readonly TemplateSlotDef[];
  if ("slots" in sk) slots = sk.slots;
  else {
    const read = await getSkeleton(sk.copyFromVersionId, { db: tx });
    if (read.implicit) return null;
    slots = read.skeleton.slots;
  }
  return (await writeSkeletonRows(tx, versionId, { slots: [...slots] })).skeletonSha256;
}

type TemplateIdentity = {
  slug: string;
  name: string;
  kind: StudioTemplate["kind"];
  description: string | null;
  isCanonical: boolean;
  isPreset?: boolean;
};

/** Templat + versi 1 (+ kerangka) di dalam transaksi pemanggil. */
async function insertTemplateTx(
  tx: Db,
  t: TemplateIdentity,
  baseVersionId: string | null,
  p: VersionPayload,
  changeNote: string,
  createdBy: string,
  sk: SkeletonWrite = null,
): Promise<{ template: StudioTemplate; version: StudioTemplateVersion }> {
  const template = await tx.studioTemplate.create({ data: { ...t, isPreset: t.isPreset ?? false, latestVersionNo: 1, createdBy } });
  const created = await tx.studioTemplateVersion.create({ data: versionData(template.id, 1, baseVersionId, p, changeNote, createdBy) });
  const sha = await writeSkeleton(tx, created.id, sk);
  const version = sha ? { ...created, skeletonSha256: sha } : created;
  return { template, version };
}

/** Buat templat + versi 1 (+ kerangka) dalam satu transaksi. */
async function insertTemplate(
  t: TemplateIdentity,
  baseVersionId: string | null,
  p: VersionPayload,
  changeNote: string,
  createdBy: string,
  sk: SkeletonWrite = null,
): Promise<{ template: StudioTemplate; version: StudioTemplateVersion }> {
  return prisma.$transaction((tx) => insertTemplateTx(tx, t, baseVersionId, p, changeNote, createdBy, sk), {
    timeout: TEMPLATE_V2_TX_TIMEOUT_MS,
  });
}

/**
 * Sisipkan versi berikutnya: `latestVersionNo` dinaikkan hanya bila masih
 * sama dengan `expectedLatest` (kunci optimistik di dalam transaksi), lalu
 * versi `expectedLatest + 1` dibuat. Versi lama tidak disentuh.
 */
async function insertVersionTx(
  tx: Db,
  templateId: string,
  expectedLatest: number,
  baseVersionId: string | null,
  p: VersionPayload,
  changeNote: string,
  createdBy: string,
  sk: SkeletonWrite = null,
): Promise<{ template: StudioTemplate; version: StudioTemplateVersion }> {
  const bumped = await tx.studioTemplate.updateMany({
    where: { id: templateId, latestVersionNo: expectedLatest },
    data: { latestVersionNo: { increment: 1 } },
  });
  if (bumped.count !== 1) {
    throw new StudioEngineError("VERSION_CONFLICT", `Templat sudah memiliki versi lebih baru dari ${expectedLatest}; muat ulang lalu simpan`);
  }
  const created = await tx.studioTemplateVersion.create({
    data: versionData(templateId, expectedLatest + 1, baseVersionId, p, changeNote, createdBy),
  });
  const sha = await writeSkeleton(tx, created.id, sk);
  const version = sha ? { ...created, skeletonSha256: sha } : created;
  const template = await tx.studioTemplate.findUniqueOrThrow({ where: { id: templateId } });
  return { template, version };
}

async function insertVersion(
  templateId: string,
  expectedLatest: number,
  baseVersionId: string | null,
  p: VersionPayload,
  changeNote: string,
  createdBy: string,
  sk: SkeletonWrite = null,
): Promise<{ template: StudioTemplate; version: StudioTemplateVersion }> {
  return prisma.$transaction((tx) => insertVersionTx(tx, templateId, expectedLatest, baseVersionId, p, changeNote, createdBy, sk), {
    timeout: TEMPLATE_V2_TX_TIMEOUT_MS,
  });
}

/** `skeletonSha256` SR-06 untuk larik slot. */
function skeletonShaOfSlots(slots: readonly TemplateSlotDef[]): string {
  return skeletonShaOfSlotsRaw({ slots: [...slots] });
}

/** v1 datar pada templat berkerangka: versi baru membawa kerangka versi sebelumnya (tidak hilang diam-diam). */
function carrySkeleton(prev: Pick<StudioTemplateVersion, "id" | "skeletonSha256">): SkeletonWrite {
  return prev.skeletonSha256 ? { copyFromVersionId: prev.id } : null;
}

/** ResolvedTemplate dari baris versi; memeriksa integritas sha256 parameter. */
function resolvedFromVersion(t: Pick<StudioTemplate, "id" | "slug">, v: StudioTemplateVersion, cid?: string): ResolvedTemplate {
  const params = (isPlainObject(v.resolvedParams) ? v.resolvedParams : {}) as unknown as ParamRecord;
  const sha = sha256Hex(stableStringify(params));
  if (sha !== v.paramsSha256) {
    templatesLog({
      level: "error",
      message: "paramsSha256 versi templat tidak cocok dengan resolvedParams tersimpan",
      code: "TEMPLATE_PARAMS_SHA_MISMATCH",
      correlationId: cid,
      context: { templateId: t.id, slug: t.slug, versionId: v.id, versionNo: v.versionNo, stored: v.paramsSha256, computed: sha },
    });
  }
  return toResolvedTemplate({
    templateId: t.id,
    versionId: v.id,
    versionNo: v.versionNo,
    resolvedParams: params,
    roleFormats: (v.roleFormats ?? {}) as unknown as RoleFormatMap,
    sectionPlan: (v.sectionPlan ?? {}) as unknown as SectionPlan,
    assets: (v.assets ?? {}) as unknown as TemplateAssets,
    resolveAssetPath: (rel) => resolveRepoAssetPath(rel),
  });
}

// ── API I39 ──────────────────────────────────────────────────────────────

/** R01 GET: daftar templat; `archived` tak diisi = hanya yang aktif. Kanonik lebih dulu. */
export async function listTemplates(q: TemplateListQueryV2): Promise<TemplateSummaryAccess[]> {
  return runOp("listTemplates", { kind: q?.kind, archived: q?.archived, preset: q?.preset }, async () => {
    if (q?.kind !== undefined && !(STUDIO_TEMPLATE_KINDS as readonly string[]).includes(q.kind)) {
      throwIssues([{ key: "kind", code: "SCHEMA_INVALID", message: `kind harus salah satu dari ${STUDIO_TEMPLATE_KINDS.join(", ")}`, pointer: "/kind" }]);
    }
    if (q?.preset !== undefined && typeof q.preset !== "boolean") {
      throwIssues([{ key: "preset", code: "SCHEMA_INVALID", message: "preset harus boolean (1 = hanya preset, 0 = tanpa preset)", pointer: "/preset" }]);
    }
    const rows = await prisma.studioTemplate.findMany({
      where: { ...(q?.kind ? { kind: q.kind } : {}), archived: q?.archived ?? false, ...(q?.preset !== undefined ? { isPreset: q.preset } : {}) },
      orderBy: [{ isCanonical: "desc" }, { isPreset: "desc" }, { slug: "asc" }],
    });
    // Status terbatas D-98 dari versi terbaru tiap templat (satu kueri, tanpa N+1).
    const latest = rows.length
      ? await prisma.studioTemplateVersion.findMany({
          where: { OR: rows.map((t) => ({ templateId: t.id, versionNo: t.latestVersionNo })) },
          select: { templateId: true, resolvedParams: true },
        })
      : [];
    const byTemplate = new Map(latest.map((v) => [v.templateId, v]));
    return rows.map((t) => toSummary(t, byTemplate.get(t.id) ?? null));
  });
}

/** R02 GET: templat (id atau slug) + versi (default terbaru) + ringkasan semua versi (terbaru dulu). */
export async function getTemplate(id: string, versionNo?: number): Promise<TemplateDetailAccess> {
  return runOp("getTemplate", { id, versionNo }, async () => {
    const t = await findTemplate(id);
    const v = await findVersion(t, versionNo);
    const versions = await prisma.studioTemplateVersion.findMany({
      where: { templateId: t.id },
      orderBy: { versionNo: "desc" },
      select: VERSION_SUMMARY_SELECT,
    });
    const latest = v.versionNo === t.latestVersionNo ? v : await findVersion(t, t.latestVersionNo);
    return { template: toSummary(t, latest), version: toVersionDto(v), versions: versions.map(toVersionSummary) };
  });
}

/**
 * R01 POST: templat baru + versi 1. Dasar = `baseVersionId` atau versi
 * terbaru profil kanonik (bila sudah di-seed; selain itu registri langsung).
 * 409 TEMPLATE_SLUG_EXISTS; 403 PARAM_CLASS_K_FORBIDDEN (kunci kelas K); 400 PARAM_CLASS_T_READONLY;
 * 422 PARAM_UNKNOWN_KEY; 400 CHANGE_NOTE_REQUIRED / SCHEMA_INVALID.
 */
export async function createTemplate(
  input: CreateTemplateInput,
  caller: StudioCaller,
): Promise<{ template: TemplateSummary; version: TemplateVersionDto }> {
  return runOp("createTemplate", { slug: input?.slug, kind: input?.kind, requester: caller?.requester }, async (cid) => {
    assertCaller(caller);
    if (!isPlainObject(input)) throwIssues([{ key: "body", code: "SCHEMA_INVALID", message: "Badan permintaan harus objek", pointer: "" }]);
    const slug = assertSlug(input.slug);
    assertIdentity(input);
    const changeNote = assertChangeNote(input.changeNote);
    const overrides = assertOverridesObject(input.overrides ?? {});
    assertOverrideRights(overrides, caller.kind, ALL_PARAMS);

    if (await prisma.studioTemplate.findUnique({ where: { slug }, select: { id: true } })) {
      throw new StudioEngineError("TEMPLATE_SLUG_EXISTS", `Slug templat sudah dipakai: ${slug}`);
    }
    const baseVersionId = input.baseVersionId ?? (await canonicalLatestVersionId());
    const base = await baseLayerFor(baseVersionId);
    // SR-07 (R01 v1 datar): non-ADMIN hanya kunci esensial (lapis per kenop, D-182 turunan 400).
    if (!isAdminCaller(caller)) {
      assertWriteRights(caller, { isPreset: false, restricted: false, slug }, diffEffective({}, overrides, inheritedParams(base)));
    }
    const payload = composeVersion({
      baseOverrides: base.baseOverrides,
      overrides,
      baseRoleFormats: base.roleFormats,
      roleFormats: input.roleFormats,
      baseSectionPlan: base.sectionPlan,
      sectionPlan: input.sectionPlan,
      assets: base.assets,
    });
    const { template, version } = await insertTemplate(
      { slug, name: input.name.trim(), kind: input.kind, description: input.description ?? null, isCanonical: false },
      base.baseVersionId,
      payload,
      changeNote,
      caller.requester,
    );
    templatesLog({
      level: "info",
      message: "Templat dibuat",
      code: "TEMPLATE_CREATED",
      correlationId: cid,
      context: { templateId: template.id, slug, versionNo: 1, baseVersionId: base.baseVersionId, overrideKeys: Object.keys(overrides).length, callerKind: caller.kind },
    });
    return { template: toSummary(template, version), version: toVersionDto(version) };
  });
}

/**
 * R02 POST: simpan = versi baru. `overrides` = lapisan override LENGKAP milik
 * templat (relatif dasar yang sama dengan versi sebelumnya); `roleFormats`/
 * `sectionPlan` bila diisi = lapisan milik ditimpakan per peran / per tier di
 * atas dasar, bila tidak diisi = dibawa dari versi sebelumnya. Hak kelas K
 * diperiksa hanya untuk kunci yang berubah (403 PARAM_CLASS_K_FORBIDDEN). Profil
 * kanonik hanya diubah ADMIN_SESSION (lainnya 403 FORBIDDEN, R-13). 409 VERSION_CONFLICT bila `baseVersionNo` bukan versi terbaru.
 */
export async function createTemplateVersion(
  id: string,
  input: CreateTemplateVersionInput,
  caller: StudioCaller,
): Promise<{ version: TemplateVersionDto }> {
  return runOp("createTemplateVersion", { id, baseVersionNo: input?.baseVersionNo, requester: caller?.requester }, async (cid) => {
    assertCaller(caller);
    if (!isPlainObject(input)) throwIssues([{ key: "body", code: "SCHEMA_INVALID", message: "Badan permintaan harus objek", pointer: "" }]);
    const changeNote = assertChangeNote(input.changeNote);
    if (!Number.isInteger(input.baseVersionNo) || input.baseVersionNo < 1) {
      throwIssues([{ key: "baseVersionNo", code: "SCHEMA_INVALID", message: "baseVersionNo wajib bilangan bulat >= 1", pointer: "/baseVersionNo" }]);
    }
    const t = await findTemplate(id);
    // SR-07 (§13.5 langkah 1): versi preset gaya hanya ADMIN.
    assertPresetWritable(t, caller);
    // S85 R-12: predikat peran tunggal. R-13 (IP-43b): penolakan berbasis PERAN = FORBIDDEN;
    // PARAM_CLASS_K_FORBIDDEN hanya untuk kunci kelas K yang berubah (assertOverrideRights).
    if (t.isCanonical && !isAdminCaller(caller)) {
      throw new StudioEngineError("FORBIDDEN", "Profil DATUM-kanonik hanya dapat diubah peran ADMINISTRATOR", {
        reason: "CANONICAL_ADMIN_ONLY",
        templateId: t.id,
      });
    }
    if (input.baseVersionNo !== t.latestVersionNo) {
      throw new StudioEngineError(
        "VERSION_CONFLICT",
        `Versi dasar ${input.baseVersionNo} bukan versi terbaru (${t.latestVersionNo}); muat ulang lalu simpan`,
        { latestVersionNo: t.latestVersionNo },
      );
    }
    const prev = await findVersion(t, t.latestVersionNo);
    // FIX-1 (S87 M-05): versi baru templat TERBATAS (profil melepas cek penolak)
    // hanya oleh pemanggil tepercaya; lainnya 403 FORBIDDEN tanpa tulis DB.
    assertTemplateUsable(
      {
        params: (isPlainObject(prev.resolvedParams) ? prev.resolvedParams : {}) as unknown as ResolvedTemplate["params"],
        templateId: t.id,
        versionId: prev.id,
        versionNo: prev.versionNo,
      },
      caller,
      { slug: t.slug, purpose: "version", correlationId: cid },
    );
    const next = assertOverridesObject(input.overrides ?? {});
    const structural = validateOverrideKeys(next).issues;
    if (structural.length > 0) throwIssues(structural, "Templat tidak sah");
    assertOverrideRights(changedOverrides(overridesOf(prev), next), caller.kind, ALL_PARAMS);

    const base = await baseLayerFor(prev.baseVersionId);
    // SR-07 (R02 v1 datar): non-ADMIN hanya kunci esensial yang berubah (lapis per kenop; D-182
    // turunan 400) dan tidak mengubah roleFormats. Jalur ADMIN v1 (warisan) tidak berubah.
    if (!isAdminCaller(caller)) {
      const roleChanged =
        input.roleFormats !== undefined &&
        stableStringify(ownRoleFormats(input.roleFormats as Record<string, unknown>, base.roleFormats as Record<string, unknown>)) !==
          stableStringify(ownRoleFormats(prev.roleFormats as Record<string, unknown>, base.roleFormats as Record<string, unknown>));
      assertWriteRights(
        caller,
        { isPreset: t.isPreset, restricted: false, slug: t.slug },
        diffEffective(sanitizeStoredLayer(overridesOf(prev)).kept, next, inheritedParams(base)),
        roleChanged ? ["roleFormats"] : [],
      );
    }
    const prevRoles = prev.roleFormats as unknown as RoleFormatMap;
    const prevPlan = prev.sectionPlan as unknown as SectionPlan;
    const payload = composeVersion({
      baseOverrides: base.baseOverrides,
      overrides: next,
      baseRoleFormats: input.roleFormats !== undefined ? base.roleFormats : prevRoles,
      roleFormats: input.roleFormats,
      baseSectionPlan: input.sectionPlan !== undefined ? base.sectionPlan : prevPlan,
      sectionPlan: input.sectionPlan,
      assets: prev.assets as unknown as TemplateAssets,
    });
    const { version } = await insertVersion(t.id, t.latestVersionNo, prev.baseVersionId, payload, changeNote, caller.requester, carrySkeleton(prev));
    templatesLog({
      level: "info",
      message: "Versi templat dibuat",
      code: "TEMPLATE_VERSION_CREATED",
      correlationId: cid,
      context: { templateId: t.id, slug: t.slug, versionNo: version.versionNo, paramsSha256: payload.paramsSha256, callerKind: caller.kind },
    });
    return { version: toVersionDto(version) };
  });
}

/** Templat (slug) -> `ResolvedTemplate` beku untuk versi tertentu atau terbaru. */
export async function resolveTemplate(slug: string, version?: number): Promise<ResolvedTemplate> {
  return runOp("resolveTemplate", { slug, version }, async (cid) => {
    const t = await prisma.studioTemplate.findUnique({ where: { slug } });
    if (!t) throw new StudioEngineError("TEMPLATE_NOT_FOUND", `Templat tidak ditemukan: ${slug}`);
    const v = await findVersion(t, version);
    return resolvedFromVersion(t, v, cid);
  });
}

/**
 * `resolveTemplate` + gerbang templat terbatas D-98 untuk pemanggil: dipakai
 * jalur yang MEMULAI pemakaian templat (ingest, validate, render artefak baru).
 * 403 FORBIDDEN bila templat terbatas dan pemanggil bukan ADMINISTRATOR/harness.
 */
export async function resolveTemplateFor(
  slug: string,
  version: number | undefined,
  caller: StudioCaller,
  opts: TemplateAccessOptions & { purpose?: string } = {},
): Promise<ResolvedTemplate> {
  const tpl = await resolveTemplate(slug, version);
  assertTemplateUsable(tpl, caller, { ...opts, slug });
  return tpl;
}

/** Versi templat (id; dipin revisi/artefak) -> `ResolvedTemplate` (render ulang identik, D-06). */
export async function resolveTemplateVersion(versionId: string): Promise<ResolvedTemplate> {
  return runOp("resolveTemplateVersion", { versionId }, async (cid) => {
    const v = await prisma.studioTemplateVersion.findUnique({ where: { id: versionId }, include: { template: { select: { id: true, slug: true } } } });
    if (!v) throw new StudioEngineError("TEMPLATE_NOT_FOUND", `Versi templat tidak ditemukan: ${versionId}`);
    return resolvedFromVersion(v.template, v, cid);
  });
}

// ── studio.template/v2 (SR-07; D-163 T-2: satu POST gabungan) ────────────

/** R01 POST v2: templat baru = preset + esensial + lanjutan (ADMIN) + kerangka. */
export interface CreateTemplateV2Input {
  slug: string;
  name: string;
  kind: StudioTemplateKind;
  description?: string | null;
  /** Preset gaya baru (hanya ADMIN). */
  isPreset?: boolean;
  changeNote: string;
  template: StudioTemplateV2;
  /** Tanda kesadaran pengguna, bukan otorisasi: lanjutan tetap hanya ADMIN di v2.1 (D-163 T-1). */
  expertMode?: boolean;
}

/** R02 POST v2: simpan = versi baru (preset + esensial + lanjutan + kerangka). */
export interface CreateTemplateVersionV2Input {
  baseVersionNo: number;
  changeNote: string;
  template: StudioTemplateV2;
  expertMode?: boolean;
}

export interface TemplateV2SaveResult {
  template: TemplateSummaryAccess;
  version: TemplateVersionDtoAccess;
  skeletonSha256: string;
}

type V2Target =
  | { mode: "create"; identity: TemplateIdentity }
  | { mode: "version"; template: StudioTemplate; prev: StudioTemplateVersion };

function assertExpertMode(v: unknown): void {
  if (v !== undefined && typeof v !== "boolean") {
    throwIssues([{ key: "expertMode", code: "SCHEMA_INVALID", message: "expertMode harus boolean", pointer: "/expertMode" }]);
  }
}

/** Lapis datar satu slot (SR-06 `flattenSlotParams`). */
function slotLayerOf(s: Pick<TemplateSlotDef, "essentials" | "advanced">): ParamRecord {
  return flattenSlotParams(s) as ParamRecord;
}

/** Bentuk SID04 + kunci ganda lapis + aturan kerangka SR-06 (kiriman mentah); kembalikan templat v2. */
function parseTemplateV2Input(raw: unknown): StudioTemplateV2 {
  const tpl = parseTemplateV2(raw, "/template");
  validateSkeleton(tpl.skeleton);
  return tpl;
}

/**
 * Inti simpan v2 di dalam transaksi `tx` (semua baca dan tulis memakai `tx`): preset ->
 * `baseVersionId`; lapis templat datar = esensial ∪ lanjutan (KD-21); cek struktural
 * (asing 422, T 400, nilai 400; kerangka SR-06); hak per kunci yang BERUBAH relatif nilai
 * efektif sebelumnya (SR-06 `checkTemplateWrite` + D-182); lalu templat/versi + slot
 * M10-M12 + `skeletonSha256` (SR-06 `writeSkeleton`) dalam transaksi yang sama.
 */
async function saveTemplateV2Tx(
  tx: Db,
  target: V2Target,
  tpl: StudioTemplateV2,
  changeNote: string,
  caller: StudioCaller,
  cid: string,
  expertMode?: boolean,
): Promise<{ template: StudioTemplate; version: StudioTemplateVersion; skeletonSha256: string; changes: number }> {
  const admin = isAdminCaller(caller);
  const isPreset = target.mode === "create" ? target.identity.isPreset === true : target.template.isPreset;
  const slug = target.mode === "create" ? target.identity.slug : target.template.slug;

  // 1. Preset -> versi dasar (rantai baseVersionId).
  let baseVersionId: string | null;
  if (tpl.preset) {
    const pt = await tx.studioTemplate.findUnique({ where: { slug: tpl.preset.slug } });
    if (!pt) throw new StudioEngineError("TEMPLATE_NOT_FOUND", `Preset gaya tidak ditemukan: ${tpl.preset.slug}`, { preset: tpl.preset });
    if (!pt.isPreset) {
      throwSchemaIssues([{ pointer: "/template/preset/slug", keyword: "preset", message: `templat ${pt.slug} bukan preset gaya` }], "Templat tidak sah");
    }
    if (target.mode === "version" && pt.id === target.template.id) {
      throwSchemaIssues([{ pointer: "/template/preset/slug", keyword: "preset", message: "preset tidak boleh templat itu sendiri" }], "Templat tidak sah");
    }
    const pv = await findVersion(pt, tpl.preset.version, tx);
    // D-98: preset terbatas (melepas cek penolak) hanya untuk pemanggil tepercaya.
    assertTemplateUsable(
      { params: (isPlainObject(pv.resolvedParams) ? pv.resolvedParams : {}) as unknown as ResolvedTemplate["params"], templateId: pt.id, versionId: pv.id, versionNo: pv.versionNo },
      caller,
      { slug: pt.slug, purpose: "preset", correlationId: cid },
    );
    baseVersionId = pv.id;
  } else if (isPreset) {
    baseVersionId = target.mode === "version" ? target.prev.baseVersionId : await canonicalLatestVersionId(tx);
  } else {
    throwSchemaIssues([{ pointer: "/template/preset", keyword: "required", message: "preset wajib kecuali templat preset gaya" }], "Templat tidak sah");
  }
  const base = await baseLayerFor(baseVersionId, tx);
  const inherited = inheritedParams(base);

  // 2. Lapis templat. Override lama yang kini asing/kelas T dilewati (migrasi SR-36).
  const stored = target.mode === "version" ? sanitizeStoredLayer(overridesOf(target.prev)) : { kept: {} as ParamRecord, skipped: [] as string[] };
  if (stored.skipped.length > 0) {
    templatesLog({ level: "warn", message: "Override tersimpan yang kini asing atau kelas T tidak dibawa", code: "TEMPLATE_PARAM_SKIPPED", correlationId: cid, context: { slug, keys: stored.skipped } });
  }
  const prevLayer = stored.kept;
  let layer = templateLayerOf(tpl);
  if (!admin) layer = carryHiddenForNonAdmin(prevLayer, layer, inherited);
  assertTemplateLayerKeys(layer, "/template/essentials");

  // 3. roleFormats templat (lapis milik; ADMIN). Tidak dikirim = dibawa dari versi sebelumnya.
  const prevOwnRoles =
    target.mode === "version" ? ownRoleFormats(target.prev.roleFormats as Record<string, unknown>, base.roleFormats as Record<string, unknown>) : {};
  let ownRoles: Record<string, unknown> = prevOwnRoles;
  if (tpl.roleFormats !== undefined) {
    const r = validateRoleFormats(tpl.roleFormats, "/template/roleFormats");
    if (r.issues.length > 0) throwIssues(r.issues, "Templat tidak sah");
    ownRoles = ownRoleFormats(r.roleFormats as Record<string, unknown>, base.roleFormats as Record<string, unknown>);
  }

  // 4. Isi versi (resolusi parameter; kelas T dihitung ulang).
  const payload = composeVersion({
    baseOverrides: base.baseOverrides,
    overrides: layer,
    baseRoleFormats: base.roleFormats,
    roleFormats: ownRoles,
    baseSectionPlan: base.sectionPlan,
    assets: base.assets,
  });

  // 5. Kerangka: lapis slot lama (eksplisit, sectionType sama); non-ADMIN membawa yang tersembunyi.
  const prevSkeleton = target.mode === "version" ? await getSkeleton(target.prev.id, { db: tx }) : null;
  const prevSlotByKey = new Map((prevSkeleton && !prevSkeleton.implicit ? prevSkeleton.skeleton.slots : []).map((s) => [s.slotKey, s]));
  const prevSlotOf = (s: TemplateSlotDef) => {
    const p = prevSlotByKey.get(s.slotKey);
    return p && p.sectionType === s.sectionType ? p : undefined;
  };
  const slotsIn: TemplateSlotDef[] = tpl.skeleton.slots.map((s) => {
    const prev = prevSlotOf(s);
    let sl = slotLayerOf(s);
    if (!admin) sl = carryHiddenForNonAdmin(prev ? slotLayerOf(prev) : {}, sl, payload.resolvedParams);
    const roleFormats = s.roleFormats !== undefined ? s.roleFormats : prev?.roleFormats;
    const { essentials: _e, advanced: _a, roleFormats: _r, ...rest } = s;
    void _e;
    void _a;
    void _r;
    return { ...rest, essentials: sl, ...(roleFormats && Object.keys(roleFormats).length > 0 ? { roleFormats } : {}) };
  });
  const skeleton = validateSkeleton({ slots: slotsIn });

  // 6. Perubahan per kunci (nilai warisan slot = nilai efektif templat) + bidang khusus ADMIN.
  const changes: ParamChange[] = diffEffective(prevLayer, layer, inherited);
  const adminOnly: string[] = [];
  if (stableStringify(ownRoles) !== stableStringify(prevOwnRoles)) adminOnly.push("roleFormats");
  for (const s of skeleton.slots) {
    const prev = prevSlotOf(s);
    changes.push(...diffEffective(prev ? slotLayerOf(prev) : {}, slotLayerOf(s), payload.resolvedParams, { slotKey: s.slotKey, sectionType: s.sectionType, admits: s.admits }));
    if (stableStringify(s.roleFormats ?? {}) !== stableStringify(prev?.roleFormats ?? {})) adminOnly.push(`skeleton.slots.${s.slotKey}.roleFormats`);
  }

  // 7. Hak (§13.5 urutan 3-7 via SR-06; D-182 turunan 400; roleFormats ADMIN).
  assertWriteRights(caller, { isPreset, restricted: false, slug }, changes, adminOnly, expertMode);

  // 8. Tulis: templat/versi + kerangka dalam transaksi yang sama.
  const sk: SkeletonWrite = { slots: skeleton.slots };
  const written =
    target.mode === "create"
      ? await insertTemplateTx(tx, target.identity, base.baseVersionId, payload, changeNote, caller.requester, sk)
      : await insertVersionTx(tx, target.template.id, target.template.latestVersionNo, base.baseVersionId, payload, changeNote, caller.requester, sk);
  if (!written.version.skeletonSha256) throw new Error("kerangka versi templat tidak tertulis");
  return { ...written, skeletonSha256: written.version.skeletonSha256, changes: changes.length };
}

async function createTemplateV2Core(tx: Db, input: CreateTemplateV2Input, caller: StudioCaller, cid: string): Promise<TemplateV2SaveResult> {
  assertCaller(caller);
  if (!isPlainObject(input)) throwIssues([{ key: "body", code: "SCHEMA_INVALID", message: "Badan permintaan harus objek", pointer: "" }]);
  const slug = assertSlug(input.slug);
  assertIdentity(input);
  const changeNote = assertChangeNote(input.changeNote);
  assertExpertMode(input.expertMode);
  if (input.isPreset !== undefined && typeof input.isPreset !== "boolean") {
    throwIssues([{ key: "isPreset", code: "SCHEMA_INVALID", message: "isPreset harus boolean", pointer: "/isPreset" }]);
  }
  const tpl = parseTemplateV2Input(input.template);
  if (input.isPreset === true && !isAdminCaller(caller)) {
    throw new StudioEngineError("FORBIDDEN", "Preset gaya hanya dapat dibuat peran ADMINISTRATOR", { reason: "PRESET_ADMIN_ONLY" });
  }
  if (await tx.studioTemplate.findUnique({ where: { slug }, select: { id: true } })) {
    throw new StudioEngineError("TEMPLATE_SLUG_EXISTS", `Slug templat sudah dipakai: ${slug}`);
  }
  const identity: TemplateIdentity = {
    slug,
    name: input.name.trim(),
    kind: input.kind,
    description: input.description ?? null,
    isCanonical: false,
    isPreset: input.isPreset === true,
  };
  const r = await saveTemplateV2Tx(tx, { mode: "create", identity }, tpl, changeNote, caller, cid, input.expertMode);
  templatesLog({
    level: "info",
    message: "Templat v2 dibuat",
    code: "TEMPLATE_CREATED",
    correlationId: cid,
    context: {
      templateId: r.template.id,
      slug,
      versionNo: 1,
      isPreset: identity.isPreset,
      preset: tpl.preset ?? null,
      baseVersionId: r.version.baseVersionId,
      slots: tpl.skeleton.slots.length,
      skeletonSha256: r.skeletonSha256,
      changedKeys: r.changes,
      callerKind: caller.kind,
      expertMode: input.expertMode === true,
    },
  });
  return { template: toSummary(r.template, r.version), version: toVersionDto(r.version), skeletonSha256: r.skeletonSha256 };
}

async function createTemplateVersionV2Core(
  tx: Db,
  id: string,
  input: CreateTemplateVersionV2Input,
  caller: StudioCaller,
  cid: string,
): Promise<TemplateV2SaveResult> {
  assertCaller(caller);
  if (!isPlainObject(input)) throwIssues([{ key: "body", code: "SCHEMA_INVALID", message: "Badan permintaan harus objek", pointer: "" }]);
  const changeNote = assertChangeNote(input.changeNote);
  assertExpertMode(input.expertMode);
  if (!Number.isInteger(input.baseVersionNo) || input.baseVersionNo < 1) {
    throwIssues([{ key: "baseVersionNo", code: "SCHEMA_INVALID", message: "baseVersionNo wajib bilangan bulat >= 1", pointer: "/baseVersionNo" }]);
  }
  const tpl = parseTemplateV2Input(input.template);
  const t = await findTemplate(id, tx);
  assertPresetWritable(t, caller);
  if (t.isCanonical && !isAdminCaller(caller)) {
    throw new StudioEngineError("FORBIDDEN", "Profil DATUM-kanonik hanya dapat diubah peran ADMINISTRATOR", { reason: "CANONICAL_ADMIN_ONLY", templateId: t.id });
  }
  if (input.baseVersionNo !== t.latestVersionNo) {
    throw new StudioEngineError("VERSION_CONFLICT", `Versi dasar ${input.baseVersionNo} bukan versi terbaru (${t.latestVersionNo}); muat ulang lalu simpan`, {
      latestVersionNo: t.latestVersionNo,
    });
  }
  const prev = await findVersion(t, t.latestVersionNo, tx);
  assertTemplateUsable(
    { params: (isPlainObject(prev.resolvedParams) ? prev.resolvedParams : {}) as unknown as ResolvedTemplate["params"], templateId: t.id, versionId: prev.id, versionNo: prev.versionNo },
    caller,
    { slug: t.slug, purpose: "version", correlationId: cid },
  );
  const r = await saveTemplateV2Tx(tx, { mode: "version", template: t, prev }, tpl, changeNote, caller, cid, input.expertMode);
  templatesLog({
    level: "info",
    message: "Versi templat v2 dibuat",
    code: "TEMPLATE_VERSION_CREATED",
    correlationId: cid,
    context: {
      templateId: t.id,
      slug: t.slug,
      versionNo: r.version.versionNo,
      preset: tpl.preset ?? null,
      baseVersionId: r.version.baseVersionId,
      paramsSha256: r.version.paramsSha256,
      skeletonSha256: r.skeletonSha256,
      changedKeys: r.changes,
      callerKind: caller.kind,
      expertMode: input.expertMode === true,
    },
  });
  return { template: toSummary(r.template, r.version), version: toVersionDto(r.version), skeletonSha256: r.skeletonSha256 };
}

/**
 * R01 POST v2: templat baru + versi 1 = `baseVersionId` preset + esensial + lanjutan
 * (ADMIN) + kerangka, satu transaksi. 409 TEMPLATE_SLUG_EXISTS; 403 FORBIDDEN (preset
 * baru non-ADMIN, preset terbatas), PARAM_CLASS_K_FORBIDDEN, PARAM_SURFACE_FORBIDDEN;
 * 400 SCHEMA_INVALID (SKELETON_*), PARAM_CLASS_T_READONLY, CHANGE_NOTE_REQUIRED;
 * 404 TEMPLATE_NOT_FOUND (preset); 422 PARAM_UNKNOWN_KEY, SLOT_PARAM_SCOPE_INVALID, SLOT_DUPLICATE.
 */
export async function createTemplateV2(input: CreateTemplateV2Input, caller: StudioCaller): Promise<TemplateV2SaveResult> {
  return runOp("createTemplateV2", { slug: input?.slug, kind: input?.kind, requester: caller?.requester }, (cid) =>
    prisma.$transaction((tx) => createTemplateV2Core(tx, input, caller, cid), { timeout: TEMPLATE_V2_TX_TIMEOUT_MS }),
  );
}

/** `createTemplateV2` di dalam transaksi pemanggil (seed SR-36, asap rollback). */
export async function createTemplateV2InTx(tx: Prisma.TransactionClient, input: CreateTemplateV2Input, caller: StudioCaller): Promise<TemplateV2SaveResult> {
  return runOp("createTemplateV2", { slug: input?.slug, kind: input?.kind, requester: caller?.requester, inTx: true }, (cid) =>
    createTemplateV2Core(tx, input, caller, cid),
  );
}

/**
 * R02 POST v2: versi baru = preset + esensial + lanjutan + kerangka, satu transaksi.
 * 403 PRESET_READONLY (preset, non-ADMIN), FORBIDDEN (kanonik/terbatas),
 * PARAM_CLASS_K_FORBIDDEN, PARAM_SURFACE_FORBIDDEN; 409 VERSION_CONFLICT; 400/422 seperti R01.
 */
export async function createTemplateVersionV2(id: string, input: CreateTemplateVersionV2Input, caller: StudioCaller): Promise<TemplateV2SaveResult> {
  return runOp("createTemplateVersionV2", { id, baseVersionNo: input?.baseVersionNo, requester: caller?.requester }, (cid) =>
    prisma.$transaction((tx) => createTemplateVersionV2Core(tx, id, input, caller, cid), { timeout: TEMPLATE_V2_TX_TIMEOUT_MS }),
  );
}

/** `createTemplateVersionV2` di dalam transaksi pemanggil. */
export async function createTemplateVersionV2InTx(
  tx: Prisma.TransactionClient,
  id: string,
  input: CreateTemplateVersionV2Input,
  caller: StudioCaller,
): Promise<TemplateV2SaveResult> {
  return runOp("createTemplateVersionV2", { id, baseVersionNo: input?.baseVersionNo, requester: caller?.requester, inTx: true }, (cid) =>
    createTemplateVersionV2Core(tx, id, input, caller, cid),
  );
}

export interface TemplateDetailV2 extends TemplateDetailAccess {
  /** Bentuk `studio.template/v2` versi ini; null = versi lama tanpa kerangka (kerangka implisit, SR-06). */
  definition: StudioTemplateV2 | null;
  skeletonSha256: string | null;
  implicit: boolean;
  /** Lapis lanjutan + roleFormats disertakan (ADMIN; mode ahli USER ditunda D-163 T-1). */
  advancedIncluded: boolean;
}

/**
 * R02 GET (bentuk v2): templat + versi + definisi `studio.template/v2` (preset + esensial;
 * lanjutan dan roleFormats hanya bila `includeAdvanced`). Tanpa lanjutan, `version.overrides`
 * juga dipangkas ke kunci esensial (nilai efektif `resolvedParams` tetap untuk pratinjau).
 */
export async function getTemplateV2(id: string, versionNo: number | undefined, opts: { includeAdvanced: boolean }): Promise<TemplateDetailV2> {
  return runOp("getTemplateV2", { id, versionNo, includeAdvanced: opts?.includeAdvanced }, async () => {
    const includeAdvanced = opts?.includeAdvanced === true;
    const t = await findTemplate(id);
    const v = await findVersion(t, versionNo);
    const [versions, latest, baseRow, sk] = await Promise.all([
      prisma.studioTemplateVersion.findMany({ where: { templateId: t.id }, orderBy: { versionNo: "desc" }, select: VERSION_SUMMARY_SELECT }),
      v.versionNo === t.latestVersionNo ? Promise.resolve(v) : findVersion(t, t.latestVersionNo),
      v.baseVersionId
        ? prisma.studioTemplateVersion.findUnique({ where: { id: v.baseVersionId }, include: { template: { select: { slug: true, isPreset: true } } } })
        : Promise.resolve(null),
      getSkeleton(v.id),
    ]);
    const layer = overridesOf(v);
    const surfaces = layerToSurfaces(layer, includeAdvanced);
    const version = toVersionDto(v);
    if (!includeAdvanced) version.overrides = surfaces.essentials;
    let definition: StudioTemplateV2 | null = null;
    if (!sk.implicit) {
      const ownRoles = ownRoleFormats(v.roleFormats as Record<string, unknown>, (baseRow?.roleFormats ?? {}) as Record<string, unknown>);
      definition = {
        $schema: "studio.template/v2",
        ...(baseRow?.template.isPreset ? { preset: { slug: baseRow.template.slug, version: baseRow.versionNo } } : {}),
        ...surfaces,
        ...(includeAdvanced && Object.keys(ownRoles).length > 0 ? { roleFormats: ownRoles } : {}),
        skeleton: {
          slots: sk.skeleton.slots.map((s) => {
            const { advanced, roleFormats, ...rest } = s;
            const ls = layerToSurfaces(flattenSlotParams({ essentials: s.essentials, advanced }) as ParamRecord, includeAdvanced);
            return { ...rest, ...ls, ...(includeAdvanced && roleFormats ? { roleFormats } : {}) };
          }),
        },
      };
    }
    return {
      template: toSummary(t, latest),
      version,
      versions: versions.map(toVersionSummary),
      definition,
      skeletonSha256: sk.implicit ? null : sk.skeletonSha256,
      implicit: sk.implicit,
      advancedIncluded: includeAdvanced,
    };
  });
}


// ── Profil kanonik dan impor profil turunan ─────────────────────────────

export interface EnsureCanonicalResult {
  template: TemplateSummary;
  version: TemplateVersionDto;
  created: boolean;
  /** Versi baru dibuat karena registri/aset berubah (`syncRegistry`). */
  synced: boolean;
  /** Versi terbaru berbeda dari registri saat ini (tanpa `syncRegistry`). */
  stale: boolean;
}

/**
 * Pastikan profil DATUM-kanonik ada (idempoten; dipakai seed S70 dan impor).
 * Tanpa override: semua parameter = default registri, kelas T terhitung,
 * rencana section kanonik (identik seed S70). Bila registri
 * berubah dan `syncRegistry` true, versi baru dibuat (versi lama tetap).
 */
export async function ensureCanonicalTemplate(opts: {
  createdBy: string;
  syncRegistry?: boolean;
  /** Sertakan aset `src/lib/studio/assets` (default false: selaras seed S70, profil kanonik tanpa aset). */
  withCanonicalAssets?: boolean;
  repoRoot?: string;
}): Promise<EnsureCanonicalResult> {
  return runOp("ensureCanonicalTemplate", { createdBy: opts?.createdBy, syncRegistry: opts?.syncRegistry }, async (cid) => {
    if (typeof opts?.createdBy !== "string" || opts.createdBy.length === 0) {
      throwIssues([{ key: "createdBy", code: "SCHEMA_INVALID", message: "createdBy wajib", pointer: "/createdBy" }]);
    }
    const fresh = canonicalVersionPayload(opts.withCanonicalAssets ? await scanCanonicalAssets(opts.repoRoot) : {});
    const freshDigest = versionContentDigest(fresh, null);
    const existing = await prisma.studioTemplate.findUnique({ where: { slug: DATUM_CANONICAL_SLUG } });
    if (!existing) {
      try {
        const { template, version } = await insertTemplate(
          { slug: DATUM_CANONICAL_SLUG, name: "Profil DATUM-kanonik", kind: "DOCUMENT", description: `Default registri parameter (katalog ${CATALOG_PARAMS.length} + renderer ${ALL_PARAMS.length - CATALOG_PARAMS.length}), rencana section per tier kanonik`, isCanonical: true },
          null,
          fresh,
          "Profil DATUM-kanonik dari registri parameter dan section",
          opts.createdBy,
        );
        templatesLog({ level: "info", message: "Profil kanonik dibuat", code: "TEMPLATE_CANONICAL_CREATED", correlationId: cid, context: { templateId: template.id, paramsSha256: fresh.paramsSha256 } });
        return { template: toSummary(template, version), version: toVersionDto(version), created: true, synced: false, stale: false };
      } catch (err) {
        // Seed bersamaan: baris pemenang dibaca ulang di bawah.
        if (!(mapPrismaError(err) instanceof StudioEngineError)) throw err;
      }
    }
    const t = await findTemplate(DATUM_CANONICAL_SLUG);
    const latest = await findVersion(t, t.latestVersionNo);
    const latestDigest = versionContentDigest(
      { paramsSha256: latest.paramsSha256, roleFormats: latest.roleFormats as unknown as RoleFormatMap, sectionPlan: latest.sectionPlan as unknown as SectionPlan, assets: latest.assets as unknown as TemplateAssets },
      latest.baseVersionId,
    );
    const stale = latestDigest !== freshDigest || Object.keys(overridesOf(latest)).length > 0;
    if (stale && opts.syncRegistry) {
      const { template, version } = await insertVersion(t.id, t.latestVersionNo, null, fresh, "Sinkronisasi profil DATUM-kanonik dengan registri saat ini", opts.createdBy);
      templatesLog({ level: "info", message: "Profil kanonik disinkronkan", code: "TEMPLATE_CANONICAL_SYNCED", correlationId: cid, context: { templateId: t.id, versionNo: version.versionNo } });
      return { template: toSummary(template, version), version: toVersionDto(version), created: false, synced: true, stale: false };
    }
    if (stale) {
      templatesLog({ level: "warn", message: "Profil kanonik tersimpan berbeda dari registri saat ini", code: "TEMPLATE_CANONICAL_STALE", correlationId: cid, context: { templateId: t.id, versionNo: latest.versionNo } });
    }
    return { template: toSummary(t, latest), version: toVersionDto(latest), created: false, synced: false, stale };
  });
}

export interface ImportTemplateProfileResult {
  template: TemplateSummary;
  version: TemplateVersionDto;
  created: boolean;
  /** Isi identik dengan versi terbaru: tidak ada versi baru. */
  unchanged: boolean;
  droppedDerived: string[];
  ignoredFields: string[];
}

/**
 * Impor profil turunan dari berkas JSON (mis. `benchmark/manual000/template.json`
 * -> slug `datum-manual-000`, D-44/D-50) ke DB. Dasar = versi terbaru templat
 * `base` (kanonik dipastikan ada). Templat baru -> versi 1; templat ada ->
 * versi baru hanya bila isi berubah (idempoten). Hak kelas K pemanggil
 * ditegakkan (KT-16: profil Manual 000 memuat override kelas K, impor oleh
 * ADMIN_SESSION).
 */
export async function importTemplateProfile(
  source: string | ParsedTemplateProfile,
  opts: ReadProfileOptions & { caller: StudioCaller; slug?: string; changeNote?: string },
): Promise<ImportTemplateProfileResult> {
  return runOp("importTemplateProfile", { source: typeof source === "string" ? source : "(parsed)", slug: opts?.slug, requester: opts?.caller?.requester }, async (cid) => {
    assertCaller(opts.caller);
    const parsed = typeof source === "string" ? await readTemplateProfileFile(source, opts) : source;
    const { profile } = parsed;
    const slug = assertSlug(opts.slug ?? profile.slug);
    const changeNote = assertChangeNote(opts.changeNote ?? profile.changeNote ?? `Impor profil ${slug}`);

    let baseVersionId: string;
    if (profile.base === DATUM_CANONICAL_SLUG) {
      baseVersionId = (await ensureCanonicalTemplate({ createdBy: opts.caller.requester })).version.id;
    } else {
      const bt = await findTemplate(profile.base);
      baseVersionId = (await findVersion(bt, bt.latestVersionNo)).id;
    }
    const base = await baseLayerFor(baseVersionId);
    const payload = composeVersion({
      baseOverrides: base.baseOverrides,
      overrides: profile.overrides,
      baseRoleFormats: base.roleFormats,
      roleFormats: profile.roleFormats,
      baseSectionPlan: base.sectionPlan,
      sectionPlan: profile.sectionPlan,
      assets: { ...base.assets, ...(profile.assets ?? {}) },
      provenance: profile.provenance,
      meta: profile.meta,
    });
    // SR-07: profil boleh membawa kerangka (divalidasi/dikanonikkan SR-06) dan penanda preset.
    const skeleton = profile.skeleton ? validateSkeleton({ slots: profile.skeleton.slots as TemplateSlotDef[] }) : null;
    const skSha = skeleton ? skeletonShaOfSlots(skeleton.slots) : null;
    // Sidik idempoten: tanpa kerangka = sidik lama (impor ulang profil lama tetap `unchanged`).
    const withSkeleton = (d: string, sha: string | null) => (skeleton ? sha256Hex(stableStringify({ d, k: sha })) : d);
    const digest = withSkeleton(versionContentDigest(payload, baseVersionId), skSha);
    const common = { droppedDerived: parsed.droppedDerived, ignoredFields: parsed.ignoredFields };
    if (profile.isPreset && !isAdminCaller(opts.caller)) {
      throw new StudioEngineError("FORBIDDEN", "Preset gaya hanya dapat diimpor peran ADMINISTRATOR", { reason: "PRESET_ADMIN_ONLY" });
    }

    const existing = await prisma.studioTemplate.findUnique({ where: { slug } });
    if (!existing) {
      assertOverrideRights(payload.overrides, opts.caller.kind, ALL_PARAMS);
      const name = profile.name?.trim() || slug;
      const { template, version } = await insertTemplate(
        {
          slug,
          name: name.slice(0, TEMPLATE_NAME_MAX),
          kind: profile.kind,
          description: profile.description ?? null,
          isCanonical: false,
          isPreset: profile.isPreset === true,
        },
        baseVersionId,
        payload,
        changeNote,
        opts.caller.requester,
        skeleton ? { slots: skeleton.slots } : null,
      );
      templatesLog({
        level: "info",
        message: "Profil templat diimpor (baru)",
        code: "TEMPLATE_IMPORTED",
        correlationId: cid,
        context: { templateId: template.id, slug, paramsSha256: payload.paramsSha256, isPreset: profile.isPreset === true, skeletonSha256: version.skeletonSha256, ...common },
      });
      return { template: toSummary(template, version), version: toVersionDto(version), created: true, unchanged: false, ...common };
    }
    if (existing.isCanonical) {
      // R-13 (IP-43b): aturan aksi (bukan kunci kelas K) -> FORBIDDEN.
      throw new StudioEngineError("FORBIDDEN", "Profil DATUM-kanonik tidak dapat ditimpa impor", {
        reason: "CANONICAL_IMPORT_OVERWRITE",
        templateId: existing.id,
      });
    }
    assertPresetWritable(existing, opts.caller);
    if (profile.isPreset !== undefined && profile.isPreset !== existing.isPreset) {
      templatesLog({ level: "warn", message: "isPreset profil berbeda dari templat yang ada; penanda tidak diubah impor", code: "TEMPLATE_IMPORT_PRESET_FLAG_IGNORED", correlationId: cid, context: { templateId: existing.id, slug, profile: profile.isPreset, existing: existing.isPreset } });
    }
    const latest = await findVersion(existing, existing.latestVersionNo);
    const latestDigest = withSkeleton(
      versionContentDigest(
        { paramsSha256: latest.paramsSha256, roleFormats: latest.roleFormats as unknown as RoleFormatMap, sectionPlan: latest.sectionPlan as unknown as SectionPlan, assets: latest.assets as unknown as TemplateAssets },
        latest.baseVersionId,
      ),
      latest.skeletonSha256,
    );
    if (latestDigest === digest) {
      return { template: toSummary(existing, latest), version: toVersionDto(latest), created: false, unchanged: true, ...common };
    }
    assertOverrideRights(changedOverrides(overridesOf(latest), payload.overrides), opts.caller.kind, ALL_PARAMS);
    // Profil tanpa kerangka: kerangka versi terbaru dibawa (tidak hilang diam-diam).
    const sk: SkeletonWrite = skeleton ? { slots: skeleton.slots } : carrySkeleton(latest);
    const { template, version } = await insertVersion(existing.id, existing.latestVersionNo, baseVersionId, payload, changeNote, opts.caller.requester, sk);
    templatesLog({
      level: "info",
      message: "Profil templat diimpor (versi baru)",
      code: "TEMPLATE_IMPORTED",
      correlationId: cid,
      context: { templateId: existing.id, slug, versionNo: version.versionNo, paramsSha256: payload.paramsSha256, skeletonSha256: version.skeletonSha256, ...common },
    });
    return { template: toSummary(template, version), version: toVersionDto(version), created: false, unchanged: false, ...common };
  });
}

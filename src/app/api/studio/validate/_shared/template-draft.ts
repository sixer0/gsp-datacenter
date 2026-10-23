/**
 * Draf templat `studio.template/v2` untuk dry-run R08 (FIX-V, FIX-U M5; register 03 §4.7,
 * §12 R08, §13.5; D-139, D-163, D-247).
 *
 * Badan R08 boleh membawa medan tingkat atas `draftTemplate` di samping kiriman
 * `studio.doc/v2`:
 *
 *   { "template": StudioTemplateV2, "base"?: { "slug": string, "version"?: number } }
 *
 * `template` = isi yang AKAN disimpan editor (preset + esensial + lanjutan ADMIN +
 * roleFormats ADMIN + kerangka). `base` = templat yang sedang disunting (versi dasar
 * simpan); dipakai untuk membawa lapis tersembunyi pemanggil non-ADMIN persis seperti
 * simpan v2 (`carryHiddenForNonAdmin`), dan sebagai lapis dasar templat preset gaya yang
 * tidak membawa `preset`. Tidak ada yang disimpan.
 *
 * Resolusi mengikuti simpan v2 (`saveTemplateV2Tx`) memakai fungsi layanan yang sama,
 * tanpa tulis: bentuk SID04 (`parseTemplateV2`) + kerangka (`validateSkeleton`), lapis
 * dasar = rantai preset (`loadTemplateLayers`), lapis templat = esensial ∪ lanjutan
 * (`templateLayerOf`, cek kunci `assertTemplateLayerKeys`), nilai efektif
 * (`composeVersion`), nilai efektif per slot (`resolveSkeletonSlots` berlapis). Templat
 * terbatas D-98 (preset, base, atau hasil draf) tetap 403 untuk pemanggil tidak tepercaya.
 *
 * Hak tulis per kunci (SR-55b N2, D-280 S2-01; FIX-S2): SAMA dengan simpan v2 — perubahan
 * relatif nilai efektif sebelumnya (`diffEffective`, termasuk lapis slot), lalu
 * `checkTemplateWrite` SR-06 (kunci asing, kelas T/turunan, cakupan slot, kelas K, lapis
 * lanjutan) + `assertAdminOnlyFields` (roleFormats). Pratinjau hanya menerapkan draf yang
 * BOLEH disimpan pemanggil: pelanggaran = isu dengan kode dan pesan yang sama dengan
 * penolakan simpan (`keyword` = kode), tanpa pratinjau.
 */
import {
  type DocMetaV2,
  type ParamIssue,
  type ParamMap,
  type ResolvedSlot,
  type ResolvedTemplate,
  type RoleFormatMap,
  type StudioCaller,
  type StudioTemplateV2,
  type StudioTier,
  type TemplateSlotDef,
  type ValidationIssue,
} from "@/lib/studio/contract";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import { resolveParams } from "@/lib/studio/engine/tokens";
import { ALL_PARAMS } from "@/lib/studio/params";
import type { SkeletonInput } from "@/lib/studio/services/compose";
import { effectiveTier } from "@/lib/studio/services/ingest/meta";
import {
  checkTemplateWrite,
  getSkeleton,
  loadTemplateLayers,
  resolveSkeletonSlots,
  skeletonSha256,
  validateSkeleton,
  type ParamChange,
  type TemplateLayers,
  type TemplateWriteTarget,
} from "@/lib/studio/services/skeleton";
import { composeVersion, foldOverrides, parseTemplateV2, resolveTemplate, stableStringify, validateRoleFormats, type ParamRecord } from "@/lib/studio/services/templates";
import { assertTemplateUsable, isAdminCaller } from "@/lib/studio/services/templates/access";
import {
  assertAdminOnlyFields,
  assertTemplateLayerKeys,
  carryHiddenForNonAdmin,
  diffEffective,
  ownRoleFormats,
  sanitizeStoredLayer,
  templateLayerOf,
} from "@/lib/studio/services/templates/v2";
import { apiLog, isRecord, type ReqCtx } from "@/lib/studio/http";

/** Pointer medan draf di badan permintaan. */
export const DRAFT_POINTER = "/draftTemplate";

export interface DraftTemplateResolved {
  /** Templat efektif draf (params lapis 1-4 + turunan, roleFormats, sectionPlan, aset preset/base). */
  tpl: ResolvedTemplate;
  /** Kerangka draf untuk ingest dryRun (`IngestOptions.skeleton`). */
  skeleton: SkeletonInput;
  /** Nilai efektif per slot aktif (RenderContext.slots pratinjau). */
  slots: ReadonlyMap<string, ResolvedSlot>;
  /** Slug templat yang sedang disunting (base) bila ada, selain itu slug preset. */
  slug: string;
  /** Tier resolusi slot (meta.tier kiriman atau `doc.defaultTier` draf). */
  tier: StudioTier;
}

export type DraftTemplateOutcome = { ok: true; draft: DraftTemplateResolved } | { ok: false; issues: ValidationIssue[] };

function seg(key: string): string {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}

/** Galat layanan templat/kerangka 4xx -> isu berpointer badan (detail `issues` ParamIssue/ValidationIssue atau daftar). */
export function issuesFromEngineDetails(err: StudioEngineError, fallbackPointer: string): ValidationIssue[] {
  const d = err.details;
  const list: unknown[] | null = Array.isArray(d) ? d : isRecord(d) && Array.isArray(d.issues) ? d.issues : null;
  if (list && list.length > 0) {
    return list.filter(isRecord).map((i) => ({
      pointer: typeof i.pointer === "string" ? i.pointer : fallbackPointer,
      keyword: typeof i.keyword === "string" ? i.keyword : typeof i.code === "string" ? i.code : err.code,
      message: typeof i.message === "string" ? i.message : err.message,
      ...(typeof i.checkId === "string" ? { checkId: i.checkId } : {}),
    }));
  }
  const pointer = isRecord(d) && typeof d.pointer === "string" ? d.pointer : fallbackPointer;
  return [{ pointer, keyword: err.code, message: err.message }];
}

function isClientError(err: unknown): err is StudioEngineError {
  return err instanceof StudioEngineError && err.httpStatus >= 400 && err.httpStatus < 500 && err.code !== "FORBIDDEN";
}

function readRef(v: unknown, pointer: string): { slug: string; version?: number } | ValidationIssue {
  if (!isRecord(v) || typeof v.slug !== "string" || v.slug.trim() === "") {
    return { pointer: `${pointer}/slug`, keyword: "required", message: "slug wajib berupa teks" };
  }
  if (v.version !== undefined && (!Number.isInteger(v.version) || (v.version as number) < 1)) {
    return { pointer: `${pointer}/version`, keyword: "type", message: "version wajib bilangan bulat >= 1" };
  }
  const extra = Object.keys(v).filter((k) => k !== "slug" && k !== "version");
  if (extra.length > 0) return { pointer: `${pointer}/${seg(extra[0])}`, keyword: "additionalProperties", message: `medan tidak dikenal: ${extra[0]}` };
  return { slug: v.slug, ...(v.version !== undefined ? { version: v.version as number } : {}) };
}

/** Templat tersimpan (preset atau base) + lapisnya; templat tidak ada = isu (bukan 404). */
async function loadRef(ref: { slug: string; version?: number }, pointer: string, caller: StudioCaller, purpose: string, cid: string): Promise<{ tpl: ResolvedTemplate; layers: TemplateLayers } | ValidationIssue> {
  let tpl: ResolvedTemplate;
  try {
    tpl = await resolveTemplate(ref.slug, ref.version);
  } catch (err) {
    if (err instanceof StudioEngineError && err.code === "TEMPLATE_NOT_FOUND") return { pointer: `${pointer}/slug`, keyword: "reference", message: err.message };
    throw err;
  }
  // D-98: templat terbatas hanya untuk pemanggil tepercaya (403 tetap respons HTTP).
  assertTemplateUsable(tpl, caller, { slug: ref.slug, purpose, correlationId: cid });
  return { tpl, layers: await loadTemplateLayers(tpl.versionId) };
}

function slotLayerOf(s: Pick<TemplateSlotDef, "essentials" | "advanced">): ParamRecord {
  return { ...(s.essentials ?? {}), ...(s.advanced ?? {}) } as ParamRecord;
}

function hasKey(rec: Record<string, unknown> | undefined, key: string): boolean {
  return rec !== undefined && Object.prototype.hasOwnProperty.call(rec, key);
}

/** Pointer badan tempat kunci draf dikirim (lapis global atau slot; `advanced` bila dikirim di sana). */
function draftKeyPointer(draft: StudioTemplateV2, tplPtr: string, key: string, slotKey: string | null): string {
  if (slotKey === null) return `${tplPtr}/${hasKey(draft.advanced, key) ? "advanced" : "essentials"}/${seg(key)}`;
  const i = draft.skeleton.slots.findIndex((s) => s.slotKey === slotKey);
  if (i < 0) return `${tplPtr}/skeleton/slots`;
  const s = draft.skeleton.slots[i];
  return `${tplPtr}/skeleton/slots/${i}/${hasKey(s.advanced, key) ? "advanced" : "essentials"}/${seg(key)}`;
}

/** Pointer medan khusus ADMIN (`roleFormats`, `skeleton.slots.<k>.roleFormats`). */
function adminFieldPointer(draft: StudioTemplateV2, tplPtr: string, field: string): string {
  const m = /^skeleton\.slots\.(.+)\.roleFormats$/.exec(field);
  if (!m) return `${tplPtr}/${field}`;
  const i = draft.skeleton.slots.findIndex((s) => s.slotKey === m[1]);
  return i < 0 ? `${tplPtr}/skeleton/slots` : `${tplPtr}/skeleton/slots/${i}/roleFormats`;
}

/**
 * Penolakan hak tulis simpan -> isu berpointer badan, satu per kunci/medan. `keyword` = kode
 * galat simpan (mis. PARAM_CLASS_K_FORBIDDEN), pesan = pesan simpan untuk kunci itu.
 */
function writeRightsIssuesOf(err: StudioEngineError, draft: StudioTemplateV2, tplPtr: string): ValidationIssue[] {
  const lead = err.message.split(": ")[0];
  const d = isRecord(err.details) ? err.details : {};
  if (Array.isArray(d.failures)) {
    return d.failures.filter(isRecord).map((f) => {
      const key = typeof f.key === "string" ? f.key : "";
      const slotKey = typeof f.slotKey === "string" ? f.slotKey : null;
      return { pointer: draftKeyPointer(draft, tplPtr, key, slotKey), keyword: err.code, message: `${lead}: ${typeof f.message === "string" ? f.message : key}` };
    });
  }
  if (err.code === "PARAM_SURFACE_FORBIDDEN" && Array.isArray(d.keys)) {
    return d.keys.filter((k): k is string => typeof k === "string").map((field) => ({ pointer: adminFieldPointer(draft, tplPtr, field), keyword: err.code, message: `${lead}: ${field}` }));
  }
  // PRESET_READONLY (templat yang disunting = preset gaya, non-ADMIN): seluruh simpan ditolak.
  return [{ pointer: `${DRAFT_POINTER}/base`, keyword: err.code, message: err.message }];
}

/**
 * SR-55b N2 / D-280 S2-01: hak tulis draf = hak SIMPAN v2 (`saveTemplateV2Tx` langkah 6-7):
 * perubahan per kunci relatif nilai efektif sebelumnya (lapis templat dan lapis slot), aturan
 * SR-06 `checkTemplateWrite`, lalu medan khusus ADMIN (`assertAdminOnlyFields`). `[]` = boleh.
 */
function draftWriteRightsIssues(
  caller: StudioCaller,
  target: TemplateWriteTarget,
  changes: readonly ParamChange[],
  adminOnly: readonly string[],
  draft: StudioTemplateV2,
  tplPtr: string,
): ValidationIssue[] {
  try {
    checkTemplateWrite(caller, target, changes);
    assertAdminOnlyFields(caller, adminOnly);
    return [];
  } catch (err) {
    if (!(err instanceof StudioEngineError) || err.httpStatus >= 500) throw err;
    return writeRightsIssuesOf(err, draft, tplPtr);
  }
}

/**
 * Resolusi draf. `{ ok: false, issues }` = draf tidak sah (R08 200 `valid:false`);
 * 403 FORBIDDEN (templat terbatas) dan galat server dilempar.
 */
export async function resolveDraftTemplate(raw: unknown, caller: StudioCaller, meta: unknown, ctx: ReqCtx): Promise<DraftTemplateOutcome> {
  const cid = ctx.correlationId;
  if (!isRecord(raw)) return { ok: false, issues: [{ pointer: DRAFT_POINTER, keyword: "type", message: "draftTemplate wajib objek { template, base? }" }] };
  const extra = Object.keys(raw).filter((k) => k !== "template" && k !== "base");
  if (extra.length > 0) return { ok: false, issues: [{ pointer: `${DRAFT_POINTER}/${seg(extra[0])}`, keyword: "additionalProperties", message: `medan tidak dikenal: ${extra[0]}` }] };
  const tplPtr = `${DRAFT_POINTER}/template`;
  try {
    // 1. Bentuk SID04 + kerangka (aturan SR-06).
    const draft: StudioTemplateV2 = parseTemplateV2(raw.template, tplPtr);
    validateSkeleton(draft.skeleton);
    const admin = isAdminCaller(caller);

    // 2. Templat yang disunting (opsional) dan preset.
    let base: { tpl: ResolvedTemplate; layers: TemplateLayers } | null = null;
    if (raw.base !== undefined) {
      const ref = readRef(raw.base, `${DRAFT_POINTER}/base`);
      if ("pointer" in ref) return { ok: false, issues: [ref] };
      const b = await loadRef(ref, `${DRAFT_POINTER}/base`, caller, "validate draft base", cid);
      if ("pointer" in b) return { ok: false, issues: [b] };
      base = b;
    }
    let preset: { tpl: ResolvedTemplate; layers: TemplateLayers } | null = null;
    if (draft.preset) {
      const p = await loadRef(draft.preset, `${tplPtr}/preset`, caller, "validate draft preset", cid);
      if ("pointer" in p) return { ok: false, issues: [p] };
      if (!p.layers.isPreset) return { ok: false, issues: [{ pointer: `${tplPtr}/preset/slug`, keyword: "preset", message: `templat ${draft.preset.slug} bukan preset gaya` }] };
      preset = p;
    }
    if (!preset && !base) {
      return { ok: false, issues: [{ pointer: `${tplPtr}/preset`, keyword: "required", message: "preset wajib kecuali templat preset gaya (kirim base)" }] };
    }

    // 3. Lapis dasar: rantai preset (versi preset termasuk), atau rantai di bawah versi base (preset gaya).
    const baseOverrides: ParamRecord = preset
      ? foldOverrides([preset.layers.layers.preset as ParamRecord, preset.layers.layers.template as ParamRecord])
      : ((base as { layers: TemplateLayers }).layers.layers.preset as ParamRecord);
    const baseRoleFormats: RoleFormatMap = preset ? preset.layers.roleFormats : (base as { layers: TemplateLayers }).layers.roleFormats;
    const baseSectionPlan = (preset ?? (base as { layers: TemplateLayers })).layers.sectionPlan;
    const inherited = resolveParams({ base: baseOverrides as ParamMap, overrides: {}, registry: ALL_PARAMS }).params;

    // 4. Lapis templat (esensial ∪ lanjutan); non-ADMIN membawa kunci tersembunyi versi base (sama dengan simpan).
    let layer = templateLayerOf(draft);
    const prevLayer = base ? sanitizeStoredLayer(base.layers.layers.template as ParamRecord).kept : {};
    if (!admin && base) layer = carryHiddenForNonAdmin(prevLayer, layer, inherited);
    assertTemplateLayerKeys(layer, `${tplPtr}/essentials`);

    // 5. roleFormats milik lapis: dikirim (divalidasi) atau dibawa dari versi base (sama dengan simpan).
    const prevOwnRoles: Record<string, unknown> = base ? ownRoleFormats(base.layers.roleFormats as Record<string, unknown>, baseRoleFormats as Record<string, unknown>) : {};
    let ownRoles: Record<string, unknown> = prevOwnRoles;
    if (draft.roleFormats !== undefined) {
      const r = validateRoleFormats(draft.roleFormats, `${tplPtr}/roleFormats`);
      if (r.issues.length > 0) return { ok: false, issues: r.issues.map((i: ParamIssue) => ({ pointer: i.pointer ?? `${tplPtr}/roleFormats`, keyword: i.code, message: i.message })) };
      ownRoles = ownRoleFormats(r.roleFormats as Record<string, unknown>, baseRoleFormats as Record<string, unknown>);
    }

    // 6. Nilai efektif (resolusi parameter, kelas T dihitung ulang).
    const payload = composeVersion({ baseOverrides, overrides: layer, baseRoleFormats, roleFormats: ownRoles, baseSectionPlan, assets: {} });
    const host = base ?? (preset as { tpl: ResolvedTemplate });
    const tpl: ResolvedTemplate = {
      templateId: host.tpl.templateId,
      versionId: host.tpl.versionId,
      versionNo: host.tpl.versionNo,
      params: Object.freeze({ ...payload.resolvedParams }) as ParamMap,
      roleFormats: payload.roleFormats,
      sectionPlan: payload.sectionPlan,
      // Aset fon/raster dari versi tersimpan (draf tidak mengunggah aset templat).
      assets: (preset ?? host).tpl.assets,
    };
    // D-98 atas HASIL draf: pengaturan yang membuat templat terbatas hanya untuk pemanggil tepercaya.
    assertTemplateUsable(tpl, caller, { slug: base ? (raw.base as { slug: string }).slug : draft.preset?.slug, purpose: "validate draft", correlationId: cid });

    // Tier dokumen contoh (meta.tier, selain itu `doc.defaultTier` draf), sama dengan ingest.
    const tier: StudioTier = effectiveTier(isRecord(meta) ? (meta as DocMetaV2) : undefined, tpl.params);

    // 7. Kerangka (sama dengan simpan langkah 5): lapis slot lama (sectionType sama) = dasar
    // perubahan; non-ADMIN membawa kunci tersembunyi; roleFormats slot tidak dikirim = dibawa.
    const prevSlots = base ? await getSkeleton(base.tpl.versionId) : null;
    const prevByKey = new Map((prevSlots && !prevSlots.implicit ? prevSlots.skeleton.slots : []).map((s) => [s.slotKey, s]));
    const prevSlotOf = (s: TemplateSlotDef): TemplateSlotDef | undefined => {
      const p = prevByKey.get(s.slotKey);
      return p && p.sectionType === s.sectionType ? p : undefined;
    };
    const slotsIn: TemplateSlotDef[] = draft.skeleton.slots.map((s) => {
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

    // 7b. SR-55b N2 / D-280 S2-01: hak tulis = hak SIMPAN (simpan langkah 6-7). Draf yang tidak
    // boleh disimpan pemanggil tidak dipratinjau; isunya sama dengan penolakan simpan.
    const changes: ParamChange[] = diffEffective(prevLayer, layer, inherited);
    const adminOnly: string[] = [];
    if (stableStringify(ownRoles) !== stableStringify(prevOwnRoles)) adminOnly.push("roleFormats");
    for (const s of skeleton.slots) {
      const prev = prevSlotOf(s);
      changes.push(...diffEffective(prev ? slotLayerOf(prev) : {}, slotLayerOf(s), payload.resolvedParams, { slotKey: s.slotKey, sectionType: s.sectionType, admits: s.admits }));
      if (stableStringify(s.roleFormats ?? {}) !== stableStringify(prev?.roleFormats ?? {})) adminOnly.push(`skeleton.slots.${s.slotKey}.roleFormats`);
    }
    const slug = base ? (raw.base as { slug: string }).slug : (draft.preset as { slug: string }).slug;
    const rightsIssues = draftWriteRightsIssues(caller, { isPreset: base ? base.layers.isPreset : false, restricted: false, slug }, changes, adminOnly, draft, tplPtr);
    if (rightsIssues.length > 0) {
      apiLog({
        ...ctx,
        level: "info",
        message: "draft template: changes the caller may not save",
        code: "DRAFT_TEMPLATE_WRITE_FORBIDDEN",
        context: { callerKind: caller.kind, code: rightsIssues[0].keyword, keys: rightsIssues.length },
      });
      return { ok: false, issues: rightsIssues };
    }

    // 8. Nilai efektif per slot (resolusi berlapis, fase lapis sekali; sama dengan resolveSlotsForVersion).
    const presetPins = new Set(Object.keys(baseOverrides));
    const resolved = resolveSkeletonSlots({ params: tpl.params, roleFormats: tpl.roleFormats }, skeleton.slots, presetPins, {
      layers: { preset: baseOverrides as ParamMap, template: layer as ParamMap },
      tier,
    });
    if (resolved.issues.length > 0) {
      apiLog({
        ...ctx,
        level: "warn",
        message: "draft template: slot parameters not applied",
        code: "DRAFT_SLOT_PARAM_SKIPPED",
        context: { issues: resolved.issues.slice(0, 20).map((i) => ({ key: i.key, code: i.code, pointer: i.pointer ?? null })) },
      });
    }
    return {
      ok: true,
      draft: {
        tpl,
        skeleton: { templateVersionId: tpl.versionId, skeleton, skeletonSha256: skeletonSha256(skeleton), implicit: false },
        slots: resolved.slots,
        slug,
        tier,
      },
    };
  } catch (err) {
    if (isClientError(err)) return { ok: false, issues: issuesFromEngineDetails(err, tplPtr) };
    throw err;
  }
}

/**
 * Helper bersama seed templat turunan-preset (baris S09; research/33 C-01..C-06; D-595).
 *
 * Diekstrak dari jalur `--contract-templates` `prisma/seed-studio.ts` tanpa mengubah perilakunya, agar jalur
 * templat berikutnya (mis. `--doc-type-templates`, S27) memakai helper yang sama dengan satu tabel spec,
 * bukan blok seed tersalin. Tidak ada cabang slug/jenis dokumen: CH-06 dicek untuk setiap spec (S27; slot
 * `contractRecord` hanya sah bila data `contractKind` spec terisi).
 *
 *   - `presetSlotEssentials`: kenop esensial per slot dibaca dari nilai efektif preset (+ override per slot).
 *   - `derivedTemplatePlan` / `ensureDerivedTemplate`: templat = rujukan versi preset terbaru + esensial global
 *     + lapis spec + kerangka; idempoten lewat `ensureSkeletonVersion`.
 *   - `derivedTemplateStoredIssues`: cek baris tersimpan generik (contractKind null-aman, AC-2: tidak terbatas,
 *     tidak terarsip, basis = versi preset terbaru).
 *   - `runGuardedTemplateTx`: satu transaksi berpenjaga (templat lain dan section type tidak berubah), `--dry-run`
 *     = rollback lewat sinyal setelah laporan dan penjaga dihitung.
 *
 * Modul ini tidak membuka koneksi DB sendiri dan tidak memeriksa nama DB izin (penjaga `ALLOWED_DATABASES` tetap
 * di `seed-studio.ts`); runner hanya mencocokkan DB transaksi dengan DB yang sudah diperiksa pemanggil.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import { CONTENT_BLOCK_TYPES, type ParamValue, type StudioCaller, type StudioTemplateV2, type TemplateSlotDef } from "../src/lib/studio/contract";
import { WRAPPER_TEXT } from "../src/lib/studio/engine/front/texts";
import { validateParamValue } from "../src/lib/studio/engine/tokens";
import { stableStringify } from "../src/lib/studio/services/ingest";
import { PARAMS_BY_KEY } from "../src/lib/studio/params";
import { ESSENTIAL_KNOBS } from "../src/lib/studio/registry/essentials";
import { contractRecordSkeletonIssues, isScopeAllowedInSlot } from "../src/lib/studio/registry/slots";
import { skeletonSha256, validateSkeleton } from "../src/lib/studio/services/skeleton";
import {
  createTemplateV2InTx,
  createTemplateVersionV2InTx,
  type ParamRecord,
  splitBySurface,
  templateRestriction,
} from "../src/lib/studio/services/templates";

export type Tx = Prisma.TransactionClient;
export type VersionRow = Awaited<ReturnType<PrismaClient["studioTemplateVersion"]["findFirstOrThrow"]>>;
export type SeedLog = (level: "info" | "warn" | "error", message: string, context?: Record<string, unknown>, err?: unknown) => void;
/** Definisi slot tanpa kenop (kenop dibaca dari preset saat seed). */
export type SlotShape = Omit<TemplateSlotDef, "essentials">;

export const TEMPLATE_V2_SCHEMA_ID = "studio.template/v2" as const;
export const PRESET_TX_TIMEOUT_MS = 180_000;
export const SEED_ACTOR = "seed-studio";
/** Impor profil Manual 000 memuat override kelas K: wajib pemanggil ADMIN_SESSION (KT-16). */
export const ADMIN_CALLER: StudioCaller = { kind: "ADMIN_SESSION", requester: SEED_ACTOR, canWriteClassK: true };

/**
 * Kerangka bawaan 7 slot GSP DATUM (register 03 §6.1 SL-01..SL-07; blueprint §2.3): satu sumber untuk
 * `--presets-and-skeletons` (datum-gsp, datum-kanonik) dan tabel spec `--doc-type-templates` (S26).
 * L8 (D-610): label slot lembar kendali dan daftar isi dari tabel teks pembungkus (`WRAPPER_TEXT`), sumber yang
 * sama dengan terjemahan EN `controlSheetLabelText`; nilainya tetap "Lembar Kendali" / "Daftar Isi" (byte-sama).
 */
export const DATUM_SKELETON_SLOTS: ReadonlyArray<SlotShape> = [
  { slotKey: "cover", sectionType: "cover", label: "Sampul", position: 1, required: true, positionLocked: true, repeatable: false, contentMode: "MIXED", tiers: ["TERBIT", "SERAH"], admits: [] },
  { slotKey: "controlSheet", sectionType: "controlSheet", label: WRAPPER_TEXT.controlKicker.ID, position: 2, required: true, positionLocked: false, repeatable: false, contentMode: "INPUT", tiers: ["TERBIT", "SERAH"], admits: [] },
  { slotKey: "signature", sectionType: "signatureBlock", label: "Tanda Tangan", position: 3, required: true, positionLocked: false, repeatable: false, contentMode: "INPUT", tiers: ["TERBIT", "SERAH"], admits: [] },
  { slotKey: "toc", sectionType: "toc", label: WRAPPER_TEXT.tocKicker.ID, position: 4, required: true, positionLocked: false, repeatable: false, contentMode: "AUTO", tiers: ["TERBIT", "SERAH"], admits: [] },
  { slotKey: "content", sectionType: "chapter", label: "Isi", position: 5, required: true, positionLocked: false, repeatable: true, minItems: 1, contentMode: "INPUT", tiers: [], admits: [...CONTENT_BLOCK_TYPES] },
  { slotKey: "references", sectionType: "sourceRegister", label: "Referensi", position: 6, required: false, positionLocked: false, repeatable: false, contentMode: "INPUT", tiers: [], admits: [] },
  { slotKey: "appendices", sectionType: "appendix", label: "Lampiran", position: 7, required: false, positionLocked: true, repeatable: true, contentMode: "INPUT", tiers: [], admits: [...CONTENT_BLOCK_TYPES] },
];

/** Sinyal rollback `--dry-run` (bukan galat). */
export class DryRunRollback extends Error {
  constructor(readonly report: unknown) {
    super("dry-run: transaksi preset/kerangka di-rollback");
  }
}

export const stable = (v: unknown): string => stableStringify(v ?? null);
export const asRecord = (v: unknown): ParamRecord => (v !== null && typeof v === "object" && !Array.isArray(v) ? (v as ParamRecord) : {});

/** Nilai kenop esensial (pemetaan selain `medan`, kunci berlapis essential) dari nilai efektif; nilai tidak sah dilewati. */
export function knobValues(scope: string, effective: ParamRecord, accept: (key: string) => boolean = () => true): { values: ParamRecord; skipped: string[] } {
  const values: ParamRecord = {};
  const skipped: string[] = [];
  for (const knob of ESSENTIAL_KNOBS) {
    if (knob.scope !== scope || knob.mapping === "medan") continue;
    for (const key of knob.keys) {
      if (key in values || skipped.includes(key)) continue;
      const def = PARAMS_BY_KEY.get(key);
      const v = effective[key];
      if (!def || def.surface !== "essential" || v === undefined || validateParamValue(def, v) !== null || !accept(key)) skipped.push(key);
      else values[key] = v;
    }
  }
  return { values, skipped };
}

/** Override nilai kenop per slot (`slotKey` -> kunci -> nilai), mis. `cover.kicker.text` per jenis dokumen. */
export type SlotOverrides = Readonly<Record<string, ParamRecord>>;

/**
 * Kerangka berkenop: tiap slot = salinan definisi + kenop esensial lingkup slot dari nilai efektif preset
 * (`null` = tanpa kenop, mis. kerangka preset), lalu override per slot. Override wajib kunci dikenal, berlingkup
 * slot itu, dan bernilai sah; slot override wajib ada di kerangka.
 */
export function presetSlotEssentials(
  slots: ReadonlyArray<SlotShape>,
  presetEffective: ParamRecord | null,
  slotOverrides?: SlotOverrides,
): { slots: TemplateSlotDef[]; skipped: Record<string, string[]> } {
  const unknownSlots = Object.keys(slotOverrides ?? {}).filter((k) => !slots.some((s) => s.slotKey === k));
  if (unknownSlots.length > 0) throw new Error(`Override kenop untuk slot yang tidak ada di kerangka: ${unknownSlots.join(", ")}`);
  const skipped: Record<string, string[]> = {};
  const out = slots.map((s) => {
    let essentials: ParamRecord = {};
    if (presetEffective) {
      const k = knobValues(s.sectionType, presetEffective, (key) => isScopeAllowedInSlot(PARAMS_BY_KEY.get(key)!.scope, s));
      if (k.skipped.length > 0) skipped[s.slotKey] = k.skipped;
      essentials = k.values;
    }
    const over = slotOverrides?.[s.slotKey];
    if (over) {
      for (const [key, value] of Object.entries(over)) {
        const def = PARAMS_BY_KEY.get(key);
        if (!def) throw new Error(`Override slot ${s.slotKey}: kunci ${key} tidak dikenal registri`);
        if (!isScopeAllowedInSlot(def.scope, s)) throw new Error(`Override slot ${s.slotKey}: kunci ${key} (lingkup ${def.scope}) di luar lingkup slot`);
        const bad = validateParamValue(def, value as ParamValue);
        if (bad !== null) throw new Error(`Override slot ${s.slotKey}: nilai ${key} tidak sah: ${bad}`);
      }
      essentials = { ...essentials, ...over };
    }
    return { ...s, admits: [...s.admits], tiers: [...s.tiers], essentials };
  });
  return { slots: out, skipped };
}

export async function latestVersionOf(tx: Tx, templateId: string, latestVersionNo: number): Promise<VersionRow> {
  return tx.studioTemplateVersion.findUniqueOrThrow({ where: { templateId_versionNo: { templateId, versionNo: latestVersionNo } } });
}

/** Versi templat berkerangka = rujukan versi preset + lapis esensial/lanjutan + kerangka; idempoten. */
export async function ensureSkeletonVersion(
  tx: Tx,
  p: {
    slug: string;
    name: string;
    description: string;
    preset: { slug: string; version: VersionRow };
    essentials: ParamRecord;
    advanced?: ParamRecord;
    roleFormats?: Record<string, unknown>;
    skeletonSlots: TemplateSlotDef[];
    changeNote: string;
    /**
     * DC-29: jenis kontrak C58 templat (dibuat dengan medan ini; templat yang ada wajib sama). `null` = templat
     * dokumen output (dibuat tanpa medan; templat yang ada wajib tanpa jenis kontrak); `undefined` = tidak dicek.
     */
    contractKind?: string | null;
  },
): Promise<{ outcome: "created" | "new-version" | "unchanged"; version: VersionRow; computedSkeletonSha256: string }> {
  const definition: StudioTemplateV2 = {
    $schema: TEMPLATE_V2_SCHEMA_ID,
    preset: { slug: p.preset.slug, version: p.preset.version.versionNo },
    essentials: p.essentials,
    ...(p.advanced && Object.keys(p.advanced).length > 0 ? { advanced: p.advanced } : {}),
    ...(p.roleFormats && Object.keys(p.roleFormats).length > 0 ? { roleFormats: p.roleFormats as StudioTemplateV2["roleFormats"] } : {}),
    skeleton: { slots: p.skeletonSlots },
  };
  const wantSk = skeletonSha256(validateSkeleton({ slots: p.skeletonSlots }));
  const wantLayer = { ...p.essentials, ...(p.advanced ?? {}) };
  const t = await tx.studioTemplate.findUnique({ where: { slug: p.slug } });
  let outcome: "created" | "new-version" | "unchanged";
  if (!t) {
    await createTemplateV2InTx(
      tx,
      { slug: p.slug, name: p.name, kind: "DOCUMENT", description: p.description, changeNote: p.changeNote, template: definition, ...(p.contractKind ? { contractKind: p.contractKind } : {}) },
      ADMIN_CALLER,
    );
    outcome = "created";
  } else {
    if (p.contractKind !== undefined && (t.contractKind ?? null) !== p.contractKind) {
      throw new Error(`Templat ${p.slug} ber-contractKind ${String(t.contractKind)}, diharapkan ${String(p.contractKind)}; tidak diubah seed`);
    }
    const latest = await latestVersionOf(tx, t.id, t.latestVersionNo);
    if (latest.skeletonSha256 === wantSk && latest.baseVersionId === p.preset.version.id && stable(asRecord(latest.overrides)) === stable(wantLayer)) {
      outcome = "unchanged";
    } else {
      await createTemplateVersionV2InTx(tx, t.id, { baseVersionNo: t.latestVersionNo, changeNote: p.changeNote, template: definition }, ADMIN_CALLER);
      outcome = "new-version";
    }
  }
  const t2 = await tx.studioTemplate.findUniqueOrThrow({ where: { slug: p.slug } });
  return { outcome, version: await latestVersionOf(tx, t2.id, t2.latestVersionNo), computedSkeletonSha256: wantSk };
}

// ── Templat turunan-preset (C-01, C-02, C-06) ─────────────────────────────

/** Satu baris tabel spec templat turunan preset. */
export interface DerivedTemplateSpec {
  slug: string;
  name: string;
  description: string;
  presetSlug: string;
  /** Kerangka register (kenop slot dibaca dari preset saat seed). */
  slots: ReadonlyArray<SlotShape>;
  /** Lapis templat (kunci doc.* bawaan jenis/bahasa, dsb.), di atas esensial global preset. */
  layer: ParamRecord;
  slotOverrides?: SlotOverrides;
  /** Jenis kontrak C58; `null` = templat dokumen output (CH-06 tetap dicek: slot `contractRecord` ditolak). */
  contractKind: string | null;
  /** Catatan perubahan versi baru (hanya dipakai bila versi ditulis). */
  changeNote: (c: { presetVersionNo: number; slotCount: number }) => string;
}

/** Rencana murni templat turunan dari nilai efektif preset (tanpa DB). */
export function derivedTemplatePlan(spec: DerivedTemplateSpec, presetEffective: ParamRecord) {
  const global = knobValues("global", presetEffective);
  const split = splitBySurface({ ...global.values, ...spec.layer });
  const skeleton = presetSlotEssentials(spec.slots, presetEffective, spec.slotOverrides);
  return {
    globalSkipped: global.skipped,
    split,
    slots: skeleton.slots,
    slotSkipped: skeleton.skipped,
    /** Lapis versi yang disimpan (`overrides`) = esensial + lanjutan. Sidik kerangka dihitung `ensureSkeletonVersion` (sesudah CH-06). */
    overrides: { ...split.essentials, ...split.advanced } as ParamRecord,
  };
}

export type DerivedStoredIssue = "contractKind" | "archived" | "restricted" | "baseVersionId" | "skeletonSha256" | "slots" | "layer";

/** Cek baris tersimpan generik (C-06 + AC-2). Kosong = sesuai spec. */
export function derivedTemplateStoredIssues(i: {
  template: { contractKind: string | null; archived: boolean };
  version: { skeletonSha256: string | null; baseVersionId: string | null; resolvedParams: unknown };
  computedSkeletonSha256: string;
  storedSlots: ReadonlyArray<{ slotKey: string; sectionTypeKey: string; position: number }>;
  specSlots: ReadonlyArray<{ slotKey: string; sectionType: string; position: number }>;
  layer: ParamRecord;
  contractKind: string | null;
  presetVersionId: string;
}): DerivedStoredIssue[] {
  const issues: DerivedStoredIssue[] = [];
  const eff = asRecord(i.version.resolvedParams);
  if ((i.template.contractKind ?? null) !== (i.contractKind ?? null)) issues.push("contractKind");
  if (i.template.archived) issues.push("archived");
  if (templateRestriction(eff).restricted) issues.push("restricted");
  if (i.version.baseVersionId !== i.presetVersionId) issues.push("baseVersionId");
  if (i.version.skeletonSha256 !== i.computedSkeletonSha256) issues.push("skeletonSha256");
  if (stable(i.storedSlots.map((s) => [s.slotKey, s.sectionTypeKey, s.position])) !== stable(i.specSlots.map((s) => [s.slotKey, s.sectionType, s.position]))) issues.push("slots");
  if (stable(Object.fromEntries(Object.keys(i.layer).map((k) => [k, eff[k]]))) !== stable(i.layer)) issues.push("layer");
  return issues;
}

export type DerivedTemplateReport = Record<string, unknown> & {
  slug: string;
  outcome: "created" | "new-version" | "unchanged";
  storedOk: boolean;
  storedIssues: DerivedStoredIssue[];
  contractKind: string | null;
  versionNo: number;
  ch06Issues: number;
};

/** Satu templat turunan preset lewat layanan templat v2 (CH-06 dicek untuk setiap spec); idempoten. */
export async function ensureDerivedTemplate(tx: Tx, spec: DerivedTemplateSpec): Promise<DerivedTemplateReport> {
  const pt = await tx.studioTemplate.findUnique({ where: { slug: spec.presetSlug } });
  if (!pt || !pt.isPreset) throw new Error(`Preset ${spec.presetSlug} tidak ada atau bukan preset; jalankan --presets-and-skeletons lebih dulu`);
  const presetVersion = await latestVersionOf(tx, pt.id, pt.latestVersionNo);
  const plan = derivedTemplatePlan(spec, asRecord(presetVersion.resolvedParams));
  // Pertahanan seed: CH-06 selalu dicek sebelum layanan (layanan juga menolak 400 SCHEMA_INVALID). Spec tanpa
  // contractKind yang memuat slot `contractRecord` gagal di sini; kerangka tanpa slot itu selalu lolos (S27).
  const ch06 = contractRecordSkeletonIssues(plan.slots, spec.contractKind);
  if (ch06.length > 0) throw new Error(`CH-06 ${spec.slug}: ${ch06.map((i) => `${i.pointer} ${i.message}`).join("; ")}`);
  const r = await ensureSkeletonVersion(tx, {
    slug: spec.slug,
    name: spec.name,
    description: spec.description,
    preset: { slug: spec.presetSlug, version: presetVersion },
    essentials: plan.split.essentials,
    advanced: plan.split.advanced,
    skeletonSlots: plan.slots,
    changeNote: spec.changeNote({ presetVersionNo: presetVersion.versionNo, slotCount: plan.slots.length }),
    contractKind: spec.contractKind,
  });
  const t = await tx.studioTemplate.findUniqueOrThrow({ where: { slug: spec.slug } });
  const stored = await tx.studioTemplateSlot.findMany({
    where: { templateVersionId: r.version.id },
    orderBy: { position: "asc" },
    select: { slotKey: true, sectionTypeKey: true, position: true, required: true, repeatable: true, positionLocked: true, minItems: true, contentMode: true, tiers: true, admits: true },
  });
  const eff = asRecord(r.version.resolvedParams);
  const storedIssues = derivedTemplateStoredIssues({
    template: t,
    version: r.version,
    computedSkeletonSha256: r.computedSkeletonSha256,
    storedSlots: stored,
    specSlots: spec.slots,
    layer: spec.layer,
    contractKind: spec.contractKind,
    presetVersionId: presetVersion.id,
  });
  return {
    slug: spec.slug,
    kind: spec.contractKind,
    outcome: r.outcome,
    storedOk: storedIssues.length === 0,
    storedIssues,
    contractKind: t.contractKind ?? null,
    templateKind: t.kind,
    versionNo: r.version.versionNo,
    baseVersionId: r.version.baseVersionId,
    preset: { slug: spec.presetSlug, versionNo: presetVersion.versionNo, versionId: presetVersion.id },
    paramsSha256: r.version.paramsSha256,
    skeletonSha256: r.version.skeletonSha256,
    skeletonShaMatchesSeed: r.version.skeletonSha256 === r.computedSkeletonSha256,
    layer: Object.fromEntries(Object.keys(spec.layer).map((k) => [k, eff[k] ?? null])),
    essentials: Object.keys(plan.split.essentials).length,
    advanced: Object.keys(plan.split.advanced),
    skippedKnobKeys: { global: plan.globalSkipped, slots: plan.slotSkipped },
    ch06Issues: ch06.length,
    slots: stored.map((s) => ({ ...s, admits: s.admits.length })),
  };
}

// ── Runner transaksi berpenjaga (C-04) ────────────────────────────────────

interface TemplateSnapshotRow {
  slug: string;
  latestVersionNo: number;
  updatedAt: Date;
  contractKind: string | null;
  versions: bigint;
  paramsSha256: string | null;
  skeletonSha256: string | null;
}

/** Sidik templat selain sasaran: penjaga "templat lama tidak berubah" (§6.3). */
export async function snapshotTemplates(db: Tx, exclude: readonly string[]): Promise<Array<Record<string, unknown>>> {
  const rows = await db.$queryRaw<TemplateSnapshotRow[]>`
    select t.slug, t."latestVersionNo", t."updatedAt", t."contractKind",
           (select count(*) from "StudioTemplateVersion" y where y."templateId" = t.id) as versions,
           v."paramsSha256", v."skeletonSha256"
    from "StudioTemplate" t left join "StudioTemplateVersion" v on v."templateId" = t.id and v."versionNo" = t."latestVersionNo"
    where t.slug <> all(${[...exclude]}::text[])
    order by t.slug`;
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString(), versions: Number(r.versions) }));
}

/** DB transaksi wajib sama dengan DB yang sudah diperiksa penjaga izin pemanggil. */
export async function assertTxDatabase(tx: Tx, db: string): Promise<void> {
  const current = (await tx.$queryRaw<{ db: string }[]>`select current_database() as db`)[0]?.db;
  if (current !== db) throw new Error(`DB transaksi '${current}' berbeda dari DB yang diperiksa '${db}'`);
}

export interface SectionTypeSeedResult {
  registry: number;
  created: string[];
  updated: string[];
  unchanged: number;
}

export interface GuardedTemplateTxOptions {
  /** Pesan log laporan (mis. "Templat jenis kontrak"). */
  label: string;
  guardFailMessage: string;
  dryRunDoneMessage: string;
  /** DB yang sudah lolos penjaga izin pemanggil. */
  database: string;
  dryRun: boolean;
  /** Tabel spec; tiap baris satu templat sasaran. */
  specs: readonly DerivedTemplateSpec[];
  build?: (tx: Tx, spec: DerivedTemplateSpec) => Promise<DerivedTemplateReport>;
  /**
   * true = section type wajib tidak tersentuh sama sekali (tanpa create/update; penjaga gagal bila registri dan DB
   * berbeda). false/absen = section type yang tersentuh wajib = yang ditulis seed (jalur kontrak, perilaku S09).
   */
  freezeSectionTypes?: boolean;
  /** Hitungan bukti di akhir transaksi. */
  counts: (tx: Tx) => Promise<Record<string, number>>;
  timeoutMs?: number;
}

export interface GuardedTemplateTxSummary {
  sectionTypes: { create: string[]; update: string[]; unchanged: number };
  templates: Array<{ slug: string; outcome: string; versionNo: number; contractKind: string | null }>;
  counts: Record<string, number>;
  guardOk: boolean;
}

/**
 * Tabel spec dalam SATU transaksi; penjaga: templat selain sasaran tidak berubah dan tidak bertambah, section
 * type yang tersentuh = yang ditulis seed, setiap templat sasaran `storedOk`. Gagal = galat (rollback).
 * `dryRun` = rollback lewat `DryRunRollback` setelah laporan dan penjaga dihitung (0 tulis ter-commit).
 */
export async function runGuardedTemplateTx(
  client: Pick<PrismaClient, "$transaction">,
  opts: GuardedTemplateTxOptions,
  deps: { log: SeedLog; seedSectionTypes: (tx: Tx) => Promise<SectionTypeSeedResult> },
): Promise<GuardedTemplateTxSummary> {
  const targets = opts.specs.map((s) => s.slug);
  const build = opts.build ?? ensureDerivedTemplate;
  try {
    return await client.$transaction(
      async (tx) => {
        await assertTxDatabase(tx, opts.database);
        const beforeTemplates = await snapshotTemplates(tx, targets);
        const beforeSections = new Map((await tx.studioSectionType.findMany({ select: { key: true, updatedAt: true } })).map((r) => [r.key, r.updatedAt.toISOString()]));
        // FK slot -> section type: baris section type wajib ada di transaksi yang sama (dry-run: ikut di-rollback).
        const sectionTypes = await deps.seedSectionTypes(tx);
        const templates: DerivedTemplateReport[] = [];
        for (const spec of opts.specs) templates.push(await build(tx, spec));
        const afterTemplates = await snapshotTemplates(tx, targets);
        const afterByslug = new Map(afterTemplates.map((r) => [String(r.slug), r]));
        const changedTemplates = beforeTemplates.filter((b) => stable(b) !== stable(afterByslug.get(String(b.slug)) ?? null)).map((b) => String(b.slug));
        const addedTemplates = afterTemplates.filter((a) => !beforeTemplates.some((b) => b.slug === a.slug)).map((a) => String(a.slug));
        const afterSections = await tx.studioSectionType.findMany({ select: { key: true, updatedAt: true } });
        const sectionTypesTouched = afterSections.filter((r) => beforeSections.has(r.key) && beforeSections.get(r.key) !== r.updatedAt.toISOString()).map((r) => r.key);
        const counts = await opts.counts(tx);
        const guard = {
          ok:
            changedTemplates.length === 0 &&
            addedTemplates.length === 0 &&
            stable([...sectionTypesTouched].sort()) === stable([...sectionTypes.updated].sort()) &&
            (opts.freezeSectionTypes !== true || (sectionTypes.created.length === 0 && sectionTypes.updated.length === 0 && sectionTypesTouched.length === 0)) &&
            templates.every((t) => t.storedOk === true),
          otherTemplates: beforeTemplates.length,
          changedTemplates,
          addedTemplates,
          sectionTypesTouched,
          otherTemplatesBefore: beforeTemplates,
        };
        deps.log(guard.ok ? "info" : "error", opts.label, { database: opts.database, dryRun: opts.dryRun, sectionTypes, templates, counts, guard });
        if (!guard.ok) throw new Error(opts.guardFailMessage);
        const summary: GuardedTemplateTxSummary = {
          sectionTypes: { create: sectionTypes.created, update: sectionTypes.updated, unchanged: sectionTypes.unchanged },
          templates: templates.map((t) => ({ slug: t.slug, outcome: t.outcome, versionNo: t.versionNo, contractKind: t.contractKind })),
          counts,
          guardOk: guard.ok,
        };
        if (opts.dryRun) throw new DryRunRollback(summary);
        return summary;
      },
      { timeout: opts.timeoutMs ?? PRESET_TX_TIMEOUT_MS, maxWait: 10_000 },
    );
  } catch (err) {
    if (err instanceof DryRunRollback) {
      deps.log("info", opts.dryRunDoneMessage, { database: opts.database, plan: err.report });
      return err.report as GuardedTemplateTxSummary;
    }
    throw err;
  }
}

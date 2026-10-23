/**
 * Tulis revisi n+1 dari pohon konten v2 tersunting (SR-14; register 03 §9.1
 * butir 4, §8, §10; KD-10, KD-11, D-06, D-98/D-134).
 *
 * Berjalan di DALAM transaksi pemanggil yang sudah memegang kunci advisory
 * dokumen. Urutan: gerbang templat terbatas (D-98; op templateVersion juga
 * menilai versi SAAT INI, N-01/F-066) -> validasi struktur (compose SR-08) ->
 * compose snapshot norm/v2 -> baris struktur (SR-10 `rowsFromSource` + cap
 * pengisi) -> kelengkapan (SR-11) -> gerbang by-construction BERSAMA (SR-55 H1,
 * sama dengan R04; 422 `BY_CONSTRUCTION_FAILED`) -> baris revisi ->
 * `writeRevisionRows` (M14-M18 + tulis ganda M06; pensiun pid oleh repositori)
 * -> `StudioDocument` (revisi terkini, kelengkapan, cermin meta). Dipakai R16,
 * R06 (dokumen v2), dan R14.
 */
import { Prisma, type StudioDocument, type StudioRevision } from "@prisma/client";
import {
  ASSET_REF_PATTERN,
  type CompletenessReportV2,
  type DocMeta,
  type NormDocSnapshotV2,
  type StudioDocV2Resolved,
  type StudioTier,
} from "../../../contract";
import type { StudioCaller } from "../../../contract/auth";
import { StudioEngineError } from "../../../contract/errors";
import { computeCompleteness, type CompletenessInput } from "../../completeness";
import { composeV2, validateStructure, type ComposeAssetInfo, type SkeletonInput } from "../../compose";
import { isSlotActive, resolveSlotsForVersion } from "../../skeleton";
import {
  carryFillStamps,
  computeStructureSha256,
  dbPidAllocator,
  writeRevisionRows,
  type StructureRows,
} from "../../structure";
import { assertRevisionReconstructs } from "../../submit/integrity";
import { fillerOf } from "../../submit/meta";
import { assertByConstruction } from "../../ingest/by-construction";
import { assertTemplateUsable, resolveTemplateVersion } from "../../templates";
import { canonicalSha256, cloneJson } from "../canonical";
import { revisionLog } from "../log";
import { toJson } from "../rows";
import { chapterLocs } from "./tree";
import type { Db } from "./rows";

export interface CommitInput {
  document: StudioDocument;
  /** Revisi terbaru n (dibaca di dalam kunci). */
  base: StudioRevision;
  /** Pohon konten tersunting (semua bab/section/blok ber-id). */
  source: StudioDocV2Resolved;
  /** Versi templat terpatok revisi baru (KD-11; berubah hanya lewat op templateVersion). */
  templateVersionId: string;
  /** `StudioRevision.schemaId`; bawaan = milik revisi dasar (KD-10). D-196: migrasi v1 -> "studio.doc/v2". */
  schemaId?: string;
  caller: StudioCaller;
  change: { what: string; why: string; impact: string };
  changeScope: string;
  /** Alamat berubah (`StudioRevision.changedAddresses`), dihitung dari baris n dan n+1. */
  changedAddresses: (prev: StructureRows, next: StructureRows) => string[];
  /** Baris revisi n (sudah dibaca pemanggil di dalam kunci). */
  prevRows: StructureRows;
  /** Slot/bab yang isinya berubah (cap `lastFilled*`, register §8.2). */
  filled: { slots?: string[]; chapters?: string[] };
  /** Medan meta yang dicerminkan ke `StudioDocument` (setMeta). */
  metaMirror?: boolean;
  correlationId: string;
}

export interface CommitOutput {
  revision: StudioRevision;
  completeness: CompletenessReportV2;
  rows: StructureRows;
}

const ASSET_REF_RE = new RegExp(ASSET_REF_PATTERN);

function fail(code: ConstructorParameters<typeof StudioEngineError>[0], message: string, details?: unknown): never {
  throw new StudioEngineError(code, message, details);
}

/** sha256 aset yang dirujuk pohon (peta `assets` + `image.asset` langsung). */
function assetShas(src: StudioDocV2Resolved): string[] {
  const out = new Set<string>();
  for (const v of Object.values(src.assets ?? {})) {
    if (typeof v?.assetRef === "string" && ASSET_REF_RE.test(v.assetRef)) out.add(v.assetRef.slice(7));
  }
  for (const c of chapterLocs(src)) {
    const blocks = [...(c.chapter.intro ?? []), ...(c.chapter.sections ?? []).flatMap((s) => s.blocks ?? [])];
    for (const b of blocks) {
      if (b.type === "image" && typeof b.asset === "string" && ASSET_REF_RE.test(b.asset)) out.add(b.asset.slice(7));
    }
  }
  return [...out];
}

async function assetInfo(tx: Db, src: StudioDocV2Resolved): Promise<Record<string, ComposeAssetInfo>> {
  const shas = assetShas(src);
  if (shas.length === 0) return {};
  const rows = await tx.studioAsset.findMany({ where: { sha256: { in: shas } } });
  const out: Record<string, ComposeAssetInfo> = {};
  for (const r of rows) {
    out[r.sha256] = { mime: r.mime === "image/jpeg" ? "image/jpeg" : "image/png", relPath: r.relPath, widthPx: r.widthPx, heightPx: r.heightPx };
  }
  const missing = shas.filter((s) => !out[s]);
  if (missing.length > 0) fail("ASSET_NOT_FOUND", `Aset sha256:${missing[0]} belum diunggah; unggah lewat POST /api/studio/assets`, { asset: `sha256:${missing[0]}` });
  return out;
}

/** Masukan kelengkapan dari kerangka + baris revisi baru (register §8.1-8.2). */
function completenessInput(
  doc: StudioDocument,
  revisionNo: number,
  skel: SkeletonInput,
  tier: StudioTier,
  rows: StructureRows,
  order: readonly string[],
): CompletenessInput {
  const rowBySlot = new Map(rows.sections.map((s) => [s.slotKey, s]));
  const pos = new Map(order.map((k, i) => [k, i]));
  const slots = [...skel.skeleton.slots].sort((a, b) => (pos.get(a.slotKey) ?? 1000 + a.position) - (pos.get(b.slotKey) ?? 1000 + b.position));
  return {
    revisionNo,
    doc: { docId: doc.id, docNumber: doc.docNumber, missionFolder: doc.missionFolder, docKey: doc.missionDocKey },
    slots: slots.map((s) => {
      const row = rowBySlot.get(s.slotKey);
      return {
        slotKey: s.slotKey,
        sectionType: s.sectionType,
        label: s.label,
        required: s.required,
        repeatable: s.repeatable,
        minItems: s.minItems ?? null,
        maxItems: s.maxItems ?? null,
        contentMode: s.contentMode,
        active: isSlotActive(s, tier),
        row: row
          ? { filled: row.filled, payload: row.payload, lastFilledBy: row.lastFilledBy, lastFilledAt: row.lastFilledAt, lastFilledRevisionNo: row.lastFilledRevisionNo }
          : null,
        chapters: s.repeatable
          ? rows.chapters
              .filter((c) => c.slotKey === s.slotKey)
              .map((c) => ({ key: c.chapterKey, pid: c.pid, by: c.lastFilledBy, at: c.lastFilledAt, revisionNo: c.lastFilledRevisionNo }))
          : undefined,
      };
    }),
  };
}

function isUniqueViolation(e: unknown, field?: string): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  if (!field) return true;
  const target = (e.meta as { target?: unknown } | undefined)?.target;
  return Array.isArray(target) ? target.includes(field) : String(target ?? "").includes(field);
}

export async function commitV2Revision(tx: Db, input: CommitInput): Promise<CommitOutput> {
  const { document: doc, base, source, caller } = input;
  const tier = (source.meta.tier ?? doc.tier) as StudioTier;
  const newRevNo = base.revisionNo + 1;

  // 1) Templat terpatok + kerangka + nilai efektif per slot (SR-06), lalu gerbang D-98.
  const resolved = await resolveSlotsForVersion(input.templateVersionId, { tier, db: tx });
  if (input.templateVersionId !== base.templateVersionId) {
    // N-01 (F-066, D-247): pindah versi templat juga menilai versi SAAT INI dokumen; dokumen
    // pada versi terbatas tidak dapat dilepas ke versi tak terbatas oleh non-ADMIN (403).
    const current = await resolveTemplateVersion(base.templateVersionId);
    assertTemplateUsable(current, caller, { slug: resolved.template.slug, purpose: "revision (templateVersion: versi saat ini)", correlationId: input.correlationId });
  }
  assertTemplateUsable(
    { params: resolved.template.params, templateId: resolved.template.templateId, versionId: resolved.template.templateVersionId, versionNo: resolved.template.versionNo },
    caller,
    { slug: resolved.template.slug, purpose: "revision", correlationId: input.correlationId },
  );
  const templateSlotIds: Record<string, string> = {};
  if (!resolved.implicit) {
    for (const s of await tx.studioTemplateSlot.findMany({ where: { templateVersionId: input.templateVersionId }, select: { id: true, slotKey: true } })) templateSlotIds[s.slotKey] = s.id;
  }
  const skel: SkeletonInput = {
    templateVersionId: input.templateVersionId,
    skeleton: resolved.skeleton,
    skeletonSha256: resolved.skeletonSha256,
    implicit: resolved.implicit,
    templateSlotIds,
  };

  // 2) Struktur (422 SLOT_*, BLOCK_TYPE_NOT_ADMITTED, CHAPTER_KEY_INVALID) lalu compose.
  // D-258 (F-070): compose MEMAKAI baris revisi n (`prevRows`) dan pembangkit pid dokumen,
  // sama dengan kiriman SR-13 dan recomposer: pid baris slot `F:`/intro di snapshot = pid
  // baris M17 (sebelumnya snapshot `slot-<key>` vs baris backfill `b-…`).
  validateStructure(skel, tier, { structure: source.structure, sections: source.sections as Record<string, unknown> | undefined, pointer: "" });
  const slotParams: Record<string, (typeof resolved.template)["params"]> = {};
  for (const [k, s] of resolved.slots) slotParams[k] = s.params;
  const prevRows = input.prevRows;
  const allocator = await dbPidAllocator(tx, doc.id);
  const composed = composeV2({
    source,
    skeleton: skel,
    tier,
    params: resolved.template.params,
    slotParams,
    assets: await assetInfo(tx, source),
    prevRows,
    pids: allocator,
  });

  // 3) Baris struktur (SR-10) = baris compose (satu sumber dengan snapshot) + cap pengisi + sha struktur.
  // SR-55b N3: cap pengisi satu helper dengan kiriman (`fillerOf`); `createdBy` tetap requester (audit).
  const requester = caller?.requester || "anonymous";
  const rows = carryFillStamps(composed.rows, prevRows, input.filled, {
    lastFilledBy: fillerOf(caller),
    lastFilledAt: new Date().toISOString(),
    lastFilledRevisionNo: newRevNo,
  });
  const structureSha256 = computeStructureSha256({ skeletonSha256: skel.skeletonSha256, slots: composed.snapshot.skeleton.slots }, rows);

  // 4) Kelengkapan (SR-11) -> kolom revisi + dokumen.
  const order = composed.snapshot.skeleton.slots.filter((s) => s.active && !s.omitted).map((s) => s.slotKey);
  const completeness = computeCompleteness(completenessInput(doc, newRevNo, skel, tier, rows, order));

  // 4b) SR-55 H1 (F-065): gerbang by-construction BERSAMA atas snapshot hasil sunting, sebelum
  // revisi ditulis. Penanda tersimpan sudah dibuang untuk penyunting tidak tepercaya (D-134 R-01);
  // cek bergantung kelengkapan tidak menahan selama INCOMPLETE (D-131).
  const pinnedTpl = await resolveTemplateVersion(input.templateVersionId);
  assertByConstruction(
    { snapshot: composed.snapshot as NormDocSnapshotV2, tpl: pinnedTpl, tier, complete: completeness.status === "COMPLETE", correlationId: input.correlationId },
    (g) =>
      revisionLog({
        level: "warn",
        message: "by-construction blockers downgraded (D-34)",
        correlationId: input.correlationId,
        code: "D34_DOWNGRADED",
        context: { documentId: doc.id, changeScope: input.changeScope, checks: g.downgraded.map((d) => `${d.checkId}@${d.address ?? d.pointer ?? ""}`) },
      }),
  );

  // 5) Revisi + baris (repositori SR-10 menulis M14-M18 dan M06).
  const meta = composed.snapshot.source.meta as DocMeta;
  const revision = await tx.studioRevision.create({
    data: {
      documentId: doc.id,
      revisionNo: newRevNo,
      parentRevisionNo: base.revisionNo,
      templateVersionId: input.templateVersionId,
      snapshot: toJson(composed.snapshot),
      snapshotSha256: composed.snapshotSha256,
      inputSha256: canonicalSha256(source),
      docRev: meta.rev ?? base.docRev,
      changeWhat: input.change.what,
      changeWhy: input.change.why,
      changeImpact: input.change.impact,
      changedAddresses: input.changedAddresses(prevRows, rows),
      createdBy: requester,
      schemaId: input.schemaId ?? base.schemaId,
      structureSha256,
      completeness: completeness.status,
      completenessReport: toJson(completeness),
      changeScope: input.changeScope,
    },
  });
  await writeRevisionRows(tx, revision.id, rows, { correlationId: input.correlationId });
  // D-258: revisi baru wajib terekonstruksi persis dari barisnya sebelum commit (satu cek, semua jalur v2).
  await assertRevisionReconstructs(tx, { revisionId: revision.id, snapshot: composed.snapshot as NormDocSnapshotV2, snapshotSha256: composed.snapshotSha256 }, { correlationId: input.correlationId, documentId: doc.id, revisionNo: newRevNo, origin: `revision ${input.changeScope}` });

  // 6) Dokumen: penjaga optimis (kunci advisory sudah serial; ini sabuk pengaman).
  const docData: Prisma.StudioDocumentUpdateManyMutationInput = { currentRevisionNo: newRevNo, completeness: completeness.status };
  if (input.metaMirror) {
    docData.title = meta.title;
    docData.typeCode = meta.typeCode;
    docData.classification = meta.classification;
    if (meta.language) docData.language = meta.language;
    if (meta.tier) docData.tier = meta.tier;
    if (meta.docNumber) docData.docNumber = meta.docNumber;
  }
  try {
    const bumped = await tx.studioDocument.updateMany({ where: { id: doc.id, currentRevisionNo: base.revisionNo }, data: docData });
    if (bumped.count !== 1) fail("REVISION_CONFLICT", "Dokumen berubah bersamaan; ulangi dengan revisi terbaru", { baseRevisionNo: base.revisionNo });
  } catch (e) {
    if (isUniqueViolation(e, "docNumber")) fail("DOC_NUMBER_EXISTS", `Nomor dokumen ${meta.docNumber} sudah dipakai dokumen lain`, { docNumber: meta.docNumber });
    throw e;
  }
  return { revision, completeness, rows: cloneJson(rows) };
}

/**
 * Repositori struktur (SR-10, I47): tulis/baca baris M14-M17 per revisi
 * (salinan penuh, R6), identitas pid per dokumen M18 (buat/pensiun), dan tulis
 * ganda `StudioBlock` (M06, register §10).
 *
 * Semua penulisan berjalan di klien transaksi milik pemanggil (submit/revisi/
 * backfill) yang sudah memegang kunci advisory dokumen (§9.1); modul ini tidak
 * membuka transaksi sendiri.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InlineV2, StudioIdentityKind } from "../../contract";
import { StudioEngineError } from "../../contract/errors";
import { toJson } from "../revisions/rows";
import { logStructureError, newCorrelationId, structureLog } from "./log";
import { newRowId } from "./pid";
import { validateRows } from "./rows";
import {
  StructureRowsInvalidError,
  type StructureBlockRow,
  type StructureDb,
  type StructureRows,
} from "./types";

export interface WriteRevisionRowsOptions {
  /** Pensiunkan identitas aktif dokumen yang tidak ada di baris revisi ini (bawaan true). */
  retire?: boolean;
  /**
   * Pid pensiun yang muncul lagi: `reject` (bawaan) -> 422 PID_CONFLICT;
   * `revive` (khusus backfill SR-37) -> identitas diaktifkan ulang.
   */
  onRetiredPid?: "reject" | "revive";
  /** Tulis ganda M06 `StudioBlock` (bawaan true). */
  dualWriteLegacy?: boolean;
  correlationId?: string;
}

export interface WriteRevisionRowsResult {
  documentId: string;
  revisionNo: number;
  counts: { sections: number; chapters: number; subsections: number; blocks: number; legacyBlocks: number };
  identities: { created: number; retired: number; revived: number };
}

interface NeededIdentity {
  pid: string;
  kind: StudioIdentityKind;
}

/**
 * Pastikan setiap pid baris punya identitas M18 dokumen; pensiunkan identitas
 * aktif yang hilang. Mengembalikan peta pid -> id identitas.
 */
export async function syncIdentities(
  db: StructureDb,
  doc: { documentId: string; revisionNo: number; createdBy: string },
  needed: readonly NeededIdentity[],
  opts: Pick<WriteRevisionRowsOptions, "retire" | "onRetiredPid"> = {},
): Promise<{ ids: Map<string, string>; created: number; retired: number; revived: number }> {
  const existing = await db.studioDocIdentity.findMany({
    where: { documentId: doc.documentId },
    select: { id: true, pid: true, kind: true, createdRevisionNo: true, retiredRevisionNo: true },
  });
  const byPid = new Map(existing.map((e) => [e.pid, e]));
  const ids = new Map<string, string>();
  const toCreate: Prisma.StudioDocIdentityCreateManyInput[] = [];
  const toRevive: string[] = [];
  for (const n of needed) {
    const e = byPid.get(n.pid);
    if (!e) {
      const id = newRowId();
      ids.set(n.pid, id);
      toCreate.push({
        id,
        documentId: doc.documentId,
        pid: n.pid,
        kind: n.kind,
        createdRevisionNo: doc.revisionNo,
        createdBy: doc.createdBy,
      });
      continue;
    }
    if (e.kind !== n.kind) {
      throw new StudioEngineError("PID_CONFLICT", `Pid "${n.pid}" sudah dipakai untuk jenis lain (${e.kind}) di dokumen ini`, {
        pid: n.pid,
        kind: n.kind,
        existingKind: e.kind,
      });
    }
    if (e.retiredRevisionNo !== null && e.retiredRevisionNo <= doc.revisionNo) {
      if (opts.onRetiredPid !== "revive") {
        throw new StudioEngineError("PID_CONFLICT", `Pid "${n.pid}" sudah dipensiunkan pada revisi ${e.retiredRevisionNo} dan tidak dapat dipakai ulang`, {
          pid: n.pid,
          retiredRevisionNo: e.retiredRevisionNo,
        });
      }
      toRevive.push(e.id);
    }
    ids.set(n.pid, e.id);
  }
  if (toCreate.length > 0) await db.studioDocIdentity.createMany({ data: toCreate });
  if (toRevive.length > 0) {
    await db.studioDocIdentity.updateMany({ where: { id: { in: toRevive } }, data: { retiredRevisionNo: null } });
  }
  let retired = 0;
  if (opts.retire !== false) {
    const keep = new Set(needed.map((n) => n.pid));
    const stale = existing
      .filter((e) => e.retiredRevisionNo === null && e.createdRevisionNo <= doc.revisionNo && !keep.has(e.pid))
      .map((e) => e.id);
    if (stale.length > 0) {
      const r = await db.studioDocIdentity.updateMany({ where: { id: { in: stale } }, data: { retiredRevisionNo: doc.revisionNo } });
      retired = r.count;
    }
  }
  return { ids, created: toCreate.length, retired, revived: toRevive.length };
}

function legacyChapterKey(b: StructureBlockRow): string {
  return b.chapterKey ?? "F";
}

/**
 * I47 — tulis baris M14-M17 revisi (salinan penuh) + identitas M18 + M06.
 * Revisi harus belum punya baris struktur (melempar bila sudah ada).
 */
export async function writeRevisionRows(
  tx: StructureDb,
  revisionId: string,
  rows: StructureRows,
  opts: WriteRevisionRowsOptions = {},
): Promise<WriteRevisionRowsResult> {
  const correlationId = opts.correlationId ?? newCorrelationId();
  try {
    const issues = validateRows(rows);
    if (issues.length > 0) throw new StructureRowsInvalidError(issues);

    const rev = await tx.studioRevision.findUnique({
      where: { id: revisionId },
      select: { id: true, documentId: true, revisionNo: true, createdBy: true },
    });
    if (!rev) throw new StudioEngineError("REVISION_NOT_FOUND", `Revisi ${revisionId} tidak ditemukan`, { revisionId });
    const already = await tx.studioDocSection.count({ where: { revisionId } });
    if (already > 0) throw new StructureRowsInvalidError([`revision ${revisionId} already has ${already} section rows`]);

    // Identitas (M18).
    const needed: NeededIdentity[] = [
      ...rows.chapters.map((c) => ({ pid: c.pid, kind: "CHAPTER" as const })),
      ...rows.subsections.map((s) => ({ pid: s.pid, kind: "SUBSECTION" as const })),
      ...rows.blocks.map((b) => ({ pid: b.pid, kind: "BLOCK" as const })),
    ];
    const ident = await syncIdentities(
      tx,
      { documentId: rev.documentId, revisionNo: rev.revisionNo, createdBy: rev.createdBy },
      needed,
      opts,
    );
    const identityId = (pid: string): string => {
      const id = ident.ids.get(pid);
      if (!id) throw new StructureRowsInvalidError([`identity missing for pid ${pid}`]);
      return id;
    };

    // Aset (M13) per sha.
    const shas = [...new Set(rows.blocks.map((b) => b.assetSha256).filter((s): s is string => !!s))];
    const assetIdBySha = new Map<string, string>();
    if (shas.length > 0) {
      const assets = await tx.studioAsset.findMany({ where: { sha256: { in: shas } }, select: { id: true, sha256: true } });
      for (const a of assets) assetIdBySha.set(a.sha256, a.id);
      const missing = shas.filter((s) => !assetIdBySha.has(s));
      if (missing.length > 0) {
        throw new StudioEngineError("ASSET_NOT_FOUND", `Aset tidak ditemukan: ${missing.map((s) => `sha256:${s}`).join(", ")}`, {
          assetRefs: missing.map((s) => `sha256:${s}`),
        });
      }
    }

    // M14
    const sectionId = new Map<string, string>();
    const sectionData: Prisma.StudioDocSectionCreateManyInput[] = rows.sections.map((s) => {
      const id = newRowId();
      sectionId.set(s.slotKey, id);
      return {
        id,
        revisionId,
        templateSlotId: s.templateSlotId,
        slotKey: s.slotKey,
        sectionTypeKey: s.sectionTypeKey,
        position: s.position,
        filled: s.filled,
        payload: s.payload === null || s.payload === undefined ? undefined : toJson(s.payload),
        payloadSha256: s.payloadSha256,
        lastFilledBy: s.lastFilledBy,
        lastFilledAt: s.lastFilledAt ? new Date(s.lastFilledAt) : null,
        lastFilledRevisionNo: s.lastFilledRevisionNo,
      };
    });
    if (sectionData.length > 0) await tx.studioDocSection.createMany({ data: sectionData });

    // M15
    const chapterId = new Map<string, string>();
    const chapterData: Prisma.StudioDocChapterCreateManyInput[] = rows.chapters.map((c) => {
      const id = newRowId();
      chapterId.set(c.chapterKey, id);
      return {
        id,
        revisionId,
        docSectionId: sectionId.get(c.slotKey)!,
        identityId: identityId(c.pid),
        chapterKey: c.chapterKey,
        position: c.position,
        partKey: c.partKey,
        title: toJson(c.title),
        shortTitle: c.shortTitle,
        contentSha256: c.contentSha256,
        lastFilledBy: c.lastFilledBy,
        lastFilledAt: c.lastFilledAt ? new Date(c.lastFilledAt) : null,
        lastFilledRevisionNo: c.lastFilledRevisionNo,
      };
    });
    if (chapterData.length > 0) await tx.studioDocChapter.createMany({ data: chapterData });

    // M16
    const subId = new Map<string, string>();
    const subData: Prisma.StudioDocSubsectionCreateManyInput[] = rows.subsections.map((s) => {
      const id = newRowId();
      subId.set(`${s.chapterKey}\u0000${s.sectionNo}`, id);
      return {
        id,
        revisionId,
        chapterId: chapterId.get(s.chapterKey)!,
        identityId: identityId(s.pid),
        sectionNo: s.sectionNo,
        title: s.title === null ? undefined : toJson(s.title),
        contentSha256: s.contentSha256,
      };
    });
    if (subData.length > 0) await tx.studioDocSubsection.createMany({ data: subData });

    // M17 + M06
    const blockData: Prisma.StudioDocBlockCreateManyInput[] = rows.blocks.map((b) => ({
      id: newRowId(),
      revisionId,
      docSectionId: sectionId.get(b.slotKey)!,
      chapterId: b.chapterKey === null ? null : chapterId.get(b.chapterKey)!,
      subsectionId: b.chapterKey === null || b.sectionNo === null ? null : subId.get(`${b.chapterKey}\u0000${b.sectionNo}`)!,
      identityId: identityId(b.pid),
      pid: b.pid,
      address: b.address,
      artifactLabel: b.artifactLabel,
      ordinal: b.ordinal,
      paraNo: b.paraNo,
      type: b.type,
      content: toJson(b.content),
      textPlain: b.textPlain,
      contentSha256: b.contentSha256,
      assetId: b.assetSha256 ? assetIdBySha.get(b.assetSha256)! : null,
    }));
    if (blockData.length > 0) await tx.studioDocBlock.createMany({ data: blockData });

    let legacyBlocks = 0;
    if (opts.dualWriteLegacy !== false && rows.blocks.length > 0) {
      let fallback = 0;
      const legacy: Prisma.StudioBlockCreateManyInput[] = rows.blocks.map((b) => {
        if (!b.internal) fallback++;
        return {
          revisionId,
          blockId: b.pid,
          address: b.address,
          artifactLabel: b.artifactLabel,
          ordinal: b.ordinal,
          chapterKey: legacyChapterKey(b),
          sectionNo: b.sectionNo,
          paraNo: b.paraNo,
          type: b.internal?.type ?? b.type,
          content: toJson(b.internal ? b.internal.content : b.content),
          textPlain: b.internal?.textPlain ?? b.textPlain,
          contentSha256: b.internal ? b.internal.contentSha256 : b.contentSha256,
        };
      });
      const r = await tx.studioBlock.createMany({ data: legacy });
      legacyBlocks = r.count;
      if (fallback > 0) {
        structureLog({
          level: "warn",
          message: "StudioBlock dual-write used v2 content (no internal content attached)",
          correlationId,
          context: { revisionId, blocks: fallback },
        });
      }
    }

    const result: WriteRevisionRowsResult = {
      documentId: rev.documentId,
      revisionNo: rev.revisionNo,
      counts: {
        sections: sectionData.length,
        chapters: chapterData.length,
        subsections: subData.length,
        blocks: blockData.length,
        legacyBlocks,
      },
      identities: { created: ident.created, retired: ident.retired, revived: ident.revived },
    };
    structureLog({ level: "info", message: "structure rows written", correlationId, context: { revisionId, ...result } });
    return result;
  } catch (err) {
    logStructureError(correlationId, "writeRevisionRows failed", err, { revisionId });
    throw err;
  }
}

/** I47 — baca baris M14-M17 revisi (urut deterministik) + isi internal M06. */
export async function readRows(revisionId: string, db: StructureDb = prisma): Promise<StructureRows> {
  const [sections, chapters, subsections, blocks, legacy] = await Promise.all([
    db.studioDocSection.findMany({ where: { revisionId }, orderBy: { position: "asc" } }),
    db.studioDocChapter.findMany({ where: { revisionId }, include: { identity: { select: { pid: true } } } }),
    db.studioDocSubsection.findMany({ where: { revisionId }, include: { identity: { select: { pid: true } } } }),
    db.studioDocBlock.findMany({ where: { revisionId }, orderBy: { ordinal: "asc" }, include: { asset: { select: { sha256: true } } } }),
    db.studioBlock.findMany({ where: { revisionId }, select: { blockId: true, address: true, type: true, content: true, textPlain: true, contentSha256: true } }),
  ]);
  const secById = new Map(sections.map((s) => [s.id, s]));
  const chById = new Map(chapters.map((c) => [c.id, c]));
  const subById = new Map(subsections.map((s) => [s.id, s]));
  const legacyByAddr = new Map(legacy.map((l) => [l.address, l]));
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  const slotPos = (docSectionId: string) => secById.get(docSectionId)?.position ?? 0;

  const outChapters = chapters
    .map((c) => ({
      slotKey: secById.get(c.docSectionId)?.slotKey ?? "",
      chapterKey: c.chapterKey,
      pid: c.identity.pid,
      position: c.position,
      partKey: c.partKey,
      title: c.title as unknown as InlineV2,
      shortTitle: c.shortTitle,
      contentSha256: c.contentSha256,
      lastFilledBy: c.lastFilledBy,
      lastFilledAt: iso(c.lastFilledAt),
      lastFilledRevisionNo: c.lastFilledRevisionNo,
      _order: slotPos(c.docSectionId) * 10000 + c.position,
    }))
    .sort((a, b) => a._order - b._order);
  const chapterOrder = new Map(outChapters.map((c, i) => [c.chapterKey, i]));

  return {
    sections: sections.map((s) => ({
      slotKey: s.slotKey,
      sectionTypeKey: s.sectionTypeKey,
      templateSlotId: s.templateSlotId,
      position: s.position,
      filled: s.filled,
      payload: s.payload ?? null,
      payloadSha256: s.payloadSha256,
      lastFilledBy: s.lastFilledBy,
      lastFilledAt: iso(s.lastFilledAt),
      lastFilledRevisionNo: s.lastFilledRevisionNo,
    })),
    chapters: outChapters.map(({ _order: _o, ...c }) => {
      void _o;
      return c;
    }),
    subsections: subsections
      .map((s) => ({
        chapterKey: chById.get(s.chapterId)?.chapterKey ?? "",
        pid: s.identity.pid,
        sectionNo: s.sectionNo,
        title: (s.title ?? null) as InlineV2 | null,
        contentSha256: s.contentSha256,
      }))
      .sort((a, b) => (chapterOrder.get(a.chapterKey) ?? 0) - (chapterOrder.get(b.chapterKey) ?? 0) || a.sectionNo - b.sectionNo),
    blocks: blocks.map((b): StructureBlockRow => {
      const l = b.address ? legacyByAddr.get(b.address) : undefined;
      const row: StructureBlockRow = {
        slotKey: secById.get(b.docSectionId)?.slotKey ?? "",
        chapterKey: b.chapterId ? (chById.get(b.chapterId)?.chapterKey ?? null) : null,
        sectionNo: b.subsectionId ? (subById.get(b.subsectionId)?.sectionNo ?? null) : null,
        pid: b.pid,
        address: b.address ?? "",
        artifactLabel: b.artifactLabel,
        ordinal: b.ordinal,
        paraNo: b.paraNo,
        type: b.type,
        content: b.content,
        textPlain: b.textPlain,
        contentSha256: b.contentSha256,
        assetSha256: b.asset?.sha256 ?? null,
      };
      if (l && l.blockId === b.pid) {
        row.internal = { content: l.content, contentSha256: l.contentSha256, textPlain: l.textPlain, type: l.type };
      }
      return row;
    }),
  };
}

/**
 * Baca baris ternormalisasi M14-M18 untuk sunting per pid (SR-14; register
 * 03_structural_sections_specs.md §9.2 cek lingkup pid, §10 riwayat dan pensiun).
 *
 * Hanya kueri baca (penulisan baris revisi milik repositori struktur SR-10).
 * Semua fungsi menerima klien transaksi agar cek konflik berjalan di dalam
 * kunci advisory dokumen (§9.1 butir 4).
 */
import type { Prisma } from "@prisma/client";
import type { StudioIdentityKind } from "../../../contract";

export type Db = Prisma.TransactionClient;

export interface IdentityRow {
  id: string;
  pid: string;
  kind: StudioIdentityKind;
  createdRevisionNo: number;
  retiredRevisionNo: number | null;
}

/** Posisi satu identitas di satu revisi. */
export interface IdentityAt {
  revisionNo: number;
  createdBy: string;
  createdAt: Date;
  changeScope: string | null;
  contentSha256: string;
  /** Induk: identitas section/bab (BLOCK, SUBSECTION) atau slotKey (CHAPTER). */
  parent: string;
  address: string | null;
  artifactLabel: string | null;
  content: unknown;
}

export async function identityByPid(db: Db, documentId: string, pid: string): Promise<IdentityRow | null> {
  const r = await db.studioDocIdentity.findUnique({ where: { documentId_pid: { documentId, pid } } });
  return r ? { id: r.id, pid: r.pid, kind: r.kind as StudioIdentityKind, createdRevisionNo: r.createdRevisionNo, retiredRevisionNo: r.retiredRevisionNo } : null;
}

/** Semua pid dokumen (aktif dan pensiun; keunikan M18 termasuk pid pensiun, §10). */
export async function documentPids(db: Db, documentId: string): Promise<Map<string, IdentityRow>> {
  const rows = await db.studioDocIdentity.findMany({ where: { documentId } });
  return new Map(
    rows.map((r) => [r.pid, { id: r.id, pid: r.pid, kind: r.kind as StudioIdentityKind, createdRevisionNo: r.createdRevisionNo, retiredRevisionNo: r.retiredRevisionNo }]),
  );
}

/**
 * Posisi identitas per revisi untuk revisi `revisionNo >= fromRevisionNo`
 * (urut naik). Revisi tanpa baris identitas tidak muncul di peta.
 */
export async function identityTimeline(db: Db, documentId: string, ident: IdentityRow, fromRevisionNo = 1): Promise<Map<number, IdentityAt>> {
  const revWhere = { documentId, revisionNo: { gte: fromRevisionNo } };
  const revSel = { select: { revisionNo: true, createdBy: true, createdAt: true, changeScope: true } } as const;
  const out = new Map<number, IdentityAt>();
  const meta = (r: { revisionNo: number; createdBy: string; createdAt: Date; changeScope: string | null }) => ({
    revisionNo: r.revisionNo,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    changeScope: r.changeScope,
  });
  if (ident.kind === "BLOCK") {
    const rows = await db.studioDocBlock.findMany({
      where: { identityId: ident.id, revision: revWhere },
      include: { revision: revSel, subsection: { select: { identityId: true } }, chapter: { select: { identityId: true } }, docSection: { select: { slotKey: true } } },
    });
    for (const b of rows) {
      out.set(b.revision.revisionNo, {
        ...meta(b.revision),
        contentSha256: b.contentSha256,
        parent: b.subsection?.identityId ?? b.chapter?.identityId ?? `slot:${b.docSection.slotKey}`,
        address: b.address,
        artifactLabel: b.artifactLabel,
        content: b.content,
      });
    }
  } else if (ident.kind === "SUBSECTION") {
    const rows = await db.studioDocSubsection.findMany({
      where: { identityId: ident.id, revision: revWhere },
      include: { revision: revSel, chapter: { select: { identityId: true, chapterKey: true } } },
    });
    for (const s of rows) {
      out.set(s.revision.revisionNo, {
        ...meta(s.revision),
        contentSha256: s.contentSha256,
        parent: s.chapter.identityId,
        address: s.sectionNo === 0 ? s.chapter.chapterKey : `${s.chapter.chapterKey}.${s.sectionNo}`,
        artifactLabel: null,
        content: { sectionNo: s.sectionNo, title: s.title },
      });
    }
  } else {
    const rows = await db.studioDocChapter.findMany({
      where: { identityId: ident.id, revision: revWhere },
      include: { revision: revSel, docSection: { select: { slotKey: true } } },
    });
    for (const c of rows) {
      out.set(c.revision.revisionNo, {
        ...meta(c.revision),
        contentSha256: c.contentSha256,
        parent: `slot:${c.docSection.slotKey}`,
        address: c.chapterKey,
        artifactLabel: null,
        content: { key: c.chapterKey, title: c.title, shortTitle: c.shortTitle },
      });
    }
  }
  return out;
}

export interface ScopeChange {
  changedInRevisionNo: number;
  changedBy: string;
  current: IdentityAt | null;
}

/**
 * Cek lingkup pid (§9.2): konflik bila sha atau induk identitas berubah, atau
 * identitas muncul/pensiun, pada revisi > `baseRevisionNo` sampai `latestRevisionNo`.
 */
export async function pidScopeChange(
  db: Db,
  documentId: string,
  ident: IdentityRow,
  baseRevisionNo: number,
  latestRevisionNo: number,
): Promise<ScopeChange | null> {
  if (baseRevisionNo >= latestRevisionNo) return null;
  const timeline = await identityTimeline(db, documentId, ident, baseRevisionNo);
  const revs = await db.studioRevision.findMany({
    where: { documentId, revisionNo: { gt: baseRevisionNo, lte: latestRevisionNo } },
    orderBy: { revisionNo: "asc" },
    select: { revisionNo: true, createdBy: true },
  });
  const base = timeline.get(baseRevisionNo) ?? null;
  const sig = (x: IdentityAt | null) => (x ? `${x.contentSha256}|${x.parent}` : "absent");
  const baseSig = sig(base);
  for (const r of revs) {
    const at = timeline.get(r.revisionNo) ?? null;
    if (sig(at) !== baseSig) return { changedInRevisionNo: r.revisionNo, changedBy: r.createdBy, current: timeline.get(latestRevisionNo) ?? null };
  }
  return null;
}

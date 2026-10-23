/**
 * Utilitas khusus route SR-23: R16 `paragraphs/[pid]` dan R20 `content`.
 * Folder `_lib` privat (tidak dirutekan App Router).
 *
 * Isi:
 * - sumber log SR-23 dan validasi segmen `[pid]` (C19 `PID_PATTERN`);
 * - parameter kueri `rev` (bentuk R05: bukan bilangan bulat positif -> 404
 *   `REVISION_NOT_FOUND`) dan pemuatan dokumen + revisi;
 * - pencarian identitas pid di satu revisi (M15-M18, baca saja).
 *
 * Helper HTTP umum (log JSONL tahan lama, correlation id, pemetaan galat)
 * ada di `@/lib/studio/http` (read-only).
 */
import { prisma } from "@/lib/prisma";
import { PID_PATTERN, type StudioIdentityKind } from "@/lib/studio/contract";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import { reject, type ReqCtx } from "@/lib/studio/http";

export const API_LOG_SOURCE = "studio.api.sr23";

const PID_RE = new RegExp(PID_PATTERN);

/**
 * Dekode segmen `[pid]` lalu cocokkan C19. Pid sah tidak memuat `%`, jadi
 * dekode dilakukan tepat sekali bila `%` ada. Null = 404 `PID_NOT_FOUND`
 * (pid berbentuk lain tidak mungkin ada di dokumen mana pun).
 */
export function decodePidParam(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 200) return null;
  let s = raw;
  if (s.includes("%")) {
    try {
      s = decodeURIComponent(s);
    } catch {
      return null;
    }
  }
  return PID_RE.test(s) ? s : null;
}

/** `?rev=` absen/kosong -> undefined; bilangan bulat positif -> angka; selain itu null. */
export function parseRevParam(raw: string | null): number | undefined | null {
  if (raw === null || raw === "") return undefined;
  if (!/^[1-9][0-9]{0,8}$/.test(raw)) return null;
  return Number(raw);
}

export interface DocRevision {
  document: { id: string; docNumber: string; currentRevisionNo: number };
  revision: { id: string; revisionNo: number };
}

/**
 * Muat dokumen dan revisi (bawaan revisi terbaru). Respons galat (404
 * `DOCUMENT_NOT_FOUND` / `REVISION_NOT_FOUND`) dikembalikan sebagai `Response`.
 */
export async function loadDocRevision(
  ctx: ReqCtx,
  documentId: string,
  revRaw: string | null,
): Promise<{ ok: true; value: DocRevision } | { ok: false; response: Response }> {
  const rev = parseRevParam(revRaw);
  if (rev === null) {
    return { ok: false, response: reject(ctx, "REVISION_NOT_FOUND", "Revision not found", undefined, { documentId }) };
  }
  const doc = await prisma.studioDocument.findUnique({
    where: { id: documentId },
    select: { id: true, docNumber: true, currentRevisionNo: true },
  });
  if (!doc) {
    return { ok: false, response: reject(ctx, "DOCUMENT_NOT_FOUND", "Document not found", undefined, { documentId }) };
  }
  const revisionNo = rev ?? doc.currentRevisionNo;
  const revision = await prisma.studioRevision.findUnique({
    where: { documentId_revisionNo: { documentId, revisionNo } },
    select: { id: true, revisionNo: true },
  });
  if (!revision) {
    return {
      ok: false,
      response: reject(ctx, "REVISION_NOT_FOUND", "Revision not found", undefined, { documentId, revisionNo }),
    };
  }
  return { ok: true, value: { document: doc, revision } };
}

// ── Identitas pid ────────────────────────────────────────────────────────

export interface PidLocation {
  kind: StudioIdentityKind;
  slotKey: string;
  /** Kunci bab (null untuk blok slot tak-berulang). */
  chapterKey: string | null;
  address: string;
  /** Jenis blok; `chapter` / `section` untuk identitas bab / subbab. */
  type: string;
  /** Isi v2 blok tanpa `id` (baris M17); null untuk bab/subbab (diproyeksikan). */
  blockContent: unknown;
}

/**
 * Cari identitas pid aktif pada revisi `revisionNo`. Pid tidak dikenal,
 * belum dibuat pada revisi itu, atau pensiun -> 404 `PID_NOT_FOUND`
 * (`details.retiredRevisionNo` bila pensiun, register §10).
 */
export async function locatePid(
  documentId: string,
  revision: { id: string; revisionNo: number },
  pid: string,
): Promise<PidLocation> {
  const identity = await prisma.studioDocIdentity.findUnique({
    where: { documentId_pid: { documentId, pid } },
    select: { id: true, kind: true, createdRevisionNo: true, retiredRevisionNo: true },
  });
  if (!identity || identity.createdRevisionNo > revision.revisionNo) {
    throw new StudioEngineError("PID_NOT_FOUND", `Pid ${pid} tidak dikenal pada dokumen ini`, { pid });
  }
  if (identity.retiredRevisionNo !== null && identity.retiredRevisionNo <= revision.revisionNo) {
    throw new StudioEngineError("PID_NOT_FOUND", `Pid ${pid} sudah dipensiunkan pada revisi ${identity.retiredRevisionNo}`, {
      pid,
      retiredRevisionNo: identity.retiredRevisionNo,
    });
  }
  const missing = () =>
    new StudioEngineError("PID_NOT_FOUND", `Pid ${pid} tidak ada pada revisi ${revision.revisionNo}`, {
      pid,
      revisionNo: revision.revisionNo,
    });

  if (identity.kind === "BLOCK") {
    const row = await prisma.studioDocBlock.findUnique({
      where: { revisionId_pid: { revisionId: revision.id, pid } },
      select: {
        address: true,
        type: true,
        content: true,
        docSection: { select: { slotKey: true } },
        chapter: { select: { chapterKey: true } },
      },
    });
    if (!row) throw missing();
    return {
      kind: "BLOCK",
      slotKey: row.docSection.slotKey,
      chapterKey: row.chapter?.chapterKey ?? null,
      address: row.address ?? "",
      type: row.type,
      blockContent: row.content,
    };
  }
  if (identity.kind === "CHAPTER") {
    const row = await prisma.studioDocChapter.findFirst({
      where: { revisionId: revision.id, identityId: identity.id },
      select: { chapterKey: true, docSection: { select: { slotKey: true } } },
    });
    if (!row) throw missing();
    return {
      kind: "CHAPTER",
      slotKey: row.docSection.slotKey,
      chapterKey: row.chapterKey,
      address: row.chapterKey,
      type: "chapter",
      blockContent: null,
    };
  }
  if (identity.kind === "SUBSECTION") {
    const row = await prisma.studioDocSubsection.findFirst({
      where: { revisionId: revision.id, identityId: identity.id },
      select: { sectionNo: true, chapter: { select: { chapterKey: true, docSection: { select: { slotKey: true } } } } },
    });
    if (!row) throw missing();
    const key = row.chapter.chapterKey;
    return {
      kind: "SUBSECTION",
      slotKey: row.chapter.docSection.slotKey,
      chapterKey: key,
      // Intro bab (sectionNo 0) tidak punya alamat C.S sendiri (§4.1): pakai alamat bab.
      address: row.sectionNo > 0 ? `${key}.${row.sectionNo}` : key,
      type: "section",
      blockContent: null,
    };
  }
  throw missing();
}

/** Cari objek ber-`id === pid` di dalam proyeksi isi (bab/section/blok). */
export function findById(node: unknown, pid: string, depth = 0): Record<string, unknown> | null {
  if (depth > 64 || node === null || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findById(item, pid, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  if (obj.id === pid) return obj;
  for (const value of Object.values(obj)) {
    const hit = findById(value, pid, depth + 1);
    if (hit) return hit;
  }
  return null;
}

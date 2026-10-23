/**
 * Kunci dokumen dan pembuatan (register 03 §9.1; blueprint §2.6 Konkurensi).
 *
 * 1. Setiap penulisan berjalan dalam satu transaksi interaktif Prisma
 *    (`timeout` = C28) yang memegang `pg_advisory_xact_lock(hashtext('studio-doc:' || documentId))`.
 * 2. Target misi: `pg_advisory_xact_lock(hashtext('studio-mdoc:' || folder || ':' || docKey))`
 *    SEBELUM cek keberadaan. Urutan kunci tetap `studio-mdoc` -> `studio-docno` -> `studio-doc`.
 * 3. Pelanggaran unik `(missionFolder, missionDocKey)` / `docNumber` saat
 *    pembuatan (P2002) diulang SEKALI sebagai jalur "dokumen sudah ada"; tidak pernah 409.
 *    PostgreSQL membatalkan transaksi pada galat, jadi pengulangan = transaksi baru.
 * 4. FIX-V (IP-51): `readOnly` = dry-run kiriman (R08). Transaksi `SET TRANSACTION READ ONLY`
 *    (PostgreSQL menolak setiap tulis: jaminan tanpa baris baru), TANPA kunci advisory
 *    (dry-run tidak menahan penulis), tanpa pengulangan balapan.
 */
import { Prisma, type StudioDocument } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { STUDIO_LOCK_DOC_PREFIX, STUDIO_LOCK_MISSION_DOC_PREFIX, STUDIO_SUBMIT_TX_TIMEOUT_MS } from "../../contract";
import { StudioEngineError } from "../../contract/errors";
import type { ResolvedTarget } from "./target";

/** Tunggu maksimum memperoleh koneksi transaksi dari pool. */
export const SUBMIT_TX_MAX_WAIT_MS = 10_000;

export type SubmitTx = Prisma.TransactionClient;

/** Konteks di dalam kunci: dokumen target (null = belum ada) dan cara mengunci dokumen baru. */
export interface LockedTarget {
  /** Dokumen target, dibaca SESUDAH kunci yang relevan diperoleh; null = belum ada. */
  document: StudioDocument | null;
  /** Kunci misi yang dipegang transaksi ini (target misi). */
  missionDocKey: string | null;
  /** Ambil kunci `studio-doc:<id>` (dipanggil setelah dokumen baru dibuat). Idempoten. */
  lockDocument(documentId: string): Promise<void>;
  /** true bila ini percobaan kedua setelah balapan pembuatan. */
  retried: boolean;
}

export function docLockKey(documentId: string): string {
  return `${STUDIO_LOCK_DOC_PREFIX}${documentId}`;
}

export function missionLockKey(folder: string, docKey: string): string {
  return `${STUDIO_LOCK_MISSION_DOC_PREFIX}${folder}:${docKey}`;
}

export async function advisoryLock(tx: SubmitTx, key: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

/** Pernyataan pertama transaksi dry-run: PostgreSQL menolak setiap tulis sesudahnya (SQLSTATE 25006). */
export async function setReadOnly(tx: SubmitTx): Promise<void> {
  await tx.$executeRaw`SET TRANSACTION READ ONLY`;
}

/** P2002 pada unik pembuatan dokumen (kunci misi atau nomor dokumen). */
export function isCreateRace(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  const target = (e.meta as { target?: unknown } | undefined)?.target;
  const fields = Array.isArray(target) ? target.map(String) : typeof target === "string" ? [target] : [];
  return fields.some((f) => f.includes("missionDocKey") || f.includes("docNumber"));
}

/**
 * Selesaikan `docKey` misi tanpa docKey/templat: satu-satunya dokumen v2
 * (`missionDocKey` tidak null) di folder itu; selain itu 400 `DOC_TARGET_AMBIGUOUS`.
 */
async function missionDocKeyFromDb(tx: SubmitTx, folder: string): Promise<string> {
  const docs = await tx.studioDocument.findMany({
    where: { missionFolder: folder, missionDocKey: { not: null } },
    select: { missionDocKey: true },
    take: 3,
  });
  if (docs.length === 1 && docs[0].missionDocKey) return docs[0].missionDocKey;
  throw new StudioEngineError(
    "DOC_TARGET_AMBIGUOUS",
    docs.length === 0
      ? `Misi ${folder} belum punya dokumen; kirim target.docKey atau template.slug untuk membuatnya`
      : `Misi ${folder} punya lebih dari satu dokumen; kirim target.docKey`,
    { given: ["mission"], missionFolder: folder, candidates: docs.map((d) => d.missionDocKey) },
  );
}

async function lockAndFind(tx: SubmitTx, target: ResolvedTarget, held: Set<string>, lock = true): Promise<{ document: StudioDocument | null; missionDocKey: string | null }> {
  const take = async (key: string) => {
    if (!lock || held.has(key)) return;
    await advisoryLock(tx, key);
    held.add(key);
  };
  if (target.kind === "documentId") {
    await take(docLockKey(target.documentId));
    const document = await tx.studioDocument.findUnique({ where: { id: target.documentId } });
    if (!document) throw new StudioEngineError("DOCUMENT_NOT_FOUND", `Dokumen tidak ditemukan: ${target.documentId}`, { documentId: target.documentId });
    return { document, missionDocKey: document.missionDocKey };
  }
  if (target.kind === "docNumber") {
    const found = await tx.studioDocument.findUnique({ where: { docNumber: target.docNumber }, select: { id: true } });
    if (!found) return { document: null, missionDocKey: null };
    await take(docLockKey(found.id));
    const document = await tx.studioDocument.findUnique({ where: { id: found.id } });
    return { document, missionDocKey: document?.missionDocKey ?? null };
  }
  const docKey = target.docKey ?? (await missionDocKeyFromDb(tx, target.folder));
  await take(missionLockKey(target.folder, docKey));
  const found = await tx.studioDocument.findUnique({
    where: { missionFolder_missionDocKey: { missionFolder: target.folder, missionDocKey: docKey } },
    select: { id: true },
  });
  if (!found) return { document: null, missionDocKey: docKey };
  await take(docLockKey(found.id));
  const document = await tx.studioDocument.findUnique({ where: { id: found.id } });
  return { document, missionDocKey: docKey };
}

/**
 * I49 `withDocumentLock`: jalankan `fn` di dalam satu transaksi yang memegang
 * kunci target (dan kunci dokumen bila sudah ada). Balapan pembuatan diulang sekali.
 */
export async function withDocumentLock<T>(
  target: ResolvedTarget,
  fn: (tx: SubmitTx, locked: LockedTarget) => Promise<T>,
  opts: { timeoutMs?: number; onRetry?: (err: unknown) => void; readOnly?: boolean } = {},
): Promise<T> {
  const readOnly = opts.readOnly === true;
  const run = (retried: boolean) =>
    prisma.$transaction(
      async (tx) => {
        if (readOnly) await setReadOnly(tx);
        const held = new Set<string>();
        const { document, missionDocKey } = await lockAndFind(tx, target, held, !readOnly);
        const locked: LockedTarget = {
          document,
          missionDocKey,
          retried,
          async lockDocument(documentId: string) {
            if (readOnly) return;
            const key = docLockKey(documentId);
            if (held.has(key)) return;
            await advisoryLock(tx, key);
            held.add(key);
          },
        };
        return fn(tx, locked);
      },
      { timeout: opts.timeoutMs ?? STUDIO_SUBMIT_TX_TIMEOUT_MS, maxWait: SUBMIT_TX_MAX_WAIT_MS },
    );
  try {
    return await run(false);
  } catch (e) {
    if (readOnly || !isCreateRace(e)) throw e;
    opts.onRetry?.(e);
    return run(true);
  }
}

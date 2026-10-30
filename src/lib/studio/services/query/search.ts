/**
 * I66 `searchBlocks` (DC-14; register 05_document_contract_specs.md §8.1, §9.2, T2-69).
 *
 * - Teks penuh atas `StudioDocBlock.tsv` (MX10, GENERATED `to_tsvector('simple',
 *   left(textPlain, C42))`, indeks GIN). Kueri `websearch_to_tsquery(C41, $q)`
 *   TERPARAMETER lewat `$queryRaw` bertag + `Prisma.sql` (tanpa penggabungan string
 *   SQL; teks pengguna tidak pernah menjadi SQL). Kutip, operator websearch
 *   (`-`, `or`, `"..."`) dan tanda baca lain aman: `q` yang menjadi tsquery kosong
 *   (`numnode = 0`) menghasilkan `hits: []` tanpa galat.
 * - Lingkup bawaan: revisi terkini (`revisionNo = currentRevisionNo`); `revisionNo`
 *   eksplisit hanya bersama `documentId`. Hanya baris v2 (M17); v1 (M06) tidak (CA-7).
 * - Peringkat `ts_rank` (dibawa float8 agar kursor tepat); urut `rank DESC, id DESC`;
 *   kursor keyset opak base64url `{ r, id }`. `take` 1..C43.takeMax.
 * - Cuplikan `ts_headline` (C44, penanda `[[`/`]]`) dihitung HANYA untuk baris
 *   halaman (CTE berbatas lebih dulu, RK-28). Cuplikan adalah teks polos: perender
 *   wajib meng-escape HTML.
 *
 * Hak akses: sama dengan `queryContracts` (pola R04 GET; semua pemanggil
 * terautentikasi membaca semua dokumen, register §9 / AS-2). Route R22 wajib
 * `requireSession` lebih dulu.
 */
import { Prisma } from "@prisma/client";
import { SEARCH_LIMITS, SEARCH_SNIPPET_OPTIONS, STUDIO_FTS_CONFIG, STUDIO_FTS_MAX_CHARS, type SearchHitV2 } from "@/lib/studio/contract";
import { isStudioEngineError } from "@/lib/studio/contract/errors";
import { resolveQueryOptions, type QueryOptions } from "./db";
import { assertSearchFilter, decodeSearchCursor, encodeSearchCursor, type SearchQueryFilter } from "./filters";
import { filterShape, logQueryError } from "./log";

export interface SearchBlocksResult {
  hits: SearchHitV2[];
  nextCursor: string | null;
}

interface HitRow {
  id: string;
  pid: string;
  address: string | null;
  type: string;
  slotKey: string;
  chapterKey: string | null;
  revisionNo: number;
  documentId: string;
  docNumber: string;
  title: string;
  kind: string | null;
  rank: number;
  snippet: string | null;
}

/** Syarat WHERE terparameter dari filter tervalidasi (murni; dipakai ulang di uji). */
export function searchConditions(f: SearchQueryFilter): Prisma.Sql[] {
  const conds: Prisma.Sql[] = [Prisma.sql`numnode(q.q) > 0`, Prisma.sql`b."tsv" @@ q.q`];
  if (f.revisionNo !== undefined && f.documentId !== undefined) {
    conds.push(Prisma.sql`d."id" = ${f.documentId}`, Prisma.sql`rv."revisionNo" = ${f.revisionNo}`);
  } else {
    conds.push(Prisma.sql`rv."revisionNo" = d."currentRevisionNo"`);
    if (f.documentId !== undefined) conds.push(Prisma.sql`d."id" = ${f.documentId}`);
  }
  if (f.mission !== undefined) conds.push(Prisma.sql`d."missionFolder" = ${f.mission}`);
  if (f.kind !== undefined) conds.push(Prisma.sql`d."contractKind" = ${f.kind}`);
  if (f.type !== undefined && f.type.length > 0) conds.push(Prisma.sql`b."type" IN (${Prisma.join(f.type)})`);
  if (f.slotKey !== undefined) conds.push(Prisma.sql`s."slotKey" = ${f.slotKey}`);
  if (f.cursor !== undefined) {
    const c = decodeSearchCursor(f.cursor);
    if (c) {
      conds.push(
        Prisma.sql`(ts_rank(b."tsv", q.q)::float8 < ${c.r}::float8 OR (ts_rank(b."tsv", q.q)::float8 = ${c.r}::float8 AND b."id" < ${c.id}))`,
      );
    }
  }
  return conds;
}

export async function searchBlocks(filter: SearchQueryFilter, opts?: QueryOptions): Promise<SearchBlocksResult> {
  assertSearchFilter(filter);
  const { db, correlationId } = resolveQueryOptions(opts);
  const take = filter.take ?? SEARCH_LIMITS.takeDefault;
  const q = filter.q.trim();
  try {
    const where = Prisma.join(searchConditions(filter), " AND ");
    const rows = await db.$queryRaw<HitRow[]>`
      WITH q AS (SELECT websearch_to_tsquery(${STUDIO_FTS_CONFIG}::regconfig, ${q}) AS q),
      hits AS (
        SELECT b."id", b."pid", b."address", b."type", s."slotKey", c."chapterKey",
               rv."revisionNo", d."id" AS "documentId", d."docNumber", d."title", d."contractKind" AS "kind",
               ts_rank(b."tsv", q.q)::float8 AS "rank"
        FROM "StudioDocBlock" b
        JOIN "StudioRevision" rv ON rv."id" = b."revisionId"
        JOIN "StudioDocument" d ON d."id" = rv."documentId"
        JOIN "StudioDocSection" s ON s."id" = b."docSectionId"
        LEFT JOIN "StudioDocChapter" c ON c."id" = b."chapterId"
        CROSS JOIN q
        WHERE ${where}
        ORDER BY "rank" DESC, b."id" DESC
        LIMIT ${take + 1}
      )
      SELECT h.*, ts_headline(${STUDIO_FTS_CONFIG}::regconfig, left(b."textPlain", ${STUDIO_FTS_MAX_CHARS}::int), q.q, ${SEARCH_SNIPPET_OPTIONS}) AS "snippet"
      FROM hits h
      JOIN "StudioDocBlock" b ON b."id" = h."id"
      CROSS JOIN q
      ORDER BY h."rank" DESC, h."id" DESC`;
    const page = rows.slice(0, take);
    const hits: SearchHitV2[] = page.map((r) => ({
      documentId: r.documentId,
      docNumber: r.docNumber,
      title: r.title,
      kind: r.kind,
      revisionNo: Number(r.revisionNo),
      pid: r.pid,
      address: r.address ?? "",
      slotKey: r.slotKey,
      chapterKey: r.chapterKey,
      type: r.type,
      snippet: r.snippet ?? "",
      rank: Number(r.rank),
    }));
    const last = page[page.length - 1];
    const nextCursor = rows.length > take && last ? encodeSearchCursor({ r: Number(last.rank), id: last.id }) : null;
    return { hits, nextCursor };
  } catch (err) {
    if (isStudioEngineError(err)) throw err;
    logQueryError(correlationId, "searchBlocks failed", err, { filters: filterShape(filter), qLength: q.length, take });
    throw err;
  }
}

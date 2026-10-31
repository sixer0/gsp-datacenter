/**
 * I65 `queryContracts` (DC-14; register 05_document_contract_specs.md §8.2, §9.1, T2-68).
 *
 * - Hanya dokumen dengan `contractKind` tidak null; filter atas kolom cermin
 *   MX09 (`contractStatus`, `contractOwner`, `contractTaskRef`, `contractDueOn`,
 *   `contractCardIds @> ARRAY[cardId]` lewat GIN) + `missionFolder`, `missionDocKey`.
 * - `docNumber`: cocok tepat ATAU bentuk aman I61 (SQL setara §9.1, `$queryRaw`
 *   bertag terparameter; prafilter id berbatas).
 * - Urutan `updatedAt DESC, id DESC`; kursor = id dokumen (`nextCursor`), `take`
 *   1..C45.takeMax (bawaan C45.takeDefault). Kursor yang tidak ada -> halaman kosong.
 * - `matchedItems` (hanya bila `cardId` diisi) = baris M20 `itemKey = cardId` pada
 *   revisi terkini (`documentId`, `revisionNo = currentRevisionNo`); satu kueri per halaman.
 *
 * Hak akses: TIDAK ada penyaringan per pemanggil di layanan ini. Pola yang diikuti
 * = R04 GET `/api/studio/documents` (`documents/route.ts` GET: `requireSession`
 * lalu `findMany` tanpa syarat pemanggil) dan kebijakan baca register §9 / AS-2
 * blueprint 07 (semua pemanggil terautentikasi membaca semua dokumen; dinilai DC-41).
 * Route R21 wajib memanggil `requireSession` sebelum layanan ini. FIX-SEC (D-402):
 * dokumen terarsip (`archived = true`) DIKECUALIKAN secara bawaan; `includeArchived: true`
 * (R21 `?includeArchived=1`) menyertakannya. Setiap baca sukses dicatat route (log baca).
 *
 * `status` dapat `null`: dokumen bertemplat ber-contractKind yang slot `record`-nya
 * belum terisi (aturan tulis §7.6: MX09 hanya `contractKind`); T2-68 mengetiknya
 * nullable (amandemen D-370).
 */
import { Prisma } from "@prisma/client";
import {
  CONTRACT_QUERY_LIMITS,
  type AgentWorkReportStatus,
  type ContractItemStatus,
  type ContractKind,
  type ContractSummaryV2,
  type StudioCompleteness,
} from "@/lib/studio/contract";
import { FINAL_DOC_NUMBER_MAX } from "@/lib/studio/contract/env";
import { isStudioEngineError } from "@/lib/studio/contract/errors";
import { resolveQueryOptions, type QueryOptions } from "./db";
import { assertContractFilter, type ContractQueryFilter } from "./filters";
import { filterShape, logQueryError } from "./log";

/** Batas id hasil prafilter `docNumber` (bentuk aman bisa cocok > 1 dokumen). */
export const DOC_NUMBER_MATCH_MAX = 1000;

/**
 * I61 `docNumberSafe` (`render/final-name.ts`, FN-02) dalam SQL, langkah 1-5: runtun di luar
 * `[A-Za-z0-9.-]` -> `-`; `-` beruntun jadi satu; buang `-`/`.` awal dan akhir; potong C52
 * `FINAL_DOC_NUMBER_MAX` (parameter, bukan angka keras; FIX-R40-4) lalu buang `-`/`.` akhir;
 * kosong -> `DOC`. Paritas dengan versi TS dikunci uji `fixqb-docnumber-safe-sql` (DB, rollback).
 * `expr` = ekspresi SQL teks (kolom atau parameter); tidak pernah nilai pengguna mentah.
 */
export function docNumberSafeSql(expr: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`coalesce(nullif(rtrim(left(trim(both '-.' from regexp_replace(regexp_replace(${expr}, '[^A-Za-z0-9.-]+', '-', 'g'), '-{2,}', '-', 'g')), ${FINAL_DOC_NUMBER_MAX}::int), '-.'), ''), 'DOC')`;
}

export interface QueryContractsResult {
  contracts: ContractSummaryV2[];
  nextCursor: string | null;
}

/** `Date` kolom `@db.Date` (tengah malam UTC) -> `YYYY-MM-DD`. */
export function dateOnly(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** `YYYY-MM-DD` tervalidasi -> `Date` tengah malam UTC untuk filter kolom DATE. */
function utcDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

/** `missingRequired` dari `completenessReport` revisi terakhir bila bentuknya sah. */
export function missingRequiredOf(report: unknown): string[] {
  if (!report || typeof report !== "object" || Array.isArray(report)) return [];
  const m = (report as { missingRequired?: unknown }).missingRequired;
  return Array.isArray(m) && m.every((x) => typeof x === "string") ? (m as string[]) : [];
}

/** Filter Prisma dari filter tervalidasi (murni; `docNumberIds` dari prafilter). */
export function contractWhere(f: ContractQueryFilter, docNumberIds?: string[]): Prisma.StudioDocumentWhereInput {
  const due: Prisma.DateTimeNullableFilter = {};
  if (f.dueAfter) due.gte = utcDate(f.dueAfter);
  if (f.dueBefore) due.lte = utcDate(f.dueBefore);
  return {
    contractKind: f.kind ?? { not: null },
    ...(f.includeArchived ? {} : { archived: false }),
    ...(f.mission ? { missionFolder: f.mission } : {}),
    ...(f.docKey ? { missionDocKey: f.docKey } : {}),
    ...(f.status ? { contractStatus: { in: f.status } } : {}),
    ...(f.cardId ? { contractCardIds: { has: f.cardId } } : {}),
    ...(f.owner ? { contractOwner: f.owner } : {}),
    ...(f.taskRef ? { contractTaskRef: f.taskRef } : {}),
    ...(f.dueAfter || f.dueBefore ? { contractDueOn: due } : {}),
    ...(docNumberIds ? { id: { in: docNumberIds } } : {}),
  };
}

export async function queryContracts(filter: ContractQueryFilter, opts?: QueryOptions): Promise<QueryContractsResult> {
  assertContractFilter(filter);
  const { db, correlationId } = resolveQueryOptions(opts);
  const take = filter.take ?? CONTRACT_QUERY_LIMITS.takeDefault;
  try {
    let docNumberIds: string[] | undefined;
    if (filter.docNumber) {
      const v = filter.docNumber;
      const rows = await db.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "StudioDocument"
        WHERE "contractKind" IS NOT NULL
          AND (${filter.includeArchived === true}::boolean OR "archived" = false)
          AND ("docNumber" = ${v}
            OR ${docNumberSafeSql(Prisma.sql`"docNumber"`)} = ${v})
        LIMIT ${DOC_NUMBER_MATCH_MAX}`;
      docNumberIds = rows.map((r) => r.id);
      if (docNumberIds.length === 0) return { contracts: [], nextCursor: null };
    }

    const rows = await db.studioDocument.findMany({
      where: contractWhere(filter, docNumberIds),
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        docNumber: true,
        title: true,
        currentRevisionNo: true,
        missionFolder: true,
        missionDocKey: true,
        updatedAt: true,
        completeness: true,
        contractKind: true,
        contractStatus: true,
        contractOwner: true,
        contractTaskRef: true,
        contractDueOn: true,
        contractCardIds: true,
        revisions: { orderBy: { revisionNo: "desc" }, take: 1, select: { completenessReport: true } },
      },
    });
    const page = rows.slice(0, take);

    const matched = new Map<string, NonNullable<ContractSummaryV2["matchedItems"]>>();
    if (filter.cardId && page.length > 0) {
      const items = await db.studioContractItem.findMany({
        where: { itemKey: filter.cardId, OR: page.map((d) => ({ documentId: d.id, revisionNo: d.currentRevisionNo })) },
        orderBy: [{ documentId: "asc" }, { position: "asc" }],
        select: { documentId: true, itemKey: true, status: true, pid: true, titlePlain: true },
      });
      for (const it of items) {
        const list = matched.get(it.documentId) ?? [];
        list.push({ key: it.itemKey, status: it.status as ContractItemStatus, pid: it.pid, title: it.titlePlain });
        matched.set(it.documentId, list);
      }
    }

    const contracts = page.map((d): ContractSummaryV2 => ({
      documentId: d.id,
      docNumber: d.docNumber,
      title: d.title,
      kind: d.contractKind as ContractKind,
      status: (d.contractStatus as AgentWorkReportStatus | null) ?? null,
      owner: d.contractOwner,
      taskRef: d.contractTaskRef,
      cardIds: d.contractCardIds,
      dueOn: dateOnly(d.contractDueOn),
      revisionNo: d.currentRevisionNo,
      completeness: { status: d.completeness as StudioCompleteness, missingRequired: missingRequiredOf(d.revisions[0]?.completenessReport) },
      missionFolder: d.missionFolder,
      docKey: d.missionDocKey,
      updatedAt: d.updatedAt.toISOString(),
      ...(filter.cardId ? { matchedItems: matched.get(d.id) ?? [] } : {}),
    }));
    const nextCursor = rows.length > take ? page[page.length - 1]?.id ?? null : null;
    return { contracts, nextCursor };
  } catch (err) {
    if (isStudioEngineError(err)) throw err;
    logQueryError(correlationId, "queryContracts failed", err, { filters: filterShape(filter), take });
    throw err;
  }
}

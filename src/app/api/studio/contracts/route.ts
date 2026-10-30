/**
 * R21 `GET /api/studio/contracts` (DC-15; register 05_document_contract_specs.md §9, §9.1,
 * §9.6 QH-01..QH-06, T2-68; D-370).
 *
 * `?mission=&docKey=&docNumber=&kind=&status=a,b&cardId=&owner=&taskRef=&dueBefore=&dueAfter=&take=&cursor=`
 * -> 200 `{ contracts: ContractSummaryV2[], nextCursor }` lewat I65 `queryContracts`
 * (hanya dokumen ber-`contractKind`; urutan `updatedAt DESC, id DESC`).
 *
 * Urutan galat seragam R21/R22: 401 (`requireSession`, tanpa header kuota) -> 400
 * `SCHEMA_INVALID` (parameter tak dikenal/ganda/tidak sah, pointer `/query/<nama>`;
 * ditolak sebelum tagihan sehingga tidak memakan kuota dan tanpa header kuota) -> 429
 * `RATE_LIMITED` (bucket `query`, `Retry-After`). Setiap respons SESUDAH tagihan bucket
 * (200, 429, 5xx) membawa C48/C49 lewat `withQuotaHeaders` (QH-03).
 *
 * Kebijakan baca = R04 GET: semua pemanggil terautentikasi membaca semua dokumen
 * (register §9 / AS-2; dinilai DC-41). Tanpa tulis DB.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { getStudioCaller } from "@/lib/studio/contract/auth";
import { checkQueryRate, failure, json, reqCtx, withQuotaHeaders, type ReqCtx } from "@/lib/studio/http";
import { parseContractQuery, queryContracts } from "@/lib/studio/services/query";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROUTE = "/api/studio/contracts";

export async function GET(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE);
  return withQuotaHeaders(ctx, () => getContracts(req, ctx));
}

async function getContracts(req: NextRequest, ctx: ReqCtx): Promise<Response> {
  try {
    const caller = await getStudioCaller(req);
    const filter = parseContractQuery(new URL(req.url).searchParams);
    const limited = checkQueryRate(caller, ctx);
    if (limited) return limited;
    const result = await queryContracts(filter, { correlationId: ctx.correlationId });
    return json(result, 200, ctx);
  } catch (err) {
    return failure(err, ctx, { op: "GET contracts", exposeCorrelationId: true });
  }
}

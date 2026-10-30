/**
 * FIX-H6 (D-321/D-322; uji Hermes friksi C6): catch-all `/api/studio/*`.
 *
 * Next App Router mendahulukan segmen statis dan dinamis di atas catch-all,
 * jadi handler ini hanya menerima path Studio yang TIDAK cocok dengan route
 * mana pun (mis. `POST /api/studio/documents/{id}/slots`). Opsional
 * (`[[...]]`) agar `/api/studio` sendiri juga terjawab.
 *
 * -> 404 `{ error, code: "ROUTE_NOT_FOUND", message, hint, correlationId, details }`
 *    + header `x-correlation-id` (lihat `@/lib/studio/http/route-not-found`).
 * Auth: `requireSession` lebih dulu (tanpa sesi = 401 seperti route lain; middleware
 * sudah menolak lebih awal, guard ini lapis kedua).
 *
 * Metode salah pada route yang ADA (mis. GET /api/studio/slots) tidak sampai ke
 * sini: Next menjawab 405 sendiri.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { routeNotFound } from "@/lib/studio/http/route-not-found";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(req: NextRequest): Promise<Response> {
  const denied = await requireSession(req);
  if (denied) return denied;
  return routeNotFound(req);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;

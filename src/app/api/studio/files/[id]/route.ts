/**
 * R10 `/api/studio/files/[id]` (01_specs.md §6.2; S57): sajikan berkas
 * keluaran Studio.
 *
 * - Path HANYA dari baris `StudioOutputFile` lewat id (S52 `readOutputFile`,
 *   guard lexical + realpath); tidak ada masukan path dari klien.
 * - Query: `inline=1` (pratinjau sesi: HTML/SVG/PDF/PNG/JPG inline; D-65),
 *   `download=1` atau tanpa parameter -> attachment; `verify=1` (cocokkan
 *   sha256 isi disk dengan DB; hasil di header `X-Studio-Sha256-Verified`,
 *   selisih dicatat).
 * - Header: Content-Type per ekstensi, Content-Disposition RFC 5987,
 *   `nosniff`, `no-store`, CSP ketat untuk HTML/SVG (`files/_lib/serve.ts`).
 * - Galat: 404 `FILE_NOT_FOUND`, 403 `PATH_OUTSIDE_ROOT`, 410
 *   `FILE_MISSING_ON_DISK`; tanpa stack trace dan tanpa path internal.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { readOutputFile } from "@/lib/studio/services/storage";
import { apiLog, failure, reqCtx, withCorrelation } from "@/lib/studio/http";
import { fileHeaders } from "../_lib/serve";

export const dynamic = "force-dynamic";

const ROUTE = "/api/studio/files/[id]";
const SOURCE = "studio.api.files";

function flag(q: URLSearchParams, name: string): boolean {
  const v = q.get(name);
  return v === "1" || v === "true";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, SOURCE);
  let id = "";
  try {
    ({ id } = await params);
    const q = new URL(req.url).searchParams;
    const verify = flag(q, "verify");
    const { file, data, shaMatches } = await readOutputFile(id, { verifySha: verify });
    if (verify && shaMatches === false) {
      apiLog({
        ...ctx,
        level: "warn",
        message: "served file sha256 differs from DB record",
        code: "FILE_SHA_MISMATCH",
        context: { fileId: file.id },
      });
    }
    const headers = fileHeaders({
      fileName: file.fileName,
      bytes: data.byteLength,
      sha256: file.sha256,
      inline: flag(q, "inline"),
      download: flag(q, "download"),
      shaVerified: verify ? shaMatches === true : undefined,
    });
    // readFile tidak pernah memakai SharedArrayBuffer; view tanpa salin.
    const body = new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength);
    return withCorrelation(new Response(body, { status: 200, headers }), ctx);
  } catch (e) {
    return failure(e, ctx, { op: "serve file", stripDetails: true, context: { fileId: id.slice(0, 100) } });
  }
}

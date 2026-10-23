/**
 * R17 `POST /api/studio/documents/[id]/render` (SR-24; register
 * 03_structural_sections_specs.md §12 R17, blueprint 05 §2.6/§2.11, D-131).
 *
 * Badan `{ scope: "document" | "chapter" | "slot", key?, formats?, figures?, revisionNo? }`.
 * - 200 `{ job: RenderJobDto & { scope, draft }, outputs, completeness }`;
 *   `chapter`/`slot` selalu boleh (draf).
 * - 409 `DOCUMENT_INCOMPLETE` `{ completeness, allowedScopes, forwardToController }`
 *   untuk `scope: "document"` pada revisi INCOMPLETE (contoh E3b).
 * - 404 `ADDRESS_NOT_FOUND`/`REVISION_NOT_FOUND`/`DOCUMENT_NOT_FOUND`, 422 `SLOT_UNKNOWN`,
 *   429 `RATE_LIMITED`, 503 `RENDER_QUEUE_FULL` (dua terakhir + `Retry-After`).
 *
 * Logika ada di `_lib/handler.ts`; berkas ini hanya memasang sesi dan dependensi nyata.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { getStudioCaller } from "@/lib/studio/contract/auth";
import { assertRenderCapacity, renderQueueRetryAfterSec } from "@/lib/studio/services/render";
import { checkRenderRate, reqCtx } from "@/lib/studio/http";
import { handleRenderPost, RENDER_API_LOG_SOURCE, RENDER_ROUTE, type RenderRouteDeps } from "./_lib/handler";
import { resolveRenderScope } from "./_lib/service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function liveDeps(): RenderRouteDeps {
  return {
    getCaller: (req, agentId) => getStudioCaller(req, agentId),
    checkRate: checkRenderRate,
    assertCapacity: assertRenderCapacity,
    renderScope: resolveRenderScope(),
    retryAfterSec: renderQueueRetryAfterSec,
  };
}

export async function POST(req: NextRequest, { params }: Params) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, RENDER_ROUTE, RENDER_API_LOG_SOURCE);
  const { id } = await params;
  return handleRenderPost(req, id, ctx, liveDeps());
}

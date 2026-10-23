/**
 * R12 `/api/studio/chapters` (SR-21; blueprint 05 §2.5, register 03 §12).
 *
 * POST `studio.chapter/v2` (SID02): satu bab ke dokumen yang dipilih tepat satu
 * cara (`documentId` | `docNumber` | `mission.folder` + `docKey` opsional).
 * Dokumen belum ada -> dibuat berkerangka di revisi yang sama (`template` +
 * `meta.title` wajib). `slot` bawaan = slot berulang aktif pertama (`content`).
 *   201 `SubmitResultV2` (dokumen baru atau revisi n+1, `changeScope: "chapter:<k>"`);
 *   200 `{ created: false, unchanged: true, ... }` bila isi bab identik (§9.3).
 * Galat: 400 `SCHEMA_INVALID`, `DOC_TARGET_AMBIGUOUS`, `META_REQUIRED_FOR_CREATE`;
 * 404 `DOCUMENT_NOT_FOUND`; 409 `SCOPE_CONFLICT`, `TEMPLATE_MISMATCH`, `META_CONFLICT`;
 * 422 `SLOT_TYPE_MISMATCH`, `SLOT_FORBIDDEN_FOR_TIER`, `SLOT_ITEMS_OUT_OF_RANGE`,
 * `BLOCK_TYPE_NOT_ADMITTED`, `CHAPTER_KEY_INVALID`, `PID_CONFLICT`, `ASSET_NOT_FOUND`;
 * 413; 415; 429 `RATE_LIMITED`; 503 `RENDER_QUEUE_FULL`.
 *
 * Auth: `requireSession`; agen memakai `x-internal-secret` + `agentId` di badan.
 */
import type { NextRequest } from "next/server";
import { handleSubmit } from "./_shared/submit-kit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleSubmit(req, "chapter");
}

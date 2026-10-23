/**
 * R13 `/api/studio/slots` (SR-21; blueprint 05 §2.5, register 03 §12).
 *
 * POST `studio.slot/v2` (SID03): isi satu slot TAK-berulang, mis.
 * `{ "slot": "controlSheet", "payload": { "type": "controlSheet", ... } }`,
 * dengan target dan `render` yang sama seperti R12.
 *   201 `SubmitResultV2` (`changeScope: "slot:<slotKey>"`); 200 `unchanged` (§9.3).
 * Galat: seperti R12, ditambah 422 `SLOT_USE_CHAPTER_ENDPOINT` (slot berulang;
 * `details.use = "POST /api/studio/chapters"`), `SLOT_INPUT_NOT_ACCEPTED`, `SLOT_UNKNOWN`.
 *
 * Auth: `requireSession`; agen memakai `x-internal-secret` + `agentId` di badan.
 */
import type { NextRequest } from "next/server";
import { handleSubmit } from "../chapters/_shared/submit-kit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleSubmit(req, "slot");
}

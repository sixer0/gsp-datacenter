/**
 * R20 `/api/studio/documents/[id]/content` (SR-23; blueprint 05 §2.5 "Baca isi",
 * register 03 §12).
 *
 * GET `?slot=&chapter=&rev=n` -> 200 `{ document: { id, docNumber }, revisionNo, slot?, content }`:
 * - tanpa parameter: `StudioDocV2Resolved` penuh;
 * - `slot`: payload slot;
 * - `slot` + `chapter`: `ChapterV2` dengan `id` (pid) di bab, section, dan blok,
 *   siap dibaca, diubah, lalu dikirim balik (POST /api/studio/chapters atau
 *   PATCH paragraphs/[pid]).
 *
 * `chapter` tanpa `slot` dicari di semua slot berulang; `slot` respons = slot
 * terpilih. Proyeksi isi milik repositori struktur (`projectContentDetailed`,
 * SR-10). Galat:
 * 404 `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND`, `ADDRESS_NOT_FOUND` (kunci bab
 * tidak ada); 422 `SLOT_UNKNOWN`. Tanpa sesi -> 401 (requireSession). Galat tanpa stack trace.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { CHAPTER_KEY_LETTER_PATTERN, CHAPTER_KEY_NUMERIC_PATTERN, SLOT_KEY_PATTERN } from "@/lib/studio/contract";
import { projectContentDetailed } from "@/lib/studio/services/structure";
import { failure, isPlausibleId, json, reject, reqCtx } from "@/lib/studio/http";
import { API_LOG_SOURCE, loadDocRevision } from "../paragraphs/_lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROUTE = "/api/studio/documents/[id]/content";
const SLOT_RE = new RegExp(SLOT_KEY_PATTERN);
const CHAPTER_RES = [new RegExp(CHAPTER_KEY_NUMERIC_PATTERN), new RegExp(CHAPTER_KEY_LETTER_PATTERN)];

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, API_LOG_SOURCE);
  const { id } = await params;

  if (!isPlausibleId(id)) return reject(ctx, "DOCUMENT_NOT_FOUND", "Document not found");

  const url = new URL(req.url);
  const slotRaw = url.searchParams.get("slot");
  const chapterRaw = url.searchParams.get("chapter");
  const slot = slotRaw === null || slotRaw === "" ? undefined : slotRaw;
  const chapter = chapterRaw === null || chapterRaw === "" ? undefined : chapterRaw;
  const logCtx = { documentId: id, slot: slot ?? null, chapter: chapter ?? null };

  // Kunci slot di luar pola C18 tidak mungkin ada di kerangka mana pun.
  if (slot !== undefined && !SLOT_RE.test(slot)) {
    return reject(ctx, "SLOT_UNKNOWN", `Slot "${slot.slice(0, 40)}" tidak ada di kerangka dokumen`, { slotKey: slot.slice(0, 40) }, logCtx);
  }
  // Kunci bab di luar C33a/C33b tidak mungkin ada di dokumen.
  if (chapter !== undefined && !CHAPTER_RES.some((re) => re.test(chapter))) {
    return reject(ctx, "ADDRESS_NOT_FOUND", `Bab "${chapter.slice(0, 40)}" tidak ada di dokumen`, { chapter: chapter.slice(0, 40) }, logCtx);
  }

  try {
    const loaded = await loadDocRevision(ctx, id, url.searchParams.get("rev"));
    if (!loaded.ok) return loaded.response;
    const { document, revision } = loaded.value;

    const projection = await projectContentDetailed(revision.id, { slot, chapter });
    const body: Record<string, unknown> = {
      document: { id: document.id, docNumber: document.docNumber },
      revisionNo: revision.revisionNo,
    };
    const selectedSlot = projection.slot ?? slot;
    if (selectedSlot !== undefined) body.slot = selectedSlot;
    body.content = projection.content;
    return json(body, 200, ctx);
  } catch (e) {
    return failure(e, ctx, { context: logCtx });
  }
}

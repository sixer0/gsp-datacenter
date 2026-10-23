/*
 * Klien API halaman Dokumen Studio (SR-30). Semua panggilan lewat
 * `shared/http.requestJson` (UX-01 §6.2: modul fitur tidak membuat pembungkus
 * fetch, kelas galat, atau pembangun URL berkas sendiri). Jalur dari
 * `studioRoutePath` kontrak; sumber log `studio.ui.documents.<sumber>`.
 */
import { requestJson, withQuery } from "@/components/studio/shared/http";
import { studioRoutePath } from "@/lib/studio/contract/env";
import type { StudioDocV2 } from "@/lib/studio/contract";
import type {
  AssetResponse,
  CompletenessResponse,
  ContentResponse,
  DocumentDetail,
  DocumentListResponse,
  ParagraphResponse,
  PatchPidBody,
  PatchPidResponse,
  RenderResponse,
  RevisionsResponse,
  StructureResponse,
  TemplatesResponse,
} from "./doc-model";
import type { SubmitResultV2 } from "@/lib/studio/contract";
import type { OutputFileDto, RenderJobDto } from "@/lib/studio/contract/types/api";
// Tipe diff milik modul revisi (FIX-4b); dipakai ulang baca saja untuk `DiffView`.
import type { RevisionDiff } from "@/components/studio/revision/api";

const SRC = "documents";

function src(name: string): string {
  return `${SRC}.${name}`;
}

export function listDocuments(q: { mission?: string; cursor?: string | null; take?: number }, signal?: AbortSignal): Promise<DocumentListResponse> {
  return requestJson(withQuery(studioRoutePath("R04"), { mission: q.mission, cursor: q.cursor, take: q.take, archived: 0 }), {
    source: src("list"),
    signal,
  });
}

export function getDocument(id: string, rev: number | null, signal?: AbortSignal): Promise<DocumentDetail> {
  return requestJson(withQuery(studioRoutePath("R05", { id }), { rev }), { source: src("detail"), signal });
}

export function getStructure(id: string, rev: number | null, signal?: AbortSignal): Promise<StructureResponse> {
  return requestJson(withQuery(studioRoutePath("R14", { id }), { rev }), { source: src("structure"), signal });
}

export function getCompleteness(id: string, signal?: AbortSignal): Promise<CompletenessResponse> {
  return requestJson(studioRoutePath("R15", { id }), { source: src("completeness"), signal });
}

export function getContent(id: string, rev: number | null, signal?: AbortSignal): Promise<ContentResponse> {
  return requestJson(withQuery(studioRoutePath("R20", { id }), { rev }), { source: src("content"), signal });
}

export function getParagraph(
  id: string,
  pid: string,
  opts: { rev?: number | null; history?: boolean },
  signal?: AbortSignal,
): Promise<ParagraphResponse> {
  return requestJson(withQuery(studioRoutePath("R16", { id, pid }), { rev: opts.rev ?? undefined, history: opts.history ? 1 : undefined }), {
    source: src("paragraph"),
    signal,
    // Paragraf yang belum ada di versi lama = wajar saat menelusuri riwayat.
    quietStatuses: [404],
  });
}

export function patchParagraph(id: string, pid: string, body: PatchPidBody): Promise<PatchPidResponse> {
  return requestJson(studioRoutePath("R16", { id, pid }), {
    source: src("paragraph-save"),
    method: "PATCH",
    json: body,
    // Konflik dan pid hilang ditangani dialog awam; bukan galat sistem.
    quietStatuses: [409],
    logContext: { documentId: id, op: body.op },
  });
}

export function renderDocument(
  id: string,
  body: { scope: "document" | "chapter" | "slot"; key?: string; formats: Array<"docx" | "pdf" | "html">; revisionNo?: number },
): Promise<RenderResponse> {
  return requestJson(studioRoutePath("R17", { id }), {
    source: src("make-file"),
    method: "POST",
    json: body,
    quietStatuses: [409],
    logContext: { documentId: id, scope: body.scope },
  });
}

export function listRevisions(id: string, signal?: AbortSignal): Promise<RevisionsResponse> {
  return requestJson(studioRoutePath("R07", { id }), { source: src("history"), signal });
}

export function diffWithLatest(id: string, from: number, to: number, signal?: AbortSignal): Promise<RevisionsResponse & { diff: RevisionDiff }> {
  return requestJson(withQuery(studioRoutePath("R07", { id }), { from, to }), { source: src("history-compare"), signal });
}

/** R07 POST: buat berkas dari versi lama (berkas lengkap hanya bila versi itu Lengkap). */
export function renderRevision(
  id: string,
  revisionNo: number,
  formats: Array<"DOCX" | "PDF" | "HTML">,
): Promise<{ job: RenderJobDto; outputs: OutputFileDto[]; identical: boolean }> {
  return requestJson(studioRoutePath("R07", { id }), {
    source: src("history-make-file"),
    method: "POST",
    json: { revisionNo, formats },
    quietStatuses: [409],
    logContext: { documentId: id, revisionNo },
  });
}

/** R18 multipart; `mission` opsional. */
export function uploadAsset(file: File, mission?: string | null): Promise<AssetResponse> {
  const fd = new FormData();
  fd.append("file", file, file.name);
  return requestJson(withQuery(studioRoutePath("R18"), { mission: mission ?? undefined }), {
    source: src("asset-upload"),
    method: "POST",
    body: fd,
    logContext: { bytes: file.size, mime: file.type },
  });
}

export function listTemplates(signal?: AbortSignal): Promise<TemplatesResponse> {
  return requestJson(withQuery(studioRoutePath("R01"), { archived: 0 }), { source: src("templates"), signal });
}

/** R04 POST `studio.doc/v2` tanpa `sections` = dokumen kosong berkerangka (D-153). */
export function createDocument(body: Pick<StudioDocV2, "template" | "mission" | "docKey" | "meta">): Promise<SubmitResultV2> {
  const payload: StudioDocV2 = { $schema: "studio.doc/v2", ...body };
  return requestJson(studioRoutePath("R04"), {
    source: src("create"),
    method: "POST",
    json: payload,
    quietStatuses: [409],
    logContext: { template: body.template.slug },
  });
}

/** R14 PATCH (tindakan admin: ganti versi templat, nomori ulang bab). */
export function patchStructure(
  id: string,
  body: { op: "templateVersion"; versionNo: number; baseRevisionNo: number; change: PatchPidBody["change"] } | {
    op: "renumberChapters";
    map: Record<string, string>;
    baseRevisionNo: number;
    change: PatchPidBody["change"];
  },
): Promise<{ revision: { revisionNo: number }; completeness: unknown }> {
  return requestJson(studioRoutePath("R14", { id }), {
    source: src("structure-admin"),
    method: "PATCH",
    json: body,
    quietStatuses: [409],
    logContext: { documentId: id, op: body.op },
  });
}

export function getRenderEnv(signal?: AbortSignal): Promise<{ readiness?: { ready: boolean; checkedAt: string } }> {
  return requestJson(studioRoutePath("R11"), { source: src("engine"), signal });
}

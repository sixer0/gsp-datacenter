/**
 * Klien API Studio untuk komponen sunting dan riwayat (S61; dimigrasi FIX-4b
 * ke klien bersama `shared/http`, UX-01 §6.2, menutup S86 R05 + R17).
 *
 * Bentuk respons mengikuti 01_specs.md §6.2 (R05, R06, R07) dan kode route
 * S56 (`src/app/api/studio/documents/[id]/{blocks/[address],revisions}/route.ts`):
 * - GET   /api/studio/documents/[id]                      -> { document, revision, tree, outputs }
 * - GET   /api/studio/documents/[id]/blocks/[address]?rev -> BlockDto
 * - PATCH /api/studio/documents/[id]/blocks/[address]     -> PatchResult
 * - GET   /api/studio/documents/[id]/revisions[?from&to]  -> { revisions, diff? }
 * - POST  /api/studio/documents/[id]/revisions            -> RerenderResult
 * Galat: `StudioApiError` bersama (`{ error, code, details? }` + `x-correlation-id`),
 * sudah dicatat `client-log` dengan sumber `studio.ui.revision.<sumber>`.
 *
 * Modul ini aman untuk klien: hanya impor tipe, `contract/address` (murni),
 * dan fondasi `shared/*`.
 */
import { encodeAddress } from "@/lib/studio/contract/address";
import { reportClientError as sharedReportClientError } from "@/components/studio/shared/client-log";
import { isAbortError, isStudioApiError, requestJson, StudioApiError, withQuery } from "@/components/studio/shared/http";
import type {
  AddressNode,
  BlockDto,
  DocumentSummary,
  OutputFileDto,
  PatchBlockInput,
  PatchResult,
  RerenderRequest,
  RerenderResult,
  RevisionSummary,
} from "@/lib/studio/contract/types/api";

export { isStudioApiError, StudioApiError };

/** Cermin `RevisionDiff` (services/revisions/diff.ts; modul server, tidak diimpor ke klien). */
export interface BlockDiffEntry {
  blockId: string;
  type: string;
  oldAddress?: string;
  newAddress?: string;
  oldArtifactLabel?: string;
  newArtifactLabel?: string;
}

export interface RevisionDiff {
  documentId: string;
  fromRevisionNo: number;
  toRevisionNo: number;
  added: BlockDiffEntry[];
  removed: BlockDiffEntry[];
  changed: BlockDiffEntry[];
  moved: BlockDiffEntry[];
  addressMap: Record<string, string>;
}

export interface RevisionsResponse {
  revisions: RevisionSummary[];
  diff?: RevisionDiff;
}

export interface DocumentDetail {
  document: DocumentSummary;
  revision: RevisionSummary;
  tree: AddressNode[];
  outputs: OutputFileDto[];
}

/**
 * Catat galat yang BUKAN dari `requestJson` (galat API sudah dicatat oleh klien
 * bersama; mencatat ulang menggandakan baris log). Sumber `studio.ui.revision.<sumber>`.
 */
export function reportClientError(source: string, err: unknown, context?: Record<string, unknown>): void {
  if (isStudioApiError(err) || isAbortError(err)) return;
  sharedReportClientError(`studio.ui.revision.${source}`, err, context, { level: "error" });
}

const BASE = "/api/studio/documents";
const src = (name: string) => `revision.${name}`;
const docUrl = (docId: string) => `${BASE}/${encodeURIComponent(docId)}`;

export function fetchDocument(docId: string, rev?: number, signal?: AbortSignal): Promise<DocumentDetail> {
  return requestJson<DocumentDetail>(withQuery(docUrl(docId), { rev }), { source: src("document"), signal });
}

export function fetchBlock(docId: string, address: string, rev?: number, signal?: AbortSignal): Promise<BlockDto> {
  return requestJson<BlockDto>(withQuery(`${docUrl(docId)}/blocks/${encodeAddress(address)}`, { rev }), {
    source: src("block"),
    signal,
  });
}

export function patchBlock(docId: string, address: string, input: PatchBlockInput): Promise<PatchResult> {
  return requestJson<PatchResult>(`${docUrl(docId)}/blocks/${encodeAddress(address)}`, {
    source: src("patch"),
    method: "PATCH",
    json: input,
  });
}

export function fetchRevisions(docId: string, diff?: { from?: number; to: number }, signal?: AbortSignal): Promise<RevisionsResponse> {
  return requestJson<RevisionsResponse>(withQuery(`${docUrl(docId)}/revisions`, { from: diff?.from, to: diff?.to }), {
    source: src("list"),
    signal,
  });
}

export function rerenderRevision(docId: string, input: RerenderRequest): Promise<RerenderResult> {
  return requestJson<RerenderResult>(`${docUrl(docId)}/revisions`, { source: src("make-file"), method: "POST", json: input });
}

/** Pembatalan (navigasi / AbortController) — bukan galat untuk pengguna. */
export const isAbort = isAbortError;

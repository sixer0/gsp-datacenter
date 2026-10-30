/**
 * Orkestrasi pemeriksaan draf bersama CLI `scripts/studio/draft-check.ts --remote` (DC-22) dan
 * route R23 `POST /api/studio/drafts/check` (DC-23), agar keluaran `--json` CLI identik dengan
 * respons R23 untuk berkas yang sama (AC-19, KS-8; aturan D-373). Murni: transport (HTTP R08/R05
 * di CLI, panggilan layanan di proses pada R23) disuntikkan lewat {@link DraftCheckDeps}.
 *
 * Aturan bersama (D-373):
 * - hanya blok tanpa isu galat ekstraksi (DR-02..DR-05) yang di-dry-run R08;
 * - DR-08 `DRAFT_BASIS_STALE` membawa baris `basis:` kepala (kolom 1);
 * - penolakan R08 4xx selain 401/429 = satu isu blok `{ pointer: "", keyword: <code>, message,
 *   details? }` (badan galat `{ error, code, details }` apa adanya);
 * - `valid` = tanpa isu error dan setiap blok `valid`.
 */
import { DRAFT_LIMITS } from "../../contract/env";
import type { DraftLimitReason } from "../../contract/enums";
import type { DraftBlockResultV2, DraftCheckResultV2, DraftIssueV2 } from "../../contract/types/v2/contract";
import { extractDraft, parseDraftBasis, toDraftCheckResult, type ExtractedDraft, type ExtractedDraftBlock } from "./extract";

/** Hasil dry-run R08 satu blok yang relevan untuk T2-71. */
export interface DraftDryRunOutcome {
  valid: boolean;
  issues: unknown[];
  submitPreview?: unknown;
  completenessPreview?: unknown;
}

/** Transport pemeriksaan: revisi terkini dokumen (null = tidak ditemukan) dan dry-run R08 per blok. */
export interface DraftCheckDeps {
  currentRevisionNo(documentId: string): Promise<number | null>;
  dryRun(block: ExtractedDraftBlock): Promise<DraftDryRunOutcome>;
}

export interface PreparedDraftCheck {
  extracted: ExtractedDraft;
  result: DraftCheckResultV2;
  /** Blok yang akan di-dry-run (tanpa isu galat ekstraksi), urut indeks. */
  dryRunBlocks: ExtractedDraftBlock[];
}

/** Pesan galat batas C54 (DR-09/DR-10) bersama CLI dan R23 (Bahasa Indonesia, D-340). */
export function draftLimitMessage(reason: DraftLimitReason): string {
  return reason === "DRAFT_TOO_LONG"
    ? `draf melebihi batas (${DRAFT_LIMITS.bodyBytes} bita atau ${DRAFT_LIMITS.maxChars} karakter)`
    : `draf memuat lebih dari ${DRAFT_LIMITS.maxBlocks} blok json`;
}

/** I63 + hasil T2-70 awal + daftar blok yang akan di-dry-run. Pemanggil memeriksa batas C54 lebih dulu. */
export function prepareDraftCheck(markdown: string): PreparedDraftCheck {
  const extracted = extractDraft(markdown);
  const result = toDraftCheckResult(extracted);
  const dryRunBlocks = result.blocks.filter((b) => b.valid).map((b) => extracted.blocks[b.index - 1]);
  return { extracted, result, dryRunBlocks };
}

/** Baris pertama `basis:` di kepala (sebelum blok pertama); 0 bila tidak ada. */
export function basisLineOf(markdown: string, ex: ExtractedDraft): number {
  const lines = markdown.split(/\r\n|\n/);
  const end = ex.blocks.length > 0 ? ex.blocks[0].line - 1 : lines.length;
  for (let i = 0; i < end; i++) if (/^basis:/.test(lines[i])) return i + 1;
  return 0;
}

/** Basis `<documentId>@rev<n>` yang dapat dibandingkan (DR-08); null untuk `baru`, kosong, atau tidak sah. */
export function draftBasisRevision(ex: ExtractedDraft): { documentId: string; revisionNo: number } | null {
  const basis = ex.header.basis === null ? null : parseDraftBasis(ex.header.basis);
  return basis !== null && basis.kind === "revision" ? { documentId: basis.documentId, revisionNo: basis.revisionNo } : null;
}

/**
 * DR-08: `rev<n>` < `currentRevisionNo`. `current` null = dokumen tidak ditemukan (tidak dapat
 * dicek; blok R08 melaporkannya sendiri).
 */
export function staleBasisIssue(
  markdown: string,
  ex: ExtractedDraft,
  basis: { documentId: string; revisionNo: number },
  current: number | null,
): DraftIssueV2 | null {
  if (current === null || basis.revisionNo >= current) return null;
  const line = basisLineOf(markdown, ex);
  return {
    code: "DRAFT_BASIS_STALE",
    severity: "warning",
    ...(line > 0 ? { line, column: 1 } : {}),
    message: `basis rev${basis.revisionNo} sudah tertinggal: revisi terkini dokumen ${basis.documentId} adalah rev${current}`,
  };
}

/** Penolakan R08 4xx (selain 401/429) -> hasil blok tidak valid dengan satu isu (D-373). */
export function rejectedDryRun(code: string, message: string, details?: unknown): DraftDryRunOutcome {
  const isObj = details !== null && typeof details === "object" && !Array.isArray(details);
  return { valid: false, issues: [{ pointer: "", keyword: code, message, ...(isObj ? { details } : {}) }] };
}

/** Timpakan hasil dry-run ke blok T2-71 (urutan medan tetap: submitPreview lalu completenessPreview). */
export function applyDryRun(block: DraftBlockResultV2, outcome: DraftDryRunOutcome): void {
  block.valid = outcome.valid;
  block.issues = Array.isArray(outcome.issues) ? outcome.issues : [];
  if (outcome.submitPreview !== undefined) block.submitPreview = outcome.submitPreview;
  if (outcome.completenessPreview !== undefined) block.completenessPreview = outcome.completenessPreview;
}

/** `valid` T2-70 = tanpa isu error dan setiap blok valid. */
export function finalizeDraftResult(result: DraftCheckResultV2): DraftCheckResultV2 {
  result.valid = !result.issues.some((i) => i.severity === "error") && result.blocks.every((b) => b.valid);
  return result;
}

/** DR-08 lalu dry-run R08 per blok (urut indeks), lalu `valid`. */
export async function completeDraftCheck(markdown: string, prepared: PreparedDraftCheck, deps: DraftCheckDeps): Promise<DraftCheckResultV2> {
  const { extracted, result } = prepared;
  const basis = draftBasisRevision(extracted);
  if (basis !== null) {
    const stale = staleBasisIssue(markdown, extracted, basis, await deps.currentRevisionNo(basis.documentId));
    if (stale) result.issues.push(stale);
  }
  for (const b of result.blocks) {
    if (!b.valid) continue;
    applyDryRun(b, await deps.dryRun(extracted.blocks[b.index - 1]));
  }
  return finalizeDraftResult(result);
}

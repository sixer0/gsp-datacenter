/**
 * Dry-run R08 satu blok draf DI PROSES untuk R23 (DC-23; register 05 §9.3, D-373, AC-19).
 *
 * Langkah dan layanan SAMA dengan R08 `POST /api/studio/validate` untuk badan v2 tingkat atas
 * (`$schema` anggota C57) tanpa `?preview=html`: `validateV2` (ajv + `classifySchemaV2Errors`),
 * lalu `ingestDocument(dryRun)` untuk `studio.doc/v2` atau `dryRunChapter`/`dryRunSlot` (transaksi
 * READ ONLY, tanpa build) untuk bab/slot; medan draf `roleFormats`/`draftTemplate` diperlakukan
 * seperti R08. Tidak ada yang ditulis ke DB maupun berkas; tanpa render (`previewHtml` tidak
 * dihasilkan).
 *
 * Kesetaraan dengan CLI `--remote` (yang mengirim teks blok ke R08 lewat HTTP):
 * - galat masukan 4xx layanan = `valid:false` dengan isu yang sama (pemeta R08 bersama
 *   `issuesFromError`);
 * - galat yang di R08 menjadi respons HTTP 4xx (403 FORBIDDEN templat terbatas, 400 kedalaman
 *   JSON > 64, 409 nomor dokumen) = satu isu blok `rejectedDryRun` dengan kode, pesan, dan
 *   `details` badan galat R08;
 * - 401 dan 5xx dilempar ke route (CLI: galat lingkungan, keluar 2).
 *
 * Glue R08 (`validateV2Submission`, medan draf, pemetaan galat layanan) SATU sumber di
 * `validate/_shared/dry-run.ts` (D-378), dipakai R08 dan berkas ini; di sini hanya cabang badan
 * v2 tingkat atas dan pemetaan galat-HTTP R08 (`failFrom`) ke isu blok.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { StudioCaller } from "@/lib/studio/contract";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import { STUDIO_MAX_JSON_DEPTH, apiLog, jsonDepthExceeds, type ReqCtx } from "@/lib/studio/http";
import { rejectedDryRun, type DraftDryRunOutcome } from "@/lib/studio/services/draft";
import { draftRoleFormats, v2RoleFormatsIssue, validateV2Submission, withoutDraftFields, type ValidateBody } from "../../../validate/_shared/dry-run";
import { schemaRootOf } from "../../../validate/_shared/v2-kit";

function isPrismaUniqueOn(err: unknown, field: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return false;
  const target = (err.meta as { target?: unknown } | undefined)?.target;
  if (Array.isArray(target)) return target.some((t) => String(t) === field);
  return typeof target === "string" && target.includes(field);
}

/**
 * Cabang badan v2 tingkat atas `postValidate` R08 (`?preview` tidak ada): medan draf lalu
 * `validateV2Submission` bersama (`validate/_shared/dry-run.ts`).
 */
async function validateLikeR08(raw: Record<string, unknown>, caller: StudioCaller, ctx: ReqCtx): Promise<ValidateBody> {
  const roles = draftRoleFormats(raw);
  const draftRaw = raw.draftTemplate === undefined || raw.draftTemplate === null ? undefined : raw.draftTemplate;
  const b = roles.present || "draftTemplate" in raw ? withoutDraftFields(raw) : raw;
  const root = schemaRootOf(b);
  if (roles.present && roles.issues.length > 0) return { valid: false, issues: roles.issues, lint: null };
  if (roles.present) return v2RoleFormatsIssue();
  if (root === null || root === "other") {
    // Tidak terjadi untuk blok lolos I63 (`$schema` anggota C57); dijaga agar tetap setara R08.
    return {
      valid: false,
      issues: [{ pointer: "/$schema", keyword: "enum", message: "$schema must be one of studio.doc/v2, studio.chapter/v2, studio.slot/v2 (or absent for a v1 StudioIngestRequest)" }],
      lint: null,
    };
  }
  return validateV2Submission(root, b, b.agentId, caller, false, "", ctx, draftRaw);
}

/**
 * Dry-run R08 satu blok (nilai `JSON.parse` blok, objek). Caller = identitas yang akan dilihat
 * R08 untuk blok ini.
 */
export async function dryRunDraftBlock(value: Record<string, unknown>, caller: StudioCaller, ctx: ReqCtx): Promise<DraftDryRunOutcome> {
  // R08 `readJsonBody`: kedalaman > 64 -> 400 SCHEMA_INVALID tanpa `details`.
  if (jsonDepthExceeds(value)) return rejectedDryRun("SCHEMA_INVALID", `Request body nests deeper than ${STUDIO_MAX_JSON_DEPTH} levels`);
  try {
    const body = await validateLikeR08(value, caller, ctx);
    return {
      valid: body.valid,
      issues: body.issues,
      ...(body.submitPreview !== undefined ? { submitPreview: body.submitPreview } : {}),
      ...(body.completenessPreview !== undefined ? { completenessPreview: body.completenessPreview } : {}),
    };
  } catch (err) {
    // R08 `failFrom`: P2002 docNumber -> 409; StudioEngineError 4xx -> badan `{ error, code, details }`.
    if (isPrismaUniqueOn(err, "docNumber")) return rejectedDryRun("DOC_NUMBER_EXISTS", "Document number already exists");
    if (err instanceof StudioEngineError && err.httpStatus < 500 && err.code !== "UNAUTHORIZED" && err.code !== "RATE_LIMITED") {
      apiLog({ ...ctx, level: "warn", message: `draft block rejected: ${err.code}: ${err.message}`, code: err.code, status: err.httpStatus });
      return rejectedDryRun(err.code, err.message, err.details);
    }
    throw err;
  }
}

/** Revisi terkini dokumen untuk DR-08 (baca saja; setara GET R05 tanpa `rev`). `null` = tidak ditemukan. */
export async function currentRevisionNoOf(documentId: string): Promise<number | null> {
  const doc = await prisma.studioDocument.findUnique({ where: { id: documentId }, select: { currentRevisionNo: true } });
  return doc ? doc.currentRevisionNo : null;
}

/**
 * Perkakas khusus route Studio S55 (R04 `/api/studio/documents`, R05
 * `/api/studio/documents/[id]`, R08 `/api/studio/validate`).
 *
 * Folder `_shared` bersifat privat (App Router tidak menjadikannya segmen
 * route). Helper HTTP umum (badan JSON berbatas termasuk chunked, log JSONL
 * tahan lama + `x-correlation-id`, pemetaan galat §6.3 tanpa stack trace)
 * ada di `@/lib/studio/http` (IP-08, F-024). Berkas ini hanya memuat:
 * - `failFrom`: pemetaan galat bersama + Prisma P2002 `docNumber` ->
 *   409 `DOC_NUMBER_EXISTS`; 500 generik membawa `correlationId` di badan
 *   (bentuk R04/R05/R08 sejak S55);
 * - opsi baca badan R04/R08 (UTF-8 ketat);
 * - `bodyAgentId`;
 * - pemeta baris Prisma -> DTO kontrak (`DocumentSummary`, `RevisionSummary`).
 */
import { Prisma } from "@prisma/client";
import { failure, isRecord, reject, type ReadJsonOptions, type ReqCtx } from "@/lib/studio/http";

/** R04/R08: UTF-8 tidak sah = 400 JSON_MALFORMED (perilaku S55). */
export const S55_BODY_OPTIONS: ReadJsonOptions = { fatalUtf8: true };

// ── Galat ────────────────────────────────────────────────────────────────

function isPrismaUniqueOn(err: unknown, field: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return false;
  const target = (err.meta as { target?: unknown } | undefined)?.target;
  if (Array.isArray(target)) return target.some((t) => String(t) === field);
  return typeof target === "string" && target.includes(field);
}

/**
 * Petakan galat apa pun ke respons §6.1 dan catat secara tahan lama.
 * Galat tak dikenal: 500 `{ error: "Internal error", correlationId }` tanpa detail/stack.
 */
export function failFrom(err: unknown, ctx: ReqCtx, context?: Record<string, unknown>): Response {
  if (isPrismaUniqueOn(err, "docNumber")) {
    return reject(ctx, "DOC_NUMBER_EXISTS", "Document number already exists", undefined, context);
  }
  return failure(err, ctx, { context, exposeCorrelationId: true });
}

/** agentId badan (string), dipotong 80 oleh getStudioCaller; selain string -> undefined. */
export function bodyAgentId(body: unknown): string | undefined {
  return isRecord(body) && typeof body.agentId === "string" ? body.agentId : undefined;
}

// ── DTO ──────────────────────────────────────────────────────────────────
// S85 R-06: satu sumber DTO di layanan (services/revisions/rows); nama lama
// dipertahankan sebagai alias agar route R04/R05/R08 tidak berubah.

export { documentSummary as toDocumentSummary, revisionSummary as toRevisionSummary } from "@/lib/studio/services/revisions/rows";

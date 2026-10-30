/**
 * R07 `/api/studio/documents/[id]/revisions` (01_specs.md §6.2, S56, D-06).
 *
 * GET  -> 200 `{ revisions: RevisionSummary[] }` (terbaru lebih dulu).
 *      Diff opsional (aditif): `?from=a&to=b` -> `{ revisions, diff: RevisionDiff }`;
 *      `?to=b` saja -> diff terhadap `parentRevisionNo` revisi b.
 * POST `{ revisionNo, formats?, agentId? }` -> 200 `{ job, outputs, identical, partial,
 *      failedFormats, errors }` + header `X-Studio-Render-Status` (render ulang revisi lama
 *      tanpa revisi baru; 409 RENDER_IN_PROGRESS dari layanan). FIX-HZ1 (D-325): penanda
 *      hasil sebagian sama dengan R17/R09; pdf diminta (eksplisit atau bawaan) + render-env
 *      tidak siap -> 503 `PDF_ENGINE_UNAVAILABLE` `details.stage: "preflight"` + `Retry-After`
 *      tanpa job, SETELAH 404 dokumen/revisi.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { getStudioCaller } from "@/lib/studio/contract/auth";
import { STUDIO_OUTPUT_FORMATS, type StudioOutputFormat } from "@/lib/studio/contract/enums";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import { diffRevisions, listRevisions, rerenderRevision } from "@/lib/studio/services/revisions";
import {
  assertRenderCapacity,
  isPdfPreflightRejection,
  isQueueFullOutcome,
  renderOutcomeMarker,
  renderQueueRetryAfterSec,
  renderStatusHeaders,
  withRetryAfterHeader,
} from "@/lib/studio/services/render";
import { apiLog, checkRenderRate, failure, isPlausibleId, json, parsePosInt, readJsonObject, reject, reqCtx } from "@/lib/studio/http";
import { API_LOG_SOURCE } from "../blocks/_lib/http";

export const dynamic = "force-dynamic";

const ROUTE = "/api/studio/documents/[id]/revisions";

type Params = { params: Promise<{ id: string }> };

function readRevParam(sp: URLSearchParams, name: string): { present: boolean; value: number | null } {
  const raw = sp.get(name);
  if (raw === null || raw === "") return { present: false, value: null };
  return { present: true, value: parsePosInt(raw) };
}

export async function GET(req: NextRequest, { params }: Params) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, API_LOG_SOURCE);
  const { id } = await params;
  if (!isPlausibleId(id)) return reject(ctx, "DOCUMENT_NOT_FOUND", "Document not found");

  const sp = new URL(req.url).searchParams;
  const from = readRevParam(sp, "from");
  const to = readRevParam(sp, "to");
  const issues: ValidationIssue[] = [];
  if (from.present && from.value === null) issues.push({ pointer: "/from", keyword: "type", message: "must be positive integer" });
  if (to.present && to.value === null) issues.push({ pointer: "/to", keyword: "type", message: "must be positive integer" });
  if (from.present && !to.present) issues.push({ pointer: "/to", keyword: "required", message: "required when from is given" });
  if (issues.length > 0) return reject(ctx, "SCHEMA_INVALID", "Invalid query", issues, { documentId: id });

  try {
    const revisions = await listRevisions(id);
    if (!to.present) return json({ revisions }, 200, ctx);

    const toNo = to.value as number;
    let fromNo = from.value;
    if (fromNo === null) {
      const target = revisions.find((r) => r.revisionNo === toNo);
      if (!target) return reject(ctx, "REVISION_NOT_FOUND", "Revision not found", undefined, { documentId: id, to: toNo });
      if (target.parentRevisionNo === null) {
        return reject(ctx, "SCHEMA_INVALID", "Revision has no parent; pass from explicitly", [
          { pointer: "/from", keyword: "required", message: "revision has no parent revision" },
        ]);
      }
      fromNo = target.parentRevisionNo;
    }
    const diff = await diffRevisions(id, fromNo, toNo);
    return json({ revisions, diff }, 200, ctx);
  } catch (e) {
    return failure(e, ctx, { context: { documentId: id, from: from.value, to: to.value } });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, API_LOG_SOURCE);
  const { id } = await params;
  if (!isPlausibleId(id)) return reject(ctx, "DOCUMENT_NOT_FOUND", "Document not found");

  const body = await readJsonObject(req, ctx);
  if (!body.ok) return body.response;
  const b = body.value;

  const issues: ValidationIssue[] = [];
  const revisionNo = typeof b.revisionNo === "number" ? parsePosInt(b.revisionNo) : null;
  if (revisionNo === null) issues.push({ pointer: "/revisionNo", keyword: "required", message: "must be a positive integer" });

  let formats: StudioOutputFormat[] | undefined;
  if (b.formats !== undefined) {
    const known = STUDIO_OUTPUT_FORMATS as readonly string[];
    if (!Array.isArray(b.formats) || b.formats.length === 0) {
      issues.push({ pointer: "/formats", keyword: "type", message: "must be a non-empty array" });
    } else {
      // S85 R-18: tidak peka huruf seperti R09 (`"pdf"` = `"PDF"`).
      const upper: StudioOutputFormat[] = [];
      b.formats.forEach((f, i) => {
        const up = typeof f === "string" ? f.trim().toUpperCase() : "";
        if (!known.includes(up)) {
          issues.push({ pointer: `/formats/${i}`, keyword: "enum", message: `must be one of ${known.join(", ")}` });
        } else {
          upper.push(up as StudioOutputFormat);
        }
      });
      if (issues.every((x) => !x.pointer.startsWith("/formats"))) {
        formats = [...new Set(upper)];
      }
    }
  }
  if (b.agentId !== undefined && typeof b.agentId !== "string") {
    issues.push({ pointer: "/agentId", keyword: "type", message: "must be string" });
  }
  if (issues.length > 0) return reject(ctx, "SCHEMA_INVALID", "Invalid re-render body", issues, { documentId: id });

  try {
    const caller = await getStudioCaller(req, typeof b.agentId === "string" ? b.agentId : null);
    // FIX-1 (S87 M-03): laju per pemanggil + antrean render berbatas.
    const limited = checkRenderRate(caller, ctx);
    if (limited) return limited;
    assertRenderCapacity();
    const result = await rerenderRevision(id, revisionNo as number, formats, caller);
    if (isQueueFullOutcome({ outputs: result.outputs, errors: result.job.errors ?? [] })) {
      return reject(ctx, "RENDER_QUEUE_FULL", "Render queue is full; retry later", {
        documentId: id,
        revisionNo,
        jobId: result.job.id,
        retryAfterSec: renderQueueRetryAfterSec(),
      });
    }
    const errors = result.job.errors ?? [];
    const marker = renderOutcomeMarker(result.job, result.outputs, errors);
    const incomplete = result.job.status !== "SUCCEEDED";
    apiLog({
      ...ctx,
      level: incomplete ? "warn" : "info",
      message: incomplete ? `revision re-render ${result.job.status}` : "revision re-render requested",
      ...(incomplete ? { code: errors[0]?.code ?? "RENDER_INCOMPLETE" } : {}),
      status: 200,
      context: {
        documentId: id,
        revisionNo,
        formats,
        jobId: result.job.id,
        jobStatus: result.job.status,
        identical: result.identical,
        requester: caller.requester,
        ...(incomplete ? { failedFormats: marker.failedFormats, errorCodes: errors.map((x) => x.code) } : {}),
      },
    });
    return json({ ...result, ...marker, errors }, 200, ctx, renderStatusHeaders(result.job));
  } catch (e) {
    if (isPdfPreflightRejection(e)) {
      const d = e.details;
      const res = reject(ctx, "PDF_ENGINE_UNAVAILABLE", e.message, d, {
        documentId: id,
        revisionNo,
        formats,
        stage: d.stage,
        causeCodes: d.causes.map((c) => c.code),
        checkedAt: d.checkedAt,
      });
      return withRetryAfterHeader(res, d.retryAfterSec);
    }
    return failure(e, ctx, { context: { documentId: id, revisionNo, formats } });
  }
}

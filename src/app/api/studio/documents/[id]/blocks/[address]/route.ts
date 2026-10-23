/**
 * R06 `/api/studio/documents/[id]/blocks/[address]` (01_specs.md §6.2, S56).
 *
 * GET   `?rev=n` -> 200 `{ address, blockId, type, content, revisionNo }`
 * PATCH `{ baseRevisionNo, op, block?, cell?, change: { what, why, impact }, agentId? }`
 *       -> 200 `{ revision, addressMap, job: null, outputs: [] }` (revisi baru, D-06; D-247:
 *       tanpa render, `render` di badan -> 400 SCHEMA_INVALID RENDER_FIELD)
 *
 * Alamat di path didekode dan divalidasi dengan tata bahasa §4.1 (400
 * ADDRESS_INVALID). PATCH wajib apa/mengapa/dampak (400 CHANGE_FIELDS_REQUIRED)
 * dan `baseRevisionNo` (optimistic concurrency; selisih -> 409 REVISION_CONFLICT
 * dari layanan). Galat tanpa stack trace.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { getStudioCaller } from "@/lib/studio/contract/auth";
import { renderFieldIssue, schemaInvalidMessage } from "@/lib/studio/contract";
import type { ChangeFields, PatchBlockInput, ValidationIssue } from "@/lib/studio/contract/types/api";
import type { Cell, FlowItem } from "@/lib/studio/contract/types/doc";
import { CHANGE_FIELD_MAX, getBlock, patchBlock } from "@/lib/studio/services/revisions";
import { apiLog, checkRenderRate, failure, isPlainObject, isPlausibleId, json, parsePosInt, readJsonObject, reject, reqCtx } from "@/lib/studio/http";
import { API_LOG_SOURCE, decodeAddressParam } from "../_lib/http";

export const dynamic = "force-dynamic";

const ROUTE = "/api/studio/documents/[id]/blocks/[address]";
const PATCH_OPS: readonly PatchBlockInput["op"][] = ["replace", "insertBefore", "insertAfter", "delete"];

type Params = { params: Promise<{ id: string; address: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, API_LOG_SOURCE);
  const { id, address: rawAddress } = await params;

  if (!isPlausibleId(id)) return reject(ctx, "DOCUMENT_NOT_FOUND", "Document not found");
  const address = decodeAddressParam(rawAddress);
  if (!address) return reject(ctx, "ADDRESS_INVALID", "Address does not match the address grammar", undefined, { documentId: id });

  const revRaw = new URL(req.url).searchParams.get("rev");
  let rev: number | undefined;
  if (revRaw !== null && revRaw !== "") {
    const n = parsePosInt(revRaw);
    if (n === null) {
      return reject(ctx, "SCHEMA_INVALID", "rev must be a positive integer", [
        { pointer: "/rev", keyword: "type", message: "must be positive integer" },
      ]);
    }
    rev = n;
  }

  try {
    const block = await getBlock(id, address, rev);
    return json(block, 200, ctx);
  } catch (e) {
    return failure(e, ctx, { context: { documentId: id, address, rev } });
  }
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, API_LOG_SOURCE);
  const { id, address: rawAddress } = await params;

  if (!isPlausibleId(id)) return reject(ctx, "DOCUMENT_NOT_FOUND", "Document not found");
  const address = decodeAddressParam(rawAddress);
  if (!address) return reject(ctx, "ADDRESS_INVALID", "Address does not match the address grammar", undefined, { documentId: id });

  const body = await readJsonObject(req, ctx);
  if (!body.ok) return body.response;
  const b = body.value;
  const logCtx = { documentId: id, address };

  // apa/mengapa/dampak wajib (D-06).
  const ch = isPlainObject(b.change) ? b.change : {};
  const missing = (["what", "why", "impact"] as const).filter((k) => !nonEmptyString(ch[k]));
  if (missing.length > 0) {
    return reject(
      ctx,
      "CHANGE_FIELDS_REQUIRED",
      "change.what, change.why and change.impact are required",
      missing.map((k) => ({ pointer: `/change/${k}`, keyword: "required", message: "must be a non-empty string" })),
      logCtx,
    );
  }
  const change: ChangeFields = {
    what: (ch.what as string).trim(),
    why: (ch.why as string).trim(),
    impact: (ch.impact as string).trim(),
  };

  const issues: ValidationIssue[] = [];
  for (const k of ["what", "why", "impact"] as const) {
    if (change[k].length > CHANGE_FIELD_MAX) {
      issues.push({ pointer: `/change/${k}`, keyword: "maxLength", message: `must be at most ${CHANGE_FIELD_MAX} characters` });
    }
  }

  // Revisi dasar wajib (optimistic concurrency, §4.2 butir 5).
  const baseRevisionNo = parsePosInt(b.baseRevisionNo);
  if (baseRevisionNo === null || typeof b.baseRevisionNo !== "number") {
    issues.push({ pointer: "/baseRevisionNo", keyword: "required", message: "must be a positive integer (current revision number)" });
  }

  const op = b.op;
  const opOk = typeof op === "string" && (PATCH_OPS as readonly string[]).includes(op);
  if (!opOk) issues.push({ pointer: "/op", keyword: "enum", message: `must be one of ${PATCH_OPS.join(", ")}` });

  if (b.block !== undefined && !(isPlainObject(b.block) && typeof b.block.type === "string")) {
    issues.push({ pointer: "/block", keyword: "type", message: "must be a block object with a string type" });
  }
  if (b.cell !== undefined && !isPlainObject(b.cell)) {
    issues.push({ pointer: "/cell", keyword: "type", message: "must be a cell object" });
  }
  if (opOk) {
    if (op === "replace" && b.block === undefined && b.cell === undefined) {
      issues.push({ pointer: "/block", keyword: "required", message: "replace requires block or cell" });
    }
    if ((op === "insertBefore" || op === "insertAfter") && b.block === undefined) {
      issues.push({ pointer: "/block", keyword: "required", message: `${op} requires block` });
    }
    if (op === "delete" && (b.block !== undefined || b.cell !== undefined)) {
      issues.push({ pointer: "/op", keyword: "const", message: "delete takes no block or cell" });
    }
  }
  if (b.agentId !== undefined && typeof b.agentId !== "string") {
    issues.push({ pointer: "/agentId", keyword: "type", message: "must be string" });
  }
  // D-247: sunting tidak memicu build; `render` ditolak dengan arahan endpoint render.
  if (b.render !== undefined) issues.push(renderFieldIssue("/render"));
  if (issues.length > 0) return reject(ctx, "SCHEMA_INVALID", schemaInvalidMessage(issues, "Invalid PATCH body"), issues, logCtx);

  const input: PatchBlockInput = {
    baseRevisionNo: baseRevisionNo as number,
    op: op as PatchBlockInput["op"],
    change,
  };
  if (b.block !== undefined) input.block = b.block as unknown as FlowItem;
  if (b.cell !== undefined) input.cell = b.cell as unknown as Cell;

  try {
    const caller = await getStudioCaller(req, typeof b.agentId === "string" ? b.agentId : null);
    // FIX-1 (S87 M-03): laju per pemanggil (429). D-247: PATCH tidak lagi memicu render.
    const limited = checkRenderRate(caller, ctx);
    if (limited) return limited;
    const result = await patchBlock(id, address, input, caller);
    apiLog({
      ...ctx,
      level: "info",
      message: "block patched",
      status: 200,
      context: {
        ...logCtx,
        op: input.op,
        baseRevisionNo: input.baseRevisionNo,
        revisionNo: result.revision.revisionNo,
        requester: caller.requester,
      },
    });
    return json(result, 200, ctx);
  } catch (e) {
    return failure(e, ctx, { context: { ...logCtx, op: input.op, baseRevisionNo: input.baseRevisionNo } });
  }
}

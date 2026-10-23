/**
 * `POST /api/studio/client-log` (IP-09, F-031): sink galat UI Studio.
 *
 * Badan (maks 16 KiB, `CLIENT_LOG_MAX_BYTES`):
 *   `{ level: "error"|"warn"|"info", message, route?, correlationId?, source?, code?, status?, stack?, detail?, timestamp? }`
 *   (alias rekaman konsol UI lama: `correlation_id`, `stack_trace`, `context`).
 * -> 202 `{ accepted: true, correlationId }`; entri ditulis ke log JSONL tahan
 *    lama yang sama dengan route Studio (`<STUDIO_WORKSPACE_ROOT>/logs/api/`,
 *    source `studio.client`), dengan correlation id klien bila sah.
 *
 * Galat: 400 JSON_MALFORMED / SCHEMA_INVALID, 401 (requireSession), 413
 * PAYLOAD_TOO_LARGE, 429 (lebih dari 30 entri per menit per sesi; header
 * `Retry-After`; badan `{ error }` tanpa `code` karena kontrak belum punya
 * kode laju), 500 tanpa stack.
 *
 * Sanitasi: kunci rahasia (token/cookie/authorization/password/secret/
 * session...) tidak pernah disimpan; teks bebas disamarkan (Bearer, JWT,
 * `kunci=nilai`), path profil user -> `%USERPROFILE%`. Identitas pemanggil
 * dicatat sebagai jenis + requester (id rujukan), tanpa cookie/header.
 */
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { getStudioCaller } from "@/lib/studio/contract/auth";
import {
  apiLog,
  CLIENT_LOG_MAX_BYTES,
  CLIENT_LOG_RATE_LIMIT,
  CLIENT_LOG_RATE_WINDOW_MS,
  CLIENT_LOG_SOURCE,
  createFixedWindowLimiter,
  failure,
  json,
  NO_STORE,
  parseClientLog,
  readJsonBody,
  reqCtx,
  schemaInvalid,
} from "@/lib/studio/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROUTE = "/api/studio/client-log";
const SOURCE = "studio.api.client-log";

const limiter = createFixedWindowLimiter({ limit: CLIENT_LOG_RATE_LIMIT, windowMs: CLIENT_LOG_RATE_WINDOW_MS });

/** Kunci laju per sesi: sidik jenis + requester (tanpa menyimpan nilai cookie/token). */
function rateKey(kind: string, requester: string): string {
  return createHash("sha256").update(`${kind}\u0000${requester}`).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, SOURCE);

  try {
    const caller = await getStudioCaller(req);
    const rl = limiter.hit(rateKey(caller.kind, caller.requester));
    if (!rl.allowed) {
      apiLog({ ...ctx, level: "warn", message: "client log rate limit exceeded", code: "CLIENT_LOG_RATE_LIMITED", status: 429, context: { callerKind: caller.kind } });
      return json({ error: "Too many client log entries; retry later" }, 429, ctx, { ...NO_STORE, "Retry-After": String(rl.retryAfterSec) });
    }

    const body = await readJsonBody(req, ctx, { limit: CLIENT_LOG_MAX_BYTES });
    if (!body.ok) return body.response;
    const parsed = parseClientLog(body.value);
    if (!parsed.ok) return schemaInvalid(parsed.issues, ctx, "Client log entry does not match the expected shape");

    const r = parsed.record;
    const correlationId = r.correlationId ?? ctx.correlationId;
    apiLog({
      source: CLIENT_LOG_SOURCE,
      level: r.level,
      message: r.message,
      correlationId,
      route: r.route ?? "(client)",
      method: "CLIENT",
      ...(r.code ? { code: r.code } : {}),
      ...(r.status !== undefined ? { status: r.status } : {}),
      ...(r.stack ? { stack_trace: r.stack } : {}),
      context: {
        ...(r.clientSource ? { clientSource: r.clientSource } : {}),
        ...(r.clientTimestamp ? { clientTimestamp: r.clientTimestamp } : {}),
        ...(r.detail !== undefined ? { detail: r.detail } : {}),
        callerKind: caller.kind,
        requester: caller.requester,
        requestCorrelationId: ctx.correlationId,
      },
    });
    return json({ accepted: true, correlationId }, 202, ctx, NO_STORE);
  } catch (e) {
    return failure(e, ctx, { op: "POST client-log" });
  }
}

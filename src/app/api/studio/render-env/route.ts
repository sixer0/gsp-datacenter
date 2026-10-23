/**
 * R11 `/api/studio/render-env` (01_specs.md §6.2, §8.4; S102) — hanya baca.
 *
 * GET
 *   (tanpa kueri)   -> kesiapan render-env (S92, cache C15 5 menit), status
 *                      per fon (22, manifest S91), antrean soffice, info manifest.
 *   `jobs=1`        -> + `jobs` (StudioRenderJob terbaru, ekor `engine.log`
 *                      tanpa stack trace) dan `jobCounts` per status.
 *   `take=1..200`   -> jumlah job (bawaan 50).
 *   `status=A,B`    -> filter status job (QUEUED,RUNNING,SUCCEEDED,PARTIAL,FAILED).
 *   `log=0..100`    -> jumlah entri log per job (bawaan 20).
 *   `refresh=1`     -> HANYA ADMINISTRATOR: lupakan cache lalu cek ulang
 *                      (`resetReadinessCache` + `force`). Selain admin -> 403.
 *
 * Respons 200 `RenderEnvStatusResponse` (perluasan aditif `RenderEnvResponse`).
 * Galat: 400 SCHEMA_INVALID (kueri tidak sah), 401, 403 FORBIDDEN (refresh non-admin; D-72),
 * 500 tanpa stack (dicatat ke sink JSONL tahan lama + korelasi).
 * Tidak pernah menulis HKCU, fon, manifest, maupun baris job.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { STUDIO_RENDER_JOB_STATUSES, type StudioRenderJobStatus } from "@/lib/studio/contract/enums";
import { getStudioCaller } from "@/lib/studio/contract/auth";
import { isAdminCaller } from "@/lib/studio/services/templates/access";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import { apiLog, failure, json, NO_STORE, reject, reqCtx, schemaInvalid } from "@/lib/studio/http";
import {
  buildRenderEnvStatus,
  JOBS_TAKE_DEFAULT,
  JOBS_TAKE_MAX,
  LOG_TAIL_DEFAULT,
  LOG_TAIL_MAX,
  type JobsQuery,
} from "./_lib/status";

export const dynamic = "force-dynamic";

const ROUTE = "/api/studio/render-env";
const SOURCE = "studio.api.render-env";

function flag(v: string | null): boolean {
  return v === "1" || v === "true";
}

function intParam(v: string | null, min: number, max: number, fallback: number): number | null {
  if (v === null || v === "") return fallback;
  if (!/^\d{1,4}$/.test(v)) return null;
  const n = Number(v);
  return n >= min && n <= max ? n : null;
}

type Parsed = { ok: true; refresh: boolean; jobs: JobsQuery | null } | { ok: false; issues: ValidationIssue[] };

function parseQuery(sp: URLSearchParams): Parsed {
  const issues: ValidationIssue[] = [];
  const take = intParam(sp.get("take"), 1, JOBS_TAKE_MAX, JOBS_TAKE_DEFAULT);
  if (take === null) issues.push({ pointer: "/query/take", keyword: "range", message: `1..${JOBS_TAKE_MAX}` });
  const logTail = intParam(sp.get("log"), 0, LOG_TAIL_MAX, LOG_TAIL_DEFAULT);
  if (logTail === null) issues.push({ pointer: "/query/log", keyword: "range", message: `0..${LOG_TAIL_MAX}` });

  const statuses: StudioRenderJobStatus[] = [];
  const rawStatus = sp.get("status");
  if (rawStatus) {
    for (const s of rawStatus.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean)) {
      if ((STUDIO_RENDER_JOB_STATUSES as readonly string[]).includes(s)) {
        if (!statuses.includes(s as StudioRenderJobStatus)) statuses.push(s as StudioRenderJobStatus);
      } else {
        issues.push({ pointer: "/query/status", keyword: "enum", message: STUDIO_RENDER_JOB_STATUSES.join("|") });
        break;
      }
    }
  }
  if (issues.length) return { ok: false, issues };
  return {
    ok: true,
    refresh: flag(sp.get("refresh")),
    jobs: flag(sp.get("jobs")) ? { take: take as number, logTail: logTail as number, statuses } : null,
  };
}

export async function GET(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, SOURCE);

  const parsed = parseQuery(new URL(req.url).searchParams);
  if (!parsed.ok) return schemaInvalid(parsed.issues, ctx);

  try {
    const caller = await getStudioCaller(req);
    const isAdmin = isAdminCaller(caller);

    if (parsed.refresh && !isAdmin) {
      // D-72 + delta kontrak S03-d2: 403 `FORBIDDEN` = sesi sah tetapi bukan admin.
      const res = reject(ctx, "FORBIDDEN", "Only ADMINISTRATOR may force a readiness re-check", undefined, { callerKind: caller.kind });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    const body = await buildRenderEnvStatus({
      refresh: parsed.refresh,
      canRefresh: isAdmin,
      jobs: parsed.jobs,
      onJobsError: (err) => {
        const e = err instanceof Error ? err : new Error(String(err));
        apiLog({
          ...ctx,
          level: "error",
          message: `GET render-env: job list failed (${e.name})`,
          code: "INTERNAL",
          stack_trace: e.stack,
          context: { errorMessage: e.message.slice(0, 500), take: parsed.jobs?.take, statuses: parsed.jobs?.statuses },
        });
      },
    });

    if (parsed.refresh) {
      apiLog({
        ...ctx,
        level: "info",
        message: "readiness re-check forced by ADMINISTRATOR",
        code: body.readiness.ready ? "RENDER_ENV_READY" : "PDF_ENGINE_UNAVAILABLE",
        context: { by: caller.requester, ready: body.readiness.ready, errors: body.readiness.errors.length },
      });
    }
    return json(body, 200, ctx, NO_STORE);
  } catch (e) {
    return failure(e, ctx, { op: "GET render-env", context: { refresh: parsed.refresh, jobs: Boolean(parsed.jobs) } });
  }
}

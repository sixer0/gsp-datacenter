/**
 * R09 `/api/studio/artifacts` (01_specs.md §6.2; S57).
 *
 * GET  `?kind=chart|diagram|image|html&mission=&take=&cursor=` -> 200
 *      `{ artifacts: (ArtifactSummary & { chartCode, outputs })[], nextCursor }`
 *      (`chartCode` = `spec.kind` artefak CHART, selain itu null; IP-11).
 *      `mission` cocok dengan `missionFolder`, `agentRequestId`, atau
 *      `hermesTaskId`; `take` 1..200 (default 50).
 * POST `ArtifactCreateRequest` (JSON, atau multipart `request`/`spec` + `file`
 *      untuk aset raster) -> validasi -> baris `StudioArtifact` -> render S51
 *      -> 201 `{ artifact, outputs, job, errors, lint? }`. Otorisasi templat
 *      (403) dan gerbang dokumen inline (422) berjalan di `prepareArtifact`
 *      dengan `caller` sebelum baris dibuat (INT-U, F-048).
 *
 * Setiap handler memanggil `requireSession` lebih dulu (§6.1). Galat memakai
 * bentuk `{ error, code, details? }` tanpa stack trace (§6.3).
 */
import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { getStudioCaller } from "@/lib/studio/contract/auth";
import { STUDIO_ARTIFACT_KINDS, type StudioArtifactKind } from "@/lib/studio/contract/enums";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import { assertRenderCapacity, renderArtifact } from "@/lib/studio/services/render";
import { assertMissionRefs } from "@/lib/studio/services/storage";
import { toArtifactListItem, toArtifactSummary } from "./_lib/dto";
import { apiLog, checkRenderRate, failure, issue, json, NO_STORE, reqCtx, schemaInvalid } from "@/lib/studio/http";
import { prepareArtifact } from "./_lib/prepare";
import { readArtifactRequest } from "./_lib/request";

export const dynamic = "force-dynamic";

const ROUTE = "/api/studio/artifacts";
const SOURCE = "studio.api.artifacts";
const DEFAULT_TAKE = 50;
const MAX_TAKE = 200;
const MAX_MISSION_CHARS = 200;
const ID_RE = /^[A-Za-z0-9_-]{1,100}$/;

export async function GET(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, SOURCE);
  try {
    const q = new URL(req.url).searchParams;
    const issues: ValidationIssue[] = [];

    let kind: StudioArtifactKind | undefined;
    const kindRaw = (q.get("kind") || "").trim().toUpperCase();
    if (kindRaw) {
      if ((STUDIO_ARTIFACT_KINDS as readonly string[]).includes(kindRaw)) kind = kindRaw as StudioArtifactKind;
      else issues.push(issue("/kind", "enum", `must be one of ${STUDIO_ARTIFACT_KINDS.map((k) => k.toLowerCase()).join(", ")}`));
    }

    const mission = (q.get("mission") || "").trim();
    if (mission.length > MAX_MISSION_CHARS) issues.push(issue("/mission", "maxLength", `must NOT have more than ${MAX_MISSION_CHARS} characters`));

    let take = DEFAULT_TAKE;
    const takeRaw = q.get("take");
    if (takeRaw !== null && takeRaw !== "") {
      if (/^[1-9][0-9]{0,3}$/.test(takeRaw)) take = Math.min(Number(takeRaw), MAX_TAKE);
      else issues.push(issue("/take", "type", `must be an integer 1..${MAX_TAKE}`));
    }

    const cursor = (q.get("cursor") || "").trim();
    if (cursor && !ID_RE.test(cursor)) issues.push(issue("/cursor", "pattern", "must be an artifact id"));

    if (issues.length > 0) return schemaInvalid(issues, ctx, "Invalid query parameters");

    const where: Prisma.StudioArtifactWhereInput = {
      ...(kind ? { kind } : {}),
      ...(mission ? { OR: [{ missionFolder: mission }, { agentRequestId: mission }, { hermesTaskId: mission }] } : {}),
    };
    const rows = await prisma.studioArtifact.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { outputs: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
    });
    const page = rows.slice(0, take);
    const nextCursor = rows.length > take ? page[page.length - 1].id : null;
    return json({ artifacts: page.map(toArtifactListItem), nextCursor }, 200, ctx, NO_STORE);
  } catch (e) {
    return failure(e, ctx, { op: "list artifacts" });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, SOURCE);
  let logContext: Record<string, unknown> | undefined;
  let artifactId: string | undefined;
  try {
    const parsed = await readArtifactRequest(req);
    const caller = await getStudioCaller(req, parsed.agentId);
    // FIX-1 (S87 M-03): laju per pemanggil (429) dan antrean render (503) sebelum baris dibuat.
    const limited = checkRenderRate(caller, ctx);
    if (limited) return limited;
    assertRenderCapacity();
    await assertMissionRefs(parsed.mission);
    // INT-U (F-048, D-107): caller -> 403 templat terbatas / 422 dokumen inline SEBELUM baris dibuat.
    const prepared = await prepareArtifact(parsed, { ...ctx, caller });
    logContext = prepared.logContext;

    const row = await prisma.studioArtifact.create({
      data: {
        kind: prepared.kind,
        schemaId: prepared.schemaId,
        title: prepared.title,
        label: prepared.label,
        spec: prepared.spec as Prisma.InputJsonValue,
        specSha256: prepared.specSha256,
        templateVersionId: prepared.templateVersionId,
        missionFolder: parsed.mission?.folder ?? null,
        agentRequestId: parsed.mission?.agentRequestId ?? null,
        hermesTaskId: parsed.mission?.hermesTaskId ?? null,
        createdBy: caller.requester,
      },
    });
    artifactId = row.id;
    apiLog({
      ...ctx,
      level: "info",
      message: "artifact created",
      code: "ARTIFACT_CREATED",
      context: { artifactId: row.id, callerKind: caller.kind, ...logContext },
    });

    const outcome = await renderArtifact(row.id, prepared.formats, caller);
    const fresh = (await prisma.studioArtifact.findUnique({ where: { id: row.id } })) ?? row;
    if (outcome.job.status !== "SUCCEEDED") {
      apiLog({
        ...ctx,
        level: "warn",
        message: `artifact render ${outcome.job.status}`,
        code: outcome.errors[0]?.code ?? "RENDER_INCOMPLETE",
        context: { artifactId: row.id, jobId: outcome.job.id, errorCodes: outcome.errors.map((x) => x.code) },
      });
    }
    return json(
      {
        artifact: toArtifactSummary(fresh),
        outputs: outcome.outputs,
        job: outcome.job,
        errors: outcome.errors,
        ...(outcome.lint ? { lint: outcome.lint } : {}),
      },
      201,
      ctx,
      NO_STORE,
    );
  } catch (e) {
    return failure(e, ctx, {
      op: artifactId ? "render artifact" : "create artifact",
      context: { ...logContext, ...(artifactId ? { artifactId } : {}) },
    });
  }
}

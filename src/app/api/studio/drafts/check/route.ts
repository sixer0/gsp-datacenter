/**
 * R23 `POST /api/studio/drafts/check` (DC-23; register 05_document_contract_specs.md §9, §9.3,
 * §9.6 QH-01..QH-06, §11 DR-01..DR-10, T2-70/T2-71, AC-19; D-373).
 *
 * Badan `{ markdown: string, agentId?: string }` (agentId 1..80 karakter) -> 200 `DraftCheckResultV2` untuk
 * masukan dalam batas; isu ekstraksi = isu DR, bukan status HTTP. Langkah: batas C54 ->
 * I63 `extractDraft` -> setiap blok tanpa isu galat ekstraksi di-dry-run seperti R08 DI PROSES
 * (`_lib/dry-run.ts`, layanan yang sama; transaksi READ ONLY) -> DR-08 basis basi terhadap
 * `currentRevisionNo` dokumen. Tanpa tulis DB, tanpa render.
 *
 * agentId dry-run (D-392): `agentId` payload blok bila ada, selain itu `agentId` badan R23 (ditambahkan
 * ke payload dry-run, sama seperti CLI `--agent-id`); tanpa keduanya = tanpa agentId.
 *
 * Orkestrasi (urutan isu, aturan dry-run, pemetaan penolakan 4xx) bersama CLI
 * `scripts/studio/draft-check.ts --remote` lewat `services/draft/check.ts`, sehingga `--json` CLI
 * identik dengan respons ini untuk berkas yang sama (AC-19).
 *
 * Urutan galat: 401 (`requireSession`, tanpa header kuota) -> 415 `UNSUPPORTED_MEDIA_TYPE` /
 * 413 badan > C54.bodyBytes (`details.reason` DR-09) / 400 `JSON_MALFORMED` / 400
 * `SCHEMA_INVALID` (kunci tak dikenal, tipe) -> 413 `markdown` > C54.maxChars (DR-09) atau blok >
 * C54.maxBlocks (DR-10) -> 429 `RATE_LIMITED` (bucket `validate`, `Retry-After`). Penolakan
 * sebelum tagihan tidak memakan kuota dan tanpa header kuota (QH-03).
 *
 * Bucket `validate` ditagih satu kali per blok yang akan di-dry-run (KD-43: setiap blok = satu
 * dry-run R08), semuanya sebelum dry-run pertama; satu tagihan ditolak -> 429 tanpa dry-run apa
 * pun. FIX-SEC L-2 (D-402): draf tanpa blok yang dapat di-dry-run tetap ditagih SATU kali
 * (`draftValidateCharges` = max(1, blok dry-run)), sehingga respons 200-nya membawa header kuota.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import type { ValidationIssue } from "@/lib/studio/contract";
import { DRAFT_LIMITS, STUDIO_ROUTES } from "@/lib/studio/contract/env";
import { getStudioCaller } from "@/lib/studio/contract/auth";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import {
  apiLog,
  assertJsonContentType,
  isRecord,
  json,
  parseJsonText,
  readBodyBytes,
  reject,
  reqCtx,
  schemaInvalid,
  withQuotaHeaders,
  type ReqCtx,
} from "@/lib/studio/http";
import { checkDraftLimits, completeDraftCheck, draftLimitMessage, prepareDraftCheck } from "@/lib/studio/services/draft";
import { draftValidateCharges } from "@/lib/studio/services/draft/check";
import { failFrom } from "../../validate/_shared/route-kit";
import { checkValidateRate } from "../../validate/_shared/validate-rate";
import { currentRevisionNoOf, dryRunDraftBlock } from "./_lib/dry-run";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROUTE = STUDIO_ROUTES.R23;
const ALLOWED_FIELDS: ReadonlySet<string> = new Set(["markdown", "agentId"]);
const AGENT_ID_MAX = 80;

interface DraftBody {
  markdown: string;
  agentId?: string;
  bytes: number;
}

type BodyResult = { ok: true; value: DraftBody } | { ok: false; response: Response };

/** Baca badan berbatas C54.bodyBytes (413 DR-09), UTF-8 ketat dan JSON (400), lalu bentuknya (400). */
async function readDraftBody(req: NextRequest, ctx: ReqCtx): Promise<BodyResult> {
  let raw: unknown;
  let bytes: number;
  try {
    assertJsonContentType(req);
    let buf: Uint8Array;
    try {
      buf = await readBodyBytes(req, DRAFT_LIMITS.bodyBytes);
    } catch (err) {
      if (err instanceof StudioEngineError && err.code === "PAYLOAD_TOO_LARGE") {
        return {
          ok: false,
          response: reject(ctx, "PAYLOAD_TOO_LARGE", draftLimitMessage("DRAFT_TOO_LONG"), { reason: "DRAFT_TOO_LONG" }, { limit: DRAFT_LIMITS.bodyBytes }),
        };
      }
      throw err;
    }
    bytes = buf.byteLength;
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
    } catch {
      throw new StudioEngineError("JSON_MALFORMED", "Badan permintaan bukan UTF-8 yang sah");
    }
    raw = parseJsonText(text);
  } catch (err) {
    if (err instanceof StudioEngineError) return { ok: false, response: reject(ctx, err.code, err.message, err.details) };
    throw err;
  }

  if (!isRecord(raw)) {
    return { ok: false, response: schemaInvalid([{ pointer: "", keyword: "type", message: "badan harus objek JSON" }], ctx, "Badan permintaan tidak sesuai bentuk yang diharapkan") };
  }
  const issues: ValidationIssue[] = [];
  for (const k of Object.keys(raw)) {
    if (!ALLOWED_FIELDS.has(k)) issues.push({ pointer: `/${k.replace(/~/g, "~0").replace(/\//g, "~1")}`, keyword: "additionalProperties", message: `medan "${k}" tidak dikenal` });
  }
  if (typeof raw.markdown !== "string") issues.push({ pointer: "/markdown", keyword: "type", message: "markdown wajib berupa string" });
  if (raw.agentId !== undefined && (typeof raw.agentId !== "string" || raw.agentId.length < 1 || raw.agentId.length > AGENT_ID_MAX)) {
    issues.push({ pointer: "/agentId", keyword: "type", message: `agentId harus string 1..${AGENT_ID_MAX} karakter` });
  }
  if (issues.length > 0) return { ok: false, response: schemaInvalid(issues, ctx, "Badan permintaan tidak sesuai bentuk yang diharapkan") };
  return {
    ok: true,
    value: { markdown: raw.markdown as string, ...(typeof raw.agentId === "string" ? { agentId: raw.agentId } : {}), bytes },
  };
}

export async function POST(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE);
  // DC-19 (QH-03): header kuota pada respons apa pun sesudah tagihan bucket; tanpa tagihan = tanpa header.
  return withQuotaHeaders(ctx, () => postCheck(req, ctx));
}

async function postCheck(req: NextRequest, ctx: ReqCtx): Promise<Response> {
  try {
    const body = await readDraftBody(req, ctx);
    if (!body.ok) return body.response;
    const { markdown, agentId, bytes } = body.value;

    const limit = checkDraftLimits(markdown, { bodyBytes: bytes });
    if (limit !== null) {
      return reject(ctx, "PAYLOAD_TOO_LARGE", draftLimitMessage(limit), { reason: limit }, { chars: markdown.length, bytes });
    }

    const caller = await getStudioCaller(req, agentId);
    const prepared = prepareDraftCheck(markdown);
    // KD-43: satu tagihan per blok yang akan di-dry-run, semuanya sebelum dry-run pertama; L-2: minimal satu.
    const charges = draftValidateCharges(prepared);
    for (let i = 0; i < charges; i++) {
      const limited = checkValidateRate(caller, ctx);
      if (limited) return limited;
    }

    const result = await completeDraftCheck(
      markdown,
      prepared,
      {
        currentRevisionNo: currentRevisionNoOf,
        // Aturan agentId bersama CLI (services/draft/check.ts, D-392): agentId payload blok, selain itu agentId badan R23.
        dryRun: async (input) => dryRunDraftBlock(input.value, await getStudioCaller(req, input.agentId), ctx),
      },
      agentId,
    );
    apiLog({
      ...ctx,
      level: "info",
      message: "draft check",
      code: "DRAFT_CHECK",
      status: 200,
      context: {
        valid: result.valid,
        blocks: result.blocks.length,
        dryRun: prepared.dryRunBlocks.length,
        invalidBlocks: result.blocks.filter((b) => !b.valid).length,
        issues: result.issues.map((i) => i.code),
      },
    });
    return json(result, 200, ctx);
  } catch (err) {
    return failFrom(err, ctx, { op: "POST drafts/check" });
  }
}

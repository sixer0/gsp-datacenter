/**
 * R18 `/api/studio/assets` (register 03_structural_sections_specs.md §11 R18,
 * blueprint 05 §2.5; SR-25). Unggah aset raster terpisah dari kiriman, beralamat
 * isi (sha256) sehingga idempoten.
 *
 * POST multipart `file` (satu bagian berkas) ATAU JSON `{ mime, dataBase64 }`;
 *      `?mission=<folder>` opsional (tautan misi baris StudioAsset).
 *      -> 201 `{ asset: AssetDtoV2, created: true }` (baru)
 *      -> 200 `{ asset, created: false }` (sha sudah ada)
 *      Galat: 413 `ASSET_TOO_LARGE` (byte aset, multipart, atau piksel FIX-1
 *      M-02 / D-134: sisi > 20.000 px atau > 80 MP), 413 `PAYLOAD_TOO_LARGE`
 *      (badan JSON > `STUDIO_MAX_JSON_BYTES`; aset besar lewat multipart),
 *      415 `ASSET_TYPE_UNSUPPORTED` (selain PNG/JPEG menurut magic bytes),
 *      415 `UNSUPPORTED_MEDIA_TYPE` (Content-Type selain multipart/JSON;
 *      header absen diterima sebagai JSON, S87 L-07), 400 `SCHEMA_INVALID`,
 *      400 `JSON_MALFORMED`, 429 `RATE_LIMITED` (laju 60/menit, atau kuota
 *      byte aset baru per 24 jam FIX-SEC N-07: `details.reason =
 *      "asset_quota_exceeded"` + `quotaBytes`/`usedBytes`/`requestedBytes`,
 *      header `Retry-After`), 500 `STORAGE_WRITE_FAILED` (ruang disk volume
 *      akar di bawah `STUDIO_ASSET_MIN_FREE_BYTES`). Kuota ditegakkan layanan
 *      gambar (`assertAssetQuota`) sehingga juga berlaku untuk `assets` kiriman.
 * GET  `?sha256=<hex|sha256:hex>` -> 200 `{ asset }`; tak dikenal 404
 *      `FILE_NOT_FOUND` (KD-24). `?mission=&take=` -> 200 `{ assets }`
 *      (terbaru dulu, `take` 1..200, bawaan 50).
 *      `?sha256=&inline=1` (pratinjau UI, IP-54/D-212) -> 200 byte gambar
 *      PNG/JPEG: Content-Type dari hasil dekode (bukan klien), `inline`,
 *      `X-Content-Type-Options: nosniff`, ETag = sha256 (`If-None-Match` -> 304),
 *      cache privat (isi beralamat sha tidak berubah). Berkas dibaca lewat
 *      `relPath` baris M13 (C33c) dengan cadangan jalur datar lama (D-175) dan
 *      dicocokkan ulang sha256/mime-nya; hilang di disk 410
 *      `FILE_MISSING_ON_DISK`. Respons dan galat tanpa path server.
 *
 * D-134: multipart diizinkan HANYA untuk route ini (dan R09). Dekode, batas
 * piksel, dedupe sha256, berkas `assets/...` dan baris M13 dikerjakan layanan
 * gambar SR-19 (`storeAsset`, register I52); route hanya membaca badan
 * berbatas, memvalidasi amplop, dan memetakan hasil. Respons tidak pernah
 * memuat path berkas. Setiap handler memanggil `requireSession` lebih dulu;
 * galat lewat helper `@/lib/studio/http` (log JSONL tahan lama + correlation id).
 */
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { getStudioCaller } from "@/lib/studio/contract/auth";
import { STUDIO_MAX_ASSET_BYTES, STUDIO_MAX_JSON_BYTES } from "@/lib/studio/contract/env";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import type { AssetInputV2 } from "@/lib/studio/contract/types/v2";
import {
  apiLog,
  assertJsonContentType,
  createFixedWindowLimiter,
  failure,
  issue,
  json,
  NO_STORE,
  readJsonObject,
  reject,
  renderRateIdentity,
  reqCtx,
  schemaInvalid,
  withCorrelation,
  type ReqCtx,
} from "@/lib/studio/http";
import { isMultipart, readMultipartForm } from "@/lib/studio/http/multipart";
import { findAssetBySha, readImageAsset, storeAsset, toAssetDto, type StudioAssetRow } from "@/lib/studio/services/images";
import { MISSION_FOLDER_RE } from "@/lib/studio/services/storage/paths";
import { fileHeaders } from "../files/_lib/serve";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROUTE = "/api/studio/assets";
const SOURCE = "studio.api.assets";
const DEFAULT_TAKE = 50;
const MAX_TAKE = 200;
const MAX_MISSION_CHARS = 200;
const SHA256_RE = /^(?:sha256:)?([0-9a-fA-F]{64})$/;
const ASSET_MIMES = ["image/png", "image/jpeg"] as const;
type AssetMime = (typeof ASSET_MIMES)[number];
const JSON_KEYS = new Set(["mime", "dataBase64"]);
/** Cache pratinjau: privat (bersesi), isi beralamat sha256 sehingga tidak berubah. */
const PREVIEW_CACHE_CONTROL = "private, max-age=3600, immutable";

/** Laju unggah per pemanggil terautentikasi (FIX-1 M-03; kunci tanpa medan klien). */
const UPLOAD_RATE_LIMIT = 60;
const UPLOAD_RATE_WINDOW_MS = 60_000;
const uploadLimiter = createFixedWindowLimiter({ limit: UPLOAD_RATE_LIMIT, windowMs: UPLOAD_RATE_WINDOW_MS });

function uploadRateKey(identity: string): string {
  return createHash("sha256").update(`asset\u0000${identity}`).digest("hex").slice(0, 32);
}

/** `?mission=`: kosong -> undefined; format §7.2 salah -> isu skema. */
function missionParam(q: URLSearchParams, issues: ValidationIssue[]): string | undefined {
  const mission = (q.get("mission") ?? "").trim();
  if (!mission) return undefined;
  if (mission.length > MAX_MISSION_CHARS || !MISSION_FOLDER_RE.test(mission)) {
    issues.push(issue("/mission", "pattern", "must be a mission folder name (YYYY-MM-DD_<slug>)"));
    return undefined;
  }
  return mission;
}

type UploadInput = AssetInputV2 | { file: Uint8Array; mime?: string };

/** Multipart: tepat satu bagian berkas `file`; tipe klien hanya petunjuk (layanan mendeteksi magic bytes). */
async function readMultipartUpload(req: Request, contentType: string): Promise<UploadInput> {
  // D-61: tolak dari header sebelum membaca; batas yang sama ditegakkan saat streaming (413 ASSET_TOO_LARGE).
  const form = await readMultipartForm(req, contentType);
  const files = form.getAll("file");
  if (files.length === 0) {
    throw new StudioEngineError("SCHEMA_INVALID", "Multipart request needs a 'file' part", [issue("/file", "required", "must have required property 'file'")]);
  }
  if (files.length > 1) {
    throw new StudioEngineError("SCHEMA_INVALID", "Only one 'file' part is accepted", [issue("/file", "maxItems", "must have at most 1 file")]);
  }
  const f = files[0];
  if (typeof f === "string") {
    throw new StudioEngineError("SCHEMA_INVALID", "Form field 'file' must be a file", [issue("/file", "type", "must be a file part")]);
  }
  if (f.size > STUDIO_MAX_ASSET_BYTES) {
    throw new StudioEngineError("ASSET_TOO_LARGE", `Asset exceeds ${STUDIO_MAX_ASSET_BYTES} bytes`, { limitBytes: STUDIO_MAX_ASSET_BYTES });
  }
  const file = new Uint8Array(await f.arrayBuffer());
  const hint = (f.type || "").toLowerCase();
  return (ASSET_MIMES as readonly string[]).includes(hint) ? { file, mime: hint } : { file };
}

/** JSON `{ mime, dataBase64 }` (AssetInputV2 bentuk data; `assetRef` tidak berarti di sini). */
function checkJsonUpload(body: Record<string, unknown>): UploadInput {
  const issues: ValidationIssue[] = [];
  for (const k of Object.keys(body)) {
    if (!JSON_KEYS.has(k)) issues.push(issue(`/${k}`, "additionalProperties", "must NOT have additional properties"));
  }
  if (body.mime === undefined) issues.push(issue("/mime", "required", "must have required property 'mime'"));
  else if (typeof body.mime !== "string" || !(ASSET_MIMES as readonly string[]).includes(body.mime)) {
    issues.push(issue("/mime", "enum", `must be one of ${ASSET_MIMES.join(", ")}`));
  }
  if (body.dataBase64 === undefined) issues.push(issue("/dataBase64", "required", "must have required property 'dataBase64'"));
  else if (typeof body.dataBase64 !== "string" || body.dataBase64.trim() === "") {
    issues.push(issue("/dataBase64", "type", "must be a non-empty base64 string"));
  }
  if (issues.length > 0) throw new StudioEngineError("SCHEMA_INVALID", "Asset upload does not match { mime, dataBase64 }", issues);
  return { mime: body.mime as AssetMime, dataBase64: body.dataBase64 as string };
}

async function readUpload(req: NextRequest, ctx: ReqCtx): Promise<{ ok: true; input: UploadInput } | { ok: false; response: Response }> {
  const contentType = (req.headers.get("content-type") ?? "").trim();
  if (isMultipart(contentType)) return { ok: true, input: await readMultipartUpload(req, contentType) };
  // Bukan multipart: wajib JSON (atau tanpa header, L-07); selain itu 415 sebelum badan dibaca.
  assertJsonContentType(req);
  const body = await readJsonObject(req, ctx, { limit: STUDIO_MAX_JSON_BYTES, fatalUtf8: true });
  if (!body.ok) return body;
  return { ok: true, input: checkJsonUpload(body.value) };
}

export async function POST(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, SOURCE);
  let missionFolder: string | undefined;
  try {
    const issues: ValidationIssue[] = [];
    missionFolder = missionParam(new URL(req.url).searchParams, issues);
    if (issues.length > 0) return schemaInvalid(issues, ctx, "Invalid query parameters");

    const caller = await getStudioCaller(req);
    const rl = uploadLimiter.hit(uploadRateKey(renderRateIdentity(caller)));
    if (!rl.allowed) {
      return reject(ctx, "RATE_LIMITED", "Too many asset uploads; retry later", { retryAfterSec: rl.retryAfterSec }, {
        callerKind: caller.kind,
        retryAfterSec: rl.retryAfterSec,
      });
    }

    const read = await readUpload(req, ctx);
    if (!read.ok) return read.response;

    const { asset, created } = await storeAsset(caller, read.input, missionFolder, { correlationId: ctx.correlationId });
    apiLog({
      ...ctx,
      level: "info",
      message: created ? "asset stored" : "asset already present",
      code: created ? "ASSET_CREATED" : "ASSET_REUSED",
      status: created ? 201 : 200,
      context: { sha256: asset.sha256, mime: asset.mime, bytes: asset.bytes, widthPx: asset.widthPx, heightPx: asset.heightPx, callerKind: caller.kind, ...(missionFolder ? { missionFolder } : {}) },
    });
    return json({ asset, created }, created ? 201 : 200, ctx, NO_STORE);
  } catch (e) {
    // stripDetails: detail galat layanan dapat memuat relPath internal (respons tanpa path).
    // SCHEMA_INVALID (isu berpointer) dan RATE_LIMITED (kuota/laju, angka saja) tetap membawa detail.
    const keepDetails = e instanceof StudioEngineError && (e.code === "SCHEMA_INVALID" || e.code === "RATE_LIMITED");
    return failure(e, ctx, { op: "upload asset", stripDetails: !keepDetails, context: missionFolder ? { missionFolder } : undefined });
  }
}

function flag(q: URLSearchParams, name: string): boolean {
  const v = q.get(name);
  return v === "1" || v === "true";
}

/**
 * Byte aset terverifikasi (sniff + batas + sha256 + mime, `readImageAsset`).
 * Sumber utama `relPath` baris (C33c); berkas hilang -> cadangan jalur datar
 * lama `assets/<sha>.<ext>` (D-175), lalu 410 bila keduanya tidak ada.
 */
async function readAssetBytes(row: StudioAssetRow): Promise<{ bytes: Uint8Array; mime: AssetMime }> {
  const mime: AssetMime = row.mime === "image/jpeg" ? "image/jpeg" : "image/png";
  try {
    const img = await readImageAsset({ sha256: row.sha256, mime, path: row.relPath });
    return { bytes: img.bytes, mime: img.mime };
  } catch (e) {
    if (!(e instanceof StudioEngineError && e.code === "FILE_MISSING_ON_DISK")) throw e;
    const img = await readImageAsset({ sha256: row.sha256, mime });
    return { bytes: img.bytes, mime: img.mime };
  }
}

/** Pratinjau inline (`?sha256=&inline=1`): byte gambar, tanpa path di header. */
async function serveAssetInline(req: NextRequest, row: StudioAssetRow, ctx: ReqCtx): Promise<Response> {
  const etag = `"${row.sha256}"`;
  const inm = req.headers.get("if-none-match");
  if (inm && inm.split(",").some((t) => t.trim().replace(/^W\//, "") === etag)) {
    const h = new Headers({ ETag: etag, "Cache-Control": PREVIEW_CACHE_CONTROL, "X-Content-Type-Options": "nosniff" });
    return withCorrelation(new Response(null, { status: 304, headers: h }), ctx);
  }
  const { bytes, mime } = await readAssetBytes(row);
  const headers = fileHeaders({
    fileName: `${row.sha256}.${mime === "image/jpeg" ? "jpg" : "png"}`,
    bytes: bytes.byteLength,
    sha256: row.sha256,
    inline: true,
    download: false,
  });
  headers.set("Cache-Control", PREVIEW_CACHE_CONTROL);
  headers.set("ETag", etag);
  // Uint8Array hasil dekode tidak pernah memakai SharedArrayBuffer; view tanpa salin.
  const body = new Uint8Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength);
  return withCorrelation(new Response(body, { status: 200, headers }), ctx);
}

export async function GET(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, SOURCE);
  try {
    const q = new URL(req.url).searchParams;
    const issues: ValidationIssue[] = [];

    const shaRaw = (q.get("sha256") ?? "").trim();
    if (shaRaw) {
      const m = SHA256_RE.exec(shaRaw);
      if (!m) return schemaInvalid([issue("/sha256", "pattern", "must be 64 hex characters, optionally prefixed 'sha256:'")], ctx, "Invalid query parameters");
      const sha256 = m[1].toLowerCase();
      const row = await findAssetBySha(sha256, { correlationId: ctx.correlationId });
      if (!row) return reject(ctx, "FILE_NOT_FOUND", "Asset not found", undefined, { sha256 });
      if (flag(q, "inline")) return await serveAssetInline(req, row, ctx);
      return json({ asset: toAssetDto(row) }, 200, ctx, NO_STORE);
    }

    const mission = missionParam(q, issues);
    let take = DEFAULT_TAKE;
    const takeRaw = q.get("take");
    if (takeRaw !== null && takeRaw !== "") {
      if (/^[1-9][0-9]{0,3}$/.test(takeRaw)) take = Math.min(Number(takeRaw), MAX_TAKE);
      else issues.push(issue("/take", "type", `must be an integer 1..${MAX_TAKE}`));
    }
    if (!mission && issues.length === 0) {
      issues.push(issue("/sha256", "required", "must provide 'sha256' or 'mission'"));
    }
    if (issues.length > 0) return schemaInvalid(issues, ctx, "Invalid query parameters");

    const rows = await prisma.studioAsset.findMany({
      where: { missionFolder: mission },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
    });
    return json({ assets: rows.map(toAssetDto) }, 200, ctx, NO_STORE);
  } catch (e) {
    return failure(e, ctx, { op: "get assets", stripDetails: true });
  }
}

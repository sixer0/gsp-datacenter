/**
 * Header kuota + bucket `query` (DC-19; register 05_document_contract_specs.md §9.6
 * QH-01..QH-06, C46-C49, E53, KD-38).
 *
 * - Setiap bucket laju (render, validate, import, query) mencatat hasil tagihannya pada
 *   konteks permintaan (`recordQuotaCharge`). Pencatatan hanya terjadi SESUDAH tagihan,
 *   jadi permintaan yang ditolak sebelumnya (mis. 401) tidak pernah membawa header (QH-03).
 * - `applyQuotaHeaders` memasang C48 (sisa bilangan bulat >= 0) dan C49 (nama bucket E53)
 *   pada respons apa pun yang dihasilkan sesudah tagihan: 2xx, 4xx, 429, 5xx (QH-02, QH-03).
 * - Dua bucket ditagih dalam satu permintaan (R08 `?preview=html`, impor `?validate=1`):
 *   header melaporkan bucket dengan sisa terkecil, seri diputus urutan E53 (QH-04, KD-38).
 * - 429 -> C48 = `0`; `Retry-After` dari `reject` tidak disentuh (QH-05).
 * - Nilai = sisa limiter memori proses ini (QH-06, RK-22).
 *
 * Bucket `query` (R21, R22): C46 permintaan per C47 ms per identitas pemanggil (identitas
 * sama dengan bucket validate); env `STUDIO_QUERY_RATE_LIMIT` / `STUDIO_QUERY_RATE_WINDOW_MS`
 * (dibaca sekali).
 */
import { createHash } from "node:crypto";
import type { StudioCaller } from "@/lib/studio/contract/auth";
import { QUOTA_BUCKETS, type QuotaBucket } from "@/lib/studio/contract/enums";
import { STUDIO_QUOTA_BUCKET_HEADER, STUDIO_QUOTA_REMAINING_HEADER } from "@/lib/studio/contract/env";
import type { ReqCtx } from "./context";
import { reject } from "./errors";
import { createFixedWindowLimiter, type FixedWindowLimiter, type RateLimitResult } from "./rate-limit";

// C48/C49 (`contract/env.ts`) dan E53 (`contract/enums.ts`) milik kontrak (IB-DC-1). Diteruskan
// sebagai binding yang SAMA (bukan definisi kedua) untuk barrel `http/index.ts` dan pemakai lama.
export { QUOTA_BUCKETS, STUDIO_QUOTA_BUCKET_HEADER, STUDIO_QUOTA_REMAINING_HEADER, type QuotaBucket };

/** C46 */
export const QUERY_RATE_LIMIT_DEFAULT = 120;
/** C47 */
export const QUERY_RATE_WINDOW_MS_DEFAULT = 60_000;

type RateCaller = Pick<StudioCaller, "kind" | "username" | "email">;

/**
 * Identitas laju TERAUTENTIKASI pemanggil (tanpa medan yang dikirim klien bebas), satu
 * sumber untuk semua bucket. `renderRateIdentity` (render-guard) mendelegasikan ke sini.
 */
export function quotaRateIdentity(caller: RateCaller): string {
  switch (caller.kind) {
    case "ADMIN_SESSION":
    case "USER_SESSION":
      return `${caller.kind}:${caller.username ?? "?"}`;
    case "GOOGLE_SESSION":
      return `${caller.kind}:${caller.email ?? "?"}`;
    default:
      // Pemegang x-internal-secret: satu ember (agentId hanya label, dapat dipalsukan).
      return `${caller.kind}:shared`;
  }
}

// ---------------------------------------------------------------------------
// Catatan tagihan per permintaan
// ---------------------------------------------------------------------------

/** Sisa per bucket yang ditagih permintaan ini. WeakMap: ikut terbuang bersama ctx. */
const charges = new WeakMap<ReqCtx, Map<QuotaBucket, number>>();

/**
 * Catat satu tagihan bucket pada permintaan ini. Bucket yang ditagih berulang (mis. R23
 * per blok) menyimpan sisa terkecil.
 */
export function recordQuotaCharge(ctx: ReqCtx, bucket: QuotaBucket, rl: Pick<RateLimitResult, "allowed" | "remaining">): void {
  const remaining = rl.allowed ? Math.max(0, Math.floor(rl.remaining)) : 0;
  let m = charges.get(ctx);
  if (!m) {
    m = new Map();
    charges.set(ctx, m);
  }
  const prev = m.get(bucket);
  m.set(bucket, prev === undefined ? remaining : Math.min(prev, remaining));
}

/** Bucket yang dilaporkan (QH-04): sisa terkecil, seri = urutan E53. `null` = belum ditagih. */
export function quotaReport(ctx: ReqCtx): { bucket: QuotaBucket; remaining: number } | null {
  const m = charges.get(ctx);
  if (!m || m.size === 0) return null;
  let best: { bucket: QuotaBucket; remaining: number } | null = null;
  for (const bucket of QUOTA_BUCKETS) {
    const remaining = m.get(bucket);
    if (remaining === undefined) continue;
    if (best === null || remaining < best.remaining) best = { bucket, remaining };
  }
  return best;
}

/**
 * Pasang C48/C49 pada respons sesudah tagihan (QH-02..QH-05). Tanpa tagihan tercatat
 * (penolakan sebelum tagihan, mis. 401) respons dikembalikan apa adanya. Header beku
 * disalin ke Response baru (pola `withCorrelation`).
 */
export function applyQuotaHeaders(res: Response, ctx: ReqCtx): Response {
  const report = quotaReport(ctx);
  if (!report) return res;
  const remaining = res.status === 429 ? "0" : String(report.remaining);
  try {
    res.headers.set(STUDIO_QUOTA_REMAINING_HEADER, remaining);
    res.headers.set(STUDIO_QUOTA_BUCKET_HEADER, report.bucket);
    return res;
  } catch {
    const headers = new Headers(res.headers);
    headers.set(STUDIO_QUOTA_REMAINING_HEADER, remaining);
    headers.set(STUDIO_QUOTA_BUCKET_HEADER, report.bucket);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }
}

/**
 * Pembungkus satu titik untuk route handler: jalankan isi route lalu pasang header kuota
 * pada respons apa pun yang dihasilkan (2xx/4xx/429/5xx). Galat yang lolos dilempar ulang
 * tanpa diubah.
 */
export async function withQuotaHeaders(ctx: ReqCtx, run: () => Promise<Response>): Promise<Response> {
  return applyQuotaHeaders(await run(), ctx);
}

// ---------------------------------------------------------------------------
// Bucket `query` (R21, R22)
// ---------------------------------------------------------------------------

function envInt(name: string, fallback: number, min: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min ? n : fallback;
}

let queryLimiterInstance: FixedWindowLimiter | null = null;

function queryLimiter(): FixedWindowLimiter {
  queryLimiterInstance ??= createFixedWindowLimiter({
    limit: envInt("STUDIO_QUERY_RATE_LIMIT", QUERY_RATE_LIMIT_DEFAULT, 1),
    windowMs: envInt("STUDIO_QUERY_RATE_WINDOW_MS", QUERY_RATE_WINDOW_MS_DEFAULT, 1000),
  });
  return queryLimiterInstance;
}

/** Hanya untuk uji: buat ulang limiter (membaca env lagi). */
export function resetQueryRateLimiter(): void {
  queryLimiterInstance = null;
}

/**
 * Hitung satu permintaan R21/R22. `null` = diizinkan (tagihan tercatat; route memasang
 * header lewat `applyQuotaHeaders`/`withQuotaHeaders`); selain itu respons 429
 * `RATE_LIMITED` + `Retry-After` + header kuota yang langsung dikembalikan route.
 */
export function checkQueryRate(caller: RateCaller, ctx: ReqCtx): Response | null {
  const key = createHash("sha256").update(`query\u0000${quotaRateIdentity(caller)}`).digest("hex").slice(0, 32);
  const rl = queryLimiter().hit(key);
  recordQuotaCharge(ctx, "query", rl);
  if (rl.allowed) return null;
  return applyQuotaHeaders(
    reject(ctx, "RATE_LIMITED", "Too many query requests; retry later", { retryAfterSec: rl.retryAfterSec }, {
      callerKind: caller.kind,
      retryAfterSec: rl.retryAfterSec,
      limiter: "query",
    }),
    ctx,
  );
}

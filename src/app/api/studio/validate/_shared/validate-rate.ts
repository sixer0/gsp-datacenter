/**
 * Pembatas laju R08 `POST /api/studio/validate` (D-280 S2-03, FIX-S2).
 *
 * Setiap panggilan R08 dihitung, bukan hanya `?preview=html`: dry-run kiriman v2
 * (FIX-V) membuka transaksi READ ONLY per permintaan dan menjalankan lint penuh, jadi
 * tanpa batas pemanggil terautentikasi dapat menekan pool DB dan CPU HQ bersama.
 *
 * Pola dan sumber SAMA dengan route kiriman (FIX-1, `@/lib/studio/http`): limiter
 * jendela tetap `createFixedWindowLimiter`, identitas TERAUTENTIKASI
 * `renderRateIdentity` (bukan `agentId` badan), dan respons 429 `RATE_LIMITED` +
 * `Retry-After` lewat `reject`. Embernya terpisah dan lebih longgar dari ember render
 * (rekomendasi SR-57: validasi interaktif editor tidak menghabiskan jatah kiriman/build);
 * `?preview=html` tetap juga dihitung ember render.
 *
 * Bawaan 120 permintaan per 60 detik per pemanggil; env `STUDIO_VALIDATE_RATE_LIMIT` /
 * `STUDIO_VALIDATE_RATE_WINDOW_MS` (dibaca sekali).
 */
import { createHash } from "node:crypto";
import type { StudioCaller } from "@/lib/studio/contract/auth";
import { createFixedWindowLimiter, reject, renderRateIdentity, type FixedWindowLimiter, type ReqCtx } from "@/lib/studio/http";

export const VALIDATE_RATE_LIMIT_DEFAULT = 120;
export const VALIDATE_RATE_WINDOW_MS_DEFAULT = 60_000;

function envInt(name: string, fallback: number, min: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min ? n : fallback;
}

let limiter: FixedWindowLimiter | null = null;

function validateLimiter(): FixedWindowLimiter {
  limiter ??= createFixedWindowLimiter({
    limit: envInt("STUDIO_VALIDATE_RATE_LIMIT", VALIDATE_RATE_LIMIT_DEFAULT, 1),
    windowMs: envInt("STUDIO_VALIDATE_RATE_WINDOW_MS", VALIDATE_RATE_WINDOW_MS_DEFAULT, 1000),
  });
  return limiter;
}

/** Hanya untuk uji: buat ulang limiter (membaca env lagi). */
export function resetValidateRateLimiter(): void {
  limiter = null;
}

/**
 * Hitung satu permintaan R08. `null` = diizinkan; selain itu respons 429 `RATE_LIMITED`
 * (`retryAfterSec`, header `Retry-After`) yang langsung dikembalikan route.
 */
export function checkValidateRate(caller: Pick<StudioCaller, "kind" | "username" | "email">, ctx: ReqCtx): Response | null {
  const key = createHash("sha256").update(`validate\u0000${renderRateIdentity(caller)}`).digest("hex").slice(0, 32);
  const rl = validateLimiter().hit(key);
  if (rl.allowed) return null;
  return reject(ctx, "RATE_LIMITED", "Too many validate requests; retry later", { retryAfterSec: rl.retryAfterSec }, {
    callerKind: caller.kind,
    retryAfterSec: rl.retryAfterSec,
    limiter: "validate",
  });
}

/**
 * Pembatas laju `POST /api/studio/import/markdown` (FIX-HR1, D-334 H-01).
 *
 * Konversi Markdown berjalan sinkron di event loop proses HQ bersama, jadi SETIAP panggilan
 * dihitung (bukan hanya `?validate=1`, yang tetap juga dihitung ember R08). Pola dan sumber
 * sama dengan FIX-1 (`@/lib/studio/http`): limiter jendela tetap `createFixedWindowLimiter`,
 * identitas TERAUTENTIKASI `renderRateIdentity` (bukan `agentId` badan), respons 429
 * `RATE_LIMITED` + `Retry-After` lewat `reject`. Ember sendiri (`import`), terpisah dari ember
 * render dan validasi.
 *
 * Bawaan 60 permintaan per 60 detik per pemanggil (satu bab per detik; 10 bab Hermes jauh di
 * bawahnya); env `STUDIO_IMPORT_RATE_LIMIT` / `STUDIO_IMPORT_RATE_WINDOW_MS` (dibaca sekali).
 */
import { createHash } from "node:crypto";
import type { StudioCaller } from "@/lib/studio/contract/auth";
import { createFixedWindowLimiter, reject, renderRateIdentity, type FixedWindowLimiter, type ReqCtx } from "@/lib/studio/http";

export const IMPORT_RATE_LIMIT_DEFAULT = 60;
export const IMPORT_RATE_WINDOW_MS_DEFAULT = 60_000;

function envInt(name: string, fallback: number, min: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min ? n : fallback;
}

let limiter: FixedWindowLimiter | null = null;

function importLimiter(): FixedWindowLimiter {
  limiter ??= createFixedWindowLimiter({
    limit: envInt("STUDIO_IMPORT_RATE_LIMIT", IMPORT_RATE_LIMIT_DEFAULT, 1),
    windowMs: envInt("STUDIO_IMPORT_RATE_WINDOW_MS", IMPORT_RATE_WINDOW_MS_DEFAULT, 1000),
  });
  return limiter;
}

/** Hanya untuk uji: buat ulang limiter (membaca env lagi). */
export function resetImportRateLimiter(): void {
  limiter = null;
}

/**
 * Hitung satu permintaan impor. `null` = diizinkan; selain itu respons 429 `RATE_LIMITED`
 * (`retryAfterSec`, header `Retry-After`) yang langsung dikembalikan route.
 */
export function checkImportRate(caller: Pick<StudioCaller, "kind" | "username" | "email">, ctx: ReqCtx): Response | null {
  const key = createHash("sha256").update(`import\u0000${renderRateIdentity(caller)}`).digest("hex").slice(0, 32);
  const rl = importLimiter().hit(key);
  if (rl.allowed) return null;
  return reject(ctx, "RATE_LIMITED", "Too many markdown import requests; retry later", { retryAfterSec: rl.retryAfterSec }, {
    callerKind: caller.kind,
    retryAfterSec: rl.retryAfterSec,
    limiter: "import",
  });
}

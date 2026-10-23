/**
 * Pembatas laju endpoint pemicu render (FIX-1, S87 M-03).
 *
 * Satu limiter jendela tetap di memori proses untuk SEMUA route yang memicu
 * render atau perakitan berat: POST documents (R04), PATCH blok (R06),
 * POST revisions (R07), POST artifacts (R09), validate `?preview=html` (R08).
 * Kunci = identitas TERAUTENTIKASI pemanggil (bukan `agentId` badan yang dapat
 * diisi bebas, S87 L-02): username sesi HQ, email/sub Google, atau satu ember
 * bersama untuk pemegang `x-internal-secret`. Batas melewati ambang -> 429
 * `RATE_LIMITED` + `Retry-After` (lewat `reject`).
 *
 * Batas bawaan 30 render per 60 detik per pemanggil; dapat diubah lewat env
 * `STUDIO_RENDER_RATE_LIMIT` / `STUDIO_RENDER_RATE_WINDOW_MS` (dibaca sekali).
 * Antrean render berbatas (503 `RENDER_QUEUE_FULL`) ada di services/render.
 */
import { createHash } from "node:crypto";
import type { StudioCaller } from "@/lib/studio/contract/auth";
import type { ReqCtx } from "./context";
import { reject } from "./errors";
import { createFixedWindowLimiter, type FixedWindowLimiter } from "./rate-limit";

export const RENDER_RATE_LIMIT_DEFAULT = 30;
export const RENDER_RATE_WINDOW_MS_DEFAULT = 60_000;

function envInt(name: string, fallback: number, min: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min ? n : fallback;
}

let limiter: FixedWindowLimiter | null = null;

function renderLimiter(): FixedWindowLimiter {
  limiter ??= createFixedWindowLimiter({
    limit: envInt("STUDIO_RENDER_RATE_LIMIT", RENDER_RATE_LIMIT_DEFAULT, 1),
    windowMs: envInt("STUDIO_RENDER_RATE_WINDOW_MS", RENDER_RATE_WINDOW_MS_DEFAULT, 1000),
  });
  return limiter;
}

/** Hanya untuk uji: buat ulang limiter (membaca env lagi). */
export function resetRenderRateLimiter(): void {
  limiter = null;
}

/** Identitas laju pemanggil (tanpa medan yang dikirim klien bebas). */
export function renderRateIdentity(caller: Pick<StudioCaller, "kind" | "username" | "email">): string {
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

function rateKey(identity: string): string {
  return createHash("sha256").update(`render\u0000${identity}`).digest("hex").slice(0, 32);
}

/**
 * Hitung satu permintaan render. `null` = diizinkan; selain itu respons 429
 * `RATE_LIMITED` (berisi `retryAfterSec`, header `Retry-After`) yang langsung
 * dikembalikan route.
 */
export function checkRenderRate(caller: Pick<StudioCaller, "kind" | "username" | "email">, ctx: ReqCtx): Response | null {
  const rl = renderLimiter().hit(rateKey(renderRateIdentity(caller)));
  if (rl.allowed) return null;
  return reject(ctx, "RATE_LIMITED", "Too many render requests; retry later", { retryAfterSec: rl.retryAfterSec }, {
    callerKind: caller.kind,
    retryAfterSec: rl.retryAfterSec,
  });
}

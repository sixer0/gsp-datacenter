/*
 * Satu klien HTTP UI Studio (FIX-4a; UX-01 §6.2; menutup S86 R05 + R17).
 *
 * - `requestJson<T>(url, { source, ... })` — satu-satunya pembungkus `fetch`
 *   yang boleh dipakai modul fitur Studio (aturan §6.2; SR-56 memeriksanya).
 * - `StudioApiError` — satu kelas galat: `status`, `code`, `message`,
 *   `details`, `correlationId`, `url`, `method`, `retryAfterSec`, `retryable`.
 * - Setiap galat (kecuali batal/abort dan status yang dinyatakan `quiet`)
 *   dicatat ke `client-log` dengan `source = studio.ui.<modul>.<sumber>` dan
 *   correlationId server (header `x-correlation-id`).
 *
 * Bentuk galat route Studio: `{ error, code, details? }` (contract/errors.ts).
 * Middleware sesi menjawab 401 `{ error: "Unauthorized" }` tanpa `code`
 * (diverifikasi curl 2026-10-23 terhadap :9021) -> dipetakan `UNAUTHORIZED`.
 * Tidak ada URL absolut: semua path relatif origin HQ.
 */
import { reportClientError } from "./client-log";

/** Kode galat sisi klien (bukan dari server). */
export type StudioClientErrorCode = "NETWORK" | "BAD_RESPONSE" | "HTTP" | "UNAUTHORIZED" | "TIMEOUT";

/**
 * Kode dari server bertipe `string`: kontrak v2 (SR-04) menambah kode baru
 * (`DOCUMENT_INCOMPLETE`, `SCOPE_CONFLICT`, ...) yang belum ada di
 * `STUDIO_ERROR_CODES`; katalog teks ada di `error-messages.ts`.
 */
export type StudioErrorCodeLike = StudioClientErrorCode | (string & {});

export const SOURCE_PREFIX = "studio.ui.";

/** Paksa format `studio.ui.<modul>.<sumber>` (R17). */
export function studioSource(source: string): string {
  const s = source.trim();
  if (!s) return `${SOURCE_PREFIX}unknown`;
  if (s.startsWith(SOURCE_PREFIX)) return s;
  // Skema lama `studio-ui:<x>` dinormalkan juga.
  return SOURCE_PREFIX + s.replace(/^studio[-.]ui[:.]/, "");
}

export interface StudioApiErrorInit {
  status: number;
  code: StudioErrorCodeLike;
  message: string;
  details?: unknown;
  correlationId?: string | null;
  url: string;
  method: string;
  retryAfterSec?: number | null;
}

export class StudioApiError extends Error {
  readonly status: number;
  readonly code: StudioErrorCodeLike;
  /** `details` server apa adanya (larik isu validasi atau objek, mis. `{ completeness }`). */
  readonly details: unknown;
  readonly correlationId: string | null;
  /** Path tanpa query string (aman untuk log). */
  readonly url: string;
  readonly method: string;
  /** Dari header `Retry-After` atau `details.retryAfterSec` (429/503). */
  readonly retryAfterSec: number | null;

  constructor(i: StudioApiErrorInit) {
    super(i.message);
    this.name = "StudioApiError";
    this.status = i.status;
    this.code = i.code;
    this.details = i.details ?? null;
    this.correlationId = i.correlationId ?? null;
    this.url = i.url.split("?")[0];
    this.method = i.method;
    this.retryAfterSec = i.retryAfterSec ?? null;
  }

  /** Galat sementara yang layak dicoba ulang: jaringan, 5xx, 429. */
  get retryable(): boolean {
    return this.code === "NETWORK" || this.code === "TIMEOUT" || this.status === 429 || this.status >= 500;
  }
}

export function isStudioApiError(e: unknown): e is StudioApiError {
  return e instanceof StudioApiError;
}

/** Pembatalan (AbortController / navigasi) — bukan galat untuk pengguna. */
export function isAbortError(e: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" && e instanceof DOMException && e.name === "AbortError") ||
    (e instanceof Error && e.name === "AbortError")
  );
}

/** Isu validasi `{ path?, message, code? }` dari `details` larik (SCHEMA_INVALID dkk.). */
export interface StudioIssue {
  path?: string;
  message: string;
  code?: string;
  /** Kata kunci ajv / pemeriksa (`ValidationIssue.keyword`; FIX-4b). */
  keyword?: string;
  /** Id pemeriksaan by-construction (`ValidationIssue.checkId`; FIX-4b). */
  checkId?: string;
}

/**
 * Server memakai dua bentuk isu: `{ path, message, code? }` dan kontrak
 * `ValidationIssue` `{ pointer, keyword, message, checkId? }`. Keduanya dibaca
 * (FIX-4b, permintaan SR-31 D-198): `path` diisi dari `path` atau `pointer`.
 */
export function issuesOf(e: unknown): StudioIssue[] {
  const d = isStudioApiError(e) ? e.details : e;
  if (!Array.isArray(d)) return [];
  const out: StudioIssue[] = [];
  const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
  for (const it of d) {
    if (it && typeof it === "object" && typeof (it as { message?: unknown }).message === "string") {
      const o = it as Record<string, unknown>;
      out.push({
        message: o.message as string,
        path: str(o.path) ?? str(o.pointer),
        code: str(o.code),
        keyword: str(o.keyword),
        checkId: str(o.checkId),
      });
    }
  }
  return out;
}

/** Bangun URL relatif dengan query; nilai kosong/undefined dilewati. */
export function withQuery(base: string, q: Record<string, string | number | boolean | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  if (!qs) return base;
  return base + (base.includes("?") ? "&" : "?") + qs;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** `Retry-After`: detik atau tanggal HTTP; cadangan `details.retryAfterSec`. */
export function parseRetryAfter(header: string | null, details: unknown, now = Date.now()): number | null {
  if (header) {
    const n = Number(header.trim());
    if (Number.isFinite(n) && n >= 0) return Math.ceil(n);
    const t = Date.parse(header);
    if (Number.isFinite(t)) return Math.max(0, Math.ceil((t - now) / 1000));
  }
  if (isRecord(details) && typeof details.retryAfterSec === "number" && Number.isFinite(details.retryAfterSec)) {
    return Math.max(0, Math.ceil(details.retryAfterSec));
  }
  return null;
}

export interface RequestJsonInit extends Omit<RequestInit, "body"> {
  /** Sumber log `studio.ui.<modul>.<sumber>` (awalan ditambahkan bila kurang). Wajib. */
  source: string;
  /** Badan JSON (di-stringify, Content-Type JSON). */
  json?: unknown;
  /** Badan mentah (FormData, Blob, string). Abaikan bila `json` diisi. */
  body?: BodyInit | null;
  /** Status yang wajar bagi pemanggil (mis. 401 di `/api/auth/me`) -> tidak dicatat. */
  quietStatuses?: readonly number[];
  /** Konteks log tambahan (hanya primitif; disaring client-log). */
  logContext?: Record<string, unknown>;
}

function logError(source: string, err: StudioApiError, ctx?: Record<string, unknown>): void {
  reportClientError(source, err, { ...ctx, url: err.url, method: err.method }, {
    level: err.status >= 500 || err.status === 0 ? "error" : "warn",
    correlationId: err.correlationId,
  });
}

/**
 * fetch JSON dengan pemetaan galat kontrak. Melempar `StudioApiError` (atau
 * AbortError apa adanya). Respons 204/kosong yang sukses -> `null as T`.
 */
export async function requestJson<T>(url: string, init: RequestJsonInit): Promise<T> {
  const { source: rawSource, json, body, quietStatuses, logContext, headers, ...rest } = init;
  const source = studioSource(rawSource);
  const method = (rest.method ?? "GET").toUpperCase();
  const hasJson = json !== undefined;
  const finalBody: BodyInit | null | undefined = hasJson ? JSON.stringify(json) : body;

  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      ...rest,
      method,
      body: finalBody,
      headers: {
        // Kunci huruf kecil agar header pemanggil (dinormalkan Headers) menimpa, bukan menggandakan.
        accept: "application/json",
        ...(hasJson ? { "content-type": "application/json" } : {}),
        ...(headers ? Object.fromEntries(new Headers(headers).entries()) : {}),
      },
    });
  } catch (e) {
    if (isAbortError(e)) throw e;
    const err = new StudioApiError({ status: 0, code: "NETWORK", message: String(e instanceof Error ? e.message : e), url, method });
    logError(source, err, logContext);
    throw err;
  }

  const correlationId = res.headers.get("x-correlation-id");
  let text = "";
  try {
    text = await res.text();
  } catch (e) {
    if (isAbortError(e)) throw e;
    text = "";
  }
  let parsed: unknown = null;
  let parseFailed = false;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parseFailed = true;
    }
  }

  if (!res.ok) {
    const details = isRecord(parsed) ? parsed.details : undefined;
    const code =
      isRecord(parsed) && typeof parsed.code === "string"
        ? parsed.code
        : res.status === 401
          ? "UNAUTHORIZED"
          : "HTTP";
    const message = isRecord(parsed) && typeof parsed.error === "string" ? parsed.error : `HTTP ${res.status}`;
    const err = new StudioApiError({
      status: res.status,
      code,
      message,
      details,
      correlationId,
      url,
      method,
      retryAfterSec: parseRetryAfter(res.headers.get("retry-after"), details),
    });
    if (!quietStatuses?.includes(res.status)) logError(source, err, logContext);
    throw err;
  }

  if (parseFailed) {
    const err = new StudioApiError({ status: res.status, code: "BAD_RESPONSE", message: "non-JSON body", correlationId, url, method });
    logError(source, err, logContext);
    throw err;
  }
  return parsed as T;
}

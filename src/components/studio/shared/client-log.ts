/*
 * Pencatatan galat klien bersama UI Studio (IP-09, F-031).
 *
 * Setiap rekaman:
 *  1. selalu ditulis ke konsol peramban sebagai JSON berkolom tetap (cadangan);
 *  2. dikirim best-effort ke `POST /api/studio/client-log` dengan badan
 *     `{ level, message, route, correlationId, detail }` agar tersimpan tahan
 *     lama di samping log API Studio.
 *
 * Pengiriman tidak pernah melempar dan tidak pernah memanggil pencatat ini lagi
 * (tanpa loop): kegagalan kirim hanya menulis satu peringatan konsol. Endpoint
 * yang menjawab 404/405 (belum terpasang) menonaktifkan pengiriman untuk sisa
 * sesi halaman; 401/403 juga menghentikannya (tanpa sesi tidak ada yang bisa
 * disimpan). Laju dibatasi dan rekaman identik berturut-turut digabung.
 *
 * `detail` dibatasi: hanya nilai primitif konteks, string dipotong, kunci yang
 * tampak sensitif (token, secret, password, cookie, auth, key) dibuang, dan
 * ukuran total dibatasi. Badan permintaan, isi dokumen, dan nilai parameter
 * tidak pernah dikirim; rute dikirim tanpa query string.
 */

export const CLIENT_LOG_ENDPOINT = "/api/studio/client-log";

export type ClientLogLevel = "error" | "warn" | "info";

/** Medan galat API yang dibaca secara duck-typing dari kelas galat klien mana pun. */
interface ErrorFacts {
  status?: number;
  code?: string;
  correlationId?: string;
  endpoint?: string;
  method?: string;
}

export interface ClientErrorOptions {
  /** Bawaan "error". */
  level?: ClientLogLevel;
  /** Id korelasi server (header `x-correlation-id`) bila diketahui; bila tidak, dibuat di klien. */
  correlationId?: string | null;
}

const MESSAGE_MAX = 500;
const STRING_MAX = 200;
const STACK_MAX = 2000;
const CONTEXT_KEYS_MAX = 20;
const DETAIL_BYTES_MAX = 4000;
const SENSITIVE_KEY = /token|secret|passw|cookie|auth|session|api[-_]?key|credential/i;
/** Maks rekaman terkirim per jendela. */
const RATE_MAX = 20;
const RATE_WINDOW_MS = 60_000;
const DEDUPE_MS = 5_000;

let sendDisabled = false;
let sendWarned = false;
let windowStart = 0;
let windowCount = 0;
let lastKey = "";
let lastAt = 0;

/** Id korelasi klien (UUID bila tersedia). */
export function newCorrelationId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function clip(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function factsOf(err: unknown): ErrorFacts {
  if (!err || typeof err !== "object") return {};
  const o = err as Record<string, unknown>;
  const out: ErrorFacts = {};
  if (typeof o.status === "number") out.status = o.status;
  if (typeof o.code === "string") out.code = o.code;
  if (typeof o.correlationId === "string" && o.correlationId) out.correlationId = o.correlationId;
  const ep = typeof o.endpoint === "string" ? o.endpoint : typeof o.url === "string" ? o.url : undefined;
  if (ep) out.endpoint = ep.split("?")[0];
  if (typeof o.method === "string") out.method = o.method;
  return out;
}

/** Konteks -> hanya primitif, kunci sensitif dibuang, string dipotong, jumlah kunci dibatasi. */
export function sanitizeContext(ctx: Record<string, unknown> | undefined): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  if (!ctx) return out;
  let n = 0;
  for (const [k, v] of Object.entries(ctx)) {
    if (n >= CONTEXT_KEYS_MAX) break;
    if (SENSITIVE_KEY.test(k)) continue;
    if (v === null || v === undefined) out[k] = null;
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (typeof v === "string") out[k] = clip(k === "url" || k === "endpoint" ? v.split("?")[0] : v, STRING_MAX);
    else if (Array.isArray(v)) out[k] = `[array ${v.length}]`;
    else continue;
    n += 1;
  }
  return out;
}

function currentRoute(): string {
  try {
    return typeof window === "undefined" ? "" : window.location.pathname;
  } catch {
    return "";
  }
}

function boundedDetail(detail: Record<string, unknown>): Record<string, unknown> {
  let json = JSON.stringify(detail);
  if (json.length <= DETAIL_BYTES_MAX) return detail;
  const slim: Record<string, unknown> = { ...detail, stack: undefined };
  json = JSON.stringify(slim);
  if (json.length <= DETAIL_BYTES_MAX) return slim;
  return { source: detail.source, truncated: true };
}

function allowSend(key: string, now: number): boolean {
  if (sendDisabled) return false;
  if (key === lastKey && now - lastAt < DEDUPE_MS) return false;
  if (now - windowStart > RATE_WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  if (windowCount >= RATE_MAX) return false;
  windowCount += 1;
  lastKey = key;
  lastAt = now;
  return true;
}

function warnOnce(message: string): void {
  if (sendWarned) return;
  sendWarned = true;
  console.warn(`[studio-ui] client-log: ${message}; rekaman tetap di konsol.`);
}

/** Kirim best-effort; tidak pernah melempar, tidak pernah memanggil pencatat. */
function ship(body: { level: ClientLogLevel; message: string; route: string; correlationId: string; detail: Record<string, unknown> }): void {
  if (typeof window === "undefined" || typeof fetch !== "function") return;
  let payload: string;
  try {
    payload = JSON.stringify(body);
  } catch {
    return;
  }
  fetch(CLIENT_LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    keepalive: payload.length < 60_000,
    body: payload,
  }).then(
    (res) => {
      if (res.ok) return;
      if (res.status === 404 || res.status === 405 || res.status === 401 || res.status === 403) sendDisabled = true;
      warnOnce(`HTTP ${res.status}`);
    },
    () => warnOnce("server tidak dapat dihubungi"),
  );
}

/**
 * Catat galat klien: konsol (selalu) + `POST /api/studio/client-log` (best-effort).
 * Medan `status`, `code`, `correlationId`, `endpoint|url`, `method` dibaca dari
 * objek galat bila ada (StudioApiError dkk.).
 */
export function reportClientError(source: string, err: unknown, context?: Record<string, unknown>, opts: ClientErrorOptions = {}): void {
  try {
    const level = opts.level ?? "error";
    const facts = factsOf(err);
    const message = clip(err instanceof Error ? err.message : String(err), MESSAGE_MAX);
    const correlationId = opts.correlationId ?? facts.correlationId ?? newCorrelationId();
    const stack = err instanceof Error && err.stack && facts.status === undefined ? clip(err.stack, STACK_MAX) : null;
    const ctx = sanitizeContext(context);
    const record = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      stack_trace: stack,
      correlation_id: correlationId,
      context: { ...ctx, ...facts },
    };
    const line = JSON.stringify(record);
    if (level === "error") console.error("[studio-ui]", line);
    else console.warn("[studio-ui]", line);

    const now = Date.now();
    if (!allowSend(`${level}|${source}|${message}`, now)) return;
    ship({
      level,
      message,
      route: currentRoute(),
      correlationId,
      detail: boundedDetail({ source, timestamp: record.timestamp, ...facts, ...(stack ? { stack } : {}), context: ctx }),
    });
  } catch {
    /* pencatat tidak boleh menggagalkan pemanggil */
  }
}

/** Hanya untuk uji: atur ulang status pembatas dan penonaktifan. */
export function __resetClientLogState(): void {
  sendDisabled = false;
  sendWarned = false;
  windowStart = 0;
  windowCount = 0;
  lastKey = "";
  lastAt = 0;
}

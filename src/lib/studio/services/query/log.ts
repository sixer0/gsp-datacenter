/**
 * Log terstruktur tahan lama layanan retrieval (DC-14).
 *
 * Sink: JSONL harian `<STUDIO_WORKSPACE_ROOT>/logs/query/query-YYYY-MM-DD.jsonl`
 * lewat helper bersama `http/jsonl` (retensi + batas ukuran), ditambah console.
 * Log galat: tanpa isi kueri pengguna (`q` bisa memuat teks bebas): hanya nama filter
 * yang diisi, panjang `q`, kode galat, stack.
 *
 * Log baca (FIX-SEC M-1, D-402): `logQueryRead` mencatat setiap panggilan R21/R22 yang
 * sukses (level info, `message: "query read"`): route, jenis pemanggil, identitas aman-log
 * (email Google di-hash), agentId bila ada, nilai filter dan `q` DIPOTONG
 * (`READ_LOG_VALUE_MAX` karakter, karakter kontrol diganti), jumlah hasil, ada-tidaknya
 * halaman berikut, dan correlation id. Isi cuplikan/hasil tidak pernah dicatat.
 */
import { createHash, randomUUID } from "node:crypto";
import { appendJsonlDaily } from "../../http/jsonl";

export const QUERY_SOURCE = "studio.services.query";

export interface QueryLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  source: typeof QUERY_SOURCE;
  message: string;
  correlationId: string;
  code?: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
}

export type QueryLogSink = (e: QueryLogEntry) => void | Promise<void>;

async function fileSink(e: QueryLogEntry): Promise<void> {
  await appendJsonlDaily("query", "query", e);
}

let sink: QueryLogSink = fileSink;

/** Ganti sink (uji / sink DB); null = kembali ke sink berkas bawaan. */
export function setQueryLogSink(s: QueryLogSink | null): void {
  sink = s ?? fileSink;
}

export function newQueryCorrelationId(): string {
  return randomUUID();
}

/** Tulis log; kegagalan sink tidak pernah memutus layanan (dilaporkan ke console). */
export function queryLog(e: Omit<QueryLogEntry, "timestamp" | "source">): void {
  const entry: QueryLogEntry = { timestamp: new Date().toISOString(), source: QUERY_SOURCE, ...e };
  const line = JSON.stringify(entry);
  if (entry.level === "error") console.error(line);
  else if (entry.level === "warn") console.warn(line);
  else console.info(line);
  const failSink = (err: unknown) =>
    console.error(JSON.stringify({ source: QUERY_SOURCE, level: "error", message: "query log sink failed", detail: String(err) }));
  try {
    Promise.resolve(sink(entry)).catch(failSink);
  } catch (err) {
    failSink(err);
  }
}

/** Catat galat dengan kode (bila ada) dan stack. */
export function logQueryError(correlationId: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const code =
    err && typeof err === "object" && "code" in err && typeof (err as { code: unknown }).code === "string"
      ? (err as { code: string }).code
      : undefined;
  queryLog({
    level: "error",
    message: `${message}: ${err instanceof Error ? err.message : String(err)}`,
    correlationId,
    code,
    stack_trace: err instanceof Error ? err.stack : undefined,
    context,
  });
}

/** Ringkasan filter aman-log: nama medan yang diisi saja (tanpa nilai). */
export function filterShape(f: object): string[] {
  return Object.entries(f)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k)
    .sort();
}

/** Panjang maksimum tiap nilai filter / `q` pada log baca. */
export const READ_LOG_VALUE_MAX = 64;
/** Butir daftar maksimum (status/type) pada log baca. */
const READ_LOG_LIST_MAX = 8;

/** Potong aman-log: karakter kontrol -> `?`, maks {@link READ_LOG_VALUE_MAX} karakter (+ `…`). */
export function truncateForLog(v: string): string {
  const clean = v.replace(/[\u0000-\u001f\u007f]/g, "?");
  return clean.length > READ_LOG_VALUE_MAX ? `${clean.slice(0, READ_LOG_VALUE_MAX)}…` : clean;
}

/** Nilai filter aman-log: string dipotong, daftar dibatasi, angka/boolean apa adanya. */
export function filterValuesForLog(f: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined) continue;
    if (typeof v === "string") out[k] = truncateForLog(v);
    else if (Array.isArray(v)) out[k] = v.slice(0, READ_LOG_LIST_MAX).map((x) => (typeof x === "string" ? truncateForLog(x) : x));
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  return out;
}

/** Pemanggil untuk log baca (subset `StudioCaller`). */
export interface QueryReadCaller {
  kind: string;
  requester: string;
  agentId?: string;
}

/** Identitas aman-log: `requester`, kecuali sesi Google (email = PII) -> `google:sha256:<12 hex>`. */
export function readLogIdentity(caller: QueryReadCaller): string {
  if (caller.kind === "GOOGLE_SESSION") return `google:sha256:${createHash("sha256").update(caller.requester).digest("hex").slice(0, 12)}`;
  return truncateForLog(caller.requester);
}

/**
 * Log baca R21/R22 sukses (M-1). `filter` = filter tervalidasi (untuk R22 memuat `q`);
 * `resultCount` = jumlah kontrak/hit pada halaman ini.
 */
export function logQueryRead(input: {
  correlationId: string;
  route: string;
  caller: QueryReadCaller;
  filter: object;
  resultCount: number;
  hasNextCursor: boolean;
}): void {
  const { q, ...rest } = input.filter as { q?: unknown } & Record<string, unknown>;
  queryLog({
    level: "info",
    message: "query read",
    correlationId: input.correlationId,
    code: "QUERY_READ",
    context: {
      route: input.route,
      callerKind: input.caller.kind,
      identity: readLogIdentity(input.caller),
      ...(input.caller.agentId ? { agentId: truncateForLog(input.caller.agentId) } : {}),
      filters: filterValuesForLog(rest),
      ...(typeof q === "string" ? { q: truncateForLog(q), qLength: q.length } : {}),
      includeArchived: rest.includeArchived === true,
      resultCount: input.resultCount,
      hasNextCursor: input.hasNextCursor,
    },
  });
}

/**
 * Log terstruktur tahan lama layanan retrieval (DC-14).
 *
 * Sink: JSONL harian `<STUDIO_WORKSPACE_ROOT>/logs/query/query-YYYY-MM-DD.jsonl`
 * lewat helper bersama `http/jsonl` (retensi + batas ukuran), ditambah console.
 * Tanpa isi kueri pengguna (`q` bisa memuat teks bebas): hanya nama filter yang
 * diisi, panjang `q`, kode galat, stack.
 */
import { randomUUID } from "node:crypto";
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

/**
 * Log terstruktur layanan soffice (S92).
 *
 * Sink default tahan-restart: JSONL harian di
 * `<STUDIO_WORKSPACE_ROOT>/logs/soffice/soffice-YYYY-MM-DD.jsonl` (rotasi per
 * hari) + `console` untuk dev. FIX-SEC N-05 (SR-57, D-247): berkas ditulis
 * lewat sink bersama `appendJsonlDaily`, sehingga ikut retensi
 * `STUDIO_LOG_RETENTION_DAYS` (bawaan 90 hari) dan batas ukuran
 * `STUDIO_LOG_MAX_FILE_BYTES` (bawaan 50 MiB per berkas, bagian `.n` per hari).
 * Pemanggil (S51) boleh mengganti sink lewat `setSofficeLogSink` (mis. menulis
 * ke DB). Tanpa isi dokumen/PII: hanya jobId, kode, durasi, ekor stderr soffice.
 */
import { appendJsonlDaily } from "../../http/jsonl";

export interface SofficeLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  source: "studio.engine.soffice";
  message: string;
  /** Kode galat Studio atau penanda peristiwa. */
  code?: string;
  /** Korelasi = jobId render. */
  correlationId?: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
}

export type SofficeLogSink = (e: SofficeLogEntry) => void | Promise<void>;

async function fileSink(e: SofficeLogEntry): Promise<void> {
  await appendJsonlDaily("soffice", "soffice", e);
}

let sink: SofficeLogSink = fileSink;

/** Ganti sink log (null = kembali ke sink berkas default). */
export function setSofficeLogSink(s: SofficeLogSink | null): void {
  sink = s ?? fileSink;
}

/** Tulis log; kegagalan sink tidak pernah memutus konversi (dilaporkan ke console). */
export function sofficeLog(e: Omit<SofficeLogEntry, "timestamp" | "source">): void {
  const entry: SofficeLogEntry = { timestamp: new Date().toISOString(), source: "studio.engine.soffice", ...e };
  const line = JSON.stringify(entry);
  if (entry.level === "error") console.error(line);
  else if (entry.level === "warn") console.warn(line);
  else console.info(line);
  try {
    Promise.resolve(sink(entry)).catch((err: unknown) => {
      console.error(JSON.stringify({ source: entry.source, level: "error", message: "soffice log sink failed", detail: String(err) }));
    });
  } catch (err) {
    console.error(JSON.stringify({ source: entry.source, level: "error", message: "soffice log sink failed", detail: String(err) }));
  }
}

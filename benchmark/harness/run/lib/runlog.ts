/**
 * Log tahan lama runner benchmark (S97): baris JSON ke `<out>/run_log.jsonl`.
 *
 * Medan minimum: timestamp, level, source, message, stack_trace, context,
 * correlationId (satu per run). Sebelum direktori keluaran ada (mode
 * `--dry-run` atau galat muat masukan) entri ditahan di memori dan ditulis ke
 * stderr; `attach()` membuang antrean ke berkas begitu direktori dibuat.
 */
import { appendFileSync } from "node:fs";
import path from "node:path";

export type RunLogLevel = "info" | "warn" | "error";

export interface RunLogEntry {
  timestamp: string;
  level: RunLogLevel;
  source: string;
  message: string;
  code?: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
  correlationId: string;
}

export class RunLog {
  readonly correlationId: string;
  private file: string | null = null;
  private readonly pending: RunLogEntry[] = [];
  private readonly counts: Record<RunLogLevel, number> = { info: 0, warn: 0, error: 0 };

  constructor(correlationId: string) {
    this.correlationId = correlationId;
  }

  /** Mulai menulis ke `<dir>/run_log.jsonl`; antrean sebelumnya ditulis lebih dulu. */
  attach(dir: string): string {
    this.file = path.join(dir, "run_log.jsonl");
    const queued = this.pending.splice(0, this.pending.length);
    for (const e of queued) this.write(e);
    return this.file;
  }

  get path(): string | null {
    return this.file;
  }

  levelCounts(): Readonly<Record<RunLogLevel, number>> {
    return { ...this.counts };
  }

  log(level: RunLogLevel, source: string, message: string, extra: { code?: string; err?: unknown; context?: Record<string, unknown> } = {}): void {
    const e: RunLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      correlationId: this.correlationId,
    };
    if (extra.code) e.code = extra.code;
    if (extra.err instanceof Error && extra.err.stack) e.stack_trace = extra.err.stack;
    if (extra.context) e.context = extra.context;
    this.counts[level]++;
    if (level !== "info") process.stderr.write(`[${level}] ${source}: ${message}\n`);
    if (this.file) this.write(e);
    else this.pending.push(e);
  }

  /** Sink generik untuk log modul mesin/layanan (entri apa pun yang dapat di-JSON-kan). */
  sink(source: string): (e: unknown) => void {
    return (e: unknown) => {
      const r = (typeof e === "object" && e !== null ? e : { message: String(e) }) as Record<string, unknown>;
      const lvl = r.level === "error" || r.level === "warn" ? r.level : "info";
      const message = typeof r.message === "string" ? r.message : JSON.stringify(r);
      const { level: _l, message: _m, ...rest } = r;
      void _l;
      void _m;
      this.log(lvl, typeof r.source === "string" ? r.source : source, message, {
        code: typeof r.code === "string" ? r.code : undefined,
        context: rest,
      });
    };
  }

  private write(e: RunLogEntry): void {
    if (!this.file) return;
    try {
      appendFileSync(this.file, `${JSON.stringify(e)}\n`, "utf8");
    } catch (err) {
      process.stderr.write(`run_log: tidak dapat menulis ${this.file}: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }
}

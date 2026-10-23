/**
 * Utilitas bersama harness paritas S67 (H01 render_cli, H05 run_parity):
 * pengurai argumen ketat, log galat JSONL tahan lama, sha256, akar repo.
 *
 * Tanpa DB: modul ini dan pemakainya tidak pernah membuat kueri Prisma.
 */
import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export class UsageError extends Error {
  readonly code: string;
  constructor(message: string, code = "USAGE") {
    super(message);
    this.name = "UsageError";
    this.code = code;
  }
}

export interface ArgSpec {
  /** Opsi bernilai (`--key value` atau `--key=value`). */
  values: readonly string[];
  /** Opsi bendera tanpa nilai. */
  flags: readonly string[];
  /** Opsi bernilai yang boleh berulang. */
  repeat?: readonly string[];
}

export interface ParsedArgs {
  values: Map<string, string>;
  repeated: Map<string, string[]>;
  flags: Set<string>;
}

/** Urai argv; opsi asing, nilai hilang, atau argumen posisional = UsageError (exit 2). */
export function parseArgs(argv: readonly string[], spec: ArgSpec): ParsedArgs {
  const out: ParsedArgs = { values: new Map(), repeated: new Map(), flags: new Set() };
  const repeat = new Set(spec.repeat ?? []);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new UsageError(`argumen posisional tidak dikenal: ${a}`);
    const eq = a.indexOf("=");
    const key = eq > 0 ? a.slice(2, eq) : a.slice(2);
    if (spec.flags.includes(key)) {
      if (eq > 0) throw new UsageError(`--${key} tidak menerima nilai`);
      out.flags.add(key);
      continue;
    }
    if (!spec.values.includes(key) && !repeat.has(key)) throw new UsageError(`opsi tidak dikenal: --${key}`);
    let val: string | undefined;
    if (eq > 0) val = a.slice(eq + 1);
    else {
      val = argv[i + 1];
      if (val === undefined || val.startsWith("--")) throw new UsageError(`--${key} membutuhkan nilai`);
      i++;
    }
    if (val === "") throw new UsageError(`--${key} tidak boleh kosong`);
    if (repeat.has(key)) out.repeated.set(key, [...(out.repeated.get(key) ?? []), val]);
    else {
      if (out.values.has(key)) throw new UsageError(`--${key} diberikan lebih dari sekali`);
      out.values.set(key, val);
    }
  }
  return out;
}

export function sha256Hex(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function newCorrelationId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

/** Akar repo: naik dari skrip yang dijalankan sampai `package.json` + `src/lib/studio`; cadangan cwd. */
export function findRepoRoot(start?: string): string {
  const seeds = [start, process.argv[1] ? path.dirname(path.resolve(process.argv[1])) : undefined, process.cwd()];
  for (const s of seeds) {
    if (!s) continue;
    let dir = path.resolve(s);
    for (;;) {
      if (existsSync(path.join(dir, "package.json")) && existsSync(path.join(dir, "src", "lib", "studio"))) return dir;
      const up = path.dirname(dir);
      if (up === dir) break;
      dir = up;
    }
  }
  return process.cwd();
}

export function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function errCode(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "code" in err && typeof (err as { code: unknown }).code === "string") {
    return (err as { code: string }).code;
  }
  return fallback;
}

export interface HarnessLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
  correlationId: string;
}

/**
 * Log JSONL tahan lama (satu baris JSON per kejadian) di samping keluaran.
 * Galat penulisan log tidak pernah menggagalkan render; dilaporkan ke stderr.
 */
export class HarnessLog {
  readonly file: string;
  readonly correlationId: string;
  private readonly source: string;

  constructor(file: string, source: string, correlationId: string) {
    this.file = file;
    this.source = source;
    this.correlationId = correlationId;
    try {
      mkdirSync(path.dirname(file), { recursive: true });
    } catch (err) {
      process.stderr.write(`${JSON.stringify({ level: "error", source, message: "log directory unavailable", detail: errMessage(err) })}\n`);
    }
  }

  write(level: HarnessLogEntry["level"], message: string, extra: { err?: unknown; context?: Record<string, unknown>; source?: string } = {}): void {
    const entry: HarnessLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source: extra.source ?? this.source,
      message,
      ...(extra.err instanceof Error && extra.err.stack ? { stack_trace: extra.err.stack } : {}),
      ...(extra.context ? { context: extra.context } : {}),
      correlationId: this.correlationId,
    };
    try {
      appendFileSync(this.file, `${JSON.stringify(entry)}\n`, "utf8");
    } catch (err) {
      process.stderr.write(`${JSON.stringify({ ...entry, logWriteError: errMessage(err) })}\n`);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write("info", message, { context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write("warn", message, { context });
  }

  error(message: string, err?: unknown, context?: Record<string, unknown>): void {
    this.write("error", message, { err, context: { ...(context ?? {}), ...(err !== undefined ? { error: errMessage(err) } : {}) } });
  }
}

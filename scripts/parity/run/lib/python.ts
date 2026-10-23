/**
 * Pemanggil proses Python acuan/pembanding (S64 ref_doc, S65 ref_fig, S66 compare).
 *
 * - Interpreter VENV dengan `-I -B` (isolasi, tanpa .pyc di folder skill).
 * - spawn argumen-array, `shell: false`, `windowsHide: true` (tanpa shell).
 * - cwd pendek di luar folder skill (batas path Windows); semua path absolut.
 * - Batas waktu: tree-kill (`taskkill /PID <pid> /T /F` di Windows).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const DEFAULT_PYTHON = "C:\\Users\\TRIAL\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\python.exe";
const TAIL_BYTES = 8192;

export interface PyResult {
  exitCode: number | null;
  timedOut: boolean;
  /** Galat spawn (mis. ENOENT interpreter). */
  spawnError?: string;
  stdoutTail: string;
  stderrTail: string;
  durationMs: number;
}

export function pythonPath(override?: string): string {
  return override ?? process.env.PARITY_PYTHON ?? DEFAULT_PYTHON;
}

/** cwd pendek: direktori temp OS (di luar repo dan folder skill). */
export function shortCwd(): string {
  const t = os.tmpdir();
  return existsSync(t) ? t : path.parse(process.cwd()).root;
}

function treeKill(pid: number | undefined): void {
  if (!pid) return;
  if (process.platform === "win32") {
    const k = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, shell: false, stdio: "ignore" });
    k.on("error", () => undefined);
  } else {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // proses sudah selesai
    }
  }
}

function tail(buf: string, chunk: Buffer): string {
  const s = buf + chunk.toString("utf8");
  return s.length > TAIL_BYTES ? s.slice(s.length - TAIL_BYTES) : s;
}

export function runPython(python: string, script: string, args: readonly string[], timeoutMs: number): Promise<PyResult> {
  const t0 = Date.now();
  return new Promise((resolve) => {
    let stdoutTail = "";
    let stderrTail = "";
    let timedOut = false;
    let settled = false;
    const done = (r: Omit<PyResult, "stdoutTail" | "stderrTail" | "durationMs">): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ...r, stdoutTail, stderrTail, durationMs: Date.now() - t0 });
    };
    const child = spawn(python, ["-I", "-B", script, ...args], {
      cwd: shortCwd(),
      shell: false,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const timer = setTimeout(() => {
      timedOut = true;
      treeKill(child.pid);
    }, timeoutMs);
    child.stdout?.on("data", (c: Buffer) => {
      stdoutTail = tail(stdoutTail, c);
    });
    child.stderr?.on("data", (c: Buffer) => {
      stderrTail = tail(stderrTail, c);
    });
    child.on("error", (err) => done({ exitCode: null, timedOut, spawnError: err.message }));
    child.on("close", (code) => done({ exitCode: code, timedOut }));
  });
}

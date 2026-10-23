/**
 * Eksekusi proses anak berbatas waktu untuk layanan soffice (S92, 01_specs.md §8.4).
 *
 * Pola `hermes-bridge/bridge.mjs:60-98`: spawn manual (tanpa shell, argumen
 * array), batas waktu keras, dan tree-kill `taskkill /PID <pid> /T /F` karena
 * timeout `execFile` tidak selalu mematikan pohon proses di Windows
 * (soffice.com -> soffice.bin). Keluaran dibatasi (ekor 2 KB stderr).
 * `taskkill.exe` dipanggil dengan path absolut `%SystemRoot%\System32` (L-03),
 * tidak pernah lewat PATH/direktori kerja.
 */
import { execFile, spawn } from "node:child_process";
import { taskkillExePath } from "./readiness-rules.mjs";

/** Ekor stderr/stdout yang disimpan (§8.4: "2 KB stderr terakhir"). */
export const PROCESS_TAIL_BYTES = 2048;

export interface ProcessResult {
  /** Kode keluar; null bila proses dimatikan sinyal / timeout. */
  code: number | null;
  timedOut: boolean;
  durationMs: number;
  stdoutTail: string;
  stderrTail: string;
  /** Galat spawn (biner tidak ada, akses ditolak). */
  spawnError: Error | null;
}

function appendTail(prev: string, chunk: Buffer | string, max: number): string {
  const next = prev + (typeof chunk === "string" ? chunk : chunk.toString("utf8"));
  return next.length > max ? next.slice(next.length - max) : next;
}

/** Matikan pohon proses. Windows: `%SystemRoot%\System32\taskkill.exe /T /F` (tanpa shell); lainnya: SIGKILL. */
export function killTree(pid: number | undefined): Promise<void> {
  return new Promise((resolve) => {
    if (pid === undefined) return resolve();
    if (process.platform === "win32") {
      execFile(taskkillExePath(), ["/PID", String(pid), "/T", "/F"], { windowsHide: true, shell: false }, () => resolve());
      return;
    }
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      /* sudah mati */
    }
    resolve();
  });
}

/**
 * Jalankan `exe` dengan argumen array (tanpa shell, tanpa interpolasi). Tidak
 * pernah melempar: hasil selalu dikembalikan dalam waktu `timeoutMs` (+ tunggu
 * singkat setelah tree-kill agar berkas terkunci terlepas).
 */
export function runBounded(
  exe: string,
  args: readonly string[],
  opts: { timeoutMs: number; cwd?: string; /** Batas ekor per aliran (default 2 KB). */ tailBytes?: number },
): Promise<ProcessResult> {
  const started = Date.now();
  const tailMax = opts.tailBytes ?? PROCESS_TAIL_BYTES;
  return new Promise((resolve) => {
    let stdoutTail = "";
    let stderrTail = "";
    let settled = false;
    let timedOut = false;

    const finish = (code: number | null, spawnError: Error | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(graceTimer);
      resolve({ code, timedOut, durationMs: Date.now() - started, stdoutTail, stderrTail, spawnError });
    };

    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(exe, [...args], {
        shell: false,
        windowsHide: true,
        cwd: opts.cwd,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      resolve({ code: null, timedOut: false, durationMs: Date.now() - started, stdoutTail, stderrTail, spawnError: err });
      return;
    }

    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      if (settled) return;
      timedOut = true;
      void killTree(child.pid).then(() => {
        // Beri waktu proses benar-benar keluar (pipe ditutup); bila tidak, selesaikan juga.
        graceTimer = setTimeout(() => finish(null, null), 5000);
      });
    }, opts.timeoutMs);

    child.stdout?.on("data", (d: Buffer) => {
      stdoutTail = appendTail(stdoutTail, d, tailMax);
    });
    child.stderr?.on("data", (d: Buffer) => {
      stderrTail = appendTail(stderrTail, d, tailMax);
    });
    // Galat pipe (mis. ENOTCONN saat spawn gagal) tidak boleh menjadi 'error' tak tertangani.
    child.stdout?.on("error", () => {});
    child.stderr?.on("error", () => {});
    child.on("error", (e) => finish(null, e));
    child.on("close", (code) => finish(timedOut ? null : code, null));
  });
}

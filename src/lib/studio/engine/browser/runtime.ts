/**
 * Runtime Chromium tunggal untuk Studio (S25, I14, 01_specs.md §7.1 C03/C07, §8.2).
 *
 * Aturan sandbox (dipusatkan di sini, tidak bisa dimatikan pemanggil):
 * - executablePath eksplisit dari `getStudioEnv().chromiumPath` (C03); playwright-core
 *   tidak pernah mengunduh browser.
 * - Satu instans browser per proses (disimpan di globalThis agar selamat dari HMR
 *   dev), semafor 1: operasi halaman berjalan berurutan.
 * - Setiap operasi mendapat BrowserContext baru: `javaScriptEnabled:false`,
 *   `offline:true`, service worker diblokir, unduhan ditolak, dan rute `**\/*`
 *   di-abort. Konten masuk hanya lewat `page.setContent` (tanpa goto/file://,
 *   research/03 §4.4). URL `data:` tidak melewati jaringan sehingga tetap jalan.
 * - Batas waktu per operasi (C07); saat lewat, context ditutup paksa dan
 *   `StudioEngineError("RENDER_TIMEOUT")` dilempar.
 * - Sandbox OS Chromium WAJIB (FIX-8, M-01): `chromiumSandbox: true` sehingga
 *   playwright-core tidak menambah `--no-sandbox`; argumen yang mematikan
 *   sandbox ditolak; sebelum instans render diluncurkan, instans probe berumur
 *   pendek dengan opsi identik membuka `chrome://sandbox` (tanpa konten
 *   pengguna) dan setiap proses Renderer harus berjalan pada tingkat Lockdown. Sandbox gagal = `BROWSER_UNAVAILABLE`
 *   (reason `SANDBOX_UNAVAILABLE`), tidak pernah jatuh diam-diam ke tanpa sandbox.
 * - Pesan galat yang bisa sampai ke klien tidak memuat pesan mentah Playwright
 *   (bisa berisi path server, D-94/L13); rincian hanya ke log.
 */
import type { Browser, BrowserContext, Page } from "playwright-core";
import type { RenderLogEntry } from "../../contract/engine";
import { getStudioEnv, STUDIO_CHROMIUM_TIMEOUT_MS } from "../../contract/env";
import type { StudioErrorCode } from "../../contract/enums";
import { StudioEngineError } from "../../contract/errors";

export type BrowserFailureReason = "LAUNCH_FAILED" | "SANDBOX_UNAVAILABLE" | "INPUT_INVALID" | "RENDER_FAILED";

/**
 * Kode kontrak per alasan (IP-05, delta S03-d1, D-38): kegagalan peluncuran
 * maupun operasi Chromium = `BROWSER_UNAVAILABLE` (503); masukan yang tidak
 * bisa dirender (bukan SVG, ukuran di luar batas) adalah galat konstruksi
 * pemanggil = `BY_CONSTRUCTION_FAILED` (422). Timeout tetap
 * `StudioEngineError("RENDER_TIMEOUT")` (504).
 */
const REASON_CODE: Readonly<Record<BrowserFailureReason, StudioErrorCode>> = {
  LAUNCH_FAILED: "BROWSER_UNAVAILABLE",
  SANDBOX_UNAVAILABLE: "BROWSER_UNAVAILABLE",
  RENDER_FAILED: "BROWSER_UNAVAILABLE",
  INPUT_INVALID: "BY_CONSTRUCTION_FAILED",
};

/**
 * Galat layanan browser selain timeout. Subkelas `StudioEngineError` sehingga
 * pemanggil (`errorCodeOf`, `studioErrorFrom`) membaca kode kontrak di batas
 * modul; `reason` dan `op` tetap tersedia untuk log. `details` hanya memuat
 * reason dan op (tanpa isi masukan).
 */
export class StudioBrowserError extends StudioEngineError {
  readonly reason: BrowserFailureReason;
  readonly op: string;

  constructor(reason: BrowserFailureReason, op: string, message: string, options?: { cause?: unknown }) {
    super(REASON_CODE[reason], message, { reason, op });
    this.name = "StudioBrowserError";
    this.reason = reason;
    this.op = op;
    if (options && "cause" in options) (this as { cause?: unknown }).cause = options.cause;
  }
}

/** Sink log terstruktur; S51 memasang sink yang menulis ke log job (durable). */
export type BrowserLogSink = (e: RenderLogEntry & { source: "engine/browser"; op?: string; durationMs?: number }) => void;

interface BrowserState {
  browser: Browser | null;
  launching: Promise<Browser> | null;
  /** Ekor antrean semafor 1. */
  tail: Promise<void>;
  queued: number;
  sink: BrowserLogSink | null;
}

const STATE_KEY = "__studioBrowserStateS25";

function state(): BrowserState {
  const g = globalThis as unknown as Record<string, BrowserState | undefined>;
  let s = g[STATE_KEY];
  if (!s) {
    s = { browser: null, launching: null, tail: Promise.resolve(), queued: 0, sink: null };
    g[STATE_KEY] = s;
  }
  return s;
}

export function setBrowserLogSink(sink: BrowserLogSink | null): void {
  state().sink = sink;
}

export function logBrowser(level: RenderLogEntry["level"], message: string, extra?: { op?: string; durationMs?: number; code?: string }): void {
  const entry = { source: "engine/browser" as const, level, message, at: new Date().toISOString(), ...extra };
  const sink = state().sink;
  if (sink) {
    try {
      sink(entry);
      return;
    } catch {
      // Sink pemanggil gagal: jatuh ke stderr agar entri tidak hilang.
    }
  }
  // Tanpa sink: hanya warn/error, satu baris JSON di stderr (ditangkap log layanan).
  if (level !== "info") console.error(JSON.stringify(entry));
}

/**
 * Argumen peluncuran: tanpa ekstensi, tanpa jaringan latar, warna sRGB stabil,
 * rasterisasi deterministik (D-259, SR-49 N4): rasterisasi GPU menghasilkan piksel
 * antialias berbeda tiap tangkapan (PNG beda beberapa byte dari SVG identik), dan
 * raster perangkat lunak berutas banyak berbeda antara tangkapan pertama dan
 * berikutnya. `--disable-gpu` + `--num-raster-threads=1` = satu jalur raster Skia
 * perangkat lunak berutas tunggal: SVG sama -> PNG sama byte, juga antar proses.
 * Kedua flag tidak menyentuh sandbox (lihat `assertSandboxedArgs`).
 */
const LAUNCH_ARGS: readonly string[] = [
  "--force-color-profile=srgb",
  "--font-render-hinting=none",
  "--disable-gpu",
  "--num-raster-threads=1",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-sync",
  "--no-first-run",
  "--mute-audio",
];

/** Argumen yang mematikan/melemahkan sandbox: tidak pernah boleh dikirim (M-01). */
const SANDBOX_BYPASS_ARGS: readonly string[] = [
  "--no-sandbox",
  "--disable-gpu-sandbox",
  "--disable-setuid-sandbox",
  "--no-zygote",
  "--single-process",
];

/** Lempar bila daftar argumen memuat flag pematian sandbox (penjaga terhadap suntingan di masa depan). */
export function assertSandboxedArgs(args: readonly string[]): void {
  const bad = args.filter((a) => {
    const flag = a.trim().toLowerCase();
    if (SANDBOX_BYPASS_ARGS.some((b) => flag === b || flag.startsWith(`${b}=`))) return true;
    // --disable-features=...,RendererSandbox... / --disable-features=WinSbox...
    return flag.startsWith("--disable-features=") && /sandbox|winsbox/.test(flag);
  });
  if (bad.length > 0) {
    throw new StudioBrowserError("SANDBOX_UNAVAILABLE", "launch", `Chromium launch arguments disable the sandbox: ${bad.join(" ")}`);
  }
}

/** Baris tabel `chrome://sandbox` (Windows): [Process, Type, Name, Sandbox, Lockdown, ...]. */
export type SandboxStatusRow = readonly string[];

/**
 * Nilai tabel status sandbox Windows. Sah bila ada >= 1 proses Renderer dan
 * SEMUA Renderer bersandbox (kolom Sandbox bukan "Not Sandboxed") pada tingkat
 * Lockdown. Mengembalikan alasan galat, atau null bila sah.
 */
export function judgeSandboxRows(rows: readonly SandboxStatusRow[]): string | null {
  if (rows.length < 2) return "chrome://sandbox returned no process table";
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const iType = head.indexOf("type");
  const iSandbox = head.indexOf("sandbox");
  const iLockdown = head.indexOf("lockdown");
  if (iType < 0 || iSandbox < 0 || iLockdown < 0) return "chrome://sandbox table has an unexpected layout";
  const cell = (r: SandboxStatusRow, i: number) => (r[i] ?? "").trim();
  const renderers = rows.slice(1).filter((r) => cell(r, iType).toLowerCase() === "renderer");
  if (renderers.length === 0) return "no renderer process listed by chrome://sandbox";
  const weak = renderers.filter((r) => cell(r, iSandbox).toLowerCase() === "not sandboxed" || cell(r, iLockdown).toLowerCase() !== "lockdown");
  if (weak.length > 0) return `renderer not sandboxed: ${weak.map((r) => `${cell(r, iSandbox) || "?"}/${cell(r, iLockdown) || "?"}`).join(", ")}`;
  return null;
}

const SANDBOX_PROBE_TIMEOUT_MS = 15000;

/**
 * Periksa sandbox instans probe (bukan instans render, lihat `launch`). JS
 * diaktifkan HANYA di context ini karena halaman WebUI `chrome://sandbox` butuh
 * skrip internalnya; tidak ada konten pengguna, jaringan tetap offline dan semua
 * rute http(s) di-abort.
 */
export async function verifySandbox(browser: Browser): Promise<void> {
  const op = "sandbox-check";
  let ctx: BrowserContext | null = null;
  let verdict: string | null;
  try {
    ctx = await browser.newContext({ javaScriptEnabled: true, offline: true, serviceWorkers: "block", acceptDownloads: false });
    await ctx.route("**/*", (route) => route.abort("blockedbyclient"));
    const page = await ctx.newPage();
    await page.goto("chrome://sandbox", { timeout: SANDBOX_PROBE_TIMEOUT_MS });
    if (process.platform === "win32") {
      const handle = await page.waitForFunction(
        () => {
          const rows = Array.from(document.querySelectorAll("tr")).map((tr) =>
            Array.from(tr.querySelectorAll("td,th")).map((c) => (c as HTMLElement).innerText),
          );
          return rows.length > 1 && rows.slice(1).some((r) => r.some((c) => c.trim() === "Renderer")) ? rows : null;
        },
        undefined,
        { timeout: SANDBOX_PROBE_TIMEOUT_MS },
      );
      const rows = (await handle.jsonValue()) as string[][];
      verdict = judgeSandboxRows(rows);
      if (verdict === null) {
        const summary = rows.slice(1).map((r) => `${(r[1] ?? "").trim()}:${(r[3] ?? "").trim()}/${(r[4] ?? "").trim()}`).join(" ");
        logBrowser("info", `Chromium sandbox verified (${summary})`, { op });
      }
    } else {
      // Linux/macOS: halaman status menyatakan "adequately sandboxed" bila lapisan sandbox lengkap.
      const text = await page.innerText("body", { timeout: SANDBOX_PROBE_TIMEOUT_MS });
      verdict = /adequately sandboxed/i.test(text) ? null : "chrome://sandbox does not report an adequate sandbox";
    }
  } catch (e) {
    verdict = `sandbox status could not be read: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    if (ctx) await ctx.close().catch(() => undefined);
  }
  if (verdict !== null) {
    logBrowser("error", `Chromium sandbox check failed: ${verdict}`, { op, code: "BROWSER_UNAVAILABLE" });
    throw new StudioBrowserError("SANDBOX_UNAVAILABLE", op, "Chromium OS sandbox is not active; rendering refused (see engine/browser log)");
  }
}

async function launch(): Promise<Browser> {
  const { chromiumPath } = getStudioEnv();
  const fs = await import("node:fs");
  if (!fs.existsSync(chromiumPath)) {
    // Path server hanya ke log; pesan galat (bisa sampai ke respons 503) generik.
    logBrowser("error", `Chromium executable not found at STUDIO_CHROMIUM_PATH (${chromiumPath})`, { op: "launch", code: "BROWSER_UNAVAILABLE" });
    throw new StudioBrowserError("LAUNCH_FAILED", "launch", "Chromium executable not found (check STUDIO_CHROMIUM_PATH)");
  }
  const started = Date.now();
  const args = [...LAUNCH_ARGS];
  assertSandboxedArgs(args);
  const { chromium } = await import("playwright-core");
  const launchSandboxed = async (purpose: "probe" | "render"): Promise<Browser> => {
    try {
      return await chromium.launch({
        executablePath: chromiumPath,
        headless: true,
        timeout: STUDIO_CHROMIUM_TIMEOUT_MS,
        // M-01: tanpa ini playwright-core menambah `--no-sandbox`. Default arg itu
        // juga ditolak eksplisit sebagai sabuk pengaman bila perilakunya berubah.
        chromiumSandbox: true,
        ignoreDefaultArgs: ["--no-sandbox"],
        args,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logBrowser("error", `Chromium launch (${purpose}) failed: ${msg}`, { op: "launch", durationMs: Date.now() - started });
      // Peluncuran bersandbox gagal (mis. host tanpa dukungan sandbox): galat jelas, tanpa fallback.
      throw new StudioBrowserError("LAUNCH_FAILED", "launch", "Chromium launch failed with the OS sandbox enabled (see engine/browser log)", { cause: e });
    }
  };

  // Sandbox dibuktikan pada instans probe berumur pendek dengan opsi IDENTIK, lalu
  // instans render diluncurkan bersih. Probe tidak dijalankan di instans render
  // karena halaman WebUI ber-JS mengubah state proses GPU-nya: PNG raster
  // berikutnya bergeser 1 tingkat warna pada sebagian piksel (diukur FIX-8),
  // padahal keluaran render harus byte-identik dengan sebelum perubahan ini.
  const probe = await launchSandboxed("probe");
  try {
    await verifySandbox(probe);
  } finally {
    await probe.close().catch((e: unknown) =>
      logBrowser("warn", `Sandbox probe browser close failed: ${e instanceof Error ? e.message : String(e)}`, { op: "sandbox-check" }),
    );
  }

  const browser = await launchSandboxed("render");
  browser.on("disconnected", () => {
    const s = state();
    // Penutupan sengaja (resetBrowser) sudah mengosongkan s.browser: tidak perlu warn.
    if (s.browser !== browser) return;
    s.browser = null;
    logBrowser("warn", "Chromium disconnected unexpectedly", { op: "disconnected" });
  });
  logBrowser("info", `Chromium ${browser.version()} launched (sandboxed)`, { op: "launch", durationMs: Date.now() - started });
  return browser;
}

/** Instans tunggal; peluncuran paralel berbagi satu promise. */
export async function ensureBrowser(): Promise<Browser> {
  const s = state();
  if (s.browser && s.browser.isConnected()) return s.browser;
  if (!s.launching) {
    s.launching = launch()
      .catch((e: unknown) => {
        if (e instanceof StudioEngineError) throw e;
        const msg = e instanceof Error ? e.message : String(e);
        logBrowser("error", `Chromium launch failed: ${msg}`, { op: "launch" });
        throw new StudioBrowserError("LAUNCH_FAILED", "launch", "Chromium launch failed (see engine/browser log)", { cause: e });
      })
      .then((b) => {
        s.browser = b;
        return b;
      })
      .finally(() => {
        s.launching = null;
      });
  }
  return s.launching;
}

// ── Antrean berbatas (FIX-8, S87 M-03) ───────────────────────────────────
// Semafor 1 dengan batas jumlah operasi yang MENUNGGU dan batas lama tunggu.
// Penuh atau menunggu terlalu lama -> `RENDER_QUEUE_FULL` (503,
// `details.retryAfterSec` -> header Retry-After di route), tanpa menyentuh
// Chromium. Env opsional: STUDIO_CHROMIUM_MAX_QUEUED (bawaan 16, 0 = tanpa
// antrean), STUDIO_CHROMIUM_QUEUE_WAIT_MS (bawaan 4 x STUDIO_CHROMIUM_TIMEOUT_MS),
// STUDIO_RENDER_QUEUE_RETRY_AFTER_SEC (bawaan 30, sama dengan gerbang FIX-1).
export const BROWSER_MAX_QUEUED_DEFAULT = 16;
export const BROWSER_QUEUE_WAIT_MS_DEFAULT = 4 * STUDIO_CHROMIUM_TIMEOUT_MS;
export const BROWSER_QUEUE_RETRY_AFTER_SEC_DEFAULT = 30;

function envInt(name: string, fallback: number, min: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min ? n : fallback;
}

/** Batas antrean (dibaca per panggilan agar uji/ops bisa mengubah env tanpa restart). */
export function browserQueueLimits(): { maxQueued: number; maxWaitMs: number; retryAfterSec: number } {
  return {
    maxQueued: envInt("STUDIO_CHROMIUM_MAX_QUEUED", BROWSER_MAX_QUEUED_DEFAULT, 0),
    maxWaitMs: envInt("STUDIO_CHROMIUM_QUEUE_WAIT_MS", BROWSER_QUEUE_WAIT_MS_DEFAULT, 1),
    retryAfterSec: envInt("STUDIO_RENDER_QUEUE_RETRY_AFTER_SEC", BROWSER_QUEUE_RETRY_AFTER_SEC_DEFAULT, 1),
  };
}

/** Status antrean: `queued` = operasi berjalan + menunggu. */
export function browserQueueState(): { queued: number; maxQueued: number } {
  return { queued: state().queued, maxQueued: browserQueueLimits().maxQueued };
}

function queueFull(reason: "queue_full" | "wait_timeout", limits: ReturnType<typeof browserQueueLimits>, inQueue: number): StudioEngineError {
  logBrowser("warn", `Chromium queue rejected operation (${reason}; in queue ${inQueue}, max waiting ${limits.maxQueued})`, { op: "queue", code: "RENDER_QUEUE_FULL" });
  return new StudioEngineError(
    "RENDER_QUEUE_FULL",
    reason === "queue_full" ? "Browser render queue is full; retry later" : "Browser render queue wait exceeded; retry later",
    { reason, retryAfterSec: limits.retryAfterSec, inQueue, maxQueued: limits.maxQueued, maxWaitMs: limits.maxWaitMs },
  );
}

/**
 * Semafor 1 (antrean FIFO berbatas). Galat satu operasi tidak memutus antrean.
 * Penunggu yang kehabisan waktu ditolak; gilirannya di rantai tetap dilepas
 * begitu pendahulunya selesai sehingga antrean tidak macet.
 */
export async function withLock<T>(fn: () => Promise<T>, opts?: { unbounded?: boolean }): Promise<T> {
  const s = state();
  const limits = opts?.unbounded ? { ...browserQueueLimits(), maxQueued: Number.MAX_SAFE_INTEGER, maxWaitMs: 2 ** 31 - 1 } : browserQueueLimits();
  // s.queued = berjalan + menunggu; menunggu = s.queued - 1 bila ada yang berjalan.
  const waiting = Math.max(0, s.queued - 1);
  if (s.queued > 0 && waiting >= limits.maxQueued) throw queueFull("queue_full", limits, s.queued);
  const prev = s.tail;
  let release!: () => void;
  const mine = new Promise<void>((r) => {
    release = r;
  });
  s.tail = prev.then(() => mine);
  s.queued++;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<"expired">((r) => {
    timer = setTimeout(() => r("expired"), limits.maxWaitMs);
  });
  const turn = await Promise.race([prev.then(() => "turn" as const), expired]);
  clearTimeout(timer);
  if (turn === "expired") {
    s.queued--;
    // Lepas giliran saat pendahulu selesai (tanpa menjalankan fn).
    void prev.then(release);
    throw queueFull("wait_timeout", limits, s.queued + 1);
  }
  try {
    return await fn();
  } finally {
    s.queued--;
    release();
  }
}

export interface PageOptions {
  viewport: { width: number; height: number };
  deviceScaleFactor?: number;
  timeoutMs?: number;
}

export interface PageSession {
  page: Page;
  /** Jumlah request jaringan yang di-abort selama operasi. */
  blocked(): number;
}

function timeoutAfter(ms: number, op: string): { promise: Promise<never>; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new StudioEngineError("RENDER_TIMEOUT", `Browser operation '${op}' exceeded ${ms} ms`, { op, timeoutMs: ms }));
    }, ms);
  });
  return { promise, cancel: () => timer !== undefined && clearTimeout(timer) };
}

async function closeQuietly(ctx: BrowserContext, op: string): Promise<void> {
  const t = timeoutAfter(5000, `${op}:close`);
  try {
    await Promise.race([ctx.close(), t.promise]);
  } catch (e) {
    // Context macet: tutup browser agar instans berikut bersih.
    logBrowser("warn", `Context close failed, resetting browser: ${e instanceof Error ? e.message : String(e)}`, { op });
    await resetBrowser();
  } finally {
    t.cancel();
  }
}

/**
 * Jalankan satu operasi halaman di bawah semafor dengan context terkunci.
 * Context selalu ditutup (sukses, galat, maupun timeout).
 */
export async function withSandboxedPage<T>(op: string, opts: PageOptions, fn: (s: PageSession) => Promise<T>): Promise<T> {
  return withLock(async () => {
    const timeoutMs = opts.timeoutMs ?? STUDIO_CHROMIUM_TIMEOUT_MS;
    const started = Date.now();
    const browser = await ensureBrowser();
    let ctx: BrowserContext;
    try {
      ctx = await browser.newContext({
        javaScriptEnabled: false,
        offline: true,
        serviceWorkers: "block",
        acceptDownloads: false,
        bypassCSP: false,
        colorScheme: "light",
        reducedMotion: "reduce",
        locale: "id-ID",
        timezoneId: "UTC",
        viewport: opts.viewport,
        deviceScaleFactor: opts.deviceScaleFactor ?? 1,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logBrowser("error", `newContext failed: ${msg}`, { op });
      throw new StudioBrowserError("RENDER_FAILED", op, "Browser context failed (see engine/browser log)", { cause: e });
    }

    let blocked = 0;
    const t = timeoutAfter(timeoutMs, op);
    try {
      ctx.setDefaultTimeout(timeoutMs);
      ctx.setDefaultNavigationTimeout(timeoutMs);
      await ctx.route("**/*", (route) => {
        blocked++;
        return route.abort("blockedbyclient");
      });
      const work = (async () => {
        const page = await ctx.newPage();
        return fn({ page, blocked: () => blocked });
      })();
      // Cegah unhandled rejection bila timeout menang lebih dulu.
      work.catch(() => undefined);
      const result = await Promise.race([work, t.promise]);
      if (blocked > 0) logBrowser("warn", `Blocked ${blocked} network request(s) from content`, { op });
      logBrowser("info", `${op} done`, { op, durationMs: Date.now() - started });
      return result;
    } catch (e) {
      if (e instanceof StudioEngineError) {
        logBrowser("error", e.message, { op, durationMs: Date.now() - started, code: e.code });
        throw e;
      }
      const msg = e instanceof Error ? e.message : String(e);
      logBrowser("error", `${op} failed: ${msg}`, { op, durationMs: Date.now() - started });
      throw new StudioBrowserError("RENDER_FAILED", op, `Browser operation '${op}' failed (see engine/browser log)`, { cause: e });
    } finally {
      t.cancel();
      await closeQuietly(ctx, op);
    }
  });
}

async function resetBrowser(): Promise<void> {
  const s = state();
  const b = s.browser;
  s.browser = null;
  if (!b) return;
  const t = timeoutAfter(10000, "browser:close");
  try {
    await Promise.race([b.close(), t.promise]);
  } catch (e) {
    logBrowser("error", `Browser close failed: ${e instanceof Error ? e.message : String(e)}`, { op: "close" });
  } finally {
    t.cancel();
  }
}

/** Penutupan bersih: tunggu operasi berjalan selesai (semafor), lalu tutup. Idempoten. */
export async function shutdownBrowser(): Promise<void> {
  await withLock(async () => {
    const s = state();
    if (s.launching) {
      try {
        await s.launching;
      } catch {
        // Peluncuran gagal sudah dilog di launch(); tidak ada yang perlu ditutup.
      }
    }
    await resetBrowser();
  }, { unbounded: true }); // penutupan tidak boleh ditolak antrean penuh
}

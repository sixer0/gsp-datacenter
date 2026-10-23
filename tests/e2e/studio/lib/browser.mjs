// SR-52: peluncur Chromium (playwright-core) + perekam konsol/galat halaman per konteks.
import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { BASE } from "./api.mjs";

export function chromiumPath() {
  if (process.env.SR52_CHROMIUM && existsSync(process.env.SR52_CHROMIUM)) return process.env.SR52_CHROMIUM;
  for (const v of ["chromium-1243", "chromium-1234", "chromium-1228"]) {
    const p = resolve(homedir(), "AppData/Local/ms-playwright", v, "chrome-win64/chrome.exe");
    if (existsSync(p)) return p;
  }
  throw new Error("Chromium tidak ditemukan (set SR52_CHROMIUM)");
}

export async function launch() {
  return chromium.launch({ executablePath: chromiumPath(), headless: true });
}

/** Konteks baru dengan perekam konsol: setiap entri dicatat dengan peran + URL halaman. */
export async function newContext(browser, role, sink, opts = {}) {
  const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 }, locale: "id-ID", ...opts });
  ctx.on("page", (p) => attach(p, role, sink));
  return ctx;
}

export function attach(page, role, sink) {
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") {
      sink.push({ role, kind: `console.${m.type()}`, url: page.url(), text: m.text().slice(0, 3000), location: m.location()?.url ?? "", phase: sink.phase ?? "" });
    }
  });
  page.on("pageerror", (e) => sink.push({ role, kind: "pageerror", url: page.url(), text: String(e?.message ?? e).slice(0, 600), phase: sink.phase ?? "" }));
  page.on("response", (r) => {
    if (r.status() >= 500) sink.push({ role, kind: `http.${r.status()}`, url: r.url(), text: r.request().method(), phase: sink.phase ?? "" });
  });
}

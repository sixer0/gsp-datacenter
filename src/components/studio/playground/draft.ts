/*
 * Draf Alat developer di localStorage (SR-31; pola S100). Setiap akses
 * dibungkus try/catch (jendela privat, penyimpanan diblokir, kuota penuh);
 * halaman tetap bekerja tanpa draf. Draf hanya kenyamanan per peramban.
 * Kunci v2: bentuk draf v1 (jenis doc/chart/diagram/image/html) tidak dipulihkan.
 */

import { reportClientError } from "@/components/studio/shared/client-log";
import { EMPTY_OVERRIDES, MODES, type JsonMode, type PlaygroundMode, type PlaygroundOverrides } from "./types";

const KEY = "gsp.studio.playground.draft.v2";
let saveFailureReported = false;

export interface PlaygroundDraft {
  mode: PlaygroundMode;
  texts: Partial<Record<JsonMode, string>>;
  overrides: PlaygroundOverrides;
  savedAt: string;
}

export function loadDraft(): PlaygroundDraft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<PlaygroundDraft> | null;
    if (!d || typeof d !== "object" || typeof d.texts !== "object" || d.texts === null) return null;
    const mode = MODES.some((m) => m.mode === d.mode) ? (d.mode as PlaygroundMode) : "doc";
    const texts: Partial<Record<JsonMode, string>> = {};
    for (const k of ["doc", "chapter", "slot"] as const) {
      const v = (d.texts as Record<string, unknown>)[k];
      if (typeof v === "string") texts[k] = v;
    }
    const o = (d.overrides ?? {}) as Partial<PlaygroundOverrides>;
    const overrides: PlaygroundOverrides = {
      ...EMPTY_OVERRIDES,
      ...Object.fromEntries(Object.entries(o).filter(([k, v]) => k in EMPTY_OVERRIDES && typeof v === typeof EMPTY_OVERRIDES[k as keyof PlaygroundOverrides])),
    };
    if (!Array.isArray(overrides.formats)) overrides.formats = EMPTY_OVERRIDES.formats;
    return { mode, texts, overrides, savedAt: typeof d.savedAt === "string" ? d.savedAt : new Date().toISOString() };
  } catch {
    return null;
  }
}

/** Simpan draf; `false` bila penyimpanan tidak tersedia/penuh. */
export function saveDraft(d: PlaygroundDraft): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(d));
    return true;
  } catch (err) {
    // Dilaporkan sekali per muat halaman agar autosave tidak membanjiri log.
    if (!saveFailureReported) {
      saveFailureReported = true;
      reportClientError("studio.ui.playground.draft", err, { textChars: Object.values(d.texts).join("").length }, { level: "warn" });
    }
    return false;
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* penyimpanan tidak tersedia: tidak ada yang dihapus */
  }
}

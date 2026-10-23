/**
 * Draf editor templat per templat di `localStorage` (UX-01 §3a "Aturan lintas
 * langkah", K-6). Dipakai bersama langkah Gaya/Pengaturan (SR-29) dan Susunan
 * dokumen (SR-28) agar SATU "Simpan versi" mengirim gabungan esensial +
 * kerangka lewat R02 (D-163 T-2). Setiap akses dibungkus try/catch: penyimpanan
 * browser boleh tidak tersedia (mode privat, kuota); editor tetap bekerja tanpa draf.
 */
import type { TemplateSlotDef } from "@/lib/studio/contract/types/v2/template";
import type { ParamRecord } from "./values";

const PREFIX = "studio.templateDraft.v1.";

export interface TemplateDraft {
  /** Versi tempat draf dimulai; draf dari versi lain dibuang (versi baru sudah tersimpan). */
  baseVersionNo: number;
  preset?: { slug: string; version?: number };
  /** Nama gaya untuk ringkasan perubahan (bukan slug). */
  presetName?: string | null;
  essentials?: ParamRecord;
  advanced?: ParamRecord;
  roleFormats?: Record<string, unknown>;
  /** Diisi langkah Susunan dokumen (SR-28). */
  slots?: TemplateSlotDef[];
  savedAt: number;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readTemplateDraft(templateId: string, baseVersionNo: number): TemplateDraft | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(PREFIX + templateId);
    if (!raw) return null;
    const d = JSON.parse(raw) as TemplateDraft;
    if (!d || typeof d !== "object" || d.baseVersionNo !== baseVersionNo) return null;
    return d;
  } catch {
    return null;
  }
}

/** Gabungkan perubahan ke draf yang ada (langkah lain tidak saling menimpa). */
export function writeTemplateDraft(templateId: string, patch: Omit<Partial<TemplateDraft>, "savedAt"> & { baseVersionNo: number }): void {
  const s = storage();
  if (!s) return;
  try {
    const prev = readTemplateDraft(templateId, patch.baseVersionNo) ?? { baseVersionNo: patch.baseVersionNo, savedAt: 0 };
    s.setItem(PREFIX + templateId, JSON.stringify({ ...prev, ...patch, savedAt: Date.now() }));
  } catch {
    /* kuota/mode privat: draf tidak disimpan, editor tetap jalan */
  }
}

export function clearTemplateDraft(templateId: string): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(PREFIX + templateId);
  } catch {
    /* abaikan */
  }
}

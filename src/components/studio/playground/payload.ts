/*
 * Penyusun badan kiriman Alat developer (SR-31). Logika murni tanpa React:
 * isian panel menimpa medan JSON terkait, isian kosong = ikuti JSON
 * (perilaku S100 dipertahankan). Editor memuat badan permintaan utuh
 * (kiriman v2 dengan `$schema` di tingkat atas), sehingga pointer isu R08 dan
 * `SCHEMA_INVALID` sudah relatif isi editor.
 */

import { MISSION_FOLDER_RE, type JsonMode, type PlaygroundOverrides } from "./types";

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Panjang UTF-8 tanpa alokasi buffer. */
export function utf8Length(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff) {
      n += 4;
      i++;
    } else n += 3;
  }
  return n;
}

const DOC_KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DOCUMENT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** Galat isian panel per medan (kosong = sah). */
export interface OverrideErrors {
  missionFolder?: string;
  docKey?: string;
  documentId?: string;
  formats?: string;
}

export function overrideErrors(mode: JsonMode, o: PlaygroundOverrides): OverrideErrors {
  const out: OverrideErrors = {};
  const folder = o.missionFolder.trim();
  if (folder && !MISSION_FOLDER_RE.test(folder)) {
    out.missionFolder = "Format folder misi: YYYY-MM-DD_nama-misi (huruf kecil, angka, - atau _).";
  }
  const key = o.docKey.trim();
  if (key && (!DOC_KEY_RE.test(key) || key.length > 64)) {
    out.docKey = "Kunci dokumen: huruf kecil dan angka dipisah tanda hubung, mis. laporan-survei.";
  }
  const id = o.documentId.trim();
  if (mode !== "doc" && id && !DOCUMENT_ID_RE.test(id)) {
    out.documentId = "Id dokumen hanya huruf, angka, _ atau -.";
  }
  if (o.render && o.formats.length === 0) out.formats = "Pilih minimal satu format berkas.";
  return out;
}

export function hasOverrideErrors(e: OverrideErrors): boolean {
  return Object.values(e).some(Boolean);
}

/**
 * Terapkan isian panel ke badan kiriman. Badan bukan objek dikembalikan apa
 * adanya (server yang menolak dengan isu skema).
 */
export function applyOverrides(mode: JsonMode, body: unknown, o: PlaygroundOverrides, scope: "document" | "chapter" | "slot"): unknown {
  if (!isRecord(body)) return body;
  const out: Record<string, unknown> = { ...body };
  const slug = o.templateSlug.trim();
  const folder = o.missionFolder.trim();
  const key = o.docKey.trim();
  const agent = o.agentId.trim().slice(0, 80);

  if (slug) out.template = { ...(isRecord(out.template) ? out.template : {}), slug };
  if (agent) out.agentId = agent;

  if (mode === "doc") {
    if (folder) out.mission = { ...(isRecord(out.mission) ? out.mission : {}), folder };
    if (key) out.docKey = key;
    if (o.tier && isRecord(out.meta)) out.meta = { ...out.meta, tier: o.tier };
  } else {
    const id = o.documentId.trim();
    if (id) {
      // Tepat satu cara memilih target (T2-08): id dokumen menggantikan misi.
      out.target = { documentId: id };
    } else if (folder || key) {
      const prev = isRecord(out.target) ? out.target : {};
      const next: Record<string, unknown> = { ...prev };
      delete next.documentId;
      delete next.docNumber;
      if (folder) next.mission = { ...(isRecord(prev.mission) ? prev.mission : {}), folder };
      if (key) next.docKey = key;
      out.target = next;
    }
  }

  if (o.render && o.formats.length > 0) {
    const render: Record<string, unknown> = { scope, formats: o.formats };
    if (mode === "chapter" && isRecord(out.chapter) && typeof out.chapter.key === "string") render.key = out.chapter.key;
    if (mode === "slot" && typeof out.slot === "string") render.key = out.slot;
    out.render = render;
  }
  return out;
}

/** Ringkasan target kiriman untuk teks konfirmasi K-10. */
export function describeTarget(body: unknown): { missionFolder: string | null; documentId: string | null; docNumber: string | null } {
  const none = { missionFolder: null, documentId: null, docNumber: null };
  if (!isRecord(body)) return none;
  const tgt = isRecord(body.target) ? body.target : null;
  const mission = isRecord(body.mission) ? body.mission : tgt && isRecord(tgt.mission) ? tgt.mission : null;
  return {
    missionFolder: mission && typeof mission.folder === "string" ? mission.folder : null,
    documentId: tgt && typeof tgt.documentId === "string" ? tgt.documentId : null,
    docNumber: tgt && typeof tgt.docNumber === "string" ? tgt.docNumber : null,
  };
}

/**
 * Pasang `assetRef` ke `assets[key]` kiriman (untuk "Pakai di kiriman bab").
 * Mengembalikan teks JSON baru, atau null bila teks tidak dapat diurai.
 */
export function withAssetRef(text: string, key: string, assetRef: string): string | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  const assets = isRecord(value.assets) ? value.assets : {};
  return JSON.stringify({ ...value, assets: { ...assets, [key]: { assetRef } } }, null, 2) + "\n";
}

/** Kunci aset pertama di kiriman (target "Pakai di kiriman bab"). */
export function firstAssetKey(text: string): string | null {
  try {
    const v = JSON.parse(text) as unknown;
    if (isRecord(v) && isRecord(v.assets)) return Object.keys(v.assets)[0] ?? null;
  } catch {
    /* teks belum JSON sah */
  }
  return null;
}

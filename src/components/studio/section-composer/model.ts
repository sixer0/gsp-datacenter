/**
 * Model murni Susunan dokumen (SR-28; UX-01 W4; register 03 §4.7 kerangka
 * `studio.skeleton/v1`; blueprint §2.3, §2.12). Tanpa React, tanpa fetch.
 *
 * - Urutan bagian = urutan larik; `position` dinomori ulang 1..n saat dikirim.
 * - Bagian "Posisi tetap" (`positionLocked`) mempertahankan indeksnya: setiap
 *   pemindahan yang menggeser bagian terkunci ditolak (sama dengan aturan
 *   `SLOT_POSITION_LOCKED`).
 * - Kenop bagian (≤ 8 per jenis, D-165/D-170) membaca/menulis `essentials`
 *   bagian menurut jenis pemetaan registri (`langsung`, `petaNilai`, `turunan`,
 *   `anggota`, `medan`). Nilai yang sama dengan nilai efektif templat dihapus
 *   dari peta (bagian kembali "ikut gaya").
 * - Tanpa pengaturan per bab (blueprint §2.12; `file_requests.md:120` tertutup).
 */
import { CONTENT_MODE_LABEL, TIER_LABEL, sectionTypeLabel } from "@/components/studio/shared/labels";
import type { StudioSlotContentMode } from "@/lib/studio/contract/enums";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { StudioSkeletonV1, TemplateSlotDef } from "@/lib/studio/contract/types/v2/template";
import type { EssentialKnobSpec } from "@/lib/studio/registry/essentials";
import type { SlotKindDef } from "@/lib/studio/registry/slots";

export type Slot = TemplateSlotDef;
export type Inherited = Readonly<Record<string, ParamValue>> | null;

// ── Nilai umum ───────────────────────────────────────────────────────────

function stable(v: unknown): string {
  if (v === undefined) return "undefined";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
    .join(",")}}`;
}

export function sameValue(a: unknown, b: unknown): boolean {
  return stable(a) === stable(b);
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function isRecord(v: unknown): v is Record<string, ParamValue> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// ── Susunan ──────────────────────────────────────────────────────────────

/** Salinan terurut menurut `position` (sumber: respons R19). */
export function slotsFromSkeleton(s: StudioSkeletonV1 | null | undefined): Slot[] {
  return clone([...(s?.slots ?? [])].sort((a, b) => a.position - b.position));
}

/** Kerangka siap kirim: posisi 1..n kontigu, medan kosong opsional dibuang. */
export function toSkeleton(slots: readonly Slot[]): StudioSkeletonV1 {
  return {
    $schema: "studio.skeleton/v1",
    slots: slots.map((s, i) => {
      const out: Slot = { ...clone(s), position: i + 1 };
      if (out.advanced && Object.keys(out.advanced).length === 0) delete out.advanced;
      if (!out.repeatable) {
        delete out.minItems;
        delete out.maxItems;
      }
      return out;
    }),
  };
}

export type MoveResult = { ok: true; slots: Slot[] } | { ok: false; lockedIndex: number };

/**
 * Pindahkan bagian `from` ke indeks `to`. Ditolak bila bagian itu sendiri
 * terkunci atau bila ada bagian terkunci yang indeksnya ikut bergeser.
 */
export function moveSlot(slots: readonly Slot[], from: number, to: number): MoveResult {
  if (from < 0 || from >= slots.length) return { ok: false, lockedIndex: -1 };
  const target = Math.max(0, Math.min(slots.length - 1, to));
  if (slots[from].positionLocked) return { ok: false, lockedIndex: from };
  if (target === from) return { ok: true, slots: [...slots] };
  const next = [...slots];
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item);
  for (let i = 0; i < slots.length; i += 1) {
    if (slots[i].positionLocked && next[i] !== slots[i]) return { ok: false, lockedIndex: i };
  }
  return { ok: true, slots: next };
}

/** "selalu di awal" / "selalu di akhir" / "selalu di posisi 3". */
export function lockedPlace(index: number, total: number): string {
  if (index === 0) return "selalu di awal";
  if (index === total - 1) return "selalu di akhir";
  return `selalu di posisi ${index + 1}`;
}

/** Indeks sisip bagian baru: sebelum blok bagian terkunci di ujung (mis. Lampiran "selalu di akhir"). */
export function insertIndex(slots: readonly Slot[]): number {
  let i = slots.length;
  while (i - 1 > 0 && slots[i - 1].positionLocked) i -= 1;
  return i;
}

function uniqueKey(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n += 1) {
    const k = `${base}${n}`;
    if (!taken.has(k)) return k;
  }
  return `${base}${Date.now()}`;
}

/** Bagian baru dari jenis registri (C33) dengan bawaan jenis itu. */
export function newSlot(kind: SlotKindDef, existing: readonly Slot[], label: string): Slot {
  const taken = new Set(existing.map((s) => s.slotKey));
  const slot: Slot = {
    slotKey: uniqueKey(kind.implicitSlotKey, taken),
    sectionType: kind.sectionType,
    label: label.trim() || sectionTypeLabel(kind.sectionType),
    position: existing.length + 1,
    required: false,
    positionLocked: false,
    repeatable: kind.repeatable,
    contentMode: kind.defaultContentMode,
    tiers: [],
    admits: [...kind.defaultAdmits],
    essentials: {},
  };
  if (kind.repeatable && kind.implicitMinItems) slot.minItems = kind.implicitMinItems;
  return slot;
}

/** Jenis yang tidak boleh ditambah lagi (sudah ada di susunan). */
export function addBlockedReason(kind: SlotKindDef, slots: readonly Slot[]): string | null {
  if (slots.some((s) => s.sectionType === kind.sectionType)) return "Sudah ada di susunan";
  return null;
}

/** Penjelasan awam per jenis bagian (dialog "Tambah bagian"). */
export const SECTION_TYPE_HELP: Readonly<Record<string, string>> = {
  cover: "Halaman judul: judul, nomor dokumen, logo. Disusun dari data dokumen.",
  controlSheet: "Riwayat versi, verifikasi, dan daftar distribusi dokumen.",
  signatureBlock: "Kolom tanda tangan penyusun, pemeriksa, dan pengesah.",
  toc: "Daftar isi yang disusun otomatis dari judul bab.",
  chapter: "Isi utama dokumen. Agen mengirim bab satu per satu.",
  appendix: "Lampiran di akhir dokumen; dapat berisi banyak lampiran.",
  sourceRegister: "Daftar sumber yang dirujuk dokumen.",
  ruleIndex: "Indeks aturan yang disusun otomatis dari isi dokumen.",
};

/** "Dipakai di: Terbit, Serah" (kosong = semua tingkat terbitan). */
export function tiersText(slot: Slot): string {
  if (!slot.tiers || slot.tiers.length === 0) return "Semua tingkat terbitan";
  return slot.tiers.map((t) => TIER_LABEL[t] ?? t).join(", ");
}

export function contentModeText(mode: StudioSlotContentMode): string {
  return CONTENT_MODE_LABEL[mode] ?? mode;
}

/** "Bisa berisi banyak bab · min. 1 bab" untuk bagian berulang. */
export function repeatText(slot: Slot): string | null {
  if (!slot.repeatable) return null;
  const unit = slot.sectionType === "appendix" ? "lampiran" : "bab";
  const parts = [slot.sectionType === "appendix" ? "Bisa berisi banyak lampiran" : "Bisa berisi banyak bab"];
  if (slot.minItems) parts.push(`min. ${slot.minItems} ${unit}`);
  if (slot.maxItems) parts.push(`maks. ${slot.maxItems} ${unit}`);
  return parts.join(" · ");
}

// ── Kenop bagian ─────────────────────────────────────────────────────────

/**
 * Medan `slot.setup` yang tidak disetel = perilaku bawaan mesin: bab mulai di
 * halaman baru (`engine/docx/package/section.ts:47`) dan kepala berjalan aktif.
 */
const MEDAN_DEFAULT = true;

export interface KnobReading {
  value: ParamValue | undefined;
  /** Bagian ini mengubah nilai (bukan ikut gaya). */
  explicit: boolean;
  /** Nilai dasar tersedia (untuk `anggota` butuh daftar dasar). */
  available: boolean;
}

function keyOf(knob: EssentialKnobSpec): string {
  return knob.keys[0] ?? "";
}

/** Nilai dasar kunci untuk bagian: lanjutan bagian, lalu nilai efektif templat. */
function baseOf(slot: Slot, key: string, inherited: Inherited): ParamValue | undefined {
  const adv = slot.advanced?.[key];
  if (adv !== undefined) return adv;
  return inherited?.[key];
}

export function readKnob(knob: EssentialKnobSpec, slot: Slot, inherited: Inherited): KnobReading {
  const key = keyOf(knob);
  const own = slot.essentials?.[key];
  if (knob.mapping === "anggota") {
    const base = baseOf(slot, key, inherited);
    const arr = own ?? base;
    if (!Array.isArray(arr)) return { value: undefined, explicit: false, available: false };
    const value = arr.includes(knob.member ?? "");
    const baseHas = Array.isArray(base) ? base.includes(knob.member ?? "") : undefined;
    return { value, explicit: own !== undefined && baseHas !== undefined && baseHas !== value, available: true };
  }
  if (knob.mapping === "medan") {
    const field = knob.field ?? "";
    const ownField = isRecord(own) ? own[field] : undefined;
    const base = baseOf(slot, key, inherited);
    const baseField = isRecord(base) ? base[field] : undefined;
    const v = ownField ?? baseField;
    return { value: typeof v === "boolean" ? v : MEDAN_DEFAULT, explicit: typeof ownField === "boolean", available: true };
  }
  const base = baseOf(slot, key, inherited);
  return { value: own !== undefined ? own : base, explicit: own !== undefined, available: true };
}

function withEssentials(slot: Slot, essentials: Record<string, ParamValue>): Slot {
  return { ...slot, essentials };
}

/** Tulis nilai kenop; nilai yang sama dengan dasar menghapus kunci (ikut gaya). */
export function writeKnob(knob: EssentialKnobSpec, slot: Slot, value: ParamValue, inherited: Inherited): Slot {
  const key = keyOf(knob);
  const ess: Record<string, ParamValue> = { ...(slot.essentials ?? {}) };
  const base = baseOf(slot, key, inherited);
  if (knob.mapping === "anggota") {
    const member = knob.member ?? "";
    const current = ess[key] ?? base;
    if (!Array.isArray(current)) return slot;
    let next: ParamValue[];
    if (value === true) {
      if (current.includes(member)) return slot;
      // Sisip pada urutan daftar dasar bila anggota ada di sana; selain itu di akhir.
      const order = Array.isArray(base) ? base : [];
      const at = order.indexOf(member);
      next = [...current];
      if (at >= 0) {
        const before = order.slice(0, at);
        let idx = 0;
        for (let i = 0; i < next.length; i += 1) if (before.includes(next[i])) idx = i + 1;
        next.splice(idx, 0, member);
      } else next.push(member);
    } else next = current.filter((m) => m !== member);
    if (Array.isArray(base) && sameValue(next, base)) delete ess[key];
    else ess[key] = next;
    return withEssentials(slot, ess);
  }
  if (knob.mapping === "medan") {
    const field = knob.field ?? "";
    const obj: Record<string, ParamValue> = isRecord(ess[key]) ? { ...(ess[key] as Record<string, ParamValue>) } : {};
    const baseField = isRecord(base) ? base[field] : undefined;
    const fallback = typeof baseField === "boolean" ? baseField : MEDAN_DEFAULT;
    if (value === fallback) delete obj[field];
    else obj[field] = value;
    if (Object.keys(obj).length === 0) delete ess[key];
    else ess[key] = obj;
    return withEssentials(slot, ess);
  }
  if (base !== undefined && sameValue(value, base)) delete ess[key];
  else ess[key] = value;
  return withEssentials(slot, ess);
}

/** Kembalikan kenop ke nilai gaya. */
export function resetKnob(knob: EssentialKnobSpec, slot: Slot, inherited: Inherited): Slot {
  const key = keyOf(knob);
  if (knob.mapping === "anggota") {
    const base = baseOf(slot, key, inherited);
    if (!Array.isArray(base)) return slot;
    return writeKnob(knob, slot, base.includes(knob.member ?? ""), inherited);
  }
  if (knob.mapping === "medan") {
    const ess = { ...(slot.essentials ?? {}) };
    const obj = isRecord(ess[key]) ? { ...(ess[key] as Record<string, ParamValue>) } : null;
    if (!obj) return slot;
    delete obj[knob.field ?? ""];
    if (Object.keys(obj).length === 0) delete ess[key];
    else ess[key] = obj;
    return withEssentials(slot, ess);
  }
  const ess = { ...(slot.essentials ?? {}) };
  delete ess[key];
  return withEssentials(slot, ess);
}

/** Nilai kenop dalam bahasa awam (ringkasan perubahan, bantuan "Bawaan gaya: ..."). */
export function knobValueText(knob: EssentialKnobSpec, value: ParamValue | undefined): string {
  if (value === undefined || value === null) return "ikut gaya";
  if (knob.control === "bool") return value === true ? "aktif" : "mati";
  if ((knob.control === "enum" || knob.control === "multiEnum") && knob.options) {
    const label = (v: ParamValue) => knob.options?.find((o) => sameValue(o.value, v))?.label ?? String(v);
    if (Array.isArray(value)) return value.length ? value.map(label).join(", ") : "tidak ada";
    return label(value);
  }
  if (typeof value === "number") return value.toLocaleString("id-ID");
  if (typeof value === "string") return value.trim() ? `"${value}"` : "kosong";
  return "diubah";
}

// ── Pemeriksaan susunan (cermin aturan register §4.7) ────────────────────

export interface StructureIssue {
  level: "error" | "warn";
  /** Indeks bagian terkait (untuk tautan ke kartu). */
  index?: number;
  message: string;
}

export function checkStructure(slots: readonly Slot[], kinds: ReadonlyMap<string, SlotKindDef> | null): StructureIssue[] {
  const out: StructureIssue[] = [];
  if (slots.length === 0) {
    out.push({ level: "error", message: "Susunan belum berisi bagian. Tambahkan minimal satu bagian." });
    return out;
  }
  const seenType = new Map<string, number>();
  const seenKey = new Set<string>();
  slots.forEach((s, i) => {
    const name = s.label?.trim() || sectionTypeLabel(s.sectionType);
    if (!s.label?.trim()) out.push({ level: "error", index: i, message: `Bagian ke-${i + 1} belum bernama.` });
    if (seenKey.has(s.slotKey)) out.push({ level: "error", index: i, message: `${name} tercatat dua kali di susunan.` });
    seenKey.add(s.slotKey);
    const kind = kinds?.get(s.sectionType);
    if (kinds && !kind) out.push({ level: "error", index: i, message: `${name}: jenis bagian ini tidak dikenal.` });
    if (kind?.singlePerSkeleton) {
      const prev = seenType.get(s.sectionType);
      if (prev !== undefined) out.push({ level: "error", index: i, message: `${sectionTypeLabel(s.sectionType)} hanya boleh ada satu di susunan.` });
    }
    seenType.set(s.sectionType, i);
    if (kind && !kind.contentModes.includes(s.contentMode)) {
      out.push({ level: "error", index: i, message: `${name}: cara pengisian "${contentModeText(s.contentMode)}" tidak sah untuk jenis bagian ini.` });
    }
    if (s.repeatable && s.minItems !== undefined && s.maxItems !== undefined && s.minItems > s.maxItems) {
      out.push({ level: "error", index: i, message: `${name}: jumlah minimum lebih besar dari jumlah maksimum.` });
    }
  });
  if (!slots.some((s) => s.sectionType === "chapter")) {
    out.push({ level: "warn", message: "Susunan tanpa bagian Isi: agen tidak dapat mengirim bab ke dokumen dari templat ini." });
  }
  if (!slots.some((s) => s.required)) {
    out.push({ level: "warn", message: "Tidak ada bagian wajib: dokumen kosong pun dapat dinyatakan lengkap." });
  }
  return out;
}

// ── Ringkasan perubahan (langkah 4, bahasa awam) ─────────────────────────

export function summarizeChanges(
  base: readonly Slot[],
  draft: readonly Slot[],
  knobsFor: (sectionType: string) => readonly EssentialKnobSpec[],
  inherited: Inherited,
): string[] {
  const out: string[] = [];
  const before = new Map(base.map((s) => [s.slotKey, s]));
  const after = new Map(draft.map((s) => [s.slotKey, s]));
  const name = (s: Slot) => s.label?.trim() || sectionTypeLabel(s.sectionType);

  for (const s of draft) if (!before.has(s.slotKey)) out.push(`${name(s)} ditambahkan`);
  for (const s of base) if (!after.has(s.slotKey)) out.push(`${name(s)} dihapus`);

  const commonBefore = base.filter((s) => after.has(s.slotKey)).map((s) => s.slotKey);
  const commonAfter = draft.filter((s) => before.has(s.slotKey)).map((s) => s.slotKey);
  if (!sameValue(commonBefore, commonAfter)) out.push("Urutan bagian diubah");

  for (const d of draft) {
    const b = before.get(d.slotKey);
    if (!b) continue;
    if (b.label !== d.label) out.push(`${name(b)} diganti nama menjadi ${name(d)}`);
    if (b.required !== d.required) out.push(`${name(d)}: dijadikan ${d.required ? "wajib" : "opsional"}`);
    for (const k of knobsFor(d.sectionType)) {
      const vb = readKnob(k, b, inherited);
      const vd = readKnob(k, d, inherited);
      if (!sameValue(vb.value, vd.value) || vb.explicit !== vd.explicit) {
        out.push(`${name(d)}: ${k.label} ${knobValueText(k, vb.value)} jadi ${knobValueText(k, vd.value)}`);
      }
    }
    const essB = { ...b.essentials };
    const essD = { ...d.essentials };
    const knobKeys = new Set(knobsFor(d.sectionType).flatMap((k) => [...k.keys]));
    for (const k of knobKeys) {
      delete essB[k];
      delete essD[k];
    }
    if (!sameValue(essB, essD) || !sameValue(b.advanced ?? {}, d.advanced ?? {})) out.push(`${name(d)}: pengaturan lanjutan diubah`);
    if (b.positionLocked !== d.positionLocked) out.push(`${name(d)}: ${d.positionLocked ? "posisinya dijadikan tetap" : "posisinya tidak lagi tetap"}`);
    if (!sameValue([...b.tiers].sort(), [...d.tiers].sort())) out.push(`${name(d)}: tingkat terbitan menjadi ${tiersText(d)}`);
    if (b.contentMode !== d.contentMode) out.push(`${name(d)}: cara pengisian menjadi ${contentModeText(d.contentMode)}`);
    if (b.minItems !== d.minItems || b.maxItems !== d.maxItems) out.push(`${name(d)}: jumlah ${d.sectionType === "appendix" ? "lampiran" : "bab"} diubah`);
  }
  return out;
}

/** Indeks bagian dari pointer isu server (`/spec/slots/3/...` atau `/slots/3/...`). */
export function slotIndexFromPointer(pointer: string | undefined): number | undefined {
  if (!pointer) return undefined;
  const m = /(?:^|\/)slots\/(\d+)(?:\/|$)/.exec(pointer);
  return m ? Number(m[1]) : undefined;
}

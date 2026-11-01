/**
 * Logika murni editor templat (SR-29): baca/tulis kenop esensial global,
 * ringkasan perubahan berbahasa awam (langkah "Simpan versi"), definisi
 * `studio.template/v2` dari respons R02/R19, slug, dan hak ubah (UX-01 §2.2).
 * Tanpa React, tanpa fetch: dapat diuji di fase uji akhir (D-133).
 */
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { ParamDef } from "@/lib/studio/contract/types/params";
import type { StudioTemplateV2, TemplateSlotDef } from "@/lib/studio/contract/types/v2/template";
import type { EssentialKnob, SkeletonResponse, TemplateDetailV2, TemplateListItem } from "./api";
import { valuesEqual, type ParamRecord } from "./values";
import { actorLabel, withRawId } from "@/components/studio/shared/labels";

export type { ParamRecord };

/** Isi editor: definisi v2 yang dapat dikirim ulang apa adanya ke R02 POST. */
export interface TemplateDefinition {
  preset?: { slug: string; version?: number };
  essentials: ParamRecord;
  advanced: ParamRecord;
  /**
   * Lapis lanjutan benar-benar dimuat (ADMIN). false = tidak dikirim saat simpan, agar
   * server membawa kunci lanjutan lama (mengirim `{}` akan menghapusnya).
   */
  advancedLoaded: boolean;
  roleFormats?: Record<string, unknown>;
  /** null = kerangka belum dapat dibaca (R02 tanpa `definition` dan R19 belum ada). */
  slots: TemplateSlotDef[] | null;
}

/** Salinan tanpa satu kunci. */
export function omitKey<T>(o: Readonly<Record<string, T>>, key: string): Record<string, T> {
  const out: Record<string, T> = { ...o };
  delete out[key];
  return out;
}

// ── Kenop esensial global ───────────────────────────────────────────────

/** Kunci rinci yang ditulis kenop global (pemetaan global SR-05: satu kunci per kenop). */
export function knobKey(k: Pick<EssentialKnob, "keys">): string {
  return k.keys[0] ?? "";
}

/** Nilai efektif kenop: nilai templat bila ada, selain itu nilai bawaan gaya. */
export function knobValue(k: EssentialKnob, essentials: ParamRecord, baseline: ParamRecord): ParamValue | undefined {
  const key = knobKey(k);
  return Object.prototype.hasOwnProperty.call(essentials, key) ? essentials[key] : baseline[key];
}

/** Kenop diubah dari bawaan gaya (ada di lapis templat dan berbeda dari nilai gaya). */
export function knobOverridden(k: EssentialKnob, essentials: ParamRecord, baseline: ParamRecord): boolean {
  const key = knobKey(k);
  return Object.prototype.hasOwnProperty.call(essentials, key) && !valuesEqual(essentials[key], baseline[key]);
}

const NUM = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/** Nilai kenop dalam bahasa layar (label pilihan, "10,5 pt", "Ya/Tidak"). */
export function knobValueLabel(k: EssentialKnob, v: ParamValue | undefined): string {
  if (v === undefined || v === null || v === "") return "belum diatur";
  const opt = k.options?.find((o) => valuesEqual(o.value, v));
  if (opt) return opt.label;
  if (k.control === "bool") return v === true ? "Ya" : "Tidak";
  if (k.control === "number" && typeof v === "number") return k.keys[0]?.includes("size") ? `${NUM.format(v)} pt` : NUM.format(v);
  // UI-02 (UA-m10): tampilkan heks dengan "#" (format simpan tetap tanpa "#").
  if (k.control === "color" && typeof v === "string") return `#${v.trim().replace(/^#/, "").toUpperCase()}`;
  if (typeof v === "string" || typeof v === "number") return String(v);
  return "nilai khusus";
}

/**
 * Nilai swatch `<input type="color">` ("#rrggbb") dari nilai kenop warna.
 * Registri menulis `hex` tanpa "#" ("B45309"); "#B45309" dan bentuk pendek
 * "#B53"/"B53" juga diterima. Nilai tak sah -> "#000000".
 */
export function colorSwatchValue(v: ParamValue | undefined): string {
  if (typeof v !== "string") return "#000000";
  const raw = v.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(raw)) return `#${raw.split("").map((c) => c + c).join("").toLowerCase()}`;
  return "#000000";
}

/** Kelompok tampilan pengaturan global (UX-01 §3a langkah 2; ≤ 8 kenop, D-165). */
export const KNOB_GROUPS: ReadonlyArray<{ id: string; title: string; keys: readonly string[] }> = [
  { id: "halaman", title: "Halaman", keys: ["page.size", "page.orientation", "grid.marginDensity"] },
  { id: "tampilan", title: "Tampilan", keys: ["color.interior.signal", "type.scale.body.size"] },
  { id: "isi", title: "Isi", keys: ["doc.language", "classification.level", "layout.railMode"] },
];

/** Kenop global dikelompokkan; kenop yang tak dikenal kelompoknya masuk "Lainnya" (registri bertambah tanpa UI rusak). */
export function groupKnobs(knobs: readonly EssentialKnob[]): Array<{ id: string; title: string; knobs: EssentialKnob[] }> {
  const used = new Set<string>();
  const out = KNOB_GROUPS.map((g) => {
    const ks = g.keys.map((key) => knobs.find((k) => knobKey(k) === key)).filter((k): k is EssentialKnob => !!k);
    ks.forEach((k) => used.add(k.id));
    return { id: g.id, title: g.title, knobs: ks };
  });
  const rest = knobs.filter((k) => !used.has(k.id));
  if (rest.length) out.push({ id: "lainnya", title: "Lainnya", knobs: rest });
  return out.filter((g) => g.knobs.length > 0);
}

// ── Ringkasan perubahan (langkah Simpan versi) ─────────────────────────

export interface ChangeSummaryInput {
  knobs: readonly EssentialKnob[];
  before: { essentials: ParamRecord; baseline: ParamRecord; presetName: string | null; advanced: ParamRecord; roleFormats?: Record<string, unknown> };
  after: { essentials: ParamRecord; baseline: ParamRecord; presetName: string | null; advanced: ParamRecord; roleFormats?: Record<string, unknown> };
}

/** Baris awam: "Gaya: GSP DATUM jadi DATUM Kanonik", "Ukuran kertas: A4 jadi F4", "3 pengaturan lanjutan diubah". */
export function changeSummary(i: ChangeSummaryInput): string[] {
  const lines: string[] = [];
  if (i.before.presetName !== i.after.presetName && i.after.presetName) {
    lines.push(i.before.presetName ? `Gaya: ${i.before.presetName} jadi ${i.after.presetName}` : `Gaya: ${i.after.presetName}`);
  }
  for (const k of i.knobs) {
    const a = knobValue(k, i.before.essentials, i.before.baseline);
    const b = knobValue(k, i.after.essentials, i.after.baseline);
    if (!valuesEqual(a, b)) lines.push(`${k.label}: ${knobValueLabel(k, a)} jadi ${knobValueLabel(k, b)}`);
  }
  const adv = countChangedKeys(i.before.advanced, i.after.advanced);
  if (adv > 0) lines.push(`${adv.toLocaleString("id-ID")} pengaturan lanjutan diubah`);
  if (!valuesEqual(i.before.roleFormats ?? {}, i.after.roleFormats ?? {})) lines.push("Format teks per peran diubah");
  return lines;
}

export function countChangedKeys(a: ParamRecord, b: ParamRecord): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let n = 0;
  for (const k of keys) if (!valuesEqual(a[k], b[k])) n += 1;
  return n;
}

// ── Definisi v2 ─────────────────────────────────────────────────────────

/**
 * Definisi dari R02 (`definition`, SR-61) atau, sebelum itu tersedia, dari
 * lapis `overrides` versi (kunci kenop global = esensial, sisanya lanjutan)
 * + kerangka R19 bila ada. Preset tidak dapat diketahui dari bentuk lama.
 */
export function definitionOf(
  detail: TemplateDetailV2,
  skeleton: SkeletonResponse | null,
  essentialKeys: ReadonlySet<string>,
  isAdmin: boolean,
): TemplateDefinition {
  const d = detail.definition;
  if (d) {
    const advancedLoaded = isAdmin && (detail.advancedIncluded === true || d.advanced !== undefined);
    return {
      preset: d.preset,
      essentials: { ...(d.essentials ?? {}) },
      advanced: { ...(d.advanced ?? {}) },
      advancedLoaded,
      roleFormats: advancedLoaded ? d.roleFormats : undefined,
      slots: Array.isArray(d.skeleton?.slots) ? d.skeleton.slots : skeleton?.skeleton.slots ?? null,
    };
  }
  const essentials: ParamRecord = {};
  const advanced: ParamRecord = {};
  for (const [k, v] of Object.entries(detail.version.overrides ?? {})) {
    if (essentialKeys.has(k)) essentials[k] = v;
    else advanced[k] = v;
  }
  // Bentuk lama: `overrides` ADMIN utuh; non-ADMIN dipangkas server ke kunci esensial.
  return { essentials, advanced, advancedLoaded: isAdmin, slots: skeleton?.skeleton.slots ?? null };
}

/** Badan `studio.template/v2`; `advanced`/`roleFormats` hanya dikirim untuk ADMIN (server membawa kunci tersembunyi USER). */
export function toTemplateV2(def: TemplateDefinition, opts: { isAdmin: boolean; isPreset: boolean }): StudioTemplateV2 {
  const out: StudioTemplateV2 = {
    $schema: "studio.template/v2",
    essentials: { ...def.essentials },
    skeleton: { slots: def.slots ?? [] },
  };
  if (def.preset && !opts.isPreset) out.preset = def.preset;
  if (opts.isAdmin && def.advancedLoaded) {
    out.advanced = { ...def.advanced };
    // roleFormats tidak dikirim = dibawa dari versi sebelumnya (layanan SR-07).
    if (def.roleFormats) out.roleFormats = def.roleFormats;
  }
  return out;
}

/** Mode gaya (ADMIN): satu lapis datar dipisah per lapis permukaan registri (esensial vs selainnya). */
export function splitBySurface(layer: ParamRecord, defs: ReadonlyMap<string, ParamDef>): { essentials: ParamRecord; advanced: ParamRecord } {
  const essentials: ParamRecord = {};
  const advanced: ParamRecord = {};
  for (const [k, v] of Object.entries(layer)) {
    if (defs.get(k)?.surface === "essential") essentials[k] = v;
    else advanced[k] = v;
  }
  return { essentials, advanced };
}

// ── Identitas dan hak ───────────────────────────────────────────────────

const SLUG_MAX = 64;

/** Slug dari nama (huruf kecil, tanda hubung) + akhiran acak pendek agar tidak bentrok. Hanya tampil di Info teknis. */
export function slugFromName(name: string, rand: () => number = Math.random): string {
  const base =
    name
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, SLUG_MAX - 6)
      .replace(/-+$/g, "") || "templat";
  const suffix = Math.floor(rand() * 36 ** 4)
    .toString(36)
    .padStart(4, "0");
  return `${base}-${suffix}`;
}

/** `createdBy` berbentuk "user:<nama>" (S87 L-02) atau nama polos (data lama). */
export function isOwner(createdBy: string | null | undefined, username: string | null | undefined): boolean {
  if (!createdBy || !username) return false;
  const who = createdBy.includes(":") ? createdBy.slice(createdBy.indexOf(":") + 1) : createdBy;
  return who === username;
}

/**
 * Nama pembuat untuk layar (tanpa awalan jenis pemanggil). UI-02 (UA-M06): lewat `actorLabel`
 * agar "seed-studio" tampil "Sistem (bawaan)" dan agen bernama tampilan; "user:budi" -> "budi".
 */
export function creatorLabel(createdBy: string | null | undefined): string {
  if (!createdBy) return "-";
  return actorLabel(createdBy);
}

export interface Editability {
  canEdit: boolean;
  /** Alasan baca saja dalam bahasa awam (null bila boleh ubah). */
  reason: string | null;
  /** Tawarkan "Buat salinan". */
  offerCopy: boolean;
}

/** UX-01 §2.2: ADMIN mengubah semua; USER hanya templat miliknya yang tidak kanonik, bukan gaya, tidak terbatas. */
export function editabilityOf(t: TemplateListItem, viewer: { isAdmin: boolean; username: string | null }, viewingOld: boolean): Editability {
  if (viewingOld) return { canEdit: false, reason: "Anda melihat versi lama. Kembali ke versi terbaru untuk mengubah templat.", offerCopy: false };
  if (viewer.isAdmin) return { canEdit: true, reason: null, offerCopy: false };
  if (t.isPreset) return { canEdit: false, reason: "Gaya hanya dapat diubah admin. Pilih gaya ini saat membuat templat baru.", offerCopy: false };
  if (t.isCanonical) return { canEdit: false, reason: "Templat kanonik hanya dapat diubah admin. Buat salinan untuk menyesuaikan.", offerCopy: true };
  if (t.restricted) return { canEdit: false, reason: "Templat ini terbatas; hanya admin yang dapat mengubahnya.", offerCopy: false };
  if (!isOwner(t.createdBy, viewer.username)) {
    return { canEdit: false, reason: `Templat ini dibuat oleh ${withRawId(creatorLabel(t.createdBy), t.createdBy)}. Buat salinan untuk menyesuaikan.`, offerCopy: true };
  }
  return { canEdit: true, reason: null, offerCopy: false };
}

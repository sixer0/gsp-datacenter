/**
 * Tabel spec templat jenis dokumen DATUM Rev A, ID dan EN (baris S26; register `research/31` §1-§3; D-590,
 * D-594, D-595, D-598 F-3/F-6, D-602). Data murni: tidak membuka DB dan tidak memeriksa izin DB; diiterasi
 * `prisma/seed-studio.ts --doc-type-templates` (S27) lewat helper bersama `seed-studio-templates.ts`.
 *
 * Satu baris spec = lapis bersama x lapis jenis x lapis bahasa, disusun oleh `composeSpec`; tidak ada salinan
 * per templat dan tidak ada cabang slug/jenis (U4). Semua kunci adalah parameter templat yang sudah ada
 * (`doc.defaultTypeCode`, `doc.defaultTier`, `doc.typeCode`, `doc.language`, `org.entityName`, `layout.railMode`,
 * `table.zebra.minRows`, kenop slot `cover.kicker.text`, `render.toc.mode`) dan label slot; tidak ada medan muatan
 * atau skema slot baru (U3, D-594).
 *
 * Tidak ditimpa (research/31 §3.4): `wrapper.header` dan `device.issueStamp.format` (mesin memilih teks EN
 * lewat tabel teks bila bahasa EN dan nilai = bawaan registri), `render.toc.title` (kosong, F-6: kicker
 * daftar isi sudah dicetak per bahasa), `chapter.kicker.pattern`, `device.registerBlock.cells`.
 */
import { WRAPPER_TEXT } from "../src/lib/studio/engine/front/texts";
import type { ParamRecord } from "../src/lib/studio/services/templates";
import { DATUM_SKELETON_SLOTS, type DerivedTemplateSpec, type GuardedTemplateTxOptions, type SlotOverrides, type SlotShape } from "./seed-studio-templates";

export type DocLanguage = "ID" | "EN";
export type DocTier = "NOTA" | "TERBIT" | "SERAH";

/** Preset basis semua templat jenis dokumen (AC-2: basis = versi terbaru preset ini). */
export const DOC_TYPE_PRESET_SLUG = "datum-gsp-preset";

/** research/31 §3.1: daftar tertutup kode jenis Rev A (Tabel 3.1 kolom kiri lalu kanan; tanpa DS, dengan NDA). */
export const REV_A_TYPE_CODES: readonly string[] = ["PT", "KT", "RAB", "SPH", "SP", "BA", "NDA", "DEK", "LAP", "MAT", "STD", "NOT", "MOD", "VER"];

/**
 * Lapis bersama semua templat: daftar kode jenis Rev A, dan nilai manual untuk kunci yang dikendalikan
 * parameter templat (D-602): entitas kolofon kapital (`ID:20`, CV-16; preset GSP DATUM menyimpan huruf campur).
 * G-FIX1 (D-606), parameter yang sudah ada, bawaan registri tidak diubah. Nilainya sama dengan profil preset GSP
 * DATUM (`benchmark/manual000/template.json`), jadi keluaran tidak berubah; di lapis ini agar tuntutan manual menjadi
 * data templat sendiri, tidak bergantung pada versi preset:
 *  - `layout.railMode` A: rel bukti 32 mm selalu tampil di halaman interior (GF-24, `EN:2764`; "Rel yang kosong
 *    itu benar", `ID:2711`); bawaan registri `auto` menjatuhkan rel bila tidak ada sitasi rel.
 *  - `table.zebra.minRows` 1000: zebra tidak menyala ("tanpa zebra", DT-11b `ID:2749-2754`, GF-17); konvensi
 *    profil Manual 000 ("1000 menonaktifkan zebra", registri tanpa saklar zebra; kelas K, ditulis seed ADMIN).
 */
const SHARED_LAYER: ParamRecord = {
  "doc.typeCode": [...REV_A_TYPE_CODES],
  "org.entityName": "PT GEMILANG SATRIA PERKASA",
  "layout.railMode": "A",
  "table.zebra.minRows": 1000,
};

/**
 * Override kenop slot bersama semua templat (D-602 adendum 2, kalibrasi S25 `verification/21` TR-03/TR-08):
 * daftar isi = medan TOC Word. Kenop berlingkup slot `toc` (`params/render.ts` P-22, permukaan esensial); preset
 * GSP DATUM menyalin `static` ke kenop slot toc, jadi nilainya wajib di slot, bukan di lapis dokumen.
 */
const SHARED_SLOT_OVERRIDES: SlotOverrides = {
  toc: { "render.toc.mode": "field" },
};

/** Slot tambahan satu jenis dokumen, disisipkan sebelum slot `insertBefore` (posisi dihitung ulang). */
interface ExtraSlot {
  insertBefore: string;
  slot: Omit<SlotShape, "position">;
}

/** research/31 §3.5 (F-3, D-598): indeks aturan STD = AUTO dari isi, opsional (belum memancarkan seksi DOCX). */
const RULE_INDEX_SLOT: ExtraSlot = {
  insertBefore: "appendices",
  slot: { slotKey: "ruleIndex", sectionType: "ruleIndex", label: "Indeks Aturan", required: false, positionLocked: false, repeatable: false, contentMode: "AUTO", tiers: [], admits: [] },
};

/** Lapis jenis dokumen (research/31 §1-§2). */
export interface DocTypeLayer {
  slugBase: string;
  typeCode: string;
  tier: DocTier;
  /** Nama jenis untuk nama templat, per bahasa. */
  title: Readonly<Record<DocLanguage, string>>;
  /** `cover.kicker.text` (kenop slot cover), per bahasa. */
  kicker: Readonly<Record<DocLanguage, string>>;
  extraSlots?: readonly ExtraSlot[];
}

export const DOC_TYPE_LAYERS: readonly DocTypeLayer[] = [
  { slugBase: "datum-proposal-teknis", typeCode: "PT", tier: "SERAH", title: { ID: "Proposal Teknis", EN: "Technical Proposal" }, kicker: { ID: "PROPOSAL TEKNIS", EN: "TECHNICAL PROPOSAL" } },
  { slugBase: "datum-laporan", typeCode: "LAP", tier: "TERBIT", title: { ID: "Laporan", EN: "Report" }, kicker: { ID: "LAPORAN", EN: "REPORT" } },
  { slugBase: "datum-laporan-verifikasi", typeCode: "VER", tier: "TERBIT", title: { ID: "Laporan Verifikasi dan Uji", EN: "Verification and Test Report" }, kicker: { ID: "LAPORAN VERIFIKASI", EN: "VERIFICATION REPORT" } },
  { slugBase: "datum-standar", typeCode: "STD", tier: "TERBIT", title: { ID: "Standar", EN: "Standard" }, kicker: { ID: "STANDAR", EN: "STANDARD" }, extraSlots: [RULE_INDEX_SLOT] },
  { slugBase: "datum-nota", typeCode: "NOT", tier: "NOTA", title: { ID: "Nota Internal", EN: "Internal Note" }, kicker: { ID: "NOTA INTERNAL", EN: "INTERNAL NOTE" } },
];

/** Lapis bahasa (research/31 §3.3): akhiran slug, akhiran nama, label slot, deskripsi. */
export interface LanguageLayer {
  language: DocLanguage;
  slugSuffix: string;
  nameSuffix: string;
  /** Label slot per `slotKey`; slot tanpa entri memakai label kerangka (ID, = datum-gsp). */
  slotLabels: Readonly<Record<string, string>>;
  description: (t: { title: string; typeCode: string; tier: DocTier }) => string;
}

export const LANGUAGE_LAYERS: readonly LanguageLayer[] = [
  {
    language: "ID",
    slugSuffix: "",
    nameSuffix: " (DATUM Rev A)",
    slotLabels: {},
    description: (t) => `Dokumen ${t.title} GSP mengikuti Manual DATUM Rev A (kode ${t.typeCode}, tier bawaan ${t.tier}).`,
  },
  {
    language: "EN",
    slugSuffix: "-en",
    nameSuffix: " (DATUM Rev A, EN)",
    slotLabels: {
      cover: "Cover",
      // Label lembar kendali tercetak sebagai kicker (`compose/front.ts`): satu sumber dengan tabel teks pembungkus.
      controlSheet: WRAPPER_TEXT.controlKicker.EN,
      signature: "Signatures",
      toc: WRAPPER_TEXT.tocKicker.EN,
      content: "Content",
      references: "References",
      appendices: "Appendices",
      ruleIndex: "Rule Index",
    },
    description: (t) => `GSP ${t.title} following the DATUM Manual Rev A (type code ${t.typeCode}, default tier ${t.tier}).`,
  },
];

/** Kerangka datum-gsp + slot tambahan jenis, label per bahasa, posisi 1..n. */
function skeletonFor(type: DocTypeLayer, lang: LanguageLayer): SlotShape[] {
  const slots: Array<Omit<SlotShape, "position">> = DATUM_SKELETON_SLOTS.map((s) => ({ ...s, admits: [...s.admits], tiers: [...s.tiers] }));
  for (const extra of type.extraSlots ?? []) {
    const at = slots.findIndex((s) => s.slotKey === extra.insertBefore);
    if (at < 0) throw new Error(`Slot tambahan ${extra.slot.slotKey}: slot ${extra.insertBefore} tidak ada di kerangka`);
    slots.splice(at, 0, { ...extra.slot, admits: [...extra.slot.admits], tiers: [...extra.slot.tiers] });
  }
  return slots.map((s, i) => ({ ...s, label: lang.slotLabels[s.slotKey] ?? s.label, position: i + 1 }));
}

function composeSpec(type: DocTypeLayer, lang: LanguageLayer): DerivedTemplateSpec {
  const title = type.title[lang.language];
  const kicker = type.kicker[lang.language];
  return {
    slug: `${type.slugBase}${lang.slugSuffix}`,
    name: `${title}${lang.nameSuffix}`,
    description: lang.description({ title, typeCode: type.typeCode, tier: type.tier }),
    presetSlug: DOC_TYPE_PRESET_SLUG,
    slots: skeletonFor(type, lang),
    layer: { ...SHARED_LAYER, "doc.defaultTypeCode": type.typeCode, "doc.defaultTier": type.tier, "doc.language": lang.language },
    slotOverrides: { ...SHARED_SLOT_OVERRIDES, cover: { "cover.kicker.text": kicker } },
    contractKind: null,
    changeNote: (c) =>
      `S27: templat jenis dokumen DATUM Rev A ${type.typeCode}/${lang.language} = preset ${DOC_TYPE_PRESET_SLUG} v${c.presetVersionNo} + esensial global + lapis jenis/bahasa (tier ${type.tier}, kicker ${kicker}) + kerangka ${c.slotCount} slot`,
  };
}

/** 10 baris tabel spec: setiap jenis x setiap bahasa (urutan register research/31 §1). */
export const DOC_TYPE_TEMPLATE_SPECS: readonly DerivedTemplateSpec[] = DOC_TYPE_LAYERS.flatMap((type) => LANGUAGE_LAYERS.map((lang) => composeSpec(type, lang)));

/** Kunci parameter yang dibuktikan aturan NU-03 skor konformitas. */
const NU03_PARAM_KEYS = ["doc.typeCode", "doc.defaultTypeCode", "doc.defaultTier", "doc.language"] as const;

export interface DocTypeSpecJson {
  schema: "datum-template-spec/v1";
  templates: Array<{ slug: string; params: Record<string, unknown> }>;
}

/**
 * JSON `--spec` skor konformitas DATUM (bukti NU-03; bentuk `benchmark/datum_conformance/rules/language.ts`
 * docblock "Bentuk JSON --spec"): nilai parameter templat + kicker slot cover per slug.
 */
export function docTypeTemplateSpecJson(specs: readonly DerivedTemplateSpec[] = DOC_TYPE_TEMPLATE_SPECS): DocTypeSpecJson {
  return {
    schema: "datum-template-spec/v1",
    templates: specs.map((s) => ({
      slug: s.slug,
      params: {
        ...Object.fromEntries(NU03_PARAM_KEYS.map((k) => [k, JSON.parse(JSON.stringify(s.layer[k] ?? null)) as unknown])),
        "cover.kicker.text": s.slotOverrides?.cover?.["cover.kicker.text"] ?? "",
      },
    })),
  };
}

// ── Opsi runner `--doc-type-templates` (S27) ─────────────────────────────

/**
 * Opsi `runGuardedTemplateTx` untuk tabel ini: satu transaksi, section type dibekukan (tidak boleh ada
 * create/update; penjaga gagal bila registri dan DB berbeda), templat lain tidak berubah (penjaga runner),
 * setiap templat sasaran `storedOk` (restricted=false, contractKind null, archived=false, basis = versi
 * terbaru preset). Tidak membuka koneksi: `counts` dijalankan runner di dalam transaksinya.
 */
export function docTypeTemplateTxOptions(database: string, dryRun: boolean): GuardedTemplateTxOptions {
  return {
    label: "Templat jenis dokumen DATUM Rev A",
    guardFailMessage:
      "Penjaga templat jenis dokumen gagal (templat lain/section type berubah atau isi tersimpan tidak sesuai); transaksi di-rollback (tidak ada yang ditulis)",
    dryRunDoneMessage: "Dry-run templat jenis dokumen selesai; transaksi di-rollback (0 tulis)",
    database,
    dryRun,
    specs: DOC_TYPE_TEMPLATE_SPECS,
    freezeSectionTypes: true,
    counts: async (tx) => ({
      sectionTypes: await tx.studioSectionType.count(),
      docTypeTemplates: await tx.studioTemplate.count({ where: { slug: { in: DOC_TYPE_TEMPLATE_SPECS.map((s) => s.slug) } } }),
      templates: await tx.studioTemplate.count(),
    }),
  };
}

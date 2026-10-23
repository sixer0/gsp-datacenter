/*
 * Contoh kiriman v2 Alat developer (SR-31; UX-01 W11).
 *
 * - E1 `studio.doc/v2`: dokumen GSP DATUM 7 bagian (blueprint 05 §2.4).
 * - E2 `studio.chapter/v2`: bab 3 dengan gambar dan tabel (blueprint 05 §2.5).
 * - Bagian `studio.slot/v2`: Lembar kendali dari E1 (blueprint 05 §2.5, R13).
 * - "Minimal dari skema": dibangkitkan dari JSON Schema registri R03
 *   (`use-schema-examples.ts`), bukan dari berkas ini.
 *
 * Penyesuaian agar contoh aman dikirim berulang dari alat ini (dicatat di
 * laporan SR-31): `meta.docNumber` dan `mission.hermesTaskId` dihapus (nomor
 * diterbitkan sekuens; HermesTask contoh tidak ada di DB sehingga memberi
 * 404 MISSION_REF_NOT_FOUND), folder misi = isian panel atau folder uji hari
 * ini, `docKey` disamakan agar E1 -> E2 -> Lembar kendali mengisi dokumen yang
 * sama, dan `render` tidak disertakan (diatur panel "Buat berkas").
 * `assetRef` E2 memakai sha nol 64 heksa (C27) sebagai penanda: ganti dengan
 * hasil "Unggah aset" (tombol "Pakai di kiriman bab").
 */

export type ExampleId = "e1" | "e2" | "slot-control-sheet" | "minimal";

export interface ExampleContext {
  templateSlug: string;
  missionFolder: string;
  docKey: string;
}

export const DEFAULT_TEMPLATE_SLUG = "datum-gsp";
export const DEFAULT_DOC_KEY = "laporan-survei";
export const PLACEHOLDER_ASSET_REF = `sha256:${"0".repeat(64)}`;
/** Kunci aset gambar pada contoh E2. */
export const EXAMPLE_ASSET_KEY = "foto-pmt2";

/** Folder misi uji hari ini, mis. `2026-10-23_uji-alat-developer`. */
export function defaultMissionFolder(now = new Date()): string {
  return `${now.toISOString().slice(0, 10)}_uji-alat-developer`;
}

const t = (text: string) => ({ text });

function target(ctx: ExampleContext) {
  return { mission: { folder: ctx.missionFolder }, docKey: ctx.docKey };
}

/** E1 — dokumen GSP DATUM lengkap (tujuh bagian). */
export function exampleE1(ctx: ExampleContext): Record<string, unknown> {
  return {
    $schema: "studio.doc/v2",
    template: { slug: ctx.templateSlug },
    mission: { folder: ctx.missionFolder },
    docKey: ctx.docKey,
    meta: { title: "Laporan Survei Gardu Induk Cikupa", tier: "TERBIT", subject: "Survei GI Cikupa" },
    sections: {
      cover: {
        type: "cover",
        titleLines: [t("Survei Gardu Induk Cikupa"), t("Kondisi Peralatan 150 kV")],
        standfirst: t("Kondisi peralatan primer dan rekomendasi pemeliharaan."),
      },
      controlSheet: controlSheetPayload(),
      signature: {
        type: "signatureBlock",
        roles: [
          { role: t("Disusun"), holder: t("A. Pratama"), date: t("2026-10-23") },
          { role: t("Diperiksa"), holder: t("B. Santoso") },
          { role: t("Disetujui"), holder: t("C. Wijaya") },
        ],
      },
      toc: { type: "toc" },
      content: {
        type: "chapter",
        outline: [{ key: "1" }, { key: "2" }],
        chapters: [
          {
            key: "1",
            title: t("Lingkup Survei"),
            sections: [
              {
                title: t("Tujuan"),
                blocks: [{ type: "paragraph", id: "s1-tujuan-1", text: "Survei mendata kondisi peralatan 150 kV." }],
              },
            ],
          },
          {
            key: "2",
            title: t("Temuan Utama"),
            sections: [
              {
                title: t("Transformator Daya"),
                blocks: [
                  {
                    type: "paragraph",
                    runs: [{ t: "Suhu minyak TD-1 " }, { t: "di atas batas", strong: true }, { t: " operasi normal." }],
                  },
                  {
                    type: "table",
                    caption: t("Suhu minyak transformator"),
                    columns: [{ role: "text" }, { role: "numeral", unit: "°C" }],
                    rows: [
                      { kind: "header", cells: [t("Unit"), t("Suhu")] },
                      { cells: [t("TD-1"), t("68")] },
                    ],
                    source: { text: "Pengukuran lapangan 2026-10-20", provenance: ["TERUKUR"] },
                  },
                ],
              },
            ],
          },
        ],
      },
      references: {
        type: "sourceRegister",
        entries: [{ id: "r1", citation: t("SPLN T5.008:2019 Pemeliharaan Trafo Tenaga"), kind: "dokumen" }],
      },
      appendices: {
        type: "appendix",
        chapters: [
          {
            key: "A",
            title: t("Data Mentah"),
            sections: [{ title: t("Log Suhu"), blocks: [{ type: "paragraph", text: "Log 24 jam terlampir." }] }],
          },
        ],
      },
    },
  };
}

/** E2 — satu bab (bab 3) dengan gambar dan tabel. */
export function exampleE2(ctx: ExampleContext): Record<string, unknown> {
  return {
    $schema: "studio.chapter/v2",
    agentId: "gsp-analis-01",
    target: target(ctx),
    template: { slug: ctx.templateSlug },
    meta: { title: "Laporan Survei Gardu Induk Cikupa" },
    chapter: {
      key: "3",
      title: t("Analisis Kondisi Peralatan"),
      sections: [
        {
          title: t("Metode Penilaian"),
          blocks: [
            { type: "paragraph", text: "Penilaian memakai skor kondisi 1 sampai 5 per peralatan." },
            { type: "paragraph", text: "Skor diberikan dari inspeksi visual dan uji tahanan isolasi." },
          ],
        },
        {
          title: t("Kondisi Pemutus Tenaga"),
          blocks: [
            { type: "paragraph", text: "Tiga pemutus tenaga diperiksa pada 2026-10-20." },
            { type: "paragraph", text: "PMT-2 menunjukkan korosi pada terminal sisi beban." },
            {
              type: "image",
              asset: EXAMPLE_ASSET_KEY,
              caption: t("Korosi pada terminal PMT-2"),
              source: { text: "Foto lapangan 2026-10-20", provenance: ["TERUKUR"] },
            },
            { type: "paragraph", text: "Korosi ini menurunkan tahanan kontak dan perlu pembersihan." },
          ],
        },
        {
          title: t("Ringkasan Skor"),
          blocks: [
            { type: "paragraph", text: "Tabel berikut merangkum skor kondisi." },
            {
              type: "table",
              caption: t("Skor kondisi pemutus tenaga"),
              columns: [{ role: "id" }, { role: "numeral" }],
              rows: [
                { kind: "header", cells: [t("Unit"), t("Skor")] },
                { cells: [t("PMT-1"), t("4")] },
                { cells: [t("PMT-2"), t("2")] },
              ],
              source: { text: "Inspeksi 2026-10-20", provenance: ["TERUKUR"] },
            },
          ],
        },
      ],
    },
    assets: { [EXAMPLE_ASSET_KEY]: { assetRef: PLACEHOLDER_ASSET_REF } },
  };
}

function controlSheetPayload(): Record<string, unknown> {
  return {
    type: "controlSheet",
    revisionHistory: [{ rev: "A", date: "2026-10-23", what: "Terbit pertama", by: "Tim Survei" }],
    verificationChain: [{ layer: "1", role: "Penyusun", name: "A. Pratama" }],
    methodStatement: t("Pengukuran langsung di lapangan; lihat Bab 1."),
    distribution: [{ copy: "1", holder: "Manajer Proyek" }],
  };
}

/** Bagian Lembar kendali (`studio.slot/v2`). */
export function exampleSlotControlSheet(ctx: ExampleContext): Record<string, unknown> {
  return {
    $schema: "studio.slot/v2",
    agentId: "gsp-analis-01",
    target: target(ctx),
    template: { slug: ctx.templateSlug },
    meta: { title: "Laporan Survei Gardu Induk Cikupa" },
    slot: "controlSheet",
    payload: controlSheetPayload(),
  };
}

export interface ExampleOption {
  id: ExampleId;
  label: string;
}

/** Pilihan contoh per mode JSON (urutan = tampilan). */
export const EXAMPLE_OPTIONS: Readonly<Record<"doc" | "chapter" | "slot", readonly ExampleOption[]>> = {
  doc: [
    { id: "e1", label: "E1 dokumen lengkap" },
    { id: "minimal", label: "Minimal dari skema registri" },
  ],
  chapter: [
    { id: "e2", label: "E2 bab 3 (gambar + tabel)" },
    { id: "minimal", label: "Minimal dari skema registri" },
  ],
  slot: [
    { id: "slot-control-sheet", label: "Lembar kendali" },
    { id: "minimal", label: "Minimal dari skema registri" },
  ],
};

/** Contoh kurasi (bukan `minimal`) sebagai objek. */
export function curatedExample(id: Exclude<ExampleId, "minimal">, ctx: ExampleContext): Record<string, unknown> {
  if (id === "e1") return exampleE1(ctx);
  if (id === "e2") return exampleE2(ctx);
  return exampleSlotControlSheet(ctx);
}

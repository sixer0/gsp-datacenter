/**
 * Dokumen contoh bawaan pratinjau templat (S101). Kecil tetapi mencakup unsur
 * yang paling sering disetel parameter: sampul, lembar kendali, daftar isi,
 * bab, seksi, paragraf, daftar, tabel bersumber, figur (chart), turunan, dan
 * rel bukti. Format diserahkan ke templat (tanpa `format`/`runs` eksplisit),
 * sehingga pratinjau mencerminkan parameter draf, bukan format tertanam.
 *
 * Murni data: aman diimpor komponen klien.
 */
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { StudioDocV1 } from "@/lib/studio/contract/types/doc";
import type { StudioTier } from "@/lib/studio/contract/enums";

/** Slug pengganti sebelum templat sebenarnya diketahui; selalu ditimpa `withDraft`. */
const PLACEHOLDER_SLUG = "pratinjau";

export const SAMPLE_DOCUMENT: StudioDocV1 = {
  $schema: "studio.doc/v1",
  template: { slug: PLACEHOLDER_SLUG },
  meta: {
    title: "Contoh Pratinjau Templat",
    docNumber: "001/GSP/KT/X/2026",
    rev: "A",
    typeCode: "KT",
    tier: "TERBIT",
    classification: "Terbatas",
    language: "ID",
    author: "Divisi Engineering PT GSP",
    issueDate: "2026-10-01",
    custodian: "ENG-01",
    audience: "Tim penyusun templat",
  },
  register: {
    panjangSaluran: { v: 6546.2, dec: 1, unit: "m", mark: "TERUKUR", src: "Survei lapangan 2026" },
    hargaSatuan: { v: 185000, dec: 0, unit: "Rp/m", mark: "PEMASOK", src: "Penawaran pemasok A (B2)" },
    biayaSaluran: { v: 1211047000, dec: 0, unit: "Rp", mark: "DITURUNKAN", src: "Turunan D-1.1" },
  },
  front: {
    cover: {
      mode: "auto",
      data: {
        kicker: { text: "Standar Kerja" },
        titleLines: [{ text: "Contoh Pratinjau" }, { text: "Templat Dokumen" }],
        standfirst: { text: "Dokumen contoh untuk melihat pengaruh parameter templat sebelum versi baru disimpan." },
        scopeLine: { text: "Berlaku untuk pratinjau editor parameter." },
      },
    },
    controlSheet: {
      mode: "auto",
      data: {
        kicker: { text: "Lembar Kendali" },
        title: { text: "Riwayat dan Verifikasi" },
        methodStatement: { text: "Angka diikat dari register; setiap klaim membawa tanda provenans." },
      },
    },
    toc: { mode: "field", title: { text: "Daftar Isi" } },
  },
  chapters: [
    {
      key: "1",
      kicker: { text: "Bab 1" },
      title: { text: "Ruang Lingkup Pekerjaan" },
      intro: [
        {
          type: "paragraph",
          role: "lede",
          text: "Bab ini merangkum lingkup, angka kunci, dan dasar perhitungan saluran.",
        },
      ],
      sections: [
        {
          title: { text: "Lingkup dan angka kunci" },
          blocks: [
            {
              type: "paragraph",
              role: "body",
              text: "Pekerjaan mencakup pemasangan saluran sepanjang 6.546,2 m beserta uji tekan dan serah terima.",
              rail: [
                { kind: "mark", mark: "TERUKUR" },
                { kind: "source", text: "Survei lapangan 2026" },
                { kind: "note", text: "Panjang diukur ulang pada 1 Oktober 2026." },
              ],
            },
            {
              type: "list",
              style: "bullet",
              items: [
                { text: "Penggalian dan pemasangan pipa." },
                { text: "Uji tekan per segmen 500 m." },
                { text: "Serah terima dengan berita acara." },
              ],
            },
            {
              type: "table",
              caption: { inline: { text: "Rekap volume dan harga per segmen." } },
              columns: [
                { role: "id", align: "left" },
                { role: "text", align: "left" },
                { role: "numeral", align: "right", unit: "m" },
                { role: "numeral", align: "right", unit: "Rp/m" },
              ],
              rows: [
                {
                  kind: "header",
                  cells: [{ text: "No" }, { text: "Segmen" }, { text: "Panjang" }, { text: "Harga satuan" }],
                },
                { kind: "body", cells: [{ text: "1" }, { text: "Utara" }, { text: "3.120,0" }, { text: "185.000" }] },
                { kind: "body", cells: [{ text: "2" }, { text: "Selatan" }, { text: "3.426,2" }, { text: "185.000" }] },
                { kind: "total", cells: [{ text: "" }, { text: "Jumlah" }, { text: "6.546,2" }, { text: "" }] },
              ],
              source: { inline: { text: "SUMBER  Survei lapangan 2026; penawaran pemasok A." }, provenance: ["TERUKUR", "PEMASOK"] },
            },
          ],
        },
        {
          title: { text: "Sebaran dan dasar biaya" },
          blocks: [
            {
              type: "chart",
              widthMm: 128,
              caption: { inline: { text: "Panjang saluran per segmen." } },
              source: { inline: { text: "SUMBER  Survei lapangan 2026." }, provenance: ["TERUKUR"] },
              spec: {
                $schema: "studio.chart/v1",
                kind: "P-01",
                title: "Panjang saluran per segmen.",
                source: "Survei lapangan 2026",
                widthMm: 128,
                unit: "m",
                dec: 1,
                data: {
                  shape: "categorical",
                  points: [
                    { label: "Utara", value: 3120 },
                    { label: "Selatan", value: 3426.2, accent: true },
                  ],
                },
              },
            },
            {
              type: "derivation",
              title: { text: "Biaya pemasangan saluran" },
              intro: { text: "Biaya diturunkan dari panjang terukur dan harga satuan pemasok." },
              lines: [
                { label: { text: "panjang saluran" }, value: { registerKey: "panjangSaluran" }, mark: "TERUKUR" },
                { label: { text: "harga satuan" }, value: { registerKey: "hargaSatuan" }, mark: "PEMASOK" },
              ],
              result: {
                label: { text: "biaya = panjang × harga satuan" },
                expr: "panjangSaluran * hargaSatuan",
                registerKey: "biayaSaluran",
                tol: 1,
              },
              closing: { text: "Bila harga satuan berubah, hanya baris biaya yang bergeser." },
            },
          ],
        },
      ],
    },
  ],
};

export interface DraftInput {
  slug: string;
  versionNo?: number;
  tier: StudioTier;
  draftOverrides: Readonly<Record<string, ParamValue>>;
}

/**
 * Dokumen yang dikirim ke /api/studio/validate: dokumen dasar (contoh bawaan
 * atau `sampleDocument` pemanggil) dengan templat, tier, dan override draf.
 * Override draf menimpa override dokumen dasar per kunci.
 */
export function withDraft(base: StudioDocV1, input: DraftInput): StudioDocV1 {
  const overrides: Record<string, ParamValue> = { ...(base.overrides ?? {}), ...input.draftOverrides };
  const doc: StudioDocV1 = {
    ...base,
    template: input.versionNo !== undefined ? { slug: input.slug, version: input.versionNo } : { slug: input.slug },
    meta: { ...base.meta, tier: input.tier },
  };
  if (Object.keys(overrides).length > 0) doc.overrides = overrides;
  else delete doc.overrides;
  return doc;
}

/**
 * Dokumen contoh `studio.doc/v2` pratinjau templat (FIX-V, FIX-U M5; D-139 konten-saja).
 *
 * Isi dibentuk dari KERANGKA draf: setiap slot aktif untuk tingkat terbitan yang jenisnya
 * dikenal (sampul, lembar kendali, daftar isi, pengesahan, bab, lampiran) mendapat isi
 * contoh; slot lain dibiarkan kosong (mesin memakai isi otomatis atau tanda kosong).
 * Hanya konten: tanpa medan tampilan (rupa sepenuhnya milik templat draf), tanpa `render`
 * (D-247). Kunci `sections` = `slotKey` kerangka sehingga kiriman selalu cocok dengan
 * susunan draf.
 *
 * Murni data: aman diimpor komponen klien.
 */
import type { StudioTier } from "@/lib/studio/contract/enums";
import type { TemplateSlotDef } from "@/lib/studio/contract/types/v2/template";

const t = (text: string) => ({ text });

const COVER = {
  type: "cover",
  tagline: t("STANDAR KERJA"),
  titleLines: [t("Contoh Pratinjau"), t("Templat Dokumen")],
  standfirst: t("Dokumen contoh untuk melihat pengaruh pengaturan templat sebelum versi baru disimpan."),
  scopeLine: t("Lingkup: pratinjau editor templat."),
  addressLine: t("Kepada tim penyusun templat"),
  colophon: { left: t("Divisi Engineering"), right: t("Oktober 2026") },
};

const CONTROL_SHEET = {
  type: "controlSheet",
  title: t("Kendali dokumen"),
  revisionHistory: {
    type: "registerTable",
    columns: [{ role: "id" }, { role: "text" }, { role: "text" }, { role: "text" }],
    rows: [
      { kind: "header", cells: [t("Rev"), t("Tanggal"), t("Uraian"), t("Oleh")] },
      { cells: [t("A"), t("2026-10-01"), t("Terbit pertama"), t("Divisi Engineering")] },
    ],
    preset: "revisionHistory",
  },
  methodStatement: t("Angka diikat dari sumber terukur; setiap klaim membawa tanda provenans."),
};

const SIGNATURE = {
  type: "signatureBlock",
  roles: [
    { role: t("Disusun"), holder: t("Penyusun dokumen"), date: t("2026-10-01") },
    { role: t("Diperiksa"), holder: t("Pemeriksa teknis"), date: t("2026-10-01") },
    { role: t("Disetujui"), holder: t("Kepala divisi"), date: t("2026-10-01") },
  ],
};

const TOC = { type: "toc" };

const CHAPTER_1 = {
  key: "1",
  title: t("Ruang lingkup pekerjaan"),
  intro: [{ type: "paragraph", text: "Bab ini merangkum lingkup dan angka kunci pemasangan saluran.", role: "lede" }],
  sections: [
    {
      title: t("Lingkup dan angka kunci"),
      blocks: [
        {
          type: "paragraph",
          text: "Pekerjaan mencakup pemasangan saluran sepanjang 6.546,2 m beserta uji tekan dan serah terima.",
          rail: [
            { kind: "mark", mark: "TERUKUR" },
            { kind: "source", text: "Survei lapangan 2026" },
          ],
        },
        {
          type: "list",
          ordered: false,
          items: [t("Penggalian dan pemasangan pipa."), t("Uji tekan per segmen 500 m."), t("Serah terima dengan berita acara.")],
        },
        {
          type: "table",
          columns: [{ role: "id" }, { role: "text" }, { role: "numeral" }],
          rows: [
            { kind: "header", cells: [t("No"), t("Segmen"), t("Panjang (m)")] },
            { cells: [t("1"), t("Utara"), t("3.120,0")] },
            { cells: [t("2"), t("Selatan"), t("3.426,2")] },
          ],
          caption: t("Panjang saluran per segmen."),
          source: t("Survei lapangan 2026."),
        },
      ],
    },
  ],
};

const CHAPTER_2 = {
  key: "2",
  title: t("Metode dan jadwal"),
  sections: [
    {
      title: t("Urutan kerja"),
      blocks: [
        { type: "paragraph", text: "Pemasangan dimulai dari segmen utara karena akses jalan lebih lebar." },
        { type: "list", ordered: true, items: [t("Mobilisasi alat."), t("Penggalian segmen utara."), t("Uji tekan dan penimbunan.")] },
      ],
    },
  ],
};

const APPENDIX_A = {
  key: "A",
  title: t("Glosarium"),
  sections: [
    {
      title: t("Istilah"),
      blocks: [
        {
          type: "glossary",
          columns: [{ role: "text" }, { role: "text" }],
          rows: [
            { kind: "header", cells: [t("Istilah"), t("Arti")] },
            { cells: [t("Uji tekan"), t("Pengujian kebocoran saluran dengan tekanan air.")] },
          ],
          caption: t("Istilah dokumen contoh."),
          source: t("Dokumen contoh pratinjau templat."),
        },
      ],
    },
  ],
};

/** Isi contoh per jenis slot (konten saja). `undefined` = slot dibiarkan kosong. */
function samplePayload(sectionType: string): Record<string, unknown> | undefined {
  switch (sectionType) {
    case "cover":
      return COVER;
    case "controlSheet":
      return CONTROL_SHEET;
    case "signatureBlock":
      return SIGNATURE;
    case "toc":
      return TOC;
    case "chapter":
      return { type: "chapter", chapters: [CHAPTER_1, CHAPTER_2] };
    case "appendix":
      return { type: "appendix", chapters: [APPENDIX_A] };
    default:
      return undefined;
  }
}

export interface SampleDocumentV2Input {
  /** Slug templat yang disunting (draf diresolusi server dari `draftTemplate`). */
  slug: string;
  tier: StudioTier;
  slots: ReadonlyArray<Pick<TemplateSlotDef, "slotKey" | "sectionType" | "tiers">>;
}

/** Kiriman `studio.doc/v2` contoh yang mengikuti kerangka draf (slot tidak aktif untuk tier dilewati). */
export function sampleDocumentV2(input: SampleDocumentV2Input): Record<string, unknown> {
  const sections: Record<string, unknown> = {};
  for (const s of input.slots) {
    if (Array.isArray(s.tiers) && s.tiers.length > 0 && !s.tiers.includes(input.tier)) continue;
    const payload = samplePayload(s.sectionType);
    if (payload) sections[s.slotKey] = payload;
  }
  return {
    $schema: "studio.doc/v2",
    template: { slug: input.slug },
    meta: {
      title: "Contoh Pratinjau Templat",
      docNumber: "001/GSP/KT/X/2026",
      rev: "A",
      tier: input.tier,
      author: "Divisi Engineering PT GSP",
      issueDate: "2026-10-01",
      custodian: "ENG-01",
      audience: "Tim penyusun templat",
    },
    sections,
  };
}

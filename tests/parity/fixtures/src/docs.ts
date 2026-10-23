/**
 * Dokumen `studio.doc/v1` korpus paritas (S63; kelas DX, PD, HT research/06 6.2).
 *
 * Bersama-sama mencakup 29 jenis section dokumen (registry/sections.ts S01-S29)
 * dan 3 tier:
 *  - doc_nota_memo        NOTA   : bab/seksi, 5 blok teks, 5 varian aside, tabel, chart CA P-01.
 *  - doc_nota_tables      NOTA   : 11 jenis keluarga tabel + semua preset (registerTable 8,
 *                                  financialTable 3), sel gabung (gridSpan, vMerge), tabel
 *                                  bersarang, kedua penempatan SUMBER, lampiran.
 *  - doc_terbit_report    TERBIT : sampul/lembar kendali auto, daftar isi field, bagian,
 *                                  tanda tangan, perangkat halaman, rel bukti moda A,
 *                                  chart CA P-02, diagram, gambar raster, lembar simbol, lampiran.
 *  - doc_serah_handover   SERAH  : halaman depan explicit (blok, perangkat, spacer, controlBlock,
 *                                  colophon, signatureBlock), daftar isi statis, register +
 *                                  turunan (result + verdict), rel bukti moda B, rekonsiliasi,
 *                                  chart CA P-11, diagram sld, lampiran.
 * Moda rel bukti lewat override kelas B `layout.railMode` (P4G-16, KT-07).
 *
 * SR-41 (D-138/D-139/D-243): dokumen di bawah adalah SUMBER bertampilan; yang ditulis
 * `build_fixtures.ts` adalah keluaran `toContentOnlyDoc` (scripts/parity/run/lib/content_only.ts):
 *  - `doc/<stem>.json`          studio.doc/v1 konten-saja (medan tampilan dibuang terpandu adaptor;
 *                               sisa hanya medan wajib skema v1);
 *  - `doc/<stem>.template.json` profil tampilan pendamping (override dokumen, mis. `layout.railMode`);
 *  - `doc/v2/<stem>.json`       salinan studio.doc/v2 (0 medan tampilan DF-01..DF-69).
 * Bangun ulang menghasilkan berkas yang sama (deterministik).
 */
import type {
  Block,
  ControlBlock,
  DeviceBlock,
  FlowItem,
  Inline,
  ParaFormat,
  SectionSetup,
  SignatureBlock,
  StudioDocV1,
  StudioDocV2,
  StudioTier,
  TableBlock,
} from "../../../../src/lib/studio/contract";
import { CHART_FIXTURES } from "./charts";
import { DG_FLOW, DG_TOPOLOGY } from "./diagrams";
import {
  ISSUE_DATE,
  TEMPLATE,
  cap,
  cell,
  colId,
  colNum,
  colText,
  colUnit,
  floorPlanAsset,
  logoAsset,
  row,
  src,
  table,
  tx,
} from "./kit";
import { toContentOnlyDoc, type TemplateProfileJson } from "../../../../scripts/parity/run/lib/content_only";

interface AuthoredDocFixture {
  id: string;
  file: string;
  tier: StudioTier;
  doc: StudioDocV1;
  notes: string;
  /**
   * Tampilan sumber yang punya padanan parameter templat global, diangkat ke profil pendamping
   * (D-138/D-139/D-248). Nilai per instans (lebar kolom, rata per kolom, arsir sel, penempatan
   * SUMBER per tabel) tidak punya padanan templat dan tetap dibuang.
   */
  templateOverrides?: Record<string, unknown>;
}

export interface DocFixture extends AuthoredDocFixture {
  /** Dokumen v1 konten-saja (yang ditulis ke `file`). */
  doc: StudioDocV1;
  /** Profil tampilan pendamping `doc/<stem>.template.json` (bila sumber membawa override). */
  templateFile?: string;
  template?: TemplateProfileJson;
  /** Salinan studio.doc/v2 `doc/v2/<stem>.json`. */
  v2File: string;
  v2: StudioDocV2;
}

const SRC_NOTE = "Data ilustratif korpus paritas S63 (sintetis, bukan data klien).";

const A4: SectionSetup = {
  pageSizeTw: [11906, 16838],
  marginTw: { top: 1134, bottom: 1134, left: 1418, right: 1134, header: 567, footer: 567, gutter: 0 },
};

const chartSpec = (code: string) => {
  const f = CHART_FIXTURES.find((c) => c.code === code);
  if (!f) throw new Error(`chart fixture ${code} tidak ada`);
  return f.spec;
};

const para = (text: string, role?: Extract<Block, { type: "paragraph" }>["role"]): Block =>
  role ? { type: "paragraph", role, text } : { type: "paragraph", text };

const spacer = (after = 120): FlowItem => ({ type: "spacer", format: { spacingBeforeTw: 0, spacingAfterTw: after } });

const device = (d: DeviceBlock["device"], extra: Omit<DeviceBlock, "type" | "device"> = {}): DeviceBlock => ({ type: "device", device: d, ...extra });

const runsWithProps: Inline = {
  runs: [
    { t: "Nilai " },
    { t: "terukur", b: true },
    { t: " ditandai dengan kode " },
    { t: "TRK-01", faceRole: "mono" },
    { t: " dan dicetak " },
    { t: "kapital kecil", caps: true },
    { t: "; catatan kaki", i: true },
    { t: "1", vertAlign: "superscript" },
    { t: "." },
  ],
};

// ══ 1. NOTA: memo ════════════════════════════════════════════════════════

const NOTA_MEMO: StudioDocV1 = {
  $schema: "studio.doc/v1",
  template: TEMPLATE,
  mission: { folder: "2026-10-20_nota-pompa-air" },
  meta: {
    title: "Nota teknis perawatan pompa air bersih gedung kantor",
    docNumber: "001/GSP/KT/X/2026",
    rev: "A",
    typeCode: "KT",
    tier: "NOTA",
    classification: "BIASA",
    language: "ID",
    author: "Tim Fasilitas",
    issueDate: ISSUE_DATE,
    audience: "Pengelola gedung",
    subject: "Perawatan pompa",
    urgency: "biasa",
  },
  chapters: [
    {
      key: "1",
      blockId: "nota-ch1",
      kicker: tx("BAB 1"),
      title: tx("Ringkasan temuan"),
      intro: [
        para(
          "Nota ini disusun Tim Fasilitas untuk pengelola gedung: dua dari tiga pompa memerlukan penggantian segel dalam 30 hari, dengan jangkar terukur getaran 7,1 mm/s.",
          "identity",
        ),
      ],
      sections: [
        {
          blockId: "nota-1-1",
          title: tx("Kondisi pompa"),
          blocks: [
            para("Pemeriksaan dilakukan pada **tiga pompa** transfer di ruang pompa lantai dasar.", "lede"),
            para("Getaran pompa P-2 mencapai 7,1 mm/s, di atas batas *zona B* yang dipakai pemeliharaan.", "anchor"),
            { type: "paragraph", ...runsWithProps },
            {
              type: "list",
              style: "bullet",
              items: [tx("Pompa P-1 normal; segel kering."), tx("Pompa P-2 bergetar; bantalan perlu diperiksa."), tx("Pompa P-3 bocor halus pada segel mekanis.")],
            },
            {
              type: "list",
              style: "number",
              items: [tx("Ganti segel P-3 minggu ini."), tx("Ukur ulang getaran P-2 sesudah penyeimbangan."), tx("Laporkan hasil ke pengelola gedung.")],
            },
            {
              type: "assumptionInline",
              asmId: "ASM-FAS-01",
              text: "Jam operasi rata-rata pompa dianggap 16 jam per hari.",
              impact: "Bila jam operasi lebih tinggi, interval penggantian segel memendek.",
            },
            {
              type: "monoBlock",
              label: tx("Catatan ukur"),
              lines: [tx("P-1  getaran 2,3 mm/s  suhu bantalan 41 C"), tx("P-2  getaran 7,1 mm/s  suhu bantalan 58 C"), tx("P-3  getaran 3,0 mm/s  suhu bantalan 44 C")],
            },
          ],
        },
        {
          blockId: "nota-1-2",
          title: tx("Data pengukuran"),
          blocks: [
            table("table", {
              caption: "Hasil ukur getaran dan suhu bantalan per pompa.",
              source: SRC_NOTE,
              columns: [colId(18), colNum("mm/s"), colNum("C"), colText()],
              header: ["Pompa", "Getaran (mm/s)", "Suhu (C)", "Status"],
              body: [
                ["P-1", "2,3", "41", "Normal"],
                ["P-2", "7,1", "58", "Periksa"],
                ["P-3", "3,0", "44", "Bocor halus"],
              ],
            }),
            {
              type: "chart",
              spec: chartSpec("P-01"),
              caption: cap("Pendingin menyumbang waktu henti terbesar pada kuartal ini."),
              source: src(SRC_NOTE, ["TERUKUR"]),
              keyRow: tx("Batang beraksen = subsistem dengan waktu henti terbesar."),
              widthMm: 128,
            },
            para("Hasil ini menjadi dasar usulan anggaran perawatan triwulan berikut.", "pivot"),
          ],
        },
      ],
    },
    {
      key: "2",
      kicker: tx("BAB 2"),
      title: tx("Pedoman tindak"),
      sections: [
        {
          title: tx("Aturan dan pengingat"),
          blocks: [
            { type: "aside", variant: "generic", label: tx("Catatan"), body: [tx("Segel mekanis tidak boleh dijalankan kering.")] },
            { type: "aside", variant: "doctrine", label: tx("Doktrin"), body: [tx("Ukur dulu, baru ganti; penggantian tanpa ukur ulang tidak dicatat sebagai perbaikan.")] },
            { type: "aside", variant: "story", label: tx("Kisah lapangan"), body: [tx("Pompa serupa di gedung lain gagal karena bantalan tidak dilumasi selama setahun.")] },
            { type: "aside", variant: "quickCheck", label: tx("Cek cepat"), body: [tx("Getaran di bawah 4,5 mm/s?"), tx("Suhu bantalan di bawah 60 C?")] },
            { type: "aside", variant: "ifInDoubt", label: tx("Bila ragu"), body: [tx("Hentikan pompa dan hubungi teknisi jaga.")] },
            para("Rincian prosedur", "subheading"),
            para("Prosedur lengkap tersedia di buku perawatan gedung, bagian pompa.", "note"),
            para("Mohon pengelola gedung menyetujui penggantian segel P-3 paling lambat 27 Oktober 2026.", "closingAction"),
          ],
        },
      ],
    },
  ],
  outputs: ["docx", "pdf", "html"],
};

// ══ 2. NOTA: tabel keluarga lengkap ══════════════════════════════════════

const nested: TableBlock = {
  type: "table",
  columns: [colText(), colNum()],
  rows: [row(["Sub-butir", "Nilai"], "header"), row(["Segel", "2"]), row(["Bantalan", "4"])],
};

const TABLES_ALL: Array<Block> = [
  table("table", {
    caption: "Tabel umum dengan sel gabung mendatar dan menurun.",
    source: SRC_NOTE,
    sourcePlacement: "lastRowMerged",
    columns: [colId(16), colText(), colNum("unit"), colNum("unit")],
    body: [
      { kind: "header", repeatHeader: true, cells: [cell("Kode", { vMerge: "restart" }), cell("Uraian", { vMerge: "restart" }), cell("Jumlah", { gridSpan: 2, vAlign: "center" })] },
      { kind: "header", cells: [cell("", { vMerge: "continue" }), cell("", { vMerge: "continue" }), cell("Rencana"), cell("Realisasi")] },
      { kind: "group", cells: [cell("Kelompok mekanikal", { gridSpan: 4, shading: { fill: "EDEAE3", val: "clear" } })] },
      row(["M-01", "Pompa transfer", "3", "3"]),
      row(["M-02", "Kipas ventilasi", "6", "5"]),
      { kind: "total", cells: [cell("Jumlah", { gridSpan: 2 }), cell("9"), cell("8")] },
    ],
  }),
  table("specTable", {
    caption: "Spesifikasi pompa transfer pengganti.",
    source: SRC_NOTE,
    sourcePlacement: "paragraphBelow",
    columns: [colText(), colText(), colNum(), colUnit()],
    header: ["Parameter", "Syarat", "Nilai", "Satuan"],
    body: [
      ["Debit", "minimum", "12", "m3/jam"],
      ["Tinggi tekan", "minimum", "35", "m"],
      ["Daya motor", "maksimum", "3,0", "kW"],
    ],
  }),
  table("exampleWrongRight", {
    caption: "Contoh penulisan angka salah dan benar.",
    source: SRC_NOTE,
    columns: [colText(), colText()],
    header: ["Salah", "Benar"],
    body: [
      ["1.5 kW", "1,5 kW"],
      ["10000 jam", "10.000 jam"],
    ],
  }),
  table("ruleTable", {
    caption: "Aturan penandaan hasil ukur.",
    source: SRC_NOTE,
    columns: [colId(16), colText()],
    header: ["ID", "Aturan"],
    body: [
      ["AT-01", "Setiap angka ukur membawa tanda asal."],
      ["AT-02", "Angka turunan menyebut rumus dan sumbernya."],
    ],
  }),
  table("checklist", {
    caption: "Daftar periksa sebelum pompa dinyalakan.",
    source: SRC_NOTE,
    columns: [colText(), colText(20)],
    header: ["Butir", "Status"],
    body: [
      ["Katup isap terbuka", "Ya"],
      ["Segel terendam", "Ya"],
      ["Arah putaran benar", "Belum"],
    ],
  }),
  table("glossary", {
    caption: "Istilah yang dipakai nota.",
    source: SRC_NOTE,
    columns: [colText(), colText()],
    header: ["Istilah", "Arti"],
    body: [
      ["Segel mekanis", "Perapat poros pompa berbahan cincin geser."],
      ["Tinggi tekan", "Tinggi kolom air yang dapat dinaikkan pompa."],
    ],
  }),
  table("sourceRegister", {
    caption: "Daftar sumber nota.",
    source: SRC_NOTE,
    columns: [colId(16), colText(), colText()],
    header: ["Kode", "Sumber", "Edisi"],
    body: [
      ["SR-01", "Buku perawatan gedung", "2025"],
      ["SR-02", "Lembar data pompa pemasok", "rev 3"],
    ],
  }),
  table("ruleIndex", {
    caption: "Indeks aturan menurut bab.",
    source: SRC_NOTE,
    columns: [colId(16), colText(), colText()],
    header: ["ID", "Aturan", "Bab"],
    body: [
      ["AT-01", "Tanda asal angka", "1"],
      ["AT-02", "Rumus turunan", "2"],
    ],
  }),
  table("referenceScale", {
    caption: "Skala acuan tingkat getaran.",
    source: SRC_NOTE,
    columns: [colId(16), colText(), colNum("mm/s")],
    header: ["Zona", "Arti", "Batas atas"],
    body: [
      ["A", "Baru dipasang", "2,3"],
      ["B", "Layak operasi terus", "4,5"],
      ["C", "Operasi terbatas", "7,1"],
    ],
  }),
  {
    ...table("table", {
      caption: "Tabel dengan tabel bersarang dan sel kosong.",
      source: SRC_NOTE,
      columns: [colText(), colText()],
      header: ["Butir", "Rincian"],
      body: [
        [cell("Paket perbaikan"), { paragraphs: [tx("Rincian di bawah:")], nested, nestedIndex: 1 }],
        [cell("Catatan"), { paragraphs: [] }],
      ],
    }),
    layout: { widthTw: 9354, indentTw: 0, cellMarginTw: { left: 85, right: 85 }, fixed: true },
  },
];

const REGISTER_PRESETS: Array<[string, string, string[], string[][]]> = [
  ["assumption", "Register asumsi.", ["ID", "Asumsi", "Dasar", "Dampak"], [["ASM-FAS-01", "Jam operasi 16 jam per hari", "Log operasi", "Interval segel"]]],
  // D-269: tabel data numerik wajib bersatuan (DATUM-09 / HS c09): satuan di kepala kolom (isi, bukan medan tampilan).
  ["reconciliation", "Rekonsiliasi dua rute hitung.", ["ID", "Besaran", "Rute 1 (m³/jam)", "Rute 2 (m³/jam)"], [["RK-01", "Debit total", "36", "36"]]],
  ["finding", "Register temuan.", ["ID", "Temuan", "Tingkat", "Tindak"], [["TM-01", "Getaran P-2 tinggi", "Sedang", "Penyeimbangan"]]],
  ["regulation", "Register peraturan.", ["Peraturan", "Pasal", "Isi", "Status"], [["Pedoman perawatan gedung", "4", "Interval perawatan", "Berlaku"]]],
  ["standardEdition", "Register edisi standar.", ["Standar", "Edisi", "Ruang lingkup", "Status"], [["Standar getaran mesin", "2016", "Zona getaran", "Berlaku"]]],
  ["improvement", "Register perbaikan.", ["ID", "Usulan", "Pemilik", "Tenggat"], [["PB-01", "Pasang sensor getaran tetap", "Tim Fasilitas", "2026-12"]]],
  ["revisionHistory", "Riwayat revisi.", ["Rev", "Tanggal", "Uraian", "Oleh"], [["A", ISSUE_DATE, "Terbit pertama", "Tim Fasilitas"]]],
  ["distribution", "Daftar distribusi.", ["No", "Penerima", "Bentuk", "Salinan"], [["1", "Pengelola gedung", "PDF", "1"]]],
];

const registerTables = (prefix: string, only?: readonly string[]): Block[] =>
  REGISTER_PRESETS.filter(([preset]) => !only || only.includes(preset)).map(([preset, caption, header, body]) =>
    table("registerTable", {
      blockId: `${prefix}-reg-${preset}`,
      preset,
      caption,
      source: SRC_NOTE,
      columns: [colId(22), colText(), colText(), colText()],
      header,
      body,
    }),
  );

const FIN_TABLES: Block[] = [
  table("financialTable", {
    preset: "boq",
    caption: "Daftar kuantitas dan harga perbaikan pompa.",
    source: SRC_NOTE,
    columns: [colId(14), colText(), colNum(), colUnit(), colNum("rupiah"), colNum("rupiah")],
    header: ["No", "Uraian", "Volume", "Satuan", "Harga satuan", "Jumlah"],
    body: [
      ["1", "Segel mekanis", "2", "set", "1.850.000", "3.700.000"],
      ["2", "Bantalan", "4", "buah", "420.000", "1.680.000"],
      { kind: "total", cells: [cell("Jumlah", { gridSpan: 2 }), cell(""), cell(""), cell(""), cell("5.380.000")] },
    ],
  }),
  table("financialTable", {
    preset: "ahs",
    caption: "Analisa harga satuan penggantian segel.",
    source: SRC_NOTE,
    columns: [colId(14), colText(), colNum(), colNum("rupiah")],
    header: ["Kode", "Komponen", "Koefisien", "Harga"],
    body: [
      ["T-01", "Teknisi", "0,5", "175.000"],
      ["B-01", "Segel mekanis", "1", "1.850.000"],
      { kind: "total", cells: [cell("Harga satuan", { gridSpan: 2 }), cell(""), cell("2.025.000")] },
    ],
  }),
  table("financialTable", {
    preset: "recap",
    caption: "Rekapitulasi biaya perbaikan.",
    source: SRC_NOTE,
    columns: [colId(14), colText(), colNum("rupiah")],
    header: ["No", "Uraian", "Jumlah"],
    body: [
      ["1", "Material", "5.380.000"],
      ["2", "Upah", "700.000"],
      { kind: "total", cells: [cell("Total", { gridSpan: 2 }), cell("6.080.000")] },
    ],
  }),
];

const NOTA_TABLES: StudioDocV1 = {
  $schema: "studio.doc/v1",
  template: TEMPLATE,
  meta: {
    title: "Katalog tabel keluarga lengkap untuk uji paritas",
    docNumber: "002/GSP/STD/X/2026",
    rev: "A",
    typeCode: "STD",
    tier: "NOTA",
    classification: "BIASA",
    language: "ID",
    author: "Tim Fasilitas",
    issueDate: ISSUE_DATE,
  },
  chapters: [
    {
      key: "1",
      title: tx("Keluarga tabel"),
      setup: A4,
      intro: [para("Bab ini memuat setiap jenis tabel keluarga beserta sel gabung dan tabel bersarang.", "identity")],
      sections: [
        { title: tx("Tabel umum dan spesifikasi"), blocks: TABLES_ALL },
        { title: tx("Tabel register delapan preset"), blocks: registerTables("tbl") },
        { title: tx("Tabel keuangan tiga preset"), blocks: [...FIN_TABLES, para("Mohon tim pengadaan memeriksa rekapitulasi ini sebelum 30 Oktober 2026.", "closingAction")] },
      ],
    },
  ],
  appendices: [
    {
      key: "A",
      title: tx("Tabel lampiran"),
      sections: [
        {
          title: tx("Data mentah"),
          blocks: [
            table("table", {
              caption: "Data mentah getaran per jam.",
              source: SRC_NOTE,
              columns: [colText(), colNum("mm/s"), colNum("mm/s"), colNum("mm/s")],
              header: ["Jam", "P-1", "P-2", "P-3"],
              body: [
                ["08:00", "2,2", "6,9", "2,9"],
                ["12:00", "2,4", "7,2", "3,1"],
                ["16:00", "2,3", "7,1", "3,0"],
              ],
            }),
          ],
        },
      ],
    },
  ],
};

// ══ 3. TERBIT: laporan ═══════════════════════════════════════════════════

const control: ControlBlock = {
  type: "controlBlock",
  rows: [
    [tx("Nomor"), tx("003/GSP/KT/X/2026"), tx("Revisi"), tx("A")],
    [tx("Tanggal"), tx(ISSUE_DATE), tx("Klasifikasi"), tx("TERBATAS")],
  ],
};

const signature: SignatureBlock = {
  type: "signatureBlock",
  roles: [
    { role: tx("Disusun"), holder: tx("Penyusun laporan"), date: tx(ISSUE_DATE) },
    { role: tx("Diperiksa"), holder: tx("Pemeriksa teknis"), date: tx(ISSUE_DATE) },
    { role: tx("Disetujui"), holder: tx("Kepala fasilitas"), date: tx(ISSUE_DATE) },
  ],
};

const railA = (label: string): Extract<Block, { type: "paragraph" }>["rail"] => [
  { kind: "mark", mark: "TERUKUR", label },
  { kind: "source", text: "Log sensor suhu, Oktober 2026" },
];

const TERBIT_REPORT: StudioDocV1 = {
  $schema: "studio.doc/v1",
  template: TEMPLATE,
  meta: {
    title: "Kajian pemantauan suhu ruang server",
    docNumber: "003/GSP/KT/X/2026",
    rev: "A",
    typeCode: "KT",
    tier: "TERBIT",
    classification: "TERBATAS",
    language: "ID",
    author: "Tim Infrastruktur",
    issueDate: ISSUE_DATE,
    custodian: "Kepala fasilitas",
    audience: "Manajemen operasi",
    basis: "Permintaan kajian internal",
    issueNumber: 1,
    copyControl: "Salinan terkendali 1 dari 3",
  },
  overrides: { "layout.railMode": "A" },
  front: {
    cover: {
      mode: "auto",
      data: {
        kicker: tx("KAJIAN TEKNIS"),
        titleLines: [tx("Kajian pemantauan"), tx("suhu ruang server")],
        standfirst: tx("Dua ruang server melampaui batas suhu 27 C pada jam sibuk; kajian mengusulkan penambahan satu unit pendingin."),
        scopeLine: tx("Lingkup: ruang server lantai 2 dan 3, Juli sampai September 2026."),
        addressLine: tx("Kepada manajemen operasi"),
        control,
        colophon: { type: "colophon", left: tx("Tim Infrastruktur"), right: tx("Oktober 2026") },
        identityString: tx("Kajian teknis oleh Tim Infrastruktur untuk manajemen operasi; jangkar terukur: puncak suhu 29,4 C."),
      },
      setup: A4,
    },
    controlSheet: {
      mode: "auto",
      data: {
        kicker: tx("LEMBAR KENDALI"),
        title: tx("Kendali dokumen"),
        revisionHistory: table("registerTable", {
          preset: "revisionHistory",
          columns: [colId(14), colText(), colText(), colText()],
          header: ["Rev", "Tanggal", "Uraian", "Oleh"],
          body: [["A", ISSUE_DATE, "Terbit pertama", "Tim Infrastruktur"]],
        }),
        verificationChain: table("table", {
          columns: [colText(), colText(), colText()],
          header: ["Peran", "Nama jabatan", "Tanggal"],
          body: [
            ["Penyusun", "Analis infrastruktur", ISSUE_DATE],
            ["Pemeriksa", "Insinyur senior", ISSUE_DATE],
          ],
        }),
        methodStatement: tx("Suhu dibaca sensor setiap menit, dirata-rata per jam, dan dibandingkan dengan batas 27 C."),
        distribution: table("registerTable", {
          preset: "distribution",
          columns: [colId(14), colText(), colText(), colText()],
          header: ["No", "Penerima", "Bentuk", "Salinan"],
          body: [
            ["1", "Manajemen operasi", "PDF", "1"],
            ["2", "Kepala fasilitas", "Cetak", "1"],
          ],
        }),
      },
    },
    toc: {
      mode: "field",
      kicker: tx("DAFTAR ISI"),
      title: tx("Isi kajian"),
      note: tx("Nomor halaman diperbarui saat dokumen dibuka."),
      sealBand: device("sealBand", { left: tx("TERBATAS"), right: tx("003/GSP/KT/X/2026") }),
    },
    signature,
  },
  parts: [
    {
      id: "P1",
      label: tx("Bagian I"),
      title: tx("Kondisi saat ini"),
      lede: tx("Data suhu dan tata letak ruang server."),
      chapterKeys: ["1", "2"],
      showChapterList: true,
      body: [device("spineString", { text: tx("003/GSP/KT/X/2026 REV A") }), device("issueStamp", { left: tx("TERBIT"), right: tx(ISSUE_DATE) })],
    },
    {
      id: "P2",
      label: tx("Bagian II"),
      title: tx("Usulan"),
      chapterKeys: ["3"],
    },
  ],
  chapters: [
    {
      key: "1",
      partId: "P1",
      kicker: tx("BAB 1"),
      title: tx("Data suhu"),
      runningHeadTitle: "Data suhu",
      intro: [
        device("datumRule", { widthMm: 128 }),
        para("Kajian ini disusun Tim Infrastruktur untuk manajemen operasi; jangkar terukur: puncak suhu 29,4 C di ruang lantai 3.", "identity"),
      ],
      sections: [
        {
          title: tx("Pengukuran"),
          blocks: [
            { type: "paragraph", text: "Suhu rata-rata jam sibuk ruang lantai 3 mencapai 28,6 C.", rail: railA("28,6 C") },
            {
              type: "list",
              style: "bullet",
              items: [
                { text: "Ruang lantai 2: puncak 27,8 C.", rail: [{ kind: "mark", mark: "TERUKUR", label: "27,8 C" }] },
                { text: "Ruang lantai 3: puncak 29,4 C.", rail: [{ kind: "note", text: "Melampaui batas" }] },
              ],
            },
            {
              type: "chart",
              spec: chartSpec("P-02"),
              caption: cap("Jumlah tiket perawatan naik setiap tahun sejak 2023."),
              source: src(SRC_NOTE),
              widthMm: 128,
            },
          ],
        },
        {
          title: tx("Tata letak"),
          blocks: [
            {
              type: "image",
              asset: "denah_ruang",
              caption: cap("Denah ilustratif ruang server lantai 3."),
              source: src("Gambar ilustratif korpus paritas S63."),
              widthMm: 128,
            },
            {
              type: "diagram",
              spec: DG_TOPOLOGY,
              caption: cap("Jaringan pemantauan menghubungkan sensor lantai ke server pusat lewat dua sakelar."),
              source: src(SRC_NOTE),
              keyRow: tx("Garis tebal berwarna = jalur utama."),
              widthMm: 166,
            },
          ],
        },
      ],
    },
    {
      key: "2",
      partId: "P1",
      kicker: tx("BAB 2"),
      title: tx("Analisis"),
      sections: [
        {
          title: tx("Prosedur dan aturan"),
          blocks: [
            {
              type: "diagram",
              spec: DG_FLOW,
              caption: cap("Prosedur penanganan alarm suhu berakhir pada laporan penutupan."),
              source: src(SRC_NOTE),
              widthMm: 128,
            },
            table("ruleTable", {
              caption: "Aturan batas suhu ruang server.",
              source: SRC_NOTE,
              columns: [colId(16), colText()],
              header: ["ID", "Aturan"],
              body: [
                ["SU-01", "Suhu masuk rak tidak melebihi 27 C."],
                ["SU-02", "Kelembapan relatif dijaga 40 sampai 60 persen."],
              ],
            }),
            table("checklist", {
              caption: "Daftar periksa harian ruang server.",
              source: SRC_NOTE,
              columns: [colText(), colText()],
              header: ["Butir", "Status"],
              body: [
                ["Pintu rak tertutup", "Ya"],
                ["Filter pendingin bersih", "Belum"],
              ],
            }),
            {
              type: "symbolSheet",
              dialect: "iec",
              cols: 3,
              caption: cap("Lembar simbol IEC yang dipakai gambar kelistrikan."),
              source: src("datumsimbol.py lembar iec (Garis A)."),
              widthMm: 166,
            },
          ],
        },
      ],
    },
    {
      key: "3",
      partId: "P2",
      kicker: tx("BAB 3"),
      title: tx("Usulan dan penutup"),
      sections: [
        {
          title: tx("Usulan"),
          blocks: [
            para("Penambahan satu unit pendingin 7 kW menurunkan suhu puncak di bawah batas.", "pivot"),
            table("specTable", {
              caption: "Spesifikasi pendingin usulan.",
              source: SRC_NOTE,
              columns: [colText(), colText(), colNum(), colUnit()],
              header: ["Parameter", "Syarat", "Nilai", "Satuan"],
              body: [
                ["Kapasitas", "minimum", "7", "kW"],
                ["Aliran udara", "minimum", "1.800", "m3/jam"],
              ],
            }),
            para("Mohon manajemen operasi menyetujui pengadaan pendingin paling lambat 15 November 2026.", "closingAction"),
          ],
        },
      ],
    },
  ],
  appendices: [
    {
      key: "A",
      title: tx("Glosarium dan sumber"),
      sections: [
        {
          title: tx("Istilah"),
          blocks: [
            table("glossary", {
              caption: "Istilah kajian.",
              source: SRC_NOTE,
              columns: [colText(), colText()],
              header: ["Istilah", "Arti"],
              body: [["Suhu masuk rak", "Suhu udara pada sisi masuk rak perangkat."]],
            }),
            table("sourceRegister", {
              caption: "Daftar sumber kajian.",
              source: SRC_NOTE,
              columns: [colId(16), colText(), colText(), colText()],
              header: ["Kode", "Sumber", "Edisi", "Nilai"],
              body: [["SR-01", "Log sensor suhu", "Oktober 2026", "A1"]],
            }),
          ],
        },
      ],
    },
  ],
  assets: { denah_ruang: floorPlanAsset() },
};

// ══ 4. SERAH: paket serah terima ═════════════════════════════════════════

const runningHead: SectionSetup = {
  ...A4,
  header: { mode: "runningHead", left: tx("004/GSP/BA/X/2026"), right: tx("Paket serah terima catu daya") },
  footer: { mode: "registerBlock", cells: [tx("TERBATAS"), tx("REV A"), { runs: [{ t: "Halaman " }, { field: "PAGE" }, { t: " dari " }, { field: "NUMPAGES" }] }] },
};

const kickerFmt: ParaFormat = { spacingBeforeTw: 0, spacingAfterTw: 120, jc: "left" };

const railB = (mark: "TERUKUR" | "DITURUNKAN" | "PEMASOK" | "ASUMSI", label: string, source: string) => [
  { kind: "mark" as const, mark, label },
  { kind: "source" as const, text: source },
];

const SERAH_HANDOVER: StudioDocV1 = {
  $schema: "studio.doc/v1",
  template: TEMPLATE,
  meta: {
    title: "Paket serah terima sistem catu daya cadangan",
    docNumber: "004/GSP/BA/X/2026",
    rev: "A",
    typeCode: "BA",
    tier: "SERAH",
    classification: "TERBATAS",
    language: "ID",
    author: "Tim Proyek Daya",
    issueDate: ISSUE_DATE,
    custodian: "Kepala fasilitas",
    audience: "Pemilik gedung",
    basis: "Kontrak pemasangan catu daya cadangan",
    subject: "Serah terima",
    urgency: "segera",
    issueNumber: 1,
  },
  overrides: { "layout.railMode": "B" },
  register: {
    beban_puncak_kw: { v: 18.4, dec: 1, unit: "kW", mark: "TERUKUR", src: "Log analisa daya 7 hari" },
    faktor_cadangan: { v: 1.25, dec: 2, unit: "kali", mark: "ASUMSI", src: "Kebijakan cadangan 25 persen" },
    kapasitas_perlu_kw: { v: 23, dec: 1, unit: "kW", mark: "DITURUNKAN", src: "beban_puncak_kw x faktor_cadangan" },
    kapasitas_ups_kw: { v: 30, dec: 1, unit: "kW", mark: "PEMASOK", src: "Lembar data UPS pemasok, nilai Admiralty B2" },
    rasio_pakai: { v: 0.77, dec: 2, unit: "rasio", mark: "DITURUNKAN", src: "kapasitas_perlu_kw / kapasitas_ups_kw" },
  },
  front: {
    cover: {
      mode: "explicit",
      setup: A4,
      body: [
        device("logo", { asset: "logo_ilustrasi", widthMm: 40, heightMm: 13.3 }),
        device("hairline"),
        { type: "paragraph", role: "kicker", text: "BERITA ACARA SERAH TERIMA", format: kickerFmt },
        { type: "paragraph", role: "title", text: "Paket serah terima" },
        { type: "paragraph", role: "title", text: "sistem catu daya cadangan" },
        { type: "paragraph", role: "standfirst", text: "UPS 30 kW terpasang dan lulus uji beban; kapasitas cukup untuk beban puncak terukur dengan cadangan 25 persen." },
        { type: "paragraph", role: "scopeLine", text: "Lingkup: UPS, panel distribusi, dan genset ruang server." },
        { type: "paragraph", role: "addressLine", text: "Kepada pemilik gedung" },
        spacer(240),
        {
          type: "controlBlock",
          rows: [
            [tx("Nomor"), tx("004/GSP/BA/X/2026"), tx("Revisi"), tx("A")],
            [tx("Tanggal"), tx(ISSUE_DATE), tx("Klasifikasi"), tx("TERBATAS")],
          ],
          colsTw: [1600, 3106, 1600, 3106],
        },
        { type: "colophon", left: tx("Tim Proyek Daya"), right: tx("Oktober 2026"), colsTw: [4706, 4706] },
        device("sealBand", { left: tx("TERBATAS"), right: tx("004/GSP/BA/X/2026"), colsTw: [4706, 4706] }),
      ],
    },
    controlSheet: {
      mode: "explicit",
      body: [
        { type: "paragraph", role: "kicker", text: "LEMBAR KENDALI" },
        { type: "paragraph", role: "pageTitle", text: "Kendali dokumen" },
        { type: "paragraph", role: "blockHeading", text: "Riwayat revisi" },
        table("registerTable", {
          preset: "revisionHistory",
          columns: [colId(14), colText(), colText(), colText()],
          header: ["Rev", "Tanggal", "Uraian", "Oleh"],
          body: [["A", ISSUE_DATE, "Terbit pertama untuk serah terima", "Tim Proyek Daya"]],
        }),
        { type: "paragraph", role: "blockHeading", text: "Rantai verifikasi" },
        table("table", {
          columns: [colText(), colText(), colText()],
          header: ["Peran", "Nama jabatan", "Tanggal"],
          body: [
            ["Penyusun", "Insinyur proyek", ISSUE_DATE],
            ["Pemeriksa independen", "Insinyur mutu", ISSUE_DATE],
          ],
        }),
        { type: "paragraph", role: "methodStatement", text: "Angka beban diukur analisa daya tujuh hari; kapasitas dihitung ulang lewat dua rute dan direkonsiliasi di Bab 1." },
        { type: "paragraph", role: "blockHeading", text: "Distribusi" },
        table("registerTable", {
          preset: "distribution",
          columns: [colId(14), colText(), colText(), colText()],
          header: ["No", "Penerima", "Bentuk", "Salinan"],
          body: [["1", "Pemilik gedung", "Cetak", "1"]],
        }),
        {
          type: "signatureBlock",
          roles: [
            { role: tx("Diserahkan"), holder: tx("Manajer proyek") },
            { role: tx("Diterima"), holder: tx("Kepala fasilitas") },
          ],
          rowOrder: ["role", "sign", "holder"],
        },
      ],
    },
    toc: {
      mode: "static",
      kicker: tx("DAFTAR ISI"),
      title: tx("Isi paket"),
      entries: [
        { level: "part", label: tx("Bagian I"), title: tx("Bukti teknis"), page: "4" },
        { level: "chapter", label: tx("Bab 1"), title: tx("Kapasitas dan rekonsiliasi"), page: "5" },
        { level: "chapter", label: tx("Bab 2"), title: tx("Biaya dan uji beban"), page: "7" },
        { level: "appendix", label: tx("Lampiran A"), title: tx("Dokumentasi pemasangan"), page: "9" },
      ],
      colsTw: [1474, 7144, 793],
    },
  },
  parts: [
    {
      id: "P1",
      label: tx("Bagian I"),
      title: tx("Bukti teknis"),
      lede: tx("Kapasitas, biaya, dan hasil uji beban."),
      chapterKeys: ["1", "2"],
      showChapterList: true,
      order: ["body", "label", "title", "lede", "chapterList"],
      body: [device("spineString", { text: tx("004/GSP/BA/X/2026 REV A") })],
    },
  ],
  chapters: [
    {
      key: "1",
      partId: "P1",
      kicker: tx("BAB 1"),
      title: tx("Kapasitas dan rekonsiliasi"),
      setup: runningHead,
      intro: [
        device("datumRule", { widthMm: 166 }),
        {
          type: "paragraph",
          role: "identity",
          text: "Berita acara ini disusun Tim Proyek Daya untuk pemilik gedung; jangkar terukur: beban puncak 18,4 kW.",
          rail: railB("TERUKUR", "18,4 kW", "Log analisa daya 7 hari"),
        },
      ],
      sections: [
        {
          title: tx("Turunan kapasitas"),
          blocks: [
            {
              type: "derivation",
              title: tx("Kapasitas UPS yang diperlukan"),
              intro: tx("Kapasitas perlu = beban puncak terukur dikali faktor cadangan."),
              lines: [
                { label: tx("Beban puncak terukur"), value: { registerKey: "beban_puncak_kw" } },
                { label: tx("Faktor cadangan"), value: { registerKey: "faktor_cadangan" }, mark: "ASUMSI" },
                { label: tx("Kapasitas UPS terpasang"), value: { registerKey: "kapasitas_ups_kw" } },
              ],
              result: { label: tx("Kapasitas perlu"), expr: "beban_puncak_kw * faktor_cadangan", registerKey: "kapasitas_perlu_kw", tol: 0.05 },
              verdict: { label: tx("Rasio pakai terhadap batas 0,80"), registerKey: "rasio_pakai", limit: 0.8, direction: "lessOrEqual" },
              closing: tx("Bila faktor cadangan naik ke 1,5, kapasitas perlu 27,6 kW masih di bawah 30 kW; di atas 1,63 UPS tidak lagi cukup."),
            },
            {
              type: "paragraph",
              text: "Kapasitas terpasang 30 kW memberi rasio pakai 0,77, di bawah batas 0,80.",
              rail: railB("DITURUNKAN", "0,77", "Turunan Bab 1"),
            },
            {
              type: "list",
              style: "number",
              items: [
                { text: "Rute 1: beban puncak dikali faktor cadangan.", rail: railB("DITURUNKAN", "23,0 kW", "Turunan Bab 1") },
                { text: "Rute 2: jumlah beban per panel dikali faktor cadangan.", rail: railB("PEMASOK", "23,0 kW", "Daftar beban panel") },
              ],
            },
            ...registerTables("serah", ["assumption", "reconciliation", "finding", "regulation", "standardEdition", "improvement"]),
          ],
        },
      ],
    },
    {
      key: "2",
      partId: "P1",
      kicker: tx("BAB 2"),
      title: tx("Biaya dan uji beban"),
      setup: runningHead,
      sections: [
        {
          title: tx("Biaya"),
          blocks: [...FIN_TABLES],
        },
        {
          title: tx("Uji beban"),
          blocks: [
            {
              type: "chart",
              spec: chartSpec("P-11"),
              caption: cap("Dua ruang melampaui batas konsumsi daya 40 kW."),
              source: src(SRC_NOTE, ["TERUKUR"]),
              keyRow: tx("Garis = batas 40 kW."),
              widthMm: 128,
            },
            {
              type: "diagram",
              spec: {
                $schema: "studio.diagram/v1",
                family: "sld",
                id: "2.1",
                title: "UPS dan genset digantung dari satu rel bus ruang server.",
                classification: "TERBATAS",
                width_mm: 128,
                apparatus: "figure",
                labels_verified: true,
                sources: [SRC_NOTE],
                nodes: [
                  { id: "bus", label: "Rel bus 400 V", shape: "bus", class: { tier: 0 } },
                  { id: "ups", label: "UPS 30 kW", shape: "box", mark: "PEMASOK", class: { tier: 1 } },
                  { id: "gen", label: "Genset 40 kVA", shape: "box", class: { tier: 1 } },
                  { id: "rak", label: "Rak server", shape: "box", class: { tier: 2 } },
                ],
                edges: [
                  { from: "bus", to: "ups", kind: "data", label: "daya utama" },
                  { from: "bus", to: "gen", kind: "control", label: "transfer otomatis" },
                  { from: "ups", to: "rak", kind: "data", label: "keluaran UPS" },
                ],
                legend: ["solid daya", "dashed kendali", "PEMASOK"],
              },
              caption: cap("UPS dan genset digantung dari satu rel bus ruang server."),
              source: src(SRC_NOTE),
              widthMm: 128,
            },
            para("Mohon pemilik gedung menandatangani berita acara ini paling lambat 31 Oktober 2026.", "closingAction"),
          ],
        },
      ],
    },
  ],
  appendices: [
    {
      key: "A",
      title: tx("Dokumentasi pemasangan"),
      setup: runningHead,
      sections: [
        {
          title: tx("Denah"),
          blocks: [
            {
              type: "image",
              asset: "denah_ruang",
              caption: cap("Denah ilustratif penempatan UPS."),
              source: src("Gambar ilustratif korpus paritas S63."),
              widthMm: 128,
            },
            {
              type: "symbolSheet",
              dialect: "isa",
              caption: cap("Lembar simbol ISA untuk gambar instrumentasi."),
              source: src("datumsimbol.py lembar isa (Garis A)."),
              widthMm: 166,
            },
          ],
        },
      ],
    },
  ],
  assets: { logo_ilustrasi: logoAsset(), denah_ruang: floorPlanAsset() },
};

/**
 * Margin `A4` (1134/1418 tw) sebagai parameter templat kelas B (D-248). Hanya untuk dokumen tanpa
 * figur: kolom teks turunan menjadi 127 mm (figur wajib 128/166 mm, G2).
 */
const A4_MARGIN_PARAMS: Record<string, unknown> = { "grid.innerMarginMm": 25, "grid.outerMarginMm": 20, "grid.topBottomMarginMm": 20, "grid.marginBottomMm": 20 };

const AUTHORED_DOC_FIXTURES: readonly AuthoredDocFixture[] = [
  { id: "doc-nota-memo", file: "doc/doc_nota_memo.json", tier: "NOTA", doc: NOTA_MEMO, notes: "NOTA tanpa halaman depan; 5 varian aside; chart CA P-01" },
  {
    id: "doc-nota-tables",
    file: "doc/doc_nota_tables.json",
    tier: "NOTA",
    doc: NOTA_TABLES,
    notes: "11 keluarga tabel, 8 preset register, 3 preset keuangan, gridSpan/vMerge/nested, lampiran",
    // Margin `A4` bab 1 (setup: atas/bawah 1134 tw = 20 mm, kiri 1418 tw = 25 mm, kanan 1134 tw = 20 mm) -> kelas B grid.*.
    templateOverrides: A4_MARGIN_PARAMS,
  },
  { id: "doc-terbit-report", file: "doc/doc_terbit_report.json", tier: "TERBIT", doc: TERBIT_REPORT, notes: "halaman depan auto, toc field, 2 bagian, tanda tangan, rel bukti moda A (layout.railMode)" },
  {
    id: "doc-serah-handover",
    file: "doc/doc_serah_handover.json",
    tier: "SERAH",
    doc: SERAH_HANDOVER,
    notes: "halaman depan explicit, toc statis, register + turunan, rekonsiliasi, rel bukti moda B (layout.railMode)",
    // Margin `A4` TIDAK diangkat: grid.innerMarginMm 25 menurunkan kolom teks ke 127 mm sehingga figur
    // 128 mm ditolak G2 (BY_CONSTRUCTION_FAILED); margin SERAH = templat kanonik.
  },
];

/** Fixture dokumen yang ditulis generator: konten-saja + templat pendamping + salinan v2 (SR-41). */
export const DOC_FIXTURES: readonly DocFixture[] = AUTHORED_DOC_FIXTURES.map((a) => {
  const stem = a.file.replace(/^doc\//, "").replace(/\.json$/, "");
  const co = toContentOnlyDoc(a.doc, stem, a.templateOverrides ? { overrides: a.templateOverrides } : undefined);
  if (co.v2Issues.length > 0) throw new Error(`${a.id}: salinan v2 tidak lolos studio.doc/v2: ${JSON.stringify(co.v2Issues.slice(0, 3))}`);
  return {
    ...a,
    doc: co.doc,
    ...(co.template ? { templateFile: `doc/${stem}.template.json`, template: co.template } : {}),
    v2File: `doc/v2/${stem}.json`,
    v2: co.v2,
  };
});

/**
 * Spec diagram `studio.diagram/v1` untuk 9 keluarga (S63, kelas paritas DG,
 * research/06 6.2). Dua spec Garis A (`good_layered.json`, `good_sld.json`)
 * disalin apa adanya oleh build ke `diagram/garis_a/`; versi kontrak keduanya
 * (`dg_layered_good`, `dg_sld_good`) diturunkan saat build: `_provenans`
 * dipindah ke manifest dan `$schema` ditambahkan (skema v1 `additionalProperties:false`).
 * Tujuh keluarga lain ditulis di sini; aturan Garis A yang dijaga: id memuat
 * `\d+\.\d+`, judul satu kalimat berakhir titik, satu dialek notasi per gambar
 * (DATUM-35), maks satu konektor aksen (DATUM-26), glif rumah ada di legenda
 * (DATUM-34), setiap keputusan punya keluaran berlabel.
 */
import type { StudioDiagramV1 } from "../../../../src/lib/studio/contract";

export interface DiagramFixture {
  id: string;
  file: string;
  family: StudioDiagramV1["family"];
  spec: StudioDiagramV1;
  notes?: string;
}

const S = "studio.diagram/v1" as const;

export const DG_TOPOLOGY: StudioDiagramV1 = {
  $schema: S,
  family: "topology",
  id: "3.2",
  title: "Jaringan pemantauan menghubungkan sensor lantai ke server pusat lewat dua sakelar.",
  classification: "BIASA",
  width_mm: 166,
  apparatus: "page",
  labels_verified: true,
  sources: ["Contoh ilustratif korpus paritas S63, topologi jaringan pemantauan"],
  nodes: [
    { id: "srv", label: "Server pusat", sub: "2 unit", shape: "box", class: { tier: 0 } },
    { id: "arsip", label: "Arsip data", shape: "cylinder", class: { tier: 0 } },
    { id: "swa", label: "Sakelar A", shape: "box", class: { tier: 1 } },
    { id: "swb", label: "Sakelar B", shape: "box", class: { tier: 1 } },
    { id: "s1", label: "Sensor lantai 1", shape: "circle", mark: "TERUKUR", class: { tier: 2 } },
    { id: "s2", label: "Sensor lantai 2", shape: "circle", class: { tier: 2 } },
  ],
  edges: [
    { from: "srv", to: "arsip", kind: "sync", label: "replikasi harian" },
    { from: "swa", to: "srv", kind: "accent", label: "jalur utama" },
    { from: "swb", to: "srv", kind: "data", label: "jalur cadangan" },
    { from: "s1", to: "swa", kind: "data", label: "Ethernet" },
    { from: "s2", to: "swb", kind: "alert", label: "alarm suhu" },
  ],
  zones: [{ id: "z1", label: "Ruang server", members: ["srv", "arsip"] }],
  legend: ["solid data", "dotted replikasi", "longdash alarm", "aksen jalur utama", "TERUKUR"],
  notes: ["Satu aksen per gambar."],
};

export const DG_STACK: StudioDiagramV1 = {
  $schema: S,
  family: "stack",
  id: "5.1",
  title: "Tumpukan perangkat lunak pemantauan tersusun dari empat lapis.",
  classification: "BIASA",
  width_mm: 128,
  apparatus: "page",
  labels_verified: true,
  sources: ["Contoh ilustratif korpus paritas S63, lapis perangkat lunak"],
  nodes: [
    { id: "ui", label: "Antarmuka operator", shape: "box", class: { tier: 0 } },
    { id: "app", label: "Layanan aplikasi", shape: "doubled", class: { tier: 1 } },
    { id: "db", label: "Basis data waktu", shape: "box", class: { tier: 2 } },
    { id: "os", label: "Sistem operasi", shape: "box", class: { tier: 3 } },
  ],
  edges: [
    { from: "ui", to: "app", kind: "control", label: "perintah" },
    { from: "app", to: "db", kind: "data", label: "tulis deret" },
    { from: "db", to: "os", kind: "data", label: "berkas" },
  ],
  legend: ["solid data", "dashed perintah", "bingkai ganda subsistem"],
};

export const DG_FLOW: StudioDiagramV1 = {
  $schema: S,
  family: "flow",
  id: "6.1",
  title: "Prosedur penanganan alarm suhu berakhir pada laporan penutupan.",
  classification: "BIASA",
  width_mm: 128,
  apparatus: "page",
  labels_verified: true,
  sources: ["Contoh ilustratif korpus paritas S63, prosedur alarm"],
  nodes: [
    { id: "mulai", label: "Alarm diterima", shape: "stadium", class: { row: 0 } },
    { id: "baca", label: "Baca suhu terakhir", shape: "parallelogram", class: { row: 1 } },
    { id: "cek", label: "Di atas batas?", shape: "diamond", class: { row: 2 } },
    { id: "selesai", label: "Laporan penutupan", shape: "stadium", class: { row: 3 } },
  ],
  edges: [
    { from: "mulai", to: "baca", kind: "data", label: "tiket" },
    { from: "baca", to: "cek", kind: "data", label: "nilai" },
    { from: "cek", to: "selesai", kind: "control", label: "Ya, kirim teknisi" },
    { from: "cek", to: "baca", kind: "control", label: "Tidak, pantau ulang" },
  ],
  legend: ["solid data", "dashed keputusan"],
};

export const DG_FLOW_WRAPPED: StudioDiagramV1 = {
  $schema: S,
  family: "flow",
  id: "6.2",
  title: "Rantai pengadaan suku cadang dibungkus tiga langkah per baris.",
  classification: "BIASA",
  width_mm: 166,
  apparatus: "page",
  labels_verified: true,
  sources: ["Contoh ilustratif korpus paritas S63, rantai pengadaan"],
  per_row: 3,
  nodes: [
    { id: "a", label: "Permintaan", shape: "stadium", class: { row: 0 } },
    { id: "b", label: "Kajian kebutuhan", shape: "box", class: { row: 0 } },
    { id: "c", label: "Penawaran", shape: "box", class: { row: 0 } },
    { id: "d", label: "Pesanan", shape: "box", class: { row: 1 } },
    { id: "e", label: "Penerimaan", shape: "box", class: { row: 1 } },
    { id: "f", label: "Gudang", shape: "stadium", class: { row: 1 } },
  ],
  edges: [
    { from: "a", to: "b", kind: "data", label: "formulir" },
    { from: "b", to: "c", kind: "data", label: "spesifikasi" },
    { from: "c", to: "d", kind: "data", label: "harga" },
    { from: "d", to: "e", kind: "data", label: "barang" },
    { from: "e", to: "f", kind: "verify", label: "uji terima" },
  ],
  legend: ["solid data", "dash-dot uji terima"],
  notes: ["per_row membungkus rantai (E-30)."],
};

export const DG_SWIMLANE: StudioDiagramV1 = {
  $schema: S,
  family: "swimlane",
  id: "6.3",
  title: "Tiga peran berbagi alur izin kerja ruang server.",
  classification: "BIASA",
  width_mm: 166,
  apparatus: "page",
  labels_verified: true,
  sources: ["Contoh ilustratif korpus paritas S63, izin kerja"],
  nodes: [
    { id: "aju", label: "Ajukan izin", shape: "box", class: { lane: "Pemohon" } },
    { id: "periksa", label: "Periksa jadwal", shape: "box", class: { lane: "Pengelola" } },
    { id: "setuju", label: "Setujui izin", shape: "box", class: { lane: "Pengelola" } },
    { id: "kerja", label: "Kerjakan tugas", shape: "box", class: { lane: "Teknisi" } },
    { id: "lapor", label: "Lapor selesai", shape: "box", class: { lane: "Teknisi" } },
  ],
  edges: [
    { from: "aju", to: "periksa", kind: "data", label: "formulir izin" },
    { from: "periksa", to: "setuju", kind: "data", label: "slot kosong" },
    { from: "setuju", to: "kerja", kind: "control", label: "perintah kerja" },
    { from: "kerja", to: "lapor", kind: "data", label: "catatan" },
  ],
  legend: ["solid data", "dashed perintah"],
};

export const DG_SEQUENCE: StudioDiagramV1 = {
  $schema: S,
  family: "sequence",
  id: "7.1",
  title: "Urutan pesan pembacaan sensor dari pengumpul ke dasbor.",
  classification: "BIASA",
  width_mm: 166,
  apparatus: "page",
  labels_verified: true,
  sources: ["Contoh ilustratif korpus paritas S63, urutan pesan"],
  nodes: [
    { id: "sensor", label: "Sensor", shape: "box", class: { col: 0 } },
    { id: "kumpul", label: "Pengumpul", shape: "box", class: { col: 1 } },
    { id: "server", label: "Server", shape: "box", class: { col: 2 } },
    { id: "dasbor", label: "Dasbor", shape: "box", class: { col: 3 } },
  ],
  edges: [
    { from: "kumpul", to: "sensor", kind: "control", label: "minta nilai" },
    { from: "sensor", to: "kumpul", kind: "data", label: "nilai suhu" },
    { from: "kumpul", to: "server", kind: "data", label: "paket 1 menit" },
    { from: "server", to: "dasbor", kind: "sync", label: "dorong pembaruan" },
  ],
  legend: ["solid data", "dashed permintaan", "dotted pembaruan"],
};

export const DG_RACK: StudioDiagramV1 = {
  $schema: S,
  family: "rack",
  id: "8.1",
  title: "Elevasi rak 12U memuat perangkat jaringan dan catu daya.",
  classification: "BIASA",
  width_mm: 128,
  apparatus: "page",
  labels_verified: true,
  sources: ["Contoh ilustratif korpus paritas S63, elevasi rak"],
  nodes: [
    { id: "patch", label: "Panel tambal", u: 1, class: { row: 0 } },
    { id: "sw", label: "Sakelar 24 port", u: 1, class: { row: 1 } },
    { id: "srv", label: "Server pemantauan", sub: "2U", u: 2, class: { row: 2 } },
    { id: "nas", label: "Penyimpanan", u: 2, class: { row: 3 } },
    { id: "ups", label: "Catu daya cadangan", sub: "3U", u: 3, class: { row: 4 } },
  ],
  edges: [{ from: "sw", to: "srv", kind: "data", label: "uplink" }],
  legend: ["solid data"],
};

export const DG_GRAPH: StudioDiagramV1 = {
  $schema: S,
  family: "graph",
  id: "9.4",
  title: "Ketergantungan antarlayanan ditata lewat kolom dan baris.",
  classification: "BIASA",
  width_mm: 166,
  apparatus: "figure",
  labels_verified: true,
  sources: ["Contoh ilustratif korpus paritas S63, graf layanan"],
  nodes: [
    { id: "gw", label: "Gerbang API", shape: "hexagon", class: { col: 0, row: 0 } },
    { id: "auth", label: "Otentikasi", shape: "box", class: { col: 1, row: 0 } },
    { id: "svc", label: "Layanan data", shape: "box", class: { col: 1, row: 1 } },
    { id: "db", label: "Basis data", shape: "cylinder", class: { col: 2, row: 1 } },
    { id: "log", label: "Log audit", shape: "cylinder", mark: "DITURUNKAN", class: { col: 2, row: 0 } },
  ],
  edges: [
    { from: "gw", to: "auth", kind: "control", label: "validasi token" },
    { from: "gw", to: "svc", kind: "data", label: "permintaan" },
    { from: "svc", to: "db", kind: "data", label: "kueri" },
    { from: "auth", to: "log", kind: "verify", label: "jejak masuk" },
  ],
  legend: ["solid data", "dashed validasi", "dash-dot jejak", "DITURUNKAN"],
};

/**
 * FIX-3 (F-S78-5): graf dengan dua lompatan persilangan (r 0,9 mm). Jalur
 * horizontal `sen -> srv` digambar lebih dulu dan dipotong dua jalur kendali
 * vertikal di luar titik sudutnya, sehingga `n_hops = 2` di kedua sisi.
 */
export const DG_GRAPH_HOPS: StudioDiagramV1 = {
  $schema: S,
  family: "graph",
  id: "9.5",
  title: "Jalur telemetri utama bersilang dengan dua jalur kendali.",
  classification: "BIASA",
  width_mm: 166,
  apparatus: "figure",
  labels_verified: true,
  sources: ["Contoh ilustratif korpus paritas FIX-3, graf bersilang (F-S78-5)"],
  nodes: [
    { id: "sen", label: "Sensor ruang", shape: "box", class: { col: 0, row: 1 } },
    { id: "srv", label: "Server pusat", shape: "box", class: { col: 3, row: 1 } },
    { id: "pa", label: "Panel A", shape: "box", class: { col: 1, row: 0 } },
    { id: "ka", label: "Katup A", shape: "box", class: { col: 1, row: 3 } },
    { id: "pb", label: "Panel B", shape: "box", class: { col: 2, row: 0 } },
    { id: "kb", label: "Katup B", shape: "box", class: { col: 2, row: 3 } },
  ],
  edges: [
    { from: "sen", to: "srv", kind: "data", label: "telemetri" },
    { from: "pa", to: "ka", kind: "control", label: "buka A" },
    { from: "pb", to: "kb", kind: "control", label: "buka B" },
  ],
  legend: ["solid data", "dashed kendali"],
};

/** Keluarga yang ditulis di sini (7 keluarga + 1 varian flow + 1 varian graf berlompatan). */
export const AUTHORED_DIAGRAMS: readonly DiagramFixture[] = [
  { id: "dg-topology", file: "diagram/dg_topology.json", family: "topology", spec: DG_TOPOLOGY },
  { id: "dg-stack", file: "diagram/dg_stack.json", family: "stack", spec: DG_STACK },
  { id: "dg-flow", file: "diagram/dg_flow.json", family: "flow", spec: DG_FLOW },
  { id: "dg-flow-wrapped", file: "diagram/dg_flow_wrapped.json", family: "flow", spec: DG_FLOW_WRAPPED, notes: "varian per_row (E-30)" },
  { id: "dg-swimlane", file: "diagram/dg_swimlane.json", family: "swimlane", spec: DG_SWIMLANE },
  { id: "dg-sequence", file: "diagram/dg_sequence.json", family: "sequence", spec: DG_SEQUENCE },
  { id: "dg-rack", file: "diagram/dg_rack.json", family: "rack", spec: DG_RACK },
  { id: "dg-graph", file: "diagram/dg_graph.json", family: "graph", spec: DG_GRAPH },
  { id: "dg-graph-hops", file: "diagram/dg_graph_hops.json", family: "graph", spec: DG_GRAPH_HOPS, notes: "FIX-3 F-S78-5: 2 lompatan persilangan (n_hops = 2)" },
];

/** Sumber Garis A (HS fixtures_diagram), disalin apa adanya. */
export const GARIS_A_SOURCES = [
  { id: "dg-layered-good", source: "good_layered.json", copy: "diagram/garis_a/good_layered.json", file: "diagram/dg_layered_good.json", family: "layered" },
  { id: "dg-sld-good", source: "good_sld.json", copy: "diagram/garis_a/good_sld.json", file: "diagram/dg_sld_good.json", family: "sld" },
] as const;

/** Spec Garis A -> bentuk kontrak: `$schema` di depan, `_provenans` dibuang (dicatat manifest). */
export function contractFromGarisA(raw: Record<string, unknown>): { spec: StudioDiagramV1; provenance: string | undefined } {
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) if (k !== "_provenans") rest[k] = v;
  const spec = { $schema: S, ...rest } as unknown as StudioDiagramV1;
  return { spec, provenance: typeof raw._provenans === "string" ? raw._provenans : undefined };
}

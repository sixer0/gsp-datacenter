/**
 * Spec chart `studio.chart/v1` per kode yang PUNYA acuan Python (S63):
 * 4 datumchart (kelas CA) + 42 pustakachart (CB1 34 / CB2 8), research/06 5.1.
 * Bentuk data mengikuti `ChartDef.dataShape` (registry/charts.ts) dan batas
 * `CHART_DATA_CONSTRAINTS` (penyuntik `pc_inject.py` S65). Lebar/tinggi kode
 * pustakachart = kanvas registri acuan (`lebar_mm`/`tinggi_mm`) agar ukuran
 * dibanding apa adanya (research/06 6.2 CB1 (d)).
 *
 * P-07 dan W-03 memakai `dataInjection.literalData` dari ref_report.json
 * adapter S65 (permintaan S65, file_requests.md:9), sebab data acuan LITERAL
 * di dalam fungsi galeri (research/06 6.3).
 *
 * Deret acak dibangkitkan PRNG berbenih tetap (mulberry32) lalu dibekukan di
 * JSON; build ulang menghasilkan byte yang sama.
 */
import type { ChartData, DrawnChartCode, StudioChartV1, StudioDiagramV1 } from "../../../../src/lib/studio/contract";
import { P07_LITERAL, W03_LITERAL } from "./literal_s65";

export interface ChartFixture {
  code: DrawnChartCode;
  spec: StudioChartV1;
  notes?: string;
}

const SRC = "Data ilustratif korpus paritas S63 (sintetis, bukan data klien).";

// ── PRNG deterministik ────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (v: number): number => Math.round(v * 10) / 10;

/** Deret normal (Box-Muller) berbenih, dibulatkan 1 desimal, dijepit ke [lo, hi]. */
function normals(seed: number, n: number, mean: number, sd: number, lo = -Infinity, hi = Infinity): number[] {
  const rnd = mulberry32(seed);
  const out: number[] = [];
  while (out.length < n) {
    const u = Math.max(rnd(), 1e-9);
    const v = rnd();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    out.push(r1(Math.min(hi, Math.max(lo, mean + sd * z))));
  }
  return out;
}

function uniforms(seed: number, n: number, lo: number, hi: number): number[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => r1(lo + (hi - lo) * rnd()));
}

// ── Pembentuk data ────────────────────────────────────────────────────────

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const cat = (pairs: Array<[string, number]>, accentIndex?: number): ChartData => ({
  shape: "categorical",
  points: pairs.map(([label, value], i) => (i === accentIndex ? { label, value, accent: true } : { label, value })),
});

const ser = (categories: string[], series: Array<[string, Array<number | null>]>): ChartData => ({
  shape: "series",
  categories,
  series: series.map(([name, values]) => ({ name, values })),
});

const dist = (groups: Array<[string, number[]]>): ChartData => ({
  shape: "distribution",
  groups: groups.map(([name, values]) => ({ name, values })),
});

function spec(kind: DrawnChartCode, title: string, widthMm: 128 | 166, data: ChartData, extra: Partial<StudioChartV1> = {}): StudioChartV1 {
  return { $schema: "studio.chart/v1", kind, title, source: SRC, widthMm, data, ...extra };
}

// ── Diagram langkah G-04 (bentuk steps, maks 6 langkah) ─────────────────────

const G04_STEPS: StudioDiagramV1 = {
  $schema: "studio.diagram/v1",
  family: "flow",
  id: "6.9",
  title: "Alur tiket gangguan dari penerimaan sampai penutupan.",
  classification: "BIASA",
  width_mm: 166,
  labels_verified: true,
  sources: [SRC],
  nodes: [
    { id: "s1", label: "Tiket masuk", shape: "box", class: { row: 0 } },
    { id: "s2", label: "Klasifikasi", shape: "box", class: { row: 1 } },
    { id: "s3", label: "Prioritas tinggi?", shape: "diamond", class: { row: 2 } },
    { id: "s4", label: "Kirim teknisi", shape: "box", class: { row: 3 } },
    { id: "s5", label: "Jadwalkan", shape: "box", class: { row: 3 } },
    { id: "s6", label: "Tutup tiket", shape: "box", class: { row: 4 } },
  ],
  edges: [
    { from: "s1", to: "s2", kind: "data", label: "tiket" },
    { from: "s2", to: "s3", kind: "data", label: "kelas" },
    { from: "s3", to: "s4", kind: "control", label: "Ya" },
    { from: "s3", to: "s5", kind: "control", label: "Tidak" },
    { from: "s4", to: "s6", kind: "data", label: "berita acara" },
    { from: "s5", to: "s6", kind: "data", label: "log" },
  ],
};

// ── 46 fixture ────────────────────────────────────────────────────────────

const SITES = ["Lokasi A", "Lokasi B", "Lokasi C"];

export const CHART_FIXTURES: readonly ChartFixture[] = [
  // datumchart (CA)
  {
    code: "P-01",
    spec: spec(
      "P-01",
      "Pendingin menyumbang waktu henti terbesar pada kuartal ini.",
      128,
      cat(
        [
          ["Pendingin", 42],
          ["Catu daya", 31],
          ["Jaringan", 24],
          ["Akses pintu", 15],
          ["Pencahayaan", 11],
          ["Sensor", 7],
        ],
        0,
      ),
      { unit: "jam", dec: 0 },
    ),
    notes: "D-63: data sudah urut menurun (valueDesc) dan titik pertama beraksen (default P-01 sort/accent topBarOnly); tanpa nilai negatif (CH-01); tanpa points[].sub sehingga adapter DC tidak perlu sub tingkat atas",
  },
  {
    code: "P-02",
    spec: spec(
      "P-02",
      "Jumlah tiket perawatan naik setiap tahun sejak 2023.",
      128,
      cat(
        [
          ["2021", 118],
          ["2022", 132],
          ["2023", 127],
          ["2024", 149],
          ["2025", 161],
          ["2026", 174],
        ],
        5,
      ),
      { unit: "tiket", dec: 0 },
    ),
  },
  {
    code: "P-11",
    spec: spec(
      "P-11",
      "Dua ruang melampaui batas konsumsi daya 40 kW.",
      128,
      cat([
        ["Ruang A", 32],
        ["Ruang B", 38],
        ["Ruang C", 44],
        ["Ruang D", 29],
        ["Ruang E", 41],
      ]),
      { unit: "kW", dec: 0, limit: 40, limitLabel: "Batas 40 kW" },
    ),
  },
  {
    code: "W-02",
    spec: spec(
      "W-02",
      "Volume pekerjaan bulanan memuncak pada bulan Desember.",
      166,
      cat(
        BULAN.map((b, i): [string, number] => [b, [64, 58, 71, 69, 75, 80, 77, 83, 79, 88, 91, 102][i]]),
        11,
      ),
      { unit: "pekerjaan", dec: 0 },
    ),
  },

  // pustakachart P
  {
    code: "P-03",
    spec: spec(
      "P-03",
      "Penawaran B lebih murah pada tiga dari lima pos.",
      166,
      ser(
        ["Kamera", "Perekam", "Sakelar", "Kabel", "Jasa"],
        [
          ["Penawaran A", [405.5, 372, 248.8, 92.4, 136]],
          ["Penawaran B", [389, 398.5, 229.6, 101.3, 149.5]],
        ],
      ),
      { heightMm: 58, unit: "juta rupiah", dec: 1 },
    ),
  },
  {
    code: "P-04",
    spec: spec(
      "P-04",
      "Biaya pos perangkat jauh di atas pos kabel.",
      128,
      cat([
        ["Kamera", 405.5],
        ["Perekam", 372],
        ["Sakelar", 248.8],
        ["Jasa", 136],
        ["Kabel", 92.4],
      ]),
      { heightMm: 58, unit: "juta rupiah", dec: 1 },
    ),
  },
  {
    code: "P-05",
    spec: spec(
      "P-05",
      "Selang waktu antarkegagalan Lokasi C paling sempit.",
      128,
      dist([
        [SITES[0], normals(501, 20, 1450, 180, 900)],
        [SITES[1], normals(502, 20, 1300, 220, 700)],
        [SITES[2], normals(503, 20, 1150, 90, 900)],
      ]),
      { heightMm: 60, unit: "jam", dec: 0 },
    ),
  },
  {
    code: "P-06",
    spec: spec(
      "P-06",
      "Skor audit naik pada empat dari enam ruang.",
      166,
      ser(
        ["R-01", "R-02", "R-03", "R-04", "R-05", "R-06"],
        [
          ["Audit 1", [61, 73, 56, 80, 69, 58]],
          ["Audit 2", [70, 68, 65, 87, 63, 76]],
        ],
      ),
      { heightMm: 62, unit: "skor", dec: 0 },
    ),
  },
  {
    code: "P-07",
    spec: spec("P-07", "Rentang beban panel L1 sampai L3 tidak saling tumpang.", 128, P07_LITERAL, { heightMm: 58, unit: "A", dec: 1 }),
    notes: "data = dataInjection.literalData ref_report.json S65 (LITERAL acuan, tidak disuntik)",
  },
  {
    code: "P-08",
    spec: spec(
      "P-08",
      "Dua ruang turun skor di antara audit pertama dan kedua.",
      166,
      ser(
        ["R-01", "R-02", "R-03", "R-04", "R-05", "R-06"],
        [
          ["Audit 1", [61, 73, 56, 80, 69, 58]],
          ["Audit 2", [70, 68, 65, 87, 63, 76]],
        ],
      ),
      { heightMm: 62, unit: "skor", dec: 0 },
    ),
  },
  {
    code: "P-09",
    spec: spec("P-09", "Ketepatan waktu penyelesaian tiket masih di bawah sasaran.", 128, cat([["Ketepatan waktu Q3", 74]]), {
      heightMm: 30,
      unit: "%",
      dec: 0,
      limit: 85,
      limitLabel: "Sasaran 85 %",
    }),
    notes: "target dari limit (pc_inject inj_bullet: params.target atau limit); params.max absen = 100",
  },
  {
    code: "P-10",
    spec: spec(
      "P-10",
      "Diskon volume menurunkan total biaya proyek.",
      166,
      cat([
        ["Perangkat", 405.5],
        ["Instalasi", 136],
        ["Konfigurasi", 92.4],
        ["Lisensi", 52],
        ["Diskon", -21.5],
      ]),
      { heightMm: 62, unit: "juta rupiah", dec: 1 },
    ),
  },
  {
    code: "P-12",
    spec: spec(
      "P-12",
      "Pola gangguan bulanan enam lokasi berbeda satu sama lain.",
      166,
      ser(
        BULAN,
        Array.from({ length: 6 }, (_, i): [string, number[]] => [`Lokasi ${i + 1}`, normals(1200 + i, 12, 3.6, 1.2, 0.5)]),
      ),
      { heightMm: 74, unit: "gangguan", dec: 1 },
    ),
  },
  {
    code: "P-13",
    spec: spec(
      "P-13",
      "Tiga lokasi berada di kuadran biaya tinggi dan keandalan rendah.",
      166,
      {
        shape: "xy",
        points: uniforms(1301, 12, 40, 160).map((x, i) => {
          const y = uniforms(1302, 12, 90, 99.9)[i];
          return i % 4 === 0 ? { x, y, label: `L${i + 1}` } : { x, y };
        }),
      },
      { heightMm: 70, dec: 1 },
    ),
  },
  {
    code: "P-15",
    spec: spec(
      "P-15",
      "Lokasi 3 dan 5 belum memenuhi sasaran ketersediaan.",
      128,
      {
        shape: "matrix",
        rows: ["Lokasi 1", "Lokasi 2", "Lokasi 3", "Lokasi 4", "Lokasi 5"],
        cols: ["Ketersediaan %", "Titik aktif", "Tiket terbuka"],
        values: [
          [98.4, 410, 2],
          [96.9, 231, 4],
          [92.1, 186, 9],
          [99.2, 305, 1],
          [89.7, 97, 12],
        ],
      },
      { heightMm: 46, dec: 1 },
    ),
    notes: "bentuk matrix; adapter menambah kolom kepala baris kosong (params.rowHeader absen)",
  },

  // pustakachart H
  {
    code: "H-01",
    spec: spec(
      "H-01",
      "Latensi naik seiring jumlah perangkat per sakelar.",
      128,
      {
        shape: "xy",
        points: uniforms(1401, 24, 4, 48).map((x, i) => {
          const y = r1(2 + x * 0.42 + normals(1402, 24, 0, 2.5)[i]);
          return i === 7 ? { x, y, label: "Sakelar 8" } : { x, y };
        }),
      },
      { heightMm: 66, dec: 1 },
    ),
  },
  {
    code: "H-02",
    spec: spec(
      "H-02",
      "Lokasi berbeban besar juga memiliki latensi tinggi.",
      128,
      {
        shape: "xy",
        points: uniforms(1501, 12, 4, 48).map((x, i) => ({
          x,
          y: r1(2 + x * 0.4 + normals(1502, 12, 0, 2)[i]),
          size: uniforms(1503, 12, 20, 400)[i],
          ...(i === 3 ? { label: "Lokasi 4" } : {}),
        })),
      },
      { heightMm: 66, dec: 1 },
    ),
  },
  {
    code: "H-03",
    spec: spec(
      "H-03",
      "Faktor kelembapan menjadi skor risiko tertinggi di semua lokasi.",
      166,
      {
        shape: "matrix",
        rows: ["Lokasi 1", "Lokasi 2", "Lokasi 3", "Lokasi 4", "Lokasi 5", "Lokasi 6"],
        cols: ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"],
        values: Array.from({ length: 6 }, (_, r) => uniforms(1600 + r, 8, 5, 95).map((v) => Math.round(v))),
      },
      { heightMm: 72, dec: 0 },
    ),
    notes: "matrix tepat 6 x 8 (CHART_DATA_CONSTRAINTS H-03)",
  },
  {
    code: "H-04",
    spec: spec(
      "H-04",
      "Latensi dan jitter bergerak bersama sepanjang hari kerja.",
      128,
      {
        shape: "xy",
        points: Array.from({ length: 16 }, (_, i) => ({
          x: r1(18 + i * 1.6 + normals(1701, 16, 0, 1.1)[i]),
          y: r1(2.2 + i * 0.35 + normals(1702, 16, 0, 0.4)[i]),
        })),
      },
      { heightMm: 60, dec: 1 },
    ),
    notes: "anotasi 08:00/23:00 LITERAL acuan pada titik pertama dan terakhir",
  },
  {
    code: "H-05",
    spec: spec(
      "H-05",
      "Sebaran pasangan beban dan suhu terkumpul di tengah rentang.",
      128,
      {
        shape: "xy",
        points: normals(1801, 120, 55, 14, 5, 100).map((x, i) => ({ x, y: r1(18 + x * 0.12 + normals(1802, 120, 0, 1.6)[i]) })),
      },
      { heightMm: 64, dec: 1 },
    ),
  },
  {
    code: "H-06",
    spec: spec(
      "H-06",
      "Kuat sinyal melemah ke arah sudut timur laut ruang.",
      128,
      {
        shape: "matrix",
        rows: Array.from({ length: 8 }, (_, i) => `y${i + 1}`),
        cols: Array.from({ length: 10 }, (_, i) => `x${i + 1}`),
        values: Array.from({ length: 8 }, (_, r) => Array.from({ length: 10 }, (_, c) => Math.round(-40 - 3.2 * r - 2.6 * c))),
      },
      { heightMm: 64, unit: "dBm", dec: 0 },
    ),
    notes: "matriks 8 x 10 diresampel bilinear ke grid literal 40 x 60 acuan",
  },
  {
    code: "H-07",
    spec: spec(
      "H-07",
      "Tautan inti ke distribusi 2 memikul lalu lintas terbesar.",
      166,
      {
        shape: "graph",
        nodes: [
          { id: "core", label: "Inti" },
          { id: "d1", label: "Distribusi 1" },
          { id: "d2", label: "Distribusi 2" },
          { id: "a1", label: "Akses 1" },
          { id: "a2", label: "Akses 2" },
          { id: "a3", label: "Akses 3" },
          { id: "a4", label: "Akses 4" },
        ],
        links: [
          { from: "core", to: "d1", value: 4.2 },
          { from: "core", to: "d2", value: 7.8 },
          { from: "d1", to: "a1", value: 1.1 },
          { from: "d1", to: "a2", value: 1.6 },
          { from: "d2", to: "a3", value: 2.4 },
          { from: "d2", to: "a4", value: 3.1 },
        ],
      },
      {
        heightMm: 74,
        params: {
          positions: { core: [0.5, 0.78], d1: [0.3, 0.5], d2: [0.7, 0.5], a1: [0.18, 0.22], a2: [0.4, 0.22], a3: [0.6, 0.22], a4: [0.82, 0.22] },
          accentLink: ["core", "d2"],
        },
      },
    ),
    notes: "params.positions + params.accentLink (CHART_DATA_CONSTRAINTS H-07) agar tata letak sama di kedua sisi",
  },

  // pustakachart K
  {
    code: "K-01",
    spec: spec(
      "K-01",
      "Pos perangkat mendominasi biaya pada setiap proyek.",
      128,
      ser(
        ["Proyek 1", "Proyek 2", "Proyek 3", "Proyek 4"],
        [
          ["Perangkat", [320, 210, 180, 95]],
          ["Instalasi", [120, 90, 70, 40]],
          ["Lain-lain", [40, 35, 30, 20]],
        ],
      ),
      { heightMm: 50, unit: "juta rupiah", dec: 0 },
    ),
    notes:
      "acuan _stack_rows(total100=False), kanvas = widthMm x heightMm spec. TEMUAN S63: acuan GAGAL di VENV (numpy menolak np.sum(generator), pustakachart.py:421) untuk total100=False apa pun datanya; paritas CB1 K-01 tidak dapat dijalankan sampai acuan diperbaiki",
  },
  {
    code: "K-02",
    spec: spec(
      "K-02",
      "Porsi instalasi paling besar pada proyek 4.",
      128,
      ser(
        ["Proyek 1", "Proyek 2", "Proyek 3", "Proyek 4"],
        [
          ["Perangkat", [66.7, 62.7, 64.3, 61.3]],
          ["Instalasi", [25, 26.9, 25, 25.8]],
          ["Lain-lain", [8.3, 10.4, 10.7, 12.9]],
        ],
      ),
      { heightMm: 50, unit: "%", dec: 1 },
    ),
    notes: "acuan _stack_rows(total100=True)",
  },
  {
    code: "K-03",
    spec: spec(
      "K-03",
      "Responden paling puas pada aspek kehandalan.",
      166,
      ser(
        ["Kehandalan", "Respons", "Dokumentasi", "Harga", "Komunikasi"],
        [
          ["Setuju", [61, 49, 38, 33, 57]],
          ["Tidak setuju", [-12, -25, -31, -42, -19]],
        ],
      ),
      { heightMm: 58, unit: "%", dec: 0 },
    ),
    notes: "seri kedua bernilai negatif sesuai konvensi acuan v21 (TIDAK_SETUJU)",
  },
  {
    code: "K-04",
    spec: spec(
      "K-04",
      "Komposisi jenjang tim lapangan dan tim kantor serupa.",
      166,
      ser(
        ["Teknisi", "Insinyur", "Senior", "Spesialis", "Manajer"],
        [
          ["Tim lapangan", [40, 27, 16, 9, 4]],
          ["Tim kantor", [34, 26, 18, 10, 5]],
        ],
      ),
      { heightMm: 58, unit: "orang", dec: 0 },
    ),
  },
  {
    code: "K-07",
    spec: spec(
      "K-07",
      "Enam puluh persen butir uji sudah terpenuhi.",
      128,
      cat([
        ["Terpenuhi", 60],
        ["Belum memenuhi", 25],
        ["Belum diuji", 15],
      ]),
      { heightMm: 78, unit: "%", dec: 0 },
    ),
  },
  {
    code: "K-08",
    spec: spec(
      "K-08",
      "Gedung pusat memegang sebagian besar titik kamera.",
      128,
      cat([
        ["Gedung pusat", 58],
        ["Gudang utara", 25],
        ["Cabang timur", 13],
        ["Depo selatan", 4],
      ]),
      { heightMm: 56, unit: "titik", dec: 0 },
    ),
    notes: "F-054: total 100 unit (batas MAX_ICON_UNITS 100, satu ikon satu unit); proporsi setara 400/170/90/28",
  },
  {
    code: "K-09",
    spec: spec(
      "K-09",
      "Proyek daya menyerap porsi anggaran terbesar.",
      166,
      {
        shape: "categorical",
        points: [
          { label: "Kamera", value: 185, sub: "Proyek pemantauan" },
          { label: "Perekam", value: 118.5, sub: "Proyek pemantauan" },
          { label: "Instalasi", value: 86, sub: "Proyek pemantauan" },
          { label: "Kabinet", value: 72.2, sub: "Proyek serat" },
          { label: "Penarikan kabel", value: 94, sub: "Proyek serat" },
          { label: "Terminasi", value: 30.5, sub: "Proyek serat" },
          { label: "UPS 10 kVA", value: 142, sub: "Proyek daya" },
          { label: "Panel", value: 50.8, sub: "Proyek daya" },
          { label: "Genset", value: 205, sub: "Proyek daya" },
        ],
      },
      { heightMm: 70, unit: "juta rupiah", dec: 1 },
    ),
    notes: "grup treemap dari points[].sub",
  },
  {
    code: "K-10",
    spec: spec(
      "K-10",
      "Hanya sembilan dari 120 dokumen sampai ke kontrak.",
      128,
      cat([
        ["Dokumen masuk", 120],
        ["Verifikasi teknis", 84],
        ["Verifikasi harga", 51],
        ["Evaluasi akhir", 22],
        ["Kontrak terbit", 9],
      ]),
      { heightMm: 62, unit: "dokumen", dec: 0 },
    ),
  },
  {
    code: "K-12",
    spec: spec(
      "K-12",
      "Tingkat menang tertinggi ada pada segmen daya cadangan.",
      166,
      ser(
        ["Pemantauan", "Serat", "Daya cadangan", "Lainnya"],
        [
          ["Menang", [55, 40, 65, 30]],
          ["Kalah", [45, 60, 35, 70]],
        ],
      ),
      { heightMm: 66, unit: "%", dec: 0, params: { widths: [38, 27, 21, 14] }, accent: { series: "Kalah" } },
    ),
    notes: "lebar kolom dari params.widths (panjang = jumlah kategori); F1/F-051: accent.series = seri kedua yang diwarnai SIGNAL oleh acuan v31_marimekko (D-77)",
  },

  // pustakachart W
  {
    code: "W-01",
    spec: spec(
      "W-01",
      "Laju data lokasi B melampaui lokasi A sejak pertengahan tahun.",
      128,
      ser(BULAN, [
        ["Lokasi A", normals(2101, 12, 42, 4, 30)],
        ["Lokasi B", BULAN.map((_, i) => r1(36 + i * 1.4))],
      ]),
      { heightMm: 56, unit: "Mbps", dec: 1 },
    ),
    notes: "tepat 2 seri x 12 nilai; label ujung Site A/Site B LITERAL acuan",
  },
  {
    code: "W-03",
    spec: spec("W-03", "Tarif tenaga listrik naik bertahap enam kali dalam setahun.", 128, W03_LITERAL, { heightMm: 54, unit: "rupiah per kWh", dec: 0 }),
    notes: "data = dataInjection.literalData ref_report.json S65 (LITERAL acuan, tidak disuntik)",
  },
  {
    code: "W-04",
    spec: spec(
      "W-04",
      "Beban pendingin tertinggi terjadi pada awal tahun.",
      128,
      cat(BULAN.map((b, i): [string, number] => [b, [11.2, 7.9, 8.6, 4.1, 3.8, 9.7, 7.4, 8.9, 10.8, 9.3, 8.4, 8.9][i]])),
      { heightMm: 54, unit: "kW", dec: 1 },
    ),
  },
  {
    code: "W-05",
    spec: spec(
      "W-05",
      "Lalu lintas video tetap menjadi lapisan terbesar sepanjang tahun.",
      166,
      ser(BULAN, [
        ["Video", BULAN.map((_, i) => r1(48 + i * 1.2))],
        ["Data sensor", normals(2201, 12, 18, 2, 10)],
        ["Manajemen", normals(2202, 12, 6, 0.8, 2)],
      ]),
      { heightMm: 60, unit: "Mbps", dec: 1, accent: { series: "Data sensor" } },
    ),
    notes: "tepat 3 seri x 12 nilai; F1/F-051: accent.series = seri kedua yang diwarnai SIGNAL oleh acuan v43_stacked_area (D-77)",
  },
  {
    code: "W-06",
    spec: spec(
      "W-06",
      "Pemasok Bravo turun ke peringkat ketiga pada kuartal keempat.",
      166,
      ser(
        ["Q1-26", "Q2-26", "Q3-26", "Q4-26"],
        [
          ["Alfa", [3, 1, 2, 1]],
          ["Bravo", [1, 2, 1, 3]],
          ["Cakra", [2, 4, 3, 2]],
          ["Delta", [5, 3, 4, 5]],
          ["Elang", [4, 5, 5, 4]],
        ],
      ),
      { heightMm: 62, dec: 0 },
    ),
    notes: "tepat 4 kategori (periode)",
  },
  {
    code: "W-07",
    spec: spec(
      "W-07",
      "Serah terima jatuh pada minggu ke-14 setelah uji terima.",
      166,
      {
        shape: "intervals",
        items: [
          { label: "Survei lokasi", start: 0, end: 2 },
          { label: "Desain rinci", start: 1, end: 4 },
          { label: "Pengadaan", start: 2, end: 7 },
          { label: "Instalasi kabel", start: 6, end: 10 },
          { label: "Pemasangan perangkat", start: 9, end: 12 },
          { label: "Uji terima", start: 12, end: 14 },
          { label: "Serah terima", start: 14, end: 14, milestone: true },
        ],
      },
      { heightMm: 62, unit: "minggu", dec: 0 },
    ),
    notes: "start/end numerik (minggu); tepat satu milestone",
  },
  {
    code: "W-08",
    spec: spec(
      "W-08",
      "Lonjakan waktu tempuh paket terjadi berkelompok.",
      128,
      dist([["Waktu tempuh", normals(2301, 160, 24, 7, 5)]]),
      { heightMm: 40, unit: "ms", dec: 1 },
    ),
  },

  // pustakachart S
  {
    code: "S-01",
    spec: spec("S-01", "Sebagian besar latensi berada di bawah 30 ms.", 128, dist([["Latensi", normals(2401, 240, 22, 6, 4)]]), {
      heightMm: 54,
      unit: "ms",
      dec: 1,
    }),
  },
  {
    code: "S-02",
    spec: spec(
      "S-02",
      "Median selang antarkegagalan Lokasi A paling tinggi.",
      128,
      dist([
        [SITES[0], normals(2501, 30, 1450, 180, 900)],
        [SITES[1], normals(2502, 30, 1300, 220, 700)],
        [SITES[2], normals(2503, 30, 1150, 90, 900)],
      ]),
      { heightMm: 56, unit: "jam", dec: 0 },
    ),
  },
  {
    code: "S-03",
    spec: spec("S-03", "Kepadatan latensi memuncak di sekitar 22 ms.", 128, dist([["Latensi", normals(2601, 240, 22, 6, 4)]]), {
      heightMm: 54,
      unit: "ms",
      dec: 1,
    }),
  },
  {
    code: "S-04",
    spec: spec(
      "S-04",
      "Lokasi B memiliki sebaran selang antarkegagalan paling lebar.",
      128,
      dist([
        [SITES[0], normals(2701, 40, 1450, 180, 900)],
        [SITES[1], normals(2702, 40, 1300, 260, 600)],
        [SITES[2], normals(2703, 40, 1150, 90, 900)],
      ]),
      { heightMm: 56, unit: "jam", dec: 0 },
    ),
    notes: "tepat 3 grup",
  },
  {
    code: "S-05",
    spec: spec(
      "S-05",
      "Distribusi suhu ruang bergeser naik dari kuartal ke kuartal.",
      166,
      dist([
        ["Q1", normals(2801, 40, 22.5, 0.8)],
        ["Q2", normals(2802, 40, 23.1, 0.9)],
        ["Q3", normals(2803, 40, 23.8, 1)],
        ["Q4", normals(2804, 40, 24.2, 1.1)],
      ]),
      { heightMm: 66, unit: "C", dec: 1 },
    ),
  },
  {
    code: "S-06",
    spec: spec(
      "S-06",
      "Titik pengukuran Lokasi C berkumpul paling rapat.",
      128,
      dist([
        [SITES[0], normals(2901, 25, 1450, 180, 900)],
        [SITES[1], normals(2902, 25, 1300, 220, 700)],
        [SITES[2], normals(2903, 25, 1150, 90, 900)],
      ]),
      { heightMm: 54, unit: "jam", dec: 0 },
    ),
  },

  // pustakachart G
  {
    code: "G-01",
    spec: spec(
      "G-01",
      "Cakupan nirkabel terendah berada di zona sudut gudang.",
      166,
      {
        shape: "tiles",
        tiles: Array.from({ length: 24 }, (_, i) => {
          const row = Math.floor(i / 6);
          const col = i % 6;
          const value = Math.round(95 - 9 * Math.abs(row - 1.5) - 7 * Math.abs(col - 2.5));
          const code = `Z${String(i + 1).padStart(2, "0")}`;
          return i % 5 === 0 ? { code, row, col, value, label: code } : { code, row, col, value };
        }),
      },
      { heightMm: 76, unit: "%", dec: 0 },
    ),
    notes: "denah zona 4 x 6 (wilayah ilustrasi); kisi dari row/col maksimum",
  },
  {
    code: "G-04",
    spec: spec("G-04", "Tiket prioritas tinggi langsung dikirim ke teknisi.", 166, { shape: "steps", spec: G04_STEPS }, { heightMm: 70 }),
    notes: "steps 6 langkah (posisi literal acuan galeri); paritas utama lewat diagram flow (S43)",
  },
];

/*
 * Label bahasa Indonesia galeri artefak (S62). Nilai kunci dari kontrak
 * (`enums.ts`: STUDIO_ARTIFACT_KINDS, DIAGRAM_FAMILIES, SYMBOL_DIALECTS) dan
 * `ChartDef` (§5.3). Kunci tak dikenal ditampilkan apa adanya. FIX-4b: istilah
 * mengikuti kamus UX-01 §1.2 ("Grafik", "Halaman web", "Templat").
 */

import type { DiagramFamily, StudioArtifactKind, SymbolDialect } from "@/lib/studio/contract/enums";
import type { ChartDataShape } from "@/lib/studio/contract/types/chart";
import type { ChartDef } from "@/lib/studio/contract/types/params";

export const KIND_LABEL: Record<StudioArtifactKind, string> = {
  CHART: "Grafik",
  DIAGRAM: "Diagram",
  IMAGE: "Gambar",
  HTML: "Halaman web",
};

export const KIND_HINT: Record<StudioArtifactKind, string> = {
  CHART: "Grafik data berstandar DATUM (58 jenis tergambar).",
  DIAGRAM: "Diagram arsitektur, alir, SLD, rak, dan lainnya (9 keluarga).",
  IMAGE: "Foto atau raster PNG/JPEG dengan pemeriksaan resolusi.",
  HTML: "Halaman web tunggal yang dirakit dari templat (tanpa kode halaman mentah).",
};

export const GROUP_ORDER: readonly ChartDef["group"][] = ["P", "H", "K", "W", "S", "G"];

export const GROUP_LABEL: Record<ChartDef["group"], string> = {
  P: "Perbandingan",
  H: "Hubungan",
  K: "Komposisi",
  W: "Waktu",
  S: "Sebaran",
  G: "Geospasial",
};

export const PURPOSE_LABEL: Record<ChartDef["purpose"], string> = {
  perbandingan: "Perbandingan",
  hubungan: "Hubungan",
  komposisi: "Komposisi",
  waktu: "Waktu",
  sebaran: "Sebaran",
  geospasial: "Geospasial",
  aliranProses: "Aliran proses",
};

export const SHAPE_LABEL: Record<ChartDataShape, string> = {
  categorical: "Kategori dan nilai",
  series: "Kategori x seri",
  xy: "Pasangan x-y",
  matrix: "Matriks baris x kolom",
  intervals: "Rentang waktu",
  graph: "Simpul dan tautan",
  distribution: "Kelompok nilai mentah",
  tiles: "Peta petak",
  ohlc: "Buka-tinggi-rendah-tutup",
  sets: "Himpunan dan irisan",
  steps: "Langkah (diagram alir)",
};

export const SHAPE_FIELDS: Record<ChartDataShape, string> = {
  categorical: "points[]: label, value, accent?, sub?",
  series: "categories[], series[]: name, values[], accent?",
  xy: "points[]: x, y, size?, label?, group?, accent?",
  matrix: "rows[], cols[], values[][]",
  intervals: "items[]: label, start, end, group?, milestone?",
  graph: "nodes[]: id, label, value?, group?; links[]: from, to, value?",
  distribution: "groups[]: name, values[]",
  tiles: "tiles[]: code, row, col, value?, label?; flows[]?; dots[]?",
  ohlc: "points[]: t, o, h, l, c",
  sets: "sets[]: name, size; overlaps[]: sets[], size",
  steps: "spec: studio.diagram/v1 (keluarga flow)",
};

export const FAMILY_LABEL: Record<DiagramFamily, string> = {
  layered: "Berlapis",
  topology: "Topologi",
  stack: "Tumpukan",
  flow: "Alir proses",
  swimlane: "Lajur (swimlane)",
  sequence: "Urutan",
  sld: "Diagram satu garis (SLD)",
  rack: "Elevasi rak",
  graph: "Graf",
};

export const FAMILY_HINT: Record<DiagramFamily, string> = {
  layered: "Lapisan bertingkat; tiap simpul diberi tingkat lapisannya.",
  topology: "Jaringan antar perangkat; tata letak berlapis.",
  stack: "Tumpukan komponen; tata letak berlapis.",
  flow: "Langkah berurutan dengan keputusan.",
  swimlane: "Proses per pelaku; tiap simpul diberi lajur pelakunya.",
  sequence: "Pertukaran pesan antar peserta dari waktu ke waktu.",
  sld: "Kelistrikan satu garis; simbol dialek IEC.",
  rack: "Tata letak perangkat di rak; tiap simpul diberi posisi unit rak.",
  graph: "Simpul dan sisi bebas; tiap simpul diberi kolom dan baris.",
};

export const DIALECT_LABEL: Record<SymbolDialect, string> = {
  iec: "IEC (kelistrikan)",
  isa: "ISA (instrumentasi)",
  sec: "Keamanan fisik",
  mil: "Militer (afiliasi)",
};

export function labelOrKey(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return "-";
  return map[key] ?? key;
}

/** "iec:breaker" -> "breaker" (nama tampil simbol). */
export function symbolName(id: string): string {
  const i = id.indexOf(":");
  return i >= 0 ? id.slice(i + 1) : id;
}

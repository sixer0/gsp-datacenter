/**
 * S20: katalog aturan DATUM Rev A sebagai data (sumber: research/32_datum_conformance_rules.md).
 *
 * 76 aturan TERUKUR (4 kritis CR-1..CR-4) + 5 detektor bentrok teks pembungkus X-01..X-05.
 * Butir CAKUPAN-saja hanya didaftar kodenya (dinilai matriks S33, bukan skrip). Detektor
 * geometri PDF G-01..G-06 datang dari JSON pemeriksa Python (lihat `lib/clash.ts`).
 *
 * Kolom `module` = modul aturan pemilik kode (S21 structure_a, S22 structure_b, S23 language).
 * Mengubah katalog = mengubah research/32 lebih dulu.
 */
import type { Applicability, Lang, ModuleId, RuleKind, Tier } from "./rules/types";

export interface CatalogEntry {
  /** Kode katalog, mis. `CV-01`, `CR-3`, `X-02`. */
  readonly id: string;
  readonly family: string;
  readonly title: string;
  /** Sitasi manual `ID:n` / `EN:n` (dan rujukan lain) dari research/32. */
  readonly citation: string;
  readonly applicability: Applicability;
  readonly critical: boolean;
  readonly kind: RuleKind;
  readonly module: ModuleId;
}

const NTS: readonly Tier[] = ["NOTA", "TERBIT", "SERAH"];
const TS: readonly Tier[] = ["TERBIT", "SERAH"];
const N: readonly Tier[] = ["NOTA"];
const BOTH: readonly Lang[] = ["ID", "EN"];
const ID_ONLY: readonly Lang[] = ["ID"];
const EN_ONLY: readonly Lang[] = ["EN"];

function e(
  id: string,
  family: string,
  module: ModuleId,
  tiers: readonly Tier[],
  languages: readonly Lang[],
  title: string,
  citation: string,
  opts: { critical?: boolean; kind?: RuleKind } = {},
): CatalogEntry {
  return {
    id,
    family,
    title,
    citation,
    applicability: { tiers, languages, types: "all" },
    critical: opts.critical ?? false,
    kind: opts.kind ?? "measurable",
    module,
  };
}

const K = { critical: true };
const X = { kind: "clash" as const };

export const DATUM_CATALOG: readonly CatalogEntry[] = [
  // §2 kritis
  e("CR-1", "CR", "structure_b", NTS, BOTH, "Penandaan klasifikasi", "DT-28a ID:566-570, EN:590-595; DT-28c ID:609-617, EN:645-652; DT-28e ID:625-629, EN:660-661; EG-50 EN:627-634", K),
  e("CR-2", "CR", "language", NTS, BOTH, "Pola nomor dokumen dan daftar kode tertutup tanpa DS", "DT-04b ID:634-664, EN:675-683; DT-04a ID:508-513, EN:535-541", K),
  e("CR-3", "CR", "language", NTS, BOTH, "Konvensi angka per bahasa", "DT-30f ID:1929-1934, EN:1929-1936; DT-30g ID:1940-1945, EN:2022-2030; ID:1998-2006; EN:2076-2082; PK-13 EN:422-427", K),
  e("CR-4", "CR", "language", NTS, BOTH, "Bahasa teks pembungkus", "RQ-2/AC-6 02_structured:51,67; research/31 §6", K),
  // §3 sampul
  e("CV-01", "CV", "structure_a", TS, BOTH, "Urutan unsur sampul 1-11", "ID:2474-2484; EN:2546-2556"),
  e("CV-02", "CV", "structure_a", TS, BOTH, "Pita segel = unsur pertama sampul", "ID:2474, ID:2470; EN:2546, EN:2542"),
  e("CV-03", "CV", "structure_a", TS, BOTH, "Lebar logo 44-46 mm", "ID:2475; EN:2547"),
  e("CV-04", "CV", "structure_a", TS, BOTH, "Logo sekali di seluruh dokumen, hanya di sampul", "DT-14 ID:2492-2495; DT-13a ID:2450; EN:2525, EN:2564-2567, EN:2643"),
  e("CV-05", "CV", "structure_a", TS, BOTH, "Baris alamat persis, 7 pt", "ID:2476, ID:2574, ID:2582-2585; EN:2548, EN:2644, EN:2654-2657"),
  e("CV-06", "CV", "structure_a", TS, BOTH, "Datum Rule 166 mm di sampul", "ID:2478; EN:2550"),
  e("CV-07", "CV", "structure_a", TS, BOTH, "Kicker jenis dokumen = kicker pasangan", "ID:2479; EN:2551; research/31 §1"),
  e("CV-08", "CV", "structure_a", TS, BOTH, "Bentuk kicker: 7,4 pt Cond seal", "ID:2479, DT-13c ID:2542-2548; EN:2551, EN:2610-2618"),
  e("CV-09", "CV", "structure_a", TS, BOTH, "Ukuran judul 24-26 pt", "ID:2480; EN:2552"),
  e("CV-10", "CV", "structure_a", TS, BOTH, "Standfirst 10,5 pt Serif miring (bila ada)", "ID:2481; EN:2553"),
  e("CV-11", "CV", "structure_a", TS, BOTH, "Baris cakupan 7,6 pt Cond (bila ada)", "ID:2482; EN:2554"),
  e("CV-12", "CV", "structure_a", TS, BOTH, "Blok kendali 4 x 2, label 6,4 pt Cond, nilai 7,4 pt Mono, garis 0,45 mm", "ID:2483; EN:2555"),
  e("CV-13", "CV", "structure_a", TS, BOTH, "Medan inti blok kendali berurutan", "ID:2486, ID:15-17; EN:2558, EN:15-17; research/31 §10 baris 1"),
  e("CV-16", "CV", "structure_a", TS, BOTH, "Kolofon kiri persis", "ID:2575, ID:2586; EN:2645, EN:2658"),
  e("CV-17", "CV", "structure_a", TS, BOTH, "String punggung di sampul", "ID:2485, DT-13f ID:2718-2723; EN:2557, EN:2766, EN:2778-2783"),
  e("CV-18", "CV", "structure_a", TS, BOTH, "Semua unsur sampul rata kiri pada 24 mm", "DT-14 ID:2489-2495; EN:2561-2567"),
  // §4 lembar kendali
  e("CS-01", "CS", "structure_a", TS, BOTH, "Lembar kendali menyusul sampul dan dibuka pita segel", "ID:2470, ID:2500; EN:2542, EN:2569, EN:2762"),
  e("CS-02", "CS", "structure_a", TS, BOTH, "Kicker lembar kendali per bahasa", "ID:23; EN:23; research/31 §4.2"),
  e("CS-03", "CS", "structure_a", TS, BOTH, "Judul blok berhuruf berurutan per bahasa", "ID:27, 37, 56; EN:27, 36, 60; research/31 §4.2"),
  e("CS-04", "CS", "structure_a", TS, BOTH, "Kepala kolom tabel per bahasa", "ID:29, 39, 58; EN:29, 38, 62; research/31 §4.2"),
  e("CS-07", "CS", "structure_a", TS, BOTH, "Riwayat revisi ada", "ID:2500, ID:516-517; EN:2569"),
  e("CS-10", "CS", "structure_a", TS, BOTH, "Setiap salinan bernomor punya pemegang bernama (bersyarat)", "DT-13b ID:2503-2508; EN:2575-2580"),
  // §5 running head dan blok register
  e("RH-01", "RH", "structure_b", NTS, BOTH, "Kepala halaman menyebut bab di halaman itu, tanpa logo", "DT-13a ID:2450-2455, ID:349; EN:2525-2530, EN:397"),
  e("RH-03", "RH", "structure_b", NTS, BOTH, "Garis kepala seal 0,26 mm", "Tabel 8.1 ID:2576; EN:2646"),
  e("RH-04", "RH", "structure_b", NTS, BOTH, "Teks kepala ink400", "ID:2576; EN:2646"),
  e("RB-01", "RB", "structure_b", NTS, BOTH, "Blok register di kaki setiap halaman interior", "Gambar 8.7 ID:2726-2728; EN:2765"),
  e("RB-02", "RB", "structure_b", NTS, BOTH, "Urutan sel register, klasifikasi terakhir, kata per bahasa", "ID:2728, ID:348; EN:2787, EN:396"),
  e("RB-03", "RB", "structure_b", NTS, BOTH, "Jumlah lembar dari NUMPAGES, pemisah NBSP", "DT-13g ID:2732-2737; EN:2794-2799"),
  e("RB-04", "RB", "structure_b", NTS, ID_ONLY, "Nomor dokumen dan nomor lembar tebal ink900", "DT-13g ID:2732 (EN tidak mengatur, research/31 §10 baris 8)"),
  e("RB-05", "RB", "structure_b", NTS, BOTH, "Garis register: atas seal 0,35 mm, bawah ink200 0,20 mm", "Tabel 8.1 ID:2577; EN:2647"),
  e("RB-06", "RB", "structure_b", NTS, BOTH, "Tanggal register DD-<Romawi>-YYYY", "Tabel 6.2 ID:1978; EN:2059"),
  e("RB-07", "RB", "structure_b", TS, BOTH, "Halaman depan tanpa blok register", "ID:2510, praktik ID:304; EN:2765, praktik EN:310"),
  e("RB-08", "RB", "structure_b", NTS, EN_ONLY, "Lembar dihitung dari sampul tanpa mulai ulang", "EN:2582"),
  // §6 pita segel dan cap terbit
  e("SB-01", "SB", "structure_b", TS, BOTH, "Pita segel di kepala sampul dan lembar kendali, boleh di daftar isi, tidak di interior", "ID:2470, DT-13e ID:2709-2712, ID:72; EN:2542, EN:2762, EN:2773-2776, EN:75"),
  e("SB-02", "SB", "structure_b", TS, BOTH, "Bentuk pita: isian seal, teks F4F5F6, 5 x 166 mm", "Tabel 8.1 ID:2573; EN:2642, EN:1, EN:21"),
  e("SB-03", "SB", "structure_b", TS, BOTH, "Teks pita per bahasa", "ID:1, ID:21; EN:1, EN:21, EN:75; research/31 §4.4"),
  e("IS-01", "IS", "structure_b", TS, BOTH, "Format cap terbit per bahasa", "Tabel 6.2 ID:1979, ID:20; EN:2061, EN:20, EN:2791-2792; research/31 §4.4"),
  e("IS-02", "IS", "structure_b", TS, BOTH, "Konsistensi cap terbit (tanggal, kelas, bahasa)", "EN:2791; src/lib/studio/engine/front/texts.ts:189-198"),
  e("IS-03", "IS", "structure_b", TS, BOTH, "Cap terbit seal tebal", "Tabel 8.1 ID:2575; EN:2645"),
  // §7 geometri dan fon
  e("GF-01", "GF", "structure_b", NTS, BOTH, "Halaman A4", "ID:2655-2667; EN:2723-2735"),
  e("GF-02", "GF", "structure_b", NTS, BOTH, "Grid mendatar 24 + 166 + 20 mm", "Turunan 8.6A ID:2659-2665; EN:2727-2733"),
  e("GF-03", "GF", "structure_b", NTS, BOTH, "Batas tegak interior 13 / 26 / 273 / 284 mm", "Tabel 8.3 ID:2687-2699; EN:2751-2760"),
  e("GF-04", "GF", "structure_b", NTS, BOTH, "Hanya Plex; tanpa Calibri, Times New Roman, Aptos, Arial", "DT-08a ID:2609-2614; EN:2679-2685"),
  e("GF-05", "GF", "structure_b", NTS, BOTH, "Fon tertanam di DOCX", "DT-09 ID:2616-2621; EN:2687-2692"),
  e("GF-06", "GF", "structure_b", NTS, BOTH, "Badan 9,5 / 13,5 pt Serif", "Tabel 8.2 ID:2632; EN:2702"),
  e("GF-07", "GF", "structure_b", NTS, BOTH, "Kicker bab 6,8 pt Cond kapital signal (bersyarat)", "Tabel 8.2 ID:2631, DT-13c ID:2542-2543; EN:2701, EN:2610-2611"),
  e("GF-09", "GF", "structure_b", NTS, BOTH, "Lantai garis 0,18 mm (w:sz >= 5)", "DT-11a ID:2742-2747; EN:2803-2808"),
  e("GF-10", "GF", "structure_b", NTS, BOTH, "Tidak ada unsur lebih lebar dari 166 mm", "DT-10a ID:2669-2675; EN:2737-2743"),
  e("GF-11", "GF", "structure_b", NTS, BOTH, "Gambar isi selebar 128 atau 166 mm (bersyarat)", "DT-10a ID:2672-2675; EN:2737-2743"),
  e("GF-12", "GF", "structure_b", NTS, BOTH, "Navy dan emas pensiun", "DT-07 ID:2550-2555; EN:2620-2625"),
  e("GF-13", "GF", "structure_b", NTS, BOTH, "Teks klasifikasi seal tebal", "DT-28d ID:619-623; EN:657-661; Tabel 8.1 ID:2576-2577, EN:2646-2647"),
  e("GF-14", "GF", "structure_b", NTS, BOTH, "Setiap bab di seksi Word baru", "DT-13a ID:2450; EN:2525"),
  e("GF-15", "GF", "structure_b", NTS, BOTH, "Judul bernomor maks. tiga tingkat", "ID:2457; EN:2532"),
  e("DV-01", "DV", "structure_b", NTS, BOTH, "Datum Rule di atas judul bab", "EN:2763; legenda Gambar 8.6 ID:2705-2713"),
  // §8 penomoran
  e("NU-02", "NU", "language", NTS, BOTH, "Kode jenis konsisten di nomor, string punggung, dan templat", "ID:640-641; EN:536"),
  e("NU-03", "NU", "language", NTS, BOTH, "Spec templat doc.typeCode = daftar Rev A tanpa DS dengan NDA (dari tabel spec)", "ID:643-661; EN:681-683; research/31 §3.1"),
  e("NU-05", "NU", "language", NTS, BOTH, "Revisi tanpa desimal", "ID:515-516; EN:538-539"),
  e("NU-07", "NU", "language", NTS, BOTH, "Bulan Romawi dan tahun nomor = tanggal dokumen", "ID:640-641; EN:536"),
  // §9 tier
  e("TR-01", "TR", "structure_a", TS, BOTH, "Tier efektif = tier bawaan pasangan", "DT-02 ID:406-412; EN:440-451; research/31 §2"),
  e("TR-02", "TR", "structure_a", N, BOTH, "NOTA tanpa sampul, lembar kendali, tanda tangan, daftar isi", "ID:357, ID:380; EN:349; seed-studio.ts:571-574"),
  e("TR-03", "TR", "structure_a", TS, BOTH, "TERBIT/SERAH: sampul, lembar kendali, tanda tangan, daftar isi sebelum Bab 1", "ID:2500; EN:2569; seed-studio.ts:570-578"),
  e("TR-04", "TR", "structure_a", TS, EN_ONLY, "Nama tier tetap Indonesia di EN", "EN:447"),
  e("TR-08", "TR", "structure_a", TS, BOTH, "Daftar isi sampai tingkat seksi", "ID:2511; EN:2582"),
  // §10 konvensi angka
  e("NC-04", "NC", "language", TS, BOTH, "Tanggal panjang (REVISI sampul) dengan nama bulan bahasa itu", "Tabel 6.2 ID:1975; EN:2053; ID:2001"),
  // §11 AC-6
  e("AC6-03", "AC6", "language", NTS, EN_ONLY, "Daftar perluasan token Indonesia di lokasi pembungkus EN", "research/31 §6; RQ-2 02_structured:51"),
  // §12 label bahasa
  e("LB-01", "LB", "language", TS, BOTH, "Label blok kendali sampul per bahasa (Prepared by)", "ID:15-18; EN:15-18, EN:2558; research/31 §4.1, §4.3"),
  e("LB-02", "LB", "language", TS, BOTH, "Satu judul daftar isi per bahasa", "ID:74; EN:77; research/31 §3.4, §4.5"),
  e("LB-03", "LB", "language", NTS, BOTH, "Kicker pembuka bab per bahasa (bersyarat)", "ID:76; EN:79; texts.ts:89-104"),
  e("LB-06", "LB", "language", TS, BOTH, "Peran tanda tangan per bahasa (sampel MCP)", "EN:2570; D-590; research/31 §4.3"),
  e("LB-09", "LB", "language", NTS, BOTH, "Label aparatus per bahasa (bersyarat)", "ID:2402-2405, ID:2659; EN:2327, EN:2496, EN:2721, EN:2727"),
  e("LB-10", "LB", "language", TS, BOTH, "Catatan revisi bawaan per bahasa (bersyarat)", "EN:31; research/31 §4.3"),
  e("LB-11", "LB", "language", TS, BOTH, "Peran rantai verifikasi per bahasa (sampel MCP)", "research/31 §4.3"),
  // §13 detektor bentrok teks pembungkus (dihitung bentrok, bukan skor)
  e("X-01", "X", "language", NTS, BOTH, "Dua bahasa di teks pembungkus", "D-593; research/32 §13", X),
  e("X-02", "X", "language", NTS, BOTH, "Dua kode jenis", "D-593; research/32 §13", X),
  e("X-03", "X", "language", NTS, BOTH, "Dua kicker", "D-593; research/32 §13", X),
  e("X-04", "X", "language", NTS, BOTH, "Dua klasifikasi", "D-593; research/32 §13", X),
  e("X-05", "X", "language", NTS, BOTH, "Kode bahasa bertentangan", "D-593; research/32 §13", X),
];

export const CATALOG_BY_ID: ReadonlyMap<string, CatalogEntry> = new Map(DATUM_CATALOG.map((r) => [r.id, r]));

/** Butir CAKUPAN-saja (research/32 §14): dinilai matriks S33, tidak boleh didaftarkan sebagai aturan. */
export const COVERAGE_ONLY_CODES: readonly string[] = [
  "CV-14", "CV-15", "CV-19", "CV-20", "CV-21",
  "CS-06", "CS-08", "CS-09", "CS-11", "CS-12",
  "RB-08c",
  "GF-08", "GF-16", "GF-17", "GF-18", "GF-19", "GF-20", "GF-21", "GF-22", "GF-23", "GF-24",
  "NU-06", "NU-08", "NU-09",
  "TR-05", "TR-06", "TR-07",
  "NC-05", "NC-06", "NC-07", "NC-08",
  "LB-07", "LB-08", "LB-12", "LB-13",
  "CL-02", "CL-03", "CL-04",
  "ST-01",
];

/** Butir cakupan yang sudah di luar lingkup (research/32 §14). */
export const OUT_OF_SCOPE_COVERAGE: ReadonlySet<string> = new Set(["GF-16", "TR-06", "NC-08", "CL-04"]);

export interface ApplicabilityQuery {
  readonly tier: Tier;
  readonly language: Lang;
  readonly typeCode: string;
}

export function isApplicable(entry: Pick<CatalogEntry, "applicability">, q: ApplicabilityQuery): boolean {
  const a = entry.applicability;
  return a.tiers.includes(q.tier) && a.languages.includes(q.language) && (a.types === "all" || a.types.includes(q.typeCode));
}

export function catalogApplicable(catalog: readonly CatalogEntry[], q: ApplicabilityQuery): CatalogEntry[] {
  return catalog.filter((r) => isApplicable(r, q));
}

# coder-execution IP-50 — pembersihan pasca SR-16/SR-17 (D-172, D-197)

status: needs-review (lingkup area selesai dan terverifikasi; kriteria grep `pageSizeFromKnob` = 0 di `src/` terhalang berkas di luar area)
Klaim: `file_claims.md` prefiks IP-50.

## Perubahan
| Berkas | Perubahan |
|---|---|
| `src/lib/studio/engine/tokens/paper.ts` | fungsi diganti nama `pageSizeFromKnob` -> `pageSizeFromPaper` (kanonik D-172), komentar |
| `src/lib/studio/engine/tokens/index.ts` | ekspor `pageSizeFromPaper`; alias `pageSizeFromKnob` dihapus |
| `src/lib/studio/engine/tokens/grid.ts` | impor + `pageSizeDeriver` memakai `pageSizeFromPaper`; komentar. Id `DeriveFnId` "pageSizeFromKnob" TETAP (dipaksa `satisfies` selama kontrak memuatnya) |
| `src/lib/studio/engine/docx/package/section.ts` | impor langsung `pageSizeFromPaper` (tanpa `as`); konstanta @deprecated `A4_PORTRAIT_TW` dihapus (0 pemakai) |
| `src/lib/studio/engine/docx/package/index.ts` | re-ekspor `A4_PORTRAIT_TW` dicabut |
| `src/lib/studio/engine/docx/wrapper/formats.ts` | `textWidthTw`: selalu `resolveUnitSetup(unit, ctx.tpl)` (slot.setup + orientasi slot ikut), lebar = pgSz - kiri - kanan - gutter; unit tak dikenal/lebar <= 0 -> `grid.fullSpanMm`; tanpa literal 166 (param absen = BY_CONSTRUCTION_FAILED) |
| `src/lib/studio/engine/html/base/params.ts` | impor + satu panggilan (`pageSizeMm`) + komentar ke `pageSizeFromPaper` (panggilan wajib ikut agar terkompilasi) |
| `src/lib/studio/engine/html/base/markup.ts` | `FIELD_ALIASES` P4S-13 = DOCX `REGISTER_BOLD_ALIASES`: + "jumlah lembar" -> N, "organisasi"/"org" -> org; `trim()` seperti DOCX |

## Bukti
- grep `A4_PORTRAIT_TW` di `src/` dan `scripts/`: 0 hasil.
- grep `pageSizeFromKnob` di `src/`: tersisa 8 baris, semuanya id `DeriveFnId` kontrak/komentar: `contract/types/params.ts:105,107` (luar area), `params/structure.ts:11` (komentar, luar area), `engine/tokens/grid.ts:42,145,343,486,487,491` (dipaksa union kontrak). Fungsi/ekspor alias = 0. Permintaan: `file_requests.md` 2 baris IP-50.
- Render benchmark v1 (`render_cli` doc.json + template.json, `--formats docx,html`, `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/ip50/`), semua SUCCEEDED:
  - DOCX sebelum = sesudah `53485ebc1eddd145ee6b67d8f2c68fbec040eae8b3c8ef6cf4e2f4f0c3969db6`.
  - HTML sebelum `6b414184a6e1ba0b…7aef`, sesudah `63ff8989305186561de8426d975bbf93d1a9906d92646cf82dee4b98d20a1b87`. Isolasi (`iso_v1`: semua perubahan kecuali alias markup) HTML = `6b414184a6e1ba0be5caa54002abd26285b6704828c240a2e77b514e47527aef` (identik garis dasar). Selisih sesudah = HANYA 22 sel `{N}` kini `<b><span class="st-sheet-total"></span></b>` (boldFields efektif memuat "jumlah lembar"; DOCX sudah menebalkan NUMPAGES) — perubahan paritas yang disengaja IP-44, diverifikasi: string sebelum/sesudah identik setelah `<b>` itu dinormalkan.
- A4 landscape (template + `page.orientation=landscape`): DOCX sebelum = sesudah `e6909f6e6437e1787ed3b554d0a848668c8d8451cb4809754997803cebac747a`, 29x `<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>`; HTML `@page{size:297mm 210mm` + `@page st-sheet{size:297mm 210mm`; selisih HTML sama (22 sel N tebal, sisanya identik).
- `npx tsc --noEmit -p .`: 6 galat, 0 di area (`benchmark/extract/convert_v2.ts` 1, `benchmark/harness/run/lib/pipeline.ts` 1, `src/components/studio/document-viewer/index.ts` 4).
- `npx eslint` 6 berkas area + `engine/tokens`: exit 0.
- Tidak ada uji vitest yang menyentuh simbol yang diubah. DB, HKCU, port tidak disentuh.

## Keputusan / isu
| Isu | Resolusi |
|---|---|
| Kriteria "sha HTML sama" bertentangan dengan tugas alias P4S-13 (boldFields efektif benchmark memuat "jumlah lembar") | selisih diisolasi dan dibuktikan hanya tebal `{N}` (paritas DOCX); controller memutuskan terima |
| `pageSizeFromKnob` sebagai id `DeriveFnId` di kontrak (luar area) | permintaan ke pemilik kontrak; grid.ts dibersihkan sesudahnya |
| `html/base/params.ts` di luar "baris impor saja": 1 panggilan + 1 komentar | wajib agar terkompilasi setelah alias dihapus |

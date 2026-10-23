# Catatan document-specialist DOC-1 (IP-60, D-227; lanjutan SR-35b)

Status: complete (lanjutan D-229/D-230 sesudah FIX-5; Temuan 1 tertutup, lihat seksi Lanjutan). Tanggal 2026-10-23. Skill: document-quality-standards (modul D, E, F, H). Klaim DOC-1 di `file_claims.md`.

## Berkas diubah
| Berkas | Perubahan | Lokasi sesudah edit |
|---|---|---|
| `masterplan/03_structural_sections_specs.md` | T2-23 (panels 1..24, highlight 1..64), T2-24 (4 medan data opsional), T2-25 (`limit`), KD-17 (aturan kategori + seri), catatan chart baru di bawah tabel §4.3 (aturan highlight, padanan v1, daftar tampilan yang ditolak, lebar per jenis figur), celah DF di §5.1, baris adaptor `chart.spec` §R-38 (params data, sorotan, sisa dibuang) | :110, :324-326, :335-340, :540, baris `chart.spec` tabel adaptor |
| `docs/STUDIO-AGENT-GUIDE.md` | tabel blok §4 (image `source` wajib; chart lengkap); seksi baru 4.1 "Figur: chart dan gambar" + contoh `studio:validate studio.chapter/v2`; §13 dua batas baru; §15 tabel kunci templat RQ-8 (lanjutan ADMIN) | :143-144, :200-283, :1101-1102, :1180-1196 |
| `docs/API-REFERENCE.md` (§12 saja) | paragraf "Konten figur v2 (ringkas)" | :257-270 |

## Medan yang ditulis vs skema (semua cocok)
| Klaim dokumen | Sumber kode | Cocok |
|---|---|---|
| `ChartV2.panels` 1..24 | `contract/schema/v2/common.schema.ts:472` | ya |
| `ChartV2.limit {value,label?}` | `common.schema.ts:477`; `types/v2/doc.ts:190` | ya |
| `ChartPanelV2` {name, code, data, highlight?, unit?, dec?, limit?, caption?, axisNote?} | `common.schema.ts:452-464`; `doc.ts:158-170` | ya |
| `highlight` 1..64, string atau integer >= 0 | `common.schema.ts:168-173` | ya |
| `categorical.points[].target?` | `common.schema.ts:184`; `doc.ts:129` | ya |
| `xy.divider {x?,y?}` min 1 sumbu | `common.schema.ts:207`; `doc.ts:134` | ya |
| `distribution.binEdges` 2..201 | `common.schema.ts:246`; `doc.ts:146` | ya |
| `distribution.sectors` integer 4..72 | `common.schema.ts:247`; `doc.ts:146` | ya |
| aturan sorotan series (kategori + tepat satu seri = satu titik) | `services/compose/blocks.ts:314-321`; dok `doc.ts:180-187` | ya |
| distribution: butir pertama, angka = indeks grup/sektor | `compose/blocks.ts:342-344` | ya |
| `accentCategory`/`accentSectorDeg` = padanan v1 -> highlight (bukan medan v2) | `services/adapt-v1/blocks.ts:447-465` | ya |
| params data P-09/P-13/S-01/S-08 -> data (adaptor) | `adapt-v1/blocks.ts:393-446` | ya |
| panel `limit`/`limitLabel` -> `limit` (adaptor), -> mesin (compose) | `adapt-v1/blocks.ts:507-513`; `compose/blocks.ts:391-394` | ya |
| `ImageV2.source` wajib; juga Chart/Diagram/SymbolSheet | `common.schema.ts:510` (+ :481, :500, :514); D-222 | ya |
| `params` di chart -> DISPLAY_FIELD; `accent` di data -> V1_FIELD | `contract/schema/v2/forbidden.ts:56` (DF-40), `:142` (VF-12) | ya |
| TocPayloadV2 `title`/`note` -> DISPLAY_FIELD | `forbidden.ts:93` (DF-58) | ya |
| `render.toc.title`/`render.toc.note` string null; `image.widthClass`/`symbolSheet.widthClass` text\|full bawaan text; `*.widthMm` T turunan | `params/render.ts:266-307` | ya |
| lapis: R-59..R-62 advanced, R-63/R-64 derived | `registry/essentials.ts:97`, `:116` | ya |
| lingkup: widthClass `section:image`/`section:symbolSheet`, widthMm document, `render.toc.*` `section:toc` | `registry/slots.ts:137-138`, `:167-168`, `:213` | ya |
| EK-chapter-04/05 = `chart.widthClass`/`diagram.widthClass` | `registry/essentials.ts:482-507` | ya |
| lebar figur per jenis dari parameter templat | `compose/blocks.ts:97-98` | ya |

## Bukti verifikasi
Skrip `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc1/verify_doc1.ts` (validator kontrak repo `services/ingest/validate.ts` `validateV2Against` = ajv + `classifySchemaV2Errors`), dijalankan `npx tsx` dari root repo, keluaran `doc1/verify.txt`: exit 0, 34 PASS, 0 FAIL, "SEMUA LULUS".
- 8 contoh `studio:validate` isi (doc/chapter/slot v2) di panduan 0 isu dan 0 nama DF global/overrides/x, termasuk contoh baru 4.1 (L247): `PASS validate L247 studio.chapter/v2 - isu 0 [] df []`. Contoh `studio:invalid` L161 tetap DISPLAY_FIELD. 7 contoh non-isi (structure-patch, render, pid-patch, asset-upload, fragment) dilewati: validator lain, cakupan SR-35.
- 12 cek skema (tabel di atas) PASS.
- 13 cek perilaku galat PASS (lihat Temuan 1 untuk isi).
Probe awal: `doc1/probe_doc1.ts`.

## Temuan untuk controller
1. **Brief tidak cocok kode:** brief menyebut `axis`, `max`, `belowTargetColour`, `compassLabels`, `medianLabel` -> agen mendapat DISPLAY_FIELD. Kode saat ini: kelima nama itu tidak ada di `DISPLAY_FIELDS_GLOBAL`/`DISPLAY_FIELDS_BY_LOCATION` (`forbidden.ts:16-68`, `:83-98`), jadi ditolak `400 SCHEMA_INVALID` `additionalProperties` TANPA `checkId`, pointer = objek induk, nama medan di `message` (bukti: `PASS ditolak axis (additionalProperties, tanpa checkId) - [{"pointer":"/chapter/sections/0/blocks/0","keyword":"additionalProperties","message":"must NOT have additional properties: \"axis\""}]`). Hal sama untuk `image.widthClass`. Ketiga dokumen menulis perilaku nyata ini, bukan klaim brief. Bila DISPLAY_FIELD diinginkan: tambah entri DF baru (mis. DF-63 per lokasi ChartV2/ChartPanelV2/varian ChartDataV2, plus `widthClass` di figur) di `forbidden.ts` + register §5.1 = keputusan controller dan baris coder; sesudahnya teks tiga dokumen perlu disesuaikan (register :339, :540; panduan 4.1; API §12).
2. Tabel kunci RQ-8 sengaja diletakkan di §15 (pengguna templat), bukan di panduan agen bagian isi: sesuai D-139, agen tidak mengatur tampilan. Panduan 4.1 hanya memberi tahu bahwa lebar per jenis figur diputuskan templat dan menyuruh melapor, bukan menambah medan.
3. Skrip SR-35 (`sr35_verify_docs.ts`, kenop 30/30) tidak ditemukan di scratch yang dapat diakses; §15 kini memuat tabel kedua (4 baris kunci lanjutan, bukan `EK-`). Bila skrip itu mem-parse semua tabel §15, jalankan ulang untuk memastikan.
4. Di luar area: `docs/API-REFERENCE.md:38` (bukan §12) memuat satu karakter emoji (U+1F578) pra-ada; tidak disentuh.

## Lanjutan D-229/D-230 (sesudah FIX-5)
`forbidden.ts:87` `CHART_DISPLAY_HINTS`; `:112-118` DF-63..DF-69. Perubahan teks:
- Register: §5.1 tabel per lokasi + DF-63..DF-69 (kolom Keterangan = `reason` apa adanya), paragraf celah diganti penjelasan `CHART_DISPLAY_HINTS`; catatan chart §4.3 butir 3 kini DISPLAY_FIELD berpointer medan; hitungan DF-01..DF-69 di :35, :84 (PT-01), C30, ringkasan "69 (52 global + 17 per lokasi)"; judul tabel per lokasi disesuaikan.
- Panduan 4.1: lima medan chart, `widthClass` di figur, dan `params` = DISPLAY_FIELD berpointer medan; daftar contoh medan tampilan §4 + `widthClass`.
- API §12: paragraf konten figur diselaraskan (DF-63..DF-69, D-229).
Bukti: `verify_doc1.ts` dijalankan ulang, exit 0, 55 PASS, 0 FAIL, "SEMUA LULUS" (`doc1/verify.txt`). Cek baru: 20 kasus (5 medan x ChartV2, ChartPanelV2, data categorical, data distribution) masing-masing tepat 1 issue `checkId: "DISPLAY_FIELD"` dengan pointer = medan; `widthClass` di image/symbolSheet/chart/diagram -> DISPLAY_FIELD (kontrol tanpa medan 0 isu); jumlah entri 52 + 17 = 69; register memuat DF-63..DF-69 dengan reason identik `forbidden.ts`. 8 contoh isi panduan tetap 0 isu.

## Siklus review D-233 (3 Minor + IP-61)
- F-1: register catatan chart butir 1 dan panduan 4.1: pada S-08 angka `highlight` SELALU indeks sektor 0-based (bawaan 36 bila tanpa `sectors`); dasar `compose/blocks.ts:342-344`, `engine/chart/family-s2/radial.ts:20,56,103-104`.
- F-2: register butir 2: `accent` (atau tanpa `accent`, `params.accentPoint/Group/Series`) = sumber utama, selalu dipetakan (`adapt-v1/blocks.ts:347-355`); `accentCategory`/`accentSectorDeg` hanya bila `highlight` masih kosong (`:450`, `:460`).
- F-3: klaim "Keterangan = reason" dibatasi ke DF-63..DF-69; DF-53..DF-62 sengaja bergaya register (mis. DF-54 "R-50"), makna sama dengan `reason` tetapi tidak harfiah.
- IP-61: `docs/API-REFERENCE.md:38` emoji contoh diganti escape JSON `"\ud83d\udd78\ufe0f"` (nilai JSON identik, dicek `JSON.parse`).
- INSIDEN (dilaporkan apa adanya): skrip Python penyunting gagal saat menulis `API-REFERENCE.md` (surrogate dari escape) SETELAH berkas dibuka mode tulis, sehingga berkas terpotong 0 byte. Dipulihkan tanpa backup: `git show HEAD` (baris 1-224; semua klaim baris lain hanya §12) + pemisah + §12 hasil `sed -n 228,326p` saya sendiri dari transkrip sesi (sebelum edit DOC-1), lalu edit DOC-1 diterapkan ulang dengan string yang sama. Bukti kesetiaan: ukuran sebelum insiden 27.022 byte; sesudah pulih 27.033 = 27.022 + 11 (emoji UTF-8 7 byte -> escape 18 byte); 341 baris = 326 + 15 baris paragraf. Penulisan kini lewat berkas sementara + `os.replace`. Skrip pulih: `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc1/recover/rebuild.py`. Disarankan controller/reviewer membandingkan §12 dengan salinan yang dimiliki.
- Bukti: `verify_doc1.ts` exit 0, 61 PASS, 0 FAIL, "SEMUA LULUS" (cek baru F-1..F-3, IP-61, paragraf §12).

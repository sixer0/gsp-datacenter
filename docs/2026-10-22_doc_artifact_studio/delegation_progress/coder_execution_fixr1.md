---
task_id: FIX-R1
task_slug: doc_artifact_studio
row: FIX-R1 (D-342 S1; uji ulang Hermes)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-342)
status: complete
---

# FIX-R1: rel K2 rev B (indentasi kanan hanya pada inang chip) + ASSERT G-RAIL-3

Skill: diagnosing-bugs, dry-run-verify-fix. Rahasia uji dibaca dari berkas oleh skrip, tidak pernah dicetak. Skrip dan keluaran ada di luar repo (scratchpad sesi `.../scratchpad/fixr1/` dan `C:/Users/TRIAL/AppData/Local/Temp/fixr1_m000/`). Semua penulisan berkas memakai tmp + rename.

## Ringkasan

- **Akar cacat S1:** templat `datum-gsp` v3 mewarisi profil Manual 000. Profil itu menulis `roleFormats.body.paragraph/list.bullet/list.number/part.lede.para.indRightTw = 2154`, dan nilai ini sama dengan cadangan rel (340 + 1814). Pada `table3col`, varian `table` membuang nilai itu. Pada `framePr`, varian `plain` (paragraf tanpa rel) mempertahankannya, sehingga semua prosa tanpa chip ikut menyempit 38 mm. HTML punya cacat yang sama dalam dua lapis: inline `margin-right:107.7pt` dari peran, dan CSS moda A `max-width:var(--col)` untuk elemen non-inang.
- **Perbaikan DOCX:** `hostFormat` (blocks/text.ts) kini membuang indentasi kanan PERAN pada varian `plain` bila nilainya sama dengan cadangan rel dan tata rel berada di moda K2 (A + `framePr`). Format eksplisit blok tetap menang. Inang tetap `w:right` = cadangan rel dan chip `framePr` tidak berubah. Cadangan mengikuti token grid: pada Letter nilainya `mmToTw(gutter) + mmToTw(rel)`, dan lebar penuh sama dengan lebar teks turunan karena paragraf tidak lagi diberi indentasi kanan.
- **ASSERT G-RAIL-3 rev B (K2):** `assertRailK2` (rail.ts) dipanggil perakit DOCX untuk setiap unit alir (semua kecuali sampul, lembar kendali, daftar isi, dan pembatas bagian). Pemeriksaannya dua arah pada tingkat paragraf, padanan per-paragraf dari G-RAIL-3 HS (pgMar <=> chip) setelah RAIL rev B memindahkan rel ke properti paragraf. Paragraf ber-`w:ind w:right` = cadangan tanpa chip sesudahnya, atau chip tanpa inang, menghasilkan `BY_CONSTRUCTION_FAILED` dan render gagal keras. Bila lulus, log info mencatat `G-RAIL-3 rev B (K2) lulus: n unit, n inang, n chip`. Moda B dan `table3col` tidak diperiksa.
- **Sumber tunggal tata rel:** logika `BlockEnv.rail()` dipindah tanpa perubahan perilaku ke `resolveRailLayout` (rail.ts), yang juga dipakai perakit, varian `plain`, dan HTML. `railK2ReserveOf` tidak menuntut `grid.textColumnMm`, karena kolom teks tidak termasuk cadangan.
- **Padanan HTML:** `k2Format` (html/blocks/text.ts) membuang margin kanan peran yang sama dengan cadangan untuk paragraf, butir daftar, dan assumptionInline, baik inang maupun bukan. Inang sudah menyempit lewat grid `.st-railhost`, jadi sebelumnya ia menyempit dua kali. `buildHtmlShell` menambah penanda `st-rail-k2` dan satu aturan CSS `max-width:none` (spesifisitas 0,4,1) hanya pada moda A + `framePr`.
- **Manual 000 tidak berubah:** DOCX dan HTML v1 maupun v2 sebelum = sesudah, byte-identik.

## Bukti

| Cek | Perintah | Hasil |
|---|---|---|
| Hermes v3 SEBELUM (red) | `render.py` (POST `/api/studio/documents/cmvui0qun000qv11gtygb1mk9/render` docx,html, dok `003/GSP/KT/X/2026` rev 10, templat `cmvue8khb000hv1us9qwwbkyf` = datum-gsp v3) + `analyze.py` | 200 SUCCEEDED, DOCX `4606381efac16e47`: framePr 2 bentuk kanonis, inang 2 (`w:right` 2154), **prosa tanpa chip `w:right=2154`: 25**. HTML: `margin-right:107.7pt` x25, tanpa `st-rail-k2`. Cocok dengan temuan Hermes S1 (24 di berkas retrial Hermes `full.docx`, angka sama dengan alat yang sama) |
| Hermes v3 SESUDAH | sama | 200 SUCCEEDED, DOCX `c4a0ece23990a3d8` (header = janji): framePr 2 `<w:framePr w:w="1814" w:wrap="none" w:hAnchor="margin" w:x="7597"/>`, tabel rel 1x3 = 0, inang 2 `w:right` 2154, **prosa tanpa chip `w:right=2154`: 0**. Sisa `w:right` non-inang hanya 1701 x2 (standfirst sampul + pernyataan metode lembar kendali, bukan cadangan rel). HTML `99044513d7daebd0`: `<body class="st-doc st-rail-a st-rail-k2"`, aturan K2 ada, `margin-right:107.7pt` = 0 |
| Manual 000 v1 | `npx tsx scripts/parity/run/render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx,html` sebelum lalu sesudah sunting | DOCX `38b489b97677a98d` = `38b489b97677a98d`; HTML `e05a18f24291311e` = `e05a18f24291311e` |
| Manual 000 v2 | sama dengan `doc.v2.json` + `template.v2.json` | DOCX `5cbdc81e7214624b` = `5cbdc81e7214624b`; HTML `abdbc9a2c76f1e1f` = `abdbc9a2c76f1e1f` |
| Uji unit baru | `npx vitest run tests/unit/studio/renderers/fixr1-rail-k2.test.ts` | 11/11 lulus (DOCX A4 GSP, Letter, assert gagal keras atas format eksplisit, table3col tetap; assert sintetis 4 kasus; HTML GSP + M000) |
| Unit studio | `npx vitest run tests/unit/studio` | exit 0; Test Files 92 passed (92); Tests 2386 passed, 1 skipped (2387) |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, 0 baris |
| Lint area | `npx eslint <6 berkas src> tests/unit/studio/renderers/fixr1-rail-k2.test.ts` | exit 0, 0 baris |

Catatan hash: v1 Manual 000 di lingkungan ini `38b489b9…`, berbeda dari `53485ebc…` FIX-H4 karena pohon kerja memuat perubahan baris paralel. Itu sebabnya yang dibandingkan adalah sebelum vs sesudah di lingkungan yang sama, sesuai brief.

## Changes Made

| File | Change | Deskripsi |
|---|---|---|
| src/lib/studio/engine/docx/blocks/rail.ts | modify | `resolveRailLayout` (resolver murni tata rel), `railK2ReserveTw`, `railK2ReserveOf`, `assertRailK2` + `scanParagraphs` (G-RAIL-3 rev B), komentar K2 di kepala modul |
| src/lib/studio/engine/docx/blocks/env.ts | modify | `rail()` mendelegasikan ke `resolveRailLayout` (perilaku identik, termasuk P4S-07 FIX-H4) |
| src/lib/studio/engine/docx/blocks/text.ts | modify | `hostFormat` varian `plain` pada moda K2 membuang `indRightTw` peran yang sama dengan cadangan rel |
| src/lib/studio/engine/docx/assemble/index.ts | modify | Panggilan `assertRailK2` per unit alir + log info agregat |
| src/lib/studio/engine/html/blocks/text.ts | modify | `k2Format` untuk paragraf, butir daftar, dan assumptionInline |
| src/lib/studio/engine/html/base/shell.ts | modify | Penanda body `st-rail-k2` + aturan CSS `RAIL_K2_CSS` (hanya moda A + framePr) |
| tests/unit/studio/renderers/fixr1-rail-k2.test.ts | add | 11 uji |
| docs/.../delegation_progress/file_claims.md | modify (append) | Klaim FIX-R1 |

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| `part.lede` dari medan bagian (`wrapper/pages.ts:507` `roleParagraphXml`) tetap memakai `indRightTw` 2154 peran pada profil turunan Manual 000 | 0 (berkas milik FIX-T2, di luar area) | Peran `part.lede` membawa cadangan rel; jalur pembatas bagian tidak lewat `hostFormat` | Unit `part` dikecualikan dari gerbang (bukan prosa badan), jadi render tidak gagal. Dokumen Hermes tanpa bagian tidak terdampak. Bila K2 juga berlaku di halaman pembatas, pemilik pages.ts menerapkan `railK2ReserveOf` yang sama | Tidak |
| Moda B eksplisit (`layout.railMode: "B"`) pada profil turunan Manual 000 tetap mempertahankan indentasi peran 2154 | 0 | Di luar moda K2 perilaku sengaja tidak diubah (brief: hanya perender framePr) | Tercatat; `datum-gsp` memakai moda A | Tidak |

## Issues & Decisions

| Butir | Keputusan / catatan |
|---|---|
| Kriteria "paragraf tanpa rel" | Hanya indentasi PERAN yang sama persis dengan cadangan rel yang dibuang. Indentasi peran lain (mis. 1701 sampul) dan format eksplisit dipertahankan. Format eksplisit sebesar cadangan pada paragraf tanpa chip membuat gerbang gagal keras, sesuai brief. Kiriman v2 konten-saja memang tidak membawa `format` (D-139) |
| Lingkup gerbang | Unit alir badan (chapter, appendix, slot). Unit muka dikecualikan karena bukan prosa badan |
| HTML inang | Margin peran dibuang juga pada inang, karena grid `.st-railhost` sudah memberi ruang rel (sebelumnya inang HTML menyempit dua kali) |
| Jejak DB | Dua job render (sebelum/sesudah) pada dok 003 oleh `agent:coder-execution-fixr1` lewat endpoint, sesuai brief. Tidak ada revisi baru |
| Red check uji unit | Tidak dijalankan di HEAD bersih karena pohon kerja dibagi baris paralel. Bukti red = render Hermes SEBELUM (25 paragraf menyempit) |

## Next Steps

- Review direkomendasikan (`senior-code-reviewer`, lingkup: 6 berkas src di atas + uji fixr1).
- Pemilik `wrapper/pages.ts` (FIX-T2/controller): putuskan K2 untuk `part.lede` pembatas bagian.

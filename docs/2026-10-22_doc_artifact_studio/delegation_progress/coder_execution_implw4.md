---
task_id: IMPL-W4
task_slug: doc_artifact_studio
row: IMPL-W4
date: 2026-11-03
agent: coder-execution
source_plan: brief controller IMPL-W4 (D-544..D-547), research/28 §10, verification/14
status: complete
---

# Laporan Implementasi: IMPL-W4 - perbaikan ronde 6 jalur tulis Studio

Laporan ditulis bertahap (append). Status akhir ditetapkan di bagian akhir.

## Log kerja (bertahap)

- Butir 1 (penomoran sumber), mesin: kontrak `OutlineEntryV2.label?` (pola `^[A-Za-z0-9]{1,8}$`; tipe `contract/types/v2/common.ts`, skema `contract/schema/v2/common.schema.ts`). Disimpan di payload outline slot konten (JSON yang sudah ada; TANPA migrasi DB). `services/compose/snapshot.ts`: bab berlabel -> kicker kosong eksplisit `{ text: "" }`, nomor section kosong eksplisit `""`, label artefak `Tabel <label>.n` / `Gambar <label>.n` dengan penghitung bersama per label. Perender: `engine/front/texts.ts` `kickerSuppressed()` (satu sumber), DOCX `blocks/structure.ts` (paragraf kicker tidak ditulis), HTML `blocks/text.ts` (kicker + nomor section kosong, jangkar cadangan alamat), daftar isi DOCX `wrapper/pages.ts` + `wrapper/toc-refs.ts` dan HTML `blocks/wrapper.ts` (label bab kosong, label section kosong), kepala halaman `package/header-footer.ts` (tanpa "Bab n"), `assemble/numbering.ts` (tanpa NUMBERING_MISMATCH untuk bab berpenomoran sumber). Semua bercabang hanya pada nilai baru (label/kicker kosong eksplisit/nomor kosong eksplisit), jadi dokumen tanpa label tidak berubah.
- Butir 1, MCP: `write-client.ts` `sourceLabelOf`, `usesSourceNumbering`, `planSource` (kunci internal 1..n urutan agen, judul apa adanya, label = nomor bab sumber / komponen pertama sub-judul bernomor / label bab sebelumnya), `chapterOf(..., keepNumbers)`, `BuiltClient.outline`; `write-client-run.ts` selalu menetapkan outline berlabel di mode sumber.
- Uji mesin `tests/unit/studio/renderers/implw4-source-numbering.test.ts`: 5/5 hijau (kontrak, label Tabel FM.1/6.1, DOCX judul persis tanpa kicker/nomor ganda, TOC/kepala halaman tanpa "Bab n", HTML, dan kontrol tanpa label = perilaku lama).
- Butir 1, uji MCP `tests/unit/studio/mcp/implw4-numbering.test.ts` 5/5 hijau (bentuk r5b: 6 bab berurutan, judul persis "FM.1 ...", "Chapter 1. Introduction", sub-judul "1.1 ..".."1.4 ..", "10.1".."10.3", label outline FM,FM,FM,1,6,10, tanpa SECTION_NESTED/SUBHEADING_NUMBER_STRIPPED/CHAPTER_RENUMBERED; dokumen tanpa nomor = outline null, perilaku lama). Uji lama yang diubah dengan sengaja (perilaku IMPL-W3 butir 8 diganti): `implw2-client.test.ts` (2 asersi: kunci internal berurutan + judul apa adanya; outline berlabel `[['1','6'],['2','6']]`), `implw3-client-builder.test.ts` (1 asersi: judul/sub-judul persis, label `['4','4','5']`).
- Suite mesin terdampak (renderers, compose, structure, contract, api-structure): 72 berkas, 1.367 lulus / 1 lewati / 0 gagal (sesudah perubahan butir 1).
- Bukti MERAH butir 1 dan 2: salinan HEAD murni (`git archive HEAD` ke `%TEMP%/claude/w4/head`, node_modules junction; tidak mengubah repo) + berkas uji baru: `implw4-source-numbering` 4 gagal / 1 lulus (kontrol tanpa label), `implw4-numbering` 5/5 gagal; `implw4-meta` 7 gagal / 1 lulus (impor `write-meta` dihapus di salinan HEAD agar kegagalan perilaku terlihat). Keluaran: `%TEMP%/claude/w4/red_1_2.txt`, `red_2.txt`.
- Butir 2 (status/meta selalu diterapkan): `write-content.ts` `recordLines` kini mengembalikan `given` (medan kepala yang DIBERI agen dan sah; bawaan mesin seperti status draft/ReportedAt hari ini/Owner = agentId tidak termasuk) -> `BuiltReport.givenFields`; `recordMetaFields()` untuk saluran meta (`STATUS_NOT_APPLIED`, `REPORTED_AT_NOT_APPLIED` bila tak dikenal). `write-tools.ts`: `patchRecordHeader` menulis baris kepala record (Status/Verdict/Owner/Initiator/TaskRef/ReportedAt/CardIds) ke bagian record terserialisasi dan menandai `plan.fields` (pagar `assertEditShape` tetap berlaku; butir/bukti tidak disentuh); `rewriteOwnReport` tanpa Rincian kerja + meta diberi -> medan kepala diterapkan lewat jalur sunting (RECORD_KEPT tetap untuk butir, `RECORD_META_APPLIED`), `requireOwnParts` mencakup `record`; `studio_edit` menerima `meta` (dan `edits` kini opsional; keduanya kosong -> INVALID_ARGUMENT). Dokumen klien: `write-meta.ts` baru (`serverClientMeta` = kebalikan `frontSlots`/`docMetaOf`, `applyClientMeta` = meta server + meta agen -> builder yang sama dengan studio_write; riwayat revisi MENAMBAH baris bila rev baru); `write-client-run.ts` `editClient` memakai lingkup hasilnya (setMeta + slot depan) dan menggemakan `meta` tersimpan. `write-normalize.ts`: normalisasi meta dibagi (`normalizeMetaArg`), `meta`/`detail` diizinkan di studio_edit.
- Butir 2 hijau: `implw4-meta.test.ts` 8/8 (studio_write parsial + status blocked -> tersimpan blocked, butir/bukti/bab 2 tetap; tanpa status -> status tidak diubah; studio_edit meta saja / meta + edits; tanpa keduanya -> INVALID_ARGUMENT; status tak dikenal -> STATUS_NOT_APPLIED tanpa tulis; klien: serverClientMeta, meta {rev, number, revisionNote} -> sampul + lembar kendali + riwayat MENAMBAH baris, gema meta; meta {title} -> setMeta, ulangan -> tidak berubah tanpa tulis). Uji lama `implw3-cycle1` (W3-M1) TETAP hijau tanpa perubahan: ia mengasersi butir/bukti tetap; record kini dikirim lewat jalur sunting medan dengan butir sama.
- Butir 3 (ringkasan verifikasi): `write-verify.ts` baru. `docxPrinted` (judul = paragraf ber-`w:outlineLvl` + kicker sebelumnya, keterangan = label mesin + pemisah, halaman dari `docProps/app.xml` bila ada), `htmlPrinted` (laporan kerja dirender HTML: h2/h3 + caption/figcaption), `verifySummary` (R20 dibaca ulang -> revisi tersimpan + gema record/meta; R10 unduh -> sha256 DIHITUNG ULANG dan dibandingkan; lint tata letak per figur lewat route pratinjau FIG-03b yang baca saja; galat di ringkasan tidak menggagalkan tulisan -> `verify.error` + saran studio_file_verify), `withVerify` (laporan kerja). Dipakai `clientOutput` (write/edit klien) dan tiga titik hasil laporan kerja (submit baru, tulis ulang, studio_edit). Teks dokumen hanya di blok `<data-tak-tepercaya>` + `untrustedFields(["verify.headings","verify.captions","verify.meta"|"verify.record"])`, nilai dinetralkan (`neutralizeDeep`).
- Butir 3 hijau: `implw4-verify.test.ts` 4/4 (DOCX mesin nyata: mode sumber judul persis tanpa kicker, "Tabel 6.1" terbaca, kalimat badan "Table 6.1 condenses" bukan keterangan; mode mesin: kicker "BAB 2" + "2.1 6.1 Trust model"; MCP: sha dihitung ulang cocok, judul/keterangan/halaman, figur `{pid, layoutIssues: 2, checks: [textOutside]}`, gema meta, teks berbahaya tidak keluar blok, nextSteps hanya dengan detail). Uji lama `implw-write.test.ts` 1 asersi diubah (nextSteps kini hanya dengan `detail: true`; `verify` ada).
- Butir 6 (sisa Low review 13): S2-2r: `write-parts.ts` `requireOwnParts(..., present)` menolak bagian yang SUDAH ADA di server dengan penulis R15 null/tidak tercatat dan isi berbeda (`PART_CHANGED_BY_OTHER`), kecuali sesi MCP ini yang menulisnya (`McpSession.noteParts/wrotePart` di `tool-kit.ts`, dicatat sesudah setiap tulis studio_write/studio_edit laporan + klien); bagian baru (belum ada di server) tidak ditolak. Tanpa perubahan server. W3-L1r: `write-edit.ts` cabang `target` mengecualikan satuan berawalan penanda daftar/kutipan tak ter-escape. Petunjuk ulang: `outcome.ts` `REPEAT_HINT_SERVER` ("server bermasalah; tunggu lalu coba lagi ...") untuk galat nyata (`isGenuineFailure`) di `tools.ts executeTool`.
- Butir 6 hijau: `implw4-lows.test.ts` 4/4 (sesi lain + cover penulis null berbeda -> PART_CHANGED_BY_OTHER 0 tulis; sesi yang sama -> diizinkan; skenario Q1 review 13: paragraf "- ..." kembar dengan butir daftar -> yang berubah paragraf ber-pid; 500 identik ke-3 -> petunjuk server). MERAH di HEAD: `implw4-verify` (bagian MCP) 2/2 gagal, `implw4-lows` 3 gagal / 1 lulus (kasus "sesi yang sama" memang sudah diizinkan HEAD). Keluaran `%TEMP%/claude/w4/red_3_6.txt`.
- Butir 4 (label grafik terpotong), REPRODUKSI: data r5b RV-4 lewat jalur render DOCX yang sama (compose v2 -> `pureChartSvg` K-01 -> `rasterizeSvg` Chromium 300 dpi) menghasilkan PNG sha256 `ae6dfcb86a3115c6...` = PNG Gambar 6.1 di DOCX r5b (`doc_ud2b/sandbox/db/...rev13...docx`, `word/media/fig-ae6dfcb8...png`), identik byte. SVG-nya bersih menurut lint geometri (`textOutside` 0): label rata kanan di x = 13,01 mm, fon "IBM Plex Sans Condensed" 2,29 mm.
- Butir 4, AKAR (terukur, bukan dugaan): di halaman raster Chromium, hash PNG teks ber-`font-family` "IBM Plex Mono" = "Times New Roman" = keluarga tak dikenal (fon tidak tersedia -> serif bawaan; angka sumbu tercetak serif), dan "IBM Plex Sans Condensed" = "IBM Plex Sans" (keluarga Condensed tidak teresolusi -> wajah lebih lebar). Fon Plex di host ini terpasang per pengguna (`%LOCALAPPDATA%\Microsoft\Windows\Fonts`). Geometri chart dan lint dihitung dengan metrik Plex Condensed (`engine/chart/core/textfit.ts`), jadi label yang muat di SVG meluber ke kiri di PNG. Ini cacat lingkungan raster, BUKAN margin chart: mengubah margin `engine/chart/**` akan mengubah semua SVG (manifest) tanpa menghilangkan selisih fon.
- Butir 4, PERBAIKAN (by-construction, SVG tidak berubah): `src/lib/studio/engine/browser/raster-fonts.ts` baru (`svgFontFamilies`, `rasterFontCss`: keluarga Plex Sans/Sans Condensed/Mono/Serif yang dirujuk SVG ditanam sebagai `@font-face` data: dari aset repo `src/lib/studio/assets/fonts`, 400/600 normal/italic); `engine/browser/index.ts` `rasterizeSvg` menyisipkannya ke `<style>` halaman raster dan, sesudah fon siap, MENOLAK (`RENDER_FAILED "embedded font not loaded"`) bila keluarga tertanam tidak termuat, sehingga substitusi fon tidak pernah lagi diam-diam. Deteksi: lint geometri SVG kini berlaku untuk PNG (fon sama), ditambah penjaga muat fon itu; uji piksel PNG menangkap regresi.
- Butir 4 hijau/merah: `tests/unit/studio/renderers/implw4-chart-raster.test.ts` 2/2 hijau (SVG RV-4 lint 0 + keluarga tertanam; PNG: 0 piksel tinta di kolom x=0..2 dan dua kolom kanan, "IBM Plex Mono" != serif cadangan). MERAH di HEAD: 1 gagal / 1 lulus, "kolom x=0: expected 6 to be 0" (`%TEMP%/claude/w4/red_4.txt`). Gambar sesudah perbaikan: `%TEMP%/claude/w4/k01_fixed.png` (Medium-High dan Low-Medium utuh, angka sumbu Plex Mono).
- Temuan sampingan smoke (diperbaiki): suntingan data grafik RV-4 tanpa `type`/`stacked` memilih ulang kode grafik sehingga batang bertumpuk K-01 menjadi kolom berkelompok P-03 (research/28 T-8). `write-client-edit.ts` `chartPatch` kini mempertahankan kode bila jumlah seri sekelas. Uji `implw4-lows.test.ts` +1 (5/5); cek smoke "RV-4: bentuk grafik tetap K-01".
- Butir 5 (hasil lebih kecil): bawaan ringkas untuk `studio_write`/`studio_edit`: tanpa `nextSteps`; `render` = fileId + format + sha256 + verified; `verify` di structuredContent = jumlah judul/keterangan + `shaMatch` (daftar di blok teks; `compactVerify`/`compactRender`); suntingan yang tidak mengubah judul (`titlesOf` sebelum/sesudah) mencetak jumlah judul saja; baris `berkas:` digabung ke baris verifikasi; satu correlationId terakhir + `correlationCount` (`tools.ts executeTool`). `detail: true` mengembalikan semuanya. Deskripsi skema baru dipendekkan.

## Ukuran hasil (butir 5), sebelum vs sesudah

Alat: `scripts/studio/mcp/measure-write.ts` (stdio NYATA, klien SDK resmi, seperti `measure.ts`), urutan sama: studio_write dokumen klien bahan r5b, studio_edit RV-1+RV-3, studio_edit RV-2+RV-4, studio_file_verify. Sebelum = salinan HEAD 6a16bbd (`%TEMP%/claude/w4/head`), sesudah = kode akhir; DEV 127.0.0.1:9021, mission 2026-11-03_implw4. Bita = JSON UTF-8 hasil utuh. Keluaran: `%TEMP%/claude/w4/measure_before.json`, `measure_after.json` (butir 3 belum ringkas), `measure_final.json`.

| Panggilan | Sebelum total / teks / sc (B) | Sesudah butir 3, belum ringkas | Sesudah akhir total / teks / sc (B) | Selisih akhir |
|---|---|---|---|---|
| S1 studio_write | 4.601 / 1.746 / 2.770 | 6.172 | 3.497 / 2.052 / 1.342 | -24 % |
| S2a studio_edit RV-1+RV-3 | 1.957 / 674 / 1.212 | 4.899 | 2.144 / 1.049 / 1.018 | +10 % |
| S2b studio_edit RV-2+RV-4 | 1.871 / 674 / 1.126 | 4.813 | 2.135 / 1.048 / 1.010 | +14 % |
| studio_file_verify | 817 | 817 | 817 | 0 |
| Jumlah urutan | 9.246 | 16.701 | 8.593 | -7 % |
| Per giliran (instructions + tools/list) | 13.606 (tools/list 12.895) | 14.064 | 13.904 (tools/list 13.193) | +2,2 % |

Catatan jujur: hasil sebelum TIDAK memuat verifikasi apa pun (agen r5b lalu membuka zip/crop/vision sendiri: 645,7 s). Sesudah, setiap hasil memuat ringkasan verifikasi dan tetap lebih kecil untuk studio_write dan seluruh urutan; tiap studio_edit +10-14 %. Per giliran +298 B karena medan skema baru (`meta`, `detail`).

## Smoke DEV (127.0.0.1:9021, mission 2026-11-03_implw4, kode akhir, stamp 20261103150424): 16/16 PASS, exit 0

Perintah: `npx tsx scripts/studio/mcp/smoke-implw4.ts --source C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/doc_ud2b/source` (rahasia dari berkas ke env saja; `STUDIO_MCP_FILE_ROOTS=%TEMP%\claude\w4\smoke`). Keluaran: `%TEMP%/claude/w4/smoke3.json`, log `%TEMP%/claude/w4/smoke/smoke-implw4-20261103150424.log`, DOCX akhir `%TEMP%/claude/w4/smoke/043-GSP-KT-X-2026_rev16_20261103T150433Z_e4331bec.docx`, PNG `%TEMP%/claude/w4/smoke/fig-bb63bfa004f15615fbe3e2dbfc1aaf6a.png`. Dua jalan sebelumnya juga lulus (15/15, 16/16); jalan pertama menemukan K-01 -> P-03.

| # | Langkah | Hasil | Catatan |
|---|---|---|---|
| 1 | studio_write bahan r5b (template latest + meta meta.md) | PASS | rev 11 COMPLETE, numbering source, peringatan REV_DISPLAY_ONLY, REV_SPLIT, TEMPLATE_RESOLVED [3.497 B] |
| 2 | ringkasan: 18 judul, 4 keterangan, figur 0 isu, nomor meta | PASS | meta number GSP-UD1-NL-001, rev Rev 0 |
| 3 | RV-1 + RV-3 (RV-3 di DALAM paragraf terakhir) | PASS | edited bab 5, bab 6 [2.144 B] |
| 4 | RV-2 (sel SEC-12 Likelihood) + RV-4 (data Gambar 6.1) | PASS | figur 0 isu [2.135 B] |
| 5 | RV-4: bentuk tetap K-01 | PASS | code K-01 |
| 6 | meta Rev 1 lewat saluran meta studio_edit | PASS | edited slot cover, controlSheet, signature; gema rev Rev 1 |
| 7 | unduh DOCX akhir (sha256 cocok) | PASS | studio_file_verify downloadDir |
| 8 | DOCX: judul = sumber, persis dan berurutan | PASS | 18/18 |
| 9 | DOCX: tanpa kicker CHAPTER/BAB, tanpa nomor ganda | PASS | |
| 10 | DOCX: Tabel FM.1, Tabel 6.1, Gambar 6.1, Tabel 6.2 | PASS | Tabel FM.1 Document control block / Tabel 6.1 Threat register / Gambar 6.1 Jumlah ancaman per tingkat Likelihood dan Impact (Table 6.1) / Tabel 6.2 Payload cipher candidate set |
| 11 | DOCX: nomor sampul dari meta + teks revisi penuh + baris Rev 0 tetap | PASS | GSP-UD1-NL-001; "Rev 1, sesuai revisi.md"; Rev 0 |
| 12 | DOCX: RV-1 400, RV-3 menyatu, RV-2 Medium-High | PASS | |
| 13 | PNG Gambar 6.1 disimpan | PASS | |
| 14 | laporan kerja lengkap, status partial | PASS | gema status partial |
| 15 | r5b: tulis parsial tanpa Rincian kerja + meta.status blocked | PASS | status tersimpan blocked; RECORD_KEPT, RECORD_META_APPLIED |
| 16 | studio_edit { meta: { status: complete, verdict: pass } } | PASS | record status complete, verdict PASS |

Judul DOCX tercetak (pembaca DOCX smoke lama, independen dari `write-verify.ts`), persis = sumber: FM.1 Document control block; FM.2 Executive summary; FM.3 Notation, provenance glyphs, and reading guide; Chapter 1. Introduction; 1.1 Product concept and use cases; 1.2 Mission scope and boundaries; 1.3 Constraints carried by the brief; 1.4 How this document is structured and how its evidence works; Chapter 6. Security and Privacy Design; 6.1 Trust model: parties, assets, trust boundaries, the relay's exact status; 6.2 Threat matrix SEC-01 to SEC-21 and severity rollup; 6.3 End-to-end encryption design SD-01 to SD-08; 6.4 Privacy and user controls; 6.5 Mitigation-to-architecture traceability; Chapter 10. Conclusions and Implications; 10.1 What the evidence supports today; 10.2 What remains contingent on validation; 10.3 Go / no-go logic for Phase 3 prototyping.

PNG Gambar 6.1 akhir (PIL): 1509 x 588 px; piksel tinta (luminans < 200) kolom x=0..2 = 0, 0, 0; dua kolom kanan = 0, 0; tinta pertama di kolom 7. Lint figur (route pratinjau) 0 isu. Visual: batang bertumpuk K-01, enam kategori Rev 1 termasuk Medium-High, label utuh, angka sumbu Plex Mono. Pembanding r5b: kolom x=0 berisi 6 piksel tinta (uji merah butir 4).

## Changes Made

| File | Change Type | Description |
|---|---|---|
| scripts/studio/mcp/write-client.ts | modify | penomoran sumber: `sourceLabelOf`, `usesSourceNumbering`, `planSource`, `chapterOf(keepNumbers)`, `BuiltClient.outline` |
| scripts/studio/mcp/write-client-run.ts | modify | outline berlabel, saluran meta klien, `verifyClient`, hasil ringkas, `noteParts`, `present` S2-2r |
| scripts/studio/mcp/write-client-edit.ts | modify | `chartPatch` mempertahankan kode grafik (K-01) |
| scripts/studio/mcp/write-content.ts | modify | `givenFields`, `recordMetaFields` |
| scripts/studio/mcp/write-tools.ts | modify | medan kepala record selalu diterapkan, saluran meta `studio_edit`, `detail`, `withVerify`, `noteParts`, deskripsi |
| scripts/studio/mcp/write-normalize.ts | modify | `normalizeMetaArg` bersama, `meta`/`detail` diizinkan |
| scripts/studio/mcp/write-edit.ts | modify | W3-L1r |
| scripts/studio/mcp/write-parts.ts | modify | S2-2r |
| scripts/studio/mcp/tool-kit.ts | modify | `McpSession.noteParts/wrotePart` |
| scripts/studio/mcp/tools.ts | modify | `REPEAT_HINT_SERVER` untuk galat nyata; cid ringkas untuk write/edit |
| scripts/studio/mcp/outcome.ts | modify | `REPEAT_HINT_SERVER` |
| scripts/studio/mcp/write-meta.ts | add | `serverClientMeta`, `applyClientMeta` |
| scripts/studio/mcp/write-verify.ts | add | `docxPrinted`, `htmlPrinted`, `verifySummary`, `withVerify`, `compactVerify`, `compactRender`, `titlesOf` |
| scripts/studio/mcp/ud-source.ts | add | bahan r5b -> argumen studio_write + RV-1..RV-4 |
| scripts/studio/mcp/measure-write.ts | add | ukuran hasil toolset write |
| scripts/studio/mcp/smoke-implw4.ts, smoke-implw4-checks.ts | add | smoke DEV IMPL-W4 |
| src/lib/studio/contract/types/v2/common.ts | modify (luar MCP) | `OutlineEntryV2.label?` |
| src/lib/studio/contract/schema/v2/common.schema.ts | modify (luar MCP) | skema `label` (`^[A-Za-z0-9]{1,8}$`) |
| src/lib/studio/services/compose/snapshot.ts | modify (luar MCP) | bab berlabel: kicker kosong, nomor section kosong, label artefak sumber + penghitung bersama |
| src/lib/studio/engine/front/texts.ts | modify (luar MCP) | `kickerSuppressed` |
| src/lib/studio/engine/docx/blocks/structure.ts | modify (luar MCP) | tanpa paragraf kicker bila kosong eksplisit |
| src/lib/studio/engine/docx/wrapper/pages.ts | modify (luar MCP) | label bab TOC/pembatas kosong |
| src/lib/studio/engine/docx/wrapper/toc-refs.ts | modify (luar MCP) | nomor section kosong eksplisit, `address` di simpul TOC |
| src/lib/studio/engine/docx/package/header-footer.ts | modify (luar MCP) | kepala halaman tanpa "Bab n" untuk bab berpenomoran sumber |
| src/lib/studio/engine/docx/assemble/numbering.ts | modify (luar MCP) | tanpa NUMBERING_MISMATCH untuk bab berpenomoran sumber |
| src/lib/studio/engine/html/blocks/text.ts | modify (luar MCP) | kicker/nomor section kosong, jangkar cadangan alamat |
| src/lib/studio/engine/html/blocks/wrapper.ts | modify (luar MCP) | label TOC kosong, jangkar section cadangan |
| src/lib/studio/engine/browser/raster-fonts.ts | add (luar MCP) | `@font-face` Plex tertanam untuk raster |
| src/lib/studio/engine/browser/index.ts | modify (luar MCP) | `rasterizeSvg` menanam fon + menolak fon tertanam yang gagal dimuat |
| tests/unit/studio/mcp/implw4-{numbering,meta,verify,lows}.test.ts | add | 5 + 8 + 4 + 5 uji |
| tests/unit/studio/renderers/implw4-{source-numbering,chart-raster}.test.ts | add | 5 + 2 uji |
| tests/unit/studio/mcp/implw2-client.test.ts | modify | penomoran sumber (2 asersi), filter route pratinjau figur, R15 berpenulis di server tiruan (S2-2r) |
| tests/unit/studio/mcp/implw3-client-builder.test.ts | modify | penomoran sumber (1 uji) |
| tests/unit/studio/mcp/implw-write.test.ts | modify | nextSteps hanya dengan detail; verify ada |
| docs/STUDIO-MCP.md | modify | §5.z Ronde 6 |

Tidak diubah: `engine/chart/**`, DB/skema Prisma, port 9011, `~/gsp-datacenter`, konfigurasi/kode Hermes, `decisions.md`, `file_claims.md`. Server DEV TIDAK dinyalakan ulang: `next dev` di repo ini memuat ulang modul `src/` sendiri; smoke membuktikan perilaku server baru aktif (outline `label` diterima, Tabel 6.1/FM.1, PNG dengan fon tertanam). Berkas probe sementara milik sesi ini dibuat dan dihapus dalam sesi; tidak ada berkas lama yang dihapus/diganti nama. Tanpa commit.

## Test Results (segar, kode akhir)

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint | `npx eslint <39 berkas .ts tersentuh/baru>` | exit 0 | 0 masalah |
| MCP | `npx vitest run tests/unit/studio/mcp` | 23 berkas, 289/289 | termasuk 4 berkas implw4 |
| Unit studio penuh | `npx vitest run tests/unit/studio` | 215 berkas, 4.092 lulus / 1 lewati / 0 gagal, exit 0 | ~233 s |
| Manifest SVG bersih + figur | `npx vitest run tests/unit/studio/figures` | 27 berkas, 562/562 | `clean-svg-manifest.test.ts` hijau; manifest TIDAK diubah (SVG chart tidak berubah) |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3, exit 0 | |
| Byte-identik tanpa label | suite renderer/compose/structure (72 berkas, 1.367) + kontrol `implw4-source-numbering` | hijau | cabang baru hanya aktif pada label/kicker kosong eksplisit/nomor kosong eksplisit |
| Merah (HEAD 6a16bbd) | salinan `git archive` + uji baru | butir 1: 9 gagal / 1 lulus; butir 2: 7/1; butir 3: 2/0; butir 4: 1/1 (x=0: 6 piksel tinta); butir 6: 3/1 | `%TEMP%/claude/w4/red_*.txt` |
| Smoke DEV | `smoke-implw4.ts` | 16/16 PASS, exit 0 | |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | Penyimpanan mode penomoran tanpa migrasi DB | `label` di entri outline slot konten (payload JSON yang sudah disimpan apa adanya); bab/section disimpan relasional sehingga medan baru di ChapterV2/SectionV2 akan hilang |
| 1 | Kunci internal bab di mode sumber | Berurutan 1..n (urutan agen); nomor sumber hanya di judul + label. FM sebelum Chapter 1 tidak dapat berkunci angka di bawah 1 |
| 1 | Label tabel bagian depan | "Tabel FM.1" (label = awalan huruf FM, penghitung bersama FM.1-FM.3), analog "Tabel 6.1". Pola keterangan pemeriksa r5 (`[A-Z]?\d+`) tidak mengenali "FM.1" (DA2 r5 juga gagal cek itu). Perlu konfirmasi USER bila ingin bentuk lain |
| 1 | Pemicu mode sumber | Otomatis bila ada judul/sub-judul bernomor (prinsip konten-saja D-521). MENGGANTI IMPL-W3 butir 8 (nomor sub-judul dibuang + penyarangan); 3 asersi uji lama diubah |
| 2 | Status yang tidak diberi pada tulis ulang ber-Rincian kerja | Tidak diubah (perilaku lama: status bawaan draft dari teks mesin). Status tersimpan kini selalu digemakan di hasil |
| 3 | Sumber judul seperti tercetak | Byte berkas render itu sendiri (unduhan R10, sha dihitung ulang), bukan rekonstruksi; jumlah halaman absen karena DOCX Studio tidak memuat `<Pages>` |
| 4 | Brief meminta perbaikan di `engine/chart/**` | Akar terukur ada di lingkungan raster (fon), bukan geometri chart. Perbaikan di `engine/browser` (SVG tidak berubah, manifest tetap). Lint geometri SVG tidak dapat melihat substitusi fon; penggantinya: fon tertanam + penolakan bila gagal dimuat + uji piksel PNG |
| 5 | Ringkasan verifikasi menambah isi | Bawaan ringkas + `detail: true`; studio_write -24 %, urutan -7 %, tiap studio_edit +10-14 % |
| 6 | S2-2r: opsi perbaikan | Penolakan di MCP + pengecualian sesi (opsi 1 brief); server tidak diubah. Dampak: sesi BARU yang menulis ulang utuh dokumen klien lama dengan `cover` berpenulis null dan cover berbeda mendapat PART_CHANGED_BY_OTHER (pakai studio_edit / saluran meta) |
| smoke | K-01 -> P-03 saat sunting data grafik | Diperbaiki (`chartPatch`), diuji |

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| studio_edit sedikit lebih besar dari sebelum (+10-14 %) | 2 siklus peringkasan | ringkasan verifikasi wajib (butir 3) | terukur dan dilaporkan; urutan total lebih kecil | Tidak; keputusan USER bila ingin lebih ringkas |
| Footer REV A tidak ikut Rev 1 (REV_DISPLAY_ONLY, T-5) | 0 | `DocMetaV2.rev` hanya huruf | di luar butir IMPL-W4 | Tidak |
| DATUM-09/10 (needs-review IMPL-W3) | 0 | gerbang server | tetap terbuka | Tidak |

## Verification

- Butir 1: DOCX DEV 18/18 judul persis dan berurutan, tanpa kicker/nomor ganda, Tabel 6.1/Gambar 6.1/Tabel 6.2/Tabel FM.1 (smoke 8-10); uji mesin + MCP 10/10; dokumen tanpa nomor tidak berubah (suite renderer + kontrol).
- Butir 2: status blocked tersimpan dari tulis parsial; meta studio_edit laporan (complete/PASS) dan klien (Rev 1, riwayat Rev 0 + Rev 1) tersimpan dan digemakan (smoke 6, 11, 15, 16; uji 8/8).
- Butir 3: setiap hasil tulis/sunting memuat `verify` (sha dihitung ulang cocok, judul/keterangan dari byte DOCX, lint figur, gema) (smoke 1-6, 14-16; uji 4/4).
- Butir 4: reproduksi identik byte, akar terukur, PNG akhir tanpa tinta tepi (uji 2/2 + PIL + visual).
- Butir 5: tabel ukuran di atas.
- Butir 6: uji 5/5.

## Next Steps

- Review keamanan disarankan (cakupan: `write-verify.ts` unduh + parse berkas + route pratinjau, `write-meta.ts`, saluran meta `studio_edit`, `patchRecordHeader`, S2-2r sesi, `raster-fonts.ts` + penolakan fon, outline `label` di kontrak/compose). Review kode disarankan untuk perubahan mesin penomoran.
- Keputusan USER: label tabel bagian depan ("Tabel FM.1" vs alternatif); apakah ukuran studio_edit perlu ditekan lagi.
- Runner/brief r6 (D-547 butir 2-3) dapat memakai `verify` dan saluran meta.

## Siklus perbaikan 1 (D-552, review 13 bagian IMPL-W4 = CAUTION)

Uji baru `tests/unit/studio/mcp/implw4-cycle1.test.ts` (probe p19 V1/V4, p20 K1, p21 S2 sebagai uji). MERAH pada kode ronde 6 (sebelum perbaikan): 7 gagal / 1 lulus (W4-I2 sudah lulus karena `REPEAT_HINT_SERVER` ronde 6; dipertahankan sebagai uji regresi). Skenario S2 disesuaikan agar sesi A benar-benar menulis cover lebih dulu (probe S1/S2): merah lagi "expected true to be false" (tulis ulang A menimpa cover pihak lain) sebelum ikatan revisi. HIJAU: 8/8.

| Temuan | Uji | Perbaikan | Status |
|---|---|---|---|
| W4-M1 (Medium) | K1: `meta {rev: B, number, docNumber, agentId, createdBy}` -> baris sampul "Proyek/Alpha-Kustom", lapis "QA Eksternal/Auditor X", peran "Saksi/Pak Saksi" tetap; baris sampul lain, `signature.roles`, `verificationChain` identik byte; nilai rev/nomor ditambal satu baris; docNumber server tetap. `language` -> `META_UNSAFE` ok:false (isError falsy) + daftar, 0 tulis. Slot depan terakhir ditulis pihak lain -> `PART_CHANGED_BY_OTHER`, 0 tulis | `write-meta.ts` `applyClientMeta` ditulis ulang: TIDAK menyusun ulang slot; `setPair` (sel nilai pasangan berlabel ID/EN; tidak ada -> ditambah di separuh baris kosong/baris baru), `setChain`/`setSig` (lapis/peran dikenal ditambal; tidak ada -> ditambah di akhir), riwayat revisi (baris terakhir diperbarui / baris baru), judul lembar kendali hanya bila berpola baku (selain itu `META_PARTIAL`), metode; DocMeta hanya kunci yang medannya diberi. `language` berbeda dan `distribution` atas daftar berisi -> `META_UNSAFE` sebelum mutasi. `write-client-run.ts` `editClient`: `requireOwnParts` untuk slot depan yang ditambal (kecuali dokumen diadopsi eksplisit) | TERTUTUP |
| W4-L1 (Low) | S2: A menulis dokumen + meta, pihak lain menulis cover (R15 penulis null), A menyunting bab 1, A `studio_write` -> `PART_CHANGED_BY_OTHER`, cover pihak lain tetap | `McpSession.noteParts(doc, [part, rev])` / `wrotePart` -> revisi; `write-parts.ts` membaca `lastFilledRevisionNo` / `present[].revisionNo` R15; penulis tak tercatat diizinkan hanya bila sesi menulis bagian itu dan revisi R15 <= revisi tulisan sesi (revisi tak diketahui = ditolak). Revisi per bagian dicatat dari jawaban tiap kiriman (klien) atau `revisionNo` jalur laporan | TERTUTUP |
| W4-L2 (Low) | entri `word/document.xml` 21 MB -> `VERIFY_TOO_LARGE` tanpa dekompresi; 80.000 tag pembuka tanpa penutup (DOCX + HTML) < 1 s (ronde 6: 4.946 ms); render `byteSize` 30 MB -> tanpa GET R10, `verify.error = VERIFY_TOO_LARGE`, tulisan ok | `write-verify.ts`: `MAX_DOWNLOAD_BYTES` 25 MB (dicek dari `byteSize` sebelum unduh dan dari panjang sesudah unduh), `MAX_ENTRY_BYTES` 20 MB lewat filter `unzipSync` (`originalSize`), HTML > 20 MB ditolak; pemindai `elements()` linear (posisi penutup dikumpulkan sekali + pencarian biner, pembuka tanpa penutup dilewati, maks 100.000 elemen) menggantikan regex kuadratik | TERTUTUP |
| W4-I1 (Info) | K1: peringatan `NUMBER_DISPLAY_ONLY` | `write-client.ts` `metaFieldOf` (dibagi) + `NUMBER_DISPLAY_ONLY` di `normalizeMeta` (studio_write) dan saluran meta | TERTUTUP |
| W4-I2 (Info) | server tak terjangkau identik x4 -> tidak pernah "berhenti mengulang", ke-3 "server bermasalah; tunggu lalu coba lagi" | sudah di ronde 6 (`REPEAT_HINT_SERVER` untuk `isGenuineFailure`); uji regresi baru | TERTUTUP |

Suite MCP sesudah siklus: 24 berkas, 297/297.

### Siklus perbaikan 1, bagian mesin (D-553, review 15 = APPROVED WITH COMMENTS, 5 Medium + 6 Low)

Uji baru `tests/unit/studio/renderers/implw4-cycle1-engine.test.ts` (21 uji; kasus probe reviewer). MERAH pada baseline ronde 6 (salinan scratch `%TEMP%/claude/w4/r6` = kode kini dengan perubahan mesin siklus ini dibalik, `raster-fonts.ts` ronde 6 dipulihkan): 16 gagal / 5 lulus (`%TEMP%/claude/w4/red_eng.txt`). Yang lulus di baseline: kontrol alamat numerik/huruf tunggal, kontrol alamat posisi, kasus italic-saja (tidak tereproduksi di host ini), dan uji piksel F7 (tidak membedakan; bukti F7 = asersi aturan wajah simbol di uji F4 yang gagal di baseline). HIJAU: 21/21.

| Temuan | Uji | Perbaikan | Status |
|---|---|---|---|
| F1 (Medium) | outline `[{key:"1",label:"2"},{key:"2"}]` + tabel di bab 1 dan 2 -> `BY_CONSTRUCTION_FAILED` | `services/compose/snapshot.ts`: bila penomoran sumber dipakai, label artefak ganda di `e.numbering` -> `composeFail("BY_CONSTRUCTION_FAILED", ...)` (label + kedua pid) | TERTUTUP |
| F2 (Medium) | 5 kasus reviewer dirasterisasi tanpa penolakan: Mono hanya di `<text>` kosong, hanya spasi, italic saja, Plex hanya cadangan (`Arial, IBM Plex Sans`), aturan `<style>` tak terpakai | `engine/browser/index.ts`: penjaga hanya memeriksa wajah yang membentuk glif: keluarga PERTAMA terhitung pada `text/tspan` bertubuh tak kosong, per gaya/berat, `document.fonts.load(font, contoh)`; penolakan load = tidak termuat | TERTUTUP |
| F3 (Medium) | aset fon templat rusak (sha cocok, isi bukan fon) pada teks yang dicetak -> `code === "BY_CONSTRUCTION_FAILED"` (baseline: `BROWSER_UNAVAILABLE`) | `StudioEngineError("BY_CONSTRUCTION_FAILED")` (422) dilempar di luar callback halaman | TERTUTUP |
| F4 (Medium) | bawaan = manifest S13; aset templat ber-sha salah -> "sha256 fon tidak cocok" | `raster-fonts.ts` ditulis ulang di atas `fontFaceCssDetailed` (`engine/html/base/fonts.ts`): satu daftar wajah, sha256, aset templat; `rasterizeSvg(..., { tpl })`, `prepareFigureStore({ tpl })` (`engine/docx/figures/store.ts`), diteruskan dari `engine/docx/assemble/index.ts` (`ctx.tpl`) dan `services/render/figures.ts` (`i.tpl`). Nama keluarga disaring pola aman sebelum dipakai | TERTUTUP |
| F5 (Medium) | `walkDoc` mode sumber: artefak "Tabel 6.1", bukan "Tabel 2.1" | `engine/lint/structure/walk.ts`: `artifactLabel` snapshot (blok `snap.blocks`) menang atas hitungan kunci (cadangan) | TERTUTUP |
| F6 (Low) | keluarga templat tanpa berkas -> galat "tidak ditemukan" (keras) | lewat `fontFaceCssDetailed` (`FILE_MISSING_ON_DISK`); tanpa cache kegagalan | TERTUTUP |
| F7 (Low) | aturan `@font-face` "IBM Plex Mono" + `unicode-range` simbol, dideklarasikan SESUDAH wajah Plex | wajah glif simbol templat (DejaVu Sans) didaftarkan dengan nama keluarga Plex dan deskriptor berat/gaya yang sama (komposit). Bahan `doc_ud2b/source/*` tidak memuat karakter di luar Latin-1 (dipindai), jadi Gambar 6.1 tidak terdampak | TERTUTUP |
| F8 (Low) | - | TIDAK diubah: kolom label TOC kosong di mode sumber (kosmetik); perubahan menyentuh tata letak TOC DOCX + HTML, ditunda agar mesin stabil | TERBUKA (tercatat) |
| F9 (Low) | - | dicatat: `section.number === ""` dan kicker `{text:""}` kini konsisten "tanpa nomor/kicker" di DOCX + HTML untuk SEMUA dokumen (v1 juga); tidak ada artefak repo terdampak (grep reviewer 0). Perlu entri decisions oleh controller | DICATAT |
| F10 (Low) | label yatim -> `OUTLINE_LABEL_ORPHAN`; label di outline lampiran -> `OUTLINE_LABEL_IGNORED` | peringatan compose; editor outline yang mempertahankan medan tak dikenal di luar lingkup baris ini | TERTUTUP (bagian compose) |
| F11 (Low) | "Tabel FM.1", "Gambar FM.1", ".../caption", "Turunan D-FM.2", "Tabel FM.1/2.3" terurai dan kembali sama; "FM.1" bukan alamat posisi | `contract/address.ts`: `ART_CHAP = (POS | [A-Za-z][A-Za-z0-9]{0,7})` hanya untuk bentuk label artefak | TERTUTUP |
| Lain | catatan deploy | `docs/STUDIO-MCP.md` §5.z: deploy standalone/serverless wajib memasukkan `src/lib/studio/assets/**` ke file tracing; konfigurasi build tidak diubah. Risiko rollback (build lama menolak outline ber-`label`) dicatat di sini | DICATAT |

Berkas siklus 1: `scripts/studio/mcp/{write-meta,write-verify,write-parts,write-client,write-client-run,write-tools,tool-kit}.ts`; luar MCP: `src/lib/studio/services/compose/snapshot.ts`, `src/lib/studio/engine/lint/structure/walk.ts`, `src/lib/studio/contract/address.ts`, `src/lib/studio/engine/browser/{index,raster-fonts}.ts`, `src/lib/studio/engine/docx/figures/store.ts`, `src/lib/studio/engine/docx/assemble/index.ts`, `src/lib/studio/services/render/figures.ts`; uji `tests/unit/studio/mcp/implw4-cycle1.test.ts`, `tests/unit/studio/renderers/implw4-cycle1-engine.test.ts`; `docs/STUDIO-MCP.md`.

### Gerbang ringan (D-554), kode akhir siklus 1

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 |
| Lint | `npx eslint <berkas .ts tersentuh/baru>` | exit 0 (1 peringatan uji diperbaiki, eslint ulang exit 0) |
| MCP | `npx vitest run tests/unit/studio/mcp` | 24 berkas, 297/297 |
| Renderers + figures + compose + contract (termasuk manifest SVG bersih) | `npx vitest run tests/unit/studio/{renderers,figures,compose,contract}` | 70 berkas, 1.186 lulus / 1 lewati, exit 0 |
| Engine-core + structure (lint/alamat/figur) | `npx vitest run tests/unit/studio/{engine-core,structure}` | 26 berkas, 865/865 |
| Uji siklus | implw4-cycle1 (MCP) 8/8; implw4-cycle1-engine 21/21 | |
| Smoke DEV | `smoke-implw4.ts` (stamp 20261103154102) | 16/16 PASS, exit 0 |

Suite studio penuh dan convert_v2 tidak dijalankan di siklus ini (kebijakan D-554: gerbang penuh hanya di akhir loop).

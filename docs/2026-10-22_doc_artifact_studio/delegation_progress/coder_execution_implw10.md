---
task_id: IMPL-W10
task_slug: doc_artifact_studio
row: IMPL-W10
date: 2026-11-04
agent: coder-execution
source_plan: brief controller IMPL-W10 (D-577), verification/16_loop_security_review.md, verification/17_loop_code_review.md, delegation_progress/coder_execution_implw9.md
status: complete
---

# Laporan Implementasi: IMPL-W10 - siklus perbaikan gerbang akhir (review 16/17)

Skill dimuat: `tdd` (uji merah dulu untuk setiap butir), `verification-before-completion` (semua klaim memakai keluaran
perintah segar di bawah). Basis: branch v2.1, HEAD 044a1f7. Tanpa commit. `decisions.md` tidak disentuh; dokumen `docs/`
lain yang belum di-commit tidak disentuh kecuali `docs/STUDIO-MCP.md` (dokumentasi perilaku) dan laporan ini.

Keputusan pengguna D-577: perbaiki M16-1, L16-1, L16-2; **M16-2 diterima sebagai risiko tercatat, TIDAK diubah**.
Keputusan controller: perbaiki High + Medium kebenaran review 17 (#1, #2, #4, #5); refaktor (#6 ukuran `applyEdits`,
#7 duplikasi) dan Low tanpa perubahan perilaku ditunda.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | M16-1: append tidak membuat ulang bab server yang tak terserialisasi | complete | `EDIT_UNSAFE` menyebut `bab N (judul)` dan `bab-N`, 0 tulis; dua lapis |
| 2 | L16-1: vonis bersyarat/negasi tidak dipetakan | complete | aturan sisa-netral; `VERDICT_DROPPED` seperti sebelum IMPL-W9 |
| 3 | L16-2: tiga kode keluar dari kelas informasional | complete | `implw6-quiet` himpunan persis diperbarui |
| 4 | High review 17: addRow 2 sel pada tabel butir berkolom `key` otomatis | complete | kunci = `stableKey(judul)` sama dengan studio_write; uji how-to apa adanya |
| 5 | Medium review 17 #2: append ke section bersub-judul di akhir section | complete | `sectionsOf` hanya `##` sebagai section; `###` milik induk |
| 6 | Medium review 17 #4: ruang tepi 0,4 mm P-05 galeri / P-06 datum; batas `gutterPlan` | complete | manifest: tepat 2 sha berubah, lint bersih; benchmark SAME x3 |
| 7 | Medium review 17 #5: cap ReportedAt tidak mengirim record pada suntingan bab biasa | complete | asersi asli IMPL-W5 dipulihkan; uji dua agen tanpa konflik record |
| G | Gerbang: tsc, eslint, vitest studio, manifest, benchmark x3, smoke DEV | complete | lihat Test Results |

## Desain per butir

1. **M16-1** (`write-edit.ts`, `write-tools.ts`). Akar: `standardSection` hanya melihat `parts` terserialisasi; bab server
   yang dilewati serializer (tab di teks, blok `chart`, dan sebagainya) dianggap "belum ada" lalu dibuat ulang dan dikirim
   (menimpa isi penulis lain). Perbaikan: `ApplyOptions.existing` (semua kunci `partsOf(content)`), diisi `editWorkReport`;
   `standardSection` melempar `EDIT_UNSAFE` (bukan galat alamat, jadi seluruh batch ditolak, 0 tulis) bila bab yang akan
   dibuat ada di server. Lapis kedua: filter `unsafe` di `editWorkReport` kini `!exact.has(p) && !(plan.created.has(p) &&
   !server.has(p))`. Probe P1 review 16 (scratchpad `sec16/p1_created_overwrite.mts`) varian tab dan chart diulang: keduanya
   `EDIT_UNSAFE`, `writes: []`, `rev 6 -> 6`, bab 3 utuh.
2. **L16-1** (`write-content.ts`). `verdictLeading` kini mengambil frasa token awal terpanjang yang terpetakan, lalu
   `verdictRestNeutral(sisa, vonis)`: netral bila sisa kosong; tanda baca saja (bukan `?`); atau diawali `( [ : , ; -  – —`
   dan tidak memuat `?`, kata kualifikasi/negasi (kecuali, tapi, tetapi, namun, but, however, except, with issues, with
   conditions, with notes, dengan catatan, bersyarat, conditional(ly), not, tidak, belum, partial(ly), sebagian, parsial),
   maupun kata gagal/fail/failed/failing (dikecualikan bila vonisnya sendiri FAIL). Selain itu undefined -> `VERDICT_DROPPED`.
   Regex berjangkar, alternasi tanpa kuantor bersarang (linear). Nilai persis/alias utuh tidak berubah.
3. **L16-2** (`tool-kit.ts`). `INFORMATIONAL_WARNING_CODES` = `ITEM_KEY_COLUMN_ADDED`, `ITEM_KEY_GENERATED`,
   `ARGS_UNWRAPPED`, `META_LIFTED_FROM_EDITS`.
4. **addRow 2 sel** (`write-edit.ts`). Tabel butir (kolom key + status) yang kolom pertamanya `key` menerima baris selebar
   `n-1`; sel kunci kosong disisipkan di depan lalu kunci dibangkitkan dengan `stableKey(judul)` (fungsi yang sama dengan
   `repairItemTable` studio_write). Lebar lain tetap `EDIT_INVALID` + `expectedHeader`. Tambahan kecil (bug terkait yang
   ditemukan saat membaca): akhiran bentrok kunci kini `${base}-${n}` seperti studio_write; sebelumnya `k.replace(/-\d+$/,"")`
   memotong kunci yang heksanya serba-angka (mis. `K-12345678` -> `K-2`).
   Dokumen how-to dan SKILL.md **tidak diubah**: bentuk 2 sel yang didokumentasikan kini berjalan apa adanya (dibuktikan uji
   yang membaca JSON §3/§4 langsung dari `docs/STUDIO-HOWTO-REPORT.md`, dan smoke S1/S2).
5. **Sub-judul** (`write-edit.ts` `sectionsOf`). Section = judul `#`/`##`; ujung section = judul `##` berikutnya, jadi isi
   sub-judul `###` ikut section induk. Sub-judul tetap entri tersendiri (sasaran append) dengan ujung dan ordinal induk;
   ordinal hanya menghitung `##` (-1 sebelum `##` pertama = pembuka bab), sehingga `plan.appended[].section` = indeks
   `chapter.sections`. `regionUnits`/`find`/`cell` tidak diubah (alamat `section` sub-judul tetap berlaku).
6. **Talang grafik** (`family-p1/common.ts`, `dot-plot.ts`, `dumbbell.ts`, `core/labelfit.ts`). `labelGutter(ctx, labels,
   pt, maxFrac, anchorGap = 1.2)` = lebar + anchorGap + `LABEL_EDGE_MM` (bawaan 1,2 + 0,4 = 1,6 identik dengan sebelumnya
   untuk P-04, P-11/range, dumbbell galeri). P-05 galeri dan P-06 datum memakai anchorGap 1,6 (label di `x0 - 1.6`).
   `gutterPlan`: teks maks = `cap - pad - LABEL_EDGE_MM`, talang = `min(used + pad, max(cap, textMax + pad))`.
7. **ReportedAt** (`write-tools.ts`). Cap hanya bila `changed` memuat `record` atau saluran meta dipakai. Suntingan bab
   biasa mengirim bab itu saja.

## Changes Made

| File | Change Type | Description |
|---|---|---|
| scripts/studio/mcp/write-edit.ts | modify | `ApplyOptions.existing` + `EDIT_UNSAFE` di `standardSection`; `sectionsOf` level `##`; addRow lebar n-1 pada kolom `key` otomatis; akhiran kunci bentrok |
| scripts/studio/mcp/write-tools.ts | modify | `existing: new Set(server.keys())`; filter `unsafe` memeriksa server; cap ReportedAt hanya bila record terkirim |
| scripts/studio/mcp/write-content.ts | modify | `verdictLeading` + `verdictRestNeutral` + dua regex kualifikasi |
| scripts/studio/mcp/tool-kit.ts | modify | tiga kode keluar dari `INFORMATIONAL_WARNING_CODES` |
| src/lib/studio/engine/chart/family-p1/common.ts | modify | `labelGutter` parameter `anchorGap` + `LABEL_EDGE_MM` |
| src/lib/studio/engine/chart/family-p1/dot-plot.ts | modify | P-05 galeri anchorGap 1,6 |
| src/lib/studio/engine/chart/family-p1/dumbbell.ts | modify | P-06 datum anchorGap 1,6 (galeri identik) |
| src/lib/studio/engine/chart/core/labelfit.ts | modify | `gutterPlan` tidak melampaui `capMm` |
| tests/unit/studio/figures/__fixtures__/clean-svg-manifest.json | modify | 2 sha: `chart/p05.json@gallery`, `chart/p06.json@datum` (lihat Verification) |
| tests/unit/studio/mcp/implw10-final.test.ts | add | 19 uji (M16-1, L16-1, L16-2, how-to S1/S2, addRow, sub-judul, ReportedAt, dua agen) |
| tests/unit/studio/renderers/implw10-chart-edge.test.ts | add | 5 uji (tepi kiri >= 0,4 mm P-05 galeri, P-06 datum, kontrol P-04/P-06 galeri; batas `gutterPlan`) |
| tests/unit/studio/mcp/implw-write.test.ts | modify | asersi asli pra-IMPL-W5 dipulihkan (`edited: ['bab 1']`, `revisionNo: 7`) |
| tests/unit/studio/mcp/implw2-security.test.ts | modify | asersi asli dipulihkan (`['bab 3']`, `['bab 1','bab 3']`) |
| tests/unit/studio/mcp/implw5-edit.test.ts | modify | E6: sunting bab tidak mencap; meta mencap |
| tests/unit/studio/mcp/implw6-quiet.test.ts | modify | himpunan persis kelas informasional |
| tests/unit/studio/mcp/implw7-rows.test.ts | modify | ROWS_COALESCED_TO_TABLE kini tampil di ringkas |
| tests/unit/studio/mcp/implw9-section-verdict.test.ts | modify | 3 kasus token awal pindah ke VERDICT_DROPPED; VERDICT_NORMALIZED/SECTION_CREATED tidak informasional |
| scripts/studio/mcp/smoke-implw10.ts | add | smoke DEV IMPL-W10 (S1-S7) |
| docs/STUDIO-MCP.md | modify | 5.s baru (IMPL-W10), catatan addRow/E6/ROWS_COALESCED/5.t, daftar uji |

Tidak diubah: DB/skema, port 9011, `~/gsp-datacenter`, `decisions.md`, `file_claims.md`, `docs/STUDIO-HOWTO-REPORT.md`,
`docs/hermes-skills/gsp-studio-write/SKILL.md`, jalur M16-2, server DEV (tidak dinyalakan/dimatikan). Tidak ada berkas
yang dihapus/diganti nama.

## Test Results (segar, kode akhir)

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Merah (sebelum kode) | `npx vitest run tests/unit/studio/mcp/implw10-final.test.ts` | `Tests 13 failed / 6 passed (19)` | 6 lulus = kontrol (append bab terserialisasi, bab baru IMPL-W9, vonis persis, vonis netral, cap meta, sasaran sub-judul) |
| Merah addRow/sub-judul/M16-1 dengan `write-edit.ts` HEAD | idem `-t "High review 17\|sub-judul\|M16-1"` | `7 failed / 3 passed` | membuktikan uji how-to/addRow/sub-judul gagal tanpa perbaikan |
| Merah grafik | `npx vitest run tests/unit/studio/renderers/implw10-chart-edge.test.ts` | `3 failed / 2 passed` | P-05 galeri tepi 0,00001 mm; P-06 datum -0,00004 mm; gutterPlan 20,26 > cap 20 |
| Uji baru MCP | idem | `Tests 19 passed (19)` | |
| Uji baru grafik | idem | `Tests 5 passed (5)` | |
| MCP | `npx vitest run tests/unit/studio/mcp` | `Test Files 30 passed (30)`, `Tests 377 passed (377)` | jalan pertama 11 gagal = asersi lama perilaku yang sengaja diubah -> diperbarui |
| Figures + manifest | `npx vitest run tests/unit/studio/figures` | pertama `2 failed` (sha p05@gallery, p06@datum) -> manifest diperbarui (`UPDATE_CLEAN_SVG_MANIFEST=1`) | `fig02a` memeriksa lint score 0 sebelum sha: lulus |
| Studio penuh | `npx vitest run tests/unit/studio` | `Test Files 226 passed (226)`, `Tests 4212 passed / 1 skipped (4213)`, exit 0, 249,7 s | 1 skipped = uji yang sudah ada (bukan dari baris ini) |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | setelah semua perubahan termasuk smoke |
| Lint | `npx eslint <16 berkas tersentuh/baru> ` lalu `npx eslint scripts/studio/mcp/smoke-implw10.ts` | exit 0, exit 0 | |
| Benchmark | `npx tsx benchmark/extract/convert_v2.ts --check` x3 | 3 x `SAME template.v2.json sha256=882057c5...` dan `SAME datum-manual-000.preset.json sha256=a951b149...` | |
| Smoke DEV | `smoke-implw10.ts` | 7/7 PASS, exit 0 (jalan ke-6) | lihat bawah |

## Smoke DEV (127.0.0.1:9021, mission `2026-11-04_smoke-implw10`, stamp 20261104084041): 7/7 PASS, exit 0

Perintah: `INTERNAL_API_SECRET=<dibaca dari berkas ke env, tidak dicetak> STUDIO_MCP_FILE_ROOTS=%TEMP%\claude\w10\smoke npx tsx
scripts/studio/mcp/smoke-implw10.ts --mission 2026-11-04_smoke-implw10`. Keluaran `%TEMP%/claude/w10/smoke6.json`, log
`%TEMP%/claude/w10/smoke/smoke-implw10-20261104084041.log`. Rahasia: `grep -cF` = 0 di smoke6.json, smoke6.err, log, dan
`git diff`.

| # | Langkah | Hasil | Catatan |
|---|---|---|---|
| S1 | studio_write payload how-to §3 apa adanya (dibaca dari dokumen) | PASS | rev 7, COMPLETE |
| S2 | SATU studio_edit how-to §4: cell `X-B1`, addRow 2 sel, append, find/replace, meta | PASS | rev 10; edited record, bab 2, bab 3; status complete; X-B1 done; X-B5 `K-5d83f11d`/running; 3 butir; notApplied kosong |
| S3 | append `{subheading}` + paragraf, lalu append ke Bukti | PASS | blok baru terakhir. Catatan: alat tulis menulis `{subheading}` sebagai paragraf (`SUBHEADING_AS_PARAGRAPH`, perilaku IMPL-W3), jadi langkah ini tidak menguji sub-judul tersimpan; lihat S6/S7 |
| S4 | meta verdict FAIL lalu "PASS WITH ISSUES" dan "PASS kecuali cek 3 gagal" | PASS | keduanya `VERDICT_DROPPED` di hasil ringkas; vonis tersimpan tetap FAIL |
| S5 | find/replace bab biasa | PASS | `edited: ["bab 3"]`; ReportedAt tidak berubah |
| S6 | studio_report_submit MD dengan `### Detail uji` | PASS | blok `{"role":"subheading","text":"Detail uji"}` tersimpan |
| S7 | append ke "Bukti" lalu ke sasaran "Detail uji" | PASS | urutan: Bukti awal. / [sub:Detail uji] / Isi detail sub-judul. / Tambahan di akhir section. / Tambahan lewat sasaran sub-judul. |

Jalan 1-5 gagal karena predikat skrip smoke (bukan kode produk): bentuk blok sub-judul di S3, langkah S6 awal yang
mengasumsikan sub-judul tersimpan, kepala MD submit tanpa medan wajib (`MD2CONTRACT_REQUIRED_MISSING`), dan teks pembanding
terpotong 30 karakter. Setiap jalan membuat dokumen baru di mission smoke khusus ini.

## Verification

- **M16-1:** uji `varian tab/chart` (EDIT_UNSAFE, pesan memuat "Bukti" dan "bab-3", `writes = []`, rev tetap, bab 3 byte
  sama; batch campuran juga ditolak), kontrol bab terserialisasi (3 paragraf), bab benar-benar baru tetap dibuat; probe P1
  tab/chart diulang: `ok: false`, `EDIT_UNSAFE`, `writes: []`, `rev 6 -> 6`.
- **L16-1:** 18 nilai bersyarat/negasi -> `VERDICT_DROPPED` (termasuk semua contoh brief + "PASS?", "GAGAL 2 dari 8");
  "PASS (CHECK 1-8)" -> PASS, "FAIL (2 cek gagal)" -> FAIL; alias utuh tanpa peringatan; studio_edit meta tidak menimpa
  vonis tersimpan; smoke S4.
- **L16-2:** uji himpunan + hasil ringkas memuat SECTION_CREATED dan VERDICT_NORMALIZED; `implw6-quiet` himpunan persis.
- **High:** uji how-to apa adanya (S1+S2 dari dokumen), kunci addRow 2 sel = kunci studio_write = `stableKey('X-B9:
  sembilan')`, lebar penuh tetap jalan, lebar salah dan tabel bukan butir tetap `EDIT_INVALID`; smoke S1/S2.
- **Sub-judul:** uji paragraf/tabel append ke section bersub-judul (blok terakhir; tanpa CONTENT_INJECTION), sasaran
  sub-judul + find ber-section sub-judul; smoke S6/S7.
- **Grafik:** uji tepi kiri >= 0,4 mm (toleransi pembulatan koordinat SVG 0,005 mm) P-05 galeri, P-06 datum, kontrol P-04 dan
  P-06 galeri; `gutterPlan` <= cap dengan ruang tepi utuh; uji IMPL-W5 tetap lulus. Manifest: hanya
  `chart/p05.json@gallery` (e083953c.. -> 39baf517..) dan `chart/p06.json@datum` (9efac97e.. -> eb49999d..) berubah,
  alasan: talang label kini +0,4 mm (label "Lokasi A"/"R-xx" + 2,0 mm melewati lantai 6 mm); bagian `fitted` tidak berubah;
  kedua render lint score 0 (`fig02a` lulus). Benchmark SAME x3.
- **ReportedAt:** sunting bab -> `edited: ['bab 1']`, tanpa POST record, ReportedAt tetap; meta dan sel butir mencap; dua
  agen dari basis yang sama menyunting bab 1 dan bab 3 -> keduanya ok (sebelum perbaikan: `BASE_CONFLICT` pada record);
  smoke S5.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Alat tulis tidak dapat menyimpan sub-judul (`{subheading}` -> paragraf) | 0 (di luar lingkup) | keputusan IMPL-W3 (`SUBHEADING_AS_PARAGRAPH`) | perbaikan #2 berlaku untuk laporan dengan sub-judul tersimpan (MD `###` lewat submit/update/impor); dibuktikan smoke S6/S7 | Tidak |
| studio_write pertama di smoke jalan ke-6 melaporkan "rev 7 diperbarui" (jalan lain "rev 6 dibuat") | 0 | tidak diselidiki (jalur create studio_write tidak diubah baris ini) | dicatat sebagai pengamatan | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Brief menyebut detail "parenthetical/colon"; uji IMPL-W9 yang ada memakai juga `-`, `,`, `;` | Pemisah netral = `( [ : , ; - – —`; kata kualifikasi tetap ditolak di semua pemisah. Perlu konfirmasi controller bila hanya `(`/`:` yang diinginkan |
| 2 | "tidak lulus" ada di daftar contoh brief | Tetap FAIL: alias utuh sejak IMPL-W3 (bukan PASS, bukan hasil token awal). Negasi SESUDAH token awal ("not pass", "PASS tidak ...") -> DROPPED |
| 2 | Kata gagal/fail di rincian vonis FAIL ("FAIL (2 cek gagal)") | Diizinkan (konsisten dengan vonis); untuk vonis lain menjatuhkan |
| 2 | Tiga kasus IMPL-W9 berubah hasil: "GAGAL 2 dari 8", "PERLU TINJAUAN lanjutan", "lulus dengan catatan minor" | Kini VERDICT_DROPPED (sisa diawali kata/angka, bukan anotasi netral) sesuai aturan brief; uji IMPL-W9 diperbarui |
| 4 | Pelonggaran lebar n-1 | Hanya tabel butir (key + status) yang kolom PERTAMAnya bernama `key` (bentuk kolom otomatis studio_write); tabel lain tidak dilonggarkan |
| 4 | Bug akhiran kunci bentrok | Diperbaiki (kecil, perilaku kunci kini sama dengan studio_write) |
| 4 | Dokumen how-to/SKILL.md | Tidak diubah: bentuk terdokumentasi kini berjalan apa adanya |
| 6 | Dumbbell galeri | anchorGap bawaan dipertahankan agar render identik (tepi 1,0 mm sudah cukup) |
| 7 | "Saluran meta" | Cap bila meta diberi (meski hanya bab yang berubah); tanpa meta, cap hanya bila record berubah |
| - | M16-2 | Tidak diubah (D-577 risiko diterima) |
| - | Review 17 #6, #7 dan Low tanpa perubahan perilaku | Ditunda sesuai brief controller |

## Untuk peninjau (review recommended)

Cakupan: (1) `standardSection` + filter `unsafe` (M16-1); (2) `verdictRestNeutral` dan daftar kata (L16-1, regex linear);
(3) `sectionsOf` level `##` dan dampaknya pada `addRow` (tabel di bawah sub-judul kini termasuk section induk; tabel bawaan
= tabel terakhir section); (4) addRow lebar n-1; (5) `labelGutter`/`gutterPlan`; (6) syarat cap ReportedAt.

## Next Steps

- Controller: catat keputusan di atas (pemisah vonis, "tidak lulus", lingkup pelonggaran addRow) di `decisions.md`.
- Review ulang keamanan/kode untuk siklus ini (review recommended).

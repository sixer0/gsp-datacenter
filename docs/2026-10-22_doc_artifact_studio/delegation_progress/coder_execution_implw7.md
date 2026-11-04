---
task_id: IMPL-W7
task_slug: doc_artifact_studio
row: IMPL-W7
date: 2026-11-04
agent: coder-execution
source_plan: brief controller IMPL-W7 (bukti uji Hermes ronde 10 run R12B), docs/STUDIO-MCP.md §4-§5
status: complete
---

# Laporan Implementasi: IMPL-W7 - baris datar berurutan digabung menjadi tabel

Skill dimuat: `tdd` (merah dulu), `verification-before-completion` (semua klaim memakai keluaran perintah segar).
Basis: branch v2.1, HEAD 7e326c1 + dokumen belum di-commit. Tanpa commit; `decisions.md` tidak disentuh.

## Akar masalah

`normalizeBlock` (`scripts/studio/mcp/write-normalize.ts`) memetakan SETIAP larik datar teks/angka menjadi `{list}`
(`ARG_MAPPED`, "larik teks -> daftar", STUDIO-MCP.md 5.y). Kiriman R12B (`[["judul","status"], ["R12-B1: ...","berjalan"],
..., "paragraf"]`) = lima larik datar berurutan, jadi lima blok daftar yang di Markdown menyatu menjadi satu daftar
berbutir. Tabel butir tidak pernah ada, record tanpa butir, suntingan sel gagal, dan mengganti daftar dengan tabel
ditolak pagar struktur (`CONTENT_INJECTION`, benar). Normalisasi ini dipakai bersama oleh `studio_write` (laporan kerja
dan dokumen klien: `prepare: normalizeWriteArgs`, write-tools.ts:186) dan `studio_edit` (`normalizeEditArgs`, write-tools.ts:713,
jalur `append` laporan dan klien), jadi satu perbaikan di satu tempat menutup keempat jalur.

## Perilaku hari ini (butir 2, didokumentasikan, tidak diubah)

- Larik datar TUNGGAL (bukan bagian run >= 2 selebar sama), mis. `["vitest lulus", "tsc 0"]` -> daftar `{list}` +
  `ARG_MAPPED`. Diasersi uji "larik datar TUNGGAL tetap perilaku lama".
- Larik datar lebar 1 (`["tunggal"]`) -> daftar, juga bila berurutan (lebar < 2 tidak ikut).
- `append` studio_edit yang SELURUHNYA larik baris (`[[..],[..]]`) -> satu tabel (perilaku IMPL-W5, tidak berubah).

## Desain

- `coalesceRows(blocks, notes, where)` (write-normalize.ts): run >= 2 blok BERURUTAN, masing-masing larik datar skalar
  dengan lebar SAMA >= 2 -> satu blok `Cell[][]` (urutan baris tetap; baris pertama = judul kolom, persis blok tabel
  kanonik; sel lewat `cell()` yang sama). Lebar berubah = run putus (tiap run digabung sendiri). Larik bersarang dan
  blok lain tidak ikut. Dipanggil SEBELUM `normalizeBlock` di `normalizeSection` (termasuk blok bersarang
  `{heading, blocks}`) dan di jalur `append` `normalizeEditArgs` (hanya bila append bukan rowsLike utuh).
- Peringatan `ROWS_COALESCED_TO_TABLE` (satu peringatan per panggilan, run digabung dalam pesan, maks 12) ditambahkan ke
  `INFORMATIONAL_WARNING_CODES` (tool-kit.ts), jadi senyap di hasil ringkas dan tampil dengan `detail: true`.
- Tabel hasil gabungan masuk jalur yang sama dengan tabel biasa: kolom status -> tabel butir (`repairItemTable`: kolom
  `key`, kunci stabil `K-<sha8>`, alias status, butir record). Tidak ada kode khusus tabel gabungan.
- Butir 4 (verifikasi): ringkasan verifikasi SEBELUMNYA tidak melaporkan tabel (hanya judul/keterangan/halaman/figur).
  Ditambahkan: `Printed.tables` (total `<table>` HTML / `<w:tbl>` DOCX, termasuk tabel templat) dan `headings[].tb` (tabel
  sesudah judul itu sampai judul berikutnya); baris `verifikasi:` memuat `N tabel`; `structuredContent.verify.tableCount`
  (ringkas dan detail); blok tak tepercaya mencetak `2.1 Rincian kerja [tabel 1]`, atau satu baris `tabel per judul: ...`
  bila daftar judul tidak dicetak ulang (suntingan tanpa perubahan judul).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca implw5, STUDIO-MCP §4-§5, normaliser, verify | complete | normaliser bersama ditemukan: write-normalize.ts |
| 2 | Uji merah `implw7-rows.test.ts` | complete | 11 gagal / 1 lulus sebelum kode (lulus = larik tunggal, perilaku lama) |
| 3 | `coalesceRows` + kode informasional | complete | |
| 4 | Jumlah tabel di ringkasan verifikasi | complete | HTML + DOCX, total + per judul |
| 5 | Dokumen STUDIO-MCP.md (5.y, 5.v baru, §7) | complete | |
| 6 | Smoke DEV `smoke-implw7.ts` | complete | 4/4 PASS, exit 0 |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| scripts/studio/mcp/write-normalize.ts | modify | `isFlatRow`, `coalesceRows`, `Notes.coalesce` + peringatan ROWS_COALESCED_TO_TABLE; dipakai di `normalizeSection` (+ bersarang) dan `append` |
| scripts/studio/mcp/tool-kit.ts | modify | `INFORMATIONAL_WARNING_CODES` + `ROWS_COALESCED_TO_TABLE` |
| scripts/studio/mcp/write-verify.ts | modify | `elements()` membawa posisi `at`; `countTables`/`openTags`; `Printed.tables`, `headings[].tb`; `verify.tableCount`, "N tabel", "[tabel N]" |
| scripts/studio/mcp/smoke-implw7.ts | add | smoke DEV IMPL-W7 |
| tests/unit/studio/mcp/implw7-rows.test.ts | add | 13 uji |
| tests/unit/studio/mcp/implw6-quiet.test.ts | modify (milik IMPL-W6) | 1 asersi: kelas informasional kini 3 kode (sebelumnya persis 2); asersi lain tidak diubah |
| docs/STUDIO-MCP.md | modify | 5.y "larik teks tunggal -> daftar (>= 2 ... -> tabel)", §5.v baru, §7 baris IMPL-W7 |

Tidak diubah oleh sesi ini: DB/Prisma, port 9011, `~/gsp-datacenter`, `decisions.md`, `file_claims.md`, deskripsi alat
(`tools/list` tidak berubah). `docs/STUDIO-HOWTO-REPORT.md`, `decisions.md`, dan dua brief `hermes_trial/17_r11_*` sudah
berubah/baru di pohon kerja sebelum sesi ini (bukan tulisan IMPL-W7). Berkas debug sementara `zz-dbg-w7.test.ts` dibuat
dan dihapus dalam sesi. Server DEV 9021 tidak dinyalakan/dimatikan.

## Test Results (segar, kode akhir)

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Merah sebelum kode | `npx vitest run tests/unit/studio/mcp/implw7-rows.test.ts` | `Tests 11 failed / 1 passed (12)` | mis. `expected [ 'ARG_MAPPED', …(6) ] to include 'ROWS_COALESCED_TO_TABLE'`; klien: `[ 'paragraph', 'list', 'list', …(1) ]` vs `['paragraph','table','paragraph']`; `htmlPrinted ... expected undefined to be 3` |
| Typecheck | `npx tsc --noEmit -p .` | `tsc exit 0` | |
| Lint | `npx eslint <6 berkas tersentuh/baru>` | `eslint exit 0` | write-normalize, write-verify, tool-kit, smoke-implw7, implw7-rows, implw6-quiet |
| MCP | `npx vitest run tests/unit/studio/mcp` | `Test Files 27 passed (27)`, `Tests 333 passed (333)` | implw7-rows 13/13 |
| Renderers + figures | `npx vitest run tests/unit/studio/renderers tests/unit/studio/figures` | `Test Files 56 passed (56)`, `Tests 873 passed / 1 skipped (874)` | |
| convert_v2 x3 | `npx tsx benchmark/extract/convert_v2.ts --check` | 3x `SAME` doc.v2.json (79290e07...), template.v2.json (882057c5...), datum-manual-000.preset.json (a951b149...); exit 0 x3 | |
| Smoke DEV | `smoke-implw7.ts` | 4/4 PASS, exit 0 | lihat bawah |

Catatan TDD jujur: uji klien `append` semula mengasumsikan append klien tersimpan; jalannya menunjukkan gerbang sumber
DATUM-10 (jalur append klien tidak membawa `meta.source`, IMPL-W5) menolak tabel append tanpa sumber. Uji itu diubah
menjadi pembanding: baris datar + paragraf menghasilkan galat `SOURCE_MISSING` yang SAMA (pesan identik, 0 tulis) dengan
kiriman kanonik `[[...],[...]]`; sebelum perubahan, baris datar menjadi daftar dan lolos diam-diam (pembeda nyata).
Uji "sunting sel sesudah tulis" semula memakai server tiruan tanpa `createdBy` (DOCUMENT_OWNED_BY_OTHER, masalah uji),
diganti ke `editRoutes()`.

## Uji `implw7-rows.test.ts` (13)

Fungsi murni: R12B 5 larik -> satu tabel + paragraf, `ROWS_COALESCED_TO_TABLE` (tanpa ARG_MAPPED), kode informasional;
larik tunggal -> daftar (ARG_MAPPED saja); dua run lebar 2 dan 3 -> dua tabel, lebar 1 -> daftar, larik bersarang tetap,
larik datar sesudahnya tunggal -> daftar; `append` -> satu tabel + paragraf.
Laporan kerja (MCP): studio_write R12B -> record 4 butir `running,todo,todo,todo`, bab 2 tepat 1 tabel, tanpa daftar,
peringatan senyap di ringkas (teks + structuredContent); `detail: true` menampilkannya; sesudah tulis, sel status butir
pertama -> `done`; studio_edit append R12B ke Bukti -> `table, paragraph`, butir masuk record dengan status terpetakan.
Klien: studio_write bab dengan dua larik datar selebar sama -> `paragraph, table, paragraph`, sel `Gardu|Status`,
`Cikupa|siap`; append klien = perlakuan kanonik (di atas).
Verifikasi: `htmlPrinted` total 3, per judul `[0,1,2]`; `docxPrinted` total 3 (1 sebelum judul pertama), `Kinerja` 2;
studio_write: `verify.tableCount` angka, teks memuat "N tabel".

## Smoke DEV (127.0.0.1:9021, mission `2026-11-04_smoke-implw7`, stamp 20261104024247): 4/4 PASS, exit 0

Perintah: `INTERNAL_API_SECRET=<dari berkas trial_internal_secret, hanya env, tidak dicetak>
STUDIO_MCP_FILE_ROOTS=%TEMP%\claude\w7\smoke npx tsx scripts/studio/mcp/smoke-implw7.ts`. Keluaran
`C:\Users\TRIAL\AppData\Local\Temp\claude\w7\smoke.json`, log
`C:\Users\TRIAL\AppData\Local\Temp\claude\w7\smoke\smoke-implw7-20261104024247.log`.

| # | Langkah | Hasil | Catatan |
|---|---|---|---|
| R1 | studio_write bentuk R12B | PASS | bab2 `table,paragraph`; header `key|judul|status`; 4 butir `K-504b2132 running`, `K-a36b130d todo`, `K-d58aaea6 todo`, `K-5a269cc9 todo`; peringatan (detail) ROWS_COALESCED_TO_TABLE, ITEM_KEY_COLUMN_ADDED, ITEM_KEY_GENERATED |
| R2 | jumlah tabel di verifikasi | PASS | `10 judul; 0 keterangan; 3 tabel`; blok: `2.1 Rincian kerja [tabel 1]` (2 tabel lain = tabel templat sebelum judul pertama) |
| R3 | sel status R12-B1 (kunci) -> selesai | PASS | `K-504b2132 done`; verifikasi sunting: `tabel per judul: 2.1 Rincian kerja [tabel 1]` |
| R4 | sel status lewat judul butir R12-B2 -> berjalan | PASS | `K-a36b130d running` |

## Verification

- Butir 1 (laporan + klien, write + append): uji R12B write/append laporan, klien write; smoke R1. Peringatan
  informasional: uji ringkas vs detail; implw6 diperbarui.
- Butir 2: uji larik tunggal; dokumentasi 5.y/5.v.
- Butir 3: uji dua run lebar berbeda + campuran bersarang/datar.
- Butir 4: sebelumnya TIDAK ada; kini `tableCount` + "[tabel N]" per judul (uji htmlPrinted/docxPrinted + smoke R2).
- Butir 5: record butir + suntingan sel (uji + smoke R3/R4).

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Append tabel ke dokumen KLIEN tanpa sumber -> `SOURCE_MISSING` | 0 (di luar lingkup) | jalur append klien memakai `metaSource = null` (write-client-edit.ts:310, IMPL-W5); gerbang DATUM-10 | perilaku sama dengan tabel kanonik; agen perlu `{table, caption, source}` | tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Lebar minimum run | larik lebar >= 2 saja (lebar 1 tetap daftar), sesuai brief |
| 3 | `append` yang seluruhnya larik baris | tetap jalur rowsLike IMPL-W5 (satu tabel); hasil sama dengan aturan baru |
| 3 | Satu peringatan per panggilan | run digabung dalam satu pesan (maks 12 lokasi) agar ringkas |
| 4 | Jumlah tabel mencakup tabel templat | total = semua tabel tercetak; per judul hanya tabel sesudah judul itu |
| 2 | Uji milik IMPL-W6 diubah (1 asersi) | kelas informasional bertambah sesuai brief; dicatat di sini |
| - | Review | review recommended: write-normalize.ts `coalesceRows`, write-verify.ts penghitung tabel |

## Next Steps

- Controller: catat keputusan ROWS_COALESCED_TO_TABLE (kelas informasional) di decisions.md; commit.
- Opsional (di luar lingkup): `meta.source` untuk jalur append klien.

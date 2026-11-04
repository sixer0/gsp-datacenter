---
task_id: IMPL-W9
task_slug: doc_artifact_studio
row: IMPL-W9
date: 2026-11-04
agent: coder-execution
source_plan: brief controller IMPL-W9 (bukti uji ronde 12, run R12B), docs/STUDIO-MCP.md §5, coder_execution_implw5.md
status: complete
---

# Laporan Implementasi: IMPL-W9 - append membuat section laporan baku + normalisasi vonis

Skill dimuat: `tdd` (merah dulu: 9 gagal / 3 kontrol lulus sebelum kode), `verification-before-completion` (semua klaim
di bawah memakai keluaran perintah segar). Basis: branch v2.1, HEAD eb7fcef. Tanpa commit. Baris `decisions.md` yang belum
di-commit tidak disentuh.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| A | `studio_edit {section, append}` laporan: section baku yang belum ada dibuat di posisi bakunya | complete | bab outline lewat `mapHeading` (pemetaan studio_write) + Rujukan di ekor record; `SECTION_CREATED` |
| A-Ruj | Rujukan lewat konversi tabel rujukan yang sama dengan studio_write | complete | `record.refs` dari konverter; pid/documentId/hubungan tak sah -> `MD_REPORT_INVALID` (kode sama dengan studio_write), 0 tulis |
| B | Normalisasi vonis dari token awal (studio_write meta + saluran meta studio_edit) | complete | `VERDICT_NORMALIZED`; alias Indonesia; tanpa token terpetakan tetap `VERDICT_DROPPED` |
| C | Dua kode ke `INFORMATIONAL_WARNING_CODES`; docs §5.t baru + §5.w + §7 | complete | |
| Uji | `tests/unit/studio/mcp/implw9-section-verdict.test.ts` (12 uji) | complete | |
| Smoke | `scripts/studio/mcp/smoke-implw9.ts` DEV 9021 | complete | 5/5 PASS, exit 0, jalan pertama |

## Desain dan akar masalah

- **Bukti 1 (TEXT_NOT_FOUND).** Rujukan laporan kerja tidak berupa bab: serializer `recordToReportMarkdown`
  (md-report.ts:1037) menulis `## Rujukan` + tabel di region `tail` bagian **record**, dan `sectionsOf` (write-edit.ts)
  melewati bagian record. Jadi append ke "Rujukan" selalu TEXT_NOT_FOUND, juga bila Rujukan sudah ada. Bab wajib yang
  belum ada (laporan INCOMPLETE) juga tidak dapat ditambahkan lewat append.
- **Perbaikan A (write-edit.ts).** Opsi baru `ApplyOptions.createMissing` (hanya diset `editWorkReport`; dokumen klien
  memakai `write-client-edit.ts`, tidak lewat sini). `targetSection`: (1) sasaran berjudul Rujukan (`isRefsHeading`, set
  yang sama dengan `arrangeRefs` studio_write) -> `## Rujukan` di ekor record, dibuat bila belum ada; (2) selain itu
  `secResolve` seperti dulu; TEXT_NOT_FOUND -> `standardSection`: `mapHeading` + `workReportChapters` (fungsi yang sama
  dengan `HEADING_MAPPED` studio_write). Bab baku yang sudah ada dengan judul lain -> section terakhirnya (`HEADING_MAPPED`);
  belum ada -> bagian `bab N` baru berjudul outline, didorong di akhir larik (larik paralel snapshot/stored/trusted/ids ikut
  diperpanjang agar E3/E4/reguard tetap benar), lalu sesudah semua suntingan diurutkan ke posisi baku (`partRank` = urutan
  `serializeParts`) dan indeks `touched` dipetakan ulang. Nama tak terpetakan -> galat asli (TEXT_NOT_FOUND, notApplied
  bila batch berisi suntingan lain). `addRow` hanya menyasar Rujukan yang sudah ada (tidak membuat section).
- **Rujukan.** `refsAppendTables` (write-content.ts): tabel (larik baris / `{table}`, keterangan tidak dipakai = perilaku
  `arrangeRefs`) diteruskan; `{ref}` -> satu tabel hubungan|dokumen|paragraf|revisi; blok lain -> `EDIT_INVALID`. Baris
  disusun `blockLines` (escape sel sama). Validasi isi = konverter `mdReportToBlocks` (sama dengan jalur studio_write);
  galat `MD_REPORT_INVALID` saat konversi ulang dikirim dengan kode itu (bukan EDIT_INVALID), pesan konverter di blok
  rincian tak tepercaya. `prepareStructEdits` kini mengizinkan `{ref}` hanya bila `section` berjudul Rujukan.
- **Pagar (write-tools.ts).** `assertEditShape`: himpunan bagian boleh bertambah tepat dengan `plan.created`; bab baru
  diperiksa (jumlah blok = blok append, jenis bukan paragraf urut, teks paragraf append utuh). Append Rujukan menyalakan
  `plan.refCells` (record.refs boleh berubah) dan `plan.refsAppended`. `EDIT_UNSAFE` tidak berlaku untuk bab yang baru dibuat.
  Kiriman tetap jalur update ber-basis (`runReport`), jadi pagar record jalur update dan cek server berlaku.
- **Bukti 2 (VERDICT_DROPPED).** `normalizeOptionalFields` hanya menerima nilai utuh. Perbaikan B: `verdictExact`
  (perilaku lama, tanpa peringatan) lalu `verdictLeading`: token awal `[\p{L}_-]+` dipisah spasi (berhenti di tanda
  baca/angka), frasa terpanjang lebih dulu (maks 4 kata), dicocokkan kode/alias -> `VERDICT_NORMALIZED` (pesan memuat teks
  asli). Alias baru: butuh tinjauan, butuh review, passed, failed (lulus/gagal/perlu tinjauan/waspada sudah ada). Satu
  fungsi dipakai studio_write meta dan saluran meta studio_edit (`recordMetaFields` -> `recordLines`).

## Changes Made

| File | Change Type | Description |
|---|---|---|
| scripts/studio/mcp/write-edit.ts | modify | `ApplyOptions.createMissing`, `EditPlan.created`/`refsAppended`, `refsSection`/`addPart`/`standardSection`/`targetSection`, cabang append Rujukan, addRow ke Rujukan yang ada, pengurutan posisi baku |
| scripts/studio/mcp/write-tools.ts | modify | `createMissing: true` di `editWorkReport`, `reparseOrThrow(..., refs)` -> MD_REPORT_INVALID, `assertEditShape` bab baru, `EDIT_UNSAFE` mengecualikan bab baru, `{ref}` di append ke Rujukan |
| scripts/studio/mcp/write-content.ts | modify | `verdictExact`/`verdictLeading` + `VERDICT_NORMALIZED`, 4 alias vonis, `refsAppendTables`, `isRefsHeading` diekspor |
| scripts/studio/mcp/tool-kit.ts | modify | `SECTION_CREATED`, `VERDICT_NORMALIZED` ke `INFORMATIONAL_WARNING_CODES` |
| tests/unit/studio/mcp/implw9-section-verdict.test.ts | add | 12 uji |
| tests/unit/studio/mcp/implw6-quiet.test.ts | modify | asersi himpunan kelas informasional + 2 kode (pola yang sama dengan IMPL-W7/W8) |
| scripts/studio/mcp/smoke-implw9.ts | add | smoke DEV IMPL-W9 |
| docs/STUDIO-MCP.md | modify | §5.t baru, §5.w catatan `{ref}`, §7 baris IMPL-W9 |

Tidak diubah: DB/skema, port 9011, `~/gsp-datacenter`, `decisions.md`, `file_claims.md`, konverter `md-report.ts`, jalur
dokumen klien, server DEV (tidak dinyalakan/dimatikan). Tidak ada berkas yang dihapus/diganti nama.

## Test Results (segar, kode akhir)

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Merah (sebelum kode) | `npx vitest run tests/unit/studio/mcp/implw9-section-verdict.test.ts` | `Tests 9 failed / 3 passed (12)` | 3 lulus = kontrol perilaku lama (non-baku TEXT_NOT_FOUND, klien, vonis persis) |
| Uji baru | idem | `Tests 12 passed (12)` | |
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | 0 galat |
| Lint | `npx eslint <7 berkas tersentuh/baru>` | exit 0 | 0 masalah |
| MCP | `npx vitest run tests/unit/studio/mcp` | `Test Files 29 passed (29)`, `Tests 358 passed (358)`, exit 0 | jalan pertama 1 gagal (implw6 himpunan informasional, diharapkan) -> asersi diperbarui |
| Smoke DEV | `smoke-implw9.ts` | 5/5 PASS, exit 0 | lihat bawah |

## Smoke DEV (127.0.0.1:9021, mission `2026-11-04_smoke-implw9`, stamp 20261104052448): 5/5 PASS, exit 0

Perintah: `INTERNAL_API_SECRET=<dibaca dari berkas ke env, tidak dicetak> STUDIO_MCP_FILE_ROOTS=%TEMP%\claude\w9\smoke npx tsx scripts/studio/mcp/smoke-implw9.ts --mission 2026-11-04_smoke-implw9`.
Keluaran `%TEMP%/claude/w9/smoke1.json`, log `%TEMP%/claude/w9/smoke/smoke-implw9-20261104052448.log`. Rahasia: `grep -cF`
= 0 di smoke1.json, smoke1.err, dan log.

| # | Langkah | Hasil | Catatan |
|---|---|---|---|
| S1 | studio_write laporan A + pid bab 1 | PASS | rev 6; pid p-rt7vckbhx2 |
| S2 | studio_write laporan B, meta verdict "PASS (CHECK 1-8)" | PASS | verdict PASS; refs 0; VERDICT_NORMALIZED senyap di ringkas |
| S3 | studio_edit B `{section:"Rujukan", append:[[["hubungan","dokumen","paragraf"],["bukti",A,pidA]]]}` (bentuk R12B) | PASS | rev 7; edited record; refs `[{pid:p-rt7vckbhx2, rel:evidence, documentId:cmw1oa0uu0z2av1881rwmsj3a}]`; SECTION_CREATED (detail) |
| S4 | studio_edit meta verdict "gagal: uji ulang 2 cek" lalu "PASS (CHECK 1-8)" | PASS | FAIL lalu PASS; VERDICT_NORMALIZED tampil dengan detail |
| S5 | Rujukan pid "P 1!"; section "Bab Fiktif" | PASS | MD_REPORT_INVALID; TEXT_NOT_FOUND; refs tetap 1 |

## Verification

- A Rujukan sah: uji "Rujukan (bukti R12B ...)" (refs `[{documentId, pid, rel: evidence}]`, `edited: ['record']`, append
  kedua menambah baris tanpa section kedua); smoke S3.
- A pid tak sah: uji membandingkan kode studio_edit dengan studio_write untuk tabel yang sama (`MD_REPORT_INVALID` keduanya),
  `writes = []`; smoke S5.
- A bab baku + posisi: uji "bab wajib yang belum ada (Isu terbuka)" (bab 4 judul Isu terbuka, `edited` hanya bab 4 dari bab),
  "judul alias (Risks)", fungsi murni "posisi baku" (urutan record, bab 1, bab 3, bab 4, bab 5; `## Rujukan` di ekor record).
- A tidak berubah: "section non-baku" (TEXT_NOT_FOUND, 0 tulis), "dokumen klien" (Ringkasan/Rujukan/Isu terbuka -> TEXT_NOT_FOUND, 0 tulis).
- B: 12 bentuk token awal -> enum + VERDICT_NORMALIZED berisi teks asli; nilai persis tanpa peringatan; "xyz", "(PASS)",
  "8/8 lulus", "not pass" -> VERDICT_DROPPED; studio_write + studio_edit lewat MCP (record.verdict); smoke S2, S4.
- C: uji kelas informasional; ringkas menyembunyikan, `detail: true` menampilkan (uji B + smoke S2/S3/S4).

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Blok teks ke Rujukan lewat append ditolak (studio_write memindahnya ke "Catatan rujukan") | 0 | append tidak membuat bab tambahan | `EDIT_INVALID` dengan petunjuk; didokumentasikan §5.t | Tidak |
| `{ref}` tak sah di append menolak batch (studio_write menyimpannya sebagai teks catatan) | 0 | konsekuensi baris di atas; validasi = konverter | `MD_REPORT_INVALID`, 0 tulis | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| A | Rujukan bukan bab (ekor record) | Section dibuat di ekor record (posisi baku serializer); kiriman = bagian record |
| A | Sasaran berjudul Rujukan/Referensi kini diarahkan ke Rujukan record lebih dulu | Konsisten dengan `arrangeRefs` studio_write (set judul sama). Akibat: "Referensi" saat bagian `references` (daftar pustaka) ada kini menambah Rujukan, bukan EDIT_INVALID lama. Perlu konfirmasi controller bila tidak diinginkan |
| A | Bab baku yang ada dengan judul lain | Ditambahkan ke bab itu + `HEADING_MAPPED` (bukan bab ganda) |
| A | addRow ke Rujukan yang sudah ada | Ikut didukung (kecil, mencegah TEXT_NOT_FOUND setelah section dibuat); addRow tidak membuat section |
| A | Kode penolakan pid tak sah | `MD_REPORT_INVALID` (sama dengan studio_write), bukan `EDIT_INVALID`; hanya bila suntingan menambah Rujukan |
| B | Batas token | maks 4 kata, frasa terpanjang dulu ("lulus dengan catatan minor" -> CAUTION, "tidak lulus" -> FAIL); tambahan alias passed/failed |

## Untuk peninjau (review recommended)

Cakupan: (1) `targetSection`/`standardSection`/`addPart` + pengurutan ulang larik `parts` dan pemetaan `touched`
(write-edit.ts); (2) pelonggaran `assertEditShape` untuk bab baru dan `EDIT_UNSAFE` (write-tools.ts) - bab baru hanya boleh
berisi blok append; (3) jalur isi Rujukan: baris tepercaya (`trust`) dilewati `reguard`, disusun `blockLines`/`cellText`;
judul `## Rujukan`/`## <judul outline>` adalah teks mesin; (4) `{ref}` di append kini lolos `prepareStructEdits` bila
section berjudul Rujukan; (5) regex `verdictLeading` linear (kelas karakter tunggal + `\s+`, tanpa backtracking bersarang
berbahaya pada masukan maks 2000 karakter).

## Next Steps

- Review kode + keamanan (cakupan di atas).
- Keputusan controller: perilaku "Referensi" (lihat Issues & Decisions); perbarui panduan agen bahwa append Rujukan kini
  berlaku di pembaruan.

# SR-49 Uji integrasi DB Studio (S75 diperluas) di `gsp_agent_hq_v21_uji`

Baris: SR-49 (blueprint 05; SC-5, SC-6, SC-7). Agen: test-expert, skill `tdd`. Tanggal: 2026-10-23.
Status: **complete** sesudah rerun akhir D-309 (bagian 00) dan jalan ulang D-275 (bagian 0): `Tests 25 passed | 1 skipped (26)`. Bagian 1-9 = jalan pertama (siklus 0), dipertahankan sebagai riwayat.

## 00. Rerun akhir (D-305 M-6, D-309; sesudah FIX-S2, FIX-U2, FIX-Z, FIX-SERAH, FIX-C2, FIX-A2, FIX-B2, FIX-H, FIX-2)

| Butir | Perintah -> log | Hasil |
|---|---|---|
| Suite penuh `_uji` | `node tests/integration/studio/uji-run.mjs suite --reporter=verbose` -> `out/00_suite_run.log` | `Tests 25 passed \| 1 skipped (26)`, exit 0, 144.12 s; DB `gsp_agent_hq_v21_uji`; rekonstruksi 15/15; R14 di atas basis backfill cocok; render ulang revisi lama 4/4 dan revisi v2 lama identik (DOCX/HTML per byte, PDF per tanda isi) |
| Seed DB segar | `uji-run.mjs fresh-seed` -> `out/30_fresh_seed.log` | 3 jalan seed exit 0; kanonik/gsp/manual-000 guard ok, diffOutsideDelta 0; jalan kedua `unchanged` |
| render-twice 001#1 | `uji-run.mjs -- npx tsx tests/integration/studio/tools/render-twice.ts 001/GSP/KT/X/2026 1` -> `out/31_render_twice.log` | DOCX `a48e5e3ea8b5` x3, `equal=true` |
| v21 baca-saja | `npx tsx tests/integration/studio/tools/recon.ts --allow-v21` -> `out/32_v21_recon_readonly.log` | 7/7 cocok (001#1, 002#1, 000#1-5) |
| F-062 | F9 | FAIL = 16 FAIL / 7 cek terjelaskan (C-27 1, C-34 1, C-SG-L2-04 9, D18 1, D20 1, DATUM-03 1, G3 2); 0 tak terjelaskan |

Uji usang: tidak ada (0 berkas uji diubah pada rerun ini). Log rerun sebelumnya disimpan: `out/00_suite_run_cycle2.log`.

## 0. Jalan ulang D-275 (siklus perbaikan 1+2: D-247, D-261, D-262, D-263, D-265, D-267, D-269, D-273)

| Butir | Perintah / bukti | Hasil |
|---|---|---|
| Suite penuh di `gsp_agent_hq_v21_uji` | `node tests/integration/studio/uji-run.mjs suite --reporter=verbose` -> `out/00_suite_run.log` | `Tests 25 passed \| 1 skipped (26)`, exit 0, Duration 152.79 s; F0 `current_database()` = `gsp_agent_hq_v21_uji` |
| N1 / F-070 (R14 di atas basis backfill) | F6 `rekonstruksi revisi R14 templateVersion ...`, `evidence.json r14OnBackfilled` | 000 rev 2 cocok `ac7d05dd…` = `ac7d05dd…`; pid `F:cover` snapshot = M17 = recompose = `b-c13c6a40c6fd8b27`. F8: 15/15 revisi cocok |
| N2 seed DB segar (D-267) | `node tests/integration/studio/uji-run.mjs fresh-seed` -> `out/30_fresh_seed.log` | dasar registri kini lalu `--presets-and-skeletons --import-manual000-v2` exit 0: kanonik/gsp/manual-000 guard ok, diffOutsideDelta 0 (Δ 0/3/12); jalan 2 exit 0, semua `unchanged` |
| N4 / F5 (D-265) | `uji-run.mjs -- npx tsx tests/integration/studio/tools/render-twice.ts 001/GSP/KT/X/2026 1` -> `out/31_render_twice.log` | 3 render dalam satu proses: DOCX `a48e5e3ea8b5` x3, `equal=true`; F5 suite: DOCX/HTML byte-identik + PDF tanda isi identik 4/4 revisi lama; F8 revisi v2 lama identik |
| F-062 (D-263, D-269) | F9, `evidence.json f062` | 000 rev 3 releaseStatus FAIL = 16 FAIL / 7 cek, semuanya selisih isi terjelaskan (C-27 1, C-34 1, C-SG-L2-04 9, D18 1, D20 1, DATUM-03 1, G3 2); 0 cek di luar daftar terjelaskan (asersi baru); himpunan sama dengan rev 1 norm/v1 |
| D-247 (build hanya endpoint) | F7, kiriman bab dengan medan `render` | 400 `RENDER_FIELD`, 0 job baru, revisi tetap 2. Uji lain tidak usang: suite tidak pernah mengirim `render` di badan (render lewat R17/`renderRevision`) |
| Cek baca-saja v21 | `npx tsx tests/integration/studio/tools/recon.ts --allow-v21` (`default_transaction_read_only=on`) -> `out/32_v21_recon_readonly.log` | 7/7 revisi berbaris cocok: 001#1, 002#1, 000#1-5 (000 rev 2 `4ca8ee3d`, rev 3 `3733f35b`, rev 5 `77027e60`). Jalan pertama sempat menampilkan 2 revisi (002/GSP/KT, 003/GSP/KT) yang hilang di tengah pemindaian = fixture sementara agen lain; jalan kedua bersih |

Perubahan uji (area SR-49): asersi F-062 diperketat (D-263/D-269), asersi D-247 `RENDER_FIELD` ditambahkan di F7, subperintah `fresh-seed` di `uji-run.mjs` (N2). eslint `tests/integration/studio` exit 0; `tsc --noEmit -p .` 0 galat di `tests/integration`. Log siklus 0 disimpan: `out/00_suite_run_cycle0.log`, `out/00_suite_run_0838.log`. Keadaan `_uji` sesudah jalan terakhir: suite (5 dokumen, 15 revisi); `fresh-seed` dijalankan SEBELUM suite (suite me-reset DB).

## 1. Strategi uji (jalan pertama)

- **Lingkup:** uji integrasi DB nyata (tanpa Prisma tiruan) atas layanan dan route Studio: migrasi, ingest v1 (jalur lama norm/v1 dan adaptor), ingest v2 bertarget, kiriman parsial R12/R13/R04, render lingkup R17 (bab/slot draf, penuh), rekonstruksi snapshot dari M14-M18, backfill SR-37/SR-38 (`--rewrite-v1-rows`), seed preset + kerangka SR-36/SR-38, render ulang revisi lama, karakterisasi F-062.
- **DB:** hanya `gsp_agent_hq_v21_uji`. Pembungkus `tests/integration/studio/uji-run.mjs` membaca DATABASE_URL dari `.env` (tidak diubah, tidak dicetak), mengganti nama DB menjadi `_uji` di lingkungan proses anak, menolak sumber selain v21/v21_uji, dan menyaring URL/kata sandi dari keluaran. `reset` = DROP/CREATE `_uji`, `prisma migrate deploy` (7 migrasi), `migrate status`, salin baris templat GAYA LAMA dari v21 (koneksi `default_transaction_read_only=on`, hanya SELECT): datum-kanonik v1..v5, datum-gsp v1, datum-manual-000 v1..v2.
- **Pengecualian dan alasan:** (a) baseline templat dari registri kini (`--import-benchmark --import-datum-gsp`) tidak dipakai sebagai jalur utama karena penjaga preset GSP gagal di DB segar (temuan N2, log disimpan); (b) `mission` fixture v1 dibuang (folder IL tidak ada di DB uji); (c) operasi ADMIN memanggil layanan dengan objek pemanggil ADMIN (tanpa cookie sesi; aturan brief 7); route agen memakai header internal dengan rahasia uji in-process.
- **Kerangka:** Vitest 4.1.11, `tests/integration/studio/studio-db.integration.test.ts` (sekuensial, F0-F9). Tanpa pembungkus suite di-skip dan Prisma tidak dimuat (`npx vitest run tests/integration/studio` -> `1 passed | 25 skipped`).

## 2. Berkas uji

| Berkas | Isi |
|---|---|
| `tests/integration/studio/studio-db.integration.test.ts` | 25 kasus F0-F9 + 1 kasus skip-guard |
| `tests/integration/studio/_env.ts`, `_helpers.ts` | penjaga DB uji, runner skrip seed/backfill, tanda isi PDF tak peka urutan objek |
| `tests/integration/studio/uji-run.mjs` | pembungkus DB uji (`ensure-db`, `whoami`, `reset`, `suite`, `-- <cmd>`) |
| `tests/integration/studio/v21-legacy-templates.mjs` | salin templat gaya lama v21 (baca-saja) ke `_uji` |
| `tests/integration/studio/tools/*` | diagnostik: `recon.ts` (rekonstruksi; `--allow-v21` baca-saja), `render-twice.ts`, `pdf-streams.mjs`, `pdfsig-check.ts`, `pdf-diff.mjs` |
| `tests/integration/studio/out/` | log skrip per langkah, `evidence.json`, `00_suite_run.log` (terakhir), `00_suite_run_0838.log`, `fresh_registry_*.log`, `diag/`, `pdf/` |

## 3. Inventaris kasus (jalan terakhir 08:45, `00_suite_run.log`)

| Kasus | Masukan | Harapan | Aktual | Status |
|---|---|---|---|---|
| F0 penjaga DB + migrasi | `current_database()`, `_prisma_migrations` | `_uji`, 7 applied | `gsp_agent_hq_v21_uji`; 7/7 applied; templat gsp v1, kanonik v5, manual-000 v2, 0 versi berkerangka | PASS |
| F1 ingest v1 norm/v1 | nota_memo (kanonik v5), terbit_report (gsp v1), manual000 doc.json (manual-000 v2) | norm/v1, 0 baris M14 | 001, 003, 000 norm/v1; sha kanonik = snapshotSha256; 0 baris | PASS |
| F1 revisi lama ke-2 | PATCH blok v1 001 alamat 1.0.1 | rev 2 norm/v1 | rev 2 norm/v1, 0 baris | PASS |
| F1 render baseline | DOCX/HTML/PDF 4 revisi | SUCCEEDED, sha disk = DB | 4/4 SUCCEEDED, disk = DB | PASS |
| F2 seed preset + kerangka | `--presets-and-skeletons`, `--import-manual000-v2` | exit 0, penjaga ok | exit 0; kanonik v6, gsp v2, manual-000 v3; 3/3 guard ok | PASS |
| F2 seed ulang | kedua flag | unchanged | 3/3 template + preset `unchanged` | PASS |
| F2 nilai efektif (cek mandiri) | resolvedParams baru diproyeksikan ke kunci versi lama | sama di luar Δ | kanonik: proyeksi 723 kunci = `38c776de…` = paramsSha256 v5 (persis); gsp: luar Δ {P4S-13} `aa942872…` kedua sisi, 0 beda; algoritma paramsSha256 terkonfirmasi | PASS |
| F3 backfill jalan 1 | skrip tanpa flag | written, 0 gagal | 4 revisi `written`; M14 0->14, M15 0->29, M16 0->116, M17 0->324, M18 0->444; tabel lain 0 berubah; snapshot 0 berubah | PASS |
| F3 aset + jalan 2 | 31 aset M13 lalu skrip | skipped-existing, relink | 4/4 `skipped-existing`, hitungan tetap; relink 000 24/24 | PASS |
| F3 rewrite ditolak | baris basi 001 rev 1 (punya penerus) | `skipped-built-upon`, tidak ditimpa | `skipped-built-upon`, exit 1, baris tetap basi, dipulihkan lalu cocok | PASS |
| F3 rewrite idempoten | baris basi 003 rev 1 | rewritten, pid sama; jalan 2 unchanged | `rewritten`, 18 pid urutan sama, M18 tetap; jalan 2 `unchanged`, hitungan identik | PASS |
| F4 rekonstruksi revisi lama | `verifyReconstruction` + `rebuildSnapshot` | sha = snapshotSha256 | 001#1 `d2f3f2b2…`, 001#2 `9a3a5c3a…`, 003#1 `0803a080…`, 000#1 `0357a154…` cocok | PASS |
| F5 render ulang revisi lama | DOCX/HTML/PDF sesudah preset + backfill | identik | jalan sebelum suntingan FIX-FIG: DOCX/HTML byte-identik 4/4 (3 jalan), PDF tanda isi identik 4/4 (2 jalan); jalan 08:38 dan 08:45: DOCX 001#1 beda (N4) | FAIL (N4) |
| F6 v1 lewat adaptor (R04 agen) | doc_nota_tables -> datum-gsp | 201 norm/v2 + baris | 201, 002 norm/v2, rekonstruksi cocok (recomposed) | PASS |
| F6 000 bertarget | R14 templateVersion v3 -> R04 doc.v2 base 2 -> ulang | 201 rev 3 COMPLETE; ulang unchanged | rev 2 `structure:templateVersion`; rev 3 `document;…` COMPLETE; ulang `unchanged`; 24/24 gambar tertaut; META_CONFLICT tidak terjadi (subject sudah terisi di `_uji`, IP-66 tidak terpicu) | PASS |
| F6 rekonstruksi R14 di atas basis backfill | 000 rev 2 | sha = snapshotSha256 | tidak cocok (N1) | FAIL (N1) |
| F7 E0 R04 v2 | dokumen kosong misi | 201 rev 1 INCOMPLETE | 201, 004 rev 1 INCOMPLETE | PASS |
| F7 bab 3 R12 + ulang | bab 3 (gambar, tabel) | 201 `chapter:3`, Gambar 3.1 di 3.2.3, Tabel 3.1 di 3.3.2; ulang 200 | sesuai; ulang 200 `unchanged` rev 2 | PASS |
| F7 render bab draf / penuh INCOMPLETE | R17 chapter 3; R17 document | 200 draft; 409 | 200 draft SUCCEEDED; 409 `DOCUMENT_INCOMPLETE` | PASS |
| F7 slot + render slot + bab 1, 2 | R13 controlSheet/signature; R17 slot; R12 | 201; draft; COMPLETE | rev 3-6; `F:controlSheet`; slot draft SUCCEEDED; rev 6 COMPLETE | PASS |
| F7 render penuh COMPLETE | `renderRevision` + R17 document | SUCCEEDED | SUCCEEDED, disk = DB; R17 200 `draft:false` | PASS |
| F7 pembaruan, konflik, rebase | bab 3 base 6; bab 3 base 6 lagi; bab 1 base 6 | 201 n+1 hanya 3.x; 409; rebased | rev 7 `chapter:3`, changedAddresses 8 alamat 3.x saja, pid bab lain identik, pid 3.1.2 diwarisi; 409 `SCOPE_CONFLICT`; rev 8 `rebased:true` | PASS |
| F8 rekonstruksi semua revisi | 15 revisi DB uji | 15/15 | 14/15; gagal 000 rev 2 (N1) | FAIL (N1) |
| F8 render ulang revisi v2 lama | 004 rev 6 sesudah rev 7-8 | identik | DOCX/HTML byte-identik, PDF identik (tanda isi) | PASS |
| F9 F-062 | render 000 rev 3 | karakterisasi | job SUCCEEDED, releaseStatus FAIL, 11 cek FAIL (lihat 7) | PASS (karakterisasi) |

Jalan terakhir: `Tests 3 failed | 22 passed | 1 skipped (26)`, Duration ~145 s. Dua jalan sebelumnya (sebelum suntingan FIX-FIG 08:37-08:39 di pohon kerja): `Tests 2 failed | 23 passed | 1 skipped (26)` (keduanya N1). Jalan 08:38 disimpan di `out/00_suite_run_0838.log` (3 gagal, sama dengan jalan terakhir).

## 4. Analisis cakupan dan celah

- SC-5: sha rekonstruksi = snapshotSha256 untuk 14/15 revisi (semua revisi norm/v1 backfill dan semua revisi v2 hasil ingest/kiriman). Celah: revisi hasil `commitV2Revision` (R14/R15/R16) di atas basis backfill (N1).
- SC-6: fixture v1 lolos adaptor; backfill dan `--rewrite-v1-rows` idempoten; render ulang revisi lama identik pada jalan sebelum suntingan FIX-FIG; pada pohon kerja kini DOCX revisi ber-chart beda antara render pertama dan berikutnya dalam satu proses (N4).
- SC-7: kiriman pertama 201, ulang identik 200 `unchanged`, n+1 hanya alamat bab itu, label `Gambar 3.1` di `3.2.3`.
- Tidak dicakup: unggah aset via route R18 (aset disimpan lewat layanan `storeAsset`), konkurensi kiriman serentak, `--dry-run` seed/backfill, render lampiran.
- PDF: sha mentah PDF soffice tidak stabil antar jalan (urutan objek fon tersemat berubah; semua stream identik, `tools/pdf-streams.mjs`); pembanding PDF memakai tanda isi tak peka urutan (`_helpers.ts pdfNormalizedSha256`).

## 5. Cara menjalankan

```
node tests/integration/studio/uji-run.mjs suite --reporter=verbose   # reset _uji + seluruh suite
node tests/integration/studio/uji-run.mjs reset                      # hanya reset DB uji
node tests/integration/studio/uji-run.mjs -- npx tsx tests/integration/studio/tools/recon.ts --diff
npx vitest run tests/integration/studio                              # tanpa pembungkus: skip, tanpa DB
```

## 6. Catatan CI

- Suite butuh PostgreSQL lokal + soffice + Chromium; tidak cocok untuk CI tanpa DB. Tanpa pembungkus otomatis skip.
- `reset` menghapus dan membuat ulang `_uji`; SR-53 memakai keadaan `_uji` sesudah jalan terakhir (5 dokumen, 15 revisi, templat berkerangka).
- Flaky: F5 DOCX 001#1 selama pohon kerja FIX-FIG berubah (N4); PDF mentah selalu berbeda (sudah dinetralkan).

## 7. Temuan dan pemetaan pemilik (aturan tidak dilonggarkan)

| ID | Temuan | Bukti | Pemilik |
|---|---|---|---|
| N1 (Tinggi) | `commitV2Revision` memanggil `composeV2` tanpa `prevRows` (`src/lib/studio/services/revisions/v2/commit.ts:174`), sedangkan `rowsFromSource` mewarisi pid slot `F:` dari baris basis. Pada basis backfill norm/v1, blok `F:cover` di snapshot tersimpan ber-pid `slot-cover`, baris M17 dan hasil recompose ber-pid `b-c13c6a40c6fd8b27`, sehingga `rebuildSnapshot` gagal. Jalur submit memberi `prevRows` (`services/submit/pipeline.ts:618`) dan cocok. | `evidence.json r14OnBackfilled`; `tools/recon.ts --diff` (hanya kunci `blocks` beda). Pembanding v21 baca-saja: 000 rev 2 (`c0709a66` vs `4ca8ee3d`) dan rev 3 (`c6a3d257` vs `3733f35b`) juga tidak cocok, bertentangan dengan catatan D-238 | SR-14 / IP-52 (`services/revisions/v2/**`) |
| N2 (Sedang) | `--presets-and-skeletons` gagal di DB segar: baseline datum-gsp v1 dari registri kini memuat `symbol.sheet.fit`, `table.widthClass`, `table.columnWidthSumMm`, padahal nilai `decided` preset GSP di luar Δ (`prisma/seed-studio.ts:484-485`); penjaga beda di 3 kunci, transaksi rollback, exit 1. Di v21 lolos hanya karena v1 lama (721 kunci) belum memuat kunci itu. | `out/fresh_registry_10_seed_presets.log` | SR-36 / SR-38 (`prisma/seed-studio.ts`) |
| N3 (Rendah, perlu putusan) | Manual 000 v3 dibanding versi DB lama v2 berbeda di 4 kunci di luar `meta.intendedDelta`: `org.entityName`, `render.cover.mode`, `render.spacer.autoMode`, `device.registerBlock.boldFields`. Penjaga seed lolos karena baseline = berkas `template.json`, bukan baris v2. | `evidence.json paramsProjection` | SR-38 / SR-32 (putusan baseline) |
| N4 (Sedang, hipotesis waktu) | PNG chart DOCX berbeda antara render pertama dan berikutnya dalam satu proses: `001#1` sha `f3619587…` lalu `3e3aa088…`, stabil sesudahnya; secara visual sama (PNG 23085 vs 23099 B). Muncul sejak suntingan FIX-FIG (`engine/docx/figures/raster-width.ts` baru, diubah 08:39:52 di tengah jalan 08:38; `engine/chart/core/**`); 3 jalan sebelumnya identik. | `tools/render-twice.ts`, `out/diag/` | FIX-FIG (sedang berjalan); verifikasi ulang SR-46 |
| F-062 | releaseStatus FAIL dokumen 000 = 33 kejadian FAIL pada 11 cek tier TERBIT, IDENTIK pada rev 1 norm/v1 dan rev 3 v2 (bukan regresi refaktor; job SUCCEEDED, berkas lengkap). Mode `report` D-34 mengubah penahan menjadi status rilis. Cek: scan S44 DATUM-03 (4 em dash/27037 kata), DATUM-04 (2 judul tanya 2.4, 11.1), DATUM-09 (7 tabel numeral tanpa satuan), DATUM-17 (4 ± di 16.1.2/17.2.2), G3 (2 sel meluap 13.2.2/13.3.2); bahasa S47 C-27 (14,7 kata/kalimat vs 18-32; kanal tidak di meta), C-34 ("kamu" 13.3.5), C-SG-L2-04 (9 daftar bullet > 3 butir); struktur S46 D05 (2 terbilang 13.2.3), D18 (bab 17 tanpa `closingAction`), D20 (Tabel 5.4 skala Admiralty di luar lampiran). Kandidat positif palsu (teks manual mengutip aturannya sendiri): DATUM-17, C-34, D20, C-27. | `evidence.json f062` | Isi benchmark (verbatim, SR-51); aturan: S44 scan, S46 structure, S47 language; agregasi rilis S51. Putusan "FAIL diharapkan untuk benchmark" atau tinjau positif palsu per aturan oleh controller |

Rujukan temuan lama (bukan baru): IP-66 (tidak terpicu di `_uji`), F-062.

## 8. Rekomendasi

1. N1: teruskan `prevRows` ke `composeV2` di `commitV2Revision` (pola `submit/pipeline.ts:618`), lalu rekomposisi/perbaikan snapshot 000 rev 2-3 di v21 lewat keputusan controller; jalankan ulang suite ini.
2. N2: masukkan `symbol.sheet.fit`/`table.widthClass`/`table.columnWidthSumMm` ke Δ GSP bila baseline memuatnya, atau putuskan baseline penjaga; uji dengan `uji-run.mjs` jalur registri segar.
3. N4: setelah FIX-FIG selesai, jalankan `node tests/integration/studio/uji-run.mjs suite`; F5 harus PASS tanpa melonggarkan pembanding DOCX.
4. F-062: putusan controller per aturan; aturan tidak dilonggarkan oleh baris ini.

## 9. DB produksi tidak tersentuh

Semua koneksi suite dan skrip melapor `database: gsp_agent_hq_v21_uji` (F0 `current_database()`; log seed/backfill `"database":"gsp_agent_hq_v21_uji"`). `gsp_agent_hq_v21` hanya dibaca (salinan templat, `recon.ts --allow-v21`, keduanya `default_transaction_read_only=on`). Tidak ada string koneksi ke `gsp_agent_hq`; `uji-run.mjs` menolak sumber selain v21/v21_uji. `.env` tidak diubah, URL tidak dicetak.

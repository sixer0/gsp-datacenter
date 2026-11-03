---
task_id: IMPL-W5
task_slug: doc_artifact_studio
row: IMPL-W5
date: 2026-11-04
agent: coder-execution
source_plan: brief controller IMPL-W5 (D-557, bukti uji Hermes ronde 6), docs/STUDIO-MCP.md §4-§7
status: complete
---

# Laporan Implementasi: IMPL-W5 - studio_edit tanpa rantai jangkar + perbaikan U-DOC ronde 6

Skill dimuat: `backend-execution`, `tdd` (merah dulu per butir), `verification-before-completion` (semua klaim di bawah
memakai keluaran perintah segar). Basis: branch v2.1, commit b84dfb9. Tanpa commit (controller yang commit).

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| E5 | Alias status butir (studio_edit sel + studio_write) | complete | sel "terblokir"/"Butuh Tinjauan"/"needs-review" -> kode; tak terpetakan tidak menolak |
| E6 | ReportedAt dicap jam server | complete | `YYYY-MM-DDTHH:MM:SS+07:00`; eksplisit menang; tulis ulang identik tetap tanpa revisi |
| E1 | `{ section, append }` laporan + klien | complete | kosakata blok studio_write; laporan `{ref}` dan bagian Rujukan tidak didukung (EDIT_INVALID/INVALID_ARGUMENT) |
| E2 | `{ section, addRow, table? }` laporan + klien | complete | bawaan tabel terakhir; nomor 1..n atau teks keterangan/judul kolom; lebar salah -> EDIT_INVALID + judul kolom |
| E3 | Alamat batch berurutan + cadangan isi tersimpan | complete | sel, jangkar `after`, section append/addRow; `find/replace` sengaja tanpa cadangan |
| E4 | Terapkan sebagian untuk galat alamat | complete | `notApplied` + `hint`, ok:true, `isError` tidak dipakai; semua gagal = ok:false lama |
| E7 | Deskripsi alat | complete | `tools/list` dua alat tulis 8.158 -> 9.053 B (+11,0 %), deskripsi <= 400 karakter |
| D1 | Talang label kategori grafik | complete | metrik glif nyata + ruang tepi 0,4 mm; 16 sha manifest SVG bersih diperbarui (lihat di bawah) |
| D2 | Kaki halaman DOCX klien | complete | nomor tampilan + revisi terakhir lembar kendali; Manual 000 tetap (convert_v2 SAME x3) |
| Dok | docs/STUDIO-MCP.md §4, §5.x, §5.y, §5.w baru, §7 | complete | |
| Smoke | `scripts/studio/mcp/smoke-implw5.ts` DEV 9021 | complete | 13/13 PASS, exit 0 |

## Akar masalah (terukur) dan desain

- **E5 (r6 "terblokir" -> RECORD_ELEMENTS_DROPPED).** `ITEM_STATUS_ALIASES` hanya dipakai `repairItemTable` (studio_write).
  Suntingan sel studio_edit menulis teks status mentah ke tabel MD, konverter registri (`CONTRACT_ITEM_STATUS_ALIASES`,
  hanya 12 alias) tidak menerima baris, lalu pagar update `assertRecordKeepsElements` menolak. Perbaikan: pasca-langkah
  `normalizeItemStatuses` (write-edit.ts) atas baris tabel butir yang berubah/baru: alias -> kode; tak terpetakan ->
  status tersimpan (`ITEM_STATUS_KEPT`, butir tidak hilang); butir baru tak terpetakan tetap di teks (`ITEM_STATUS_UNKNOWN`,
  status wajib di kontrak `ContractItemV2.status`, jadi tidak dapat "dihilangkan"). Tabel alias diperluas (aktif,
  menunggu, butuh tinjauan, butuh review, tinjauan, dalam tinjauan) dan dipakai juga `studio_write`; tulis ulang laporan
  sendiri dengan status tak dikenal untuk butir lama dibangun ulang dengan status tersimpan (tanpa RECORD_ELEMENTS_DROPPED).
- **E6.** `wibStamp(now)` (write-content.ts), konvensi +07:00 yang sudah dipakai `wibDate`. studio_write laporan baru:
  ReportedAt bawaan = cap. studio_edit laporan (teks/meta): bila ada perubahan, agen tidak memberi reportedAt, dan bagian
  record dapat ditulis ulang tanpa kehilangan (exact round-trip), baris ReportedAt ditambal + `plan.fields` (pagar
  `assertEditShape` tetap). Tulis ulang laporan sendiri: record yang hanya beda ReportedAt tidak membuat revisi sendiri.
- **E3 laporan.** Identitas baris dilacak paralel dengan setiap `splice` (indeks baris tersimpan; baris pengganti paragraf
  mewarisi identitas baris pertamanya). Alamat tidak ketemu di keadaan kini -> dicari di salinan tersimpan -> dipetakan
  ke satuan dengan identitas sama (`ADDRESS_FROM_STORED`); blok yang sudah dihapus -> galat asli. **E3 klien:** klon
  tersimpan + peta identitas objek (objek hidup dimutasi di tempat), `JUnit.node`.
- **E4.** `ADDRESS_CODES` = TEXT_NOT_FOUND/TEXT_AMBIGUOUS (sel/baris/section/tabel tidak ketemu memakai kode ini).
  `notAppliedOf` (write-match.ts) membawa `edit`, `code`, `seenState` (`tersimpan` / `sesudah-suntingan-sebelumnya`),
  kandidat dari rincian galat. `withNotApplied` (write-tools.ts) menulis kandidat hanya ke blok `<data-tak-tepercaya>`,
  `neutralizeDeep`, `untrustedFields` + `notApplied`. Semua suntingan gagal alamat -> galat pertama dilempar (perilaku
  lama, juga di fungsi murni `applyEdits`/`applyClientEdits` agar pemanggil langsung tidak berubah).
- **D1 (bukan fon).** Talang `hFrame` (K-01..K-04), galeri P-01, dan `labelGutter` P-04..P-07/P-11 memakai `textWidthMm`
  = panjang x 0,5 em. "Low-Medium" berlebar nyata 5,29 em (Plex Sans Condensed: L 453, w 698, M 730, m 787) > 5,0 em;
  label rata kanan di x0 - 1,6 mm -> tepi kiri -0,27 mm (SVG r6: x 11,8653, lebar nyata 12,13 mm), di bawah toleransi
  lint 0,3 mm, jadi lint lolos tetapi PNG terpotong. "Medium-High" 5,49 em < 5,5 em taksiran -> muat (cocok gejala r6).
  Perbaikan: `measure()` textfit (tabel glif Chromium yang sama dengan raster) + `LABEL_EDGE_MM` 0,4 mm di `gutterPlan`
  (tepi kiri label terlebar sebelumnya tepat 0 mm saat fit aktif).
- **D2.** `registerDefaultCells` (header-footer.ts): `{nomor}` = nilai "Nomor dokumen"/"Document number" blok kendali sampul
  (`displayDocNumber`), `{rev}` = sel pertama baris terakhir riwayat revisi lembar kendali tanpa kata Rev/Revisi/Revision
  (`displayRev`); tanpa keduanya cadangan `meta.docNumber`/`meta.rev` (dokumen lama, Manual 000 mode explicit tidak
  berubah). Kaki halaman HTML TIDAK diubah (di luar brief "client DOCX").

## Changes Made

| File | Change Type | Description |
|---|---|---|
| scripts/studio/mcp/write-edit.ts | modify | `applyEdits` ditulis ulang: append/addRow, identitas baris + cadangan isi tersimpan (E3), notApplied (E4), `normalizeItemStatuses` (E5), `EditPlan.appended` |
| scripts/studio/mcp/write-tools.ts | modify | skema EDITS (append/addRow), deskripsi, `prepareStructEdits` (ajv BLOCK saat jalan), `withNotApplied`, `kindsAfterAppend` + cek teks append di `assertEditShape`, cap ReportedAt, prevItemStatus, tulis ulang laporan E5/E6 |
| scripts/studio/mcp/write-match.ts | modify | `findSection`, `ADDRESS_CODES`, `NotApplied`/`notAppliedOf`, kandidat tanpa escape Markdown |
| scripts/studio/mcp/write-content.ts | modify | alias status tambahan, `ITEM_STATUS_CODES`, `itemStatusOf`, `repairItemTable(prevStatus)`, `wibStamp`, `blockLines`/`expectedParagraphs` diekspor, `prevItemStatus` |
| scripts/studio/mcp/write-client-edit.ts | modify | append/addRow klien, `clientSections`, `pickClientTable`, `twinMap` + `JUnit.node` (E3), notApplied (E4) |
| scripts/studio/mcp/write-client-run.ts | modify | notApplied ke hasil `editClient` |
| scripts/studio/mcp/write-client.ts | modify | `cellOf` diekspor |
| scripts/studio/mcp/write-normalize.ts | modify | bentuk varian append (`blocks`, `heading`/`chapter`) dan addRow (`rows`/`row`/`addRows`) |
| scripts/studio/mcp/smoke-implw5.ts | add | smoke DEV IMPL-W5 |
| src/lib/studio/engine/chart/family-k1/common.ts | modify (luar MCP) | `hFrame` metrik glif nyata |
| src/lib/studio/engine/chart/core/gallery.ts | modify (luar MCP) | talang P-01 galeri metrik nyata |
| src/lib/studio/engine/chart/family-p1/common.ts | modify (luar MCP) | `labelGutter` metrik nyata |
| src/lib/studio/engine/chart/core/labelfit.ts | modify (luar MCP) | `LABEL_EDGE_MM` 0,4 mm di `gutterPlan` |
| src/lib/studio/engine/docx/package/header-footer.ts | modify (luar MCP) | `displayDocNumber`, `displayRev` untuk blok register kaki halaman |
| tests/unit/studio/figures/__fixtures__/clean-svg-manifest.json | modify | 16 sha render bersih (lihat bawah); `fitted` tidak berubah |
| tests/unit/studio/mcp/implw5-edit.test.ts | add | 19 uji |
| tests/unit/studio/renderers/implw5-chart-gutter.test.ts | add | 4 uji |
| tests/unit/studio/renderers/implw5-footer-display.test.ts | add | 2 uji |
| tests/unit/studio/mcp/implw-write.test.ts | modify | 1 asersi: studio_edit kini juga mengirim `record` (E6); asersi `revisionNo: 7` dibuang |
| tests/unit/studio/mcp/implw2-security.test.ts | modify | 2 asersi `edited` + `record` (E6); asersi keamanan (butir tetap, tanpa initiator) tidak diubah |
| tests/unit/studio/mcp/implw3-cycle1.test.ts | modify | N1/N2: "tanpa POST record" diganti "ReportedAt dicap" (butir/bukti tetap tetap diasersi) |
| tests/unit/studio/mcp/implw3-lenient.test.ts | modify | server tiruan: konflik META hanya bila record membawa judul BARU (cap ReportedAt mengirim judul lama yang sah) |
| docs/STUDIO-MCP.md | modify | §4 baris studio_edit, §5.x keterbatasan kaki halaman, §5.y penunjuk, §5.w baru, §7 uji |

Tidak diubah: DB/skema Prisma, port 9011, `~/gsp-datacenter`, `decisions.md`, `file_claims.md`, engine HTML, konfigurasi
server. Server DEV tidak dinyalakan ulang (next dev memuat ulang `src/`; smoke membuktikan D1/D2 aktif). Berkas debug
sementara milik sesi ini (`zz-dbg-w5.test.ts` x2) dibuat dan dihapus dalam sesi. Tidak ada berkas lama yang dihapus/diganti nama.

### Manifest SVG bersih (D1): 16 sha berubah, sah

`chart/k01.json@datum`, `k01@gallery`, `k02@datum`, `k02@gallery`, `k03@datum`, `k03@gallery`, `k04@datum`, `k04@gallery`
(talang `hFrame` K-01..K-04), `p01@gallery` (talang galeri), `p04@datum`, `p04@gallery`, `p05@gallery`, `p06@datum`,
`p06@gallery`, `p07@gallery`, `p11@gallery` (`labelGutter` P1). Sebab: lebar talang kini = label terlebar menurut metrik
glif nyata (bisa lebih sempit atau lebih lebar dari taksiran 0,5 em). Semua 16 tetap lint-bersih (uji manifest
memeriksa "masih bersih"); 0 entri `fitted` berubah. Manifest lama: `%TEMP%/claude/w5/clean-svg-manifest.before.json`.

## Test Results (segar, kode akhir)

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | 0 galat |
| Lint | `npx eslint <21 berkas tersentuh/baru>` | exit 0 | 0 masalah (1 impor tak terpakai diperbaiki sebelumnya) |
| MCP | `npx vitest run tests/unit/studio/mcp` | `Test Files 25 passed (25)`, `Tests 315 passed (315)` | termasuk implw5-edit 19/19 |
| Renderers + figures | `npx vitest run tests/unit/studio/renderers tests/unit/studio/figures` | `Test Files 56 passed (56)`, `Tests 873 passed / 1 skipped (874)` | clean-svg-manifest hijau sesudah pembaruan 16 sha |
| Unit studio penuh | `npx vitest run tests/unit/studio` | `Test Files 220 passed (220)`, `Tests 4145 passed / 1 skipped (4146)`, exit 0 | 242 s |
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | `SAME` doc.v2.json, template.v2.json, datum-manual-000.preset.json; exit 0 | |
| Merah di HEAD b84dfb9 | salinan `git archive HEAD` (`%TEMP%/claude/w5/head`, junction node_modules) + 3 berkas uji baru | `Tests 21 failed / 3 passed (24)` | lulus di HEAD: K-01 label 24 karakter (dielipsis), "semua gagal = ok:false" (perilaku lama), kontrol kaki halaman lama. Keluaran `%TEMP%/claude/w5/red_head.txt`; PNG r6 di HEAD: kolom x=0 berisi 19 piksel tinta |
| Smoke DEV | `smoke-implw5.ts` | 13/13 PASS, exit 0 | lihat bawah |

Catatan TDD jujur: E5/E6 dan D1/D2 dijalankan merah lebih dulu di sesi ini sebelum kode ditulis; uji E1-E4 ditulis
sesudah kerangka kode append/addRow/E3/E4 dibuat, lalu merahnya dibuktikan terhadap salinan HEAD murni (tabel di atas).

## Smoke DEV (127.0.0.1:9021, mission `2026-11-04_smoke-implw5`, stamp 20261103202342): 13/13 PASS, exit 0

Perintah: `INTERNAL_API_SECRET=<dari berkas, tidak dicetak> STUDIO_MCP_FILE_ROOTS=%TEMP%\claude\w5\smoke npx tsx scripts/studio/mcp/smoke-implw5.ts`.
Keluaran `%TEMP%/claude/w5/smoke2.json`, log `%TEMP%/claude/w5/smoke/smoke-implw5-20261103202342.log`, DOCX
`%TEMP%/claude/w5/smoke/050-GSP-KT-XI-2026_rev11_20261103T202353Z_c2f9ca4d.docx`, PNG grafik
`%TEMP%/claude/w5/smoke/implw5-fig-820e4872af084b52c0c01cc4b8dbf5d2.png` (diperiksa visual: K-01 bertumpuk, "Low-Medium" utuh).
Jalan pertama (stamp 20261103202243) 12/13: K6 gagal karena masukan smoke salah (`type: "bar"` menimpa `stacked`, jadi
P-01) dan filter PNG ikut menghitung gambar templat; masukan dan filter (PNG bersebelahan dengan keterangan "Gambar")
diperbaiki, kode produk tidak diubah.

| # | Langkah | Hasil | Catatan |
|---|---|---|---|
| R1 | studio_write laporan tanpa reportedAt | PASS | reportedAt 2026-11-04T03:23:43+07:00 |
| R2 | append paragraf + daftar + tabel ke Bukti | PASS | bab 3: paragraph,paragraph,list,table,paragraph |
| R3 | addRow tabel butir, kunci kosong, "terblokir" | PASS | K-3134f1b2 = blocked, masuk record |
| R4 | batch 6 suntingan berantai (jangkar hasil suntingan, jangkar lama, kunci baris diubah) | PASS | 1 panggilan, ADDRESS_FROM_STORED x2, W5-1 = done |
| R5 | terapkan sebagian | PASS | notApplied [[2,TEXT_NOT_FOUND],[3,TEXT_NOT_FOUND]], isError false, bab 5 tersimpan |
| R6 | "butuh tinjauan" -> review; "setengah jadi" -> butir tetap | PASS | ITEM_STATUS_KEPT |
| R7 | reportedAt dicap ulang | PASS | 03:23:43 -> 03:23:48 +07:00 |
| K1 | dokumen klien, grafik bertumpuk r6 | PASS | figur 0 isu tata letak |
| K2 | meta Rev 1 + addRow (`table` = teks keterangan) + append | PASS | edited slot cover, slot controlSheet, bab 1, bab 2 |
| K3 | unduh DOCX (sha cocok) | PASS | |
| K4 | kaki halaman | PASS | "GSP · GSP-UD1-NL-001 / REV 1 · 04-XI-2026 / LEMBAR 1 DARI 1 / Terbatas" |
| K5 | DOCX memuat baris addRow + paragraf append | PASS | |
| K6 | PNG grafik kolom x=0..2 | PASS | 0/0/0 piksel tinta |

## Verification

- E1/E2: uji `append: paragraf + daftar + tabel ...`, `append string tunggal ...`, `addRow ke tabel butir ...`, `addRow lebar
  salah -> EDIT_INVALID ...`, klien `addRow ke tabel terakhir + append ...`; smoke R2, R3, K2, K5.
- E3: uji `sel dengan kunci baris yang diubah ...` (laporan + klien), `jangkar after pada paragraf yang diganti ...`; smoke R4.
- E4: uji `sebagian gagal alamat ...` (basis semua kiriman = 6, satu tulisan), `semua gagal alamat -> ok:false ...`, klien
  notApplied, `append tabel angka tanpa sumber -> galat isi ... 0 tulis`; smoke R5.
- E5: uji 3 kasus + tulis ulang; smoke R3, R6. E6: uji 3 kasus; smoke R1, R7.
- E7: `implw-write` "deskripsi <= 400" hijau; ukuran `%TEMP%/claude/w5/desc-size.ts`: studio_write 4.216 -> 4.250 B,
  studio_edit 3.942 -> 4.803 B, total 8.158 -> 9.053 B (+11,0 %); teks deskripsi (alat + skema) 1.831 -> 1.923 B (+5,0 %).
- D1: uji gutter 4/4 (termasuk PNG 300 dpi Chromium); smoke K6. D2: uji 2/2; smoke K4; convert_v2 SAME x3.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Kaki halaman HTML masih `meta.docNumber`/`meta.rev` | 0 | brief membatasi ke DOCX klien | dicatat | Tidak |
| Butir BARU dengan status tak terpetakan tidak masuk record | 0 | `ContractItemV2.status` wajib; enum tidak boleh dikarang | baris tetap di teks + `ITEM_STATUS_UNKNOWN` | Tidak |
| Cap ReportedAt dilewati diam-diam bila bagian record tidak round-trip persis | 0 | menghindari `EDIT_UNSAFE` pada suntingan yang tidak menyentuh record | dicatat | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| E3 | Cadangan untuk `find/replace`? | Tidak: teks yang sudah diubah suntingan sebelumnya tidak ditimpa dari versi tersimpan; cadangan hanya untuk alamat (sel, `after`, section). Dicatat di deskripsi dan §5.w |
| E4 | POSITION_MISMATCH / figur tidak ketemu | `POSITION_MISMATCH` tetap menolak batch (penjaga `expect`, bukan alamat). `{figure}` tidak ketemu = TEXT_NOT_FOUND -> ikut terapkan sebagian; tanpa cadangan isi tersimpan |
| E4 | Semua suntingan gagal + `meta` ada | Tetap ok:false 0 tulis (perilaku lama "semua gagal") |
| E6 | Cap membuat studio_edit laporan juga mengirim record | Diterima sesuai brief ("for that revision"); 4 asersi uji lama disesuaikan (lihat Changes) |
| E7 | Skema blok penuh di append akan menambah ~2 KB per giliran | Skema longgar di `tools/list`, validasi ajv `BLOCK` saat dijalankan (sebelum jaringan, `INVALID_ARGUMENT` + pointer) |
| D1 | Brief menduga metrik fon/padding | Terukur: taksiran rerata em (bukan fon) + talang fit tanpa ruang tepi; 16 sha manifest diperbarui |
| D2 | Bentuk label revisi | Dari riwayat revisi lembar kendali (model revisi dokumen), kata "Rev" dibuang karena pola sel mencetak "REV": "Rev 1" -> "REV 1" |

## Untuk peninjau keamanan (review recommended)

Cakupan: (1) jalur isi `append` laporan: `blockLines` -> `guardLine`/`tableLines`, baris append ditandai tepercaya
(dilewati `reguard`, sudah dijaga saat disusun), `assertEditShape` kini mengizinkan jenis blok append di akhir section
sasaran + cek teks paragraf append, dan tabel append mengizinkan perubahan butir record (`plan.itemCells`); (2) `addRow`:
sel lewat `cellText` (escape `|`, baris baru), baris berisi hanya `---` dapat terbaca sebagai pemisah tabel (hanya
menghilangkan baris itu, bukan injeksi struktur; tidak diuji khusus); (3) terapkan sebagian: kandidat `notApplied` dari
isi dokumen hanya di blok tak tepercaya + `neutralizeDeep` + `untrustedFields`; (4) pemetaan cadangan E3 (identitas baris
/ objek) agar tidak menunjuk blok yang dihapus; (5) validasi append saat jalan (skema `tools/list` longgar);
(6) D2: teks blok kendali sampul + riwayat revisi kini dicetak di kaki halaman (nilai yang sama sudah dicetak di sampul,
lewat jalur escape run yang sama).

## Next Steps

- Review keamanan + review kode (cakupan di atas; perubahan mesin D1/D2).
- Keputusan USER/controller: kaki halaman HTML ikut nomor tampilan/revisi dokumen; nasib butir baru berstatus tak dikenal.
- Uji Hermes ronde 7 dapat memakai append/addRow dan notApplied (brief r7 milik controller).

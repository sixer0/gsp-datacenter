---
agent: document-reviewer
date: 2026-10-23
mode: 1
cycle: 1
cycle_cap: 3
deliverable: DOC-2 (D-283) - docs/STUDIO-AGENT-GUIDE.md; docs/API-REFERENCE.md §12; masterplan/03_structural_sections_specs.md; docs/STUDIO-ROLLBACK-RUNBOOK.md; prisma/rollback/01_rollback_studio_structure_delta.sql; prisma/rollback/02_rollback_studio_base.sql
verdict: NEEDS_REVISION
caller_verdict: CAUTION
status: complete
---

# Review dokumen DOC-2 (siklus 1)

## 1. Lingkup

| Berkas | Jenis | Ukuran |
|---|---|---|
| `docs/STUDIO-AGENT-GUIDE.md` | Panduan untuk agen AI | 1303 baris |
| `docs/API-REFERENCE.md` §12 (:228-357) | Referensi API | 357 baris |
| `docs/2026-10-22_doc_artifact_studio/masterplan/03_structural_sections_specs.md` | Register teknis | 1235 baris |
| `docs/STUDIO-ROLLBACK-RUNBOOK.md` (baru) | Runbook operasional | 217 baris |
| `prisma/rollback/01_rollback_studio_structure_delta.sql` (baru) | SQL | 23 baris, 1.452 B |
| `prisma/rollback/02_rollback_studio_base.sql` (baru) | SQL | 24 baris, 1.044 B |

- Mode 1. Tier internal; runbook diperlakukan sebagai prosedur operasional destruktif (standar keselamatan lebih ketat).
- Skill: `document-quality-standards` (Modul C, D, E, F, G, H).
- Bukti eksekusi: `npx tsx C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc2/verify_doc2.ts` dijalankan ulang dari root repo: exit 0, `81 PASS, 0 FAIL`, `SEMUA LULUS` (12 contoh lolos, 2 contoh DITOLAK sesuai checkId: L175 `DISPLAY_FIELD`, L845 `RENDER_FIELD`). Kesamaan SQL saya periksa sendiri dengan `python -I`: berkas 01 sama dengan blueprint `05:188-210` (`True 1452 1452`), berkas 02 sama dengan blok SQL `01_specs` §1.4 (`True 1044 1044`); `sha256sum` cocok dengan runbook :21-22 dan register :256.
- Konteks yang memengaruhi penilaian: D-285 (gladi runbook pg_dump/pg_restore LULUS) sudah mencatat 8 kekurangan runbook RB-1..RB-8 (`test/08_rollback_rehearsal.md` §9.1) yang dijadwalkan diterapkan SETELAH review ini. Temuan ini tidak saya ulang sebagai temuan baru. FIX-A2 dan FIX-S2 (siklus 3) sedang mengubah kode di area yang didokumentasikan (lihat F-2).

## 2. Verdict per dimensi

| # | Dimensi | Verdict | Ringkasan |
|---|---|---|---|
| 1 | Akurasi klaim (30 klaim disampel) | CAUTION | 25 cocok; 5 tidak tepat, semuanya Minor (F-1, F-2, F-3, F-5, F-6) |
| 2 | D-139 | PASS | Agen tidak pernah diminta mengatur tampilan; kunci templat hanya di §15 untuk pemilik templat |
| 3 | Runbook rollback | FAIL | SQL, urutan, cadangan wajib, dan perintah pemulihan benar; tetapi tidak ada larangan menyentuh produksi `gsp_agent_hq` (R-1, Major) dan pengecekan DB tujuan tidak terikat ke koneksi yang dipakai perintah destruktif (R-2, Major) |
| 4 | Konsistensi antar dokumen | CAUTION | DF 71 = 52 + 19, RENDER_FIELD, target R04, kuota aset, dan `mergedPointer` selaras; 3 ketidakselarasan Minor (F-3, F-4, F-7) |
| 5 | Tanpa emoji | PASS | Pindai `python -I` keenam berkas: 0 hit |

## 3. Dimensi 1: sampel klaim terhadap kode

| # | Klaim (lokasi) | Bukti kode / hasil | Status |
|---|---|---|---|
| 1 | `render` di badan kiriman = 400 `SCHEMA_INVALID` `RENDER_FIELD`, pointer `/render`, pesan menunjuk R17 (panduan :19-22, :786, :845-875; API :235-238; register :120) | `forbidden.ts:183-193`, `:504-505`; rerun `PASS invalid L845 ... RENDER_FIELD` dengan pesan identik | Pass |
| 2 | Hal sama untuk PATCH pid, alamat, struktur (panduan :786, :877-879; API :236) | `revisions/v2/body.ts:149`; `blocks/[address]/route.ts:136`; `structure/_lib/patch-body.ts:139` | Pass |
| 3 | SID01-SID03 tanpa properti `render` (register :368-370) | komentar dan skema `doc.schema.ts:47`, `chapter.schema.ts:29`, `slot.schema.ts:30`; rerun 8 contoh isi 0 isu | Pass |
| 4 | v1 tanpa build: `job: null`, `outputs: []` (panduan :1179-1181; register :1007) | `documents/route.ts:384-385` | Pass |
| 5 | R04 ke dokumen yang ada: hanya `target.documentId` (+ `baseRevisionNo`); `docNumber`/`mission`/`docKey` atau target + `mission.folder` = `DOC_TARGET_AMBIGUOUS` (panduan :129-136; register :368, :875) | `services/submit/target.ts:86-121` | Pass |
| 6 | Target dipisah route sebelum skema SID01, bukan medan skema (register :368) | `services/submit/targeting.ts:28-36` | Pass |
| 7 | R08 dry-run baca-saja, medan `submitPreview` (panduan :553-571; register :881) | `validate/route.ts:35-41` (header FIX-V), `:107-119` (`SubmitPreview`) | Pass |
| 8 | R08 "selalu 200 kecuali 403, 413, 400 JSON_MALFORMED" (panduan :560) | `validate/route.ts:103` `HARD_CODES` = UNAUTHORIZED, FORBIDDEN, PAYLOAD_TOO_LARGE, JSON_MALFORMED; route juga memakai `checkRenderRate` untuk `?preview=html` (`:434`), dan API R08 mencantumkan 415/429 | Kurang lengkap (F-6) |
| 9 | `mergedPointer` opsional di `ValidationIssue` (API :251-252) | `contract/types/api.ts:37-38` | Pass |
| 10 | Pointer isu kiriman bab `/chapter/...`, slot `/payload...` (API :252; register :799) | `services/submit/pipeline.ts:228-243`, `:251` | Pass |
| 11 | Sama, versi panduan: "slot `/payload/...`" (panduan :1138) | Slot halaman depan dipetakan tepat ke `/payload` (`pipeline.ts:241-242`, `node: undefined`, jadi tanpa sufiks); hanya slot bab berbentuk `/payload/chapters/<j>/...` | Kurang tepat (F-3) |
| 12 | `keyword: "byConstruction"` di contoh register (:849) | `services/ingest/by-construction.ts:163` | Pass |
| 13 | DATUM-04 = judul berakhiran `?` (panduan :1138; register :799) | `engine/lint/scan/checks.ts:157-160` | Pass |
| 14 | DF-70 `ChartPanelV2.widthClass`, DF-71 `ChartLimit.max`, reason (register :546-547; panduan :245-249; API :271-274) | `forbidden.ts:125-126`; rerun DF-63..DF-71 PASS | Pass |
| 15 | Total 71 = 52 global + 19 per lokasi (register :35, :84, :549, :1126, :1226) | `forbidden.ts` DF-01..DF-52 + DF-53..DF-71; rerun hitungan 71 PASS | Pass |
| 16 | VF-09 pengganti = endpoint render (register :565) | `forbidden.ts:163` | Pass |
| 17 | `change` v2 maks 2.000 (kiriman, PATCH pid) (panduan :898, :1170) | `common.schema.ts:41`, `:354`; `revisions/v2/body.ts:37` | Pass |
| 18 | `change` PATCH struktur maks 2.000 (panduan :1170) | `structure/route.ts:126`, `:131` memakai `CHANGE_FIELD_MAX` = 4000 (`revisions/index.ts:73`) | Tidak tepat (F-1) |
| 19 | `change` PATCH alamat v1 4.000 (panduan :1170) | `blocks/[address]/route.ts:100-101` | Pass |
| 20 | Kuota aset 512 MiB sesi / 2 GiB internal / disk 2 GiB, `reason` (panduan :1047-1048; API :286-291) | `services/images/asset-store.ts:24-40`, `:76-79`, `:184`, `:204` | Pass |
| 21 | Laju 30/60 menghitung kiriman, PATCH, render, render ulang, artefak, validate `?preview=html` (API :281-283) | `checkRenderRate` dipanggil di `documents/route.ts:288,338`, `submit-kit.ts:173`, `blocks/[address]/route.ts:150`, `paragraphs/[pid]/route.ts:113`, `structure/route.ts:146`, `revisions/route.ts:115`, `artifacts/route.ts:100`, `validate/route.ts:434` | Pass (API); panduan lihat F-4 |
| 22 | 503 `RENDER_QUEUE_FULL` "hanya R17/R07" (API :285) | `artifacts/route.ts:102` `assertRenderCapacity()` (R09 juga memakai antrean; baris R09 API :325 sendiri mencantumkan 503) | Tidak tepat (F-5) |
| 23 | `image.rasterDpi` bilangan bulat 72..600 bawaan 150 (panduan :1257) | `params/render.ts:313` sekarang `range: { min: 150, max: 600 }` (FIX-A2, D-281 N2; berkas diubah 10:12 sesudah panduan 10:07) | Basi (F-2) |
| 24 | `chart.kind.<KODE>.axis` ParamDef templat, termasuk P-13/P-14/S-01 (panduan :1258; API :274-275) | `registry/charts.ts:470-480`; D-268 | Pass (S-02..S-04 menyusul FIX-A2, F-2) |
| 25 | `lastFilledBy`/`by` dari identitas pemanggil (panduan :138-140; API :261) | `revisions/v2/commit.ts:211` `fillerOf(caller)`; `contract/auth.ts:132` | Pass |
| 26 | `SubmitResultV2` tanpa job/outputs/renderRefused, sisa usang di tipe (API :301-302; register :899) | `contract/types/v2/api.ts:48-51` masih mendeklarasikan ketiganya; dokumen menyatakannya | Pass |
| 27 | R06 kode saat ini 200 `{ revision, addressMap, job: null, outputs: [] }` (register :878) | `blocks/[address]/route.ts:6` | Pass |
| 28 | SQL 01 = blueprint `05:188-210`, SQL 02 = `01_specs` §1.4, sha (runbook :21-24; register :256) | perbandingan `python -I` dan `sha256sum` di atas | Pass |
| 29 | 18 model Studio = 9 asli + 9 delta (runbook :107) | `grep -c "^model Studio" prisma/schema.prisma` = 18 | Pass |
| 30 | Delta: 9 tabel, 14 kolom, 2 indeks, 3 tipe; asli: 9 tabel, 11 tipe (runbook :21-22) | `migration.sql` delta: CREATE TABLE 9, ADD COLUMN 14, CREATE TYPE 3, indeks yang tidak ikut terhapus bersama tabel/kolom = 2 (`:267`, `:270`); asli: CREATE TABLE 9, CREATE TYPE 11, INSERT 0 | Pass |

## 4. Dimensi 2: D-139

| Cek | Status | Bukti |
|---|---|---|
| Agen tidak memilih tampilan | Pass | Panduan :10-14; :245-256 (lebar dan domain sumbu = templat, "laporkan ke pemilik templat; jangan menambah medan"); :1051-1052 "Agen tidak mengirim `widthMm`, `widthClass`, atau `dpi`" |
| Keputusan build bukan keputusan tampilan | Pass | Panduan :19-22 (kapan build = keputusan agen, D-247); tidak ada medan tampilan baru |
| Kunci templat ditandai untuk pemilik templat | Pass | `image.rasterDpi`, `chart.kind.<KODE>.axis`, dan `draftTemplate` hanya ada di §15 (:1199-1277), yang dibuka dengan "untuk manusia pemilik templat, bukan agen" |

## 5. Dimensi 3: runbook rollback

| Cek | Status | Bukti |
|---|---|---|
| SQL sama dengan sumber tergladi | Pass | Klaim 28 |
| Urutan tingkat 1 lalu tingkat 2 beserta alasannya | Pass | Runbook :32-33; delta tidak menambah FK di tabel asli (grep `ADD CONSTRAINT` pada 9 tabel asli di migrasi delta: 0 hit), jadi FK hanya dari tabel delta ke tabel asli; gladi D-260 dan D-285 |
| Cadangan wajib sebelum tingkat 2 | Pass | Runbook :10-12, :83, :155 |
| Perintah pemulihan | Pass dengan catatan | `migrate deploy` lalu `pg_restore` (:178-200), terbukti di D-285; kekurangan RB-1..RB-8 (mis. `--dbname=...` tanpa nilai, `--disable-triggers` praktis wajib) sudah tercatat dan menunggu revisi |
| Peringatan produksi `gsp_agent_hq` tidak boleh disentuh | Fail (R-1) | Runbook tidak menyebut `gsp_agent_hq` sama sekali kecuali `gsp_agent_hq_v21_uji` (:4); :43 malah membolehkan "rollback di produksi" asal didahului gladi ulang. D-02: "Production `gsp_agent_hq` tidak disentuh" |
| Pengecekan DB tujuan mengikat koneksi destruktif | Fail (R-2) | :49-55 memeriksa `current_database()` lewat `psql` tanpa URL konkret; `npx prisma db execute --schema prisma/schema.prisma` (:127, :158) dan `migrate status/deploy` membaca `DATABASE_URL` dari lingkungan proses atau dari `.env` repo. `.env` repo menunjuk `.../gsp_agent_hq_v21` (DB dev, bukan `_uji`). Gladi memakai pembungkus `tests/integration/studio/uji-run.mjs` yang menolak berjalan bila `current_database() <> 'gsp_agent_hq_v21_uji'` (`test/08_rollback_rehearsal.md:8`, `:74-76`); pengaman itu tidak ada di runbook |

## 6. Dimensi 4: konsistensi

| Butir | Panduan | API §12 | Register | Status |
|---|---|---|---|---|
| Build hanya R17 + `RENDER_FIELD` | :19-22, :786 | :235-238 | :120, :792, :801 | Pass |
| Target R04 | :129-136 | baris R04 | :368, :875 | Pass |
| DF total 71 | (tidak menghitung; DF-70/71 di :245-249) | DF-63..DF-71 :274 | :35, :549, :1226 | Pass |
| Pointer badan + `mergedPointer` | :1138 `/payload/...` | :251-252 `/payload...` | :799 `/payload...` | Fail kecil (F-3) |
| Kuota/laju 429 | :1144 "permintaan render atau unggah", :1165 "Render per pemanggil" | :281-283 kiriman dan PATCH ikut dihitung | - | Fail kecil (F-4) |
| `STORAGE_WRITE_FAILED` | :1048 "laporkan ke operator" vs :1145 "isi sudah tersimpan: render ulang" | - | - | Fail kecil (F-7) |

Tujuh sumbu (Mode 1): terminologi Pass (`RENDER_FIELD`, `mergedPointer`, `fullRenderAllowed` dikutip literal); format angka Pass (pemisah ribuan titik: "2.000", "4.000"); gaya Pass; hierarki judul Pass (§5.5, §8.2 baru bersarang benar; runbook 0-8 berurutan); kapitalisasi Pass; satuan Pass (MiB/GiB konsisten); format rujukan Pass (D-xxx, `file:baris`).

## 7. Temuan

| ID | Tingkat | Lokasi | Deskripsi | Bukti | Rute |
|---|---|---|---|---|---|
| R-1 | Major | Runbook :35-44 (seksi Larangan), :3-7 | Tidak ada larangan eksplisit menjalankan runbook terhadap produksi `gsp_agent_hq` (D-02). Butir :43 justru membuka jalan rollback produksi dengan syarat gladi ulang. Usulan: tambahkan larangan tegas di §1 dan peringatan pembuka: "Basis data produksi `gsp_agent_hq` TIDAK BOLEH disentuh (D-02); runbook ini hanya untuk `gsp_agent_hq_v21*`", lalu ubah :43 agar produksi menjadi keputusan pengguna tersendiri, di luar runbook | Grep runbook: `gsp_agent_hq` hanya muncul di :4 sebagai `gsp_agent_hq_v21_uji`; `decisions.md` D-02 | `document-specialist` (keputusan isi larangan tetap milik controller/pengguna) |
| R-2 | Major | Runbook :49-55, :127, :158, :66, :181 | Pengecekan `current_database()` tidak terikat ke URL yang dipakai `prisma db execute`/`migrate`/`pg_dump`. Tanpa `DATABASE_URL` eksplisit di proses, Prisma memakai `.env` repo (`gsp_agent_hq_v21`). Usulan: wajibkan `export DATABASE_URL=<target>` sekali, pakai `psql "$DATABASE_URL" -At -c "SELECT current_database();"` dengan nama harapan yang ditulis, dan hentikan bila tidak cocok sebelum SETIAP perintah destruktif (atau pakai pembungkus seperti `uji-run.mjs`). Sebagian bertumpang dengan RB-3, tetapi RB-3 tidak menyebut risiko `.env` | `.env` (nama DB saja, kredensial tidak dibaca): `.../gsp_agent_hq_v21`; `test/08_rollback_rehearsal.md:8`, `:74-76` | `document-specialist` (gabung dengan revisi RB-1..RB-8) |
| F-1 | Minor | Panduan :1170 | Batas `change` PATCH struktur ditulis 2.000; kode menerima 4.000 | `structure/route.ts:126`, `:131`; `revisions/index.ts:73` | `document-specialist` (atau samakan kode, keputusan controller) |
| F-2 | Minor | Panduan :1257-1258 | Rentang `image.rasterDpi` 72..600 sudah basi: kode kini 150..600 (FIX-A2, D-281 N2). Daftar contoh `chart.kind.<KODE>.axis` belum memuat S-02..S-04 yang sedang ditambah FIX-A2. Selaraskan sesudah FIX-A2 diterima | `params/render.ts:313`; waktu berkas render.ts 10:12 sesudah panduan 10:07 | `document-specialist` sesudah FIX-A2 |
| F-3 | Minor | Panduan :1138 | "slot `/payload/...`" tidak tepat untuk slot halaman depan, yang pointernya tepat `/payload`; API dan register menulis `/payload...` | `pipeline.ts:241-242`, `:251` | `document-specialist` |
| F-4 | Minor | Panduan :1144, :1165 | Panduan menyebut laju 30/60 sebagai "render per pemanggil" dan 429 karena "permintaan render atau unggah". Sejak D-247 kiriman dan PATCH ikut dihitung tanpa merender (API :281-283 sudah benar). Agen yang mengirim banyak bab bisa terkena 429 tanpa penjelasan di panduan | Klaim 21 | `document-specialist` |
| F-5 | Minor | API :285 | 503 `RENDER_QUEUE_FULL` "hanya R17/R07", padahal R09 (artefak) juga memakai antrean, dan baris R09 di tabel yang sama mencantumkan 503 | `artifacts/route.ts:102` | `document-specialist` |
| F-6 | Minor | Panduan :560 | Daftar pengecualian "selalu 200" R08 tidak memuat 401, 415, dan 429 (`?preview=html`) | `validate/route.ts:103`, `:434`; baris R08 API | `document-specialist` |
| F-7 | Minor | Panduan :1145 vs :1048 | Baris 500 di §12 menyuruh "isi sudah tersimpan: render ulang" untuk `STORAGE_WRITE_FAILED`, padahal pada unggah atau kiriman aset dengan ruang disk kurang, aset tidak tersimpan (§10 :1048 menyuruh lapor operator). Pisahkan tindakannya per sebab | `asset-store.ts:36-39`, `:204` | `document-specialist` |

Informasi untuk controller, di luar dokumen yang direview (kode, bukan temuan DOC-2): komentar `common.schema.ts:11` dan `types/v2/doc.ts:6` masih "DF-01..DF-69"; komentar `chapters/route.ts:14` dan `paragraphs/[pid]/route.ts:20` masih menyebut 503 antrean; tipe `SubmitResultV2` masih membawa medan usang. Semuanya cocok untuk FIX-Z.

Jumlah: 0 Critical, 2 Major (R-1, R-2), 7 Minor.

## 8. Verdict dan tindakan berikutnya

- Verdict: **NEEDS_REVISION** (CAUTION menurut skala pemanggil). Panduan, API §12, dan register layak, hanya dengan catatan Minor. Yang menahan adalah runbook: R-1 dan R-2.
- Rute: `document-specialist` menerapkan R-1, R-2, dan RB-1..RB-8 (D-285) dalam satu revisi runbook; F-1 dan F-3..F-7 boleh ikut dalam revisi yang sama; F-2 sesudah FIX-A2 diterima. Teks larangan produksi di R-1 sebaiknya disetujui controller.
- Siklus berikutnya: 2 dari 3, cukup memeriksa runbook (R-1, R-2, RB-1..RB-8) dan baris yang disentuh untuk F-1..F-7.

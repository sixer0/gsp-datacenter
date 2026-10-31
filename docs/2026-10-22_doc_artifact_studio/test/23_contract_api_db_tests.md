# DC-36 Uji API + DB Fase Document Contract

Tanggal: 2026-10-31. Pelaksana: test-expert. Baris blueprint DC-36 (`identification/07_document_contract_blueprint.md:323`), register `masterplan/05_document_contract_specs.md` §5.6, §7.1-§7.6, §8, §9, §10, §13; keputusan D-399 (isu #9), D-402, D-407. Skill: `tdd`. Kode produksi tidak diubah.

**Ringkasan.** 7 berkas uji baru, 105 kasus, semuanya hijau pada dua run berturut dengan hasil identik. Suite studio penuh: 153 berkas, 3370 lulus, 1 dilewati. `tsc` exit 0, eslint pada berkas baru 0 masalah. Kasus #9 (D-399) tidak terreproduksi: R14 menolak perpindahan dengan 422 sebelum ada tulis, jadi MX09 tidak pernah basi. Karena itu tidak ada `it.fails` dan tidak ada temuan produk baru. Setiap uji DB berjalan dalam satu transaksi ROLLBACK di `gsp_agent_hq_v21` dan menyisakan 0 baris.

## 1. Strategi uji

- Seam yang diuji: handler route publik yang dipanggil langsung (pola S74/SR-45) bersama layanan dan DB **nyata**. Tidak ada mock layanan. Satu-satunya pengganti adalah `@/lib/prisma`, yang dialihkan ke proksi transaksi (lihat butir berikut).
- Harness ROLLBACK (`tests/unit/studio/api-contract/_rb.ts`):
  - Satu transaksi interaktif Prisma dibuka di `beforeAll` lalu ditahan terbuka. Setelah `current_database()` diverifikasi sama dengan `gsp_agent_hq_v21`, `afterAll` selalu menutupnya dengan ROLLBACK.
  - `prisma.$transaction(fn)` milik layanan dijalankan sebagai SAVEPOINT. Bila terjadi galat, harness menjalankan ROLLBACK TO SAVEPOINT. Dry-run READ ONLY juga dikembalikan lewat ROLLBACK TO SAVEPOINT. Perilaku `SET TRANSACTION READ ONLY` dalam savepoint sudah diperiksa empiris sebelum harness dipakai.
  - Di luar jendela ini, proksi menolak setiap akses DB.
  - Nomor dokumen dikirim eksplisit (`DC36/<run>/<x>`), sehingga kunci sekuens `studio-docno` tidak dipegang selama jendela uji dan tidak menahan DC-37/DC-43.
- Sisa fixture diperiksa sesudah ROLLBACK dengan klien terpisah, memakai penanda run: id dokumen, prefiks misi, `createdBy`, id versi templat, dan id berkas.
- Di luar lingkup:
  - Render DOCX/PDF nyata. Berkas R10 ditulis lewat layanan `writeOutput` nyata, bukan mesin render.
  - Kinerja (milik DC-39) dan E2E Chromium (milik DC-43).
- Runner: Vitest 4.1.11 (`vitest.config.ts`, `fileParallelism: false`). Coverage tooling tidak dikonfigurasi di repo.

## 2. Berkas uji (semua baru, kepemilikan `tests/unit/studio/api-contract/**`)

| Berkas | Kasus | Isi |
|---|---|---|
| `_env.ts`, `_http.ts`, `_fx.ts`, `_rb.ts` | - | Env dan secret uji di workspace temp OS; pembuat permintaan; fixture kiriman yang dibuat lewat R12/R13/R04 nyata; harness ROLLBACK |
| `dc36-auth-401.test.ts` | 33 | KS-6: R21, R22, R23, R10 GET/HEAD (`?verify=1`, `?name=`), dan R03 `kind=contracts` x 4 identitas tidak sah. Setiap kasus menghasilkan 401 tanpa header kuota, tanpa C50, dan tanpa akses DB |
| `dc36-quota-headers.test.ts` | 21 | QH-01..QH-05 pada 14 route di 4 bucket (lihat bagian 3) |
| `dc36-retrieval-db.test.ts` | 13 | R21 dan R22 nyata: presisi dan recall pada fixture tertutup |
| `dc36-persist-db.test.ts` | 11 | M19, M20, M21, dan MX09 lewat R04, R13, R12, R16, R06, dan R14; rekonstruksi lewat R20 |
| `dc36-dryrun-db.test.ts` | 14 | R08 slot `contractRecord` (isu dan CW-01) serta R23 dengan dry-run nyata |
| `dc36-files-r10-db.test.ts` | 9 | R10 GET/HEAD atas baris `StudioOutputFile` nyata |
| `dc36-r14-template-version-db.test.ts` | 4 | Isu #9 D-399 |

Audit uji lama: dc15/dc16 (R21/R22 dengan layanan di-mock), dc18 (R10 dengan Prisma tiruan), dc19 dan fixqa (header kuota per route, kebanyakan dengan tiruan), dc23 dan fixsec-drafts (R23 dengan dry-run di-mock), dc09 (baris M17 murni), dcwire*, dan fixqb-r08. Uji DB nyata yang sudah ada hanya fixc1 (urutan langkah), fixqb-docnumber, dan fixsec-archived. Celah yang ditutup DC-36 adalah seluruh jalur di atas dengan layanan dan DB nyata, ditambah R07/R09 untuk header kuota, salinan M19-M21 per revisi untuk setiap jalur tulis, rekonstruksi tanpa M19, R10 atas baris nyata, dan #9.

## 3. Inventaris kasus (ringkas per route; nilai harapan dari register, bukan dari kode)

| Route / topik | Kasus utama | Harapan | Hasil |
|---|---|---|---|
| R21 | `mission`; `status` tunggal dan berkoma; `owner`; `taskRef`; `kind`; `dueBefore`/`dueAfter` inklusif; `cardId` (dari `cardIds` atau kunci butir C34) dengan `matchedItems` sama dengan pid M20; `docNumber` tepat dan bentuk aman I61; `includeArchived=1`; `take=1` berhalaman; ringkasan T2-68 lengkap; dokumen kontrak dengan record kosong berstatus null | Himpunan dokumen persis sama (presisi dan recall 100 persen). D5 non-kontrak dan D6 terarsip tidak ikut tanpa opt-in | PASS |
| R22 | Hit tunggal dengan `documentId`, `pid`, alamat, `slotKey`, `chapterKey` = baris M17; `type=contractItem` memberi `F:record/1` dengan pid M20; filter `kind`/`mission`/`documentId`; sesudah R16, lingkup bawaan pindah ke revisi terkini dan `revisionNo` eksplisit membaca revisi lama; arsip; `q` berisi tanda baca saja | Sesuai §8.1 dan §9.2 | PASS |
| R23 | Dua blok (sah dan status salah); `issues` per blok sama dengan R08 untuk badan yang sama (KS-8); kepala T2-70; baris pagar; DR-08 basis basi (baris 4, warning); tagihan `validate` per blok; 0 tulis | Sesuai §9.3, §11 | PASS |
| R08 `contractRecord` | Tujuh isu: CONTRACT_ENUM, pola C34, CONTRACT_DATE, CONTRACT_REF_TARGET, DISPLAY_FIELD, EC27 `positions [1,2]`, EC25 dengan alasan DOCUMENT/REVISION. Ditambah EC26, lalu pid pensiun yang memberi `valid: true` + `warnings` CW-01, dan pid hidup tanpa `warnings` | Setiap kasus 0 tulis (jejak revisi, M19-M21, dokumen, dan blok sama sebelum dan sesudah) | PASS |
| R10 | Dokumen ber-contractKind: C50 = nama final yang dibangun dari FN-02/04/05 dan cocok C51; Content-Disposition FN-07; `?name=datum` dan `?name=final`; non-kontrak bawaan DATUM dengan C50 tetap ada; R05 `outputs[].finalFileName` = C50; HEAD `?verify=1` header = GET dengan badan kosong; isi disk diubah memberi verified false; `?name` tidak sah 400; HEAD galat tanpa badan | Sesuai §9.5, §10 | PASS |
| Header kuota | R21, R22 (query); R23, R08 (validate); impor (import); R04, R12, R13, R06, R16, R14, R07, R17, R09 (render). C49 = bucket, C48 bilangan bulat yang turun tepat 1. QH-04 untuk R08 `?preview=html` dan impor `?validate=1`. 429 per bucket dengan C48 `0`, Retry-After, dan RATE_LIMITED | QH-01..QH-05 (+ amandemen DOC-FIX-B) | PASS |
| Persistensi | R04 `studio.doc/v2` (201 COMPLETE): satu M19 (reportedAt +07:00 menjadi `2026-10-30T12:30:00.000Z`), M20 dengan pid = M17 `F:record/<n>`, M21 ter-resolve lewat documentId dan docNumber, MX09 `contractCardIds` = cardIds ∪ kunci C34 terurut (DC-37 tidak ikut). R13 membuat M19 baru dengan pid diwarisi per key, butir baru mendapat pid baru, dan MX09 mengikuti. R12, R16, R06, dan R14 `setMeta` masing-masing membuat salinan identik dengan MX09 tetap. R16 pada pid butir memberi 400 PID_OP_KIND; `omitSlot record` memberi 422; keduanya 0 tulis. Invarian satu M19 per revisi | §7.1, §7.2, §7.6, KD-34 | PASS |
| Rekonstruksi | R20 (terkini dan rev 1) identik sebelum dan sesudah 6 M19 dihapus (kaskade ke M20/M21) di dalam transaksi | 03 §4.6, §7.6 | PASS |
| #9 R14 `templateVersion` | Versi 2 tanpa slot record (R19 ADMIN). Record terisi: 422 SLOT_UNKNOWN, 0 tulis, MX09 = M19, R21 tetap `blocked`. Record kosong: 200, tanpa M19, MX09 null/[] konsisten, `contractKind` tetap MX08, R13 ke versi itu 422, kembali ke v1 200. Varian slot `record` bertipe sourceRegister: 422 SLOT_TYPE_MISMATCH | MX09 = cermin revisi terkini | PASS (isu tidak terreproduksi) |

## 4. Coverage dan celah

- Tidak ada pengukuran coverage baris karena repo tidak memasang provider coverage. Cakupan per route ada di bagian 3.
- Celah tersisa:
  - Render nyata R17 untuk dokumen kontrak (bawaan HTML, KD-41) tidak dijalankan di sini; jalur ini dicakup E2E DC-43.
  - QH-04 seri E53 dengan sisa yang sama tidak diuji ulang karena sudah dicakup dc19 secara unit.
  - Tambalan: bila mesin render dapat dijalankan dalam transaksi uji, tambahkan R17 lalu R10 di harness ini.

## 5. Cara menjalankan

```
npx vitest run tests/unit/studio/api-contract          # 7 berkas, 105 kasus (butuh .env DB v21)
npx vitest run tests/unit/studio                        # suite studio penuh
npx eslint tests/unit/studio/api-contract/ && npx tsc --noEmit -p tsconfig.json
```

Bukti segar (2026-10-31):

- Run 1 dan run 2: `Test Files 7 passed (7)`, `Tests 105 passed (105)`. Daftar kasus dan status kedua run identik (`diff` 107 baris, keluaran: tidak ada beda).
- Suite studio: `Test Files 153 passed (153)`, `Tests 3370 passed | 1 skipped (3371)`.
- `tsc` exit 0; eslint exit 0 dengan 0 masalah.

## 6. Catatan CI

- Uji DB butuh `DATABASE_URL` ke `gsp_agent_hq_v21`. Harness menolak berjalan pada DB lain. Uji tidak pernah mencetak URL.
- Setiap berkas DB memegang satu transaksi selama berkas itu berjalan (orde detik). Kunci advisory per dokumen uji ikut tertahan selama itu; kunci sekuens nomor dokumen tidak dipegang karena nomor dikirim eksplisit.
- Sisa sesudah ROLLBACK, dikutip dari keluaran uji: `residue={"documents":0,"revisions":0,"contractRecords":0,"contractItems":0,"docRefs":0,"outputFiles":0,"templateVersions":0}` di kelima berkas DB.
- Hitungan global sebelum dan sesudah sama: StudioDocument 14, StudioRevision 67, StudioDocBlock 2457, StudioContractRecord 29, StudioContractItem 52, StudioDocRef 1, StudioOutputFile 68, StudioTemplateVersion 19.
- `laporan-kerja-agen.latestVersionNo` tetap 1 sebelum dan sesudah.
- Tidak ada uji flaky yang teramati: dua run identik.
- Header kuota bergantung pada limiter memori per proses (QH-06). Uji mereset limiter per kasus.

## 7. Masalah dan keterbatasan

- Savepoint harness meniru transaksi layanan, tetapi tidak meniru opsi isolasi atau timeout milik layanan. Uji konkurensi antar-transaksi berada di luar lingkup (dicakup SR-45).
- Observasi, bukan cacat: dokumen kontrak dengan record kosong yang dipindah ke versi tanpa slot record tetap memegang `contractKind` = MX08 dan tetap tercantum di R21 dengan status null. Ini selaras dengan §7.6 "MX09 diisi contractKind saja".

## 8. Rekomendasi

- Isu #9 dapat ditutup sebagai "tidak terreproduksi; dijaga oleh 422 SLOT_UNKNOWN/SLOT_TYPE_MISMATCH". Uji `dc36-r14-template-version-db` menjadi penjaga regresinya: bila kelak R14 menerima perpindahan dengan record terisi, invarian MX09 akan langsung gagal.
- Harness `_rb.ts` dapat dipakai baris lain untuk uji DB tanpa sisa, termasuk ketika route memanggil `prisma.$transaction` sendiri.

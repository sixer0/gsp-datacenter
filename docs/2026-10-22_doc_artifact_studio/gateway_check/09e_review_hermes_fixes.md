# SR-56e — Review kode penutup perbaikan uji ulang Hermes (D-342..D-355)

- Peninjau: senior-code-reviewer; skill: code-review-senior. REVIEW-ONLY: kode produksi tidak diubah.
- Tanggal: 2026-10-30. Diff terhadap HEAD `904f992`.
- Baris yang dinilai: FIX-R1, FIX-T2, FIX-S3, FIX-CLI, FIX-TL.
- Catatan yang dibaca: `delegation_progress/coder_execution_{fixr1,fixt2,fixs3,fixcli,fixtl}.md`.
- Keputusan yang dibaca: D-342, D-347, D-349 s.d. D-355.

## 1. Bukti segar

| Pemeriksaan | Perintah | Keluaran |
|---|---|---|
| tsc seluruh repo | `npx tsc --noEmit -p .` | **exit 2, 60 galat**, semuanya di `src/app/api/studio/registry/route.ts:13-…`. Galat pertama: `(13,85): error TS1005: ';' expected` |
| eslint | `npx eslint src/lib/studio src/app/api/studio src/components/studio scripts/studio` | **exit 1**, `registry/route.ts 13:84 Parsing error: ';' expected` |
| Unit Studio | `npx vitest run tests/unit/studio` | **2 berkas gagal / 92 lulus**. Tes: 2196 lulus, 1 dilewati. `tests/unit/studio/api/auth.test.ts` dan `http-errors.test.ts` gagal di tahap transform ("Transform failed with 1 error") karena mengimpor route R03 |

Sebabnya satu: `registry/route.ts` (waktu ubah 13:39) disunting SESUDAH bukti "tsc 0" di D-355. Itu sebabnya bukti di D-355 tidak menangkapnya.

## 2. Vonis

**Keseluruhan: CHANGES REQUESTED.** Ada 9 temuan: 1 High, 1 Medium, 7 Low.

- E1 (High) adalah galat sintaks satu karakter. Akibatnya R03 dan gerbang tsc/eslint/vitest rusak.
- Setelah E1 diperbaiki, sisa temuan setara APPROVED WITH COMMENTS.
- E2 (Medium) perlu uji: dari pembacaan kode, nomor halaman TOC dapat salah bila `toc.levels` disetel di slot TOC.

| Domain | Vonis | Temuan |
|---|---|---|
| Structure | CAUTION | E3, E7 |
| Dependency Impact | CAUTION | E5 |
| Duplication | CAUTION | E8 |
| Maintainability | CAUTION | E6, E9 |
| Reference Integrity | **FAIL** | E1, E2, E4 |

### 2.1 Vonis per modul

| Modul | Baris | Vonis | Temuan |
|---|---|---|---|
| Rel K2 rev B + G-RAIL-3 (`docx/blocks/{rail,env,text}.ts`, `docx/assemble/index.ts`, `html/blocks/text.ts`, `html/base/shell.ts`) | FIX-R1 | CAUTION | E3, E4, E5 |
| TOC section/lampiran + PAGEREF + `part.lede` (`docx/wrapper/{toc-refs,pages}.ts`, `docx/blocks/structure.ts`, `html/blocks/wrapper.ts`) | FIX-T2 | CAUTION | E2, E7 |
| R20 `?shape=submission` (`services/structure/{submission,snapshot,index}.ts`, route `documents/[id]/content`) | FIX-S3 | PASS | - |
| CLI `md2chapter.ts` + pesan Indonesia (`render/preflight.ts`, `http/route-not-found.ts`) | FIX-CLI | PASS dengan catatan | E9 |
| R-66 `toc.levels`, peran `toc.section*`/`toc.appendix*`, `ROLE_KEYS` (+ penyelarasan komentar controller) | FIX-TL | **FAIL** | E1, E6, E8 |

## 3. Temuan

| # | Tingkat | Domain | Berkas:baris | Deskripsi dan bukti | Pemilik | Usulan |
|---|---|---|---|---|---|---|
| E1 | **High** | Reference Integrity | `src/app/api/studio/registry/route.ts:13` | Komentar `/** … */` diselaraskan menjadi `roles -> 76 kunci peran format (§5.6; +6 toc.section*/toc.appendix* D-355)`. Urutan karakter `*/` di dalam `toc.section*/toc.appendix*` MENUTUP blok JSDoc, sehingga sisa komentar terbaca sebagai kode. Akibatnya (bukti §1): tsc 60 galat, eslint parse error, dan 2 berkas uji tidak dapat ditransform. Modul R03 `GET /api/studio/registry` tidak dapat dikompilasi, padahal R03 dipakai UI (esensial, skema, peran) dan agen (`kind=schema`). Pada server DEV, pemuatan ulang akan menggagalkan route ini. `grep` atas `src scripts` menunjukkan ini satu-satunya kemunculan; komentar serupa di `role-formats-editor.tsx:4` aman | Controller (penyelarasan komentar D-355) | Tulis `toc.section…/toc.appendix…` atau `toc.section*, toc.appendix*` (tanpa `*/`). Jalankan ulang tsc repo, eslint, dan `vitest tests/unit/studio`, lalu cek R03 di :9021. Jadikan "tsc repo 0 sesudah suntingan terakhir" syarat sebelum D ditulis |
| E2 | Medium | Reference Integrity | `src/lib/studio/engine/docx/wrapper/toc-refs.ts:232` (nama penanda berurut `_StToc_nnn`), `:279-290` (indeks di-cache per `ctx.tpl.params`); `src/lib/studio/engine/docx/assemble/index.ts:186-199` (params per unit = params dokumen ∪ params slot); `src/lib/studio/registry/slots.ts:171` (`toc.levels` cakupan `section:toc`) | Nama penanda dibagikan dari satu urutan yang memuat section hanya bila `toc.levels >= 2`, dan `toc.levels` dibaca dari params UNIT. Bila templat menyetel `toc.levels = 1` di slot TOC (tempat yang dibuka cakupannya), unit TOC menamai bab ke-2 `_StToc_002`. Unit bab (params slot isi, bawaan 2) menyisipkan section ke urutan, jadi bab ke-2 menerima nama lain dan `_StToc_002` jatuh ke section bab 1. Akibatnya PAGEREF menunjuk penanda yang salah dan nomor halaman TOC di PDF/Word salah tanpa peringatan. HTML aman karena jangkarnya berbasis kunci/nomor. Status: pembacaan kode, belum dijalankan | FIX-T2 / FIX-TL | Nama penanda STRUKTURAL yang tidak bergantung tingkat, mis. `_StToc_p<id>`, `_StToc_c<kunci>`, `_StToc_a<kunci>`, `_StToc_s<C\|A><kunci>_<j>` (disanitasi, ≤ 40 karakter); atau hitung indeks dari params dokumen, bukan params unit. Tambah uji: `toc.levels=1` di slot TOC v2, dengan setiap PAGEREF memiliki penanda bernama sama di judul yang benar |
| E3 | Low | Structure | `src/lib/studio/engine/html/blocks/text.ts:29`, `src/lib/studio/engine/html/base/shell.ts:23` (impor `../../docx/blocks/rail`) | HTML kembali bergantung pada modul mesin DOCX (pola C4 SR-56d / IP-79 / IP-104) | FIX-R1 | Pindahkan `resolveRailLayout`/`railK2ReserveOf` (murni) ke `engine/tokens` atau `engine/front`, lalu impor dari kedua perakit |
| E4 | Low | Reference Integrity | `src/lib/studio/engine/docx/blocks/text.ts:127`; `src/lib/studio/engine/html/blocks/text.ts:126-129` | K2 membuang indentasi kanan PERAN yang NILAINYA sama dengan cadangan rel. Ini heuristik kesamaan nilai. Akar masalahnya data: preset GSP mewarisi `indRightTw` 2154 dari profil Manual 000 pada 4 peran. Diperiksa: `benchmark/manual000/template.json` dan `datum-manual-000.preset.json` → `part.lede`, `body.paragraph`, `list.bullet`, `list.number`. Templat yang SENGAJA memberi indentasi selebar itu akan diabaikan diam-diam | FIX-R1 (data → seed GSP) | Bersihkan indentasi 2154 dari peran preset GSP (`prisma/seed-studio.ts`, Δ beralasan seperti D-329). Pertahankan G-RAIL-3 sebagai gerbang, dan jadikan heuristik ini cadangan yang tercatat di log |
| E5 | Low (hipotesis) | Dependency Impact | `src/lib/studio/engine/docx/assemble/index.ts:378-436` (G-RAIL-3 melempar `BY_CONSTRUCTION_FAILED` per unit badan) | Gerbang berlaku juga untuk render ulang revisi lama (R07) dan dokumen v1 yang membawa `format` eksplisit dengan `indRightTw` = cadangan pada templat `framePr`. Revisi yang dulu ter-render kini dapat gagal keras. Kemungkinannya rendah karena konten v1 sudah konten-saja (D-138), tetapi snapshot lama tidak ditulis ulang | FIX-R1 | Uji render ulang satu revisi lama berformat eksplisit di `datum-gsp` v3. Bila gagal, putuskan: tetap gagal keras (aturan) atau peringatan khusus revisi lama |
| E6 | Low | Maintainability | `src/lib/studio/engine/docx/wrapper/toc-refs.ts:96-110` (`tocLevels`) | Pembaca `toc.levels` masih menerima larik nama tingkat beralias (`bagian`, `seksi`, `subbab`, …), padahal R-66 terdaftar `int 1-3`. Validator templat menolak larik, jadi cabang itu tidak terjangkau dan menjadi permukaan tak terdokumentasi | FIX-TL | Buang cabang larik, atau daftarkan bentuknya di R-66 dan dokumentasikan. Satu bentuk saja |
| E7 | Low | Structure | `src/lib/studio/engine/docx/wrapper/toc-refs.ts:279-287` | Cache indeks menyimpan SATU identitas params per snapshot. Unit yang berselang-seling dengan params slot berbeda membangun ulang indeks berulang kali (O(unit × section)). Hanya kinerja | FIX-T2 | Selesai dengan sendirinya bila E2 memakai params dokumen; bila tidak, cache per pasangan (snapshot, params) |
| E8 | Low | Duplication | `src/lib/studio/engine/docx/wrapper/toc-refs.ts:168,176` (`TABLE_BODY_SIZE_FALLBACK_PT = 8.2`); `chapterKeyOf` masih salinan `wrapper/pages.ts` `chapterKey` (C6 SR-56d, IP-104) | Cadangan ukuran tipe ditulis literal, menyalin bawaan katalog P4T-S05 | FIX-TL | Baca `PARAMS_BY_KEY.get("type.scale.tableBody.size")?.default`; gabungkan dengan IP-104 |
| E9 | Low | Maintainability | `scripts/studio/md2chapter.ts:135,147,150,156` | Pesan galat CLI baru berbahasa Inggris ("--template must be …", "--doc-title must not be empty"), padahal D-340 mengarahkan pesan galat platform ke bahasa Indonesia | FIX-CLI | Samakan ke bahasa Indonesia (opsi/kode tetap) |

## 4. Diperiksa dan diterima

- **FIX-R1:** satu resolver tata rel (`docx/blocks/rail.ts:45-65`) dipakai `BlockEnv.rail()` dan assert. Cadangan inang `framePr` = gutter + rel (`railHostIndentTw`), sama dengan cadangan assert. G-RAIL-3 memeriksa paragraf menyempit tanpa chip dan chip yatim, lalu melapor 5 contoh pertama. `table3col` dan moda B tidak diperiksa. Unit muka dilewati dengan alasan, dan `part.lede` ditutup uji tersendiri (D-352).
- **FIX-T2:** penanda section dicari lewat `blockId`, lalu alamat sebagai cadangan (`toc-refs.ts:324-330`). Rentang medan `\o` mengikuti tingkat. Jangkar HTML `st-sec-<nomor>` sama dengan id kepala section (`html/blocks/text.ts:397`, `wrapper.ts:432`).
- **FIX-S3:** bentuk kiriman murni (`services/structure/submission.ts`), `baseRevisionNo` = revisi yang dibaca, slot berulang → 422 `SLOT_USE_CHAPTER_ENDPOINT` beserta daftar bab, slot kosong → `submission: null`. Kontrak tidak berubah. `assets`/`register` tidak perlu dikirim ulang karena merge memakai milik dokumen (`coder_execution_fixs3.md:81`).
- **FIX-CLI:** `--doc-title` dipilih agar arti `--title` lama tidak berubah (DEVIASI diterima D-349). Tanpa opsi baru, keluaran tetap byte-identik. Pesan 503/404 kini berbahasa Indonesia, sedangkan kunci dan kode tidak berubah.
- **FIX-TL:** R-66 berstatus lanjutan, jadi jumlah esensial tetap 30. Peran `toc.appendix*` hanya dipakai bila templat menyetelnya, sehingga keluaran lama tetap (`toc-refs.ts` `tocEntryRoles`).
- **D-139:** tidak ada medan tampilan baru di kontrak agen. Tingkat TOC, indentasi, dan rel tetap keputusan templat dan mesin.

## 5. Tantangan

1. **Bukti "tsc 0" di D-355 ditulis sebelum suntingan terakhir** (E1). Gerbang penerimaan harus dijalankan sesudah SEMUA suntingan, termasuk penyelarasan komentar oleh controller.
2. **Penamaan penanda berurut adalah sumber kerapuhan** (E2, dan C6 SR-56d). Nama struktural menghilangkan seluruh kelas ketidakcocokan, baik dari tingkat, lingkup render, maupun urutan.

## 6. Temuan positif

- Akar S1 Hermes didiagnosis sebagai data templat, lalu ditutup dengan gerbang render yang gagal keras. Manual 000 (`table3col`) terbukti tidak tersentuh (D-350).
- S3 ternyata bukan cacat kontrak. Akar sebenarnya (`text` + `runs` bersamaan) ditemukan, dan mode `shape=submission` menghapus sunting JSON manual pada alur pulih.
- Uji yang ada (selain 2 berkas yang terdampak E1) seluruhnya hijau: 2196 lulus.

## 7. Berkas yang dibaca

`engine/docx/blocks/{rail.ts:30-110,160-245, text.ts:100-135}`; `engine/docx/assemble/index.ts:186-210,370-440`; `engine/html/blocks/text.ts:118-130,397`; `engine/html/base/shell.ts:23,265-312` (grep); `engine/docx/wrapper/toc-refs.ts:1-50,89-215,225-350`; `engine/docx/wrapper/pages.ts` (grep TOC); `engine/html/blocks/wrapper.ts:205-215,415-495` (grep); `engine/docx/blocks/structure.ts:115-151` (grep); `services/structure/{submission.ts, snapshot.ts (diff)}`; route `documents/[id]/content` (grep); `scripts/studio/md2chapter.ts` (opsi dan pesan); `services/render/preflight.ts:33`; `http/route-not-found.ts` (grep hint/pesan); `params/render.ts:12,325-328`; `registry/slots.ts:171`; `contract/enums.ts` (diff); `app/api/studio/registry/route.ts:1-30` (+ diff); `components/studio/template-editor/role-formats-editor.tsx:1-8`; `benchmark/manual000/{template.json, datum-manual-000.preset.json}` (peran ber-2154, dibaca `python -I`).

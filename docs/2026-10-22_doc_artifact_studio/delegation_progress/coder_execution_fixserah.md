---
task_slug: doc_artifact_studio
row: FIX-SERAH (D-295; tambahan D-299 / SR-50 N-SR50-1)
date: 2026-10-23
agent: coder-execution
status: complete
---

# FIX-SERAH: aparatus sampul explicit v1 (D06/D16), label Bagian di TOC v2, seksi kosong slot opsional

Skill: diagnosing-bugs (loop reproduksi -> hipotesis -> uji), dry-run-verify-fix. Klaim: `file_claims.md` baris FIX-SERAH + FIX-SERAH tambahan.

## Diagnosis (dengan bukti)

### F1: lint v1 SERAH gagal D06 + D16 (datumRule/sealBand/spineString)
- Lint benar. DOCX v1 SERAH memang tidak memuat logo, pita segel, Datum Rule, maupun string punggung.
- Bukan aset templat yang hilang. Logo adalah aset templat: `loadLogo` = kunci eksplisit > `tpl.assets.logo` > aset S13 `logo/gsp-tinta.png` (`engine/docx/wrapper/media.ts:270-279`). Buktinya v1 TERBIT (sampul `auto`, tanpa aset logo di konten) lulus D06 "sampul auto menempatkan logo".
- Bukan regresi D-197. `renderCover` explicit merender badan apa adanya (`wrapper/pages.ts` renderCover), dan perilaku ini sudah ada sebelum SR-16.
- Akar: fixture v1 SERAH memakai `front.cover.mode: "explicit"` (`tests/parity/fixtures/doc/doc_serah_handover.json`). SR-41 (`scripts/parity/run/lib/content_only.ts`, D-248/D-256) membuang perangkat tampilan dari badan karena keluaran adaptor v2 tidak berubah: logo + hairline + sealBand di badan sampul, spineString di badan bagian, datumRule di intro bab (sumber `tests/parity/fixtures/src/docs.ts:794-890`). Sampul explicit konten-saja dengan demikian tidak lagi membawa aparatus. Di jalur produksi (v1 -> `adaptV1` -> compose, D-210) sampul menjadi `auto`, sehingga templat memasang aparatus (lint v2 PASS). Jalur v1 asli (`normalize`, dipakai harness paritas dan revisi norm/v1) tidak memasangnya.
- Lint menilai hal yang sama: D06 = perangkat logo di walk + `cover.mode === "auto"` (`lint/structure/checks-d.ts` d06); D16 = `presentSectionKeys` menambah sealBand/datumRule/spineString hanya untuk sampul auto atau perangkat di badan.
- Putusan (D-139): aparatus adalah milik templat. Mesin memasangnya pada sampul explicit untuk jenis yang TIDAK dibawa badan, menurut `cover.elementOrder` dan parameter penempatan yang sama dengan sampul auto. Aturan lint tidak diubah: lint kini membaca apa yang benar-benar dipasang. Bila perangkat dimatikan templat, lint tetap FAIL (diuji).

### TOC v2 tanpa entri "Bagian" (hipotesis SR-46 §5.2): TERBUKTI cacat
- `deriveTocEntries` memakai `label: p.label` mentah (`wrapper/pages.ts`). Compose v2 mengisi `label: { text: "" }` dengan komentar "Label Bagian I dibangkitkan mesin dari id bila kosong" (`services/compose/snapshot.ts:359-360`). Pembatas bagian memakai cadangan "Bagian I", tetapi TOC tidak.
- Render sebelum perbaikan: v2 serah TOC `Bukti teknis` tanpa label, sementara pembatas menulis `Bagian I`. v2 terbit TOC `Kondisi saat ini`/`Usulan`, padahal v1 terbit TOC `Bagian I|Kondisi saat ini`. HTML punya cacat yang sama: `hasInline` hanya memeriksa bentuk, sehingga sel label TOC dan kicker pembatas kosong.

### D-299 (N-SR50-1): halaman akhir kosong v2
- Compose selalu memancarkan unit + blok `ruleIndex` `{ mode: "auto" }` tanpa entri (`compose/snapshot.ts:440-444`). Perakit merender seksi kosong (`assemble/index.ts` SLOT_BLOCK_RENDERERS.ruleIndex) dan menghasilkan `sectPr` tambahan sekaligus 1 halaman PDF kosong. `references` kosong tidak memancarkan unit.
- Perbaikan ditaruh di perakit (`planUnitsV2`), bukan di compose. Alasannya: snapshot/structureSha256 tetap, sehingga revisi v2 tersimpan dan cek rekonstruksi (D-214) tidak terdampak. Snapshot lama yang sudah memuat unit ruleIndex juga ikut terlindungi.

## Perubahan

| Berkas | Jenis | Isi |
|---|---|---|
| `src/lib/studio/engine/front/apparatus.ts` | baru | `explicitCoverApparatus(params, body)` (butir aparatus aktif yang tidak dibawa badan; sebelum kelompok judul = di atas badan, sisanya di bawah), `coverApparatusEnabled`, `COVER_ELEMENT_ORDER_DEFAULT`, `defaultPartLabelText` |
| `src/lib/studio/engine/docx/wrapper/pages.ts` | ubah | renderCover explicit: aparatus templat + badan (tiga panggilan `frontItemsXml` agar indeks blok badan tetap); `autoCoverItems(..., orderOverride)`; label bagian TOC turunan = label pembatas (`defaultPartLabelText`) |
| `src/lib/studio/engine/html/blocks/wrapper.ts` | ubah | `explicitCoverHtml` (sama dengan DOCX); `coverAuto(..., orderOverride)`; `partLabelOf` (label berteks atau bawaan) untuk entri TOC + kicker pembatas |
| `src/lib/studio/engine/lint/structure/checks-d.ts` | ubah | d06 + `presentSectionKeys`: menghitung aparatus yang dipasang templat pada sampul explicit (fungsi bersama yang sama dengan renderer) |
| `src/lib/studio/engine/docx/assemble/units.ts` | ubah | `planUnitsV2` (c2): unit slot OPSIONAL tanpa isi (blok kosong atau hanya penanda ruleIndex auto tanpa entri) tidak dirender; slot wajib, placeholder, dan lingkup slot itu sendiri tetap dirender; log info `OPTIONAL_SLOT_EMPTY_OMITTED` |
| `tests/unit/studio/renderers/fixserah-front-apparatus.test.ts` | baru | 12 uji: helper, lint D06/D16 dua arah (perangkat dimatikan = tetap FAIL; logo di badan dihitung sekali), DOCX sampul SERAH v1 (2 gambar), TOC v2 DOCX + HTML "Bagian I", ruleIndex opsional/wajib/lingkup, jumlah seksi |

Penulisan atomik: berkas lama diubah lewat skrip (tmp + `os.replace`, cocok tepat satu kali per suntingan). Berkas baru ditulis langsung. Uji mutasi: dengan 3 berkas lama dipulihkan, 3/12 uji GAGAL (lint, sampul DOCX, TOC). Sesudah dikembalikan, `cmp` identik.

## Bukti (perintah + keluaran)

Fixture tidak berubah selama run (`sha256sum tests/parity/fixtures/doc/**` sebelum = sesudah). Run: `run_parity.ts --only "doc/**" --formats docx,pdf --out tests/parity/out/fixserah/parity_{before,after}`.

| Fixture | sha DOCX sebelum -> sesudah | sectPr | halaman PDF (soffice) | lint FAIL | D06 / D16 |
|---|---|---|---|---|---|
| v1 nota_memo | a48e5e3ea8b5 = | 2 = | 2 = | 2 = | n/a |
| v1 nota_tables | a4e6ff6298e4 = (jangkar D-279) | 2 = | 5 = | 1 = | n/a |
| v1 serah | 28b6837da586 -> e6c38f7480f2 | 7 = | 12 = | 22 -> 18 (= v2) | FAIL -> PASS / 3 FAIL -> PASS "13 section wajib tier SERAH ada" |
| v1 terbit | b61f875f2179 = | 9 = | 13 = | 2 = | PASS / PASS |
| v2 nota_memo | e181dcf83a58 -> a48e5e3ea8b5 (= v1 byte-identik) | 3 -> 2 | 3 -> 2 | 2 = | n/a |
| v2 nota_tables | 683b64a0c6ed -> a4e6ff6298e4 (= v1 byte-identik) | 3 -> 2 | 6 -> 5 | 1 = | n/a |
| v2 serah | a655cebfd13d -> 3245655e88a5 | 8 -> 7 | 13 -> 12 (= v1) | 18 = | PASS / PASS |
| v2 terbit | 7634411bbc28 -> 7157312da22d | 10 -> 9 | 14 -> 13 (= v1) | 2 = | PASS / PASS |

- TOC v2 sesudah: serah `Bagian I|Bukti teknis`; terbit `Bagian I|Kondisi saat ini`, `Bagian II|Usulan` (sebelumnya tanpa label). HTML v2 terbit: `toc.partLabel">Bagian I<`, `Bagian II<`, kicker pembatas `Bagian I`/`Bagian II` (sebelumnya kosong).
- Vonis paritas sama sebelum/sesudah: DOCX DIAGNOSIS 8/8, PDF FAIL 8/8. Penurunan kelas PD masih ditangani FIX-H (D-299 PD-1), di luar baris ini.
- Manual 000 DOCX v1: `render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx` menghasilkan `53485ebc1eddd145…` sebelum dan sesudah.
- Run resmi: `run_benchmark.ts --schema v2 --official --out tests/parity/out/fixserah/official_{before,after}` menghasilkan DOCX `952f65d63c77f615…` sebelum = sesudah = official3. BM1 PASS 4544/4544, BM2 PASS 102/102, BM3 99/102 (selisih dikenal D-289), BM4 PASS 0,9671. Hasil ini identik dengan official3.
- `npx vitest run tests/unit/studio`: sebelum 1987/1987 lulus; sesudah **1999/1999 lulus, 0 gagal, 311 suite** (`tests/parity/out/fixserah/vitest_final.json`).
- `npx tsc --noEmit -p tsconfig.json` exit 0. `npx eslint <5 berkas src + uji>` exit 0.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | - | tidak |

## Issues & Decisions (untuk controller)
| Butir | Keputusan / temuan | Status |
|---|---|---|
| F1 | Bukan isi dan bukan aset yang hilang: aparatus sampul explicit kini dipasang mesin dari templat (D-139). Lint hanya membaca keluaran nyata, aturan tidak diubah | perlu dicatat controller |
| TOC | Cacat dikonfirmasi dan diperbaiki di DOCX + HTML (label bagian bawaan sama dengan pembatas) | selesai |
| D-299 | Diperbaiki di perakit DOCX, compose tidak diubah (snapshot/struktur stabil). HTML masih memancarkan `div` ruleIndex kosong (tanpa halaman) | selesai; catatan |
| O-1 | ruleIndex WAJIB tanpa entri masih dirender sebagai seksi penanda (D-197; di luar lingkup D-299 yang hanya menyebut slot opsional) | butuh putusan controller bila ingin disamakan |
| O-2 | HTML `findLogoKey` tidak punya cadangan aset S13 seperti DOCX. Sampul HTML (auto dan explicit) tanpa logo bila doc/templat tidak membawa aset logo. Cacat ini sudah ada sebelumnya, sama di v2 | backlog pemilik HTML |
| O-3 | Label bagian bawaan diambil dari angka di id (algoritme lama, kini dipakai bersama): id tanpa angka selalu menjadi "Bagian I" | backlog (opsional: posisi) |

## Next Steps
- Controller: catat putusan F1/TOC/D-299. Pertimbangkan O-1/O-2. Review direkomendasikan (lingkup: 5 berkas src di atas + uji).

---
task_id: IMPL-W3
task_slug: doc_artifact_studio
row: IMPL-W3
date: 2026-11-03
agent: coder-execution
source_plan: brief controller IMPL-W3 (D-534) + tambahan butir 8-13 (umpan balik Hermes r5) + butir 14 (alamat suntingan, USER)
status: needs-review
---

# Laporan Implementasi: IMPL-W3 - alat tulis MCP menyerap masalah (r5b)

Laporan ditulis bertahap (append). Bukti merah -> hijau per butir dicatat saat butir selesai.

## Log kerja (bertahap)

- Butir 1 (isError): `scripts/studio/mcp/outcome.ts` (baru: `isGenuineFailure`, `hintFor`), `tools.ts` (`executeTool`: `code`, `hint` di structuredContent, baris `petunjuk:`, `genuineFailure` di envelope), `server.ts` (`isError` hanya bila `genuineFailure`). Uji `implw3-outcome.test.ts`: MERAH 3 gagal / 3 lulus dengan perilaku lama (server.ts dikembalikan sementara), HIJAU 6/6.
- Butir 1 lanjutan: 12 asersi `isError: true` di uji lama untuk penolakan yang dapat diperbaiki (INVALID_ARGUMENT, BASIS_MISSING, SCOPE_CONFLICT, MD2CONTRACT_REQUIRED_MISSING, kode slot 409/422) diubah menjadi `isError` falsy + `data.ok === false` (perubahan perilaku yang disengaja). Asersi untuk 500 dan REMOTE_ERROR (302) tetap `isError: true`. `implw-write` `details.matches` -> `details.candidates`; `implw2-security` L-4 memakai baris kosong (sel boolean kini dikonversi butir 3). Suite MCP: 216/216.
- Butir 2/14 (pencocokan): `write-match.ts` baru (`fold`, `exactView`, `hasPunct`, `findText`, `findCell`, `uniqueWindow`, kandidat jendela). `write-edit.ts`: satuan membawa section/rowCells/column; `locate` memakai `findText`; `applyEdits` mendukung `section`, `occurrence: "all"`, `{cell,value}`; samar -> `FUZZY_MATCH`.
- Butir 3 (skema): `write-normalize.ts` baru (`normalizeWriteArgs`, `normalizeEditArgs`) lewat kait baru `ToolDef.prepare` (dijalankan `executeTool` sebelum ajv; peringatan `ARG_MAPPED`/`ARG_IGNORED`). Skema: meta nilai <= 2000, blok `{ref}`, tabel `unit`, edit `section`/`occurrence`/`{cell,value}`.
- Butir 4/6/7/13 (laporan kerja, `write-content.ts`, `write-tools.ts`): akar positif palsu CONTENT_INJECTION ditemukan lewat probe: (a) `Verdict:` tak dikenal / `CardIds:` bukan t_xxxxxxxx menjadi pembuka bab 1, (b) `TaskRef`/`Initiator` berspasi dipotong konverter ke token pertama (`record.X berubah`), (c) urutan bagian berbeda dari urutan konverter (bab 1..5 lalu tambahan). Perbaikan: `normalizeOptionalFields` (vonis alias -> kode, taskRef/initiator dinormalkan, cardIds disaring; tak dapat -> dibuang + peringatan) dan `assertShape` mengurutkan harapan menurut kunci bab (stabil) sebelum membandingkan judul + paragraf persis. Butir 6: `buildWorkReport` mengembalikan `missing` (tidak melempar); `studio_write` -> `state: "INCOMPLETE"`, `missing`, `hint`. Butir 7: status Indonesia (laporan + butir), blok `{ref}`, teks di bagian Rujukan dipindah ke "Catatan rujukan". Butir 13: `paragraphLines` menggabung wrap keras. Uji `implw3-builder.test.ts`: MERAH 12 gagal / 1 lulus, HIJAU 13/13. Dua uji lama SECTION_MISSING diubah ke perilaku INCOMPLETE. Suite MCP 229/229.
- Butir 14 (alamat suntingan): `write-match.ts` tingkat persis memakai `exactView` (escape Markdown dibuang, spasi dinormalkan); `find` bertanda baca -> persis/tanpa-markah saja, tanpa samar (14b); kandidat ambigu membawa `find` jendela unik >= 3 kata atau `cell` siap salin (14a). `write-position.ts` baru: `{pid, at, length?, replace, expect?}` -> klien: langsung ke paragraf (run dipertahankan); laporan kerja: cari-ganti jendela di bab paragraf itu; `POSITION_MISMATCH` (hasil normal) bila expect/posisi tidak cocok (14c). `write-client-edit.ts`: satuan membawa section (bab / section), baris + kolom tabel; memakai `findText`/`findCell`; sisipan diurai `parseInline` (backtick -> kode, butir 13). Suite MCP 229/229.
- Butir 5/8-13 (dokumen klien, `write-client.ts`, `write-client-run.ts`, `write-client-edit.ts`): `planChapters` (nomor bab eksplisit selalu dihormati; bagian tanpa nomor memakai nomor bebas, atau menjadi sub-bagian bab di sebelahnya bila tidak ada nomor bebas: `SECTION_NESTED`; `CHAPTER_RENUMBERED` hanya untuk nomor eksplisit ganda/tidak naik); nomor sumber bertingkat di awal sub-judul dibuang (`SUBHEADING_NUMBER_STRIPPED`; aturan: mesin menomori section N.M); prefiks "Gambar/Tabel/Figure/Table N.M" di caption dibuang (`CAPTION_PREFIX_STRIPPED`); sumber tidak dikarang (`SOURCE_DEFAULTED` dihapus; `meta.source` agen dipakai dengan `SOURCE_FROM_META`; tanpa sumber -> isu `SOURCE_MISSING`); `shortRev` (rev <= 16 + teks penuh di `what`, `REV_SPLIT`); lembar kendali disesuaikan batas skema; satuan hanya dari agen (judul kolom / `unit` blok / caption -> metadata `unit` kolom angka, tanpa kolom baru; selain itu isu `TABLE_UNIT_MISSING`); semua isu dikumpulkan -> SATU `CONTENT_INVALID` (0 jaringan); bagian kosong dilewati (`SECTION_EMPTY_SKIPPED`); dokumen klien belum lengkap -> `state: "INCOMPLETE"`. Uji `implw3-client-builder.test.ts`: MERAH 9 gagal / 1 lulus, HIJAU 10/10. Uji lama `implw2-client`: fixture memberi `meta.source` sendiri (D-530(2) dibalik), 3 asersi kode -> `CONTENT_INVALID` + kode isu di rincian. Suite MCP 239/239.
- Butir 7 kecil: `studio_document_get` `view: "paragraphs"` (pid + bab + section + teks polos, untrusted) + `prepare` lenient (alias id, sinonim view, chapter tanpa slot -> content, argumen view lain dibuang); `headWithRetry` (tool-kit) untuk HEAD R10 404: 3 percobaan ~1,5 s, dipakai `studio_file_verify` dan render klien; META_CONFLICT judul laporan sendiri -> R14 setMeta + kirim ulang sekali (`META_UPDATED`).
- Uji tambahan: `implw3-edit.test.ts` (10: cell 20x, ambigu -> kandidat cell, jendela >= 3 kata + ulangan, section, occurrence all, samar FUZZY_MATCH, tanda baca persis + kutip tidak disamakan, posisi + POSITION_MISMATCH, view=paragraphs, klien murni cell/posisi/sisipan kode), `implw3-lenient.test.ts` (5: normalisasi murni write/edit, studio_write varian lewat MCP, META_CONFLICT judul sendiri -> setMeta + kirim ulang, HEAD 404 dicoba ulang). Bukti merah gabungan: kode HEAD (`git checkout HEAD -- scripts/studio/mcp/`, cadangan dipulihkan dan `diff -r` identik) -> 5 berkas implw3, 39 gagal / 5 lulus dari 44.
- Dokumen: `docs/STUDIO-MCP.md` (§4.1 baris hasil normal vs galat; §5.x sumber/satuan; §5.y baru). Deskripsi `studio_edit` diperbarui (363 karakter, <= 400). Smoke DEV baru `scripts/studio/mcp/smoke-implw3.ts`.

## Smoke DEV (127.0.0.1:9021, mission 2026-11-03_implw3, 13 panggilan, ok true, exit 0)

| # | Langkah | Hasil | Catatan |
|---|---|---|---|
| 1 | R5: tulis pertama kurang bab + meta tambahan + varian blok + vonis/kartu (dulu SECTION_MISSING/INVALID_ARGUMENT/CONTENT_INJECTION) | PASS | doc cmw0bpu7707h8v188suulb4y1 state INCOMPLETE missing Bukti/Isu terbuka/Langkah berikut render tidak; peringatan ARG_MAPPED,META_IGNORED,TASKREF_NORMALIZED,CARD_IDS_DROPPED [2975 B, 694 ms] |
| 2 | tulis kedua melengkapi bab -> COMPLETE + render | PASS | rev 7 COMPLETE [1929 B, 1585 ms] |
| 3 | R5: sel status (muncul 20 kali) lewat cell row+column | PASS | edited record,bab 2 [1818 B, 993 ms] |
| 4 | R5: kata tunggal ambigu -> hasil normal + kandidat cell siap salin | PASS | 5 kandidat; cell {"section":"Rincian kerja","row":"T-1","column":"status"} [3952 B, 79 ms] ok:false TEXT_AMBIGUOUS isError=false: tambahkan section, pakai { cell: { section, row, column }, value }, atau occurrence: "all" bila semua kemunculan memang diganti |
| 5 | R5: find samar (huruf besar, 1000 vs 1,000) | PASS | peringatan FUZZY_MATCH [2086 B, 844 ms] |
| 6 | tanda baca persis (jangkar pendek) | PASS | rev 11 [1774 B, 902 ms] |
| 7 | view=paragraphs memberi pid + teks polos | PASS | 1 paragraf; pid p-0kmb9dbzx7 [1378 B, 74 ms] |
| 8 | posisi dengan expect salah -> POSITION_MISMATCH hasil normal | PASS |  [1870 B, 65 ms] ok:false POSITION_MISMATCH isError=false: baca rincian, perbaiki masukan, lalu ulangi sekali |
| 9 | posisi pid + at + expect diterapkan | PASS | rev 12 [1774 B, 927 ms] |
| 10 | R5: tabel tanpa sumber/satuan -> SATU hasil normal berisi semua isu, 0 dokumen | PASS | isu SOURCE_MISSING,TABLE_UNIT_MISSING,SOURCE_MISSING [2927 B, 6 ms] ok:false CONTENT_INVALID isError=false: perbaiki semua isu di rincian sekaligus lalu ulangi studio_write sekali |
| 11 | satu ulangan dengan sumber + satuan caption -> COMPLETE + DOCX | PASS | doc cmw0bpz0i07y0v1884s3f5fqj bab 1,4,6; peringatan META_IGNORED,REV_DISPLAY_ONLY,REV_SPLIT,SOURCE_FROM_META,SUBHEADING_NUMBER_STRIPPED,CAPTION_PREFIX_STRIPPED,UNIT_FROM_CAPTION,TEMPLATE_RESOLVED,OUTLINE_SET [4799 B, 2016 ms] |
| 12 | klien: sel berulang ('siap' 2x) lewat cell | PASS | edited bab 4 [1870 B, 1242 ms] |
| 13 | studio_file_verify segera sesudah render | PASS | 027-GSP-KT-XI-2026_rev9_20261103T064535Z_36ae0bcd.docx [1171 B, 68 ms] |
| 14 | DOCX: sub-bab 4.1 tanpa nomor sumber ganda | PASS | Product concept / 4.1   Product concept |
| 15 | DOCX: bab 4 dan 6 sesuai nomor eksplisit | PASS | Tabel 4.1   Status gardu / Gambar 6.1   Kesiapan gardu / Tabel 6.1   Daya per gardu (MW) |
| 16 | DOCX: caption tidak dobel | PASS | Gambar 6.1   Kesiapan gardu |
| 17 | DOCX: tidak ada sumber karangan | PASS | Diolah oleh false, Compiled by false |
| 18 | DOCX: revisi pendek + teks penuh | PASS | "Rev 0" true, teks penuh true |
| 19 | DOCX: wrap keras digabung | PASS | Ringkasan untuk manajer aset; baris ini ter-wrap keras di sumber dengan kode. / Paragraf pembuka bab empat yang ter-wrap keras. |
| 20 | tidak ada hasil dapat-diperbaiki yang isError | PASS | 13 hasil diperiksa |
| 21 | rahasia tidak keluar | PASS | 13 hasil diperiksa |

- Perbaikan sesudah smoke: rentang cocok persis/samar yang dimulai tepat sesudah escape Markdown `\` kini ikut membawa `\` (tidak meninggalkan escape yatim di depan pengganti); uji `implw3-edit` +1 (11/11). Suite MCP segar: 18 berkas, 255/255.

## Changes Made

| File | Change Type | Description |
|---|---|---|
| scripts/studio/mcp/outcome.ts | add | `isGenuineFailure`, `hintFor` (butir 1) |
| scripts/studio/mcp/write-match.ts | add | pencocokan bertingkat (persis/tanpa markah/samar), `exactView`, `hasPunct`, penargetan section/cell, jendela unik, kandidat (butir 2, 14a/b) |
| scripts/studio/mcp/write-normalize.ts | add | kelonggaran skema `studio_write`/`studio_edit` (butir 3, 14c alias) |
| scripts/studio/mcp/write-position.ts | add | alamat posisi pid + offset + expect, `paragraphsOf` (butir 14c) |
| scripts/studio/mcp/smoke-implw3.ts | add | smoke DEV pola gagal r5 + DOCX |
| scripts/studio/mcp/server.ts | modify | `isError` hanya untuk `genuineFailure` |
| scripts/studio/mcp/tools.ts | modify | `executeTool`: `prepare`, `code`/`hint`, `genuineFailure`; `studio_document_get` view=paragraphs + `normalizeDocumentGetArgs`; `studio_file_verify` memakai `headWithRetry` |
| scripts/studio/mcp/tool-kit.ts | modify | `ToolDef.prepare`, `headWithRetry`, `VERIFY_RETRY_MS` |
| scripts/studio/mcp/write-tools.ts | modify | skema (meta 2000, `{ref}`, `unit`, edit section/occurrence/cell/pid), `incomplete`, `applyOwnTitle` (META_CONFLICT), `assertShape` urutan kunci bab, posisi -> cari-ganti, deskripsi `studio_edit` |
| scripts/studio/mcp/write-content.ts | modify | `normalizeOptionalFields`, status Indonesia, `paragraphLines` wrap keras, `{subheading}`/`{ref}`, `arrangeRefs`, `missing` |
| scripts/studio/mcp/write-edit.ts | modify | satuan ber-section/baris/kolom, `locate` via `findText`, `applyEdits` cell/section/occurrence/samar |
| scripts/studio/mcp/write-client.ts | modify | alias meta ternormalisasi, `shortRev`, lembar kendali `fit`, isu terkumpul, `stripCaptionPrefix`, sumber tidak dikarang, satuan dari agen, `planChapters`, sub-judul tanpa nomor sumber, bagian kosong dilewati |
| scripts/studio/mcp/write-client-edit.ts | modify | satuan ber-section/baris/kolom, `findText`/`findCell`, posisi, sisipan `parseInline` |
| scripts/studio/mcp/write-client-run.ts | modify | `INCOMPLETE`, `emptySections`, `headWithRetry` |
| tests/unit/studio/mcp/implw3-*.test.ts (5) | add | outcome 6, builder 13, client-builder 10, edit 11, lenient 5 |
| tests/unit/studio/mcp/{implw-write,implw2-client,implw2-security,mcp-d4-security,mcp-doc-tools,mcp-fig03b-figure-tools,mcp-server}.test.ts | modify | asersi disesuaikan dengan perubahan perilaku yang disengaja (isError, SECTION_MISSING -> INCOMPLETE, sumber, satu CONTENT_INVALID) |
| docs/STUDIO-MCP.md | modify | §4.1, §5.x, §5.y baru |
| scripts/studio/studio-report.ts | - | tidak diubah (tidak perlu) |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | Daftar kode "kegagalan nyata" | SECRET_MISSING, INTERNAL_ERROR, REMOTE_UNREACHABLE/TIMEOUT/BAD_RESPONSE/REDIRECT/UNAUTHORIZED/ERROR, WRITE_INTERRUPTED, USAGE_ERROR, HTTP >= 500. Semua lainnya (termasuk RATE_LIMITED) = hasil normal. Berlaku untuk SEMUA alat (bukan hanya `write`) |
| 1 | Uji lama yang mengasersi `isError: true` untuk penolakan dapat-diperbaiki | Diubah ke `isError` falsy + `data.ok === false` (12 asersi, 6 berkas). Jalur uji di luar `implw3-*` disentuh karena perilaku yang diuji memang diubah brief |
| 4 | Akar positif palsu CONTENT_INJECTION | Bukan cacat pembanding semata: konverter memindah `Verdict`/`CardIds` tak sah ke pembuka bab 1 dan memotong `TaskRef`/`Initiator` berspasi; ditambah urutan bab. Dinormalkan sebelum konversi + urutan harapan; pembandingan persis judul + paragraf dipertahankan |
| 6 | Server tiruan selalu COMPLETE | "tanpa render" untuk INCOMPLETE dibuktikan di smoke DEV (langkah 1: render tidak), bukan di uji tiruan |
| 8 | Bagian tanpa nomor tanpa nomor bebas (mis. "Ringkasan" sebelum "1. Pendahuluan") | Dipilih: menjadi sub-bagian bab di sebelahnya (`SECTION_NESTED`), nomor eksplisit tidak pernah digeser. Alternatif (kunci huruf) ditolak karena dirender sebagai "Lampiran" |
| 8 | Aturan nomor sub-judul | Mesin menomori (N.M); nomor sumber bertingkat di awal sub-judul dibuang, didokumentasikan di §5.y |
| 10/12 | Gerbang DATUM-09/DATUM-10 server menolak tabel angka tanpa satuan dan tabel/gambar bercaption tanpa sumber untuk pemanggil agen (by-construction; `x.lintEnforcement` dibuang untuk INTERNAL_AGENT, D-98) | Tidak dapat "diterima dengan pemberitahuan" tanpa perubahan mesin/kontrak (di luar lingkup). MCP: tidak mengarang sumber/satuan; satuan dari caption/unit blok -> metadata `unit` kolom (tanpa kolom baru); sisanya SATU hasil normal `CONTENT_INVALID` berisi semua tabel/gambar yang kurang. **needs-review**: keputusan pengguna apakah gerbang DATUM-09/10 untuk agen diturunkan ke release |
| 14c | Offset posisi pada laporan kerja | Offset atas teks polos paragraf (R20); diterjemahkan ke cari-ganti jendela >= 3 kata di bab paragraf itu, lewat pagar yang sama (reguard + assertEditShape). Paragraf bermarkah di dalam jendela ditulis ulang polos (`MARKUP_DROPPED`) |
| 7 | META_CONFLICT pada laporan sendiri | Diserap hanya bila konflik cuma `title`, dokumen ditemukan lewat mission + docKey, dan pemilik = pemanggil (guard + `checkOwnership`); setMeta berbasis revisi terkini lalu kirim ulang sekali |

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| "Terima tabel tanpa sumber/satuan dengan pemberitahuan" (butir 10/12) tidak tercapai penuh | 1 (probe R08 DEV: tanpa sumber -> DATUM-10, tanpa satuan -> DATUM-09, `columns[].unit` -> valid) | Gerbang by-construction server untuk pemanggil agen; override dokumen dilarang (D-98) | MCP melaporkan SEMUA yang kurang dalam satu hasil normal; satuan dari caption/unit blok dipakai sebagai metadata kolom | Tidak untuk baris ini; perlu keputusan pengguna (needs-review) |
| L-5 / S2-2 (review 13) | 0 | Di luar lingkup W3 | Tidak berubah (tetap Low tercatat) | Tidak |

## Next Steps

- Keputusan pengguna: gerbang DATUM-09/DATUM-10 untuk dokumen agen (tetap block, atau turunkan ke release lewat profil templat oleh ADMIN). Bila diturunkan, MCP cukup mengubah isu `SOURCE_MISSING`/`TABLE_UNIT_MISSING` menjadi peringatan.
- Review keamanan disarankan (cakupan: `write-match.ts`, `write-normalize.ts`, `write-position.ts`, `outcome.ts`, `applyEdits`/`applyClientEdits` baru, `applyOwnTitle`, `paragraphsView`, kait `prepare`), terutama: samar tidak pernah > 1 sasaran tanpa `occurrence: "all"`, posisi lewat reguard + assertEditShape, kandidat di blok tak tepercaya.

Smoke DEV diulang pada kode akhir (sesudah perbaikan escape): `smoke-implw3.ts` exit 0, ok true, 13 panggilan, 21/21 langkah PASS (tabel di atas berasal dari jalan pertama dengan hasil identik).

## Test Results (segar, kode akhir)

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | 0 galat |
| Lint | `npx eslint <26 berkas tersentuh>` | exit 0 | 0 galat, 0 peringatan |
| MCP | `npx vitest run tests/unit/studio/mcp` | 18 berkas, 255/255 lulus | termasuk 5 berkas implw3 (45 uji) dan semua uji injeksi review 13 (implw2-security, implw2-cycle2, mcp-d4/d5) |
| Unit studio penuh | `npx vitest run tests/unit/studio` | 208 berkas, 4.051 lulus / 1 lewati / 0 gagal | durasi ~207 s, exit 0 |
| Merah (HEAD) | `git checkout HEAD -- scripts/studio/mcp/` lalu `vitest run implw3-*` | 39 gagal / 5 lulus dari 44 | kode dipulihkan dari cadangan, `diff -r` identik |
| Smoke DEV | `npx tsx scripts/studio/mcp/smoke-implw3.ts` (127.0.0.1:9021, mission 2026-11-03_implw3) | 21/21 PASS, exit 0 | dua jalan, hasil identik; rahasia hanya di env |

## Verification

- Butir 1: tidak ada hasil dapat-diperbaiki yang `isError` (smoke langkah 20: 13 hasil diperiksa; uji `implw3-outcome` 3 penolakan berturut-turut tanpa `isError`); 5xx/SECRET_MISSING/tak terjangkau tetap `isError`; log stderr tetap `ok:false` + `code`.
- Butir 2/14: sel status 20x lewat `cell` (smoke 3), kata tunggal ambigu -> kandidat `cell` (smoke 4), samar `FUZZY_MATCH` (smoke 5), tanda baca persis (smoke 6), posisi + `POSITION_MISMATCH` (smoke 8-9).
- Butir 3/4/6: tulis pertama kurang bab + meta tambahan + varian blok + vonis/kartu -> INCOMPLETE tanpa render (smoke 1).
- Butir 5/8-13: satu hasil normal berisi semua isu sumber/satuan (smoke 10); DOCX: "4.1 Product concept" tanpa "1.1", "Tabel 4.1"/"Gambar 6.1"/"Tabel 6.1" (nomor eksplisit), caption tidak dobel, tanpa "Diolah oleh"/"Compiled by", "Rev 0" + teks revisi penuh, wrap keras digabung (smoke 14-19).
- Butir 7: verifikasi sesudah render tanpa 404 (smoke 13), META_CONFLICT judul sendiri dan HEAD 404 x2 dicoba ulang (uji `implw3-lenient`).

## Siklus perbaikan 1 (D-539, review 13 bagian IMPL-W3 = CAUTION)

### Merah -> hijau

Uji baru `tests/unit/studio/mcp/implw3-cycle1.test.ts` (probe p13-p16 dan D8 sebagai uji; server tiruan klien dengan penulis per bagian di R15: `implw3-client-mock.ts`, disalin dari `client_mock.ts` probe). Sebelum perbaikan: **12 gagal / 0 lulus** (12). Sesudah: **12/12 lulus**.

| Temuan | Uji | Perbaikan | Status |
|---|---|---|---|
| W3-M1 (Medium) | N1 (hanya Ringkasan), N2 (semua kecuali Rincian kerja): butir 2 -> 2, bukti 2 -> 2, bab 2 tidak berubah, `missing` [] (server), tidak ada POST record | `write-tools.ts` `rewriteOwnReport`: laporan yang sudah ada -> pagar pemilik sama (`guardReportSubmit`), baca R20 (basis), kirim hanya bab di masukan yang berbeda lewat jalur update ber-basis (`sections`), record hanya bila Rincian kerja ada di masukan (`RECORD_KEPT`), pagar record jalur update berlaku; `missingAgainstServer` | TERTUTUP |
| W3-L1 | Q5: pid `p-pos0` bermarkah vs kembar polos -> yang berubah `p-pos0` | `positionToFind` memberi `target {plain, nth}` (urutan paragraf ber-teks-polos sama di bab); `applyEdits` memilih satuan ke-nth itu dan mencari `find` hanya di dalamnya; tak terpetakan -> `POSITION_MISMATCH` | TERTUTUP |
| W3-L2 | Q1 (laporan) dan Q7 (klien) -> `POSITION_INVALID`, 0 tulis, tanpa surrogate yatim | `resolvePosition` menolak batas di antara surrogate tinggi/rendah | TERTUTUP |
| W3-L3 + S2-1 | K2: blok kode tetap `monoBlock` (find tingkat polos tidak lagi mengenai kode -> TEXT_NOT_FOUND); D1 paragraf -> daftar -> `CONTENT_INJECTION`, 0 POST | blok kode berpagar `noPlain` + selalu irisan mentah (`write-edit.ts`); `assertEditShape` membandingkan urutan jenis blok bukan paragraf per bab | TERTUTUP |
| W3-L4 + S2-2 + L-5 | T1: tulisan pihak lain di bab 3 tetap; laporan: bab 3 terakhir ditulis pihak lain -> `PART_CHANGED_BY_OTHER`, 0 POST; D8 klien: sel `99` pihak lain tetap, `PART_CHANGED_BY_OTHER` | `write-parts.ts` baru (`partWriters` R15, `requireOwnParts`) dipakai `rewriteOwnReport` dan `writeClient` (bagian yang isinya berbeda dari server); `applyOwnTitle` (kirim ulang sesudah META_CONFLICT) dihapus: judul baru -> setMeta dengan `baseRevisionNo` = revisi yang dibaca | TERTUTUP (lihat catatan) |
| W3-I2 | samar `tim riset` atas `title` + `author` -> TEXT_AMBIGUOUS; `occurrence: "all"` mengganti keduanya; salinan persis tetap diganti bersama | `sameCopies` hanya untuk tingkat persis | TERTUTUP |
| W3-I1 | penolakan identik ke-3 -> `hint` "berhenti mengulang; ubah isi atau tanya controller"; 429 -> `retryAfterSec: 12` (Retry-After); tidak `isError` | `McpSession.noteOutcome` (alat + kode + sasaran; sukses me-reset), `executeTool` (`repeated`, `retryAfterSec`) | TERTUTUP |

Catatan W3-L4: cek per bagian bergantung pada penulis per bagian di R15. Server DEV memberinya (diperiksa: `GET .../completeness` dokumen smoke -> slot `controlSheet`/`signature`/`record` `lastFilledBy` dan bab `present[].by` = `agent:cod-implw3`; `cover` null pada dokumen klien). Penulis tidak diketahui (null, data lama) tidak menolak; `baseRevisionNo` server tetap menjaga tulisan sesudah pembacaan.

### Ulang probe peninjau (kode akhir)

| Probe | Sebelum (review) | Sesudah |
|---|---|---|
| p16 N1/N2 | butir 2 -> 0, bukti 2 -> 0 | butir 2 -> 2, bukti 2 -> 2, tabel bab 2 tetap (probe memakai agen `cod-implw` sementara penulis bagian di server tiruan `cod-r3-f2`, jadi kini `PART_CHANGED_BY_OTHER`, 0 tulis; dengan penulis konsisten lihat uji N1/N2: ok, data tetap) |
| p14 Q1 / Q7 | emoji rusak / surrogate yatim | `POSITION_INVALID`, teks utuh |
| p14 Q5 | paragraf kembar berubah | `["Hasil uji gagal semua kasus.", "Hasil uji lulus semua kasus."]` |
| p14 Q2/Q3/Q4/Q6 | aman | sama (INVALID_ARGUMENT, POSITION_MISMATCH, pengganti tetap teks, TEXT_NOT_FOUND) |
| p15 K2 | kode -> paragraf | `TEXT_NOT_FOUND`, `monoBlock` utuh; K1/K3 tetap mengubah isi kode di dalam `monoBlock` |
| p13 T1 | `otherKept: false` sesudah META_UPDATED | `PART_CHANGED_BY_OTHER` sebelum POST apa pun (probe: agen beda penulis bagian); uji T1 dengan penulis konsisten: tulisan pihak lain tetap |
| p13 O1/L1 | PASS | sama |
| p10 D1 daftar/bernomor | daftar terbentuk (S2-1) | `CONTENT_INJECTION` "jenis blok berubah (- -> list)" |
| p10 D2/D4-D9, D7 | PASS | sama |
| p10 D8 (mock probe tanpa penulis per bagian di R15) | sel `99` tertimpa | tetap tertimpa DI MOCK ITU karena R15-nya tidak memuat penulis; dengan R15 berpenulis (seperti DEV) uji D8 -> `PART_CHANGED_BY_OTHER`, sel tetap |

Keluaran lengkap: `C:\Users\TRIAL\AppData\Local\Temp\claude\w3\ev\probes_cycle1.txt`.

### Uji lama yang disesuaikan (perilaku yang disengaja)

- `implw-write.test.ts` "tulis kedua atas laporan sendiri": pemanggil = agen penulis bagian di server tiruan (`cod-r3-f2`), target = mission/docKey dokumen seed (jalur update memeriksa `DOCUMENT_MISMATCH`), tabel butir memakai kunci R3F2-1/2 (pagar record menolak menghapus butir lama tanpa `~~hapus~~`, yaitu inti W3-M1).
- `implw3-lenient.test.ts` judul baru: sama (agen penulis bagian), kini lewat setMeta berbasis revisi yang dibaca.

### Perubahan berkas siklus 1

| Berkas | Jenis | Isi |
|---|---|---|
| scripts/studio/mcp/write-parts.ts | add | `partWriters` (R15), `requireOwnParts` -> PART_CHANGED_BY_OTHER |
| scripts/studio/mcp/write-tools.ts | modify | `rewriteOwnReport` (jalur update ber-basis, record dijaga, setMeta sebelum bab dengan basis = revisi yang dibaca, revisi akhir dilaporkan), `missingAgainstServer`, `applyOwnTitle`/`metaConflictFields` dihapus, `assertEditShape` jenis blok |
| scripts/studio/mcp/write-position.ts | modify | surrogate -> POSITION_INVALID; `target {plain, nth}` |
| scripts/studio/mcp/write-edit.ts | modify | `target` (pid tepat), blok kode `noPlain` + irisan mentah |
| scripts/studio/mcp/write-client-run.ts | modify | `requireOwnParts` sebelum tulis ulang dokumen klien |
| scripts/studio/mcp/write-client-edit.ts | modify | `sameCopies` hanya tingkat persis |
| scripts/studio/mcp/tool-kit.ts, tools.ts, outcome.ts | modify | `noteOutcome`, `REPEAT_HINT`/`REPEAT_LIMIT`, `repeated`, `retryAfterSec`, petunjuk POSITION_*/PART_CHANGED_BY_OTHER |
| scripts/studio/mcp/smoke-implw3.ts | modify | langkah W3-M1 (tulis ulang sebagian) |
| scripts/studio/mcp/smoke-write.ts, smoke-write-client.ts | modify | ekspektasi butir 6 (INCOMPLETE, bukan SECTION_MISSING) dan catatan `ok:false` + kode (sebelumnya hanya `isError`) |
| tests/unit/studio/mcp/implw3-cycle1.test.ts, implw3-client-mock.ts | add | 12 uji + server tiruan klien berpenulis per bagian |
| tests/unit/studio/mcp/implw-write.test.ts, implw3-lenient.test.ts | modify | lihat di atas |
| docs/STUDIO-MCP.md | modify | §5.y "Siklus perbaikan 1" |

### Gerbang (segar, kode akhir siklus 1)

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 |
| Lint | `npx eslint <16 berkas tersentuh siklus 1>` | exit 0, 0 masalah |
| MCP | `npx vitest run tests/unit/studio/mcp` | 19 berkas, 267/267 lulus (termasuk implw3-cycle1 12) |
| Unit studio penuh | `npx vitest run tests/unit/studio` | 209 berkas, 4.063 lulus / 1 lewati / 0 gagal, exit 0 |
| Smoke DEV IMPL-W3 | `smoke-implw3.ts` | ok, 17 panggilan, 22/22 PASS (termasuk W3-M1: tulis ulang sebagian -> `written: bab 1`, butir record 20, `RECORD_KEPT`, missing kosong) |
| Smoke DEV laporan (IMPL-W) | `smoke-write.ts --mission 2026-11-03_implw3` | ok, 9/9 PASS |
| Smoke DEV klien (IMPL-W2) | `smoke-write-client.ts --mission 2026-11-03_implw3` | ok, 10/10 PASS (DOCX: nomor meta di sampul, Tabel 2.1/2.2, Gambar 6.1, sunting tercetak) |

Catatan jujur smoke: jalan berurutan pertama (tiga smoke beruntun) memberi smoke-write 5/9 dan smoke-write-client 1/2. smoke-write gagal karena revisi yang dilaporkan `studio_write` belum memuat setMeta judul (diperbaiki: setMeta dipindah sebelum kiriman bab dan revisi akhir dilaporkan), lalu `basisRevisionNo` edit berikutnya tidak cocok. Penyebab kegagalan langkah pertama smoke-write-client pada jalan itu tidak tercatat (catatan smoke lama hanya mencetak `isError`); kemungkinan batas laju sesudah dua smoke beruntun (hipotesis). Catatan smoke diperbaiki untuk mencetak `ok:false` + kode, lalu kedua smoke lama dan smoke IMPL-W3 diulang pada kode akhir: semua PASS.

### Status siklus 1

W3-M1, W3-L1, W3-L2, W3-L3 (+S2-1), W3-L4 (+S2-2, L-5 untuk jalur tulis ulang `studio_write`), W3-I1, W3-I2: diperbaiki dengan uji merah -> hijau. Sisa: cek per bagian bergantung penulis per bagian dari R15 (tersedia di DEV); bagian berpenulis null tidak ditolak (tetap dijaga `baseRevisionNo`). Keputusan DATUM-09/10 (needs-review) dari siklus awal tetap terbuka. Re-cek keamanan disarankan untuk `write-parts.ts`, `rewriteOwnReport`, pemetaan pid (`target`), dan pembatas ulang.

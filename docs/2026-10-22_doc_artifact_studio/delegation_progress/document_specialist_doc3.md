# Catatan document-specialist DOC-3 (batch Hermes; D-321..D-331)

Status: complete. Tanggal 2026-10-30. Skill: document-quality-standards (modul D, E, F, H). Klaim DOC-3 di `file_claims.md` (ditulis atomik). Semua edit atomik: pola diganti di memori dengan assert tepat-satu lalu berkas sementara + `os.replace` (`C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc2/atomic_apply.py`); skrip edit di `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc3/`.

## Berkas
| Berkas | Ukuran | Perubahan |
|---|---|---|
| `docs/STUDIO-AGENT-GUIDE.md` | 97.605 B | §1.1 alur cepat agen pengguna; §3 `datum-gsp` v3 (rel framePr, TOC bernomor) + contoh R14 `templateVersion`; §4 tabel blok (role, rail); §4.2 baru peran paragraf + rel + contoh; §5.3 H2 409 `PATCHED_PIDS_OVERWRITTEN` + contoh + alur pulih + R08; §5.4 bentuk `CoverPayloadV2`, cara mencari skema, contoh sampul (kolofon, identityString); §5.5 isu R08 membawa `details`; §5.6 baru importer Markdown (badan, respons, `?validate=1`, CLI, konvensi, penanda, contoh MD); §5.7 baru gerbang D16/D17/D18; §8 `partial`/`failedFormats`/`errors`/header + §8.0 baru 503 preflight + urutan galat; §10 nama/alt figur dari caption, dekoratif, tinggi minimum chart; §12 baris 404 `ROUTE_NOT_FOUND`, 405, 409 `SCOPE_CONFLICT` reason, 503 preflight; §16 catatan 405/404 + baris importer |
| `docs/API-REFERENCE.md` (§12 saja) | 34.740 B | paragraf baru: render (preflight 503, partial, header, urutan), path/metode salah (ROUTE_NOT_FOUND, 405), kiriman yang menimpa PATCH (409); baris R07, R09, R17, R08 (`details`), baris baru importer |
| `masterplan/03_structural_sections_specs.md` | 139.338 B | §11.1 amandemen DOC-3 (ROUTE_NOT_FOUND/405, overwrite 409, urutan preflight); §11.3 contoh details overwrite + preflight; §12 R07, R09, R17, R08, baris importer |

## Peta cakupan (8 butir wajib)
| Butir | Lokasi panduan | API / register |
|---|---|---|
| H1 503 preflight, urutan 401→404→503, partial/failedFormats/errors + `X-Studio-Render-Status` R17/R09/R07 | §8, §8.0, §12, §1.1 | API paragraf render + R07/R09/R17; register §11.1 (c), §11.3, R07/R09/R17 |
| H2 409 `PATCHED_PIDS_OVERWRITTEN` + `overwrittenPids`, alur pulih, R08 | §5.3, §5.5, §12, §1.1 | API paragraf kiriman + R08; register §11.1 (b), §11.3, R08 |
| H4 `rail` + framePr `datum-gsp` v3, TOC bernomor (statis + PAGEREF), pindah versi R14 | §3, §4.2 | (perilaku templat; tanpa perubahan kontrak) |
| H5 role `identity`/`closingAction`/`anchor`/`pivot`, `rail`, issueStampColophon, D16/D17/D18 + NOT_APPLICABLE, `CoverPayloadV2` + cara cari schemaId | §4.2, §5.4, §5.7 | register E36 sudah 8 nilai |
| H6 404 JSON `ROUTE_NOT_FOUND` + hint, 405 + metode tiap route | §12, §16 | API paragraf path/metode; register §11.1 (a) |
| H7 importer + CLI, konvensi MD, penanda (`[PUBLIC-SOURCE]`→TERUKUR, `[VENDOR]`→PEMASOK, sisanya `UNMAPPED_MARKER`), `?validate=1` | §5.6, §1.1, §16 | API + register baris importer |
| H8 nama/alt dari caption, dekoratif, tinggi minimum chart | §10 | - |
| Kuota validate R08 120/60 s | §5.5 (D-291), §5.6 | API/register (D-291) |

## Klaim vs kode
| Klaim | Sumber | Cocok |
|---|---|---|
| 503 `PDF_ENGINE_UNAVAILABLE`, pesan, `details`, Retry-After 300, 12 kode penyebab | `services/render/preflight.ts:30-35`, `:37-50`, `:59-74`, `:76-78`, `:192-213`, `:235` | ya (uji: contoh = `pdfNotReadyDetails()` byte-JSON) |
| Urutan R17 404 → 503 (format eksplisit), bawaan: 404/409/422 → 503; R07 404/409 → 503 | `render/_lib/handler.ts:8`, `:131-140`; `scope.ts` (kepala); `coder_execution_fixhz1.md` | ya |
| `partial`, `failedFormats`, `errors`, header R17/R07/R09 | `handler.ts:19-21`, `:164-180`; `preflight.ts:271-282`; D-325, D-331 | ya |
| 409 overwrite: pesan, `details`, `forwardToController` | `services/submit/overwrite.ts:319-359` | ya (uji: `overwriteForwardText()` identik) |
| R08 isu membawa `details` | `validate/_shared/error-issues.ts` (D-331) | ya (catatan FIX-HZ1) |
| `ROUTE_NOT_FOUND` + hint, di luar 68 kode, catch-all GET/POST/PATCH/DELETE | `http/route-not-found.ts:9-22`, `:70-200`; `[[...notfound]]/route.ts` | ya (uji) |
| Metode tiap route (§16) | ekspor `src/app/api/studio/**/route.ts` | ya (uji: 22 baris = ekspor) |
| Importer: badan, respons, `?validate=1`, galat, CLI, kode keluar | `import/markdown/route.ts:1-17`; `scripts/studio/md2chapter.ts:1-18` | ya |
| Penanda rel importer | `services/import/markdown.ts:64-86` | ya (uji probe) |
| `TABLE_SOURCE_MISSING` | importer (uji probe) | ya |
| 8 role paragraf | `contract/enums.ts:388` | ya (uji) |
| Role retoris dicetak sama dengan body | `engine/docx/blocks/text.ts:68-75` | ya |
| D16 issueStampColophon dari `cover.colophon`, NOT_APPLICABLE rel mati; D17 identityString/identity; D18 closingAction; tier TERBIT/SERAH | `engine/lint/structure/checks-d.ts:455-463`, `:523-591`; `registry/lint.ts:418-427`; `registry/sections.ts:666-684` | ya (uji) |
| `CoverPayloadV2` medan; `$defs` payload; schemaId `common/v2` dilayani | `schema/v2/common.schema.ts:535-551`, `:564-636`; `registry/route.ts:85-87` | ya (uji) |
| `datum-gsp` v3 framePr | `prisma/seed-studio.ts:452`, D-327, D-329 | ya |
| TOC PAGEREF mode statis | D-327; `coder_execution_fixh4.md` | ya |
| Nama figur maks 80, label — caption, alt, dekoratif | `engine/front/alt-text.ts` (dipindah FIX-HR2 C4; dulu `engine/docx/figures/`); D-330 | ya |
| Tinggi minimum 32 mm, n <= 3 | `engine/chart/core/datum.ts:30-37` | ya |

## Bukti
`verify_doc3.ts` (`C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc3/`, perluasan `verify_doc2.ts`, dijalankan `npx tsx` dari root repo): exit 0, 132 PASS, 0 FAIL, "SEMUA LULUS" (`doc3/verify.txt`). Isi baru: 16 contoh panduan lolos (10 skema isi, 2 pid-patch, 2 render, 2 structure-patch lewat `parsePatchStructureBody` termasuk contoh `templateVersion` baru), 2 contoh DITOLAK sesuai checkId; contoh Markdown lolos importer (`valid`, 0 peringatan, `submission` lolos validator v2); probe penanda importer; contoh 409 dan 503 identik dengan keluaran fungsi layanan; enum role; tabel metode = ekspor route; konstanta H8; seed framePr; medan `CoverPayloadV2`; logika D16-D18; semua cek DOC-1/DOC-2 tetap hijau; tanpa emoji. Satu kegagalan antara diperbaiki (urutan kunci `causes` di contoh 503).

## Temuan untuk controller
1. Catatan `file_requests.md` FIX-H1 menyebut "503 mendahului 404"; sudah digantikan D-331 (404 dulu). Dokumen mengikuti D-331.
2. Route catch-all tidak mengekspor `PUT`; `PUT` ke path yang tidak ada kemungkinan dijawab 405 tanpa badan, bukan 404 JSON (hipotesis dari ekspor, belum diuji). Masuk ke IP-100 (JSON 405).
3. Importer `md/v1` tidak menetapkan role retoris; panduan meminta agen menambah `role` di JSON hasil. Bila diinginkan konvensi Markdown untuk `identity`/`closingAction`, itu perubahan importer.
4. Contoh respons 503 memakai `checkedAt` ilustratif; contoh 409 memakai id dokumen contoh panduan.

## DOC-3b (D-335..D-337)
- Urutan galat render seragam untuk `formats` apa pun: 401 → 404 → 409 `DOCUMENT_INCOMPLETE`/422 → 503 preflight (R17, R07; `render/_lib/handler.ts:10-14`); teks lama bergantung format dihapus di panduan §8.0, API, register §11.1 (c). R09 TIDAK memakai gerbang PDF (`assertPdfRenderReady` hanya di `services/render/scope.ts` dan `services/revisions/index.ts`; FIX-HR2 catatan baris 85), jadi brief "(R17, R07, R09)" ditulis sebagai R17 + R07, R09 tanpa gerbang.
- `ROUTE_NOT_FOUND` anggota enum (`contract/enums.ts:332`, `errors.ts:94` 404); 69 kode (dihitung `STUDIO_ERROR_CODES.length` = 69); catch-all mengekspor PUT dan HEAD (`[[...notfound]]/route.ts:30-35`); panduan §12/§16, API, register (+ AC-5 dicatat 69).
- Importer: role lewat `<!-- role: X -->` (`services/import/markdown.ts:143-152`), peringatan `ROLE_UNKNOWN`/`ROLE_MARKER_UNATTACHED`/`ROLE_MARKER_INLINE`; batas 413 + `details.reason` (`markdown.ts:63-79`, `:514`, `:681-704`); ember impor 60/60 s (`import/markdown/_lib/import-rate.ts:11-19`); `?validate=1` `details` ikut (route kepala). §1.1 langkah 1 kini memakai komentar role + penanda rel (tanpa sunting JSON); contoh MD §5.6 memuat `<!-- role: closingAction -->`.
- D16 NOT_APPLICABLE hanya bila nilai mati berasal dari lapis ADMIN (D-335): panduan §5.7, register §11.1 (d).
- Bukti: `verify_doc3.ts` exit 0, 140 PASS, 0 FAIL (cek baru: konstanta batas, ember impor, peringatan role + probe importer, alur cepat, urutan seragam di tiga dokumen, PUT/HEAD, D16 lapis ADMIN, 69 kode, contoh MD menghasilkan `role: closingAction`). Tulis atomik.

## DOC-4 (D-340..D-352; review DOC-3 + uji ulang Hermes)
- M-1: §1.1 langkah 1/3 menyebut bentuk `target` (misi baru `{ mission: { folder }, docKey }` + `template` + `meta.title`, lalu `{ documentId }`), `400 META_REQUIRED_FOR_CREATE`, contoh badan importer bab pertama (diuji: importer + validator v2, amplop memuat template/meta), CLI `--template <slug[@versi]>`/`--doc-title`/`--doc-key` (`scripts/studio/md2chapter.ts:6-21`); `--mission` tanpa `--doc-key` dan tanpa `--template` → `DOC_TARGET_AMBIGUOUS`.
- S4: §1.1 langkah 8 badan op struktur tanpa `$schema`/`target` + contoh `setMeta` (diuji `parsePatchStructureBody`).
- m-1: urutan render lengkap 401 → 400 → 429 → 503 antrean → 404 → 409/422 → 503 preflight (`render/_lib/handler.ts:5-14`) di panduan §8.0, API, register.
- m-2: baris §12 413 (importer, `MD_*`, pecah bab) dan 429 (validate 120/60, impor 60/60).
- m-3: `OPTIONS` catch-all (`[[...notfound]]/route.ts:36`) di tiga dokumen.
- m-4: §5.3 pemicu overwrite + `renumberChapters` (R14) + kiriman dokumen bertarget (R04).
- m-5: contoh 503 memakai pesan Indonesia `PDF_NOT_READY_MESSAGE` (`preflight.ts:33`); kalimat bentuk galat §12 dijujurkan (pesan yang dijelaskan berbahasa Indonesia, sebagian pesan validasi teknis masih Inggris; teks awam di `details.reason`/`forwardToController`/`hint`).
- R20 `?shape=submission` + `submitTo` + `editHints` + aturan `text` ATAU `runs` di alur pulih §5.3 (`services/structure/submission.ts:23-36`), API dan register R20.
- Rel K2 rev B (hanya inang chip menyempit, G-RAIL-3) di §4.2; TOC section + lampiran ber-PAGEREF, `toc.levels` bawaan 2 sebagai parameter templat slot `toc` (kelas/lapis belum ditulis, menunggu FIX-TL; kini hanya `paramRefs` di `registry/sections.ts:76`).
- Resep penanda Hermes di §5.6 (`[ASSESSED]` → `[ASUMSI]` + landasan atau `[DITURUNKAN]`; `[EXECUTED-DOC]` → `[SUMBER: ...]`; `[GSP-STATEMENT]` → `[CATATAN: Pernyataan GSP: ...]`), diuji lewat importer (rel `mark`/`note`/`source` sesuai, 0 peringatan).
- Bukti: `verify_doc3.ts` exit 0, 156 PASS, 0 FAIL (18 contoh lolos termasuk badan importer dan op struktur baru). Tulis atomik.

## Penutup DOC-4 (D-355)
- `toc.levels` = R-66 lanjutan ADMIN, int 1..3, bawaan 2, `section:toc`, level 3 cadangan (`params/render.ts:325-334`, `registry/slots.ts:171`, `registry/essentials.ts:100`): panduan §3 + baris tabel kunci lanjutan §15; register §13.1 amandemen. Peran `toc.section*` (indentasi tingkat 2, 1 pt lebih kecil) dan `toc.appendix*` (hanya bila templat menyetel); `ROLE_KEYS` 76 dan `ALL_PARAM_COUNT` 788 (dihitung lewat tsx).
- Bukti: `verify_doc3.ts` exit 0, 159 PASS, 0 FAIL. Tulis atomik.

## Tutup review DOC-4 (D-357)
- n-1: §1.1 pembuka menyebut header `x-internal-secret` + `agentId` (tautan seksi 2) dan kuota importer 60/menit (5.6), validasi R08 120/60 s (5.5), kiriman/PATCH/render 30/60 s (13); keempat tautan diuji resolve ke judul yang ada.
- n-2: contoh CLI §5.6 kini dua baris (bab pertama dengan `--mission --doc-key --template --doc-title`, bab berikutnya `--doc-id`); register R20 kolom galat memuat galat `shape=submission` sesuai kepala `content/route.ts:24-29` (400 `/query/shape`, `/query/agentId`; 404 tiga kode; 422 `SLOT_UNKNOWN`, `SLOT_USE_CHAPTER_ENDPOINT`).
- Bukti: `verify_doc3.ts` exit 0, 162 PASS, 0 FAIL. Tulis atomik.

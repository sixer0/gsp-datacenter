# DC-34 Laporan document-specialist: API-REFERENCE seksi 12 (kontrak dokumen)

Status: complete. Berkas diubah: `docs/API-REFERENCE.md` seksi 12 saja (`git diff --stat`: 72 tambah, 20 hapus; semua hunk mulai baris 249, sesudah judul seksi 12 di baris 228). Kode tidak disentuh. Skill: `document-quality-standards` (A, D, E, F, H).

## Perubahan

- Paragraf Galat: 69 → 73 kode (`enums.ts` + `errors.ts`); urutan evaluasi menyisipkan langkah kontrak sesuai register 05 §5.6 (skema `checkId` CONTRACT_*; struktur 422 `CONTRACT_ITEM_KEY_DUPLICATE` sebelum kunci; rujukan dalam transaksi 422 EC25/EC26 + peringatan CW-01; by-construction 422 EC28). Rujukan `ROUTE_NOT_FOUND` 69 kode diperbarui.
- Paragraf baru "Header kuota": dua header, empat bucket dan route-nya, tanpa header pada 401 dan penolakan pra-tagihan (R21/R22/R23 400/413/415), dua bucket = sisa terkecil, 429 = `0`, kiriman/PATCH menagih `render` tetapi header hanya pada 429 mereka (tidak dibungkus `withQuotaHeaders`; temuan dari kode, lihat Cek 3).
- Paragraf baru "Laporan kerja agen dan dokumen kontrak": EC25-EC28 (422, kondisi, `details`), `warnings` (SubmitResultV2, R08 `submitPreview`, PATCH R06/R14/R16; D-386, D-389), `finalFileName` di semua `OutputFileDto`, cara verifikasi berkas lokal (§10).
- Tabel: R03 `kind=contracts`; R05/R07/R09/R17 `finalFileName`; R06/R14/R16 PATCH `warnings?`; R08 `submitPreview.warnings?` + header kuota; R10 GET berubah (`?name=`, `X-Studio-Final-Filename` selalu, Content-Disposition nama final untuk dokumen ber-contractKind, 400 `/query/name`); baris baru R10 HEAD; R17 bawaan HTML dokumen ber-contractKind; import header kuota; baris baru R21, R22, R23. Catatan status kode ditambah butir 2026-10-30.
- Koreksi di luar daftar tugas tetapi dalam seksi 12, dari kode: respons R14 PATCH kini mencantumkan `rebased`, `baseRevisionNo`, `appliedOnRevisionNo` (`services/revisions/v2/service.ts:524-531`).

## Cek terhadap kode (bukti)

1. Tabel route = kode. Skrip `python -I dc34_check.py` (scratchpad): parse baris tabel seksi 12 (Endpoint, Metode) lawan regex `^export (const|async function|function) (GET|POST|HEAD|PATCH|PUT|DELETE|OPTIONS)` di setiap `src/app/api/studio/**/route.ts` (catch-all `[[...notfound]]` dikecualikan). Keluaran: `doc rows 37 code exports 37`, `in code not doc []`, `in doc not code []`.
2. Kode galat = enums.ts. Skrip `python -I dc34_codes.py`: `enum codes 73 http map 73`; keempat kode `enum True http 422`, masing-masing disebut 2x di seksi 12; `73 kode` 3x, `69 kode` 0x. Juga `grep` `enums.ts:345-348`, `errors.ts:96-99`.
3. Header kuota: `grep withQuotaHeaders|recordQuotaCharge` → dibungkus: artifacts POST, contracts, R17 handler, revisions, drafts/check, import, search, validate; `checkRenderRate` (`render-guard.ts:66-76`) menagih dan memasang header hanya pada 429 untuk route tak berbungkus (documents POST, chapters/slots `submit-kit.ts`, blocks, paragraphs, structure).
4. Bentuk tabel: semua baris R*/`-` tepat 7 kolom, paritas backtick genap (`dc34_cols.py`).

## Isu dan catatan

- Penempatan langkah rujukan kontrak (9a) ditulis sesuai register §5.6; FIX-C1 (paralel) mengubah urutan di kode. Bila FIX-C1 menyimpang dari §5.6, paragraf Galat perlu disesuaikan.
- Register QH-03 menyebut header pada setiap 4xx sesudah tagihan; dokumen menulis perilaku kode (400 R21/R22 ditolak sebelum tagihan, tanpa header).

Next: send to document-reviewer (DC-42).

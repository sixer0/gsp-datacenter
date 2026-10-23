# Catatan baris S01 (data-analyst)

Status: complete. Skills_to_Load: none. Klaim berkas sudah ditulis controller (`file_claims.md:8-9`).

## Berkas
- NEW `docs/2026-10-22_doc_artifact_studio/masterplan/01_specs.md` (15 bagian)
- NEW catatan ini

## Angka (Grep atas 01_specs.md)
- Model `^\| M0\d` = 9. Enum `^\| E\d\d` = 25 (prisma 11, ts 14). Path route R01-R11 = 11, baris metode 17.
- Berkas S03 `^\| T\d\d` = 81 = 51 stub + 30 lengkap. Stub (pola `T.. | path | Snn`) = 51.
- Section 51 = DOCUMENT 29 + PAGE_DEVICE 7 + CHANNEL 15. Regex key tanpa angka mendapat 50; selisihnya `slide.specTable3Col` (baris 556), dicek manual.
- Rollback: 20 pernyataan DROP (9 tabel, 11 tipe) + 1 DELETE `_prisma_migrations`.
- Klaster terpetakan `^\| KT?-\d\d \| n \| Unn` = 76 (36 + 40), tanpa medan = 0. Celah sekunder GS-01 (tcW/tblW ganda) dicatat dengan usulan medan.
- RoleKey 70, parameter renderer 25, konstanta/env 17, modul 43, CLI 7.

## Keputusan yang perlu dicatat controller (rinci di 01_specs.md §14.1)
1. Parameter renderer R-01..R-25 (`origin: contract`) di luar 673 katalog.
2. Route tambahan R02 `/api/studio/templates/[id]` (area S54).
3. S03 menulis lengkap `params/render.ts`, `registry/sections.ts`, `contract/auth.ts`, `contract/dispatch.ts`.
4. DB bayangan `gsp_agent_hq_v21_shadow` diperlukan untuk `--from-migrations` (`node_modules/prisma/build/index.js:3830-3831`). Migrasi = diff dikurangi baseline, karena diff mentah membawa drift IlSearchDoc (`schema.prisma:559-560`).
5. Nomor dokumen cadangan tanpa model ke-10 (advisory lock).
6. E2E IL (S80) butuh `SHARED_WORKSPACE` dan `STUDIO_WORKSPACE_ROOT` menunjuk sandbox yang sama.

## Temuan
- Dependensi dipin dari salinan terpasang lokal: ajv 8.20.0, fflate 0.8.3, playwright-core 1.62.1 (chromium 1234). Tanggal rilis npm tidak dapat diverifikasi alat agen ini. S03 wajib memeriksa dengan `npm view <paket>@<versi> time` (§10).
- `package.json:12` `db:migrate` = `prisma migrate dev`. Skrip ini terlarang menurut D-21; perlu catatan peringatan.
- Kalimat rollback §1.4 memuat frasa tanya yang canggung ("... rollback.sql? Tidak: ..."). Putusannya tetap jelas: rollback hanya di dokumen. Bisa dirapikan controller.

## Permintaan lintas pemilik
- Tidak ada `file_requests.md` baru. Permintaan S02 (komposit galeri, `data-mark`, drawn=false + alternatives + kode galat) sudah masuk §3.5 dan §5.3.

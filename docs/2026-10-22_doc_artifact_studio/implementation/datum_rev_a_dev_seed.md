# S34 - Seed DEV templat jenis dokumen DATUM Rev A (gsp_agent_hq_v21)

Tanggal: 2026-11-04. Pelaksana: controller. Basis: cetak biru `identification/02_structured_datum_rev_a.md` baris S34; D-596, D-605.

## Perintah dan hasil

| Langkah | Perintah | Hasil |
|---|---|---|
| Dry-run | `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run` | exit 0; database `gsp_agent_hq_v21`, `dryRun: true`; rencana 10 `created`; "Dry-run templat jenis dokumen selesai; transaksi di-rollback (0 tulis)" |
| Jalan nyata | `npx tsx prisma/seed-studio.ts --doc-type-templates` | exit 0; 10 templat `created`, `storedOk: true` semua; guard `ok: true`, `changedTemplates: []`, `addedTemplates: []`, `sectionTypesTouched: []` |
| Jalan ulang | perintah yang sama | exit 0; 10 templat `unchanged`, `storedOk: true`; guard ok |

Log mentah (tanpa rahasia): `C:/tmp/s34/dry.log`, `C:/tmp/s34/real.log`, `C:/tmp/s34/rerun.log`.

## AC-3: snapshot 7 templat lama

Dibandingkan dari log "Hitungan DB" dry-run (sebelum) dan jalan ulang (sesudah) per slug: (versions, latestVersionNo, paramsSha256). Hasil: `old changed: []`. Snapshot guard (slug, latestVersionNo, updatedAt, paramsSha256, skeletonSha256, versions) identik:

| Slug | Versi | paramsSha256 (awal) | updatedAt |
|---|---|---|---|
| datum-gsp | 3 | 21f4e1e7... | 2026-10-30T03:09:22.217Z |
| datum-gsp-preset | 2 | 21f4e1e7... | 2026-10-30T03:09:22.154Z |
| datum-kanonik | 6 | 7abfc5f7... | 2026-10-22T23:40:06.172Z |
| datum-kanonik-preset | 1 | 7abfc5f7... | 2026-10-22T23:40:06.060Z |
| datum-manual-000 | 4 | c901b47f... | 2026-10-23T02:38:17.694Z |
| datum-manual-000-preset | 2 | c901b47f... | 2026-10-23T02:38:17.629Z |
| laporan-kerja-agen | 1 | 8f98fb0f... | 2026-10-30T12:03:06.183Z |

Jumlah templat: 7 -> 17. Templat baru: datum-laporan, datum-laporan-en, datum-laporan-verifikasi, datum-laporan-verifikasi-en, datum-nota, datum-nota-en, datum-proposal-teknis, datum-proposal-teknis-en, datum-standar, datum-standar-en. Basis semua = `datum-gsp-preset` v2 (`cmvue8kfk0001v1usfrh1fb94`).

Catatan: layanan templat menulis baris info "Templat v2 dibuat" ke `data/studio-workspace/logs/templates/` DEV juga pada dry-run (log berkas, bukan DB).

## Seed ulang v2 (sesudah G-FIX 1, D-608)

| Langkah | Perintah | Hasil |
|---|---|---|
| Jalan nyata | `npx tsx prisma/seed-studio.ts --doc-type-templates` | exit 0; 10 templat `new-version` -> versi 2; guard ok, `changedTemplates: []` |
| Jalan ulang | perintah yang sama | exit 0; 10 templat `unchanged` versi 2; guard ok |

Log: `C:/tmp/s34/real2.log`, `C:/tmp/s34/rerun2.log`. Versi 2 memuat ambang zebra 1000 di lapis bersama (G-FIX 1). Perubahan mesin sesudahnya (klasifikasi kapital, lebar kepala halaman, potong batas kata) adalah kode, bukan data templat; dry-run S40 memastikan 10 templat tetap `unchanged` v2.

## Seed ulang v3 + preset Rev A (ronde cakupan, D-643)

| Langkah | Perintah | Hasil |
|---|---|---|
| Fresh-seed `_uji` (C24) | `node tests/integration/studio/uji-run.mjs fresh-seed` | exit 0; `doc-type-templates created: OK`, `doc-type-templates unchanged: OK`; preset `datum-gsp-rev-a-preset` created dengan pin 7,8/6,8/7,6/0,09 |
| DEV nyata (C30) | `npx tsx prisma/seed-studio.ts --doc-type-templates` | exit 0; preset `datum-gsp-rev-a-preset` created v1; 10 templat `new-version` v3 berbasis preset Rev A; guard ok, `changedTemplates: []`, `addedTemplates: []` |
| DEV jalan ulang | perintah yang sama | exit 0; preset dan 10 templat `unchanged` (v1 / v3); guard ok |

Log: `C:/tmp/c24_fresh.log`, `C:/tmp/s34/real3.log`, `C:/tmp/s34/rerun3.log`.

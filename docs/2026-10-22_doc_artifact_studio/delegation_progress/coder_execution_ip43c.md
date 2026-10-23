# IP-43c coder-execution: S85 R-22 seed-studio (status: complete)

Skills: dry-run-verify-fix. Berkas: `prisma/seed-studio.ts` (area eksklusif, klaim IP-43c). DB: `gsp_agent_hq_v21` (DATABASE_URL dicek tanpa password; seed memeriksa `current_database()`).

## Perubahan
- `findUnregisteredSectionTypes`: setelah upsert, baris `StudioSectionType` dengan `key` di luar `SECTION_REGISTRY` dilaporkan (warn: key, group, registryVersion) + hitungan `unregisteredSectionTypes` di log "Seed Studio selesai". Tidak ada penghapusan (KD-02).
- `REPO_ROOT = path.resolve(__dirname, "..")` (tsx menjalankan berkas sebagai CJS; package tanpa `"type": "module"`); `repoPath()` untuk profil benchmark (`--import-benchmark`, `--import-datum-gsp`), berkas sampel dan `assetIndexPath` (`--import-samples`).
- cwd proses dipindah ke `REPO_ROOT` bila berbeda (dicatat `invokedFrom`), agar default pustaka yang relatif cwd (`getStudioEnv` STUDIO_WORKSPACE_ROOT, aset kanonik `assets.ts`, fallback aset ingest) sama dengan run dari akar repo. Dari akar repo: no-op, perilaku flag lain tidak berubah.
- Log selesai memuat `repoRoot`, `invokedFrom`, `benchmarkProfile {path, found}` (cek baca, tanpa menulis).

## Penjaga (D-133)
- `npx tsc --noEmit -p tsconfig.json`: exit 0, 0 galat (seed-studio.ts termasuk di program, `--listFilesOnly`).
- `npx eslint prisma/seed-studio.ts`: exit 0.
- Asap dari cwd `C:\Users\TRIAL\AppData\Local\Temp\ip43c_cwd` (`node <repo>/node_modules/tsx/dist/cli.mjs --tsconfig <repo>/tsconfig.json <repo>/prisma/seed-studio.ts`, mode normal):
  - Run 1 exit 0: `benchmarkProfile.found: true` (path di repo), `sectionTypes: 51`, `unregisteredSectionTypes: 0`, canonical `synced` v5 (sha 38c776de...) — registri berubah sejak v4 oleh baris lain; perilaku seed baku (D-06, v lama tak disentuh).
  - Run 2 exit 0, stderr kosong: canonical `"outcome":"unchanged","versionNo":5`, `found: true`, unregistered 0. Templat lain tidak disentuh (datum-gsp v1 f7767a75..., datum-manual-000 v2).

## Temuan
1. Run dari luar akar repo memerlukan `tsx --tsconfig <repo>/tsconfig.json`: tanpa itu tsx mencari tsconfig dari cwd dan alias `@/lib/prisma` (dipakai `services/storage/files.ts`) gagal MODULE_NOT_FOUND sebelum skrip berjalan. Bukan galat skrip; catat di panduan seed.
2. `benchmark/manual000/template.json` kini sha e4edfe51... (UT-01: 76b2e5ed...): `--import-datum-gsp`/`--import-benchmark` kemungkinan membuat versi baru bila dijalankan; tidak dijalankan di baris ini (bukan lingkup).
3. Cabang warn baris di luar registri belum teramati nyata (DB punya 0 baris yatim; tidak menyisipkan baris palsu ke DB).
4. Canonical v5 terbentuk oleh asap run 1 (DB v21) — controller mencatat.

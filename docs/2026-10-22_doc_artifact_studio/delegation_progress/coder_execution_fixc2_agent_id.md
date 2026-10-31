# FIX-C2 (L1 gerbang DC-22/DC-23) — agentId dry-run CLI vs R23 (coder-execution, 2026-10-30)

Status: complete. Berkas `coder_execution_fixc2.md` sudah dipakai laporan FIX-C2 lama (chart H-06/S-03, 2026-10-23), jadi laporan ini ditulis di berkas ini.

## Aturan (D-392, `services/draft/check.ts`)
agentId efektif blok = medan `agentId` payload bila ada (dipakai apa adanya); selain itu agentId bawaan pemanggil (CLI `--agent-id <id>` 1..80, hanya bersama `--remote`; badan R23 `agentId`); bawaan keduanya = tanpa agentId. Bila blok tanpa medan `agentId` dan bawaan ada, payload dry-run = blok + `agentId` (ditambahkan di akhir objek; teks blok dikirim ke R08 lewat `JSON.stringify`), selain itu teks blok persis seperti tertulis. R23 memakai payload yang sama (`dryRunInputOf`), sehingga R08 melihat caller dan `spec.agentId` identik. Akar masalah: CLI mengirim blok tanpa agentId (`anonymous-internal`), R23 memberi `agent:<id>` lewat badan.

## Berkas
`src/lib/studio/services/draft/check.ts` (`DraftDryRunInput`, `dryRunInputOf`, param `defaultAgentId`); `scripts/studio/draft-check.ts` (`--agent-id`); `src/app/api/studio/drafts/check/route.ts` (memakai input bersama); `tests/unit/studio/api/fixc2-agent-id.test.ts` (6 uji).

## Bukti
tsc 0; eslint berkas tersentuh 0; `npx vitest run tests/unit/studio/draft tests/unit/studio/api` 40 berkas / 876 uji hijau. Live :9021 (dokumen cmvuz5jlk0020v1jg9vekh7rp, 3 draf valid/JSON rusak/basis basi, CLI `--agent-id cod-fixc2` vs R23 `agentId:"cod-fixc2"`): diff dengan hanya `lastFilledAt`/`at` disamarkan = 0 baris untuk ketiganya; cid R23 valid c9e417af-fc8f-450b-a871-f9cd73196bd9, rusak 6cf3635e-0847-4e6e-8ab9-9292f7bd5fef, basi 5fbb9d3e-0dd8-4082-999f-5eada35915f8. Tanpa `--agent-id` CLI tetap `lastFilledBy: anonymous-internal` (sama dengan R23 tanpa agentId).

## Untuk panduan DC-33
Medan tak deterministik yang boleh beda: `completenessPreview...lastFilledAt` (dan `at` pada riwayat bab/slot untuk dry-run) = jam server saat dry-run. Untuk keluaran identik, berikan agentId yang sama (`--agent-id` = badan R23 `agentId`) atau tanam `agentId` di blok. Identitas autentikasi tetap menentukan `requester`: R23 lewat sesi cookie memberi `user:<username>` sedangkan CLI selalu memakai rahasia internal; kesamaan hanya terjamin bila R23 dipanggil dengan rahasia internal yang sama.

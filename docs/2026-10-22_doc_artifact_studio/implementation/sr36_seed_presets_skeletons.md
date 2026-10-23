---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: SR-36
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/05_structural_sections_blueprint.md
status: complete
---

# Implementation Report: SR-36 seed preset + kerangka

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Klaim berkas (file_claims.md, prefiks SR-36) | complete | seed, DB v21 (tabel templat), catatan, laporan, baseline |
| 2 | Simpan baseline §8.2 langkah 1 | complete | test/sr36_baseline_datum_kanonik_v5.json (sha params 38c776de, 723 kunci), sr36_baseline_datum_gsp_v1.json (f7767a75, 721), sr36_baseline_datum_manual_000_v2.json (bee70bde, 721); integritas sha tersimpan = hitung ulang untuk ketiganya |
| 3 | Flag `--presets-and-skeletons` | complete | dua fase dalam satu transaksi: preset dulu, lalu versi templat berkerangka + penjaga |
| 4 | Flag `--import-manual000-v2` | complete (disiapkan) | preset terbatas + versi berkerangka dari template.v2.json SR-32; berkas tidak ada = galat jelas; tidak membuat revisi dokumen |
| 5 | `--dry-run` | complete | transaksi preset/kerangka di-rollback setelah laporan |
| 6 | Jalankan di v21 dua kali + run tanpa flag | complete | lihat Verification |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| prisma/seed-studio.ts | modify | Flag `--presets-and-skeletons`, `--import-manual000-v2`, `--dry-run`; penjaga proyeksi sha; sinkron kanonik dihentikan bila kanonik berkerangka; impor v1 dilewati bila templat berkerangka; laporan hitungan menambah isPreset/skeleton |
| DB gsp_agent_hq_v21 | add rows | StudioTemplate `datum-kanonik-preset`, `datum-gsp-preset` (isPreset); versi `datum-kanonik` v6, `datum-gsp` v2; slot M10/M11 untuk 4 versi; tidak ada baris dokumen disentuh |
| docs/.../test/sr36_baseline_*.json | add | Baseline penjaga (3 berkas) |

Cara kerja preset: lapis preset = nilai keputusan (GSP: P4S-13 BM D-151, `symbol.sheet.fit` true KT-7, `table.widthClass` full research/09 §8.1) + sematan nilai baseline pada setiap kunci lama (di luar Δ, bukan kelas T) yang nilai efektifnya berbeda dari bawaan registri, diulang sampai stabil. Dasar preset = `datum-kanonik` v5 (tanpa override). Versi templat = rujukan versi preset + kenop esensial global (8 kunci, nilai dibaca dari preset) + kerangka register §6.1 (7 slot, kenop slot non-`medan` yang cakupannya sah di slot, nilai dari preset).

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | 0 galat di prisma/seed-studio.ts | repo 2 galat milik baris lain: benchmark/extract/convert_v2.ts:332 (SR-32), src/lib/studio/services/submit/pipeline.ts:215 |
| Lint | `npx eslint prisma/seed-studio.ts` | exit 0, 0 temuan | |
| Dry-run | `npx tsx prisma/seed-studio.ts --presets-and-skeletons --dry-run` | exit 0, penjaga ok 2/2, hitungan DB tak berubah | |
| Seed run 1 | `npx tsx prisma/seed-studio.ts --presets-and-skeletons` | exit 0; preset created x2, templat new-version x2 | |
| Seed run 2 | sama | exit 0; preset `unchanged` x2, templat `unchanged` x2; versi datum-kanonik 6, datum-gsp 2 (tetap) | idempoten |
| Seed tanpa flag | `npx tsx prisma/seed-studio.ts` | exit 0; kanonik `preset-managed`, registryInSync true | tidak ada versi sinkron yang menimpa kerangka |
| M000 tanpa berkas | (sebelum SR-32 menulis) | jalur galat: pesan "berkas benchmark/manual000/template.v2.json belum ada (keluaran SR-32...)" | berkas muncul di tengah baris; lihat Persistent Issues |

## Verification
- Kanonik: `proj(v6, 723 kunci v5)` = 38c776dee2e8798fd86ef591153de61523c6db9a4eb9a0feb0c1f7ef2d4c567f = paramsSha256 v5 (sama persis). Sematan preset 0. Sha penuh baru 7abfc5f7... (berbeda karena 51 kunci baru, semua bernilai bawaan).
- GSP DATUM: `proj(v2, 721 kunci v1 \ {P4S-13})` = aa9428723a049061b66c228f8e0025a6b5d0f756b45df4d7062aa1a5d616fa8e = proyeksi baseline; 0 kunci berbeda di luar Δ, 0 kunci hilang. Δ P4S-13: ["nomor dokumen","nomor lembar"] -> ["nomor dokumen","revisi","nomor lembar","jumlah lembar","klasifikasi"]. Kunci baru tak-bawaan: `symbol.sheet.fit`, `table.widthClass`.
- Hitungan per templat: datum-kanonik v6 dan datum-gsp v2 masing-masing esensial templat 8, lanjutan tersisa 0; 7 slot, esensial slot 17, lanjutan slot 0. Preset GSP DATUM 42 kunci (esensial 3, lanjutan 15, internal 10, turunan-acuan 14), 70 roleFormats; preset DATUM Kanonik 0 kunci.
- Nilai efektif setiap slot (resolveSlotsForVersion) = nilai efektif templat: 0 beda di 7 slot kedua templat.
- Preset tidak terbatas (restricted false) untuk keduanya.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Penjaga KT-5 `--import-manual000-v2` gagal pada berkas SR-32 saat ini | 2 (1 tanpa dry-run tak sengaja, 1 dry-run) | beda konten template.v2.json/preset vs template.json: render.table.layout (+widthTw 9412), chapter.kicker.pattern ("Bab {n}" vs "BAB {n}"), chart.output.widthMm, diagram.widthMm; berkas SR-32 dan template.json berubah selama baris ini | rollback kedua run, 0 baris M000 tertulis (versi datum-manual-000 tetap v1-v2); mekanisme lain sesuai: sha DB = mode berkas 49feb89b..., preset terbatas, kerangka 6 slot = berkas | tidak untuk SR-36; ya untuk SR-38 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | KT-11 menyebut TOC GSP DATUM `field`, baseline v1 `static`; penjaga Δ hanya P4S-13 | dibiarkan `static` (penjaga); perlu putusan controller bila `field` diinginkan (Δ bertambah) |
| 3 | `ensureCanonicalTemplate` sinkron akan membuat versi kanonik tanpa kerangka di atas v6 | seed menghentikan sinkron bila kanonik berkerangka (`preset-managed`, laporan registryInSync); `--presets-and-skeletons` pertama memakai v5 apa adanya (KT-5) |
| 3 | `--import-datum-gsp` / `--import-benchmark` pada templat berkerangka menumpuk versi berdasar kanonik | dilewati dengan warn |
| 4 | Revisi baru dokumen 000 (blueprint §2.13) | tidak dibuat seed (area = tabel templat); SR-38 butuh jalur dokumen (R14 `templateVersion` + kiriman) |
| 4 | Baseline KT-5 kehilangan override yang kini kelas T (P5-14 166 -> 128) | baseline memakai nilai terukur override profil untuk kunci yang dibuang pembaca |
| 3 | Slug preset | `datum-kanonik-preset`, `datum-gsp-preset` (contoh EC13), `datum-manual-000-preset` |

## Next Steps
- SR-38: selaraskan template.v2.json SR-32 dengan baseline KT-5 (atau sahkan Δ tambahan), lalu `--import-manual000-v2` (uji `--dry-run` dulu); jalur revisi dokumen 000 diputuskan controller.
- Review recommended: prisma/seed-studio.ts bagian SR-36 (penjaga proyeksi, penghentian sinkron kanonik).

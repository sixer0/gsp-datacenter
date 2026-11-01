---
task_id: R3-01
task_slug: doc_artifact_studio
row: R3-01
date: 2026-10-31
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-435); research/14_contract_efficiency_results_r2.md (U-15, U-16, U-18)
status: complete
---

# Implementation Report: R3-01 studio-report MD-native + update delta + template

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca D-435, D-425, CLI R2, I64 `markdownToContract`, importer md/v1, registri C58, R20 `shape=submission` | complete | skill brainstorming (singkat), backend-execution, dry-run-verify-fix dimuat |
| 2 | Desain: MD -> blok kiriman -> draf json DI MEMORI -> pipa R2 yang sama | complete | alternatif ditolak: satu `studio.doc/v2` via R04 (hilang delta per bagian + paritas jalur json); pipa terpisah (duplikasi) |
| 3 | U-15 masukan MD-native (`submit`/`update`, deteksi otomatis, `--format md\|json`) | complete | `services/draft/md-report.ts` baru |
| 4 | U-16 update delta + `--section` | complete | |
| 5 | U-18 `template [--mission] [--doc-key] [--format md\|json]` | complete | |
| 6 | Uji unit r3cli (14) | complete | |
| 7 | Gerbang tsc/eslint/vitest + asap :9021 + ukur biaya tulis | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `scripts/studio/studio-report.ts` | modify | perintah `template`; opsi `--format`, `--doc-key`, `--section`; `prepareInput`/`detectFormat`; galat konversi keluar 1 sebelum kiriman; `withTargetOverrides` (--mission + --doc-key); `sectionMatches` + `SECTION_UNKNOWN` (rc 2); hasil `format`, `conversion`, `delta`; keluaran manusia: peringatan CW, unsur dibuang, bab wajib kosong, dikirim vs tidak berubah; `--help` memuat aturan kunci kepala + judul bab yang dibangkitkan dari registri |
| `src/lib/studio/services/draft/md-report.ts` | add | modul murni: `mdReportAliases` (nama medan CF + label `labels.fields`, judul + kunci outline CO), `mdReportRules`, `stripToolKeys` (mission/misi, docKey, agentId; kepala draf C55 dibuang), `mdReportToBlocks` (I64 apa adanya -> record slot + bab + references), `blocksToDraftMarkdown`, `reportTemplate` (md/json dari `examples`) |
| `src/lib/studio/services/import/contract/types.ts` | modify | opsi `ContractImportOptions.extraAliases` (headerKeys, headings) |
| `src/lib/studio/services/import/contract/index.ts` | modify | `assertInput` menggabungkan `extraAliases` di BAWAH alias registri (registri menang); tanpa opsi = def registri apa adanya (md2contract tidak berubah) |
| `tests/unit/studio/draft/r3cli-md-native.test.ts` | add | 14 uji (lihat Verification) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint | `npx eslint` 5 berkas tersentuh | exit 0 | |
| Unit baru | `npx vitest run tests/unit/studio/draft/r3cli-md-native.test.ts` | 14/14 lulus | |
| Golden + R2 CLI | `npx vitest run` dc24-md2contract, dc35-golden-md2contract, r2cli-studio-report, r2fix-cli | 4 berkas, 73/73 lulus | golden dc24/dc35 tetap |
| Suite studio | `npx vitest run tests/unit/studio` | 159 berkas, 3459 lulus / 1 skip / 0 gagal | sebelumnya 158 / 3445 |

## Verification
- Paritas: laporan MD vs draf json setara yang ditulis tangan -> badan 6 POST identik (`toEqual`); di server, dokumen MD 029 (`cmvwbk0d001tkv1i8an9p1z0k`) dan dokumen json setara 028 (`cmvwbjot201qsv1i8d4mnjc1m`) menyimpan `sections` identik (sha16 tanpa pid `3ec44ad36cc66fca` keduanya).
- KD-42: status hilang -> `MD2CONTRACT_REQUIRED_MISSING` rc 1, 0 permintaan, `fatal.details.missing=["status"]`; status tanpa alias -> CW `CONTRACT_STATUS_UNMAPPED` dicetak, rc 1, 0 permintaan; misi/docKey hilang -> `MD_REPORT_TARGET_MISSING` rc 1.
- Delta (uji): sunting status -> hanya record (baseRevisionNo 6, tanpa meta); sunting paragraf bab 3 -> hanya bab 3; tanpa perubahan -> 0 POST; `--section 3` -> hanya bab 3 walau sama; `--section 9` -> rc 2 tanpa kiriman; `--section` pada submit -> rc 2.
- Template: md diisi -> 0 peringatan, 0 bab wajib kosong, 6 bagian, `checkDraftLocal` valid 6 blok; json -> `checkDraftLocal` valid; tanpa opsi = target contoh -> EXAMPLE_TARGET rc 2, 0 permintaan; tanpa ID `cmv...`.
- Nol berkas tulis: fs tiruan mencatat 0 tulis tanpa --out/--timing (draf json hanya di memori).
- Asap :9021 (agentId cod-r3-01, misi `2026-10-31_r3cli`, rahasia lewat substitusi shell):
  - `template --mission 2026-10-31_r3cli --doc-key lapkerja-r3-182842` -> isi (Owner, ReportedAt, judul) -> `submit lap.md`: 6x201 rev1-6, COMPLETE, verify true, rc 0; dok 027/GSP/LAP/X/2026 `cmvwbis1d01mkv1i8x3hhgsm3`, cid record 1740e93b-df83-4728-94bc-7002876cbd7c.
  - sunting satu baris `Status: complete -> partial` -> `update`: hanya record 201 rev7 (cid 157757b3-f2c3-49ea-86dc-7317f8775dd2), bab 1-5 tidak berubah, verify true; R20 slot record = partial.
  - sunting satu paragraf bab 3 -> `update`: hanya bab 3 201 rev8 (cid 71a9b1ec-b32d-48d6-aee9-360329dabdf9), verify true; update ulang tanpa perubahan -> 0 kiriman, rev tetap 8.
- Biaya tulis (laporan yang sama): MD 2.257 B vs draf json setara 10.043 B (pretty, x4,45) / 5.021 B (compact, x2,22). Waktu dinding proses (tsx hangat, termasuk render+verify): submit MD 2.598 ms (alat 1,218 s) vs submit json setara 2.696 ms (alat 1,245 s); update satu bagian 2.422-2.569 ms; update tanpa perubahan 2.328 ms.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | No |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Arsitektur: MD dikonversi ke draf json di memori lalu masuk pipa R2 (cek lokal, EXAMPLE_TARGET, kiriman berurutan, progres/idempoten, render/verify) | dipilih; perilaku R2 dan D-425 utuh |
| 3 | Kunci record tambahan + judul bab outline harus dikenali tanpa mengubah md2contract | opsi `extraAliases` I64 (registri menang), dibangkitkan dari registri `labels.fields` + `outline`; md2contract tidak memberikannya -> golden tetap |
| 3 | Butir kerja: hanya tabel (key\|id\|kartu + status) — perilaku I64; "daftar" tidak didukung agar logika tidak diduplikasi; bukti = kolom `bukti` (jenis file) | dicatat di `--help`; perluasan = keputusan controller |
| 3 | Struktur md2contract: `## X` -> bab X dengan satu section berjudul X; `###` menjadi paragraf subheading; tabel tetap di teks bab (tidak ada teks dibuang) | diterima apa adanya (konversi milik I64) |
| 3 | Galat konversi: `MD2CONTRACT_REQUIRED_MISSING`/`MD_REPORT_TARGET_MISSING`/`MD_REPORT_INVALID` = galat isi rc 1 (bukan rc 3 md2contract, karena 3 = INCOMPLETE di studio-report) | dicatat |
| 4 | Basis delta: SATU panggilan R20 penuh (bentuk lama, sudah dipakai R2) alih-alih `shape=submission` per bagian (6-7 panggilan); proyeksi sama (`structure/submission.ts`: hanya amplop yang berbeda) | dipilih karena hemat panggilan; terbukti asap (bab tak berubah dilewati); controller boleh meminta ganti ke shape=submission |
| 4 | Update MD tidak mengirim `meta`/`template` record (hindari META_CONFLICT judul basi); judul tidak dapat diubah lewat update | dicatat |
| 4 | `--section` memaksa kirim bagian terpilih walau sama (server menjawab unchanged); bagian dihapus dari MD tidak dihapus di server (delta tidak pernah menghapus) | dicatat |
| 5 | `template` tanpa --mission/--doc-key memakai target contoh registri -> EXAMPLE_TARGET saat dikirim apa adanya (penjaga D-427 tetap bekerja) | dicatat |
| 7 | Fixture DEV baru: dok 027 `cmvwbis1d01mkv1i8x3hhgsm3` (rev8), 028 `cmvwbjot201qsv1i8d4mnjc1m`, 029 `cmvwbk0d001tkv1i8an9p1z0k`, misi `2026-10-31_r3cli` | dibiarkan seperti D-408 |

## Next Steps
- Panduan §17.0 / brief: tambahkan alur MD-native (`template` -> isi -> `submit laporan.md`; sunting baris -> `update`), kunci kepala, `--section`, kode `MD2CONTRACT_REQUIRED_MISSING`/`MD_REPORT_TARGET_MISSING`/`SECTION_UNKNOWN` (milik baris dokumentasi, bukan R3-01).
- Review recommended: `scripts/studio/studio-report.ts`, `src/lib/studio/services/draft/md-report.ts`, `services/import/contract/{index,types}.ts` (senior-code-reviewer + security-review sesuai D-435).

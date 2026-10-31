---
task_id: FIX-IMP
task_slug: doc_artifact_studio
row: FIX-IMP (D-402 L-3, D-403 DC35-F1, D-405 owner/taskRef)
date: 2026-10-31
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md (§16.5, KD-42)
status: complete
---

# Implementation Report: FIX-IMP (DC35-F1 nilai majemuk + L-3 PHASE_RE linear)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Loop merah: `dc35-findings.test.ts` (3 `it.fails` = expected fail pada kode lama) | complete | baseline import+contract: 349 lulus, 3 expected fail |
| 2 | DC35-F1: `aliasTokenOf` + CW-02 `reason: compound` di status/vonis/status butir | complete | `leadToken` tetap untuk taskRef/actorOf (di luar lingkup) |
| 3 | `dc35-findings.test.ts`: HANYA `it.fails` -> `it` (3 baris) | complete | 4/4 lulus |
| 4 | L-3: `PHASE_RE` diganti pemindai linear `parsePhaseLine` (hasil identik regex lama untuk semua masukan) | complete | diferensial acak 40.000 + 300.000 (lokal) = 0 beda |
| 5 | Uji baru `tests/unit/studio/import/fiximp-import-contract.test.ts` | complete | 65/65 |
| 6 | Golden dc35/dc24/dc25 + CLI 3 laporan nyata | complete | tidak ada perubahan keluaran; sha golden TIDAK disentuh |
| 7 | D-405: owner (C36) / taskRef (C35) majemuk atau tak cocok pola -> medan kosong + CW-04, baris tetap teks | complete | `leadToken`/`actorOf` dihapus (tanpa pemakai lain); `actorValueOf`/`taskRefValueOf`; owner butir tabel ikut aturan sama |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/import/contract/parse.ts | modify | `aliasTokenOf` (token diterima hanya bila diikuti akhir/spasi/`(`; pemisah langsung, `/` `,` `atau` `or` `vs` sesudah spasi, atau `| ; + &` + token beralias lain -> compound); `parsePhaseLine` linear |
| src/lib/studio/services/import/contract/parse.ts (D-405) | modify | `patternValueOf` -> `actorValueOf`/`taskRefValueOf` (`{value}` atau `{value:null, reason:compound|pattern}`); `aliasTokenOf`: token diikuti `:` sesudah `| ; + &` = label medan, bukan kandidat; `leadToken`/`actorOf` dihapus |
| src/lib/studio/services/import/contract/index.ts (D-405) | modify | `Run.patternUnmapped()` CW-04 `{scope:"record", field, key, value, reason}` menggantikan catatan `FIELD_VALUE_INVALID` untuk owner/taskRef; owner butir -> CW-04 `scope:"item"` (butir tetap masuk tanpa owner) |
| src/lib/studio/services/import/contract/index.ts | modify | hapus `PHASE_RE`; status/vonis/status butir lewat `aliasTokenOf`; `Run.compound()` CW-02 `{scope, field, key, value, reason:"compound"}`; butir majemuk CW-02 scope item `reason:"compound"` |
| tests/unit/studio/contract/dc35-findings.test.ts | modify | 3x `it.fails(` -> `it(` saja |
| tests/unit/studio/import/fiximp-import-contract.test.ts | add | D-405 (taskRefValueOf/actorValueOf 16 kasus, kepala CW-04 compound/pattern, kontrol, owner butir); F1 (kepala, F2 label, tabel butir, kontrol D-377), L-3 (kasus tangan + diferensial vs regex lama + 7 bentuk patologis 100k + ujung ke ujung) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 (diulang sesudah D-405) | |
| Lint | `npx eslint src/lib/studio/services/import/contract/ tests/unit/studio/import/fiximp-import-contract.test.ts tests/unit/studio/contract/dc35-findings.test.ts` | exit 0 | |
| Unit import+contract | `npx vitest run tests/unit/studio/import tests/unit/studio/contract` | 17 berkas, 437/437 lulus (sesudah D-405) | sebelum FIX-IMP: 349 lulus + 3 expected fail |
| Suite penuh | `npx vitest run` | 149 lulus / 3 gagal / 1 skip berkas; 3293 lulus, 6 gagal, 27 skip | 6 gagal di luar kepemilikan: `agent-roster.test.ts` x4 (disk nyata roster), `api-structure/rate.test.ts` x1 + `fix1/fix1.test.ts` x1 (ember `INTERNAL_AGENT:shared` -> sedang diubah FIX-SEC L-4 di `http/quota.ts`, berkas M di worktree). Tidak ada yang mengimpor `services/import/contract` |
| CLI nyata | `npx tsx scripts/studio/md2contract.ts <f> --kind agentWorkReport --reported-at 2026-10-30T12:00+07:00 [--status needs-review]` | LAPORAN-SELESAI exit 0 sha 5cad8776...; 01_verifier_report (+--status) exit 0 sha f35b10bd...; laporan.md exit 0 sha eff5a14a...; verifier tanpa --status exit 3 | sha = golden; peringatan 4/10/6 = golden; diulang sesudah D-405: exit 0/0/0 + 3, sha dan peringatan sama (laporan nyata tidak punya owner/taskRef majemuk) |

## Verification
- F1: `PASS/FAIL`, `PASS / FAIL`, `PASS atau FAIL`, `PASS or FAIL`, `PASS,FAIL`, `PASS | FAIL` -> tanpa `verdict`, CW-02 baris 4 `reason: compound`; `complete/blocked` (+3 variasi) tanpa opsi -> `MD2CONTRACT_REQUIRED_MISSING` exit 3 `[status]`; dengan opsi -> status opsi + CW-02; butir `done/blocked`, `todo,blocked`, `done atau blocked`, `` `done` / `blocked` `` -> tidak masuk `items[]`, CW-02 scope item. Kontrol: `FAIL (catatan)`, `complete | Giliran: ...`, `done (lihat bukti)`, `**blocked**` tetap dipetakan, 0 peringatan.
- L-3: 7 bentuk patologis 100.000 karakter < 1 s (lokal 0,2-7,5 ms); ujung ke ujung F2 100k < 1 s; hasil = regex lama pada 40.000 masukan acak ber-seed (0 beda).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 6 uji gagal di suite penuh | 0 (di luar kepemilikan) | roster disk nyata; ember kuota sedang diubah FIX-SEC | dilaporkan ke controller | Tidak untuk FIX-IMP |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | `|` dengan spasi di korpus Hermes adalah pemisah medan (`complete | Giliran: ...`, 2+ kemunculan) | majemuk hanya bila sesudah `| ; + &` ada token beralias lain; `|` langsung sesudah token selalu majemuk |
| 2 | `complete, pending controller ratification` (korpus) kini CW-02 | sengaja: koma langsung sesudah token = pemisah alternatif (instruksi) |
| 7 | D-405: pilihan untuk owner/taskRef majemuk atau tak cocok pola | Medan dikosongkan + CW-04 `CONTRACT_FIELD_UNMAPPED` (`reason: compound|pattern`), baris tetap teks bab 1. Alasan: (a) skema tidak menampung teks utuh: C35 `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` dan C36 `^[a-z0-9][a-z0-9._-]{0,63}$` (`contract/env.ts:149/151`) menolak `/`, `,`, spasi; (b) register §13.2 CW-04 = "baris `kunci: nilai` dipertahankan sebagai paragraf di bab 1", tepat efek ini, sedangkan CW-02 khusus nilai status (§13.2, §16.5); E54 tertutup CW-01..CW-04, jadi tidak ada kode baru |
| 7 | Nilai tak cocok pola owner/taskRef dulu hanya catatan `mapping.notes` `FIELD_VALUE_INVALID` (tak terlihat `--strict`) | kini CW-04 `reason: pattern`; `reportedAt` tak sah tetap catatan (di luar D-405; hilangnya tetap menahan lewat exit 3) |
| 7 | Kandidat kedua sesudah `| ; + &` untuk medan berpola | hanya bila mirip kunci (cocok pola + memuat angka) dan tidak diikuti `:`; `gsp-coder | vonis FAIL` tetap `gsp-coder`, `DC-03 | DC-04` majemuk |
| 7 | Keterangan sesudah spasi/kurung (`t_5661a08b (MSIMON-COUNT-R2)`) | tetap dipetakan, mengikuti D-377 butir 2 seperti status |
| 3 | Golden dc35/dc24/dc25 | tidak berubah oleh F1; sha golden tidak disentuh |

## Next Steps
- Review recommended: `parse.ts` (`aliasTokenOf`, `parsePhaseLine`) + `index.ts` jalur status.

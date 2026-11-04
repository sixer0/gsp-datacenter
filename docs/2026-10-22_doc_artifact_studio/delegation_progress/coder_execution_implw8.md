---
task_id: IMPL-W8
task_slug: doc_artifact_studio
row: IMPL-W8 (ronde 11, R11B: argumen terbungkus ganda + meta di dalam edits)
date: 2026-11-04
agent: coder-execution
source_plan: brief controller IMPL-W8 (tanpa berkas rencana terpisah)
status: complete
---

# Laporan Implementasi: IMPL-W8 argumen terbungkus ganda dan meta di dalam edits

## Ringkasan

Dua bentuk kiriman Hermes R11B yang dulu ditolak `INVALID_ARGUMENT` (~36 dtk ulangan) kini dikoreksi sebelum validasi:
(A) semua alat membuka satu tingkat pembungkus `{ arguments, name }` bila `name` cocok dengan alat yang dipanggil
(`ARGS_UNWRAPPED`); (B) `studio_edit` mengangkat butir `{ meta: {...} }` dari `edits` ke `meta` puncak
(`META_LIFTED_FROM_EDITS`), bentrok nilai -> `INVALID_ARGUMENT`, 0 tulis. Kedua kode informasional (senyap di hasil
ringkas, tampil dengan `detail: true`). Validasi skema, pagar, dan cek pemilik tetap berjalan sesudahnya tanpa perubahan.
Gerbang: tsc 0, eslint 0, vitest MCP 346/346, smoke DEV 3/3 PASS. Tidak di-commit.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Petakan titik masuk argumen | complete | `executeTool` (`tools.ts:1107`) satu-satunya jalur: clone -> `prepare` -> ajv -> `run`. `normalizeEditArgs` (`write-normalize.ts`) = prepare studio_edit; `prune` puncak membuang `arguments`/`name` sehingga muncul "berikan edits ... dan/atau meta" (cocok bukti R11B); butir `{meta}` jatuh ke cabang find/replace, dipangkas jadi `{}` -> gagal `/edits/5` |
| 2 | Uji gagal dulu (tdd) | complete | `implw8-args.test.ts` 13 uji: 11 gagal sebelum implementasi |
| 3 | Implementasi A + B | complete | 13/13 lulus |
| 4 | Perbarui uji set kelas informasional IMPL-W6 | complete | asersi himpunan persis (pola sama dengan IMPL-W7) |
| 5 | Dokumentasi `STUDIO-MCP.md` §5.u | complete | |
| 6 | Gerbang tsc/eslint/vitest | complete | lihat Test Results |
| 7 | Smoke DEV 9021 | complete | 3/3 PASS, exit 0 |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `scripts/studio/mcp/tool-kit.ts` | modify | `unwrapToolArgs(toolName, args)` (murni, satu tingkat, tanpa rekursi); `ARGS_UNWRAPPED` + `META_LIFTED_FROM_EDITS` ke `INFORMATIONAL_WARNING_CODES` |
| `scripts/studio/mcp/tools.ts` | modify | `executeTool`: buka pembungkus sesudah `structuredClone`, sebelum `prepare`/ajv; peringatan diletakkan paling depan di `prepared`. `args` hasil buka dipakai juga untuk sasaran pengulangan (W3-I1) |
| `scripts/studio/mcp/write-normalize.ts` | modify | `liftMetaItems` (butir tepat `{ meta: {objek} }` satu kunci) dipanggil di `normalizeEditArgs` sesudah alias `edits`, sebelum `normalizeMetaArg`; bentrok -> `McpToolError("INVALID_ARGUMENT")` menyebut medan (token aman `tok`); `edits` kosong dihapus (meta saja); kunci `__proto__` dilewati |
| `tests/unit/studio/mcp/implw8-args.test.ts` | add | 13 uji (murni + end-to-end lewat server MCP in-memory) |
| `tests/unit/studio/mcp/implw6-quiet.test.ts` | modify | asersi himpunan kelas informasional + dua kode baru |
| `scripts/studio/mcp/smoke-implw8.ts` | add | smoke stdio nyata ke DEV |
| `docs/STUDIO-MCP.md` | modify | §5.u Ronde 11 (IMPL-W8) |

Catatan: `decisions.md` dan `docs/STUDIO-HOWTO-REPORT.md` sudah termodifikasi di working tree sebelum sesi ini; tidak disentuh.

## Aturan yang diterapkan
- **A (semua alat).** Dibuka hanya bila: argumen objek, `arguments` objek biasa (bukan larik/teks), kunci puncak lain
  hanya `name` atau tidak ada, dan `name` (bila ada) = `studio_x` atau `mcp__studio__studio_x` persis. Selain itu masukan
  dikembalikan identik sehingga gagal seperti dulu. Pembungkus ketiga tidak dibuka.
- **B (studio_edit).** Hanya butir persis `{ meta: {...} }`. Pembandingan nilai: skalar dibandingkan sebagai teks
  (`"1"` = `1`), objek lewat JSON. Bentrok puncak-vs-butir maupun antarbutir ditolak sebelum jaringan. Bila `meta` puncak
  ada tetapi bukan objek, butir tidak diangkat (perilaku lama).
- **C.** Normalisasi lain, ajv `additionalProperties:false`, guardLine/assertEditShape/`CONTENT_INJECTION`, owner check
  tidak diubah dan berjalan sesudahnya.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | `tsc exit 0` | |
| Lint | `npx eslint tool-kit.ts tools.ts write-normalize.ts smoke-implw8.ts implw8-args.test.ts implw6-quiet.test.ts` | `eslint exit 0` | 6 berkas tersentuh/baru |
| Unit (merah dulu) | `npx vitest run tests/unit/studio/mcp/implw8-args.test.ts` | sebelum: `Tests 11 failed \| 2 passed (13)`; sesudah: `Tests 13 passed (13)` | |
| Unit MCP | `npx vitest run tests/unit/studio/mcp` | `Test Files 28 passed (28)`, `Tests 346 passed (346)` | siklus 1 ada 1 gagal: asersi himpunan IMPL-W6 (diharapkan, diperbarui) |
| Smoke DEV | `smoke-implw8.ts` | 3/3 PASS, exit 0 | lihat bawah |

## Verification
- Terbungkus ganda nama cocok -> diterapkan; ringkas tanpa `ARGS_UNWRAPPED`, `detail: true` menampilkannya: uji
  "nama cocok -> diterapkan; peringatan senyap ..." lulus.
- Nama tidak cocok -> `INVALID_ARGUMENT`, `m.calls.length === 0`: lulus.
- Terbungkus tiga kali -> dibuka sekali (`unwrapToolArgs` mengembalikan lapisan dalam utuh), lalu `INVALID_ARGUMENT`,
  0 jaringan: lulus.
- Butir meta diangkat + status tersimpan (bentuk R11B lengkap); bentrok -> `INVALID_ARGUMENT` menyebut `status`, 0
  jaringan/0 tulis; nilai sama bukan bentrok; edits hanya meta -> suntingan meta saja (status + verdict, butir record
  utuh): semua lulus.
- Alat lain: `studio_document_get` terbungkus ganda -> ok + `ARGS_UNWRAPPED`: lulus.

## Smoke DEV (127.0.0.1:9021, mission `2026-11-04_smoke-implw8`, stamp 20261104035222): 3/3 PASS, exit 0

Rahasia dibaca dari `trial_internal_secret` langsung ke env (tidak dicetak); `grep -cF` rahasia pada log = `0`. Server
DEV tidak dinyalakan/dimatikan; DB produksi/port 9011/`~/gsp-datacenter` tidak disentuh. Log:
`C:\Users\TRIAL\AppData\Local\Temp\claude\w8\smoke\smoke-implw8-20261104035222.log` (3.926 B).

| Langkah | Hasil | Catatan |
|---|---|---|
| S1 studio_write laporan kerja (status partial) | PASS | rev 6; status partial [1912 B, 2321 ms] |
| S2 studio_edit `{ arguments: {documentId, edits:[{find,replace},{meta:{status:"complete"}}]}, name:"mcp__studio__studio_edit" }` | PASS | rev 8; status complete; teks tersunting; peringatan - (senyap) [1902 B, 1192 ms] |
| S3 pembungkus dengan `name` alat lain | PASS | INVALID_ARGUMENT; status tetap complete [925 B, 2 ms] |

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | - | - |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| A | Peringatan `ARGS_UNWRAPPED` di alat baca (mis. `studio_document_get`) | Tetap tercetak: penyenyapan informasional hanya berlaku di hasil ringkas `studio_write`/`studio_edit` (perilaku IMPL-W6 tidak diubah) |
| A | Prefiks nama yang diterima | Hanya `studio_x` dan `mcp__studio__studio_x` sesuai brief; prefiks server lain tidak dibuka |
| B | Urutan normalisasi | `normalizeMetaArg` dipindah sesudah alias `edits` + angkat meta (kunci independen; tanpa perubahan perilaku untuk masukan lama, dibuktikan 346/346) |
| B | Pembandingan nilai bentrok | Skalar sebagai teks (selaras `normalizeMetaArg` yang mengubah angka/boolean ke teks) |
| 4 | Asersi himpunan persis di `implw6-quiet.test.ts` | Diperbarui (satu baris), pola sama seperti IMPL-W7 |

## Next Steps
- Review recommended (lingkup: `tool-kit.ts` `unwrapToolArgs`, `tools.ts` `executeTool`, `write-normalize.ts` `liftMetaItems`) sebelum commit.
- Commit oleh controller (tidak di-commit di sesi ini).

---
task_id: R2-01
task_slug: doc_artifact_studio
row: R2-01 (D-419; U-05 + U-01)
date: 2026-10-31
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/research/12_contract_efficiency_results.md §9 (U-01, U-05); decisions D-419
status: complete
---

# Implementation Report: R2-01 draft-check ramah (U-05) + CLI `studio-report` (U-01)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | U-05a simulasi berurutan | complete | Di orkestrasi bersama `services/draft/check.ts` (`completeDraftCheck`): blok bab/slot sesudah blok buat-dokumen bertarget `mission.folder` + `docKey` sama (docKey kosong = slug templat) yang dijawab `META_REQUIRED_FOR_CREATE` di-dry-run ulang dengan `template`/`meta` blok buat ditambahkan (medan yang belum ada saja). Karena satu fungsi dipakai CLI dan R23, perilaku R23 ikut berubah; ini dituntut kesetaraan AC-19 (kode route R23 tidak disunting) |
| 2 | U-05b `--json` selalu JSON | complete | Galat fatal = `{ "fatal": { code, message, details? } }` (USAGE_ERROR, FILE_UNREADABLE, SECRET_MISSING, REMOTE_UNREACHABLE, REMOTE_UNAUTHORIZED, RATE_LIMITED, REMOTE_ERROR, REMOTE_BAD_RESPONSE, BLOCK_NOT_FOUND, PAYLOAD_TOO_LARGE rc 1, INTERNAL_ERROR); `--help --json` = `{ help }` |
| 3 | U-05c cwd mana pun | complete | `scripts/studio/_repo-alias.ts` (diimpor pertama) memetakan `@/x` -> `<repo>/src/x` lewat `Module._resolveFilename` sebelum resolver tsx. Akar MODULE_NOT_FOUND R1B L61 direproduksi dulu dari `C:/Users/TRIAL` (`Cannot find module '@/lib/studio/contract/env'`, rantai `services/contracts/log.ts` -> `http/jsonl.ts`), lalu hilang |
| 4 | U-05d payload opt-in | complete | `--json` tanpa `blocks[].payload`; `--with-payload` = bentuk persis R23 (tanpa `--json` = galat pemakaian) |
| 5 | U-01 `studio-report submit/update` | complete | Lihat kepala `scripts/studio/studio-report.ts`. Badan dan unduhan hanya di memori; berkas hanya untuk `--out` (nama dari `X-Studio-Final-Filename`, flag `wx`, nama divalidasi tanpa pemisah path) dan `--timing` (header 20 kolom, RFC 4180, seq lanjut per `run_id`, header asing ditolak sebelum kiriman pertama). Pengalihan 3xx tidak diikuti (`redirect: "manual"`) supaya rahasia tidak ikut dialihkan |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/draft/check.ts | modify | simulasi berurutan: `sequentialCreateSources`, `draftCreateTargetOf`, `draftMissionTargetOf`, `needsCreateEnvelope`, `simulatedCreateInput`, `META_REQUIRED_FOR_CREATE`; loop `completeDraftCheck` |
| src/lib/studio/services/draft/index.ts | modify | ekspor tambahan (termasuk `dryRunInputOf`, tipe `DraftDryRunInput`) |
| scripts/studio/draft-check.ts | modify | U-05b/c/d; `DraftCheckUsageError.code`; `normalizeBaseUrl` diekspor; keluaran manusia remote menandai "target: dokumen yang dibuat blok n" |
| scripts/studio/_repo-alias.ts | add | resolusi alias `@/*` dari cwd mana pun (DI LUAR daftar kepemilikan; berkas baru, tidak ada penulis lain) |
| scripts/studio/studio-report.ts | add | CLI U-01 |
| tests/unit/studio/draft/r2cli-draft-check.test.ts | add | 9 uji U-05 |
| tests/unit/studio/draft/r2cli-studio-report.test.ts | add | 14 uji U-01 |
| tests/unit/studio/draft/dc22-draft-check.test.ts | modify | 2 asersi disesuaikan (DI LUAR daftar kepemilikan): kunci blok `--json` tanpa `payload` (U-05d), galat batas = `{ fatal: {...} }` (U-05b) |
| package.json | tidak diubah | tidak perlu entri bin/script |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | rc 0 | |
| Lint | `npx eslint` 9 berkas tersentuh | rc 0, 0 temuan | |
| Unit (baris) | `npx vitest run tests/unit/studio/draft` | 4 berkas, 59 lulus | |
| Unit (penuh) | `npx vitest run tests/unit/studio` | 156 berkas, 3413 lulus, 1 dilewati, 0 gagal | |

## Verification
- **Asap :9021 submit** (cwd `Temp/r2cli_smoke/cwd`, di luar repo; draf record + bab 1..5, bab bertarget misi+docKey): 6 kiriman 201 (rev1 dibuat .. rev6), COMPLETE, HTML 2.577.759 bita, sha16 `df161adb3fad62cb`, nama final `014-GSP-LAP-X-2026_rev6_20261031T053451Z_df161adb.html`, `X-Studio-Sha256-Verified true`, rc 0. Dokumen `cmvvyvhha01bfv1zgh80euwbh`. Waktu dinding 2,743 s (proses tsx penuh), di dalam CLI 2,146 s; render R17 1,057 s.
- **Asap :9021 update** (status partial -> complete): R20 basis rev6, hanya record dikirim (201 rev7), 5 bab tidak berubah dan tidak dikirim, COMPLETE, nama final `..._rev7_20261031T053503Z_e9e3e615.html`, verified true, rc 0. Waktu dinding 1,561 s, di dalam CLI 1,023 s.
- **Timing CSV** `C:/Users/TRIAL/AppData/Local/Temp/r2cli_smoke/timing.csv`: header 20 kolom + 20 baris (seq 1..20, run_id R2CLI), setiap baris API membawa `corr_id`, baris unduh membawa bytes + sha16.
- **Snapshot** (`find %TEMP%` 232.808 berkas, dan repo tanpa node_modules/.git/.next, sebelum/sesudah): berkas baru dari CLI hanya `r2cli_smoke/out/*.html` (2, --out) dan `r2cli_smoke/timing.csv` (--timing). Berkas lain yang muncul, semuanya bukan tulisan kode CLI: `r2cli_smoke/update.json` (pengalihan stdout `--json` oleh saya); `Temp/tsx-TRIAL/17934-338da1f8...` (cache transpilasi tsx untuk `studio-report.ts` yang baru, 53.894 bita, berisi kode sumber CLI); `Temp/{ch1.json,h3,h4,r03c.json,r08.json,r21.json}` (12:34:39-12:34:59, bersamaan dengan uji asap; `ch1.json` ber-agentId `gsp-document-writer` dan menarget dokumen asap saya, jadi kemungkinan probe agen paralel); di repo hanya 2 HTML render server di `data/studio-workspace/docs/2026-10-31_r2cli/...` (keluaran R17 server). Cek fs di uji unit: `vi.spyOn` atas `writeFileSync/appendFileSync/mkdirSync/mkdtempSync/createWriteStream/writeFile/appendFile/copyFileSync/renameSync` = 0 panggilan untuk submit + update tanpa --out/--timing; `openSync` hanya `[draf, "r"]`.
- **AC-19 asli :9021** (CLI `--remote --json --with-payload --agent-id cod-r2-01` lawan R23 `agentId` sama, jam `lastFilledAt`/`at` disamarkan): draf dokumen yang sudah ada = IDENTIK. Draf dokumen baru (blok bab bersimulasi) = identik setelah `pid` disamarkan juga: satu-satunya selisih `blocks[0].submitPreview.slot.pid` blok buat, pid acak yang dibangkitkan setiap dry-run pembuatan (bukan dari perubahan ini). Kedua jalur: 6/6 blok valid, tanpa `META_REQUIRED_FOR_CREATE`. Uji AC-19 lama (dc23, 7 kasus) tetap hijau.
- **cwd lain**: `npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/draft-check.ts <draf>` dari `C:/Users/TRIAL` rc 0 (sebelumnya MODULE_NOT_FOUND); uji unit proses nyata dari `os.tmpdir()`.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Cache tsx menulis `%TEMP%/tsx-<user>/<hash>` pada eksekusi pertama setelah sumber CLI berubah; isinya kode CLI yang memuat string `studio.slot/v2`, sehingga grep U-10 dapat positif palsu | 0 (perilaku tsx, bukan kode CLI) | tsx cache transpilasi | Saran untuk prosedur uji ulang: jalankan CLI sekali sebelum snapshot pre (cache hangat), atau set `TSX_DISABLE_CACHE=1` | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| U-05a | Simulasi di layanan bersama, bukan hanya di CLI | Wajib agar AC-19 tetap; R23 ikut (tanpa suntingan berkas route; dry-run ulang di R23 tidak menambah tagihan kuota per blok KD-43; di CLI menambah satu panggilan R08) |
| U-05a | Simulasi = dry-run ulang hanya bila jawaban pertama META_REQUIRED_FOR_CREATE | Draf yang dokumennya sudah ada tetap dicek apa adanya; tanpa medan baru di respons R23 (penanda hanya di keluaran manusia CLI) |
| U-05b | Bentuk galat batas `--json` berubah dari `{error, code, details}` ke `{fatal:{code,message,details}}` | Satu bentuk fatal untuk semua kode keluar != 0 di luar hasil; dc22 disesuaikan |
| U-05d | AC-19 dijaga pada `checkDraftRemote` (fungsi) dan pada CLI `--with-payload` | R23 tidak diubah untuk payload |
| U-01 | Jalur buat = R13 (slot record beramplop buat, panduan §17.4); `studio.doc/v2` -> R04; bab -> R12 berurutan | Blok sesudah blok buat dikirim dengan `target: {documentId}` dokumen baru |
| U-01 | update membandingkan blok dengan isi R20 (tanpa urutan kunci, tanpa `id`) dan hanya mengirim yang berbeda; `template`/`meta` dibiarkan (judul sama diterima server, beda = META_CONFLICT); `studio.doc/v2` ditolak (rc 1) | |
| U-01 | Konteks kolom timing dari env `STUDIO_TIMING_RUN_ID/ARM/REPORT_ID/ORDER/SESSION_ID`, `--step` (bawaan nama perintah); bawaan arm `B`, lain `-` | Untuk diselaraskan R2-04 (protokol uji ulang) |
| U-01 | Kode keluar: 1 juga untuk sha/verify tidak cocok; 2 untuk 3xx/401/429/5xx/jaringan/berkas | Terdokumentasi di kepala berkas dan `--help` |
| Kepemilikan | Dua berkas di luar daftar: `scripts/studio/_repo-alias.ts` (baru), `dc22-draft-check.test.ts` (2 asersi) | Dideklarasikan di sini |
| Data uji | Dokumen DEV misi `2026-10-31_r2cli`: `013/GSP/LAP/X/2026` (probe bentuk respons), `014/GSP/LAP/X/2026` (asap rev1..7) | Dibiarkan; berkas asap di `Temp/r2cli_smoke/` boleh dihapus controller sebelum snapshot uji ulang |

## Next Steps
- R2-06 (panduan): dokumentasikan `studio-report` (opsi, env timing, kode keluar), `--with-payload`, bentuk `{fatal}`, dan jalankan dari cwd mana pun.
- Review recommended (R2-07): `scripts/studio/studio-report.ts`, `scripts/studio/_repo-alias.ts`, `src/lib/studio/services/draft/check.ts` (keamanan: penanganan rahasia, redirect manual, nama berkas --out).

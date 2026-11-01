---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: MCP-01
date: 2026-11-01
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-449, D-450, D-457)
status: complete
---

# Implementation Report: MCP-01 server MCP Studio (stdio)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Muat skill mcp-builder, backend-execution (standar), dry-run-verify-fix (gerbang) | complete | |
| 2 | Baca D-449/D-450/D-457, `studio-report.ts`, `_http-client.ts`, `draft-check.ts`, services draft, API-REFERENCE §12, panduan §17.0 | complete | Semua fungsi yang dibutuhkan sudah diekspor CLI; tidak perlu refaktor |
| 3 | Putuskan SDK vs JSON-RPC minimal | complete | SDK 1.32.1 (lihat Keputusan) |
| 4 | Implementasi `scripts/studio/mcp/**` (12 alat, 1 prompt, 3 resource) | complete | |
| 5 | Uji unit `tests/unit/studio/mcp/mcp-server.test.ts` (24 uji) | complete | |
| 6 | Uji integrasi stdio nyata ke DEV :9021 (`smoke.ts`) + unduhan + klien Python Hermes | complete | 2 jalan smoke, semua lulus |
| 7 | `docs/STUDIO-MCP.md` | complete | termasuk pendaftaran Hermes per sesi |
| 8 | Gerbang: tsc, eslint, vitest studio penuh | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `scripts/studio/mcp/server.ts` | add | Entri stdio; `Server` SDK tingkat rendah; tools/prompts/resources; log JSON hanya ke stderr, disensor |
| `scripts/studio/mcp/tools.ts` | add | 12 alat; validasi ajv ketat; pakai ulang `runReport`/`runCheck`/`runRefresh`/`prepareInput`/`resolveBasis`/formatter studio-report dan `checkDraftLocal`/`checkDraftRemote`; galat -> `code` + `correlationId` |
| `scripts/studio/mcp/safety.ts` | add | `guardedFetch` (asal tunggal, redirect manual), `redactSecret`, `resolveAllowedPath` (absolut, di dalam akar sesudah realpath), `virtualFs` (baca memori, tolak tulis kecuali satu tujuan eksplisit) |
| `scripts/studio/mcp/config.ts` | add | Env `STUDIO_BASE_URL`, `INTERNAL_API_SECRET`, `STUDIO_AGENT_ID`, `STUDIO_MCP_FILE_ROOTS`; batas 4 MiB / 8 MiB |
| `scripts/studio/mcp/resources.ts` | add | Resep §17.0 versi MCP, templat registri, seksi §17.0 asli (baca saja) |
| `scripts/studio/mcp/smoke.ts` | add | Klien SDK stdio nyata: alur penuh + pindai rahasia, cetak cid |
| `tests/unit/studio/mcp/mcp-server.test.ts` | add | 24 uji lewat InMemoryTransport + Client SDK, HTTP di-mock (harness berkeadaan R3) |
| `docs/STUDIO-MCP.md` | add | Cara menjalankan, env, konfigurasi klien (umum, Hermes, Claude Code), daftar alat, galat, alur, keamanan, uji |
| `package.json` | modify | `"@modelcontextprotocol/sdk": "1.32.1"` (save-exact) |
| `package-lock.json` | modify | +58 paket transitif SDK; qs 6.15.0->6.16.1, side-channel 1.1.0->1.1.1, side-channel-list 1.0.0->1.0.1 (dalam rentang; semua rilis < 2026-10-18 lewat `--before`) |

CLI lama tidak diubah: `git diff --stat -- scripts/studio/studio-report.ts scripts/studio/_http-client.ts scripts/studio/draft-check.ts src` kosong.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | rc 0, 0 baris keluaran | |
| Lint | `npx eslint scripts/studio tests/unit/studio/mcp` | rc 0 | |
| Unit MCP | `npx vitest run tests/unit/studio/mcp` | 24/24 lulus | |
| Unit studio penuh | `npx vitest run tests/unit/studio` | 163 berkas, 3526 lulus, 1 skip, 0 gagal (174 s) | sebelumnya 162/3502 (D-454): +1 berkas +24 uji, tanpa regresi CLI |
| Integrasi stdio DEV | `INTERNAL_API_SECRET=<dari berkas> npx tsx scripts/studio/mcp/smoke.ts --mission 2026-11-01_mcp01 --agent-id cod-mcp-01` | rc 0, 17/17 LULUS, 4.8 s | jalan ke-2 sesudah suntingan terakhir; kutipan di Verification |
| Unduhan DEV | `executeTool` render + `studio_file_verify` dengan `downloadDir` | berkas 2585010 B tersimpan, ulang idempoten, folder di luar akar ditolak | |
| Kompatibilitas Hermes | venv Hermes `python -I -B` + `mcp` 2.0.0 `stdio_client` | initialize 2025-11-25, 12 alat, template, R21 (cid 18fcc185-23b4-45b2-8eed-a88d25871010), galat skema isError; rahasia tidak di keluaran | konfigurasi Hermes TIDAK diubah |
| Build Next | tidak dijalankan | - | `scripts/` bukan bagian build Next; menjalankan `next build` saat DEV :9021 hidup dari repo yang sama berisiko mengganggu UI-01. tsc sudah mencakup berkas baru |

## Verification
- tools/list skema: uji `12 alat bernama studio_*, skema object ketat...` (additionalProperties false, tanpa oneOf/anyOf akar, anotasi readOnlyHint jujur: 7 baca-saja, 5 tidak).
- Tiap alat dengan klien HTTP di-mock: 24 uji (registry, template, check lokal/remote, submit, update delta, update tanpa basis MD dan json, BASE_CONFLICT, refresh teks/path/write/outPath, contracts_query, search, document_get summary/content, render, file_verify HEAD/unduh/VERIFY_FAILED/OUT_NAME_UNSAFE, draft_check lokal/remote/302).
- Rahasia tidak pernah muncul: uji `rahasia tidak pernah muncul...` (server memantulkan rahasia -> `[RAHASIA-DISENSOR]` di hasil dan log); smoke DEV "13 hasil alat + 14 baris stderr server; rahasia tidak ditemukan"; probe Hermes "rahasia di keluaran: False".
- Nol tulis berkas: NodeFs memori mencatat tulis; semua alat non-tulis `writes == []`; refresh `write` = tepat satu tulis ke path itu; unduhan = mkdir + satu tulis `wx`.
- Integrasi stdio DEV `http://127.0.0.1:9021` (jalan ke-2, rc 0):
  - initialize gsp-studio 1.0.0; tools/list 12; 1 prompt, 3 resource
  - check valid (record, bab 1..5)
  - submit dok `cmvx8zwi101e6v1xck18t3h5c` 047/GSP/LAP/XI/2026 rev6 COMPLETE, HTML terverifikasi [cid 6155caa9-f4a0-4ac8-8a39-f90e3ac2f82c]
  - update terkirim bab 1, 5 tidak berubah, rev7 [cid 01f72f29-6dcb-44d8-9eed-4fe715b22723]
  - refresh rev7->rev7, 0 konflik, tidak menulis; update tanpa basis -> BASIS_MISSING [cid mcp-57063f8b-be15-4f95-8920-f4c376a6b345]
  - contracts_query 1 laporan complete [cid c9222339-72f7-41f2-bfc5-d040afa1ee43]; search 1 hasil [cid 22596bee-4406-4ab2-825e-bc3f19b85fb7]
  - document_get rev7 [cid 3c51d31c-7fc6-4b20-9bcb-59974052b757]; render HTML [cid 0e368701-61ea-4ca2-b894-585d0100e5d0]
  - file_verify verified=true, nama C51 lolos, savedTo null [cid f6bc0e2b-51ae-4124-b6ea-56331034fd31]; draft_check templat ber-placeholder valid=false
  - Jalan ke-1 (sebelum suntingan teks render): dok `cmvx8ruct01bdv1xc5g3vrf0b`, juga 17/17 lulus.
- Dokumen yang dibuat di DEV (misi `2026-11-01_mcp01`, agentId `cod-mcp-01`): `cmvx8ruct01bdv1xc5g3vrf0b` (046/GSP/LAP/XI/2026) dan `cmvx8zwi101e6v1xck18t3h5c` (047/GSP/LAP/XI/2026).

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Uji Hermes nyata lewat MCP (D-450) belum dijalankan | 0 (bukan lingkup sub-agen) | Memerlukan pendaftaran di config profil Hermes dan sesi Hermes; milik controller | Cara per-sesi terdokumentasi di `docs/STUDIO-MCP.md` §3.2; kompatibilitas klien Python Hermes sudah terbukti | Tidak untuk MCP-01; ya untuk penutupan D-450 |
| Hermes tidak punya opsi MCP per sesi | 1 (baca `_parser.py`, `subcommands/mcp.py`) | Hermes hanya membaca `mcp_servers` dari `config.yaml` profil | Jalan paling tidak invasif: cadangkan -> `hermes -p <profil> mcp add` (env rujukan `${env:INTERNAL_API_SECRET}`) -> uji -> `mcp remove` -> diff | Tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | SDK resmi vs JSON-RPC minimal | SDK `@modelcontextprotocol/sdk` 1.32.1 (rilis 2026-10-05, >= 2 minggu; 1.32.2 2026-10-23 terlalu baru), `npm install --save-exact --ignore-scripts --before=2026-10-18`. `--before` dipakai karena percobaan pertama tanpa itu menarik qs 6.17.1 (rilis 2026-10-28); dibatalkan dari cadangan lalu dipasang ulang. `--ignore-scripts` agar `prisma generate` tidak bentrok dengan DEV yang mengunci DLL engine |
| 3 | Zod tidak diimpor langsung | `Server` tingkat rendah + JSON Schema + ajv 8.20.0 (dependensi langsung yang sudah ada); tidak ada paket langsung lain yang dipasang |
| 4 | Pakai ulang tanpa refaktor | `studio-report.ts` sudah mengekspor `runReport`/`runCheck`/`runRefresh`/`prepareInput`/`resolveBasis`/formatter dan menerima `fs` + `fetchImpl` tersuntik -> fs virtual (laporan dari memori) + fetch berpagar. 0 perubahan pada CLI lama, uji CLI tetap hijau |
| 4 | Pengalihan pada draft-check | CLI `draft-check --remote` mengikuti 3xx (risiko diterima D-402 M-2). MCP memaksa `redirect: manual` lewat `guardedFetch` untuk semua alat, termasuk draft_check; 302 -> REMOTE_ERROR (uji) |
| 4 | Basis update | MCP mewajibkan basis juga untuk draf ber-blok json (CLI memakai `latest-unchecked`); `forceLatest` tidak diekspos |
| 4 | agentId bawaan | Argumen menang; `STUDIO_AGENT_ID` dipakai hanya bila laporan MD tidak memuat baris `agentId:` (agar baris kepala tidak ditimpa diam-diam) |
| 4 | Log | Hanya stderr JSON per kejadian, sesuai brief (bukan sink tahan lama): server MCP adalah proses klien; galat yang sampai server Studio tercatat di log server dengan cid sama. Galat sebelum server memakai `correlationId = mcp-<uuid>` yang sama di log stderr |
| 4 | Akar berkas | `STUDIO_MCP_FILE_ROOTS` (bawaan cwd) membatasi baca `path` dan tulis eksplisit; path relatif ditolak |
| 4 | Teks galat | Hermes hanya meneruskan teks pada `isError`, jadi teks galat memuat code, correlationId, dan rincian JSON (dipotong 20000 karakter) |

## Next Steps
- Controller: uji Hermes nyata lewat MCP (D-450) dengan langkah `docs/STUDIO-MCP.md` §3.2 (cadangkan config profil, `mcp add` sebelum, `mcp remove` + diff sesudah).
- Review recommended (controller dispatch): `senior-code-reviewer` + `security-review` untuk `scripts/studio/mcp/**`, `tests/unit/studio/mcp/**`, `package.json`/`package-lock.json` (rantai pasok SDK + 58 transitif).

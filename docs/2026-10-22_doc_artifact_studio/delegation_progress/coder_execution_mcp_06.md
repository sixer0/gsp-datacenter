---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: MCP-06
date: 2026-11-01
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-469)
status: complete
---

# Implementation Report: MCP-06 teks hasil netral-MCP, peringatan C4 sekali per dokumen, smoke dua penulis

Skill: `dry-run-verify-fix`. Versi server 1.1.0 -> 1.1.1. `studio-report.ts` dan keluaran CLI tidak diubah.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Teks hasil/galat tanpa istilah CLI | complete | Berkas baru `scripts/studio/mcp/cli-text.ts` (`mcpText`, `mcpTextDeep`) memetakan `--base-rev`->`baseRev`, `--section`->`sections` (nama parameter nyata), `--write`->`write=true`, `--out-md`->`outPath`, `--out`->`downloadDir` via `studio_file_verify`, `--allow-remove`/`--allow-example`/`--require-complete`, perintah `studio-report ...`->`studio_report_...`; `--force-latest` dihapus dari petunjuk. Dipasang di teks dan data submit/update/check/refresh/draft_check dan di `toToolError` (pesan, step, details, progress). Medan isi dokumen asal server (`markdown`, `refresh`, dll.) tidak dipetakan. Basis dari ingatan: "basis rev6 (diingat server sesi ini), terkini rev7"; `basis.source` = `diingat-server` |
| 2 | C4 sekali per documentId per proses | complete | `McpSession.firstWarning` + `warnOnce` (kunci documentId; check atas laporan baru tanpa dokumen: kunci teks peringatan). Sesi/proses baru memperingatkan lagi |
| 3 | Uji unit | complete | `tests/unit/studio/mcp/mcp-text.test.ts` (5 uji): tabel pemetaan, lewati isi dokumen, alur submit/update (basis sesi, baseRev, baris kepala)/BASE_CONFLICT/refresh/SECTION_UNKNOWN/BASIS_MISSING tanpa `--opsi` atau `studio-report`, C4 sekali per dokumen + sesi baru |
| 4 | Smoke stdio dua penulis ke DEV | complete | `scripts/studio/mcp/smoke-conflict.ts`; hasil di bawah |
| 5 | Dokumen | complete | `docs/STUDIO-MCP.md`: teks netral-MCP, C4 sekali, daftar berkas, cara jalan smoke dua penulis |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `scripts/studio/mcp/cli-text.ts` | add | pemetaan istilah CLI -> MCP |
| `scripts/studio/mcp/tools.ts` | modify | pakai pemetaan; `McpSession.firstWarning`; `warnOnce`; teks basis ingatan |
| `scripts/studio/mcp/config.ts` | modify | `MCP_SERVER_VERSION` 1.1.1 |
| `scripts/studio/mcp/smoke-conflict.ts` | add | smoke dua penulis |
| `tests/unit/studio/mcp/mcp-text.test.ts` | add | uji MCP-06 |
| `docs/STUDIO-MCP.md` | modify | lihat Step 5 |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint | `npx eslint scripts/studio/mcp tests/unit/studio/mcp` | exit 0 | |
| Uji MCP | `npx vitest run tests/unit/studio/mcp` | 3 berkas, 55 uji hijau | sebelum 50 + 5 baru |
| Studio penuh | `npx vitest run tests/unit/studio` | 169 berkas, 3605 lulus, 1 skip | |
| Smoke dua penulis | `smoke-conflict.ts` ke `http://127.0.0.1:9021`, misi `2026-11-01_mcp06` | SEMUA LULUS | rahasia dari berkas lewat env, tidak dicetak; pindai 7 hasil + 9 baris stderr: tidak ditemukan |

## Verification (smoke nyata, dokumen cmvxbpg3w02dbv1xce0w9qpai)

- A submit: rev6, cid 5e699170-142f-4c1e-9f7f-662815f3e697
- B (proses MCP kedua, `cod-mcp-06-b`) update bab 3: rev7, cid 641c97e4-d49e-4f3c-a72e-20d1ec03a263
- A update bab 3 basis lama: BASE_CONFLICT (konflik `bab 3`), revisi dokumen tetap 7 (tanpa kiriman), cid MCP mcp-deb102a2-0bfa-414b-98f3-cce28de6a781, teks tanpa `--opsi`
- A refresh (tanpa berkas, `written=null`): basis rev6 -> rev7, konflik bab 3, cid a633afa0-c56f-4ddb-a565-960474401b9f
- A update basis baru (setelah penanda konflik diselesaikan, kedua isi dipertahankan): bab 1 + bab 3, rev9, cid 14d384f7-64dd-4d24-831c-7a4fcf11c450
- Baca ulang bab 3 di rev9: memuat tulisan B dan A, cid f093fe76-0b0a-480d-9e81-159ba3a7375c

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Jalan pertama smoke gagal di satu langkah (dokumen cmvxbp28t02abv1xc2ccj2haq di DEV) | 1 | skrip membaca revisi dari `data.revisionNo`, padahal ringkasan memakai `document.currentRevisionNo` | diperbaiki, jalan kedua lulus semua; dua dokumen uji tersisa di DEV | tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | Parameter nyata `sections` (bukan `section`) | memakai nama nyata di teks |
| 1 | MCP tidak punya padanan `--force-latest` | petunjuk dihapus; dicatat di dok |
| 2 | Check atas laporan baru belum punya documentId | kunci = teks peringatan (Owner + agentId) |

## Next Steps

- Verifikasi akhir controller.

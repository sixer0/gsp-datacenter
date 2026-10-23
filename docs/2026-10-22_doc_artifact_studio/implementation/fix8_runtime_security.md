---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-8
date: 2026-10-23
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-121, loop perbaikan siklus 1)
status: complete
---

# Implementation Report: FIX-8 keamanan runtime (M-01, L-03, M8, M9, L13)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Klaim path di `file_claims.md` (prefiks FIX-8) | complete | 6 baris |
| 2 | Baseline sha256 keluaran Chromium untuk masukan beku | complete | `fix8/before`, `fix8/before2` identik |
| 3 | M-01 sandbox Chromium + galat jelas | complete | instans probe terpisah, lihat Keputusan |
| 4 | L-03 biner sistem path absolut | complete | reg, taskkill, powershell |
| 5 | M8 satu definisi "render-env siap" | complete | `readiness-rules.mjs` |
| 6 | M9 gitignore keluaran S99 | complete | berkas tidak dihapus |
| 7 | L13 pesan galat tanpa path absolut (area ini) | complete | soffice + browser |
| 8 | Dry-run gate | complete | lihat Test Results |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/engine/browser/runtime.ts` | modify | `chromiumSandbox: true`, `ignoreDefaultArgs: ["--no-sandbox"]`, `assertSandboxedArgs`, `judgeSandboxRows`, `verifySandbox` (instans probe), reason `SANDBOX_UNAVAILABLE` -> `BROWSER_UNAVAILABLE`; pesan `RENDER_FAILED` generik |
| `src/lib/studio/engine/soffice/readiness-rules.mjs` | add | Modul murni bersama: definisi siap `evaluateReadiness`, pengurai manifest/registri/versi/nama fon/keluarga sesi, resolusi path, `systemBinary` |
| `src/lib/studio/engine/soffice/readiness-rules.d.mts` | add | Deklarasi tipe (pola `scripts/ensure-profile-complete.d.mts`) |
| `src/lib/studio/engine/soffice/readiness.ts` | modify | Hanya mengumpulkan fakta (reg/powershell path absolut, sesi, nama fon) lalu `evaluateReadiness`; `details` berpath ke log |
| `src/lib/studio/engine/soffice/process.ts` | modify | `taskkill.exe` path absolut, `shell: false` |
| `src/lib/studio/engine/soffice/service.ts` | modify | `redactServerPaths` untuk `details.stderr`; pesan spawn memakai errno; path biner ke log |
| `render-env/lib.mjs` | modify | Memakai modul bersama (reg/taskkill/powershell absolut, pengurai bersama); ekspor lama tetap; tambah `readHkcuFontValues` |
| `render-env/check_readiness.mjs` | modify | Kumpulkan fakta lalu `evaluateReadiness`; `--skip-session` = tidak siap; rincian path di stderr |
| `render-env/README.md` | modify | Dokumentasi definisi tunggal, L-03, L13, gitignore S99 |
| `.gitignore` | modify | `/render-env/semibold-bundle/out/`, `/render-env/semibold-bundle/fonts/` |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit (area) | `npx vitest run tests/unit/studio/renderers/browser-chromium.test.ts tests/unit/studio/renderers/soffice-render-env.test.ts` | 21/21 lulus | smoke DOCX->PDF berjalan (4846 ms, tidak di-skip); HKCU identik sebelum/sesudah |
| Unit (folder) | `npx vitest run tests/unit/studio/renderers` | 135/137 | 2 gagal di luar area: `docx-determinism` (hash DOCX `a9e3fac6` != `e9d08818`) dan `html-css-csp` (kendali C0 di `<title>`); engine docx/html tidak mengimpor browser/soffice dan sedang diubah RT-01 (10 berkas docx lebih baru dari baseline FIX-8) |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 | run pertama 5 galat sementara di `engine/chart/**` (agen lain), run ulang 0 |
| Lint | `npx eslint src/lib/studio/engine/browser src/lib/studio/engine/soffice render-env` | exit 0 | |
| Skrip | `node render-env/check_readiness.mjs` | exit 0, ready=true | 22/22 fon terdaftar; `--skip-session` exit 3 |
| Ad-hoc | `npx tsx fix8/rules_check.ts` | pass 27 fail 0 | HKCU menunjuk berkas lain -> tidak siap (dulu layanan siap), basename D-36 diterima, REG_DWORD ditolak, keluarga tak termuat -> tidak siap, pesan tanpa path, rincian berpath, biner absolut ada, SystemRoot relatif diabaikan, penjaga argumen 5/5, penilai tabel 5/5, redaksi stderr |

## Verification
- Hash sebelum = sesudah (`fix8/probe.ts`, masukan beku `fix8/in/`: HTML benchmark dari `render_cli` sebelum perubahan, SVG G-02, P-01, diagram layered; `before/sums.txt` = `after/sums.txt` = `after2/sums.txt`):
  - `d443621cc2971d49b3b4b933c025288298a22d92da52d7fa9872c098c1e390e9` chart.png (G-02, raster 300 dpi)
  - `1efa8eae608b257bf9856a4a84c66838540665f496e03d0dd7e9dbc548cff057` chart_p01.png (P-01)
  - `73d34532cc02baecd2f4429534bc5404a9b4687ccca115613522f5c4915f2bb6` diagram.png (layered)
  - `ec7377c2cb2d15b1267a44e0c45c70975ffa2d2d7fb5e69aa1bb0fbd75607933` bench_measure.json (`measureLayout` HTML benchmark)
  - `53492eb7a151e0638b3a653b67f85f829bca27e46011e6484a1ddb80a70d4cf6`, `bc1740a3885d17737ddf3f8ec30dc9c1ca72f0c6c1df3d29ba3967d1250e47c1`, `08d90129d5411938ac0da6ab302fdf069078a8ba7208169b84499fedb2571a9c`, `73f223476f81da40c86e1ca866e992732dbc7962751da5d917c15e41be8769b8` bench_page1-4.png (`previewHtml`)
  - pageCount 82, measurePages 89, blocked 0.
- HTML/DOCX benchmark via `render_cli` sebelum: DOCX `6515797f…84d2dd52`, HTML `54095e22…19f656e9` (= INT-W). Run sesudah tidak bisa dibandingkan: `render_cli` kini gagal `PARAM_UNKNOWN_KEY rail.mark.labelRunByMark` karena `benchmark/manual000/template.json` sedang diubah RT-01. Perakitan HTML/DOCX tidak mengimpor `engine/browser` maupun `engine/soffice` (grep), jadi keluarannya tidak dipengaruhi FIX-8; jalur Chromium dibuktikan lewat probe beku di atas.
- Proses Chromium (`Get-CimInstance Win32_Process`, `fix8/after/chrome_cmdlines_live.txt`, saat halaman aktif): 13 proses (browser, gpu-process, utility, 2 renderer, crashpad), 0 `--no-sandbox`. Sebelum (`fix8/before/chrome_cmdlines.txt`): 8 kemunculan `--no-sandbox` (browser, gpu, utility). Renderer: `chrome.exe --type=renderer --noerrdialogs --user-data-dir=... --no-pre-read-main-dll ...` tanpa `--no-sandbox`.
- `chrome://sandbox` instans sesudah: Renderer `Renderer/Lockdown` integritas Untrusted, GPU `Limited`/Low; instans `chromiumSandbox:false` semua `Not Sandboxed` dan `verifySandbox` menolak: `code=BROWSER_UNAVAILABLE reason=SANDBOX_UNAVAILABLE`.
- L13: `SOFFICE_PATH=C:/nope/soffice.com` -> galat klien `{"code":"PDF_ENGINE_UNAVAILABLE","details":{"errors":["soffice binary not found (check SOFFICE_PATH or manifest soffice.path)"]}}` tanpa path absolut; log soffice memuat path.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 2 uji renderer gagal (docx-determinism, html-css-csp) | 0 (bukan area FIX-8) | engine docx/html sedang diubah baris paralel (RT-01) | dilaporkan | tidak untuk FIX-8 |
| Pembanding `render_cli` benchmark sesudah | 1 | template.json RT-01 setengah jalan | diganti probe beku | tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Probe `chrome://sandbox` di instans render menggeser PNG G-02 (104 piksel, selisih maks 1/255; deterministik) | Probe di instans terpisah berumur pendek dengan opsi identik; instans render bersih -> 8/8 hash sama. Biaya ~0,5 s sekali per proses |
| 3 | Context probe memakai JS (WebUI butuh skrip) | Hanya halaman internal `chrome://sandbox`, offline, rute http(s) di-abort, instans ditutup; render tetap JS mati |
| 5 | Definisi tunggal memperketat layanan (data HKCU + keluarga sesi + `soffice.version` manifest) | Disengaja (temuan M8); host ini tetap ready=true; enumerasi sesi menambah satu panggilan PowerShell per cek (cache 300 s) |
| 5 | `--skip-session` skrip | Kini selalu `ready=false` (exit 3) agar tidak ada jalur "siap" kedua; uji S72 menerima exit 0/3 |
| 7 | Bahasa pesan kesiapan skrip | Kini Inggris (sama dengan layanan) karena satu sumber pesan |
| - | M-03 (antrean Chromium/soffice tak berbatas) dipetakan D-121 ke FIX-1, tetapi berkasnya (`browser/runtime.ts` `withLock`, `soffice/service.ts` `waiters`) ada di area FIX-8 | Dialihkan controller ke FIX-8 dan dikerjakan: antrean soffice dan Chromium berbatas panjang + lama tunggu -> `RENDER_QUEUE_FULL` 503 + `retryAfterSec` (rincian `delegation_progress/coder_execution_fix8.md`). Bukti akhir per instruksi user: tsc seluruh repo exit 0, eslint area exit 0 |
| - | L7 (`lib.mjs run()` tanpa tenggang pasca tree-kill) | Di luar brief; tidak diubah |

## Next Steps
- Review direkomendasikan: `engine/browser/runtime.ts`, `engine/soffice/{readiness-rules.mjs,readiness.ts,service.ts,process.ts}`, `render-env/{lib.mjs,check_readiness.mjs}`.
- Controller: putuskan rute M-03 untuk berkas di area FIX-8.

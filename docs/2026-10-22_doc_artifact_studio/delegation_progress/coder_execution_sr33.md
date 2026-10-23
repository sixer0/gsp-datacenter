# SR-33 — catatan coder-execution (CLI render v2)

Status: complete (gerbang ringan D-133). Skills: backend-execution, dry-run-verify-fix. Klaim: `file_claims.md` prefiks SR-33.

## Tindakan pertama: keadaan `lib/render.ts` peninggalan FIX-3
- Ditemukan KONSISTEN: tsc 0 galat di berkas, eslint 0, semua impor terpakai. Tangkapan figur FIX-3 (`RenderReport.figure.engineReport` nama medan Python + `figure.ports` mm) lengkap dan sudah dikonsumsi `run_parity.ts` `figureContext` + `compare_svg.py --context`. Tidak ada bagian setengah jadi yang perlu dikembalikan. Salinan keadaan FIX-3: `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/sr33/render.ts.fix3_state` (sha e4209347…).
- Satu ketidaksesuaian dengan D-155 diselesaikan: chart mandiri memakai `renderChart(spec, tpl)` → kini `pureChartSvg` (komposit = `COMPOSITE_CHART_TEMPLATE`).

## Berkas (ubah)
- `scripts/parity/run/lib/render.ts`: dokumen v1 kini lewat `renderSnapshot` (IP-43a; pipeline salinan `svgFor`/`prepareFigureStore`/assemble dihapus); jalur v2 `studio.doc/v2` + `studio.chapter/v2` (opsi `--base`): kerangka templat v2 atau `implicitSkeleton`, meta bawaan `resolveMetaDefaults`, `emptyResolvedDoc` → `mergeSubmission` (pid `seededPidAllocator`, benih = sha256 masukan atau `--pid-seed`) → `composeV2` (draft bila lingkup ≠ document) → `applyRenderScope` → `renderSnapshot`. Templat `studio.template/v2` lewat `loadResolvedTemplateV2File`. Modul v2 dimuat lewat seam dinamis `V2_SEAMS` (seam belum ada = NOT_READY exit 1, tidak pernah jatuh ke v1). Galat compose/lingkup = salah pakai exit 2 dengan kode kontrak. Laporan aditif: `scope`, `compose`, `orchestrator`.
- `scripts/parity/run/render_cli.ts`: flag `--scope document|chapter:<k>|slot:<key>`, `--base`, `--pid-seed`; bantuan diperbarui.

## Bukti (2026-10-23)
- tsc seluruh repo: 0 galat di `scripts/parity/**`; 115 galat di luar area (playground, section-composer, template-editor, revisions/v2, route studio — baris lain sedang menulis).
- `npx eslint scripts/parity/run/render_cli.ts scripts/parity/run/lib/render.ts`: exit 0.
- Asap E1 (contoh register, `sr33/e1.doc.v2.json`) `--scope chapter:2`: `status=SUCCEEDED scope=chapter:2 exit=0` DOCX+PDF+HTML (compose SR-08 mendarat saat baris berjalan). Dua run = DOCX byte-identik (d7ccd216…), dokumen memuat hanya bab 2 dengan `Tabel 2.1`.
- v1 `benchmark/manual000/doc.json` + `template.json`: SUCCEEDED exit 0; DOCX byte-identik dengan sebelum perubahan (07815c46…, 5.412.630 B), lint 157 cek sama. PDF beda sha antar-run (juga sebelum perubahan; soffice tidak deterministik).
- v1 `--scope chapter:2`: SUCCEEDED (1 unit, 17 blok). Salah pakai `--scope bogus|chapter:|slot:a/b`, `--base` pada v1, lingkup pada chart: exit 2. Bab tak ada → exit 2 ADDRESS_NOT_FOUND. Kiriman bab tanpa meta → exit 2 META_REQUIRED_FOR_CREATE. Bab 3 v2 + `--base` E1: exit 0.

## Temuan (luar area)
- E1 `--scope document` gagal DOCX: "Renderer DOCX untuk jenis blok sourceRegisterEntry belum tersedia (F:references/1)" → SR-16/SR-08.
- `renderSnapshot` masih `asSnapshot` v1; CLI memakai `validateSnapshot:false` untuk v2 sampai delta §15.1 (SR-15). `scope`/`draft` diteruskan lewat `extendContext`; `slots` (ResolvedSlot) belum diisi CLI.
- PDF soffice tidak byte-identik antar-run (KD-22 hanya terpenuhi DOCX/HTML).

Review direkomendasikan (lingkup `scripts/parity/run/**`) di fase akhir.

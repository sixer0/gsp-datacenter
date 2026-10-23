# IP-43a — catatan coder-execution (orkestrator render tanpa DB)

Status: complete. Area: `src/lib/studio/services/render/pure/**` (BARU). Masukan: baris IP-43a + §2.9 blueprint 05, FIX-5 (`file_requests.md:101-102`), D-129, D-134, `services/render/**`.

## Berkas (baru)
- `pure/render.ts` — `renderSnapshot(snapshot, template, opts)`: urutan §8.2 lewat fungsi layanan yang ada (`asSnapshot`, `templateForDoc`, `preloadAssetBytes`, `buildFigures`, `assembleDocx`, `convertDocxToPdf`, `assembleHtml`, `measureLayout`, `lintAfterRender`, `withJobTimeout`, `finalStatus`). Keluaran byte berkas di memori + nama DATUM; tanpa penyimpanan/DB. Opsi: `formats`, `tier`, `applyDocOverrides`, `job` (job DB milik SR-15), `artifacts`, `readiness`, `naming`, `measureLayout`, `timeoutMs`, `onSofficeEvent`, `extendContext` (nilai efektif slot SR-15).
- `pure/job.ts` — `DetachedRenderJob` (`persist` no-op) + `createDetachedJob`; `InlineSpecReader` (rujukan artefak dari `opts.artifacts`, tanpa entri -> ARTIFACT_NOT_FOUND, bukan kueri).
- `pure/chart.ts` — `COMPOSITE_CHART_TEMPLATE` (= `EMPTY_CHART_TEMPLATE`), `pureChartSvg`, `chartTemplateFor`: komposit diberi templat bawaan EKSPLISIT; identik byte dengan `chartSvg` produksi.
- `pure/index.ts` — ekspor publik.

## Bukti (2026-10-23)
- `npx tsc --noEmit -p tsconfig.json` exit 0, 0 `error TS` (seluruh repo; 4 berkas pure tercakup `--listFilesOnly`).
- `npx eslint src/lib/studio/services/render/pure` exit 0.
- Asap gerbang (`env -u DATABASE_URL npx tsx --tsconfig tsconfig.json <scratch>/smoke_ip43a.ts <repo> tests/parity/fixtures/doc/doc_nota_memo.json <out> DOCX bm-fig-17.chart.json`, penjaga `globalThis.prisma` = Proxy pelempar): `DATABASE_URL at start: <unset>` · `status=SUCCEEDED tier=NOTA formats=DOCX failed=[]` · DOCX 1221485 B magic PK · `composite bm-fig-17 production==pure: true` · `prisma touches: 0` · exit=0.
- Asap tambahan (PrismaClient asli, `DATABASE_URL` palsu tak terjangkau 127.0.0.1:1): `doc_terbit_report` DOCX+HTML+SVG+PNG SUCCEEDED, 4 figur (chart, 2 diagram, lembar simbol), lint TERBIT FAIL 105 cek (informatif), exit=0.

## Keputusan / temuan
- Komposit: templat bawaan eksplisit (bukan templat dokumen) = perilaku produksi kini; runner paritas lama memakai templat dokumen -> SR-33 berubah searah produksi.
- Impor `@prisma/client` transitif (figures/job/storage/ingest) memuat `.env` repo ke `process.env` saat impor (`DATABASE_URL at end: <SET>` pada run tanpa env), tanpa koneksi dan tanpa akses Prisma. Usul impor malas ke pemilik.
- Pure hanya cek kesiapan render-env bila PDF diminta atau `readiness` diberi (produksi selalu cek untuk info mesin job).
- Log `FILE_NOT_FOUND` di log mesin kedua asap: hipotesis aset kanonik tidak dipindai (`canonicalTemplate(repo, false)` di skrip asap), bukan galat orkestrator.

## Permintaan (file_requests.md, prefiks IP-43a, semua tidak memblokir)
figures.ts `chartSvg` -> `pureChartSvg`; revision.ts SR-15 memakai `renderSnapshot`; impor Prisma malas; SR-33/SR-34 memakai `renderSnapshot`.

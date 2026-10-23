# S51 Orkestrator render (coder-execution, 2026-10-23)

Status: complete (penjaga kompilasi/lint; uji fungsional ada di S74/S75). Skills: backend-execution, dry-run-verify-fix.

## Berkas (`src/lib/studio/services/render/`, 9 berkas, 1604 baris)
- `index.ts` - I41 persis (`renderRevision`, `renderArtifact`) + aditif `renderJobToDto`, `installRenderLogSinks`, `lintAfterRender`, `lintArtifact`, `releaseFor`, `FORMAT_MIME`, `normalizeFormats`.
- `revision.ts` - job QUEUED->RUNNING; `checkRenderEnvReadiness` saat worker mulai (tidak siap -> PDF `PDF_ENGINE_UNAVAILABLE`, DOCX/HTML tetap); templat yang dipin (S49); figur; DOCX (S20); PDF = DOCX -> `convertDocxToPdf` (S92, D-15; event `SOFFICE_QUEUED` -> status QUEUED lalu RUNNING); HTML (S24) + `measureLayout`; lint; serah S52 (`docDir`, `datumFileName`, `writeOutput`; figur ke `rev-n/figur` bila SVG/PNG diminta); `StudioRevision.releaseStatus/lintReport`.
- `artifact.ts` - CHART/DIAGRAM -> SVG/PNG 300 dpi, IMAGE -> PNG (decodeImage + pxGuard S53), HTML -> studio.html/v1 (sumber dokumen/inline/artefak); format tak sah per jenis -> SCHEMA_INVALID sebelum job.
- `figures.ts` - `prepareFigureStore` (S19) dengan svgFor: chart S32 (`renderChart`/`renderComposite`), diagram S30, lembar simbol S31; spec `{artifactId}` dibaca dari StudioArtifact.
- `lint.ts` - `runLint` (S44, stage post) + structure/language/render (S45-S47) hanya untuk checkId yang belum dilaporkan runner; status rilis per tier (tidak menahan berkas).
- `job.ts` - siklus StudioRenderJob, penjaga `RENDER_IN_PROGRESS` (proses + DB QUEUED/RUNNING < C08), batas waktu job C08 -> RENDER_TIMEOUT, status akhir SUCCEEDED/PARTIAL/FAILED, DTO.
- `joblog.ts` - F-020: `setSofficeLogSink` + `setBrowserLogSink` diarahkan ke log job; dipersistenkan di `StudioRenderJob.engine.log` (maks 300 entri, galat diprioritaskan) pada setiap tulis status. Entri tanpa korelasi disiarkan ke job aktif; yatim dilampirkan ke job berikutnya.
- `naming.ts`, `common.ts` - MIME, urutan format, nama figur/artefak DATUM-38, relDir artefak §7.2, serah-terima per berkas.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/services/render"` -> kosong (exit 1). Total repo 26 galat: 21 pra-ada luar Studio + 5 di `engine/diagram/build` (S30, sedang dikerjakan).
- `npx eslint src/lib/studio/services/render` -> exit 0, 0 masalah.
- Smoke `npx tsx` (scratchpad `s51_smoke.ts`): format `[DOCX,PDF,PNG]`; nama `Manual Komprehensif DATUMGSP 000-GSP-STD-X-2026 RevA.docx`; status 3/3->SUCCEEDED, 2/3->PARTIAL, 0/2->FAILED; log soffice (berkorelasi, tanpa korelasi, yatim) masuk log job1 dan listener `SOFFICE_QUEUED` terpicu; `data/studio-workspace/logs` tidak dibuat.

## Keputusan
1. Format kosong revisi -> `doc.outputs`, lalu DOCX+PDF+HTML; artefak -> semua format sah jenisnya.
2. Diagram dibangun `release:false`; gerbang labels_verified tier TERBIT/SERAH = cek lint `P1-labels_verified` (tidak menahan berkas).
3. Rasterisasi figur gagal -> semua format dokumen gagal (job FAILED); galat per figur -> figur dilewati + galat job (PARTIAL).
4. Artefak tanpa versi templat: templat kanonik jenisnya, lalu kanonik DOCUMENT. HTML sumber artefak: `htmlShell` dengan meta sintetis (judul/pembuat/tanggal artefak, tier NOTA).
5. Gambar JPEG tidak ditranskode ke PNG -> ASSET_TYPE_UNSUPPORTED.

## Permintaan / temuan
- file_requests: kode kontrak `RENDER_FAILED`, `STORAGE_WRITE_FAILED` (tidak blocking; sementara BY_CONSTRUCTION_FAILED / FILE_MISSING_ON_DISK).
- Bergantung pada stub yang belum terisi: S24 assembleHtml, S21 htmlShell, S44-S47 lint, S49 resolveTemplate, S52 storage, S53 images, S48 normalize; galat stub ditangkap per format (job PARTIAL/FAILED), tidak crash.
- Klaim `implementation/51_render_orchestrator.md` tidak dipakai (catatan ini menggantikannya).

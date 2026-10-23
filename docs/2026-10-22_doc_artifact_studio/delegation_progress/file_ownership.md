# File ownership — Doc Artifact Studio

Penulis: controller. Sumber: Execution Profile blueprint `identification/02_structured.md`. Diperbarui setiap batch mulai/mendarat.

## Berkas bersama dan penulis tunggal

| Berkas / sumber daya | Penulis tunggal |
|---|---|
| `prisma/schema.prisma`, `prisma/migrations/<studio>`, migrate deploy ke v21 | S03 (G0); delta berikutnya hanya lewat baris S03-dN yang dijadwalkan controller |
| `package.json`, `package-lock.json`, `npm install` | S03 (G0); S69 (G1e) untuk permintaan tertunda |
| `src/lib/studio/contract/**` | S03; read-only setelah marker `implementation/01_contract_landed.md` |
| Stub indeks modul (`src/lib/studio/engine/*/index.ts`, `params/*.ts`, `registry/*.ts`) | Dibuat S03; sesudah marker milik baris modulnya |
| `src/components/sidebar.tsx`, `src/components/command-palette.tsx`, `next.config.ts`, `.gitignore` | S69 |
| `docs/API-REFERENCE.md` | S68 |
| `prisma/seed-studio.ts` + eksekusi seed v21 | S70 |
| `render-env/` | S91 (kecuali `render-env/semibold-bundle/` = S99) |
| `benchmark/extract`, `benchmark/manual000/doc.json` | S93 |
| `benchmark/manual000/figures` | S94 |
| `benchmark/manual000/template.json` | S95 |
| `benchmark/harness/compare` | S96 |
| `benchmark/harness/run` | S97 |
| Berkas controller (`README.md`, `status_tasks.md`, `decisions/`, `findings/`, `implementation/99_*`, `report/`, `gateway_check/01_*`, `delegation_progress/driver_rules.md`, `delegation_progress/file_ownership.md`) | Controller |

## Log batch

| Tanggal | Batch | Baris | Lebar | Catatan |
|---|---|---|---|---|
| 2026-10-22 | GP-a | S90, S02 | 2 | Dokumen saja (research/07, research/06); tanpa klaim kode |
| 2026-10-22 | GP-b | S01 | 1 | Dokumen saja |
| 2026-10-22 | G0 (+D-25) | S03, S64, S65, S66, S96 | 5 | S03 tunggal atas schema/package/contract; S64-S66 scripts/parity/{reference/doc,reference/fig,compare}; S96 benchmark/harness/compare. Lebar > 4 diizinkan D-07/D-25 |
| 2026-10-23 | G1a | S04-S14, S25, S91, S92, S93 | 15 | params/{governance-language,color-type,page,apparatus,figure}.ts = S04-S08; registry/charts.ts S09, registry/lint.ts S10; engine/tokens S11, engine/bind S12, studio/assets S13, engine/docx/package S14, engine/browser S25, render-env/ S91 (kecuali semibold-bundle), engine/soffice S92, benchmark/extract + manual000/doc.json S93 |
| 2026-10-23 | G1b | S15-S19, S21-S23, S26-S28, S31, S94, S95, S99 | 15 (+3 G1a berjalan = 18) | docx/{fonts,blocks,tables,wrapper,figures}, html/{base,blocks,tables}, diagram/{core,layout-a,layout-b}, symbols, benchmark/manual000/{figures,template.json}, render-env/semibold-bundle |
| 2026-10-23 | G1c (+S70) | S20, S24, S29, S30, S32, S44-S52, S70 | 15 (+17 berjalan = 32) | docx/assemble, html/assemble, diagram/{layout-c,build}, chart/core, lint/{scan,render,structure,language}, services/{ingest,templates,revisions,render,storage}, prisma/seed-studio.ts + seed v21; CPU 19,8% |
| 2026-10-23 | Pass integrasi (gel. 1) | INT-A, INT-B, INT-C, INT-D, INT-E | 5 (+15 berjalan) | INT-A services/{render,storage}; INT-B engine/docx/** + benchmark/manual000/template.json; INT-C services/ingest + engine/lint/scan; INT-D contract/**, params/**, registry/sections.ts, services/templates/**, masterplan/01_specs.md (aditif); INT-E src/app/api/studio/** + src/lib/studio/http/**. Saling lepas; area pemilik asal sudah tertutup |
| 2026-10-23 | Pass integrasi (gel. 1b) | INT-F, INT-G | 2 | INT-F engine/html/**; INT-G engine/browser/** |
| 2026-10-23 | Pass integrasi (gel. 1c) | INT-H, INT-I | 2 | INT-H src/components/studio/** + src/app/studio/**; INT-I prisma/seed-studio.ts + baris data uji DB v21 + data/studio-workspace uji |
| 2026-10-23 | Pass integrasi (gel. 2) | INT-J, INT-K | 2 | INT-J engine/diagram/layout-c; INT-K assets/fonts lisensi + 6 berkas src/app lama + schema WorkerTrace + migrasi baseline + docs/ARCHITECTURE.md |
| 2026-10-23 | Pass integrasi (gel. 2b) | INT-L | 1 | scripts/parity/reference/fig/** (tambalan in-process acuan K-01) |
| 2026-10-23 | Pass integrasi (gel. 2c) | INT-M | 1 | services/ingest, engine/bind, engine/html/tables/reproduction.ts (+derivation.ts impor), services/revisions |
| 2026-10-23 | Pass integrasi (gel. 2d) | INT-N | 1 | engine/chart/** (core + semua keluarga) + registry/charts.ts |
| 2026-10-23 | Pass integrasi (gel. 2e) | INT-O | 1 | engine/lint/render, engine/soffice |
| 2026-10-23 | Pass integrasi (gel. 2f) | INT-P | 1 | services/ingest, services/templates, engine/lint/structure/enforcement.ts (+ impor scan/enforcement.ts); template.json hanya penanda terbatas bila perlu (koordinasi INT-B) |
| 2026-10-23 | Pass integrasi (gel. 2g) | INT-Q | 1 | engine/docx/figures/**, docx/wrapper/media.ts, engine/html (resolusi aset), services/render/lint.ts + figures.ts |
| 2026-10-23 | Diagnosis (gel. 2h) | IP-37 | 1 | baca-saja; hanya catatan coder_execution_ip37.md + keluaran di Temp/hq_v21_clone/ip37 |
| 2026-10-23 | Pass integrasi (gel. 2i) | INT-R | 1 | api/studio/validate/route.ts, services/render/artifact.ts, api/studio/artifacts/_lib/prepare.ts, services/revisions/index.ts, components/studio/template-editor/**, scripts/ensure-profile-complete.d.mts, impor ulang datum-manual-000 ke DB v21 |
| 2026-10-23 | Pass integrasi (gel. 2j) | INT-S | 1 | engine/docx/fonts/**, assets/fonts/renamed/**, assets/manifest.json (entri fon renamed), tests/unit studio fonts (baru) |
| 2026-10-23 | Pass integrasi (gel. 2k) | INT-T | 1 | engine/docx/wrapper/xml.ts, engine/docx/blocks/{props,media}.ts, engine/docx/figures/asset-bytes.ts → engine/bind/asset-bytes.ts + impor di docx/figures, docx/wrapper/media.ts, html/blocks/device.ts, html/tables/figure.ts |
| 2026-10-23 | Pass integrasi (gel. 2l) | IP-02 | 1 | benchmark/manual000/figures/** (spec + validate_figures.ts + raster index bila perlu) |
| 2026-10-23 | Pass integrasi (gel. 2m) | INT-U | 1 | src/app/api/studio/artifacts/route.ts (+ _lib selain prepare.ts bila perlu) |
| 2026-10-23 | Pass integrasi (gel. 2n) | INT-V | 1 | src/lib/studio/params/index.ts (konstanta hitungan) + eksekusi seed-studio sinkron kanonik ke DB v21 |
| 2026-10-23 | Pass integrasi (gel. 2o) | INT-W | 1 | engine/docx/package/xml.ts (aditif), engine/docx/blocks/xml.ts, engine/docx/wrapper/xml.ts, engine/docx/blocks/props.ts |
| 2026-10-23 | Final F1a | S71, S72, S73, S83, S84 | 5 | S71 tests/unit/studio/engine-core/**; S72 tests/unit/studio/renderers/**; S73 tests/unit/studio/figures/**; S83 gateway_check/02_review_engine_docs.md; S84 gateway_check/03_review_figures.md. Deviasi lokasi: tests/unit/studio/<area> (bukan tests/studio/unit) agar seragam dengan suite unit repo |
| 2026-10-23 | Final F1b-1 | S86, S76, S78, S79 | 4 | S86 gateway_check/05_review_ui_harness.md; S76 test/02_parity_docx.md + tests/parity/out/s76; S78 test/04_parity_diagram.md + tests/parity/out/s78; S79 test/05_parity_chart.md + tests/parity/out/s79 (dijalankan ulang untuk area IP-39 setelahnya) |
| 2026-10-23 | Final F1b-2 | S74, S85, S87 | 3 | S74 tests/unit/studio/api/**; S85 gateway_check/04_review_services_api.md; S87 gateway_check/06_security_review.md |
| 2026-10-23 | Permintaan user (uji manual) | UT-01 | 1 | prisma/seed-studio.ts (flag --import-datum-gsp) + templat datum-gsp di DB v21 |
| 2026-10-23 | Loop perbaikan | FIX-5 | 1 | benchmark/harness/run/** + docs/STUDIO-AGENT-GUIDE.md + docs/API-REFERENCE.md §12 |
| 2026-10-23 | Koreksi user + loop perbaikan | RT-01, FIX-1, FIX-5, FIX-6, FIX-8 | 5 | RT-01 benchmark/manual000/{doc.json,doc.verbatim.json,template.json}, benchmark/extract/**, engine/docx/{blocks,wrapper,assemble}/**, engine/html/{blocks,assemble,base}/** (penerapan format peran); FIX-1 services/{ingest,revisions,templates,render(job/antrean),storage}/**, src/app/api/studio/**, src/lib/studio/http/**, contract/enums (kode galat); FIX-5 benchmark/harness/run/**; FIX-6 engine/docx/fonts/**, assets/fonts/**, assets/manifest.json, params/**, engine/lint/scan/**, engine/tokens/** (derive T); FIX-8 engine/browser/**, engine/soffice/**, render-env/** |
| 2026-10-23 | Loop perbaikan | FIX-3 | 1 | scripts/parity/**, tests/parity/fixtures/** |
| 2026-10-23 | Loop perbaikan | IP-39a, IP-39b | 2 | IP-39a src/lib/studio/engine/chart/**, registry/charts.ts, contract/schema/chart.schema.ts (IP-40 aditif), engine/lint/render/**, benchmark/manual000/figures/** (hanya pindah panelParamsMoved ke params); IP-39b src/lib/studio/engine/diagram/**, engine/symbols/** |
| 2026-10-23 | Refaktor B0 | SR-01, SR-02, SR-34, IP-41a, IP-41b, IP-42a, IP-42b, IP-42c, IP-43a, IP-43b, IP-43c, IP-43d, RQ-1..RQ-6 | 18 | Area per kolom Expected Output blueprint 05 (saling lepas: chart / lint-render / symbols / render/figures.ts / benchmark specs fig-25,38 / render/pure / templates/index.ts+api templates/route.ts / seed-studio.ts / html/base/fonts.ts / docx package/xml.ts+assemble/bind.ts / docx tables/render.ts / docx figures / templates/profile.ts / html (kecuali assemble, base/fonts.ts) / docx package/header-footer.ts / benchmark harness run / masterplan 03 / research 08). Lebar 18 > 4: D-07/D-41, mediasi aktif |
| 2026-10-23 | Desain UX | UX-01 | 1 | masterplan/04_studio_ux_spec.md (dokumen saja) |
| 2026-10-23 | Refaktor B1 (awal) | SR-59 | 1 | research/09_param_surface_design.md (dokumen saja) |
| 2026-10-23 | UI fondasi | FIX-4a | 1 | src/components/studio/shared/**, src/app/studio/{layout,error}.tsx, src/app/studio/{documents/[id],templates/[id]}/error.tsx, document-viewer/studio-subnav.tsx, src/lib/studio/contract/ui.ts (aditif), src/components/{sidebar,command-palette}.tsx, src/components/ui/kit.tsx (aditif, T-8) |
| 2026-10-23 | Refaktor B1 | SR-03, SR-04, SR-05, SR-60 | 4 | SR-03 prisma/schema.prisma (aditif) + migrasi struktur; SR-04 src/lib/studio/contract/** (penulis tunggal); SR-05 registry/{slots,essentials}.ts (baru), params/structure.ts (baru), params/index.ts, registry/index.ts, params/render.ts R-09/R-10 + perluasan enum P4S-13 + ParamDef symbol.sheet.fit; SR-60 src/lib/studio/engine/tokens/** |
| 2026-10-23 | Refaktor B2a + SR-16 | SR-06..SR-15, SR-16, SR-18..SR-26 | 20 | Area per kolom Expected Output blueprint 05 + KC-7/KC-9/KC-10 (D-166): SR-15 + services/render/pure/** + services/render/figures.ts; SR-16 + engine/docx/assemble/bind.ts + engine/docx/package/{section,header-footer}.ts + engine/docx/wrapper/render.ts; SR-18 + registry/lint.ts. Plafon 20 penuh, mediasi aktif |
| 2026-10-23 | Refaktor B2b (bergulir) | SR-17 | +1 | src/lib/studio/engine/html/assemble/** + HTML @page (KC-7) |
| 2026-10-23 | Refaktor B2b (bergulir) | SR-61 | +1 | src/app/api/studio/templates/route.ts, src/app/api/studio/templates/[id]/route.ts |
| 2026-10-23 | Refaktor B2b (bergulir) | SR-27 | +1 | src/app/api/studio/registry/route.ts |
| 2026-10-23 | Refaktor B2b (bergulir) | SR-33 | +1 | scripts/parity/run/render_cli.ts, scripts/parity/run/lib/render.ts |
| 2026-10-23 | Refaktor B2b (bergulir) | SR-30 | +1 | src/components/studio/document-viewer/** (kecuali studio-subnav.tsx milik FIX-4a), src/app/studio/documents/**, src/app/studio/page.tsx |
| 2026-10-23 | Refaktor B2b (bergulir) | SR-29 | +1 | src/components/studio/template-editor/**, src/components/studio/template-preview/** (penyesuaian esensial), src/app/studio/templates/{page,[id]/page,[id]/versions/page}.tsx |
| 2026-10-23 | Koreksi log | SR-29 | 0 | BELUM diluncurkan — batas 20 subagen tercapai (SR-18 dilanjutkan untuk koreksi D-178); antre untuk slot berikutnya |
| 2026-10-23 | Refaktor B2b (bergulir) | SR-29 | +1 | (diluncurkan sekarang; area sesuai baris log sebelumnya) |
| 2026-10-23 | Refaktor B2b (bergulir) | SR-28 | +1 | src/components/studio/section-composer/**, src/app/studio/templates/[id]/sections/page.tsx |
| 2026-10-23 | Refaktor B2b (bergulir) | SR-31 | +1 | src/components/studio/playground/**, src/app/studio/playground/page.tsx |
| 2026-10-23 | Refaktor B2b (bergulir) | SR-35 | +1 | docs/STUDIO-AGENT-GUIDE.md, docs/API-REFERENCE.md (seksi Studio) |
| 2026-10-23 | Refaktor B2b (bergulir) | IP-41d | +1 | src/lib/studio/contract/schema/chart.schema.ts (+ tipe panel chart terkait, aditif) |
| 2026-10-23 | Refaktor B2b (bergulir) | IP-45 | +1 | benchmark/manual000/figures/tools/** (+ pindah panelParamsMoved bila belum = IP-41e tetap terpisah) |
| 2026-10-23 | Refaktor B2b (bergulir) | IP-46 | +1 | src/app/login/** (HQ non-Studio; izin controller D-164) |
| 2026-10-23 | Refaktor B3 (awal) | SR-32 | +1 | benchmark/manual000/{doc.v2.json,template.v2.json} (baru) + skrip konversi baru di benchmark/extract/ |
| 2026-10-23 | Refaktor B2b (temuan SR-33) | RQ-7 | +1 | src/lib/studio/engine/docx/blocks/** (renderer entri referensi), src/lib/studio/engine/html/blocks/** (padanan) — hanya berkas baru/bagian entri referensi |
| 2026-10-23 | Refaktor B3 | SR-37 | +1 | prisma/backfill-studio-structure.ts (baru) + baris M14-M18 di DB v21 (penulis DB v21 untuk backfill) |
| 2026-10-23 | Refaktor B3 | IP-41c | +1 | src/lib/studio/registry/charts.ts, src/lib/studio/engine/chart/**, src/lib/studio/params/index.ts (hanya pin hitungan) |
| 2026-10-23 | Refaktor B2b (backlog) | IP-49 | +1 | src/middleware.ts (HQ auth; izin controller; hanya penambahan ?next= pada pengalihan ke /login) |
| 2026-10-23 | Refaktor B3 | SR-36 | +1 | prisma/seed-studio.ts (flag --presets-and-skeletons, --import-manual000-v2) + baris seed DB v21 (penulis seed DB v21 tunggal saat jalan) |
| 2026-10-23 | Refaktor backlog | IP-50 | +1 | src/lib/studio/engine/docx/package/index.ts, src/lib/studio/engine/docx/wrapper/formats.ts, src/lib/studio/engine/tokens/** (ekspor + hapus alias), pemakai alias pageSizeFromKnob di engine/docx + engine/html (impor saja), alias P4S-13 di engine/html |
| 2026-10-23 | Refaktor perbaikan | IP-52 | +1 | src/lib/studio/services/structure/** (rekomposer norm/v1) + src/lib/studio/services/revisions/** (lockAndLoad untuk v1 ber-baris) |
| 2026-10-23 | Refaktor perbaikan | IP-53 | +1 | benchmark/harness/run/lib/pipeline.ts (tipe IngestResultV2), services/submit/** dan engine/lint/scan/walk.ts HANYA bila sebab N1 folder misi ada di sana |
| 2026-10-23 | Refaktor penutup | FIX-4b, IP-54, IP-48 | 3 | FIX-4b src/components/studio/{revision,artifact-gallery,render-status}/** + src/app/studio/{artifacts,system}/** + shared/{dialog,completeness-rail}.tsx (permintaan SR-30/SR-31); IP-54 src/app/api/studio/{documents/route.ts,assets/route.ts}, services/revisions (listRevisions), services/storage/files.ts; IP-48 src/lib/studio/contract/** (RenderContext AnyNormSnapshot, snapshot.compose, DeriveFnId pageSizeFromKnob dihapus, ImageV2.source opsional), engine/tokens/grid.ts (satisfies), params/structure.ts (komentar), impor Prisma malas di services/{storage,ingest,images} |
| 2026-10-23 | Refaktor B4 | IP-41e | +1 | benchmark/manual000/figures/{index.json,specs/*.chart.json} (+ tools generator bila perlu agar regenerasi konsisten) |
| 2026-10-23 | Refaktor sisa SR-32 | RQ-8, RQ-10 | 2 | RQ-8 src/lib/studio/params/{structure,render}.ts (+registry essentials bila kenop toc) + src/lib/studio/services/compose/** (tocSpec, kelas lebar image/symbolSheet) + benchmark/manual000/datum-manual-000.preset.json (nilai toc); RQ-10 src/lib/studio/services/adapt-v1/** |
| 2026-10-23 | Refaktor sisa | RQ-9, SR-35b | 2 | RQ-9 benchmark/harness/run/** (pemetaan spec S94 → ChartV2/DiagramSpecV2 saat substitusi; diagnosis panels > 12 — perubahan kontrak/adaptor lewat file_requests); SR-35b docs/STUDIO-AGENT-GUIDE.md, docs/API-REFERENCE.md |
| 2026-10-23 | Refaktor sisa | RQ-11 | 1 | src/lib/studio/contract/{schema/v2,types/v2}/** (bagian chart/komposit saja), src/lib/studio/services/adapt-v1/** (pemetaan chart), src/lib/studio/services/compose/** (bila v2 → mesin perlu medan baru) |
| 2026-10-23 | Refaktor sisa | RQ-12 | 1 | benchmark/extract/convert_v2.ts, src/lib/studio/contract/types/v2/norm.ts (NORM_COMPOSE_PARAM_KEYS saja), src/lib/studio/registry/slots.ts (cakupan image/symbolSheet) |
| 2026-10-23 | Refaktor sisa | SR-38 | 1 | prisma/seed-studio.ts (perbaikan Δ meta.intendedDelta) + runtime DB v21 (penulis DB tunggal) |
| 2026-10-23 | Refaktor sisa | DOC-1 | 1 | masterplan/03_structural_sections_specs.md (T2-24/T2-25), docs/STUDIO-AGENT-GUIDE.md, docs/API-REFERENCE.md §12 |
| 2026-10-23 | Refaktor sisa | SR-38 (lanjutan, D-228) | 1 | + prisma/backfill-studio-structure.ts (mode tulis-ulang baris norm/v1) |
| 2026-10-23 | Refaktor sisa | FIX-5 | 1 | src/lib/studio/contract/schema/v2/forbidden.ts (+ klasifikasi DISPLAY_FIELD terkait bila perlu) |
| 2026-10-23 | Refaktor sisa | SUB-1 | 1 | src/lib/studio/services/submit/** + route penerima studio.doc/v2 (src/app/api/studio/documents/route.ts) |
| 2026-10-23 | Fase akhir — perbaikan | FIX-B | 1 | benchmark/harness/run/** (B-1 kerangka ke ingest), src/lib/studio/engine/diagram/** bagian sld/sheet (B-2) |
| 2026-10-23 | Loop perbaikan siklus 1 | FIX-S | 1 | src/lib/studio/services/{submit,revisions,ingest}/**, services/compose/merge.ts, route studio yang memakai Ajv (M8) |
| 2026-10-23 | Loop perbaikan siklus 1 | FIX-K2 | 1 | services/compose/blocks.ts (figureWidthMm), engine/docx + engine/html penempatan gambar, params turunan bila perlu |
| 2026-10-23 | Fase akhir | SR-41 (perluasan D-243) | 1 | tests/parity/fixtures/{manifest.json,src/docs.ts,src/validate_fixtures.ts} |
| 2026-10-23 | Loop perbaikan siklus 1 | FIX-FIG (menggantikan FIX-K2) | 1 | services/compose/blocks.ts, engine/chart/core/**, engine/symbols/**, engine/docx/figures/**, engine/docx/tables/{widths,guards}.ts, engine/docx/package/parts.ts, engine/html (figure/tables figure) |
| 2026-10-23 | Loop perbaikan siklus 1 | FIX-C | 1 | scripts/parity/run/lib/render.ts, scripts/parity/run/render_cli.ts |
| 2026-10-23 | Loop perbaikan siklus 1 | FIX-U | 1 | src/components/studio/** (rel, pratinjau templat), skrip glosarium (scripts/studio/glossary-check.*) |
| 2026-10-23 | Loop perbaikan siklus 1 | FIX-SEC | 1 | src/app/login/safe-next.ts, src/middleware.ts, src/lib/**/require-session.ts, services/images/** + route assets (kuota), modul log/redactSecrets Studio |
| 2026-10-23 | Loop perbaikan siklus 1 | FIX-R | 1 | src/lib/studio/services/render/{artifact,common}.ts, src/lib/studio/services/compose/structure.ts |
| 2026-10-23 | Loop perbaikan siklus 1 | FIX-FIG (perluasan D-252) | 1 | + src/lib/studio/services/render/figures.ts (meneruskan lebar/grid ke diagram) |
| 2026-10-23 | Loop perbaikan siklus 1 | FIX-SEED | 1 | prisma/seed-studio.ts |
| 2026-10-23 | Loop perbaikan siklus 1 | FIX-L | 1 | src/lib/studio/engine/lint/** (cek DATUM-17, C-34, D20, C-27 dan modul S44/S46/S47 terkait) |
| 2026-10-23 | Fase akhir | SR-53 | 1 | DB gsp_agent_hq_v21_uji (penulis tunggal), laporan test/08_rollback_rehearsal.md |
| 2026-10-23 | Loop perbaikan siklus 2 | FIX-W | 1 | src/lib/studio/contract/{schema,types}/v2/** (lebar figur), services/render/{artifact,common}.ts, services/templates/{v2,profile}.ts (Ajv), scripts/parity/run/lib/render.ts (grid diagram), benchmark/manual000/doc.v2.json + benchmark/extract/convert_v2.ts (regenerasi) |
| 2026-10-23 | Loop perbaikan siklus 2 | FIX-V | 1 | src/app/api/studio/validate/**, services/compose/snapshot.ts, services/completeness/**, src/app/api/studio/documents/[id]/route.ts, src/components/studio/template-preview/** |
| 2026-10-23 | Loop perbaikan siklus 2 | FIX-X | 1 | services/ingest/by-construction.ts (cek lebar v1), engine/html/{blocks/text.ts,blocks/wrapper.ts,base/params.ts}, contract/schema v1 chart.schema.ts (heightMm), services/compose/blocks.ts (cast specWidth) |
| 2026-10-23 | Loop perbaikan siklus 2 | RESEED | 1 | runtime DB gsp_agent_hq_v21 (penulis DB tunggal untuk templat/preset/dok 000) |
| 2026-10-23 | Loop perbaikan siklus 2 | FIX-Y | 1 | services/structure/rows.ts, services/ingest/v2.ts (pinTemplate), contract/ui.ts, components/studio/template-preview/**, services/submit/pipeline.ts (terjemahan pointer isu) |
| 2026-10-23 | Loop perbaikan siklus 3 | FIX-B2 | 1 | src/lib/studio/engine/diagram/**, benchmark/manual000/figures/specs/bm-fig-{06,08,38}* (hanya bila spec terbukti tidak setia BM) |
| 2026-10-23 | Loop perbaikan siklus 3 | FIX-T | 1 | src/lib/studio/engine/docx/tables/** (resolusi preset), params tabel bila perlu |
| 2026-10-23 | Loop perbaikan siklus 3 | FIX-S2 | 1 | services/ingest/v2.ts, src/app/api/studio/validate/_shared/template-draft.ts, services/submit/meta.ts, services/revisions/v2/commit.ts, services/render/common.ts, modul daun kebijakan inlineFormat baru |
| 2026-10-23 | Loop perbaikan siklus 3 | FIX-A2 | 1 | src/lib/studio/registry/charts.ts, src/lib/studio/engine/chart/core/params.ts, engine/chart/family-s1/**, params R-65 (rentang), modul raster-width bersama + engine/html pemakainya, scripts/parity/run/lib/render.ts (lembar simbol) |
| 2026-10-23 | Loop perbaikan siklus 3 | FIX-B2 lanjutan | 1 | + src/lib/studio/services/compose/blocks.ts (sinyal keyRow ke diagram) |
| 2026-10-23 | Loop perbaikan siklus 3 | FIX-U2 | 1 | src/components/studio/**, src/app/studio/** (CSS token kontras), tanpa hapus berkas |
| 2026-10-23 | Loop perbaikan siklus 3 | FIX-Z | 1 | src/lib/studio/contract/** (diagram v1 keyRowOnPage, SubmitResultV2), komentar src/app/api/studio/documents/[id]/paragraphs/[pid]/route.ts |
| 2026-10-23 | Loop perbaikan siklus 3 | FIX-H | 1 | scripts/parity/compare/**, scripts/parity/run/** (kecuali lib/render.ts), tests/parity/fixtures/** |
| 2026-10-23 | Loop perbaikan siklus 3 | FIX-SERAH | 1 | diagnosis dulu; perbaikan di engine/docx/** (cover/serah/toc) atau templat fixture serah — klaim setelah diagnosis |
| 2026-10-23 | Loop perbaikan siklus 3 | FIX-C2 | 1 | src/lib/studio/engine/chart/family-h2/contour.ts, src/lib/studio/engine/chart/family-s1/** (S-03 tick) |
| 2026-10-23 | Verifikasi akhir | FIX-2 | 1 | src/lib/studio/engine/html/** (pembungkus: lembar kendali, TOC, kicker lampiran) — teks bawaan diselaraskan ke DOCX lewat sumber teks bersama |
| 2026-10-23 | Verifikasi akhir | DL-1 | 1 | laporan test/18_datum_lint_node_docx.md, keluaran tests/datumlint/out/** |
| 2026-10-23 | Verifikasi akhir | FIX-F | 1 | services/submit/meta.ts, engine/html/blocks/{wrapper,text}.ts, engine/front/apparatus.ts, services/render/artifact.ts (keyRowOnPage), scripts/parity/compare/compare_docx.py |

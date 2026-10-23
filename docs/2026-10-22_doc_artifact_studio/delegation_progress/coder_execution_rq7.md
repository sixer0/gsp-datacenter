# RQ-7 — catatan coder-execution (renderer DOCX blok slot v2)

Status: needs-review (renderer selesai dan terverifikasi; E1 `--scope document` masih butuh 2 perubahan di luar area, diajukan di `file_requests.md`). Skills: backend-execution, dry-run-verify-fix. Klaim: `file_claims.md` prefiks RQ-7. Perluasan controller (SR-17 F1): `slotPlaceholder` + `ruleIndex` ikut.

## Berkas
- BARU `src/lib/studio/engine/docx/blocks/source-register.ts`: `renderSourceRegisterEntry` (paragraf peran `body.paragraph`, gantung 8 mm + tab, penanda `[n]` wajah mono dari alamat `F:<slotKey>/<n>`, lalu citation (md-lite) · kind · url · accessed; URL teks), `renderSlotPlaceholder` (teks compose `slot.placeholderText`, kotak putus 0,5 pt B45309 + miring = CSS `.st-placeholder`), `renderRuleIndex` (paragraf kosong + `warn`, setara HTML marker). Konten tanpa citation -> `env.fail` (log error + SCHEMA_INVALID).
- `src/lib/studio/engine/docx/blocks/index.ts` (pendaftaran saja): `sourceRegisterEntry`, `slotPlaceholder` di `docxBlocks`; ekspor `renderRuleIndexMarker`. `ruleIndex` SENGAJA tidak didaftarkan: kunci milik tabel v1 `docxTables` (menang di dispatch); mendaftarkannya di `docxBlocks` juga akan mengubah peta pembungkus `wrapper/render.ts` untuk tabel v1.

## Keputusan
- Tampilan dari templat (D-139): format = peran `body.paragraph` resolved; tidak ada RoleKey baru (kontrak bukan area). Konstanta gantung 8 mm / warna draf disalin dari perakit HTML SR-17.
- D-165 final (research/09:405): kenop Referensi = `sourceRegister.columns` (Judul/urutan/URL gugur, tanpa kunci). Urutan = urutan kiriman (n alamat compose).

## Bukti (2026-10-23)
- eslint `source-register.ts index.ts`: exit 0. tsc repo: 145 galat, 0 di `engine/docx/blocks/**`; di luar area: komponen studio (section-composer 44, playground 42, template-editor 50, document-viewer 4), `services/submit` hilang (2), `engine/docx/assemble/index.ts:377` `placeholdersAfter` (SR-16 berjalan, 3).
- `render_cli.ts` E1 `--scope document`: NOT_READY exit 1 — seam `resolveMetaDefaults` hilang dari `services/ingest/meta.ts` (tulis ulang SR-12). Asap via `Temp/hq_v21_clone/rq7/drive.ts` + `meta_shim.ts`: sourceRegisterEntry LOLOS, lalu gagal `Tabel tidak sah: jenis tabel tidak dikenal: undefined` pada `ruleIndex F:ruleIndex {"mode":"auto"}` (probe.ts) — v2 ruleIndex dirutekan ke tabel v1.
- Dengan simulasi perutean (`route_sim.ts`): E1 document SUCCEEDED exit 0 DOCX+HTML, 2 run DOCX byte-identik (sha 755efb7925dc812f…). Entri: `<w:ind w:left="454" w:hanging="454"/>…<w:rFonts w:ascii="IBM Plex Mono"…/><w:t>[1]</w:t><w:tab/>…<w:t>SPLN T5.008:2019 Pemeliharaan Trafo Tenaga</w:t>…<w:t xml:space="preserve"> · dokumen</w:t>`.
- slotPlaceholder: E1 tanpa controlSheet `--scope slot:controlSheet` (draf) SUCCEEDED; `<w:pBdr><w:top w:val="dashed" w:sz="4" w:space="4" w:color="B45309"/>…<w:i/><w:color w:val="B45309"/>…<w:t>[Lembar Kendali belum diisi]</w:t>`.
- Lint rilis = FAIL di semua run (tidak menahan render; bukan area).

## Permintaan (file_requests.md)
1. `engine/docx/tables/index.ts` atau `contract/dispatch.ts`: `ruleIndex` dengan `content.mode === "auto"` -> `renderRuleIndexMarker` (memblok E1 document).
2. `scripts/parity/run/lib/render.ts` / `services/ingest/meta.ts`: seam `resolveMetaDefaults` (memblok semua CLI v2).

Review direkomendasikan (lingkup `engine/docx/blocks/source-register.ts`).

## Perluasan controller (izin `engine/docx/tables/index.ts`, hanya perutean)
- `docxTables.ruleIndex` = pembungkus: `content.mode === "auto"` -> `renderRuleIndexMarker`; selain itu `renderTableBlock` (tabel v1 tidak berubah).
- Bukti: eslint 3 berkas exit 0; tsc repo 20 galat, 0 di `engine/docx/{tables,blocks}` / dispatch (sisa: document-viewer 6, version-history 9, api validate 2, templates/[id] 1, services/ingest 1).
- E1 `--scope document` (drive.ts + meta_shim.ts, tanpa simulasi): 2 run SUCCEEDED exit 0, DOCX sha 755efb7925dc812f… identik, entri `[1]` + "· dokumen" ada.
- v1 benchmark manual000 DOCX: sebelum 07815c462a44504c…, sesudah 07815c462a44504c… (byte-identik).
- Status: complete untuk area RQ-7; CLI polos tetap NOT_READY sampai seam `resolveMetaDefaults` (SR-12).

# Catatan coder-execution IP-53 (SR-35 + SR-12; D-205, D-210)

Status: complete. Tanggal 2026-10-23. Skills: diagnosing-bugs, dry-run-verify-fix.

## Berkas diubah (klaim IP-53 di `file_claims.md`)
- `benchmark/harness/run/lib/pipeline.ts`: `stepIngest` mengembalikan `common.engineSnapshot(snapshot)` (seam produksi `services/render/common`; identitas untuk norm/v1, v2 = perluasan struktural) karena `ingestDocument` kini bertipe `IngestResultV2` (`AnyNormSnapshot`). Perilaku v1 tidak berubah.
- `benchmark/harness/run/lib/inputs.ts`: pembanding sha aset doc vs indeks S94 membaca `assetRef: "sha256:<hex>"` (v2) selain `sha256` (v1). Sebelumnya setiap aset `doc.v2.json` FATAL "sha256 doc.assets berbeda dari indeks S94" (exit 2) sehingga jalur v2 SR-34 tidak pernah lewat tahap load.
- `src/lib/studio/services/submit/pipeline.ts` (izin controller, IP-52): `currentSource` memakai `reconstructSource(rev.id, tx)`; impor `rebuildSnapshot` diganti `reconstructSource` (impor relatif `../structure`, sama dengan idiom berkas).
- `engine/lint/scan/walk.ts`: TIDAK diubah (bukan berkas sebab; lihat B).

## (B) SR-35 N1 folder misi: TIDAK tereproduksi di jalur mana pun
Skrip `<scratchpad>/ip53_repro.ts`, transaksi-rollback (prisma dialihkan ke `tx`, `STUDIO_WORKSPACE_ROOT` = scratchpad), `current_database = gsp_agent_hq_v21`: 18/18 PASS, exit 0.
- `submitChapter` E2-like TERBIT `mission.folder "2026-10-23_misi_a"` + gambar base64: dibuat (002/GSP/KT/X/2026), snapshot norm/v2; `documentNames` = [stem aset = sha256, docNumber]; `doc.mission` tidak masuk daftar. Lint stage ingest: N1 PASS, DATUM-38 PASS. Render murni DOCUMENT (HTML): N1 PASS; render bab 3 draf DOCX (SUCCEEDED, 1,9 MB): N1 PASS.
- `submitDocumentV2` E2-like TERBIT (sections.content): sama, N1/DATUM-38 PASS (ingest, render, render bab 3).
- `ingestDocument` v2 dryRun (R04) TERBIT folder bergaris bawah: valid=true, N1 PASS, DATUM-38 PASS.
- Kontrol negatif: `meta.docNumber "014_GSP/KT/X/2026"` lewat submit -> N1 + DATUM-38 FAIL `@/meta/docNumber` (ingest, render, render bab 3), folder misi tidak ditandai. Aset `2026-10-23_misi_a/foto_pmt2.png` -> N1 FAIL pada stem `foto_pmt2` saja; `foto-pmt2.png` di folder yang sama -> N1 PASS.
- Rollback: StudioDocument/Revision/Asset 3/3/0 sebelum = sesudah.

Sumber nama N1: `engine/lint/scan/walk.ts:230` `documentNames` = stem path aset + docNumber (D-80 diterapkan INT-C, D-90). Path aset v2 = `relPath` C33c `<xx>/<sha>.<ext>` (`services/compose/snapshot.ts:200`), tanpa folder misi.

Kemungkinan SR-35 keliru: catatan SR-35 butir 1 mengutip registri saja ("garis bawah memicu `N1` (blocksIngest TERBIT/SERAH, `registry/lint.ts:189-200`)"); skrip `sr35_verify_docs.ts` tidak memanggil lint/ingest (hanya ajv, completeness, route, galat). Perilaku itu ada sebelum INT-C (temuan S68 F1: "lint DATUM-38/N1 menandai garis bawah di folder", 422 terbukti dry-run), lalu diperbaiki D-90 ("folder misi bergaris bawah TERBIT valid (sebelumnya 422)"). SR-35b (kembalikan contoh ke pola IL `YYYY-MM-DD_<misi>`) aman dijalankan.

## Asap tambahan controller (IP-52 `reconstructSource`)
`<scratchpad>/ip53_backfill_smoke.ts`, transaksi-rollback v21: `submitChapter` bab 9 ke dokumen 001/GSP/KT/X/2026 (rev 1 norm/v1, baris struktur backfill) -> created=false, rev 2, `changeScope chapter:9`, pid `bab-9`; snapshot rev 2 norm/v2 dengan source bab [1,2,9]. Hitungan dokumen/revisi/bab sama sebelum/sesudah. 3/3 PASS.

## Bukti validasi
- `npx tsc --noEmit -p .`: galat `pipeline.ts:278` (harness) dan `submit/pipeline.ts:215` hilang. Run terakhir: 1 galat di luar area: `src/lib/studio/services/compose/blocks.ts(374,28) TS2345` (baris paralel; run sebelumnya 0). `benchmark/extract/convert_v2.ts(326)` yang ada di awal sesi sudah hilang (bukan perubahan IP-53).
- `npx eslint benchmark/harness/run src/lib/studio/services/submit`: exit 0.
- `npx tsx benchmark/harness/run/selftest_verdict.ts`: 21/21 lulus.
- Harness `--skip-pdf --skip-compare`: v1 berhenti di ingest (adaptasi v1->v2 menolak `/document/sections/content/chapters/7/sections/1/blocks/0/panels` maxItems 12, `ADAPT_V1_SCHEMA_INVALID`); v2 kini lolos load, berhenti di ingest (`doc.v2.json` `.../blocks/1/spec` additional property `$schema`, 60 isu). Keduanya di luar area harness (adapter v1 / data SR-32), jadi langkah figur/DOCX/lint harness belum teruji ujung-ke-ujung.

## Temuan untuk controller
1. Data `benchmark/manual000/doc.v2.json` tidak lolos `studio.doc/v2` (spec chart membawa `$schema`; 60 isu) -> pemilik SR-32 (`convert_v2.ts`).
2. Adapter v1 (`services/adapt-v1`) menolak benchmark v1 (panels > 12) -> jalur v1 harness INCOMPLETE sejak ingest berdispatch ke v2 (SR-12).
3. Hasil baca kode (belum diuji): pada v2 dan v1 teradaptasi tidak tepercaya, path aset snapshot = sha (`compose/snapshot.ts:200`), jadi N1 untuk nama berkas aset deliverable praktis hanya berlaku pada v1 tepercaya (`allow`, KD-26) dan docNumber. Kontrol negatif aset di atas dibuktikan di tingkat pemeriksa lint, bukan lewat submit (v2 tidak punya nama berkas aset).

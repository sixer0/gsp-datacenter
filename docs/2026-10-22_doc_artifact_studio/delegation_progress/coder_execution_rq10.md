# RQ-10 coder-execution: adaptor v1 membuang run label aparatus (sisa SR-32, D-216)

Status: complete (2026-10-23). Skills: dry-run-verify-fix. Area: `src/lib/studio/services/adapt-v1/**` (klaim RQ-10 di `file_claims.md`).

## Perubahan
- `inline.ts`: `stripApparatusLabelRun(inline, field, rec)` + `adaptKeyRow`; `adaptSource` memanggilnya (tabel dan figur). Aturan: hanya run PERTAMA, hanya bentuk `runs`, teks harus persis label medan (`source` -> "SUMBER", `keyRow` -> "KUNCI"; regex `^\s*LABEL\s*:?\s*$`, label dari `FIGURE_LABELS` mesin); run pemisah berisi spasi saja ikut dibuang; tidak membuang bila tidak ada konten tersisa. Dicatat di `AdaptReportV1.stripped["source.labelRun"]` / `["keyRow.labelRun"]` (kelas tata letak, bukan R-38, jadi tidak memicu 422 `reject`).
- `blocks.ts`: `figureFields` memakai `adaptKeyRow` (impor `adaptInlineOpt` yang tak terpakai dihapus).
- Kontrak tidak disentuh (`stripped` = `Record<string, number>`; `dropped` berbentuk tetap).

## Bukti
- Skrip asap (scratchpad, di luar repo): benchmark `doc.json` -> `stripped` source.labelRun 115, keyRow.labelRun 2, total 117; 117 medan source/keyRow = 117 di `doc.v2.json`, beda 0; seluruh doc (kunci `preset` diabaikan) identik dengan `doc.v2.json`; sisa run label di depan 0; 24 run "   PROVENANS " di tengah baris dipertahankan; benchmark v2 VALID; deterministik.
- 4 fixture v1 (`tests/parity/fixtures/doc/doc_{nota_memo,nota_tables,serah_handover,terbit_report}.json`) -> v2 VALID, label dibuang 0.
- Kasus unit: kata "SUMBER" di tengah kalimat, "SUMBER Proposal" satu run, huruf kecil "Sumber", label medan lain, bentuk `text`, label tanpa konten -> tidak disentuh.
- `convert_v2.ts --check`: SAME x3 (sha 9c77439b…, 882057c5…, 3cefdc83…), `labelRunsStripped {source:0,keyRow:0}` = `stripApparatusLabels` konverter kini no-op.
- `npx tsc --noEmit -p tsconfig.json` exit 0 (run pertama sempat 1 galat di `src/components/studio/revision/edit-workspace.tsx` milik baris lain yang sedang berjalan, hilang di run ulang); `npx eslint src/lib/studio/services/adapt-v1` exit 0.

## Keputusan untuk controller
1. "PROVENANS" TIDAK dibuang, juga di run pertama: compose `apparatusInline` hanya membangkitkan SUMBER/KUNCI (`compose/inline.ts:88-101`), mesin menambah PROVENANS hanya bila teks belum memuatnya (`engine/docx/figures/figure.ts` `sourceLineXml`), jadi run PROVENANS tidak pernah tercetak dua kali; membuangnya justru menghilangkan label. Benchmark: 24 run PROVENANS dipertahankan, sama dengan keluaran SR-32.
2. Bentuk `text` berawalan "SUMBER ..." tidak disentuh (brief: run). Sisa terbuka: sumber FIGUR bentuk `text` berawalan label akan tercetak dua kali lewat `apparatusInline` (tabel bentuk `text` aman: modul tabel membangkitkan label sendiri). Benchmark dan 4 fixture tidak memilikinya.
3. `stripApparatusLabels` di `benchmark/extract/convert_v2.ts` boleh dihapus pemiliknya (no-op terbukti); tidak disentuh di sini.

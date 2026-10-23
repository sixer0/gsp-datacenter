# SR-60 coder-execution: turunan kenop esensial di engine/tokens (status: complete)

Skills: backend-execution (modul murni, tanpa I/O/jalur galat baru), dry-run-verify-fix. Area: `src/lib/studio/engine/tokens/**` (klaim SR-60). Laporan baris: `implementation/sr60_tokens_derivations.md`.

## Perubahan
- `paper.ts` (baru): `pageSizeFromKnob` (= DV-01 `pageSizeFromPaper`) dari `page.size`/`page.orientation`/`page.customSizeMm`, dimensi dari kontrak E38 `PAPER_SIZE_MM`; tanpa fallback A4.
- `grid.ts`: `A4_MM`/`isA4Portrait` dihapus (KC-7, PT-09). Fungsi baru idempoten: `pageSizeFromPaper|Knob`, `textColumnFromPage`, `textBlockFromPage` (H - atas - bawah, perbaikan 247), `baselineFromBodyLeading`, `figureWidthFromClass`, `figureMaxHeightFromBlock`, `sectionSetupFromGrid` (pageSizeTw, marginTw, tab kanan header). `rederiveNonA4` dipensiunkan (bendera tanpa efek samping). `KEYED_DERIVERS` diganti `ensureBottomMargin` (bentuk lama D-33 hanya bila margin bawah belum ada). Tabel `DERIVERS` lengkap untuk `DeriveFnId` kontrak kecuali id fase lapis (dicek `satisfies`).
- `layer.ts` (baru): fase lapis sekali per resolusi: `marginsFromDensity` (r05, 0,75/1/1,25 + alias rapat/sedang/lega), `typeScaleFromBase` (kenop `type.scale.body.size`, r1; sub-medan R-07/R-20/R-21/R-37), `colorLiterals` (R-21/R-07 ikut token bila literal = acuan), `headerFooterTabsFromSpan` (R-30, rasio bentang efektif/acuan). `deriveLayered` untuk SR-06. `pinPolicy` "reference" (bawaan, D-165) | "absolute" (register §13.5 langkah 7).
- `index.ts`: `resolveParamsWith/resolveParams` = acuan (registri <- base) + eksplisit (override diterima) -> `deriveLayered`; galat baru bila kolom/blok teks <= 0; ekspor baru.

## Bukti (2026-10-23)
- tsc repo: 8 galat, semuanya `contract/schema/v2/forbidden.ts` (SR-04, sedang ditulis); 0 di engine/tokens. eslint engine/tokens exit 0.
- Asap kenop (registri mendarat 743 kunci, 0 fixture): SEMUA PASS (A4 11906x16838, marginTw 1474/1361/1361/1134, blok 247, kolom 128, bentang 166, tab 9411; A4 landscape blok 160; AC6 72 kombinasi; idempotensi; skala huruf; aksen).
- Asap DB baca-saja `gsp_agent_hq_v21`: sha terproyeksi = tersimpan untuk datum-kanonik v5, datum-gsp v1, datum-manual-000 v2 (diffKeys kosong).
- vitest engine-core: 272/281; 9 gagal semua di `tokens.test.ts` (ekspektasi lama; pemilik SR-42).

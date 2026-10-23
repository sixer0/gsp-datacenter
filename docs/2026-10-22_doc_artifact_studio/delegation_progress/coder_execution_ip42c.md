# IP-42c coder-execution: spec benchmark fig-25 dan fig-38 (D-137 opsi D)

- Status: complete (2026-10-23). Skill: dry-run-verify-fix (1 siklus, 0 perbaikan). Klaim: 5 baris IP-42c di `file_claims.md`.
- Berkas: `benchmark/manual000/figures/specs/bm-fig-25.diagram.json`, `specs/bm-fig-38.diagram.json`, `blocks/bm-fig-25.block.json`, `blocks/bm-fig-38.block.json` (ditulis lewat json.dump indent=1 seperti generator; round-trip asli byte-identik dicek dulu).
- Aturan lebar: (1) spec `P1-width_mm` (`core/spec.ts:248-258`): 128 atau 166; (2) build sld `DATUM-37-lebar` (`core/sheet.ts` snapToLattice): rel = lebar lembar di-snap kisi 128/12 mm; (3) blok render `DATUM-31` (`engine/docx/figures/figure.ts:296`): FIGURE_WIDTHS_MM 128/166. Tidak ada aturan yang dilonggarkan.
- fig-25 (rack): BM 100 TIDAK sah (P1 menolak: "width_mm 100.0 harus salah satu dari [128, 166]", diuji) -> 128 (sah terdekat: selisih 28 vs 66).
- fig-38 (sld): BM 166 sah menurut P1/DATUM-31 tetapi build gagal: "DATUM-37: simpul mdp keluar lebar lembar (0.000..170.667 dari 166.0 mm)" (diuji) -> 128 tetap (sah terdekat, 12 kisi).
- Blok: widthMm ikut spec (128) dan heightMm = tinggi build, karena `placedHeight` memakai block.heightMm apa adanya (figur diskalakan/terdistorsi bila beda dari spec). Spec tertanam = spec berkas (dicek sama).

| Figur | BM w x h mm | Sebelum (spec/mesin) | Sesudah | Rasio h ke BM |
|---|---|---|---|---|
| bm-fig-25 | 100 x 112,938 | 128 x 238,125 (blok 100 x 112,938) | 128 x 123,825 (blok sama) | 2,11 -> 1,10 |
| bm-fig-38 | 166 x 101,358 | 128 x 109,537 (blok 166 x 101,358) | 128 x 100,013 (blok sama) | 1,08 -> 0,99 |

- Restrukturisasi fig-25: semua 11 slot u = 1 (1U Garis A = 9,525 mm); rentang U asli tetap di tag; tinggi kotak tidak lagi sebanding U (deviasi dicatat di `notes`). 112,9 mm butuh <= 10 slot = menghapus slot acuan: tidak dilakukan (alternatif bagi controller: hapus slot "kosong U21" -> 114,3 mm).
- Restrukturisasi fig-38: tag -Q2 dilebur: label "-Q2 ke UPS -U1", sub "rel hilir -Q3 -Q4 -Q5" (simpul tertinggi 5 -> 4 unit). Teks "(blok fungsi)" kini hanya di notes. Dicek visual (raster sharp di scratch): teks muat dalam kotak 32 mm.
- Bukti gerbang D-133: `npx tsx benchmark/manual000/figures/tools/validate_figures.ts` -> spec 20/20, blok 52/52, build 11/11, sha256 52/52; `grep bm-fig-(25|38)` pada keluaran = kosong (LULUS untuk fig-25/38). Exit global 1 karena GAGAL 8 PARAM_ALIAS bm-fig-17/21 (sudah ada sebelum perubahan, garis dasar identik; di luar area).
- Penjaga: tsc grep `benchmark/manual000/figures` = 0 baris; `npx eslint benchmark/manual000/figures` exit 0.
- Temuan/permintaan (tidak memblokir): generator `tools/diagrams.py` (g93, g1012) dan `tools/build_figures.py` (widthMm/heightMm blok dari BM) masih menghasilkan versi lama; regenerasi akan membalik IP-42c. Pemilik tools perlu memindahkan perubahan yang sama. `index.json` widthMm/heightMm tetap = penempatan BM (raster, tidak disentuh).

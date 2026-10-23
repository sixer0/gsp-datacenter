# S10 coder-execution: registri lint

Status: complete (tsc area kosong, eslint bersih, hitungan 83 + 16 benar).
Berkas: `src/lib/studio/registry/lint.ts` (satu-satunya; klaim tercatat di file_claims.md).

## Angka (skrip scratchpad `s10_check.ts` via `npx tsx`)
```
total 99 COUNT 99 auto 83 human 16 {"A":39,"B":4,"C":19,"D":21,"H":16}
unique ids 99 | A ids DATUM-01..39 ok | H01..H16 ok | partial DATUM-12,D11,D21
modules {"structure":45,"scan":12,"render":7,"language":19,"human":16}
```
- Hitungan kini diturunkan dari array (`LINT_REGISTRY_COUNT` dst. bukan konstanta keras); ekspor tambahan `LINT_GROUP_COUNTS`, `getLintDef`, `isLintImplemented`.
- ID: DATUM-01..39 (sama dengan P16-02), G1 G2 G3 N1, grup C memakai C-14 C-20 C-21 C-24 C-26a C-26b C-26c C-27 C-28 C-29 C-30 C-31 C-33 C-34 plus `C-INFO-OPENER`, `C-A4`, `C-16.6`, `C-SG-L2-09`, `C-SG-L2-04` (5 butir §6.2 tanpa nomor C), D01..D21, H01..H16.
- Modul: scan = 03 04 16 17 19 31 38 39 + G1 G2 G3 N1 (12, sesuai S44); render = 14 15 25 28 32 33 37 (7, sesuai S45); structure = sisa A (S), D; language = C; human = H.
- blocksIngest true = 32: grup B (4) + 25 butir A yang mode HQ-nya memuat S (kecuali DATUM-36, lapor saja) + DATUM-04, 31, 38 (X). Minimal 9 butir §7.2 #6 terpenuhi; DATUM-03 dan DATUM-36 false. Pilihan "semua S true" adalah tafsir saya atas komentar A10 di LintDef (hipotesis; ubah mudah di ROWS_A).
- Tier: A/B/C/D `TERBIT+SERAH` (lint dilepas NOTA); SERAH saja: D01 D02 D03 D07 H08 H09 (Tabel 16.2 langkah 6/8/9, P5-46..47). Tier D03/D07/H-lain adalah ASUMSI turunan dari langkah gerbang (hipotesis, perlu konfirmasi bila dipakai penegakan).

## Keputusan
- DATUM-03: `paramRef = "prose.emDash"` (D-32 siaran controller), limit "0 per 1.000 kata, 0 di judul (KT-06)".
- Kontrak `LintDef` tidak punya field `implemented`; NOT-RUN dinyatakan lewat `notRunReason` (KT-13) dan `isLintImplemented(def)`. Grup C: 9 terimplementasi (C-20 C-26b C-26c C-27 C-31 C-34 C-INFO-OPENER C-SG-L2-09 C-SG-L2-04, ambang/frasa ada di manual P11), 10 NOT-RUN (C-14 C-21 C-24 C-26a C-28 C-29 C-30 C-33 C-A4 C-16.6; G-07, alat lint_mutu.py dan scan_ai_footprint.py).
- Grup H tidak diberi `notRunReason` (dinilai manusia, bukan alat hilang).

## Penjaga
- `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/registry` kosong (exit 1).
- `npx eslint src/lib/studio/registry/lint.ts` exit 0.

## Permintaan lintas pemilik / temuan
- Tidak ada permintaan. Temuan: `datumcheck.py` berada di `datum-house-style/` (bukan `scripts/`); judul beberapa D (D07, D10, D21) tidak punya aturan induk tersurat di katalog, ruleRef menunjuk research/01 §6.2.

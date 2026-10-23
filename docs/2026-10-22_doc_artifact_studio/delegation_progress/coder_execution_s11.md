# S11 mesin token (engine/tokens), coder-execution, 2026-10-23

Status: complete

Berkas (area eksklusif `src/lib/studio/engine/tokens/`): `index.ts` (tanda tangan I01 persis + ekstra), `merge.ts` (lapisan default registri <- base <- overrides, validasi tipe, hak override), `grid.ts` (32 DeriveFnId + 4 turunan berkunci), `color.ts` (token warna, zebraNN), `roles.ts` (format peran katalog + overlay roleFormats).

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "src/lib/studio/engine/tokens"` -> kosong (grep exit 1)
- `npx eslint src/lib/studio/engine/tokens` -> exit 0, tanpa keluaran
- Cek runtime `npx tsx <scratch>/s11_check.ts` atas registri penuh (698 = 673 + 25; 32/32 DeriveFnId punya ParamDef): kanonik fullSpan 166, latticeX 10.6667, latticeY 4.7625, lebar sah [128,166], cek lebar 210, colsTw [7257,340,1814] (= profil Manual 000), marginBottom 24, error 0; textColumn 140 -> fullSpan 178, latticeX 11.6667, [140,178]; Letter 215.9x279.4 + 0 sitasi -> kolom teks 133.9, moda B, colsTw [9746], pageSizeTw [12240,15840]; zebra15 = D9D9D9 (dihitung); USER menimpa kelas K -> PARAM_CLASS_K_FORBIDDEN, ADMIN lolos; kelas T -> PARAM_CLASS_T_READONLY; computeDerived idempoten.

Keputusan (dicatat controller):
1. `layout.railMode` (B, derive railMode): A/B eksplisit dipakai; rel 0 mm -> B; `auto` diselesaikan hanya dengan konteks (`resolveParamsWith`/`computeDerivedWith` `{railCitations}` atau `railModeFor(tpl, n)`); tanpa konteks tetap `auto` dan colsTw memakai susunan moda A.
2. Rederivasi non-A4 (P4G-17 true): kolom teks = lebar halaman - margin dalam - gutter - rel - margin luar (menimpa nilai B `grid.textColumnMm`), `pageSizeTw` R-09/R-10 diselaraskan.
3. D-33: `grid.marginBottomMm` = tinggi - `grid.topBottomMarginMm` (margin atas) - P4G-11, selalu diekspos; negatif -> SCHEMA_INVALID. Untuk non-A4 pendek (Letter) hasilnya 6.4 mm (blok teks K 247 tidak direderivasi).
4. D-31: `zebraNN` = rona NN% ink900 di atas `color.interior.paper`, per kanal dibulatkan; `resolveTokenColor`/`templateColorTokens`; `table.zebra.colour` dan `color.role.zebra` terselesaikan lewat jalur yang sama.
5. Kelas bersyarat dari classNote: "B (>= 0,18: K)" -> nilai < ambang perlu hak K; "T (B hanya untuk TERBIT)" -> boleh ditimpa hanya pada tier itu.
6. resolveRoleFormat: roleFormats templat menang per sub-objek (para/run/labelRun/...), tidak per atribut, agar profil terukur tidak mendapat atribut katalog; gaya Normal tidak disalin (styles.xml S14).
7. Galat kontrak dikembalikan sebagai ParamIssue; `assertOverrideRights` melempar StudioEngineError (K -> 403). Modul murni tanpa I/O (tidak ada jalur log persisten).

Temuan: tiga ParamDef kelas T tanpa `derive` (P9-04, P9-38, P9-51; tidak ada DeriveFnId di kontrak) dihitung lewat turunan berkunci; `diagram.classification` default "inherit" diturunkan menjadi nilai `classification.level`. Bila diinginkan, delta kontrak DeriveFnId (bukan blocking).

Permintaan lintas pemilik: tidak ada. Klaim: index.ts, grid.ts, merge.ts, color.ts, roles.ts, catatan ini.

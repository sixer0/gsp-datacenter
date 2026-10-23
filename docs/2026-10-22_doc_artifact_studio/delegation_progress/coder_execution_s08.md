# coder_execution_s08 — S08 parameter figur global

Status: complete (penjaga lulus). Gelombang G1a. Skill: dry-run-verify-fix.

Berkas: `src/lib/studio/params/figure.ts` (satu-satunya; stub S03 diisi). Klaim ditambahkan ke file_claims.md sebelum menulis.

Angka (skrip `s08_check.ts` via `npx tsx`): `PARAMS_FIGURE.length = 135 COUNT = 135 by group = {"P7":36,"P8":2,"P9":55,"P10":42}`; id unik 135, key unik 135, id P7-01..P10-42 lengkap dan berurutan, semua `origin: "catalog"`.
tsc: `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/params/figure` kosong; total galat repo 21 (pra-ada, di luar area). eslint figure.ts exit 0.

Keputusan dan konflik:
- K-04: 12 parameter tokenRef warna chart/diagram (P7-07..12, P9-10/13/16/19/22/25) memakai `pattern` yang menolak `link`/`interior.link`; `conflictRef: "K-04"`.
- K-13/KT-08: P7-27 default ["paper","signal"], `conflictRef: "K-13"`.
- K-17: P9-37 default "page", `conflictRef: "K-17"`.
- K-32: P7-17 dan P9-42 `conflictRef: "K-32"`, classNote ramp tinta satu keluarga.
- Nilai Tabel 7.5 (research/04 T061) menggantikan teks katalog yang bergeser: contextMain = ink400 (konteks utama), contextBackground = ink200 (target, periode lalu, sisa kategori); `rek: true` pada P7-07/08/09. Hex dicatat di classNote (signal B45309, ink400 6B7783, ink200 C3CBD1, alert 9B1C1C, verd 2F6F6B, ink900 101418).
- P10-03 diisi 16 jenis gambar dari Tabel 10.1 (research/04 T080) dengan editions {ref,status T/S/D/K}; P10-03/P10-04 `rek: true`, `conflictRef: "K-28"`. P10-28 glif gerbang BPMN dipulihkan dari Tabel 10.6.
- P8-01 dari Tabel 8.8 (7 jenis dokumen), P8-02 dari Tabel 8.7 (11 baris, kode W-07 dst.).
- P10-35 kunci memakai `lineType.code0501.meaning` (alternatif katalog, hindari titik dalam kunci).
- P7-20, P9-36 bertipe `mm` dengan `enum: ["128","166"]` (nilai diskret).
- Parameter tanpa default di sumber ("-" atau "dipilih PRISMA"): `default: null`, tanpa `unreadable` (bukan glif rusak): P7-02, P9-01, P10-01, P10-04.
- Desimal ditulis titik dalam nilai (5.5, 0.18, 44.45).

Permintaan lintas pemilik (file_requests.md, tidak blocking): 3 DeriveFnId baru untuk P9-04, P9-38, P9-51 (kelas T tanpa fungsi di daftar kontrak).
Temuan: tidak ada.

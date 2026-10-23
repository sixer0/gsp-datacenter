# INT-C coder-execution: IP-06 + IP-24 + D-80 (ingest + lint/scan)

- Status: complete (penjaga tsc/eslint bersih; cek data dryRun lolos). Uji formal milik S71/S74.
- Berkas: baru `src/lib/studio/engine/lint/scan/enforcement.ts`; ubah `engine/lint/scan/index.ts`, `engine/lint/scan/walk.ts`, `services/ingest/gate.ts`, `services/ingest/index.ts`.
- IP-06: satu keputusan penahan `ingestPolicy` (scan/enforcement.ts) di atas `resolveEnforcement`/`effectiveEnforcement` S46: 422 bila FAIL, mode efektif "block" (registri <- profil `lint.enforcementOverride` <- `doc.x.lintEnforcement`) dan tier berlaku. Penanda benchmark D-34 = mode "downgrade" di policy yang sama (jalur `isGating`/`INTEGRITY_CHECKS`/registri di gate.ts dihapus). `byConstructionChecks(doc, tpl?, opts?)` (opsional, kompatibel) memakai policy + params templat; `runLint` menerapkan override report/off ke temuan scan + bahasa (struktur sudah). Gate: `resolveEnforcement` lokal diganti nama `resolveIngestEnforcement` (tidak ada pemakai luar).
- IP-24/F-036 diagnosis: tidak ada daftar statis; ingest membaca `resolvedParams["doc.typeCode"]` versi templat terpin/terbaru. DB: datum-kanonik v1 (17:36:28Z) = KT..DS tanpa STD; v2 (17:50:43Z, R01) memuat STD. S101 (catatan 00:51 +07) bekerja saat terbaru = v1; dokumen ber-`template.version: 1` tetap ditolak (benar menurut pin D-06). Penyelarasan: pesan P3-20 kini menyebut slug + versi.
- D-80: `documentNames` tidak lagi menguji `mission.folder` dan segmen direktori path aset (hanya stem berkas media + nomor dokumen).
- Penjaga: `npx tsc --noEmit -p tsconfig.json | grep -E "src/lib/studio/(services/ingest|engine/lint/scan)"` -> kosong (grep exit 1; total 22 galat di luar area: 21 lama src/app + 1 `engine/docx/wrapper/render.ts` milik INT-B). `npx eslint src/lib/studio/services/ingest src/lib/studio/engine/lint/scan` -> exit 0.
- Cek data (harness scratch, dryRun, profil `template.json` via `loadResolvedProfileFile`, indeks aset S94):
  1. benchmark: valid=true releaseStatus=FAIL issues=0; diturunkan D-34 = DATUM-04@2.4, @11.1, G3@13.2.2, @13.3.2 (D-63) + DATUM-09@1.4.2, 4.8.4, 8.3.2, 8.6.1, 11.2.2, 16.1.2, 16.3.2 (D-70); identik dengan baseline pra-ubah; 29 unit, 561 blok.
  2. tanpa `x.benchmark`: non-dryRun -> code=BY_CONSTRUCTION_FAILED http=422 details=11 (DATUM-04 x2, G3 x2, DATUM-09 x7).
  3. dokumen kecil STD + datum-kanonik terbaru (v3): valid=true, P3-20 tidak muncul; dipin v1: ditolak "typeCode "STD" tidak dalam daftar tertutup templat datum-kanonik v1 (P3-20): KT, PT, RAB, SPH, SP, BA, DS".
  4. TERBIT `mission.folder: "2026-10-23_contoh-misi"`: valid=true, DATUM-38 PASS, N1 PASS (sebelum: 422 DATUM-38 + N1 @ /mission/folder).
  5. override profil DATUM-04=release + dokumen G3=release: 422 tinggal 7 (DATUM-09); dokumen 04/G3/09=release: valid=true.

## Keputusan (untuk dicatat controller)
1. G1 dan DATUM-11 (integritas) tetap menahan di semua tier dan tidak dapat dilepas override profil/dokumen; hanya penanda benchmark D-34 yang menurunkannya (perilaku lama).
2. `byConstructionChecks` kini menyaring tier dokumen dan mengembalikan [] untuk dokumen benchmark (berdampak ke revisi S50: revisi dokumen benchmark tidak lagi ditolak DATUM-04/G3, konsisten D-34).
3. D-80: stem nama media aset tetap diuji (padanan c38 media internal); direktori path aset = infrastruktur.

## Permintaan lintas pemilik
- file_requests: S50 `services/revisions/index.ts` meneruskan `tpl` terpin ke `byConstructionChecks(nextDoc, tpl)` (tidak blocking).

## Temuan
- Profil kanonik kini v3 dan `lint.enforcementOverride` sudah ada di registri (resolve = {}), dibuat baris lain selama INT-C; tidak memengaruhi hasil.

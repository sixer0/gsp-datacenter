# RQ-1 — face XOR faceRole di package/xml.ts, hapus pengikatan wajah sementara RT-01

Status: complete. Agen: coder-execution. Skills: backend-execution, dry-run-verify-fix. Masukan: `file_requests.md:115`, D-110, D-112, D-138.

## Berkas
- `src/lib/studio/engine/docx/package/xml.ts` (modify): ekspor aditif `mergeRunProps(base, own)`: `{...base, ...own}`; bila run membawa `faceRole` tanpa `face` -> `face` dasar dibuang; `face` hasil gabungan menang atas `faceRole`. Dipakai `hfRunXml` (header/footer, figur, turunan, pembungkus tab/br/field) dan `contentRunXml` (keluarga tabel; menggantikan logika lama yang membiarkan `base.face` menang).
- `src/lib/studio/engine/docx/assemble/bind.ts` (modify): langkah 2 (faceRole -> face templat lewat `resolveFace`) dan impor `resolveFace` dihapus; tersisa pengikatan glif simbol `render.run.symbolGlyphByRole` (R-37) milik permintaan RT-01 tables/render.ts (a). Ekspor `bindBlockRuns`, `hostCellRole`, `BOUND_RUN_TYPES` tetap.

## Penjaga (path kerja `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/rq1/`)
- `npx tsc --noEmit -p tsconfig.json`: exit 0, 0 `error TS` (seluruh repo).
- `npx eslint package/xml.ts assemble/bind.ts`: exit 0.
- Asap `smoke.ts` (base `face: IBM Plex Sans Cond`, run `{t:"≥", faceRole:"symbolGlyph"}`, `type.face.symbolGlyph = DejaVu Sans`): baru `contentRunXml` dan `hfRunXml` -> `<w:rFonts w:ascii="DejaVu Sans" w:hAnsi="DejaVu Sans" w:cs="DejaVu Sans" w:eastAsia="DejaVu Sans"/>`; kontrol negatif xml.ts lama -> `w:ascii="IBM Plex Sans Cond"` (mewarisi base). face+faceRole -> face run (Arial); tanpa wajah -> base.
- Benchmark `render_cli --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx`: SUCCEEDED ketiga run.
  - Sebelum perubahan (pohon saat itu): `word/document.xml` sha256 `02a27274…a90ca7ec`.
  - Sesudah: `4b8f6552…2c90124e`. Selisih BUKAN dari RQ-1: 141 run label "SUMBER  "/"KUNCI  "/"   PROVENANS " kini `<w:spacing w:val="12"/>` (permintaan RT-01 labelRun, baris paralel) dan 22 footer register kini NBSP (permintaan RT-01 NBSP, baris paralel); 0 perubahan `w:rFonts`.
  - Kontrol pada pohon yang sama: xml.ts+bind.ts lama dipasang sementara -> `4b8f6552…` ; berkas baru -> `4b8f6552…`; 115/115 bagian DOCX identik (`diff parts.txt` kosong). Berkas baru dipulihkan, `cmp` OK.

## Permintaan / temuan
- Komentar `assemble/index.ts:214` (milik SR-16) masih menyebut "diikat ke wajah/ukuran templat"; kini hanya glif simbol. Usul SR-16 memutakhirkan komentar.
- Perilaku baru `hfRunXml`: run header/footer/figur ber-`faceRole` tanpa `face` di atas dasar ber-`face` kini memakai wajah perannya (sesuai §3.2); tidak muncul di benchmark.

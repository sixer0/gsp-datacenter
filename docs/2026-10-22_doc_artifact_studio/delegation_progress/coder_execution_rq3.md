# RQ-3 — label KUNCI/SUMBER/PROVENANS figur DOCX memakai labelRun peran

- status: complete
- masukan: file_requests.md:117 (RT-01, figures/**), D-138, driver_rules.md
- berkas: `src/lib/studio/engine/docx/figures/figure.ts` (modify; satu-satunya berkas kode)

## Perubahan
- Helper baru `apparatusRunsXml` + `isLabelRun` (regex teks run = KUNCI|SUMBER|PROVENANS, spasi/titik dua opsional).
- Bentuk `runs` baris KUNCI (`keyRowXml`) dan baris SUMBER (`sourceLineXml`): run label dirender dengan `mergeRun(role.labelRun, runOwnProps(run))` (peran `figure.keyRow` / `figure.source` dari roleFormats templat, bawaan modul bila absen); run lain tetap `role.run` + runDefaults seperti sebelumnya.
- Properti milik run tetap menang; face XOR faceRole lewat `mergeRun`. Bentuk `text` tidak berubah (sudah memakai labelRun).

## Penjaga (D-133)
- `npx tsc --noEmit -p tsconfig.json` -> exit 0, 0 galat seluruh repo.
- `npx eslint src/lib/studio/engine/docx/figures` -> exit 0.
- Asap (tsx, scratchpad `rq3_smoke.ts`): figur pertama ber-KUNCI benchmark, templat `benchmark/manual000/template.json`:
  - konten-saja KUNCI: `<w:r><w:rPr><w:rFonts w:ascii="IBM Plex Sans Cond" .../><w:b/><w:i w:val="0"/><w:color w:val="6B7783"/><w:spacing w:val="12"/><w:sz w:val="13"/><w:szCs w:val="13"/></w:rPr><w:t xml:space="preserve">KUNCI  </w:t></w:r>`
  - SUMBER dan "   PROVENANS " sama (spacing 12 dari labelRun templat).
  - XML KUNCI+SUMBER doc.json konten-saja === doc.verbatim.json: true (verbatim tidak berubah).

## Keputusan
- Deteksi label menurut teks run (bukan posisi/b:true) agar "   PROVENANS " di tengah baris ikut; risiko: run isi yang teksnya persis "SUMBER" diperlakukan label (dinilai dapat diabaikan).
- Label tidak menerima runDefaults blok (sama dengan bentuk `text` yang sudah ada).

## Permintaan / temuan
- Tidak ada permintaan lintas pemilik. Bagian (b) permintaan RT-01 untuk tabel (`tables/render.ts`) bukan area RQ-3.
- Uji unit tidak dijalankan (fase uji akhir, driver_rules).

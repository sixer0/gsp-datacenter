# RQ-2 coder-execution — tabel DOCX: symbolGlyphByRole asli, labelRun SUMBER/PROVENANS, lebar bawaan templat
Status: complete (gerbang D-133 ringan). Tanggal 2026-10-23. Skills: backend-execution, dry-run-verify-fix.
Berkas: `src/lib/studio/engine/docx/tables/render.ts` (satu-satunya berkas kode).
- `symbolRuns(runs, params, role)`: R-37 asli; glif `faceRole: symbolGlyph` tanpa `face` di paragraf bercampur teks
  mendapat `render.run.symbolGlyphByRole[role]` (properti run menang; face hasil gabungan menggantikan faceRole).
  Diterapkan di sel (peran `cellRole`), SUMBER (`table.source`), caption (`caption`). Run ber-`face` tidak disentuh.
- `labelRuns(runs, labelRun)`: run sumber konten yang teksnya hanya `SUMBER`/`PROVENANS` (spasi bebas) mendapat
  `labelRun` peran di bawah properti run (spacingTw 12 templat Manual 000). Run ber-`face` (verbatim) tidak disentuh.
- `templateWidthTw` + `resolveWidths`: lebar total = paksa > `layout.widthTw` blok > `render.table.layout.widthTw`
  templat (hanya depth 0) > jumlah kolom / `table.columnWidthSumMm`. Semua kolom eksplisit: lebar templat dipakai
  hanya bila jumlah kolom <= lebar templat dan selisih <= jumlah kolom (sisa pembulatan; doc.json: 94 tabel, selisih 0..3,
  semua <= n). Tabel sempit/lebar memakai jumlah kolomnya.
Penjaga:
- `npx tsc --noEmit -p tsconfig.json` -> exit 0, 0 baris keluaran (seluruh repo, tanpa galat di luar area).
- `npx eslint src/lib/studio/engine/docx/tables/render.ts` -> exit 0.
- Asap (`npx tsx <scratchpad>/rq2_smoke.ts`, templat benchmark + `render.table.layout.widthTw` 9412, tabel uji pertama
  doc.json bersumber PROVENANS, kolom 567+2381+3515+2948=9411, tanpa layout blok):
  `<w:tblW w:w="9412" w:type="dxa"/>`, gridCol 9411; run label `...<w:b/>...<w:spacing w:val="12"/><w:sz w:val="13"/>...SUMBER  `;
  glif `■` DejaVu Sans `<w:sz w:val="12"/>` (symbolGlyphByRole table.source). Tanpa widthTw templat: tblW 9411 (lama).
  Tabel sempit 2x1500: tblW 3000; glif `≥` sel teks sz 14 (table.cellText). Kolom tanpa lebar: tblW 9412.
  Run SUMBER ber-face (verbatim): tanpa spacing (tidak disentuh). Log peringatan: [].
Permintaan lintas pemilik (file_requests.md, 2 baris RQ-2):
1. RQ-1 `assemble/bind.ts`: hapus cermin `hostCellRole` + langkah simbol tabel (render.ts kini asli); re-ekspor di assemble/index.ts:52 (SR-16).
2. `benchmark/manual000/template.json`: `render.table.layout.widthTw: 9412` (templat benchmark kini tanpa widthTw -> tblW = jumlah kolom).
Catatan/temuan:
- Selama bind.ts masih mengikat, run tabel sudah ber-`face` sebelum render -> jalur asli no-op (keluaran sama); efek penuh setelah RQ-1.
- Cabang SUMBER berbasis teks (bukan runs) tetap: label "SUMBER" memakai labelRun seperti sebelumnya; " PROVENANS " sisipan mesin tetap teks biasa (tidak diubah, hindari drift paritas).
- Uji unit tidak dijalankan (fase uji akhir, D-133).

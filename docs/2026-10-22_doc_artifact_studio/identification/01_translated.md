# Terjemahan maksud (intake controller)

Kategori: **Besar — Penyempurnaan besar / fitur baru multi-modul** pada Swarm HQ v2.1.

## Apa yang diminta

Modul baru di Swarm HQ untuk **membuat dan mengelola artefak terstandar DATUM**: dokumen, chart/graph,
diagram, gambar, dan HTML artifact. Konsep dan kedalaman kustomisasi mengikuti
Manual Komprehensif DATUM GSP 000/GSP/STD/X/2026 Rev A.

## Kemampuan inti

1. **Template sepenuhnya dapat dikustom** oleh user lewat UI HQ, dengan parameter sedetail manual
   (token warna, tipografi dan skala huruf, grid, tata bahasa tabel, perangkat tanda tangan,
   sampul/lembar kendali, tier, jenis chart, keluarga diagram, dialek simbol, aturan bahasa, gerbang rilis).
   Template disimpan dan bisa dipakai ulang.
2. **Template diterapkan ke data JSON** untuk menghasilkan dokumen keluaran.
3. **Struktur dokumen terpecah**: template dikelola per *section* dan *jenis section*; isi disusun per *chapter*.
4. **Penyimpanan berbasis kontrak misi/task di Information Library (IL)**: file keluaran dan dokumen
   ditautkan ke misi/task.
5. **Dokumen tersimpan di database dan mudah diubah kemudian** dengan alamat bernomor
   (nomor chapter, nomor section, nomor paragraph).
6. **Pengguna utama: AI agent** — agent cukup menyiapkan data JSON terstruktur; HQ yang menegakkan standar.

## Hasil yang diharapkan

Fitur end-to-end di Swarm HQ v2.1 (DB + API + UI + mesin render) yang memungkinkan agent
POST JSON → dokumen/artefak terstandar DATUM tersimpan, beralamat, dapat diedit, dan tertaut ke misi IL.

## Batas dan asumsi awal (belum diputuskan — dibawa ke blueprint)

- Mesin render: pakai ulang skrip skill `datum-house-style` (Python: datum_docx/xlsx/pptx/diagram/figur,
  datumcheck, datumbind, datumsimbol) vs port ke TypeScript — keputusan desain.
- Format keluaran awal: DOCX, PDF, HTML, SVG/PNG (chart/diagram); XLSX/PPTX menyusul? — perlu konfirmasi.
- Bekerja hanya di `~/gsp-swarm-hq-v2.1` dan DB `gsp_agent_hq_v21`; production `gsp_agent_hq` tidak disentuh.

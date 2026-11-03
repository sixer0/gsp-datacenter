---
task_slug: doc_artifact_studio
row: IMPL-W6
date: 2026-11-04
agent: coder-execution
status: complete
---

# Laporan IMPL-W6: peringatan informasional senyap + kalimat argumen objek JSON

## Ringkasan
Hasil ringkas (bawaan) studio_write dan studio_edit tidak lagi menampilkan peringatan `ITEM_KEY_COLUMN_ADDED` dan `ITEM_KEY_GENERATED` (teks maupun structuredContent). Dengan `detail: true` keduanya tetap tampil. Deskripsi kedua alat memuat kalimat "Argumen harus objek JSON, bukan string berisi JSON." Tidak ada commit; decisions.md tidak disentuh.

## Perubahan
| File | Jenis | Isi |
|---|---|---|
| scripts/studio/mcp/tool-kit.ts | modify | `INFORMATIONAL_WARNING_CODES` (dua kode itu) dan `quietWarnings(warnings, detail)` generik |
| scripts/studio/mcp/tools.ts | modify | `executeTool`: untuk studio_write/studio_edit tanpa `detail: true`, `warnings` disaring lewat `quietWarnings` sebelum dicetak ke teks dan ke `data.warnings` (satu titik, mencakup jalur laporan dan dokumen klien, write dan edit; peringatan `prepare` ikut disaring) |
| scripts/studio/mcp/write-tools.ts | modify | satu kalimat di deskripsi studio_write dan studio_edit |
| tests/unit/studio/mcp/implw6-quiet.test.ts | add | 5 uji: kelas informasional, (a) ringkas senyap, (b) detail:true tampil, studio_edit addRow ringkas vs detail, (c) deskripsi |
| tests/unit/studio/mcp/implw-write.test.ts | modify | asersi baris 113 lama mengharapkan ITEM_KEY_GENERATED di hasil ringkas; diubah menjadi `not.toContain` (konsekuensi langsung perubahan); batas deskripsi 400 -> 450 |
| tests/unit/studio/mcp/mcp-doc-tools.test.ts | modify | batas deskripsi 400 -> 450 (teks uji disesuaikan) |

## Keputusan
| Isu | Resolusi |
|---|---|
| Deskripsi studio_write menjadi 447 karakter (sebelumnya 396; batas uji 400); studio_edit 419 (sebelumnya 368) | Pertumbuhan hanya akibat satu kalimat (+51), sesuai izin tugas: batas diubah ke 450 di dua uji yang ada. Batas ukuran tools/list (KB) tidak gagal. Alternatif (memangkas teks lama) tidak dipilih agar tidak mengubah isi petunjuk yang sudah ada |
| Filter diletakkan di `executeTool`, bukan di tiap titik `warn(...)` | Satu titik, sudah mengetahui mode compact (`detail`), tidak mengubah perilaku peringatan lain, builder murni tetap memancarkan peringatan (uji builder lama tetap berlaku) |

## Bukti gerbang
- `npx tsc --noEmit -p .` -> keluar 0 (tanpa keluaran).
- `npx eslint` pada tool-kit.ts, tools.ts, write-tools.ts, implw6-quiet.test.ts, implw-write.test.ts, mcp-doc-tools.test.ts -> keluar 0.
- `npx vitest run tests/unit/studio/mcp` -> `Test Files 26 passed (26)`, `Tests 320 passed (320)`.
- Smoke live tidak dijalankan (sesuai instruksi). Tidak menyentuh DB produksi, port 9011, atau ~/gsp-datacenter.

## Isu persisten
Tidak ada. Siklus perbaikan terpakai: 1 (batas deskripsi dan asersi lama).

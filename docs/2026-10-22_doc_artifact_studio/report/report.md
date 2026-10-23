# Laporan Akhir: Doc Artifact Studio (Swarm HQ v2.1), refaktor dokumen terstruktur per section

Tanggal: 2026-10-23. Branch `v2.1`, DB `gsp_agent_hq_v21`. Produksi `gsp_agent_hq` dan port 9011 tidak disentuh.

## Ringkasan

- Studio kini menjadi alat konversi konten murni (D-139). Agen hanya mengirim konten JSON v2 dan membaca/menyunting lewat API. Templat dan mesin menentukan seluruh keluaran DOCX/HTML/PDF.
- Templat terdiri dari kerangka slot yang dapat dikonfigurasi, preset gaya, dan kenop esensial. Parameter yang semula 722 dan datar diringkas: USER kini hanya melihat preset dan 30 kenop esensial; registri penuh 787 kunci, sisanya lanjutan (ADMIN) atau turunan.
- DB dinormalisasi sampai tingkat paragraf, dengan pid stabil. Kiriman parsial per bab dari agen paralel diterima. Render penuh hanya boleh bila slot wajib lengkap; bila belum, API memberi `DOCUMENT_INCOMPLETE` + `forwardToController`.
- Build hanya lewat endpoint render (keputusan user D-247).
- Ukuran kertas berlaku dari ujung ke ujung, termasuk figur (D-245).
- UI dibuat lebih ramah dan memenuhi WCAG AA di area Studio.
- Benchmark Manual 000 (D-17) lulus pada run resmi `benchmark/out/fixb2/official3`:

  | Kriteria | Hasil |
  |---|---|
  | BM1 teks | 100 % (4.544/4.544) |
  | BM2 halaman | 102/102 |
  | BM3 halaman identik | 99/102; 3 selisih dikenal diterima user (D-289) |
  | BM4 visual | 0,9671 |

- Bukti segar akhir (D-315/D-317):

  | Pemeriksaan | Hasil |
  |---|---|
  | `tsc --noEmit -p .` | 0 galat |
  | eslint area Studio | exit 0 |
  | `vitest run tests/unit/studio` | 69 berkas, 2.048/2.048 |
  | `convert_v2 --check` | SAME x3 |
  | `/login` | 200 |
  | Route Studio tanpa sesi | 401 |

- Verifikasi akhir SR-58: VERIFIED-WITH-NOTES. Semua celahnya sudah ditutup (D-306 s.d. D-315).
- Keamanan, ulangan ke-3 SR-57: PASS (0 High/Medium/Low baru). Semua temuan CAUTION sebelumnya diputus user (D-247, D-251, D-316).

## Rincian

### 1. Arsitektur yang terpasang

- Kontrak `studio.doc/v2`, `studio.chapter/v2`, `studio.slot/v2` hanya berisi konten. Setiap medan tampilan (71 entri DF) ditolak dengan `DISPLAY_FIELD` beserta pointer, dan medan `render` ditolak dengan `RENDER_FIELD` (D-247).
- Migrasi aditif `20261023200000_add_studio_structure` membawa 9 tabel, 3 enum, dan 0 DROP. Gladi rollback dua tingkat beserta cadangan/pemulihan lulus di `_uji` (D-260, D-285). Runbook ada di `docs/STUDIO-ROLLBACK-RUNBOOK.md` dan SQL di `prisma/rollback/`.
- Gerbang by-construction bersama berlaku untuk semua jalur tulis: R04, R12, R13, R16, R06, R14 (D-261). Gerbang trust berlaku pada dokumen yang sudah ada (D-237). Templat terbatas khusus ADMIN, termasuk op templateVersion (D-261).
- R08 dry-run memvalidasi bab/slot/draf templat tanpa menulis dan tanpa build (D-272). Pointer isu relatif terhadap badan kiriman, dengan `mergedPointer` (D-275).
- Rasterisasi figur deterministik (D-265). Render berulang menghasilkan file identik.

### 2. Keputusan user selama fase ini

| Keputusan | Isi |
|---|---|
| D-242 | Tinggi diagram disesuaikan ke BM; paritas byte Python untuk diagram sengaja diputus |
| D-247 | Build hanya lewat endpoint render; semua temuan keamanan diperbaiki; kode mati dihapus |
| D-251 | F-068 diperbaiki; 18 berkas mati dihapus |
| D-289 | BM3 99/102 diterima dengan selisih dikenal: hlm 18 F-033, hlm 19-20 K-2 |
| D-316 | Lint HS mengikuti BM dan kegagalannya dicatat; kuota aset lunak diterima; penurunan perbandingan ke DIAGNOSIS dikukuhkan; commit lokal disetujui |
| D-317 | `playground/rail-summary.ts` dihapus; sidebar HQ dicatat; fon modifikasi "IBM Plex" hanya untuk internal |

### 3. Hasil uji fase akhir

| Baris | Hasil |
|---|---|
| SR-42/43/44/45 unit + API | 2.048/2.048 (termasuk 150 API struktur, multipart) |
| SR-49 integrasi `_uji` | 25 lulus / 1 dilewati; rekonstruksi 15/15; seed DB segar lulus |
| SR-46 paritas DOCX | 8/8 DIAGNOSIS (kelas D-120); mesin-ke-mesin 0 cek gagal |
| SR-47 diagram + simbol | simbol 45/45; diagram kelas D-242 9/11 (2 sisanya disengaja atau pra-ada) |
| SR-48 chart | 46/46 berkode acuan PASS/DIAGNOSIS (garis dasar 19/58) |
| SR-50 PDF | kontrol mesin-sama 18/18; lawan acuan = DIAGNOSIS (D-299) |
| SR-51 benchmark D-17 | lulus (lihat Ringkasan) |
| SR-52 E2E (:9021) | 94/95; sisa 1 = sidebar HQ di luar lingkup (F-073) |
| SR-53 gladi rollback | lulus, termasuk cadangan/pemulihan |
| SR-54 kinerja | render bab draf 13 hlm, waktu job p95 14,56 s, di bawah ambang 15 s (D-304) |
| DL-1 lint HS | DOCX TERBIT/SERAH gagal di 4 cek yang sama dengan BM; diputus user (D-316) |

### 4. Batasan dan sisa (backlog `delegation_progress/integration_backlog.md`)

- Lint Studio belum sejalan dengan skrip HS untuk DATUM-05/09/10/14 (IP-90).
- Rasterisasi figur menyita 43-50 % waktu render; optimasinya tercatat di IP-89.
- Selisih isi Manual 000 terhadap aturan DATUM, tercatat dan tidak diubah: C-27, C-34, C-SG-L2-04, D18, D20, DATUM-03 Tabel 17.1, G3 (D-269).
- Item Low lain tercatat sebagai IP-68 s.d. IP-99, tanpa penahan rilis.
- Lima proses yatim dari run agen sebelumnya, `find.exe /` (PID 27504, 28124, 16208) dan `python -` (PID 30856, 26596), tidak bisa dihentikan karena ditolak sistem izin. Pengguna dapat mengakhirinya lewat Task Manager.

### 5. Agen dan skill yang dipakai

- Agen: `coder-execution`, `test-expert`, `senior-code-reviewer`, `security-review`, `verifier`, `document-specialist`, `document-reviewer`, `data-analyst`, `git-specialist`.
- Skill: `backend-execution`, `frontend-integration`, `diagnosing-bugs`, `dry-run-verify-fix`, `tdd`, `webapp-testing`, `code-review-senior`, `security-review-gate`, `document-quality-standards`, `verification-before-completion`.
- Log keputusan: `decisions/decisions.md` (D-101 s.d. D-317). Temuan: `findings/findings_register.md`.

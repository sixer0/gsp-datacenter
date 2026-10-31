---
task_id: doc_artifact_studio
task_row: FACTS (D-403; melengkapi DC-44 brief hermes_trial/04_contract_trial_brief.md)
date: 2026-10-31
agent: data-analyst
type: data
confidence: HIGH untuk fakta sumber (dibaca langsung, baris dirujuk di bawah); MEDIUM untuk desain kunci Q (id konkret baru ada setelah run)
inputs: hermes_trial/04_contract_trial_brief.md; research/11_contract_efficiency_protocol.md (§4.4, §6.2, §6.3, §8); decisions/decisions.md D-403; tiga laporan Hermes (baca saja); docs/STUDIO-AGENT-GUIDE.md §17.2-17.7 (enum, R21/R22)
status: complete
---

# Manifest lembar fakta dan kunci Q, uji kontrak A/B Hermes

## 1. Berkas

Akar: `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab/`. Ditulis dengan alat Write; tidak ada tulisan ke workspace Hermes maupun ke repo selain manifest ini.

| Berkas | Pembaca | Isi ringkas | Fakta |
|---|---|---|---|
| `facts/W.md` | Hermes (run W) | Pemanasan arm B, sintetis seluruhnya: cek dan perbaiki tautan, owner `gsp-worker-fast`, kartu `t_0d0c0b0a`, docKey `lapkerja-w`; ditutup status `blocked` (sengaja, agar tidak masuk kunci Q2) | 14 (W-F01..W-F14) |
| `facts/R-1.md` | Hermes (R1B, R1A) | Penulisan Bab 21 PROMANUAL-1004, `gsp-document-writer`, `t_ac989baa`; 4 butir; ronde-1 scanner FAIL lalu healing; ronde-2 bab21_check 14 CHECK PASS + scanner PASS; naskah sha16 `92a60eca7944055b`; complete/PASS | 48 (R1-F01..R1-F48) |
| `facts/R-2.md` | Hermes (R2A, R2B) | Verifikasi GSF-20 SPK-002, `gsp-thinker`, `t_40cefa7e`; 8 objek berhash, seed log; CHECK 1-15 (11 PASS termasuk 2 bercatatan, 2 NEEDS_REVIEW, 1 N/A, 1 FAIL); cacat T-1/T-2/T-3; vonis FAIL; status penutupan complete [skenario] | 48 (R2-F01..R2-F48) |
| `facts/R-3.md` | Hermes (R3B, R3A) | Diagnosis akar dispatcher kanban, `gsp-system-manager`, `t_57ff71c4`; 4 kartu kasus; F1/F2/F3 berbaris kernel; harness 5/5 PASS; P1-P4; needs-review System Control untuk deploy patch; rujukan bukti ke R-1 [skenario] | 40 (R3-F01..R3-F40) |
| `queries/Q.md` | Hermes (sesi Q saja) | Q1..Q5 sama untuk kedua arm, ruang cari per arm, urutan arm | 5 kueri |
| `answers/Q_key.md` | Controller saja | Kunci simbolik + aturan penyelesaian mekanis, normalisasi id, rumus presisi/recall/correct, rumus `expected_sha256` | - |

Format lembar fakta: daftar bernomor polos dengan id fakta (`R1-F01` dst.), dikelompokkan `F-awal` / `F-upd1` / `F-upd2` (protokol §6.2), tanpa judul atau kepala laporan asli, bukan MD laporan dan bukan JSON. Status ditulis dalam bahasa biasa ("berjalan", "selesai", "terblokir"); pemetaan ke enum registri dibiarkan ke Hermes karena itu bagian yang diukur KE-6.

`queries/Q.md` sengaja TIDAK ditaruh di `facts/`: Hermes membaca `facts/` di setiap run, dan melihat kueri lebih awal dapat membuat laporan ditulis demi kueri. Controller menyerahkan Q.md hanya pada sesi Q. `answers/` berada di dalam `contract_ab/` sesuai permintaan baris FACTS; brief sudah menyatakan Hermes tidak membacanya. Bila ingin lebih aman, controller boleh memindahkan `answers/` ke luar `contract_ab/` sebelum DC-45 (sha tidak berubah; catat path baru).

## 2. Fakta "tidak ada di sumber" dan fakta [skenario]

Fakta "tidak ada di sumber" (ditulis eksplisit agar Hermes tidak mengisi tebakan):
- R-1 (5): tanggal/jam pekerjaan (R1-F05); rincian CHECK ke-14, karena sumber menyebut "14 CHECK" tetapi hanya merinci CHECK 1-12 + 3.1 (R1-F27); isu terbuka selain INFO pantauan (R1-F45); langkah berikut eksplisit (R1-F46); cid dan commit (R1-F47).
- R-2 (5): jam (R2-F05); ukuran byte `sajian/00_outline.md` dan `sajian/00_taste_gate.md` (R2-F07); baris status laporan, karena sumber hanya memuat VERDICT (R2-F37); nilai byte laporan pada cek singkat (R2-F45); cid dan commit (R2-F48).
- R-3 (3): tanggal laporan (R3-F04); nomor kartu lanjutan (R3-F39); cid serta ukuran/sha berkas artefak (R3-F40).

Fakta [skenario] (ketentuan uji, bukan isi sumber): initiator `gsp-master01` (sesuai brief); waktu lapor = jam mesin per langkah; status butir dan status laporan pada S1/S2 (sumber hanya memuat keadaan akhir); status penutupan R-2 = complete (protokol §6.3 S3; sumber tanpa baris status); rujukan antarlaporan R-3 -> R-1 (R3-F26, R1-F48) agar Q5 dapat diisi `refs[]`. R-3 memuat dua penanda status di sumber (kepala `STATUS: complete` `laporan.md:11` dan "STATUS needs-review untuk System Control sebelum deploy" `:228`); lembar fakta memakai kepala sebagai status laporan dan mencatat penanda kedua sebagai fakta tersendiri (R3-F28, R3-F35), tanpa menafsir ulang.

## 3. Jejak fakta ke sumber (untuk cek KF dan audit; tidak diberikan ke Hermes)

Path sumber relatif `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`.

| Lembar | Fakta | Baris sumber |
|---|---|---|
| R-1 `2026-10-04-prompt-manual/_work/t_ac989baa/LAPORAN-SELESAI.md` | F01 `:1`,`:53`; F02 `:1`; F03,F06 `:53`; F04 path; F07 `:7`; F08 `:9`; F09 pengelompokan dari `:11-36`; F13-F17 `:49`; F18-F23 `:31-36`; F25 `:3`,`:13`,`:27`; F26 `:11`; F27-F40 `:13-26`; F41-F42 `:27`; F43 `:8`; F44 `:38-45`; F48 skenario |
| R-2 `2026-10-12-game-success-formula/verification/01_verifier_report.md` | F01 `:1`; F02,F03,F05 `:3`; F04,F06 `:4`; F07 `:5`; F08,F09 `:6`; F10 `:7`; F15 `:8`; F16-F31 `:14-28`; F20-F21 juga `:52-58`; F32 `:60-63`; F33-F34 `:65-67`; F36 `:30`; F37 seluruh berkas tanpa baris STATUS; F38-F43 `:32-48`; F44 `:69-74`; F45 `:76-80`; F46 dari `:20`,`:21`,`:23`,`:44`,`:48`,`:67`; F47 `:4`,`:6`,`:22`,`:24` |
| R-3 `2026-10-10-tracero-dispatcher-1010/laporan.md` | F01 `:1-3`; F02,F03 `:3-4`; F05 `:5-9`; F06,F30 `:15-27`; F07 `:43-66`; F12 `:43-49`; F13 `:51-58`; F14 `:60-64`; F15-F16 `:66-84`; F17 `:86-100`; F18 `:29-37`; F19-F20 `:108-122`; F21 `:124-143`; F22 `:145-151`; F23-F24 `:155-171`; F25 `:174-182`; F28 `:11`,`:228`; F29 `:171`; F31-F34 `:186-225`; F35 `:227-229`; F36 `:233-241`; F37 `:243-247`; F38-F39 dari `:227-229`,`:236-237`; F40 `:26`,`:106` |

Penyederhanaan yang disengaja: R2-F32 merangkum daftar panjang seksi D sumber (`:62`) menjadi pernyataan "semua cocok kecuali T-1/T-2 (+T-3)" plus enam contoh; R2-F31 mencantumkan kode B-K yang diterapkan plus tiga contoh. Rincian lain seksi D/B-K tidak menjadi fakta sehingga tidak ditagih di KF.

## 4. Desain Q1..Q5 (ringkas; rinci di `answers/Q_key.md`)

| Q | Kueri | Kunci diniatkan arm A | Kunci diniatkan arm B |
|---|---|---|---|
| Q1 | status laporan kartu `t_57ff71c4` di M | berkas laporan r3a; status selesai | dokumen `lapkerja-r3b`; `complete` |
| Q2 | laporan berstatus complete di M | laporan r1a, r2a, r3a | `lapkerja-r1b`, `-r2b`, `-r3b` (`lapkerja-w` = blocked, keluar) |
| Q3 | paragraf memuat `KANBAN_TERMINAL_TIMEOUT_GRACE_SECONDS` | semua baris di laporan r3a yang memuatnya | semua blok `lapkerja-r3b` yang memuatnya |
| Q4 | laporan owner `gsp-thinker` di M | laporan r2a | `lapkerja-r2b` |
| Q5 | bagian bukti yang dirujuk laporan `t_57ff71c4` | baris laporan r1a bermuatan `92a60eca7944055b` yang ditunjuk r3a | `lapkerja-r1b#pid` dari `refs[]` `lapkerja-r3b` |

Semua kueri dibatasi ke misi M karena kartu dan istilah yang sama juga ada di laporan asli dan di korpus lebih luas (Grep atas seluruh `workspace/docs` habis waktu 20 s; atas folder misi R-3, `t_57ff71c4` + istilah Q3 = 4 kemunculan dalam satu berkas). Kunci dinilai terhadap keadaan TERSIMPAN tepat sebelum sesi Q (protokol §4.4); selisih terhadap niat lembar fakta adalah galat penulisan (KE-3/KE-7).

## 5. Instruksi controller

1. Pembekuan (sebelum DC-45). Jalankan dan catat keluarannya apa adanya di `decisions/decisions.md` sebagai baris keputusan baru:
   ```
   cd C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab && sha256sum facts/W.md facts/R-1.md facts/R-2.md facts/R-3.md queries/Q.md answers/Q_key.md
   ```
   Sekalian bekukan tiga laporan sumber (protokol §7, RK-5):
   ```
   cd C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs && sha256sum 2026-10-04-prompt-manual/_work/t_ac989baa/LAPORAN-SELESAI.md 2026-10-12-game-success-formula/verification/01_verifier_report.md 2026-10-10-tracero-dispatcher-1010/laporan.md
   ```
   Simpan keluaran pertama sebagai `contract_ab/freeze.sha256`, lalu di awal setiap run dan sesi Q jalankan `sha256sum -c freeze.sha256`; ketidakcocokan dicatat dan run ditahan (protokol §8 butir 4).
2. Penyelesaian kunci. Sesudah R3A (order 6) dan sebelum sesi Q, tulis `answers/Q_key_resolved.md` dengan aturan `Q_key.md` (path arm A dari note baris END tiap run; documentId/pid arm B dari R05/R20, bukan dari R21/R22), lalu `sha256sum answers/Q_key_resolved.md` dan catat di `decisions/decisions.md` sebelum kueri pertama. Kunci simbolik sudah beku sejak langkah 1, jadi penyelesaian ini mekanis, bukan perubahan kunci.
3. Penyerahan. Run W: `facts/W.md`. Run R: `facts/R-<i>.md` saja. Sesi Q: `queries/Q.md`.
4. Catatan untuk brief (keputusan controller, bukan perubahan oleh analis):
   - Brief baris 97 menyebut arm A grep "seluruh" `workspace/docs/`; Q.md membatasi ke misi M dan menyatakan draf arm B (w, r1b, r2b, r3b) bukan hasil arm A. Tanpa batas itu kunci arm A tercemar laporan asli dan draf arm B. Bila disetujui, cukup catat di decisions; brief tidak perlu disunting karena Q.md adalah "kueri konkret yang sudah dibekukan" yang dijanjikan brief baris 96.
   - R3-F26 membuat kedua run R-3 perlu menemukan laporan R-1 arm yang sama (arm A grep; arm B R21/R20). Langkah tambahan ini simetris dan masuk KE-1/KE-2 kedua arm; urutan aman karena R1B (order 1) mendahului R3B (order 5) dan R1A (order 2) mendahului R3A (order 6), sehingga rujukan tidak kena `422 CONTRACT_REF_NOT_FOUND`.
   - S1 meminta laporan "berjalan", sedangkan enum status laporan tidak punya `running` (panduan §17.2: `draft`, `complete`, `partial`, `blocked`, `needs-review`). Lembar fakta sengaja tidak memilihkan kode; pilihan Hermes masuk `format_<run>.txt` (KE-6).
   - Nilai yang dipakai Q (kartu utama, owner, istilah Q3, sha16 R-1) ada di lembar sebagai fakta biasa, sehingga KF juga menagihnya; kueri tidak bergantung pada fakta di luar lembar.
5. Pindai rahasia atas `contract_ab/` sebelum diserahkan (protokol §8 butir 7). Berkas di `contract_ab/` yang ditulis baris ini tidak memuat nilai rahasia maupun path berkas rahasia uji.

## 6. Batas

- Sesi analis tanpa shell: sha256 tidak dihitung di sini (langkah 5.1 milik controller); keberadaan berkas ditunjukkan oleh hasil Write.
- Fakta W sintetis (termasuk awalan sha `3fa1c09e` dan ukuran 4.812 B), sudah ditandai di kepala W.md; tidak dinilai.
- Kunci Q bergantung pada apa yang ditulis Hermes di run 1-6. Bila sebuah run gagal atau batal, kunci kueri terkait diselesaikan apa adanya (bisa kosong) dan dicatat, sesuai aturan kejujuran protokol §8.

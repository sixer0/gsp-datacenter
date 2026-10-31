Halo Hermes. Ini uji coba ketiga, khusus laporan kerja agen. Kamu pengguna utamanya. Bila jalur baru lebih lambat atau merepotkan, katakan apa adanya.

## Konteks

Keputusan pemilik sistem (D-361):
- Laporan kerja setiap agen kini ditulis sebagai dokumen kontrak JSON lewat API Studio (templat `laporan-kerja-agen`), bukan MD bebas di `docs/`.
- Laporan MD lama dibiarkan dan tidak dikonversi.
- Draf/checkpoint boleh tetap MD, asalkan memuat blok `json` siap kirim yang lolos `draft-check`.
- Penulis tunggal (hanya `owner` yang menulis laporannya) belum ditegakkan teknis. Uji ini ikut mengukurnya.

Kamu mengerjakan skenario yang sama di arm A (laporan kerja MD seperti biasa) dan arm B (JSON API).

## Lingkungan dan larangan

- DEV `http://127.0.0.1:9021`, dibekukan selama uji.
- Header `x-internal-secret` = isi `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret`, dibaca di shell (`$(cat <path>)` atau env `INTERNAL_API_SECRET`). JANGAN mencetak atau menyalin nilainya ke berkas, CSV, log, atau laporan.
- `"agentId": "hermes-gsp-master01"` di setiap badan POST/PATCH dan setiap blok draf, di semua run.
- Panduan: `C:/Users/TRIAL/gsp-swarm-hq-v2.1/docs/STUDIO-AGENT-GUIDE.md` §1.1 butir 9, §16, §17. Baca seperlunya.
- Repo itu BACA-SAJA. CLI repo boleh dijalankan (`npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/draft-check.ts`), tanpa menulis ke repo.
- Berkas ukur: `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab/` (disingkat `contract_ab/`). Lembar fakta ada di `contract_ab/facts/` (`W.md` untuk run W, `R-1.md`..`R-3.md` untuk run R); kueri sesi Q di `contract_ab/queries/Q.md`. Controller menyebut berkas yang dipakai di awal setiap sesi; baca hanya lembar run itu.
- Misi uji `2026-10-31_hermes-contract-ab`. Satu subfolder per run di workspace-mu: `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab/<run>/` (mis. `r1a/`, `r1b/`). Laporan MD arm A ditulis di subfolder run-nya (`r1a/`, `r2a/`, `r3a/`). Arm B: `target.mission.folder` = nama misi itu, `docKey` = `lapkerja-<run>`.
- DILARANG: port 9011, DB produksi, `~/gsp-datacenter`, mengubah konfigurasi/profil/memori Hermes, mencetak rahasia, menulis ke repo, menyunting tiga laporan asli, memakai `md2contract`, membuka `contract_ab/queries/` sebelum sesi Q, membaca `contract_ab/answers/` (milik controller).

## Skenario (sama untuk kedua arm)

Tiga laporan kerja nyata, baca-saja, relatif ke `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`:

| id | Path | owner, kartu |
|---|---|---|
| R-1 | `2026-10-04-prompt-manual/_work/t_ac989baa/LAPORAN-SELESAI.md` | `gsp-document-writer`, `t_ac989baa` |
| R-2 | `2026-10-12-game-success-formula/verification/01_verifier_report.md` | `gsp-thinker` (verifier), `t_40cefa7e` |
| R-3 | `2026-10-10-tracero-dispatcher-1010/laporan.md` | `gsp-system-manager`, `t_57ff71c4` |

Tulis ulang laporan kerja yang setara untuk pekerjaan itu. Isinya diambil dari lembar fakta controller `contract_ab/facts/R-<i>.md` (kelompok `F-awal`, `F-upd1`, `F-upd2`). Semua fakta masuk, tanpa fakta tambahan, dan tanpa menyalin judul atau bentuk laporan asli. `initiator` = `gsp-master01`.

Laporan R-3 merujuk satu bagian bukti di laporan R-1 yang kamu tulis pada arm yang sama (lembar fakta R-3 menyebutnya). Di run R3B, cari laporan R1B lewat API (R21 atau R20) dan isi `refs[]`; di run R3A, cari laporan MD R1A di `r1a/` dan tulis rujukannya. Pencarian ini bagian dari run dan dicatat seperti aksi lain.

| Langkah | Isi | Arm A | Arm B |
|---|---|---|---|
| S0 | START, baca lembar fakta | sama | sama |
| S1 | Laporan awal: pekerjaan dimulai, butir berjalan; `F-awal` | tulis MD | B1-B3 |
| S2 | Pembaruan 1: sebagian selesai; `F-upd1` | sunting MD | B4 |
| S3 | Pembaruan 2: selesai, plus vonis bila ada hasil cek; `F-upd2` | sunting MD | B4-B5 |
| S4 | Terbitkan | tidak ada (MD = final) | B6-B7 |
| S5 | END | sama | sama |

**Arm A:** tulis seperti kebiasaanmu sekarang (nama berkas, kepala, bab, istilah status pilihanmu), tanpa aturan tambahan.

**Arm B (alur §17):**
- B1 `GET /api/studio/registry?kind=contracts` (R03): ambil enum status, status butir, vonis, dan bab 1..5 dari respons.
- B2 Opsional: draf MD di subfolder run (§17.9), periksa dengan `draft-check.ts <draf> --remote http://127.0.0.1:9021 --json` atau `POST /api/studio/drafts/check` (R23).
- B3 `POST /api/studio/slots` (R13) slot `record` beramplop buat (`target.mission` + `docKey`, `template.slug`, `meta.title`). Simpan `document.id`, lalu kirim bab 1..5 lewat `POST /api/studio/chapters` (R12).
- B4 Pembaruan: `GET /api/studio/documents/{id}/content?slot=record&shape=submission` (R20), ubah payload lengkap, kirim ke R13 dengan `baseRevisionNo` itu. Bab: R12 ulang atau `PATCH /api/studio/documents/{id}/paragraphs/{pid}` (R16).
- B5 Temukan kembali: `GET /api/studio/contracts?mission=<misi>&cardId=<kartu>` (R21) menunjukkan status terbaru; `GET /api/studio/search?q=<istilah unik>&kind=agentWorkReport` (R22) mengembalikan `documentId` + `pid`.
- B6 `GET /api/studio/documents/{id}/completeness` (R15) = `COMPLETE`, lalu `POST /api/studio/documents/{id}/render` (R17) `{ "agentId": "hermes-gsp-master01", "scope": "document" }` tanpa `formats` (HTML).
- B7 `GET /api/studio/files/{id}` (R10), simpan dengan nama `X-Studio-Final-Filename` apa adanya. `HEAD /api/studio/files/{id}?verify=1` harus `X-Studio-Sha256-Verified: true`, dan `X-Studio-Sha256` = sha256 lokal.

Badan kiriman hanya boleh berada di blok draf atau dialirkan lewat stdin (`--emit n | curl --data-binary @-`). Berkas `.json` kiriman yang tersimpan dihitung berkas mentah.

## Urutan silang

Satu sesi baru per run. Controller menyebut run di awal sesi; kerjakan hanya run itu.

| order | run |
|---|---|
| 0 | W: arm B, `facts/W.md` sintetis, pemanasan tidak dinilai |
| 1, 2 | R1B, lalu R1A |
| 3, 4 | R2A, lalu R2B |
| 5, 6 | R3B, lalu R3A |
| 7 | Q: retrieval |

## Pencatatan `contract_ab/timing.csv`

Satu berkas, append-only, UTF-8, LF. Baris 1 persis header ini, dan setiap baris tepat 20 kolom:

```
run_id,arm,report_id,order,session_id,seq,step_id,step_kind,action,target,http_status,corr_id,t_start_utc,t_end_utc,dur_s,ok,err_code,bytes,sha16,note
```

- Waktu dari jam mesin (`time.time()`), epoch detik 3 desimal.
- `step_kind`: `scenario_marker` (`action` START/END), `tool`, `api` (`action` = metode + route), `edit`, `read`, `query`.
- Satu baris per aksi, termasuk yang gagal (`ok=0`, `http_status`, `err_code`, `corr_id` dari `x-correlation-id`). Ulangan = baris baru; jangan menimpa.
- `note` tanpa koma (pakai `;`).

| Metrik | Yang kamu catat (controller menghitung) |
|---|---|
| KE-1 waktu | START = aksi pertama; END = setelah B7 terverifikasi (arm A: suntingan S3 tersimpan) |
| KE-2 langkah | setiap aksi `tool`/`api`/`edit`/`read` |
| KE-3 galat format | setiap 4xx beserta `err_code`; hasil draft-check (kode isu, nomor blok di `note`) |
| KE-4 retrieval | `retrieval.csv` sesi Q |
| KE-5 disk | `bytes` + `sha16` setiap berkas yang ditulis/diunduh; `note=sha_ok` bila sha cocok; jangan menghapus berkas |
| KE-6 beban pikir format | bacaan untuk mencari format (panduan, registri, laporan lama) = `read` + `note=format_lookup`. Setelah END, tulis `contract_ab/format_<run>.txt`: keputusan bentuk (bukan isi) yang kamu ambil sendiri |
| KE-7 kelengkapan | arm B: status `completeness` R15 di `note` |
| MU-1, MU-2 penulis | arm B: setelah END, tambah baris `contract_ab/docs_b.csv` (`run_id,documentId,docNumber,revisionNo,lastFilledBy_record,lastFilledBy_content`) dari `completeness.slots[]` respons `GET /api/studio/documents/{id}` (R05). Kedua arm: daftar berkas MD laporan baru di `note` baris END |

## Sesi Q: retrieval 5/5 di kedua arm

Lima kueri konkret sudah dibekukan di `contract_ab/queries/Q.md`, yang diserahkan controller di awal sesi Q: Q1 status laporan kartu X; Q2 laporan berstatus S di misi M; Q3 paragraf yang memuat istilah Z; Q4 laporan milik owner O di misi M; Q5 paragraf bukti yang dirujuk laporan L. Semua kueri dibatasi ke laporan kerja misi uji `2026-10-31_hermes-contract-ab`. Urutan arm: Q1 A-B, Q2 B-A, Q3 A-B, Q4 B-A, Q5 A-B.
- Arm A: grep/baca hanya berkas laporan di `r1a/`, `r2a/`, `r3a/` dalam folder misi uji (`C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab/`); hasil `path[:baris]`. Berkas di `w/`, `r1b/`, `r2b/`, `r3b/` adalah draf arm B dan tidak dihitung sebagai hasil arm A; laporan asli di luar folder misi juga tidak.
- Arm B: dokumen laporan kerja Studio di misi uji; R21 (Q1, Q2, Q4), R22 (Q3), `GET` R16 (Q5, boleh didahului R20 atau R21 untuk menemukan `refs`); hasil `documentId[#pid]`.

Tulis `contract_ab/retrieval.csv` dengan header berikut. Kosongkan `expected_sha256`, `precision`, `recall`, `correct` (diisi controller). Setiap panggilan juga masuk timing.csv (`run_id=Q`, `step_kind=query`).

```
q_id,arm,query_text,tool_call,result_ids,expected_sha256,precision,recall,correct,t_start_utc,t_end_utc,dur_s,note
```

## Umpan balik (akhir sesi Q, maks 900 kata)

- A. Hasil per arm per run: selesai atau tidak, waktu START-END, jumlah aksi, galat.
- B. Langkah gagal apa adanya: kode HTTP, `err_code`, `x-correlation-id`.
- C. Friksi, urut dari yang paling merugikan: kejadian, dampak, usulan konkret.
- D. Vonis: apakah laporan kerja JSON layak menggantikan laporan kerja MD? Bila belum, sebut syarat sempitnya.
- E. Usulan lain (panduan §17, registri, CLI).

Jangan mengarang. Nilai yang tidak terukur dikosongkan dengan alasan di `note`. Run yang gagal atau batal tetap dicatat; jangan mengulang diam-diam demi hasil terbaik. Angka di umpan balik harus sama dengan CSV.

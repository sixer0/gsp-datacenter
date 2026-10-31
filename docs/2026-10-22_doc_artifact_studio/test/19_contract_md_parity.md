# DC-37 Uji banding 3 laporan kerja nyata Hermes: MD sumber lawan proyeksi JSON/HTML

- Baris: DC-37 (blueprint `identification/07_document_contract_blueprint.md:324`, `:377`); register `masterplan/05_document_contract_specs.md` §16 + BA-37 (`:1220`); protokol `research/11_contract_efficiency_protocol.md` §7; keputusan D-377, D-403, D-405, D-406; panduan `docs/STUDIO-AGENT-GUIDE.md` §17.
- Pelaksana: test-expert (skill `tdd`). Tanggal: 2026-10-31 (jam server 03:09-03:16 UTC). Repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1` branch `v2.1`. Kode produk tidak diubah.
- Status: **needs-review**. Paritas lulus 3/3 laporan. Kriteria "fixture 0 sisa" belum terpenuhi karena tidak ada endpoint arsip atau hapus dokumen. Id fixture tercantum di bagian 7 untuk dibersihkan controller.

## 1. Strategi uji

| Hal | Isi |
|---|---|
| Lingkup | 3 laporan dari protokol 11 §7: R-1 `2026-10-04-prompt-manual/_work/t_ac989baa/LAPORAN-SELESAI.md`, R-2 `2026-10-12-game-success-formula/verification/01_verifier_report.md`, R-3 `2026-10-10-tracero-dispatcher-1010/laporan.md` (relatif `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`). Workspace Hermes hanya dibaca. |
| Seam | Tiga seam publik saja: CLI `scripts/studio/md2contract.ts`; HTTP DEV `http://127.0.0.1:9021` (R08 `POST /api/studio/validate`, R04 `POST /api/studio/documents`, R17 render, R10 unduh, R20 `GET .../content`); berkas HTML yang diunduh. Tidak ada uji terhadap fungsi internal. |
| Oracle | Parser MD milik penguji (`parity.js`, ditulis terpisah dari importer `md/v1`) memecah sumber menjadi unit teks. Hasilnya dibandingkan dengan (a) keluaran md2contract, (b) isi tersimpan R20, dan (c) teks HTML. Banding ini tidak tautologis karena oracle tidak memakai kode produk. |
| Pengecualian | R21/R22 tidak dipakai, karena FIX-SEC sedang mengubah route contracts/search/drafts dan kuota. Render penuh `scope: document` ditolak `409 DOCUMENT_INCOMPLETE` (bagian 6, O-4), sehingga HTML diambil dari render per bab dan slot `record` (draf). |
| Integritas masukan | sha256 sebelum dan sesudah uji sama, dan sama dengan pin DC-35 (`test/18_contract_unit_tests.md:65-67`): R-1 `04497341b590a09b…98f7` 5.827 B 53 baris; R-2 `5852de3eee615b0f…9fc3` 19.076 B 80 baris; R-3 `746f79e265182bc0…296c` 14.386 B 247 baris. |

Definisi unit teks MD: judul `#`/`##`/`###`, paragraf (baris berurutan digabung), butir daftar (termasuk butir bersarang dan baris lanjutan), sel tabel (kepala dan badan; baris pemisah dilewati), dan baris non-kosong blok kode. Garis `---` tidak dihitung sebagai unit teks.

Normalisasi sebelum dicocokkan: backtick dan `**` dibuang, spasi dirapatkan, kutip tipografis diseragamkan.

Status kecocokan per unit:
- **tepat**: unit sama persis dengan satu unit JSON.
- **nomor dibuang**: judul `##` cocok setelah nomor tampilan di depannya dibuang (`2.`, `A.`). Pembuangan ini mengikuti aturan D-139 yang dipakai generator (`services/import/contract/index.ts:517-518`).
- **record**: baris `STATUS: x` yang dipetakan ke `record.status`.
- **termuat**: unit ada sebagai substring korpus JSON.
- **hilang**: unit tidak ditemukan sama sekali.

Unit **tambahan** adalah unit JSON yang tidak bersumber dari MD.

## 2. Berkas dan perintah

| Berkas | Isi |
|---|---|
| `C:/Users/TRIAL/AppData/Local/Temp/dc37/r{1,2,3}.json` | keluaran md2contract (studio.doc/v2) |
| `.../dc37/r{1,2,3}.submit.json` | sama, ditambah `agentId: "test-dc37"` |
| `.../dc37/r{1,2,3}.content.body` | isi tersimpan R20 |
| `.../dc37/html/*.html` | 24 HTML, disimpan dengan nama dari header `X-Studio-Final-Filename` |
| `.../dc37/p{1,2,3}.json` | hasil banding lengkap |
| `.../dc37/calls.log` | 62 panggilan HTTP (waktu, status, cid, sisa kuota) |
| `.../dc37/downloads.txt` | cek nama final dan sha untuk 24 unduhan |
| scratchpad sesi: `api.sh`, `render.sh`, `parity.js`, `drops.ts` | alat uji (rahasia dibaca lewat `$(cat …)`, tidak pernah dicetak) |

```bash
cd C:/Users/TRIAL/gsp-swarm-hq-v2.1
# tanpa opsi (kode keluar dicatat)
npx tsx scripts/studio/md2contract.ts <md> --kind agentWorkReport --mission 2026-10-31_dc37_parity
# dengan opsi
npx tsx scripts/studio/md2contract.ts <md> --kind agentWorkReport --mission 2026-10-31_dc37_parity \
  --doc-key dc37-r<n> --reported-at 2026-10-30T12:00+07:00 [--status needs-review  # R-2 saja] --out <dc37>/r<n>.json
node parity.js <md> r<n>.json r<n>.content.body <head|option> html/<nomor>-*.html
```

`--reported-at 2026-10-30T12:00+07:00` adalah nilai opsi yang sama dengan golden DC-35. Laporan MD tidak memuat stempel waktu, jadi nilai ini diberikan operator dan tidak ditebak. Determinisme diuji ulang: R-3 dijalankan dua kali dan sha16 keduanya `4306392c1f2eed43`.

## 3. md2contract: kode keluar

| Laporan | Tanpa opsi | Dengan opsi | sha256 keluaran (opsi DC-37) | Bab | Peringatan stderr |
|---|---|---|---|---|---|
| R-1 | exit 3: `reportedAt` | exit 0, valid=true | `fef208ffcd25ba06…9860` | 3, 6-9 (bab wajib kosong 1, 2, 4, 5) | 4 × CW-03 (`:29`, `:38`, `:47`, `:51`) |
| R-2 | exit 3: `status, reportedAt`; dengan `--reported-at` saja: exit 3 `status` | exit 0 (`--status needs-review`) | `d7819602bb0d6c91…f078` | 1, 6-12 (kosong 2-5) | 3 × CW-04 (`:3`, `:4`, `:7`), 7 × CW-03 |
| R-3 | exit 3: `reportedAt` | exit 0 | `4306392c1f2eed43…722e` | 1, 4, 6-11 (kosong 2, 3, 5) | 6 × CW-03 |

Kode keluar dan pola peringatan sama dengan D-377, D-405, D-406, dan golden DC-35. sha keluaran berbeda dari golden karena `--mission` dan `--doc-key` berbeda.

## 4. DEV 9021: dry-run, buat, render, unduh

| Laporan | R08 dry-run | R04 buat | Dokumen | Render penuh | Render bab + slot | Unduhan |
|---|---|---|---|---|---|---|
| R-1 | 200 valid, issues [], INCOMPLETE `content:1,2,4,5` (cid `334ed915-5887-4115-a644-5abfb72513ea`) | 201 rev 1 (cid `33beca7c-184a-4282-b150-6625bceb3d95`) | `cmvvtocr00044v1jguge04o6x` `003/GSP/LAP/X/2026` | 409 DOCUMENT_INCOMPLETE, allowedScopes chapter,slot (cid `a9641884-edb5-4089-9cd5-a282c4a48de3`) | 6 × 200 (slot record + bab 3, 6, 7, 8, 9) | 6/6 |
| R-2 | 200 valid, INCOMPLETE `content:2-5` (cid `ed159889-a523-4f03-a0a5-6663ca4d8514`) | 201 rev 1 (cid `9f6f0550-7c05-4252-b072-4da9020ef7f8`) | `cmvvtod3o004hv1jgcg9b4ymg` `004/GSP/LAP/X/2026` | 409 (cid `a1cdc78d-1f87-4ca0-87d9-aa50d6747a26`) | 9 × 200 (record + bab 1, 6-12) | 9/9 |
| R-3 | 200 valid, INCOMPLETE `content:2,3,5` (cid `8d925a32-def4-4c5e-ac53-c06a63196649`) | 201 rev 1 (cid `0da3b278-176c-4bce-ba99-00525a36ffaf`) | `cmvvtodel0056v1jg1mkkr06m` `005/GSP/LAP/X/2026` | 409 (cid `0f2318d2-5d85-4ae2-ac06-9155db837c84`) | 9 × 200 (record + bab 1, 4, 6-11) | 9/9 |

`warnings` pada respons R08 dan R04 bernilai null. Untuk setiap berkas dari 24 unduhan R10, ketiga cek ini lulus:
- `X-Studio-Final-Filename` = `outputs[].finalFileName` = nama di `Content-Disposition`;
- sha256 lokal = `X-Studio-Sha256` = sha DB.

Contoh nama berkas: `003-GSP-LAP-X-2026_rev1_20261031T030935Z_08e0ed18.html`.

### 4.1 cid setiap panggilan (urut waktu; sumber `calls.log`)

| Panggilan | cid |
|---|---|
| R04 GET daftar misi (pra, kosong) | `0952e0fc-d2ed-4d5f-b331-3028479a2fcf` |
| R17 R-1 slot record, bab 3, 6, 7, 8, 9 | `845e2425-5b78-4830-a225-e750376b7a01`, `d78b5d7b-fcda-4f3c-a832-9c9d0ac42d60`, `2496d213-92ff-44d6-a6ca-626170e37ce2`, `0b72ed3f-87dc-4ea3-b934-22c042d2f9f3`, `6557e12a-aee7-4f51-a961-ae2e71e64f09`, `0f0ef02f-cd6f-4184-adcc-7d5e3821ee0d` |
| R17 R-2 record, bab 1, 6-12 | `24aed1a4-6c3b-4ee9-b83b-29bfc525f6de`, `a29f92ea-1f55-4b2b-ab0f-3db5873cfe79`, `f0a867ee-27df-47ce-a20d-eadd81356495`, `fa596d74-f648-448c-b6bf-2e31cebb4a63`, `d1c7cf4d-a9dc-4ff2-acf3-bc7006cdae98`, `b3caa978-e87f-4b81-b755-773d4c7a5491`, `41422547-db8f-4e4a-a033-d964b85e764a`, `cb083eb8-17a3-4c20-8d5a-93fdeb410b11`, `a7e40fdb-5a23-4f7f-94d4-72afc4ffa213` |
| R17 R-3 record, bab 1, 4, 6-11 | `930207e4-1c18-4e54-9f56-8401004e3df9`, `f96bc5d5-1182-432f-9807-5eb4e2cef3a4`, `f040be5b-5c9a-4259-8f7e-f35feee095cc`, `f1c3b3e6-f9fd-48a2-a271-78f6cc65851f`, `9aef22dc-aff7-46ef-9b32-d118d464143f`, `9fb49be8-7453-464c-9d97-c2d70160b0f0`, `e204f1a5-15df-4ccb-834b-b98a0e6314b1`, `3b85cdea-643d-4199-862d-50ebd2a6f321`, `bc3bf0fa-0a89-43ea-a22b-374aac8040c9` |
| R10 GET 24 berkas (urutan `outputs.tsv`) | `e7e10f8e-3b7e-4fd5-a2f9-033f9be221c4`, `cf7aa54f-7da5-495b-b416-92ae68874d56`, `e14e1d10-748f-4410-8a9b-4af7a58e51b6`, `2651e91d-eff2-4600-ad37-65c6c6659d45`, `d78936c3-6af0-4511-b0b5-7095a96b8835`, `af6449c5-d7d5-4fca-b2d7-fb532b78a38e`, `84bf675a-6c14-4f26-addd-9e9397c8cf47`, `088a0a8c-0759-4c27-a151-1c44564ee6d9`, `80f4bc88-c58f-415c-91c8-fc09fc1f0cbf`, `5a765598-805a-43a2-8ea3-84b40fb60511`, `77fa4623-7846-44e8-a70c-38f229501159`, `eb003104-ceb1-4073-b8c0-88fa6727f679`, `8b8fbf7a-4f59-4b1c-880f-7719b302c39c`, `f02fcc60-4bfb-450c-9961-2884b7a500c6`, `46472c0f-c761-4ebb-80a0-1293b58b56b7`, `fe2ddde4-5274-4197-8ad6-0fc9207786f7`, `d52c1123-2c96-4689-9236-b4a91cc0b486`, `6f44e5fb-bdb3-4731-968d-1d9a72b92d6b`, `5c6bd75e-f35d-4365-8600-ed31dda09aa6`, `f244bda2-203c-4aad-bcd3-abe36dbae720`, `9c0ada66-8aa8-437a-b735-af46103de865`, `d2453792-568f-42bc-930f-0b3939a04d82`, `7bcf5e17-2727-4084-ab74-63439d7ae00d`, `85fff9f1-29cc-426a-ad67-0be417ed2569` |
| R20 content R-1, R-2, R-3 | `ff836f73-0290-421a-9b18-ec75aacda911`, `69464649-e006-40b2-a387-d4b390a50ab4`, `ecf45640-fe6f-465a-9e25-582aaf10bd01` |
| R04 GET daftar misi (pasca, 3 dokumen) | `c90159e9-19d2-4d00-bc61-87337c6d3cee` |

cid untuk R08, R04 POST, dan render penuh 409 tercantum di tabel bagian 4.

## 5. Hasil banding per laporan

### 5.1 Unit teks

| Laporan | n_md (rincian) | n_json | tepat | nomor dibuang | record | termuat | **hilang** | tambahan (label sintetis) | HTML ditemukan |
|---|---|---|---|---|---|---|---|---|---|
| R-1 | 40 (judul 1, `##` 6, paragraf 3, butir 30) | 44 | 39 | 0 | 1 (`:3` STATUS) | 0 | **0** | 1: judul bab "Bukti" | 40/40 |
| R-2 | 44 (judul 1, `##` 7, paragraf 11, butir 25) | 52 | 37 | 7 (`A.`..`G.`, `:10`..`:76`) | 0 | 0 | **0** | 1: "Ringkasan" | 44/44 |
| R-3 | 103 (judul 1, `##` 7, `###` 8, paragraf 15, butir 31, sel 24, kode 17) | 112 | 95 | 7 (`0.`..`6.`, `:15`..`:243`) | 1 (`:11` STATUS) | 0 | **0** | 4: "Ringkasan", "Isu terbuka", label monoBlock "Kode" × 2 | 103/103 |

Penjelasan tabel:
- Sisa selisih antara n_json dan n_md adalah judul section yang sama dengan judul babnya: R-1 4, R-2 7, R-3 6. Bab tambahan memakai judul sumber sebagai judul bab sekaligus judul section.
- Banding terhadap md2contract JSON dan terhadap isi tersimpan R20 memberi angka identik di ketiga laporan.
- Di HTML, judul dokumen (`#`) hanya muncul di `<title>`, karena render per bab tidak memuat sampul (O-4). Baris `STATUS:` tampil sebagai medan catatan "Status Selesai" atau "Perlu tinjauan" pada HTML slot record.

### 5.2 cardId, status/vonis, bukti

| Laporan | cardId di MD | di `record.cardIds` | di teks JSON / HTML | Baris keputusan (STATUS/VERDICT/CHECK/Vonis) di teks + HTML | `record.status` dan sumbernya | `record.verdict` dan sumbernya | Ditebak | Path / sha / cid di MD | Ada di teks + HTML | `evidence[]` terstruktur |
|---|---|---|---|---|---|---|---|---|---|---|
| R-1 | 1 (`t_ac989baa`) | 1/1 | 1/1 / 1/1 | 1 (`:3`, dipetakan ke record; HTML "Status Selesai") | `complete`, dari kepala `:3` | tidak ada | 0 | 9 / 5 / 0 | 14/14 | 0 |
| R-2 | 4 (`t_40cefa7e`, `t_e2acd3ae`, `t_d9804756`, `t_d371afd9`) | 4/4 | 4/4 / 4/4 | 17/17 (CHECK 1-15, VERDICT `:30`, Vonis G-5 `:58`) | `needs-review`, dari opsi `--status` (kepala tidak memuat status; tanpa opsi exit 3) | `FAIL`, dari `:30` "VERDICT: FAIL (…)" (token pertama eksplisit, D-377 butir 2; teks utuh tetap di bab 6) | 0 | 37 / 9 / 0 | 46/46 | 0 |
| R-3 | 5 (`t_57ff71c4`, `t_28c5ea2b`, `t_96c17250`, `t_183558d8`, `t_496d0386`) | 1/5 (sesuai aturan 40 baris, O-1) | 5/5 / 5/5 | 7/7 (STATUS `:11` ke record; CHECK 1-5 dan VERDICT `:171` di blok kode, utuh sebagai monoBlock) | `complete`, dari kepala `:11` | tidak ada (VERDICT `:171` di blok kode, tidak dipetakan) | 0 | 14 / 2 / 0 | 16/16 | 0 |

Tidak ada nilai majemuk pada kunci STATUS atau VERDICT di ketiga laporan. Karena itu tidak muncul CW-02, dan tidak ada nilai majemuk yang dipetakan.

## 6. Vonis per ambang

| Ambang (blueprint `:324`, BA-37) | R-1 | R-2 | R-3 |
|---|---|---|---|
| Unit teks terjaga 100% | LULUS 40/40 (hilang 0) | LULUS 44/44 (7 lewat aturan nomor tampilan D-139) | LULUS 103/103 (7 lewat D-139) |
| cardId terjaga 100% (record atau teks) | LULUS 1/1 | LULUS 4/4 | LULUS 5/5 |
| Keputusan/status terjaga 100% | LULUS 1/1 | LULUS 17/17 | LULUS 7/7 |
| 0 status ditebak | LULUS (kepala) | LULUS (opsi + token eksplisit) | LULUS (kepala) |
| Bukti berpath/sha/cid ada di evidence atau teks | LULUS 14/14 | LULUS 46/46 | LULUS 16/16 |
| Fixture 0 sisa | **BELUM**: tidak ada endpoint arsip/hapus dokumen, id fixture di bagian 7 | idem | idem |

Kesimpulan KE-6 (konversi transisi): paritas teks, cardId, status/vonis, dan bukti 100% di ketiga laporan, dengan 0 tebakan. Kriteria fixture menunggu tindakan controller.

## 7. Pembersihan fixture

Endpoint arsip atau hapus dokumen tidak ditemukan:
- R04 GET hanya menyaring `archived=0|1`.
- `src/app/api/studio/documents/[id]/route.ts` hanya memuat `GET` (`:271`).
- Op struktur di API-REFERENCE tidak punya op arsip.

Karena itu tidak ada yang dihapus. Sisa yang perlu dibersihkan controller:

| Jenis | Id / lokasi |
|---|---|
| Dokumen (misi `2026-10-31_dc37_parity`, `agent:test-dc37`, rev 1, INCOMPLETE) | `cmvvtocr00044v1jguge04o6x` (003/GSP/LAP/X/2026, dc37-r1); `cmvvtod3o004hv1jgcg9b4ymg` (004/…, dc37-r2); `cmvvtodel0056v1jg1mkkr06m` (005/…, dc37-r3) |
| Berkas render (24 HTML, 22 MB, dalam `.gitignore`) | `C:/Users/TRIAL/gsp-swarm-hq-v2.1/data/studio-workspace/docs/2026-10-31_dc37_parity/studio/` |
| Id berkas (R10) | 24 id di `C:/Users/TRIAL/AppData/Local/Temp/dc37/outputs.tsv` (mis. `cmvvtooln006fv1jgegyinbsj` … `cmvvtr9uy00auv1jg73qir9fh`) |
| Salinan lokal penguji | `C:/Users/TRIAL/AppData/Local/Temp/dc37/` (di luar repo) |

Nomor dokumen 003-005/GSP/LAP/X/2026 sudah terpakai dari sekuens. Bila dokumen dihapus, celah nomor akan tetap ada.

## 8. Daftar selisih, temuan, dan observasi

**F-1 (Minor, produk): md2contract tidak menampilkan penurunan struktur dari importer `md/v1`.**
- Letak: `scripts/studio/md2contract.ts:142-146`. `printWarnings` hanya mencetak `report.warnings`. Entri `report.mapping.prose[].dropped` (`LIST_NESTING`, `THEMATIC_BREAK`) tidak tampil di stderr dan tidak ditangkap `--strict`. Entri itu diisi di `services/import/contract/index.ts:316`, dan perataan daftar terjadi di `services/import/markdown.ts:499-502`.
- Dampak pada R-1: daftar `:13-27` (butir 1 dengan 13 sub-butir, lalu butir 2) menjadi satu `<ol>` berisi 15 butir. Butir sumber "2. Scanner naturalisasi…" tampil bernomor 15 di HTML, dan hierarki CHECK di bawah butir 1 hilang. Daftar `:7-9` juga diratakan.
- R-3 kehilangan 6 garis `---`. Teks utuh, tetapi struktur dan penomoran berubah tanpa peringatan di CLI.
- Reproduksi: `npx tsx drops.ts <R-1>` (in-process `markdownToContract`) menghasilkan bab 3 `dropped` `LIST_NESTING` baris 7 dan 13. Bandingkan dengan `dc37/r1.err`, yang hanya memuat 4 × CW-03.

**O-1: `cardIds` record hanya diambil dari 40 baris pertama** (register §16.4, `HEADER_SCAN_LINES = 40` di `parse.ts:18`).
- Pada R-3, 4 kartu kasus (`:43-66`) tidak masuk `record.cardIds`. Akibatnya R21 `?cardId=` tidak akan menemukan laporan ini, dan kartu itu hanya terjangkau lewat R22 teks penuh.
- Perilaku ini sesuai spesifikasi, tetapi menjadi catatan efisiensi untuk DC-46.

**O-2: `evidence[]` terstruktur kosong di ketiga laporan.**
- Laporan F1 hanya mengisi evidence dari kolom `bukti` pada tabel butir atau dari label `ARTEFAK:` (K1). Akibatnya 60 path dan 16 sha hanya tersedia sebagai teks. Hal ini sesuai register.
- Ini bukti bahwa format MD lama tidak memberi bukti terstruktur, dan bahwa kontrak JSON harus diisi agen secara langsung.

**O-3: Pertentangan status di sumber R-3.**
- Kepala `:11` berbunyi "STATUS: complete", sedangkan prosa `:228` berbunyi "STATUS needs-review untuk System Control sebelum deploy".
- Generator memakai kepala yang eksplisit, jadi ini bukan tebakan. Prosa tetap utuh di bab 10. Record menampilkan "Selesai", jadi pembaca catatan tidak melihat permintaan tinjauan itu.

**O-4: Render penuh ketiga laporan ditolak `409 DOCUMENT_INCOMPLETE`.** Bab wajib yang hilang: 1/2/4/5, 2-5, dan 2/3/5. HTML hanya dapat diambil sebagai draf per bab atau slot, dan judul dokumen hanya ada di `<title>`. Ini sesuai panduan §17.10 ("hasil generator sering belum memenuhi bab wajib").

**O-5: Nomor tampilan `##` dibuang (D-139), sehingga rujukan silang di badan kehilangan sasaran.**
- R-2 `:18` "lihat seksi C" dan `:25` "seksi B", "seksi D": di HTML, judul "B. CACAT AKURASI" tampil sebagai "7" / "7.1 CACAT AKURASI".
- R-3 `:238` "Angka populasi (§0)": bab "0. Ringkasan vonis" menjadi bab kunci 6.
- Teks dan isi tetap utuh. Ini keputusan desain yang sudah diterima, dicatat sebagai bahan pertimbangan controller.

**O-6 (dokumen): header kuota pada respons R04 `201`.** Header `X-Studio-Quota-Remaining` (kuota render, nilai 29/28/27) muncul pada R04 `201`. Panduan §17.11 menyebut header pada route kiriman "hanya muncul di respons 429". Ini drift dokumen setelah FIX-QA (D-403), masuk lingkup DOC-FIX.

## 9. Catatan CI, keterbatasan, rekomendasi

- CI: banding ini bergantung pada server DEV dan workspace Hermes yang hidup, jadi tidak cocok sebagai uji CI. Golden md2contract dalam CI sudah dipegang DC-35. Tidak ada uji flaky; kuota render 30/60 s dijaga dengan jeda sekitar 50 s antar laporan.
- Keterbatasan: oracle MD milik penguji tidak memahami Markdown sepenuhnya (tautan, emphasis tunggal, dan HTML mentah tidak ada di ketiga sumber). Kecocokan memakai normalisasi spasi dan backtick. HTML dibandingkan per draf bab, bukan render dokumen penuh.
- Rekomendasi:
  1. F-1: tampilkan `mapping.prose[].dropped` di stderr md2contract, minimal kode dan baris, atau hitung sebagai peringatan `--strict`.
  2. Controller membersihkan fixture di bagian 7 atau memutuskan endpoint arsip dokumen.
  3. O-1 dan O-2 menjadi masukan DC-46 sebagai bukti kebutuhan kontrak JSON langsung.
  4. O-6 masuk DOC-FIX.

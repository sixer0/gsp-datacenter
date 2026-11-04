---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S25
date: 2026-11-04
agent: test-expert
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# S25: kalibrasi emas skor konformitas DATUM dan pemeriksa bentrok PDF

Skill dimuat: `tdd` (seam = CLI skor `benchmark/datum_conformance/score.ts` dan CLI `clash/clash.py`; harapan tiap uji
diambil dari katalog `research/32`, register `research/31`, dan teks manual `manual_id.txt`, bukan dari kode skor).
Masukan dibaca: baris S25 (`02_structured_datum_rev_a.md:141, 200`), laporan `delegation_progress/coder_execution_s20.md`
sampai `s24.md`, keputusan D-592, D-593, D-598..D-603 (`decisions/decisions.md:598-609`).
Kode skor dan kode produksi tidak diubah. Tanpa commit, DB, atau port. Semua artefak kerja di `C:/tmp/dc_s25/`.

## Ringkasan

| Masukan | Pasangan | Skor terukur | Kritis | Bentrok PDF | Bentrok X | Cakupan |
|---|---|---|---|---|---|---|
| Manual 000 (105 hlm) | `datum-standar` ID TERBIT, r08 | **72,7 %** (48/66) | 2/4 (gagal CR-3, CR-4) | 0 | 0 | tertunda (S33) |
| a_terbit_datum_gsp (7 hlm) | `datum-gsp` ID TERBIT, r08, `--bfix` = diri sendiri | **83,0 %** (54/65) | 3/4 (gagal CR-3) | 0 | 0 | tertunda |
| b_nota_datum_gsp (4 hlm) | `datum-gsp` ID NOTA, r08, `--bfix` = diri sendiri | **85,2 %** (29/34) | 3/4 (gagal CR-3) | 0 | 0 | tertunda |
| a_terbit_datum_kanonik (7 hlm) | `datum-kanonik` (KT, kicker kosong) ID TERBIT, r08, `--bfix` = diri sendiri | **89,2 %** (58/65) | 3/4 (gagal CR-3) | 0 | 0 | tertunda |
| b_nota_datum_kanonik (4 hlm) | `datum-kanonik` ID NOTA, r08, `--bfix` = diri sendiri | **85,2 %** (29/34) | 3/4 (gagal CR-3) | 0 | 0 | tertunda |

Temuan utama:
1. **Bug skor kelas (b), 1 aktif + 1 laten.** B-1: modul `structure_a` belum menerima alias wajah `IBM Plex Sans Cond`
   yang sudah disahkan D-602, jadi CV-12 gagal palsu pada Manual 000 dan datum-gsp, CV-11 Manual 000 menjadi NA palsu (baris
   cakupan Cond tidak dikenali), dan CV-08/CV-11 akan gagal atau NA palsu pada
   setiap templat baru di atas `datum-gsp-preset` begitu kicker/baris cakupan muncul (direproduksi). B-2 (laten, rendah):
   `w:smallCaps` tidak dianggap kapital tampak.
2. **Premis "DOCX ID sebagai B-FIX sendiri" tidak berlaku.** Kasus baseline memuat `Rp 1.250.000,50`, bukan empat string
   harapan B-FIX `research/32` §10 (`1.250.000,5`, `Rp 1.385.946.000`, `25 %`, `0,5`), jadi CR-3 tetap FAIL (kelas c).
   Kontrol positif (B-FIX sintetis dengan keempat string) membuat CR-3 lulus dan keempat aturan kritis lulus; kontrol negatif
   (`Rp1.385.946.000`) tetap FAIL.
3. **CV-16 datum-gsp = penyimpangan nyata (a).** Run kolofon `PT Gemilang Satria Perkasa · NIB ...` tidak punya `w:caps`
   maupun `w:smallCaps` (rPr langsung, tanpa pStyle/rStyle; `styles.xml` tanpa caps sama sekali). Menambah `w:caps` saja
   membuat CV-16 lulus, jadi jalur teks tampak skor benar.
4. **Semua mutasi menurunkan skor** dan clash.py menangkap tumpang, keluar halaman, dan keluar margin pada PDF yang dirusak.
5. **Skor layak menjadi gerbang dengan syarat**: perbaiki B-1 sebelum S36; sediakan fiksur B-FIX per pasangan (CR-3),
   `--spec` dari S26 (NU-03, sudah terbukti lulus untuk `datum-standar`), dan cakupan S33; clash.py selalu dengan `--docx`.

## 1. Strategi uji

| Hal | Isi |
|---|---|
| Lingkup | Skor penuh (semua modul S21-S23, tanpa `--implemented-only`) + clash.py S24 pada 5 masukan emas; uji mutasi DOCX dan PDF; kontrol positif untuk jalur yang tidak bisa lulus pada masukan emas (CR-3, NU-03, CV-16 caps, CV-12 alias) |
| Pengecualian | Cakupan butir (S33 belum ada): ditandai tertunda, putusan PASS memang mustahil tanpa `--coverage` (`lib/cli.ts`, alasan "cakupan butir tidak diketahui"). Tidak ada kasus EN emas: cabang EN diuji lewat salinan berlabel EN hasil mutasi |
| Kerangka | Skor TS (`npx tsx`, Node), uji diri vitest; clash.py PyMuPDF 1.28.2 venv hermes `C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe`, uji diri pytest; soffice untuk DOCX -> PDF di `C:/tmp/dc_s25/work` |
| Konteks pasangan | Manual 000 = `datum-standar` ID TERBIT (STD); kasus `a_*` TERBIT, `b_*` NOTA; `datum-gsp` dari register (KT, kicker kosong); `datum-kanonik` di luar register: `--type-code KT --kicker ""`; `--produced-by r08` (asal baseline `render_cli.ts`, `render_report.json`) |
| Skrip bantu (di luar repo) | `C:/tmp/dc_s25/scripts/`: `mutate.py` (mutasi DOCX), `kicker.py` (repro B-1), `pdf_mut.py` (mutasi PDF), `summ.py`, `diff.py`, `matrix.py` (tabulasi JSON laporan) |

## 2. Berkas uji

Tidak ada berkas uji baru di repo (kalibrasi = run CLI atas masukan nyata). Artefak:

| Artefak | Lokasi |
|---|---|
| Salinan masukan (sha256 sama dengan sumber) | `C:/tmp/dc_s25/in/` |
| PDF hasil konversi soffice | `C:/tmp/dc_s25/pdf/<kasus>.pdf`, `m000_reconv.pdf` |
| JSON bentrok | `C:/tmp/dc_s25/clash/*.json` |
| Laporan skor emas (JSON + MD) | `C:/tmp/dc_s25/out/<kasus>/` |
| DOCX mutan dan laporannya | `C:/tmp/dc_s25/mut/`, `C:/tmp/dc_s25/out_mut/` |
| JSON spec S26 (ekspor `docTypeTemplateSpecJson()`, tanpa DB) | `C:/tmp/dc_s25/spec_s26.json` |

sha256 masukan: Manual 000 DOCX `dc6ae22f16ddf401...`, PDF `454421e0dbf34215...`; a_terbit_datum_gsp `633e583f59dee6c9...`;
b_nota_datum_gsp `5aeac7ccd1399fd3...`; a_terbit_datum_kanonik `bbbfe86e278178e7...`; b_nota_datum_kanonik `3146b14cba5aeea5...`
(sama dengan S21-S23).

## 3. Perintah dan keluaran

### 3.1 Bentrok PDF (selalu dengan `--docx`)

```
V=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe; T=C:/tmp/dc_s25
$V -I -B benchmark/datum_conformance/clash/clash.py --pdf $T/in/m000.pdf --docx $T/in/m000.docx --no-convert --out $T/clash/m000.json --work-dir $T/work
$V -I -B benchmark/datum_conformance/clash/clash.py --pdf $T/pdf/<kasus>.pdf --docx $T/in/<kasus>.docx --out $T/clash/<kasus>.json --work-dir $T/work
$V -I -B benchmark/datum_conformance/clash/clash.py --pdf $T/pdf/m000_reconv.pdf --docx $T/in/m000.docx --out $T/clash/m000_reconv.json --work-dir $T/work
```
```
clash: 0 clashes on 105 pages  | C:\tmp\dc_s25\clash\m000.json                    (exit 0)
clash: 0 clashes on 7 pages    | C:\tmp\dc_s25\clash\a_terbit_datum_gsp.json      (exit 0)
clash: 0 clashes on 4 pages    | C:\tmp\dc_s25\clash\b_nota_datum_gsp.json        (exit 0)
clash: 0 clashes on 7 pages    | C:\tmp\dc_s25\clash\a_terbit_datum_kanonik.json  (exit 0)
clash: 0 clashes on 4 pages    | C:\tmp\dc_s25\clash\b_nota_datum_kanonik.json    (exit 0)
clash: 0 clashes on 105 pages  | C:\tmp\dc_s25\clash\m000_reconv.json             (exit 0)
```

### 3.2 Skor penuh

```
S="npx tsx benchmark/datum_conformance/score.ts"
$S --docx $T/in/m000.docx --template datum-standar --language ID --tier TERBIT --produced-by r08 --clash $T/clash/m000.json --out $T/out/m000
$S --docx $T/in/a_terbit_datum_gsp.docx --template datum-gsp --language ID --tier TERBIT --produced-by r08 --bfix $T/in/a_terbit_datum_gsp.docx --clash $T/clash/a_terbit_datum_gsp.json --out $T/out/a_terbit_datum_gsp
$S --docx $T/in/b_nota_datum_gsp.docx --template datum-gsp --language ID --tier NOTA ... (pola sama)
$S --docx $T/in/a_terbit_datum_kanonik.docx --template datum-kanonik --type-code KT --kicker "" --language ID --tier TERBIT --produced-by r08 --bfix <diri> --clash <json> --out ...
$S --docx $T/in/b_nota_datum_kanonik.docx --template datum-kanonik --type-code KT --kicker "" --language ID --tier NOTA ... (pola sama)
```
```
datum-standar_ID: FAIL | skor 72.7 % (48/66) | kritis 2/4 | cakupan ? | bentrok 0
  - aturan kritis gagal: CR-3, CR-4                                                   exit 1
datum-gsp_ID: FAIL | skor 83.0 % (54/65) | kritis 3/4 | cakupan ? | bentrok 0   (a_terbit_datum_gsp)   exit 1
datum-gsp_ID: FAIL | skor 85.2 % (29/34) | kritis 3/4 | cakupan ? | bentrok 0   (b_nota_datum_gsp)     exit 1
datum-kanonik_ID: FAIL | skor 89.2 % (58/65) | kritis 3/4 | cakupan ? | bentrok 0 (a_terbit_kanonik)  exit 1
datum-kanonik_ID: FAIL | skor 85.2 % (29/34) | kritis 3/4 | cakupan ? | bentrok 0 (b_nota_kanonik)    exit 1
```
Putusan FAIL pada semua masukan disebabkan CR-3 (dan CR-4 untuk Manual 000), skor < 85 % (Manual 000, a_terbit_datum_gsp),
dan cakupan tidak diberikan (tertunda S33).

### 3.3 Uji diri skor dan clash (bukti alat sehat pada sesi ini)

```
npx vitest run tests/unit/studio/datum-conformance      -> Test Files 9 passed (9), Tests 199 passed (199)
$V -I -B -m pytest -p no:cacheprovider -q benchmark/datum_conformance/clash/tests   -> 25 passed in 14.65s
```

## 4. Baseline per keluarga

| Keluarga | Manual 000 | a_terbit_datum_gsp | b_nota_datum_gsp | a_terbit_datum_kanonik | b_nota_datum_kanonik |
|---|---|---|---|---|---|
| CR | 2/4 | 3/4 | 3/4 | 3/4 | 3/4 |
| CV | 11/14 | 11/14 | - | 13/14 | - |
| CS | 3/5 | 5/5 | - | 5/5 | - |
| TR | 0/3 | 1/3 | 1/1 | 3/3 | 1/1 |
| RH | 2/3 | 2/3 | 2/3 | 2/3 | 2/3 |
| RB | 6/7 | 6/7 | 5/6 | 6/7 | 5/6 |
| SB | 2/3 | 2/3 | - | 2/3 | - |
| IS | 2/3 | 3/3 | - | 3/3 | - |
| GF | 12/14 | 12/13 | 12/13 | 12/13 | 12/13 |
| DV | 1/1 | 1/1 | 1/1 | 1/1 | 1/1 |
| NU | 2/4 | 3/4 | 3/4 | 3/4 | 3/4 |
| NC | 1/1 | 1/1 | - | 1/1 | - |
| AC6 | - (EN saja) | - | - | - | - |
| LB | 4/4 | 4/4 | 2/2 | 4/4 | 2/2 |
| **Total** | **48/66 = 72,7 %** | **54/65 = 83,0 %** | **29/34 = 85,2 %** | **58/65 = 89,2 %** | **29/34 = 85,2 %** |
| Bentrok PDF (G-01..G-06) | 0 / 105 hlm | 0 / 7 | 0 / 4 | 0 / 7 | 0 / 4 |
| Bentrok X-01..X-05 | 0 | 0 | 0 | 0 | 0 |

Penyebut = PASS + FAIL + UNEXERCISED atas aturan berlaku (`research/32` §0.3). `-` = tidak berlaku untuk tier/bahasa itu.

### 4.1 Matriks per aturan

P = pass, **F** = fail, **U** = unexercised (dihitung gagal), NA = tidak berlaku bersyarat (keluar penyebut), `-` = tidak
berlaku tier/bahasa.

| Aturan | Manual 000 | a_terbit_gsp | b_nota_gsp | a_terbit_kanonik | b_nota_kanonik |
|---|---|---|---|---|---|
| CR-1 | P | P | P | P | P |
| CR-2 | P | P | P | P | P |
| CR-3 | **F** | **F** | **F** | **F** | **F** |
| CR-4 | **F** | P | P | P | P |
| CV-01..CV-06 | P | P | - | P | - |
| CV-07 | **F** | **F** | - | **F** | - |
| CV-08 | NA | NA | - | NA | - |
| CV-09, CV-10 | P | P | - | P | - |
| CV-11 | NA | NA | - | NA | - |
| CV-12 | **F** | **F** | - | P | - |
| CV-13 | P | P | - | P | - |
| CV-16 | P | **F** | - | P | - |
| CV-17 | **F** | P | - | P | - |
| CV-18 | P | P | - | P | - |
| CS-01 | P | P | - | P | - |
| CS-02 | **F** | P | - | P | - |
| CS-03 | P | P | - | P | - |
| CS-04 | **F** | P | - | P | - |
| CS-07 | P | P | - | P | - |
| CS-10 | NA | NA | - | NA | - |
| RH-01, RH-04 | P | P | P | P | P |
| RH-03 | **F** | **F** | **F** | **F** | **F** |
| RB-01..RB-04, RB-06 | P | P | P | P | P |
| RB-05 | **F** | **F** | **F** | **F** | **F** |
| RB-07 | P | P | - | P | - |
| RB-08 | - | - | - | - | - |
| SB-01, SB-03 | P | P | - | P | - |
| SB-02 | **F** | **F** | - | **F** | - |
| IS-01 | **F** | P | - | P | - |
| IS-02, IS-03 | P | P | - | P | - |
| GF-01..GF-07, GF-09, GF-10 | P | P | P | P | P |
| GF-11 | P | NA | NA | NA | NA |
| GF-12 | **F** | P | P | P | P |
| GF-13 | **F** | **F** | **F** | **F** | **F** |
| GF-14, GF-15, DV-01 | P | P | P | P | P |
| NU-02 | **F** | P | P | P | P |
| NU-03 | **U** | **U** | **U** | **U** | **U** |
| NU-05, NU-07 | P | P | P | P | P |
| TR-01 | **F** | P | - | P | - |
| TR-02 | - | - | P | - | P |
| TR-03 | **F** | **F** | - | P | - |
| TR-04 | - | - | - | - | - |
| TR-08 | **F** | **F** | - | P | - |
| NC-04 | P | P | - | P | - |
| AC6-03 | - | - | - | - | - |
| LB-01, LB-02 | P | P | - | P | - |
| LB-03, LB-09 | P | P | P | P | P |
| LB-06, LB-10, LB-11 | NA | NA | - | NA | - |
| X-01..X-05 (bentrok) | P | P | P | P | P |

## 5. Klasifikasi kegagalan

Kelas: (a) penyimpangan mesin/profil yang nyata terhadap manual; (b) bug atau salah baca skor; (c) artefak masukan.
Bukti = kutipan `evidence`/`observed` laporan JSON di `C:/tmp/dc_s25/out/<kasus>/`, ditambah pemeriksaan XML langsung bila disebut.

| Aturan | Masukan | Bukti | Kelas | Alasan |
|---|---|---|---|---|
| CR-3 (K) | 4 kasus baseline | `B-FIX tanpa string harapan ID: "1.250.000,5", "Rp 1.385.946.000", "25 %", "0,5"`; pindai sampel 0 pelanggaran | c | DOCX baseline bukan fiksur B-FIX (`research/32` §10 butir 4: fiksur harus memuat persis empat string itu). Kontrol positif `p_bfix` -> CR-3 lulus (§6.2); jalur skor benar |
| CR-3 (K) | Manual 000 | `fiksur B-FIX tidak diberikan ...; sampel juga melanggar: "Rp" (Rp menempel pada angka (ID:1932-1934))` | c | Tanpa B-FIX = UNEXERCISED = FAIL (31 F-5); `Rp` menempel berasal dari contoh salah di prosa manual |
| CR-4 (K) | Manual 000 | `cap terbit tanpa " -- TERBITAN " (teramati "// 20261008 ID T — TERBITAN 1")` | c | Render lama Manual 000 memakai U+2014; manual Rev A menulis `// 20261102 ID T -- TERBITAN 1` (`manual_id.txt:20`); baseline S05 sudah `--` (lulus) |
| IS-01 | Manual 000 | `cap terbit "// 20261008 ID T — TERBITAN 1" memuat U+2014` | c | Akar sama dengan CR-4 Manual 000 |
| CV-07 | gsp, kanonik | `kicker pasangan kosong: unsur 6 sampul (kicker jenis dokumen) tidak ada` | a | Templat kalibrasi tanpa kicker (`page.ts:414` bawaan `""`); FAIL sesuai katalog CV-07 |
| CV-07 | Manual 000 | `kicker "STANDAR" tidak ditemukan`; teramati `Standar · Manual Komprehensif · Panduan Skill DATUM GSP` | c | Manual 000 memakai kicker gabungan eksplisit; aturan menuntut teks tampak = kicker pasangan |
| CV-12 | Manual 000, a_terbit_gsp | `label bukan 6,4 pt Cond (sz 13 +-1, fon Condensed): "Nomor dokumen" sz=12 font=IBM Plex Sans Cond ...` | **b (B-1)** | Ukuran sz 12 masuk 13 +-1; satu-satunya sebab = nama wajah. D-602 mengesahkan `IBM Plex Sans Cond` sebagai alias Cond untuk CV-12/GF-07; `structure_a` masih `COND_FONT_MARKERS = ["Condensed"]` (`rules/expect_structure_a.ts:118`). Probe `p_cond` (ganti nama wajah ke `Condensed`) -> CV-12 lulus |
| CV-11 (NA) | Manual 000 | `baris cakupan tidak ada (unsur 9 bersyarat)`, padahal sampul memuat `Menyatukan DATUM House Style Explained Rev A · Panduan Jenis Chart v1...` sesudah judul, run `IBM Plex Sans Cond` sz 15 (dibaca langsung dari document.xml) | **b (B-1)** | Pengenal E9 mensyaratkan semua run Cond menurut `COND_FONT_MARKERS` (`rules/structure_a.ts:209`), jadi baris cakupan bernama wajah pendek tidak dikenali dan aturan jatuh ke NA palsu (penyebut mengecil). Dengan alias, CV-11 menilai Cond + sz 15 +-1 = lulus. gsp/kanonik memang tanpa baris cakupan (NA sah) |
| CV-16 | a_terbit_gsp | teramati `PT Gemilang Satria Perkasa · NIB 9120208940517` | a | Run kolofon (document.xml, sampul blok 10) rPr: Mono, `w:b=0`, `w:i=0`, warna 7A756E, sz 12, **tanpa `w:caps`/`w:smallCaps`**, tanpa pStyle/rStyle; `styles.xml` tidak memuat caps (grep 0). Teks tampak memang campur huruf. Sumber: `org.entityName` profil Manual 000 = `PT Gemilang Satria Perkasa` (`benchmark/manual000/template.json`), registri `PT GEMILANG SATRIA PERKASA` (`params/page.ts:444`). Probe `p_caps` (+`w:caps`) -> CV-16 lulus, jadi bukan bug skor |
| CV-17 | Manual 000 | teramati `MANUAL · DATUM TERPADU · ID · REV A · X · 2026` | c | Jenis string punggung `MANUAL` (bukan STD) |
| NU-02 | Manual 000 | `seksi 0 (cover) string punggung: jenis "MANUAL" != STD` | c | Akar sama dengan CV-17 |
| CS-02 | Manual 000 | `kicker="Lembar Kendali" judul="Kendali Dokumen, Riwayat Revisi, dan Pernyataan Verifikasi"` | c | Judul eksplisit Manual 000 (manual sendiri menulis judul serupa, `manual_id.txt:25`). Catatan katalog: klausa judul CS-02 berasal dari kode (`compose/front.ts:74-76`), bukan dari manual, jadi tata letak manual sendiri tidak lulus klausa itu; tidak memengaruhi templat (mode auto selalu mencetak label) |
| CS-04 | Manual 000 | `revision: [Rev, Tanggal, Penyusun, Perubahan, Status] != [Rev, Tanggal, Uraian, Oleh]; verification: [Lapis, Metode, Objek, Hasil] ...` | c | Manual 000 memakai kolom manual (`manual_id.txt:29, 39, 58`); register `research/31` §4.2 sengaja memilih kolom kode dan memindahkan kolom manual ke cakupan. Gagal sesuai desain |
| TR-01 | Manual 000 | `tier sampul bukan TERBIT`, teramati `TERBIT, dengan PDF` | c | Nilai tier eksplisit Manual 000; manual Rev A menulis `TIER TERBIT` (`manual_id.txt:17`) |
| TR-03 | Manual 000, a_terbit_gsp | `tidak ada seksi DAFTAR ISI (pembungkus bermedan TOC)` | a | Daftar isi berupa tabel, `render.toc.mode = static` di profil Manual 000 / `datum-gsp-preset` (`benchmark/manual000/template.json`; `params/render.ts:168-171`). Kanonik (`field`) lulus |
| TR-08 | Manual 000, a_terbit_gsp | `tidak ada medan TOC` | a | Akar sama dengan TR-03 |
| RH-03 | semua | `garis single/C3CBD1/sz 5, harapan 6E1420/sz 6+-1` (21 header Manual 000, 4 per kasus) | a | Mesin `INK200` sz 5 tertulis keras (`engine/docx/package/header-footer.ts:73`); manual "garis seal 0,26 mm" (`manual_id.txt:2576`); F-4/D-598 |
| RB-05 | semua | `sel 1 garis atas single/101418/sz 8, harapan 6E1420/sz 8+-1` | a | Mesin `INK900` tertulis keras (`header-footer.ts:324`); manual "Garis atas seal 0,35 mm" (`manual_id.txt:2577`); D-602 |
| SB-02 | semua TERBIT | `pita segel 1: warna teks F6E9E9, harapan F4F5F6` | a | `color.wrapper.cream` = F6E9E9 (`engine/docx/wrapper/formats.ts:44, 229`); manual "teks #F4F5F6" (`manual_id.txt:2573`); D-602 |
| GF-13 | semua | `klasifikasi tebal=true warna=101418, harapan tebal 6E1420` | a | `RUNNING_HEAD_RIGHT_RUN`/`REGISTER_VALUE_RUN` INK900 tertulis keras (`header-footer.ts:55, 59`); manual "klasifikasi seal tebal" (`manual_id.txt:2576-2577`); F-4/D-598 |
| GF-12 | Manual 000 | `word/document.xml: memuat warna pensiun 1A2B4A` dan `C9A84C` | c | Prosa manual menyebut warna pensiun, bukan pemakaian warna; dilaporkan apa adanya (D-602) |
| NU-03 | semua | `tabel spec templat tidak diberikan (--spec)` | tertunda | Bukan kegagalan DOCX. Dengan `--spec` S26 nyata: `datum-standar` PASS (`doc.typeCode = daftar Rev A (14 kode, NDA, tanpa DS); kode, tier, bahasa, kicker = pasangan`); `datum-gsp` FAIL `spec tanpa baris slug datum-gsp (10 baris)` karena templat kalibrasi memang di luar tabel spec |

Ringkas per kelas: (a) RH-03, RB-05, SB-02, GF-13, TR-03, TR-08, CV-07 (gsp/kanonik), CV-16 (gsp); (b) CV-12 (Manual 000,
gsp) dan NA palsu CV-11 (Manual 000), keduanya B-1; (c) CR-3 (semua), CR-4/IS-01/CV-07/CV-17/NU-02/CS-02/CS-04/TR-01/GF-12 (Manual 000).

Skor terkoreksi bila B-1 diperbaiki (CV-12 lulus; Manual 000 juga CV-11 NA -> lulus): a_terbit_datum_gsp 55/65 = 84,6 %;
Manual 000 50/67 = 74,6 %. Dengan B-1
diperbaiki dan fiksur B-FIX sah (CR-3 lulus): a_terbit_datum_gsp 56/65 = 86,2 % dengan 4/4 kritis; b_nota_datum_gsp 30/34 = 88,2 %;
a_terbit_datum_kanonik 59/65 = 90,8 % (hipotesis aritmetika dari matriks di atas, bukan run).

## 6. Uji mutasi dan kontrol

Masukan dasar `a_terbit_datum_gsp` (54/65 = 83,0 %, kritis gagal CR-3). Semua mutan dijalankan dengan argumen yang sama
(`--template datum-gsp --language ID --tier TERBIT --produced-by r08 --bfix <mutan> --clash <json baseline>`), kecuali yang disebut.
Perbandingan per aturan: `C:/tmp/dc_s25/scripts/diff.py`.

### 6.1 Mutasi yang diminta

| Mutan | Perubahan (mutate.py) | Skor | Aturan berubah | Hasil |
|---|---|---|---|---|
| m1 | `TERBATAS` dikosongkan di `header4..7.xml` (4 run kanan kepala halaman) | 80,0 % (52/65), kritis gagal CR-1, CR-3 | CR-1 pass -> fail (`run kanan header default seksi interior pertama kosong; klasifikasi tidak ditandai`); IS-02 pass -> fail (`klasifikasi acuan tidak ada`) | turun, gagal kritis baru |
| m2 | Kepala kolom lembar kendali `Uraian` -> `Perubahan` | 81,5 % (53/65) | CS-04 pass -> fail (`revision: [Rev, Tanggal, Perubahan, Oleh] != [Rev, Tanggal, Uraian, Oleh]`) | turun |
| en_ctrl -> en_lembar | Salinan berlabel EN (label pembungkus ID -> EN register 31 §4, `Rp ` -> `IDR `, `MEMENUHI` -> `COMPLIES`), dinilai `--language EN`: 83,5 % (56/67), kritis gagal CR-3 saja, X 0. Lalu `LEMBAR` dikembalikan ke sel 3 register | 80,5 % (54/67), kritis gagal CR-3, CR-4, bentrok X 1 | CR-4 pass -> fail (`token ID (seluruh teks): "LEMBAR" @ word/footer4.xml ...; penanda EN wajib: ... tanpa "SHEET"`); RB-02 pass -> fail (`sel 3 "LEMBAR 1 OF 1" bukan "SHEET <n> OF <N>"`); X-01 pass -> fail (`teks pembungkus dua bahasa: ID "LEMBAR" ... EN "Chapter"`) | turun, gagal kritis + bentrok |
| m4 | `w:pgSz` A4 11906x16838 -> Letter 12240x15840 di 7 seksi | 81,5 % (53/65) | GF-01 pass -> fail (`w:pgSz 12240x15840 (portrait), harapan A4 11906x16838 (+6 temuan lain)`) | turun |

Catatan mutasi EN: register DOCX memakai NBSP (`LEMBAR\u00a0`, `\u00a0DARI\u00a0`, RB-03); percobaan pertama yang mengganti
spasi biasa tidak mengenai register sehingga kedua salinan EN berskor sama. Itu cacat skrip mutasi, bukan skor; diperbaiki dan
diulang (byte footer diverifikasi `SHEET\xa0`, `\xa0OF\xa0`).

Tambahan: DOCX ID asli dinilai sebagai EN (`base_as_en`): 58,2 % (39/67), kritis gagal CR-1, CR-3, CR-4; 17 aturan EN turun
(CV-13, CV-17, CS-02/03/04, RH-01, RB-02, SB-03, IS-01/02, AC6-03, LB-01/02/03/09, CR-1, CR-4).

### 6.2 Kontrol positif dan probe kelas (b)

| Probe | Perubahan | Skor | Aturan berubah | Kesimpulan |
|---|---|---|---|---|
| p_caps | `<w:caps/>` ditambahkan ke run kolofon | 84,6 % (55/65) | CV-16 fail -> pass (`kolofon kiri persis`) | Teks tampak skor menghormati `w:caps`; CV-16 baseline = kelas (a) |
| p_smallcaps | `<w:smallCaps/>` ditambahkan ke run kolofon | 83,0 % (54/65) | tidak ada (CV-16 tetap fail) | Lihat B-2 (laten) |
| p_cond | `IBM Plex Sans Cond"` -> `IBM Plex Sans Condensed"` (document, header, fontTable) | 84,6 % (55/65) | CV-12 fail -> pass | B-1: satu-satunya sebab CV-12 = nama wajah |
| k_short / k_long | Kicker sampul E6 disisipkan sebelum judul (`Kajian Teknis`, caps, sz 15, 6E1420, spacing 30) dengan wajah `IBM Plex Sans Cond` / `IBM Plex Sans Condensed`; `--kicker "KAJIAN TEKNIS"` | 84,8 % (56/66) keduanya | k_short: CV-07 pass, **CV-08 fail** (`run kicker bukan 7,4 pt Cond seal ... fon Condensed`); k_long: CV-07 pass, CV-08 pass | B-1 juga menjatuhkan CV-08 (repro minimal) |
| p_bfix | `--bfix` = salinan dengan paragraf `B-FIX 1.250.000,5 ; Rp 1.385.946.000 ; 25 % ; 0,5` | 84,6 % (55/65), **kritis 4/4** | CR-3 fail -> pass (`konvensi ID terpenuhi di sampel dan B-FIX; harapan B-FIX ... ada`) | Jalur CR-3 lulus bila fiksur sah |
| p_bfix_bad | Sama, tetapi `Rp1.385.946.000` | 83,0 % (54/65) | tidak ada (CR-3 tetap fail) | CR-3 menolak Rp menempel |
| spec S26 | `--spec C:/tmp/dc_s25/spec_s26.json` (ekspor `docTypeTemplateSpecJson()`) | Manual 000 74,2 % (49/66); gsp 83,0 % | Manual 000 NU-03 U -> pass; gsp NU-03 U -> fail (`spec tanpa baris slug datum-gsp`) | Jalur NU-03 bekerja pada data S26 nyata |

### 6.3 Mutasi PDF (clash.py)

PDF `a_terbit_datum_gsp.pdf` diberi teks tambahan di halaman 4 (halaman isi) dengan PyMuPDF (`pdf_mut.py`), lalu
`clash.py --pdf <mutan> --docx in/a_terbit_datum_gsp.docx --no-convert` (geometri dari DOCX, tanpa konversi ulang agar teks sisipan tetap ada).

| Mutan | Sisipan | Exit | Bentrok |
|---|---|---|---|
| mut_overlap | `OVERLAPTEXT` 2 pt dari kata isi `ini` | 1 | `4 overlap [104.4, 158.5, 169.9, 166.7] 'ini menghitung \| OVERLAPTEXT' G-01 'ini' [...] overlaps 'OVERLAPTEXT'` |
| mut_offpage | `OFFPAGEOVERFLOW` mulai x 565 | 1 | `4 out_of_page [565.3, 393.0, 659.8, 402.0] G-02 text leaves the page box` |
| mut_margin | `x` di x 545 | 1 | `4 out_of_margin [545.3, 443.0, 549.8, 452.0] G-03 body text outside the margin box [68.05, 73.70, 538.60, 773.84]` |
| mut_all | ketiganya | 1 | 3 bentrok (`{'overlap': 1, 'out_of_page': 1, 'out_of_margin': 1}`) |

JSON `mut_all` diteruskan ke skor (`--clash C:/tmp/dc_s25/clash/mut_all.json`, `--bfix mut/p_bfix.docx`):
`datum-gsp_ID: FAIL | skor 84.6 % (55/65) | kritis 4/4 | cakupan ? | bentrok 3` dengan alasan `bentrok teks = 3 (X-*: 0, PDF: 3)`.
Jadi bentrok PDF memblokir putusan walau keempat aturan kritis lulus.

## 7. Daftar NA (keluar penyebut) dan tidak berlaku

| Aturan | Masukan | Alasan (evidence skor) | Sah menurut katalog |
|---|---|---|---|
| CV-08 | Manual 000, gsp, kanonik (TERBIT) | `kicker sampul (E6) tidak ada; bentuknya tidak dapat dinilai (CV-07 menilai keberadaannya)` | Ya: tanpa E6 bentuk tidak dapat diukur; keberadaannya sudah dihukum di CV-07 |
| CV-11 | gsp, kanonik (TERBIT) | `baris cakupan tidak ada (unsur 9 bersyarat)` | Ya, bersyarat (`research/32` §16); sampul memang tanpa baris cakupan |
| CV-11 | Manual 000 | sama | **Tidak**: baris cakupan ada (`IBM Plex Sans Cond` sz 15); NA palsu akibat B-1 |
| CS-10 | sama | `pita segel tanpa nomor salinan (salinan induk)` | Ya, bersyarat |
| GF-11 | 4 kasus baseline | `tidak ada gambar isi di seksi interior` | Ya, bersyarat (Manual 000 punya gambar: GF-11 lulus) |
| LB-06, LB-10, LB-11 | TERBIT r08 | `sampel r08: peran tanda tangan / rantai verifikasi bukan label klien MCP`; `catatan revisi dari agen atau sampel r08` | Ya (`research/32` §12); sampel S36 lewat MCP akan menilainya |
| AC6-03, RB-08, TR-04 | semua (ID) | berlaku EN saja | tidak berlaku, bukan NA |
| CV-*, CS-*, SB-*, IS-*, NC-04, RB-07, TR-01/03/08, LB-01/02/06/10/11 | NOTA | tidak berlaku tier NOTA (`research/32` §16) | tidak berlaku |
| NU-03 | semua | UNEXERCISED (dihitung gagal) tanpa `--spec`; bukan NA | tertunda S26/S36 |

Tidak ada NA pada aturan kritis (harness mengubah NA/UNEXERCISED CR-* menjadi FAIL).

## 8. Bug skor kelas (b)

| ID | Keparahan | Lokasi | Gejala | Repro minimal | Perbaikan yang diusulkan (untuk controller) |
|---|---|---|---|---|---|
| B-1 | **Tinggi untuk S36** | `benchmark/datum_conformance/rules/expect_structure_a.ts:118` (`COND_FONT_MARKERS = ["Condensed"]`), dipakai `rules/structure_a.ts:209` (pengenal unsur E9 baris cakupan, dipakai CV-01/CV-11), `:477` (CV-08), `:523` (CV-11), `:545` (CV-12) | Wajah `IBM Plex Sans Cond` (profil Manual 000 / `datum-gsp-preset`, `params/color-type.ts:131`) tidak dianggap Cond di modul `structure_a`, padahal D-602 mengesahkan alias itu untuk CV-12/GF-07 dan `structure_b` sudah menerimanya (`expect_structure_b.ts:144-145` `isCondFont`) | (1) Skor baseline `a_terbit_datum_gsp`: CV-12 FAIL dengan `font=IBM Plex Sans Cond`, sz 12 dalam toleransi. (1b) Skor Manual 000: CV-11 NA `baris cakupan tidak ada` padahal baris cakupan Cond sz 15 ada di sampul (pengenal E9 gagal). (2) `C:/tmp/dc_s25/mut/k_short.docx` vs `k_long.docx` (`kicker.py`, hanya nama wajah berbeda): CV-08 FAIL vs PASS. (3) `p_cond.docx`: CV-12 FAIL -> PASS | Satu sumber penanda Cond: `structure_a` memakai `isCondFont` dari `expect_structure_b.ts` (atau penanda bersama di `lib/`), lalu uji regresi: label/kicker/baris cakupan dengan `IBM Plex Sans Cond` lulus, `IBM Plex Sans` (bukan Cond) tetap gagal. Tanpa perbaikan, setiap templat baru di atas `datum-gsp-preset` gagal palsu di CV-12, dan di CV-08 (kicker kini selalu ada) serta CV-11 bila ada baris cakupan |
| B-2 | Rendah, laten | `lib/docx.ts:416, 587` (teks tampak hanya dari `w:caps`) | `w:smallCaps` tidak dianggap kapital tampak; brief controller menyatakan run ber-smallCaps tampil kapital | `C:/tmp/dc_s25/mut/p_smallcaps.docx`: CV-16 tetap FAIL, `p_caps.docx`: PASS | Perlu putusan: R0 (`research/32` §0.4) hanya menyebut `w:caps`. Tidak terpicu keluaran mesin: `smallCaps` dilarang di kontrak v2 (`contract/schema/v2/forbidden.ts:28`, DF-06). Bila diterima, `effectiveRunProps` membaca `w:smallCaps` untuk teks tampak |

Bukan bug skor (diperiksa, dicatat agar tidak didispatch):
- CV-16 datum-gsp: DOCX tanpa caps (kelas a, §5).
- CR-3 dengan `--bfix` = DOCX baseline: skor benar menolak karena string harapan §10 tidak ada (kelas c).
- CS-02/CS-04 Manual 000: skor setia pada register 31 §4.2; penyimpangan register dari manual sudah diputus (kolom manual masuk cakupan).
  Saran ringan untuk katalog: tandai klausa judul CS-02 sebagai turunan kode, bukan manual.
- GF-12 Manual 000: setia pada katalog ("semua bagian XML"); D-602 meminta dilaporkan apa adanya.

## 9. Proyeksi D-602: penyimpangan (a) yang dapat dihindari lewat parameter templat

Sumber nilai: profil `benchmark/manual000/template.json` (basis `datum-gsp-preset`): `color.wrapper.cream = F6E9E9`,
`type.face.condensed = IBM Plex Sans Cond`, `render.toc.mode = static`, `org.entityName = PT Gemilang Satria Perkasa`.
Lapis bersama S26 saat ini (`prisma/seed-doc-type-templates.ts:32-35`): `doc.typeCode` + `org.entityName` kapital.

| Aturan | Parameter pengendali | Status di S26 sekarang | Proyeksi templat baru |
|---|---|---|---|
| CV-16 | `org.entityName` (`params/page.ts:444`; dipakai `front/texts.ts:323`) | sudah diset `PT GEMILANG SATRIA PERKASA` | **terhindar** |
| CV-07 | kenop slot `cover.kicker.text` | sudah per jenis x bahasa (`seed-doc-type-templates.ts:62-66, 127`) | **terhindar** |
| NU-03 | tabel spec S26 | `datum-standar` PASS dengan `spec_s26.json` | **terhindar** bila S36 memberi `--spec` |
| TR-03, TR-08 | `render.toc.mode` (`params/render.ts:168-171`, enum `field|static`, bawaan registri `field`) | **belum diset** (mewarisi `static` dari preset) | **dapat dihindari**: tambah `"render.toc.mode": "field"` ke lapis bersama; bukti: kanonik (`field`) lulus TR-03/TR-08 dan LB-02 tanpa cadangan |
| SB-02 | `color.wrapper.cream` (`params/color-type.ts:66`), satu-satunya konsumen DOCX = run pita segel (`engine/docx/wrapper/formats.ts:44, 229`) | **belum diset** | **dapat dihindari**: tambah `"color.wrapper.cream": "F4F5F6"` (`manual_id.txt:2573`) |
| CV-12, CV-08, CV-11 | bukan penyimpangan mesin; B-1 | - | **terhindar setelah B-1 diperbaiki** (alternatif tanpa ubah skor: `type.face.condensed = IBM Plex Sans Condensed` + fon tertanam, lebih berisiko) |
| GF-13 | `color.classificationInk` ada (P4C-35) tetapi hanya dibaca HTML (`engine/html/base/params.ts:57`); DOCX memakai `RUNNING_HEAD_RIGHT_RUN`/`REGISTER_VALUE_RUN` INK900 tertulis keras (`header-footer.ts:55, 59`) | - | **tetap** (non-kritis diketahui, F-4) |
| RH-03 | tidak ada; `runningHeadFormat` INK200 sz 5 tertulis keras (`header-footer.ts:73`) | - | **tetap** |
| RB-05 | tidak ada; garis atas register INK900 sz 8 tertulis keras (`header-footer.ts:324`) | - | **tetap** |

Proyeksi skor templat baru (hipotesis aritmetika, belum diukur; berlaku bila sampel MCP, `--bfix` sah, `--spec` S26, B-1 diperbaiki,
NA bersyarat CV-11/CS-10/GF-11):

| Pasangan | Penyebut | Gagal tersisa | Skor bila TOC+cream diset | Bila tidak diset (+SB-02, TR-03, TR-08) |
|---|---|---|---|---|
| T/S ID | 72 - 3 = 69 | RH-03, RB-05, GF-13 | 66/69 = 95,7 % | 63/69 = 91,3 % |
| T/S EN | 74 - 3 = 71 | sama | 68/71 = 95,8 % | 65/71 = 91,5 % |
| NOTA ID/EN | 35/36 - 1 = 34/35 | sama | 31/34 = 91,2 %; 32/35 = 91,4 % | sama (SB/TR-03/08 tidak berlaku NOTA) |

Bila B-1 tidak diperbaiki, T/S kehilangan 2 lagi (CV-08, CV-12): 61/69 = 88,4 % (ID) sebagai kegagalan palsu.

## 10. Kelayakan skor sebagai gerbang

**Layak dengan syarat.** Alasan:
- Sensitif: keempat mutasi yang diminta dan mutasi tambahan menurunkan skor pada aturan yang tepat, dengan bukti lokasi
  (CR-1, IS-02, CS-04, RB-02, CR-4, X-01, GF-01); DOCX ID yang dinilai EN jatuh ke 58,2 %.
- Spesifik: tidak ada kegagalan pada dokumen emas yang tidak bisa dijelaskan; kecuali B-1, setiap FAIL dapat ditelusuri ke
  XML nyata atau ke artefak masukan. Kontrol positif lulus (CV-16 dengan caps, CR-3 dengan B-FIX sah, NU-03 dengan spec S26).
- Bentrok: clash.py 0 bentrok pada 6 PDF emas (termasuk 105 halaman Manual 000, dua cara) dan menangkap G-01, G-02, G-03 pada
  PDF yang dirusak; skor memblokir putusan bila bentrok > 0.
- Uji diri hijau: vitest 199/199, pytest 25/25.

Syarat sebelum S36:
1. Perbaiki B-1 (satu penanda Cond untuk `structure_a` dan `structure_b`) dengan uji regresi.
2. Sediakan fiksur B-FIX per pasangan (`research/32` §10); tanpa itu CR-3 selalu FAIL dan gerbang tidak pernah lulus.
3. Jalankan dengan `--spec` dari `docTypeTemplateSpecJson()` (NU-03) dan `--coverage` dari S33.
4. clash.py selalu dengan `--docx` (D-599 bergantung pada teks punggung DOCX).
5. Putuskan B-2 (opsional, laten).

## 11. Cakupan, CI, keterbatasan

- Cakupan kalibrasi: 76 aturan terukur + 5 detektor X; dijalankan pada 5 dokumen; aturan khusus EN hanya lewat salinan EN hasil
  mutasi `en_ctrl`, bukan render EN asli. Di sana AC6-03, RB-08, SB-03, IS-01, TR-01, TR-04 lulus (`TR-04: nama tier Indonesia
  "TERBIT" di dokumen EN`; `RB-08: tidak ada mulai ulang nomor lembar di 7 seksi`), RB-04 tidak berlaku untuk EN. Bukti cabang
  EN pada render EN asli menunggu S35/S36.
- G-04 (clipped) dan G-06 (overflow) tidak dimutasi di sesi ini; diuji sintetis oleh pytest S24.
- Bukan uji CI baru: kalibrasi bergantung pada berkas di luar repo (`C:/Users/TRIAL/gsp-backups/...`) dan soffice. Tidak ada uji
  flaky teramati; konversi soffice + clash.py berjalan < 1 menit per kasus.
- Skor proyeksi §5 dan §9 adalah hipotesis aritmetika dari matriks terukur, bukan run.

## 12. Cara menjalankan ulang

```
cd C:/Users/TRIAL/gsp-swarm-hq-v2.1
V=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe; T=C:/tmp/dc_s25
# bentrok
$V -I -B benchmark/datum_conformance/clash/clash.py --pdf $T/pdf/a_terbit_datum_gsp.pdf --docx $T/in/a_terbit_datum_gsp.docx --out $T/clash/a_terbit_datum_gsp.json --work-dir $T/work
# skor
npx tsx benchmark/datum_conformance/score.ts --docx $T/in/a_terbit_datum_gsp.docx --template datum-gsp --language ID --tier TERBIT --produced-by r08 --bfix $T/in/a_terbit_datum_gsp.docx --clash $T/clash/a_terbit_datum_gsp.json --out $T/out/a_terbit_datum_gsp
# mutan
$V -I $T/scripts/mutate.py $T/in/a_terbit_datum_gsp.docx $T/mut/m1.docx m1      # m1 m2 en_ctrl en_lembar m4 p_caps p_smallcaps p_cond p_bfix p_bfix_bad
$V -I $T/scripts/kicker.py $T/in/a_terbit_datum_gsp.docx $T/mut/k_short.docx "IBM Plex Sans Cond"
$V -I $T/scripts/pdf_mut.py $T/pdf/a_terbit_datum_gsp.pdf $T/pdf/mut_all.pdf all
$V -I $T/scripts/diff.py $T/out/a_terbit_datum_gsp/datum-gsp_ID.json $T/out_mut/m1/datum-gsp_ID.json
# uji diri
npx vitest run tests/unit/studio/datum-conformance
$V -I -B -m pytest -p no:cacheprovider -q benchmark/datum_conformance/clash/tests
```

## 13. Rekomendasi

1. Dispatch perbaikan B-1 (coder-execution, `tdd`) sebelum S36; tambah uji regresi untuk CV-08, CV-11, CV-12 dengan wajah
   `IBM Plex Sans Cond`.
2. S26: tambah `"render.toc.mode": "field"` dan `"color.wrapper.cream": "F4F5F6"` ke lapis bersama (data saja, D-602, tanpa
   cabang slug); keduanya tidak menyentuh 7 templat lama.
3. S35/S36: buat fiksur B-FIX per pasangan lewat R08 dengan register (D-598 F-5); jangan memakai DOCX sampel sebagai B-FIX.
4. Catat di keputusan bahwa GF-13, RH-03, RB-05 tetap kegagalan non-kritis diketahui (tanpa parameter DOCX), sesuai D-598 F-4/D-602.
5. Putuskan B-2 (smallCaps) atau catat sebagai di luar lingkup karena dilarang kontrak v2.

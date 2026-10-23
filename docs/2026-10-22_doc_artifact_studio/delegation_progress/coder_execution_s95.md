# S95 coder-execution: profil templat Manual 000

- Status: complete. Skill: dry-run-verify-fix (1 siklus, 0 perbaikan).
- Berkas: `benchmark/manual000/template.json` (NEW, 64.485 byte) = `{base:"datum-kanonik", meta, overrides, roleFormats, changeNote}`; slug `datum-manual-000` (D-44); `meta.owner` = ADMINISTRATOR (ADMIN_SESSION).
- Angka: 82 kunci override (katalog 59 + renderer 23), 0 kunci asing; kelas B 78, K 4 (`render.png.dpi`, `table.columnWidthSumMm` 166, `table.numeral.align` right, `table.zebra.minRows` 1000), T 0. roleFormats 70/70 peran (U01-U70), format paragraf/run/sel diambil dari klaster utama tiap peran (research/07 RS/TCP), wajah persis (`IBM Plex Sans Cond`, D-31).
- Klaster 76 (K 36 + KT 40): nilai 65, nilai+celah 7, varian lewat medan eksplisit doc.json 3 (K-10, K-16, KT-37), celah 1 (KT-02); 0 tanpa nilai/celah. Peta lengkap di `meta.clusters`.
- Turunan T tidak ditimpa dan cocok BM: `render.rail.colsTw` [7257,340,1814]; margin bawah 24 mm = 1361 tw (D-33); rentang penuh 9411 tw.
- R-08 (D-43): 5 keluarga / 18 slot, Plex `boldFace: "semibold"`, DejaVu Sans regular+bold; lolos `parseEmbedFamilies` S15.
- R-10 interior: footer `registerBlock` (sel dari doc.json), header `runningHead` dengan format paragraf BM (tab 9411 kanan, line 180 exact, garis bawah sz5 C3CBD1); R-09 pembungkus: header/footer kosong line 40 exact.

## Bukti penjaga (perintah dijalankan dari akar repo)

`npx tsx <scratchpad>/verify.ts`:
- `template.json overrides: 82 kunci (katalog 59, renderer 23); kunci asing: 0`
- `checkOverrideRights ADMIN_SESSION: 0 issue; USER_SESSION: 4 issue (PARAM_CLASS_K_FORBIDDEN)`
- `resolveParams(overrides): 0 issue; resolveParams(base=profil): 0 issue`
- `roleFormats: 70/70 peran; peran asing: 0; ... isu run: 0`
- `klaster: 76 (K 36 + KT 40); tercakup 76; tanpa nilai/celah: 0; rujukan rusak: 0`
- `cek silang lineTw klaster utama vs research/07: 0 beda`

`npx tsx <scratchpad>/fonts_check.ts`: `R-08: 5 keluarga, 18 slot (BM 18 berkas)`.

## Celah (15, satu baris per celah di file_requests.md, semua blocking tidak)

S95-C01 sel kanan pita segel; C02 baris pertama ControlBlock; C03 sel SignatureBlock; C04 warna label tanda rel per tanda; C05 tracking/run kanan kepala halaman; C06 lebar kolom TOC; C07 lebar kolom pita segel/kolofon; C08 kolom tabel bersarang turunan; C09 tata letak blok register footer (= G-08 S93); C10 gaya Header/Footer (= G-07 S93); C11 settings.xml tambahan; C12 styles/tema/numbering/fontTable; C13 vAlign kepala tabel; C14 pemisah nomor seksi (= G-01 S93); C15 IBM Plex Sans ditanam BM walau tak dipakai (perencana S15 hanya menanam yang dipakai). Nilai terukur tiap celah ada di `meta.gaps`.

## Temuan

- Cap terbit BM memakai U+2014; `device.issueStamp.format` tidak ditimpa (sampul explicit, KT-06).
- Kunci `meta`/`changeNote` di template.json di luar bentuk H01 `{base, overrides, roleFormats, sectionPlan}`: S67/S97 perlu mengabaikan kunci tak dikenal. `sectionPlan` tidak diisi (bawaan registri).
- R-06 memuat kunci tambahan (`langEastAsia`, `langBidi`, `rFontsTheme`) yang belum tentu dibaca S14.

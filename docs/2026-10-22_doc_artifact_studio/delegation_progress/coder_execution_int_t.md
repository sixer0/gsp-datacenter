# INT-T coder-execution: IP-38 + sisa INT-Q (D-101, D-105)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix. Klaim: `file_claims.md` prefiks INT-T.

Berkas: ubah `engine/docx/wrapper/xml.ts`, `engine/docx/blocks/props.ts`, `engine/docx/blocks/media.ts`, `engine/bind/index.ts`; baru `engine/bind/asset-bytes.ts`; hapus `engine/docx/figures/asset-bytes.ts`; impor saja: `engine/docx/figures/{media,index}.ts`, `engine/docx/wrapper/media.ts`, `engine/html/blocks/device.ts`, `engine/html/tables/figure.ts` (`figures/figure.ts` tidak mengimpor helper, tidak diubah).

## IP-38
- `wrapper/xml.ts`: escapeXml/attrs/resolveFace/WRAPPER_FACES/rPrXml/borderXml/shadingXml/pPrInner/pPrXml/runOwnProps/facesInXml lokal dihapus -> `package/xml` (PACKAGE_FLAVOR = perilaku lokal lama); run tab/br/field = `hfRunXml`. Sisa khas pembungkus: teks TAB -> `xml:space="preserve"`, sel `vMerge`, opsi baris tabel, `<w:p>` tanpa bentuk ringkas, md-lite.
- `blocks/props.ts`: tidak lagi memakai `el` blok; atribut lewat `attrs` paket, garis = `borderXml`/`sideBordersXml` paket (+insideH/V), arsir = `shadingXml` paket. Sisa ragam badan S16 (urutan rFonts ascii/hAnsi/eastAsia/cs, `w:caps w:val="0"`, lineRule tanpa bawaan, slot framePr) tidak ada di paket -> permintaan.
- Beda teoretis (tidak muncul di benchmark/fixture): escape kini juga membuang U+FFFE/FFFF (wrapper), `'` tidak lagi `&apos;` (props), `w:sz` garis wrapper dibulatkan, `w:space` garis props tidak dibulatkan.

## Sisa INT-Q
- Helper pindah ke `engine/bind/asset-bytes.ts` (isomorfik), diekspor sekali dari barrel `engine/bind`; ekspor ganda di `docx/figures/index.ts` dihapus. Semua pemakai mengimpor dari `../../bind`.
- `blocks/media.ts loadImageAsset`: aset dokumen lewat `docAssetBytes` (assetBytes -> dataBase64); dataBase64 rusak -> ASSET_TYPE_UNSUPPORTED; tanpa byte -> FILE_NOT_FOUND (seperti dulu).

## Bukti
- Benchmark render_cli + `benchmark/manual000/template.json` (docx,html), `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/intt/{before,after}`: sebelum DOCX `f697804e…6d41`; sesudah `6515797f…dd52` karena INT-S mengubah `IBMPlexSansCond-{Regular,Italic}.ttf` + `fonts/{index,plan,relabel}.ts` di tengah sesi (beda hanya `word/fontTable.xml`, `word/fonts/font5.odttf`, `font7.odttf`; daftar wajah/rels fon sama). 98 bagian non-fon identik (115 total), sha256 daftar = `1aa1c02e…a56a` dua sisi; mis. `word/document.xml 784e97e9…7e`, `styles.xml ec0a2149…7cef`, `numbering.xml ca605d64…e249`, `_rels/document.xml.rels e016403e…a03`, `header1 54b6381d…`, `footer1 bc1a9f5a…`.
- HTML benchmark sha256 `54095e22…56e9` sebelum = sesudah.
- 4 fixture kanonik SUCCEEDED; dirender juga dengan `wrapper/xml.ts`+`props.ts` lama: bagian non-fon identik (memo 19, tables 18, serah 33, terbit 39), HTML identik.
- Uji hanya-assetBytes `intt/test_blocks_media.ts`: 9/9 PASS (unit A-E; E2E blok device logo di badan bab: DOCX hanya-assetBytes sha256 = dataBase64 `55a7a2ff…`); kontrol negatif dengan media.ts lama: 3 FAIL.
- `npx tsc --noEmit -p tsconfig.json` exit 0 (repo 0 galat), grep `engine/(docx|html|bind)` 0 baris; `npx eslint <area>` exit 0.

Permintaan (file_requests.md, tidak blocking): `package/xml.ts` tambahan aditif agar sisa pembangun ragam wrapper/props jadi pengikat tipis; `blocks/xml.ts` (S16) sumber escape kedua.
Review direkomendasikan: `engine/docx/{wrapper/xml,blocks/props,blocks/media}.ts`, `engine/bind/asset-bytes.ts`.

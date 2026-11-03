---
task_slug: doc_artifact_studio
row: REVIEW-W4-ENGINE
date: 2026-11-03
agent: senior-code-reviewer
skill: code-review-senior
scope: perubahan mesin IMPL-W4 (ronde 6) di luar scripts/studio/mcp, belum di-commit, HEAD 6a16bbd
status: complete
---

# Review Kode Senior: Perubahan Mesin Ronde 6 (IMPL-W4)

Review baca-saja. Tidak ada berkas produksi yang diubah. Probe dijalankan dari scratchpad sesi (di luar repo), bukan dari salinan repo.

## Ringkasan

Verdict keseluruhan: **APPROVED WITH COMMENTS** (0 High, 5 Medium, 6 Low).

Untuk dokumen TANPA label outline, jalur lama tidak berubah: setiap cabang baru hanya aktif pada nilai yang sebelumnya tidak pernah dibangkitkan mesin v2 (`outline[].label`, kicker `{ text: "" }`, `section.number === ""`). Suite renderer + figur hijau (53 berkas, 846 lulus / 1 lewati), `tsc` exit 0, eslint exit 0, `convert_v2 --check` SAME x3. Kekonsistenan DOCX dan HTML baik, karena satu predikat dipakai bersama (`kickerSuppressed`). Biaya kinerja penanaman fon dapat diabaikan (median 837 ms lawan 814 ms per rasterisasi).

Risiko utamanya ada di tepi. (1) Mode campuran (sebagian bab berlabel) dapat menghasilkan label artefak GANDA tanpa penjaga. Label ganda membuat FigureStore DOCX menimpa PNG figur dan membuat alamat API ambigu. (2) Penjaga "fon tertanam tidak termuat" menolak SVG sah (teks kosong, italic saja, daftar cadangan) dengan kode `BROWSER_UNAVAILABLE` (503, terbaca sementara). (3) Penomoran artefak kini dihitung di empat tempat, dan lint struktur belum mengikuti mode sumber. (4) Fon yang hilang di deployment membuat perbaikan raster gagal diam-diam.

| Domain | Verdict | High | Medium | Low |
|---|---|---|---|---|
| Structure | CAUTION | 0 | 1 | 1 |
| Dependency Impact | CAUTION | 0 | 2 | 2 |
| Duplication | CAUTION | 0 | 1 | 0 |
| Maintainability | CAUTION | 0 | 1 | 2 |
| Reference Integrity | PASS | 0 | 0 | 1 |

## Bukti segar (dijalankan reviewer, 2026-11-03)

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 |
| Lint | `npx eslint <13 berkas src + 2 uji implw4 renderer>` | exit 0 |
| Uji | `npx vitest run tests/unit/studio/renderers tests/unit/studio/figures` | 53 berkas, 846 lulus / 1 lewati, exit 0 |
| Konverter | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME doc.v2.json / template.v2.json / preset, exit 0 |
| Probe tabrakan label (vitest scratch, `composeV2` nyata, fixture `e1`) | outline `[{ key: "1", label: "2" }]`, bab 2 tanpa label | numbering `["Tabel 2.1","Tabel 2.1","Tabel 2.2"]`, DUP `["Tabel 2.1"]`, tanpa galat |
| Probe penolakan fon (`rasterizeSvg` nyata, Chromium) | 8 SVG uji | regular OK; hanya-600 OK; **italic-saja GAGAL**; **daftar `Arial, IBM Plex Sans` GAGAL**; **`<style>` tak terpakai GAGAL**; **`<text>` Mono kosong GAGAL**; **`<text>` Mono spasi GAGAL**; teks di luar viewport OK. Semua kegagalan: `embedded font not loaded: ...`, kode `BROWSER_UNAVAILABLE` |
| Korpus paritas (114 SVG chart/diagram, `parityRenders`) | pindai statis pemicu penolakan | 0 keluarga yang hanya punya teks kosong, 0 italic: generator saat ini belum memicu |
| Kinerja raster (6 pasang bergantian, 128 x 64 mm, 30 teks, 2 keluarga) | tanam lawan tanpa tanam | median 837 ms lawan 814 ms (+3 %); CSS tertanam 340.020 B per halaman |
| Cakupan glif aset fon | fontTools cmap | `IBMPlexMono-Regular.ttf` dan `IBMPlexSansCond-Regular.ttf` 229 titik kode; tanpa U+2264, U+2265, U+2192 |

## Tabel temuan

| # | Severity | Domain | File:Line | Deskripsi | Rekomendasi |
|---|---|---|---|---|---|
| F1 | Medium | Dependency Impact | `src/lib/studio/services/compose/snapshot.ts:318-323,332-334,371-373`; dampak `src/lib/studio/engine/docx/figures/store.ts:88`, `src/lib/studio/engine/docx/figures/figure.ts:110,282`, `src/lib/studio/services/revisions/index.ts:118-123` | Mode campuran tidak dijaga. Label artefak hanya unik bila semua bab berlabel atau tidak ada yang berlabel. Bab berlabel `L` dan bab tanpa label berkunci `L` (atau lampiran berkunci `L`; skema mengizinkan huruf, `^[A-Za-z0-9]{1,8}$`) memakai penghitung terpisah, sehingga keduanya menghasilkan "Tabel L.1". Ini terbukti lewat probe: `["Tabel 2.1","Tabel 2.1","Tabel 2.2"]`, tanpa galat. Akibatnya: (a) FigureStore memakai kunci `artifactLabel` lebih dulu (`figure.ts:110`), `store.ts:88` `map.set` menimpa, lalu `figure.ts:282` mengambil entri pertama, sehingga dua figur memakai PNG yang sama di DOCX (salah satu tampil dengan gambar figur lain); (b) `findBlockRowByLabel` (`revisions/index.ts:118-123`, `findFirst` urut ordinal) memetakan alamat "Gambar L.1" ke blok yang mungkin salah untuk GET/PATCH. Jalur MCP saat ini selalu melabeli semua bab dalam mode sumber (`scripts/studio/mcp/write-client.ts:373-387`) dan tidak memakai slot lampiran, jadi pemicunya hanya API/kontrak v2 langsung. | Tegakkan keunikan label di compose: setelah `emitContentSlot`/lampiran, tolak (`BY_CONSTRUCTION_FAILED`) bila nilai `e.numbering` ganda. Atau validasi `setOutline`/body: `label` tidak boleh sama dengan kunci bab/lampiran tanpa label dalam dokumen. Tambahkan uji campuran dan uji label huruf + lampiran. |
| F2 | Medium | Maintainability | `src/lib/studio/engine/browser/index.ts:265-271` | Penjaga muat fon memeriksa hal yang salah. Yang diperiksa adalah "setiap keluarga tertanam punya FontFace berstatus loaded + `check('12px "F"')`", bukan "teks yang benar-benar dicetak memakai fon tertanam". Chromium hanya memuat wajah yang dipakai untuk membentuk glif, sehingga SVG sah ditolak bila keluarga Plex hanya muncul di `<text>` kosong/spasi, hanya italic, sebagai cadangan di daftar `font-family`, atau di aturan `<style>` yang tak terpakai (semua terbukti lewat probe). Di DOCX, `prepareFigureStore` melempar ulang (`store.ts:89-95`), sehingga SELURUH render DOCX gagal. Korpus 114 SVG saat ini tidak memicunya, tetapi `ChartSvg.text()` tidak menyaring string kosong (`engine/chart/core/svg.ts:239-247`), jadi data dengan label kosong di wajah yang tidak dipakai di tempat lain menjadi pemicu yang masuk akal. | Periksa hanya wajah yang memang diminta. Pilihan: (a) panggil `document.fonts.load('<berat> <gaya> 12px "F"', <teks sampel>)` untuk setiap kombinasi keluarga/berat/gaya yang ada di SVG, lalu tolak bila hasilnya kosong; atau (b) abaikan keluarga yang tidak punya `<text>` bertubuh tak kosong; atau (c) turunkan menjadi peringatan log + metrik, bukan galat. Tambahkan uji untuk teks kosong dan italic. |
| F3 | Medium | Dependency Impact | `src/lib/studio/engine/browser/index.ts:271`; `src/lib/studio/engine/browser/runtime.ts:39-44`; `scripts/studio/mcp/outcome.ts:25-28` | Penolakan fon yang deterministik (bergantung pada isi) dilempar sebagai `StudioBrowserError("RENDER_FAILED")`, yang dipetakan ke `BROWSER_UNAVAILABLE` (503). MCP `isGenuineFailure` memperlakukan >=500 sebagai galat server dan memberi petunjuk "server bermasalah; tunggu lalu coba lagi". Akibatnya agen mengulang render yang pasti gagal lagi, dan operator salah mendiagnosis Chromium mati. | Pakai `StudioEngineError("BY_CONSTRUCTION_FAILED", ...)` (422) untuk penolakan karena isi/aset, atau tambahkan alasan baru di `REASON_CODE` yang dipetakan ke 422. Simpan 503 hanya untuk kegagalan Chromium sungguhan. |
| F4 | Medium | Duplication | `src/lib/studio/engine/browser/raster-fonts.ts:20-53,77-94` lawan `src/lib/studio/engine/html/base/fonts.ts:53,59-73,74-92,180-220` | Modul penanaman `@font-face` base64 kedua. `html/base/fonts.ts` sudah menyediakan klasifikasi berkas per slot, alias Cond/Condensed, cache base64, sumber aset templat lalu manifest S13, dan **verifikasi sha256** dari manifest. `raster-fonts.ts` menulis ulang daftar 16 berkas secara statis, alias sendiri, cache sendiri, tanpa verifikasi sha256, dan tanpa aset templat. Dua sumber kebenaran ini bisa berbeda (mis. bila manifest/aset berganti nama atau berat 700 ditambahkan). | Bangun `rasterFontCss` di atas `fontFiles()` dan pembaca base64 milik `html/base/fonts.ts` (ekspor fungsi yang diperlukan), atau pindahkan inti bersama ke `engine/front`. Daftar wajah raster = `fontFiles(...)` difilter oleh keluarga yang dirujuk SVG. |
| F5 | Medium | Structure | `src/lib/studio/engine/lint/structure/walk.ts:136-138`; `src/lib/studio/engine/lint/structure/checks-d.ts:759-768` | Lint struktur menghitung ulang label artefak dari kunci bab internal (`Tabel ${key}.n`) dan tidak membaca label snapshot. Dalam mode sumber: prosa "lihat Tabel 6.1" (bab sumber 6, kunci internal 5) dilaporkan sebagai rujukan basi STRUCT-XREF (positif palsu), sedangkan "Tabel 5.1" yang tidak ada di sumber diterima (negatif palsu). Label di pesan temuan lint (`checks-a.ts:294,438,506`) juga berbeda dari label tercetak. IMPL-W4 hanya meredam `NUMBERING_MISMATCH` di DOCX dan tidak menyentuh lint. Bukti berasal dari pembacaan kode; tidak ada probe. | Di `walkDoc` (yang sudah menerima `snap` dengan `blocks`), utamakan `artifactLabel` blok snapshot / `snap.numbering[blockId]` dan pakai hitungan kunci hanya sebagai cadangan. Tambahkan uji STRUCT-XREF mode sumber. |
| F6 | Low | Maintainability | `src/lib/studio/engine/browser/raster-fonts.ts:51,77,86-91` | Bila aset fon tidak ada di cwd (deployment tanpa `src/`, cwd berbeda, berkas berganti nama), `base64Of` mengembalikan null, `families` kosong, dan penjaga tidak berjalan. Raster kembali diam-diam ke fon sistem, sehingga bug label terpotong kembali tanpa log. Ini bertentangan dengan klaim laporan bahwa substitusi fon "tidak pernah lagi diam-diam". `null` juga di-cache permanen per proses. `html/base/fonts.ts:59-63` justru melempar `BY_CONSTRUCTION_FAILED` bila manifest tak terbaca. | Log `warn` (sekali per proses) dan/atau tolak bila SVG merujuk keluarga Plex tetapi tidak ada wajah yang ditemukan. Jangan cache `null`. Satukan jalur aset di satu konstanta (`STUDIO_ASSETS_DIR`). |
| F7 | Low | Dependency Impact | `src/lib/studio/engine/browser/raster-fonts.ts:89`; aset `src/lib/studio/assets/fonts/IBMPlex*-*.ttf` | Aset Plex di repo adalah subset Latin (229 titik kode; tanpa ≤ ≥ →). `@font-face` bernama sama menutupi fon sistem bernama sama, sehingga di host yang memasang Plex lengkap, glif ≤/≥/→ di chart kini jatuh ke fon cadangan bawaan Chromium, padahal sebelumnya dicetak Plex. Ini konsisten dengan HTML (yang memakai aset yang sama), tetapi raster tidak punya keluarga glif simbol (DejaVu) di tumpukannya. | Tambahkan DejaVu Sans (sudah ada di aset) sebagai `@font-face` cadangan dengan `unicode-range` simbol (lihat `SYMBOL_RANGES`, `html/base/fonts.ts:51-56`), atau dokumentasikan batasan ini. |
| F8 | Low | Structure | `src/lib/studio/engine/docx/wrapper/pages.ts:432-447`; `src/lib/studio/engine/html/blocks/wrapper.ts:441,446` | Daftar isi mode sumber mencetak label kosong tetapi tetap menyisakan kolom label (tab kiri ~1474/9411 lebar), sehingga judul ("Chapter 6. ...", "6.1 Trust model ...") menjorok dengan celah kosong dan nomor sumber tidak sejajar sebagai kolom. Ini kosmetik, tetapi terlihat di setiap dokumen mode sumber. | Bila label kosong, mulai judul di posisi kolom label (tanpa tab pertama), atau pindahkan nomor sumber terdepan dari judul ke kolom label hanya di TOC. |
| F9 | Low | Dependency Impact | `src/lib/studio/engine/docx/wrapper/toc-refs.ts:230`; `src/lib/studio/engine/html/blocks/text.ts:385`; skema v1 `src/lib/studio/contract/schema/doc.schema.ts:419` | Semantik `section.number === ""` berubah untuk SEMUA dokumen. Dulu TOC DOCX/HTML dan kepala section HTML jatuh ke alamat "C.S"; sekarang dicetak kosong. Skema v1 mengizinkan `number: ""` (tanpa `minLength`). Ini memperbaiki ketidakkonsistenan lama (kepala section DOCX `structure.ts:145` sudah mencetak kosong). Begitu juga kicker `{ text: "" }`: dulu DOCX mencetak paragraf kicker kosong sedangkan HTML mencetak "BAB n"; sekarang keduanya tanpa kicker. Kedua perubahan ini tidak tercatat di laporan sebagai perubahan perilaku dokumen lama. | Catat di decisions sebagai perubahan perilaku yang disengaja (v1 dengan `number: ""`/kicker kosong). Tidak ada artefak repo yang terdampak (grep: 0 kemunculan di `benchmark/`, `tests/`, `src/`). |
| F10 | Low | Maintainability | `src/lib/studio/services/compose/snapshot.ts:371-373`; `src/lib/studio/services/revisions/v2/structure-ops.ts:122-139` | Label terikat ke kunci bab lewat entri outline yang terpisah dari bab. Bila bab dihapus lalu bab baru memakai kunci yang sama, bab baru mewarisi label lama secara diam-diam. Sebaliknya, `setOutline` dari klien yang tidak mengenal `label` (mis. editor UI) menghapus mode sumber diam-diam. `renumberChapters` sudah benar karena memindahkan kunci entri berikut labelnya (`structure-ops.ts:175-176`). | Peringatan compose bila `outline[].label` merujuk kunci tanpa bab (label yatim). Pastikan editor outline mempertahankan medan yang tidak dikenalnya. |
| F11 | Low | Reference Integrity | `src/lib/studio/contract/address.ts:49,58-59`; `src/lib/studio/services/compose/snapshot.ts:332-334` | Label berhuruf ganda ("Tabel FM.1", "Turunan D-FM.1") tidak bisa diurai oleh tata bahasa alamat (`CHAP = [1-9][0-9]*|[A-Z]`), sehingga artefak bagian depan tidak dapat dialamatkan lewat label di route blocks/revisions (400 `ADDRESS_INVALID`). Artefak itu tetap bisa dicapai lewat alamat posisi ("1.1.2") atau pid. Label numerik ("Tabel 6.1") tetap bisa diurai. | Terima sebagai batasan yang terdokumentasi, atau perluas `CHAP` untuk label sumber `[A-Z]{1,4}` dengan uji kebalikan `formatAddress(parseAddress(s)) === s`. Keputusan USER yang tertunda (label "Tabel FM.1") sebaiknya mempertimbangkan ini. |

## Jawaban per butir pemeriksaan

### 1. Dokumen tanpa judul bernomor (regresi)

PASS. Jalur tanpa label identik dengan sebelumnya:
- `snapshot.ts:313,352`: `kicker`/`number` hanya ditulis bila `sourceLabel !== undefined`. `sHead` tanpa properti `number` menghasilkan JSON yang sama.
- `snapshot.ts:318-323`: `lk = key`, penghitung lokal baru per bab, sama dengan HEAD.
- `snapshot.ts:372`: label `""` atau absen diabaikan. Outline tanpa label menghasilkan peta kosong.
- `numbering.ts:103`, `structure.ts:131`, `header-footer.ts:96`, `pages.ts:141`, `html/blocks/text.ts:359`, `html/blocks/wrapper.ts:419`: semuanya bercabang pada `kickerSuppressed` (persis `{ text: "" }` tanpa `runs`), nilai yang tidak pernah dibangkitkan compose v2 sebelum IMPL-W4 dan tidak muncul di fixture repo (grep 0).
- Satu-satunya perubahan untuk dokumen lama adalah `number === ""` dan kicker kosong di dokumen v1 (F9). Perubahan ini memperbaiki ketidakkonsistenan, bukan regresi.
- Suite renderer/figur hijau tanpa perubahan uji lama (git diff `tests/unit/studio/renderers`, `tests/unit/studio/figures` = 0 berkas lama yang diubah). Manifest SVG bersih tidak berubah.

### 2. Peralihan mode (campuran bernomor/tak bernomor)

CAUTION. Peralihan ditentukan per bab (ada `outline[].label` untuk kunci itu), bukan per dokumen. Di mesin, ini terdefinisi: bab berlabel mengikuti penomoran sumber, bab tanpa label mengikuti penomoran mesin. Namun:
- Hasil campuran tidak koheren secara tipografi: "Chapter 6." berdampingan dengan "BAB 3" yang memakai kunci internal.
- Label artefak bisa bertabrakan (F1, terbukti).
- Jalur MCP (`write-client.ts:364-387`) menetapkan mode per dokumen (otomatis bila ada SATU judul/sub-judul bernomor, lalu semua bab diberi label, dengan pewarisan label sebelumnya), sehingga lewat MCP campuran tidak terjadi. Perilaku itu adalah kebijakan klien. Kontrak v2 sendiri tidak menegakkannya.
- Bab berlabel tanpa nomor di judul (mis. "Executive summary" yang mewarisi "FM") tercetak tanpa nomor apa pun, sedangkan tabelnya "Tabel FM.n". Ini konsisten dengan prinsip "judul apa adanya".

### 3. Konsistensi DOCX dan HTML, TOC, kepala halaman, numbering

PASS, dengan catatan F8. Setiap titik cetak "Bab n" sudah tercakup: kicker pembuka bab (DOCX `structure.ts:131`, HTML `text.ts:359`), label bab TOC (DOCX `pages.ts:141` lewat baris 356, HTML `wrapper.ts:419` lewat baris 446), daftar bab pembatas bagian (DOCX `pages.ts:516`, HTML `wrapper.ts:553`), kepala halaman DOCX (`header-footer.ts:96`, label kosong disaring `:112`), nomor section (DOCX `structure.ts:145` yang sudah menghormati `""`, HTML `text.ts:385`, TOC `toc-refs.ts:230`). Jangkar HTML section (`text.ts:399`) dan entri TOC HTML (`wrapper.ts:441`) memakai cadangan alamat yang sama (`number || address`), jadi tautan tetap cocok. `TocNode.address` baru (`toc-refs.ts:176,233`) hanya dipakai HTML dan tidak mengubah DOCX. Peredaman `NUMBERING_MISMATCH` (`numbering.ts:103,121`) per unit cukup sempit. Label tetap diambil dari snapshot (sumber yang dipersistenkan), jadi caption DOCX = caption HTML = `StudioBlock.artifactLabel`. PDF mengikuti HTML. `services/render/naming.ts:99` ("Bab n" untuk nama berkas/alamat) tidak terdampak cetakan.

### 4. Determinisme

PASS. `sourceCounters` hidup per panggilan `composeV2` (`snapshot.ts:298`). Urutan emisi tetap (bab diurutkan `compareChapterKeys`, lalu leading/parts/trailing), jadi penghitung bersama per label deterministik. Fon raster kini berasal dari aset repo dan tidak bergantung pada fon host, sehingga PNG lebih deterministik antar-host daripada sebelumnya. Akibat sampingannya: PNG figur (bukan SVG) berubah byte untuk dokumen lama saat dirender ulang. Ini disengaja, tetapi sha berkas DOCX lama tidak akan cocok lagi dengan render ulang.

### 5. Duplikasi dengan logika penomoran yang ada

CAUTION (F4, F5). Rumus `Tabel C.n`/`Gambar C.n`/`Turunan D-C.n` kini ada di empat tempat: `services/compose/snapshot.ts:332-334` (sumber kebenaran, kini paham label), `engine/docx/assemble/numbering.ts:110-115` (hitung ulang; mismatch diredam), `engine/lint/structure/walk.ts:136-138` (hitung ulang; TIDAK paham label, F5), dan `services/ingest/normalize.ts:276-277` (jalur v1, tidak relevan untuk label). IMPL-W4 tidak menambah salinan baru. Ia menambah satu dimensi (label) yang hanya dipahami salah satunya. `kickerSuppressed` sebagai satu predikat bersama di `engine/front/texts.ts:63-67` adalah pola yang benar.

### 6. Kontrak/skema: `OutlineEntryV2.label`

PASS dengan catatan.
- Tipe (`types/v2/common.ts:82-87`) dan skema (`common.schema.ts:426`) selaras; pola `^[A-Za-z0-9]{1,8}$` menutup injeksi markup/spasi (diuji `implw4-source-numbering`).
- Konverter `benchmark/extract/convert_v2.ts --check` tetap SAME x3. Konverter tidak membangkitkan `outline[].label`, dan adaptor v1 menghapus `kicker` (laporan adapt: `"kicker":23` stripped), jadi jalur benchmark tidak pernah menyentuh mode sumber.
- Dokumen tersimpan: tanpa migrasi DB. Label disimpan di payload JSON slot konten. Dokumen lama tanpa label = perilaku lama. Dokumen yang ditulis dengan label oleh kode baru TIDAK bisa dibaca oleh build lama bila skema lama `additionalProperties: false` (rollback build akan menolak body/outline itu). Catat sebagai risiko rollback. Label yatim dan hilangnya label lewat `setOutline` dibahas di F10.
- Alamat: label numerik bisa diurai, label huruf ganda tidak (F11).

### 7. Penanaman fon

- **Ukuran dan kinerja:** aset adalah subset kecil (24-50 KB per wajah). CSS tertanam 204 KB untuk satu keluarga dan 340 KB untuk dua keluarga (keempat wajah ditanam walau hanya 400 yang dipakai). Base64 di-cache per berkas sepanjang proses (`raster-fonts.ts:49-53`), sedangkan string CSS dirangkai ulang setiap panggilan (murah). Terukur: median 837 ms lawan 814 ms per rasterisasi (+3 %), jadi tidak material. Opsional: tanam hanya berat/gaya yang dirujuk SVG.
- **Perilaku gagal:** terlalu rapuh dalam bentuk sekarang (F2 + F3). Ide "tolak substitusi diam-diam" benar, tetapi predikatnya menghasilkan positif palsu yang terbukti, dan galatnya diklasifikasikan sebagai 503 sementara. Kegagalan satu figur menggagalkan seluruh DOCX. Sebaliknya, ketika aset hilang, penjaga tidak berjalan sama sekali (F6), jadi penjaga gagal di kedua arah: menolak yang sah dan meloloskan yang hilang.
- **Jalur berkas dan bundling Next:** `path.join(process.cwd(), "src/lib/studio/assets/fonts")`. Pola ini sama dengan `html/base/fonts.ts:53` (`STUDIO_ASSETS_DIR` relatif cwd), jadi tidak ada kelas risiko baru. Repo ini dijalankan `next dev`/`next start` dari akar repo. `next.config.ts` tidak memakai `output: "standalone"` dan tidak punya `outputFileTracingIncludes`. Bila kelak di-deploy standalone/serverless, kedua modul fon harus memasukkan `src/lib/studio/assets/**` ke tracing. Untuk raster, kegagalannya diam-diam (F6). Jalur juga mengasumsikan berkas `.ttf` ada (`existsSync`), dan tidak ada `import` statis, jadi bundler tidak akan memasukkannya otomatis.

## Tantangan utama

1. **Mengapa label disimpan di outline, bukan di bab?** Alasannya (bab/section disimpan relasional dan medan baru akan hilang) masuk akal. Namun pilihan ini membuat label bisa yatim atau hilang tanpa jejak (F10), dan mode menjadi properti per bab yang tidak dijaga koherensinya (F1). Bila mode sumber dimaksudkan per dokumen (seperti kebijakan MCP), pertimbangkan satu bendera di payload slot (`numbering: "source"`) plus label per entri, dengan validasi "semua bab berlabel bila mode source".
2. **Penjaga fon: menolak lawan memperingatkan.** Ada dua pilihan. Tolak hanya bila wajah yang benar-benar diminta untuk glif bertubuh tak kosong gagal dimuat, dengan kode 422 yang jujur. Atau peringatkan lewat log job + lint, dan biarkan DOCX tetap jadi. Dalam bentuk sekarang, kerapuhan penolakan lebih besar daripada nilainya.
3. **Raster duplikat lawan modul fon HTML.** Tidak ada alasan teknis untuk dua daftar wajah. Satu sumber dengan verifikasi sha256 juga menutup risiko berkas fon tertukar.
4. **Lint dan DOCX berbeda pendapat tentang label.** Mode sumber baru lengkap bila setiap konsumen label (compose, DOCX, HTML, lint, alamat) membaca sumber yang sama.

## Temuan positif

- Diagnosis butir 4 kuat: reproduksi identik byte terhadap PNG r5b, akar terukur (hash PNG Mono = Times), dan perbaikan dilakukan di lingkungan raster tanpa mengubah SVG/manifest. Pilihan ini benar dibanding mengutak-atik margin chart.
- `kickerSuppressed` sebagai satu predikat bersama mencegah DOCX/HTML berbeda. Implementasinya juga memperbaiki ketidakkonsistenan lama (kicker kosong dan `number: ""`).
- Perubahan mesin kecil dan terlokalisasi (113+/40- di 12 berkas src). Setiap cabang dikomentari dengan rujukan keputusan.
- Disiplin uji merah/hijau di salinan HEAD terdokumentasi. Uji piksel PNG (`implw4-chart-raster`) menangkap regresi fon secara langsung.
- Label snapshot tetap menjadi sumber kebenaran untuk DOCX (`numbering.ts` "snapshot menang"), jadi caption DOCX = HTML = alamat persisten.
- Skema `label` ketat (alfanumerik, 1-8) dan diuji menolak markup.

## Berkas yang benar-benar direview

Diubah (diff dibaca penuh):
- `src/lib/studio/contract/types/v2/common.ts`
- `src/lib/studio/contract/schema/v2/common.schema.ts`
- `src/lib/studio/services/compose/snapshot.ts` (baris 270-420)
- `src/lib/studio/engine/front/texts.ts`
- `src/lib/studio/engine/docx/blocks/structure.ts` (baris 120-155)
- `src/lib/studio/engine/docx/wrapper/pages.ts` (baris 135-145, 335-450, 505-525)
- `src/lib/studio/engine/docx/wrapper/toc-refs.ts`
- `src/lib/studio/engine/docx/package/header-footer.ts` (baris 85-115)
- `src/lib/studio/engine/docx/assemble/numbering.ts` (penuh)
- `src/lib/studio/engine/html/blocks/text.ts` (baris 330-405)
- `src/lib/studio/engine/html/blocks/wrapper.ts` (baris 410-450, 553)
- `src/lib/studio/engine/browser/index.ts` (baris 185-275)
- `src/lib/studio/engine/browser/raster-fonts.ts` (penuh)
- `tests/unit/studio/renderers/implw4-source-numbering.test.ts`, `tests/unit/studio/renderers/implw4-chart-raster.test.ts`

Terdampak (pemanggil/konsumen):
- `src/lib/studio/engine/browser/runtime.ts` (pemetaan kode, `withSandboxedPage`)
- `src/lib/studio/engine/docx/figures/store.ts`, `src/lib/studio/engine/docx/figures/figure.ts`, `src/lib/studio/engine/docx/figures/derivation.ts`
- `src/lib/studio/services/render/artifact.ts`, `src/lib/studio/services/render/figures.ts`
- `src/lib/studio/engine/html/base/fonts.ts`
- `src/lib/studio/engine/lint/structure/walk.ts`, `src/lib/studio/engine/lint/structure/checks-a.ts`, `src/lib/studio/engine/lint/structure/checks-d.ts`
- `src/lib/studio/contract/address.ts`, `src/lib/studio/services/revisions/index.ts`, `src/app/api/studio/documents/[id]/blocks/_lib/http.ts`
- `src/lib/studio/services/revisions/v2/structure-ops.ts`, `src/lib/studio/services/compose/blocks.ts`
- `src/lib/studio/engine/chart/core/svg.ts`, `src/lib/studio/engine/diagram/core/tokens.ts`, `src/lib/studio/engine/symbols/*` (keluarga fon SVG)
- `scripts/studio/mcp/write-client.ts` (baris 345-415, kebijakan label), `scripts/studio/mcp/outcome.ts` (baris 25-28)
- `src/lib/studio/contract/schema/doc.schema.ts` (Section.number v1), `next.config.ts`, `vitest.config.ts`
- `docs/2026-10-22_doc_artifact_studio/delegation_progress/coder_execution_implw4.md`

Skrip probe (scratchpad sesi, di luar repo): `probe_fonts.ts`, `probe_perf.ts`, `probe_empty.ts`, `scan_corpus.ts`, `vt/tests/collide.test.ts`.

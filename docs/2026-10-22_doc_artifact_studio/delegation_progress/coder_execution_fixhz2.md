---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-HZ2
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-326, D-327)
status: complete
---

# FIX-HZ2: gambar aparatus dekoratif (DOCX/HTML) + lint D16 rel bukti menurut templat

Skill yang dipakai: accessibility-review (WCAG 1.1.1, gambar dekoratif) dan dry-run-verify-fix. Skill DATUM HS dibaca saja: RAIL-1008 menetapkan moda rel secara mekanis.
Klaim tercatat di `file_claims.md` (2 baris FIX-HZ2). Semua penulisan memakai berkas `.fixhz2tmp` lalu rename (`os.replace`/`mv`); sisa `.fixhz2tmp` = 0.

## Perubahan

| Berkas | Jenis | Isi |
|---|---|---|
| `src/lib/studio/engine/docx/blocks/media.ts` | ubah | Menambah `DecorativeKind` (`logo`, `datumRule`, `chapterDatumRule`, `ornament`), `decorativeName` (ID/EN), `DECORATIVE_EXT_URI` `{C183D7F6-B498-43B3-948B-1728B52AA6E4}`, `NS_ADEC`, dan `decorativeDocPrXml`. `inlineDrawingRun` kini menulis `<wp:docPr id name="… (dekoratif)" descr=""><a:extLst><a:ext uri=…><adec:decorative val="1"/></a:ext></a:extLst></wp:docPr>`, tidak lagi `name="Picture n"` |
| `src/lib/studio/engine/docx/wrapper/media.ts` | ubah | `inlineImageRunXml` memakai `decorativeDocPrXml` dan menerima `decorative` serta `lang` |
| `src/lib/studio/engine/docx/wrapper/render.ts` | ubah (hanya `imageRun` dan 2 pemanggil) | Logo diberi jenis `logo`, Datum Rule diberi jenis `datumRule`, bahasa diambil dari `meta.language` |
| `src/lib/studio/engine/docx/blocks/primitives.ts` | ubah (hanya `imageDevice`) | Jenis diturunkan dari `device` (logo/datumRule) |
| `src/lib/studio/engine/docx/blocks/structure.ts` | ubah (hanya `datumRuleXml`) | Datum Rule bab diberi jenis `chapterDatumRule` (dari aset maupun hasil bangkitan) |
| `src/lib/studio/engine/html/blocks/device.ts` | ubah | `DECORATIVE_IMG_ATTRS` = ` alt="" role="presentation"` ditulis literal, karena `attr()` membuang nilai kosong. Akibatnya cabang lama `d.text ? "" : "logo"` dulu tidak menulis alt sama sekali. Img logo device kini dekoratif. SVG Datum Rule tidak diubah (sudah `aria-hidden` di dalam div `role="presentation"`) |
| `src/lib/studio/engine/html/blocks/wrapper.ts` | ubah (hanya img logo `coverAuto`) | Nilai lama `alt="logo"` diganti `DECORATIVE_IMG_ATTRS` |
| `src/lib/studio/engine/lint/structure/checks-d.ts` | ubah (hanya `d16`) | Bila `device.evidenceRail.enabled = false`, `evidenceRail` tidak dihitung wajib maupun terlarang, dan detail PASS ditambah "evidenceRail NOT_APPLICABLE: templat mematikan rel bukti (…P4S-07), baris rel dirender moda B…". Bila rel menyala (bawaan), aturan lama tetap ketat. Perangkat lain yang dimatikan templat tetap FAIL (preseden FIX-SERAH tidak berubah) |
| `tests/unit/studio/renderers/fixhz2-decorative-d16.test.ts` | baru | 11 uji, lihat Bukti |
| `tests/unit/studio/renderers/docx-determinism.test.ts` | ubah (hanya jangkar) | Jangkar tabel `a4e6ff62` diganti `aeb65a3d`, ditambah satu baris rantai berisi analisis selisih |

Gambar isi (figur) tidak berubah: masih memakai `engine/docx/figures/alt-text.ts` (FIX-H8). Uji memastikan figur Manual 000 tetap non-dekoratif dengan `descr` terisi.

## Bukti

| Cek | Perintah | Hasil |
|---|---|---|
| Uji baru | `npx vitest run tests/unit/studio/renderers/fixhz2-decorative-d16.test.ts` | 11/11 lulus. DOCX: bentuk docPr (parse, `descr=""`, URI, `val="1"`); E1 lengkap tanpa satu pun "Picture", ketiga nama muncul, id 1..n; nama EN; Manual 000 v1 memuat figur non-dekoratif dan aparatus dekoratif. HTML: logo `alt="" role="presentation"`, tanpa `alt="logo"`. D16 (rencana SERAH diisolasi): menyala + wajib + tanpa rel = FAIL; menyala + rel = PASS; mati + wajib = PASS dengan NOT_APPLICABLE; terlarang + rel: menyala FAIL, mati PASS dengan NOT_APPLICABLE; rencana tanpa rel tidak berubah; sealBand mati tetap FAIL |
| Cek merah D16 | `checks-d.ts` HEAD dipasang sementara, lalu `-t "D16"` | 2 gagal (mati + wajib, terlarang + mati) dan 4 lulus (penjaga ketat). Berkas sudah dipulihkan |
| Unit studio | `npx vitest run tests/unit/studio` | 79 berkas lulus, 2192 lulus, 1 dilewati, 0 gagal |
| tsc | `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| eslint area | `npx eslint <8 berkas src di atas> tests/unit/studio/renderers/fixhz2-decorative-d16.test.ts tests/unit/studio/renderers/docx-determinism.test.ts` | exit 0 |
| Manual 000 v2 resmi, sebelum dan sesudah (pohon kerja, host sama) | `npx tsx benchmark/harness/run/run_benchmark.ts --schema v2 --official --out benchmark/out/fixhz2/{before,after}` | DOCX sebelum `09f42b0f9501aeee…` (sama dengan "sesudah" FIX-H8), sesudah `888f281fe3388a933e1a83d31cb98a90043d5ea9214e165c038bed9bf9f510db`. 115/115 part dengan urutan sama; hanya `word/document.xml` yang berbeda. Isinya identik setelah `wp:docPr` dinetralkan. Dari 52 docPr, 28 berubah, yaitu ke-28 aparatus: "Logo sampul (dekoratif)", "Datum Rule (dekoratif)", "Datum Rule bab (dekoratif)". "Picture n" tersisa 0. 24 docPr figur tidak berubah. Teks `w:t` identik. BM1 PASS di kedua run |
| Lint Manual 000 | `run_summary.json` `lint` dan `ingest.lint` sebelum dibanding sesudah | Identik (172 cek, 19 FAIL, rilis TERBIT FAIL, sama di kedua run). D16 PASS dengan detail persis sama ("6 section non-slot wajib tier TERBIT ada…"). Kasus D16 tidak relevan untuk Manual 000: templatnya tidak mematikan rel, dan TERBIT tidak mewajibkan rel |
| Jangkar fixture tabel | `render_cli.ts --doc tests/parity/fixtures/doc/doc_nota_tables.json --template …template.json --with-canonical-assets --formats docx`, sebelum lewat probe env sementara (sudah dihapus) | Sebelum `a4e6ff62…` (= jangkar lama, jadi selisih hanya akibat baris ini). Sesudah `aeb65a3d…`. Hanya `document.xml` yang berbeda, pada 2 docPr Datum Rule; identik setelah dinetralkan |

Keluaran (gitignore): `benchmark/out/fixhz2/{before,after}`, `tests/parity/out/fixhz2/tables_{before,after}`.
BM2-BM4 NOT-RUN di kedua run karena `pdf:NOT_READY` (render-env: fon per-pengguna belum dimuat di sesi Windows, temuan lingkungan D-326). Perubahan hanya menyentuh atribut/anak `wp:docPr` (tidak tampak, tidak memengaruhi tata letak).

## Persistent Issues

| Isu | Percobaan | Akar | Status | Memblokir? |
|---|---|---|---|---|
| Sha DOCX Manual 000 final belum resmi | 0 | render-env (D-326) | Jalankan ulang run resmi setelah USER keluar lalu masuk lagi ke sesi Windows. Harapan: official3 dengan selisih hanya `wp:docPr` (24 FIX-H8 + 28 FIX-HZ2) | Tidak untuk kode |

## Issues & Decisions

| Langkah | Isu / keputusan | Resolusi |
|---|---|---|
| Nama | Contoh brief "Logo GSP (dekoratif)" tidak bisa diikuti karena tidak ada parameter nama organisasi di templat maupun meta | Nama generik yang bermakna dan bebas merek: "Logo sampul (dekoratif)" (EN "Cover logo (decorative)"). Tanpa em dash |
| Bentuk | Ekstensi hanya ditulis di `wp:docPr`, tidak di `pic:cNvPr` | Sesuai bentuk yang ditulis Word saat "Mark as decorative". `a:extLst` adalah anak sah CT_NonVisualDrawingProps; pembaca yang tidak mendukung mengabaikan ext |
| Lingkup berkas | Jenis dekoratif harus dioper dari pemanggil (`primitives.ts`, `structure.ts`, `wrapper/render.ts`) dan jangkar `docx-determinism.test.ts` | Diklaim spesifik ("HANYA …"); suntingan 1-3 baris per titik |
| D16 | Catatan NOT_APPLICABLE ditulis di detail PASS. Status lint tidak punya NOT_APPLICABLE (E13: PASS/FAIL/NOT_RUN/REPORT), dan NOT_RUN untuk seluruh D16 akan menyembunyikan section lain | Bila D16 punya FAIL lain, catatan tidak tampil di baris FAIL. Ini disengaja, karena temuan lain lebih penting |
| D16 | Pengecualian berlaku hanya untuk rel bukti, tidak untuk perangkat lain yang dimatikan (FIX-SERAH: tetap FAIL) | Mengikuti brief dan HS RAIL-1008 (rel mati = moda B secara mekanis). Asimetri ini dicatat di komentar `d16` |
| HTML | Cacat lama: `attr("alt", "")` tidak menulis apa pun, sehingga logo dengan `d.text` tidak punya alt | Diperbaiki lewat konstanta literal |

## Lanjutan

- Run resmi Manual 000 setelah render-env sehat (sha final + BM2-BM4).
- Review direkomendasikan: `senior-code-reviewer` atas `blocks/media.ts` (decorativeDocPrXml) dan `checks-d.ts` d16.

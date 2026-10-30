# SR-56d: Review kode batch Hermes (D-322..D-331)

- Peninjau: senior-code-reviewer; skill: code-review-senior. Hanya review: kode produksi tidak diubah.
- Tanggal: 2026-10-30. Diff terhadap HEAD `904f992` (34 berkas berubah dan berkas baru di `src/`, `prisma/`, `scripts/`, `tests/`).
- Baris yang dinilai: FIX-H1, FIX-H2, FIX-H4, FIX-H6, FIX-H7, FIX-H8, FIX-HZ1, FIX-HZ2, FIX-HZ3. Catatan yang dibaca: `delegation_progress/coder_execution_{fixh1,fixh2,fixh4,fixh6,fixh7,fixh8,fixhz1,fixhz2,fixhz3}.md` serta keputusan D-320 s.d. D-331.
- Kriteria: kebenaran, regresi, duplikasi, D-139, determinisme, konsistensi galat.

## 1. Bukti segar

| Pemeriksaan | Perintah | Keluaran |
|---|---|---|
| tsc seluruh repo | `npx tsc --noEmit -p .` | exit 0 |
| eslint | `npx eslint src/lib/studio src/app/api/studio src/components/studio scripts/studio prisma/seed-studio.ts` | exit 0 |
| Unit Studio | `npx vitest run tests/unit/studio` | 79 berkas, 2192 lulus, 1 dilewati, 0 gagal |

Tidak diverifikasi di sini:
- jalur job PARTIAL R17 saat runtime (baris pemilik menyatakan hanya teruji unit);
- tampilan UI di peramban bersesi;
- BM2-BM4 dan sha DOCX final. Ketiganya menunggu USER keluar lalu masuk kembali ke sesi Windows (D-326/D-330).

## 2. Vonis

**Keseluruhan: APPROVED WITH COMMENTS.** Total 10 temuan: 0 High, 3 Medium, 7 Low.

Ketiga Medium:
- C1 urutan galat R17 tidak konsisten;
- C2 importer menjatuhkan `details` dry-run;
- C3 D16 melonggarkan syarat rel lewat parameter templat tanpa status terbatas D-98.

Ketiganya tidak memblokir uji ulang Hermes, tetapi C1 dan C2 menyentuh langsung friksi yang ingin ditutup batch ini (C1, C2 Hermes).

| Domain | Vonis | Temuan |
|---|---|---|
| Structure | CAUTION | C1, C4 |
| Dependency Impact | PASS | - |
| Duplication | CAUTION | C2, C5, C6, C7 |
| Maintainability | PASS | C8, C10 |
| Reference Integrity | CAUTION | C3, C9 |

### 2.1 Vonis per modul

| Modul | Baris | Vonis | Temuan |
|---|---|---|---|
| Preflight PDF + penanda sebagian (`services/render/preflight.ts`, `scope.ts`, route R17 + `_lib`, R07, R09) | FIX-H1, FIX-HZ1 | CAUTION | C1, C7 |
| Pelindung timpa PATCH (`services/submit/overwrite.ts`, `pipeline.ts`) | FIX-H2 | PASS dengan catatan | C10 |
| TOC PAGEREF + rel (`docx/wrapper/toc-refs.ts`, `wrapper/pages.ts`, `blocks/{structure,env,rail}.ts`, `html/blocks/{wrapper,classes}.ts`) | FIX-H4 | PASS dengan catatan | C5, C6 |
| Catch-all 404 (`api/studio/[[...notfound]]`, `http/route-not-found.ts`) | FIX-H6 | PASS dengan catatan | C9 |
| Importer Markdown (`services/import/**`, route, CLI) | FIX-H7 | CAUTION | C2 |
| Alt/nama figur + tinggi minimum chart (`docx/figures/alt-text.ts`, figur DOCX/HTML, `chart/core/datum.ts`) | FIX-H8 | PASS dengan catatan | C4, C8 |
| R08 `error-issues.ts`, R07, UI `render-card*`, `completeness-tab` | FIX-HZ1 | PASS dengan catatan | C7 |
| Gambar dekoratif + D16 (`docx/{blocks,wrapper}/media.ts`, `lint/structure/checks-d.ts`) | FIX-HZ2 | CAUTION | C3 |
| Seed Δ framePr (`prisma/seed-studio.ts`) | FIX-HZ3 | PASS | - |

## 3. Temuan

| # | Tingkat | Domain | Berkas:baris | Deskripsi dan bukti | Pemilik | Usulan |
|---|---|---|---|---|---|---|
| C1 | Medium | Structure / konsistensi galat | `src/app/api/studio/documents/[id]/render/_lib/handler.ts:131-135` (preflight di route bila `formats` memuat pdf); `src/lib/studio/services/render/scope.ts:253-256` (preflight layanan SESUDAH `prepareScopeRender`, yang melempar 409 `DOCUMENT_INCOMPLETE` di `:202`, 404 `ADDRESS_NOT_FOUND`, 422 `SLOT_UNKNOWN`); `src/lib/studio/services/revisions/index.ts:572-575` (R07: 409 didahulukan); `render/_lib/service.ts:29-35` (`assertRenderTarget`) | Urutan galat R17 bergantung pada apakah `formats` dikirim eksplisit. **Eksplisit** `["pdf"]` pada dokumen INCOMPLETE (render penuh) atau bab tak ada → 503 `PDF_ENGINE_UNAVAILABLE` dengan saran "kirim tanpa pdf"; agen menuruti saran itu, lalu baru menerima 409/404. **Format bawaan** (pdf dari snapshot) → 409/404 lebih dulu. R07 sengaja mendahulukan 409. Jadi ada tiga urutan untuk satu kelas galat. Gerbang di route juga mubazir: layanan sudah memeriksa format eksplisit (`pureRequestedFormats(plan.formats …)`). `assertRenderTarget` adalah baca DB kedua yang menyalin pencarian `prepareScopeRender` | FIX-H1 / FIX-HZ1 | Hapus preflight route beserta `assertRenderTarget`. Andalkan satu gerbang di `renderScope` sesudah `prepareScopeRender`, sehingga urutannya 404 → 409/422 → 503 di R17 dan R07. Tambah uji: pdf eksplisit pada dokumen INCOMPLETE = 409 |
| C2 | Medium | Duplication / konsistensi galat | `src/app/api/studio/import/markdown/route.ts:105-110` (`issuesFromError` salinan lama) vs `src/app/api/studio/validate/_shared/error-issues.ts:18-28` | Dry-run importer (`?validate=1`) memetakan galat layanan dengan salinan versi SEBELUM FIX-HZ1. Salinan ini membuang `details` (termasuk `overwrittenPids`, `forwardToController`), `checkId`, dan pemetaan `details.issues`. Akibatnya untuk kiriman yang sama, R08 mengembalikan daftar pid yang akan tertimpa, sedangkan dry-run importer hanya mengembalikan pesan. D-328 mengklaim dry-run importer "menangkap SCOPE_CONFLICT FIX-H2", tetapi rincian yang dibutuhkan agen untuk menggabung hilang | FIX-H7 | Impor `issuesFromError` dari `validate/_shared/error-issues.ts`. Lebih baik lagi: pindahkan ke `@/lib/studio/http` agar tidak ada impor lintas route. Kunci dengan uji yang memeriksa `details.overwrittenPids` |
| C3 | Medium | Reference Integrity | `src/lib/studio/engine/lint/structure/checks-d.ts` (blok D16 baru: `railOff`, `railNotApplicable`); `src/lib/studio/services/templates/access.ts:54-57` (`templateRestriction` hanya menghitung `releasedBlockingChecks`); `params/page.ts:227` (P4S-07 kelas B) | Templat yang menyetel `device.evidenceRail.enabled = false` membuat syarat rel D16 untuk tier TERBIT/SERAH menjadi NOT_APPLICABLE. Konten tanpa rel lalu lolos gerbang rilis. Templat itu TIDAK ditandai terbatas D-98, sehingga pemanggil tak tepercaya dapat memakainya. Ini juga tidak konsisten dengan FIX-SERAH (D-302): perangkat lain yang dimatikan templat tetap FAIL (komentar di blok yang sama). Kesimpulan: aturan rilis dilonggarkan lewat parameter, bukan lewat jalur pelepas penegakan yang diawasi | FIX-HZ2 (putusan D-330); diteruskan ke SR-57 | Pilih salah satu dan catat sebagai keputusan: (a) `templateRestriction` menghitung `device.evidenceRail.enabled = false` sebagai cek D16 yang dilepas untuk TERBIT/SERAH (templat menjadi terbatas, hanya ADMIN/harness); atau (b) D16 tetap FAIL seperti perangkat lain dan rel moda B dinilai hadir |
| C4 | Low | Structure | `src/lib/studio/engine/html/tables/figure.ts:31` mengimpor `../../docx/figures/alt-text` | Pola yang sama dengan N1 SR-56b (sudah dipindah ke `engine/tokens/raster-width.ts`, D-287) dan IP-79. Modul "satu sumber DOCX dan HTML" yang baru kembali ditaruh di folder mesin DOCX | FIX-H8 | Pindahkan `alt-text.ts` ke `engine/tokens/` atau `engine/front/`; gabung dengan IP-79 |
| C5 | Low | Duplication | `src/lib/studio/engine/html/blocks/wrapper.ts` (`tocAnchorId`, baru) vs `src/lib/studio/engine/html/blocks/text.ts:301-304` (`anchorId`) | Dua fungsi identik pembentuk id jangkar. Tautan TOC HTML hanya benar selama keduanya sama | FIX-H4 | Satu fungsi yang diekspor dari `text.ts` (atau `classes.ts`) dan dipakai kedua sisi |
| C6 | Low | Duplication | `src/lib/studio/engine/docx/wrapper/toc-refs.ts` (`chapterKeyOf`, urutan `index()`) vs `src/lib/studio/engine/docx/wrapper/pages.ts:112` (`chapterKey`) dan `deriveTocRows` | Kunci bab efektif dan urutan entri turunan dihitung di dua tempat. Pencarian sasaran memakai kunci, jadi beda urutan tidak merusak tautan, tetapi beda rumus kunci akan menghasilkan PAGEREF tanpa sasaran ("Bookmark not defined" di Word) | FIX-H4 | `toc-refs` memakai `chapterKey` pembungkus (ekspor), atau `deriveTocRows` yang memberi nama penanda |
| C7 | Low | Duplication | `src/lib/studio/services/render/preflight.ts` (`CAUSE_RULES[].message`) vs `src/components/studio/document-viewer/render-card-outcome.ts` (`CAUSE_TEXT`) | Dua tabel teks awam untuk kode penyebab yang sama: satu untuk agen di `details.causes[].message`, satu untuk UI. Alasan UI tidak memakai teks server memang tercatat (istilah teknis), tetapi kode penyebab baru di server akan jatuh ke `CAUSE_FALLBACK` tanpa terdeteksi | FIX-HZ1 | Ekspor daftar `PdfNotReadyCauseCode` dari kontrak dan buat `CAUSE_TEXT` bertipe `Record<PdfNotReadyCauseCode, string>`, sehingga tsc menolak kode yang tidak dipetakan |
| C8 | Low | Maintainability | `src/lib/studio/engine/chart/core/datum.ts` (`datumHeightMm`: `n * 7.2 + 6` literal, padahal `DC_BAR_PITCH_MM`/`DC_BAR_PAD_MM` baru dideklarasikan; `BAR_MIN_BODY_MM` menyalin `PANEL_DEFAULT_PLOT_MM`) | Konstanta geometri ditulis ulang di baris yang sama. Kesamaan dengan panel hanya dijaga uji | FIX-H8 | Pakai konstanta yang sudah dideklarasikan; pindahkan `PANEL_DEFAULT_PLOT_MM` ke modul tanpa siklus impor dan impor dari sana |
| C9 | Low | Reference Integrity | `src/lib/studio/http/route-not-found.ts` (header: kode `ROUTE_NOT_FOUND` sengaja di luar enum `StudioErrorCode`; aturan `/documents/{id}/renders…` memberi contoh `"formats": ["DOCX","PDF","HTML"]`); `src/app/api/studio/[[...notfound]]/route.ts` (`HEAD` mengembalikan badan JSON) | Kontrak galat §12 menyatakan `code: <StudioErrorCode>`, tetapi 404 ini memakai kode di luar enum, sehingga klien bertipe tidak mengenalnya. Contoh format berhuruf besar berbeda dengan panduan (huruf kecil); tetap diterima karena parser tidak peka huruf. Respons HEAD semestinya tanpa badan | FIX-H6; DOC-3 | Tambah `ROUTE_NOT_FOUND` ke enum kontrak + `STUDIO_ERROR_HTTP` (404), dokumentasikan di DOC-3, samakan contoh ke huruf kecil, dan buang badan pada HEAD |
| C10 | Low | Maintainability | `src/lib/studio/services/submit/overwrite.ts` (`findPatchedOverwrites`: `studioRevision.findMany` seluruh revisi dokumen tanpa batas, di dalam kunci dokumen) | Setiap kiriman bab/slot ke dokumen yang ada membaca semua revisi. Biaya ini tumbuh linear dengan riwayat dan memperpanjang waktu kunci. Saat ini aman (dokumen uji ≤ 11 revisi) | FIX-H2 | Batasi ke revisi > min(acuan lingkup), atau simpan indeks suntingan pid. Catat sebagai pantauan SR-54 |

## 4. Diperiksa dan diterima (tanpa temuan)

- **FIX-H1:** preflight dijalankan sebelum antrean dan job (`scope.ts:253-256`; R07 `revisions/index.ts:572-575`); `jobCreated:false` jujur. Penyebab teknis dikelompokkan ke pesan awam tanpa path server (`preflight.ts` `layCausesOf`). `failedFormats` tidak menghitung SVG/PNG tanpa berkas pada render dokumen. R09 tetap 201 dengan alasan tercatat. Artefak tidak punya format PDF (`artifact.ts:97-102`), jadi tidak perlu gerbang di sana.
- **FIX-H2:** aturan pid berbasis tanda keadaan (isi, posisi, keberadaan). Mencakup pid yang dihapus sunting dan `renumberChapters`. Kiriman identik tetap `unchanged`; kiriman ke bab lain tidak tersentuh. Cek berjalan di dalam kunci dokumen. `forwardToController` awam dan dapat ditindaklanjuti. Sisa `setOutline`/`reorder` tercatat IP-101.
- **FIX-H4:** id penanda deterministik `_StToc_nnn` dengan basis 9000; tidak ada `bookmarkStart` lain di mesin (`grep` = 0). TOC dengan entri eksplisit (Manual 000) tidak berubah. Tab TOC mode medan diperbaiki (`pages.ts` `fieldTocXml`). DOCX menghormati `device.evidenceRail.enabled=false` setara HTML dan mencatatnya di log.
- **FIX-H6:** route statis dan dinamis tetap didahulukan. 401 tetap ada lewat `requireSession`. Id dari path hanya disalin ke petunjuk bila cocok `^[A-Za-z0-9_-]{1,64}$`. Path dipotong 200 karakter di log dan badan.
- **FIX-H7:** konten-saja. Nomor tampilan, perataan kolom, HTML bergaya, dan placeholder dibuang lalu dilaporkan. `role: "subheading"` sah (`contract/enums.ts:388`). Tidak ada sumber nondeterministik (`grep Math.random|Date|randomUUID` di `services/import/` = 0). Kedalaman inline dibatasi (`inline.ts:260-262`). Label bukti yang tidak dikenal TIDAK ditebak (`UNMAPPED_MARKER`).
- **FIX-H8:** `name`/`title`/`descr` di-escape lewat `attrs()` (`package/xml.ts:128-135`). Alt HTML lewat `escText`. Tinggi minimum hanya untuk n ≤ 3; n ≥ 4 tetap rumus DC.
- **FIX-HZ2:** gambar aparatus diberi `descr=""` + `adec:decorative`, nama bermakna per bahasa. Figur isi tetap memakai alt FIX-H8.
- **FIX-HZ3:** Δ `render.rail.renderer` diberi alasan di penjaga seed. Kelas T `render.rail.colsTw` tidak dijadikan Δ. Manual 000 tidak disentuh.
- **D-139:** tidak ada medan tampilan baru di kontrak agen. `keyRowOnPage`, perender rel, dan tinggi chart tetap keputusan mesin/templat.

## 5. Tantangan

1. **C3 adalah keputusan kebijakan, bukan cacat kode.** Melonggarkan gerbang rilis lewat parameter templat semestinya melewati mekanisme D-98 (templat terbatas), seperti pelepas penegakan lain. Butuh putusan controller atau USER dan penilaian SR-57.
2. **C1:** "404 sebelum 503" diperbaiki dengan menambah baca DB di route, padahal akar masalahnya gerbang ganda. Menghapus gerbang route menyelesaikan 404, 409, dan 422 sekaligus.

## 6. Temuan positif

- Friksi C2 Hermes (timpa diam-diam) ditutup dengan aturan yang teliti dan berdaftar pid, tanpa mengubah `merge.ts`.
- Preflight PDF menolak sebelum job dibuat dengan alasan awam serta `suggestedFormats` siap pakai. UI menawarkan "Buat tanpa PDF".
- Importer linear dan deterministik, dan CLI menghasilkan keluaran yang sama dengan endpoint.
- Seluruh suite unit Studio hijau; tsc dan eslint bersih.

## 7. Berkas yang dibaca

- `services/render/{preflight.ts, scope.ts (diff + :190-262), index.ts (diff), artifact.ts:95-135}`; `app/api/studio/documents/[id]/render/{route.ts, _lib/handler.ts, _lib/service.ts, _lib/request.ts (format)}`; `app/api/studio/documents/[id]/revisions/route.ts` (diff); `services/revisions/index.ts` (diff); `app/api/studio/artifacts/route.ts` (diff).
- `services/submit/{overwrite.ts, pipeline.ts (diff), index.ts (diff)}`.
- `engine/docx/wrapper/{toc-refs.ts, pages.ts (diff + fieldTocXml)}`; `engine/docx/blocks/{rail.ts, env.ts, structure.ts}` (diff); `engine/html/blocks/{wrapper.ts, classes.ts, device.ts}` (diff), `text.ts:301-304`.
- `app/api/studio/[[...notfound]]/route.ts`; `http/route-not-found.ts`.
- `services/import/{markdown.ts:1-80, types.ts, validate.ts}`, `inline.ts` (batas kedalaman); `app/api/studio/import/markdown/route.ts`; `scripts/studio/md2chapter.ts` (opsi dan keluaran).
- `engine/docx/figures/{alt-text.ts:1-90, ooxml.ts (diff), figure.ts:400-410}`; `engine/html/tables/figure.ts` (alt); `engine/chart/core/datum.ts` (diff).
- `app/api/studio/validate/{_shared/error-issues.ts, route.ts (diff)}`; `components/studio/document-viewer/{render-card-outcome.ts, completeness-tab.tsx (diff)}`.
- `engine/docx/{blocks,wrapper}/media.ts` (diff); `engine/lint/structure/checks-d.ts` (diff); `services/templates/access.ts:35-58`; `params/page.ts:227`; `registry/essentials.ts:285-296`.
- `prisma/seed-studio.ts` (diff); `engine/docx/package/xml.ts:128-135`.

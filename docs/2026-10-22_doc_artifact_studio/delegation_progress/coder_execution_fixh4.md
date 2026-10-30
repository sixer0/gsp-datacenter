---
task_id: FIX-H4
task_slug: doc_artifact_studio
row: FIX-H4 (D-321/D-322 H4; uji Hermes C4)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-322)
status: needs-review
---

# Implementation Report: FIX-H4 rel chip rev B + daftar isi bernomor halaman

## Ringkasan

- **Rel (C4a) — akar masalahnya ada di data templat, bukan di mesin.** Templat DEV `datum-gsp` (versi `cmvk6ohjo001wv10o2s1n2hzs`) menyetel `render.rail.renderer = "table3col"`. Nilai ini warisan profil Manual 000 (`benchmark/manual000/template.json`, BM.docx T013). Akibatnya mesin menulis rel sebagai tabel 1x3, sehingga `framePr` = 0 di DOCX. Itulah yang dilihat Hermes. Rel sebenarnya tidak inline: rel ada di kolom ketiga tabel. Bukti: `rail_test.docx` Hermes memuat `w:gridCol 7257/340/1814` dengan "■ TERUKUR" di sel ketiga. Perender `framePr` di mesin sudah sesuai HS rev B, dan kini dikunci uji: bentuk kanonis `RAIL_FRAMEPR_POST`, lebar/posisi dari token grid (Letter terbukti), inang `ind right` 2154, chip sesudah inang, nol `w:anchorH`.
- **Perbaikan mesin di area ini:** DOCX kini menghormati `device.evidenceRail.enabled = false`. Rel jatuh ke moda B dengan bentang penuh, sama dengan HTML (`buildHtmlShell`). Baris rel tetap tertulis dan log `warn` tercatat. Sebelumnya DOCX mengabaikan kenop ini, berbeda dengan HTML.
- **TOC (C4b):** setiap entri TOC turunan kini membawa medan `PAGEREF _StToc_nnn \h` yang menunjuk penanda di judul bab, bagian, atau lampiran. Ini berlaku di mode statis (kolom halaman) maupun mode medan (bersarang di hasil cache `TOC \o "1-2" \h \z \u`). PDF soffice mode statis memuat nomor halaman nyata (4/7/8/10, cocok dengan halaman judul). Pada HTML, entri turunan menjadi tautan jangkar internal ke `st-ch-*`, `st-part-*`, dan `st-app-*`.
- **Manual 000:** tidak memakai TOC turunan maupun rel `framePr`. DOCX v1 byte-identik `53485ebc…`. DOCX v2 resmi byte-identik dengan baseline HEAD di lingkungan ini (`091fe912…` = `091fe912…`). Lihat Persistent Issues untuk `952f65d6…`.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Diagnosis C4 dari artefak Hermes + DB DEV (baca-saja) | complete | `rail_test.docx`: framePr 0, tabel 1x3; resolvedParams templat: `render.rail.renderer "table3col"`, `render.rail.colsTw [7257,340,1814]`, `layout.railMode "A"`, `render.toc.mode "static"`; snapshot rev 11 memuat `rail:[{mark TERUKUR},{source "Register baris P-40…"}]` |
| 2 | Bandingkan perender framePr dengan HS rev B | complete | `datum_docx.rail_host/rail_chip`, `RAIL_FRAMEPR_POST` (SKILL.md RAIL-1008, v2.3.1): bentuk byte, x = text+gutter, w = rail, inang ind right, chip sesudah inang = sama |
| 3 | DOCX: `device.evidenceRail.enabled=false` jadi moda B + log | complete | env.ts `rail()`, rail.ts `withRail` |
| 4 | DOCX: sasaran TOC (penanda) + PAGEREF statis/medan | complete | toc-refs.ts baru; pages.ts; structure.ts |
| 5 | HTML: tautan jangkar TOC + id pembatas bagian | complete | html/blocks/wrapper.ts, classes.ts |
| 6 | Uji unit + red check di HEAD bersih | complete | 10 uji; di HEAD: 4 gagal (perilaku baru), 6 lulus (penjaga regresi framePr/table3col) |
| 7 | Manual 000 byte-identik (worktree HEAD bersih ± berkas FIX-H4 saja) | complete | lihat Verifikasi |
| 8 | PDF soffice fixture | complete (statis) / batas LO (medan) | lihat Verifikasi |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/engine/docx/wrapper/toc-refs.ts | add | Indeks sasaran TOC turunan (urut C14), penanda `_StToc_nnn` (id 9000+n), `bookmarkWrap/bookmarkParagraph`, `pageRefRunsXml` (cache kosong; tanpa angka karangan). Aktif hanya bila ada blok `toc` dengan entri turunan |
| src/lib/studio/engine/docx/wrapper/pages.ts | modify | `deriveTocRows` (entri + sasaran); kolom halaman statis = PAGEREF bila tanpa literal; TOC medan: PAGEREF bersarang + tab kiri kolom label + tab kanan halaman (dulu satu tab kanan: judul terdorong ke kanan); penanda pada judul bagian dan pembuka lampiran; peringatan statis hanya bila entri tanpa sasaran |
| src/lib/studio/engine/docx/blocks/structure.ts | modify | `renderChapter`: penanda pada paragraf judul bab (cocok via blockId, cadangan kunci) |
| src/lib/studio/engine/docx/blocks/env.ts | modify | `rail()`: P4S-07 dimatikan = moda B, colsTw bentang penuh (paritas HTML) |
| src/lib/studio/engine/docx/blocks/rail.ts | modify | `withRail` moda B karena rel dimatikan = log warn (perilaku jelas, konten kekal) |
| src/lib/studio/engine/html/blocks/wrapper.ts | modify | Entri TOC turunan jadi `<a class="st-toc-link" href="#…">`; `unit()` menerima id; pembatas bagian `id="st-part-<id>"` |
| src/lib/studio/engine/html/blocks/classes.ts | modify | Kelas `st-toc-link` + CSS `color:inherit;text-decoration:none` |
| tests/unit/studio/renderers/fixh4-rail-toc.test.ts | add | 10 uji (5 rel, 5 TOC termasuk HTML) |
| docs/…/delegation_progress/file_claims.md | modify (append) | Klaim FIX-H4 |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit baru | `npx vitest run tests/unit/studio/renderers/fixh4-rail-toc.test.ts` | 10/10 lulus | Di HEAD bersih: 4 gagal / 6 lulus (red check) |
| Unit studio | `npx vitest run tests/unit/studio` | 77 berkas lulus; 2164 lulus, 1 skip, 0 gagal | Termasuk berkas baris paralel lain yang ada di pohon kerja |
| Typecheck | `npx tsc --noEmit -p .` | exit 0, 0 baris | |
| Lint area | `npx eslint src/lib/studio/engine/docx/{blocks,wrapper,package} src/lib/studio/engine/html/blocks tests/unit/studio/renderers/fixh4-rail-toc.test.ts` | exit 0, 0 baris | |
| Manual 000 v1 | `render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats docx,html` (worktree HEAD; lalu HEAD + 7 berkas FIX-H4) | DOCX `53485ebc1eddd145` = `53485ebc1eddd145` | HTML berubah 129 byte: 1 aturan CSS `st-toc-link` + id `st-part-*` (`8703aceb…` jadi `e03cf5b0…`) |
| Manual 000 v2 resmi | `run_benchmark.ts --schema v2 --official` (worktree HEAD vs HEAD + FIX-H4) | DOCX `091fe912f37870ae…` = `091fe912f37870ae…`; BM1 PASS keduanya | pdf NOT_READY (render-env) sehingga BM2-BM4 NOT-RUN di kedua run |
| PDF fixture | soffice 24.2.3.2 `--convert-to pdf` atas `tests/parity/out/fixh4/fixture/fixh4_{static,field}.docx` | statis: TOC "4/7/8/10"; judul ada di hlm 4/7/8/10 | fon fallback (render-env not ready), angka halaman tetap sah untuk berkas ini |

## Verification
- `w:framePr` di DOCX (renderer framePr): `<w:framePr w:w="1814" w:wrap="none" w:hAnchor="margin" w:x="7597"/>` ×2 = jumlah baris rel (G-RAIL-1 sisi mesin); Letter: `w = mmToTw(32)`, `x = mmToTw(133.9)+mmToTw(6)` (bukan 7597).
- Chip di margin pada PDF (pymupdf, `fixh4_static.pdf` hlm 4): "TERUKUR" x0 = 160.9 mm, "REGISTER P-40" x0 = 158.0 mm = margin kiri 24 + 134 mm; inang pada y 54.3 mm, chip pada y 61.9–64.8 mm (sesudah inang, sesuai urutan HS).
- TOC statis: `PAGEREF _StToc_001.._004 \h` urut bab 1, Bagian I, bab 2, Lampiran A; penanda tunggal per judul sasaran; nama sah `[A-Za-z_][A-Za-z0-9_]{0,39}`; XML lolos `parseXml`.
- Entri eksplisit berhalaman literal: 0 penanda, 0 PAGEREF (pola Manual 000); tanpa TOC: 0 penanda.
- HTML: `href` = `#st-ch-1`, `#st-part-P1`, `#st-ch-2`, `#st-app-A`; semua id target ada; tidak ada href selain `#`/`data:` (aman untuk sanitizer standalone `isAllowedUrl`).

## Pilihan desain TOC (dijelaskan)
- Mesin tidak punya tata letak halaman, jadi nomor tidak dihitung dan tidak dikarang. PAGEREF dipilih karena LibreOffice mengevaluasi rujukan silang halaman saat tata letak. Dengan begitu jalur PDF soffice (`--convert-to pdf` polos, `engine/soffice/service.ts:204-216`) langsung memuat nomor halaman tanpa makro. Word memperbarui medan saat dibuka (`render.docx.updateFieldsOnOpen`, R-03, bawaan true).
- Mode medan: LibreOffice mengimpor medan TOC sebagai indeks dan meratakan isi cache-nya. PAGEREF bersarang menjadi kosong. Bukti: `--convert-to fodt` menghasilkan `<text:index-body>` dengan `<text:tab/>` kosong. Jadi PDF soffice mode medan TIDAK memuat nomor halaman. Word tetap benar setelah update. `datum-gsp` dan Manual 000 memakai mode statis, sehingga jalur Hermes tidak terkena.
- HTML tidak berhalaman tetap, sehingga nomor halaman tidak relevan. Entri dijadikan tautan jangkar dan kolom halaman dibiarkan kosong.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Templat `datum-gsp` (DB DEV + `prisma/seed-studio.ts` turunan profil benchmark) memilih `render.rail.renderer = "table3col"`, sehingga dokumen Hermes tetap `framePr` = 0 walau mesin benar | 0 (di luar area) | Data templat warisan Manual 000 (BM.docx T013); HS rev B menuntut framePr (G-RAIL-1) | needs-review: perlu keputusan + pemilik seed/templat | Ya untuk C4 di DEV |
| PDF soffice mode TOC `field` tanpa nomor halaman | 1 (fodt diperiksa) | LibreOffice meratakan cache indeks TOC | Tercatat; opsi: makro update indeks di `engine/soffice` (pemilik lain) atau templat mode statis | Tidak (datum-gsp/M000 statis) |
| Lint D16 menghitung `evidenceRail` hadir dari konten walau templat mematikan rel (`engine/lint/structure/checks-d.ts:472-473`) | 0 (di luar area) | Kunci hadir diambil dari konten, bukan dari yang dirender | Serahkan ke pemilik lint: bila rel wajib per tier dan dimatikan templat, laporkan FAIL | Tidak |
| Hash v2 resmi `952f65d6…` tidak terulang di lingkungan ini bahkan di HEAD bersih (`091fe912…`) | 1 | Lingkungan: render-env not ready (fon sesi), run INCOMPLETE; bukan akibat FIX-H4 (HEAD = HEAD+FIX-H4) | Tercatat | Tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | Rel `table3col` adalah pilihan templat (D-139: keluaran milik templat), bukan cacat mesin | Mesin tidak diubah untuk mengabaikan parameter. Diusulkan: versi templat `datum-gsp` baru dengan `render.rail.renderer: "framePr"` (Manual 000 tetap `table3col`). Keputusan ada pada controller/USER |
| 4 | Penanda hanya ditulis bila TOC turunan ada | Menjaga Manual 000 (entri eksplisit) tetap byte-identik; render lingkup bab tetap deterministik |
| 4 | Cache PAGEREF kosong | Nomor tidak diketahui mesin (Garis Merah: tanpa angka karangan) |
| 4 | Tab TOC medan: tambah tab kiri kolom label | Tanpa tab kiri, nomor halaman jatuh ke baris berikut. Fixture v1 `doc_terbit_report` (TOC medan turunan) dan `doc_serah_handover` (TOC statis turunan) berubah DOCX (penanda + PAGEREF; terbit juga tab) |
| 3 | Rel dimatikan = moda B + warn | Paritas HTML; konten tidak hilang diam-diam |
| - | Penulisan atomik | Sunting via skrip temp + rename; dua sunting kecil memakai alat Edit (satu tulis utuh) |

## Next Steps
- Controller/USER: putuskan perender rel `datum-gsp`. Rekomendasi: `framePr` (HS rev B), lalu tugaskan pemilik seed/templat untuk membuat versi baru di DB DEV.
- DOC-3: dokumentasikan medan `rail` (moda A, perender ditentukan templat) dan TOC bernomor (PAGEREF; mode statis untuk PDF soffice).
- Review direkomendasikan: `senior-code-reviewer` atas 7 berkas di atas (lingkup: toc-refs, pages.ts TOC, rail moda B).

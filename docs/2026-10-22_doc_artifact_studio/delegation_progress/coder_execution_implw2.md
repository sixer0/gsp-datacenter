---
task_id: IMPL-W2
task_slug: doc_artifact_studio
row: IMPL-W2 (jalur dokumen klien toolset write + perbaikan review 13)
date: 2026-11-03
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-521, D-522, D-527, D-529); verification/13_write_tools_security_review.md
status: complete
---

# Implementation Report: IMPL-W2 jalur dokumen klien (`studio_write` + `template`, `studio_edit` klien) dan perbaikan keamanan review 13

Laporan ini ditulis bertahap. Jalur laporan kerja (IMPL-W) dilaporkan di `coder_execution_implw.md`.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Pelajari kontrak klien: slot DATUM (`studio_template_get datum-gsp`), `CoverPayloadV2.control`, `ControlSheetPayloadV2`, `ChapterV2`/`TableV2`/`ChartV2`, penomoran `Tabel/Gambar ${key}.n` (`services/compose/snapshot.ts:320-322`), registri grafik | done | nomor tampilan lewat blok kendali sampul eksplisit, bukan `DocMetaV2.docNumber` |
| 2 | `write-client.ts` (builder murni: meta -> DocMetaV2 + slot depan; bagian -> ChapterV2; tabel/grafik berketerangan + bersumber; pilih kode grafik) | done | |
| 3 | `write-client-run.ts` (`resolveTemplate` latest, `writeClient`, `finishDoc` render docx + sha, `editClient`) | done | |
| 4 | `write-client-edit.ts` (satuan sunting JSON, salinan meta depan, `{figure, chart}` -> R16) | done | |
| 5 | Probe DEV pertama: dokumen INCOMPLETE karena kunci bab tidak berurutan (1, 2, 6) | fixed | `setOutline` ke kunci yang ditulis bila tidak berurutan dari 1 |
| 6 | Probe DEV kedua: `BY_CONSTRUCTION_FAILED` DATUM-09 di tengah tulis (dokumen setengah jadi) | fixed | `TABLE_UNIT_MISSING` lokal + dry-run R08 semua slot/bab sebelum R04 (`CONTENT_INVALID`, 0 tulis) |
| 7 | Perbaikan review 13 (D-529): M-1, L-1..L-4, I-1, I-4, I-5 (L-5 dokumentasi) | done | lihat bagian Perbaikan keamanan |
| 8 | Uji `implw2-client.test.ts` (20), `implw2-security.test.ts` (15) | done | |
| 9 | Asap DEV dokumen klien + ulang asap laporan kerja; periksa DOCX | done | |
| 10 | docs/STUDIO-MCP.md, ukuran toolset | done | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| scripts/studio/mcp/write-client.ts | add | Meta alias -> kanonik (`title`, `author` wajib: `META_MISSING`), `DocMetaV2` tanpa `docNumber`, slot `cover` (blok kendali dengan nomor tampilan) / `controlSheet` (judul + riwayat + rantai verifikasi) / `signatureBlock`, kunci bab dari judul, `ChapterV2` (intro + section dari `{subheading}`), `tableBlock` (caption/sumber selalu ada, kolom numeral, `TABLE_UNIT_MISSING`), `chartCodeOf` + `chartBlock` |
| scripts/studio/mcp/write-client-run.ts | add | `resolveTemplate("latest")`, `writeClient` (pemilik F-2, penulis terakhir, dry-run R08, R04, R14 setMeta/setOutline, R13, R12, basis = revisi dibaca), `finishDoc` (R15, R17 docx, R10 HEAD verifikasi), `editClient` (dry-run R08, R14/R13/R12/R16) |
| scripts/studio/mcp/write-client-edit.ts | add | Satuan sunting JSON dokumen klien, `locateClient` (+ kelompok salinan depan), `applyClientEdits`, `locateChart` (dari keterangan), `chartPatch` |
| scripts/studio/mcp/smoke-write-client.ts | add | Asap stdio nyata dokumen klien + pemeriksa DOCX (pembaca zip tanpa pustaka) |
| scripts/studio/mcp/write-tools.ts | modify | `template` di skema `studio_write`, blok `{subheading}`, `stacked`, `{figure, chart}` di `edits`, dispatch klien, `assertShape` (CONTENT_INJECTION), I-1, I-4 (`CHART_LABEL` = `FIGURE_BOUNDS.chartDataChars`), I-5 |
| scripts/studio/mcp/write-content.ts | modify | M-1 `guardLine` (paragraf, daftar, keterangan), peringatan `TEXT_ESCAPED` hanya bila struktur berubah, `headings`/`itemKeys`/`recordFields` untuk cek pasca-konversi |
| scripts/studio/mcp/write-edit.ts | modify | M-1 `guardFragment` untuk pengganti, L-1 hapus hanya paragraf utuh, L-2 irisan indeks, L-3 `plainOf` linear + batas 20.000 |
| scripts/studio/mcp/tools.ts | modify | L-4 `argIssues` dibatasi 20 + entri hitungan; petunjuk `BASE_CONFLICT` menyebut `studio_edit` |
| tests/unit/studio/mcp/implw2-client.test.ts | add | 20 uji dokumen klien |
| tests/unit/studio/mcp/implw2-security.test.ts | add | 15 uji perbaikan review 13 |
| tests/unit/studio/mcp/implw-write.test.ts | modify | uji hapus paragraf mengikuti L-1 (sebagian -> `EDIT_INVALID`, utuh -> dihapus) |
| docs/STUDIO-MCP.md | modify | baris alat, §4.2 ukuran, §5.x contoh klien + aturan mesin, §6 perbaikan review 13, §7 uji/asap |

Tidak ada perubahan API HTTP, skema kontrak, atau `src/lib/studio/**` (`git diff --stat -- src/` kosong).

## Perbaikan keamanan review 13 (D-529)
| ID | Perbaikan | Bukti |
|---|---|---|
| M-1 | `guardLine` (`write-content.ts`): spasi awal dibuang, setiap `\|` di-escape, awal `# > + = \| -`, garis horizontal, pagar ```` ``` ````/`~~~`, `<<<<<<<` di-escape, `1.`/`1)` di-escape, `Kunci:` (lebih luas dari `KV_RE`, termasuk awalan `- `/`> ` dan nilai kosong, jadi `agentId:`/`basis:`/`mission:` ikut) di-escape, baris mirip caption di-escape titik/titik dua. Dipakai untuk setiap baris paragraf, butir `{list}`, keterangan, sisipan `studio_edit`. Pengganti di tengah paragraf lewat `guardFragment` (baris baru dirapatkan, `\|` dan `:` di-escape, awal baris dijaga bila jatuh di awal baris/sesudah penanda daftar). Pertahanan kedua `assertShape` (`write-tools.ts`): konversi ulang harus memberi section yang sama dan urut, record hanya medan kepala mesin, butir/bukti hanya dari tabel butir mesin (cardIds dari pemindaian teks generator diizinkan, perilaku jalur MD yang sama), selain itu `CONTENT_INJECTION`, 0 jaringan | uji merah-lalu-hijau per vektor (lihat Test Results); asap laporan kerja DEV ulang 9/9 |
| L-1 | `replace: ""` menghapus paragraf (laporan) / paragraf atau butir (klien) hanya bila `find` = seluruh teks (ternormalisasi); selain itu `EDIT_INVALID` dengan petunjuk | uji `implw-write` "replace \"\"" (sebagian -> `EDIT_INVALID`, 0 POST), `implw2-security` "L-1 (klien)" |
| L-2 | cadangan tanpa markah memakai irisan indeks (`plainReplaced`), pengganti medan/sel/paragraf juga irisan; tidak ada `String.replace` dengan string pengganti dari agen | uji "L-2: pengganti dengan $' $` $& ditulis literal" |
| L-3 | `plainOf` pemindai linear (posisi `)` dan baris baru berikutnya dihitung satu lintasan mundur), masukan dipotong 20.000; satuan > 20.000 karakter tidak dipakai cadangan (tidak pernah ditulis ulang dari teks terpotong); proyeksi satu kali per satuan | uji "L-3": 20.000 `[` + 10.000 `](` < 200 ms |
| L-4 | `argIssues` (semua alat): 20 isu pertama (pointer/pesan dipotong 300) + satu entri `truncated` berisi jumlah total | uji "L-4": 300 baris sel `true` -> 21 entri, hasil < 30 KB |
| I-1 | `REPORT_CHANGED_BY_OTHER` dari `studio_write` menyarankan `studio_edit`; petunjuk `BASE_CONFLICT` menyebut `studio_report_refresh` (reports) atau ulangi `studio_edit` (write) | uji "I-1" (pesan memuat `studio_edit`, tidak memuat `studio_report_refresh`) |
| I-4 | `categories` grafik (tulis dan sunting) `maxLength` = `FIGURE_BOUNDS.chartDataChars` (200), `maxItems` = `FIGURE_BOUNDS.items` | uji "I-4": label 201 karakter -> `INVALID_ARGUMENT` sebelum jaringan |
| I-5 | galat lokal `runReport` di `studio_edit` (tanpa status HTTP/cid) -> `McpToolError` `untrusted: true`, pesan dan rincian di blok | uji konflik `implw-write` tetap `BASE_CONFLICT` + `untrusted` |
| L-5 | dokumentasi saja (STUDIO-MCP.md §6) | - |

## Test Results (segar, 2026-11-03)
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | sesudah perubahan terakhir |
| Lint | `npx eslint` pada 16 berkas tersentuh (write-*, smoke-*, tools, config, server, studio-report, implw*/mcp-server tests) | exit 0, 0 peringatan | |
| Unit MCP + manifest SVG | `npx vitest run tests/unit/studio/mcp tests/unit/studio/figures/clean-svg-manifest.test.ts` | 13 berkas, 200/200 lulus | implw-write 21, implw2-client 20, implw2-security 15 |
| Suite studio penuh | `npx vitest run tests/unit/studio` | 202 berkas; 3992 lulus, 1 dilewati, 0 gagal | dijalankan sebelum perubahan terakhir (hanya syarat peringatan `TEXT_ESCAPED`); MCP diulang segar sesudahnya |
| Asap DEV dokumen klien | `INTERNAL_API_SECRET=<berkas, tidak dicetak> STUDIO_MCP_FILE_ROOTS=<Temp/claude/implw2/smoke_dl3> npx tsx scripts/studio/mcp/smoke-write-client.ts` (misi `2026-11-03_implw2`) | exit 0, 10/10 langkah, 5 panggilan alat | lihat Verification |
| Asap DEV laporan kerja (ulang sesudah M-1) | `... npx tsx scripts/studio/mcp/smoke-write.ts --mission 2026-11-03_implw2` | exit 0, 9/9 langkah, 7 panggilan alat | |

Merah lalu hijau (teramati): untuk M-1 perbaikan dibalik sementara (salinan berkas; `guardLine` ke aturan lama, `guardFragment` identitas, `assertShape` dilepas), lalu `implw2-security.test.ts` dijalankan: 6 gagal (tabel ber-pipa di paragraf, pagar tanpa penutup, `Kunci: nilai`, `guardLine` unit, sisipan tabel `studio_edit`, pengganti `Initiator:` + sisipan pagar `studio_edit`). Uji `agentId:` mode anonim dibalik terpisah dan gagal (`expected false to be true`). Berkas dipulihkan dari salinan: 15/15 lulus. L-1: uji hapus sebagian paragraf gagal pada kode lama, lulus sesudah perbaikan. Jalur klien: probe DEV memberi dua merah nyata (INCOMPLETE karena kunci bab 1, 2, 6; `BY_CONSTRUCTION_FAILED` DATUM-09 dengan dokumen setengah jadi), yang menjadi uji `Bab 6 -> setOutline`, `CONTENT_INVALID`, dan `TABLE_UNIT_MISSING`. Catatan jujur: uji MCP dokumen klien lain ditulis sesudah implementasi (dipandu probe DEV) dan lulus pada jalan pertama.

## Verification
- Langkah 1 (`template` + R04 + meta): uji "dokumen baru" (R04 `template: datum-gsp` dari `latest`, `meta` tanpa `docNumber`). DEV: `latest` -> `datum-gsp`, dokumen `cmw03tmki04f3v188z7mnl9mv` (`022/GSP/KT/XI/2026` = nomor server), rev 8 COMPLETE, DOCX terverifikasi.
- Langkah 2 (slot dari meta): uji builder (blok kendali sampul `Nomor dokumen | GSP-UD1-NL-001`, judul lembar kendali, rantai verifikasi, tanda tangan). DEV DOCX: paragraf 8 = `GSP-W2-030424`, paragraf sebelumnya `Nomor dokumen`; `Lembar Kendali GSP-W2-030424` tercetak.
- Langkah 3 (bab, tabel/grafik berketerangan, penomoran mesin): DEV DOCX: `Tabel 2.1   Indeks kesiapan per gardu`, `Tabel 2.2   Kinerja Pemeliharaan: Peralatan, Jumlah (unit)` (keterangan dibangkitkan), `Gambar 6.1   Indeks kesiapan gardu triwulan III` (judul `6. Analisis Kesiapan` -> bab 6). 2 tabel isi = 2 keterangan.
- Langkah 4 (`studio_edit` klien): uji paragraf + sel (R12 bab itu, basis = revisi dibaca), nomor tampilan (R13 cover + controlSheet, `docNumber` server tetap), data grafik (R16 PATCH `op: replace`, kode P-03 disusun mesin), `TEXT_AMBIGUOUS`/`TEXT_NOT_FOUND` di blok, 409 `SCOPE_CONFLICT`, pemilik lain sebelum isi dibaca. DEV: paragraf + sel -> rev 10 basis 8 (bab 2, bab 6); data grafik -> rev 11 (figur `p-g44fs41dqw` lewat R16); DOCX memuat frasa sunting dan sel `66`; `studio_search` menemukan frasa (1 hasil).
- Langkah 5 (uji + asap): lihat Test Results. Rahasia tidak muncul di 5 hasil alat asap klien maupun 7 hasil asap laporan.
- Tambahan DOCX: `docNumber` server `022/GSP` tercetak di `word/footer4..6.xml` (kaki halaman), tidak di sampul/lembar kendali. Lihat Persistent Issues.

### Ukuran toolset (measure.ts, stdio nyata, token = bita/4)
| Toolset | Alat | tools/list (B) | per giliran (B / ~token) |
|---|---|---|---|
| write (IMPL-W, laporan saja) | 6 | 9.827 | 10.540 / ~2.635 |
| write (IMPL-W2: + klien + perbaikan keamanan) | 6 | 11.313 | 12.026 / ~3.007 |
| reports | 9 | 11.255 | 11.996 / ~2.999 |
| documents | 13 | 18.181 | 19.151 / ~4.788 (write -37,2%) |
| bawaan | 22 | 29.913 | 31.173 / ~7.794 (tidak berubah) |

Per alat `write`: `studio_write` 3.837 B, `studio_edit` 2.777 B, `studio_contracts_query` 1.427 B, `studio_document_get` 1.277 B, `studio_search` 1.126 B, `studio_file_verify` 852 B.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Kaki halaman DOCX mencetak `docNumber` server, bukan nomor tampilan meta | 0 (di luar lingkup) | Kaki halaman dibangun mesin/templat dari `meta.docNumber`; `DocMetaV2` tidak punya medan nomor tampilan. Mengubahnya perlu perubahan kontrak/mesin (dilarang di baris ini) | Sampul dan lembar kendali memakai nomor meta (diperiksa di DOCX); kaki halaman = keterbatasan tercatat | Tidak untuk kriteria brief (sampul); keputusan controller bila kaki halaman juga harus nomor tampilan |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | Nomor tampilan meta vs `docNumber` server (D-527) | `docNumber` tidak pernah dikirim; nomor tampilan ke blok kendali sampul (`cover.control`) + judul lembar kendali. Tanpa `meta.number`: blok kendali otomatis mesin |
| 2 | Tabel/grafik tanpa sumber (gerbang DATUM-10) | Sumber bawaan `meta.source`, atau "Diolah oleh <author>" + `SOURCE_DEFAULTED`. Untuk controller: bila terlalu lunak, ganti dengan penolakan |
| 3 | Tabel angka tanpa satuan (DATUM-09) | Ditolak lokal `TABLE_UNIT_MISSING` (satuan tidak ditebak) |
| 3 | Dokumen setengah jadi bila satu bagian ditolak server | Dry-run R08 setiap slot/bab sebelum R04 (dan sebelum tulis ulang/sunting): `CONTENT_INVALID`, 0 tulis |
| 3 | Kunci bab | Nomor di judul bila naik, selain itu urutan (`CHAPTER_RENUMBERED`); tidak berurutan -> `setOutline` (`OUTLINE_SET`) |
| 3 | Kode grafik tanpa `type` (D-527) | 1 seri P-02/P-01, 2..3 seri P-03, `stacked` K-01, 4..6 seri P-12, > 6 ditolak; `type` menang |
| 4 | Satu teks tercetak di beberapa slot depan | Kecocokan yang semuanya di teks depan diganti bersama |
| 4 | Grafik di bab yang juga disunting | Ikut kiriman R12 bab itu; grafik saja -> R16 |
| 4 | Basis | Semua kiriman satu panggilan membawa revisi yang DIBACA di awal; `BASIS_REBASED` hanya bila revisi melompat melebihi kiriman sendiri |
| M-1 | `guardLineStart` privat di `md-report.ts` (di luar lingkup tulis) | Helper setara lebih luas di `write-content.ts` |
| M-1 | cardIds | Pemindaian id kartu di teks oleh generator (jalur MD sama) diizinkan di `assertShape` |
| L-4 | Bentuk `details` galat skema | Tetap larik; 20 entri + 1 entri `truncated` |
| - | Bawaan dan `all` toolset | Tidak berubah (terukur 29.913 B) |

## Next Steps
- Cek ulang keamanan sempit oleh controller: `write-client*.ts` dan perubahan M-1/L-*/I-* di `write-content.ts`, `write-edit.ts`, `write-tools.ts`, `tools.ts`.
- Keputusan controller: nomor tampilan di kaki halaman DOCX (perlu perubahan kontrak/mesin); kebijakan sumber bawaan tabel/grafik.

## Siklus 2 (D-531; review 13 "Siklus 1": R-1, N-1, I-6, I-7)

### Uji merah lebih dulu (probe -> uji)
| Probe | Uji | Merah (sebelum perbaikan) | Hijau |
|---|---|---|---|
| B2 (`Initiator: mallory` lalu hapus `\`) | `implw2-cycle2` "B2" | `expected 'mallory' to be null` | lulus |
| B3 (sisip tabel + `:--` + hapus `\` x4) | "B3" | `items = R3F2-1, R3F2-2, EVIL-9` | lulus |
| B4 (anonim, intro bab 1 `agentId:` lalu hapus `\`) | "B4" | `expected false to be true` (POST membawa mallory) | lulus |
| H1 (sisip `<!--`) | "H: sisipan \"<!--\"" | bab 3 = `['Bukti awal.']` | lulus |
| H2 (`<!-- x --> catatan`) | "H: sisipan \"<!-- x --> catatan\"" | sudah lulus sebelum perbaikan (konverter mempertahankan teks sesudah komentar tertutup satu baris) | lulus |
| `guardLine` `:` / `<!--` | "guardLine: awal `:` dan setiap `<!--`" | `expected ':--' to be '\:--'` | lulus |
| K1-K3 (`studio_write` komentar) | "K1-K3" | teks dalam/sesudah komentar hilang | lulus |
| `assertShape` teks hilang | "assertShape: teks paragraf yang hilang" | tidak melempar | lulus |
| cek struktur `studio_edit` | "record berubah tanpa suntingan..." dan "bab baru/hilang..." | fungsi belum ada | lulus |
| C3 (500 di tengah tulis dokumen baru) | `implw2-client` "N-1 (C3)" | `progress` undefined | lulus: progress + ulang menyelesaikan, hanya bab 2 dan bab 3 dikirim, `skipped` = 3 slot + bab 1 |
| C4 (409 bab 2 di `studio_edit`) | "N-1 (C4)" | `progress` undefined | lulus: `written: ['bab 1'], notWritten: ['bab 2']` |
| C6 (kode grafik berpenanda) | "I-6" | penanda di teks hasil | lulus |
| I-7 (dokumen adopsi) | "I-7" | tulis ulang lanjut | lulus: `BASIS_MISSING` + saran `studio_edit`, 0 tulis |

Ringkas merah: `implw2-cycle2.test.ts` 9 gagal dari 10 sebelum perbaikan; blok siklus 2 `implw2-client.test.ts` 4 gagal dari 4.

### Perbaikan per temuan
| ID | Status | Perbaikan | Lokasi |
|---|---|---|---|
| R-1 (a) | FIXED | `guardLine`: awal `:` di-escape, setiap `<!--` -> `<\!--`. `applyEdits`: sesudah SEMUA suntingan, `reguard` menjaga ulang setiap baris intro/body/tail yang tidak ada di teks semula (multiset; baris tabel hasil suntingan sel = tepercaya; isi pagar kode yang ada dibiarkan; penanda daftar/kutipan di awal dipertahankan, isinya lewat `guardLine`) | `write-content.ts` `guardLine`; `write-edit.ts` `reguard`, `guardChanged`, `applyEdits` |
| R-1 cek struktur `studio_edit` | FIXED | `assertEditShape` (dipanggil sebelum jaringan): himpunan bagian sama; record berubah hanya di medan yang disunting lewat baris medannya, butir/bukti/cardIds hanya bila sel tabel bab disunting, refs hanya bila sel Rujukan disunting; per bab jumlah blok = semula + sisipan - hapusan, paragraf hilang/berubah <= jumlah suntingan paragraf. Selain itu `CONTENT_INJECTION` (`untrusted`, rincian di blok), 0 tulis. `applyEdits` mengembalikan `EditPlan` | `write-tools.ts` `assertEditShape`, `editWorkReport` |
| R-1 `assertShape` teks | FIXED | Teks paragraf per section hasil konversi dibandingkan dengan paragraf masukan (huruf/angka saja; jumlah dan urutan); builder mencatat `paragraphs` per judul | `write-tools.ts` `assertShape`; `write-content.ts` `expectedParagraphs` |
| N-1 | FIXED | Galat sesudah sebagian tersimpan membawa `progress` (`documentId`, `created`, `written`, `skipped`, `notWritten`, `revisionNo`) + saran; `studio_write` ulang = idempoten: slot/bab yang isinya sudah sama di server (`sameContent`, pid diabaikan) dilewati (`skipped` di hasil), outline yang sama tidak dikirim ulang. `studio_edit` sebagian: progress + saran "baca ulang, ulangi hanya bagian di notWritten". Klaim dokumentasi diperbaiki menjadi "tidak ada dokumen setengah jadi karena penolakan validasi" | `write-client-run.ts` `withProgress`, `writeClient`, `editClient`; STUDIO-MCP.md §5.x |
| I-6 | FIXED | `tok()` untuk `type`/kode grafik di `CHART_TYPE_UNKNOWN` dan bentuk data di `INVALID_ARGUMENT` | `write-client.ts:160`, `write-client-edit.ts:244` |
| I-7 | FIXED (opsi: tolak) | `studio_write` + `template` atas dokumen klien yang diadopsi -> `BASIS_MISSING` (saran `studio_edit`, 0 tulis), sama dengan jalur laporan kerja (`guardReportSubmit`) | `write-client-run.ts` `writeClient` |
| L-5 | tetap dokumentasi | tidak diminta di siklus ini | - |

### Gerbang (segar, sesudah perubahan terakhir)
| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 |
| Lint | `npx eslint` berkas tersentuh siklus 2 (write-content, write-edit, write-tools, write-client, write-client-run, write-client-edit, implw2-client.test, implw2-cycle2.test) | exit 0 |
| MCP + manifest SVG | `npx vitest run tests/unit/studio/mcp tests/unit/studio/figures/clean-svg-manifest.test.ts` | 14 berkas, 214/214 lulus |
| Suite studio penuh | `npx vitest run tests/unit/studio` | 203 berkas; 4006 lulus, 1 dilewati, 0 gagal (exit 0) |
| Asap DEV dokumen klien | `smoke-write-client.ts` (misi `2026-11-03_implw2`, docKey `implw2-smoke-20261103033452`) | exit 0, 10/10: COMPLETE rev 8, sunting rev 10 basis 8, grafik R16 rev 11, DOCX: sampul `GSP-W2-033452` sesudah "Nomor dokumen", `Tabel 2.1`/`Tabel 2.2`, `Gambar 6.1` |
| Asap DEV laporan kerja | `smoke-write.ts --mission 2026-11-03_implw2` (docKey `implw-smoke-20261103033459`) | exit 0, 9/9: sunting sel + sisip (record, bab 2) lolos `assertEditShape` di server nyata |

Tidak ada perubahan API HTTP, skema kontrak, atau `src/lib/studio/**`. Tidak ada commit.

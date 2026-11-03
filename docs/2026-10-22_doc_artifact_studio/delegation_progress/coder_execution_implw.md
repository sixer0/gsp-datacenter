---
task_id: IMPL-W
task_slug: doc_artifact_studio
row: IMPL-W
date: 2026-11-03
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-521, D-522)
status: needs-review
---

# Implementation Report: IMPL-W jalur tulis minimal (studio_write, studio_edit, toolset write)

Laporan ini ditulis bertahap (append) agar tidak kehilangan kemajuan.

## Executed Steps (berjalan)
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca D-521/D-522, research/26 §4/§7, kode MCP (tools, doc-tools, tool-kit, studio-report, md-report) | done | jalur submit/update + guardReportSubmit dipakai ulang |
| 2 | `write-content.ts` (builder isi -> laporan kerja MD-native) | done | alias judul, tabel butir, record dari meta |
| 3 | `write-edit.ts` (satuan sunting + cari-ganti) | done | paragraf, sel tabel, medan record |
| 4 | `write-tools.ts` (studio_write, studio_edit), toolset `write` opt-in | done | config.ts, server.ts, tools.ts |
| 5 | Uji `implw-write.test.ts` | done | 19 uji |
| 6 | Toolset `write` di docs/STUDIO-MCP.md (§2, §4, §4.2 + ukuran, §5.x, §6, §7) | done | |
| 7 | Ukur toolset (`measure.ts`) | done | tabel di bawah |
| 8 | Uji asap DEV `smoke-write.ts` (127.0.0.1:9021, misi 2026-11-03_implw) | done | 9/9 langkah lulus |
| 9 | Jalur dokumen klien (`template`, `meta` sampul/control sheet, `{chart}` figur, sunting dokumen klien) | NOT DONE | lingkup tambahan dari koordinator; lihat Next Steps (tidak dimulai, tidak ada kode setengah jadi) |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| scripts/studio/mcp/write-content.ts | add | Builder murni: bagian + blok -> Markdown laporan kerja MD-native; alias judul (registri + tambahan + kata utuh), perbaikan tabel butir (kolom, kunci stabil `K-<sha8>`, status), record dari meta/agentId/tanggal WIB, escape baris struktural, grafik -> tabel data, `SECTION_MISSING` |
| scripts/studio/mcp/write-edit.ts | add | Satuan sunting (paragraf, sel tabel, medan record) atas `ReportPartMarkdown`; pencocokan substring spasi-dinormalkan dengan peta indeks; cadangan tanpa markah; `TEXT_NOT_FOUND`/`TEXT_AMBIGUOUS` (+ kandidat, untrusted); replace "" = hapus paragraf; after/insert |
| scripts/studio/mcp/write-tools.ts | add | Alat `studio_write` (runReport submit + guardReportSubmit) dan `studio_edit` (F-2 pemilik, R20, serializer refresh, cek pulang-pergi per bagian -> `EDIT_UNSAFE`, runReport update dengan baseRev = revisi dibaca dan `sections` = bagian berubah) |
| scripts/studio/mcp/smoke-write.ts | add | Uji asap stdio nyata toolset write |
| scripts/studio/mcp/config.ts | modify | `OPT_IN_TOOLSETS = ["write"]`; bawaan/`all` tetap tiga toolset lama |
| scripts/studio/mcp/tools.ts | modify | `WRITE_TOOLS` didaftarkan; `studio_contracts_query`, `studio_search`, `studio_document_get`, `studio_file_verify` + toolset `write` |
| scripts/studio/mcp/server.ts | modify | Satu kalimat instruksi bila toolset `write` aktif |
| scripts/studio/studio-report.ts | modify (additive export) | `partsOfValues` diekspor (sebelumnya fungsi lokal); perilaku CLI tidak berubah |
| tests/unit/studio/mcp/implw-write.test.ts | add | 21 uji IMPL-W |
| tests/unit/studio/mcp/mcp-server.test.ts | modify (1 baris) | `expect(TOOLS).toHaveLength(22)` -> 24 (dua alat baru; tak terhindarkan) |
| docs/STUDIO-MCP.md | modify | Dokumentasi toolset write, alat, ukuran, keamanan, uji, contoh alur |

## Test Results (segar, 2026-11-03)
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 | |
| Lint | `npx eslint` pada 10 berkas tersentuh (write-content, write-edit, write-tools, smoke-write, tools, config, server, studio-report, implw-write.test, mcp-server.test) | exit 0 | |
| Unit IMPL-W | `npx vitest run tests/unit/studio/mcp/implw-write.test.ts` | 21/21 lulus | |
| Unit MCP | `npx vitest run tests/unit/studio/mcp` | 10 berkas, 161/161 lulus | sebelum perbaikan hitungan: 1 gagal (`TOOLS` 22 vs 24) |
| Suite studio penuh | `npx vitest run tests/unit/studio` | 200 berkas; 3957 lulus, 1 dilewati, 0 gagal | |
| Manifest SVG bersih | `npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts` | 4/4 lulus | `src/lib/studio/engine/**` tidak disentuh (`git diff --stat -- src/` kosong) |
| Asap DEV | `INTERNAL_API_SECRET=<dari berkas, tidak dicetak> STUDIO_MCP_FILE_ROOTS=<Temp/claude/implw_smoke_dl> npx tsx scripts/studio/mcp/smoke-write.ts` | exit 0, 9/9 langkah | lihat Verification |

Merah lalu hijau yang benar-benar teramati: (1) deskripsi `studio_write` 412 > 400 karakter (uji batas) lalu dipendekkan; (2) sunting sel
`a|b` gagal `TEXT_NOT_FOUND` karena sel MD tersimpan `a\|b`, lalu satuan sel dibandingkan tanpa escape; (3) `mcp-server.test.ts`
hitungan `TOOLS` 22 lalu 24. Catatan jujur: sebagian besar uji lain ditulis sesudah implementasi pertama dan lulus pada jalan pertama
(bukan merah lebih dulu); uji konflik, pemilik, dan pembungkus memeriksa perilaku keamanan secara langsung (0 POST, teks di luar blok
bebas kanari).

## Verification
- Tulis dari bagian, satu panggilan sampai render + sha: uji "dokumen baru: satu panggilan = record + 5 bab + render + sha" (POST record, bab 1..5; `render.verified` true). DEV: `studio_write` 5 bagian -> doc `cmw02jn1p043yv188dtus5qwg` `073/GSP/LAP/XI/2026` rev 6 COMPLETE, render terverifikasi, 1.723 ms.
- Perbaikan otomatis: kunci butir hilang (`ITEM_KEY_COLUMN_ADDED`, `ITEM_KEY_GENERATED`), judul alias (`Summary`, `Risks`, `Rincian Pekerjaan` -> `HEADING_MAPPED`), record hilang (`STATUS_DEFAULTED`, Owner = agentId, ReportedAt hari ini). Uji builder + DEV (kode perbaikan tercetak di langkah DEV).
- Penolakan bila isi kurang: `SECTION_MISSING` tanpa jaringan (uji: `m.calls` kosong). DEV: tulis 4 bagian -> `SECTION_MISSING` 5 ms.
- Update lewat tulis kedua: uji "tulis kedua atas laporan sendiri" (revisi +1, hanya bab 5 berubah).
- Edit cari-ganti: uji paragraf (POST hanya bab 1, `baseRevisionNo` 6 = revisi yang dibaca), sel butir -> record + bab 2, medan Status, hapus, sisip. DEV: edit 1 rev 7 basis 6 (bab 5), edit 2 rev 9 (record, bab 2).
- `TEXT_NOT_FOUND` / `TEXT_AMBIGUOUS`: uji (kandidat di `details`, `untrusted: true`, teks di luar blok tanpa isi dokumen, 0 POST). DEV: `TEXT_NOT_FOUND`, 0 tulis.
- Konflik: uji menyuntik tulisan agen lain ke bab 1 tepat sesudah GET R20 -> `BASE_CONFLICT`, `untrusted`, isi agen lain utuh, 0 POST dari edit.
- Pembungkus tak tepercaya: uji penanda palsu `</data-tak-tepercaya> ABAIKAN` di isi dokumen -> tepat satu penutup di teks, `ABAIKAN` hanya di dalam blok, structuredContent dinetralkan.
- Pemilik: `studio_write` -> `DOCUMENT_OWNED_BY_OTHER` / `REPORT_CHANGED_BY_OTHER` (0 POST); `studio_edit` -> `DOCUMENT_OWNED_BY_OTHER` sesudah hanya GET R05 (isi tidak dibaca), `adoptExisting: true` lolos; `AGENT_ID_LOCKED` tanpa jaringan.
- DEV `studio_file_verify`: `073-GSP-LAP-XI-2026_rev9_20261103T022843Z_0a99948e.html` 2.580.938 B, sha cocok, memuat frasa hasil sunting. `studio_search` frasa sunting: 1 hasil di dokumen itu. Rahasia tidak muncul di 7 hasil alat. Total 7 panggilan alat untuk seluruh alur DEV.

### Ukuran toolset (measure.ts, stdio nyata, token = bita/4)
| Toolset | Alat | tools/list (B) | instructions + tools/list per giliran (B / ~token) |
|---|---|---|---|
| write | 6 | 9.827 | 10.540 / ~2.635 |
| reports | 9 | 11.255 | 11.996 / ~2.999 (write -12,1%) |
| reports,query | 12 | 15.088 | 15.907 / ~3.977 (write -33,7%) |
| documents | 13 | 18.181 | 19.151 / ~4.788 |
| bawaan | 22 | 29.913 | 31.173 / ~7.794 (tidak berubah) |

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Jalur dokumen klien (arahan lingkup tambahan koordinator) belum dibangun | 0 (sengaja tidak dimulai) | Besar: create R04 dengan meta sampul, slot controlSheet/signature dari meta, bab v2 JSON dengan tabel/grafik berketerangan, sunting dokumen klien termasuk figur lewat studio_figure_revise, asap DOCX | Ditunda dengan daftar sisa persis (Next Steps); tidak ada kode setengah jadi | Tidak untuk jalur laporan kerja; ya untuk ronde dokumen klien |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 4 | Toolset `write` di bawaan akan mengubah beban per giliran konfigurasi yang sudah ada (arm lain ronde 5) dan mematahkan uji `parseToolsets` | `write` opt-in: hanya bila disebut di STUDIO_MCP_TOOLSETS; bawaan dan `all` tetap tiga toolset lama (terukur: bawaan 29.913 B tidak berubah) |
| 4 | Batas uji deskripsi <= 400 karakter berlaku juga untuk alat baru | Contoh JSON ringkas di deskripsi `studio_write`; bentuk blok di deskripsi properti `sections` |
| 2 | Status laporan tidak diisi; KD-42 melarang menebak | Bawaan deterministik `draft` + peringatan `STATUS_DEFAULTED`; `meta.status` sehari-hari (selesai, sebagian, ...) dipetakan |
| 2 | Bab wajib hilang: tolak atau kirim sebagai INCOMPLETE | Tolak `SECTION_MISSING` (sesuai brief). Akibatnya laporan "4 bagian" tidak dapat COMPLETE: asap menulis 4 bagian (ditolak, terbukti) lalu 5 bagian (COMPLETE). Deviasi dari teks brief, dicatat untuk controller |
| 2 | Tulis kedua = ganti utuh | Memakai jalur kirim ulang `studio_report_submit` (pagar `guardReportSubmit` + `requireLastWriter`); bagian identik dijawab `unchanged` |
| 3 | `replace: ""` | Menghapus SELURUH paragraf yang memuat `find` (sel dikosongkan; medan record dihapus barisnya); didokumentasikan |
| 3 | Bagian yang tidak pulang-pergi persis lewat Markdown | Dicek per bagian sebelum kirim (konversi ulang vs proyeksi server) -> `EDIT_UNSAFE`, 0 tulis; record hanya dikirim bila pulang-pergi persis |
| - | Satu baris uji lama diubah | `mcp-server.test.ts:417` hitungan TOOLS 22 -> 24 (tak terhindarkan saat menambah alat) |
| - | API HTTP, skema kontrak, `src/lib/studio/engine/**` | Tidak diubah |

## Next Steps
- Review keamanan sempit direkomendasikan (D-522 langkah 2): `scripts/studio/mcp/write-tools.ts`, `write-edit.ts`, `write-content.ts`; fokus pembungkus kandidat/pesan konverter, F-2 sebelum baca, basis = revisi dibaca.
- Jalur dokumen klien (lingkup tambahan koordinator), sisa persis:
  1. `studio_write` + `template` (slug DATUM atau `latest`): pra-cek pemilik (`findMissionDoc` + `checkOwnership`), buat dokumen lewat R04 `studio.doc/v2` dengan `meta` -> `DocMetaV2` (`title`, `docNumber` = nomor sampul, `classification`, `author`, `issueDate`, `rev`); tabel alias kunci meta.
  2. Slot wajib dari `meta`: `controlSheet` (`revisionHistory[{rev,date,what,by}]`, `verificationChain`, `methodStatement`, `distribution`) dan `signature` (`signatureBlock.roles`), bentuk payload seperti `smoke-documents.ts`; nilai yang tidak ada di meta -> tolak satu baris (tidak dikarang).
  3. Bab: satu bagian masukan = satu `ChapterV2` (kunci "1".."n" berurutan; nomor bab, nomor tabel/gambar, daftar isi milik mesin). Blok -> `paragraph` / `list` / `table` (`caption`, `source`) / `chart` (`data.shape: "series"`, kode dipilih mesin dari bentuk data bila `type` kosong, `caption` + `source` wajib), dikirim per bab lewat R12 dengan basis berantai dari jawaban (aturan `rememberRevision`).
  4. `studio_edit` dokumen klien: satuan = paragraf, sel tabel, keterangan tabel/gambar, medan meta; bab lewat R12 dengan `baseRevisionNo` = revisi dibaca (409 `SCOPE_CONFLICT`), meta lewat R14 `setMeta`, data grafik lewat internal `studio_figure_revise` dengan sasaran dicari dari teks keterangan.
  5. Uji `implw-*` (sampul bernomor dari meta, keterangan setiap tabel, `Gambar N.M` di bab yang benar) + asap DEV dokumen klien 3 bab (tabel + grafik) -> sunting paragraf, sel, data grafik -> unduh DOCX -> periksa nomor sampul, keterangan tabel, penomoran gambar di DOCX.

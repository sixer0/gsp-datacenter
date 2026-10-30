---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-H7
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/delegation_progress/final_phase_brief.md (pengecualian baris: mengubah kode di area eksklusif)
status: complete
---

# FIX-H7: importer Markdown resmi `md/v1` (D-321/D-322; laporan Hermes G3)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief, wawancara + laporan Hermes, `convert.py` Hermes (acuan kebutuhan), kontrak v2 (`types/v2/{doc,common}.ts`, `schema/v2/common.schema.ts`, `forbidden.ts`), panduan agen §2/§4/§5.5/§10, route R08/R12 | complete | Tidak ada pustaka Markdown di dependensi: pengurai ditulis sendiri (tanpa dependensi baru) |
| 2 | Klaim berkas di `file_claims.md` (prefiks FIX-H7) | complete | |
| 3 | Layanan `services/import/**` (tdd) | complete | 22 kasus uji |
| 4 | Route `POST /api/studio/import/markdown` (+ `?validate=1` dry-run R08) | complete | Asap :9021 |
| 5 | CLI `scripts/studio/md2chapter.ts` | complete | |
| 6 | Konversi bab nyata Hermes, tsc, eslint, vitest studio | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/import/types.ts | add | `MD_IMPORTER_VERSION = "md/v1"`, tipe opsi, laporan (`warnings`, `dropped` berjenis display/html/structure/content, `mapping` baris MD -> JSON Pointer), hasil |
| src/lib/studio/services/import/lexer.ts | add | Pemecah blok: ATX/setext, paragraf, daftar bersarang, tabel pipa GFM, kode berpagar, kutipan, blok HTML jenis 1/2/6/7, garis pemisah, front matter |
| src/lib/studio/services/import/inline.ts | add | Inline -> `RunV2` (strong/em/code/sup/sub/br); tautan -> `label (url)`; HTML inline bergaya dibuang + dilaporkan; `{text}` hanya bila polos dan tanpa `*`/`` ` `` (aman dari md-lite KS-03). Pengaman kompleksitas: memo kegagalan per string (penanda, backtick, tag), pasangan kurung O(n), batas sarang 24 |
| src/lib/studio/services/import/markdown.ts | add | `importMarkdownChapter(markdown, opts)`: pemetaan blok, caption `Tabel/Table n.m.` + `Sumber:` (provenance dari `[TERUKUR]` dsb.), gambar `![caption](sha256:..)`, rel, aside, monoBlock, amplop opsional |
| src/lib/studio/services/import/validate.ts | add | Validasi hasil dengan `studioValidator` + `classifySchemaV2Errors` (validator v2 repo) |
| src/lib/studio/services/import/index.ts | add | Ekspor publik |
| src/app/api/studio/import/markdown/route.ts | add | Route; auth `requireSession` (rahasia internal + agentId); tidak menyimpan; `?validate=1` = `dryRunChapter` (R08) + pembatas laju R08 |
| scripts/studio/md2chapter.ts | add | CLI; keluar 0 sah / 1 tidak sah / 2 galat pemakaian |
| tests/unit/studio/import/md-v1.test.ts | add | 22 kasus |

Kontrak (`src/lib/studio/contract/**`) TIDAK diubah; tidak ada file_requests.

## Pemetaan md/v1 (ringkas)
| Markdown | studio.chapter/v2 |
|---|---|
| `#` pertama | `chapter.title` (nomor "3.", "BAB 3", "Chapter 6 -" dibuang -> `dropped NUMBERING`; beda dengan `chapterKey` -> peringatan) |
| `#` berikutnya | section + peringatan `EXTRA_H1_AS_SECTION` |
| `##` | section (nomor "3.1" dibuang); blok sebelum `##` pertama -> `chapter.intro` |
| `###`; `####`+ | paragraf `role: "subheading"`; >3 + peringatan `HEADING_LEVEL_FLATTENED` |
| paragraf | `paragraph`; penanda di AWAL `[TERUKUR]`/`[DITURUNKAN]`/`[PEMASOK]`/`[ASUMSI]` (+ `: catatan`), `[SUMBER: x]`, `[CATATAN: x]` -> `rail[]`; penanda di tengah kalimat tetap teks |
| daftar | `list` (`ordered`), sarang diratakan + `dropped LIST_NESTING` (kontrak tanpa sarang); butir juga menerima rel |
| tabel GFM | `table`: baris kepala `kind: header`, kolom `numeral` bila semua sel badan angka; `Tabel n.m. x`/`Table: x` sesudah atau sebelum -> caption; `Sumber: x [TERUKUR]` -> source + provenance; perataan `:---:` -> `dropped TABLE_ALIGNMENT` |
| `![caption](sha256:hex "Sumber: x")` sendirian | `image` (caption wajib; sumber dari judul tautan atau baris `Sumber:`); heks polos dinormalkan; kunci peta aset diterima + peringatan; tanpa caption/sumber/rujukan sah -> dibuang + peringatan |
| kode berpagar | `monoBlock` (label dari info string) |
| kutipan | `aside` `generic`; `> [!DOCTRINE] Label` / `STORY` / `QUICKCHECK` / `IFINDOUBT` memilih varian |
| HTML | tag dibuang, teks dipertahankan (`HTML_BLOCK`/`HTML_INLINE`); style/script/komentar dibuang; tabel/img HTML dibuang + peringatan; `<sup>`/`<sub>`/`<b>`/`<i>`/`<code>`/`<br>` dipetakan |
| `---`, front matter, `~~x~~` | dibuang + dilaporkan |
| placeholder Hermes `[FIGUR: ...]` | dibuang + peringatan |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit importer | `npx vitest run tests/unit/studio/import` | 22 passed (22) | tabel (3), gambar (3), daftar + bersarang, inline (3), rel (2), HTML mentah, tampilan, blok lain, placeholder, mapping, idempoten (CRLF/BOM), opsi/galat, amplop + validator |
| Unit studio penuh | `npx vitest run tests/unit/studio` | 77 files, 2164 passed, 1 skipped, 0 failed | tanpa regresi |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 | |
| Lint area | `npx eslint src/lib/studio/services/import src/app/api/studio/import scripts/studio/md2chapter.ts tests/unit/studio/import` | exit 0 | |

## Verification
- Sampel MD bab nyata Hermes (naskah `EOS360-1028/output/naskah-gabungan-rakit.md`, dibaca saja; potongan di `C:/Users/TRIAL/AppData/Local/Temp/fixh7/bab{3,4,5,6}.md`): CLI `npx tsx scripts/studio/md2chapter.ts bab3.md --key 3` -> `valid=true issues=0 sections=12 mapped=50 warnings=2 dropped=18`; bab4 `valid=true issues=0 sections=7`; bab5 `sections=8`; bab6 `sections=4`. Seluruh 10 bab naskah (skrip `Temp/fixh7/all.ts`): `chapters=10 valid=10`, 0 isu.
- Idempoten: uji unit (MD sama, CRLF+BOM) byte sama; CLI dua kali `cmp` -> `CLI-BYTE-IDENTIK`; endpoint dua kali `cmp r1 r2` -> `BYTE-IDENTIK`; keluaran endpoint = keluaran CLI (`same-as-cli true`).
- Asap endpoint :9021 (rahasia uji dari `trial_internal_secret`, tidak dicetak): tanpa rahasia 401; konversi 200 (`x-correlation-id: d6f41d56-...`); medan asing 400 `SCHEMA_INVALID` pointer `/color`; tanpa judul 400 pointer `/title`; `?validate=1` tanpa target 400 pointer `/target`.
- `?validate=1` (dry-run R08 `dryRunChapter`): ke dokumen uji Hermes `cmvucp1d70002v13c945whd78` -> `dryRun.valid=false` `SCOPE_CONFLICT` (proteksi anti-timpa pid FIX-H2 bekerja: pid 4.2.1/4.3.1 disunting PATCH); ke target misi baru -> `BY_CONSTRUCTION_FAILED DATUM-10` (Tabel 4.1 Hermes memang tanpa baris SUMBER; Hermes menambahkannya manual di convert.py); sesudah baris `Sumber:` ditambah -> `dryRun.valid=true`, `submitPreview {documentId:null, created:true, revisionNo:1, changeScope:"create;chapter:4"}`, kelengkapan INCOMPLETE; panggilan ulang tetap `created:true` (tidak ada baris tertulis).
- Kompleksitas (masukan agen hingga 5 MiB): uji adversarial `Temp/fixh7/perf3.ts` linear sesudah pengaman: `"*a **b** "` x160k (1,44 MB) 570 ms, `"_a __b__ "` x160k 589 ms, `"[a"` x160k 10 ms, `"<b>a "` x160k 51 ms, `` "`a ``" `` x160k 78 ms; naskah nyata x4 (~860 KB) 281 ms. Sebelum pengaman: `"*a "` x20k 5,5 s (kuadratik) dan tumpukan meluap pada `"*a **b** "` x20k; keduanya diperbaiki.
- Ulang sesudah pengaman: `chapter` bab 3/4 identik byte dengan run awal; selisih hanya peringatan baru `TABLE_SOURCE_MISSING` (bab 3 baris 69/86/122, bab 4 baris 15). Dua panggilan endpoint `?validate=1`: bagian importer identik; beda hanya stempel waktu kelengkapan milik layanan dry-run.
- Log tahan lama: `data/studio-workspace/logs/api/studio-api-2026-10-30.jsonl` memuat `MD_IMPORTED` (konteks importer/valid/mapped/dropped/requester), `SCHEMA_INVALID` 400, `SCOPE_CONFLICT`, `BY_CONSTRUCTION_FAILED` dengan correlation id.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | | | | |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | Bentuk keluaran: `chapter` = `ChapterV2` (konten murni); amplop `studio.chapter/v2` butuh `target` | `{ chapter, submission?, report, validation }`; `submission` hanya bila target diberikan (CLI `--doc-id/--doc-number/--mission [--doc-key]`, `--submission` mencetak amplop saja). Tambahan atas brief: `validation`, `submission`, `dryRun` |
| 3 | Validasi tanpa target | Amplop sintetis `target.documentId = "md-import-preview"` hanya untuk validator; isu dibatasi `/chapter/...` |
| 3 | Label bukti Hermes (`[PUBLIC-SOURCE]`, `[VENDOR]`, `[ASSESSED]`, `[EXECUTED-DOC]`, `[GSP-STATEMENT]`) tidak ada di kontrak | Hanya dua alias berbukti di pemetaan Hermes sendiri (convert.py): PUBLIC-SOURCE->TERUKUR, VENDOR->PEMASOK (peringatan `MARK_ALIAS`). Lainnya tidak ditebak (`UNMAPPED_MARKER`, tetap teks). Perlu keputusan controller/user bila alias lain diinginkan |
| 3 | Tautan: `RunV2` tanpa hyperlink | `label (url)` sebagai teks |
| 3 | Daftar bersarang: `ListV2` datar | Diratakan berurutan + `dropped LIST_NESTING` (structure) |
| 3 | Kolom `numeral` disimpulkan dari isi (semua sel badan angka) | Peran semantik, bukan tampilan; perataan `:---:` tetap dibuang |
| 4 | `?validate=1` | Wajib `target`; memakai `dryRunChapter` yang sama dengan R08 dan ember laju R08; galat 4xx layanan -> `dryRun.valid=false`, 401/403 tetap HTTP |
| 4 | Route memakai helper privat `validate/_shared/{route-kit,validate-rate}` | Mengikuti preseden route R12 (`chapters/_shared/submit-kit.ts`) |
| 3 | TDD: slice 1 merah lalu hijau; batch uji berikutnya ditulis sesudah implementasi awal (bukan merah murni); kasus `TABLE_SOURCE_MISSING` merah -> hijau | Dicatat jujur |
| 3 | Tabel bercaption tanpa `Sumber:` lolos skema tetapi ditolak gerbang DATUM-10 saat kirim (terbukti di dry-run bab 4 Hermes) | Peringatan dini `TABLE_SOURCE_MISSING` (uji merah -> hijau) |
| 3 | Uji adversarial menemukan pindaian kuadratik dan luapan tumpukan pada inline | Memo kegagalan + pasangan kurung O(n) + batas sarang 24; diulang linear |
| - | Panduan agen `docs/STUDIO-AGENT-GUIDE.md` belum menyebut importer (di luar area baris ini) | Saran: baris dokumentasi menambah §5.x "Dari Markdown" |

## Next Steps
- Review recommended: `senior-code-reviewer` + `security-review` atas `src/lib/studio/services/import/**`, `src/app/api/studio/import/**` (route baru menghadap agen; pengurai regex atas masukan hingga 5 MiB).
- Dokumentasi importer di panduan agen (baris pemilik panduan).

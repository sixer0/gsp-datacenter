---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-HR1
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/delegation_progress/final_phase_brief.md (pengecualian baris: mengubah kode di area eksklusif); gateway_check/10d_security_hermes_batch.md (H-01); gateway_check/09d_review_hermes_batch.md (C2)
status: complete
---

# FIX-HR1: importer Markdown linear + batas + laju (H-01), details dry-run (C2), peran retoris eksplisit

Skill: tdd, security-and-hardening (standar), dry-run-verify-fix. Klaim: `file_claims.md` baris FIX-HR1.

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief akhir, 10d (H-01), 09d (C2), catatan FIX-H7, DOC-3, panduan agen 4.2/5.6 | complete | |
| 2 | Baseline 10 bab nyata Hermes (keluaran importer lama, JSON per bab) | complete | Disimpan di scratchpad sebelum perubahan apa pun |
| 3 | H-01: jalur kuadratik + batas + laju | complete | lihat Changes |
| 4 | C2: pemeta isu R08 bersama | complete | |
| 5 | Konvensi peran `<!-- role: X -->` | complete | |
| 6 | Uji unit, tsc, eslint, vitest studio, asap :9021, byte 10 bab | complete | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/services/import/inline.ts | modify | `TextBuf` (potongan array) menggantikan `buf` string: penanganan `\n` (dua spasi = br, pangkas spasi/tab) tanpa regex `$` atas penyangga yang tumbuh (akar H-01, `inline.ts:289-294` lama). `TAG_RE` `\s+[^<>]*?` -> `\s[^<>]*?` (setara, tanpa backtracking). Komentar `<!--` inline lewat `commentEnd` (indexOf + memo kegagalan) |
| src/lib/studio/services/import/lexer.ts | modify | `atxHeading()` tanpa regex (semantik identik regex lama, termasuk `## ##` dan U+2028, dibuktikan fuzz 20.000 baris); `trimEndSpTab()` menggantikan `/[ \t]+$/` pada paragraf; HTML jenis 7 `\s+[^<>]*` -> `\s[^<>]*` |
| src/lib/studio/services/import/markdown.ts | modify | Batas: `MD_IMPORT_MAX_CHARS` 4.000.000 -> 1.000.000, `MD_IMPORT_MAX_LINES` 200.000, `MD_IMPORT_MAX_BLOCKS` 50.000, `MD_IMPORT_MAX_TABLE_COLUMNS` 100, `MD_IMPORT_MAX_BODY_BYTES` 4 MiB -> 413 `PAYLOAD_TOO_LARGE` `details { pointer:"/markdown", reason, limit, actual, line? }`; pengisian sel tabel sekali (dulu salin larik per sel = O(kolom^2)); komentar di blok HTML hanya sampai `-->` terakhir; laporan berbatas 1.000 entri per daftar + `REPORT_TRUNCATED`; peran paragraf `<!-- role: X -->` |
| src/lib/studio/services/import/index.ts | modify | Ekspor konstanta batas |
| src/app/api/studio/import/markdown/route.ts | modify | `issuesFromError` diimpor dari `validate/_shared/error-issues.ts` (salinan lama dihapus; C2); `checkImportRate` dihitung untuk SETIAP panggilan sebelum badan dibaca; `readJsonObject` dengan `limit: MD_IMPORT_MAX_BODY_BYTES` |
| src/app/api/studio/import/markdown/_lib/import-rate.ts | add | Ember laju impor sendiri (pola FIX-1/validate-rate: `createFixedWindowLimiter`, `renderRateIdentity`, 429 `RATE_LIMITED` + `Retry-After`); bawaan 60/60 dtk; env `STUDIO_IMPORT_RATE_LIMIT`, `STUDIO_IMPORT_RATE_WINDOW_MS` |
| tests/unit/studio/import/fixhr1-perf.test.ts | add | 21 uji performa/kedalaman |
| tests/unit/studio/import/fixhr1-limits-role.test.ts | add | 15 uji batas 413, laporan berbatas, kesetaraan ATX, peran |
| tests/unit/studio/import/fixhr1-route.test.ts | add | 8 uji route: 429, ember per identitas, ember terpisah dari R08, 413 badan, 413 baris, 401, C2 details/checkId |

`scripts/studio/md2chapter.ts` tidak perlu diubah (galat 413 baru tercetak lewat jalur `StudioEngineError` yang ada; exit 2). Kontrak dan `validate/_shared/**` tidak diubah (hanya diimpor).

## Konvensi peran retoris untuk DOC-3 (`md/v1`)

Komentar HTML sebaris sendiri TEPAT sebelum paragraf:

```markdown
<!-- role: closingAction -->
Tim pemeliharaan menyetujui penggantian PMT gardu C sebelum 15 November 2026.
```

- Nilai: delapan `PARAGRAPH_ROLES_V2` (`body`, `lede`, `note`, `subheading`, `identity`, `anchor`, `pivot`, `closingAction`), peka huruf; spasi di sekitar `role` dan `:` bebas (`<!--role:pivot-->` sah). Baris kosong antara penanda dan paragraf boleh. Berlaku di `intro` maupun section; rel `[TERUKUR]` di awal paragraf tetap jalan.
- Alasan memilih komentar (bukan `{.closingAction}`): komentar tidak pernah tampil di penampil Markdown mana pun dan importer lama membuangnya (`HTML_COMMENT`), jadi penanda tidak bocor sebagai teks; atribut kurung kurawal akan tercetak literal di penampil/importer lain.
- Tanpa tebakan: nama tak dikenal (termasuk beda huruf, mis. `closingaction`, atau peran tampilan `kicker`) -> peringatan `ROLE_UNKNOWN`, paragraf tanpa role, komentar tercatat `dropped HTML_COMMENT`. Penanda yang tidak diikuti paragraf biasa (daftar, tabel, judul, gambar, caption/sumber yang dikonsumsi tabel, akhir berkas, atau penanda kedua berturut-turut) -> `ROLE_MARKER_UNATTACHED` (baris = baris penanda), tidak diterapkan ke blok lain. Penanda di dalam paragraf -> `ROLE_MARKER_INLINE`, diabaikan (komentar tetap dibuang).
- Tanpa penanda keluaran tidak berubah (10 bab Hermes byte sama). Panduan 5.6 kalimat "Peran retoris ... tidak dinyatakan di Markdown" perlu diganti DOC-3.

Hal lain untuk DOC-3 (5.6, 12, API-REFERENCE): 413 kini membawa `details.reason` (`MD_TOO_LONG` 1.000.000 karakter, `MD_TOO_MANY_LINES` 200.000, `MD_TOO_MANY_BLOCKS` 50.000, `MD_TABLE_TOO_WIDE` 100 kolom + `line`); badan maks 4 MiB (413 transport); setiap panggilan dihitung ember impor 60/menit (429 + `Retry-After`), `?validate=1` juga tetap dihitung ember R08; isu `dryRun` membawa `details`/`checkId` seperti R08; laporan dibatasi 1.000 entri per daftar + `REPORT_TRUNCATED`.

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit importer | `npx vitest run tests/unit/studio/import` | 4 files, 66 passed | 22 lama + 44 baru |
| Unit studio penuh | `npx vitest run tests/unit/studio` | `Test Files 86 passed (86)`, `Tests 2311 passed / 1 skipped (2312)` | 0 gagal |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 | |
| Lint area | `npx eslint src/lib/studio/services/import src/app/api/studio/import scripts/studio/md2chapter.ts tests/unit/studio/import` | exit 0 | |

## Verification
- **H-01 performa** (sebelum: uji 100k baris "a\n" MERAH 29,9 s di vitest; probe SR-57 7,7 s): sesudah, semua kasus `fixhr1-perf` < 1 s, termasuk 100k baris, 100k baris br/tab, deret spasi ~990k pada judul ATX/tag/HTML jenis 7/paragraf, `<!--` beruntun, tanda tak berpasangan, daftar/kutipan ~990k; uji rasio 4x masukan; sarang dalam `<b>` x100k, `*` x200k, `[` x200k, `~~` x100k tanpa luapan tumpukan. Probe 40 pola (tsx, 100k unit): terlama `table` 393 ms, `starsNested` 362 ms. Pada batas 1.000.000 karakter: `starsNested` 593 ms, `unders` 433 ms, `table` 363 ms, sisanya < 200 ms (sebelum penurunan batas, 4 MB `starsNested` = 1,78 s; itu alasan batas diturunkan).
- **413/429 unit**: `fixhr1-limits-role` (empat `reason`), `fixhr1-route` (429 setelah N dengan `Retry-After` > 0 dan `details.retryAfterSec`; agentId badan berbeda tetap ember sama; impor biasa tidak memakan kuota R08; badan > 4 MiB 413; 200.000+ baris 413 `MD_TOO_MANY_LINES`; tanpa kredensial 401).
- **C2**: `fixhr1-route` memeriksa `dryRun.issues[0].details` = objek SCOPE_CONFLICT lengkap (`overwrittenPids`, `forwardToController`) dan `checkId` DATUM-10. Bukti merah: route sementara dengan pemeta lama -> `Tests 2 failed | 6 passed`; dengan pemeta bersama -> 8 passed (berkas dikembalikan).
- **Asap :9021** (rahasia uji dibaca dari berkas, tidak dicetak): tanpa rahasia 401; penanda `closingAction` -> `role` di blok, `kicker` -> `ROLE_UNKNOWN`, `valid=true`, header `x-correlation-id` ada; 200.001 baris -> 413 `{"reason":"MD_TOO_MANY_LINES","limit":200000,"actual":200002}` (0,013 s); tabel 101 kolom -> 413 `MD_TABLE_TOO_WIDE` `line:5`; 100k baris -> 200 dalam 0,038 s; judul ATX + 990k spasi -> 200 dalam 0,056 s; badan 4,3 MB -> 413; `?validate=1` bab 4 Hermes ke dokumen `cmvucp1d70002v13c945whd78` -> `dryRun.valid=false`, `SCOPE_CONFLICT reason=PATCHED_PIDS_OVERWRITTEN overwrittenPids=["4.2.1","4.3.1"]`, `forwardToController` ada; 70 impor beruntun -> `53 x 200`, `17 x 429` (7 panggilan sebelumnya di jendela yang sama; total 60), `retry-after: 33`; log tahan lama `data/studio-workspace/logs/api/studio-api-2026-10-30.jsonl` memuat 18 baris `RATE_LIMITED` `"limiter":"import"` dengan correlationId.
- **10 bab nyata Hermes** (naskah `EOS360-1028/output/naskah-gabungan-rakit.md`, baca saja; skrip scratchpad `hr1/hermes10.ts`): `chapters=10 valid=10`, 0 isu; JSON per bab sesudah perubahan vs baseline sebelum perubahan: `byte-identical=10/10`. CLI pada `Temp/fixh7/bab{3,4,4_src,5,6}.md`: semua `valid=true issues=0`.
- CLI dengan 200.001 baris: `md2chapter: PAYLOAD_TOO_LARGE: markdown has 200002 lines ...`, exit 2.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | | | | |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 3 | `MD_IMPORT_MAX_CHARS` 4.000.000 terlalu besar untuk konversi sinkron di event loop (pola terburuk linear tetap 1,78 s) | Diturunkan ke 1.000.000 (seluruh naskah 10 bab = 216 KB); badan route 4 MiB. Perlu dicatat controller (perubahan batas yang terdokumentasi DOC-3 hanya sebagai "413") |
| 3 | Batas baris/blok/kolom | 200.000 baris (memungkinkan uji 100k), 50.000 blok, 100 kolom (kontrak 1..20 tetap peringatan `TABLE_TOO_WIDE`); semua 413 `PAYLOAD_TOO_LARGE` + `details.reason` (tanpa kode enum baru; kontrak bukan area baris ini) |
| 3 | Respons dapat membengkak oleh ribuan entri `dropped` (mis. 700k `<span>`) | Laporan dibatasi 1.000 entri per daftar + satu `REPORT_TRUNCATED` |
| 3 | Ember laju | Ember `import` sendiri 60/menit per identitas terautentikasi, dihitung sebelum badan dibaca (identitas laju tidak bergantung agentId); `?validate=1` tetap juga ember R08. Helper ditaruh di `import/markdown/_lib/` (area baris), mengikuti pola `validate-rate.ts` |
| 3 | Worker thread / batas waktu (saran opsional H-01) | Tidak dikerjakan: dengan batas baru konversi terburuk < 0,6 s; worker = perubahan arsitektur |
| 5 | Pilihan konvensi peran | Komentar `<!-- role: X -->` sebaris sendiri (tidak bocor); lihat seksi konvensi |
| 6 | TDD jujur | Irisan performa: merah (29,9 s) lalu hijau. C2: merah diverifikasi dengan menukar pemeta lama sementara. Uji batas/peran/kesetaraan ATX ditulis sesudah implementasi (bukan merah murni) |
| - | Panduan agen 5.6 dan API-REFERENCE belum menyebut konvensi peran, `reason` 413, ember impor | Untuk DOC-3 (di luar area baris ini) |

## Next Steps
- Review recommended: `senior-code-reviewer` + `security-review` atas `src/lib/studio/services/import/**` dan `src/app/api/studio/import/**` (penutupan H-01 dan C2).
- DOC-3: perbarui panduan 5.6/12 dan API-REFERENCE sesuai seksi konvensi di atas.

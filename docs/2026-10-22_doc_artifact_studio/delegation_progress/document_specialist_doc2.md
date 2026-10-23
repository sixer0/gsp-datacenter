# Catatan document-specialist DOC-2 (D-275; D-247, D-255, D-257/D-259, D-260, D-261, D-263/D-269, D-268, D-271, D-272, IP-63, IP-65/SUB-1, IP-69)

Status: complete (bukti di bawah). Tanggal 2026-10-23. Skill: document-quality-standards (modul D, E, F, H). Klaim DOC-2 di `file_claims.md` (ditulis atomik). Semua tulisan atomik: berkas sementara di folder yang sama lalu `os.replace`, pola diganti di memori dengan assert tepat-satu (`C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc2/atomic_apply.py`); salinan sebelum edit di folder yang sama (`*_before.md`).

## Berkas
| Berkas | Ukuran | Perubahan |
|---|---|---|
| `docs/STUDIO-AGENT-GUIDE.md` | 77.077 B | §0/§1 build hanya R17 + `RENDER_FIELD`; §4 medan bersama tanpa `render`, R04 `target.documentId` + `baseRevisionNo`, meta isi-bila-kosong, `lastFilledBy` dari identitas; §4.1 lebar turunan kertas + axis templat + DF-70/71; §5.2 contoh tanpa `render`, respons tanpa `job`/`outputs`; §5.5 baru R08 dry-run (`completenessPreview`, `submitPreview`); §8 tabel + §8.2 baru contoh DITOLAK `RENDER_FIELD` + respons; §9 tabel PATCH tanpa `render`, change 2.000, E3c tanpa `render` + panggilan R17; §10 kuota aset 512 MiB/2 GiB + `STORAGE_WRITE_FAILED`; §12 galat (`RENDER_FIELD`, `META_CONFLICT`, `PID_CONFLICT`, `BY_CONSTRUCTION_FAILED` pointer badan + `mergedPointer`, DATUM-04 `?`, 429 kuota, 503); §13 change 2.000/4.000; §14 v1 tanpa build; §15 `image.rasterDpi`, `chart.kind.<KODE>.axis`, `draftTemplate`; §16 R08/R17 |
| `docs/API-REFERENCE.md` (§12 saja) | 30.545 B | prinsip build R17; checkId `RENDER_FIELD` + `mergedPointer`; urutan galat (pid sebelum idempoten, gerbang by-construction bersama, meta, `lastFilledBy`); batas render + kuota aset; kelengkapan tanpa `renderRefused`; `SubmitResultV2` tanpa job/outputs; baris R04, R06, R08, R12, R13, R14, R16, R18; catatan status R06/R07; paragraf figur DF-63..DF-71, axis, lebar turunan |
| `masterplan/03_structural_sections_specs.md` | 135.680 B | DF-01..DF-71 (:35, PT-01); KD-27 DIGANTIKAN D-247; §3.5 rujukan berkas `prisma/rollback/` + sha + runbook; §4.3 catatan chart (IP-59 ditutup D-268, DF-70/71); T2-46/47/48 tanpa `render` (+ SUB-1 target); §5.1 DF-70/71 + hitungan 52 + 19; VF-09 pengganti = `forbidden.ts`; §11.1 butir 2/3/7/9/11; EC17; §11.3 `RENDER_FIELD` + pointer badan; §12 R04, R06, R08, R12, R13, R14, R16, R18; T2-60c; AD-03 DIGANTIKAN; C30; §18 hitungan |
| `docs/STUDIO-ROLLBACK-RUNBOOK.md` (baru) | 10.511 B | berkas SQL + sha, larangan, prasyarat, cadangan WAJIB (pg_dump penuh + 18 tabel Studio), tingkat 1, verifikasi, tingkat 2, verifikasi, pemulihan `migrate deploy` + data, tabel kegagalan |
| `prisma/rollback/01_rollback_studio_structure_delta.sql` (baru) | 1.452 B | blueprint `05:188-210` apa adanya; sha256 `10549a93000c6d944f100c587cf16fd502eebbf46f09cf9f0eb2e49383f0294f` = sha gladi SR-53 |
| `prisma/rollback/02_rollback_studio_base.sql` (baru) | 1.044 B | `01_specs` §1.4 apa adanya; sha256 `a28a7a15c12caaa156954f767f1249110ed4521f1bd24d44f159c98bed8fe8e1` = sha gladi SR-53 |

## Klaim vs kode
| Klaim | Sumber | Cocok |
|---|---|---|
| `render` di badan = 400 `SCHEMA_INVALID` `RENDER_FIELD`, pointer `/render`, pesan = `RENDER_FIELD_MESSAGE` | `contract/schema/v2/forbidden.ts:183-193`, `:504`; `services/revisions/v2/body.ts:147-149` (PATCH) | ya (uji) |
| SID01-03 tanpa properti `render` | `schema/v2/doc.schema.ts:47`, `chapter.schema.ts:29`, `slot.schema.ts:30` | ya (uji) |
| kiriman v2 tanpa job/outputs; v1 `job: null, outputs: []` | `app/api/studio/documents/route.ts:28-41`, `:384-385`; `services/ingest/v2.ts:576` | ya |
| R06 PATCH 200 `{ revision, addressMap, job: null, outputs: [] }` | `app/api/studio/documents/[id]/blocks/[address]/route.ts:6`; `contract/types/api.ts:201-207` | ya |
| R16 respons tanpa job/outputs | `paragraphs/[pid]/route.ts:8-11` | ya |
| R04 `target.documentId` + `baseRevisionNo`, target lain 400 `DOC_TARGET_AMBIGUOUS` | `services/submit/targeting.ts:28-36`; `coder_execution_sub1.md` | ya |
| R08 `submitPreview` medan | `app/api/studio/validate/route.ts:100-119`, `:274-287` | ya |
| `mergedPointer` di `ValidationIssue` | `contract/types/api.ts:37-38` | ya |
| DF-70/DF-71 + reason; 52 + 19 = 71 | `forbidden.ts:125-126` | ya (uji) |
| VF-09 pengganti | `forbidden.ts:163` | ya (uji) |
| change v2 maks 2.000; PATCH alamat v1 4.000 | `revisions/v2/body.ts:37`, `schema/v2/common.schema.ts:41,354`; `revisions/index.ts:73` | ya (uji); dulu panduan menulis 4.000 untuk semua (koreksi) |
| kuota aset 512 MiB sesi / 2 GiB internal / disk 2 GiB, 429 `asset_quota_exceeded`, 500 `insufficient_disk_space` | `services/images/asset-store.ts:24-40`, `:78-80` | ya (uji konstanta) |
| `image.rasterDpi` int 72..600 bawaan 150, lanjutan | `params/render.ts:310-318`; `registry/essentials.ts:99` | ya |
| `chart.kind.<KODE>.axis` ParamDef templat | `registry/charts.ts:472-484` (+ P-13/P-14/S-01, D-268) | ya |
| 68 kode galat | `contract/enums.ts:253-331` | ya (uji) |
| pesan kelengkapan tidak berubah | `services/completeness/texts.ts:125,150,161,183` | ya |

## Bukti
- `verify_doc2.ts` (`C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/doc2/`, `npx tsx` dari root repo): exit 0, 81 PASS, 0 FAIL, "SEMUA LULUS" (`doc2/verify.txt`). Isi: 12 contoh panduan lolos (8 skema isi lewat `validateV2Against`, 2 pid-patch lewat `parsePatchPidBody` sesudah `agentId` dibuang seperti route, 2 render lewat `parseRenderBody`), 2 contoh DITOLAK sesuai checkId (DISPLAY_FIELD, RENDER_FIELD), 3 dilewati (structure-patch, asset-upload, fragment: validator lain); respons contoh `RENDER_FIELD` = keluaran pemeta kontrak; RENDER_FIELD di doc/chapter/slot/PATCH pid; DF-63..DF-71 per lokasi; hitungan 71; klaim register/API; konstanta; sha berkas rollback = gladi; berkas 01 = blueprint 05:188-210; 18 tabel pg_dump = 18 model `schema.prisma`; tanpa emoji di empat dokumen.
- Satu kegagalan pertama terdeteksi dan diperbaiki: baris R14 API masih memuat `render?`.
- `verify_doc1.ts` dijalankan ulang: 3 FAIL usang yang diharapkan (hitungan 69 → kini 71 sejak IP-63; dua frasa "DF-63..DF-69" kini "DF-63..DF-71"); digantikan cek setara di `verify_doc2.ts`.

## Temuan untuk controller
1. Tipe kontrak `SubmitResultV2` (`contract/types/v2/api.ts:48-51`) masih memuat `job?`, `outputs?`, `renderRefused?` walau kiriman tidak lagi mengisinya (D-247); dokumen menandainya "sisa usang". Pembersihan = pemilik kontrak.
2. Komentar kepala R16 (`paragraphs/[pid]/route.ts:18-20`) masih menyebut "render bersyarat kelengkapan" dan 503 antrean; perilaku sudah tanpa render. Kosmetik, pemilik route.
3. R06 PATCH masih jalur S56 (tanpa `pid`/`completeness`, `409 REVISION_CONFLICT`); register mencatat target vs kode saat ini.
4. Runbook: perintah `pg_dump`/`pg_restore` adalah prosedur standar yang BELUM digladikan (gladi SR-53 memakai cadangan JSON); runbook menyatakannya dan meminta percobaan pulih di DB uji.
5. Baris keputusan historis KC-8 di register masih menyebut `renderRefused` (catatan keputusan, tidak diubah).

## Revisi D-286 (siklus review 1 -> 2)
Sumber: `review/document_review_doc2.md` (R-1, R-2, F-1..F-7), `test/08_rollback_rehearsal.md` §9.1 (RB-1..RB-8). Tulis atomik seperti di atas; salinan runbook sebelum revisi `doc2/runbook_before_doc2r.md`.
- Runbook ditulis ulang (15.363 B): R-1 teks persis di baris 3 dan butir pertama Larangan (izin "rollback produksi dengan gladi ulang" dihapus); R-2 satu URL `STUDIO_RB_URL` (dibaca `read -rsp`, tidak masuk riwayat) + `STUDIO_RB_DB`, fungsi `rb_guard` (`psql "$STUDIO_RB_URL" -At -c "SELECT current_database();"`, berhenti bila beda atau `gsp_agent_hq`) mendahului SETIAP perintah DB (`rb_guard && ...`), Prisma selalu `DATABASE_URL="$STUDIO_RB_URL"` + cek kedua baris `Datasource` di `migrate status`; RB-1 peringatan FK melingkar `StudioTemplateVersion` diharapkan, `--disable-triggers` wajib (superuser); RB-2 `counts.sql` + `psql -At -F '|' -f ... > counts_*.txt` + `diff`; RB-3 psql konkret `-At -c`; RB-4 `--dbname="$STUDIO_RB_URL"`; RB-5 PG17 `/c/Program Files/PostgreSQL/17/bin` + cek `server_version`; RB-6 Git Bash; RB-7 Opsi A penuh tanpa `migrate deploy`, Opsi B data-saja wajib `migrate deploy` lalu `pg_restore`; RB-8 arsip workspace belum digladikan; stempel berkas `STUDIO_RB_TS` menggantikan placeholder `<YYYYMMDD-HHMM>`. `bash -n` atas 18 blok bash: OK.
- F-1 diverifikasi ke kode per rute: kiriman v2 2.000 (`common.schema.ts:354`); PATCH pid 2.000 (`v2/body.ts:206`); PATCH struktur: route cek 4.000 (`structure/route.ts:126`) tetapi layanan `parsePatchStructureBody` -> `requireChangeV2` 2.000 (`v2/body.ts:288`), probe: 2.001 dan 4.000 -> `SCHEMA_INVALID maxLength "maksimal 2000"`, jadi efektif 2.000 (temuan reviewer "4.000" hanya tingkat route); PATCH alamat 4.000 (route; `patchAddressV2` tidak memeriksa ulang). Ditulis tepat di §13 panduan.
- Temuan tambahan saat verifikasi F-1: R06 PATCH pada dokumen v2 memakai jalur pid (`revisions/index.ts:356-364`, `v2/service.ts:389-449`): respons R16 + `job: null, outputs: []`, konflik `SCOPE_CONFLICT`; v1 tetap `{ revision, addressMap, job: null, outputs: [] }` + `REVISION_CONFLICT`. API §12 (baris R06 + catatan status) dan register R06 dikoreksi.
- F-2 `image.rasterDpi` 150..600 (`params/render.ts:313`, D-281); axis S-02..S-04 kini ParamDef (`registry/charts.ts`, FIX-A2) dan disebut. F-3 slot `/payload` (panduan, API R13, register §11.1 dan R13). F-4 429 = kuota bersama 30/60 untuk kiriman, PATCH, render, render ulang, artefak, validate `?preview=html` (+ saran jeda antar bab). F-5 503 termasuk R09. F-6 pengecualian HTTP R08: 401, 403, 413, 415, 400 `JSON_MALFORMED`, 429 `?preview=html` (`validate/route.ts:103` HARD_CODES + transport). F-7 `STORAGE_WRITE_FAILED` dipisah: render (isi tersimpan, render ulang) vs unggah/kiriman aset (tidak tersimpan, lapor operator).
- Bukti: `verify_doc2.ts` diperluas (cek R-1, R-2, RB-1..RB-8, F-1..F-7, R06) -> exit 0, 104 PASS, 0 FAIL, "SEMUA LULUS". Kegagalan antara yang diperbaiki: `/payload...` tersisa di baris R13 API/register; cek lama judul seksi runbook (penomoran berubah).

## Tutup Minor siklus 2 (D-291)
- N-1: R08 punya kuota validasi tersendiri untuk SETIAP panggilan, bawaan 120/60 s (`validate/_shared/validate-rate.ts:22-23`, env `STUDIO_VALIDATE_RATE_LIMIT`/`_WINDOW_MS`), `?preview=html` juga di kuota render 30/60; teks "429 hanya ?preview=html" diganti di panduan §5.5, API (paragraf batas + baris R08), register R08.
- N-2: runbook menulis semua `.dump` dan `counts*` ke `$STUDIO_RB_DIR` di LUAR repo (contoh `C:\Users\<user>\studio-rollback\`), peringatan jangan simpan di root/di dalam repo, penjaga `git rev-parse --show-toplevel`; perintah tetap dijalankan dari root repo.
- N-3: §15 panduan + register R08: draf di luar hak simpan = `valid:false`, isu `keyword` = kode galat simpan (`PARAM_CLASS_K_FORBIDDEN`, `PARAM_SURFACE_FORBIDDEN`) berpointer kunci draf (`validate/_shared/template-draft.ts:165-183`).
- Bukti: `verify_doc2.ts` 108 PASS, 0 FAIL; `bash -n` 19 blok runbook OK. Tulis atomik (temp + `os.replace`); salinan runbook sebelum N-2 `doc2/runbook_before_n2.md`.

---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: FIX-S3
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-342 S3, D-343; D-191 R20)
status: complete
---

# Catatan FIX-S3: keluaran R20 `GET /content` dapat dikirim balik apa adanya (Hermes S3)

## Diagnosis (akar masalah 400 `16a0202a`)

Premis D-342 ("medan `id` hasil GET content ditolak skema kiriman") TIDAK terbukti:

- Kontrak sudah menerima pid sebagai `id` di bab, section, dan blok (`src/lib/studio/contract/schema/v2/common.schema.ts:54` `BLOCK_ID = { id: pid }`, `:519` SectionV2, `:524` ChapterV2); KD-13 (register 03 baris 106) mewajibkan kiriman ulang dengan/tanpa pid dari R20 = `unchanged`; aturan pencocokan (register 03 baris 782) mengklaim pid klien lebih dulu.
- Reproduksi lokal terhadap `schemaIssues` R12 (`src/app/api/studio/chapters/_shared/submit-kit.ts:57`): isi `notes/content4b.json` Hermes (GET content rev 9) dibungkus amplop -> `[]` (lolos).
- Payload yang benar-benar dikirim Hermes (`Temp/hermes_trial/retrial/step_c2_recovery.py:28-39`) adalah bab LAMA `state.ch4` (tanpa `id`) yang blok jangkarnya diberi `text` baru padahal `runs` lama masih ada. Isolasi: `textOnly` -> isu `oneOf` di `/chapter/sections/2/blocks/0`; `role`/`rail` saja -> `[]`. Jadi 400 = `text` DAN `runs` bersamaan (oneOf paragraf), bukan `id`. Log JSONL server (`data/studio-workspace/logs/api/studio-api-2026-10-30.jsonl`, corr 16a0202a) hanya mencatat `SCHEMA_INVALID` tanpa details; pesan respons `must match exactly one schema in oneOf` tidak menyebut sebabnya, sehingga Hermes salah menafsirkan.

## Opsi yang dipilih (teraman, tanpa ubah kontrak)

Desain kontrak tidak memisahkan identitas (nama medan `id` sudah benar; mengganti ke `pid` justru memecah kontrak dan KD-13). Yang kurang: amplop kiriman dan petunjuk. Ditambahkan mode aditif `?shape=submission` di R20:

- `GET …/content?chapter=<k>&shape=submission[&agentId=<a>]` -> 200 `{ document, revisionNo, slot, shape, submitTo: "POST /api/studio/chapters", submission, editHints }`; `submission` = badan `studio.chapter/v2` lengkap (`$schema`, `agentId?`, `target.documentId`, `slot`, `baseRevisionNo` = revisi yang dibaca, `chapter` berpid).
- `?slot=<s>&shape=submission` (slot tak-berulang) -> `submitTo: "POST /api/studio/slots"`, `submission` = `studio.slot/v2`; slot kosong -> `submission: null`.
- Slot berulang tanpa `chapter` -> 422 `SLOT_USE_CHAPTER_ENDPOINT` `{ slotKey, use, chapters: [kunci] }`. Dokumen penuh -> 400 `SCHEMA_INVALID` `/query/shape` `dependentRequired` (studio.doc/v2 tidak punya bentuk kiriman lingkup). `shape` lain -> 400 `/query/shape` `enum`; `agentId` tanpa `shape=submission` atau di luar 1..80 -> 400 `/query/agentId` (pola `/query/<nama>` mengikuti `templates/route.ts:197`).
- `editHints` (awam): kirim apa adanya; pertahankan `id`; blok baru tanpa `id`; `text` ATAU `runs`, tidak keduanya; arti `baseRevisionNo` dan 409.
- Bawaan `shape=content` tidak berubah (bentuk lama byte-sama).

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca brief fase akhir, laporan retrial S3, FIX-H2, D-191, D-342/D-343, kontrak v2 | selesai | |
| 2 | Reproduksi 400 Hermes secara lokal | selesai | akar = `text`+`runs`, bukan `id` |
| 3 | Klaim berkas (`file_claims.md`, baris FIX-S3, atomik) | selesai | |
| 4 | `submission.ts` + `sectionType` di proyeksi + route | selesai | |
| 5 | Uji unit murni + uji rute DB v21 | selesai | |
| 6 | Asap HTTP :9021 | selesai | 18/18 |
| 7 | Gerbang vitest / tsc / eslint | selesai | |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| `src/lib/studio/services/structure/submission.ts` | add | `toSubmissionShape` (murni), `CONTENT_SHAPES`, `CHAPTER_SUBMIT_TO`, `SLOT_SUBMIT_TO`, `SUBMISSION_EDIT_HINTS` |
| `src/lib/studio/services/structure/snapshot.ts` | modify (aditif) | `ContentProjection.sectionType?`; diisi untuk proyeksi slot dan bab |
| `src/lib/studio/services/structure/index.ts` | modify | ekspor modul `submission` |
| `src/app/api/studio/documents/[id]/content/route.ts` | modify | parameter `shape` + `agentId`, validasi `/query/*`, cabang `shape=submission`; kepala modul diperbarui |
| `tests/unit/studio/structure/fixs3-submission-shape.test.ts` | add | 6 uji murni (lolos skema R12/R13, pid utuh, salinan dalam, slot kosong, 422 slot berulang, regresi akar Hermes text+runs) |
| `tests/unit/studio/api-structure/fixs3-content-roundtrip.test.ts` | add | 6 uji rute di DB v21 (harness SR-45, 0 sisa) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit murni | `npx vitest run tests/unit/studio/structure/fixs3-submission-shape.test.ts` | `Tests 6 passed (6)` | |
| Rute DB v21 | `npx vitest run tests/unit/studio/api-structure/fixs3-content-roundtrip.test.ts` | `Tests 6 passed (6)` | afterAll: residue `{docs:0,assets:0,templates:0,jobs:0}`, hitungan sebelum = sesudah |
| Suite studio | `npx vitest run tests/unit/studio` | `Test Files 1 failed / 90 passed (91)`, `Tests 3 failed / 2372 passed / 1 skipped (2376)` | 3 gagal semuanya di `renderers/fix2-wrapper-text-parity.test.ts` (daftar isi kini memuat `1.1`, `1.2`, ...): efek perubahan TOC per bagian FIX-T2 (klaim baris 1019), bukan area FIX-S3; uji itu tidak mengimpor berkas FIX-S3 |
| tsc repo | `npx tsc --noEmit -p .` | exit 0, 0 galat | |
| eslint area | `npx eslint "src/app/api/studio/documents/[id]/content" src/lib/studio/services/structure tests/.../fixs3-*.test.ts` | exit 0, 0 temuan | |
| Asap HTTP :9021 | `FIXS3_SECRET=$(cat .../trial_internal_secret) npx tsx --tsconfig tsconfig.json <scratchpad>/fixs3/fixs3_smoke.ts` | `RESULT pass=18 fail=0` | rahasia lewat env, tidak dicetak; DB diverifikasi `gsp_agent_hq_v21`; fixture dihapus (kaskade), 0 dokumen/0 job sisa, jumlah dokumen kembali |

## Verification (asap :9021)
- GET content bawaan (bab berpid) + amplop minimal -> 200 `unchanged` (bukti `id` diterima).
- GET `shape=submission` -> kirim balik tanpa ubahan -> 200 `unchanged`, 0 revisi baru.
- Ubah satu paragraf di `submission` -> 201; pid paragraf tetap di 4.1.3; daftar seluruh pid bab sama sebelum/sesudah (tanpa pid baru/pensiun).
- Alur pulih C2: PATCH pid jangkar (agen 2) -> kiriman usang 409 `SCOPE_CONFLICT` menyebut pid jangkar -> GET `shape=submission` (base = revisi PATCH), gabung paragraf lain -> 201 tanpa 400; "93 menit" bertahan, pid jangkar tetap; diulang -> 200 `unchanged`.
- Slot `controlSheet` `shape=submission` -> POST /api/studio/slots apa adanya -> 200 `unchanged`.
- Galat: `shape=x` 400 `/query/shape`; dokumen penuh 400; `slot=content` tanpa bab 422 `SLOT_USE_CHAPTER_ENDPOINT` `chapters ["4"]`.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 3 uji `renderers/fix2-wrapper-text-parity.test.ts` gagal | 0 (bukan area) | ekspektasi TOC bab-saja vs perilaku baru FIX-T2 (TOC per bagian) | diserahkan ke FIX-T2 | tidak untuk FIX-S3 |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Premis D-342 S3 (`id` ditolak) tidak terbukti; 400 Hermes = `text` + `runs` bersamaan | dicatat dengan bukti reproduksi; usul controller memperbarui catatan D-342 |
| 4 | Ganti nama `id` -> `pid` ditolak sebagai opsi: memecah kontrak v2, KD-13, dan semua klien yang sudah memakai `id` | mode aditif `?shape=submission`, kontrak tidak diubah, tanpa file_requests |
| 4 | `baseRevisionNo` = revisi yang dibaca (bukan terbaru) | benar terhadap aturan FIX-H2 (acuan lingkup); `?rev=n` lama menghasilkan base n sehingga konflik tetap terdeteksi |
| 4 | Badan `submission` tidak membawa `assets`/`register` | merge memakai aset/register dokumen yang ada (`compose/merge.ts:304-315`, `doc.assets` tergabung); tidak perlu |
| 4 | Usul (di luar area, pemilik kontrak/submit-kit): pesan `SCHEMA_INVALID` untuk `oneOf` paragraf terlalu umum; sebutkan "text dan runs tidak boleh bersamaan" di `classifySchemaV2Errors` | usul baris lanjutan; sekarang ditutup lewat `editHints` |

## Next Steps
- DOC-4: dokumentasikan `?shape=submission` (+ `agentId`, galat 400/422) di register R20 (03 baris 909), `docs/API-REFERENCE.md`, panduan agen §5.3 (alur baca-gabung-kirim + hasil sah 200 `unchanged`), dan aturan `text` ATAU `runs`.
- Review recommended: `src/lib/studio/services/structure/submission.ts` + cabang `shape` di route R20.

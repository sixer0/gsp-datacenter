---
task_id: R2-F1
task_slug: doc_artifact_studio
row: R2-F1 (D-424 #3 + #4, D-426)
date: 2026-10-31
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-424, D-426); gateway_check/14_review_security_r2.md #3, #4
status: complete
---

# Implementation Report: R2-F1 registri (contoh tanpa ID nyata; bentuk details REGISTRY_KIND_UNKNOWN)

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | #3 target contoh bukan dokumen nyata | complete | Semua blok menarget misi + docKey contoh yang sama (`2026-10-31_misi_contoh` / `laporan-kerja-penulis`); `refs` dihapus; bentuk refs + alur dijelaskan di `howTo` |
| 2 | #4 `details` REGISTRY_KIND_UNKNOWN = larik isu (01 §6.2) | complete | Satu isu `{ pointer:"/query/kind", keyword, message, received, validKinds, examples }` |
| 3 | Uji r2reg + dc28 | complete | r2reg 31 uji (baru: target, dry-run amplop, simulasi berurutan, kontrol negatif, satu bentuk per kode) |
| 4 | Kalimat terdampak panduan + API-REF | complete | Panduan §17.0 templat, §17.13, baris tabel §12 `REGISTRY_KIND_UNKNOWN`; API-REF §12 baris R03 + catatan R2 |
| 5 | Asap DEV :9021 | complete | Hanya dry-run (R03/R08/R23); TIDAK ada kiriman nyata apa adanya (lihat Keputusan) |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/registry/contracts.ts | modify | `AGENT_WORK_REPORT_TARGET` = misi + docKey (dipakai record + bab 1..5); `refs` dihapus; `howTo` diperbarui |
| src/app/api/studio/registry/route.ts | modify | `kindRequired`: `details` larik satu isu; komentar kepala berkas diselaraskan |
| tests/unit/studio/api/r2reg-contract-examples.test.ts | modify | Fixture templat laporan kerja (DB tiruan); DB berisi dokumen LAIN; uji #3 dan #4 baru |
| tests/unit/studio/api/dc28-registry-contracts.test.ts | modify | Asersi details kembali ke larik (`details[0]`) |
| docs/STUDIO-AGENT-GUIDE.md | modify | §17.0 kalimat templat (kini sama persis dengan examples), §17.13 bentuk details + cid baru, baris tabel §12 |
| docs/API-REFERENCE.md | modify | §12 baris R03 (examples tanpa ID nyata; details larik) + kalimat catatan R2 |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | rc 0, tanpa keluaran | |
| Lint | `npx eslint` 4 berkas kode/uji | rc 0 | |
| Unit (berkas) | `npx vitest run r2reg + dc28` | 2 berkas, 44 lulus | |
| Unit (penuh) | `npx vitest run tests/unit/studio` | 158 berkas lulus; 3441 lulus, 1 dilewati | |
| Templat panduan | skrip tsx banding 6 blok JSON §17.0 vs `examples` | `blocks 6 equal true` | |

## Verification
- R03 `kind=contracts` 200, tanpa string berbentuk cuid di examples, cid b1e2f622-0325-4ff7-97c2-0f67038285e8.
- R08 record apa adanya: valid, `created:true`, `documentId:null` (dokumen BARU), cid b59b49c3-bdf3-4524-8d27-64819d524741.
- R08 bab 1..5 apa adanya tanpa record: `valid:false` `META_REQUIRED_FOR_CREATE` (ditolak), cid bab 1 451587e8-d4c5-4ad7-854c-a1780c102d50 (bab 2..5: 789298eb-8c3a-4e51-bb14-ad6fd21883cc, 6b70f151-d090-4b92-9238-ba0f026633e9, 4bb8e31e-75c3-4dc5-84f8-b712e6273424, 4bf5999d-db67-43cf-80ab-1da1ec906f8e).
- R23 draf record + bab 1..5 apa adanya (agentId cod-r2-f1): valid, 6 blok semuanya `created:true documentId:null`, cid 707f1862-fd8e-4456-85f0-dd1a4efcf572.
- Kontrol negatif (bentuk lama `target.documentId` = 001): `valid:true created:false documentId cmvuz4mn...` cid 2b52355f-f08e-4587-9c69-8bfda39a9062, membuktikan uji asap sanggup menangkap cacat.
- R03 tanpa kind: 400, details larik 1 isu berisi validKinds (13), cid bdad42bb-791e-478e-92f2-7735003c0f66; `kind=nope`: 400 larik, keyword enum, cid deace7d6-940e-43c9-a157-9dd49b518f4a.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| ID DEV nyata `cmvuz4mn...`/`cmvuz5jlk...` masih dipakai sebagai ilustrasi di panduan §17.4, §17.5, §17.9, contoh §17.13 (baris ~2142, 2177, 2190, 2354, 2357, 2568) | 0 | Di luar "kalimat terdampak" yang dimiliki baris ini | terbuka, disarankan baris lanjutan | Tidak |
| Jaminan "tidak pernah" bergantung pada belum adanya dokumen di kunci misi contoh | 0 | Bila seseorang benar-benar MENGIRIM record contoh apa adanya, salinan berikutnya menjadi `created:false` ke dokumen contoh itu; penolakan kunci cadangan di sisi server butuh perubahan ingest/submit (bukan milik baris ini) | terbuka, risiko rendah (kunci jelas berlabel contoh) | Tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | Pilih misi+docKey (bukan placeholder documentId) | Selaras simulasi berurutan draft-check/studio-report dan templat panduan §17.0; placeholder documentId akan mematahkan templat |
| 1 | `refs` contoh: hapus vs placeholder | Dihapus; bentuk ditulis di `howTo` (placeholder yang lolos pola akan ditolak server dan mematahkan dry-run record) |
| 5 | Kiriman nyata apa adanya tidak dilakukan | Mengirim akan menciptakan dokumen di kunci contoh dan justru membuka bahaya #3; bukti cukup dengan dry-run R08/R23 |
| 4 | Baris tabel panduan §12 + catatan R2 API-REF ikut diubah | Kalimat itu langsung salah setelah #4; perubahan minimal |
| 3 | r2reg mengimpor (baca saja) `drafts/check/_lib/dry-run` dan `services/draft` milik R2-F2 | Tidak ada berkas R2-F2 yang disentuh |

## Next Steps
- Review recommended (lingkup: contracts.ts examples, route.ts kindRequired, r2reg).
- Baris lanjutan opsional: ganti ID DEV nyata di panduan §17.4/§17.5/§17.9/§17.13; pertimbangkan penolakan kunci misi contoh di server.

---
task_slug: doc_artifact_studio
row: RESEED (reseed akhir v21; D-267, D-271)
date: 2026-10-23
agent: coder-execution
status: complete
---

# RESEED: reseed akhir v21 (preset/kerangka, Manual 000 v4, dokumen 000 rev 5, render)

Status: complete. Skill: dry-run-verify-fix. Kode TIDAK diubah (seed-studio.ts f8e8e45e, tanpa prisma generate, `.env`/DATABASE_URL tidak dicetak). DB `gsp_agent_hq_v21` (dicek `current_database()` di setiap skrip). Penulis tunggal templat/preset `datum-*` + dokumen 000 selama baris ini (klaim di `file_claims.md`).
Skrip/log (scratch, bukan repo): `C:\Users\TRIAL\AppData\Local\Temp\claude\C--Users-TRIAL-AppData-Local-Claude-Data-claude-pzs8sxrjxfjjc-scratch-workspaces-82c3eee2-ba3c-4c60-933d-04d93794dde1-2baf709b-3616-4b3d-bc4d-6b5ff33884c7-scratch-2026-10-22-a4e38a\4f3398cf-689f-41f1-aaa2-aa5e16082c93\scratchpad\reseed\` (`state.ts`, `revise000.ts`, `submit000.ts`, `render000.ts`, `scan.ts`, `project.ts`, log `01..11_*.log`, `state_{before,pre_submit,post_submit,after}.json`, `scan_after.json`).

Sha berkas saat jalan: doc.v2.json 79290e07…, datum-manual-000.preset.json a951b149…, template.v2.json 882057c5…, template.json 930a26ed….

## Langkah dan bukti

| # | Langkah | Perintah | Hasil |
|---|---|---|---|
| 1 | Hitung sebelum | `state.ts` | exit 0; lihat tabel hitungan |
| 2a | Preset/kerangka dry-run | `npx tsx prisma/seed-studio.ts --presets-and-skeletons --dry-run` | exit 0; kanonik preset v1 + templat v6 `unchanged`, GSP preset v1 + templat v2 `unchanged`; penjaga ok (kanonik proj 38c776de… persis; GSP luar Δ aa942872… kedua sisi, Δ 3 entri matchesDecision, diffOutsideDelta 0) |
| 2b | Preset/kerangka nyata | sama tanpa `--dry-run` | exit 0; sama (`unchanged` ×4), section type 51 |
| 3a | Manual 000 dry-run | `--import-manual000-v2 --dry-run` | exit 0; preset `new-version` v2 (restricted true), templat `new-version` v4, rollback |
| 3b | Manual 000 nyata | `--import-manual000-v2` | exit 0; preset `datum-manual-000-preset` v2, `datum-manual-000` v4 params c901b47f… = mode berkas (equalsFileMode true), kerangka 280a288a… = berkas, 784 kunci, `registryDrift.addedSinceVersion` [] ; penjaga ok: legacyKeys 764 (G4), proj luar Δ f0106cd9… kedua sisi, Δ 12 kunci, deltaValueMismatch 0, diffOutsideDelta 0; `legacyRowDrift` = 4 kunci dikenal (device.registerBlock.boldFields, org.entityName, render.cover.mode, render.spacer.autoMode) |
| 3c | Manual 000 jalan kedua | sama | exit 0; preset v2 dan templat v4 `unchanged` |
| 4a | R14 templateVersion dry-run | `revise000.ts --dry-run` (tx rollback; `patchStructure` ADMIN_SESSION) | exit 0; rev 5 (base 4) structure:templateVersion, COMPLETE |
| 4b | R14 nyata | `revise000.ts` | exit 0; rev 5 id cmvkd2nxy0001v10c3gkhha6a, templat datum-manual-000 v4, snapshot 77027e60126dfb82…, scope `structure:templateVersion`, COMPLETE, fullRenderAllowed true |
| 4c | Kirim doc.v2.json dry-run | `submit000.ts --dry-run` (`dryRunDocumentV2`, target.documentId, base 5) | exit 0; `unchanged` |
| 4d | Kirim doc.v2.json nyata | `submit000.ts` (`submitDocumentV2`, ADMIN, target.documentId 000, baseRevisionNo 5) | exit 0; `unchanged: true`, created false, rebased false, rev tetap 5; hitungan semua tabel Studio sebelum = sesudah (0 baris) |
| 5 | Render penuh | `render000.ts` = `renderScope(ADMIN, 000, {scope:"document", formats:[docx,html,pdf]})` (layanan R17; bukan medan `render` di kiriman, D-247) | exit 0; job cmvkd413a0001v1dkg906akil SUCCEEDED (DB SUCCEEDED), rev 5, scope DOCUMENT, draft false, errors 0; DOCX add4282b87a57befe27884f1c8ee8fb97eb41dcec6d0559bb6dc031ec7d0dfb8 (5413099 B), PDF abd579778f8345423338497e5438804e38d3ec285af90070b89efa0ee0dc3780 (5438094 B), HTML 9af28a40d1fb8565212abd1ab9023ce2701ef480619bdadf9ede6c7bb29891fd (9141385 B); sha disk = DB ×3; releaseStatus FAIL (= F-062, tidak diselidiki) |
| 6a | Pindai rekonstruksi | `scan.ts` (salinan baca-saja `fixs_f070_scan.ts`, `verifyReconstruction`) | exit 0; 7 revisi berbaris, mismatched 0 (001#1, 002#1, 000#1-5) |
| 6b | projectContent 000 | `project.ts` | exit 0; rev 1-5 terbaca, 6 section tiap revisi, failed 0 |

## Hitungan tabel Studio (sebelum -> sesudah)

Berubah: StudioTemplateVersion 14 -> 16, StudioTemplateSlot 40 -> 52, StudioTemplateSlotParam 49 -> 64, StudioRevision 6 -> 7, StudioDocSection 27 -> 33, StudioDocChapter 88 -> 109, StudioDocSubsection 417 -> 519, StudioDocBlock 1116 -> 1385, StudioBlock 1251 -> 1520, StudioRenderJob 5 -> 6, StudioOutputFile 15 -> 18.
Tetap: StudioTemplate 6, StudioDocIdentity 448 (0 pid baru/pensiun), StudioDocument 3, StudioAsset 26, StudioSectionType 51, StudioArtifact 0, StudioTemplateSlotRoleFormat 0.
Snapshot rev 1-4 tidak berubah (1521f7fc, 4ca8ee3d, 3733f35b, 5ef49008).

## Issues & Decisions

| Butir | Catatan |
|---|---|
| Harapan "versi baru bila registri berubah" untuk Kanonik/GSP tidak terjadi | `--presets-and-skeletons` membandingkan LAPIS override preset (bukan resolvedParams terhadap registri); 10 kunci registri baru sejak SR-36 (R-65 + 3 axis + lainnya; registri 784) bernilai bawaan sehingga lapis sama -> `unchanged`. datum-kanonik v6 / datum-gsp v2 tetap 774 kunci tersimpan (kunci baru jatuh ke bawaan registri saat dibaca); warn seed `registryInSync false` (7abfc5f7 vs registri c8831b1f) tetap. Manual 000 v4 sudah 784 kunci. Bila controller ingin Kanonik/GSP menyimpan registri final juga, perlu ubah kode seed (needs-review terpisah); baris ini tidak mengubah kode |
| Kiriman doc.v2.json `unchanged` | Isi regenerasi FIX-W = isi rev 4 (tanpa `render`); jadi dokumen 000 hanya mendapat rev 5 (templateVersion) |
| Kode berjalan paralel | FIX-X/FIX-Y mengklaim berkas `src/**` (by-construction, ingest/v2, structure/rows) pada waktu yang sama; hasil di atas mencerminkan pohon kerja saat jalan |

## Next steps

- Controller: SR-51 resmi + SR-52 dapat memakai dokumen 000 rev 5 (datum-manual-000 v4) dan job render cmvkd413a0001v1dkg906akil.

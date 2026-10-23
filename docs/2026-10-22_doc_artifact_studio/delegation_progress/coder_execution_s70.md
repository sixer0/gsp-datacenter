# S70 coder-execution: seed Studio (status: complete)

Berkas: `prisma/seed-studio.ts` (baru). DB: `gsp_agent_hq_v21` saja (tanpa migrate dev/db push, D-21). Pemakaian: `npx tsx prisma/seed-studio.ts [--refresh-v1]`.

## Isi
- 51 `StudioSectionType` upsert per `key` dari `registry/sections.ts` (registryVersion `2026-10-22.1`).
- `StudioTemplate` slug `datum-kanonik` (isCanonical, DOCUMENT) upsert per slug; `StudioTemplateVersion` v1 per `(templateId, versionNo)`: overrides `{}`, resolvedParams = `resolveParams` S11 atas default registri (base kosong), roleFormats `{}` (jatuh ke turunan katalog §5.6), assets `{}`, provenance {tokens.json 2.0.0, 000/GSP/STD/X/2026 Rev A, datum-house-style 2.6.0, catalogRef + sidik registri}.
- v1 tak berubah (D-06): isi beda -> exit 1, kecuali `--refresh-v1` dan v1 belum dipin revisi/artefak.
- Penjaga DB: hanya `gsp_agent_hq_v21`/`_uji`; diuji menolak `gsp_agent_hq_v21_shadow` (exit 1, tanpa tulis).

## Angka (query DB, dua kali jalan)
- Jalan 1 `canonicalVersion: created`; jalan 2 `unchanged`; paramsSha256 `3d6e5fba...84fd` sama.
- StudioSectionType 51 (distinct 51): DOCUMENT 29, PAGE_DEVICE 7, CHANNEL 15. Template 1, versi 1, latestVersionNo 1.
- resolvedParams 699 kunci = katalog 673 hadir + renderer 25 hadir + 1 turunan `grid.marginBottomMm` (D-33). Selisih katalog vs spesifikasi: 0.
- sectionPlan: NOTA wajib 1/opsional 23/terlarang 27; TERBIT 10/26/15; SERAH 13/23/15 + `requiredPresets.registerTable=["reconciliation"]`.

## Keputusan (perlu dicatat controller)
1. Aturan rencana section (hipotesis berlabel, research/01 §5): terlarang = tidak aktif di tier atau `renderable=false`; wajib semua tier `chapter`; TERBIT/SERAH + cover, controlSheet, toc, F1, F2, F3, F4, F6, F7; SERAH + registerTable, derivation (S19 "wajib"), evidenceRail (F5 "wajib").
2. Log galat = JSON terstruktur (timestamp, level, source, correlationId, stack_trace, context) ke stderr + exit 1; tanpa sink berkas/DB karena area hanya seed-studio.ts dan repo tak punya model ErrorLog.

## Temuan (D-19, seed lanjut)
- 8 default registri tidak lolos validasi ParamDef-nya sendiri: governance-language.ts (S04) `content.authorClaimMarks`, `doc.typeCode`, `brief.slidePatterns` (default larik, tipe enum); apparatus.ts (S07) `derivation.id.pattern`, `assumption.id.pattern`, `requirement.id.pattern` (default tak cocok `pattern`); figure.ts (S08) `diagram.id` (pola), `lineWeight.thinThickRatio` (bukan rasio). Disimpan apa adanya di resolvedParams.

## Penjaga
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "prisma/seed-studio"` -> kosong (exit 1). `npx eslint prisma/seed-studio.ts` -> exit 0.

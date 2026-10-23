# INT-P coder-execution: IP-35 templat terbatas + override dokumen (F-047, D-98)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix (0 siklus perbaikan), security-review-gate. Klaim INT-P di file_claims.md. `benchmark/manual000/template.json` dan `engine/lint/scan/enforcement.ts` TIDAK disentuh.

Berkas: baru `services/templates/access.ts` (`isTrustedCaller`, `templateRestriction`, `assertTemplateUsable`, `TEMPLATE_RESTRICTED_DENIED`); ubah `engine/lint/structure/enforcement.ts` (`releasedBlockingChecks(tpl)` murni + doc), `services/templates/index.ts` (DTO `restricted`/`releasedChecks` di list/get/create/impor/ensureCanonical; `resolveTemplateFor(slug, version, caller, opts)`; tipe `TemplateSummaryAccess`, `TemplateVersionDtoAccess`, `TemplateDetailAccess`), `services/ingest/trust.ts` (`isBenchmarkTrusted` -> `isTrustedCaller` satu sumber; `stripEnforcementOverride`, `ENFORCEMENT_OVERRIDE_STRIPPED`, `enforcementStrippedNotice`), `services/ingest/index.ts` (langkah 1c + 2a).

Kebijakan: (1) TERBATAS = `releasedBlockingChecks(resolvedParams) != []` (cek registri `blocksIngest` bermode profil release/report/off); dihitung dari parameter efektif tiap kali (pewarisan termasuk), tanpa flag tersimpan. Ingest/validate dengan templat terbatas oleh non-ADMIN tanpa `trustedHarness` -> `StudioEngineError FORBIDDEN` 403 (juga dryRun: otorisasi), log `TEMPLATE_RESTRICTED_DENIED` (templates JSONL + ingest JSONL). Dicek pada templat dasar dan setelah override dokumen. (2) `doc.x.lintEnforcement` dari pemanggil tidak tepercaya dibuang sebelum skema (dokumen asli tidak dimutasi), log warn `ENFORCEMENT_OVERRIDE_STRIPPED` + temuan REPORT + banner. (3) kanonik/profil tanpa pelepasan terbuka.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/(services/(templates|ingest)|engine/lint/(structure|scan))"` -> kosong (exit 1); total repo 2 galat, keduanya `src/app/api/user-access/*` (INT-K, pra-ada).
- `npx eslint src/lib/studio/services/ingest src/lib/studio/services/templates src/lib/studio/engine/lint/structure/enforcement.ts src/lib/studio/engine/lint/scan/enforcement.ts` -> exit 0.

Cek data (scratch tsx, DB gsp_agent_hq_v21; hanya dryRun/jalur tolak; hitungan Document/Revision/Template sebelum = sesudah = 0/0/2):
- restriction: template.json (berkas) restricted=true [DATUM-04, DATUM-09, G3]; datum-kanonik DB v3 false; list DB: datum-kanonik v3 false, datum-manual-000 v1 false (versi DB diimpor sebelum override R-35, lihat Temuan 1).
- (a) ADMIN + m000 (+/- x.benchmark), harness agent+trustedHarness: valid=true, FAIL-rilis 11 = DATUM-04@2.4, @11.1, G3@13.2.2, @13.3.2, DATUM-09 x7 (1.4.2, 4.8.4, 8.3.2, 8.6.1, 11.2.2, 16.1.2, 16.3.2) = D-90; ADMIN + datum-manual-000 DB + x.benchmark: downgraded D-34 = 11 yang sama.
- (b) USER dryRun/non-dryRun, AGENT + x.benchmark non-dryRun, AGENT + enforcement:"report": THROW FORBIDDEN 403 "Templat datum-manual-000 ... terbatas: profilnya melepas cek penolak (DATUM-04, DATUM-09, G3) ... (D-98)".
- (c) USER/AGENT + profil terbuka (m000 tanpa override, juga datum-kanonik DB) + x.lintEnforcement {DATUM-09,DATUM-04,G3: release}: dryRun valid=false 11 isu + notice ENFORCEMENT_OVERRIDE_STRIPPED; non-dryRun BY_CONSTRUCTION_FAILED 422 "11 pelanggaran". ADMIN sama: valid=true (dihormati). Kontrol USER tanpa override: 11 isu.
- (d) `npx tsx scripts/parity/run/render_cli.ts --doc benchmark/manual000/doc.json --template benchmark/manual000/template.json --formats html` -> exit 0, SUCCEEDED, 9.954.671 byte, sha256 54095e22...56e9 = identik INT-M/INT-F (harness tidak melewati ingest).

Keputusan (dicatat controller): (1) 403 dilempar juga saat dryRun; (2) predikat kepercayaan satu sumber di services/templates/access; (3) `restricted` per versi (DTO versi) dan per templat (= versi terbaru); (4) G1/DATUM-11 yang dilepas profil tetap dihitung terbatas (literal brief), walau ingestPolicy tetap memblokirnya.

Permintaan lintas pemilik (file_requests.md, semua tidak blocking): validate route `HARD_CODES` + FORBIDDEN (kini 200 valid:false); render/artifact.ts + artifacts/_lib/prepare.ts pakai `resolveTemplateFor` (render artefak baru); revisions patchBlock pakai `assertTemplateUsable`; UI template-editor tampilkan `restricted`.

Temuan: 1. INFO: `datum-manual-000` di DB (v1) belum memuat `lint.enforcementOverride`; impor ulang template.json (INT-B) otomatis menjadikannya terbatas, tanpa kode tambahan. 2. MINOR (keamanan, di luar area): render artefak HTML dengan `source.kind: "document"` inline (`services/render/artifact.ts`) menormalisasi tanpa gerbang by-construction untuk semua pemanggil, terlepas dari templat. Review direkomendasikan (S87 security + senior-code-reviewer: templates/access.ts, ingest/index.ts 1c/2a, trust.ts).

---
task_id: 2026-10-22_doc_artifact_studio
task_slug: doc_artifact_studio
row: C32 re-run (final DEV conformance gate, coverage round, final working tree)
date: 2026-11-05
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/03_structured_datum_coverage_round.md (row C32)
binding_decisions: D-608 (release gate), D-650 (bab1 restart removed from ID layer), D-653 (GF-08/GF-21), D-655 (EN provenance labels)
status: complete
---

# C32 final - DATUM Rev A coverage round: DEV conformance gate on the final working tree

This run was DEV only: `http://localhost:9021` (`next dev`, already running) on DB `gsp_agent_hq_v21`. No server was started or stopped, and no process was killed. Port 9011, DB `gsp_agent_hq`, and production were not touched. No file under `src/`, `prisma/`, `tests/`, or `benchmark/` was edited, and nothing was committed. The working tree is uncommitted on HEAD `8c7c803`. The internal secret was read from its file into the environment and never printed. A `grep -rlF` for the secret value across `C:/tmp/c32b` returned **0** files.

## Summary

**Verdict: PASS 10/10 under D-608.** Every pair scores at least 85 % (96.9 % ID, 97.0 % EN), passes 4/4 critical rules, and has 0 clashes (PDF and X-*).

- **Rule outcomes are the same as C32.** No rule changed status on any pair: same denominators, same passes, same two known failures (SB-02 on 8 TERBIT/SERAH pairs, GF-13 on all 10). The only evidence string that changed is CR-2, because the document numbers are new.
- **Seeded versions:** preset `datum-gsp-rev-a-preset` **v2**, and all 10 doc-type templates at **v4** on preset v2. Dry-run and real run both had `guard.ok: true`, `changedTemplates: []`, `addedTemplates: []`, and `sectionTypesTouched: []`.
- **Footer numbering (D-650):** ID documents no longer restart at Bab 1. No DOCX has a `w:pgNumType` element, and the ID register reads `LEMBAR 4 DARI 6` and `LEMBAR 5 DARI 6` on a 6-page PDF. C32 read `1 DARI 7` and `2 DARI 7`.
- **GF-08 role sizes (D-653):** table headers and control-sheet headers are now sz 14 (7 pt; C32 was sz 13), caption labels sz 15 (C32 had mixed 14/15), and numeral and mono cells sz 16. The numeral and mono roles were checked with a probe, because the gate table has no numeral or ID column (section 4.3).
- **EN provenance labels (D-655):** the gate and B-FIX payloads print no provenance labels. A DEV probe that carries all four marks shows `MEASURED / DERIVED / VENDOR / ASSUMED` in all 5 EN templates, with 0 ID labels in them. The ID control document keeps `TERUKUR / DITURUNKAN / PEMASOK / ASUMSI` (section 4.1).
- **Non-gating observations** (section 5): (a) the EN chart legend still prints `KUNCI` instead of `KEY`. This was already present in C32, so it is not a regression. (b) In the probe only, a provenance rail stack or assumption note that is taller than its paragraph runs into a following full-width table (clash.py G-04/G-01). This happens in both languages. The gate payload does not exercise it.

## 1. Seed (DEV)

Run from the repo. The log shows `"database":"gsp_agent_hq_v21"` in both runs. `.env` and DATABASE_URL were not printed.

| Step | Command | Result |
|---|---|---|
| Dry-run | `npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run` | exit 0. Plan: preset `datum-gsp-rev-a-preset` `new-version` v2 (base `datum-gsp-preset` v2); 10 templates `new-version` v4; `guardOk: true`, `changedTemplates: []`, `addedTemplates: []`, `sectionTypesTouched: []`; message `transaksi di-rollback (0 tulis)`. Section types: 52 unchanged |
| Real | `npx tsx prisma/seed-studio.ts --doc-type-templates` | exit 0. Same outcomes, all `storedOk: true`, `skeletonShaMatchesSeed: true`, guard ok with the same empty lists |

The one `warn` in both runs (canonical profile skeleton differs from the registry, auto-sync stopped) concerns `datum-kanonik` and is unrelated to this round.

| Template | Version | paramsSha256 (16) | skeletonSha256 (16) | changedKeys vs v3 |
|---|---|---|---|---|
| datum-gsp-rev-a-preset (preset) | **2** | `a1c34e85b1250a32` | `3fab117dcb662a57` | 0 (role-format overrides only, see 4.3) |
| datum-proposal-teknis | **4** | `80a7ba53c0adf187` | `96659cbc77831cf3` | 1 (`sheetNumbering` removed) |
| datum-proposal-teknis-en | **4** | `37043dac444ffae3` | `d91a3e5340ba5dee` | 0 |
| datum-laporan | **4** | `8539bdb8a10689da` | `aade22d848f482a9` | 1 |
| datum-laporan-en | **4** | `0a57534bd098f965` | `996e87e02c483025` | 0 |
| datum-laporan-verifikasi | **4** | `5587307cc5af9e33` | `51b4f5a57a4050d2` | 1 |
| datum-laporan-verifikasi-en | **4** | `1097ba94eb1a1770` | `dd907fd14f3af16a` | 0 |
| datum-standar | **4** | `ba410d845f381710` | `f2ca94bc03aeba73` | 1 |
| datum-standar-en | **4** | `e9266f6cc562af05` | `497202a413a83210` | 0 |
| datum-nota | **4** | `a9d2b40d679c857d` | `88ada4ebd20f9f39` | 1 |
| datum-nota-en | **4** | `9d461cdf35024a15` | `c279486c07f35357` | 0 |

All 10 v4 versions reference preset v2 (`versionId cmw3bvwfr0001v10g0dzarxkk`). The dry-run's preset entry lists the stored role sizes against the base: caption run 15 (base 15) and label run 15 (base 14); `controlTable.header` 14 (13); `table.headerLeft`/`headerRight` 14 (13); `table.cellNumeralRight` 16 (15); `table.cellMono` 16 (14). R20 (`studio_templates_list`, `resp/_templates_list.json`) lists all 10 templates at version 4, with tiers SERAH, TERBIT, or NOTA as expected.

## 2. Run facts

- **Payloads:** the unchanged gate payloads `C:/tmp/s36/payload/id.json` (sha16 `9c607200108d09f4`) and `en.json` (`f849b1700cc7ae79`). Mission `2026-11-05_datum-cov-round-dev-gate-final`, docKey `gate-<slug>`, agent `hermes-datum-gate`.
- **Payload diff within each language** (`diff.mjs`): only `/docKey` and `/template` differ. The content sha is identical within each language: ID `53fdd4f94829a88c`, EN `ca881806fa8c56fc` (47 leaves). These differ from C32 only because the mission is part of the hash.
- **Writes:** `studio_write` returned `isError:false`, `dibuat`, and `COMPLETE` for 10/10. The only warning was `FRONT_SLOTS_OMITTED` on NOTA, as in C32.
- **R08:** valid for every stored part (5 per document, 2 for NOTA). **R17:** 200, `SUCCEEDED`, `partial:false`, `failedFormats:[]`. All 20 files match the server sha256 and returned `x-studio-sha256-verified: true`. Every document reports `templateVersion: 4`.
- **Doc numbers:** PT 017/018, LAP 170/171, VER 017/018, STD 019/020, NOT 017/018 (XI/2026). B-FIX fixtures: PT 019/020, LAP 172/173, VER 019/020, STD 021/022, NOT 019/020.
- **B-FIX:** mission `2026-11-05_datum-cov-round-dev-gate-final-bfix`. R08 was valid and the document COMPLETE for 10/10. `bfix_check.py` reported `allPresent True` on 10/10, with 0 other-language forms and 0 forbidden-currency hits.
- **Spec:** `C:/tmp/c32b/spec.json` is byte-identical to the C32 spec (`cmp` exit 0).
- **Download names** (HEAD Content-Disposition): T/S `<title> <number> RevA.<ext>`; NOTA `<title> 2026-11-04.<ext>`. Same as C32.
- **File sha16 (DOCX / PDF):** proposal-teknis `ba372ab765a412a7`/`dbbeda964901bdc3`, -en `8ed1737042c0129c`/`92ce1da63bf75967`; laporan `97be9f979db0a749`/`aa3267599ceba79e`, -en `898e4ad8165f0531`/`aeef3dbf35a71aa5`; laporan-verifikasi `4f1bf76a33973a3a`/`877a5fd6fe008b32`, -en `918dcffcc60c41fd`/`bd1068b49a3fdf4b`; standar `8054e3025a3f5c4c`/`81e3a0bccac2f580`, -en `71832b48f5449ee7`/`8dd62bb82d20c2d1`; nota `b25ea14b6100dea2`/`819ed41544042e48`, -en `5a162b82b434e4e3`/`e4ebc6a6091aecba`.

## 3. Per-pair results (full rule set, D-608)

| Pair | Tier | Template | Score (n/N) | Critical | Clash PDF / X-* | Coverage (scorer, informative) | Failing rules | Rule changes vs C32 | **D-608** |
|---|---|---|---|---|---|---|---|---|---|
| datum-proposal-teknis / ID | SERAH | @4 | **96.9 %** (64/66) | 4/4 | **0** / 0 | 63.8 % | SB-02, GF-13 | none (CR-2 evidence: new number) | **PASS** |
| datum-proposal-teknis-en / EN | SERAH | @4 | **97.0 %** (66/68) | 4/4 | **0** / 0 | 69.0 % | SB-02, GF-13 | none | **PASS** |
| datum-laporan / ID | TERBIT | @4 | **96.9 %** (64/66) | 4/4 | **0** / 0 | 64.3 % | SB-02, GF-13 | none | **PASS** |
| datum-laporan-en / EN | TERBIT | @4 | **97.0 %** (66/68) | 4/4 | **0** / 0 | 69.6 % | SB-02, GF-13 | none | **PASS** |
| datum-laporan-verifikasi / ID | TERBIT | @4 | **96.9 %** (64/66) | 4/4 | **0** / 0 | 64.3 % | SB-02, GF-13 | none | **PASS** |
| datum-laporan-verifikasi-en / EN | TERBIT | @4 | **97.0 %** (66/68) | 4/4 | **0** / 0 | 69.6 % | SB-02, GF-13 | none | **PASS** |
| datum-standar / ID | TERBIT | @4 | **96.9 %** (64/66) | 4/4 | **0** / 0 | 65.5 % | SB-02, GF-13 | none | **PASS** |
| datum-standar-en / EN | TERBIT | @4 | **97.0 %** (66/68) | 4/4 | **0** / 0 | 70.7 % | SB-02, GF-13 | none | **PASS** |
| datum-nota / ID | NOTA | @4 | **96.9 %** (32/33) | 4/4 | **0** / 0 | 53.1 % | GF-13 | none | **PASS** |
| datum-nota-en / EN | NOTA | @4 | **97.0 %** (33/34) | 4/4 | **0** / 0 | 59.4 % | GF-13 | none | **PASS** |

- clash.py printed `clash: 0 clashes on 6 pages` (`on 2 pages` for NOTA) and exited 0 on all 10. `xFailures`, `xUnverified`, and `unexercised` were empty or 0 on all 10.
- **Comparison method:** each `score/<slug>_<LANG>.json` was compared with `C:/tmp/c32/score/` by rule id, status, and evidence. All 10 pairs had 0 status changes. CR-2 is the only rule whose evidence changed, and only because of the new document numbers.
- The scorer still prints its own `verdict: FAIL`. Its only reason is `cakupan butir ... < 85 %`, which does not gate under D-608. The coverage column now comes from the revision-3 `datum_point_coverage.json` (C32 used rev 2). It matches D-648 to within rounding.
- The remaining failures are unchanged and already classified. SB-02: `pita segel 1: warna teks F6E9E9, harapan F4F5F6 (+5 temuan lain)` (D-605(1)). GF-13: `klasifikasi tebal=true warna=101418, harapan tebal 6E1420 (+3 temuan lain)` (D-598 F-4, D-602, D-604).
- **The rule set does not contain GF-08 or GF-21** (the GF family runs GF-01..07 and GF-09..15). GF-08 was therefore checked directly (4.3). GF-21 shows only indirectly: GF-06 still reports `IBM Plex Serif, sz 19, baris 270/exact (4/4 paragraf)`.
- **RB-08:** n/a on ID (`tidak berlaku untuk TERBIT/ID/LAP`). On EN it passes with `tidak ada mulai ulang nomor lembar di 6 seksi`. Both are the same as C32.

## 4. Extra checks

### 4.1 EN provenance labels (MEASURED / DERIVED / VENDOR / ASSUMED)

**Gate documents:** `prov_scan.py` scanned the text of all 10 gate PDFs and every XML part of the DOCX files. It found **0** occurrences of any of the 8 label words. The gate payload has no provenance marks, so no label prints. In the B-FIX fixtures, register values carry glyphs only (`■` x3, `△` x1), also with no label words. The gate therefore cannot show the D-655 labels.

**Probe (DEV, mission `2026-11-05_datum-cov-round-dev-gate-final-prov`):** the probe uses the 5 EN templates plus `datum-laporan` (ID) as a control. It ran in three steps:

1. `studio_write` with the gate payload plus a paragraph and a table source containing `[TERUKUR] [DITURUNKAN] [PEMASOK] [ASUMSI]`. The MCP write path stores bracket markers as plain text (stored content `"source":{"text":"Project threat register [TERUKUR] ..."}`), so this step creates no marks. This is a property of the MCP write format, not a defect in the labels.
2. **`prov2`:** the last chapter was resubmitted through R08 + R12 (`/api/studio/chapters`, the same route the B-FIX phase uses) with real v2 marks: a paragraph `rail` with all four marks, `source.provenance` = all four on the table, and one `assumptionInline` block. R08 was valid and the submit returned 201 for 6/6. The render returned 200 with `partial:false`.
3. `prov_scan2.py` scanned the resulting PDF and DOCX files.

| Document | PDF/DOCX label counts | Printed lines (PDF) |
|---|---|---|
| 5 EN (PT, LAP, VER, STD, NOT) | MEASURED 2, DERIVED 2, VENDOR 2, ASSUMED 3; **TERUKUR/DITURUNKAN/PEMASOK/ASUMSI 0** | `SOURCE Project threat register. PROVENANCE ■ MEASURED, ◈ DERIVED, ◇ VENDOR, △ ASSUMED`; rail `■ MEASURED`, `◈ DERIVED`, `◇ VENDOR`, `△ ASSUMED`; assumption note `△ ASSUMED` |
| datum-laporan (ID control) | TERUKUR 2, DITURUNKAN 2, PEMASOK 2, ASUMSI 3; EN labels 0 | `SUMBER Register ancaman proyek. PROVENANS ■ TERUKUR, ◈ DITURUNKAN, ◇ PEMASOK, △ ASUMSI`; rail and assumption note in ID |

**Result: confirmed.** Every place where provenance marks print in the 5 EN documents (table/figure SOURCE-PROVENANCE row, rail, assumption note) shows the EN labels. The ID control is unchanged. Page image: `C:/tmp/c32b/work/en_prov_p5.png`.

### 4.2 ID footer page numbering (no bab1 restart)

| Check | C32 | C32b (final) |
|---|---|---|
| `w:pgNumType` in `word/document.xml` (ID T/S, ID NOTA, EN) | ID T/S: `<w:pgNumType w:start="1"/>` on Bab 1 | **none** in any document |
| Register on p4/p5 of ID T/S (PyMuPDF, `features.py`) | `LEMBAR 1 DARI 7`, `2 DARI 7` | **`LEMBAR 4 DARI 6`, `5 DARI 6`** on a 6-page PDF |
| EN T/S | `SHEET 4 OF 6`, `5 OF 6` | unchanged |
| NOTA ID/EN | `1/2`, `2/2` | unchanged |

**Result: confirmed.** ID numbering counts from page 1 again, the same way EN does. The D-639 "+1" (N = 7 on 6 pages) no longer occurs because there is no restart. The register uses the plain PAGE/NUMPAGES fields (RB-01/RB-03 PASS). Page image: `C:/tmp/c32b/work/id_p4_register.png`.

### 4.3 GF-08 table type sizes

**Method:**

- `gf08.py` parses `word/document.xml` in the C32 and C32b gate DOCX files. It reports per-row run `w:sz` (half-points) for every table, plus the sizes of caption and SOURCE paragraphs.
- The gate table has text cells only, so the `table.cellMono` and `table.cellNumeralRight` roles never render there. Probe step `prov3` therefore resubmitted the probe chapter with the threat table's first column set to `role: "id"`, plus a 2-column table (`text`, `numeral` with `unit`). R08 was valid and the submit returned 201 for 6/6. The first attempt had no unit and was rejected by DATUM-09 (DT-17) on the 5 non-NOTA templates; the unit was then added.
- `gf08_probe.py` reads per-cell sz, font, and alignment from the probe DOCX files and span sizes from the PDFs.

| Role | Rev A Table 8.2 | Expected sz (D-653 rounding) | C32 (preset v1) | C32b gate | C32b probe | PDF span |
|---|---|---|---|---|---|---|
| `table.headerLeft` / `headerRight` | 6.8 pt | 14 | 13 | **14** (threat table header, all pairs) | **14** (left Cond; `Count` right-aligned Cond) | 7.0 pt IBMPlexSansCond-SemiBold |
| `controlTable.header` | 6.8 pt | 14 | 13 | **14** (revision, verification, and signature headers) | - | - |
| `caption` (label + text run) | 7.6 pt | 15 | 14/15 mixed | **15** (Table 6.1, Figure 6.1) | **15** (Table 6.1, 6.2) | - |
| `table.cellNumeralRight` | 7.8 pt | 16 | 15 (stored base) | not exercised | **16**, IBM Plex Mono, `jc right` | 8.0 pt IBMPlexMono-Regular |
| `table.cellMono` | 7.8 pt | 16 | 14 (stored base) | not exercised | **16**, IBM Plex Mono (`SEC-01`) | 8.0 pt IBMPlexMono-Regular |
| `table.cellText` (unchanged role) | - | 16 | 16 | 16 | 16 | - |

**Result: applied.** All six role-format overrides from the preset v2 dry-run (`roleFormatOverrides`) render at the expected sizes in all 6 probe documents and, where the roles occur, in all 10 gate documents. SOURCE rows stay at sz 13 (`table.source`, not in GF-08).

## 5. Non-gating observations (no D-608 effect; for the controller)

| # | Observation | Evidence / repro | Classification |
|---|---|---|---|
| O-1 | **EN chart legend label prints `KUNCI`, not `KEY`.** The label sits inside the chart SVG, so PDF text extraction does not see it, and LB-09 (DOCX captions and labels) passes | `C:/tmp/c32b/work/en_gate_p5_chart.png` (C32b laporan-en p5); `C:/tmp/c32b/work/c32_en_p5_legend.png` shows the same in **C32** | Pre-existing, not a regression of this round. The likely origin is the diagram key row in `engine/diagram/build/svg.ts` (KUNCI/KEY row, D-288); not investigated further. EN-localization gap of the same kind as D-652/D-655 |
| O-2 | **A rail note taller than its paragraph runs into a following full-width table** (probe only) | `prov2`: clash.py `clipped` G-04 `◇ VENDOR` (EN) / `◇ PEMASOK` (ID) crosses the table top edge y = 262.15 / 248.65 pt, on 6/6 probe documents. `prov3`: also `Impact if wrong: ...` / `Dampak bila salah: ...` (assumption note) clipped, and G-01 overlap with the numeral-table header `COUNT`/`JUMLAH`. Image `C:/tmp/c32b/work/en_prov_p5.png` | Language-independent layout limit: rail notes do not reserve vertical space before a full-width table (the GF-24 rail is reserved only by the paragraph right indent; tables stay full width, EN:2737). The gate payload has no rail marks, so the gate is unaffected. Agents can trigger it only through v2 chapters with `rail`/`assumptionInline` followed directly by a table |

Neither observation changes a rule outcome or the D-608 verdict, and no engine code was changed.

## 6. Failures

None. No pair fails D-608.

## 7. Commands (no secrets)

Run from `C:/Users/TRIAL/gsp-swarm-hq-v2.1` in Git Bash. The helper scripts are copies from `C:/tmp/c32/`. Their paths were retargeted to `C:/tmp/c32b`; logic is unchanged. `C:/tmp/c32b/driver.ts` is a copy of `C:/tmp/s36/driver.ts` whose only change is the root/mission guard, now `C:/tmp/c32b` plus `2026-11-05_datum-cov-round-dev-gate-final`.

```bash
npx tsx prisma/seed-studio.ts --doc-type-templates --dry-run      # log: C:/tmp/c32b/log/seed_dryrun.log
npx tsx prisma/seed-studio.ts --doc-type-templates                # log: C:/tmp/c32b/log/seed_real.log
export INTERNAL_API_SECRET="$(tr -d '\r\n' < C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret)"
export STUDIO_BASE_URL=http://localhost:9021 STUDIO_AGENT_ID=hermes-datum-gate STUDIO_MCP_TOOLSETS=write STUDIO_MCP_FILE_ROOTS=C:/tmp/c32b
export S36_ROOT=C:/tmp/c32b S36_MISSION=2026-11-05_datum-cov-round-dev-gate-final
for ph in spec list write render bfix; do npx tsx C:/tmp/c32b/driver.ts $ph; done
node C:/tmp/c32b/diff.mjs                                         # payload diff within each language
V=C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe
$V -I -B C:/tmp/c32b/bfix_check.py                                # B-FIX expected strings
bash C:/tmp/c32b/score_all.sh                                     # clash.py + score.ts per pair, full rule set,
#   --coverage docs/2026-10-22_doc_artifact_studio/verification/coverage/datum_point_coverage.json (no --implemented-only)
$V -I -B C:/tmp/c32b/features.py                                  # pages, register, body measure, background, features
node C:/tmp/c32b/names.mjs                                        # Content-Disposition (headers only)
# extra checks
$V -I -X utf8 -B C:/tmp/c32b/prov_scan.py                         # provenance words/glyphs in gate + B-FIX outputs
npx tsx C:/tmp/c32b/prov_probe.ts write && npx tsx C:/tmp/c32b/prov_probe.ts render   # probe docs (mission ...-final-prov)
npx tsx C:/tmp/c32b/prov_probe.ts prov2                           # real v2 marks (rail, source.provenance, assumptionInline)
$V -I -X utf8 -B C:/tmp/c32b/prov_scan2.py                        # label words in prov/out2
npx tsx C:/tmp/c32b/prov_probe.ts prov3 <targets>                 # id + numeral columns (GF-08 mono/numeral roles)
$V -I -X utf8 -B C:/tmp/c32b/gf08.py datum-laporan datum-laporan-en datum-nota   # C32 vs C32b run sizes
$V -I -X utf8 -B C:/tmp/c32b/gf08_probe.py                        # per-cell sz/font/jc + PDF spans in prov/out3
$V -I -B benchmark/datum_conformance/clash/clash.py --pdf C:/tmp/c32b/prov/out2/<slug>.pdf --docx ... --no-convert ...  # O-2
$V -I -B C:/tmp/c32b/snap.py <pdf> <page> <png> <dpi> [clip]      # page images
```

`prov_probe.ts` is a copy of the gate driver with a fixed root (`C:/tmp/c32b/prov`), mission, payload directory, and target list, plus two probe phases (`prov2`, `prov3`). It is a test harness outside the repo.

## 8. Evidence (all under `C:/tmp/c32b/`)

- `log/`: `seed_dryrun.log`, `seed_real.log`, `spec.log`, `list.log`, `write.log`, `render.log`, `bfix.log`, `diff.log`, `bfix_check.log`, `score.log`, `features.log`, `names.log`
- `resp/`: `_templates_list.json`, `_write_summary.json`, `_render_summary.json`, `_bfix_summary.json`, `_bfix_text_check.json`, `_payload_diff.json`, `_features.json`, `_prov_scan.json`, `_gf08_sizes.json`
- `out/` (20 gate files), `bfix/` (10 fixtures plus shell/chapter JSON), `clash/`, `score/<slug>_<LANG>.json|.md`, `spec.json`, `req/`
- `prov/`: `payload/`, `req/` (incl. `*.prov2.json`, `*.prov3.json`), `out/`, `out2/`, `out3/`, `log/` (`write`, `render`, `prov2`, `prov3`, `prov3b`), `resp/` (`_prov2_summary.json`, `_prov3_summary*.json`, `_prov2_labels.json`, `_gf08_probe.json`, `clash_*.json`)
- `work/`: `id_p4_register.png`, `en_prov_p5.png`, `en_gf08_p5.png`, `en_gate_p5_chart.png`, `c32_en_p5_legend.png`

**DEV DB writes:**

- 10 gate documents in mission `2026-11-05_datum-cov-round-dev-gate-final`.
- 10 B-FIX fixtures in `...-final-bfix`.
- 6 probe documents in `...-final-prov`: PT-EN 021, LAP-EN 174, VER-EN 021, STD-EN 023, NOT-EN 021, LAP-ID 175. Each carries the `prov2` and `prov3` chapter revisions.
- Preset v2 and 10 template v4 versions from the seed.

Nothing was deleted. The server also wrote its rendered copies under the git-ignored `data/studio-workspace/`.

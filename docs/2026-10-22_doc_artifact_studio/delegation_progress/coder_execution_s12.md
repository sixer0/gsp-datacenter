---
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
row: S12 (DATUM Rev A blueprint) + D-597 D-6 + D-598 F-1 + needs-review item 2 from S09-S11 (meta.tier)
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# Implementation Report: S12 MCP client labels, F-1 language from template, meta.tier, D-6 legacy labels

Skills loaded: `tdd`, `dry-run-verify-fix` (test, typecheck and lint run by hand; commands below). Sources: row S12 (`02_structured_datum_rev_a.md:128`), register `research/31` §4.3 and F-1, sweep `research/33` B-08, B-09, D-6, reports `coder_execution_s09_s11.md` (D-1, needs-review item 2) and `coder_execution_s06.md`.

Note: this file already held an older S12 report (2026-10-23, engine/bind, different blueprint). It is kept unchanged at the end of this file.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Labels follow register; shared text table where the sweep marks duplication | complete | `number`, `rev`, `author`, `audience`, `custodian`, `basis` from `CONTROL_FIELD_LABELS`; `sheet` from `WRAPPER_TEXT.controlKicker`; `classification`, `made`, `checked`, `approved`, `first` in one local constant with a TODO for S13. Unused `by` entry dropped (grep `L.by` = 0, research/33 B-08) |
| 2 | F-1: language from template data when `meta.language` absent | complete | New doc: R02 `version.resolvedParams["doc.language"]`. Existing doc: R20 `content.meta.language` (server stores template language at creation, `compose/merge.ts:87`), fallback R02 of the doc's template version. Explicit `meta.language` wins. Not added to DocMetaV2 (U3) |
| 3 | `meta.tier` forwarded | complete | New `MetaField` `tier`; normalised to upper case and checked against `STUDIO_TIERS` (`contract/enums.ts:11`); goes into `docMeta.tier`, so R04/R14 and the D-1 selector (`docMetaTier`) see it |
| 4 | D-6: old EN labels still parse | complete | `LEGACY_EN_LABELS` exported from `write-client.ts`; `write-meta.ts` `LABEL_SETS` = ID, EN (register), legacy EN |
| 5 | `Bab ${key}` fallback follows language | complete | `chapterLabelText(key, false, lang)` from `texts.ts` in `planChapters` (both sites) |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| `scripts/studio/mcp/write-client.ts` | modify | Label table rebuilt from `engine/front/texts.ts` (read-only import) + `CLIENT_ONLY_LABELS` (TODO S13); `controlFieldLabel` fails loudly at module load if a shared key disappears; `LEGACY_EN_LABELS`, `labelLangOf`; `frontSlots(m, warn, lang?)`; `planChapters`/`chapterKeys(..., lang = "ID")`; `buildClient` input `language?` (template/doc language, used only when meta has none) and output `language`; `tier` meta field (alias `tier`, `TIER_IGNORED` warning for values outside NOTA/TERBIT/SERAH), `docMetaOf` forwards `tier`; `META_IGNORED` known-list mentions `tier` |
| `scripts/studio/mcp/write-meta.ts` | modify | `LABEL_SETS` adds `LEGACY_EN_LABELS` (D-6). `studio_edit` meta: `tier` is now a known field, so it is explicitly ignored with `META_IGNORED` (see Decisions) instead of being silently dropped |
| `scripts/studio/mcp/write-client-run.ts` | modify | Only F-1 plumbing: `TemplateShape.language` from R02 `doc.language`; `writeClient` rebuilds `built` (and `slots`) with the document language through `relabel` before D-1 front-slot selection and preflight. D-1 logic (`frontSlotsForTier`, tier order `docMetaTier ?? srvMeta.tier ?? shape.defaultTier`, `FRONT_SLOTS_OMITTED`) unchanged; `srvMeta` hoisted out of the `tpl.slug` branch |
| `tests/unit/studio/mcp/s12-client-labels.test.ts` | add | 12 tests; MCP-level tests reuse the shared `implw3-client-mock` server, wrapping only R02 to return per-slug `doc.language`/`doc.defaultTier` |
| `delegation_progress/file_claims.md` | modify (append 1 row) | S12 claim row. Appended after the code was written, not before (process slip, reported) |

Not touched: `src/lib/studio/**`, `prisma/**`, `benchmark/**`, `implw2-client.test.ts`, `implw3-client-mock.ts`.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Baseline MCP suite (before edits) | `npx vitest run tests/unit/studio/mcp` | 31 files, 399 passed | |
| Red | `npx vitest run tests/unit/studio/mcp/s12-client-labels.test.ts` | 6 failed / 5 passed (11) | Failures: (a) labels ID instead of EN, existing-doc EN, builder `language`, (c) `meta.tier` undefined in R04, `TIER_IGNORED`, new entries `Checked` instead of `Reviewed by`. The 5 passes were the D-6 characterisation tests and the ID-template / explicit-ID checks |
| Green (new file) | same file, `--reporter=verbose` | 12 passed (12) | includes the tier-in-edit test added after green |
| MCP suite | `npx vitest run tests/unit/studio/mcp` | `Test Files 32 passed (32)`, `Tests 411 passed (411)` | 399 baseline + 12 new; no existing test changed |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0, no output | whole repo clean at the time of the run |
| Lint | `npx eslint scripts/studio/mcp/write-client.ts scripts/studio/mcp/write-meta.ts scripts/studio/mcp/write-client-run.ts tests/unit/studio/mcp/s12-client-labels.test.ts` | exit 0, no output | |
| Mutation check D-6 | temporarily removed `LEGACY_EN_LABELS` from `LABEL_SETS`, ran the new file, restored (diff empty) | 3 failed / 9 passed | the three D-6 tests bite without the alias |
| ID byte parity (ad hoc, not a suite) | `tsx` script comparing the pre-S12 `write-client.ts` (backup copy) with the new one, `buildClient` on 4 ID inputs (full meta, no number, `language: "id"`, minimal) with titled and empty headings | `4 SAME 0 DIFF`; EN old vs new differs only by Author/Prepared -> Prepared by, Checked -> Reviewed by, Approved -> Approved by, Bab n -> Chapter n (`true`) | `language` output field excluded from the comparison (new field) |

## Verification

- (a) `uji-en` template with R02 `doc.language: EN`, meta without language: cover labels `Document number, Revision, Prepared by, Classification`; control sheet title `Control Sheet GSP-UD1-NL-001`, revision note `First issue`, chain roles `Prepared by, Reviewed by, Approved by`; signature roles `Prepared by, Reviewed by, Approved by`; empty heading -> chapter title `Chapter 4`; R04 `meta` has no `language` key.
- (b) Same template with `meta.language: "ID"`: `Nomor dokumen, Revisi, Penyusun, Klasifikasi`, `Lembar Kendali ...`, `Terbit pertama`, chain `Penyusun, Diperiksa, Disetujui`, signature `Disusun, Diperiksa, Disetujui`, `Bab 4`; R04 `meta.language` = `ID`.
- (c) `datum-gsp` (default TERBIT) with `meta.tier: "nota"`: R04 `meta.tier` = `NOTA`; 0 R13 slot posts and 0 R08 slot preflights; warning `FRONT_SLOTS_OMITTED`; no `META_IGNORED`.
- (d) Legacy EN document (`Author`, `Prepared`, `Checked`, `Approved`): `serverClientMeta` returns author/checker/approver; `applyClientMeta` patches values in place, keeps the old labels, adds no duplicate entries; through MCP `studio_edit { meta: { checker } }` patches the existing `Checked` layer (chain stays 3 entries). New entries in an EN doc use `Reviewed by`.
- Rewrite of an existing doc whose server meta says `language: EN` uses EN labels without `meta.language`.
- ID labels byte-identical: parity script 4/4 SAME, and the 399 pre-existing MCP tests (which pin ID labels) pass unchanged.
- No slug or type branching added: `grep -n '"datum-\|uji-\|slug ===\|typeCode' scripts/studio/mcp/write-client.ts scripts/studio/mcp/write-meta.ts` finds nothing new; the language comes from template data only.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| none | - | - | - | no |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | Five client labels (`classification`, `made`, `checked`, `approved`, `first`) are not in `texts.ts`, which S13 owns | Kept in one local constant `CLIENT_ONLY_LABELS` with `TODO(S13)`. Request for the text-table owner: add these five entries (values as in the constant) to `texts.ts`, then `write-client.ts` imports them |
| 1 | `CONTROL_FIELD_LABELS` is typed `Record<string, ...>`, so a renamed key would be `undefined` silently | `controlFieldLabel` throws at module load if a key is missing |
| 1 | `by: "Diolah oleh" / "Compiled by"` entry unused (research/33 B-08) | Removed; no output uses it |
| 2 | How to get the template language (F-1 left it open) | R02 already fetched by D-1: `version.resolvedParams["doc.language"]`. For existing docs the server meta language is used first (it is the template language resolved at creation and the effective document language), then the template's R02. R19 fallback has no params, so language unknown -> ID labels (old behaviour) |
| 2 | Labels are built before the network (0-network guarantee for `META_MISSING`, `CONTENT_INVALID`) | The first build stays pre-network; once the language is known `buildClient` is rerun with the same input (pure), replacing `built` and `slots`. Warnings are kept from the first build to avoid duplicates (language does not change the warning set) |
| 2 | Should the inferred language be sent in DocMetaV2? | No: the server already applies `sent.language ?? doc.language`; sending it would add a field the agent did not send (U3) |
| 3 | Invalid `meta.tier` values | Dropped with warning `TIER_IGNORED` (template default tier used), in the style of `REV_DISPLAY_ONLY`; not sent to the server |
| 3 | `studio_edit` meta channel and `tier` | Before S12, `tier` was unknown and got `META_IGNORED`. Now it is known, and I kept it from being applied in edits: changing tier through setMeta can leave front slots that the new tier forbids (D-1). It returns `META_IGNORED` with the reason and leaves meta unchanged. If the controller wants tier editable via `studio_edit`, that needs front-slot cleanup and is a separate decision |
| 4 | D-6 scope | Legacy set includes `Approved` too (old EN `approved` label also changed), besides `Author`, `Prepared`, `Checked` |
| Process | `file_claims.md` row appended after coding instead of before | Reported. No overlap with other claims |
| Review | Behaviour change on the MCP write path (labels, language, tier) | Review recommended. Scope: diff of `write-client.ts`, `write-meta.ts`, `write-client-run.ts` (F-1 hunk only), new test file |

## Next Steps

- S13 (texts.ts owner): add `classification`, `made`, `checked`, `approved`, `first` to the shared text table; then a one-line follow-up in `write-client.ts` replaces `CLIENT_ONLY_LABELS` with the import.
- Controller: decide whether `meta.tier` should be editable via `studio_edit` (currently ignored with a warning).
- No commits, no DB, no ports. Temporary files outside the repo: `C:\Users\TRIAL\AppData\Local\Temp\write-client.before-s12.ts`, `write-meta.before-s12.ts`, `write-client-run.before-s12.ts`, `wm.keep`, and in the session scratchpad `old-write-client.ts`, `s12_parity.ts`, `s12_edit_client.py` (all safe to delete).

---

# Earlier report kept unchanged (2026-10-23, different blueprint)

# S12 coder-execution: engine/bind (port datumbind.py)

Status: complete. Tanggal 2026-10-23. Skills: backend-execution, dry-run-verify-fix.

Berkas (7, area `src/lib/studio/engine/bind/`): `index.ts` (re-ekspor; tanda tangan I02 §8.2 dipertahankan), `defect.ts` (BindDefect; dipisah agar tidak siklus), `format.ts` (fmt, withUnit, pyRound), `register.ts` (Register, normalizeRegisterEntry, Register.emit tanpa I/O), `arith.ts` (evalArith: tokenizer + recursive descent), `derivation.ts` (Derivation, checkResult, buildDerivationBlock, monoLine, inlineText), `audit.ts` (auditText, auditRetired, BIND_NUMBER_PATTERN_SOURCE). Klaim tambahan `defect.ts` ditambahkan ke file_claims.md.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/bind"` -> kosong (exit 1); total repo 21 galat, semuanya pra-ada di luar Studio (sama dengan marker S03).
- `npx eslint src/lib/studio/engine/bind` -> exit 0, tanpa keluaran.
- `grep -rnE "eval\(|new Function|vm\." src/lib/studio/engine/bind` -> kosong (exit 1).
- Paritas ad hoc (bukan suite uji) vs datumbind.py via VENV -I -B: fmt 15/15, evalArith 19/19 (repr float identik), auditText 4/4 identik; 12 ekspresi rusak/berbahaya (`__import__('os')`, `1/0`, `sqrt(-1)`, `10**400`, ...) semuanya BindDefect; Register menolak satuan kosong/spasi, tanda kosong, tanda tak dikenal; glif tanda dinormalisasi.

Keputusan (dicatat controller):
1. fmt meniru Python persis: half-even atas nilai biner eksak (BigInt), bukan toFixed; `-0` dipertahankan seperti Python. Nilai tak hingga dan dec di luar 0..20 -> BindDefect (Python mencetak "nan"/"inf").
2. Register memvalidasi saat konstruksi (semantik emit Python) termasuk `dec` 0..3 per kontrak; LIMIT E-12 (_known berhenti di dec 3) dipertahankan.
3. Subhimpunan Python di parser: + - * / // % **, unary, kurung, abs/round/sqrt/min/max; nama register berspasi dicocokkan terpanjang dulu plus alias garis bawah. Lebih ketat dari Python: perbandingan/boolean/hex ditolak, hasil non-hingga ditolak (Python meloloskan NaN pada cek toleransi), batas panjang 4096 dan kedalaman 100. Bilangan bulat besar > 2^53 tidak eksak (double JS).
4. Derivation: konstruktor stub (id, title, register) dipertahankan + opsi {width, note}; `label` = `id · title` (caption milik renderer). Baris terstruktur `rows` + baris mono Python `lines`. `verdict` mendukung `direction` kontrak (Python hanya <=).
5. auditRetired melempar BindDefect untuk entri kosong (Python akan selalu menandai ""). audit_docx (ekstraksi teks DOCX) tidak diport: pemanggil menyerahkan teks.
6. Tidak ada jalur catch yang menelan galat; satu catch di `Derivation.result` membungkus ulang menjadi BindDefect (dilempar ke layanan yang mencatat).

Permintaan lintas pemilik: tidak ada. Temuan: tidak ada. Review direkomendasikan (S85, lingkup engine/bind).

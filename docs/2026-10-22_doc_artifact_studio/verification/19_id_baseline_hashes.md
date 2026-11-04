---
task_slug: doc_artifact_studio
row: S05
date: 2026-11-04
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/identification/02_structured_datum_rev_a.md
status: complete
---

# S05: ID output baseline from tag prod-v2.1-20261104

## Summary

The baseline was recorded in a temporary git worktree outside the repo folder. It was taken at tag `prod-v2.1-20261104`, which is commit `35664867a77cda578cf9aa9c5529c6ba65ef25af`. The worktree was removed and pruned afterwards.

- `convert_v2 --check` printed SAME for all 3 files and exited 0.
- The clean-SVG manifest test passed (4/4).
- The wrapper-text parity test passed (11/11).
- The render, compose and renderer suites passed (33 files, 377 tests).
- 8 ID sample files were rendered: 2 profiles x 2 tiers x DOCX/HTML. Each was rendered 3 times and all runs were byte-identical.
- No normalisation is applied to the hashed bytes.
- Every output is saved under `C:\Users\TRIAL\gsp-backups\datum-rev-a-baseline\`.

AC-7 rule for later rows (S19): re-run the script on the edited tree with the frozen inputs. Every one of the 8 hashes must stay SAME. `convert_v2 --check` must print SAME and the manifest test must stay green.

## 1. Worktree (isolated, outside the repo)

| Step | Command | Result |
|---|---|---|
| Tag check | `git rev-parse prod-v2.1-20261104^{commit}` | `35664867a77cda578cf9aa9c5529c6ba65ef25af` |
| Create (attempt 1) | `git worktree add --detach C:/Users/TRIAL/wt-datum-baseline prod-v2.1-20261104` | Created, but the files were checked out with CRLF line endings. Global `core.autocrlf=true` caused this, and `convert_v2 --check` then printed DIFF (see Issues) |
| Create (final) | `git -c core.autocrlf=false worktree add --detach C:/Users/TRIAL/wt-datum-baseline prod-v2.1-20261104` | `HEAD is now at 3566486`. `doc.v2.json` sha256 `79290e07...` matches the main tree's LF checkout |
| node_modules | `cmd /c "mklink /J C:\Users\TRIAL\wt-datum-baseline\node_modules C:\Users\TRIAL\gsp-swarm-hq-v2.1\node_modules"` | Junction created and used read-only. No `npm ci` was needed |
| Runtime assets | `cp -r <main>/data/studio-workspace/assets <wt>/data/studio-workspace/` | 81 files, 9.4 MB, copied (not linked). The gitignored asset store is needed by `fixhz2-decorative-d16.test.ts` |
| Remove | `cmd /c rmdir <wt>\node_modules` (removes the junction only), then `git worktree remove C:/Users/TRIAL/wt-datum-baseline` and `git worktree prune -v` | `git worktree list` shows only the main tree. The folder is gone. The main `node_modules` still has 505 entries |

The main working tree was never checked out, stashed, reset or edited. The only exception is the new script described in section 3.

## 2. Validation commands at the tag (run in the worktree)

The logs are copied to `C:\Users\TRIAL\gsp-backups\datum-rev-a-baseline\test_logs\`.

| Check | Command | Result |
|---|---|---|
| convert_v2 | `npx tsx benchmark/extract/convert_v2.ts --check` | exit 0. All three files print SAME (output below) |
| clean-SVG manifest | `npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts` | `Test Files 1 passed (1)`, `Tests 4 passed (4)` |
| wrapper-text parity | `npx vitest run tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts` | `Test Files 1 passed (1)`, `Tests 11 passed (11)` |
| render/compose parity | `npx vitest run tests/unit/studio/renderers tests/unit/studio/compose tests/unit/studio/render/` | `Test Files 33 passed (33)`, `Tests 377 passed (377)`, 68.9 s |

The 33 files are all of `tests/unit/studio/renderers/**`, `tests/unit/studio/compose/**` and `tests/unit/studio/render/**`. Besides the wrapper-text test, they include these parity and determinism tests:
- `fixf-device-placement-parity`
- `docx-determinism`, which carries the cross-session sha anchor
- `dc12-contract-record-html` and `dc13-contract-record-docx`
- `dcwire-snapshot-state` and `dc10-contract-record`

`convert_v2 --check` output, with the stats line shortened:

```
SAME benchmark/manual000/doc.v2.json sha256=79290e0732be7253ac0eb6ea3774e411f8e165049908da8595f4a22331c1ee15
SAME benchmark/manual000/template.v2.json sha256=882057c5743273fed1b444a47df64a5dcbe1331a4262f3d8d290a1c1be1c6ba2
SAME benchmark/manual000/datum-manual-000.preset.json sha256=a951b149180345951355c1935e42093334f19789a583e6c7b495cd6abb18804c
{"tables":94,"tablePresets":72,"glyphRuns":42, ... }
```

The full studio suite was not run at the tag. It contains DB-bound `api-contract/*-db` tests, and the worktree has no `.env`. Running the full suite is S19's gate.

## 3. ID sample renderer

The script is `benchmark/datum_conformance/baseline/render_id_samples.ts` in the main repo. It is a new file, owned by S05, with sha256 `7a667f75efafd4a6ed94de4539e5001721f119867d95bb6b3e7659e9354ad181` at baseline time.

- It uses only Node built-ins. It renders with the target tree's own DB-less CLI, `<root>/scripts/parity/run/render_cli.ts`, run through `<root>/node_modules/tsx`.
- That CLI is the production-equivalent pure path: `resolveMetaDefaults` -> `mergeSubmission` (seeded pids) -> `composeV2` with per-slot effective values -> `renderSnapshot` (DOCX + HTML, lint, no PDF).
- It is checked with `tsc --strict` (exit 0) and `eslint` (exit 0).

### Cases

All cases use language ID, `issueDate` 2026-11-04, docNumber `017/GSP/KT/XI/2026` rev A, and pid seed `s05-datum-id-baseline`.

| Case | Tier | Slots composed | Content |
|---|---|---|---|
| `a_terbit_datum_gsp` | TERBIT | cover, controlSheet, signature (in the control sheet), toc, content, references, appendices | 2 chapters, ordered list, derivation, table, appendix A |
| `b_nota_datum_gsp` | NOTA | content, references, appendices | Same body. The front slots are inactive at NOTA in the DATUM skeleton, so they are not sent |
| `a_terbit_datum_kanonik` | TERBIT | same as `a_terbit_datum_gsp` | same as `a_terbit_datum_gsp` |
| `b_nota_datum_kanonik` | NOTA | same as `b_nota_datum_gsp` | same as `b_nota_datum_gsp` |

Details of the sample content:
- **Derivation:** it reads register entries `biaya_material` (1000000.25 Rp), `biaya_jasa` (250000.25 Rp) and `biaya_total` (v = 1250000.5, dec 2, unit `Rp`).
  - Result expression: `biaya_material + biaya_jasa`.
  - Verdict: limit 1500000.
- **Rendered value:** `Rp 1.250.000,50` appears in the DOCX `word/document.xml` and in the HTML of all 4 cases. This was checked with grep.
- **Front matter:** in the TERBIT HTML, `data-wrapper` values `cover`, `controlSheet` and `toc` are present. "Disusun" and "A. Pratama" (the signature), "Riwayat revisi", "Daftar Isi", "BAB 2", "Lampiran A" and the table caption appear in both DOCX and HTML.

### Profiles

The real `datum-gsp` profile lives in the DB, so the script rebuilds it without a DB.

- **`datum_gsp`** = `benchmark/manual000/template.json`, with these changes:
  - The `lint.enforcement*` overrides are removed, as in seed `toDatumGspProfile`.
  - The 4 decided values of the GSP DATUM preset are applied (seed `PRESET_MIGRATIONS`): `device.registerBlock.boldFields`, `symbol.sheet.fit=true`, `table.widthClass=full`, `render.rail.renderer=framePr`.
  - The result is written as `inputs/datum-gsp.preset.json` and loaded through `studio.template/v2` (`datum_gsp.template.v2.json`). That template has `essentials {"doc.language":"ID"}` and the 7-slot DATUM skeleton (SL-01..SL-07).
- **`datum_kanonik`** = the same template v2 with no preset, which means registry defaults.

This is a regression fixture, not a byte-for-byte copy of the production DB version. The DB version's preset chain and per-slot essentials from `buildSkeletonSlots` are not reproduced. The template v2 file path also adds no canonical font assets.

### Hashes (baseline, 3 runs per case, all runs identical)

| Case | Format | Bytes | sha256 |
|---|---|---|---|
| a_terbit_datum_gsp | DOCX | 1951102 | `633e583f59dee6c9bbd8544e60b4cc1538de58cf91a56ea16a284ca2efe9e6af` |
| a_terbit_datum_gsp | HTML | 2596745 | `8fff270959d453895ea710c5ff2a23175c1ea2545e56c05d6959327a6a6ca06d` |
| b_nota_datum_gsp | DOCX | 1906703 | `5aeac7ccd1399fd38d8ba02c15b2db1dedc41ba7f79d1ef389ab9c53458c38dd` |
| b_nota_datum_gsp | HTML | 2567727 | `50c46a6f6f1aa2c91fd8097db2dd083f31ded46e0edbb260e12d669d97048381` |
| a_terbit_datum_kanonik | DOCX | 1245182 | `bbbfe86e278178e7dc46b108d0fa6f639c1a2b760514825346a8577fbbb171c3` |
| a_terbit_datum_kanonik | HTML | 2589337 | `41c4a373cff853f8422f854efdf74ee1d70ab89f2369ab4b479f0c546c67afa2` |
| b_nota_datum_kanonik | DOCX | 1200646 | `3146b14cba5aeea578b8389353f24fc4d68720fb961c573925d93b9ecb0a2d85` |
| b_nota_datum_kanonik | HTML | 2561538 | `030e1cda33e3736643fc2ac6f264280daeb9790fdf31496dd1303d2c0e21b288` |

Determinism was also checked across processes and output paths. A separate earlier trial run into a different output folder gave the same 8 hashes. The output path does not leak into the bytes.

Per-case information is stored in `hashes.json` under `cases`. It is not compared byte-for-byte. Compose snapshot sha256 values:

| Case | Compose snapshot sha256 |
|---|---|
| a_terbit_datum_gsp | `7d34d7ccb77a448a0d7e798c4c4bc4c5db7ea91520e8c347becb5d43c862bf2b` |
| b_nota_datum_gsp | `cade0fd5e8fef990f2e98e7224befd797b05704e4fca31a0857911dba0e465a8` |
| a_terbit_datum_kanonik | `04287bf80df3f1d6dce0e67572387505f7fadd9fe4bc41c884a0ff48d87ad37f` |
| b_nota_datum_kanonik | `5c0b2c6cfbbfc240b52d136fdd89bc02cc0580d7d16c6fce51d6a1aa1d24c45f` |

Every case had 0 compose warnings. Lint results:

| Tier | Lint status | Failed checks |
|---|---|---|
| TERBIT (both profiles) | FAIL | C-27, D16, D17, D18, DATUM-15 |
| NOTA (both profiles) | PASS | C-27 and DATUM-15 are reported, but they do not block at NOTA |

These are content-quality findings on a short sample, such as sentence length, missing issueStampColophon, identity paragraph and closingAction. They are not render defects, and they do not affect the hashes.

Input hashes (from `hashes.json` `inputs`):

| Input | sha256 |
|---|---|
| a_terbit_datum_gsp.doc.v2.json | `e73089c486d67043160415ad4419e586fe6c299001d718f79705a6c507cb20b1` |
| a_terbit_datum_kanonik.doc.v2.json | `f7c250bc4f5d0ab98b4f9e50160e29f490f993d44de5658336f066b654e4977d` |
| b_nota_datum_gsp.doc.v2.json | `0e57617ae327f9097a61041abbad48d842384c6acb9fb50394affb7c5f52ce02` |
| b_nota_datum_kanonik.doc.v2.json | `282d718757ca0559ac2e543d5d80000d8f6cf057b9b8e40011868067f8661614` |
| datum-gsp.preset.json | `560bc7e7e091c1e4806790dca9b2f6f874a844ed0075fa3ee821c52f1d57aeca` |
| datum_gsp.template.v2.json | `a4e427ad94308a8a21e1980c29f73ef2a2ed7d0e6d380fa41e13f142f6c034ae` |
| datum_kanonik.template.v2.json | `01ba652b7964c0356cce627e1f33ef06224e2d062f37648cc40abd6807295e06` |

### Normalisations

None are applied to the hashed DOCX or HTML bytes. The script gets determinism from its inputs, and `--runs` proves it on every run:

| Possible source of nondeterminism | How it is handled |
|---|---|
| Issue date (the service default is today in Asia/Jakarta) | `meta.issueDate` is always sent as `2026-11-04`. The engine sets the ZIP entry mtime to the issue date |
| Generated ids (pids) | `--pid-seed s05-datum-id-baseline` is passed explicitly |
| `author` default | `meta.author` is sent explicitly |
| `durationMs`, job id, absolute paths | These exist only in `render_report.json` and `render_log.jsonl`, which are not hashed |
| DATUM file name | Content is hashed through a copy with a stable name, `<case>.<docx\|html>`. The DATUM file name is kept beside it |

## 4. How to re-run the comparison (S19 and later rows)

Run this from the main repo root:

```
npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts \
  --root C:/Users/TRIAL/gsp-swarm-hq-v2.1 \
  --out C:/Users/TRIAL/AppData/Local/Temp/s05cmp \
  --inputs C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline/inputs \
  --compare C:/Users/TRIAL/gsp-backups/datum-rev-a-baseline
```

- **Pass:** the output ends with `compare: 8/8 SAME` and the exit code is 0.
- **Fail:** any `DIFF` line gives exit 1. A nondeterministic run prints `NONDETERMINISTIC ...` and also gives exit 1.
- **Informational lines:** `INPUT-DIFF` and `INFO compose snapshot ...` explain a difference but do not fail the run on their own.

Rules for re-running:
- Always pass `--inputs <baseline>/inputs`. Without it, the `datum_gsp` preset is rebuilt from the edited tree's `benchmark/manual000/template.json`. Then a profile edit would look like an engine regression, or would hide one.
- Never use the baseline folder as `--out`, because the script empties `<out>/inputs` and `<out>/cases`. Use a short temp path. The scratchpad path was too long for Win32 child processes (`File name too long`).
- Side effect: each render appends one `PROFILE_NORMALIZED` info line to `<root>/data/studio-workspace/logs/templates/templates-<date>.jsonl`. That is the template service's own logging. No DB is used and no port is opened.

Other AC-7 checks to repeat on the edited tree:
- `npx tsx benchmark/extract/convert_v2.ts --check` must print SAME x3. This needs an LF checkout. With global `core.autocrlf=true`, a fresh worktree must be created with `git -c core.autocrlf=false worktree add ...`.
- `npx vitest run tests/unit/studio/figures/clean-svg-manifest.test.ts` must pass 4/4.
- `npx vitest run tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts` must pass 11/11.
- `npx vitest run tests/unit/studio/renderers tests/unit/studio/compose tests/unit/studio/render/` must pass 377/377, or more if tests are added.

To record the baseline again from the tag:

```
git -C C:/Users/TRIAL/gsp-swarm-hq-v2.1 -c core.autocrlf=false worktree add --detach C:/Users/TRIAL/wt-datum-baseline prod-v2.1-20261104
cmd /c "mklink /J C:\Users\TRIAL\wt-datum-baseline\node_modules C:\Users\TRIAL\gsp-swarm-hq-v2.1\node_modules"
npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root C:/Users/TRIAL/wt-datum-baseline --out <dir> --runs 3
cmd /c "rmdir C:\Users\TRIAL\wt-datum-baseline\node_modules"
git -C C:/Users/TRIAL/gsp-swarm-hq-v2.1 worktree remove C:/Users/TRIAL/wt-datum-baseline
git -C C:/Users/TRIAL/gsp-swarm-hq-v2.1 worktree prune
```

Always remove the junction before `worktree remove`. With the junction still in place, `--force` could delete through it into the main `node_modules`.

The compare mode was checked both ways against the worktree:
- **Positive:** a re-run with `--inputs`/`--compare` against the baseline gave `compare: 8/8 SAME`.
- **Negative:** a hash was tampered in a copy of `hashes.json`. The run gave `DIFF a_terbit_datum_gsp DOCX ...`, `compare: 7/8 SAME` and exit 1.

## 5. Baseline folder contents

The folder is `C:\Users\TRIAL\gsp-backups\datum-rev-a-baseline\`. It contains:

| Path | Contents |
|---|---|
| `inputs/` | The 7 frozen inputs |
| `cases/<case>/` | The DATUM-named DOCX and HTML, the stable-named copies, `render_report.json` and `render_log.jsonl` |
| `hashes.json` | Schema `datum-id-baseline/v1`, gitHead `3566486...`, inputs, files and cases |
| `hashes.sha256` | Hashes in `sha256sum` format |
| `test_logs/` | `convert_check.txt`, `vt_manifest.txt`, `vt_fix2.txt`, `vt_parity2.txt` |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 1 | The first worktree checkout used CRLF because global `core.autocrlf=true`. `convert_v2 --check` printed DIFF x3, because the generator writes LF | The worktree was recreated with `-c core.autocrlf=false`, which gave SAME x3. The main tree and production are LF checkouts, and the main `doc.v2.json` sha matches |
| 2 | `fixhz2-decorative-d16` failed with ENOENT on `data/studio-workspace/assets/518c12f8...png`. The asset store is gitignored runtime data | The asset store was copied (not linked) into the worktree, and the suite then passed 33/33. This was an environment issue, not a code issue |
| 3 | The real `datum-gsp` profile exists only in the DB | It is rebuilt from the Manual 000 profile with the seed's transformation and frozen in `inputs/`. It is labelled as a regression fixture, not production equality |
| 3 | Added a `datum_kanonik` profile beyond the brief | It also guards registry defaults, which Phase 0 must not change. Its cost is 4 more files |
| 3 | `render_cli` reports formats in lower case | The script normalises the format name for selection. This does not change the bytes |
| - | `delegation_progress/file_claims.md` was not appended | The brief limits writes to the named files |

## Next Steps

- S19: run section 4 on the edited tree and require 8/8 SAME plus the other AC-7 checks.
- Review recommended, with this scope: `benchmark/datum_conformance/baseline/render_id_samples.ts`. Check that the case content is acceptable as the ID regression fixture.

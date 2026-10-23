# S30: diagram build (coder-execution)

- Status: complete. Skills: backend-execution, dry-run-verify-fix. This is a pure geometry module with no I/O and no catch paths, so persistent logging does not apply.
- Files (`src/lib/studio/engine/diagram/build/`):
  - `index.ts`: I20 `routeEdges`, `addCrossingHops`, `buildDiagramSvg`. Dependencies come from the `validateSpec` core and `DIAGRAM_LAYOUTS` D01.
  - `place.ts`: runs `LayoutFn` on the core `Sheet`, keeps Python dict insertion order, then runs `snapToLattice`.
  - `route.ts`: `route_edges`, `_detour`, `add_crossing_hops`.
  - `svg.ts`: `build_svg`, `_label_pos`, and `buildDiagramSvgWith` (deps injected for tests).
- The SVG primitives, tokens, and the colour and floor checks are imported from S26 core (D-50), not duplicated. An earlier draft had a copy of the tokens (`garis-a.ts`, created by S30). That file was deleted before delivery.
- Guards:
  - `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/diagram/build"` returns nothing (grep exit 1).
  - `npx eslint src/lib/studio/engine/diagram/build` exits 0 with no output.
- Parity dry-run (scratch, not a test suite): VENV `-I -B` Python `build_svg` vs TS `npx tsx`, release=false. Spec set: good_layered, good_sld, plus 6 synthetic specs covering flow+per_row+zone+5 shapes+accent/secondary, swimlane figure, sequence with self-message, graph with 5 crossing hops and numeric ids, topology with numeric ids and shadowed, and rack.
  - SVG: 8/8 byte-identical after stripping `data-mark/series/index` and the generator comment.
  - Report (`checks_run`, `colour_values`, `n_colour`, `n_hops`, `n_nodes`, `n_edges`, apparatus, family): 8/8 identical.
  - Determinism: two TS builds of the same spec give identical SVG.
  - `bad_cases.json` with release=true: 16/17 messages identical. The 17th (E-17) differs only by the `DIAGRAM DEFECT: ` prefix that layout-c (S29) adds.
- `data-mark`: `node` on node shapes and `link` + `data-series` + `data-index` on connectors (via core). The glyphs, KEY, and labels carry none.

## Decisions
| # | Decision | Reason |
|---|---|---|
| 1 | Node order: `Object.keys(layout.nodes)` when no id is an integer. Otherwise the Python insertion order is rebuilt per engine (tier/lane groups, all sld buses first (D-89), rack sorted by row, others in `s.nodes` order). | Layouts return a `Record`. Order decides which blocker `_detour` picks and the element order (D-41). |
| 2 | Routing uses box sides, not S31 symbol ports (D-42). | Matches Python. |
| 3 | `addCrossingHops` returns `HoppedEdge` (`d` + `hops`). Arcs are drawn separately after all paths. `buildDiagramSvg` returns `DiagramSvgResult` (report superset: colourValues, nHops, ...). | Keeps the Python element order. Both are subtypes of the contract types. |
| 4 | release=false with labels_verified not true adds the issue `P1-labels_verified` NOT_RUN (draft). | Honest draft status for S51 (D-27). |
| 5 | The DATUM-29/30 caption is compared in escaped form. A missing `edges` key is treated as []. | Python raises a false defect on titles containing &<>, and crashes (KeyError) without `edges`. |

## Findings (for the register)
- F-S30-1 (D-64): build matches Python on all 6 S94 diagram specs: same verdict, same message (bm-fig-06 SVG byte-identical). The failures come from the specs (S94):
  - 08: hexagon `gerbang` causes DATUM-35. After switching to box it builds and is identical to Python.
  - 23: doubled `fw` causes DATUM-35. After switching to box it fails DATUM-33 (300.04 mm).
  - 24: 6 empty edge labels cause DATUM-24. After filling them it fails DATUM-37 (`akhir1` at x=192).
  - 38: 10 empty labels cause DATUM-24. Then at 166 mm it fails DATUM-37 (bus snaps to 170.667, same in Python). At 128 mm it fails DATUM-37 (`q1`).
  - 25: no `edges` key (Python KeyError). With [] it fails DATUM-33 (247.65 > 247).
  - 23/24/25/38 need figure restructuring (fewer tiers/branches, or split), not just a one-field fix.
- F-S30-2: S66 harness DG `markCountDelta` 0. The reference has no `data-mark` (rect heuristic) while TS uses `data-mark` (node+link), so a.markCount will differ. S78 needs to compare with marks stripped or with `dataMarks:false`.
- Cross-owner requests: none.

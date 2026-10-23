/**
 * Daftar 41 simbol DATUM (iec 16, isa 12, sec 7, mil 6) dan satu fixture
 * lembar per dialek (S63, kelas paritas SY, research/06 6.2).
 *
 * Sumber daftar: keluaran `VENV -I -B HS/datumsimbol.py --list` (urutan
 * dialek lalu id terurut, "TOTAL 41 simbol"). Validator membandingkan daftar
 * ini dengan `SYMBOL_IDS` mesin Node (engine/symbols, S31).
 * Bentuk fixture mengikuti adapter H03 (`ref_fig.py --kind symbol`):
 * simbol tunggal `{ "id": "dialek:nama" }`, lembar `{ "sheet": "<dialek>", "cols": 3 }`.
 */
import type { SymbolDialect } from "../../../../src/lib/studio/contract";

export const SYMBOL_LIST: readonly string[] = [
  "iec:arrester",
  "iec:battery",
  "iec:breaker",
  "iec:busbar",
  "iec:changeover",
  "iec:contactor",
  "iec:ct",
  "iec:disconnector",
  "iec:earth",
  "iec:enclosure",
  "iec:fuse",
  "iec:generator",
  "iec:lamp",
  "iec:motor",
  "iec:switch",
  "iec:transformer",
  "isa:auxiliary",
  "isa:computer",
  "isa:field",
  "isa:inaccessible",
  "isa:plc",
  "isa:primary",
  "isa:shared",
  "isa:shared-field",
  "isa:valve",
  "isa:valve-diaphragm",
  "isa:valve-motor",
  "isa:valve-solenoid",
  "mil:friend",
  "mil:friend-air",
  "mil:hostile",
  "mil:hostile-air",
  "mil:neutral",
  "mil:unknown",
  "sec:barrier",
  "sec:camera",
  "sec:fence",
  "sec:mast",
  "sec:pir",
  "sec:ptz",
  "sec:reader",
];

export const SYMBOL_COUNTS: Readonly<Record<SymbolDialect, number>> = { iec: 16, isa: 12, sec: 7, mil: 6 };

/** Satu fixture lembar per dialek (cols 3 = default HS sheet_svg). */
export const SYMBOL_SHEETS: ReadonlyArray<{ id: string; file: string; dialect: SymbolDialect; spec: { sheet: SymbolDialect; cols: number } }> = (
  ["iec", "isa", "sec", "mil"] as const
).map((d) => ({ id: `sy-sheet-${d}`, file: `symbol/sheet_${d}.json`, dialect: d, spec: { sheet: d, cols: 3 } }));

/**
 * S20 (blueprint 02_structured_datum_rev_a.md, AC-8; D-592, D-593): pengukur konformitas DATUM Rev A.
 * Pakai dan kode exit: lihat `lib/cli.ts`.
 */
import { runCli } from "./lib/cli";

runCli(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    console.error(`galat tak tertangani: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
    process.exitCode = 2;
  },
);

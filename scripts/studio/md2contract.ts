/**
 * CLI importer laporan kerja agen Markdown lama -> `studio.doc/v2` jenis kontrak (DC-25;
 * register masterplan/05_document_contract_specs.md §16, §16.6; KD-42; BA-25; generator DC-24).
 *
 *   npx tsx scripts/studio/md2contract.ts <laporan.md> --kind agentWorkReport [opsi] > dokumen.json
 *
 * Opsi:
 *   --kind <jenis>        jenis kontrak (wajib; saat ini hanya `agentWorkReport`)
 *   --mission <folder>    folder misi dokumen -> `mission.folder`
 *   --doc-key <k>         kunci dokumen dalam misi (hanya bersama --mission)
 *   --doc-number <no>     nomor dokumen -> `meta.docNumber`
 *   --doc-title <T>       judul dokumen (menimpa judul `#` pertama)
 *   --status <kode>       status laporan bila kepala laporan tidak memberinya (kode atau alias GS)
 *   --reported-at <t>     waktu laporan bila sumber tidak memuatnya (tanggal atau waktu ber-zona C37)
 *   --entry <n|last>      untuk berkas PHASE-REPORTS: entri ke-n (mulai 1) atau `last` (bawaan)
 *   --strict              keluar dengan kode 1 bila ada peringatan pemetaan atau unsur yang dibuang
 *   --out <berkas.json>   tulis dokumen ke berkas, bukan ke stdout
 *
 * Status laporan dan waktu laporan tidak pernah ditebak (KD-42): bila sumber tidak memberi nilai
 * berpeta dan opsi tidak diberikan, CLI berhenti dengan kode 3 dan menyebut opsi yang harus diisi.
 *
 * Keluaran stdout (atau --out): satu `studio.doc/v2`, indentasi 2 spasi + LF; masukan dan opsi
 * sama = byte sama (tanpa cap waktu). Laporan pemetaan (peringatan CW-xx, bab, butir) ke stderr;
 * unsur yang dibuang importer prosa (`mapping.prose[].dropped`, mis. LIST_NESTING, THEMATIC_BREAK)
 * dilaporkan ke stderr per kode (jumlah + baris sumber) dan ikut dihitung oleh --strict.
 * Kode keluar: 0 sukses; 1 ada peringatan atau unsur dibuang dengan --strict, atau dokumen tidak sah
 * menurut validator v2; 2 galat pemakaian atau berkas; 3 nilai wajib hilang (status / waktu laporan).
 * Hanya mengubah: tidak menyimpan ke Studio dan tidak membuka jaringan.
 */
import fs from "node:fs";
import type { MdImportDropped } from "../../src/lib/studio/services/import/types";
import { CONTRACT_KINDS, type ContractKind } from "../../src/lib/studio/contract";
import { StudioEngineError } from "../../src/lib/studio/contract/errors";
import {
  ContractImportError,
  markdownToContract,
  type ContractImportOptions,
  type ContractImportReport,
} from "../../src/lib/studio/services/import/contract";

const USAGE =
  "pemakaian: npx tsx scripts/studio/md2contract.ts <laporan.md> --kind <jenis> [--mission FOLDER [--doc-key K]] " +
  "[--doc-number NO] [--doc-title T] [--status KODE] [--reported-at WAKTU] [--entry N|last] [--strict] [--out BERKAS.json]";

const HELP = [
  USAGE,
  "",
  "Mengubah satu laporan kerja agen Markdown lama (laporan tunggal atau entri PHASE-REPORTS) menjadi",
  "satu dokumen studio.doc/v2 jenis kontrak. Tidak mengirim apa pun ke server.",
  "",
  `  --kind <jenis>          jenis kontrak (wajib): ${CONTRACT_KINDS.join(", ")}`,
  "  --mission <folder>      folder misi dokumen, mis. 2026-10-22_kajian-gardu",
  "  --doc-key <k>           dokumen ke-sekian dalam misi yang sama (hanya bersama --mission)",
  "  --doc-number <no>       nomor dokumen (meta.docNumber)",
  '  --doc-title <T>         judul dokumen (menimpa judul "# ..." di berkas)',
  "  --status <kode>         status laporan bila kepala laporan tidak memberinya (kode atau alias)",
  "  --reported-at <waktu>   waktu laporan bila sumber tidak memuatnya, mis. 2026-10-30T10:00:00Z",
  "  --entry <n|last>        entri PHASE-REPORTS yang diimpor: nomor mulai 1, atau last (bawaan)",
  "  --strict                keluar dengan kode 1 bila ada peringatan pemetaan atau unsur yang dibuang",
  "  --out <berkas.json>     tulis dokumen ke berkas, bukan ke stdout",
  "  -h, --help              tampilkan bantuan ini",
  "",
  "Status dan waktu laporan tidak pernah ditebak: bila sumber tidak memuatnya dan opsinya tidak",
  "diberikan, CLI keluar dengan kode 3 dan menyebut opsi yang harus diisi.",
  "",
  "Contoh:",
  "  npx tsx scripts/studio/md2contract.ts LAPORAN-SELESAI.md --kind agentWorkReport \\",
  "    --reported-at 2026-10-30T10:00:00Z --mission 2026-10-22_kajian-gardu > laporan.json",
  "",
  "Kode keluar: 0 sukses, 1 peringatan atau unsur dibuang dengan --strict, atau dokumen tidak sah, 2 galat pemakaian atau",
  "berkas, 3 nilai wajib hilang.",
].join("\n");

const VALUE_FLAGS = new Set([
  "--kind",
  "--mission",
  "--doc-key",
  "--doc-number",
  "--doc-title",
  "--status",
  "--reported-at",
  "--entry",
  "--out",
]);

function fail(message: string, code: 2 | 3 = 2): never {
  process.stderr.write(`md2contract: ${message}\n${code === 2 ? `${USAGE}\n` : ""}`);
  process.exit(code);
}

function parseArgs(argv: string[]): { file: string; flags: Map<string, string>; strict: boolean } {
  const flags = new Map<string, string>();
  let file: string | null = null;
  let strict = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict") strict = true;
    else if (a === "-h" || a === "--help") {
      process.stdout.write(`${HELP}\n`);
      process.exit(0);
    } else if (VALUE_FLAGS.has(a)) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) fail(`${a} memerlukan nilai`);
      flags.set(a, v);
      i++;
    } else if (a.startsWith("--")) fail(`opsi tidak dikenal: ${a}`);
    else if (file === null) file = a;
    else fail(`argumen tidak terduga: ${a}`);
  }
  if (file === null) fail("berkas <laporan.md> belum diberikan");
  return { file, flags, strict };
}

function optionsOf(flags: Map<string, string>): ContractImportOptions {
  const kind = flags.get("--kind");
  if (kind === undefined) fail(`--kind wajib diisi (${CONTRACT_KINDS.join(", ")})`);
  if (!(CONTRACT_KINDS as readonly string[]).includes(kind)) fail(`--kind tidak dikenal: ${kind} (tersedia: ${CONTRACT_KINDS.join(", ")})`);
  const mission = flags.get("--mission");
  const docKey = flags.get("--doc-key");
  if (docKey !== undefined && mission === undefined) fail("--doc-key memerlukan --mission");
  for (const f of ["--mission", "--doc-key", "--doc-number", "--doc-title", "--status", "--reported-at"]) {
    const v = flags.get(f);
    if (v !== undefined && v.trim() === "") fail(`${f} tidak boleh kosong`);
  }
  const rawEntry = flags.get("--entry");
  let entry: number | "last" | undefined;
  if (rawEntry !== undefined) {
    if (rawEntry === "last") entry = "last";
    else if (/^[1-9][0-9]{0,8}$/.test(rawEntry)) entry = Number(rawEntry);
    else fail("--entry harus bilangan bulat >= 1 atau last");
  }
  return {
    kind: kind as ContractKind,
    ...(mission !== undefined ? { mission } : {}),
    ...(docKey !== undefined ? { docKey } : {}),
    ...(flags.has("--doc-number") ? { docNumber: flags.get("--doc-number") } : {}),
    ...(flags.has("--doc-title") ? { docTitle: flags.get("--doc-title") } : {}),
    ...(flags.has("--status") ? { status: flags.get("--status") } : {}),
    ...(flags.has("--reported-at") ? { reportedAt: flags.get("--reported-at") } : {}),
    ...(entry !== undefined ? { entry } : {}),
  };
}

/** Peringatan pemetaan ke stderr (maks 20 baris; sisanya diringkas), urut baris sumber. */
function printWarnings(report: ContractImportReport): void {
  const w = report.warnings;
  for (const x of w.slice(0, 20)) process.stderr.write(`  ${x.code} baris ${x.line === 0 ? "-" : x.line}: ${x.message}\n`);
  if (w.length > 20) process.stderr.write(`  ... dan ${w.length - 20} peringatan lain\n`);
}

/** Seluruh unsur dibuang importer prosa (semua bab), urut baris sumber lalu kode. */
function collectDropped(report: ContractImportReport): MdImportDropped[] {
  return report.mapping.prose.flatMap((p) => p.dropped).sort((a, b) => a.line - b.line || a.code.localeCompare(b.code));
}

/** Unsur dibuang ke stderr, dikelompokkan per kode: jumlah + baris sumber (maks 10 baris per kode). */
function printDropped(dropped: MdImportDropped[]): void {
  if (dropped.length === 0) return;
  process.stderr.write(`  unsur dibuang importer prosa: ${dropped.length}\n`);
  const byCode = new Map<string, MdImportDropped[]>();
  for (const d of dropped) byCode.set(d.code, [...(byCode.get(d.code) ?? []), d]);
  for (const [code, list] of byCode) {
    const lines = list.map((d) => (d.line === 0 ? "-" : String(d.line)));
    const shown = lines.slice(0, 10).join(", ");
    process.stderr.write(
      `  dibuang ${code} x${list.length} baris ${shown}${lines.length > 10 ? `, ... (+${lines.length - 10})` : ""}: ${list[0].excerpt}\n`,
    );
  }
}

function main(): void {
  const { file, flags, strict } = parseArgs(process.argv.slice(2));
  const opts = optionsOf(flags);
  const out = flags.get("--out");

  let markdown: string;
  try {
    markdown = fs.readFileSync(file, "utf8");
  } catch (e) {
    fail(`tidak dapat membaca ${file}: ${e instanceof Error ? e.message : String(e)}`);
  }

  let result;
  try {
    result = markdownToContract(markdown, opts);
  } catch (e) {
    if (e instanceof ContractImportError) {
      if (e.code === "MD2CONTRACT_REQUIRED_MISSING") {
        const flagOf = (m: string) => (m === "status" ? "--status <kode>" : "--reported-at <waktu>");
        if (e.report) printWarnings(e.report);
        fail(
          `nilai wajib tidak ada di laporan dan tidak ditebak (KD-42): ${e.missing.join(", ")}; ` +
            `berikan ${e.missing.map(flagOf).join(" dan ")}`,
          3,
        );
      }
      fail(`${e.code}: ${e.message}`);
    }
    if (e instanceof StudioEngineError) fail(`${e.code}: ${e.message}`);
    throw e;
  }

  const json = `${JSON.stringify(result.doc, null, 2)}\n`;
  if (out !== undefined) {
    try {
      fs.writeFileSync(out, json, "utf8");
    } catch (err) {
      fail(`tidak dapat menulis ${out}: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else process.stdout.write(json);

  const r = result.report;
  const m = r.mapping;
  const dropped = collectDropped(r);
  process.stderr.write(
    `md2contract ${r.generator}: valid=${result.validation.valid} issues=${result.validation.issues.length} ` +
      `bentuk=${m.form} bab=${m.chapters.length} butir=${m.itemTables.reduce((n, t) => n + t.admitted, 0)} ` +
      `warnings=${r.warnings.length} dropped=${dropped.length} bab-wajib-kosong=${m.missingChapters.length}${out !== undefined ? ` out=${out}` : ""}\n`,
  );
  printWarnings(r);
  printDropped(dropped);
  if (!result.validation.valid) {
    for (const i of result.validation.issues.slice(0, 10)) process.stderr.write(`  ${i.pointer} ${i.keyword}: ${i.message}\n`);
    process.exit(1);
  }
  if (strict && (r.warnings.length > 0 || dropped.length > 0)) {
    process.stderr.write(`md2contract: --strict: ${r.warnings.length} peringatan pemetaan, ${dropped.length} unsur dibuang\n`);
    process.exit(1);
  }
}

main();

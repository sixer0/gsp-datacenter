/**
 * CLI importer Markdown resmi `md/v1` -> `studio.chapter/v2` konten-saja (FIX-H7, D-321/D-322).
 *
 *   npx tsx scripts/studio/md2chapter.ts <file.md> --key 3 [opsi] > bab3.json
 *
 * Opsi:
 *   --key <K>            kunci bab (wajib; C33a `1..999` atau C33b `A..Z`)
 *   --title <T>          judul bab (menimpa `#`)
 *   --agent <id>         agentId amplop kiriman
 *   --lang ID|EN         bahasa label bawaan yang terpaksa dibangkitkan (bawaan ID)
 *   --doc-id <id> | --doc-number <no> | --mission <folder> [--doc-key <k>]
 *                        target dokumen: keluaran memuat `submission` (siap POST /api/studio/chapters)
 *   --template <slug[@versi]>  templat dokumen baru -> `submission.template` (FIX-CLI, D-340)
 *   --doc-title <T>      judul dokumen baru -> `submission.meta.title` (FIX-CLI, D-340)
 *   --submission         cetak HANYA amplop `submission` (butuh salah satu opsi target)
 *
 * Bab pertama ke dokumen yang belum ada (target `--mission`/`--doc-number`) wajib membawa
 * `--template` dan `--doc-title`; tanpa keduanya server menjawab 400 `META_REQUIRED_FOR_CREATE`
 * (atau `DOC_TARGET_AMBIGUOUS` bila `--mission` tanpa `--doc-key` dan tanpa templat).
 * Judul dokumen sengaja `--doc-title` (bukan `--title`): `--title` sudah berarti judul bab sejak
 * FIX-H7 dan maknanya tidak diubah agar pemanggil lama tetap sama.
 *
 * Keluaran stdout: JSON `{ chapter, submission?, report, validation }` (atau amplop saja dengan
 * `--submission`), indentasi 2 spasi + LF; MD sama = byte sama. Ringkasan satu baris ke stderr.
 * Kode keluar: 0 sah, 1 tidak sah menurut validator v2, 2 galat pemakaian/masukan.
 * Hanya mengubah: tidak menyimpan ke Studio dan tidak membuka jaringan.
 */
import fs from "node:fs";
import { StudioEngineError } from "../../src/lib/studio/contract/errors";
import type { DocMetaV2, DocTargetV2 } from "../../src/lib/studio/contract";
import { importMarkdownChapter, type MarkdownImportOptions, type MdEnvelopeOptions } from "../../src/lib/studio/services/import";

const USAGE =
  "pemakaian: npx tsx scripts/studio/md2chapter.ts <file.md> --key <K> [--title T] [--agent ID] [--lang ID|EN] " +
  "[--doc-id X | --doc-number X | --mission FOLDER [--doc-key K]] [--template SLUG[@N]] [--doc-title T] [--submission]";

const HELP = [
  USAGE,
  "",
  "Mengubah satu berkas Markdown (md/v1) menjadi satu bab studio.chapter/v2. Tidak mengirim apa pun",
  "ke server; keluaran dicetak ke stdout dan dapat dikirim dengan POST /api/studio/chapters.",
  "",
  "Isi bab:",
  "  --key <K>               kunci bab (wajib): 1..999 atau A..Z",
  '  --title <T>             judul BAB (menimpa judul "# ..." di berkas)',
  "  --agent <id>            agentId pada amplop kiriman",
  "  --lang ID|EN            bahasa label bawaan (bawaan ID)",
  "",
  'Dokumen tujuan (pilih satu; keluaran lalu memuat "submission" yang siap dikirim):',
  "  --doc-id <id>           dokumen yang sudah ada (bab kedua dan seterusnya)",
  "  --doc-number <no>       dokumen menurut nomornya",
  "  --mission <folder>      dokumen misi, mis. 2026-10-22_kajian-gardu",
  "  --doc-key <k>           dokumen ke-sekian dalam misi yang sama (hanya bersama --mission)",
  "",
  "Membuat dokumen baru pada bab pertama:",
  "  --template <slug[@n]>   templat dokumen, mis. datum-gsp atau datum-gsp@3 (versi bilangan bulat >= 1)",
  "  --doc-title <T>         judul DOKUMEN (meta.title)",
  "  Bab pertama ke dokumen yang belum ada wajib membawa keduanya; tanpa itu server menolak membuatnya",
  "  (400 META_REQUIRED_FOR_CREATE, atau DOC_TARGET_AMBIGUOUS bila --mission tanpa --doc-key).",
  "  Simpan document.id dari jawaban server, lalu kirim bab",
  "  berikutnya dengan --doc-id <id> tanpa --template/--doc-title.",
  "",
  "Lain-lain:",
  "  --submission            cetak hanya amplop kiriman (butuh salah satu opsi dokumen tujuan)",
  "  -h, --help              tampilkan bantuan ini",
  "",
  "Contoh bab pertama dokumen misi baru:",
  "  npx tsx scripts/studio/md2chapter.ts bab1.md --key 1 --mission 2026-10-22_kajian-gardu \\",
  '    --template datum-gsp --doc-title "Kajian Gardu C" --submission > bab1.json',
  "",
  "Kode keluar: 0 sah, 1 tidak sah menurut validator v2, 2 galat pemakaian atau berkas.",
].join("\n");

const VALUE_FLAGS = new Set([
  "--key",
  "--title",
  "--agent",
  "--lang",
  "--doc-id",
  "--doc-number",
  "--mission",
  "--doc-key",
  "--template",
  "--doc-title",
]);

/** `slug` atau `slug@N` (N bilangan bulat >= 1). Pola slug ditegakkan validator skema v2. */
const TEMPLATE_ARG = /^([^@\s]+)(?:@([1-9][0-9]{0,8}))?$/;

function fail(message: string): never {
  process.stderr.write(`md2chapter: ${message}\n${USAGE}\n`);
  process.exit(2);
}

function parseArgs(argv: string[]): { file: string; flags: Map<string, string>; submissionOnly: boolean } {
  const flags = new Map<string, string>();
  let file: string | null = null;
  let submissionOnly = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--submission") submissionOnly = true;
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
  if (file === null) fail("berkas <file.md> belum diberikan");
  return { file, flags, submissionOnly };
}

function targetOf(flags: Map<string, string>): DocTargetV2 | undefined {
  const docId = flags.get("--doc-id");
  const docNumber = flags.get("--doc-number");
  const mission = flags.get("--mission");
  const docKey = flags.get("--doc-key");
  const ways = [docId, docNumber, mission].filter((v) => v !== undefined).length;
  if (ways > 1) fail("berikan tepat satu dari --doc-id, --doc-number, --mission");
  if (docKey !== undefined && mission === undefined) fail("--doc-key memerlukan --mission");
  if (docId !== undefined) return { documentId: docId };
  if (docNumber !== undefined) return { docNumber };
  if (mission !== undefined) return { mission: { folder: mission }, ...(docKey !== undefined ? { docKey } : {}) };
  return undefined;
}

function templateOf(raw: string | undefined): { slug: string; version?: number } | undefined {
  if (raw === undefined) return undefined;
  const m = TEMPLATE_ARG.exec(raw);
  if (!m) fail("--template harus berbentuk <slug> atau <slug>@<versi>, dengan versi bilangan bulat >= 1");
  return { slug: m[1], ...(m[2] !== undefined ? { version: Number(m[2]) } : {}) };
}

/**
 * Amplop kiriman. `template`/`meta.title` hanya ada bila opsinya diberikan, jadi tanpa opsi
 * baru stdout sama byte dengan perilaku lama. Untuk target yang dapat membuat dokumen
 * (`--mission`/`--doc-number`) tanpa keduanya, satu catatan ke stderr (stdout dan kode keluar tetap).
 */
function envelopeOf(flags: Map<string, string>, target: DocTargetV2 | undefined): MdEnvelopeOptions | undefined {
  const template = templateOf(flags.get("--template"));
  const docTitle = flags.get("--doc-title");
  if (docTitle !== undefined && docTitle.trim() === "") fail("--doc-title tidak boleh kosong");
  if (target === undefined) {
    if (template !== undefined || docTitle !== undefined) {
      fail("--template dan --doc-title memerlukan opsi dokumen tujuan (--mission, --doc-number, atau --doc-id)");
    }
    return undefined;
  }
  const meta: DocMetaV2 | undefined = docTitle !== undefined ? { title: docTitle } : undefined;
  if (!("documentId" in target) && (template === undefined || meta === undefined)) {
    const missing = [template === undefined ? "--template" : null, meta === undefined ? "--doc-title" : null].filter(Boolean);
    process.stderr.write(
      `md2chapter: catatan: bila ini bab pertama dokumen baru, tambahkan juga ${missing.join(" dan ")} ` +
        "(tanpa itu server menolak membuatnya: 400 META_REQUIRED_FOR_CREATE, atau DOC_TARGET_AMBIGUOUS untuk --mission tanpa --doc-key)\n",
    );
  }
  return { target, ...(template ? { template } : {}), ...(meta ? { meta } : {}) };
}

function main(): void {
  const { file, flags, submissionOnly } = parseArgs(process.argv.slice(2));
  const key = flags.get("--key");
  if (key === undefined) fail("--key wajib diisi");
  const lang = flags.get("--lang");
  if (lang !== undefined && lang !== "ID" && lang !== "EN") fail("--lang harus ID atau EN");
  const target = targetOf(flags);
  if (submissionOnly && target === undefined) fail("--submission memerlukan opsi dokumen tujuan (--mission, --doc-number, atau --doc-id)");
  const envelope = envelopeOf(flags, target);

  let markdown: string;
  try {
    markdown = fs.readFileSync(file, "utf8");
  } catch (e) {
    fail(`tidak dapat membaca ${file}: ${e instanceof Error ? e.message : String(e)}`);
  }

  const opts: MarkdownImportOptions = {
    chapterKey: key,
    ...(flags.has("--title") ? { title: flags.get("--title") } : {}),
    ...(flags.has("--agent") ? { agentId: flags.get("--agent") } : {}),
    ...(lang ? { language: lang } : {}),
    ...(envelope ? { envelope } : {}),
  };
  let result;
  try {
    result = importMarkdownChapter(markdown, opts);
  } catch (e) {
    if (e instanceof StudioEngineError) fail(`${e.code}: ${e.message}`);
    throw e;
  }
  const out = submissionOnly ? result.submission : result;
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  const r = result.report;
  process.stderr.write(
    `md2chapter ${r.importer}: valid=${result.validation.valid} issues=${result.validation.issues.length} ` +
      `sections=${result.chapter.sections.length} mapped=${r.mapping.length} warnings=${r.warnings.length} dropped=${r.dropped.length}\n`,
  );
  if (!result.validation.valid) {
    for (const i of result.validation.issues.slice(0, 10)) process.stderr.write(`  ${i.pointer} ${i.keyword}: ${i.message}\n`);
    process.exit(1);
  }
}

main();

/**
 * Cek kelayakan fixture dokumen paritas (FIX-3 temuan UT-01; SR-41 konten-saja D-138).
 *
 * v1 — setiap `tests/parity/fixtures/doc/<stem>.json` (studio.doc/v1):
 *   - lolos `ingestDocument` dryRun sebagai pemanggil USER (tanpa penanda benchmark,
 *     tanpa harness tepercaya) pada templat luring setara templat DB:
 *       `datum-kanonik` (profil kanonik murni, = kanonik DB);
 *       `datum-gsp` (profil `benchmark/manual000/template.json` tanpa kunci kelas T
 *         dan tanpa `lint.enforcement*`, sama dengan impor seed UT-01);
 *       profil pendamping `<stem>.template.json` bila ada (tampilan fixture, SR-41);
 *   - KONTEN SAJA: REPORT adaptor tanpa format inline (R-38) dan tanpa elemen dibuang
 *     (spacer/device/frontItems/tocEntries); sisa `stripped` hanya medan wajib skema v1;
 *   - setiap aset dirujuk blok (D-248; v1 dan v2);
 *   - tier SERAH/TERBIT: DATUM-20/22/23 tidak FAIL (D-126: sebab di fixture, aturan tetap);
 *   - semua tier: DATUM-09 (tabel data numerik bersatuan) tidak FAIL (D-269);
 *
 * v2 — setiap `doc/v2/<stem>.json` (studio.doc/v2, salinan v1):
 *   - `validateV2Against("studio.doc/v2")` 0 isu, 0 `DISPLAY_FIELD` (DF-01..DF-69);
 *   - pindai kunci: 0 nama DF-01..DF-52 di mana pun, 0 nilai DF-60/DF-61;
 *   - lolos `ingestDocument` dryRun USER pada templat yang sama;
 *   - setiap v1 punya salinan v2 dan sebaliknya.
 *
 * Tanpa DB: templat lewat `opts.template`; `dryRun: true` berhenti sebelum penyimpanan.
 *
 *   npx tsx scripts/parity/run/check_doc_fixtures.ts [--fixtures tests/parity/fixtures] [--json <out.json>]
 *
 * Exit: 0 semua lolos | 1 ada yang gagal | 2 salah pakai.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ResolvedTemplate } from "../../../src/lib/studio/contract";
import type { StudioCaller } from "../../../src/lib/studio/contract/auth";
import { DISPLAY_FIELDS_BY_LOCATION, DISPLAY_FIELDS_GLOBAL } from "../../../src/lib/studio/contract/schema/v2/forbidden";
import { countInlineFormat } from "../../../src/lib/studio/services/adapt-v1";
import { ingestDocument, type IngestInput } from "../../../src/lib/studio/services/ingest";
import { validateV2Against } from "../../../src/lib/studio/services/ingest/validate";
import { resolveRepoAssetPath } from "../../../src/lib/studio/services/templates/assets";
import { parseTemplateProfile, resolveProfileInMemory } from "../../../src/lib/studio/services/templates/profile";
import { errMessage, findRepoRoot, parseArgs } from "./lib/common";
import { canonicalTemplate, loadTemplate } from "./lib/template";

const USER: StudioCaller = { kind: "USER_SESSION", requester: "parity-sr41-check", username: "parity-sr41-check", role: "USER" } as StudioCaller;
/** D-126: aturan penolak yang dulu menolak fixture serah/terbit di DB (UT-01). */
const D126_CHECKS = ["DATUM-20", "DATUM-22", "DATUM-23"] as const;
const D126_TIERS = new Set(["SERAH", "TERBIT"]);
/** D-269: aturan isi yang wajib lolos di setiap fixture (sebab di fixture, aturan tetap). */
const ALWAYS_CHECKS = ["DATUM-09"] as const;

interface Issue {
  checkId?: string;
  keyword?: string;
  pointer?: string;
  message?: string;
}

interface Row {
  fixture: string;
  schema: "studio.doc/v1" | "studio.doc/v2";
  template: string;
  valid: boolean;
  issues: Issue[];
  /** v1: REPORT adaptor (konten-saja). */
  adapt?: { inlineFormat: number; dropped: Record<string, number>; stripped: Record<string, number> };
  /** v2: isu validator v2 + pindai kunci DF. */
  v2?: { schemaIssues: number; displayField: number; scanHits: string[] };
  d126?: Record<string, string>;
  failures: string[];
}

/**
 * Profil benchmark -> `datum-gsp` seperti seed UT-01 (`prisma/seed-studio.ts` toDatumGspProfile):
 * pembaca profil membuang override kelas T (pasca-RT-01 profil memuat nilai terukur yang kini
 * diturunkan mesin, mis. `grid.textColumnMm`), lalu pelepas penegakan `lint.enforcement*` dibuang.
 */
function gspTemplate(repoRoot: string): ResolvedTemplate {
  const raw = JSON.parse(readFileSync(path.join(repoRoot, "benchmark", "manual000", "template.json"), "utf8").replace(/^﻿/, "")) as unknown;
  const parsed = parseTemplateProfile(raw).profile;
  const overrides = Object.fromEntries(Object.entries(parsed.overrides).filter(([k]) => !k.startsWith("lint.enforcement")));
  return resolveProfileInMemory(
    { ...parsed, base: "datum-kanonik", slug: "datum-gsp", kind: "DOCUMENT", overrides },
    { canonicalAssets: {}, resolveAssetPath: (rel) => resolveRepoAssetPath(rel, repoRoot) },
  );
}

function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Pindai kunci global DF-01..DF-52 dan nilai DF-60 (`type`) / DF-61 (`role`) di seluruh payload v2. */
function scanDisplayFields(doc: unknown): string[] {
  const global = new Set<string>(DISPLAY_FIELDS_GLOBAL);
  const valueRules = Object.entries(DISPLAY_FIELDS_BY_LOCATION).filter(([, r]) => r.valueField && r.values);
  const hits: string[] = [];
  const walk = (v: unknown, p: string): void => {
    if (Array.isArray(v)) v.forEach((e, i) => walk(e, `${p}/${i}`));
    else if (isObj(v)) {
      for (const [k, c] of Object.entries(v)) {
        if (global.has(k)) hits.push(`${p}/${k}`);
        walk(c, `${p}/${k}`);
      }
      for (const [id, r] of valueRules) {
        const val = v[r.valueField!];
        // DF-61 hanya untuk paragraf; DF-60 untuk blok mana pun.
        if (typeof val === "string" && r.values!.includes(val) && (id !== "DF-61" || v.type === "paragraph")) hits.push(`${p}/${r.valueField} (${id}=${val})`);
      }
    }
  };
  walk(doc, "");
  return hits;
}

/** Kunci `assets` yang tidak dirujuk nilai string mana pun di luar `assets` (D-248). */
function unreferencedAssets(doc: Record<string, unknown>): string[] {
  const keys = isObj(doc.assets) ? Object.keys(doc.assets) : [];
  const used = new Set<string>();
  const walk = (v: unknown, top: boolean): void => {
    if (Array.isArray(v)) v.forEach((e) => walk(e, false));
    else if (isObj(v)) {
      for (const [k, c] of Object.entries(v)) {
        if (top && k === "assets") continue;
        if (typeof c === "string" && keys.includes(c)) used.add(c);
        walk(c, false);
      }
    }
  };
  walk(doc, true);
  return keys.filter((k) => !used.has(k));
}

function issuesOf(r: { issues?: unknown[] }): Issue[] {
  return (r.issues ?? []).map((i) => {
    const o = i as Record<string, unknown>;
    return { checkId: o.checkId as string | undefined, keyword: o.keyword as string | undefined, pointer: o.pointer as string | undefined, message: String(o.message ?? o.detail ?? "") };
  });
}

function listJson(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json") && !/\.(template|ref)\.json$/i.test(e.name) && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort();
}

async function main(argv: readonly string[]): Promise<number> {
  let args;
  try {
    args = parseArgs(argv, { values: ["fixtures", "json"], flags: [] });
  } catch (err) {
    process.stderr.write(`check_doc_fixtures: salah pakai: ${errMessage(err)}\n`);
    return 2;
  }
  const repoRoot = findRepoRoot();
  const dir = path.resolve(args.values.get("fixtures") ?? path.join(repoRoot, "tests", "parity", "fixtures"), "doc");
  const dirV2 = path.join(dir, "v2");
  const shared: Array<[string, ResolvedTemplate]> = [
    ["datum-kanonik", (await canonicalTemplate(repoRoot, false)).template],
    ["datum-gsp", gspTemplate(repoRoot)],
  ];
  const templatesFor = async (stem: string): Promise<Array<[string, ResolvedTemplate]>> => {
    const sidecar = path.join(dir, `${stem}.template.json`);
    if (!existsSync(sidecar)) return shared;
    return [...shared, [`${stem}.template.json`, (await loadTemplate(sidecar, repoRoot, false)).template]];
  };

  const rows: Row[] = [];
  const setFailures: string[] = [];
  const v1Names = listJson(dir);
  const v2Names = listJson(dirV2);
  for (const n of v1Names) if (!v2Names.includes(n)) setFailures.push(`salinan v2 hilang: doc/v2/${n}`);
  for (const n of v2Names) if (!v1Names.includes(n)) setFailures.push(`salinan v2 tanpa v1: doc/v2/${n}`);

  const run = async (name: string, schema: Row["schema"], doc: Record<string, unknown>, extra: Partial<Row>): Promise<void> => {
    const stem = name.replace(/\.json$/i, "");
    for (const [label, tpl] of await templatesFor(stem)) {
      const row: Row = { fixture: schema === "studio.doc/v2" ? `v2/${name}` : name, schema, template: label, valid: false, issues: [], failures: [], ...extra };
      try {
        const slug = label.endsWith(".template.json") ? "datum-kanonik" : label;
        const body = { ...doc, template: { ...(isObj(doc.template) ? doc.template : {}), slug } };
        const input = (schema === "studio.doc/v2" ? body : { document: body }) as unknown as IngestInput;
        const r = await ingestDocument(input, USER, { dryRun: true, template: tpl });
        row.valid = r.valid;
        row.issues = issuesOf(r as { issues?: unknown[] });
        if (!r.valid) row.failures.push("ingest dryRun valid:false");
        const orphan = unreferencedAssets(doc);
        if (orphan.length > 0) row.failures.push(`aset tak dirujuk: ${orphan.join(", ")} (D-248)`);
        if (schema === "studio.doc/v1") {
          const rep = r.adaptReport;
          if (!rep) row.failures.push("REPORT adaptor tidak ada");
          else {
            const dropped = Object.fromEntries(Object.entries(rep.dropped).filter(([, v]) => v > 0));
            row.adapt = { inlineFormat: countInlineFormat(rep), dropped, stripped: rep.stripped };
            if (row.adapt.inlineFormat > 0) row.failures.push(`format inline ${row.adapt.inlineFormat} (bukan konten-saja)`);
            if (Object.keys(dropped).length > 0) row.failures.push(`elemen tampilan dibuang adaptor ${JSON.stringify(dropped)}`);
          }
        }
        const tier = isObj(doc.meta) ? String(doc.meta.tier ?? "") : "";
        if (r.valid) {
          const guarded: readonly string[] = [...ALWAYS_CHECKS, ...(D126_TIERS.has(tier) ? D126_CHECKS : [])];
          const checks = ((r.lint?.checks ?? []) as unknown as Array<Record<string, unknown>>).filter((c) => guarded.includes(String(c.checkId)));
          row.d126 = Object.fromEntries(guarded.map((id) => [id, [...new Set(checks.filter((c) => c.checkId === id).map((c) => String(c.status)))].join("|") || "ABSENT"]));
          // NOT_RUN diterima hanya di tier yang memang tidak menjalankan cek itu (NOTA); SERAH/TERBIT wajib PASS.
          const notRunOk = !D126_TIERS.has(tier);
          for (const [id, st] of Object.entries(row.d126)) if (st !== "PASS" && !(notRunOk && st === "NOT_RUN")) row.failures.push(`${id} ${st} (${id === "DATUM-09" ? "D-269" : "D-126"})`);
        }
      } catch (err) {
        row.issues = [{ keyword: "THROWN", message: errMessage(err) }];
        row.failures.push(`dilempar: ${errMessage(err)}`);
      }
      if (row.v2 && (row.v2.schemaIssues > 0 || row.v2.scanHits.length > 0)) row.failures.push(`validator v2: ${row.v2.schemaIssues} isu (DISPLAY_FIELD ${row.v2.displayField}); pindai DF ${row.v2.scanHits.length}`);
      rows.push(row);
    }
  };

  for (const name of v1Names) {
    const doc = JSON.parse(readFileSync(path.join(dir, name), "utf8").replace(/^﻿/, "")) as Record<string, unknown>;
    await run(name, "studio.doc/v1", doc, {});
  }
  for (const name of v2Names) {
    const doc = JSON.parse(readFileSync(path.join(dirV2, name), "utf8").replace(/^﻿/, "")) as Record<string, unknown>;
    const schemaIssues = validateV2Against("studio.doc/v2", doc, "");
    const v2 = {
      schemaIssues: schemaIssues.length,
      displayField: schemaIssues.filter((i) => (i as unknown as { checkId?: string }).checkId === "DISPLAY_FIELD").length,
      scanHits: scanDisplayFields(doc),
    };
    await run(name, "studio.doc/v2", doc, { v2 });
  }

  for (const r of rows) {
    const extra: string[] = [];
    if (r.adapt) extra.push(`inline=${r.adapt.inlineFormat} dropped=${JSON.stringify(r.adapt.dropped)} sisa=${JSON.stringify(r.adapt.stripped)}`);
    if (r.v2) extra.push(`v2Isu=${r.v2.schemaIssues} DF=${r.v2.displayField} pindaiDF=${r.v2.scanHits.length}`);
    if (r.d126) extra.push(`lint ${Object.entries(r.d126).map(([k, v]) => `${k}:${v}`).join(" ")}`);
    const status = r.failures.length === 0 ? "LOLOS " : "GAGAL ";
    process.stdout.write(`${status} ${r.schema === "studio.doc/v2" ? "v2" : "v1"} ${r.fixture} @${r.template} ${extra.join("; ")}${r.failures.length ? ` :: ${r.failures.join("; ")}` : ""}${r.issues.length ? ` [${r.issues.map((i) => `${i.checkId ?? i.keyword}${i.pointer ? `@${i.pointer}` : ""}`).join(", ")}]` : ""}\n`);
  }
  for (const f of setFailures) process.stdout.write(`GAGAL  ${f}\n`);
  const bad = rows.filter((r) => r.failures.length > 0).length + setFailures.length;
  process.stdout.write(`check_doc_fixtures: ${rows.length - rows.filter((r) => r.failures.length > 0).length}/${rows.length} lolos (v1 ${v1Names.length} berkas, v2 ${v2Names.length} berkas); gagal himpunan ${setFailures.length}\n`);
  const out = args.values.get("json");
  if (out) {
    mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    writeFileSync(path.resolve(out), `${JSON.stringify({ rows, setFailures }, null, 1)}\n`, "utf8");
  }
  return bad > 0 ? 1 : 0;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: "error", source: "parity.check_doc_fixtures", message: errMessage(err), stack_trace: err instanceof Error ? err.stack : undefined })}\n`);
    process.exitCode = 1;
  });

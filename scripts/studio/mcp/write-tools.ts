/**
 * IMPL-W (D-521/D-522): toolset `write` = `studio_write` + `studio_edit` (+ alat baca yang sudah ada). Agen hanya
 * memikirkan ISI (bagian = judul + blok; string = paragraf, larik baris = tabel); mesin menyusun teks laporan kerja
 * MD-native (`write-content.ts`) dan mengirimnya lewat internal yang SAMA dengan `studio_report_submit` /
 * `studio_report_update` (`runReport` + `guardReportSubmit`), sehingga aturan keamanan D-480..D-493 (pembungkus
 * data tak tepercaya, pemilik, BASIS_*, REPORT_CHANGED_BY_OTHER, BASE_CONFLICT) berlaku tanpa perubahan.
 *
 * `studio_edit` membaca revisi terkini (R20), menulis bagian dokumen sebagai Markdown dengan serializer yang sama
 * dengan `studio_report_refresh`, menerapkan cari-ganti per satuan (paragraf, sel tabel, medan record), lalu
 * mengirim delta lewat jalur update dengan basis = revisi yang baru dibaca (agen tidak memberi basis).
 */
import { studioRoutePath } from "../../../src/lib/studio/contract/env";
import { FIGURE_BOUNDS } from "../../../src/lib/studio/contract/schema/figure-bounds";
import {
  assembleReportMarkdown,
  chapterToReportMarkdown,
  mdReportToBlocks,
  newSerializeCtx,
  recordToReportMarkdown,
  referencesToReportMarkdown,
  type ReportPartMarkdown,
} from "../../../src/lib/studio/services/draft/md-report";
import { partsOf, partsOfValues, remapExtraChapters, ReportError, runReport, safeFinalName, sameContent, type CliArgs, type CliIo, type ReportResult } from "../studio-report";
import { MAX_INPUT_BYTES } from "./config";
import { checkOwnership, findMissionDoc, guardReportSubmit, type ExistingDoc } from "./doc-tools";
import { McpToolError, virtualFs } from "./safety";
import { http, isRecord, obj, plainAgentId, requireSecret, S, str, tok, VIRTUAL_FILE, type Args, type ToolContext, type ToolDef, type ToolOutput, type ToolWarning } from "./tool-kit";
import { buildWorkReport, type SectionInput } from "./write-content";
import { applyEdits, type EditOp, type EditPart, type EditPlan } from "./write-edit";
import { editClient, writeClient } from "./write-client-run";

// ── Skema ───────────────────────────────────────────────────────────────

const CELL = { anyOf: [{ type: "string", maxLength: 4000 }, { type: "number" }] } as const;
/** I-4 (review 13): label kategori grafik dibatasi batas figur kontrak (FIGURE_BOUNDS.chartDataChars), ditegakkan saat masukan. */
const CHART_LABEL = { anyOf: [{ type: "string", maxLength: FIGURE_BOUNDS.chartDataChars }, { type: "number" }] } as const;
const ROWS = { type: "array", minItems: 1, maxItems: 500, items: { type: "array", minItems: 1, maxItems: 40, items: CELL } } as const;
const BLOCK = {
  anyOf: [
    { type: "string", maxLength: 40000 },
    ROWS,
    obj({ table: ROWS, caption: { type: "string", maxLength: 500 }, source: { type: "string", maxLength: 500 } }, ["table"]),
    obj(
      {
        chart: obj(
          {
            type: { type: "string", maxLength: 40 },
            categories: { type: "array", minItems: 1, maxItems: FIGURE_BOUNDS.items, items: CHART_LABEL },
            series: { type: "array", minItems: 1, maxItems: 12, items: obj({ name: { type: "string", minLength: 1, maxLength: 120 }, values: { type: "array", maxItems: 200, items: { anyOf: [{ type: "number" }, { type: "null" }] } } }, ["name", "values"]) },
            caption: { type: "string", maxLength: 500 },
            source: { type: "string", maxLength: 500 },
            unit: { type: "string", maxLength: 40 },
            stacked: { type: "boolean" },
          },
          ["categories", "series"],
        ),
      },
      ["chart"],
    ),
    obj({ list: { type: "array", minItems: 1, maxItems: 200, items: { type: "string", maxLength: 4000 } }, ordered: { type: "boolean" } }, ["list"]),
    obj({ subheading: { type: "string", minLength: 1, maxLength: 200 } }, ["subheading"]),
  ],
} as const;
const SECTIONS = {
  type: "array",
  minItems: 1,
  maxItems: 60,
  items: obj({ heading: { type: "string", minLength: 1, maxLength: 200 }, blocks: { type: "array", maxItems: 400, items: BLOCK } }, ["heading", "blocks"]),
  description: "Bagian: heading + blocks (string=paragraf, [[header],[baris]...]=tabel, {table,caption,source}, {chart:{categories,series:[{name,values}],caption,source,stacked?}}, {list}, {subheading}).",
} as const;
const META = { type: "object", maxProperties: 40, additionalProperties: { type: "string", maxLength: 500 }, description: "Kunci-nilai datar. Laporan: status, owner, taskRef. Klien: title, number (nomor tampilan), author, checker, approver, rev, date, classification, source." } as const;
const TEMPLATE = { type: "string", pattern: "^(latest|[a-z0-9][a-z0-9-]{0,63})$", description: "Dokumen klien: slug templat DATUM atau latest; kosong = laporan kerja." } as const;

// ── Bersama ─────────────────────────────────────────────────────────────

function reportIo(ctx: ToolContext, bytes: Buffer, beforeSubmit?: CliIo["beforeSubmit"]): CliIo {
  return {
    stdout: () => undefined,
    stderr: () => undefined,
    env: { INTERNAL_API_SECRET: requireSecret(ctx) },
    fetchImpl: ctx.fetch,
    fs: virtualFs(new Map([[VIRTUAL_FILE, bytes]]), {}, ctx.fsLog),
    ...(ctx.deps.now ? { now: ctx.deps.now } : {}),
    ...(beforeSubmit ? { beforeSubmit } : {}),
  };
}

function baseArgs(command: "submit" | "update", agentId: string | null): CliArgs {
  return {
    command,
    documentId: null,
    file: VIRTUAL_FILE,
    remote: null,
    agentId,
    mission: null,
    docKey: null,
    format: "md",
    sections: null,
    baseRev: null,
    forceLatest: false,
    allowRemove: false,
    out: null,
    timing: null,
    step: null,
    requireComplete: false,
    allowExample: false,
    json: true,
  };
}

/** Basis sesi dari nextBasis (sama dengan studio_report_submit/update). */
function rememberNext(ctx: ToolContext, r: ReportResult, from: string): void {
  const m = r.nextBasis !== null ? /@rev(\d+)$/.exec(r.nextBasis) : null;
  if (m) ctx.session.remember(r.documentId, Number(m[1]), from, ctx.now());
  else ctx.session.forget(r.documentId);
}

/** Hasil ringkas: hanya token aman di baris teks; nama final server hanya bila lolos pola C51. */
function resultOutput(tool: string, r: ReportResult, warnings: ToolWarning[], extra: Record<string, unknown> = {}): ToolOutput {
  const created = r.steps.some((s) => s.created === true);
  const sent = r.steps.filter((s) => !s.skipped && s.unchanged !== true).length;
  const state = created ? "dibuat" : sent > 0 ? "diperbarui" : "tidak berubah";
  const render = r.render
    ? { fileId: r.render.fileId, format: tok(r.render.format), sha256: r.render.sha256, verified: r.render.verified, bytes: r.render.bytes, ...(safeFinalName(r.render.finalFileName) ? { finalFileName: r.render.finalFileName } : {}) }
    : null;
  const nextSteps = [
    `studio_edit { documentId: "${tok(r.documentId)}", edits: [{ find, replace }] } untuk mengubah teks`,
    ...(render ? [`studio_file_verify { fileId: "${tok(render.fileId)}", downloadDir? } untuk mengunduh`] : [`lengkapi isi lalu studio_write lagi (render penuh hanya bila COMPLETE)`]),
  ];
  const lines = [
    `${tool}: laporan kerja ${tok(r.docNumber)} (documentId ${tok(r.documentId)}) rev ${tok(r.revisionNo)} ${state}; bagian terkirim ${sent}`,
    `kelengkapan: ${tok(r.completeness.status)}${r.completeness.missingRequired.length > 0 ? ` (kurang ${r.completeness.missingRequired.length})` : ""}`,
    render ? `berkas: ${tok(render.fileId)} ${render.format} sha256 ${render.sha256.slice(0, 16)} ${render.verified ? "terverifikasi" : "BELUM terverifikasi"}` : `berkas: tidak dirender (${r.completeness.status === "COMPLETE" ? "-" : "belum lengkap"})`,
    ...nextSteps.map((s) => `lanjut: ${s}`),
  ];
  return {
    text: lines.join("\n"),
    data: {
      documentId: r.documentId,
      docNumber: tok(r.docNumber, ""),
      revisionNo: r.revisionNo,
      state,
      completeness: { status: tok(r.completeness.status), missingRequired: r.completeness.missingRequired.length },
      render,
      nextSteps,
      ...extra,
    },
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

// ── studio_write ────────────────────────────────────────────────────────

const WRITE_EXAMPLE = `{"mission":"2026-11-03_x","docKey":"lap-1","sections":[{"heading":"Ringkasan","blocks":["Teks."]},{"heading":"Rincian kerja","blocks":[[["judul","status"],["Bab 2","done"]]]}]}`;

const writeTool: ToolDef = {
  name: "studio_write",
  description: `Tulis/ganti dokumen dari isi saja; mesin memformat, menomori, cek, render, sha. Laporan: bab Ringkasan, Rincian kerja, Bukti, Isu terbuka, Langkah berikut. Klien: template "latest" + meta {title,author,number}. Contoh: ${WRITE_EXAMPLE}`,
  inputSchema: obj({ mission: S.mission, docKey: S.docKey, template: TEMPLATE, title: { type: "string", minLength: 1, maxLength: 200 }, meta: META, sections: SECTIONS, agentId: S.agentId }, ["mission", "docKey", "sections"]),
  annotations: { title: "Tulis dokumen (isi saja)", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  toolsets: ["write"],
  async run(a, ctx) {
    const bytes = Buffer.byteLength(JSON.stringify(a), "utf8");
    if (bytes > MAX_INPUT_BYTES) throw new McpToolError("PAYLOAD_TOO_LARGE", `masukan ${bytes} B melebihi batas ${MAX_INPUT_BYTES} B`);
    const agentId = plainAgentId(a, ctx);
    if (str(a, "template") !== null) return writeClient(a, ctx, agentId);
    const meta = isRecord(a.meta) ? (a.meta as Record<string, string>) : {};
    const built = buildWorkReport({ mission: str(a, "mission") as string, docKey: str(a, "docKey") as string, title: str(a, "title"), meta, sections: a.sections as SectionInput[], agentId, now: ctx.now() });
    assertShape(built);
    const md = Buffer.from(built.markdown, "utf8");
    const args: CliArgs = { ...baseArgs("submit", agentId), remote: ctx.deps.config.baseUrl, mission: str(a, "mission"), docKey: str(a, "docKey") };
    // Pagar yang sama dengan studio_report_submit: pemilik, laporan kerja, penulis terakhir (0 tulis bila ditolak).
    let r: ReportResult;
    try {
      r = await runReport(args, reportIo(ctx, md, (plan) => guardReportSubmit(a, ctx, plan)));
    } catch (e) {
      // I-1: di toolset write alat refresh/update tidak dimuat; arahkan ke studio_edit (membaca revisi terkini).
      if (e instanceof McpToolError && e.code === "REPORT_CHANGED_BY_OTHER") e.message = `${e.message.split("; kirim ulang")[0]}; tulis ulang utuh dapat menimpa tulisan itu, jadi tidak ada yang dikirim. Ubah bagian tertentu dengan studio_edit { documentId, edits } (membaca revisi terkini lebih dulu). Penulis ada di blok rincian`;
      throw e;
    }
    rememberNext(ctx, r, "studio_write");
    return resultOutput("studio_write", r, [...built.warnings, ...conversionWarnings(r)]);
  },
};

/**
 * M-1 pertahanan kedua: konversi ulang teks yang disusun mesin harus memberi struktur yang SAMA dengan masukan (judul
 * section sama dan urut, record hanya medan kepala mesin + butir/bukti dari tabel butir mesin). Selain itu
 * CONTENT_INJECTION, 0 jaringan.
 */
/** Teks InlineV2 ({text} | {runs:[{t}]}). */
function inlineTextOf(v: unknown): string {
  if (!isRecord(v)) return "";
  return typeof v.text === "string" ? v.text : Array.isArray(v.runs) ? (v.runs as Array<{ t?: string }>).map((r) => r.t ?? "").join("") : "";
}
/** Perbandingan longgar: huruf/angka saja (markah inline, escape, dan tanda baca tidak dibandingkan). */
const loose = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

export function assertShape(built: ReturnType<typeof buildWorkReport>): void {
  const bad: string[] = [];
  let blocks: Array<Record<string, unknown>>;
  try {
    blocks = mdReportToBlocks(built.markdown, { mode: "create" }).blocks;
  } catch {
    return; // galat konversi biasa dilaporkan runReport dengan kodenya sendiri
  }
  const titles: string[] = [];
  const paras: string[][] = [];
  let record: Record<string, unknown> = {};
  for (const b of blocks) {
    if (b.slot === "record" && isRecord(b.payload)) record = b.payload;
    const ch = isRecord(b.chapter) ? b.chapter : null;
    for (const s of ch !== null && Array.isArray(ch.sections) ? ch.sections : []) {
      const t = isRecord(s) && isRecord(s.title) ? s.title : {};
      titles.push(inlineTextOf(t));
      const blocks2 = isRecord(s) && Array.isArray(s.blocks) ? (s.blocks as unknown[]) : [];
      paras.push(blocks2.filter((x): x is Record<string, unknown> => isRecord(x) && x.type === "paragraph").map(inlineTextOf));
    }
    if (ch !== null && Array.isArray(ch.intro) && ch.intro.length > 0) bad.push(`pembuka bab ${String(ch.key)} di luar section`);
  }
  const keepIdx = built.headings.map((h, i) => (["rujukan", "rujukan dokumen", "refs"].includes(h.trim().toLowerCase()) ? -1 : i)).filter((i) => i >= 0);
  const want = keepIdx.map((i) => built.headings[i]);
  if (titles.length !== want.length || titles.some((t, i) => t.trim() !== want[i].trim())) bad.push(`section hasil konversi (${titles.length}) berbeda dari masukan (${want.length})`);
  else {
    // R-1 (siklus 2): teks paragraf per section harus sama dengan masukan (perbandingan longgar huruf/angka), agar teks
    // yang tertelan konversi (komentar HTML, pagar) terdeteksi.
    keepIdx.forEach((hi, si) => {
      const exp = built.paragraphs[hi].map(loose).filter((x) => x !== "");
      const got = paras[si].map(loose).filter((x) => x !== "");
      if (exp.length !== got.length || exp.some((x, k) => x !== got[k])) bad.push(`paragraf section "${tok(want[si].replace(/\s+/g, "-"), String(si + 1))}" berbeda sesudah konversi (${got.length} vs ${exp.length})`);
    });
  }
  // cardIds: generator memindai id kartu yang DISEBUT di teks (perilaku jalur MD yang sama), bukan medan dari struktur.
  const allowed = new Set(["type", "items", "evidence", "refs", "cardIds", ...Object.keys(built.recordFields)]);
  const extra = Object.keys(record).filter((k) => !allowed.has(k));
  if (extra.length > 0) bad.push(`medan record tak terduga: ${extra.join(", ")}`);
  for (const [f, v] of Object.entries(built.recordFields)) if (f !== "reportedAt" && f !== "cardIds" && record[f] !== undefined && record[f] !== v) bad.push(`record.${f} berubah`);
  const items = Array.isArray(record.items) ? (record.items as Array<{ key?: string }>) : [];
  const foreign = items.filter((i) => !built.itemKeys.has(String(i.key ?? "").toLowerCase()));
  if (foreign.length > 0) bad.push(`${foreign.length} butir record bukan dari tabel butir`);
  const ev = Array.isArray(record.evidence) ? (record.evidence as Array<{ item?: string }>) : [];
  if (ev.some((e) => typeof e.item !== "string" || !built.itemKeys.has(e.item.toLowerCase()))) bad.push("bukti record bukan dari tabel butir");
  if (bad.length > 0) {
    throw new McpToolError("CONTENT_INJECTION", `isi masukan mengubah struktur laporan sesudah konversi (${bad.join("; ")}); tidak ada yang dikirim. Tulis teks biasa di paragraf dan data di blok tabel`, { details: { problems: bad } });
  }
}

/** Peringatan konverter (CW) sebagai peringatan alat; teks berasal dari masukan agen sendiri. */
function conversionWarnings(r: ReportResult): ToolWarning[] {
  const c = r.conversion;
  if (c === null) return [];
  const skip = new Set(["CONTRACT_HEADING_UNMAPPED"]);
  return c.warnings.filter((w) => !skip.has(w.code)).slice(0, 10).map((w) => ({ code: w.code, message: w.message }));
}

// ── studio_edit ─────────────────────────────────────────────────────────

const PART_ORDER = (p: string): number => (p === "record" ? 0 : p === "references" ? 9999 : Number(p.replace(/^bab /, "")) || 5000);

/** Bagian dokumen -> Markdown (serializer refresh); bagian tak terwakili dicatat, tidak dapat disunting. */
function serializeParts(content: unknown): { parts: EditPart[]; skipped: string[] } {
  const parts: EditPart[] = [];
  const skipped: string[] = [];
  const all = [...partsOf(content)].sort((x, y) => PART_ORDER(x[0]) - PART_ORDER(y[0]));
  for (const [part, payload] of all) {
    const sctx = newSerializeCtx();
    const md = part === "record" ? recordToReportMarkdown(payload, sctx) : part === "references" ? referencesToReportMarkdown(payload, sctx) : chapterToReportMarkdown(payload, sctx);
    if (md === null) skipped.push(part);
    else parts.push({ part, md });
  }
  return { parts, skipped };
}

const cloneParts = (p: readonly EditPart[]): EditPart[] => p.map((x) => ({ part: x.part, md: { header: [...x.md.header], intro: [...x.md.intro], body: [...x.md.body], tail: [...x.md.tail] } as ReportPartMarkdown }));

function assemble(parts: readonly EditPart[], title: string, documentId: string, rev: number): string {
  return assembleReportMarkdown({ title, toolLines: [`basis: ${documentId}@rev${rev}`], parts: parts.map((p) => ({ part: p.part, one: p.md })) }, "mine");
}

function reparse(md: string, documentId: string, content: unknown): Map<string, unknown> {
  return partsOfValues(remapExtraChapters(mdReportToBlocks(md, { mode: "update", documentId }).blocks, content));
}

/** Dokumen sasaran (documentId atau mission+docKey) + pemilik (aturan F-2 yang sama dengan alat tulis lain). */
async function targetDoc(a: Args, ctx: ToolContext, agentId: string | null): Promise<ExistingDoc> {
  const id = str(a, "documentId");
  const mission = str(a, "mission");
  const docKey = str(a, "docKey");
  if ((id === null) === (mission === null || docKey === null)) throw new McpToolError("INVALID_ARGUMENT", "berikan documentId, atau mission + docKey");
  let doc: ExistingDoc | null;
  if (id !== null) {
    const reply = await http(ctx, "GET", studioRoutePath("R05", { id }), "GET /api/studio/documents/{id}");
    const d = isRecord(reply.body) && isRecord(reply.body.document) ? reply.body.document : {};
    doc = { id, docNumber: typeof d.docNumber === "string" ? d.docNumber : null, createdBy: typeof d.createdBy === "string" ? d.createdBy : null, currentRevisionNo: typeof d.currentRevisionNo === "number" ? d.currentRevisionNo : null, correlationId: reply.correlationId ?? null };
  } else {
    doc = await findMissionDoc(ctx, mission as string, docKey as string);
    if (doc === null) throw new McpToolError("DOCUMENT_NOT_FOUND", "dokumen untuk mission + docKey ini belum ada; buat dulu dengan studio_write. Tidak ada yang ditulis");
  }
  checkOwnership(a, ctx, doc, agentId, { resume: "atau ulangi dengan adoptExisting: true bila Anda memang ditugasi menyunting dokumen itu", step: id !== null ? "GET /api/studio/documents/{id}" : "GET /api/studio/documents" });
  return doc;
}

const CHART_EDIT = obj(
  {
    categories: { type: "array", minItems: 1, maxItems: FIGURE_BOUNDS.items, items: CHART_LABEL },
    series: { type: "array", minItems: 1, maxItems: 12, items: obj({ name: { type: "string", minLength: 1, maxLength: 120 }, values: { type: "array", maxItems: 200, items: { anyOf: [{ type: "number" }, { type: "null" }] } } }, ["name", "values"]) },
    type: { type: "string", maxLength: 40 },
    stacked: { type: "boolean" },
    caption: { type: "string", minLength: 1, maxLength: 500 },
    source: { type: "string", minLength: 1, maxLength: 500 },
    unit: { type: "string", maxLength: 40 },
  },
  [],
);

const EDITS = {
  type: "array",
  minItems: 1,
  maxItems: 50,
  items: {
    anyOf: [
      obj({ find: { type: "string", minLength: 1, maxLength: 4000 }, replace: { type: "string", maxLength: 40000 } }, ["find", "replace"]),
      obj({ after: { type: "string", minLength: 1, maxLength: 4000 }, insert: { type: "string", minLength: 1, maxLength: 40000 } }, ["after", "insert"]),
      obj({ figure: { type: "string", minLength: 1, maxLength: 500 }, chart: CHART_EDIT }, ["figure", "chart"]),
    ],
  },
  description: "{find,replace}: replace \"\" menghapus paragraf berisi find; {after,insert}: paragraf baru sesudah paragraf/tabel berisi after; {figure,chart}: data grafik yang keterangannya memuat figure (dokumen klien).",
} as const;

/** Galat konversi hasil sunting: pesannya dapat mengutip isi dokumen -> hanya di blok rincian. */
function reparseOrThrow(md: string, documentId: string, content: unknown, stage: string): Map<string, unknown> {
  try {
    return reparse(md, documentId, content);
  } catch (e) {
    throw new McpToolError("EDIT_INVALID", `${stage}: teks dokumen sesudah sunting tidak dapat dikonversi; tidak ada yang ditulis. Pesan konverter ada di blok rincian`, {
      untrusted: true,
      details: { code: isRecord(e) && typeof e.code === "string" ? e.code : null, message: e instanceof Error ? e.message : String(e) },
    });
  }
}

/** Paragraf (teks) bagian bab hasil konversi: intro + blok section bertipe paragraph. */
function chapterParagraphs(ch: unknown): { blocks: number; paras: string[] } {
  if (!isRecord(ch)) return { blocks: 0, paras: [] };
  const all = [...(Array.isArray(ch.intro) ? ch.intro : []), ...(Array.isArray(ch.sections) ? ch.sections.flatMap((s) => (isRecord(s) && Array.isArray(s.blocks) ? s.blocks : [])) : [])];
  return { blocks: all.length, paras: all.filter((b): b is Record<string, unknown> => isRecord(b) && b.type === "paragraph").map(inlineTextOf) };
}

/**
 * R-1 (siklus 2): pertahanan kedua `studio_edit` laporan kerja, setara `assertShape`. Sesudah konversi teks hasil
 * sunting: himpunan bagian sama; record hanya berubah di medan yang disunting lewat satuan medan kepala, butir/bukti/
 * cardIds hanya bila sel tabel bab disunting, refs hanya bila sel Rujukan disunting; per bab, jumlah blok = semula +
 * selisih yang diharapkan dan paragraf yang hilang/berubah <= jumlah suntingan paragraf bab itu. Selain itu
 * CONTENT_INJECTION, 0 jaringan.
 */
export function assertEditShape(before: Map<string, unknown>, after: Map<string, unknown>, plan: EditPlan): void {
  const bad: string[] = [];
  const keysB = [...before.keys()].sort();
  const keysA = [...after.keys()].sort();
  if (keysB.join("|") !== keysA.join("|")) bad.push(`himpunan bab/bagian berubah (${keysB.join(",")} -> ${keysA.join(",")})`);
  const rb = isRecord(before.get("record")) ? (before.get("record") as Record<string, unknown>) : {};
  const ra = isRecord(after.get("record")) ? (after.get("record") as Record<string, unknown>) : {};
  if (!sameContent(rb, ra)) {
    for (const k of new Set([...Object.keys(rb), ...Object.keys(ra)])) {
      if (sameContent(rb[k], ra[k])) continue;
      if (k === "items" || k === "evidence") {
        if (!plan.itemCells) bad.push(`record.${k} (butir/bukti) berubah tanpa suntingan sel tabel`);
      } else if (k === "cardIds") {
        if (!plan.itemCells && !plan.fields.has("cardIds")) bad.push("record.cardIds berubah tanpa suntingan medan/sel");
      } else if (k === "refs") {
        if (!plan.refCells) bad.push("record.refs berubah tanpa suntingan sel Rujukan");
      } else if (!plan.fields.has(k)) bad.push(`record.${k} berubah tanpa suntingan medan itu`);
    }
  }
  for (const k of keysA) {
    if (!k.startsWith("bab ") || !before.has(k)) continue;
    const b = chapterParagraphs(before.get(k));
    const a = chapterParagraphs(after.get(k));
    const allow = plan.paraDelta.get(k) ?? { removedMax: 0, delta: 0 };
    if (a.blocks !== b.blocks + allow.delta) bad.push(`${k}: jumlah blok ${a.blocks}, diharapkan ${b.blocks + allow.delta}`);
    const left = new Map<string, number>();
    for (const t of a.paras.map(loose)) left.set(t, (left.get(t) ?? 0) + 1);
    let removed = 0;
    for (const t of b.paras.map(loose)) {
      if ((left.get(t) ?? 0) > 0) left.set(t, (left.get(t) as number) - 1);
      else removed++;
    }
    if (removed > allow.removedMax) bad.push(`${k}: ${removed} paragraf hilang/berubah, suntingan paragraf hanya ${allow.removedMax}`);
  }
  if (bad.length > 0) {
    throw new McpToolError("CONTENT_INJECTION", `hasil sunting mengubah struktur dokumen di luar satuan yang disunting (${bad.join("; ")}); tidak ada yang ditulis. Sunting teks biasa; medan record lewat baris medannya, butir lewat sel tabel. Rincian di blok`, {
      untrusted: true,
      details: { problems: bad },
    });
  }
}

async function editWorkReport(a: Args, ctx: ToolContext, doc: ExistingDoc, agentId: string | null, rev: number, content: Record<string, unknown>): Promise<ToolOutput> {
  const title = isRecord(content.meta) && typeof content.meta.title === "string" ? content.meta.title : "Laporan kerja";
  const { parts } = serializeParts(content);
  const server = partsOf(content);
  const before = reparseOrThrow(assemble(parts, title, doc.id, rev), doc.id, content, "baca");
  const exact = new Set(parts.filter((p) => before.has(p.part) && sameContent(before.get(p.part), server.get(p.part))).map((p) => p.part));
  const edited = cloneParts(parts);
  const warnings: ToolWarning[] = [];
  const { plan } = applyEdits(edited, a.edits as EditOp[], (w) => warnings.push(w));
  const md = assemble(edited, title, doc.id, rev);
  const after = reparseOrThrow(md, doc.id, content, "sunting");
  assertEditShape(before, after, plan);
  const changed = [...new Set([...before.keys(), ...after.keys()])].filter((p) => !sameContent(before.get(p), after.get(p))).sort((x, y) => PART_ORDER(x) - PART_ORDER(y));
  if (changed.length === 0) {
    return {
      text: `studio_edit: dokumen ${tok(doc.id)} rev ${rev} tidak berubah (teks pengganti sama dengan isi sekarang); tidak ada yang ditulis`,
      data: { documentId: doc.id, revisionNo: rev, state: "tidak berubah", edited: [] },
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  }
  const unsafe = changed.filter((p) => !exact.has(p));
  if (unsafe.length > 0) {
    throw new McpToolError("EDIT_UNSAFE", `bagian ${unsafe.map((p) => tok(p.replace(/ /g, "-"))).join(", ")} memuat bentuk yang tidak dapat ditulis ulang lewat teks tanpa kehilangan isi; tidak ada yang ditulis. Sunting bagian itu dengan studio_write (tulis ulang utuh)`, {
      details: { parts: unsafe, revisionNo: rev },
    });
  }
  const sections = changed.map((p) => (p.startsWith("bab ") ? p.slice(4) : p));
  const args: CliArgs = { ...baseArgs("update", agentId), documentId: doc.id, remote: ctx.deps.config.baseUrl, sections, baseRev: rev };
  // Basis = revisi yang baru dibaca: bagian yang diubah pihak lain sesudahnya -> BASE_CONFLICT (0 tulis).
  let r: ReportResult;
  try {
    r = await runReport(args, reportIo(ctx, Buffer.from(md, "utf8")));
  } catch (e) {
    // I-5 (review 13): galat lokal runReport (tanpa jawaban server) memuat teks Markdown = isi dokumen -> blok rincian.
    if (e instanceof ReportError && e.info.httpStatus === undefined && e.info.correlationId === undefined) {
      throw new McpToolError(e.code, `galat lokal saat menyiapkan kiriman sunting (${tok(e.code)}); tidak ada yang ditulis untuk bagian yang ditolak. Pesan di blok rincian`, {
        untrusted: true,
        ...(e.info.step !== undefined ? { step: tok(e.info.step) } : {}),
        details: { message: e.message, ...(e.info.details !== undefined ? { details: e.info.details } : {}) },
      });
    }
    throw e;
  }
  rememberNext(ctx, r, "studio_edit");
  return resultOutput("studio_edit", r, warnings, { edited: changed, basisRevisionNo: rev });
}

const editTool: ToolDef = {
  name: "studio_edit",
  description:
    "Sunting seperti patch: edits [{find,replace}], [{after,insert}], atau [{figure,chart}] (data grafik, dicari dari keterangan); find persis (spasi dinormalkan) harus mengenai tepat satu paragraf/sel/keterangan/medan. Mesin membaca revisi terkini dan menulis revisi baru; tanpa basis. Tidak ketemu/ganda -> TEXT_NOT_FOUND/TEXT_AMBIGUOUS + kandidat, 0 tulis.",
  inputSchema: obj({ documentId: S.documentId, mission: S.mission, docKey: S.docKey, edits: EDITS, agentId: S.agentId, adoptExisting: { type: "boolean", description: "Sunting dokumen buatan agentId lain (eksplisit)." } }, ["edits"]),
  annotations: { title: "Sunting teks dokumen", readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  toolsets: ["write"],
  async run(a, ctx) {
    const agentId = plainAgentId(a, ctx);
    const doc = await targetDoc(a, ctx, agentId);
    const reply = await http(ctx, "GET", studioRoutePath("R20", { id: doc.id }), "GET /api/studio/documents/{id}/content");
    const body = isRecord(reply.body) ? reply.body : {};
    if (typeof body.revisionNo !== "number" || !isRecord(body.content)) throw new McpToolError("REMOTE_BAD_RESPONSE", "jawaban isi dokumen tanpa revisionNo/content", { ...(reply.correlationId ? { correlationId: reply.correlationId } : {}) });
    const content = body.content;
    const sections = isRecord(content.sections) ? content.sections : {};
    if (isRecord(sections.record) && sections.record.type === "contractRecord") {
      if ((a.edits as Args[]).some((e) => "figure" in e)) throw new McpToolError("INVALID_ARGUMENT", "laporan kerja tidak memuat figur; {figure, chart} hanya untuk dokumen klien. Tidak ada yang ditulis");
      return editWorkReport(a, ctx, doc, agentId, body.revisionNo, content);
    }
    return editClient(a, ctx, doc.id, doc.docNumber, agentId, body.revisionNo, content);
  },
};

export const WRITE_TOOLS: readonly ToolDef[] = [writeTool, editTool];

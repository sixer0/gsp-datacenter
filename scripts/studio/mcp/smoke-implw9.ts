/**
 * Uji asap stdio NYATA IMPL-W9 (ronde 12 R12B): server.ts (`STUDIO_MCP_TOOLSETS=write`) ke Studio DEV. Dua laporan
 * kerja ditulis (yang kedua dengan meta verdict "PASS (CHECK 1-8)" -> PASS), lalu studio_edit { section: "Rujukan",
 * append } dikirim dalam bentuk persis R12B (larik berisi satu tabel) ke laporan kedua yang belum punya Rujukan,
 * merujuk pid laporan pertama: section dibuat, refs tersimpan. Vonis via saluran meta studio_edit, pid tak sah
 * (MD_REPORT_INVALID, 0 tulis), dan section non-baku (TEXT_NOT_FOUND) ikut diuji.
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder> npx tsx scripts/studio/mcp/smoke-implw9.ts
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-04_smoke-implw9] [--agent-id cod-implw9]
 *
 * Keluar 0 lulus, 1 ada langkah gagal, 2 galat lingkungan. Rahasia tidak dicetak. 429 dihormati.
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/* eslint-disable @typescript-eslint/no-explicit-any -- structuredContent bebas bentuk */
type Res = { isError: boolean; data: any; text: string; bytes: number; ms: number };
type Call = (name: string, args: Record<string, unknown>) => Promise<Res>;
type Step = { step: string; ok: boolean; note: string };

const argOf = (argv: string[], name: string, def: string): string => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const codes = (r: Res): string[] => (r.data.warnings ?? []).map((w: any) => w.code);
const brief = (r: Res, extra = ""): string => `${r.data.ok === false ? `${r.data.code} ` : ""}${extra} [${r.bytes} B, ${r.ms} ms]`.trim();

async function content(call: Call, id: string): Promise<any> {
  const g = await call("studio_document_get", { documentId: id, view: "content" });
  return g.data.content ?? {};
}

const sections = (tag: string) => [
  { heading: "Ringkasan", blocks: [`Uji asap IMPL-W9 laporan ${tag}: section dibuat lewat append dan vonis dinormalkan.`] },
  { heading: "Rincian kerja", blocks: [[["judul", "status"], [`W9-${tag}: append Rujukan`, "berjalan"]]] },
  { heading: "Bukti", blocks: [`Bukti awal laporan ${tag}.`] },
  { heading: "Isu terbuka", blocks: ["Tidak ada."] },
  { heading: "Langkah berikut", blocks: ["Lanjut uji ronde 13."] },
];

async function report(call: Call, mission: string, stamp: string): Promise<Step[]> {
  const steps: Step[] = [];
  const a = await call("studio_write", { mission, docKey: `implw9-a-${stamp}`, meta: { status: "complete" }, sections: sections("A") });
  const idA = a.data.documentId as string;
  const pv = typeof idA === "string" ? await call("studio_document_get", { documentId: idA, view: "paragraphs", chapter: "1" }) : null;
  const pidA = (pv?.data.paragraphs ?? [])[0]?.pid as string | undefined;
  steps.push({ step: "S1 studio_write laporan A + pid paragraf bab 1", ok: a.data.ok === true && typeof pidA === "string", note: brief(a, `rev ${a.data.revisionNo}; pid ${pidA ?? "-"}`) });
  if (typeof idA !== "string" || typeof pidA !== "string") return steps;

  const b = await call("studio_write", { mission, docKey: `implw9-b-${stamp}`, meta: { status: "partial", verdict: "PASS (CHECK 1-8)" }, sections: sections("B") });
  const idB = b.data.documentId as string;
  const cb0 = typeof idB === "string" ? await content(call, idB) : {};
  steps.push({
    step: "S2 studio_write laporan B, meta verdict 'PASS (CHECK 1-8)' -> PASS; VERDICT_NORMALIZED senyap di hasil ringkas",
    ok: b.data.ok === true && cb0.sections?.record?.verdict === "PASS" && !codes(b).includes("VERDICT_NORMALIZED") && !codes(b).includes("VERDICT_DROPPED") && (cb0.sections?.record?.refs ?? []).length === 0,
    note: brief(b, `rev ${b.data.revisionNo}; verdict ${cb0.sections?.record?.verdict}; refs ${(cb0.sections?.record?.refs ?? []).length}; peringatan ${codes(b).join(",") || "-"}`),
  });
  if (typeof idB !== "string") return steps;

  // Bentuk R12B persis: append = larik berisi SATU tabel (baris judul + satu baris rujukan).
  const e = await call("studio_edit", { documentId: idB, detail: true, edits: [{ section: "Rujukan", append: [[["hubungan", "dokumen", "paragraf"], ["bukti", idA, pidA]]] }] });
  const cb1 = await content(call, idB);
  const refs = cb1.sections?.record?.refs ?? [];
  steps.push({
    step: "S3 studio_edit append Rujukan (belum ada) merujuk pid laporan A -> ok, SECTION_CREATED, refs tersimpan",
    ok: e.data.ok === true && codes(e).includes("SECTION_CREATED") && refs.length === 1 && refs[0].documentId === idA && refs[0].pid === pidA && refs[0].rel === "evidence",
    note: brief(e, `rev ${e.data.revisionNo}; edited ${(e.data.edited ?? []).join(",")}; refs ${JSON.stringify(refs)}; peringatan ${codes(e).join(",") || "-"}`),
  });

  const v1 = await call("studio_edit", { documentId: idB, meta: { verdict: "gagal: uji ulang 2 cek" } });
  const cv1 = await content(call, idB);
  const v2 = await call("studio_edit", { documentId: idB, detail: true, meta: { verdict: "PASS (CHECK 1-8)" } });
  const cv2 = await content(call, idB);
  steps.push({
    step: "S4 studio_edit meta verdict 'gagal: ...' -> FAIL, lalu 'PASS (CHECK 1-8)' -> PASS (detail menampilkan VERDICT_NORMALIZED)",
    ok: v1.data.ok === true && cv1.sections?.record?.verdict === "FAIL" && v2.data.ok === true && cv2.sections?.record?.verdict === "PASS" && codes(v2).includes("VERDICT_NORMALIZED"),
    note: `${brief(v1, `verdict ${cv1.sections?.record?.verdict}`)}; ${brief(v2, `verdict ${cv2.sections?.record?.verdict}; peringatan ${codes(v2).join(",") || "-"}`)}`,
  });

  const rev = v2.data.revisionNo;
  const bad = await call("studio_edit", { documentId: idB, edits: [{ section: "Rujukan", append: [[["hubungan", "dokumen", "paragraf"], ["bukti", idA, "P 1!"]]] }] });
  const nf = await call("studio_edit", { documentId: idB, edits: [{ section: "Bab Fiktif", append: "Y." }] });
  const cb2 = await content(call, idB);
  steps.push({
    step: "S5 pid tak sah -> MD_REPORT_INVALID; section non-baku -> TEXT_NOT_FOUND; refs tetap 1",
    ok: bad.data.ok === false && bad.data.code === "MD_REPORT_INVALID" && nf.data.ok === false && nf.data.code === "TEXT_NOT_FOUND" && (cb2.sections?.record?.refs ?? []).length === 1,
    note: `${brief(bad)}; ${brief(nf)}; rev sebelum ${rev}; refs ${(cb2.sections?.record?.refs ?? []).length}`,
  });
  return steps;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  if ((process.env.INTERNAL_API_SECRET ?? "") === "" || roots === "") {
    process.stderr.write("smoke-implw9: env INTERNAL_API_SECRET dan STUDIO_MCP_FILE_ROOTS wajib\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-04_smoke-implw9");
  const agentId = argOf(argv, "--agent-id", "cod-implw9");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, STUDIO_AGENT_ID: agentId, STUDIO_MCP_TOOLSETS: "write" },
    stderr: "pipe",
  });
  const mcp = new Client({ name: "studio-mcp-smoke-implw9", version: "1.0.0" });
  await mcp.connect(transport);
  const log: string[] = [];
  const call: Call = async (name, args) => {
    for (let attempt = 0; ; attempt++) {
      const t0 = Date.now();
      const r: any = await mcp.callTool({ name, arguments: args });
      const data = r.structuredContent ?? {};
      if (data.code === "RATE_LIMITED" && attempt < 2) {
        await sleep(((data.retryAfterSec as number) ?? 20) * 1000);
        continue;
      }
      const text = String(r.content?.[0]?.text ?? "");
      log.push(`### ${name} ${JSON.stringify(args).slice(0, 200)}\n${text}`);
      return { isError: r.isError === true, data, text, bytes: Buffer.byteLength(JSON.stringify(r)), ms: Date.now() - t0 };
    }
  };
  const steps: Step[] = [];
  try {
    steps.push(...(await report(call, mission, stamp)));
  } finally {
    await mcp.close();
  }
  fs.writeFileSync(path.join(root, `smoke-implw9-${stamp}.log`), log.join("\n\n"));
  const ok = steps.every((s) => s.ok);
  process.stdout.write(`${JSON.stringify({ ok, mission, stamp, steps }, null, 2)}\n`);
  return ok ? 0 : 1;
}

main().then(
  (c) => {
    process.exitCode = c;
  },
  (e: unknown) => {
    process.stderr.write(`smoke-implw9: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);

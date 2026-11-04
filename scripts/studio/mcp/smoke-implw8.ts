/**
 * Uji asap stdio NYATA IMPL-W8 (ronde 11 R11B): server.ts (`STUDIO_MCP_TOOLSETS=write`) ke Studio DEV. Laporan kerja
 * ditulis, lalu studio_edit dikirim dalam bentuk persis jembatan Hermes R11B: argumen terbungkus ganda
 * `{ arguments: {...}, name: "mcp__studio__studio_edit" }` dengan butir `{ meta: { status } }` di dalam `edits`.
 * Mesin harus membuka pembungkus, mengangkat meta, menerapkan suntingan teks, dan menyimpan status.
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder> npx tsx scripts/studio/mcp/smoke-implw8.ts
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-04_smoke-implw8] [--agent-id cod-implw8]
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

const SUMMARY = "Uji asap IMPL-W8 argumen terbungkus ganda dari jembatan klien.";

async function report(call: Call, mission: string, docKey: string): Promise<Step[]> {
  const steps: Step[] = [];
  const w = await call("studio_write", { mission, docKey, meta: { status: "partial" }, sections: [
    { heading: "Ringkasan", blocks: [SUMMARY] },
    { heading: "Rincian kerja", blocks: [[["judul", "status"], ["W8-1: buka pembungkus", "berjalan"]]] },
    { heading: "Bukti", blocks: ["Belum ada bukti; uji asap."] },
    { heading: "Isu terbuka", blocks: ["Tidak ada."] },
    { heading: "Langkah berikut", blocks: ["Sunting terbungkus ganda dengan meta di edits."] },
  ] });
  const id = w.data.documentId as string;
  const c0 = typeof id === "string" ? await content(call, id) : {};
  steps.push({ step: "S1 studio_write laporan kerja (status partial)", ok: w.data.ok === true && typeof id === "string", note: brief(w, `rev ${w.data.revisionNo}; status ${c0.sections?.record?.status}`) });
  if (typeof id !== "string") return steps;

  // Bentuk R11B persis: pembungkus { arguments, name } + butir { meta } di dalam edits.
  const e = await call("studio_edit", {
    arguments: { documentId: id, edits: [{ find: "Uji asap IMPL-W8", replace: "Uji asap IMPL-W8 (disunting)" }, { meta: { status: "complete" } }] },
    name: "mcp__studio__studio_edit",
  });
  const c1 = await content(call, id);
  const status = c1.sections?.record?.status;
  const textOk = JSON.stringify(c1.sections?.content ?? {}).includes("(disunting)");
  steps.push({
    step: "S2 studio_edit terbungkus ganda + { meta } di edits -> ok, teks tersunting, status complete tersimpan, peringatan senyap",
    ok: e.data.ok === true && status === "complete" && textOk && !codes(e).includes("ARGS_UNWRAPPED") && !codes(e).includes("META_LIFTED_FROM_EDITS"),
    note: brief(e, `rev ${e.data.revisionNo}; status ${status}; teks ${textOk ? "tersunting" : "TIDAK"}; peringatan ${codes(e).join(",") || "-"}`),
  });

  // Nama alat yang salah -> tidak dibuka, ditolak seperti dulu, tidak ada tulis.
  const revBefore = e.data.revisionNo;
  const bad = await call("studio_edit", { arguments: { documentId: id, meta: { status: "blocked" } }, name: "mcp__studio__studio_write" });
  const c2 = await content(call, id);
  steps.push({ step: "S3 pembungkus dengan nama alat lain -> INVALID_ARGUMENT, status tidak berubah", ok: bad.data.ok === false && bad.data.code === "INVALID_ARGUMENT" && c2.sections?.record?.status === "complete", note: brief(bad, `status ${c2.sections?.record?.status}; rev sebelum ${revBefore}`) });
  return steps;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  if ((process.env.INTERNAL_API_SECRET ?? "") === "" || roots === "") {
    process.stderr.write("smoke-implw8: env INTERNAL_API_SECRET dan STUDIO_MCP_FILE_ROOTS wajib\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-04_smoke-implw8");
  const agentId = argOf(argv, "--agent-id", "cod-implw8");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, STUDIO_AGENT_ID: agentId, STUDIO_MCP_TOOLSETS: "write" },
    stderr: "pipe",
  });
  const mcp = new Client({ name: "studio-mcp-smoke-implw8", version: "1.0.0" });
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
    steps.push(...(await report(call, mission, `implw8-lap-${stamp}`)));
  } finally {
    await mcp.close();
  }
  fs.writeFileSync(path.join(root, `smoke-implw8-${stamp}.log`), log.join("\n\n"));
  const ok = steps.every((s) => s.ok);
  process.stdout.write(`${JSON.stringify({ ok, mission, stamp, steps }, null, 2)}\n`);
  return ok ? 0 : 1;
}

main().then(
  (c) => {
    process.exitCode = c;
  },
  (e: unknown) => {
    process.stderr.write(`smoke-implw8: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);

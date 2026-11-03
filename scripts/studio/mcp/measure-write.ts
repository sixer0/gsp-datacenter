/**
 * IMPL-W4 butir 5: ukur ukuran hasil toolset `write` per panggilan dan per giliran lewat stdio NYATA (klien SDK resmi,
 * seperti `measure.ts`). Urutan sama untuk kode lama dan baru: studio_write dokumen klien r5b (bahan doc_ud2b), lalu
 * studio_edit RV-1 + RV-3 (teks), studio_edit RV-2 + RV-4 (sel + data grafik), studio_file_verify. Ukuran = bita JSON
 * (UTF-8) hasil utuh, teks, dan structuredContent; token ~ ceil(bita / 4). Rahasia hanya dari env, tidak dicetak.
 *
 *   INTERNAL_API_SECRET=... npx tsx scripts/studio/mcp/measure-write.ts --source <doc_ud2b/source> --mission <m>
 *     --doc-key <k> [--base-url http://127.0.0.1:9021] [--agent cod-implw4]
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { RV_DATA, RV_TEXT, writeArgs } from "./ud-source";

const argOf = (argv: string[], name: string): string | null => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : null;
};
const sizeOf = (v: unknown) => {
  const bytes = Buffer.byteLength(typeof v === "string" ? v : JSON.stringify(v ?? null), "utf8");
  return { bytes, tokensApprox: Math.ceil(bytes / 4) };
};

/* eslint-disable @typescript-eslint/no-explicit-any -- hasil JSON-RPC bebas bentuk */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const source = argOf(argv, "--source");
  const mission = argOf(argv, "--mission");
  const docKey = argOf(argv, "--doc-key");
  if (source === null || mission === null || docKey === null) {
    process.stderr.write("measure-write: --source, --mission, --doc-key wajib\n");
    return 2;
  }
  const baseUrl = argOf(argv, "--base-url") ?? "http://127.0.0.1:9021";
  const env: Record<string, string> = { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, STUDIO_MCP_TOOLSETS: "write", STUDIO_AGENT_ID: argOf(argv, "--agent") ?? "cod-implw4" };
  const transport = new StdioClientTransport({ command: process.execPath, args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")], env, stderr: "pipe" });
  const client = new Client({ name: "studio-mcp-measure-write", version: "1.0.0" });
  await client.connect(transport);
  const instructions = client.getInstructions() ?? "";
  const tools = await client.listTools();
  const perTurn = sizeOf(instructions).bytes + sizeOf(tools).bytes;
  const calls: Array<Record<string, unknown>> = [];
  let documentId: string | null = null;
  let fileId: string | null = null;
  const call = async (label: string, name: string, args: Record<string, unknown>) => {
    const t0 = Date.now();
    const r: any = await client.callTool({ name, arguments: args });
    const sc = r.structuredContent ?? {};
    const dump = argOf(argv, "--dump");
    if (dump !== null) writeFileSync(path.join(dump, `${calls.length + 1}-${name}.json`), JSON.stringify(r, null, 1));
    documentId ??= typeof sc.documentId === "string" ? sc.documentId : null;
    if (sc.render && typeof sc.render.fileId === "string") fileId = sc.render.fileId;
    calls.push({ label, tool: name, ok: sc.ok ?? null, code: sc.code ?? null, ms: Date.now() - t0, total: sizeOf(r).bytes, text: sizeOf(r.content?.[0]?.text ?? "").bytes, structured: sizeOf(sc).bytes, warnings: Array.isArray(sc.warnings) ? sc.warnings.length : 0 });
    return sc;
  };
  await call("S1 studio_write", "studio_write", writeArgs(source, mission, docKey));
  if (documentId !== null) {
    await call("S2a edit RV-1+RV-3", "studio_edit", { documentId, edits: RV_TEXT });
    await call("S2b edit RV-2+RV-4", "studio_edit", { documentId, edits: RV_DATA });
    if (fileId !== null) await call("verify", "studio_file_verify", { fileId });
  }
  await client.close();
  const sum = (k: string) => calls.reduce((n, c) => n + (c[k] as number), 0);
  process.stdout.write(`${JSON.stringify({ baseUrl, mission, docKey, documentId, perTurn: { bytes: perTurn, tokensApprox: Math.ceil(perTurn / 4), toolsList: sizeOf(tools).bytes, instructions: sizeOf(instructions).bytes }, calls, totals: { total: sum("total"), text: sum("text"), structured: sum("structured") } }, null, 2)}\n`);
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    process.stderr.write(`measure-write: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);

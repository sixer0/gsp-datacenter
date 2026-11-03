/**
 * Uji asap stdio NYATA IMPL-W4 (D-547): memutar ulang dokumen klien r5b dengan bahan asli (`doc_ud2b/source`) lewat
 * server.ts (`STUDIO_MCP_TOOLSETS=write`) ke Studio DEV: studio_write (template + meta dari meta.md), RV-1..RV-4,
 * meta Rev 1 lewat saluran meta studio_edit, lalu unduh DOCX akhir dan periksa judul persis, Tabel/Gambar 6.1, nomor
 * sampul dari meta, teks revisi penuh, PNG Gambar 6.1. Ditambah status/meta laporan kerja (butir 2).
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder> npx tsx scripts/studio/mcp/smoke-implw4.ts --source <dir>
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-03_implw4] [--agent-id cod-implw4]
 *
 * Keluar 0 lulus, 1 ada langkah gagal, 2 galat lingkungan. Rahasia tidak dicetak. 429 dihormati.
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { checkClient, checkReport, type Call } from "./smoke-implw4-checks";

const argOf = (argv: string[], name: string, def: string): string => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* eslint-disable @typescript-eslint/no-explicit-any -- structuredContent bebas bentuk */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  const source = argOf(argv, "--source", "");
  if ((process.env.INTERNAL_API_SECRET ?? "") === "" || roots === "" || source === "") {
    process.stderr.write("smoke-implw4: env INTERNAL_API_SECRET, STUDIO_MCP_FILE_ROOTS dan --source wajib\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-03_implw4");
  const agentId = argOf(argv, "--agent-id", "cod-implw4");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, STUDIO_AGENT_ID: agentId, STUDIO_MCP_TOOLSETS: "write" },
    stderr: "pipe",
  });
  const client = new Client({ name: "studio-mcp-smoke-implw4", version: "1.0.0" });
  await client.connect(transport);
  const log: string[] = [];
  const call: Call = async (name, args) => {
    for (let attempt = 0; ; attempt++) {
      const t0 = Date.now();
      const r: any = await client.callTool({ name, arguments: args });
      const data = r.structuredContent ?? {};
      if (data.code === "RATE_LIMITED" && attempt < 2) {
        await sleep(((data.retryAfterSec as number) ?? 20) * 1000);
        continue;
      }
      const text = String(r.content?.[0]?.text ?? "");
      log.push(`### ${name} ${JSON.stringify(args).slice(0, 160)}\n${text}`);
      return { isError: r.isError === true, data, text, bytes: Buffer.byteLength(JSON.stringify(r)), ms: Date.now() - t0 };
    }
  };
  const steps: Array<{ step: string; ok: boolean; note: string }> = [];
  try {
    steps.push(...(await checkClient(call, { source, mission, docKey: `ud2b-smoke-${stamp}`, root })));
    steps.push(...(await checkReport(call, { mission, docKey: `implw4-lap-${stamp}` })));
  } finally {
    await client.close();
  }
  fs.writeFileSync(path.join(root, `smoke-implw4-${stamp}.log`), log.join("\n\n"));
  const ok = steps.every((s) => s.ok);
  process.stdout.write(`${JSON.stringify({ ok, mission, stamp, steps }, null, 2)}\n`);
  return ok ? 0 : 1;
}

main().then(
  (c) => {
    process.exitCode = c;
  },
  (e: unknown) => {
    process.stderr.write(`smoke-implw4: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);

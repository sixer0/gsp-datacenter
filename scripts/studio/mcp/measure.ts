/**
 * Ukur beban token server MCP Studio (MCP-D1, D-475): menjalankan `server.ts` lewat stdio NYATA (klien SDK
 * resmi), lalu mengukur ukuran `initialize.instructions`, `tools/list`, `prompts/list`, `resources/list`, dan
 * (opsional) hasil alat baca tipikal. Ukuran = bita JSON hasil (UTF-8) dan perkiraan token = ceil(bita / 4)
 * (heuristik kasar; tokenizer tiap model berbeda). Tidak menulis berkas; rahasia tidak dicetak.
 *
 *   INTERNAL_API_SECRET=... npx tsx <repo>/scripts/studio/mcp/measure.ts [--toolsets reports,documents]
 *     [--calls] [--document-id <id>] [--base-url http://127.0.0.1:9021]
 *
 * `--toolsets` diteruskan sebagai env `STUDIO_MCP_TOOLSETS` (kosong = bawaan server). `--calls` memanggil
 * alat baca yang tersedia di toolset itu (tanpa tulis ke server). Keluaran: satu JSON ke stdout.
 */
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

function argOf(argv: string[], name: string): string | null {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : null;
}

const sizeOf = (v: unknown) => {
  const bytes = Buffer.byteLength(JSON.stringify(v), "utf8");
  return { bytes, tokensApprox: Math.ceil(bytes / 4) };
};

/* eslint-disable @typescript-eslint/no-explicit-any -- hasil JSON-RPC bebas bentuk */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const toolsets = argOf(argv, "--toolsets");
  const baseUrl = argOf(argv, "--base-url") ?? process.env.STUDIO_BASE_URL ?? "http://127.0.0.1:9021";
  const documentId = argOf(argv, "--document-id");
  const env: Record<string, string> = { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl };
  if (toolsets !== null) env.STUDIO_MCP_TOOLSETS = toolsets;
  else delete env.STUDIO_MCP_TOOLSETS;
  const secret = process.env.INTERNAL_API_SECRET ?? "";
  const transport = new StdioClientTransport({ command: process.execPath, args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")], env, stderr: "pipe" });
  const client = new Client({ name: "studio-mcp-measure", version: "1.0.0" });
  await client.connect(transport);
  const instructions = client.getInstructions() ?? "";
  const tools = await client.listTools();
  const prompts = await client.listPrompts();
  const resources = await client.listResources();
  const perTool = tools.tools.map((t) => ({ name: t.name, ...sizeOf(t) })).sort((a, b) => b.bytes - a.bytes);
  const base = {
    instructions: sizeOf(instructions),
    toolsList: sizeOf(tools),
    promptsList: sizeOf(prompts),
    resourcesList: sizeOf(resources),
  };
  const perTurnBytes = base.instructions.bytes + base.toolsList.bytes;
  const calls: Array<Record<string, unknown>> = [];
  if (argv.includes("--calls")) {
    if (secret === "") process.stderr.write("measure: INTERNAL_API_SECRET kosong; alat ber-server akan menjawab SECRET_MISSING\n");
    const names = new Set(tools.tools.map((t) => t.name));
    const plan: Array<[string, Record<string, unknown>]> = [
      ["studio_registry", {}],
      ["studio_report_template", { mission: "2026-11-02_mcp_d1", docKey: "lapkerja-ukur" }],
      ["studio_templates_list", {}],
      ["studio_template_get", { slug: "datum-gsp" }],
      ...(documentId !== null
        ? ([
            ["studio_document_get", { documentId, view: "summary" }],
            ["studio_document_status", { documentId }],
          ] as Array<[string, Record<string, unknown>]>)
        : []),
    ];
    for (const [name, args] of plan) {
      if (!names.has(name)) continue;
      const r: any = await client.callTool({ name, arguments: args });
      calls.push({ tool: name, args, isError: r.isError === true, total: sizeOf(r), text: sizeOf(r.content?.[0]?.text ?? ""), structured: sizeOf(r.structuredContent ?? {}) });
    }
  }
  await client.close();
  process.stdout.write(
    `${JSON.stringify({ toolsets: toolsets ?? "(bawaan)", toolCount: tools.tools.length, ...base, perTurn: { bytes: perTurnBytes, tokensApprox: Math.ceil(perTurnBytes / 4), note: "instructions + tools/list (dikirim klien ke model setiap giliran)" }, perTool, calls }, null, 2)}\n`,
  );
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    process.stderr.write(`measure: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);

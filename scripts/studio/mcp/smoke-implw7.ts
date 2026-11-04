/**
 * Uji asap stdio NYATA IMPL-W7 (ronde 10 R12B): server.ts (`STUDIO_MCP_TOOLSETS=write`) ke Studio DEV. Laporan kerja
 * ditulis dengan bentuk persis kiriman Hermes R12B (setiap baris tabel butir = blok larik datar sendiri, lalu paragraf);
 * mesin harus menggabungnya menjadi SATU tabel butir (judul/status, 4 baris, 4 butir record berstatus terpetakan, tanpa
 * daftar), lalu suntingan sel status R12-B1 harus berhasil.
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder> npx tsx scripts/studio/mcp/smoke-implw7.ts
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-04_smoke-implw7] [--agent-id cod-implw7]
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
const titleText = (t: unknown): string => (typeof t === "string" ? t : t !== null && typeof t === "object" && typeof (t as any).text === "string" ? (t as any).text : "");
const itemsOf = (c: any): Array<{ key: string; title: string; status: string }> => (c.sections?.record?.items ?? []).map((i: any) => ({ key: String(i.key), title: titleText(i.title), status: String(i.status) }));
const blocksOf = (c: any, key: string): any[] => {
  const ch = (c.sections?.content?.chapters ?? []).find((x: any) => String(x.key) === key);
  return ch ? [...(ch.intro ?? []), ...(ch.sections ?? []).flatMap((s: any) => s.blocks ?? [])] : [];
};

const R12B_ROWS = [
  ["judul", "status"],
  ["R12-B1: CHECK 1-2 (rubrik, lajur)", "berjalan"],
  ["R12-B2: CHECK 3 (sumber)", "belum mulai"],
  ["R12-B3: CHECK 4 (angka)", "belum mulai"],
  ["R12-B4: CHECK 5 (render)", "belum mulai"],
];

async function report(call: Call, mission: string, docKey: string): Promise<Step[]> {
  const steps: Step[] = [];
  const w = await call("studio_write", { mission, docKey, meta: { status: "partial" }, detail: true, sections: [
    { heading: "Ringkasan", blocks: ["Uji asap IMPL-W7: bentuk R12B (baris tabel sebagai blok terpisah)."] },
    { heading: "Rincian kerja", blocks: [...R12B_ROWS, "Butir R12-B1 sedang dikerjakan; sisanya menunggu."] },
    { heading: "Bukti", blocks: ["Belum ada bukti; uji asap."] },
    { heading: "Isu terbuka", blocks: ["Tidak ada."] },
    { heading: "Langkah berikut", blocks: ["Sunting status R12-B1."] },
  ] });
  const id = w.data.documentId as string;
  if (typeof id !== "string") {
    steps.push({ step: "R1 studio_write bentuk R12B", ok: false, note: brief(w, w.text.slice(0, 300)) });
    return steps;
  }
  const c1 = await content(call, id);
  const b2 = blocksOf(c1, "2");
  const tables = b2.filter((b) => b.type === "table");
  const header = tables[0]?.rows?.[0]?.cells?.map((x: any) => x.text) ?? [];
  const it1 = itemsOf(c1);
  steps.push({
    step: "R1 studio_write bentuk R12B -> satu tabel butir (judul/status + key), 4 butir record berstatus terpetakan, tanpa daftar",
    ok: w.data.ok === true && tables.length === 1 && !b2.some((b) => b.type === "list") && header.includes("judul") && header.includes("status") && tables[0].rows.length === 5 && it1.length === 4 && it1.map((i) => i.status).join(",") === "running,todo,todo,todo" && codes(w).includes("ROWS_COALESCED_TO_TABLE"),
    note: brief(w, `rev ${w.data.revisionNo}; bab2 ${b2.map((b) => b.type).join(",")}; header ${header.join("|")}; items ${JSON.stringify(it1.map((i) => [i.key, i.status]))}; tableCount ${w.data.verify?.tableCount}; peringatan ${codes(w).join(",")}`),
  });
  steps.push({ step: "R2 ringkasan verifikasi memuat jumlah tabel", ok: typeof w.data.verify?.tableCount === "number" && w.data.verify.tableCount >= 1 && /\d+ tabel/.test(w.text), note: `tableCount ${w.data.verify?.tableCount}; ${(w.text.match(/\[tabel \d+\]/g) ?? []).join(" ")}` });

  const b1 = it1.find((i) => i.title.startsWith("R12-B1"));
  const e = await call("studio_edit", { documentId: id, edits: [{ cell: { row: b1?.key ?? "R12-B1", column: "status" }, value: "selesai" }] });
  const it2 = itemsOf(await content(call, id));
  steps.push({ step: "R3 suntingan sel status R12-B1 (kunci butir) -> done", ok: e.data.ok === true && it2.find((i) => i.key === b1?.key)?.status === "done", note: brief(e, `items ${JSON.stringify(it2.map((i) => [i.key, i.status]))}`) });

  const e2 = await call("studio_edit", { documentId: id, edits: [{ cell: { row: "R12-B2: CHECK 3 (sumber)", column: "status" }, value: "berjalan" }] });
  const it3 = itemsOf(await content(call, id));
  steps.push({ step: "R4 suntingan sel status lewat judul butir R12-B2 -> running", ok: e2.data.ok === true && it3.find((i) => i.title.startsWith("R12-B2"))?.status === "running", note: brief(e2, `items ${JSON.stringify(it3.map((i) => [i.key, i.status]))}`) });
  return steps;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  if ((process.env.INTERNAL_API_SECRET ?? "") === "" || roots === "") {
    process.stderr.write("smoke-implw7: env INTERNAL_API_SECRET dan STUDIO_MCP_FILE_ROOTS wajib\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-04_smoke-implw7");
  const agentId = argOf(argv, "--agent-id", "cod-implw7");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, STUDIO_AGENT_ID: agentId, STUDIO_MCP_TOOLSETS: "write" },
    stderr: "pipe",
  });
  const mcp = new Client({ name: "studio-mcp-smoke-implw7", version: "1.0.0" });
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
    steps.push(...(await report(call, mission, `implw7-lap-${stamp}`)));
  } finally {
    await mcp.close();
  }
  fs.writeFileSync(path.join(root, `smoke-implw7-${stamp}.log`), log.join("\n\n"));
  const ok = steps.every((s) => s.ok);
  process.stdout.write(`${JSON.stringify({ ok, mission, stamp, steps }, null, 2)}\n`);
  return ok ? 0 : 1;
}

main().then(
  (c) => {
    process.exitCode = c;
  },
  (e: unknown) => {
    process.stderr.write(`smoke-implw7: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);

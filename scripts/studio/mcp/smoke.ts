/**
 * Uji asap stdio NYATA server MCP Studio (MCP-01): menjalankan `server.ts` sebagai proses anak lewat
 * klien SDK resmi, lalu initialize -> tools/list -> prompts/resources -> alur alat penuh ke server Studio
 * (template -> check -> submit -> update -> refresh -> query -> search -> document_get -> render ->
 * file_verify -> draft_check -> galat BASIS_MISSING). MCP-04: update tanpa basis memakai basis yang diingat
 * sesi, correlationIds di setiap hasil sukses, penanda <data-tak-tepercaya> di hasil pencarian, dan (bila
 * STUDIO_MCP_FILE_ROOTS diisi) refresh outPath berkas baru + OUT_EXISTS tanpa overwrite. Mencetak ringkasan
 * + cid; rahasia tidak pernah dicetak (dipindai di semua keluaran dan stderr server). MCP-D1: dijalankan dengan
 * STUDIO_MCP_TOOLSETS=reports,query (12 alat laporan + cari yang sama seperti sebelum D1).
 *
 *   INTERNAL_API_SECRET=... npx tsx <repo>/scripts/studio/mcp/smoke.ts [--base-url http://127.0.0.1:9021] \
 *     [--mission 2026-11-01_mcp01] [--agent-id cod-mcp-01] [--json]
 *
 * Menulis dokumen nyata di server Studio (satu laporan kerja baru per jalan, docKey ber-cap waktu).
 * Kode keluar: 0 semua langkah lulus, 1 ada langkah gagal, 2 galat pemakaian/lingkungan.
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface Step {
  step: string;
  ok: boolean;
  note: string;
  correlationId?: string | null;
}

function argOf(argv: string[], name: string, def: string): string {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- structuredContent bebas bentuk */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const secret = process.env.INTERNAL_API_SECRET ?? "";
  if (secret === "") {
    process.stderr.write("smoke: env INTERNAL_API_SECRET belum diisi\n");
    return 2;
  }
  const baseUrl = argOf(argv, "--base-url", process.env.STUDIO_BASE_URL ?? "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-01_mcp01");
  const agentId = argOf(argv, "--agent-id", "cod-mcp-01");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const docKey = `lapkerja-mcp01-${stamp}`;
  const word = `mcpasap${stamp}`;
  const serverStderr: string[] = [];
  const outputs: string[] = [];
  const steps: Step[] = [];

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, INTERNAL_API_SECRET: secret, STUDIO_AGENT_ID: agentId, STUDIO_MCP_TOOLSETS: "reports,query" },
    stderr: "pipe",
  });
  transport.stderr?.on("data", (d: Buffer) => serverStderr.push(d.toString("utf8")));
  const client = new Client({ name: "studio-mcp-smoke", version: "1.0.0" });
  const t0 = Date.now();
  await client.connect(transport);
  const info = client.getServerVersion();
  steps.push({ step: "initialize", ok: info?.name === "gsp-studio", note: `server ${info?.name} ${info?.version} (stdio)` });

  const tools = await client.listTools();
  steps.push({ step: "tools/list", ok: tools.tools.length === 12, note: `${tools.tools.length} alat: ${tools.tools.map((t) => t.name).join(", ")}` });
  const prompts = await client.listPrompts();
  const resources = await client.listResources();
  steps.push({ step: "prompts+resources", ok: prompts.prompts.length === 1 && resources.resources.length === 3, note: `${prompts.prompts.length} prompt, ${resources.resources.length} resource` });

  const call = async (name: string, args: Record<string, unknown>) => {
    const r: any = await client.callTool({ name, arguments: args });
    outputs.push(JSON.stringify(r));
    const data = r.structuredContent ?? {};
    const cids: string[] = Array.isArray(data.correlationIds) ? data.correlationIds : [];
    return { isError: r.isError === true, data, text: String(r.content?.[0]?.text ?? ""), cid: data.error?.correlationId ?? cids[cids.length - 1] ?? data.correlationId ?? null, cids };
  };

  const tpl = await call("studio_report_template", { mission, docKey });
  steps.push({ step: "studio_report_template", ok: !tpl.isError && String(tpl.data.template).includes(`docKey: ${docKey}`), note: `${String(tpl.data.template ?? "").split("\n").length} baris templat` });

  const report = (bab1: string, basis: string | null) =>
    [
      `# Laporan kerja uji asap MCP ${stamp}`,
      "",
      `mission: ${mission}`,
      `docKey: ${docKey}`,
      ...(basis !== null ? [basis] : []),
      "Status: complete",
      "Verdict: PASS",
      `Owner: ${agentId}`,
      "Initiator: gsp-master01",
      "TaskRef: MCP-01",
      "ReportedAt: 2026-11-01T10:00+07:00",
      "",
      "## Ringkasan",
      "",
      bab1,
      "",
      "## Rincian kerja",
      "",
      "| key | judul | status | owner | bukti |",
      "|---|---|---|---|---|",
      `| MCP-01-A | Bangun server MCP Studio | done | ${agentId} | scripts/studio/mcp/server.ts |`,
      `| MCP-01-B | Uji stdio nyata | running | ${agentId} | |`,
      "",
      "## Bukti",
      "",
      "Uji unit tests/unit/studio/mcp lulus; uji asap stdio ini berjalan ke server DEV.",
      "",
      "## Isu terbuka",
      "",
      "Tidak ada.",
      "",
      "## Langkah berikut",
      "",
      "Uji coba Hermes lewat MCP.",
      "",
    ].join("\n");

  const md1 = report(`Server MCP Studio dibangun dan diuji lewat stdio. Kata kunci ${word}.`, null);
  const chk = await call("studio_report_check", { markdown: md1 });
  steps.push({ step: "studio_report_check", ok: !chk.isError && chk.data.valid === true, note: `valid=${String(chk.data.valid)} bagian ${(chk.data.parts ?? []).join(", ")}${chk.isError ? ` galat ${chk.data.error?.code}` : ""}`, correlationId: chk.cid });

  const sub = await call("studio_report_submit", { markdown: md1 });
  const documentId: string | null = sub.data.documentId ?? null;
  const subCids: string[] = sub.cids;
  steps.push({
    step: "studio_report_submit",
    ok: !sub.isError && documentId !== null && sub.data.render?.verified === true,
    note: sub.isError ? `galat ${sub.data.error?.code}: ${sub.data.error?.message}` : `dokumen ${documentId} ${sub.data.docNumber} rev${sub.data.revisionNo} ${sub.data.completeness?.status}; render ${sub.data.render?.finalFileName} verified=${sub.data.render?.verified}; ${sub.data.nextBasis}`,
    correlationId: sub.isError ? sub.cid : (subCids[subCids.length - 1] ?? null),
  });
  if (documentId === null) return finish(steps, outputs, serverStderr, secret, argv, client, t0);

  const md2 = report(`Server MCP Studio dibangun dan diuji lewat stdio; ringkasan diperbarui lewat studio_report_update. Kata kunci ${word}.`, sub.data.nextBasis);
  const upd = await call("studio_report_update", { documentId, markdown: md2 });
  const updCids: string[] = upd.cids;
  steps.push({
    step: "studio_report_update",
    ok: !upd.isError && JSON.stringify(upd.data.delta?.sent) === JSON.stringify(["bab 1"]),
    note: upd.isError ? `galat ${upd.data.error?.code}: ${upd.data.error?.message}` : `terkirim ${upd.data.delta?.sent?.join(", ")}; tidak berubah ${upd.data.delta?.unchanged?.length}; rev${upd.data.revisionNo}; ${upd.data.nextBasis}`,
    correlationId: upd.isError ? upd.cid : (updCids[0] ?? null),
  });

  const md3 = report(`Server MCP Studio dibangun dan diuji lewat stdio; ringkasan diperbarui lewat studio_report_update. Kata kunci ${word}.`, upd.data.nextBasis ?? sub.data.nextBasis);
  const ref = await call("studio_report_refresh", { documentId, markdown: md3 });
  steps.push({ step: "studio_report_refresh", ok: !ref.isError && ref.data.conflicts?.length === 0 && ref.data.written === null, note: ref.isError ? `galat ${ref.data.error?.code}` : `basis rev${ref.data.basis?.from} -> rev${ref.data.basis?.to}; konflik ${ref.data.conflicts?.length}; ditulis ${String(ref.data.written)}` });

  // C2: tanpa baris basis -> basis yang diingat sesi (dari refresh barusan), dicatat di hasil.
  const mem = await call("studio_report_update", { documentId, markdown: report(`Server MCP Studio dibangun dan diuji lewat stdio; update via basis sesi. Kata kunci ${word}.`, null) });
  steps.push({
    step: "update tanpa basis (basis sesi)",
    ok: !mem.isError && typeof mem.data.basisFromSession?.line === "string" && mem.data.correlationIds?.length > 0,
    note: mem.isError ? `galat ${mem.data.error?.code}: ${mem.data.error?.message}` : `basis sesi ${mem.data.basisFromSession?.line} (dari ${mem.data.basisFromSession?.from}); terkirim ${mem.data.delta?.sent?.join(", ")}; ${mem.data.correlationIds.length} cid`,
    correlationId: mem.cid,
  });
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  if (roots !== "") {
    const out = path.join(roots.split(path.delimiter)[0], `smoke-${stamp}.md`);
    const w1 = await call("studio_report_refresh", { documentId, markdown: report("refresh ke berkas", mem.data.nextBasis ?? null), outPath: out });
    const w2 = await call("studio_report_refresh", { documentId, markdown: report("refresh ke berkas", mem.data.nextBasis ?? null), outPath: out });
    const exists = fs.existsSync(out);
    steps.push({ step: "refresh outPath baru lalu OUT_EXISTS", ok: !w1.isError && w1.data.written === out && exists && w2.isError && w2.data.error?.code === "OUT_EXISTS", note: `tulis pertama ${String(w1.data.written ?? w1.data.error?.code)}; kedua ${String(w2.data.error?.code ?? "TERTULIS")}` });
  }
  const nob = await call("studio_report_update", { documentId: "cmvvtidakada00000000000000", markdown: report("tanpa basis", null) });
  steps.push({ step: "galat update tanpa basis (dokumen tanpa ingatan sesi)", ok: nob.isError && nob.data.error?.code === "BASIS_MISSING", note: `${nob.data.error?.code} (correlationSource ${nob.data.error?.correlationSource})`, correlationId: nob.cid });

  const q = await call("studio_contracts_query", { mission, docKey });
  steps.push({ step: "studio_contracts_query", ok: !q.isError && (q.data.contracts ?? []).some((c: any) => c.documentId === documentId), note: `${(q.data.contracts ?? []).length} laporan; status ${(q.data.contracts ?? [])[0]?.status}`, correlationId: q.cid });

  const s = await call("studio_search", { q: word, mission });
  steps.push({
    step: "studio_search",
    ok: !s.isError && (s.data.hits ?? []).some((h: any) => h.documentId === documentId) && s.data.untrusted === true && s.text.includes("<data-tak-tepercaya sumber=\"studio\""),
    note: `${(s.data.hits ?? []).length} hasil; untrusted=${String(s.data.untrusted)}; penanda ${s.text.includes("<data-tak-tepercaya") ? "ada" : "TIDAK ADA"}`,
    correlationId: s.cid,
  });

  const g = await call("studio_document_get", { documentId, slot: "record" });
  steps.push({ step: "studio_document_get", ok: !g.isError && g.data.revisionNo !== undefined, note: `revisi ${g.data.revisionNo}; status record ${g.data.content?.status ?? "-"}`, correlationId: g.cid });

  const rnd = await call("studio_render", { documentId });
  const fileId: string | null = rnd.data.outputs?.[0]?.id ?? null;
  steps.push({ step: "studio_render", ok: !rnd.isError && fileId !== null, note: rnd.isError ? `galat ${rnd.data.error?.code}` : `${rnd.data.outputs?.length} berkas; ${rnd.data.outputs?.[0]?.format} ${rnd.data.outputs?.[0]?.finalFileName}`, correlationId: rnd.cid });

  if (fileId !== null) {
    const v = await call("studio_file_verify", { fileId });
    steps.push({ step: "studio_file_verify", ok: !v.isError && v.data.verified === true && v.data.finalNameValid === true && v.data.savedTo === null, note: v.isError ? `galat ${v.data.error?.code}` : `verified=${v.data.verified} nama ${v.data.finalFileName} C51=${v.data.finalNameValid} savedTo=${String(v.data.savedTo)}`, correlationId: v.cid });
  }

  const draft = await call("studio_report_template", { mission, docKey: `${docKey}-json`, format: "json" });
  const dc = await call("studio_draft_check", { markdown: String(draft.data.template) });
  steps.push({ step: "studio_draft_check", ok: !dc.isError && dc.data.valid === false, note: `templat ber-placeholder: valid=${String(dc.data.valid)} (diharapkan false), isu ${(dc.data.issues ?? []).length}` });

  return finish(steps, outputs, serverStderr, secret, argv, client, t0);
}

async function finish(steps: Step[], outputs: string[], serverStderr: string[], secret: string, argv: string[], client: Client, t0: number): Promise<number> {
  await client.close();
  const haystack = [...outputs, ...serverStderr].join("\n");
  const leaked = haystack.includes(secret);
  steps.push({ step: "pindai rahasia", ok: !leaked, note: `${outputs.length} hasil alat + ${serverStderr.join("").split("\n").filter(Boolean).length} baris stderr server; rahasia ${leaked ? "DITEMUKAN" : "tidak ditemukan"}` });
  const ok = steps.every((s) => s.ok);
  if (argv.includes("--json")) process.stdout.write(`${JSON.stringify({ ok, wallSeconds: (Date.now() - t0) / 1000, steps }, null, 2)}\n`);
  else {
    for (const s of steps) process.stdout.write(`${s.ok ? "LULUS" : "GAGAL"} ${s.step}: ${s.note}${s.correlationId ? ` [cid ${s.correlationId}]` : ""}\n`);
    process.stdout.write(`${ok ? "SEMUA LULUS" : "ADA YANG GAGAL"} (${((Date.now() - t0) / 1000).toFixed(1)} s)\n`);
  }
  return ok ? 0 : 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    process.stderr.write(`smoke: galat tak terduga: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);

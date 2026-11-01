/**
 * Uji asap stdio NYATA dua penulis (MCP-06): BASE_CONFLICT dan refresh lewat server MCP Studio.
 *
 *   penulis A (proses MCP 1, agentId A) submit laporan -> penulis B (proses MCP 2, agentId B) update bab 3
 *   -> A update bab 3 dengan basis lama: BASE_CONFLICT tanpa kiriman (revisi dokumen tidak berubah)
 *   -> A studio_report_refresh (tanpa menulis berkas) -> gabung (bab 3 bertanda konflik, diselesaikan A
 *   dengan mempertahankan kedua isi) -> A update dengan basis baru -> tulisan B tetap (dibaca ulang dari server).
 *
 *   INTERNAL_API_SECRET=... npx tsx <repo>/scripts/studio/mcp/smoke-conflict.ts [--base-url http://127.0.0.1:9021] \
 *     [--mission 2026-11-01_mcp06] [--agent-id cod-mcp-06] [--agent-id-b cod-mcp-06-b] [--json]
 *
 * Menulis satu dokumen nyata di server Studio (docKey ber-cap waktu). Rahasia tidak pernah dicetak
 * (dipindai di semua keluaran dan stderr kedua server). Kode keluar: 0 lulus, 1 gagal, 2 galat lingkungan.
 */
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

function argOf(argv: string[], name: string, def: string): string {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
}

interface Step {
  step: string;
  ok: boolean;
  note: string;
  correlationId?: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- structuredContent bebas bentuk */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const secret = process.env.INTERNAL_API_SECRET ?? "";
  if (secret === "") {
    process.stderr.write("smoke-conflict: env INTERNAL_API_SECRET belum diisi\n");
    return 2;
  }
  const baseUrl = argOf(argv, "--base-url", process.env.STUDIO_BASE_URL ?? "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-01_mcp06");
  const agentA = argOf(argv, "--agent-id", "cod-mcp-06");
  const agentB = argOf(argv, "--agent-id-b", `${agentA}-b`);
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const docKey = `lapkerja-mcp06-${stamp}`;
  const steps: Step[] = [];
  const outputs: string[] = [];
  const stderrAll: string[] = [];

  const open = async (agentId: string) => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
      env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, INTERNAL_API_SECRET: secret, STUDIO_AGENT_ID: agentId },
      stderr: "pipe",
    });
    transport.stderr?.on("data", (d: Buffer) => stderrAll.push(d.toString("utf8")));
    const client = new Client({ name: `smoke-conflict-${agentId}`, version: "1.0.0" });
    await client.connect(transport);
    const call = async (name: string, args: Record<string, unknown>) => {
      const r: any = await client.callTool({ name, arguments: args });
      outputs.push(JSON.stringify(r));
      const data = r.structuredContent ?? {};
      const cids: string[] = Array.isArray(data.correlationIds) ? data.correlationIds : [];
      return { isError: r.isError === true, data, text: String(r.content?.[0]?.text ?? ""), cids, cid: data.error?.correlationId ?? cids[cids.length - 1] ?? null };
    };
    return { client, call };
  };

  const A = await open(agentA);
  const B = await open(agentB);

  const report = (o: { basis: string | null; bab1: string; bab3: string }) =>
    [
      `# Laporan kerja uji dua penulis MCP ${stamp}`,
      "",
      `mission: ${mission}`,
      `docKey: ${docKey}`,
      ...(o.basis !== null ? [`${o.basis}`] : []),
      "Status: complete",
      "Verdict: PASS",
      `Owner: ${agentA}`,
      "Initiator: gsp-master01",
      "TaskRef: MCP-06",
      "ReportedAt: 2026-11-01T12:00+07:00",
      "",
      "## Ringkasan",
      "",
      o.bab1,
      "",
      "## Rincian kerja",
      "",
      "| key | judul | status | owner | bukti |",
      "|---|---|---|---|---|",
      `| MCP-06-A | Uji dua penulis lewat MCP | running | ${agentA} | scripts/studio/mcp/smoke-conflict.ts |`,
      "",
      "## Bukti",
      "",
      o.bab3,
      "",
      "## Isu terbuka",
      "",
      "Tidak ada.",
      "",
      "## Langkah berikut",
      "",
      "Verifikasi akhir MCP.",
      "",
    ].join("\n");

  const word = `dwipenulis${stamp}`;
  const sub = await A.call("studio_report_submit", { markdown: report({ basis: null, bab1: `Penulis A mengirim laporan awal ${word}.`, bab3: "Bukti awal dari penulis A." }) });
  const documentId: string | null = sub.data.documentId ?? null;
  const revA1: number | null = sub.data.revisionNo ?? null;
  steps.push({ step: "A submit", ok: !sub.isError && documentId !== null, note: sub.isError ? `galat ${sub.data.error?.code}: ${sub.data.error?.message}` : `dokumen ${documentId} rev${revA1}; ${sub.data.nextBasis}`, correlationId: sub.cid });
  if (documentId === null || sub.data.nextBasis == null) return finish(steps, outputs, stderrAll, secret, argv, [A.client, B.client]);
  const basisA1: string = sub.data.nextBasis;

  const textB = `Bukti tambahan dari penulis B ${word}.`;
  const upB = await B.call("studio_report_update", {
    documentId,
    markdown: report({ basis: basisA1, bab1: `Penulis A mengirim laporan awal ${word}.`, bab3: textB }),
    agentId: agentB,
    sections: ["3"],
  });
  const revB: number | null = upB.data.revisionNo ?? null;
  steps.push({ step: "B update bab 3", ok: !upB.isError && JSON.stringify(upB.data.delta?.sent) === JSON.stringify(["bab 3"]), note: upB.isError ? `galat ${upB.data.error?.code}: ${upB.data.error?.message}` : `terkirim ${upB.data.delta?.sent?.join(", ")}; rev${revB}; ${upB.data.nextBasis}`, correlationId: upB.cid });

  const textA = "Bukti tambahan dari penulis A (basis lama).";
  const mdA = report({ basis: basisA1, bab1: `Penulis A memperbarui ringkasan ${word}.`, bab3: textA });
  const conflict = await A.call("studio_report_update", { documentId, markdown: mdA });
  const getRev = async (): Promise<number | null> => (await A.call("studio_document_get", { documentId, view: "summary" })).data.document?.currentRevisionNo ?? null;
  const revAfterConflict = await getRev();
  steps.push({
    step: "A update bab 3 basis lama -> BASE_CONFLICT",
    ok: conflict.isError && conflict.data.error?.code === "BASE_CONFLICT" && JSON.stringify(conflict.data.error?.details?.conflicts) === JSON.stringify(["bab 3"]) && revAfterConflict === revB,
    note: `${conflict.data.error?.code}; konflik ${JSON.stringify(conflict.data.error?.details?.conflicts)}; revisi dokumen ${String(revAfterConflict)} (rev B ${String(revB)}: tidak ada kiriman A); teks petunjuk MCP ${/(?<![-\w])--[a-z]/.test(conflict.text.replace(/<data-tak-tepercaya[\s\S]*?<\/data-tak-tepercaya>/g, "")) ? "MASIH MEMUAT --opsi" : "tanpa --opsi"}`,
    correlationId: conflict.cid,
  });

  const ref = await A.call("studio_report_refresh", { documentId, markdown: mdA });
  const merged: string = typeof ref.data.markdown === "string" ? ref.data.markdown : "";
  steps.push({
    step: "A refresh (tanpa menulis berkas)",
    ok: !ref.isError && ref.data.written === null && JSON.stringify(ref.data.conflicts) === JSON.stringify(["bab 3"]) && merged.includes("<<<<<<<") && merged.includes(textB),
    note: ref.isError ? `galat ${ref.data.error?.code}: ${ref.data.error?.message}` : `basis rev${ref.data.basis?.from} -> rev${ref.data.basis?.to}; konflik ${JSON.stringify(ref.data.conflicts)}; ditulis ${String(ref.data.written)}`,
    correlationId: ref.cid,
  });

  // A menyelesaikan penanda konflik: mempertahankan kedua isi (A lalu B), menghapus tiga baris penanda.
  const resolved = merged
    .split("\n")
    .filter((l) => !/^(<<<<<<<|=======|>>>>>>>)/.test(l))
    .join("\n");
  const upA = await A.call("studio_report_update", { documentId, markdown: resolved });
  const revA2: number | null = upA.data.revisionNo ?? null;
  steps.push({
    step: "A update dengan basis baru (hasil refresh)",
    ok: !upA.isError && revA2 !== null && revB !== null && revA2 > revB,
    note: upA.isError ? `galat ${upA.data.error?.code}: ${upA.data.error?.message}` : `terkirim ${upA.data.delta?.sent?.join(", ")}; rev${revA2}; basis ${upA.data.basis?.source ?? "-"}`,
    correlationId: upA.cid,
  });

  const g = await A.call("studio_document_get", { documentId, chapter: "3", slot: "content" });
  const body = JSON.stringify(g.data.content ?? g.data);
  steps.push({
    step: "tulisan B tetap di server",
    ok: !g.isError && body.includes(textB) && body.includes(textA),
    note: `rev${String(g.data.revisionNo)}; bab 3 memuat tulisan B: ${String(body.includes(textB))}; tulisan A: ${String(body.includes(textA))}`,
    correlationId: g.cid,
  });

  return finish(steps, outputs, stderrAll, secret, argv, [A.client, B.client]);
}

async function finish(steps: Step[], outputs: string[], stderrAll: string[], secret: string, argv: string[], clients: Client[]): Promise<number> {
  for (const c of clients) await c.close();
  const leaked = [...outputs, ...stderrAll].join("\n").includes(secret);
  steps.push({ step: "pindai rahasia", ok: !leaked, note: `${outputs.length} hasil alat + ${stderrAll.join("").split("\n").filter(Boolean).length} baris stderr; rahasia ${leaked ? "DITEMUKAN" : "tidak ditemukan"}` });
  const ok = steps.every((s) => s.ok);
  if (argv.includes("--json")) process.stdout.write(`${JSON.stringify({ ok, steps }, null, 2)}\n`);
  else {
    for (const s of steps) process.stdout.write(`${s.ok ? "LULUS" : "GAGAL"} ${s.step}: ${s.note}${s.correlationId ? ` [cid ${s.correlationId}]` : ""}\n`);
    process.stdout.write(`${ok ? "SEMUA LULUS" : "ADA YANG GAGAL"}\n`);
  }
  return ok ? 0 : 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    process.stderr.write(`smoke-conflict: galat tak terduga: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);

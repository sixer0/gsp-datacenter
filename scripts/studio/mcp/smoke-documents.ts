/**
 * Uji asap stdio NYATA alat dokumen klien MCP Studio (MCP-D1, D-475): menjalankan `server.ts` sebagai proses
 * anak (klien SDK resmi, `STUDIO_MCP_TOOLSETS=documents`), lalu alur penuh ke server Studio:
 * templates_list -> template_get -> document_create (dua kali: idempoten) -> chapter_import_markdown (periksa,
 * lalu kirim bab 1 dan bab 2 Markdown) -> slot_fill (dry-run, controlSheet, signature, cover) -> document_status
 * (COMPLETE) -> document_structure get -> render docx+html -> file_verify + unduh ke STUDIO_MCP_FILE_ROOTS ->
 * render pdf (boleh 503 PDF_ENGINE_UNAVAILABLE dengan pesan jelas). Memeriksa berkas unduhan (sha256, docx = zip,
 * html memuat teks bab), bahwa semua tulis berkas server ada di dalam akar, dan rahasia tidak pernah keluar.
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder kosong> npx tsx <repo>/scripts/studio/mcp/smoke-documents.ts \
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-02_mcp_d1] [--agent-id cod-mcp-d1] [--template datum-gsp]
 *
 * Menulis dokumen nyata di Studio (satu dokumen klien baru per jalan, docKey ber-cap waktu). Kode keluar: 0 semua
 * langkah lulus, 1 ada langkah gagal, 2 galat pemakaian/lingkungan.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface Step {
  step: string;
  ok: boolean;
  note: string;
  cid?: string | null;
}

function argOf(argv: string[], name: string, def: string): string {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
}

const BAB1 = [
  "# Pendahuluan",
  "",
  "## Tentang Dokumen Ini",
  "",
  "<!-- role: identity -->",
  "Kajian ini disusun tim GSP untuk manajer aset GI Cikupa; jangkar terukurnya indeks kesiapan Gardu C 64 persen.",
  "",
  "## Lingkup",
  "",
  "[TERUKUR] [SUMBER: Rekap pemeliharaan Q3 2026] Kajian mencakup tiga gardu dan dua puluh empat peralatan utama.",
  "",
  "- Gardu A, B, dan C.",
  "- Periode Juli sampai September 2026.",
].join("\n");

const BAB2 = [
  "# Kinerja Pemeliharaan",
  "",
  "Bab ini merangkum capaian pemeliharaan triwulan III 2026.",
  "",
  "## Capaian terhadap Sasaran",
  "",
  "[TERUKUR] [SUMBER: Rekap pemeliharaan Q3 2026] Gardu C mencapai indeks kesiapan 64 persen, di bawah sasaran 70 persen.",
  "",
  "Tabel 2.1. Indeks kesiapan per gardu.",
  "",
  "| Gardu | Indeks (%) |",
  "|---|---|",
  "| A | 78 |",
  "| C | 64 |",
  "",
  "Sumber: Rekap pemeliharaan Q3 2026 [TERUKUR]",
  "",
  "## Tindak Lanjut",
  "",
  "<!-- role: closingAction -->",
  "Manajer aset GI Cikupa menyetujui jadwal pembersihan terminal PMT-2 paling lambat 2026-11-15.",
].join("\n");

/* eslint-disable @typescript-eslint/no-explicit-any -- structuredContent bebas bentuk */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const secret = process.env.INTERNAL_API_SECRET ?? "";
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  if (secret === "" || roots === "") {
    process.stderr.write("smoke-documents: env INTERNAL_API_SECRET dan STUDIO_MCP_FILE_ROOTS wajib diisi\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", process.env.STUDIO_BASE_URL ?? "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-02_mcp_d1");
  const agentId = argOf(argv, "--agent-id", "cod-mcp-d1");
  const template = argOf(argv, "--template", "datum-gsp");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const docKey = `klien-mcp-d1-${stamp}`;
  const serverStderr: string[] = [];
  const outputs: string[] = [];
  const steps: Step[] = [];
  const t0 = Date.now();

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, INTERNAL_API_SECRET: secret, STUDIO_AGENT_ID: agentId, STUDIO_MCP_FILE_ROOTS: roots, STUDIO_MCP_TOOLSETS: "documents" },
    stderr: "pipe",
  });
  transport.stderr?.on("data", (d: Buffer) => serverStderr.push(d.toString("utf8")));
  const client = new Client({ name: "studio-mcp-smoke-documents", version: "1.0.0" });
  await client.connect(transport);
  const info = client.getServerVersion();
  steps.push({ step: "initialize", ok: info?.name === "gsp-studio", note: `server ${info?.name} ${info?.version} (stdio)` });
  const tools = await client.listTools();
  const listBytes = Buffer.byteLength(JSON.stringify(tools));
  steps.push({ step: "tools/list", ok: tools.tools.length === 13 && !tools.tools.some((t) => t.name.startsWith("studio_report_")), note: `${tools.tools.length} alat (toolset documents), ${listBytes} B` });
  const prompt = await client.getPrompt({ name: "studio_dokumen_klien", arguments: { mission, docKey, template } });
  steps.push({ step: "prompt studio_dokumen_klien", ok: String((prompt.messages[0].content as any).text).includes("studio_slot_fill"), note: "resep dokumen klien" });

  const call = async (name: string, args: Record<string, unknown>) => {
    const r: any = await client.callTool({ name, arguments: args });
    const raw = JSON.stringify(r);
    outputs.push(raw);
    const data = r.structuredContent ?? {};
    const cids: string[] = Array.isArray(data.correlationIds) ? data.correlationIds : [];
    return { isError: r.isError === true, data, text: String(r.content?.[0]?.text ?? ""), cid: data.error?.correlationId ?? cids[cids.length - 1] ?? null, bytes: Buffer.byteLength(raw) };
  };
  const push = (step: string, ok: boolean, note: string, r: { cid: string | null; bytes?: number; isError?: boolean; data?: any }) =>
    steps.push({ step, ok, note: `${note}${r.bytes !== undefined ? ` [${r.bytes} B]` : ""}${r.isError ? ` galat ${r.data?.error?.code}: ${String(r.data?.error?.message ?? "").slice(0, 200)}` : ""}`, cid: r.cid });

  const tl = await call("studio_templates_list", {});
  const tpl = Array.isArray(tl.data.templates) ? tl.data.templates.find((t: any) => t.slug === template) : null;
  push("studio_templates_list", !tl.isError && !!tpl, `${tl.data.templates?.length ?? 0} templat; ${template} v${tpl?.version} tier ${tpl?.tier}`, tl);

  const tg = await call("studio_template_get", { slug: template });
  push("studio_template_get", !tg.isError && Array.isArray(tg.data.requiredInput), `wajib: ${(tg.data.requiredInput ?? []).join(", ")}`, tg);

  const createArgs = { template, mission, docKey, title: "Kajian Kesiapan Gardu Induk Cikupa (uji MCP-D1)", meta: { classification: "Terbatas" } };
  const c1 = await call("studio_document_create", createArgs);
  const documentId: string | null = c1.data.documentId ?? null;
  push("studio_document_create", !c1.isError && c1.data.created === true && documentId !== null, `dokumen ${documentId} ${c1.data.docNumber} rev ${c1.data.revisionNo}`, c1);
  const c2 = await call("studio_document_create", createArgs);
  push("studio_document_create (ulang)", !c2.isError && c2.data.unchanged === true && c2.data.documentId === documentId, `idempoten: unchanged=${c2.data.unchanged}, documentId sama=${c2.data.documentId === documentId}`, c2);
  if (documentId === null) return finish();

  const chk = await call("studio_chapter_import_markdown", { documentId, chapterKey: "1", markdown: BAB1 });
  push("import bab 1 (periksa)", !chk.isError && chk.data.importSummary?.valid === true && chk.data.submitted === false, `sah=${chk.data.importSummary?.valid}, ${chk.data.importSummary?.warningCount} peringatan, ${chk.data.importSummary?.droppedCount} dibuang`, chk);
  const i1 = await call("studio_chapter_import_markdown", { documentId, chapterKey: "1", markdown: BAB1, submit: true });
  push("import bab 1 (kirim R12)", !i1.isError && i1.data.submitted === true, `rev ${i1.data.revisionNo} ${i1.data.changeScope}`, i1);
  const i2 = await call("studio_chapter_import_markdown", { documentId, chapterKey: "2", markdown: BAB2, submit: true, baseRevisionNo: i1.data.revisionNo });
  push("import bab 2 (kirim R12)", !i2.isError && i2.data.submitted === true, `rev ${i2.data.revisionNo} ${i2.data.changeScope}; ${i2.data.importSummary?.warningCount} peringatan, ${i2.data.importSummary?.droppedCount} dibuang`, i2);

  const controlSheet = {
    type: "controlSheet",
    revisionHistory: [{ rev: "A", date: "2026-11-02", what: "Terbit pertama", by: "Tim Kajian GSP" }],
    verificationChain: [
      { layer: "1", role: "Penyusun", name: "A. Pratama" },
      { layer: "2", role: "Pemeriksa", name: "B. Santoso" },
    ],
    methodStatement: { text: "Rekap data pemeliharaan triwulan III 2026; metode rinci di Bab 2." },
    distribution: [{ copy: "1", holder: "Manajer Aset GI Cikupa" }],
  };
  const dry = await call("studio_slot_fill", { documentId, slot: "controlSheet", payload: controlSheet, dryRun: true });
  push("slot controlSheet (dry-run R08)", !dry.isError && dry.data.dryRun === true && dry.data.valid === true, `sah=${dry.data.valid}, isu ${dry.data.issueCount}`, dry);
  const s1 = await call("studio_slot_fill", { documentId, slot: "controlSheet", payload: controlSheet });
  push("slot controlSheet", !s1.isError && s1.data.slot?.address === "F:controlSheet", `rev ${s1.data.revisionNo}`, s1);
  const s2 = await call("studio_slot_fill", {
    documentId,
    slot: "signature",
    payload: { type: "signatureBlock", roles: [{ role: { text: "Disusun" }, holder: { text: "A. Pratama" }, date: { text: "2026-11-02" } }, { role: { text: "Diperiksa" }, holder: { text: "B. Santoso" } }] },
  });
  push("slot signature", !s2.isError, `rev ${s2.data.revisionNo}`, s2);
  const s3 = await call("studio_slot_fill", {
    documentId,
    slot: "cover",
    payload: { type: "cover", standfirst: { text: "Kesiapan peralatan GI Cikupa triwulan III 2026." }, colophon: { left: { text: "Tim Kajian GSP" }, right: { text: "Terbitan A, 2026-11-02" } }, identityString: { text: "Kajian untuk manajer aset GI Cikupa; jangkar: indeks kesiapan Gardu C 64 persen." } },
  });
  push("slot cover (opsional)", !s3.isError, `rev ${s3.data.revisionNo}`, s3);

  const st = await call("studio_document_status", { documentId });
  const complete = st.data.completeness?.status === "COMPLETE";
  push("studio_document_status", !st.isError && complete, `kelengkapan ${st.data.completeness?.status}, slot ${(st.data.completeness?.slots ?? []).join(" ")}`, st);
  const sg = await call("studio_document_structure", { documentId, op: "get" });
  push("studio_document_structure get", !sg.isError && Array.isArray(sg.data.order), `rev ${sg.data.revisionNo}, urutan ${(sg.data.order ?? []).join(">")}`, sg);

  const rd = await call("studio_render", { documentId, formats: ["docx", "html"] });
  const outs: any[] = Array.isArray(rd.data.outputs) ? rd.data.outputs : [];
  const formats = outs.map((o) => String(o.format).toLowerCase());
  push("studio_render docx+html", !rd.isError && formats.includes("docx") && formats.includes("html") && rd.data.partial === false, `${outs.length} berkas: ${outs.map((o) => `${o.format} ${o.finalFileName}`).join(", ")}`, rd);

  for (const o of outs) {
    const fv = await call("studio_file_verify", { fileId: o.id, expectedSha256: o.sha256, downloadDir: root });
    const saved: string | null = fv.data.savedTo ?? null;
    let check = "tidak tersimpan";
    let good = false;
    if (saved !== null && fs.existsSync(saved)) {
      const buf = fs.readFileSync(saved);
      const sha = crypto.createHash("sha256").update(buf).digest("hex");
      const fmt = String(o.format).toLowerCase();
      const inner = fmt === "docx" ? buf.subarray(0, 2).toString("latin1") === "PK" : buf.toString("utf8").includes("Kinerja Pemeliharaan") && buf.toString("utf8").includes("Gardu C mencapai indeks kesiapan");
      good = sha === o.sha256 && inner && path.dirname(path.resolve(saved)).toLowerCase() === root.toLowerCase();
      check = `${path.basename(saved)} ${buf.length} B sha256 ${sha === o.sha256 ? "cocok" : "BEDA"}; ${fmt === "docx" ? "zip PK" : "memuat teks bab"} ${inner ? "ya" : "TIDAK"}`;
    }
    push(`studio_file_verify ${o.format}`, !fv.isError && fv.data.verified === true && good, check, fv);
  }

  const pdf = await call("studio_render", { documentId, formats: ["pdf"] });
  const pdfOk = pdf.isError ? pdf.data.error?.code === "PDF_ENGINE_UNAVAILABLE" && String(pdf.data.error?.message).includes("docx") : Array.isArray(pdf.data.outputs) && pdf.data.outputs.length > 0;
  push("studio_render pdf (boleh 503)", pdfOk, pdf.isError ? "503 PDF_ENGINE_UNAVAILABLE dengan saran format" : `pdf ${pdf.data.outputs?.[0]?.finalFileName}`, pdf);

  return finish();

  async function finish(): Promise<number> {
    await client.close();
    const stderrAll = serverStderr.join("");
    const leak = [...outputs, stderrAll].some((s) => s.includes(secret));
    steps.push({ step: "rahasia tidak keluar", ok: !leak, note: `dipindai ${outputs.length} hasil alat + stderr server (${stderrAll.length} karakter)` });
    // Semua tulis berkas yang dicatat server (fileWrites) harus di dalam akar.
    const writes = stderrAll
      .split("\n")
      .filter((l) => l.includes('"fileWrites"'))
      .flatMap((l) => {
        try {
          return (JSON.parse(l).fileWrites as string[]) ?? [];
        } catch {
          return [];
        }
      });
    const outside = writes.filter((w) => !path.resolve(w.replace(/^\S+ /, "")).toLowerCase().startsWith(root.toLowerCase()));
    steps.push({ step: "tulis berkas hanya di akar", ok: outside.length === 0, note: `${writes.length} tulis tercatat, ${outside.length} di luar akar; isi akar: ${fs.readdirSync(root).join(", ") || "-"}` });
    const failed = steps.filter((s) => !s.ok);
    process.stdout.write(`${JSON.stringify({ ok: failed.length === 0, baseUrl, mission, docKey, agentId, documentId: steps.length > 0 ? (c1?.data?.documentId ?? null) : null, durationMs: Date.now() - t0, steps }, null, 2)}\n`);
    return failed.length === 0 ? 0 : 1;
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    process.stderr.write(`smoke-documents: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);
